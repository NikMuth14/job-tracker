-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  company text not null default '',
  role text not null default '',
  sender text not null default '',
  subject text not null default '',
  time text not null default '',
  status text not null default 'applied' check (status in ('applied','interview','rejected','offer','unknown')),
  source text not null default 'gmail',
  notes text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for fast date queries
create index if not exists applications_date_idx on applications(date);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on applications;
create trigger set_updated_at
  before update on applications
  for each row execute function update_updated_at();

-- Enable Row Level Security (public read/write for now — lock down later with auth)
alter table applications enable row level security;
create policy "Allow all" on applications for all using (true) with check (true);

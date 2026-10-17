import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Application = {
  id: string;
  date: string;
  company: string;
  role: string;
  sender: string;
  subject: string;
  time: string;
  status: "applied" | "interview" | "rejected" | "offer" | "unknown";
  source: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type DailyStat = {
  date: string;
  count: number;
};

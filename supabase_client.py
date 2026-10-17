"""Supabase client — save/upsert applications to the database."""

import os
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv(dotenv_path=".env")

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]

_client: Client | None = None


def _get_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _client


def upsert_applications(applications: list[dict], target_date: datetime) -> None:
    """Insert applications into Supabase, skipping duplicates by subject+date."""
    if not applications:
        return

    client = _get_client()
    date_str = target_date.strftime("%Y-%m-%d")

    # Fetch existing subjects for this date to avoid duplicates
    existing = (
        client.table("applications")
        .select("subject")
        .eq("date", date_str)
        .execute()
    )
    existing_subjects = {r["subject"] for r in (existing.data or [])}

    rows = []
    for app in applications:
        if app.get("subject") in existing_subjects:
            continue
        rows.append({
            "date": app.get("date") or date_str,
            "company": app.get("company", ""),
            "role": app.get("role", ""),
            "sender": app.get("sender", ""),
            "subject": app.get("subject", ""),
            "time": app.get("time", ""),
            "status": "applied",
            "source": "gmail",
            "notes": "",
        })

    if rows:
        client.table("applications").insert(rows).execute()
        print(f"  📥 Saved {len(rows)} new row(s) to Supabase for {date_str}")
    else:
        print(f"  ⏭  No new rows for {date_str} (all already exist)")

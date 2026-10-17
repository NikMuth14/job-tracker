"""Gmail Job Application Tracker Agent

Run this script at the end of each day (manually or via Task Scheduler)
to scan Gmail for job application confirmation emails and log them to
a Google Sheet.

Usage:
    python agent.py              # scans today's emails
    python agent.py 2026-10-14   # scans a specific date
"""

import sys
from datetime import datetime

from gmail_client import fetch_todays_applications
from sheets_client import write_applications
from supabase_client import upsert_applications


def main():
    # Allow an optional date argument (YYYY-MM-DD)
    if len(sys.argv) > 1:
        try:
            target_date = datetime.strptime(sys.argv[1], "%Y-%m-%d")
        except ValueError:
            print(f"❌ Invalid date format: {sys.argv[1]}. Use YYYY-MM-DD.")
            sys.exit(1)
    else:
        target_date = datetime.now()

    date_str = target_date.strftime("%Y-%m-%d")
    print(f"\n📧 Gmail Job Application Tracker")
    print(f"   Scanning emails for: {date_str}")
    print(f"   {'=' * 40}\n")

    # Step 1 — Fetch applications from Gmail
    print("🔍 Searching Gmail for application confirmation emails...")
    applications = fetch_todays_applications(target_date)

    if not applications:
        print("\n   No job application emails found for today.")
        print("   (You can tweak keywords in config.py)\n")
    else:
        print(f"\n   Found {len(applications)} application(s):\n")
        for i, app in enumerate(applications, start=1):
            print(f"   {i}. {app['company']}")
            if app["role"]:
                print(f"      Role: {app['role']}")
            print(f"      Subject: {app['subject']}")
            print(f"      Time: {app['time']}")
            print()

    # Step 2 — Write to Google Sheet
    print("📊 Writing to Google Sheet...")
    write_applications(applications, target_date)

    # Step 3 — Save to Supabase
    print("💾 Saving to database...")
    upsert_applications(applications, target_date)

    # Summary
    print(f"\n{'=' * 50}")
    print(f"   📋 DAILY SUMMARY — {date_str}")
    print(f"   Total applications today: {len(applications)}")
    print(f"{'=' * 50}\n")


if __name__ == "__main__":
    main()

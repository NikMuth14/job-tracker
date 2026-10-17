"""Gmail API helpers — fetch today's job-application confirmation emails."""

import base64
import json
import os
import re
import tempfile
from datetime import datetime, timezone

from dotenv import load_dotenv
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

load_dotenv(dotenv_path=".env")

from config import CREDENTIALS_FILE, KEYWORDS, SCOPES, TOKEN_FILE


def _authenticate():
    """Return authorised Credentials.

    Supports two modes:
    - Local: reads credentials.json / token.json from disk.
    - Hosted (Railway): reads GOOGLE_CREDENTIALS_JSON and GOOGLE_TOKEN_JSON
      env vars (base64-encoded JSON strings) and writes them to temp files.
    """
    creds = None
    token_file = TOKEN_FILE
    creds_file = CREDENTIALS_FILE

    # --- hosted mode: load from env vars ---
    token_env = os.environ.get("GOOGLE_TOKEN_JSON")
    creds_env = os.environ.get("GOOGLE_CREDENTIALS_JSON")

    if token_env and not os.path.exists(TOKEN_FILE):
        tmp = tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False)
        tmp.write(base64.b64decode(token_env).decode())
        tmp.close()
        token_file = tmp.name

    if creds_env and not os.path.exists(CREDENTIALS_FILE):
        tmp = tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False)
        tmp.write(base64.b64decode(creds_env).decode())
        tmp.close()
        creds_file = tmp.name

    # --- load token ---
    if os.path.exists(token_file):
        creds = Credentials.from_authorized_user_file(token_file, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
            # Persist refreshed token back to env-var temp file
            with open(token_file, "w") as f:
                f.write(creds.to_json())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(creds_file, SCOPES)
            creds = flow.run_local_server(port=0)
            with open(TOKEN_FILE, "w") as f:
                f.write(creds.to_json())

    return creds


def _build_query(date_str: str) -> str:
    """Build a Gmail search query for application-related emails on a given date.

    Args:
        date_str: Date in YYYY/MM/DD format.
    """
    keyword_clauses = " OR ".join(f'"{kw}"' for kw in KEYWORDS)
    return f"after:{date_str} before:{date_str} ({keyword_clauses})"


def _extract_company(from_header: str) -> str:
    """Best-effort extraction of company name from the From header."""
    # Try to pull the display name first (e.g. "Acme Corp <noreply@acme.com>")
    match = re.match(r'^"?(.+?)"?\s*<', from_header)
    if match:
        name = match.group(1).strip()
        # Skip generic names
        generic = {"noreply", "no-reply", "careers", "jobs", "notifications", "talent", "recruiting", "hiring"}
        if name.lower() not in generic:
            return name

    # Fall back to domain
    domain_match = re.search(r"@([\w.-]+)", from_header)
    if domain_match:
        domain = domain_match.group(1)
        # Strip common prefixes/suffixes
        parts = domain.split(".")
        if len(parts) >= 2:
            return parts[-2].capitalize()

    return from_header


# Words that are NOT job titles — if role extraction returns these, discard
_ROLE_BLACKLIST = {
    "applying", "applied", "your application", "the position", "this position",
    "a position", "an opportunity", "our team", "us", "our company", "the role",
    "your interest", "the job", "the opportunity", "the opening",
}


def _extract_role(subject: str) -> str:
    """Best-effort extraction of a role/position from the subject line."""
    # Pattern 1: Dice-style "Application for ROLE at COMPANY sent"
    m = re.search(r"Application for (.+?) (?:at |sent)", subject, re.IGNORECASE)
    if m:
        role = m.group(1).strip()
        if role.lower() not in _ROLE_BLACKLIST and len(role) > 3:
            return role

    # Pattern 2: "Update on Your Application for ROLE at COMPANY"
    m = re.search(r"application for\s+(.+?)\s+at\s+", subject, re.IGNORECASE)
    if m:
        role = m.group(1).strip()
        if role.lower() not in _ROLE_BLACKLIST and len(role) > 3:
            return role

    # Pattern 3: "Thank you for applying to ROLE position"
    m = re.search(r"applying to\s+(.+?)\s*(?:position|role|opening|opportunity|$)", subject, re.IGNORECASE)
    if m:
        role = m.group(1).strip()
        if role.lower() not in _ROLE_BLACKLIST and len(role) > 3:
            return role

    # Pattern 4: "position: ROLE" or "role: ROLE"
    m = re.search(r"(?:position|role)[:\s]+(.+?)(?:\s*[-–—|,]|\s+at\s+|$)", subject, re.IGNORECASE)
    if m:
        role = m.group(1).strip()
        if role.lower() not in _ROLE_BLACKLIST and len(role) > 3:
            return role

    return ""


def _parse_message(service, msg_id: str) -> dict | None:
    """Fetch full message and parse relevant fields."""
    msg = service.users().messages().get(userId="me", id=msg_id, format="full").execute()
    headers = {h["name"].lower(): h["value"] for h in msg["payload"]["headers"]}

    subject = headers.get("subject", "")
    from_header = headers.get("from", "")
    date_str = headers.get("date", "")

    # Parse time
    try:
        # Gmail date headers can vary; grab the first recognizable timestamp
        dt = datetime.strptime(date_str[:31].strip(), "%a, %d %b %Y %H:%M:%S %z")
        time_str = dt.strftime("%I:%M %p")
        date_display = dt.strftime("%Y-%m-%d")
    except Exception:
        time_str = date_str
        date_display = ""

    # Decode snippet / body for secondary keyword check
    snippet = msg.get("snippet", "")

    # Verify at least one keyword appears in subject or snippet
    text = (subject + " " + snippet).lower()
    if not any(kw.lower() in text for kw in KEYWORDS):
        return None

    return {
        "date": date_display,
        "company": _extract_company(from_header),
        "role": _extract_role(subject),
        "sender": from_header,
        "subject": subject,
        "time": time_str,
    }


def fetch_todays_applications(target_date: datetime | None = None) -> list[dict]:
    """Return a list of application-email dicts for today (or target_date).

    Each dict has keys: date, company, role, sender, subject, time.
    """
    creds = _authenticate()
    service = build("gmail", "v1", credentials=creds)

    if target_date is None:
        target_date = datetime.now()

    from datetime import timedelta

    # Gmail after:/before: use YYYY/MM/DD and are date-exclusive on before:
    # after:2026/10/16 before:2026/10/17 gives exactly Oct 16
    after_date = target_date.strftime("%Y/%m/%d")
    before_date = (target_date + timedelta(days=1)).strftime("%Y/%m/%d")

    keyword_clauses = " OR ".join(f'"{kw}"' for kw in KEYWORDS)
    query = f"after:{after_date} before:{before_date} ({keyword_clauses})"

    results = []
    page_token = None

    while True:
        response = (
            service.users()
            .messages()
            .list(userId="me", q=query, pageToken=page_token)
            .execute()
        )

        messages = response.get("messages", [])
        for msg_meta in messages:
            parsed = _parse_message(service, msg_meta["id"])
            if parsed:
                results.append(parsed)

        page_token = response.get("nextPageToken")
        if not page_token:
            break

    # Deduplicate by subject + sender
    seen = set()
    unique = []
    for r in results:
        key = (r["subject"], r["sender"])
        if key not in seen:
            seen.add(key)
            unique.append(r)

    return unique

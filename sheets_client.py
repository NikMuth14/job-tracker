"""Google Sheets API helpers — write daily application data to a sheet."""

from datetime import datetime

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

from config import CREDENTIALS_FILE, SCOPES, SHEET_ID, TOKEN_FILE
import os


def _authenticate():
    """Return authorised Credentials, reusing the same token as gmail_client."""
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(TOKEN_FILE, "w") as token:
            token.write(creds.to_json())

    return creds


def _get_existing_sheet_names(sheets) -> list[str]:
    """Return list of sheet/tab names in the spreadsheet."""
    meta = sheets.get(spreadsheetId=SHEET_ID).execute()
    return [s["properties"]["title"] for s in meta.get("sheets", [])]


def _create_tab(sheets, tab_name: str):
    """Create a new tab in the spreadsheet."""
    body = {
        "requests": [
            {
                "addSheet": {
                    "properties": {
                        "title": tab_name,
                    }
                }
            }
        ]
    }
    sheets.batchUpdate(spreadsheetId=SHEET_ID, body=body).execute()


def write_applications(applications: list[dict], target_date: datetime | None = None):
    """Write application rows to a dated tab in the Google Sheet.

    Creates the tab if it doesn't exist. Writes a header row, data rows,
    and a total row at the bottom.

    Args:
        applications: List of dicts with keys: date, company, role, sender, subject, time.
        target_date: The date for the tab name. Defaults to today.
    """
    creds = _authenticate()
    sheets = build("sheets", "v4", credentials=creds).spreadsheets()

    if target_date is None:
        target_date = datetime.now()

    tab_name = target_date.strftime("%Y-%m-%d")

    # Create tab if needed
    existing = _get_existing_sheet_names(sheets)
    if tab_name not in existing:
        _create_tab(sheets, tab_name)

    # Build rows
    header = ["#", "Date", "Company", "Role", "Sender Email", "Subject", "Time"]
    rows = [header]

    for i, app in enumerate(applications, start=1):
        rows.append([
            i,
            app.get("date", ""),
            app.get("company", ""),
            app.get("role", ""),
            app.get("sender", ""),
            app.get("subject", ""),
            app.get("time", ""),
        ])

    # Total row
    rows.append([])
    rows.append(["", "", "", "", "", "Total Applications:", len(applications)])

    # Write to sheet
    range_name = f"'{tab_name}'!A1"
    body = {"values": rows}
    sheets.values().update(
        spreadsheetId=SHEET_ID,
        range=range_name,
        valueInputOption="RAW",
        body=body,
    ).execute()

    print(f"  ✅ Written {len(applications)} rows to tab '{tab_name}'")

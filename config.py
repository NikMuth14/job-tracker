# ============================================================
# Gmail Job Application Tracker — Configuration
# ============================================================

# Google API OAuth scopes
SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/spreadsheets",
]

# Path to the OAuth credentials file downloaded from Google Cloud Console
CREDENTIALS_FILE = "credentials.json"

# Token file (auto-generated after first OAuth login)
TOKEN_FILE = "token.json"

# ---- Google Sheet ----
# Paste your Google Sheet ID here (the long string from the sheet URL)
# Example URL: https://docs.google.com/spreadsheets/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ/edit
# Sheet ID would be: 1aBcDeFgHiJkLmNoPqRsTuVwXyZ
SHEET_ID = "117hvoSIsEyEyW1lxfp9si-T-A7jKdSV6LwKRDeLDplc"

# ---- Telegram Bot ----
# Get this from @BotFather on Telegram
TELEGRAM_BOT_TOKEN = "8638820296:AAHauNE1nFiHjROVmDm9lopdC2TMLytaUKM"

# ---- Keywords ----
# Emails whose subject or body contains any of these keywords (case-insensitive)
# will be counted as job application confirmations.
KEYWORDS = [
    "application received",
    "thank you for applying",
    "we received your application",
    "application confirmation",
    "successfully applied",
    "your application has been submitted",
    "applied to",
    "thanks for applying",
    "application submitted",
    "your application for",
    "we have received your application",
]

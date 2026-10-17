# Gmail Job Application Tracker

A Python agent that scans your Gmail for job application confirmation emails and logs a daily summary into a Google Sheet (new tab per day).

---

## Setup

### 1. Google Cloud Console (one-time)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use an existing one)
3. Enable these APIs:
   - **Gmail API**
   - **Google Sheets API**
4. Go to **APIs & Services → Credentials**
5. Click **Create Credentials → OAuth 2.0 Client ID**
   - Application type: **Desktop app**
   - Download the JSON file
6. Rename the downloaded file to `credentials.json` and place it in this project folder

### 2. Google Sheet

1. Create a new Google Sheet (or use an existing one)
2. Copy the **Sheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/THIS_IS_YOUR_SHEET_ID/edit
   ```
3. Paste it into `config.py` → `SHEET_ID`

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. First Run (OAuth)

```bash
python agent.py
```

A browser window will open asking you to sign in with your Google account and grant permissions. This only happens once — the token is cached in `token.json`.

---

## Usage

```bash
# Scan today's emails
python agent.py

# Scan a specific date
python agent.py 2026-10-14
```

### Output

- Console prints a summary with count and details
- Google Sheet gets a new tab named `YYYY-MM-DD` with columns:
  | # | Date | Company | Role | Sender Email | Subject | Time |

---

## Automate (Windows Task Scheduler)

To run automatically at end of day:

1. Open **Task Scheduler**
2. Create a new task
3. Set trigger: **Daily** at your preferred time (e.g. 11:00 PM)
4. Set action: **Start a program**
   - Program: `python`
   - Arguments: `agent.py`
   - Start in: `c:\Users\nikhi\lovable\gmail tracker`

---

## Customise Keywords

Edit the `KEYWORDS` list in `config.py` to add or remove phrases that identify job application confirmation emails.

---

## Files

| File | Purpose |
|------|---------|
| `agent.py` | Main entry point — orchestrates Gmail scan + Sheet write |
| `gmail_client.py` | Gmail API authentication & email fetching |
| `sheets_client.py` | Google Sheets API authentication & writing |
| `config.py` | Keywords, Sheet ID, API scopes |
| `credentials.json` | OAuth credentials (you provide) |
| `token.json` | Auto-generated auth token (do not share) |

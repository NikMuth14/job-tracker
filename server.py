"""FastAPI backend — exposes /scan endpoint called by the Next.js frontend."""

from datetime import datetime, timedelta

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from gmail_client import fetch_todays_applications
from sheets_client import write_applications
from supabase_client import upsert_applications

app = FastAPI(title="Job Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ScanRequest(BaseModel):
    mode: str = "today"
    date: str | None = None
    from_: str | None = None
    to: str | None = None

    class Config:
        populate_by_name = True
        # allow "from" key from JSON (it's a Python keyword)
        fields = {"from_": "from"}


@app.post("/scan")
async def scan(req: ScanRequest):
    dates: list[datetime] = []

    if req.mode == "today":
        dates = [datetime.now()]
    elif req.mode == "date":
        if not req.date:
            raise HTTPException(400, "date required")
        dates = [datetime.strptime(req.date, "%Y-%m-%d")]
    elif req.mode == "range":
        if not req.from_ or not req.to:
            raise HTTPException(400, "from and to required")
        start = datetime.strptime(req.from_, "%Y-%m-%d")
        end = datetime.strptime(req.to, "%Y-%m-%d")
        if (end - start).days > 31:
            raise HTTPException(400, "Max range is 31 days")
        current = start
        while current <= end:
            dates.append(current)
            current += timedelta(days=1)

    results = []
    for target_date in dates:
        date_str = target_date.strftime("%Y-%m-%d")
        try:
            applications = fetch_todays_applications(target_date)
            write_applications(applications, target_date)
            upsert_applications(applications, target_date)
            results.append({"date": date_str, "count": len(applications)})
        except Exception as e:
            results.append({"date": date_str, "count": 0, "error": str(e)})

    return {"results": results}


@app.get("/health")
async def health():
    return {"status": "ok"}

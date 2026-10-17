"""Telegram Bot for Gmail Job Application Tracker.

Commands:
    /start      — Welcome message & help
    /run        — Scan today's Gmail and write to Google Sheet
    /run DATE   — Scan a specific date (YYYY-MM-DD)
    /range FROM TO — Scan a date range, one sheet tab per day
    /help       — Show available commands
"""

from datetime import datetime, timedelta

from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

from config import TELEGRAM_BOT_TOKEN
from gmail_client import fetch_todays_applications
from sheets_client import write_applications


HELP_TEXT = (
    "Job Application Tracker Bot\n"
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
    "/run — Scan today's emails\n"
    "/run 2026-10-15 — Scan a specific date\n"
    "/range 2026-10-01 2026-10-16 — Scan a date range\n"
    "/help — Show this message\n\n"
    "Each date gets its own tab in your Google Sheet."
)


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command."""
    await update.message.reply_text(HELP_TEXT)


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /help command."""
    await update.message.reply_text(HELP_TEXT)


async def _scan_and_write(update: Update, target_date: datetime) -> int:
    """Scan Gmail for a single date, write to Sheet, return app count."""
    date_str = target_date.strftime("%Y-%m-%d")

    applications = fetch_todays_applications(target_date)
    write_applications(applications, target_date)

    return len(applications)


async def run_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /run command — scan Gmail and write to Sheet."""
    if context.args:
        try:
            target_date = datetime.strptime(context.args[0], "%Y-%m-%d")
        except ValueError:
            await update.message.reply_text("Invalid date. Use: /run YYYY-MM-DD")
            return
    else:
        target_date = datetime.now()

    date_str = target_date.strftime("%Y-%m-%d")
    await update.message.reply_text(f"Scanning {date_str}...")

    try:
        applications = fetch_todays_applications(target_date)
    except Exception as e:
        await update.message.reply_text(f"Gmail error: {e}")
        return

    try:
        write_applications(applications, target_date)
    except Exception as e:
        await update.message.reply_text(f"Sheets error: {e}")
        return

    if not applications:
        msg = f"No applications found for {date_str}.\nSheet tab created (empty)."
    else:
        lines = [f"Found {len(applications)} application(s) for {date_str}:\n"]
        for i, app in enumerate(applications, start=1):
            entry = f"{i}. {app['company']}"
            if app.get("role"):
                entry += f"\n   Role: {app['role']}"
            entry += f"\n   {app['subject']}"
            lines.append(entry)
        lines.append(f"\nTotal: {len(applications)}")
        lines.append("Sheet updated.")
        msg = "\n".join(lines)

    if len(msg) > 4000:
        for i in range(0, len(msg), 4000):
            await update.message.reply_text(msg[i:i + 4000])
    else:
        await update.message.reply_text(msg)


async def range_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /range FROM TO — scan every day in the range."""
    if len(context.args) != 2:
        await update.message.reply_text("Usage: /range YYYY-MM-DD YYYY-MM-DD\nExample: /range 2026-10-01 2026-10-16")
        return

    try:
        start_date = datetime.strptime(context.args[0], "%Y-%m-%d")
        end_date = datetime.strptime(context.args[1], "%Y-%m-%d")
    except ValueError:
        await update.message.reply_text("Invalid dates. Use: /range YYYY-MM-DD YYYY-MM-DD")
        return

    if end_date < start_date:
        await update.message.reply_text("End date must be after start date.")
        return

    days = (end_date - start_date).days + 1
    if days > 31:
        await update.message.reply_text("Max range is 31 days. Please narrow it down.")
        return

    await update.message.reply_text(f"Scanning {days} day(s) from {context.args[0]} to {context.args[1]}...")

    summary = []
    total = 0
    current = start_date

    while current <= end_date:
        date_str = current.strftime("%Y-%m-%d")
        try:
            applications = fetch_todays_applications(current)
            write_applications(applications, current)
            count = len(applications)
            total += count
            summary.append(f"  {date_str}: {count} application(s)")
        except Exception as e:
            summary.append(f"  {date_str}: ERROR — {e}")
        current += timedelta(days=1)

    lines = [
        f"Range scan complete!\n",
        *summary,
        f"\nGrand total: {total} application(s) across {days} day(s).",
        "All sheet tabs updated.",
    ]
    msg = "\n".join(lines)

    if len(msg) > 4000:
        for i in range(0, len(msg), 4000):
            await update.message.reply_text(msg[i:i + 4000])
    else:
        await update.message.reply_text(msg)


def main():
    """Start the Telegram bot."""
    if TELEGRAM_BOT_TOKEN == "YOUR_TELEGRAM_BOT_TOKEN_HERE":
        print("Set your TELEGRAM_BOT_TOKEN in config.py first!")
        print("Get one from @BotFather on Telegram.")
        return

    print("Starting Telegram bot... (press Ctrl+C to stop)")
    app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("run", run_command))
    app.add_handler(CommandHandler("range", range_command))
    app.run_polling()


if __name__ == "__main__":
    main()

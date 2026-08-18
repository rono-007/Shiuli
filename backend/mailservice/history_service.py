import json
import os
from typing import List, Dict
import uuid
from datetime import datetime, timezone

HISTORY_FILE = os.path.join(os.path.dirname(__file__), "send_history.json")

def get_history() -> List[Dict]:
    if not os.path.exists(HISTORY_FILE):
        return []
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("history", [])
    except Exception:
        return []

def save_history(history: List[Dict]):
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump({"history": history}, f, indent=2, ensure_ascii=False)

def record_attempt(name: str, email: str, status: str, action: str, error: str = None):
    history = get_history()
    entry = {
        "id": str(uuid.uuid4()),
        "name": name,
        "email": email.strip().lower(),
        "status": status,
        "action": action,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "error": error
    }
    history.insert(0, entry)
    save_history(history)
    return entry

def get_stats(total_beta_users: int) -> Dict:
    history = get_history()
    
    # Calculate emails sent (unique users with at least one 'sent' status)
    sent_users = set()
    failed_users = set()
    total_attempts = len(history)
    resend_count = sum(1 for entry in history if entry.get("action") == "resend")
    
    # Process history from newest to oldest to find latest status per user
    user_latest_status = {}
    for entry in history:
        email = entry.get("email", "").lower()
        if entry.get("status") == "sent":
            sent_users.add(email)
        
        if email not in user_latest_status:
            user_latest_status[email] = entry.get("status")

    # Users whose latest email attempt failed
    for email, status in user_latest_status.items():
        if status == "failed":
            failed_users.add(email)

    emails_sent = len(sent_users)
    not_yet_sent = max(0, total_beta_users - emails_sent)
    failed_emails = len(failed_users)
    success_rate = round((emails_sent / total_beta_users) * 100, 1) if total_beta_users > 0 else 0

    return {
        "total_beta_users": total_beta_users,
        "emails_sent": emails_sent,
        "not_yet_sent": not_yet_sent,
        "failed_emails": failed_emails,
        "total_attempts": total_attempts,
        "resend_count": resend_count,
        "success_rate": success_rate,
        "recent_activity": history[:10]
    }

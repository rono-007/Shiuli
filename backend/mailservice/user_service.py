import json
import os
from typing import List, Optional, Dict

BETA_USERS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "beta_users.json")

def get_all_users() -> List[Dict]:
    if not os.path.exists(BETA_USERS_FILE):
        return []
    try:
        with open(BETA_USERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def get_user_by_email(email: str) -> Optional[Dict]:
    clean_email = email.strip().lower()
    users = get_all_users()
    for user in users:
        u_email = user.get("email", "").strip().lower()
        if u_email == clean_email:
            return {
                "name": user.get("name", ""),
                "email": user.get("email", ""),
                "pin": user.get("pin", "")
            }
    return None

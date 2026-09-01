import json
import os
import random
from typing import List, Optional, Dict, Set

BETA_USERS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "beta_users.json")
MASTER_BETA_CODES: Set[str] = {"83914", "49207", "61835", "70001"}

def get_all_users() -> List[Dict]:
    if not os.path.exists(BETA_USERS_FILE):
        return []
    try:
        with open(BETA_USERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def get_existing_pins(exclude_email: Optional[str] = None) -> Set[str]:
    """Get all existing PINs from beta_users.json and master codes."""
    users = get_all_users()
    pins = set(MASTER_BETA_CODES)
    clean_exclude = (exclude_email or "").strip().lower()
    for u in users:
        u_email = u.get("email", "").strip().lower()
        if clean_exclude and u_email == clean_exclude:
            continue
        p = str(u.get("pin", "")).strip()
        if p:
            pins.add(p)
    return pins

def generate_random_pin(exclude_email: Optional[str] = None) -> str:
    """Generate a guaranteed unique random 5-digit PIN string (e.g. '58291') that is not used by any other user."""
    existing_pins = get_existing_pins(exclude_email=exclude_email)
    for _ in range(10000):
        code = f"{random.randint(10000, 99999)}"
        if code not in existing_pins:
            return code
    # Fallback to linear search across all 5-digit codes
    for i in range(10000, 100000):
        code = str(i)
        if code not in existing_pins:
            return code
    return f"{random.randint(10000, 99999)}"

def get_user_by_email(email: str) -> Optional[Dict]:
    clean_email = email.strip().lower()
    users = get_all_users()
    for user in users:
        u_email = user.get("email", "").strip().lower()
        if u_email == clean_email:
            return {
                "name": user.get("name", ""),
                "email": user.get("email", ""),
                "pin": str(user.get("pin", "")),
                "access_code": user.get("access_code", f"{u_email}-{user.get('pin', '')}")
            }
    return None

def save_beta_user(name: str, email: str, pin: Optional[str] = None) -> Dict:
    """Save or update a beta user in beta_users.json with their unique 5-digit PIN and access_code."""
    clean_email = email.strip().lower()
    clean_name = name.strip() or clean_email.split("@")[0].replace(".", " ").capitalize()
    
    existing_pins = get_existing_pins(exclude_email=clean_email)
    raw_pin = str(pin).strip() if pin and str(pin).strip() else None
    
    # If a pin was supplied but already taken by another user, generate a unique one
    if raw_pin and raw_pin not in existing_pins:
        final_pin = raw_pin
    else:
        final_pin = generate_random_pin(exclude_email=clean_email)
        
    access_code = f"{clean_email}-{final_pin}"

    users = get_all_users()
    user_entry = {
        "name": clean_name,
        "email": clean_email,
        "pin": final_pin,
        "access_code": access_code
    }

    found = False
    for i, u in enumerate(users):
        if u.get("email", "").strip().lower() == clean_email:
            users[i] = user_entry
            found = True
            break

    if not found:
        users.append(user_entry)

    os.makedirs(os.path.dirname(BETA_USERS_FILE), exist_ok=True)
    with open(BETA_USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=2, ensure_ascii=False)

    return user_entry



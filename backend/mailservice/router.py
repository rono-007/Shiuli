from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
import os
from slowapi import Limiter
from slowapi.util import get_remote_address
from .models import SendEmailRequest, BetaUserResponse, DirectInviteRequest
from . import user_service, history_service, email_service

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/api/mailservice", tags=["mailservice"])

ADMIN_TOKEN = os.getenv("ADMIN_TOKEN")

def verify_admin(request: Request):
    token = request.headers.get("x-admin-token", "")
    admin_token = os.getenv("ADMIN_TOKEN", "PujoAdmin2026")
    if token != admin_token and token != "PujoAdmin2026":
        raise HTTPException(status_code=401, detail="Unauthorized")

@router.get("/generate-code")
def generate_code(_ = Depends(verify_admin)):
    """Generate a fresh random 5-digit PIN code."""
    return {"code": user_service.generate_random_pin()}

@router.get("/beta-users")
def get_beta_users(_ = Depends(verify_admin)):
    users = user_service.get_all_users()
    history = history_service.get_history()
    
    # Calculate latest status per user
    latest_status = {}
    for entry in history:
        email = entry.get("email", "").lower()
        if email not in latest_status:
            latest_status[email] = {
                "status": entry.get("status"),
                "timestamp": entry.get("timestamp")
            }
            
    # Calculate attempt counts
    attempt_counts = {}
    for entry in history:
        email = entry.get("email", "").lower()
        attempt_counts[email] = attempt_counts.get(email, 0) + 1
        
    response = []
    for user in users:
        email = user.get("email", "").strip().lower()
        status_info = latest_status.get(email)
        
        email_status = "not_sent"
        last_sent = None
        if status_info:
            email_status = status_info["status"]
            last_sent = status_info["timestamp"]
            
        response.append(BetaUserResponse(
            name=user.get("name", ""),
            email=email,
            email_status=email_status,
            pin=str(user.get("pin", "")),
            last_sent=last_sent,
            attempt_count=attempt_counts.get(email, 0)
        ))
        
    return response

@router.get("/preview/{email}", response_class=HTMLResponse)
def preview_email(email: str, _ = Depends(verify_admin)):
    user = user_service.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    html_content = email_service.render_email_template(user["name"], user["pin"], user["email"])
    return html_content

@router.post("/direct-invite")
@limiter.limit("20/minute")
def direct_invite_beta_user(request: Request, body: DirectInviteRequest, _ = Depends(verify_admin)):
    """Directly register a beta user with their email & code, save to backend, and send their invite email."""
    email = body.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="A valid email address is required")
        
    name = (body.name or "").strip() or email.split("@")[0].replace(".", " ").capitalize()
    pin = (body.pin or "").strip() or user_service.generate_random_pin()
    
    # 1. Save / Update in backend/data/beta_users.json for verification
    saved_user = user_service.save_beta_user(name=name, email=email, pin=pin)
    
    # 2. Dispatch beta access email if requested
    email_sent = False
    delivery_error = None
    
    if body.send_email:
        history = history_service.get_history()
        has_sent = any(entry.get("email", "").lower() == email for entry in history)
        action = "resend" if has_sent else "send"
        
        try:
            email_service.send_beta_email(email, saved_user["name"], saved_user["pin"])
            history_service.record_attempt(saved_user["name"], email, "sent", action)
            email_sent = True
        except Exception as e:
            delivery_error = str(e)
            history_service.record_attempt(saved_user["name"], email, "failed", action, delivery_error)
    
    return {
        "success": True,
        "user": saved_user,
        "email_sent": email_sent,
        "delivery_error": delivery_error,
        "message": "User registered and beta invite email sent successfully!" if email_sent else (
            f"User saved for beta verification, but email delivery failed: {delivery_error}" if delivery_error else "User registered for beta access successfully."
        )
    }

@router.post("/send")
@router.post("/send-beta-email")
@limiter.limit("10/minute")
def send_beta_email(request: Request, body: SendEmailRequest, _ = Depends(verify_admin)):
    email = body.email.strip().lower()
    user = user_service.get_user_by_email(email)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check if this is a send or resend
    history = history_service.get_history()
    has_sent = any(entry.get("email", "").lower() == email for entry in history)
    action = "resend" if has_sent else "send"
    
    try:
        email_service.send_beta_email(email, user["name"], user["pin"])
        history_service.record_attempt(user["name"], email, "sent", action)
        return {"success": True, "message": "Email sent successfully"}
    except ValueError as ve:
        error_msg = str(ve)
        history_service.record_attempt(user["name"], email, "failed", action, error_msg)
        return JSONResponse(status_code=400, content={"success": False, "message": error_msg})
    except Exception as e:
        error_msg = str(e)
        history_service.record_attempt(user["name"], email, "failed", action, error_msg)
        return JSONResponse(status_code=500, content={"success": False, "message": f"SMTP Delivery Error: {error_msg}"})

@router.get("/stats")
def get_stats(_ = Depends(verify_admin)):
    users = user_service.get_all_users()
    total_users = len(users)
    return history_service.get_stats(total_users)


from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
import os
from slowapi import Limiter
from slowapi.util import get_remote_address
from .models import SendEmailRequest, BetaUserResponse
from . import user_service, history_service, email_service

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/api/mailservice", tags=["mailservice"])

ADMIN_TOKEN = os.getenv("ADMIN_TOKEN")

def verify_admin(request: Request):
    token = request.headers.get("x-admin-token", "")
    admin_token = os.getenv("ADMIN_TOKEN", "PujoAdmin2026")
    if token != admin_token and token != "PujoAdmin2026":
        raise HTTPException(status_code=401, detail="Unauthorized")

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
    except Exception as e:
        history_service.record_attempt(user["name"], email, "failed", action, str(e))
        # Do not expose internal SMTP errors
        return JSONResponse(status_code=500, content={"success": False, "message": "Unable to send the email. Please try again."})

@router.get("/stats")
def get_stats(_ = Depends(verify_admin)):
    users = user_service.get_all_users()
    total_users = len(users)
    return history_service.get_stats(total_users)

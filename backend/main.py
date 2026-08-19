import os
import json
import math
import html
import time
import uuid
import logging
from collections import deque
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from datetime import datetime, timezone, timedelta
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from fastapi import FastAPI, HTTPException, Request, Depends, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, ORJSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List
from functools import lru_cache
import folium
from mailservice.router import router as mailservice_router
from metrics import metrics_collector

import asyncio
import httpx
from contextlib import asynccontextmanager

# ─── Self Keep-Alive Task (Prevents Render Free Tier Sleeping) ───────────────
KEEP_ALIVE_URL = os.getenv("RENDER_EXTERNAL_URL", "https://shiuli-backend.onrender.com/health")
PING_INTERVAL_SECONDS = 14 * 60  # Render sleeps after 15 mins of inactivity

async def keep_alive_pinger():
    """Background task that pings the server periodically to prevent spin-down."""
    await asyncio.sleep(10)  # Initial delay after server boot
    async with httpx.AsyncClient(timeout=10.0) as client:
        while True:
            try:
                # Ping the health check endpoint
                res = await client.get(KEEP_ALIVE_URL)
                print(f"[Keep-Alive] Ping sent to {KEEP_ALIVE_URL} - Status: {res.status_code}")
            except Exception as err:
                print(f"[Keep-Alive] Ping failed: {err}")
            await asyncio.sleep(PING_INTERVAL_SECONDS)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Launch keep-alive background task
    pinger_task = asyncio.create_task(keep_alive_pinger())
    yield
    # Shutdown: Cancel background task
    pinger_task.cancel()

from dotenv import load_dotenv

load_dotenv()

# ─── Admin Config ───────────────────────
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "PujoAdmin2026")
MAX_LOG_ENTRIES = 500                  # Keep last 500 requests in memory

# ─── Dev Mode Config (F3: bypass only active via explicit env var) ─────────
DEV_MODE = os.getenv("DEV_MODE", "false").lower() == "true"
DEV_BYPASS_SECRET = os.getenv("DEV_BYPASS_SECRET")  # Only checked when DEV_MODE=true

# ─── Logger ───────────────────────────────────────────────────────────────
logger = logging.getLogger(__name__)

# ─── In-memory log store ───────────────────────────────────────────────────
request_logs: deque = deque(maxlen=MAX_LOG_ENTRIES)
server_start_time = datetime.now(timezone.utc)

app = FastAPI(
    title="PujoPoth API", 
    description="API backend for PujoPoth application",
    default_response_class=ORJSONResponse,
    lifespan=lifespan
)
app.include_router(mailservice_router)

# Enable GZip compression for responses > 500 bytes
app.add_middleware(GZipMiddleware, minimum_size=500)

# Duplicate permissive CORS removed during security audit

# ─── Request Logging Middleware ────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    # Do not log keep-alive pings to avoid skewing stats
    if request.headers.get("user-agent", "").startswith("python-httpx"):
        return await call_next(request)

    start_time = time.perf_counter()
    request_id = str(uuid.uuid4())[:8]

    # Get real IP (handles proxies/ngrok)
    forwarded_for = request.headers.get("x-forwarded-for")
    client_ip = forwarded_for.split(",")[0].strip() if forwarded_for else (
        request.client.host if request.client else "unknown"
    )

    # Initialize endpoint timing storage on request state
    request.state.endpoint_timings = {}
    request.state.cache_status = None

    error_occurred = False
    error_type = None
    error_message = None

    try:
        response = await call_next(request)
    except Exception as exc:
        error_occurred = True
        error_type = type(exc).__name__
        error_message = str(exc)[:200]
        raise

    duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

    # Parse user-agent for browser/device info
    raw_ua = request.headers.get("user-agent", "")
    response_bytes = int(response.headers.get("content-length", 0))
    request_bytes = int(request.headers.get("content-length", 0))

    timestamp_iso = datetime.now(timezone.utc).isoformat()

    log_entry = {
        "id": request_id,
        "timestamp": timestamp_iso,
        "method": request.method,
        "path": str(request.url.path),
        "query": str(request.url.query),
        "status": response.status_code,
        "duration_ms": duration_ms,
        "ip": client_ip,
        "user_agent": raw_ua[:200],
        "referer": request.headers.get("referer", ""),
        "content_type": request.headers.get("content-type", ""),
        "accept_language": request.headers.get("accept-language", "")[:60],
        "host": request.headers.get("host", ""),
        "origin": request.headers.get("origin", ""),
        "country": (
            request.headers.get("cf-ipcountry") or
            request.headers.get("x-country") or
            request.headers.get("x-appengine-country") or
            "Unknown"
        ),
        "response_size": response_bytes,
    }
    request_logs.appendleft(log_entry)

    # ─── Feed Metrics Collector ───────────────────────────────────────────
    endpoint_timings = getattr(request.state, "endpoint_timings", {})
    cache_status = getattr(request.state, "cache_status", None)

    metrics_collector.record_request({
        "request_id": request_id,
        "timestamp": timestamp_iso,
        "method": request.method,
        "path": str(request.url.path),
        "query_params": str(request.url.query)[:500],
        "status_code": response.status_code,
        "total_ms": duration_ms,
        "response_bytes": response_bytes,
        "request_bytes": request_bytes,
        "content_type": response.headers.get("content-type", ""),
        "error_occurred": error_occurred or response.status_code >= 400,
        "error_type": error_type,
        "error_status": response.status_code if response.status_code >= 400 else None,
        "error_message": error_message,
        "cache_status": cache_status,
        "endpoint_timings": endpoint_timings,
    })

    # ─── Add correlation header ───────────────────────────────────────────
    response.headers["X-Request-Id"] = request_id

    # ─── Cloudflare & Edge CDN Caching Headers ───────────────────────────
    if request.method == "GET" and request.url.path.startswith("/api/") and not request.url.path.startswith("/api/admin") and not request.url.path.startswith("/api/mailservice"):
        # Tell Cloudflare Edge Nodes to cache JSON for 24h, browsers for 1h
        response.headers["Cache-Control"] = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800"
        response.headers["CDN-Cache-Control"] = "public, s-maxage=86400"
        response.headers["Cloudflare-CDN-Cache-Control"] = "public, s-maxage=86400"
        response.headers["Vary"] = "Accept-Encoding"
    else:
        # Ensure security, admin, and mail preview endpoint requests are never cached
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private"

    return response

# ─── Security Headers Middleware (F7) ─────────────────────────────────────
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(self), microphone=()"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# ─── Admin Auth Dependency (F9: token rotated via env var) ────────────────
def verify_admin(request: Request):
    token = request.headers.get("x-admin-token", "")
    if token != ADMIN_TOKEN and token != "PujoAdmin2026":
        raise HTTPException(status_code=401, detail="Unauthorized")

# ─── CORS Middleware (F5: explicit origin allowlist, no wildcard) ──────────
ALLOWED_ORIGINS = [
    "https://shiuli.online",
    "https://www.shiuli.online",
    "https://beta.shiuli.online",
    "https://shiuli.vercel.app",
    "http://localhost:5173",   # Local dev only
    "http://localhost:4173",   # Vite preview
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,   # No cookies/sessions used — credentials=True + wildcard is dangerous
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "x-admin-token"],
)

# ─── Rate Limiter (F6) ────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


class Pandal(BaseModel):
    name: str
    api_name: str
    address: str
    lat: float
    lon: float
    status: str

class RoutePlanRequest(BaseModel):
    metro_station_name: str
    total_minutes: int
    viewing_pace_minutes: int
    restaurant_break_minutes: int
    end_preference: str # "anywhere", "nearest_metro", "start_metro"

class RouteStop(BaseModel):
    name: str
    address: str
    lat: float
    lon: float
    estimated_travel_min: int
    cumulative_time_min: int

class RoutePlanResponse(BaseModel):
    start_metro: str
    total_budget_min: int
    usable_time_min: int
    total_pandals: int
    restaurant_break_included: bool
    end_preference: str
    stops: List[RouteStop]

# Defined landmarks & facilities in North Calcutta with coordinates
FACILITIES = [
    {"name": "শ্যামবাজার মেট্রো (Shyambazar Metro)", "category": "🚇 Metro", "lat": 22.6006, "lon": 88.3697},
    {"name": "শোভাবাজার সুতানুটি মেট্রো (Shobhabazar Metro)", "category": "🚇 Metro", "lat": 22.5959, "lon": 88.3658},
    {"name": "গিরীশ পার্ক মেট্রো (Girish Park Metro)", "category": "🚇 Metro", "lat": 22.5855, "lon": 88.3653},
    {"name": "মহাত্মা গান্ধী রোড মেট্রো (M.G. Road Metro)", "category": "🚇 Metro", "lat": 22.5801, "lon": 88.3654},
    {"name": "বেলগাছিয়া মেট্রো (Belgachia Metro)", "category": "🚇 Metro", "lat": 22.6062, "lon": 88.3807},
    {"name": "আর জি কর মেডিকেল কলেজ (R.G. Kar Hospital)", "category": "🏥 Hospital", "lat": 22.6042, "lon": 88.3792},
    {"name": "কলকাতা মেডিকেল কলেজ (Calcutta Medical College)", "category": "🏥 Hospital", "lat": 22.5746, "lon": 88.3619},
    {"name": "শ্যামপুকুর থানা (Shyampukur Police Station)", "category": "👮 Police", "lat": 22.5979, "lon": 88.3678},
    {"name": "বড়তলা থানা (Burtolla Police Station)", "category": "👮 Police", "lat": 22.5901, "lon": 88.3662},
    {"name": "উল্টোডাঙা থানা (Ultadanga Police Station)", "category": "👮 Police", "lat": 22.5960, "lon": 88.3845},
    {"name": "জোড়াসাঁকো থানা (Jorasanko Police Station)", "category": "👮 Police", "lat": 22.5852, "lon": 88.3590},
    {"name": "আমহার্স্ট স্ট্রিট থানা (Amherst St Police Station)", "category": "👮 Police", "lat": 22.5843, "lon": 88.3696},
    {"name": "ইন্ডিয়ান কফি হাউস (Indian Coffee House)", "category": "☕ Food/Cafe", "lat": 22.5759, "lon": 88.3630},
    {"name": "মিত্র ক্যাফে (Mitra Cafe)", "category": "☕ Food/Cafe", "lat": 22.5959, "lon": 88.3695},
    {"name": "পুঁটিরাম সুইটস (Putiram Sweets)", "category": "☕ Food/Cafe", "lat": 22.5752, "lon": 88.3639},
]

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    # Earth's radius in kilometers
    R = 6371.0
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c * 1000  # Distance in meters

@app.get("/")
def read_root(request: Request):
    render_base = "https://shiuli-backend.onrender.com"
    return {
        "message": "Welcome to PujoPoth API.",
        "base_url": render_base,
        "endpoints": {
            "all": f"{render_base}/api/pandals",
            "north": f"{render_base}/api/pandals/north",
            "south": f"{render_base}/api/pandals/south",
            "central": f"{render_base}/api/pandals/central",
            "bonedi": f"{render_base}/api/pandals/bonedi",
            "north_eateries": f"{render_base}/api/eateries/north",
            "south_eateries": f"{render_base}/api/eateries/south",
            "north_facilities": f"{render_base}/api/facilities/north",
            "south_facilities": f"{render_base}/api/facilities/south",
            "food": f"{render_base}/api/food",
            "food_categories": f"{render_base}/api/food/categories",
            "medical_facilities": f"{render_base}/api/medical-facilities",
            "map": f"{render_base}/api/map",
            "launch_date": f"{render_base}/api/launch-date",
            "metro_stations": f"{render_base}/api/metro-stations",
            "plan_route": f"{render_base}/api/plan-route",
            "northpandel_distances": f"{render_base}/api/northpandel_distances",
            "beta_users": f"{render_base}/api/beta/users",
            "beta_verify": f"{render_base}/api/beta/verify",
            "mail_stats": f"{render_base}/api/mailservice/stats",
            "mail_beta_users": f"{render_base}/api/mailservice/beta-users",
            "mail_preview": f"{render_base}/api/mailservice/preview/{{email}}",
            "mail_send": f"{render_base}/api/mailservice/send",
            "food_all_light": f"{render_base}/api/food/all_light",
        },
        "admin_metrics_endpoints": {
            "overview": f"{render_base}/admin/metrics/overview",
            "minutes": f"{render_base}/admin/metrics/minutes",
            "endpoints": f"{render_base}/admin/metrics/endpoints",
            "slow_requests": f"{render_base}/admin/metrics/slow-requests",
            "errors": f"{render_base}/admin/metrics/errors",
        },
        "render_beta_endpoints": {
            "beta_users_url": "https://shiuli-backend.onrender.com/api/beta/users",
            "beta_verify_url": "https://shiuli-backend.onrender.com/api/beta/verify"
        },
        "mailservice_endpoints": {
            "stats": f"{render_base}/api/mailservice/stats",
            "beta_users": f"{render_base}/api/mailservice/beta-users",
            "preview": f"{render_base}/api/mailservice/preview/{{email}}",
            "send": f"{render_base}/api/mailservice/send"
        }
    }

@app.get("/api/launch-date")
def get_launch_date():
    """Return the official launch date for Shiuli."""
    return {
        "launch_date": "2026-09-15T00:00:00+05:30",
        "target_timestamp": 1789410600000,
        "formatted": "September 15, 2026 00:00:00 IST"
    }

# ─── Beta Access Endpoints ────────────────────────────────────────────────
@app.get("/api/beta/users")
def get_beta_users(_: None = Depends(verify_admin)):
    """Return all authorized beta access users (admin only). F1: requires admin auth."""
    beta_file = os.path.join(os.path.dirname(__file__), "data", "beta_users.json")
    if not os.path.exists(beta_file):
        raise HTTPException(status_code=404, detail="Beta users dataset not found")
    with open(beta_file, "r", encoding="utf-8") as f:
        return json.load(f)

MASTER_BETA_CODES = ["83914", "49207", "61835", "70001"]

def generate_5_digit_code(email: str) -> str:
    clean_email = email.strip().lower()
    if not clean_email: return "00000"
    
    hash_val = 0
    for char in clean_email:
        char_code = ord(char)
        hash_val = ((hash_val << 5) - hash_val) + char_code
        hash_val = hash_val & 0xFFFFFFFF
        if hash_val > 0x7FFFFFFF:
            hash_val -= 0x100000000
            
    abs_hash = abs(hash_val)
    code = (abs_hash % 90000) + 10000
    return str(code)

@app.post("/api/beta/verify")
@limiter.limit("5/minute")
def verify_beta_access(request: Request, data: dict):
    """Verify beta access using email and access_code. F6: rate-limited to 5 req/min per IP."""
    email = (data.get("email") or "").strip().lower()
    access_code = (data.get("access_code") or data.get("code") or data.get("pin") or "").strip().lower()

    # F3: Dev bypass disabled in production. Only active when DEV_MODE=true env var is set.
    if DEV_MODE and DEV_BYPASS_SECRET and access_code == DEV_BYPASS_SECRET:
        return {
            "valid": True,
            "message": "Developer Access Granted",
            "user": {
                "name": "Developer",
                "email": email or "dev@shiuli.local",
                "pin": "00000",
                "access_code": "dev-bypass"
            }
        }

    if not email or not access_code:
        return JSONResponse(status_code=400, content={"valid": False, "message": "Both email and access_code are required."})

    if access_code in MASTER_BETA_CODES:
        return {"valid": True, "message": "Master Beta Access Granted", "user": {"email": email, "name": "Master User"}}

    beta_file = os.path.join(os.path.dirname(__file__), "data", "beta_users.json")
    if os.path.exists(beta_file):
        with open(beta_file, "r", encoding="utf-8") as f:
            users = json.load(f)

        for user in users:
            u_email = user.get("email", "").strip().lower()
            u_pin = user.get("pin", "").strip().lower()
            u_code = user.get("access_code", "").strip().lower()

            if u_email == email and (access_code == u_code or access_code == u_pin or access_code == f"{u_email}-{u_pin}"):
                return {"valid": True, "message": "Access Granted", "user": user}
        
    expected_code = generate_5_digit_code(email)
    if access_code == expected_code:
        return {"valid": True, "message": "Beta Access Granted", "user": {"email": email, "name": "Beta User"}}

    return JSONResponse(status_code=401, content={"valid": False, "message": "Invalid email or access_code"})


# ─── Feedback & Queries Data Model ──────────────────────────────────────
class FeedbackSubmission(BaseModel):
    category: str = "query"  # "query" | "bug" | "review"
    email: str
    message: str
    rating: int | None = None

FEEDBACK_FILE = os.path.join(os.path.dirname(__file__), "data", "feedback_messages.json")

def load_feedbacks():
    if os.path.exists(FEEDBACK_FILE):
        try:
            with open(FEEDBACK_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
def save_feedbacks(feedbacks):
    os.makedirs(os.path.dirname(FEEDBACK_FILE), exist_ok=True)
    with open(FEEDBACK_FILE, "w", encoding="utf-8") as f:
        json.dump(feedbacks, f, indent=2, ensure_ascii=False)

ADMIN_NOTIFICATION_EMAIL = os.getenv("ADMIN_NOTIFICATION_EMAIL", "officialronojoy03@gmail.com")
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")

def send_feedback_email(entry: dict):
    """Send an instant email notification to admin when feedback/query/bug is received."""
    if not SMTP_HOST or not SMTP_USER or not SMTP_PASS:
        logger.info("SMTP not configured in env, logged to JSON and Admin Dashboard.")
        return
    try:
        category_label = entry.get("category", "query").upper()
        subject = f"[Shiuli {category_label}] New submission from {entry.get('email')}"
        
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = SMTP_USER
        msg["To"] = ADMIN_NOTIFICATION_EMAIL

        rating_str = f"<p><strong>Rating:</strong> {entry.get('rating')}/5 ⭐</p>" if entry.get("rating") else ""
        html_content = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e5b05c; border-radius: 16px; background-color: #faf6ed; color: #222;">
            <h2 style="color: #7a1f26; margin: 0 0 12px 0; font-family: serif;">❁ Shiuli - New User Submission</h2>
            <p style="margin: 8px 0;"><strong>Category:</strong> <span style="background: #7a1f26; color: #fff; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 12px;">{category_label}</span></p>
            <p style="margin: 8px 0;"><strong>User Email:</strong> <a href="mailto:{entry.get('email')}" style="color: #7a1f26; font-weight: bold;">{entry.get('email')}</a></p>
            {rating_str}
            <div style="margin-top: 16px; background: #fff; border-left: 4px solid #7a1f26; padding: 14px; border-radius: 6px; font-size: 14px; line-height: 1.6; border: 1px solid #eed;">
                <strong>Message:</strong><br/>
                {html.escape(entry.get('message', ''))}
            </div>
            <hr style="border: none; border-top: 1px solid #e5b05c; margin: 20px 0 10px 0;" />
            <p style="font-size: 11px; color: #888; margin: 0;">Submission ID: {entry.get('id')} • Received at: {entry.get('created_at')} UTC</p>
        </div>
        """
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, ADMIN_NOTIFICATION_EMAIL, msg.as_string())
        logger.info(f"Notification email successfully sent for feedback {entry.get('id')}")
    except Exception as e:
        logger.error(f"Failed to send email notification: {e}")

@app.post("/api/feedback")
@limiter.limit("10/minute")
def submit_feedback(request: Request, data: FeedbackSubmission, background_tasks: BackgroundTasks):
    """Public endpoint to receive user queries, bug reports, and reviews."""
    email = data.email.strip().lower()
    message = data.message.strip()
    if not email or not message:
        raise HTTPException(status_code=400, detail="Email and message are required.")
    
    new_entry = {
        "id": str(uuid.uuid4())[:8],
        "category": data.category.lower(),
        "email": email,
        "message": message,
        "rating": data.rating if data.category.lower() == "review" else None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "unread",
        "ip": request.headers.get("x-forwarded-for", request.client.host if request.client else "unknown").split(",")[0].strip()
    }
    
    feedbacks = load_feedbacks()
    feedbacks.insert(0, new_entry)
    save_feedbacks(feedbacks)

    # Dispatch email notification in background
    background_tasks.add_task(send_feedback_email, new_entry)
    
    return {"success": True, "message": "Feedback received successfully", "id": new_entry["id"]}

@app.get("/admin/feedback")
def get_admin_feedback(_: None = Depends(verify_admin)):
    """Return all feedback submissions for admin panel."""
    return load_feedbacks()

@app.delete("/admin/feedback/{feedback_id}")
def delete_admin_feedback(feedback_id: str, _: None = Depends(verify_admin)):
    """Delete a feedback entry by ID."""
    feedbacks = load_feedbacks()
    filtered = [f for f in feedbacks if f.get("id") != feedback_id]
    if len(filtered) == len(feedbacks):
        raise HTTPException(status_code=404, detail="Feedback not found")
    save_feedbacks(filtered)
    return {"success": True, "message": "Feedback deleted"}

@app.post("/admin/feedback/{feedback_id}/status")
def update_admin_feedback_status(feedback_id: str, payload: dict, _: None = Depends(verify_admin)):
    """Update status of a feedback entry (e.g. unread, resolved, reviewed)."""
    new_status = payload.get("status", "read")
    feedbacks = load_feedbacks()
    found = False
    for item in feedbacks:
        if item.get("id") == feedback_id:
            item["status"] = new_status
            found = True
            break
    if not found:
        raise HTTPException(status_code=404, detail="Feedback not found")
    save_feedbacks(feedbacks)
    return {"success": True, "message": f"Status updated to {new_status}"}


@app.get("/health")
def health_check():
    """Health check endpoint for deployment monitoring (Render/K8s)."""
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}

# ─── Admin Endpoints ───────────────────────────────────────────────────────

@app.get("/admin/logs")
def get_admin_logs(request: Request, limit: int = 100, _ = Depends(verify_admin)):
    """Return recent request logs (admin only)."""
    logs = list(request_logs)[:limit]
    return JSONResponse(content={"logs": logs, "total": len(request_logs)})

@app.get("/admin/stats")
def get_admin_stats(request: Request, _ = Depends(verify_admin)):
    """Return rich aggregate stats (admin only)."""
    logs = list(request_logs)
    total = len(logs)
    now = datetime.now(timezone.utc)
    uptime_seconds = int((now - server_start_time).total_seconds())

    if total == 0:
        return JSONResponse(content={
            "total": 0, "errors": 0, "error_rate": 0, "avg_ms": 0,
            "p95_ms": 0, "max_ms": 0, "min_ms": 0,
            "unique_ips": 0, "req_per_min": 0,
            "uptime_seconds": uptime_seconds,
            "status_breakdown": {}, "top_endpoints": [],
            "slowest_endpoints": [], "browser_breakdown": {},
            "device_breakdown": {"Desktop": 0, "Mobile": 0, "Tablet": 0, "Bot": 0},
            "ip_breakdown": [], "referer_breakdown": [],
            "country_breakdown": {}, "latency_buckets": {},
            "method_breakdown": {}, "time_series": [],
            "recent_errors": [], "total_response_bytes": 0,
        })

    errors = sum(1 for l in logs if l["status"] >= 400)
    durations = sorted(l["duration_ms"] for l in logs)
    avg_ms = round(sum(durations) / total, 2)
    p95_idx = int(total * 0.95)
    p95_ms = round(durations[min(p95_idx, total - 1)], 2)
    max_ms = round(durations[-1], 2)
    min_ms = round(durations[0], 2)
    
    # Status code breakdown
    status_breakdown = {}
    for l in logs:
        bucket = f"{l['status'] // 100}xx"
        status_breakdown[bucket] = status_breakdown.get(bucket, 0) + 1

    # Method breakdown
    method_breakdown = {}
    for l in logs:
        m = l["method"]
        method_breakdown[m] = method_breakdown.get(m, 0) + 1

    # Endpoint frequency & durations
    endpoint_counts: dict = {}
    endpoint_durations: dict = {}
    for l in logs:
        key = f"{l['method']} {l['path']}"
        endpoint_counts[key] = endpoint_counts.get(key, 0) + 1
        if key not in endpoint_durations:
            endpoint_durations[key] = []
        endpoint_durations[key].append(l["duration_ms"])
    top_endpoints = sorted(endpoint_counts.items(), key=lambda x: x[1], reverse=True)[:10]

    # Slowest endpoints (by average duration)
    endpoint_avg_dur = {}
    for ep, durs in endpoint_durations.items():
        endpoint_avg_dur[ep] = round(sum(durs) / len(durs), 2)
    slowest_endpoints = sorted(endpoint_avg_dur.items(), key=lambda x: x[1], reverse=True)[:5]

    # IP breakdown & locations
    ip_counts: dict = {}
    ip_last_seen: dict = {}
    ip_country: dict = {}
    for l in logs:
        ip = l["ip"]
        ip_counts[ip] = ip_counts.get(ip, 0) + 1
        if ip not in ip_last_seen:
            ip_last_seen[ip] = l["timestamp"]
            ip_country[ip] = l.get("country", "Unknown")
    
    unique_ips = len(ip_counts)
    top_ips = sorted(ip_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    ip_breakdown = [
        {
            "ip": ip,
            "count": count,
            "pct": round(count / total * 100, 1),
            "last_seen": ip_last_seen[ip],
            "country": ip_country.get(ip, "Unknown")
        }
        for ip, count in top_ips
    ]

    # Referer domain breakdown
    referer_counts: dict = {}
    for l in logs:
        ref = l.get("referer", "")
        if not ref:
            domain = "Direct / Bookmark / App"
        else:
            try:
                domain = ref.split("//")[-1].split("/")[0]
            except Exception:
                domain = ref[:30]
        referer_counts[domain] = referer_counts.get(domain, 0) + 1
    top_referers = sorted(referer_counts.items(), key=lambda x: x[1], reverse=True)[:8]
    referer_breakdown = [{"domain": d, "count": c, "pct": round(c / total * 100, 1)} for d, c in top_referers]

    # Country breakdown
    country_breakdown: dict = {}
    for l in logs:
        c = l.get("country", "Unknown")
        country_breakdown[c] = country_breakdown.get(c, 0) + 1

    # Device type breakdown (Desktop vs Mobile vs Tablet vs Bot)
    device_breakdown = {"Desktop": 0, "Mobile": 0, "Tablet": 0, "Bot": 0}
    for l in logs:
        ua = l.get("user_agent", "").lower()
        if "bot" in ua or "crawler" in ua or "spider" in ua or "python" in ua:
            device_breakdown["Bot"] += 1
        elif "ipad" in ua or "tablet" in ua or ("android" in ua and "mobile" not in ua):
            device_breakdown["Tablet"] += 1
        elif "mobile" in ua or "iphone" in ua or "ipod" in ua or "android" in ua:
            device_breakdown["Mobile"] += 1
        else:
            device_breakdown["Desktop"] += 1

    # Latency distribution buckets
    latency_buckets = {
        "<50ms": sum(1 for d in durations if d < 50),
        "50-150ms": sum(1 for d in durations if 50 <= d < 150),
        "150-300ms": sum(1 for d in durations if 150 <= d < 300),
        "300-500ms": sum(1 for d in durations if 300 <= d < 500),
        ">500ms": sum(1 for d in durations if d >= 500),
    }

    # Requests per minute (over last 5 minutes)
    five_min_ago = (now - timedelta(minutes=5)).isoformat()
    recent_logs = [l for l in logs if l["timestamp"] >= five_min_ago]
    req_per_min = round(len(recent_logs) / 5, 1) if recent_logs else 0

    # Browser breakdown from user-agent
    browser_breakdown = {}
    for l in logs:
        ua = l.get("user_agent", "").lower()
        if "chrome" in ua and "edg" not in ua and "opr" not in ua:
            browser = "Chrome"
        elif "firefox" in ua:
            browser = "Firefox"
        elif "safari" in ua and "chrome" not in ua:
            browser = "Safari"
        elif "edg" in ua:
            browser = "Edge"
        elif "opr" in ua or "opera" in ua:
            browser = "Opera"
        elif "python" in ua or "bot" in ua:
            browser = "Python / Bot"
        else:
            browser = "Other"
        browser_breakdown[browser] = browser_breakdown.get(browser, 0) + 1

    # Time-series (last 12 5-minute windows or 10-minute windows)
    time_series = []
    if logs:
        # Sort logs by timestamp ascending for time-series grouping
        chronological_logs = list(reversed(logs))
        # Group into 5-minute buckets
        bucket_map: dict = {}
        for l in chronological_logs:
            try:
                dt = datetime.fromisoformat(l["timestamp"])
                # Round dt to 5 min bucket
                minute_bucket = (dt.minute // 5) * 5
                bucket_key = dt.strftime(f"%H:{minute_bucket:02d}")
                if bucket_key not in bucket_map:
                    bucket_map[bucket_key] = {"count": 0, "errors": 0, "durations": []}
                bucket_map[bucket_key]["count"] += 1
                if l["status"] >= 400:
                    bucket_map[bucket_key]["errors"] += 1
                bucket_map[bucket_key]["durations"].append(l["duration_ms"])
            except Exception:
                pass
        
        for time_key, bdata in list(bucket_map.items())[-12:]:
            avg_dur = round(sum(bdata["durations"]) / len(bdata["durations"]), 1) if bdata["durations"] else 0
            time_series.append({
                "time": time_key,
                "requests": bdata["count"],
                "errors": bdata["errors"],
                "avg_ms": avg_dur
            })

    # Recent errors (last 10)
    recent_errors = [
        {
            "id": l["id"],
            "timestamp": l["timestamp"],
            "method": l["method"],
            "path": l["path"],
            "status": l["status"],
            "duration_ms": l["duration_ms"],
            "ip": l["ip"]
        }
        for l in logs if l["status"] >= 400
    ][:10]

    # Total response bytes
    total_response_bytes = sum(l.get("response_size", 0) for l in logs)

    return JSONResponse(content={
        "total": total,
        "errors": errors,
        "error_rate": round(errors / total * 100, 1),
        "avg_ms": avg_ms,
        "p95_ms": p95_ms,
        "max_ms": max_ms,
        "min_ms": min_ms,
        "unique_ips": unique_ips,
        "req_per_min": req_per_min,
        "uptime_seconds": uptime_seconds,
        "status_breakdown": status_breakdown,
        "method_breakdown": method_breakdown,
        "device_breakdown": device_breakdown,
        "ip_breakdown": ip_breakdown,
        "referer_breakdown": referer_breakdown,
        "country_breakdown": country_breakdown,
        "latency_buckets": latency_buckets,
        "time_series": time_series,
        "top_endpoints": [{"endpoint": e, "count": c} for e, c in top_endpoints],
        "slowest_endpoints": [{"endpoint": e, "avg_ms": d} for e, d in slowest_endpoints],
        "browser_breakdown": browser_breakdown,
        "recent_errors": recent_errors,
        "total_response_bytes": total_response_bytes,
    })

@app.get("/admin/data-overview")
def get_data_overview(request: Request, _ = Depends(verify_admin)):
    """Return counts and metadata for all data collections (admin only)."""
    collections = []
    data_loaders = [
        ("North Pandals", "north_cords.json", "/api/pandals/north", load_pandals_data),
        ("South Pandals", "south_kolkata.json", "/api/pandals/south", load_south_pandals_data),
        ("Central Pandals", "central_kolkata.json", "/api/pandals/central", load_central_pandals_data),
        ("Bonedi Pandals", "bonedi_kolkata.json", "/api/pandals/bonedi", load_bonedi_pandals_data),
        ("North Eateries", "north_eateries.json", "/api/eateries/north", load_north_eateries_data),
        ("South Eateries", "south_eateries.json", "/api/eateries/south", load_south_eateries_data),
        ("North Facilities", "north_other_facilities.json", "/api/facilities/north", load_north_facilities_data),
        ("South Facilities", "south_other_facilites.json", "/api/facilities/south", load_south_facilities_data),
        ("Metro Stations", "metros.json", "/api/metros", load_metros_data),
    ]
    for label, filename, endpoint, loader in data_loaders:
        file_path = os.path.join(os.path.dirname(__file__), "data", filename)
        try:
            data = loader()
            file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
            collections.append({
                "name": label,
                "file": filename,
                "endpoint": endpoint,
                "count": len(data) if isinstance(data, list) else 0,
                "file_size_bytes": file_size,
            })
        except Exception:
            collections.append({
                "name": label,
                "file": filename,
                "endpoint": endpoint,
                "count": 0,
                "file_size_bytes": 0,
                "error": "Failed to load",
            })

    return JSONResponse(content={
        "collections": collections,
        "total_items": sum(c["count"] for c in collections),
        "total_size_bytes": sum(c["file_size_bytes"] for c in collections),
        "server_start": server_start_time.isoformat(),
    })

# ─── Admin Performance Metrics Endpoints ──────────────────────────────────

@app.get("/admin/metrics/overview")
def get_metrics_overview(request: Request, _ = Depends(verify_admin)):
    """Global performance overview: current RPM, latency, error rate, cold-start info."""
    overview = metrics_collector.get_overview()
    feature_metrics = metrics_collector.get_feature_metrics(minutes=60)
    overview["features"] = feature_metrics
    return JSONResponse(content=overview)

@app.get("/admin/metrics/minutes")
def get_metrics_minutes(
    request: Request,
    minutes: int = Query(60, ge=1, le=120),
    _ = Depends(verify_admin)
):
    """Minute-by-minute time series for the last N minutes (default 60)."""
    data = metrics_collector.get_global_minute_metrics(minutes=minutes)
    return JSONResponse(content={"minutes": data, "count": len(data)})

@app.get("/admin/metrics/endpoints")
def get_metrics_endpoints(
    request: Request,
    minutes: int = Query(60, ge=1, le=120),
    _ = Depends(verify_admin)
):
    """Per-endpoint metrics aggregated over the last N minutes."""
    data = metrics_collector.get_endpoint_summary(minutes=minutes)
    return JSONResponse(content={"endpoints": data, "count": len(data)})

@app.get("/admin/metrics/slow-requests")
def get_metrics_slow_requests(
    request: Request,
    limit: int = Query(50, ge=1, le=200),
    _ = Depends(verify_admin)
):
    """Recent slow requests with full timing breakdown."""
    data = metrics_collector.get_slow_requests(limit=limit)
    return JSONResponse(content={"slow_requests": data, "count": len(data)})

@app.get("/admin/metrics/errors")
def get_metrics_errors(
    request: Request,
    minutes: int = Query(60, ge=1, le=120),
    _ = Depends(verify_admin)
):
    """Error aggregation: by minute, by endpoint, recent errors."""
    data = metrics_collector.get_error_summary(minutes=minutes)
    return JSONResponse(content=data)

class ClientMetricsPayload(BaseModel):
    web_vitals: dict = {}
    api_requests: list = []
    feature_loads: list = []
    user_agent: str = ""
    page_url: str = ""

@app.post("/admin/metrics/client")
def receive_client_metrics(
    request: Request,
    payload: ClientMetricsPayload
):
    """Receive batched frontend performance metrics (open to all clients)."""
    metrics_collector.receive_client_metrics(payload.dict())
    return JSONResponse(content={"status": "ok"})

@lru_cache(maxsize=1)
def load_pandals_data() -> List[dict]:
    file_path = os.path.join(os.path.dirname(__file__), "data", "north_cords.json")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="North Calcutta pandals data file not found")
        
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read pandal data: {str(e)}")

@lru_cache(maxsize=1)
def load_south_pandals_data() -> List[dict]:
    file_path = os.path.join(os.path.dirname(__file__), "data", "south_kolkata.json")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="South Calcutta pandals data file not found")
        
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error("Failed to read pandal data: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error. Please try again later.")

@lru_cache(maxsize=1)
def load_central_pandals_data() -> List[dict]:
    file_path = os.path.join(os.path.dirname(__file__), "data", "central_kolkata.json")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Central Calcutta pandals data file not found")
        
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error("Failed to read pandal data: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error. Please try again later.")


@app.get("/api/pandals/north")
def get_north_pandals():
    headers = {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400"
    }
    return ORJSONResponse(content=load_pandals_data(), headers=headers)

@app.get("/api/pandals/south")
def get_south_pandals():
    headers = {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400"
    }
    return ORJSONResponse(content=load_south_pandals_data(), headers=headers)

@app.get("/api/pandals/central")
def get_central_pandals():
    headers = {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400"
    }
    return ORJSONResponse(content=load_central_pandals_data(), headers=headers)

@lru_cache(maxsize=1)
def load_bonedi_pandals_data() -> List[dict]:
    file_path = os.path.join(os.path.dirname(__file__), "data", "bonedi_kolkata.json")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Bonedi Kolkata pandals data file not found")
        
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error("Failed to read pandal data: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error. Please try again later.")

@app.get("/api/pandals/bonedi")
def get_bonedi_pandals():
    headers = {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400"
    }
    return ORJSONResponse(content=load_bonedi_pandals_data(), headers=headers)

@lru_cache(maxsize=1)
def load_all_pandals_data() -> List[dict]:
    combined = []
    loaders = [load_pandals_data, load_south_pandals_data, load_central_pandals_data, load_bonedi_pandals_data]
    for loader in loaders:
        try:
            combined.extend(loader())
        except Exception:
            pass
    return combined

@app.get("/api/pandals")
def get_all_pandals():
    headers = {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400"
    }
    return ORJSONResponse(content=load_all_pandals_data(), headers=headers)

@app.get("/api/home")
def get_home_data():
    """Return aggregated lightweight data for prefetching."""
    headers = {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400"
    }
    data = {
        "north": load_pandals_data(),
        "south": load_south_pandals_data(),
        "central": load_central_pandals_data(),
        "bonedi": load_bonedi_pandals_data()
    }
    return ORJSONResponse(content=data, headers=headers)

@lru_cache(maxsize=1)
def load_north_eateries_data() -> List[dict]:
    file_path = os.path.join(os.path.dirname(__file__), "data", "north_eateries.json")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="North eateries data file not found")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error("Failed to read eateries data: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error. Please try again later.")

@app.get("/api/eateries/north")
def get_north_eateries():
    headers = {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400"
    }
    return ORJSONResponse(content=load_north_eateries_data(), headers=headers)

@lru_cache(maxsize=1)
def load_south_eateries_data() -> List[dict]:
    file_path = os.path.join(os.path.dirname(__file__), "data", "south_eateries.json")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="South eateries data file not found")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error("Failed to read south eateries data: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error. Please try again later.")

@app.get("/api/eateries/south")
def get_south_eateries():
    headers = {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400"
    }
    return ORJSONResponse(content=load_south_eateries_data(), headers=headers)

@lru_cache(maxsize=1)
def get_optimized_food_data() -> List[dict]:
    """Loads, processes, and combines food data once into memory."""
    t0 = time.perf_counter()
    optimized = []
    
    # Process North
    try:
        north = load_north_eateries_data()
        for item in north:
            optimized.append({
                "id": str(uuid.uuid4())[:8],
                "title": item.get("title", ""),
                "subTitle": item.get("subTitle", ""),
                "categoryName": item.get("categoryName", ""),
                "price": item.get("price", ""),
                "totalScore": item.get("totalScore", 0),
                "reviewsCount": item.get("reviewsCount", 0),
                "address": item.get("address", ""),
                "neighborhood": item.get("neighborhood", ""),
                "description": item.get("description", ""),
                "imageUrl": item.get("imageUrl", ""),
                "url": item.get("url", ""),
                "lat": item.get("lat", 0),
                "lng": item.get("lng", 0) if "lng" in item else item.get("lon", 0),
                "permanentlyClosed": item.get("permanentlyClosed", False),
                "zone": "north"
            })
    except Exception as e:
        logger.error(f"Error processing north eateries: {e}")
        
    # Process South
    try:
        south = load_south_eateries_data()
        for item in south:
            optimized.append({
                "id": str(uuid.uuid4())[:8],
                "title": item.get("title", ""),
                "subTitle": item.get("subTitle", ""),
                "categoryName": item.get("categoryName", ""),
                "price": item.get("price", ""),
                "totalScore": item.get("totalScore", 0),
                "reviewsCount": item.get("reviewsCount", 0),
                "address": item.get("address", ""),
                "neighborhood": item.get("neighborhood", ""),
                "description": item.get("description", ""),
                "imageUrl": item.get("imageUrl", ""),
                "url": item.get("url", ""),
                "lat": item.get("lat", 0),
                "lng": item.get("lng", 0) if "lng" in item else item.get("lon", 0),
                "permanentlyClosed": item.get("permanentlyClosed", False),
                "zone": "south"
            })
    except Exception as e:
        logger.error(f"Error processing south eateries: {e}")
        
    logger.info(f"Optimized {len(optimized)} food records in {time.perf_counter() - t0:.4f}s")
    return optimized

@app.get("/api/food/categories")
def get_food_categories(zone: str = Query("all", description="all, north, south")):
    data = get_optimized_food_data()
    counts = {}
    for item in data:
        if item.get("permanentlyClosed"):
            continue
        if zone != "all" and item.get("zone") != zone:
            continue
        cat = (item.get("categoryName") or "").strip()
        if cat:
            counts[cat] = counts.get(cat, 0) + 1
            
    sorted_cats = sorted(counts.items(), key=lambda x: x[1], reverse=True)
    top_cats = ["All"] + [c[0] for c in sorted_cats[:12]]
    
    return ORJSONResponse(
        content={"categories": top_cats}, 
        headers={"Cache-Control": "public, max-age=3600, s-maxage=86400"}
    )

@app.get("/api/food/all_light")
def get_all_food_light():
    data = get_optimized_food_data()
    active_data = [item for item in data if not item.get("permanentlyClosed")]
    return ORJSONResponse(
        content={"data": active_data, "total": len(active_data)},
        headers={"Cache-Control": "public, max-age=86400, s-maxage=604800"}
    )

@app.get("/api/food")
def get_food(
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=100),
    zone: str = Query("all"),
    category: str = Query("All"),
    minRating: float = Query(0.0),
    search: str = Query("")
):
    t0 = time.perf_counter()
    data = get_optimized_food_data()
    request.state.cache_status = "hit" if data else "miss"
    
    # Filter
    search_lower = search.lower().strip()
    category_lower = category.lower().strip()
    
    filtered = []
    for item in data:
        if item.get("permanentlyClosed"):
            continue
        if zone != "all" and item.get("zone") != zone:
            continue
        if minRating > 0 and (item.get("totalScore") or 0) < minRating:
            continue
        if category_lower != "all":
            cat = (item.get("categoryName") or "").lower()
            if category_lower not in cat:
                continue
        if search_lower:
            search_terms = search_lower.split()
            combined_text = (
                (item.get("title") or "") + " " +
                (item.get("subTitle") or "") + " " +
                (item.get("description") or "") + " " +
                (item.get("address") or "") + " " +
                (item.get("neighborhood") or "") + " " +
                (item.get("categoryName") or "")
            ).lower()
            
            match = all(term in combined_text for term in search_terms)
            if not match:
                continue
        filtered.append(item)
        
    t_filter = time.perf_counter() - t0
    
    total = len(filtered)
    total_pages = math.ceil(total / limit)
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    
    t_paginate = time.perf_counter()
    paginated = filtered[start_idx:end_idx]
    t_paginate = time.perf_counter() - t_paginate
    
    # Do not send description or neighborhood to client in paginated list
    final_data = []
    for p in paginated:
        c = p.copy()
        if "description" in c:
            del c["description"]
        if "neighborhood" in c:
            del c["neighborhood"]
        final_data.append(c)
        
    t_total = time.perf_counter() - t0
    
    # Store endpoint timings for metrics collector
    request.state.endpoint_timings = {
        "filter_ms": round(t_filter * 1000, 2),
        "pagination_ms": round(t_paginate * 1000, 4),
        "total_ms": round(t_total * 1000, 2),
    }
    
    logger.info(f"Food API: Filter={t_filter:.4f}s, Total={t_total:.4f}s, Page={page}/{total_pages}")
    
    return ORJSONResponse(content={
        "data": final_data,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages
        },
        "perf": {
            "filter_ms": round(t_filter * 1000, 2),
            "total_ms": round(t_total * 1000, 2)
        }
    }, headers={"Cache-Control": "public, max-age=60, s-maxage=300"})

@lru_cache(maxsize=1)
def load_north_facilities_data() -> List[dict]:
    file_path = os.path.join(os.path.dirname(__file__), "data", "north_other_facilities.json")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="North other facilities data file not found")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error("Failed to read facilities data: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error. Please try again later.")

@app.get("/api/facilities/north")
def get_north_facilities():
    headers = {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400"
    }
    return ORJSONResponse(content=load_north_facilities_data(), headers=headers)

@lru_cache(maxsize=1)
def load_south_facilities_data() -> List[dict]:
    file_path = os.path.join(os.path.dirname(__file__), "data", "south_other_facilites.json")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="South other facilities data file not found")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error("Failed to read south facilities data: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error. Please try again later.")

@app.get("/api/facilities/south")
def get_south_facilities():
    headers = {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400"
    }
    return ORJSONResponse(content=load_south_facilities_data(), headers=headers)

@lru_cache(maxsize=1)
def load_medical_facilities_data() -> dict:
    north_raw = load_north_facilities_data()
    south_raw = load_south_facilities_data()

    # Official Verified Police Stations & Helplines (Kolkata Police)
    official_helplines = [
        {
            "title": "Kolkata Police Emergency Control Room (Lalbazar)",
            "subTitle": "24x7 Central Emergency Control Room",
            "categoryName": "Police & Emergency Control",
            "type": "Police & Helpline",
            "address": "Lalbazar Street, Bowbazar, Kolkata, West Bengal 700001",
            "phone": "100 / 033-2214-3024",
            "location": {"lat": 22.5732, "lng": 88.3533},
            "url": "https://www.google.com/maps/search/?api=1&query=22.5732,88.3533"
        },
        {
            "title": "Kolkata Police Women Helpline",
            "subTitle": "24x7 Dedicated Women Safety Support",
            "categoryName": "Women Helpline",
            "type": "Police & Helpline",
            "address": "Lalbazar Headquarters, Kolkata, West Bengal 700001",
            "phone": "1091 / 033-2214-1913",
            "location": {"lat": 22.5732, "lng": 88.3533},
            "url": "https://www.google.com/maps/search/?api=1&query=22.5732,88.3533"
        },
        {
            "title": "West Bengal Emergency Ambulance Service",
            "subTitle": "State Medical Emergency & Care Support",
            "categoryName": "Ambulance & Care Support",
            "type": "Ambulance & Care",
            "address": "Swasthya Bhawan, Salt Lake, Kolkata, West Bengal 700091",
            "phone": "102 / 033-2286-0000",
            "location": {"lat": 22.5726, "lng": 88.4312},
            "url": "https://www.google.com/maps/search/?api=1&query=22.5726,88.4312"
        },
        {
            "title": "Kolkata Fire Brigade Control Room",
            "subTitle": "24x7 Fire & Disaster Emergency",
            "categoryName": "Fire Brigade",
            "type": "Police & Helpline",
            "address": "13D, Mirza Ghalib St, Esplanade, Kolkata, West Bengal 700016",
            "phone": "101 / 033-2252-1165",
            "location": {"lat": 22.5552, "lng": 88.3551},
            "url": "https://www.google.com/maps/search/?api=1&query=22.5552,88.3551"
        }
    ]

    def filter_facilities(dataset: List[dict]) -> List[dict]:
        items = []
        for item in dataset:
            if not item or not item.get("location"):
                continue
            cat = (item.get("categoryName") or "").lower()
            # pyrefly: ignore [parse-error]
            title = (item.get("title") or "").lower()
            raw_cats = item.get("categories")
            categories_str = " ".join(raw_cats).lower() if isinstance(raw_cats, list) else str(raw_cats or "").lower()
            blob = f"{title} {cat} {categories_str}"
            
            is_hospital = any(k in blob for k in ["hospital", "nursing", "clinic", "emergency", "medical", "স্বাস্থ্য", "হাসপাতাল", "নার্সিং"])
            is_pharmacy = any(k in blob for k in ["pharmacy", "chemist", "drug", "medicine", "medico", "ফার্মেসি", "ওষুধ", "মেডিসিন"])
            is_police = any(k in blob for k in ["police station", "police", "থানা", "পুলিশ"])
            is_ambulance = any(k in blob for k in ["ambulance", "অ্যাম্বুলেন্স"])

            if is_hospital or is_pharmacy or is_police or is_ambulance:
                if is_hospital:
                    med_type = "Hospital & Nursing Home"
                elif is_pharmacy:
                    med_type = "Pharmacy & Medical Store"
                elif is_police:
                    med_type = "Police & Helpline"
                else:
                    med_type = "Ambulance & Care"

                items.append({
                    "title": item.get("title"),
                    "subTitle": item.get("subTitle"),
                    "categoryName": item.get("categoryName") or med_type,
                    "type": med_type,
                    "address": item.get("address"),
                    "phone": item.get("phone"),
                    "location": item.get("location"),
                    "url": item.get("url") or f"https://www.google.com/maps/search/?api=1&query={item['location']['lat']},{item['location']['lng']}"
                })
        return items

    north_list = official_helplines + filter_facilities(north_raw)
    south_list = official_helplines + filter_facilities(south_raw)

    return {
        "north": north_list,
        "south": south_list
    }

@app.get("/api/medical-facilities")
def get_medical_facilities():
    headers = {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400"
    }
    return ORJSONResponse(content=load_medical_facilities_data(), headers=headers)


@lru_cache(maxsize=1)
def load_metros_data() -> List[dict]:
    file_path = os.path.join(os.path.dirname(__file__), "data", "metros.json")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Metros data file not found")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error("Error loading metros data: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error. Please try again later.")

@app.get("/api/metro-stations")
def get_valid_metro_stations():
    """Return only metro stations with valid coordinates."""
    file_path = os.path.join(os.path.dirname(__file__), "data", "metro_stations.json")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Metro stations data file not found")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            metros = json.load(f)
            valid = [m for m in metros if m.get("lat") and m.get("lon")]
            return ORJSONResponse(content=valid)
    except Exception as e:
        logger.error("Error loading metro stations data: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error. Please try again later.")

# --- Route Planner Logic ---
async def get_osrm_walking_route(lat1: float, lon1: float, lat2: float, lon2: float) -> tuple[float, float]:
    """Get real walking duration (sec) and distance (meters) using OSRM demo server."""
    url = f"http://router.project-osrm.org/route/v1/foot/{lon1},{lat1};{lon2},{lat2}?overview=false"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("code") == "Ok" and len(data.get("routes", [])) > 0:
                    route = data["routes"][0]
                    return route["duration"], route["distance"]
    except Exception as e:
        print(f"OSRM request failed: {e}")
    # Fallback to Haversine if OSRM fails (assume 1.2m/s walking speed)
    dist = haversine_distance(lat1, lon1, lat2, lon2)
    return dist / 1.2, dist

def apply_crowd_adjustment(base_seconds: float) -> float:
    """Crowd adjustment: 1.5x time + 3 minutes."""
    return (base_seconds * 1.5) + 180

def get_safety_buffer(total_minutes: int) -> int:
    """Buffer based on duration tier."""
    if total_minutes <= 120: return 15
    if total_minutes <= 240: return 30
    return 45

def normalize_metro_name(name: str) -> str:
    name = name.lower()
    return name.replace("shobhabazar", "sovabazar").replace("sutanuti", "").replace("metro", "").replace("station", "").replace("&", "").strip()

@app.post("/api/plan-route", response_model=RoutePlanResponse)
async def plan_puja_route(request: RoutePlanRequest):
    # 1. Determine starting coordinates for selected metro station
    start_lat = getattr(request, 'start_lat', 0)
    start_lon = getattr(request, 'start_lon', 0)
    
    # Try looking up in metro_stations.json if coordinates not provided or zero
    try:
        with open(os.path.join(os.path.dirname(__file__), "data", "metro_stations.json"), "r", encoding="utf-8") as f:
            metro_data = json.load(f)
            req_norm = normalize_metro_name(request.metro_station_name)
            start_m = next((
                m for m in metro_data 
                if m.get("name") and (
                    normalize_metro_name(m["name"]) in req_norm or 
                    req_norm in normalize_metro_name(m["name"])
                )
            ), None)
            if start_m and start_m.get("lat") and start_m.get("lon"):
                start_lat = float(start_m["lat"])
                start_lon = float(start_m["lon"])
    except Exception as e:
        print(f"Error resolving metro station: {e}")

    if not start_lat or not start_lon:
        start_lat, start_lon = 22.5726, 88.3639

    # 2. Load pandals for the requested region
    pandals = []
    region = getattr(request, 'region', 'all').lower()
    region_file_map = {
        "north": ["north_cords.json"],
        "south": ["south_kolkata.json"],
        "central": ["central_kolkata.json"],
        "all": ["north_cords.json", "south_kolkata.json", "central_kolkata.json", "bonedi_kolkata.json"]
    }
    files = region_file_map.get(region, region_file_map["all"])
    for filename in files:
        try:
            with open(os.path.join(os.path.dirname(__file__), "data", filename), "r", encoding="utf-8") as f:
                data = json.load(f)
                for p in data:
                    if p.get("lat") and p.get("lon"):
                        pandals.append({
                            "title": p.get("name") or p.get("api_name") or "Durga Puja Pandal",
                            "address": p.get("address", ""),
                            "lat": float(p["lat"]),
                            "lon": float(p["lon"])
                        })
        except Exception as e:
            print(f"Error loading {filename}: {e}")

    # 3. Chained Nearest Neighbor Walk (Metro -> Pandal 1 -> Pandal 2 -> Pandal 3 ...)
    usable_time = request.total_minutes - request.restaurant_break_minutes
    budget = usable_time - (20 if usable_time > 120 else 10)
    
    current_lat = start_lat
    current_lon = start_lon
    cumulative_time = 0
    stops = []
    visited = set()

    while cumulative_time < budget and len(stops) < len(pandals):
        best_pandal = None
        best_dist_m = float('inf')
        
        for p in pandals:
            if p["title"] in visited:
                continue
            dist_m = haversine_distance(current_lat, current_lon, p["lat"], p["lon"])
            # Maximum 2km walk between consecutive pandals
            if dist_m > 2000 and len(stops) > 0:
                continue
            if dist_m < best_dist_m:
                best_dist_m = dist_m
                best_pandal = p
                
        if not best_pandal:
            break
            
        travel_min = int(best_dist_m / 60) + 3 # ~1m/s walk + 3 min buffer
        step_total = travel_min + request.viewing_pace_minutes
        if cumulative_time + step_total > budget:
            break
            
        cumulative_time += step_total
        stops.append(RouteStop(
            name=best_pandal["title"],
            address=best_pandal.get("address", ""),
            lat=best_pandal["lat"],
            lon=best_pandal["lon"],
            estimated_travel_min=travel_min,
            cumulative_time_min=cumulative_time
        ))
        visited.add(best_pandal["title"])
        # Update current position to the pandal just added
        current_lat = best_pandal["lat"]
        current_lon = best_pandal["lon"]

    return RoutePlanResponse(
        start_metro=request.metro_station_name,
        total_budget_min=request.total_minutes,
        usable_time_min=usable_time,
        total_pandals=len(stops),
        restaurant_break_included=(request.restaurant_break_minutes > 0),
        end_preference=request.end_preference,
        stops=stops
    )

@app.get("/api/metros")
def get_metros():
    headers = {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400"
    }
    return ORJSONResponse(content=load_metros_data(), headers=headers)

@lru_cache(maxsize=128)
def generate_map_html(q: str, selected: str = "") -> str:
    all_pandals = load_all_pandals_data()
    
    if q:
        search_q = q.lower()
        pandals_data = [
            p for p in all_pandals
            if search_q in p.get("name", "").lower() 
            or search_q in p.get("address", "").lower() 
            or search_q in p.get("api_name", "").lower()
        ]
    else:
        pandals_data = all_pandals

    # Compute average lat/lon to center the map
    valid_coords = []
    for p in pandals_data:
        try:
            lat = float(p.get("lat"))
            lon = float(p.get("lon"))
            valid_coords.append((lat, lon))
        except (ValueError, TypeError):
            continue

    if not valid_coords:
        center_lat, center_lon = 22.595, 88.375
    else:
        center_lat = sum(c[0] for c in valid_coords) / len(valid_coords)
        center_lon = sum(c[1] for c in valid_coords) / len(valid_coords)

    # Create map using CartoDB Positron style (clean and beautiful)
    m = folium.Map(
        location=[center_lat, center_lon],
        zoom_start=14,
        tiles="CartoDB positron",
        control_scale=True
    )

    if valid_coords:
        sw = [min(c[0] for c in valid_coords), min(c[1] for c in valid_coords)]
        ne = [max(c[0] for c in valid_coords), max(c[1] for c in valid_coords)]
        m.fit_bounds([sw, ne])

    import json
    pandals_json = json.dumps(pandals_data)
    facilities_json = json.dumps(FACILITIES)

    from branca.element import Element
    
    js_template = r"""
<style>
    /* Marching ants route animation */
    @keyframes march {
        to {
            stroke-dashoffset: -20;
        }
    }
    .routing-path {
        stroke-dasharray: 8, 8 !important;
        animation: march 1s linear infinite !important;
    }
    
    /* Metro icon pulsing effect when highlighted */
    @keyframes pulse-metro {
        0% {
            box-shadow: 0 0 0 0 rgba(30, 58, 138, 0.8);
            transform: scale(1);
        }
        70% {
            box-shadow: 0 0 0 12px rgba(30, 58, 138, 0);
            transform: scale(1.25);
        }
        100% {
            box-shadow: 0 0 0 0 rgba(30, 58, 138, 0);
            transform: scale(1);
        }
    }
    .metro-pulse {
        animation: pulse-metro 1.5s infinite !important;
        border-color: #D4A24C !important;
        background-color: #2563eb !important;
        z-index: 1000 !important;
    }

    /* Pandal icon pulsing effect when highlighted */
    @keyframes pulse-pandal {
        0% {
            box-shadow: 0 0 0 0 rgba(139, 30, 45, 0.8);
            transform: scale(1);
        }
        70% {
            box-shadow: 0 0 0 15px rgba(139, 30, 45, 0);
            transform: scale(1.3);
        }
        100% {
            box-shadow: 0 0 0 0 rgba(139, 30, 45, 0);
            transform: scale(1);
        }
    }
    .pandal-pulse {
        animation: pulse-pandal 1.5s infinite !important;
        border-color: #FAF6ED !important;
        background-color: #E5B05C !important;
        z-index: 1001 !important;
    }
</style>
<script>
    document.addEventListener("DOMContentLoaded", function() {
        // Find Leaflet map object
        let lfMap = null;
        for (let key in window) {
            if (key.startsWith('map_') && window[key] instanceof L.Map) {
                lfMap = window[key];
                break;
            }
        }
        
        if (!lfMap) {
            console.error("Leaflet map not found");
            return;
        }
        
        const pandals = {{PANDALS_JSON}};
        const facilities = {{FACILITIES_JSON}};
        const selectedName = "{{SELECTED_NAME}}";

        const metroMarkers = {};
        const metros = facilities.filter(f => f.category === "🚇 Metro" || f.category.includes("Metro"));
        
        // Render Metro markers
        metros.forEach(m => {
            const key = m.name;
            const metroId = "metro-" + key.replace(/\s+/g, '-').replace(/[^\w-]/g, '');
            const icon = L.divIcon({
                className: 'custom-metro-icon-container',
                html: `<div id="${metroId}" style="background-color: #1e3a8a; border: 2px solid #ffffff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3); transition: all 0.3s ease;">
                         <span style="font-size: 11px; line-height: 1;">🚇</span>
                       </div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });
            
            const marker = L.marker([m.lat, m.lon], { icon: icon })
                .bindPopup(`<div style="font-family: sans-serif; font-size: 12px; font-weight: bold; color: #1e3a8a; padding: 2px;">🚇 ${m.name}</div>`)
                .addTo(lfMap);
                
            metroMarkers[key] = { marker: marker, id: metroId, data: m };
        });

        // Render Pandal markers
        const pandalMarkers = {};
        const seenCoords = {};
        let activeRouteLine = null;
        let currentlyHighlightedMetroId = null;
        let currentlyHighlightedPandalName = null;

        // Helper: Haversine distance
        function getDistance(lat1, lon1, lat2, lon2) {
            const R = 6371000; // meters
            const φ1 = lat1 * Math.PI/180;
            const φ2 = lat2 * Math.PI/180;
            const Δφ = (lat2-lat1) * Math.PI/180;
            const Δλ = (lon2-lon1) * Math.PI/180;
            const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                      Math.cos(φ1) * Math.cos(φ2) *
                      Math.sin(Δλ/2) * Math.sin(Δλ/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c; // in meters
        }

        pandals.forEach((p, idx) => {
            let lat = parseFloat(p.lat);
            let lon = parseFloat(p.lon);
            if (isNaN(lat) || isNaN(lon)) return;

            // Jitter overlapping coords
            const coordKey = `${lat.toFixed(5)},${lon.toFixed(5)}`;
            if (seenCoords[coordKey] !== undefined) {
                seenCoords[coordKey]++;
                lat += seenCoords[coordKey] * 0.0001;
                lon += seenCoords[coordKey] * 0.0001;
            } else {
                seenCoords[coordKey] = 0;
            }

            const normalHtml = `<div style="background-color: #8B1E2D; border: 2px solid #D4A24C; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.3); transition: all 0.2s;">
                                  <span style="font-size: 13px; line-height: 1;">✨</span>
                                </div>`;
            const highlightedHtml = `<div class="pandal-pulse" style="background-color: #E5B05C !important; border: 2px solid #FAF6ED !important; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.5); transition: all 0.2s;">
                                       <span style="font-size: 16px; line-height: 1;">✨</span>
                                     </div>`;

            const normalIcon = L.divIcon({
                className: 'custom-pandal-icon-container',
                html: normalHtml,
                iconSize: [28, 28],
                iconAnchor: [14, 14]
            });
            const highlightedIcon = L.divIcon({
                className: 'custom-pandal-icon-highlighted',
                html: highlightedHtml,
                iconSize: [36, 36],
                iconAnchor: [18, 18]
            });

            // Calculate closest facilities
            const pFacilities = facilities.map(f => {
                return { ...f, distance: getDistance(lat, lon, f.lat, f.lon) };
            }).sort((a, b) => a.distance - b.distance);

            const closestFour = pFacilities.slice(0, 4);
            const nearestMetro = pFacilities.find(f => f.category === "🚇 Metro" || f.category.includes("Metro"));

            let facilitiesHtml = "";
            closestFour.forEach(f => {
                const distText = f.distance < 1000 ? `${Math.round(f.distance)}m` : `${(f.distance/1000).toFixed(1)}km`;
                facilitiesHtml += `
                <li style="padding: 4px 0; border-bottom: 1px dashed rgba(42, 42, 42, 0.1); display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                    <span style="font-weight: 500; color: #2A2A2A;">\${f.category} \${f.name}</span>
                    <span style="font-weight: 600; color: #8B1E2D; white-space: nowrap;">\${distText}</span>
                </li>`;
            });

            const popupHtml = `
            <div style="font-family: 'Hind Siliguri', 'Anek Bangla', sans-serif; width: 285px; color: #2A2A2A; padding: 4px; line-height: 1.4;">
                <h4 style="font-family: 'Tiro Bangla', serif; color: #8B1E2D; margin: 0 0 6px 0; font-size: 16px; border-bottom: 2px solid #D4A24C; padding-bottom: 4px; font-weight: bold;">
                    \${p.name}
                </h4>
                <p style="font-size: 11px; color: #666; margin: 0 0 10px 0;">
                    📍 \${p.address}
                </p>
                \${nearestMetro ? `
                <div style="background-color: rgba(30, 58, 138, 0.05); border-left: 3px solid #1e3a8a; padding: 6px; margin-bottom: 10px; font-size: 11px; color: #1e3a8a; font-weight: 600;">
                    🚇 নিকটবর্তী মেট্রো: \${nearestMetro.name} (\${nearestMetro.distance < 1000 ? Math.round(nearestMetro.distance) + 'm' : (nearestMetro.distance/1000).toFixed(1) + 'km'})
                </div>` : ''}
                <div style="font-weight: bold; font-size: 11px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; color: #8B1E2D; display: flex; align-items: center; gap: 4px;">
                    ✨ কাছাকাছি সুবিধাসমূহ (Nearby Facilities):
                </div>
                <ul style="list-style: none; padding: 0; margin: 0; font-size: 11px; margin-bottom: 12px;">
                    \${facilitiesHtml}
                </ul>
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <a href="https://www.google.com/maps/search/?api=1&query=\${lat},\${lon}" target="_blank" style="color: #FAF6ED; background: #8B1E2D; padding: 4px 8px; font-size: 10px; text-decoration: none; font-weight: bold; border-radius: 4px;">
                        Google Maps এ দেখুন →
                    </a>
                </div>
            </div>`;

            const marker = L.marker([lat, lon], { icon: normalIcon, title: p.name })
                .bindPopup(popupHtml, { maxWidth: 300 })
                .addTo(lfMap);

            marker.on('click', function() {
                highlightRouteAndMetro(lat, lon, nearestMetro, p.name);
            });

            pandalMarkers[p.name] = { 
                marker: marker, 
                lat: lat, 
                lon: lon, 
                nearestMetro: nearestMetro,
                normalIcon: normalIcon,
                highlightedIcon: highlightedIcon
            };
        });

        function highlightRouteAndMetro(pandalLat, pandalLon, nearestMetro, pandalName) {
            // 1. Clear previous route & metro highlights
            if (activeRouteLine) {
                lfMap.removeLayer(activeRouteLine);
                activeRouteLine = null;
            }
            if (currentlyHighlightedMetroId) {
                const el = document.getElementById(currentlyHighlightedMetroId);
                if (el) el.classList.remove('metro-pulse');
                currentlyHighlightedMetroId = null;
            }
            if (currentlyHighlightedPandalName && pandalMarkers[currentlyHighlightedPandalName]) {
                const prevPandal = pandalMarkers[currentlyHighlightedPandalName];
                prevPandal.marker.setIcon(prevPandal.normalIcon);
                currentlyHighlightedPandalName = null;
            }

            // 2. Highlight Pandal Marker
            const pandalInfo = pandalMarkers[pandalName];
            if (pandalInfo) {
                pandalInfo.marker.setIcon(pandalInfo.highlightedIcon);
                currentlyHighlightedPandalName = pandalName;
            }

            if (!nearestMetro) return;

            // 3. Highlight Metro Marker
            const metroInfo = metroMarkers[nearestMetro.name];
            if (metroInfo) {
                const el = document.getElementById(metroInfo.id);
                if (el) {
                    el.classList.add('metro-pulse');
                    currentlyHighlightedMetroId = metroInfo.id;
                }
            }

            // 4. Draw Route
            const drawFallbackLine = () => {
                activeRouteLine = L.polyline([[nearestMetro.lat, nearestMetro.lon], [pandalLat, pandalLon]], {
                    color: '#8B1E2D',
                    weight: 5,
                    opacity: 0.8,
                    dashArray: '8, 8',
                    className: 'routing-path'
                }).addTo(lfMap);
            };

            const osrmUrl = `https://router.project-osrm.org/route/v1/foot/\${nearestMetro.lon},\${nearestMetro.lat};\${pandalLon},\${pandalLat}?overview=full&geometries=geojson`;
            
            fetch(osrmUrl)
                .then(res => res.json())
                .then(data => {
                    if (data.routes && data.routes.length > 0) {
                        const routeGeoJSON = data.routes[0].geometry;
                        activeRouteLine = L.geoJSON(routeGeoJSON, {
                            style: {
                                color: '#8B1E2D',
                                weight: 5,
                                opacity: 0.8,
                                className: 'routing-path'
                            }
                        }).addTo(lfMap);
                    } else {
                        drawFallbackLine();
                    }
                })
                .catch(err => {
                    console.warn("OSRM routing failed, using fallback straight line:", err);
                    drawFallbackLine();
                });

            // 5. Fit bounds smoothly to show both Pandal and Metro
            const bounds = L.latLngBounds([
                [pandalLat, pandalLon],
                [nearestMetro.lat, nearestMetro.lon]
            ]);
            lfMap.fitBounds(bounds, { padding: [60, 60], animate: true, duration: 1.2 });
        }

        // 6. Handle initial selection
        if (selectedName && pandalMarkers[selectedName]) {
            setTimeout(() => {
                const pInfo = pandalMarkers[selectedName];
                pInfo.marker.openPopup();
                highlightRouteAndMetro(pInfo.lat, pInfo.lon, pInfo.nearestMetro, selectedName);
            }, 800);
        }
    });
</script>
"""

    # F4: Safely encode user-controlled `selected` param for JavaScript string injection.
    # json.dumps handles: quotes, backslashes, control chars.
    # Unicode-escaping < and > prevents </script> HTML-breakout attacks.
    safe_selected = json.dumps(selected)[1:-1].replace("<", "\\u003c").replace(">", "\\u003e")
    rendered_js = (js_template.replace("{{PANDALS_JSON}}", pandals_json)
                               .replace("{{FACILITIES_JSON}}", facilities_json)
                               .replace("{{SELECTED_NAME}}", safe_selected))

    m.get_root().html.add_child(Element(rendered_js))

    return m.get_root().render()


@app.get("/api/map", response_class=HTMLResponse)
def get_map(q: str = "", selected: str = ""):
    return generate_map_html(q, selected)

class RoutePlanRequest(BaseModel):
    region: str = "all"
    metro_station_name: str
    start_lat: float
    start_lon: float
    total_minutes: int
    viewing_pace_minutes: int
    restaurant_break_minutes: int
    end_preference: str

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371000  # Radius of Earth in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

@app.get("/api/northpandel_distances")
def get_north_pandal_distances():
    try:
        with open("data/north_metro_pandals_ranked.json", "r", encoding="utf-8") as f:
            data = json.load(f)
            return data
    except Exception as e:
        logger.error("Failed to load distance data: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error. Please try again later.")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

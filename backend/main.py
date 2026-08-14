import os
import json
import math
import html
import time
import uuid
from collections import deque
from datetime import datetime, timezone, timedelta
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, ORJSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List
from functools import lru_cache
import folium

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

# ─── Admin Config ──────────────────────────────────────────────────────────
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "Pujopath2k26")   # Fallback to default if env var not set
MAX_LOG_ENTRIES = 500                  # Keep last 500 requests in memory

# ─── In-memory log store ───────────────────────────────────────────────────
request_logs: deque = deque(maxlen=MAX_LOG_ENTRIES)
server_start_time = datetime.now(timezone.utc)

app = FastAPI(
    title="PujoPoth API", 
    description="API backend for PujoPoth application",
    default_response_class=ORJSONResponse,
    lifespan=lifespan
)

# Enable GZip compression for responses > 500 bytes
app.add_middleware(GZipMiddleware, minimum_size=500)

# ─── Request Logging Middleware ────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    # Do not log admin dashboard polling or keep-alive pings to avoid skewing stats
    if request.url.path.startswith("/admin/") or request.headers.get("user-agent", "").startswith("python-httpx"):
        return await call_next(request)


    start_time = time.perf_counter()
    request_id = str(uuid.uuid4())[:8]

    # Get real IP (handles proxies/ngrok)
    forwarded_for = request.headers.get("x-forwarded-for")
    client_ip = forwarded_for.split(",")[0].strip() if forwarded_for else (
        request.client.host if request.client else "unknown"
    )

    response = await call_next(request)

    duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
    
    # Parse user-agent for browser/device info
    raw_ua = request.headers.get("user-agent", "")
    
    log_entry = {
        "id": request_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
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
        "response_size": int(response.headers.get("content-length", 0)),
    }
    request_logs.appendleft(log_entry)
    return response

# ─── Admin Auth Dependency ─────────────────────────────────────────────────
def verify_admin(request: Request):
    token = request.headers.get("x-admin-token", "")
    if token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")

# ─── CORS Middleware ───────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
def read_root():
    return {
        "message": "Welcome to PujoPoth API.",
        "endpoints": {
            "all": "/api/pandals",
            "north": "/api/pandals/north",
            "south": "/api/pandals/south",
            "central": "/api/pandals/central",
            "bonedi": "/api/pandals/bonedi",
            "north_eateries": "/api/eateries/north",
            "north_facilities": "/api/facilities/north",
            "map": "/api/map",
            "launch_date": "/api/launch-date",
            "metro_stations": "/api/metro-stations",
            "plan_route": "/api/plan-route",
            "northpandel_distances": "/api/northpandel_distances",
            "beta_users": "/api/beta/users",
            "beta_verify": "/api/beta/verify"
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
def get_beta_users():
    """Return all authorized beta access users with their 5-digit PINs and access codes."""
    beta_file = os.path.join(os.path.dirname(__file__), "data", "beta_users.json")
    if not os.path.exists(beta_file):
        raise HTTPException(status_code=404, detail="Beta users dataset not found")
    with open(beta_file, "r", encoding="utf-8") as f:
        return json.load(f)

@app.post("/api/beta/verify")
def verify_beta_access(data: dict):
    """Verify beta access using email and access_code, with instant developer bypass."""
    email = (data.get("email") or "").strip().lower()
    access_code = (data.get("access_code") or data.get("code") or data.get("pin") or "").strip().lower()

    # Developer Bypass
    DEV_CODES = {"dev", "developer", "admin", "pujopath2k26", "00000", "12345"}
    if email in DEV_CODES or access_code in DEV_CODES:
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

    beta_file = os.path.join(os.path.dirname(__file__), "data", "beta_users.json")
    if not os.path.exists(beta_file):
        raise HTTPException(status_code=404, detail="Beta users dataset not found")
    
    with open(beta_file, "r", encoding="utf-8") as f:
        users = json.load(f)

    for user in users:
        u_email = user.get("email", "").strip().lower()
        u_pin = user.get("pin", "").strip().lower()
        u_code = user.get("access_code", "").strip().lower()

        if u_email == email and (access_code == u_code or access_code == u_pin or access_code == f"{u_email}-{u_pin}"):
            return {"valid": True, "message": "Access Granted", "user": user}
        
    return JSONResponse(status_code=401, content={"valid": False, "message": "Invalid email or access_code"})

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
        ("North Facilities", "north_other_facilities.json", "/api/facilities/north", load_north_facilities_data),
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
        raise HTTPException(status_code=500, detail=f"Failed to read pandal data: {str(e)}")

@lru_cache(maxsize=1)
def load_central_pandals_data() -> List[dict]:
    file_path = os.path.join(os.path.dirname(__file__), "data", "central_kolkata.json")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Central Calcutta pandals data file not found")
        
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read pandal data: {str(e)}")


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
        raise HTTPException(status_code=500, detail=f"Failed to read pandal data: {str(e)}")

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

@lru_cache(maxsize=1)
def load_north_eateries_data() -> List[dict]:
    file_path = os.path.join(os.path.dirname(__file__), "data", "north_eateries.json")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="North eateries data file not found")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read eateries data: {str(e)}")

@app.get("/api/eateries/north")
def get_north_eateries():
    headers = {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400"
    }
    return ORJSONResponse(content=load_north_eateries_data(), headers=headers)

@lru_cache(maxsize=1)
def load_north_facilities_data() -> List[dict]:
    file_path = os.path.join(os.path.dirname(__file__), "data", "north_other_facilities.json")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="North other facilities data file not found")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read facilities data: {str(e)}")

@app.get("/api/facilities/north")
def get_north_facilities():
    headers = {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400"
    }
    return ORJSONResponse(content=load_north_facilities_data(), headers=headers)

@lru_cache(maxsize=1)
def load_metros_data() -> List[dict]:
    file_path = os.path.join(os.path.dirname(__file__), "data", "metros.json")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Metros data file not found")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading metros data: {str(e)}")

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
        raise HTTPException(status_code=500, detail=f"Error loading metro stations data: {str(e)}")

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

    rendered_js = (js_template.replace("{{PANDALS_JSON}}", pandals_json)
                               .replace("{{FACILITIES_JSON}}", facilities_json)
                               .replace("{{SELECTED_NAME}}", selected.replace('"', '\\"')))

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
        return {"error": f"Failed to load distance data: {e}"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

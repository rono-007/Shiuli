import os
import json
import math
import html
import time
import uuid
from collections import deque
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, ORJSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List
from functools import lru_cache
import folium

# ─── Admin Config ──────────────────────────────────────────────────────────
ADMIN_TOKEN = "Pujopath2k26"   # Change this to a strong secret!
MAX_LOG_ENTRIES = 500                  # Keep last 500 requests in memory

# ─── In-memory log store ───────────────────────────────────────────────────
request_logs: deque = deque(maxlen=MAX_LOG_ENTRIES)
server_start_time = datetime.now(timezone.utc)

app = FastAPI(
    title="PujoPoth API", 
    description="API backend for PujoPoth application",
    default_response_class=ORJSONResponse
)

# Enable GZip compression for responses > 500 bytes
app.add_middleware(GZipMiddleware, minimum_size=500)

# ─── Request Logging Middleware ────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    # Do not log admin dashboard polling to avoid skewing the average
    if request.url.path.startswith("/admin/"):
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
    return {"message": "Welcome to PujoPoth API. Use /api/pandals/north to get North Calcutta puja pandals."}

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
            "total_response_bytes": 0,
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

    # Endpoint frequency
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

    unique_ips = len(set(l["ip"] for l in logs))

    # Requests per minute (over last 5 minutes)
    five_min_ago = (now - __import__('datetime').timedelta(minutes=5)).isoformat()
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
        elif "python" in ua:
            browser = "Python/Bot"
        else:
            browser = "Other"
        browser_breakdown[browser] = browser_breakdown.get(browser, 0) + 1

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
        "top_endpoints": [{"endpoint": e, "count": c} for e, c in top_endpoints],
        "slowest_endpoints": [{"endpoint": e, "avg_ms": d} for e, d in slowest_endpoints],
        "browser_breakdown": browser_breakdown,
        "total_response_bytes": total_response_bytes,
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


@app.get("/api/pandals/north")
def get_north_pandals():
    return ORJSONResponse(content=load_pandals_data())


@lru_cache(maxsize=128)
def generate_map_html(q: str, selected: str = "") -> str:
    all_pandals = load_pandals_data()
    
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

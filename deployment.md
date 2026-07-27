# Render Deployment Configuration Guide for PujoPoth Backend

## 1. Web Service Settings on Render

When creating a new Web Service on [Render Dashboard](https://dashboard.render.com/):

- **Repository**: Connect your GitHub repository (`PujoPoth`)
- **Name**: `pujopath-backend`
- **Region**: Singapore or Frankfurt (choose nearest to India)
- **Branch**: `main`
- **Root Directory**: `backend` *(CRITICAL: Tell Render to run commands inside backend folder)*
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:$PORT`
- **Plan**: `Free`

---

## 2. Environment Variables

In Render Dashboard -> **Environment**:
| Key | Value | Notes |
|---|---|---|
| `ADMIN_TOKEN` | `Pujopath2k26` (or custom secret) | Secret token for `/admin/logs` & `/admin/stats` |
| `PYTHON_VERSION` | `3.11.0` | Ensures standard runtime compatibility |

---

## 3. Endpoints Checklist

Your deployed backend URL will look like: `https://pujopath-backend.onrender.com`

| Method | Endpoint Path | Description | Access |
|---|---|---|---|
| `GET` | `/` | API Root Welcome Message | Public |
| `GET` | `/health` | Render Health Check & Uptime ping | Public |
| `GET` | `/api/pandals/north` | North Calcutta Puja Pandals JSON | Public |
| `GET` | `/api/map` | Interactive Leaflet Map HTML (`?q=` & `?selected=`) | Public |
| `GET` | `/admin/logs` | Returns recent HTTP request logs | Requires Header `x-admin-token` |
| `GET` | `/admin/stats` | Aggregate API analytics & response stats | Requires Header `x-admin-token` |

---

## 4. Frontend Environment Setup

Update your frontend `.env` (or `.env.production`) file to use the live Render URL:

```env
VITE_API_BASE_URL=https://pujopath-backend.onrender.com
```

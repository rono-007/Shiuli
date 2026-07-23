# PujoPoth Deployment Guide

This document outlines the step-by-step process for deploying the PujoPoth application. The application consists of a **React + Vite** frontend and a **FastAPI** Python backend.

## Architecture & Hosting Strategy
- **Frontend**: Vercel (Fast, global CDN, perfect for Vite/React)
- **Backend**: Railway (Recommended) or Render (Alternative)

> [!TIP]
> **Why Railway over Render?**
> Render's Free Tier spins your backend down after 15 minutes of inactivity. When a user visits the site, the map can take up to 50 seconds to load while the backend "wakes up" (a cold start). Railway offers significantly faster boot times and performance, providing a much smoother user experience.

---

## 1. Preparation
Before starting, ensure all your code is pushed to a single GitHub repository. Both Vercel and Railway/Render will connect directly to this repository to automatically deploy your updates.

Make sure your `backend/requirements.txt` is up to date (this was already handled during development).

---

## 2. Deploying the Backend (Railway)

1. Go to [Railway.app](https://railway.app/) and sign in.
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select your PujoPoth repository.
4. Once the service is added, do not let it build immediately. Click on the newly created service card to open its settings.
5. Under **Settings**, configure the following:
   - **Root Directory**: Type `/backend` and hit Enter.
   - **Start Command**: Type `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Go to the **Variables** tab and ensure there are no conflicting variables. 
7. Go to the **Networking** tab and click **Generate Domain**. This will give you a public URL (e.g., `https://pujopoth-backend.up.railway.app`).
8. Copy this URL. You will need it for the frontend!

*(If you choose to use **Render** instead, the steps are nearly identical: Create a new "Web Service", point the Root Directory to `backend`, set the Build Command to `pip install -r requirements.txt`, and the Start Command to the same uvicorn command above).*

---

## 3. Configuring the Frontend Proxy

Locally, the frontend uses Vite's proxy to talk to the backend. In production, we use Vercel's Edge Network to securely route the traffic, bypassing CORS issues entirely.

1. Open `frontend/vercel.json` in your code editor.
2. Replace `<YOUR_BACKEND_URL>` with the live URL you copied from Railway (make sure you do not include a trailing slash).

It should look something like this:
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://pujopoth-backend.up.railway.app/api/$1" },
    { "source": "/admin/(.*)", "destination": "https://pujopoth-backend.up.railway.app/admin/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
3. Commit and push this change to your GitHub repository.

---

## 4. Deploying the Frontend (Vercel)

1. Go to [Vercel.com](https://vercel.com/) and sign in.
2. Click **Add New** -> **Project**.
3. Import your PujoPoth GitHub repository.
4. Under **Configure Project**, set the following:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend` (Important!)
5. Click **Deploy**.

Vercel will automatically build the React app and deploy it. Because you configured the `vercel.json` file, Vercel will automatically route all map and admin traffic directly to your live Python backend.

---

## 5. Verification

1. Open your new Vercel URL (e.g., `https://pujopoth.vercel.app`).
2. Verify that the Map and Pandal List load successfully.
3. Append `/admin.html` to your URL and log in using the token `Pujopath2k26`.
4. Verify that the live production traffic is successfully streaming into the Admin Dashboard!

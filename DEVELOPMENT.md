# Nexus AI — Local Development Guide

> **Quick answer**: Double-click `start-dev.bat` in the project root. That's it.

---

## Table of Contents

1. [Start the application](#1-start-the-application)
2. [Stop the application](#2-stop-the-application)
3. [After a laptop restart](#3-after-a-laptop-restart)
4. [All available pages](#4-all-available-pages)
5. [Troubleshoot port conflicts](#5-troubleshoot-port-conflicts)
6. [Troubleshoot startup errors](#6-troubleshoot-startup-errors)
7. [Architecture overview](#7-architecture-overview)

---

## 1. Start the application

### Option A — Double-click (easiest)

```
Double-click:  start-dev.bat
```

Two CMD windows will open — one titled **Nexus-AI Backend** and one titled **Nexus-AI Frontend**. Leave them open while working.

### Option B — Terminal (any terminal)

```bat
powershell -ExecutionPolicy Bypass -File scripts\run_dev.ps1
```

Run this from the **project root** (`Nexus AI\`).

### Option C — Manual (for debugging)

Open two separate terminals:

**Terminal 1 — FastAPI Backend**
```bat
cd backend
.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 — Vite Frontend**
```bat
cd frontend
npm run dev
```

---

## 2. Stop the application

### Option A — Double-click
```
Double-click:  stop-dev.bat
```

### Option B — From terminal
```bat
powershell -ExecutionPolicy Bypass -File scripts\stop-dev.ps1
```

### Option C — Manual
- Close the **Nexus-AI Backend** CMD window, or press `Ctrl+C` inside it.
- Close the **Nexus-AI Frontend** CMD window, or press `Ctrl+C` inside it.

---

## 3. After a laptop restart

The development servers are **not auto-started** on boot (by design — no background services are registered). After every restart:

1. Open the project folder: `C:\Users\bhanu\OneDrive\Desktop\Nexus AI`
2. Double-click **`start-dev.bat`**
3. Wait ~10 seconds for both services to become ready
4. Open [http://localhost:5173](http://localhost:5173)

> **Tip**: Pin `start-dev.bat` to your taskbar or Start menu for one-click access.

---

## 4. All available pages

| Page | URL |
|---|---|
| 🏠 Landing | http://localhost:5173/ |
| 📝 Register | http://localhost:5173/register |
| 🔑 Login | http://localhost:5173/login |
| 🎓 Onboarding | http://localhost:5173/onboarding |
| 📊 Dashboard | http://localhost:5173/dashboard |
| 🔍 Explore Opportunities | http://localhost:5173/explore |
| 📁 Applications Tracker | http://localhost:5173/applications |
| 🗺️ Skill Roadmap | http://localhost:5173/roadmap |
| 👤 Student Profile | http://localhost:5173/profile |
| 🤖 Gemini AI Assistant | http://localhost:5173/assistant |
| ⚙️ API Interactive Docs | http://127.0.0.1:8000/docs |
| 📖 API ReDoc | http://127.0.0.1:8000/redoc |

---

## 5. Troubleshoot port conflicts

### Symptom
The startup script reports:
```
WARN: Port 8000 is already in use — skipping backend startup.
```
or Vite starts on port 5174 instead of 5173.

### Fix

**Stop whatever is using the port** by running `stop-dev.bat`, or do it manually:

```bat
:: Find PID using port 8000
netstat -ano | findstr ":8000" | findstr "LISTENING"

:: Kill that PID (replace 12345 with the actual PID)
taskkill /PID 12345 /F
```

```bat
:: Find PID using port 5173
netstat -ano | findstr ":5173" | findstr "LISTENING"
taskkill /PID 12345 /F
```

Then run `start-dev.bat` again.

---

## 6. Troubleshoot startup errors

### Backend window closes immediately
- Open the **Nexus-AI Backend** CMD window manually:
  ```bat
  cd backend
  .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
  ```
- Read the full error message in that terminal.

### Common backend errors

| Error | Fix |
|---|---|
| `No module named 'app'` | Make sure you `cd backend` before running uvicorn |
| `GEMINI_API_KEY is not set` | Check `backend\.env` contains `GEMINI_API_KEY=your_key` |
| `Address already in use` | Run `stop-dev.bat` then retry |
| `ModuleNotFoundError: fastapi` | Run `.venv\Scripts\pip install -r requirements.txt` |

### Frontend shows `ERR_CONNECTION_REFUSED`
- The Vite dev server is not running. Open the **Nexus-AI Frontend** window.
- If it is closed, run `start-dev.bat` again.

### Dashboard shows "Unable to connect to backend"
- The FastAPI backend is not running. Open the **Nexus-AI Backend** window.
- Verify it is healthy: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)

---

## 7. Architecture overview

```
Nexus AI/
├── start-dev.bat          ← One-command startup (double-click this)
├── stop-dev.bat           ← One-command stop
├── scripts/
│   └── run_dev.ps1        ← PowerShell startup logic
├── frontend/              ← React + TypeScript + Vite (port 5173)
│   ├── src/
│   │   ├── pages/         ← All application pages
│   │   ├── components/    ← Reusable UI components
│   │   ├── context/       ← AuthContext (username/password auth)
│   │   └── lib/           ← API client, Supabase client
│   └── .env               ← VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
└── backend/               ← Python + FastAPI (port 8000)
    ├── app/
    │   ├── api/v1/        ← All API route handlers
    │   ├── core/          ← Config, security, local DB
    │   └── services/      ← AI recommender, Gemini, eligibility engine
    ├── .env               ← GEMINI_API_KEY, JWT_SECRET, Supabase keys
    └── .venv/             ← Python virtual environment
```

### Key technology decisions

| Component | Technology | Reason |
|---|---|---|
| Authentication | Username + password (backend JWT) | No email required |
| AI Assistant | Google Gemini (`gemini-3.1-flash-lite`) | Fast, free-tier capable |
| Recommendations | Sentence-transformer embeddings + hybrid scoring | Personalized to student profile |
| Database | Supabase (PostgreSQL) + local SQLite | Remote catalog + local user accounts |
| Frontend auth state | `localStorage` JWT token | Persistent sessions across page refresh |


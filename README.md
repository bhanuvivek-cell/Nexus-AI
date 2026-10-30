# Nexus AI — AI-Powered Career & Opportunity Intelligence
**Tagline:** Where Skills Meet Opportunity  
**Target Audience:** Indian College & Engineering Students (B.Tech, B.E., BCA, B.Sc, M.Tech, MCA, Diploma)  
**Academic Context:** B.Tech Computer Science Engineering — Artificial Intelligence Project  

---

## 1. Executive Summary

Indian college students face a fragmented, high-noise career discovery landscape: public portals lack transparency, generic chatbots hallucinate placement statistics, and students cannot easily discern whether they meet strict graduation year or degree criteria.

**Nexus AI** solves this problem by delivering a **transparent, multi-factor AI recommendation engine** paired with a **deterministic eligibility auditor** and **verified learning roadmaps**.

- **No Fabricated Data:** Zero fake placement claims, invented salaries, or ghost listings. Every opportunity links directly to official provider portals (Cisco, Google, Microsoft, Amazon WOW, SIH, ISRO, Linux Foundation).
- **India-First Localization:** Built around the Indian university ecosystem with Rupee (`₹`) stipends, recognized degrees (B.Tech, B.E., BCA, MCA), graduating batch targeting (2025–2028), Indian state/city filters, and `DD MMM YYYY` date conventions.
- **Explainable AI Matching:** Every recommendation explicitly breaks down why an opportunity was matched, separating strict batch eligibility from semantic and skill synergy.

---

## 2. Recommendation & Eligibility Mathematical Model

### 2.1 Hybrid Recommendation Formula
The composite ranking score $S \in [0, 100]$ is computed via 5 normalized, explainable components:

$$S = 0.35K + 0.25M + 0.15I + 0.15P + 0.10G$$

| Component | Weight | Description | Implementation |
|---|---|---|---|
| **$K$ (Structured Skill Match)** | 35% | Weighted intersection of student skills with mandatory ($70\%$) and preferred ($30\%$) listing skills. | Canonical alias normalization (e.g. `DSA` $\rightarrow$ `Data Structures & Algorithms`, `ML` $\rightarrow$ `Machine Learning`). |
| **$M$ (Semantic Relevance)** | 25% | Cosine similarity between student academic profile synthesis and opportunity scope. | Local 384-dimensional dense embeddings via `sentence-transformers/all-MiniLM-L6-v2`. |
| **$I$ (Career Interest Alignment)** | 15% | Overlap between student target tracks (AI/ML, Web Dev, Cloud) and listing domain tags. | Jaccard intersection with text matching fallback. |
| **$P$ (Opportunity Preferences)** | 15% | Multi-attribute match across work mode (`remote`, `hybrid`, `on_site`), opportunity type, location, and stipend preferences. | Rule scoring against student preferences. |
| **$G$ (Goal Synergy)** | 10% | Alignment with skills the student explicitly marked in their `learning_goals`. | Cross-entropy coverage of student growth roadmap. |

### 2.2 Independent Eligibility Engine
Eligibility is evaluated **strictly independent** of the recommendation score:
- **`Eligible`**: Student degree, academic year, graduation batch, and mandatory prerequisite skills are all verified.
- **`Potentially eligible`**: The provider did not specify hard batch or degree limitations.
- **`Not eligible`**: One or more concrete constraints are violated (e.g. graduating year mismatch). **A high match score never overrides ineligibility.**

---

## 3. System Architecture & Tech Stack

```
nexus-ai/
├── backend/
│   ├── app/
│   │   ├── api/v1/         # Health, Profiles, Opportunities, Recommendations, Applications, Saved, Learning
│   │   ├── core/           # Pydantic Settings, JWT Security, Supabase Client Helper
│   │   ├── schemas/        # Typed Pydantic request & response validation schemas
│   │   ├── services/       # AIRecommender, EligibilityEngine, OpportunityService, SkillGapEngine
│   │   └── main.py         # FastAPI application with CORS and error handlers
│   ├── tests/              # Automated unit tests (health, eligibility, recommender)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/     # UI badges, cards, buttons, modals, opportunity cards, score breakdown
│   │   ├── context/        # AuthContext (Supabase Auth session & profile state)
│   │   ├── lib/            # API client with Bearer token injection, utils, supabase client
│   │   ├── pages/          # Landing, Login, Register, Onboarding, Dashboard, Explore, Details, Applications, Roadmap, Profile
│   │   └── App.tsx         # Route tree with ProtectedRoute & onboarding redirection
│   ├── tailwind.config.js  # India-first Navy & Saffron design system
│   └── package.json
├── database/
│   ├── migrations/         # 001_initial_schema.sql (PostgreSQL 17 + RLS policies)
│   └── seeds/              # Canonical skills, verified opportunities, official learning resources
├── scripts/
│   └── run_dev.ps1         # Windows one-click local developer runner
├── docs/                   # Architecture, API spec, Recommendation spec, Implementation checklist
└── .env.example            # Template environment variables
```

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4 (`@tailwindcss/postcss`), Lucide Icons, React Router v7.
- **Backend:** Python 3.12, FastAPI, Pydantic v2, Sentence Transformers (`all-MiniLM-L6-v2`), Scikit-learn, NumPy.
- **Database & Auth:** Supabase PostgreSQL 17 (hosted in `ap-south-1` Mumbai, India), Row-Level Security (RLS) on all 9 tables, Supabase Auth with server-side token validation.

---

## 4. Local Development Setup (Windows)

### Prerequisites
- Python 3.10+ (Verified on Python 3.12)
- Node.js 18+ (Verified on Node.js v26.11.1)
- Git

### 1. Clone & Configure Environment
```powershell
# Clone the repository
git clone https://github.com/your-username/nexus-ai.git
cd "Nexus AI"

# Copy environment variables
Copy-Item .env.example .env
```

Edit `.env` (or use pre-configured Supabase keys provided):
```env
SUPABASE_URL=https://vhjtiiyzajoxmadokkcp.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_URL=https://vhjtiiyzajoxmadokkcp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

### 2. Run Both Services via PowerShell Runner
Run the automated Windows development runner:
```powershell
.\scripts\run_dev.ps1
```
Or start each service in separate terminals:

**Terminal 1 — Backend:**
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 — Frontend:**
```powershell
cd frontend
npm install
npm run dev
```

Visit:
- **Frontend App:** [http://localhost:5173](http://localhost:5173)
- **Backend API Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Endpoint:** [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)

---

## 5. Automated Testing

Run the full pytest suite:
```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest -v
```

Run frontend build and lint check:
```powershell
cd frontend
npm run build
```

---

## 6. Verification & Definition of Done

1. **Authentication:** Register, sign in, password recovery, session persistence via Supabase Auth.
2. **Onboarding:** 5-step guided profile builder (Degree, Skills + proficiency, Career Interests, Preferences, Goals).
3. **AI Recommendations:** Multi-factor scoring ($S = 0.35K + 0.25M + 0.15I + 0.15P + 0.10G$) with explainable component breakdown.
4. **Eligibility Engine:** Independent rule verification against degree, batch, and non-negotiable skills.
5. **Explore & Filter:** Real-time search, multi-attribute filters (type, mode, stipend, location), and pagination.
6. **Application Tracker:** 6 pipeline stages (`Saved`, `Planned`, `Applied`, `Interview`, `Offer`, `Rejected/Closed`) with personal notes and date tracking.
7. **Skill Roadmaps:** Prioritized missing skills connected to official free courses (AWS Skill Builder, Microsoft Learn, Google Cloud Skills Boost, NPTEL, freeCodeCamp).
8. **Security & Isolation:** RLS enabled across all database tables; student private data is strictly isolated.

# Nexus AI — System Architecture & Design Specification
**Tagline:** Where Skills Meet Opportunity
**Domain:** AI-Powered Career & Opportunity Intelligence for Indian College Students

---

## 1. System Overview

Nexus AI is an India-first, full-stack, AI-powered career discovery and readiness platform designed specifically for college students across India (B.Tech, B.E., BCA, B.Sc, M.Tech, MCA, Diploma). The platform solves the critical gap between student academic preparation and real-world opportunities (internships, entry-level roles, hackathons, open-source programs, and research opportunities) through:

1. **Transparent, Multi-Factor AI Matching:** A 5-component hybrid recommendation engine ($S = 0.35K + 0.25M + 0.15I + 0.15P + 0.10G$) combining local semantic sentence embeddings (`all-MiniLM-L6-v2`) with structured skill matching, interest alignment, preference scoring, and learning goal synergy.
2. **Deterministic Eligibility Evaluation:** An independent rule engine that assesses graduation year, degree, academic year, and mandatory constraints into `Eligible`, `Potentially eligible`, or `Not eligible` states without hallucination.
3. **Actionable Skill Gap & Verified Roadmaps:** Granular missing-skill analysis paired with verified, official learning resources from trusted providers (AWS Skill Builder, Microsoft Learn, Google Cloud Skills Boost, NPTEL, freeCodeCamp).
4. **End-to-End Application Tracking:** Full lifecycle application tracker with real persistence, notes, dates, and stage progression.
5. **India-First Localization:** Clean, trustworthy UI tailored for Indian students: deep navy and saffron accents, rupee (₹) stipends, Indian educational qualifications, pan-India and tier 1/2/3 regional filters, and DD MMM YYYY dates.

---

## 2. Directory Structure

```
nexus-ai/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── api.py              # Combined API router
│   │   │       ├── health.py           # Health and readiness endpoints
│   │   │       ├── auth.py             # Auth verification & user context
│   │   │       ├── profiles.py         # Student profile & profile_skills CRUD
│   │   │       ├── skills.py           # Canonical skills catalogue & search
│   │   │       ├── opportunities.py    # Opportunity search, filters, details
│   │   │       ├── recommendations.py  # Personalized AI recommendations & eligibility
│   │   │       ├── applications.py     # Application tracker CRUD
│   │   │       ├── saved.py            # Saved opportunities CRUD
│   │   │       └── learning.py         # Skill gaps & verified learning resources
│   │   ├── core/
│   │   │   ├── config.py               # Pydantic Settings & environment variables
│   │   │   ├── security.py             # Supabase JWT token verification
│   │   │   └── database.py             # Supabase connection & DB helpers
│   │   ├── schemas/
│   │   │   ├── profile.py              # Pydantic profile & skill models
│   │   │   ├── opportunity.py          # Pydantic opportunity & filter models
│   │   │   ├── recommendation.py       # Pydantic recommendation response models
│   │   │   ├── application.py          # Pydantic application tracker models
│   │   │   └── learning.py             # Pydantic learning resource models
│   │   ├── services/
│   │   │   ├── ai_recommender.py       # Sentence-Transformers semantic + hybrid engine
│   │   │   ├── eligibility_engine.py   # Deterministic eligibility evaluation
│   │   │   ├── skill_gap_engine.py     # Skill gap analysis & priority calculator
│   │   │   └── opportunity_service.py  # Querying, filtering, and normalization
│   │   ├── main.py                     # FastAPI application entrypoint & middleware
│   │   └── __init__.py
│   ├── tests/
│   │   ├── test_health.py
│   │   ├── test_eligibility.py
│   │   ├── test_recommender.py
│   │   └── test_api.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/                 # Navbar, Footer, ProtectedRoute, AppShell
│   │   │   ├── ui/                     # Accessible badges, cards, buttons, inputs
│   │   │   ├── opportunities/          # OpportunityCard, FilterDrawer, MatchBadge
│   │   │   ├── tracker/                # StageBadge, ApplicationModal
│   │   │   └── onboarding/             # Multi-step onboarding wizard
│   │   ├── context/
│   │   │   └── AuthContext.tsx         # Supabase Auth provider & profile state
│   │   ├── hooks/                      # TanStack Query custom hooks
│   │   ├── lib/
│   │   │   ├── api.ts                  # Axios client with bearer token injection
│   │   │   ├── supabase.ts             # Supabase JS client
│   │   │   └── utils.ts
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx         # Homepage with problem statement & preview
│   │   │   ├── LoginPage.tsx           # Authentication with password toggle
│   │   │   ├── RegisterPage.tsx        # Registration with Supabase Auth
│   │   │   ├── ForgotPasswordPage.tsx  # Password recovery
│   │   │   ├── ResetPasswordPage.tsx   # Password reset callback
│   │   │   ├── OnboardingPage.tsx      # 5-step guided profile builder
│   │   │   ├── DashboardPage.tsx       # Personalized AI recommendations & summary
│   │   │   ├── ExplorePage.tsx         # Full catalog search, filter, sort
│   │   │   ├── OpportunityDetailPage.tsx # Match breakdown, eligibility, apply link
│   │   │   ├── ApplicationsPage.tsx    # 6-stage kanban / list tracker
│   │   │   ├── SkillRoadmapPage.tsx    # Skill gap analysis & verified courses
│   │   │   └── ProfilePage.tsx         # Edit profile, preferences, portfolio
│   │   ├── types/                      # Shared TypeScript definitions
│   │   ├── App.tsx                     # Route configuration
│   │   ├── main.tsx
│   │   └── index.css                   # Tailwind styles and custom tokens
│   ├── tailwind.config.js
│   ├── package.json
│   └── vite.config.ts
├── database/
│   ├── migrations/
│   │   └── 001_initial_schema.sql      # Supabase tables, RLS, indexes, constraints
│   └── seeds/
│       ├── 001_skills.sql              # Canonical skills across computer science
│       ├── 002_opportunities.sql       # Verified real opportunities
│       └── 003_learning_resources.sql  # Verified courses & learning modules
├── scripts/
│   ├── seed_database.py
│   └── test_system.py
├── docs/
│   ├── architecture.md
│   ├── api_spec.md
│   ├── recommendation_engine.md
│   └── deployment_guide.md
├── .env.example
├── .gitignore
└── README.md
```

---

## 3. Database Schema & Row-Level Security (RLS)

All tables reside in PostgreSQL with full referential integrity and strict RLS:

1. **`profiles`**: Tied 1:1 to `auth.users.id`. Stores degree, branch, academic year, graduation year, college, location, career interests (array), learning goals (array), opportunity preferences (JSONB), portfolio URLs (JSONB), and onboarding status.
2. **`skills`**: Master catalogue of programming languages, frameworks, core CS concepts, tools, and platforms with normalized alias arrays.
3. **`profile_skills`**: Many-to-many junction mapping student profiles to canonical skills with proficiency levels (`beginner`, `intermediate`, `advanced`) and learning goal flags.
4. **`opportunities`**: Comprehensive opportunity listings with structured requirements (degrees, grad years, academic years, mandatory skills), preferred qualifications, verified URLs, INR stipends, deadlines, and verification metadata.
5. **`opportunity_skills`**: Junction linking opportunities to skills categorized as `mandatory` or `preferred`.
6. **`learning_resources`**: Curated, verified, real courses and tutorials linked to skills with official URLs, free/cost indicators, and provider verification.
7. **`saved_opportunities`**: User bookmarks with uniqueness constraints (`user_id`, `opportunity_id`).
8. **`applications`**: Application lifecycle tracking across 6 discrete stages (`Saved`, `Planned`, `Applied`, `Interview`, `Offer`, `Rejected/Closed`) with date logs and personal student notes.
9. **`recommendation_events`**: Telemetry on student engagement (saves, clicks, external apply clicks) for future ranking calibration.

---

## 4. AI Recommendation & Eligibility Architecture

### Formula
$$S = 0.35K + 0.25M + 0.15I + 0.15P + 0.10G$$

1. **$K$ (Structured Skill Match, 35%):**
   $$K = 0.70 \times \left(\frac{|Skills_{student} \cap Skills_{opp, mand}|}{|Skills_{opp, mand}|}\right) + 0.30 \times \left(\frac{|Skills_{student} \cap Skills_{opp, pref}|}{|Skills_{opp, pref}|}\right)$$
   Aliases (e.g., `JS` $\rightarrow$ `JavaScript`, `ML` $\rightarrow$ `Machine Learning`) are normalized before set operations.
2. **$M$ (Semantic Relevance, 25%):**
   Cosine similarity between student profile synthesis vector and opportunity representation vector calculated using Sentence-Transformers `all-MiniLM-L6-v2` (384-dimensional dense vectors). Clamped safely to $0 - 100$.
3. **$I$ (Career Interest Alignment, 15%):**
   Intersection of student career interests (e.g., `AI/ML`, `Cloud/DevOps`, `Web Development`) with opportunity domains.
4. **$P$ (Opportunity Preference Match, 15%):**
   Alignment of work mode (`remote`, `hybrid`, `on_site`), opportunity type (`internship`, `hackathon`, `job`), stipend expectations, and location suitability.
5. **$G$ (Skill Growth Alignment, 10%):**
   Synergy score: Does this opportunity challenge the student with skills they explicitly marked in their `learning_goals`?

### Eligibility Engine
Independent of match score $S$. Evaluates:
- **Graduation Year**: Match against opportunity's allowable graduation years (e.g. `[2026, 2027]`).
- **Degree**: Verification against accepted degrees (`BTech`, `BE`, `BCA`, `MCA`, etc.).
- **Academic Year**: Current year minimums.
- **Mandatory Skills**: Presence of non-negotiable core skills.
- Status values: `Eligible` (all known criteria met), `Potentially eligible` (unspecified or ambiguous requirements), `Not eligible` (one or more verified criteria failed).

---

## 5. Security & Authorization
- **Token Verification:** Every backend private API request requires a valid Supabase JWT Bearer token decoded using the project's secret/JWKS.
- **Strict User Isolation:** Student ID is derived server-side from the verified token claims. Users cannot manipulate or query other students' profiles or applications.
- **CORS & Environment Separation:** Strict CORS whitelist for local Vite port (`http://localhost:5173`) and production domains.

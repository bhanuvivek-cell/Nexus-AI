# Nexus AI — Phased Implementation Checklist

---

## Stage 1: Project Foundation & Shell
- [x] Initial workspace inspection & monorepo scaffolding
- [x] Technical specifications & architecture documentation (`docs/architecture.md`, `docs/api_spec.md`, `docs/recommendation_engine.md`)
- [x] Root `.gitignore` and `.env.example` setup
- [x] Frontend setup (Tailwind CSS v4, Lucide icons, Google Inter typography, routing, design tokens)
- [x] Backend setup (FastAPI app structure, configuration settings, CORS, health endpoint)
- [x] Verified build & run validation of Frontend & Backend shells

## Stage 2: Supabase Configuration, Database Migrations & Auth
- [x] Database migration script `001_initial_schema.sql` (profiles, skills, profile_skills, opportunities, opportunity_skills, learning_resources, saved_opportunities, applications, recommendation_events)
- [x] Row Level Security (RLS) policies for user data isolation
- [x] Execution and validation of schema on live Supabase instance (`ap-south-1` Mumbai)
- [x] Backend token verification middleware with Supabase Auth
- [x] Frontend Supabase client integration & AuthContext (signup, login, email verification callback, logout, persistent session)
- [x] Profile CRUD & 5-step guided onboarding flow (Education, Skills, Interests, Preferences, Goals)

## Stage 3: Complete Frontend Pages & Reusable Components
- [x] India-first design system implementation (Slate navy, warm saffron accents, clean card borders, rupee symbols)
- [x] Landing page (tagline, problem explanation, how it works, preview cards, footer)
- [x] Authentication pages (Login, Register, Forgot Password, Reset Password)
- [x] Guided multi-step Onboarding wizard with auto-save & resume
- [x] Explore Opportunities page (search, dynamic filters by type, location, stipend, sort, pagination)
- [x] Opportunity Detail page (deep view, why matched, missing skills, official apply button, save/track)
- [x] My Applications tracker (6 stages, notes, date tracking)
- [x] Skill Roadmap page (missing skill analysis & verified course links)
- [x] Student Profile & Settings page (editable education, skills, interests, portfolio)

## Stage 4: Opportunity Database & Seed Records
- [x] Master canonical skills dataset (`001_skills.sql` - 47 verified skills)
- [x] Verified real-world opportunities dataset (`002_opportunities.sql` - Cisco, Google Summer of Code, Smart India Hackathon, Microsoft Imagine Cup, Amazon WOW, ISRO, LFX, Flipkart GRiD, etc.)
- [x] Verified learning resources dataset (`003_learning_resources.sql` - AWS Skill Builder, Microsoft Learn, Google Cloud Skills Boost, freeCodeCamp, NPTEL)
- [x] Seed database execution and verification
- [x] Opportunity search, filtering, and detail backend API endpoints

## Stage 5: Genuine AI/ML Recommendation & Eligibility Engine
- [x] Fast local semantic embedding generation with `sentence-transformers/all-MiniLM-L6-v2`
- [x] 5-component scoring implementation ($S = 0.35K + 0.25M + 0.15I + 0.15P + 0.10G$)
- [x] Alias-aware skill matcher with mandatory/preferred weightings
- [x] Strict, deterministic eligibility engine (grad year, degree, academic year, mandatory skills)
- [x] Explainable recommendation generator (component scores, reasons, next steps, matched/missing skills)
- [x] Recommendations endpoint integration

## Stage 6: Learning Resources, Verification, Quality & Deployment
- [x] Skill-gap frequency analysis across top matches
- [x] Integration with verified learning resource catalogue
- [x] Comprehensive automated tests (health, eligibility edge cases, recommender scoring, auth verification)
- [x] End-to-end user journey validation (Register -> Onboard -> Explore -> Detail -> Save -> Track -> Roadmap -> Profile)
- [x] Deployment guide & Windows-friendly commands in README.md

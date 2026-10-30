-- Nexus AI Initial Database Schema
-- Supabase PostgreSQL 17

-- 1. Profiles table (tied 1:1 to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    degree TEXT NOT NULL DEFAULT 'BTech',
    branch TEXT NOT NULL DEFAULT 'Computer Science & Engineering',
    academic_year INT NOT NULL DEFAULT 1,
    graduation_year INT NOT NULL,
    college TEXT,
    location TEXT,
    career_interests TEXT[] DEFAULT '{}',
    learning_goals TEXT[] DEFAULT '{}',
    opportunity_preferences JSONB DEFAULT '{"preferred_types": ["internship", "hackathon"], "work_mode": "any", "stipend_preference": "flexible", "preferred_locations": ["Pan-India"]}'::jsonb,
    portfolio_urls JSONB DEFAULT '{}'::jsonb,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Skills catalogue
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    aliases TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Profile Skills junction
CREATE TABLE IF NOT EXISTS public.profile_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    proficiency TEXT NOT NULL CHECK (proficiency IN ('beginner', 'intermediate', 'advanced')),
    is_learning_goal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (profile_id, skill_id)
);

-- 4. Opportunities table
CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    provider TEXT NOT NULL,
    opportunity_type TEXT NOT NULL CHECK (opportunity_type IN ('internship', 'entry_level_job', 'hackathon', 'certification', 'open_source', 'research', 'project')),
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    work_mode TEXT NOT NULL CHECK (work_mode IN ('remote', 'hybrid', 'on_site')),
    mandatory_requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
    preferred_qualifications JSONB NOT NULL DEFAULT '{}'::jsonb,
    deadline TIMESTAMPTZ,
    stipend_amount NUMERIC DEFAULT NULL,
    stipend_type TEXT DEFAULT 'fixed',
    stipend_currency TEXT DEFAULT 'INR',
    official_apply_url TEXT NOT NULL,
    source_url TEXT NOT NULL,
    source_name TEXT NOT NULL,
    first_seen TIMESTAMPTZ DEFAULT now(),
    last_checked TIMESTAMPTZ DEFAULT now(),
    verification_status TEXT NOT NULL DEFAULT 'verified' CHECK (verification_status IN ('verified', 'unverified', 'stale')),
    listing_status TEXT NOT NULL DEFAULT 'open' CHECK (listing_status IN ('open', 'closed', 'upcoming')),
    embedding FLOAT8[] DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Opportunity Skills junction
CREATE TABLE IF NOT EXISTS public.opportunity_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    requirement_type TEXT NOT NULL CHECK (requirement_type IN ('mandatory', 'preferred')),
    UNIQUE (opportunity_id, skill_id)
);

-- 6. Learning Resources catalogue
CREATE TABLE IF NOT EXISTS public.learning_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    provider TEXT NOT NULL,
    description TEXT NOT NULL,
    skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
    skill_name TEXT NOT NULL,
    official_url TEXT NOT NULL,
    is_free BOOLEAN DEFAULT TRUE,
    cost_details TEXT DEFAULT 'Free',
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    verification_status TEXT DEFAULT 'verified',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Saved Opportunities
CREATE TABLE IF NOT EXISTS public.saved_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    saved_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, opportunity_id)
);

-- 8. Applications Tracker
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    stage TEXT NOT NULL CHECK (stage IN ('Saved', 'Planned', 'Applied', 'Interview', 'Offer', 'Rejected/Closed')),
    notes TEXT DEFAULT '',
    applied_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, opportunity_id)
);

-- 9. Recommendation Engagement Events
CREATE TABLE IF NOT EXISTS public.recommendation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_grad_year ON public.profiles(graduation_year);
CREATE INDEX IF NOT EXISTS idx_skills_name ON public.skills(name);
CREATE INDEX IF NOT EXISTS idx_opportunities_type_mode ON public.opportunities(opportunity_type, work_mode, listing_status);
CREATE INDEX IF NOT EXISTS idx_opportunities_deadline ON public.opportunities(deadline);
CREATE INDEX IF NOT EXISTS idx_applications_user_stage ON public.applications(user_id, stage);
CREATE INDEX IF NOT EXISTS idx_saved_user ON public.saved_opportunities(user_id);
CREATE INDEX IF NOT EXISTS idx_opp_skills_opp ON public.opportunity_skills(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_prof_skills_profile ON public.profile_skills(profile_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid duplication errors on re-run
DROP POLICY IF EXISTS "Public read skills" ON public.skills;
DROP POLICY IF EXISTS "Public read opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Public read opportunity_skills" ON public.opportunity_skills;
DROP POLICY IF EXISTS "Public read learning_resources" ON public.learning_resources;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can read own profile_skills" ON public.profile_skills;
DROP POLICY IF EXISTS "Users can insert own profile_skills" ON public.profile_skills;
DROP POLICY IF EXISTS "Users can update own profile_skills" ON public.profile_skills;
DROP POLICY IF EXISTS "Users can delete own profile_skills" ON public.profile_skills;

DROP POLICY IF EXISTS "Users can read own saved" ON public.saved_opportunities;
DROP POLICY IF EXISTS "Users can insert own saved" ON public.saved_opportunities;
DROP POLICY IF EXISTS "Users can delete own saved" ON public.saved_opportunities;

DROP POLICY IF EXISTS "Users can read own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can insert own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can update own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can delete own applications" ON public.applications;

DROP POLICY IF EXISTS "Users can insert recommendation_events" ON public.recommendation_events;
DROP POLICY IF EXISTS "Users can view own recommendation_events" ON public.recommendation_events;

-- RLS Policies: Public Catalogs
CREATE POLICY "Public read skills" ON public.skills FOR SELECT USING (true);
CREATE POLICY "Public read opportunities" ON public.opportunities FOR SELECT USING (true);
CREATE POLICY "Public read opportunity_skills" ON public.opportunity_skills FOR SELECT USING (true);
CREATE POLICY "Public read learning_resources" ON public.learning_resources FOR SELECT USING (true);

-- RLS Policies: Profiles (User strictly owns their profile)
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies: Profile Skills
CREATE POLICY "Users can read own profile_skills" ON public.profile_skills FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can insert own profile_skills" ON public.profile_skills FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can update own profile_skills" ON public.profile_skills FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "Users can delete own profile_skills" ON public.profile_skills FOR DELETE USING (auth.uid() = profile_id);

-- RLS Policies: Saved Opportunities
CREATE POLICY "Users can read own saved" ON public.saved_opportunities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved" ON public.saved_opportunities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved" ON public.saved_opportunities FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: Applications
CREATE POLICY "Users can read own applications" ON public.applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own applications" ON public.applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own applications" ON public.applications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own applications" ON public.applications FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: Recommendation Events
CREATE POLICY "Users can insert recommendation_events" ON public.recommendation_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own recommendation_events" ON public.recommendation_events FOR SELECT USING (auth.uid() = user_id);

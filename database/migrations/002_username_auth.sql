-- Nexus AI - Migration 002: Add Username Support to Profiles
-- Adds a unique username column to public.profiles

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- Enforce unique index on normalized lowercase username
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique ON public.profiles(LOWER(username));

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);


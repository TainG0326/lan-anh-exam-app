-- ============================================================
-- Migration: Create profiles and allowed_emails tables
-- Required for admin-dashboard
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- profiles table: mirrors users table fields for admin dashboard
-- plus adds admin-specific fields like status, school, ai_status
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(20) CHECK (role IN ('student', 'teacher', 'admin')) DEFAULT 'student',
  status VARCHAR(20) CHECK (status IN ('active', 'banned')) DEFAULT 'active',
  school VARCHAR(255),
  avatar_url TEXT,
  ai_status VARCHAR(20) CHECK (ai_status IN ('active', 'restricted', 'blocked')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_profiles_updated_at();

-- ============================================================
-- allowed_emails table: whitelist for registration control
-- ============================================================
CREATE TABLE IF NOT EXISTS allowed_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) CHECK (role IN ('student', 'teacher', 'any')) DEFAULT 'any',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for allowed_emails
CREATE INDEX IF NOT EXISTS idx_allowed_emails_email ON allowed_emails(email);
CREATE INDEX IF NOT EXISTS idx_allowed_emails_role ON allowed_emails(role);
CREATE INDEX IF NOT EXISTS idx_allowed_emails_created_at ON allowed_emails(created_at DESC);

-- ============================================================
-- Enable Row Level Security (RLS)
-- ============================================================

-- profiles: only service role can read all, users can read own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access to profiles"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- profiles select: anyone authenticated can read profiles
CREATE POLICY "Authenticated users can read profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- profiles update: only service role can update
CREATE POLICY "Service role can update profiles"
  ON profiles FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- allowed_emails: only service role can manage
ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access to allowed_emails"
  ON allowed_emails FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Grant permissions
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON profiles TO service_role;
GRANT SELECT ON profiles TO authenticated;
GRANT ALL ON allowed_emails TO service_role;

-- ============================================================
-- Optional: Sync existing users from users table to profiles
-- Uncomment if you already have users in the old users table
-- ============================================================
-- INSERT INTO profiles (id, email, full_name, role, status, created_at, updated_at)
-- SELECT
--   id,
--   email,
--   name AS full_name,
--   role,
--   'active' AS status,
--   created_at,
--   updated_at
-- FROM users
-- ON CONFLICT (id) DO NOTHING;

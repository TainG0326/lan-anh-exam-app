-- ============================================================
-- Migration: Add ai_status column to profiles table
-- Run this AFTER migration_admin_profiles_and_whitelist.sql
-- ============================================================

-- Add ai_status column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'ai_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN ai_status VARCHAR(20)
      CHECK (ai_status IN ('active', 'restricted', 'blocked'))
      DEFAULT 'active';

    CREATE INDEX IF NOT EXISTS idx_profiles_ai_status ON profiles(ai_status);
  END IF;
END $$;

-- Grant permissions if needed
GRANT UPDATE ON profiles TO service_role;

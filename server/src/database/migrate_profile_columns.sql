-- ============================================
-- Migration: Add profile columns to users table
-- Run this in Supabase SQL Editor
-- ============================================

-- Add avatar_url column
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add phone column
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Add date_of_birth column
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Add two_factor_enabled column
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;

-- Add two_factor_secret column
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;

-- Add two_factor_verified column
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_verified BOOLEAN DEFAULT FALSE;

-- Verify columns were added
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;

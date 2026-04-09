-- SQL Migration: Add grade and level columns to classes table
-- Run this in Supabase SQL Editor if not already added

-- Add grade column if not exists
ALTER TABLE classes ADD COLUMN IF NOT EXISTS grade VARCHAR(10) CHECK (grade IN ('THCS', 'THPT'));

-- Add level column if not exists
ALTER TABLE classes ADD COLUMN IF NOT EXISTS level VARCHAR(50);

-- Update existing classes with default values if they have null values
UPDATE classes 
SET grade = 'THPT', level = 'Basic'
WHERE grade IS NULL OR level IS NULL;

-- Add NOT NULL constraint if columns already exist
ALTER TABLE classes ALTER COLUMN grade SET NOT NULL;
ALTER TABLE classes ALTER COLUMN level SET NOT NULL;



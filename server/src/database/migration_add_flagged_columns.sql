-- Migration: Add flagged and reviewed columns to exam_attempts
-- Run this in Supabase SQL Editor

ALTER TABLE exam_attempts 
ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flagged_reason TEXT,
ADD COLUMN IF NOT EXISTS reviewed BOOLEAN DEFAULT false;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_exam_attempts_flagged ON exam_attempts(flagged) WHERE flagged = true;
CREATE INDEX IF NOT EXISTS idx_exam_attempts_reviewed ON exam_attempts(reviewed) WHERE reviewed = false;




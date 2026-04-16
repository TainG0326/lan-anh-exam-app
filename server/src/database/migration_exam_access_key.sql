-- Exam Access Key & Lockdown Enhancement Migration
-- Run this in Supabase SQL Editor
-- Required for Phase 1: Exam Ecosystem & Lockdown Browser

-- Access Key: 6-character code students enter to access an exam
ALTER TABLE exams ADD COLUMN IF NOT EXISTS access_key VARCHAR(10);

-- Allowed Class ID: Separate from class_id, this controls which enrolled class can access the exam
-- This allows an exam to be restricted to only a specific class even if the teacher has multiple classes
ALTER TABLE exams ADD COLUMN IF NOT EXISTS allowed_class_id UUID REFERENCES classes(id) ON DELETE SET NULL;

-- Lockdown Required: Whether this exam requires the BEK (Browser Exam Key) lockdown app
ALTER TABLE exams ADD COLUMN IF NOT EXISTS is_lockdown_required BOOLEAN DEFAULT FALSE;

-- Index for fast access_key lookups (used by public verify endpoint)
CREATE INDEX IF NOT EXISTS idx_exams_access_key ON exams(access_key);

-- Index for allowed_class_id lookups (used by verify-access endpoint)
CREATE INDEX IF NOT EXISTS idx_exams_allowed_class_id ON exams(allowed_class_id);

-- =====================================================
-- MIGRATION: Split Whitelist into Teacher and Student
-- =====================================================
-- Creates separate whitelist tables for teacher and student
-- Maintains backward compatibility with existing email_whitelist

-- Create teacher_whitelist table
CREATE TABLE IF NOT EXISTS teacher_whitelist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create student_whitelist table
CREATE TABLE IF NOT EXISTS student_whitelist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_teacher_whitelist_email ON teacher_whitelist(email);
CREATE INDEX IF NOT EXISTS idx_teacher_whitelist_active ON teacher_whitelist(is_active);
CREATE INDEX IF NOT EXISTS idx_student_whitelist_email ON student_whitelist(email);
CREATE INDEX IF NOT EXISTS idx_student_whitelist_active ON student_whitelist(is_active);

-- Migrate existing teacher entries from email_whitelist
INSERT INTO teacher_whitelist (email, name, is_active, created_at, updated_at)
SELECT email, name, is_active, created_at, updated_at
FROM email_whitelist
WHERE role IN ('teacher', 'admin') OR role IS NULL
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- VIEWS: Unified interface for admin dashboard
-- =====================================================

-- View: All whitelisted teachers
CREATE OR REPLACE VIEW v_teacher_whitelist AS
SELECT 
  id,
  email,
  name,
  is_active,
  created_at,
  updated_at
FROM teacher_whitelist;

-- View: All whitelisted students
CREATE OR REPLACE VIEW v_student_whitelist AS
SELECT 
  id,
  email,
  name,
  is_active,
  created_at,
  updated_at
FROM student_whitelist;

-- =====================================================
-- DATA: Default admin teacher
-- =====================================================
INSERT INTO teacher_whitelist (email, name, is_active) VALUES
  ('thaitai824@gmail.com', 'Tai', true),
  ('admin@lananh.edu.vn', 'Admin', true)
ON CONFLICT (email) DO NOTHING;

-- Students can register freely (no default whitelist needed)
-- But you can add specific student emails here if needed:
-- INSERT INTO student_whitelist (email, name, is_active) VALUES
--   ('student@example.com', 'Student Name', true)
-- ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- CLEANUP: Keep old email_whitelist for backup (optional)
-- You can drop it after verifying the new tables work:
-- DROP TABLE IF EXISTS email_whitelist;
-- =====================================================

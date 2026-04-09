-- SQL Migration: Add Class Join Requests Table
-- Run this in Supabase SQL Editor

-- Drop trigger if exists (for re-running migration)
DROP TRIGGER IF EXISTS update_class_join_requests_updated_at ON class_join_requests;

-- Create class_join_requests table for pending student approval
CREATE TABLE IF NOT EXISTS class_join_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, student_id)
);

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_class_join_requests_class_id ON class_join_requests(class_id);
CREATE INDEX IF NOT EXISTS idx_class_join_requests_student_id ON class_join_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_class_join_requests_status ON class_join_requests(status);

-- Update trigger for updated_at
CREATE TRIGGER update_class_join_requests_updated_at BEFORE UPDATE ON class_join_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Migration: Create ai_usage_logs table
-- Tracks AI API usage per teacher for monitoring and billing
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- AI Usage Logs table
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  model VARCHAR(50) DEFAULT 'gemini-2.0-flash',
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost_usd DECIMAL(10, 6) DEFAULT 0,
  response_time_ms INTEGER,
  status VARCHAR(20) CHECK (status IN ('success', 'error', 'rate_limited')) DEFAULT 'success',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_ai_usage_teacher ON ai_usage_logs(teacher_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_teacher_date ON ai_usage_logs(teacher_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_status ON ai_usage_logs(status);

-- RLS
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to ai_usage_logs"
  ON ai_usage_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT ALL ON ai_usage_logs TO service_role;

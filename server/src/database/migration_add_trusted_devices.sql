-- Migration: Add trusted_devices table for 30-day device remember
-- Run this after creating the migration file

-- Create trusted_devices table
CREATE TABLE IF NOT EXISTS trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_token_hash VARCHAR(128) NOT NULL,
  user_agent VARCHAR(512),
  ip_address VARCHAR(45),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, device_token_hash)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id ON trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_token_hash ON trusted_devices(device_token_hash);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_expires_at ON trusted_devices(expires_at);

-- Auto-cleanup: delete expired devices (can be run as a scheduled job)
-- Or add a policy to check expiry at query time

COMMENT ON TABLE trusted_devices IS 'Stores hashed device tokens for 30-day trusted device login bypass';
COMMENT ON COLUMN trusted_devices.device_token_hash IS 'SHA-256 hash of the device token (never store raw token)';
COMMENT ON COLUMN trusted_devices.expires_at IS 'When this trusted device token expires (30 days from creation)';

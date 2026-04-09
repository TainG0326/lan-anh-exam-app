-- Migration: Add security features (whitelist and 2FA)
-- Run this in Supabase SQL Editor

-- 1. Create email_whitelist table
CREATE TABLE IF NOT EXISTS email_whitelist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'teacher',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add 2FA fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_verified BOOLEAN DEFAULT false;

-- 3. Create function to auto-add whitelisted email when registering
CREATE OR REPLACE FUNCTION check_email_whitelist()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if email is in whitelist (case-insensitive)
  IF NOT EXISTS (
    SELECT 1 FROM email_whitelist 
    WHERE LOWER(email) = LOWER(NEW.email) 
    AND is_active = true
  ) THEN
    -- For teacher role, deny registration if not in whitelist
    IF NEW.role = 'teacher' THEN
      RAISE EXCEPTION 'Email không được phép đăng ký. Vui lòng liên hệ quản trị viên.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS validate_email_whitelist ON users;
CREATE TRIGGER validate_email_whitelist
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION check_email_whitelist();

-- 4. Create OTP store for 2FA (temporary table)
CREATE TABLE IF NOT EXISTS auth_otp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  otp_type TEXT DEFAULT 'login', -- 'login' or 'reset'
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_whitelist_email ON email_whitelist (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_auth_otp_user_id ON auth_otp (user_id);
CREATE INDEX IF NOT EXISTS idx_auth_otp_email ON auth_otp (email);
CREATE INDEX IF NOT EXISTS idx_auth_otp_expires ON auth_otp (expires_at);

-- 6. RLS Policies for email_whitelist
ALTER TABLE email_whitelist ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage whitelist
CREATE POLICY "Admins can manage whitelist" ON email_whitelist
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Allow authenticated users to read whitelist (for checking their email)
CREATE POLICY "Users can read own email in whitelist" ON email_whitelist
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 7. RLS Policies for auth_otp
ALTER TABLE auth_otp ENABLE ROW LEVEL SECURITY;

-- Users can manage their own OTPs
CREATE POLICY "Users can manage own OTPs" ON auth_otp
  FOR ALL USING (user_id = auth.uid());

-- 8. Disable RLS on users for now to allow teacher registration (will handle whitelist in backend)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 9. Insert initial whitelisted emails
INSERT INTO email_whitelist (email, name, role) VALUES
  ('thaitai824@gmail.com', 'Tai', 'teacher'),
  ('admin@lananh.edu.vn', 'Admin', 'admin')
ON CONFLICT (email) DO NOTHING;

COMMENT ON TABLE email_whitelist IS 'Danh sách email được phép đăng ký';
COMMENT ON TABLE auth_otp IS 'Bảng tạm lưu OTP cho xác thực 2FA';
COMMENT ON COLUMN users.two_factor_enabled IS 'Bật/tắt 2FA cho tài khoản';
COMMENT ON COLUMN users.two_factor_secret IS 'Mã bí mật 2FA (TOTP secret)';
COMMENT ON COLUMN users.two_factor_verified IS 'Đã xác minh 2FA hay chưa';
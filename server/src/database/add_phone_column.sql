-- Add phone column to users table for profile phone feature
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Add phone_number column as alternative naming
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Create index for phone lookups (optional)
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

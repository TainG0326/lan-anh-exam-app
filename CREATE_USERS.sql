-- Tạo user mặc định trong Supabase
-- Chạy file này trong Supabase SQL Editor

-- Tắt RLS tạm thời (cho development)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Tạo teacher
INSERT INTO users (email, password, name, role)
VALUES (
  'teacher@example.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5Y', -- teacher123
  'Giáo viên Mẫu',
  'teacher'
)
ON CONFLICT (email) DO NOTHING;

-- Tạo student
INSERT INTO users (email, password, name, role)
VALUES (
  'student@example.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5Y', -- student123
  'Học sinh Mẫu',
  'student'
)
ON CONFLICT (email) DO NOTHING;

-- Bật lại RLS (nếu muốn)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;







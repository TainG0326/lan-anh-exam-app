-- Tạo user mặc định trong Supabase
-- Chạy file này trong Supabase SQL Editor sau khi đã tắt RLS

-- Tắt RLS (nếu chưa tắt)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Tạo teacher (password: teacher123)
INSERT INTO users (email, password, name, role)
VALUES (
  'teacher@example.com',
  '$2a$12$A.OMOLgNc/UJBs9ts2fXPOgKF7vxIrQDmuZO.dZADkshzzWFwKoGy',
  'Giáo viên Mẫu',
  'teacher'
)
ON CONFLICT (email) DO NOTHING;

-- Tạo student (password: student123)
INSERT INTO users (email, password, name, role)
VALUES (
  'student@example.com',
  '$2a$12$2JibuwRpXrCbXLTjlhSvzePJ221WuOPisAiexfYMtuo56tGsZ/5vu',
  'Học sinh Mẫu',
  'student'
)
ON CONFLICT (email) DO NOTHING;

-- Kiểm tra
SELECT email, name, role FROM users;







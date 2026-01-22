# 🔧 Sửa lỗi đăng nhập - Hướng dẫn nhanh

## ❌ Vấn đề:
- Database chưa có user nào
- Row Level Security (RLS) đang chặn việc tạo user
- Đăng nhập không hoạt động

## ✅ Giải pháp (3 bước):

### Bước 1: Tắt RLS trong Supabase
1. Mở **Supabase Dashboard**: https://supabase.com/dashboard/project/hvophbiqtpffokpienki
2. Vào **SQL Editor**
3. Chạy lệnh:
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

### Bước 2: Tạo user mặc định
Trong cùng SQL Editor, chạy:
```sql
-- Tạo teacher
INSERT INTO users (email, password, name, role)
VALUES (
  'teacher@example.com',
  '$2a$12$A.OMOLgNc/UJBs9ts2fXPOgKF7vxIrQDmuZO.dZADkshzzWFwKoGy',
  'Giáo viên Mẫu',
  'teacher'
)
ON CONFLICT (email) DO NOTHING;

-- Tạo student
INSERT INTO users (email, password, name, role)
VALUES (
  'student@example.com',
  '$2a$12$2JibuwRpXrCbXLTjlhSvzePJ221WuOPisAiexfYMtuo56tGsZ/5vu',
  'Học sinh Mẫu',
  'student'
)
ON CONFLICT (email) DO NOTHING;
```

### Bước 3: Kiểm tra
Chạy query để xem user đã được tạo:
```sql
SELECT email, name, role FROM users;
```

Bạn sẽ thấy 2 user: teacher và student.

## 🚀 Sau đó:

1. **Refresh browser** (F5)
2. **Thử đăng nhập lại**:
   - Teacher: teacher@example.com / teacher123
   - Student: student@example.com / student123

## 📝 File SQL đầy đủ:

Xem file `CREATE_DEFAULT_USERS.sql` để copy toàn bộ script.

## ✅ Nếu vẫn lỗi:

1. Kiểm tra console browser (F12) để xem lỗi
2. Kiểm tra Network tab để xem API response
3. Đảm bảo backend server đang chạy (port 5000)


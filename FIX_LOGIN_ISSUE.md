# Sửa lỗi đăng nhập

## 🔍 Vấn đề:

- Database không có user nào
- Row Level Security (RLS) đang chặn việc tạo user
- API login trả về 401 vì không tìm thấy user

## ✅ Giải pháp:

### Cách 1: Tắt RLS và tạo user (Khuyến nghị)

1. **Mở Supabase Dashboard** → SQL Editor
2. **Chạy các lệnh sau**:

```sql
-- Tắt RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;

-- Tạo teacher (password: teacher123)
INSERT INTO users (email, password, name, role)
VALUES (
  'teacher@example.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5Y',
  'Giáo viên Mẫu',
  'teacher'
)
ON CONFLICT (email) DO NOTHING;

-- Tạo student (password: student123)
INSERT INTO users (email, password, name, role)
VALUES (
  'student@example.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5Y',
  'Học sinh Mẫu',
  'student'
)
ON CONFLICT (email) DO NOTHING;
```

**Lưu ý**: Password hash trên có thể không đúng. Tốt hơn là dùng script Node.js.

### Cách 2: Dùng script Node.js (Sau khi tắt RLS)

1. **Tắt RLS** trong Supabase SQL Editor:
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

2. **Chạy script**:
```bash
cd server
node create-default-users.js
```

### Cách 3: Tạo user trực tiếp trong Supabase Dashboard

1. Vào **Table Editor** → **users**
2. Click **Insert row**
3. Điền thông tin:
   - email: `teacher@example.com`
   - password: (cần hash bằng bcrypt - dùng script)
   - name: `Giáo viên Mẫu`
   - role: `teacher`

## 🔧 Tạo password hash đúng:

Chạy script này để tạo password hash:

```bash
cd server
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('teacher123', 12).then(hash => console.log('Teacher hash:', hash)); bcrypt.hash('student123', 12).then(hash => console.log('Student hash:', hash));"
```

Sau đó dùng hash đó để insert vào database.

## ✅ Sau khi tạo user:

1. **Test login API**:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@example.com","password":"teacher123"}'
```

2. **Refresh browser** và thử đăng nhập lại

3. **Kiểm tra console** để xem có lỗi gì không







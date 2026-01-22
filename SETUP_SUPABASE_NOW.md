# Hướng dẫn setup Supabase - BƯỚC TIẾP THEO

## ✅ Đã hoàn thành:
- File `.env` đã được cập nhật với Supabase credentials
- Dependencies đã được cài đặt

## 🔧 Bước tiếp theo: Tạo Database Schema

### 1. Mở Supabase Dashboard
Truy cập: https://supabase.com/dashboard/project/hvophbiqtpffokpienki

### 2. Vào SQL Editor
- Click vào **SQL Editor** ở menu bên trái
- Click **New query**

### 3. Chạy SQL Schema
1. Copy **TOÀN BỘ** nội dung từ file `server/src/database/schema.sql`
2. Paste vào SQL Editor
3. Click **Run** (hoặc nhấn Ctrl+Enter)
4. Đợi thấy thông báo "Success" → Hoàn thành! ✅

### 4. Tắt Row Level Security (RLS) - Cho development
Chạy thêm query này trong SQL Editor:
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE class_students DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE lessons DISABLE ROW LEVEL SECURITY;
ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts DISABLE ROW LEVEL SECURITY;
```

## 🚀 Test kết nối

Sau khi chạy schema, test server:
```bash
cd server
npm run dev
```

Nếu thấy:
- ✅ "Supabase connected successfully!"
- ✅ "Default teacher created..."
- ✅ "Default student created..."
- ✅ "Server running on port 5000"

→ **Thành công!** 🎉

## 📝 Tài khoản mặc định

Sau khi server chạy lần đầu, hệ thống sẽ tự động tạo:
- **Teacher**: teacher@example.com / teacher123
- **Student**: student@example.com / student123

## 🔍 Kiểm tra database

Trong Supabase Dashboard:
- Vào **Table Editor**
- Bạn sẽ thấy các bảng: users, classes, exams, exam_attempts, etc.
- Kiểm tra xem có 2 users (teacher và student) đã được tạo chưa

## ❌ Nếu gặp lỗi

### Lỗi "relation does not exist"
- Chưa chạy schema.sql
- Chạy lại schema.sql trong SQL Editor

### Lỗi "new row violates row-level security policy"
- Chưa tắt RLS
- Chạy lệnh ALTER TABLE ... DISABLE ROW LEVEL SECURITY

### Lỗi "Invalid API key"
- Kiểm tra SUPABASE_URL và SUPABASE_ANON_KEY trong `.env`
- Đảm bảo không có khoảng trắng thừa







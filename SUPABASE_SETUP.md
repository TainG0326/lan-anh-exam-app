# Hướng dẫn setup Supabase

## Bước 1: Tạo tài khoản Supabase
1. Truy cập: https://supabase.com
2. Click "Start your project"
3. Đăng nhập bằng GitHub (hoặc email)
4. Click "New Project"

## Bước 2: Tạo Project
1. **Organization**: Chọn hoặc tạo mới
2. **Name**: `english-exam-platform` (hoặc tên bạn muốn)
3. **Database Password**: Tạo mật khẩu mạnh (LƯU LẠI!)
4. **Region**: Chọn gần nhất (ví dụ: Southeast Asia - Singapore)
5. **Pricing Plan**: Free (đủ cho development)
6. Click "Create new project" (mất khoảng 2 phút)

## Bước 3: Lấy API Keys
1. Trong project dashboard, vào **Settings** → **API**
2. Copy các thông tin sau:
   - **Project URL** (SUPABASE_URL)
   - **anon public** key (SUPABASE_ANON_KEY)

## Bước 4: Tạo Database Schema
1. Trong Supabase dashboard, vào **SQL Editor**
2. Click "New query"
3. Copy toàn bộ nội dung từ file `server/src/database/schema.sql`
4. Paste vào SQL Editor
5. Click "Run" (hoặc Ctrl+Enter)
6. Đợi thấy thông báo "Success. No rows returned" → Thành công! ✅

## Bước 5: Cấu hình .env
Mở file `server/.env` và thêm/cập nhật:

```env
PORT=5000
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=your-secret-key-change-in-production-12345
JWT_EXPIRE=7d
NODE_ENV=development
```

(Thay `xxxxx` và `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` bằng giá trị thực tế từ Supabase)

## Bước 6: Cài đặt dependencies
```bash
cd server
npm install
```

## Bước 7: Test kết nối
Chạy server:
```bash
npm run server
```

Nếu thấy "✅ Supabase connected successfully!" → Thành công! ✅

## Lưu ý bảo mật
- **Row Level Security (RLS)**: Supabase có RLS mặc định, có thể cần tắt cho development
- Vào **Authentication** → **Policies** để cấu hình
- Hoặc tạm thời disable RLS trong SQL Editor:
  ```sql
  ALTER TABLE users DISABLE ROW LEVEL SECURITY;
  ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
  ALTER TABLE exams DISABLE ROW LEVEL SECURITY;
  ALTER TABLE exam_attempts DISABLE ROW LEVEL SECURITY;
  ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;
  ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;
  ```

## Troubleshooting

### Lỗi "relation does not exist"
- Chưa chạy schema.sql
- Vào SQL Editor và chạy lại file schema.sql

### Lỗi "new row violates row-level security policy"
- RLS đang bật, cần disable hoặc tạo policies
- Chạy lệnh disable RLS ở trên

### Lỗi "Invalid API key"
- Kiểm tra SUPABASE_URL và SUPABASE_ANON_KEY trong .env
- Đảm bảo không có khoảng trắng thừa







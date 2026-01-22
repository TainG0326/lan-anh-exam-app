# Kiểm tra Server

## Các bước kiểm tra:

### 1. Kiểm tra xem đã chạy schema SQL chưa
- Mở Supabase Dashboard
- Vào **Table Editor**
- Kiểm tra xem có bảng `users` chưa
- Nếu chưa có → Cần chạy `schema.sql` trước

### 2. Kiểm tra file .env
File `.env` phải có:
```env
SUPABASE_URL=https://hvophbiqtpffokpienki.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Chạy server thủ công
Mở terminal mới và chạy:
```bash
cd server
npm run dev
```

Xem output để biết lỗi:
- ✅ "Supabase connected successfully!" → OK
- ❌ "relation does not exist" → Chưa chạy schema.sql
- ❌ "Invalid API key" → Kiểm tra .env
- ❌ "Missing Supabase environment variables" → Kiểm tra .env

### 4. Nếu schema chưa chạy
1. Vào Supabase Dashboard → SQL Editor
2. Copy toàn bộ `server/src/database/schema.sql`
3. Paste và Run
4. Chạy thêm query tắt RLS (xem SETUP_SUPABASE_NOW.md)

### 5. Test API
Sau khi server chạy, test:
```bash
curl http://localhost:5000/api/health
```
Hoặc mở browser: http://localhost:5000/api/health







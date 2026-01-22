# 🚀 Hướng Dẫn Khởi Động Server

## Bước 1: Kiểm tra file .env

Đảm bảo có file `.env` trong thư mục `server/` với nội dung:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
PORT=5000
```

**Lấy thông tin Supabase:**
1. Vào Supabase Dashboard
2. Vào **Settings** → **API**
3. Copy **Project URL** → `SUPABASE_URL`
4. Copy **anon/public key** → `SUPABASE_ANON_KEY`

## Bước 2: Khởi động server

### Cách 1: Dùng PowerShell script (Khuyên dùng)
```powershell
cd server
.\start-server.ps1
```

### Cách 2: Chạy trực tiếp
```powershell
cd server
npm run dev
```

## Bước 3: Kiểm tra server

Mở trình duyệt hoặc dùng PowerShell:
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/health"
```

Nếu thấy response:
```json
{"success":true,"message":"Server is running"}
```

→ **Server đã chạy thành công!** ✅

## Lỗi thường gặp

### 1. "Missing Supabase environment variables"
→ Kiểm tra file `.env` có đúng không

### 2. "Table 'users' does not exist"
→ Chạy `schema.sql` trong Supabase SQL Editor

### 3. "Column class_code does not exist"
→ Chạy `add_class_code_column.sql` trong Supabase SQL Editor

### 4. Port 5000 đã được sử dụng
→ Đổi PORT trong file `.env` hoặc tắt process đang dùng port 5000

## Dừng server

Nhấn `Ctrl + C` trong terminal đang chạy server.


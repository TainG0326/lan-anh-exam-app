# Hướng dẫn Chạy Web

## ⚠️ Lưu ý quan trọng

File `.env` đã được tạo tại `server/.env` nhưng bạn cần điền thông tin Supabase thực tế.

## Bước 1: Cấu hình Supabase

1. Mở file `server/.env`
2. Thay thế các giá trị sau:
   - `SUPABASE_URL`: Lấy từ Supabase Dashboard → Settings → API → Project URL
   - `SUPABASE_ANON_KEY`: Lấy từ Supabase Dashboard → Settings → API → anon/public key
   - `JWT_SECRET`: Thay đổi thành một chuỗi ngẫu nhiên mạnh (ví dụ: `my-super-secret-jwt-key-2024`)

## Bước 2: Chạy các dịch vụ

Mở **3 terminal riêng biệt** và chạy:

### Terminal 1 - Backend Server:
```bash
cd "C:\Users\Admin\web bai tap kiem tra cho hoc sinh va giao vien\server"
npm run dev
```

### Terminal 2 - Teacher Web:
```bash
cd "C:\Users\Admin\web bai tap kiem tra cho hoc sinh va giao vien\teacher-web"
npm run dev
```

### Terminal 3 - Student Web:
```bash
cd "C:\Users\Admin\web bai tap kiem tra cho hoc sinh va giao vien\student-web"
npm run dev
```

## Bước 3: Truy cập

Sau khi các dịch vụ khởi động thành công:

- **Teacher Web**: http://localhost:3001
- **Student Web**: http://localhost:3002
- **API Server**: http://localhost:5000

## Tài khoản mặc định

- **Teacher**: 
  - Email: `teacher@example.com`
  - Password: `teacher123`

- **Student**: 
  - Email: `student@example.com`
  - Password: `student123`

## Khắc phục sự cố

### Lỗi "ERR_CONNECTION_REFUSED"
- Kiểm tra các dịch vụ đã chạy chưa
- Kiểm tra port 3001, 3002, 5000 có bị chiếm dụng không

### Lỗi Supabase connection
- Kiểm tra file `.env` có đúng thông tin không
- Kiểm tra Supabase project có đang hoạt động không
- Chạy schema SQL trong Supabase SQL Editor (file: `server/src/database/schema.sql`)

### Lỗi dependencies
Chạy lệnh cài đặt:
```bash
cd "C:\Users\Admin\web bai tap kiem tra cho hoc sinh va giao vien"
npm run install-all
```



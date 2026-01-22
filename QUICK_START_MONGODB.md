# Hướng dẫn nhanh: Kết nối MongoDB Atlas (5 phút)

## Bước 1: Tạo tài khoản MongoDB Atlas
1. Truy cập: https://www.mongodb.com/cloud/atlas/register
2. Đăng ký tài khoản miễn phí (Free tier)
3. Chọn "Build a Database" → "M0 Free" (miễn phí)

## Bước 2: Tạo Cluster
1. Chọn Cloud Provider: AWS
2. Chọn Region: gần nhất (ví dụ: Singapore)
3. Click "Create Cluster" (mất khoảng 3-5 phút)

## Bước 3: Tạo Database User
1. Trong "Database Access" → "Add New Database User"
2. Username: `admin` (hoặc tên bạn muốn)
3. Password: tạo mật khẩu mạnh (lưu lại!)
4. Database User Privileges: "Atlas admin"
5. Click "Add User"

## Bước 4: Whitelist IP Address
1. Trong "Network Access" → "Add IP Address"
2. Click "Allow Access from Anywhere" (0.0.0.0/0) - cho development
3. Click "Confirm"

## Bước 5: Lấy Connection String
1. Trong "Database" → Click "Connect" trên cluster
2. Chọn "Connect your application"
3. Driver: Node.js, Version: 5.5 or later
4. Copy connection string, ví dụ:
   ```
   mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## Bước 6: Cập nhật file .env
Mở file `server/.env` và thay đổi:
```env
MONGODB_URI=mongodb+srv://admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/english_exam?retryWrites=true&w=majority
```
(Thay `YOUR_PASSWORD` và `cluster0.xxxxx` bằng thông tin thực tế)

## Bước 7: Test kết nối
Chạy lại server:
```bash
npm run server
```

Nếu thấy "MongoDB Connected" → Thành công! ✅







# Hướng dẫn cài đặt và kết nối MongoDB

## Cách 1: Sử dụng MongoDB Local

### Bước 1: Cài đặt MongoDB
1. Tải MongoDB Community Server từ: https://www.mongodb.com/try/download/community
2. Cài đặt MongoDB (chọn "Complete" installation)
3. MongoDB sẽ tự động chạy như một Windows Service

### Bước 2: Kết nối trong MongoDB Compass
1. Mở MongoDB Compass
2. Trong trường "URI", nhập:
   ```
   mongodb://localhost:27017
   ```
3. Click "Connect"

### Bước 3: Tạo database
Sau khi kết nối thành công, database `english_exam` sẽ được tạo tự động khi server chạy lần đầu.

---

## Cách 2: Sử dụng MongoDB Atlas (Cloud - Miễn phí)

### Bước 1: Tạo tài khoản MongoDB Atlas
1. Truy cập: https://www.mongodb.com/cloud/atlas/register
2. Đăng ký tài khoản miễn phí
3. Tạo cluster miễn phí (M0 - Free tier)

### Bước 2: Lấy Connection String
1. Trong Atlas Dashboard, click "Connect"
2. Chọn "Connect your application"
3. Copy connection string, ví dụ:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Bước 3: Cập nhật file .env
Mở file `server/.env` và thay đổi:
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/english_exam?retryWrites=true&w=majority
```
(Thay `username`, `password`, và `cluster0.xxxxx` bằng thông tin thực tế của bạn)

### Bước 4: Kết nối trong MongoDB Compass
1. Mở MongoDB Compass
2. Trong trường "URI", dán connection string từ Atlas
3. Click "Connect"

---

## Kiểm tra kết nối

Sau khi cấu hình xong, chạy lại server:
```bash
npm run server
```

Nếu thấy thông báo "MongoDB Connected", nghĩa là đã kết nối thành công!

---

## Troubleshooting

### Lỗi "Invalid connection string"
- Kiểm tra format connection string
- Đảm bảo không có khoảng trắng thừa
- Với MongoDB local: `mongodb://localhost:27017`
- Với Atlas: `mongodb+srv://username:password@cluster...`

### Lỗi "Connection refused"
- Kiểm tra MongoDB service đã chạy chưa (Windows: Services → MongoDB)
- Kiểm tra firewall có chặn port 27017 không

### Lỗi "Authentication failed" (Atlas)
- Kiểm tra username/password trong connection string
- Đảm bảo IP address của bạn đã được whitelist trong Atlas Network Access







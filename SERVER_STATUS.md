# Trạng thái Server

## ✅ Kết nối Supabase: THÀNH CÔNG
- URL: ✅ Đã cấu hình
- API Key: ✅ Đã cấu hình  
- Bảng users: ✅ Đã tồn tại
- Schema: ✅ Đã được tạo

## 🚀 Server đang khởi động

Server đang chạy trong background. Để xem log và kiểm tra:

### Cách 1: Kiểm tra trong terminal
Mở terminal mới và chạy:
```bash
cd server
npm run dev
```

Bạn sẽ thấy:
- ✅ "Supabase connected successfully!"
- ✅ "Default teacher created..."
- ✅ "Default student created..."
- ✅ "Server running on port 5000"

### Cách 2: Test API
Sau khi server chạy (khoảng 10-15 giây), test:
```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Hoặc mở browser:
http://localhost:5000/api/health
```

### Cách 3: Kiểm tra process
```powershell
Get-Process -Name node -ErrorAction SilentlyContinue
```

## 📝 Nếu server không chạy

1. **Kiểm tra log lỗi** trong terminal
2. **Kiểm tra port 5000** có bị chiếm không:
   ```powershell
   netstat -ano | findstr :5000
   ```
3. **Kiểm tra .env** file có đúng không
4. **Chạy test connection**:
   ```bash
   cd server
   node test-connection.js
   ```

## 🎯 Tiếp theo

Sau khi server chạy thành công:
1. Teacher Web: http://localhost:3001
2. Student Web: http://localhost:3002
3. API: http://localhost:5000

Tài khoản mặc định:
- Teacher: teacher@example.com / teacher123
- Student: student@example.com / student123







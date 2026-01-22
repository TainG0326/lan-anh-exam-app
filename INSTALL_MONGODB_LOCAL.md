# Hướng dẫn cài đặt MongoDB Local (Windows)

## Bước 1: Tải MongoDB Community Server
1. Truy cập: https://www.mongodb.com/try/download/community
2. Chọn:
   - Version: 7.0 (hoặc mới nhất)
   - Platform: Windows
   - Package: MSI
3. Click "Download"

## Bước 2: Cài đặt
1. Chạy file .msi vừa tải
2. Chọn "Complete" installation
3. **QUAN TRỌNG**: Tích chọn "Install MongoDB as a Service"
4. Chọn "Run service as Network Service user"
5. Tích chọn "Install MongoDB Compass" (GUI tool)
6. Click "Install"

## Bước 3: Kiểm tra MongoDB đã chạy
Mở PowerShell và chạy:
```powershell
Get-Service MongoDB
```

Nếu thấy "Running" → MongoDB đã chạy thành công! ✅

## Bước 4: Test kết nối
Chạy lại server:
```bash
npm run server
```

Nếu thấy "MongoDB Connected" → Thành công! ✅

## Troubleshooting

### Nếu MongoDB service không chạy:
```powershell
# Khởi động service
Start-Service MongoDB

# Hoặc qua Services GUI:
# Win + R → services.msc → Tìm "MongoDB" → Right click → Start
```

### Nếu vẫn lỗi:
1. Kiểm tra MongoDB đã cài đúng chưa:
   ```powershell
   mongod --version
   ```

2. Kiểm tra port 27017 có bị chiếm không:
   ```powershell
   netstat -an | findstr "27017"
   ```

3. Thử khởi động MongoDB thủ công:
   ```powershell
   mongod --dbpath "C:\data\db"
   ```
   (Tạo thư mục `C:\data\db` trước nếu chưa có)







# Hướng dẫn chạy Server

## ⚠️ Lưu ý: Tên thư mục có khoảng trắng

Vì tên thư mục có khoảng trắng (`web bai tap kiem tra cho hoc sinh va giao vien`), bạn cần dùng dấu ngoặc kép trong PowerShell.

## ✅ Cách chạy đúng:

### PowerShell:
```powershell
cd "C:\Users\Admin\web bai tap kiem tra cho hoc sinh va giao vien\server"
npm run dev
```

### Hoặc dùng đường dẫn ngắn:
```powershell
cd server
npm run dev
```
(Nếu bạn đang ở thư mục gốc của project)

### Command Prompt (CMD):
```cmd
cd "C:\Users\Admin\web bai tap kiem tra cho hoc sinh va giao vien\server"
npm run dev
```

## 🚀 Chạy tất cả (Server + 2 Web):

### PowerShell:
```powershell
cd "C:\Users\Admin\web bai tap kiem tra cho hoc sinh va giao vien"
npm run dev
```

Hoặc từ thư mục gốc:
```powershell
npm run dev
```

## 📝 Các lệnh hữu ích:

### Kiểm tra server đang chạy:
```powershell
# Test API
Invoke-WebRequest -Uri "http://localhost:5000/api/health"

# Hoặc mở browser:
# http://localhost:5000/api/health
```

### Dừng server:
Nhấn `Ctrl + C` trong terminal đang chạy server

### Xem process Node.js:
```powershell
Get-Process -Name node
```

### Kill tất cả Node processes:
```powershell
Get-Process -Name node | Stop-Process
```







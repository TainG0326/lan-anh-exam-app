# Hướng dẫn đăng code lên GitHub

## Bước 1: Tạo repository mới trên GitHub

1. Đăng nhập vào GitHub: https://github.com
2. Click nút **"New"** hoặc **"+"** → **"New repository"**
3. Đặt tên repository (ví dụ: `english-exam-platform`)
4. Chọn **Public** hoặc **Private**
5. **KHÔNG** tích vào "Initialize with README" (vì đã có code sẵn)
6. Click **"Create repository"**

## Bước 2: Khởi tạo Git trong thư mục dự án

Mở PowerShell trong thư mục dự án và chạy:

```powershell
# Đảm bảo đang ở đúng thư mục dự án
cd "C:\Users\Admin\web bai tap kiem tra cho hoc sinh va giao vien"

# Xóa .git cũ nếu có ở thư mục cha
Remove-Item -Path ..\.git -Recurse -Force -ErrorAction SilentlyContinue

# Khởi tạo git repository mới
git init

# Cấu hình git (thay thế bằng thông tin của bạn)
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

## Bước 3: Thêm và commit code

```powershell
# Thêm tất cả file (trừ những file trong .gitignore)
git add .

# Commit code
git commit -m "Initial commit: English Learning & Exam Platform"
```

## Bước 4: Kết nối với GitHub và push

Sau khi tạo repository trên GitHub, bạn sẽ thấy URL. Ví dụ: `https://github.com/username/english-exam-platform.git`

```powershell
# Thêm remote repository (thay URL bằng URL của bạn)
git remote add origin https://github.com/username/english-exam-platform.git

# Đổi tên branch thành main (nếu cần)
git branch -M main

# Push code lên GitHub
git push -u origin main
```

## Lưu ý quan trọng

### File .gitignore đã được cấu hình để loại trừ:
- `node_modules/` - Dependencies
- `.env` - Environment variables (chứa thông tin nhạy cảm)
- `dist/`, `build/` - Build outputs
- `.vscode/` - IDE settings
- Các file log và cache

### Trước khi push, đảm bảo:
1. ✅ File `.env` đã được loại trừ (không commit lên GitHub)
2. ✅ Không có thông tin nhạy cảm trong code
3. ✅ README.md đã được cập nhật

### Nếu gặp lỗi "Permission denied":
- Kiểm tra quyền truy cập thư mục
- Chạy PowerShell với quyền Administrator
- Hoặc bỏ qua các file/thư mục bị lỗi bằng cách thêm vào .gitignore

### Nếu cần xác thực GitHub:
- GitHub có thể yêu cầu Personal Access Token thay vì password
- Tạo token tại: https://github.com/settings/tokens
- Sử dụng token khi được hỏi password

## Các lệnh hữu ích khác

```powershell
# Xem trạng thái git
git status

# Xem các file đã được add
git status --short

# Xem log commit
git log --oneline

# Xem remote repository
git remote -v

# Thay đổi remote URL (nếu cần)
git remote set-url origin https://github.com/username/new-repo.git
```


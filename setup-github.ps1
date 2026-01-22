# Script để setup Git và push lên GitHub
# Chạy script này trong thư mục dự án

Write-Host "=== Setup Git Repository ===" -ForegroundColor Green
Write-Host ""

# Kiểm tra xem đã có .git chưa
if (Test-Path ".git") {
    Write-Host "Git repository đã tồn tại." -ForegroundColor Yellow
    $continue = Read-Host "Bạn có muốn xóa và tạo lại? (y/n)"
    if ($continue -eq "y" -or $continue -eq "Y") {
        Remove-Item -Path ".git" -Recurse -Force
        Write-Host "Đã xóa .git cũ" -ForegroundColor Green
    } else {
        Write-Host "Giữ nguyên repository hiện tại" -ForegroundColor Yellow
    }
}

# Khởi tạo git repository
if (-not (Test-Path ".git")) {
    Write-Host "Đang khởi tạo Git repository..." -ForegroundColor Cyan
    git init
    Write-Host "✓ Đã khởi tạo Git repository" -ForegroundColor Green
}

# Cấu hình git user (nếu chưa có)
$gitUser = git config user.name
if (-not $gitUser) {
    Write-Host ""
    Write-Host "Cấu hình Git user:" -ForegroundColor Cyan
    $name = Read-Host "Nhập tên của bạn"
    $email = Read-Host "Nhập email của bạn"
    git config user.name $name
    git config user.email $email
    Write-Host "✓ Đã cấu hình Git user" -ForegroundColor Green
}

# Add files
Write-Host ""
Write-Host "Đang thêm files vào Git..." -ForegroundColor Cyan
git add .
Write-Host "✓ Đã thêm files" -ForegroundColor Green

# Commit
Write-Host ""
Write-Host "Đang commit code..." -ForegroundColor Cyan
$commitMessage = Read-Host "Nhập commit message (hoặc Enter để dùng mặc định)"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Initial commit: English Learning & Exam Platform"
}
git commit -m $commitMessage
Write-Host "✓ Đã commit code" -ForegroundColor Green

# Setup remote
Write-Host ""
Write-Host "=== Setup GitHub Remote ===" -ForegroundColor Green
Write-Host "Bạn cần tạo repository trên GitHub trước:" -ForegroundColor Yellow
Write-Host "1. Vào https://github.com/new" -ForegroundColor White
Write-Host "2. Tạo repository mới" -ForegroundColor White
Write-Host "3. Copy URL của repository (ví dụ: https://github.com/username/repo-name.git)" -ForegroundColor White
Write-Host ""

$repoUrl = Read-Host "Nhập URL của GitHub repository (hoặc Enter để bỏ qua)"

if (-not [string]::IsNullOrWhiteSpace($repoUrl)) {
    # Kiểm tra xem đã có remote chưa
    $existingRemote = git remote get-url origin 2>$null
    if ($existingRemote) {
        Write-Host "Đã có remote 'origin': $existingRemote" -ForegroundColor Yellow
        $update = Read-Host "Bạn có muốn cập nhật? (y/n)"
        if ($update -eq "y" -or $update -eq "Y") {
            git remote set-url origin $repoUrl
            Write-Host "✓ Đã cập nhật remote" -ForegroundColor Green
        }
    } else {
        git remote add origin $repoUrl
        Write-Host "✓ Đã thêm remote" -ForegroundColor Green
    }

    # Đổi tên branch thành main
    git branch -M main 2>$null

    # Push
    Write-Host ""
    Write-Host "Đang push code lên GitHub..." -ForegroundColor Cyan
    Write-Host "Lưu ý: Bạn có thể cần nhập username và Personal Access Token" -ForegroundColor Yellow
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Đã push code lên GitHub thành công!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "⚠ Có lỗi xảy ra khi push. Kiểm tra lại:" -ForegroundColor Red
        Write-Host "  - URL repository đúng chưa" -ForegroundColor Yellow
        Write-Host "  - Đã tạo repository trên GitHub chưa" -ForegroundColor Yellow
        Write-Host "  - Có quyền truy cập repository không" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Bạn có thể chạy lại lệnh push sau:" -ForegroundColor Cyan
        Write-Host "  git push -u origin main" -ForegroundColor White
    }
} else {
    Write-Host ""
    Write-Host "Bạn có thể thêm remote sau bằng lệnh:" -ForegroundColor Cyan
    Write-Host "  git remote add origin <URL>" -ForegroundColor White
    Write-Host "  git push -u origin main" -ForegroundColor White
}

Write-Host ""
Write-Host "=== Hoàn tất ===" -ForegroundColor Green


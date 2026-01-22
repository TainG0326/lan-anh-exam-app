# Script de push code len GitHub repository: web-for-teacher-and-student

Write-Host "=== Push Code len GitHub ===" -ForegroundColor Green
Write-Host ""

# Cau hinh Git user (neu chua co)
$gitUser = git config user.name
if (-not $gitUser) {
    Write-Host "Cau hinh Git user:" -ForegroundColor Cyan
    $name = Read-Host "Nhap ten cua ban"
    $email = Read-Host "Nhap email cua ban"
    git config user.name $name
    git config user.email $email
    Write-Host "Da cau hinh Git user" -ForegroundColor Green
    Write-Host ""
}

# Nhap username GitHub
Write-Host "Thong tin GitHub:" -ForegroundColor Cyan
$githubUsername = Read-Host "Nhap username GitHub cua ban"

# Tao URL repository
$repoUrl = "https://github.com/$githubUsername/web-for-teacher-and-student.git"
Write-Host ""
Write-Host "Repository URL: $repoUrl" -ForegroundColor Yellow
Write-Host ""

# Add files
Write-Host "Dang them files vao Git..." -ForegroundColor Cyan
git add .
Write-Host "Da them files" -ForegroundColor Green

# Commit
Write-Host ""
Write-Host "Dang commit code..." -ForegroundColor Cyan
git commit -m "Initial commit: English Learning & Exam Platform"
Write-Host "Da commit code" -ForegroundColor Green

# Them remote
Write-Host ""
Write-Host "Dang them remote repository..." -ForegroundColor Cyan
$existingRemote = git remote get-url origin 2>$null
if ($existingRemote) {
    Write-Host "Da co remote origin: $existingRemote" -ForegroundColor Yellow
    $update = Read-Host "Ban co muon cap nhat? (y/n)"
    if ($update -eq "y" -or $update -eq "Y") {
        git remote set-url origin $repoUrl
        Write-Host "Da cap nhat remote" -ForegroundColor Green
    }
} else {
    git remote add origin $repoUrl
    Write-Host "Da them remote" -ForegroundColor Green
}

# Doi ten branch thanh main
Write-Host ""
Write-Host "Dang doi ten branch thanh main..." -ForegroundColor Cyan
git branch -M main 2>$null
Write-Host "Da doi ten branch" -ForegroundColor Green

# Push
Write-Host ""
Write-Host "Dang push code len GitHub..." -ForegroundColor Cyan
Write-Host "Luu y: Ban se can nhap:" -ForegroundColor Yellow
Write-Host "  - Username: $githubUsername" -ForegroundColor White
Write-Host "  - Password: Personal Access Token (khong phai password GitHub)" -ForegroundColor White
Write-Host ""
Write-Host "Neu chua co Personal Access Token, tao tai:" -ForegroundColor Yellow
Write-Host "  https://github.com/settings/tokens" -ForegroundColor Cyan
Write-Host ""

$confirm = Read-Host "Ban da san sang push? (y/n)"
if ($confirm -eq "y" -or $confirm -eq "Y") {
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Da push code len GitHub thanh cong!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Repository cua ban:" -ForegroundColor Cyan
        Write-Host "  https://github.com/$githubUsername/web-for-teacher-and-student" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "Co loi xay ra khi push." -ForegroundColor Red
        Write-Host ""
        Write-Host "Kiem tra lai:" -ForegroundColor Yellow
        Write-Host "  1. Repository web-for-teacher-and-student da duoc tao tren GitHub chua?" -ForegroundColor White
        Write-Host "  2. Username GitHub dung chua?" -ForegroundColor White
        Write-Host "  3. Da co Personal Access Token chua?" -ForegroundColor White
        Write-Host "  4. Token co quyen repo chua?" -ForegroundColor White
        Write-Host ""
        Write-Host "Ban co the thu lai bang lenh:" -ForegroundColor Cyan
        Write-Host "  git push -u origin main" -ForegroundColor White
    }
} else {
    Write-Host ""
    Write-Host "Da huy. Ban co the chay lai script sau." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Hoan tat ===" -ForegroundColor Green

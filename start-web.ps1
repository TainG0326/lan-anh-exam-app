# Script de chay tat ca cac dich vu web
# Mo 3 cua so terminal rieng biet

$projectPath = "C:\Users\Admin\web bai tap kiem tra cho hoc sinh va giao vien"

# Terminal 1: Backend Server
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectPath\server'; Write-Host 'Starting Backend Server...' -ForegroundColor Green; npm run dev"

# Doi 2 giay
Start-Sleep -Seconds 2

# Terminal 2: Teacher Web
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectPath\teacher-web'; Write-Host 'Starting Teacher Web...' -ForegroundColor Cyan; npm run dev"

# Doi 2 giay
Start-Sleep -Seconds 2

# Terminal 3: Student Web
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectPath\student-web'; Write-Host 'Starting Student Web...' -ForegroundColor Yellow; npm run dev"

Write-Host ""
Write-Host "Da mo 3 cua so terminal:" -ForegroundColor Green
Write-Host "  1. Backend Server (Port 5000)" -ForegroundColor White
Write-Host "  2. Teacher Web (Port 3001)" -ForegroundColor White
Write-Host "  3. Student Web (Port 3002)" -ForegroundColor White
Write-Host ""
Write-Host "Luu y: Dam bao da cau hinh file server/.env voi thong tin Supabase!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Sau khi khoi dong, truy cap:" -ForegroundColor Cyan
Write-Host "  - Teacher Web: http://localhost:3001" -ForegroundColor White
Write-Host "  - Student Web: http://localhost:3002" -ForegroundColor White

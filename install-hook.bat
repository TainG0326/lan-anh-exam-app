@echo off
REM ============================================================
REM install-hook.bat - Cài đặt Git hook để auto backup sau commit
REM ============================================================

echo ============================================================
echo    Git Hook Installer - Auto Backup
echo ============================================================
echo.

REM Lấy đường dẫn project (thư mục hiện tại)
set "PROJECT_ROOT=%~dp0"
set "PROJECT_ROOT=%PROJECT_ROOT:~0,-1%"

REM Tạo thư mục hooks nếu chưa có
if not exist "%PROJECT_ROOT%\.git\hooks" (
    mkdir "%PROJECT_ROOT%\.git\hooks"
)

REM Copy post-commit hook
echo Dang cai dat post-commit hook...
copy /Y "%PROJECT_ROOT%\.git\hooks\post-commit" "%PROJECT_ROOT%\.git\hooks\post-commit.bak" >nul 2>&1
copy /Y "%PROJECT_ROOT%\.git\hooks\post-commit" "%PROJECT_ROOT%\.git\hooks\post-commit" >nul 2>&1

if exist "%PROJECT_ROOT%\.git\hooks\post-commit" (
    echo [OK] Da cai dat post-commit hook thanh cong!
    echo.
    echo Hook se tu dong chay backup sau moi lan commit.
) else (
    echo [LOI] Khong the cai dat hook!
    echo.
    echo Vui long copy file post-commit thu cong vao:
    echo   %PROJECT_ROOT%\.git\hooks\
)

echo.
echo ============================================================
echo    Hoan tat cai dat!
echo ============================================================
pause

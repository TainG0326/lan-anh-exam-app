param(
    [switch]$Auto,
    [switch]$CleanOld,
    [string]$DateFormat = "yyyy-MM-dd_HH-mm-ss"
)

$ErrorActionPreference = "Continue"
$ProjectRoot = "C:\Users\Admin\teacher_and_student"
$BackupRoot = "$ProjectRoot\backup-auto"
$LogFile = "$ProjectRoot\backup-auto\backup-log.txt"

$DirsToBackup = @("teacher-web\src", "server\src")

$ImportantFiles = @(
    "teacher-web\src\components\AIMagicImportModal.tsx",
    "teacher-web\src\components\CreateAssignmentModal.tsx",
    "teacher-web\src\components\BookLoader.tsx",
    "teacher-web\src\components\Logo.tsx",
    "teacher-web\src\services\aiImportService.ts",
    "teacher-web\src\pages\CreateAssignment.tsx",
    "teacher-web\src\pages\CreateExam.tsx",
    "teacher-web\src\pages\Login.tsx",
    "teacher-web\src\index.css",
    "server\src\index.ts",
    "server\src\middleware\auth.ts",
    "server\package.json",
    "server\package-lock.json"
)

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    Write-Host $logMessage
    Add-Content -Path $LogFile -Value $logMessage -Encoding UTF8
}

function Create-BackupDir {
    param([string]$BackupPath)
    if (-not (Test-Path $BackupPath)) {
        New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null
    }
}

function Backup-File {
    param([string]$Source, [string]$Dest)
    if (Test-Path $Source) {
        $destDir = Split-Path $Dest -Parent
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        Copy-Item -Path $Source -Destination $Dest -Force
        return $true
    }
    return $false
}

function Clean-OldBackups {
    param([string]$Root, [int]$KeepCount = 2)

    Write-Log "Dang don dep cac ban backup cu (giu lai $KeepCount phien ban gan nhat)..."

    $backupDirs = Get-ChildItem -Path $Root -Directory | Where-Object { $_.Name -match "^\d{4}-\d{2}-\d{2}" } | Sort-Object Name -Descending

    if ($backupDirs.Count -le $KeepCount) {
        Write-Log "Chi co $($backupDirs.Count) ban backup, khong can xoa."
        return
    }

    $toDelete = $backupDirs | Select-Object -Skip $KeepCount
    foreach ($dir in $toDelete) {
        Write-Log "Xoa ban backup cu: $($dir.Name)"
        Remove-Item -Path $dir.FullName -Recurse -Force
    }

    Write-Log "Da xoa $($toDelete.Count) ban backup cu."
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   BACKUP TU DON - Teacher & Student" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $ProjectRoot)) {
    Write-Host "LOI: Khong tim thay thu muc project!" -ForegroundColor Red
    exit 1
}

Create-BackupDir $BackupRoot

$backupTimestamp = Get-Date -Format $DateFormat
$backupDir = "$BackupRoot\$backupTimestamp"

Write-Log "=========================================="
Write-Log "BAT DAU BACKUP: $backupTimestamp"
Write-Log "=========================================="

$backedUpCount = 0
$failedCount = 0

Write-Host ""
Write-Host "Dang sao luu cac file quan trong..." -ForegroundColor Yellow

foreach ($file in $ImportantFiles) {
    $sourcePath = Join-Path $ProjectRoot $file
    $destPath = Join-Path $backupDir $file
    
    if (Test-Path $sourcePath) {
        $relativePath = $file.Replace('\', '/')
        if (Backup-File -Source $sourcePath -Dest $destPath) {
            Write-Log "OK: $relativePath"
            $backedUpCount++
        } else {
            Write-Log "LOI: Khong the copy $relativePath"
            $failedCount++
        }
    } else {
        Write-Log "BO QUA: $file (khong ton tai)"
    }
}

$metadataContent = @"
Backup Date: $backupTimestamp
Computer: $env:COMPUTERNAME
User: $env:USERNAME

Files Backed Up: $backedUpCount
Failed: $failedCount

Files Included:
$($ImportantFiles -join "`n")
"@

$metadataPath = "$backupDir\metadata.txt"
Set-Content -Path $metadataPath -Value $metadataContent -Encoding UTF8

if ($CleanOld) {
    Clean-OldBackups -BackupRoot $BackupRoot -KeepCount 2
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "   KET QUA BACKUP" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host "Thu muc backup: $backupDir" -ForegroundColor White
Write-Host "File da backup: $backedUpCount" -ForegroundColor Green
Write-Host "File that bai: $failedCount" -ForegroundColor $(if ($failedCount -gt 0) { "Red" } else { "Green" })
Write-Host "Log file: $LogFile" -ForegroundColor Gray
Write-Host ""

Write-Log "=========================================="
Write-Log "HOAN TAT: $backedUpCount files backed up"
Write-Log "=========================================="

if ($failedCount -gt 0) {
    exit 1
}
exit 0

# Teacher Web monorepo deploy - chạy từ root repo
# Push teacher-web changes to GitHub -> Render auto deploy
cd C:\Users\Admin\teacher_and_student
git add teacher-web/
git commit -m "Update teacher-web - auto deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
git push origin main

# Backup Directory Structure

Thư mục này chứa các file backup được di chuyển từ các project `teacher-web`, `student-web`, và `server`.

## Cấu trúc thư mục

```
backup/
├── teacher-web/
│   ├── auth/           # Các file liên quan đến xác thực
│   ├── components/     # Các component UI đã backup
│   ├── login/          # Các file liên quan đến trang đăng nhập
│   ├── pages/          # Các page đã backup
│   ├── services/       # Các service đã backup
│   └── other/          # Các file khác
├── student-web/
│   ├── auth/           # Các file liên quan đến xác thực
│   ├── components/     # Các component UI đã backup
│   ├── pages/          # Các page đã backup
│   ├── services/       # Các service đã backup
│   └── other/          # Các file khác
└── server/             # Backup cho server (nếu có)
```

## Danh sách file đã backup

### teacher-web/

| File | Mô tả | Ngày backup |
|------|-------|-------------|
| `auth/AuthContext.backup.tsx` | AuthContext component | 2026-04-11 |
| `components/AIMagicImportModal.backup.tsx` | AI Magic Import Modal | 2026-04-11 |
| `components/BookLoader.backup.tsx` | Book Loader component | 2026-04-11 |
| `components/branding.ts` | Branding configuration | 2026-04-11 |
| `components/LanguageContext.tsx` | Language Context | 2026-04-11 |
| `components/LanguageSwitcher.tsx` | Language Switcher | 2026-04-11 |
| `components/Logo.tsx` | Logo component | 2026-04-11 |
| `login/Login.backup.tsx` | Login page | 2026-04-11 |
| `pages/CreateAssignment.tsx` | Create Assignment page | 2026-04-11 |
| `pages/CreateAssignmentModal.tsx` | Create Assignment Modal | 2026-04-11 |
| `pages/CreateExam.tsx` | Create Exam page | 2026-04-11 |
| `services/aiImportService.backup.ts` | AI Import Service | 2026-04-11 |
| `other/index.css` | CSS styles | 2026-04-11 |

### student-web/

| File | Mô tả | Ngày backup |
|------|-------|-------------|
| `auth/AuthCallback.backup.tsx` | Auth Callback page | 2026-04-11 |
| `components/AvatarModal.backup.tsx` | Avatar Modal | 2026-04-11 |
| `components/BookLoader.backup.tsx` | Book Loader component | 2026-04-11 |
| `components/ConfirmDialog.backup.tsx` | Confirm Dialog | 2026-04-11 |
| `pages/AccountConfirmed.backup.tsx` | Account Confirmed page | 2026-04-11 |
| `pages/ExamRoom.backup.tsx` | Exam Room page | 2026-04-11 |
| `pages/VerifyEmail.backup.tsx` | Verify Email page | 2026-04-11 |
| `services/notificationService.backup.ts` | Notification Service | 2026-04-11 |
| `services/supabase.backup.ts` | Supabase configuration | 2026-04-11 |
| `other/UI_UX_DESIGN_SYSTEM.md.bak.2026-03-20.backup` | UI/UX Design System docs | 2026-04-11 |

## Quy tắc Backup

1. **Tối đa 2 phiên bản backup** cho mỗi file:
   - `filename.backup.ts`: Phiên bản mới nhất
   - `filename.backup-prev.ts`: Phiên bản trước đó

2. **Khi cần rollback:**
   - Copy file từ thư mục backup vào project gốc
   - Đổi tên lại (bỏ hậu tố .backup)

3. **Dọn dẹp định kỳ:**
   - Kiểm tra và xóa các backup không còn cần thiết
   - Giữ lại các backup quan trọng trước khi thay đổi lớn

## Lưu ý

- Các file trong thư mục này **KHÔNG** được deploy lên production
- Chỉ sử dụng khi cần rollback hoặc tham khảo code cũ
- Sau khi xác nhận hoạt động ổn định, có thể xóa các backup cũ

---

Backup created: 2026-04-11

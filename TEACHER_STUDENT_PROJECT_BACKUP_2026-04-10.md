# PROJECT BACKUP - Lan Anh English Learning Platform
**Ngày backup:** 2026-04-10  
**Trạng thái:** Đầy đủ source code của teacher-web, student-web, server

---

## MỤC LỤC
1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [TEACHER WEB - Chi tiết](#2-teacher-web---chi-tiết)
3. [STUDENT WEB - Chi tiết](#3-student-web---chi-tiết)
4. [SERVER (Backend API)](#4-server-backend-api)
5. [Database Models](#5-database-models)
6. [Branding & UI/UX](#6-branding--uiux)
7. [AI Import Feature](#7-ai-import-feature)
8. [Authentication & Security](#8-authentication--security)

---

## 1. TỔNG QUAN KIẾN TRÚC

```
teacher_and_student/
├── teacher-web/          # React + Vite + TypeScript + TailwindCSS
│   ├── src/
│   │   ├── pages/      # 17 pages
│   │   ├── components/ # 11 components
│   │   ├── services/   # 8 services
│   │   ├── context/     # 2 contexts
│   │   └── constants/   # branding
│   └── public/         # images, backgrounds
│
├── student-web/         # React + Vite + TypeScript + TailwindCSS
│   ├── src/
│   │   ├── pages/      # 14+ pages
│   │   ├── components/ # Layout, Logo, etc.
│   │   ├── services/   # API services
│   │   └── context/     # AuthContext, LanguageContext
│   └── public/
│
└── server/             # Node.js + Express + TypeScript
    └── src/
        ├── routes/     # 7 route files
        ├── controllers/# 5 controllers
        ├── database/    # 8 database models (Supabase)
        ├── middleware/  # auth middleware
        └── services/    # otpService
```

### Hosting
| Project | Hosting | Deploy Method |
|---|---|---|
| server | Render | git push → auto deploy |
| teacher-web | Vercel | `npx vercel --prod` |
| student-web | Vercel | `npx vercel --prod` |

---

## 2. TEACHER WEB - Chi tiết

### 2.1 Pages (17 pages)

| Page | Đường dẫn | Mô tả |
|---|---|---|
| `Login.tsx` | `/login` | Đăng nhập (không có đăng ký, không có language switcher) |
| `AuthCallback.tsx` | `/auth/callback` | OAuth callback (Google) |
| `Dashboard.tsx` | `/` | Tổng quan với stats, classes, exams |
| `Classes.tsx` | `/classes` | Danh sách lớp học |
| `ClassDetail.tsx` | `/classes/:id` | Chi tiết lớp học, danh sách học sinh |
| `CreateClass.tsx` | `/classes/create` | Form tạo lớp học mới |
| `Exams.tsx` | `/exams` | Danh sách tất cả bài thi |
| `CreateExam.tsx` | `/exams/create` | Form tạo bài thi + AI import |
| `ExamResults.tsx` | `/exams/:examId/results` | Kết quả bài thi, violations |
| `Assignments.tsx` | `/assignments` | Danh sách bài tập |
| `CreateAssignment.tsx` | `/assignments/create` | Form tạo bài tập + AI import |
| `Gradebook.tsx` | `/gradebook` | Bảng điểm (coming soon) |
| `Profile.tsx` | `/profile` | Thông tin cá nhân, đổi mật khẩu, avatar |
| `ResetPassword.tsx` | `/reset-password` | Quên mật khẩu với OTP |

### 2.2 Components

| Component | Mô tả |
|---|---|
| `Layout.tsx` | Sidebar + Header, responsive, dark sidebar |
| `Logo.tsx` | Logo Lan Anh |
| `AIMagicImportModal.tsx` | Modal AI import với drag-drop, multi-file |
| `BookLoader.tsx` | Loading animation dạng sách lật |
| `AvatarModal.tsx` | Modal upload/remove avatar |
| `ClassCard.tsx` | Card hiển thị lớp học |
| `MemberProfileModal.tsx` | Modal xem profile học sinh |
| `ClassSettings.tsx` | Modal cài đặt lớp (khóa, đổi tên) |
| `CreateAssignmentModal.tsx` | Modal tạo bài tập (dark theme) |
| `GlassCard.tsx` | Card với glassmorphism effect |
| `SoftCard.tsx` | Soft card component |
| `LanguageSwitcher.tsx` | Đổi ngôn ngữ |

### 2.3 Services

| Service | Mô tả |
|---|---|
| `authService.ts` | login, logout, register, verifyOTP, 2FA, avatar |
| `api.ts` | Axios instance, interceptors, auth headers |
| `examService.ts` | CRUD exams, results |
| `classService.ts` | CRUD classes, add students |
| `assignmentService.ts` | CRUD assignments, submissions |
| `aiImportService.ts` | Import files cho AI (Claude Vision) |
| `questionParserService.ts` | Parse câu hỏi từ file |
| `supabase.ts` | Supabase client cho OAuth Google |

### 2.4 Features chính

#### Authentication
- Email/password login (không đăng ký - admin cấp tài khoản)
- Google OAuth (Supabase)
- 2FA với QR code (authenticator app)
- JWT tokens với refresh token
- Session expiry redirect

#### Class Management
- Tạo lớp với grade (THCS/THPT) + level (6-12)
- Auto-generate class code
- Copy class code/link
- Xem danh sách học sinh
- Khóa/mở lớp

#### Exam Management
- Tạo bài thi với questions
- Question types: multiple-choice, fill-blank, reading-comprehension
- Shuffle questions/options
- Schedule (start/end time)
- Duration timer
- Require webcam option
- Auto-submit khi hết giờ
- Xem kết quả với violations

#### AI Smart Import
- Drag & drop multi-file (JPG, PNG, PDF, DOCX)
- Select folder
- Claude Vision AI parse images → questions
- Review & edit extracted questions
- Batch import (nhiều ảnh cùng lúc)
- Timeout handling (180s)
- Cold start warning

#### Assignments
- Tạo bài tập với questions
- Due date
- AI import support
- Xem danh sách và submissions

#### Profile
- Upload avatar (camera/gallery)
- Đổi name, phone, dateOfBirth
- Đổi mật khẩu (current password required)
- Toggle notifications
- Tabbed UI (Personal/Security/Preferences)

---

## 3. STUDENT WEB - Chi tiết

### 3.1 Pages

| Page | Đường dẫn | Mô tả |
|---|---|---|
| `Login.tsx` | `/login` | Login + Register (có đăng ký) |
| `Dashboard.tsx` | `/` | Tổng quan, upcoming assignments, exams |
| `Courses.tsx` | `/courses` | Lớp học đã tham gia |
| `Exams.tsx` | `/exams` | Danh sách bài thi, enter code |
| `TakeExam.tsx` | `/exams/take/:code` | Làm bài thi cơ bản |
| `ExamRoom.tsx` | `/exams/room/:code` | Phòng thi giám sát |
| `ExamResult.tsx` | `/exams/result/:id` | Kết quả bài thi |
| `Assignments.tsx` | `/assignments` | Danh sách bài tập |
| `Grades.tsx` | `/grades` | Xem điểm |
| `Profile.tsx` | `/profile` | Hồ sơ cá nhân |
| `JoinClass.tsx` | `/join-class` | Tham gia lớp bằng mã |
| `Notifications.tsx` | `/notifications` | Thông báo |
| `ForgotPassword.tsx` | `/forgot-password` | Quên mật khẩu |
| `VerifyEmail.tsx` | `/verify-email` | Xác thực email |
| `AccountConfirmed.tsx` | `/account-confirmed` | Xác nhận tài khoản |

### 3.2 Features chính

#### Authentication
- Login/Register
- Google OAuth
- Forgot password với OTP
- Email verification

#### Exam Taking
- Enter exam code để vào thi
- Real-time timer
- Auto-submit khi hết giờ
- Webcam capture (định kỳ)
- Fullscreen enforcement
- Anti-cheating:
  - Block right-click
  - Block copy/paste
  - Tab switch detection
  - Violation logging
  - Auto-flag khi nhiều violations

#### Classes
- Join class bằng mã
- Xem lớp đã tham gia
- Xem bài thi/bài tập của lớp

---

## 4. SERVER (Backend API)

### 4.1 Routes

| Route File | Endpoint Prefix | Mô tả |
|---|---|---|
| `authRoutes.ts` | `/api/auth` | login, register, google-login, verifyOTP, 2FA, profile |
| `classRoutes.ts` | `/api/classes` | CRUD classes, add students |
| `examRoutes.ts` | `/api/exams` | CRUD exams, attempts, violations |
| `assignmentRoutes.ts` | `/api/assignments` | CRUD assignments, submissions |
| `aiImportRoutes.ts` | `/api/ai` | AI import files (Claude Vision) |
| `questionParserRoutes.ts` | `/api/questions` | Parse questions từ file |
| `notificationRoutes.ts` | `/api/notifications` | Notifications CRUD |

### 4.2 Controllers

| Controller | Mô tả |
|---|---|
| `authController.ts` | Auth logic, 2FA, JWT generation |
| `classController.ts` | Class CRUD, student management |
| `examController.ts` | Exam CRUD, attempt tracking, grading |
| `assignmentController.ts` | Assignment CRUD, grading |
| `questionParserController.ts` | AI question extraction |

### 4.3 Key API Endpoints

```
POST /api/auth/login
POST /api/auth/google-login
POST /api/auth/register
POST /api/auth/verify-login-otp
POST /api/auth/request-2fa
PUT  /api/auth/profile
POST /api/auth/avatar
POST /api/auth/forgot-password
POST /api/auth/reset-password

GET  /api/classes
POST /api/classes
GET  /api/classes/:id
POST /api/classes/:id/students

GET  /api/exams
POST /api/exams
GET  /api/exams/:id/results
GET  /api/exams/code/:code

POST /api/ai/import (single file)
POST /api/ai/import-batch (multiple files)
```

---

## 5. DATABASE MODELS

### Supabase (PostgreSQL)

#### users
- id, email, password (hashed), name, role
- avatar_url, phone, date_of_birth
- two_factor_enabled, two_factor_secret, two_factor_verified
- student_id, class_id

#### classes
- id, name, grade, level, class_code
- teacher_id, is_locked

#### class_students
- class_id, student_id, joined_at

#### exams
- id, title, description, exam_code
- class_id, teacher_id
- questions (JSONB array)
- start_time, end_time, duration
- shuffle_questions, shuffle_options
- require_webcam, auto_submit
- status (draft/active/completed)

#### exam_attempts
- id, exam_id, student_id
- answers (JSONB), score
- started_at, submitted_at
- auto_submitted, violations (JSONB)
- flagged, flagged_reason, reviewed
- time_spent

#### assignments
- id, title, description
- class_id, teacher_id
- questions (JSONB array)
- due_date, total_points

#### submissions
- id, assignment_id, student_id
- answers (JSONB)
- score, graded, feedback
- submitted_at

#### notifications
- id, user_id, type, title, message, link, read

#### email_whitelist
- id, email, name, role, is_active

---

## 6. BRANDING & UI/UX

### Logo & Backgrounds
```typescript
// teacher-web/src/constants/branding.ts
TEACHER_LOGO_SRC = '/Học viện Anh ngữ Lan Anh.png'
TEACHER_LOGIN_BG_DESKTOP = '/login-backround for desktop.png'
TEACHER_LOGIN_BG_MOBILE = '/login-backround for mobile.png'
```

### Color Theme
- Primary: `#5F8D78` (green)
- Primary Hover: `#4A6F5E`
- Success: `#10b981`
- Error: `#ef4444`
- Text Primary: `#1e293b`
- Text Secondary: `#64748b`
- Background: `#f8fafc`
- Border: `#e2e8f0`

### Design System
- TailwindCSS
- Framer Motion animations
- Lucide React icons
- Glassmorphism cards (teacher-web)
- Dark theme sidebar
- Responsive (mobile-first)

---

## 7. AI IMPORT FEATURE

### Technology
- Claude Vision API (anthropic/claude-3-haiku)
- Supabase Storage (file uploads)
- Image preprocessing (resize, quality)

### Flow
1. User drag & drop files (JPG, PNG, PDF, DOCX)
2. Frontend: Preview files, validate
3. Backend: Upload to Supabase Storage
4. Backend: Call Claude Vision API
5. Backend: Parse response → questions JSON
6. Frontend: Review & edit questions
7. Frontend: Import to exam/assignment

### Question Format
```typescript
interface AIQuestion {
  question: string;
  type: 'multiple-choice';
  options: string[];
  correctAnswer: string;
  points: number;
  explanation?: string;
}
```

### Timeout Handling
- Single file: 180s
- Batch: 180s × (files/5) rounded up
- Cold start warning message
- Retry logic

---

## 8. AUTHENTICATION & SECURITY

### JWT Structure
```typescript
{
  id: user.id,
  email: user.email,
  role: user.role
}
```

### 2FA Flow
1. User login → server returns tempToken + QR code
2. User scans QR with authenticator app
3. User enters 6-digit OTP
4. Server verifies → returns real JWT token

### Security Features
- HttpOnly cookies (production)
- Token refresh mechanism
- Password hashing (bcrypt, 12 rounds)
- Supabase RLS policies
- CORS configuration
- Input validation

### Environment Variables
```
# Server
JWT_SECRET
JWT_REFRESH_SECRET
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY

# Teacher Web
VITE_API_URL
VITE_AI_IMPORT_TIMEOUT_MS
```

---

## Lưu ý quan trọng

1. **Teacher web không có đăng ký** - Admin tạo tài khoản, cấp email cho giáo viên
2. **Student web có đăng ký** - Học sinh tự đăng ký
3. **AI Import cần API key** - Claude Vision API key cần được cấu hình
4. **Supabase Storage** - Cần bucket cho avatar và file uploads
5. **Render cold start** - Server có thể chậm khi không active

---

## File cấu hình quan trọng

```
teacher-web/
├── .env                    # VITE_API_URL, VITE_AI_IMPORT_TIMEOUT_MS
├── vite.config.ts          # Vite config
├── tailwind.config.js      # Theme colors
├── vercel.json             # Vercel config

server/
├── .env                    # JWT_SECRET, SUPABASE_*, ANTHROPIC_API_KEY
├── tsconfig.json
├── package.json

student-web/
├── .env                    # VITE_API_URL
├── vite.config.ts
├── tailwind.config.js
├── vercel.json
```

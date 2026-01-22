# Lockdown Browser Upgrade Guide

## Tổng quan

Hệ thống đã được nâng cấp từ Web thông thường lên mô hình **Electron Lockdown Shell** tương tự Safe Exam Browser, với chi phí 0đ.

## Kiến trúc mới

### 1. Electron Lockdown Desktop App

**Location**: `electron-app/`

**Files**:
- `main.js` - Main process với lockdown logic
- `preload.js` - Preload script cho security
- `package.json` - Dependencies

**Tính năng**:
- ✅ Chặn phím tắt hệ thống (Alt+Tab, Win+D, Cmd+Tab, Ctrl+Alt+Del)
- ✅ Chặn screenshot với `setContentProtection(true)`
- ✅ Phát hiện Virtual Machine qua WebGL vendor
- ✅ Kiosk mode (fullscreen bắt buộc)
- ✅ Chặn navigation đến external URLs
- ✅ Chặn mở DevTools

### 2. Browser Exam Key (BEK) Middleware

**Location**: `server/src/middleware/bekAuth.ts`

**Cách hoạt động**:
- Mỗi request từ Electron app phải có header `X-Lockdown-Hash`
- Hash = `SHA256(URL + SECRET_KEY + Exam_ID)`
- Backend tính toán lại hash và so sánh
- Nếu không khớp → 403 Forbidden

**Áp dụng cho**:
- `/api/exams/start`
- `/api/exams/submit-answer`
- `/api/exams/submit`
- `/api/exams/violation`

### 3. HttpOnly Cookie Authentication

**Thay đổi**:
- ❌ **Cũ**: Token lưu trong `localStorage`
- ✅ **Mới**: Access Token và Refresh Token trong HttpOnly Cookie

**Cấu hình Cookie**:
```typescript
{
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // HTTPS only
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
}
```

**Lợi ích**:
- Bảo mật hơn (không thể truy cập từ JavaScript)
- Tự động refresh token khi hết hạn
- Giảm nguy cơ XSS attacks

### 4. IndexedDB Offline Storage

**Location**: `student-web/src/utils/offlineStorage.ts`

**Tính năng**:
- Lưu trữ tạm thời câu trả lời khi mất mạng
- Mã hóa dữ liệu với AES
- Tự động sync khi có mạng lại
- Network monitoring (online/offline events)

**API**:
- `saveAnswerOffline(examId, questionId, answer)` - Lưu câu trả lời
- `getUnsyncedAnswers(examId)` - Lấy câu trả lời chưa sync
- `syncOfflineAnswers(examId, syncFunction)` - Đồng bộ lên server
- `setupNetworkMonitoring(onOnline, onOffline)` - Monitor network

### 5. AI Monitoring với TensorFlow.js

**Location**: `student-web/src/utils/aiMonitoring.ts`

**Tính năng**:
- Phát hiện nhiều khuôn mặt (multiple faces)
- Phát hiện học sinh quay đi (no face)
- Phát hiện thay đổi hướng mặt (face movement)
- Chạy hoàn toàn trên client (không tốn server)

**Violation Types**:
- `multiple_faces` - Severity: 3 (High)
- `no_face` - Severity: 2 (Medium)
- `face_movement` - Severity: 1 (Low)

**Flag & Review System**:
- Không force submit ngay lập tức
- AI đánh dấu (flag) các đoạn nghi vấn
- Giáo viên xem lại (review) và quyết định

### 6. Supabase Storage cho Avatar

**Location**: `server/src/utils/supabaseStorage.ts`

**Thay đổi**:
- ❌ **Cũ**: Lưu avatar trong `server/uploads/avatars/`
- ✅ **Mới**: Upload lên Supabase Storage bucket `avatars`

**Lợi ích**:
- Không mất file khi deploy
- CDN tự động
- Dễ scale

## Cài đặt

### 1. Cài đặt Dependencies

**Backend**:
```bash
cd server
npm install cookie-parser
```

**Student Web**:
```bash
cd student-web
npm install @tensorflow/tfjs @tensorflow-models/blazeface crypto-js
```

**Electron App**:
```bash
cd electron-app
npm install
```

### 2. Cấu hình Environment Variables

**Backend** (`server/.env`):
```env
# Existing...
PORT=5000
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# New for Lockdown
EXAM_SECRET_KEY=your-exam-secret-key-for-bek
FRONTEND_URL=http://localhost:3002

# Supabase Storage
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Tạo Supabase Storage Bucket

Trong Supabase Dashboard:
1. Vào **Storage**
2. Tạo bucket mới: `avatars`
3. Set **Public**: `true`
4. Set **File size limit**: `5MB`
5. Set **Allowed MIME types**: `image/*`

Hoặc chạy SQL:
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);
```

### 4. Cập nhật Database Schema

Thêm columns mới vào `exam_attempts`:
```sql
ALTER TABLE exam_attempts 
ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flagged_reason TEXT,
ADD COLUMN IF NOT EXISTS reviewed BOOLEAN DEFAULT false;
```

## Sử dụng

### 1. Chạy Electron Lockdown App

**Development**:
```bash
cd electron-app
npm run dev
```

**Production Build**:
```bash
cd electron-app
npm run build
```

**Launch với Exam URL**:
```bash
electron . --exam-url=http://localhost:3002/exams/take/ABC123
```

### 2. Flow đăng nhập mới (Inside-Out)

1. Học sinh mở **Exam Lockdown App**
2. App tự động vào Kiosk mode
3. Màn hình Login hiển thị BÊN TRONG app
4. Đăng nhập → Token lưu trong HttpOnly Cookie
5. Bắt đầu làm bài → BEK hash được tự động thêm vào mọi request

### 3. Offline Mode

Khi mất mạng:
1. Học sinh vẫn có thể làm bài
2. Câu trả lời tự động lưu vào IndexedDB (mã hóa)
3. Khi có mạng lại → Tự động sync lên server

### 4. AI Monitoring

1. Khi bắt đầu exam → Request webcam permission
2. TensorFlow.js BlazeFace tự động load
3. Monitor ở 2 FPS (mỗi 500ms)
4. Phát hiện violations → Gửi flag lên backend
5. Giáo viên xem flags trong Exam Results

## API Endpoints mới

### Review Flagged Attempt
```
POST /api/exams/review-flagged
Body: { attemptId, action: 'approve' | 'reject' }
Authorization: Teacher only
```

## Migration từ localStorage sang Cookie

**Frontend không cần thay đổi code** - API tự động set cookie và vẫn trả về token trong response (cho backward compatibility với Electron).

**Electron App** có thể:
- Sử dụng cookie (tự động)
- Hoặc lấy token từ response và set vào header (backward compatibility)

## Security Notes

1. **BEK Secret Key**: Phải giữ bí mật, không commit lên git
2. **Cookie Security**: Chỉ hoạt động với HTTPS trong production
3. **VM Detection**: Có thể bypass bằng cách tắt WebGL, nhưng vẫn là một lớp bảo vệ
4. **AI Monitoring**: Chạy trên client, không tốn server resources

## Troubleshooting

### Electron App không chặn phím tắt
- Kiểm tra `globalShortcut.register()` có được gọi
- Một số phím tắt hệ thống không thể chặn hoàn toàn (như Ctrl+Alt+Del trên Windows)

### BEK Hash không khớp
- Kiểm tra `EXAM_SECRET_KEY` giống nhau ở client và server
- Kiểm tra URL trong hash calculation
- Kiểm tra Exam ID có đúng không

### Cookie không được set
- Kiểm tra `credentials: true` trong CORS config
- Kiểm tra `sameSite: 'strict'` có phù hợp với domain không
- Kiểm tra HTTPS trong production

### IndexedDB không hoạt động
- Kiểm tra browser support
- Kiểm tra permissions
- Xem console logs

### TensorFlow.js model không load
- Kiểm tra internet connection (lần đầu load model)
- Model sẽ cache sau lần đầu
- Kiểm tra console logs

## Next Steps

1. ✅ Electron Lockdown App
2. ✅ BEK Middleware
3. ✅ HttpOnly Cookies
4. ✅ IndexedDB Offline Storage
5. ✅ Supabase Storage
6. ✅ AI Monitoring
7. ✅ Flag & Review System

## Testing Checklist

- [ ] Electron app chặn được phím tắt
- [ ] Screenshot bị chặn
- [ ] VM detection hoạt động
- [ ] BEK hash validation hoạt động
- [ ] HttpOnly cookies được set
- [ ] Token refresh tự động
- [ ] Offline storage lưu được answers
- [ ] Auto sync khi có mạng
- [ ] AI monitoring phát hiện violations
- [ ] Flag & Review system hoạt động
- [ ] Avatar upload lên Supabase Storage




# Hướng dẫn Kết nối và Sử dụng Hệ thống

## 🎯 Tổng quan

Hệ thống bao gồm 3 thành phần chính:
- **Backend Server** (Port 5000): API server xử lý logic
- **Teacher Web** (Port 3001): Giao diện cho giáo viên
- **Student Web** (Port 3002): Giao diện cho học sinh

## 🔗 Các Tính năng Kết nối

### 1. **Teacher tạo Class → Student join Class**

**Flow:**
1. Teacher đăng nhập vào Teacher Web (http://localhost:3001)
2. Vào "My Classes" → Click "Create Class"
3. Điền thông tin: Tên lớp, Cấp học (THCS/THPT), Lớp (6, 7, 8, 9, 10, 11, 12)
4. Hệ thống tự động tạo **Class Code** (6 ký tự, VD: ABC123)
5. Teacher chia sẻ Class Code cho học sinh

**Student join:**
1. Student đăng nhập vào Student Web (http://localhost:3002)
2. Vào "Join Class" hoặc click "Join Class" trong sidebar
3. Nhập Class Code do teacher cung cấp
4. Click "Join" → Hệ thống tự động thêm student vào class

**API Endpoints:**
- `POST /api/classes` - Teacher tạo class
- `POST /api/classes/join` - Student join class bằng code
- `GET /api/classes` - Teacher xem danh sách classes
- `GET /api/classes/code/:code` - Lấy thông tin class bằng code

### 2. **Teacher tạo Exam → Student thấy và làm Exam**

**Flow:**
1. Teacher vào "Exams" → "Create Exam"
2. Điền thông tin:
   - Chọn Class
   - Tiêu đề, mô tả
   - Thời gian bắt đầu/kết thúc
   - Thời lượng (phút)
   - Thêm câu hỏi (Multiple choice, Fill blank, Reading comprehension)
3. Hệ thống tự động tạo **Exam Code** (6 ký tự)
4. Teacher click "Activate" để kích hoạt exam
5. Student tự động thấy exam trong "Exams" page (nếu đã join class)

**Student làm bài:**
1. Student vào "Exams" → Thấy danh sách exams từ class đã join
2. Click vào exam hoặc nhập Exam Code trực tiếp
3. Click "Start Exam" → Bắt đầu làm bài
4. Trả lời các câu hỏi → Hệ thống tự động lưu
5. Hết thời gian → Tự động nộp bài
6. Xem kết quả ngay sau khi nộp

**API Endpoints:**
- `POST /api/exams` - Teacher tạo exam
- `GET /api/exams` - Lấy danh sách exams (theo role: teacher thấy tất cả, student thấy exams từ class)
- `GET /api/exams/code/:code` - Lấy exam bằng code
- `POST /api/exams/start` - Student bắt đầu làm bài
- `POST /api/exams/submit-answer` - Lưu câu trả lời
- `POST /api/exams/submit` - Nộp bài
- `GET /api/exams/:examId/results` - Teacher xem kết quả

### 3. **Student làm bài → Teacher xem kết quả**

**Flow:**
1. Sau khi student nộp bài, hệ thống tự động chấm điểm
2. Teacher vào "Exams" → Click vào exam → "View Results"
3. Xem:
   - Danh sách học sinh đã làm bài
   - Điểm số từng học sinh
   - Chi tiết câu trả lời
   - Log vi phạm (nếu có)

**API Endpoints:**
- `GET /api/exams/:examId/results` - Lấy kết quả exam
- `GET /api/exams/:examId/attempt` - Lấy chi tiết attempt của student

## 🔐 Authentication

**Default Accounts:**
- **Teacher**: 
  - Email: `teacher@example.com`
  - Password: `teacher123`
- **Student**: 
  - Email: `student@example.com`
  - Password: `student123`

**Token Management:**
- Token được lưu trong `localStorage` với key `token`
- Token tự động được thêm vào header `Authorization: Bearer <token>`
- Nếu token hết hạn (401), tự động redirect về login

## 📊 Data Flow

### Class Flow:
```
Teacher creates Class
  ↓
System generates Class Code
  ↓
Student enters Class Code
  ↓
System adds Student to Class
  ↓
Student can now see exams from this Class
```

### Exam Flow:
```
Teacher creates Exam for Class
  ↓
System generates Exam Code
  ↓
Teacher activates Exam
  ↓
Students in Class see Exam
  ↓
Student starts Exam
  ↓
System creates Exam Attempt
  ↓
Student answers questions (auto-saved)
  ↓
Time ends → Auto submit
  ↓
System grades automatically
  ↓
Teacher views results
```

## 🛠️ Technical Details

### Field Mapping:
- Backend sử dụng **snake_case**: `exam_code`, `start_time`, `end_time`
- Frontend sử dụng **camelCase**: `examCode`, `startTime`, `endTime`
- Utility function `normalizeExam()` tự động convert giữa 2 format

### Real-time Features:
- Socket.io được sử dụng cho:
  - Monitoring exam violations
  - Real-time notifications
  - Auto-submit notifications

### Error Handling:
- API errors được catch và hiển thị qua toast notifications
- 401 errors tự động redirect về login
- Network errors hiển thị thông báo rõ ràng

## ✅ Checklist để Test

### Teacher Side:
- [ ] Đăng nhập thành công
- [ ] Tạo class mới → Lấy được class code
- [ ] Xem danh sách classes
- [ ] Tạo exam mới cho class
- [ ] Activate exam
- [ ] Xem kết quả exam

### Student Side:
- [ ] Đăng nhập thành công
- [ ] Join class bằng class code
- [ ] Xem danh sách exams từ class đã join
- [ ] Nhập exam code trực tiếp
- [ ] Bắt đầu làm bài
- [ ] Trả lời câu hỏi (auto-save)
- [ ] Nộp bài (tự động hoặc manual)
- [ ] Xem kết quả

### Connection Test:
- [ ] Teacher tạo class → Student join được
- [ ] Teacher tạo exam → Student thấy exam
- [ ] Student làm bài → Teacher thấy kết quả
- [ ] Real-time features hoạt động (nếu có)

## 🚀 Chạy Hệ thống

1. **Start Backend:**
   ```bash
   cd server
   npm run dev
   ```

2. **Start Teacher Web:**
   ```bash
   cd teacher-web
   npm run dev
   ```

3. **Start Student Web:**
   ```bash
   cd student-web
   npm run dev
   ```

Hoặc chạy tất cả cùng lúc:
```bash
npm run dev
```

## 📝 Notes

- Đảm bảo backend server chạy trước khi test frontend
- Database (Supabase) phải được setup và có schema
- CORS đã được cấu hình cho localhost:3001 và localhost:3002
- Socket.io server chạy trên cùng port với backend (5000)






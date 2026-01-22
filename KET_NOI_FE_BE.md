# Hướng dẫn Kết nối Frontend với Backend

## ✅ Trạng thái hiện tại

Frontend đã được cấu hình để kết nối với Backend thật, không phải dữ liệu demo.

## 🔗 Cấu hình API

### Student Web (Port 3002)
- **API URL**: `http://localhost:5000/api`
- **Proxy**: Đã cấu hình trong `vite.config.ts`
- **File**: `student-web/src/services/api.ts`

### Teacher Web (Port 3001)
- **API URL**: `http://localhost:5000/api`
- **Proxy**: Đã cấu hình trong `vite.config.ts`
- **File**: `teacher-web/src/services/api.ts`

## 📡 Các API Endpoints đang được sử dụng

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user

### Exams
- `GET /api/exams` - Lấy danh sách kỳ thi
- `POST /api/exams` - Tạo kỳ thi (teacher)
- `GET /api/exams/code/:code` - Lấy exam theo mã
- `POST /api/exams/start` - Bắt đầu làm bài (student)
- `POST /api/exams/submit` - Nộp bài (student)
- `GET /api/exams/:examId/results` - Xem kết quả (teacher)

### Classes
- `GET /api/classes` - Lấy danh sách lớp (teacher)
- `POST /api/classes` - Tạo lớp (teacher)
- `POST /api/classes/join` - Tham gia lớp (student)
- `GET /api/classes/code/:code` - Lấy lớp theo mã

### Assignments
- `GET /api/assignments` - Lấy danh sách bài tập
- `POST /api/assignments` - Tạo bài tập (teacher)

## 🧪 Kiểm tra kết nối

### 1. Kiểm tra Backend đang chạy
```bash
# Kiểm tra port 5000
netstat -ano | findstr ":5000"
```

Hoặc mở browser: http://localhost:5000/health

### 2. Kiểm tra Frontend đang chạy
- Teacher Web: http://localhost:3001
- Student Web: http://localhost:3002

### 3. Kiểm tra Network requests
1. Mở Developer Tools (F12)
2. Vào tab "Network"
3. Refresh trang
4. Kiểm tra các request đến `/api/*`
5. Xem response có dữ liệu không

## 📝 Tạo dữ liệu thật

### Bước 1: Đăng nhập
- **Teacher**: teacher@example.com / teacher123
- **Student**: student@example.com / student123

### Bước 2: Teacher tạo dữ liệu
1. Đăng nhập vào Teacher Web (http://localhost:3001)
2. Vào "Classes" → Tạo lớp mới
3. Vào "Exams" → Tạo kỳ thi mới
4. Vào "Assignments" → Tạo bài tập mới

### Bước 3: Student xem dữ liệu
1. Đăng nhập vào Student Web (http://localhost:3002)
2. Vào "Join Class" → Nhập mã lớp
3. Vào "Exams" → Xem danh sách kỳ thi
4. Vào "Assignments" → Xem danh sách bài tập

## 🔍 Debug

### Nếu không thấy dữ liệu:

1. **Kiểm tra Console (F12)**
   - Xem có lỗi JavaScript không
   - Xem có lỗi API không

2. **Kiểm tra Network tab**
   - Xem request có được gửi không
   - Xem response status code (200 = OK, 404 = Not Found, 500 = Server Error)
   - Xem response data có dữ liệu không

3. **Kiểm tra Backend logs**
   - Xem terminal chạy backend
   - Xem có lỗi không
   - Xem có request đến không

4. **Kiểm tra Authentication**
   - Xem localStorage có token không
   - Xem token có hợp lệ không
   - Thử đăng nhập lại

## ⚠️ Lưu ý

1. **Dữ liệu demo**: Chỉ có phần "My Progress" trong Dashboard là dữ liệu demo (UI only), không ảnh hưởng đến chức năng chính.

2. **Empty state**: Nếu chưa có dữ liệu, frontend sẽ hiển thị:
   - "Chưa có kỳ thi nào"
   - "Chưa có bài tập nào"
   - "Chưa có lớp nào"

3. **Backend phải chạy**: Frontend không thể hoạt động nếu backend không chạy hoặc không kết nối được.

## 🚀 Đảm bảo kết nối thành công

1. ✅ Backend đang chạy trên port 5000
2. ✅ Frontend đang chạy trên port 3001 (teacher) và 3002 (student)
3. ✅ Đã đăng nhập với tài khoản hợp lệ
4. ✅ Đã tạo dữ liệu (classes, exams, assignments)
5. ✅ Network requests trả về status 200 với dữ liệu

Nếu tất cả đều ✅, frontend sẽ hiển thị dữ liệu thật từ backend!


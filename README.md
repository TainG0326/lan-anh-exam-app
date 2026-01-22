# English Learning & Exam Platform

Hệ thống học tập và thi online môn Tiếng Anh cho giáo viên và học sinh THCS & THPT.

## Tính năng chính

### Teacher Web
- Dashboard tổng quan
- Quản lý lớp học và học sinh
- Tạo và quản lý khóa học (Grammar, Reading, Writing, Vocabulary)
- Tạo bài tập và chấm bài
- Tạo kỳ thi với cấu hình chi tiết
- Bảng điểm và thống kê
- Xem log vi phạm khi thi

### Student Web
- Dashboard cá nhân
- Học các khóa tiếng Anh
- Làm bài tập và nộp bài
- Tham gia kỳ thi online
- Xem điểm và nhận xét
- Quản lý profile

### Exam Engine
- Tự động chấm trắc nghiệm
- Khóa nộp bài theo thời gian (không cho nộp sớm, tự động nộp khi hết giờ)
- Chống gian lận ở mức tiêu chuẩn quốc tế:
  - Fullscreen bắt buộc
  - Webcam monitoring
  - Chặn copy/paste
  - Chặn chuột phải
  - Theo dõi chuyển tab
  - Log tất cả vi phạm

## Công nghệ

- **Backend**: Node.js + Express + TypeScript + MongoDB
- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Real-time**: Socket.io
- **Authentication**: JWT

## Cài đặt

### Yêu cầu
- Node.js 18+
- MongoDB 6+ (hoặc MongoDB Atlas)
- npm hoặc yarn

### Bước 1: Clone repository
```bash
git clone <repository-url>
cd "web bai tap kiem tra cho hoc sinh va giao vien"
```

### Bước 2: Cài đặt dependencies
```bash
npm run install-all
```

Hoặc cài đặt từng phần:
```bash
# Root dependencies
npm install

# Server dependencies
cd server && npm install && cd ..

# Teacher Web dependencies
cd teacher-web && npm install && cd ..

# Student Web dependencies
cd student-web && npm install && cd ..
```

### Bước 3: Cấu hình môi trường
Tạo file `server/.env`:
```bash
cd server
cp .env.example .env
```

Chỉnh sửa các biến môi trường trong `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/english_exam
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRE=7d
NODE_ENV=development
```

**Lưu ý**: 
- Nếu dùng MongoDB Atlas, thay `MONGODB_URI` bằng connection string từ Atlas
- Đổi `JWT_SECRET` thành một chuỗi ngẫu nhiên mạnh trong production

### Bước 4: Khởi động MongoDB
Nếu dùng MongoDB local:
```bash
# Windows
mongod

# macOS/Linux
sudo systemctl start mongod
# hoặc
mongod --dbpath /path/to/data
```

### Bước 5: Chạy ứng dụng

**Development mode (chạy tất cả cùng lúc):**
```bash
npm run dev
```

Hoặc chạy riêng từng phần (trong các terminal riêng):
```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Teacher Web (port 3001)
npm run teacher

# Terminal 3: Student Web (port 3002)
npm run student
```

### Bước 6: Truy cập
- **Teacher Web**: http://localhost:3001
- **Student Web**: http://localhost:3002
- **API Server**: http://localhost:5000

## Tài khoản mặc định

Sau khi chạy server lần đầu, hệ thống sẽ tự động tạo tài khoản mặc định:

### Giáo viên
- **Email**: teacher@example.com
- **Password**: teacher123
- **Truy cập**: http://localhost:3001

### Học sinh
- **Email**: student@example.com
- **Password**: student123
- **Truy cập**: http://localhost:3002

**Lưu ý**: Đây chỉ là tài khoản demo. Trong production, hãy đổi mật khẩu hoặc xóa các tài khoản này.

## Cấu trúc dự án

```
.
├── server/              # Backend API
│   ├── src/
│   │   ├── models/      # MongoDB models
│   │   ├── routes/      # API routes
│   │   ├── middleware/  # Auth, validation
│   │   ├── controllers/ # Business logic
│   │   ├── utils/       # Utilities
│   │   └── index.ts     # Entry point
│   └── package.json
├── teacher-web/         # Teacher frontend
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── components/  # Reusable components
│   │   ├── hooks/       # Custom hooks
│   │   ├── services/    # API services
│   │   └── main.tsx     # Entry point
│   └── package.json
├── student-web/         # Student frontend
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── components/  # Reusable components
│   │   ├── hooks/       # Custom hooks
│   │   ├── services/    # API services
│   │   └── main.tsx     # Entry point
│   └── package.json
└── package.json         # Root package.json
```

## Tính năng Exam Engine

### Chống gian lận
Hệ thống tích hợp các biện pháp chống gian lận:

1. **Fullscreen bắt buộc**: Học sinh phải ở chế độ toàn màn hình khi thi
2. **Webcam monitoring**: Theo dõi qua webcam (nếu được bật)
3. **Chặn copy/paste**: Không cho phép sao chép hoặc dán
4. **Chặn chuột phải**: Vô hiệu hóa menu chuột phải
5. **Theo dõi chuyển tab**: Ghi nhận khi học sinh chuyển tab
6. **Chặn phím tắt**: Chặn Ctrl+C, Ctrl+V, F12, DevTools
7. **Auto submit khi vi phạm nhiều**: Tự động nộp bài sau 5 vi phạm

### Tự động chấm bài
- Tự động chấm các câu trắc nghiệm
- Tính điểm ngay sau khi nộp bài
- Hiển thị đáp án đúng và giải thích

### Quản lý thời gian
- Không cho phép nộp bài sớm
- Tự động nộp bài khi hết giờ
- Đếm ngược thời gian real-time

## API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user hiện tại

### Exams
- `POST /api/exams` - Tạo kỳ thi (teacher)
- `GET /api/exams` - Lấy danh sách kỳ thi
- `GET /api/exams/code/:code` - Lấy kỳ thi theo mã
- `POST /api/exams/start` - Bắt đầu làm bài
- `POST /api/exams/submit-answer` - Lưu câu trả lời
- `POST /api/exams/submit` - Nộp bài
- `POST /api/exams/violation` - Ghi nhận vi phạm
- `GET /api/exams/:examId/results` - Xem kết quả (teacher)
- `GET /api/exams/:examId/attempt` - Xem bài làm của học sinh

### Classes
- `POST /api/classes` - Tạo lớp (teacher)
- `GET /api/classes` - Lấy danh sách lớp
- `POST /api/classes/:classId/students` - Thêm học sinh vào lớp

### Assignments
- `POST /api/assignments` - Tạo bài tập (teacher)
- `GET /api/assignments` - Lấy danh sách bài tập
- `POST /api/assignments/submit` - Nộp bài tập (student)
- `POST /api/assignments/grade` - Chấm bài (teacher)
- `GET /api/assignments/:assignmentId/submissions` - Xem bài nộp (teacher)

## Lưu ý quan trọng

### Bảo mật
- Đổi `JWT_SECRET` trong production
- Sử dụng HTTPS trong production
- Bảo vệ MongoDB với authentication
- Không commit file `.env` lên git

### Hiệu năng
- Hệ thống được thiết kế cho 100-1000 học sinh đồng thời
- Sử dụng MongoDB indexing để tối ưu truy vấn
- Socket.io cho real-time monitoring

### Hạn chế
- Chống gian lận dựa trên web browser, có thể bị bypass bằng cách tắt JavaScript
- Webcam monitoring chỉ hoạt động khi học sinh cho phép
- Cần kết nối internet ổn định

## Troubleshooting

### Lỗi kết nối MongoDB
- Kiểm tra MongoDB đã chạy chưa
- Kiểm tra `MONGODB_URI` trong `.env`
- Kiểm tra firewall/network

### Lỗi CORS
- Đảm bảo frontend và backend chạy đúng port
- Kiểm tra proxy config trong `vite.config.ts`

### Lỗi Socket.io
- Kiểm tra server đã chạy chưa
- Kiểm tra token authentication
- Xem console log để debug

## Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng tạo issue hoặc pull request.

## License

MIT


# 🚀 Hướng Dẫn Deploy Lên Vercel

## 📋 Tổng Quan

Bạn có thể deploy **frontend** (teacher-web và student-web) lên Vercel. Tuy nhiên, **backend** cần deploy riêng vì:
- Vercel không hỗ trợ tốt Socket.io (WebSocket)
- Backend cần chạy liên tục (không phải serverless)

## 🎯 Kiến Trúc Deploy

```
Frontend (Vercel)
├── Teacher Web → vercel.com/teacher
└── Student Web → vercel.com/student

Backend (Railway/Render/VPS)
└── API Server → your-backend-url.com
```

## 📦 Bước 1: Deploy Backend Trước

### Option 1: Railway (Khuyên dùng - Free tier tốt)
1. Truy cập: https://railway.app
2. Đăng nhập với GitHub
3. Click **New Project** → **Deploy from GitHub repo**
4. Chọn repo và thư mục `server`
5. Thêm Environment Variables:
   ```
   SUPABASE_URL=https://hvophbiqtpffokpienki.supabase.co
   SUPABASE_ANON_KEY=your_key_here
   PORT=5000
   JWT_SECRET=your-secret-key
   NODE_ENV=production
   ```
6. Railway sẽ tự động deploy và cung cấp URL: `https://your-app.railway.app`

### Option 2: Render
1. Truy cập: https://render.com
2. Tạo **Web Service** mới
3. Connect GitHub repo
4. Root Directory: `server`
5. Build Command: `npm install && npm run build`
6. Start Command: `npm start`
7. Thêm Environment Variables tương tự

### Option 3: VPS (DigitalOcean, AWS, etc.)
- Cần setup Node.js, PM2, Nginx
- Phức tạp hơn nhưng linh hoạt nhất

## 🌐 Bước 2: Deploy Frontend Lên Vercel

### 2.1. Deploy Teacher Web

1. **Cài đặt Vercel CLI** (nếu chưa có):
   ```bash
   npm i -g vercel
   ```

2. **Đăng nhập Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy Teacher Web**:
   ```bash
   cd teacher-web
   vercel
   ```
   
   - Project name: `teacher-web` (hoặc tên bạn muốn)
   - Directory: `./` (current directory)
   - Override settings: No

4. **Thêm Environment Variable**:
   - Vào Vercel Dashboard → Project → Settings → Environment Variables
   - Thêm:
     ```
     VITE_API_URL=https://your-backend-url.com/api
     VITE_SOCKET_URL=https://your-backend-url.com
     ```

5. **Redeploy** để áp dụng env variables:
   ```bash
   vercel --prod
   ```

### 2.2. Deploy Student Web

Làm tương tự:
```bash
cd student-web
vercel
```

Thêm cùng Environment Variables:
```
VITE_API_URL=https://your-backend-url.com/api
VITE_SOCKET_URL=https://your-backend-url.com
```

## 🔧 Bước 3: Cấu Hình Domain (Tùy chọn)

### Custom Domain cho Teacher Web:
1. Vercel Dashboard → Project → Settings → Domains
2. Add domain: `teacher.yourdomain.com`
3. Follow DNS instructions

### Custom Domain cho Student Web:
1. Tương tự với domain: `student.yourdomain.com`

## 📝 Bước 4: Cập Nhật Code

### File đã được cập nhật:
- ✅ `teacher-web/vercel.json` - Cấu hình Vercel
- ✅ `student-web/vercel.json` - Cấu hình Vercel
- ✅ `student-web/src/pages/TakeExam.tsx` - Socket.io URL từ env

### Cần kiểm tra:
- ✅ `teacher-web/src/services/api.ts` - Đã dùng `VITE_API_URL`
- ✅ `student-web/src/services/api.ts` - Đã dùng `VITE_API_URL`

## 🔐 Bước 5: Environment Variables

### Trong Vercel Dashboard, thêm cho mỗi project:

**Teacher Web:**
```
VITE_API_URL=https://your-backend.railway.app/api
VITE_SOCKET_URL=https://your-backend.railway.app
```

**Student Web:**
```
VITE_API_URL=https://your-backend.railway.app/api
VITE_SOCKET_URL=https://your-backend.railway.app
```

## 🚀 Deploy Tự Động với GitHub

### Setup GitHub Actions (Tùy chọn):

1. **Connect GitHub repo với Vercel**:
   - Vercel Dashboard → Project → Settings → Git
   - Connect GitHub repository
   - Auto-deploy khi push code

2. **Mỗi khi push code**:
   - Vercel tự động build và deploy
   - Không cần chạy `vercel` command

## 📊 Kiểm Tra Sau Khi Deploy

### 1. Kiểm tra Frontend:
- ✅ Teacher Web: `https://teacher-web.vercel.app`
- ✅ Student Web: `https://student-web.vercel.app`

### 2. Kiểm tra API:
- ✅ Backend: `https://your-backend.railway.app/api/health`

### 3. Test đăng nhập:
- ✅ Teacher: `teacher@example.com` / `teacher123`
- ✅ Student: `student@example.com` / `student123`

## ⚠️ Lưu Ý Quan Trọng

### 1. CORS Configuration
Đảm bảo backend cho phép CORS từ Vercel domain:
```typescript
// server/src/index.ts
app.use(cors({
  origin: [
    'https://teacher-web.vercel.app',
    'https://student-web.vercel.app',
    'http://localhost:3001',
    'http://localhost:3002'
  ],
  credentials: true
}));
```

### 2. Socket.io CORS
Cập nhật Socket.io CORS:
```typescript
const io = new Server(httpServer, {
  cors: {
    origin: [
      'https://teacher-web.vercel.app',
      'https://student-web.vercel.app',
      'http://localhost:3001',
      'http://localhost:3002'
    ],
    credentials: true,
  },
});
```

### 3. Supabase RLS
Nếu dùng Row Level Security, cần tạo policies cho production.

## 🎉 Hoàn Thành!

Sau khi deploy xong, bạn sẽ có:
- ✅ Teacher Web trên Vercel
- ✅ Student Web trên Vercel  
- ✅ Backend API trên Railway/Render
- ✅ Tất cả đã kết nối và hoạt động!

## 📞 Troubleshooting

### Frontend không kết nối được Backend:
1. Kiểm tra `VITE_API_URL` trong Vercel
2. Kiểm tra CORS trong backend
3. Kiểm tra backend có đang chạy không

### Socket.io không hoạt động:
1. Kiểm tra `VITE_SOCKET_URL` trong Vercel
2. Kiểm tra backend có hỗ trợ WebSocket không
3. Railway/Render cần enable WebSocket support

### Build failed trên Vercel:
1. Kiểm tra `package.json` có đúng không
2. Kiểm tra TypeScript errors
3. Xem build logs trong Vercel Dashboard


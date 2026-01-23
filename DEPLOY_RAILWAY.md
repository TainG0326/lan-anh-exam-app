# 🚂 Hướng Dẫn Deploy Backend Lên Railway

## 📋 Tổng Quan

Railway là một platform tuyệt vời để deploy Node.js backend với:
- ✅ Free tier: $5 credit/tháng
- ✅ Auto-deploy từ GitHub
- ✅ Hỗ trợ WebSocket (Socket.io)
- ✅ Environment variables dễ quản lý
- ✅ Logs real-time

## 🚀 Bước 1: Tạo Tài Khoản Railway

1. Truy cập: https://railway.app
2. Click **"Start a New Project"**
3. Đăng nhập bằng **GitHub** (khuyến nghị)
4. Authorize Railway để truy cập GitHub repositories

## 📦 Bước 2: Tạo Project Mới

1. Trong Railway Dashboard, click **"New Project"**
2. Chọn **"Deploy from GitHub repo"**
3. Chọn repository: `web-for-teacher-and-student`
4. Railway sẽ tự động detect và setup

## ⚙️ Bước 3: Cấu Hình Service

### 3.1. Root Directory

1. Vào **Settings** → **Root Directory**
2. Đặt: `server`
3. Click **Save**

### 3.2. Build Command

1. Vào **Settings** → **Build Command**
2. Đặt: `npm install && npm run build`
3. Click **Save**

**Lưu ý:** Railway sẽ tự động cài đặt dependencies, nhưng build command đảm bảo TypeScript được compile.

### 3.3. Start Command

1. Vào **Settings** → **Start Command**
2. Đặt: `npm start`
3. Click **Save**

## 🔐 Bước 4: Thêm Environment Variables

Vào tab **Variables**, thêm các biến sau:

### Supabase Configuration
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

### JWT Configuration
```env
JWT_SECRET=your-very-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-very-secret-refresh-key-change-in-production
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
```

### Server Configuration
```env
PORT=5000
NODE_ENV=production
```

### Frontend URLs (cho CORS)
```env
FRONTEND_URL=https://your-teacher-web.vercel.app,https://your-student-web.vercel.app,http://localhost:3001,http://localhost:3002
```

### Exam Security (cho BEK - Browser Exam Key)
```env
EXAM_SECRET_KEY=your-exam-secret-key-for-lockdown-browser
```

**Lưu ý:**
- Thay tất cả giá trị bằng thông tin thực tế của bạn
- `FRONTEND_URL` có thể có nhiều URL, cách nhau bằng dấu phẩy
- Railway sẽ tự động restart service khi thay đổi variables

## 🔧 Bước 5: Cập Nhật CORS (Nếu Cần)

Nếu `FRONTEND_URL` có nhiều URL, cần cập nhật `server/src/index.ts`:

```typescript
// Middleware
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:3002'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies
}));
```

## 🚀 Bước 6: Deploy

1. Railway sẽ tự động deploy khi bạn push code lên GitHub
2. Hoặc vào **Deployments** → **Redeploy** để deploy lại
3. Xem logs trong **Logs** tab để theo dõi quá trình build

## 🌐 Bước 7: Lấy URL Backend

1. Vào **Settings** → **Networking**
2. Railway tự động tạo domain: `your-app-name.up.railway.app`
3. Hoặc tạo **Custom Domain** (nếu có)

URL backend của bạn sẽ là: `https://your-app-name.up.railway.app`

## ✅ Bước 8: Kiểm Tra

### 8.1. Health Check
Truy cập:
```
https://your-app-name.up.railway.app/health
```

Kết quả mong đợi:
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

### 8.2. Test API
Test endpoint đăng nhập:
```
POST https://your-app-name.up.railway.app/api/auth/login
Content-Type: application/json

{
  "email": "teacher@example.com",
  "password": "teacher123"
}
```

## 🔄 Bước 9: Auto-Deploy từ GitHub

Railway tự động deploy khi:
- Push code lên branch `main` (hoặc branch bạn đã cấu hình)
- Merge Pull Request
- Manual redeploy từ Dashboard

### Cấu hình Auto-Deploy:
1. Vào **Settings** → **Source**
2. Chọn branch để auto-deploy (mặc định: `main`)
3. Enable **"Auto Deploy"**

## 📝 Bước 10: Cập Nhật Frontend

Sau khi có backend URL, cập nhật frontend:

### Teacher Web & Student Web:
Thêm Environment Variable trong Vercel/Netlify:
```env
VITE_API_URL=https://your-app-name.up.railway.app/api
```

## ⚠️ Lưu Ý Quan Trọng

### 1. Static Files (`/uploads`)
- Railway không lưu file tạm thời giữa các lần deploy
- **Giải pháp:** Đã dùng Supabase Storage (đã có trong code)
- Nếu có code serve static files, có thể xóa hoặc comment

### 2. Database
- Đang dùng Supabase (cloud database), không cần setup thêm
- Đảm bảo Supabase project đang active

### 3. Logs
- Xem logs trong Railway Dashboard → **Logs** tab
- Có thể stream logs real-time
- Logs được lưu trong 7 ngày (free tier)

### 4. Monitoring
- Railway có metrics cơ bản
- Xem CPU, Memory, Network trong **Metrics** tab
- Free tier có giới hạn về metrics retention

### 5. WebSocket (Socket.io)
- Railway hỗ trợ WebSocket tốt
- Socket.io sẽ hoạt động bình thường
- Không cần cấu hình thêm

## 🐛 Troubleshooting

### Lỗi Build: "tsc: not found"
**Nguyên nhân:** TypeScript không được cài đặt hoặc không có trong PATH

**Giải pháp:**
1. Đảm bảo `typescript` trong `devDependencies` của `server/package.json`
2. Build command: `npm install && npm run build`
3. Hoặc sử dụng `npx tsc` trong build script

### Lỗi Start: "Cannot find module"
**Nguyên nhân:** File build không tồn tại hoặc path sai

**Giải pháp:**
1. Kiểm tra `dist/index.js` có tồn tại sau build
2. Kiểm tra `tsconfig.json` có `outDir: "./dist"`
3. Kiểm tra start command: `node dist/index.js`

### Lỗi CORS
**Nguyên nhân:** Frontend URL không được cho phép

**Giải pháp:**
1. Kiểm tra `FRONTEND_URL` trong Variables
2. Đảm bảo URL đúng format (không có dấu cách thừa)
3. Kiểm tra code CORS trong `server/src/index.ts`

### Lỗi Supabase Connection
**Nguyên nhân:** Environment variables sai hoặc Supabase project không active

**Giải pháp:**
1. Kiểm tra `SUPABASE_URL` và `SUPABASE_ANON_KEY`
2. Đảm bảo Supabase project đang active
3. Kiểm tra RLS policies nếu có

### Service Không Start
**Nguyên nhân:** Port không đúng hoặc lỗi runtime

**Giải pháp:**
1. Railway tự động set `PORT`, không cần hardcode
2. Sử dụng `process.env.PORT || 5000` trong code
3. Kiểm tra logs để xem lỗi cụ thể

## ✅ Checklist Trước Khi Deploy

- [ ] Đã push code lên GitHub
- [ ] Đã thêm tất cả Environment Variables
- [ ] Đã test build local: `cd server && npm run build`
- [ ] Đã test start local: `cd server && npm start`
- [ ] Đã cập nhật CORS nếu cần
- [ ] Đã có Supabase credentials
- [ ] Đã chuẩn bị JWT secrets
- [ ] Đã cấu hình Root Directory: `server`
- [ ] Đã cấu hình Build Command: `npm install && npm run build`
- [ ] Đã cấu hình Start Command: `npm start`

## 🎉 Sau Khi Deploy Thành Công

1. ✅ Copy backend URL: `https://your-app-name.up.railway.app`
2. ✅ Test health check endpoint
3. ✅ Test API endpoints
4. ✅ Cập nhật frontend với backend URL
5. ✅ Test đăng nhập và các tính năng

## 📚 Tài Liệu Tham Khảo

- Railway Docs: https://docs.railway.app
- Railway Pricing: https://railway.app/pricing
- Railway Discord: https://discord.gg/railway

## 💡 Tips

1. **Sử dụng Railway CLI** (tùy chọn):
   ```bash
   npm i -g @railway/cli
   railway login
   railway link
   railway up
   ```

2. **Custom Domain:**
   - Vào Settings → Networking → Custom Domain
   - Thêm domain của bạn
   - Follow DNS instructions

3. **Environment Variables từ File:**
   - Railway CLI: `railway variables set --file .env`

4. **Rollback Deployment:**
   - Vào Deployments → Chọn deployment cũ → Redeploy

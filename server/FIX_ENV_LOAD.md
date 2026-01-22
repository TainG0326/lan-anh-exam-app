# Đã sửa lỗi load .env

## ✅ Vấn đề đã được sửa:

1. **Thêm `dotenv.config()` vào `supabase.ts`** - Đảm bảo .env được load trước khi đọc biến môi trường
2. **Giữ `dotenv.config()` ở đầu `index.ts`** - Double check để đảm bảo

## 🔍 Kiểm tra:

File `.env` đã có đầy đủ:
- ✅ SUPABASE_URL
- ✅ SUPABASE_ANON_KEY
- ✅ JWT_SECRET
- ✅ PORT

## 🚀 Chạy server:

```bash
cd server
npm run dev
```

Bạn sẽ thấy:
- ✅ "Supabase connected successfully!"
- ✅ "Default teacher created..."
- ✅ "Default student created..."
- ✅ "Server running on port 5000"

## 📝 Nếu vẫn lỗi:

1. Kiểm tra file `.env` có đúng vị trí: `server/.env`
2. Kiểm tra không có khoảng trắng thừa trong .env
3. Kiểm tra encoding của file .env (phải là UTF-8)


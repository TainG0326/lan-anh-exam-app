# Tính năng: Học sinh tham gia lớp bằng mã

## ✅ Đã hoàn thành:

### Backend:
1. ✅ Thêm trường `class_code` vào bảng `classes`
2. ✅ Tự động tạo mã lớp khi tạo lớp mới
3. ✅ API endpoint `/api/classes/join` - Học sinh join lớp bằng mã
4. ✅ API endpoint `/api/classes/code/:code` - Lấy thông tin lớp bằng mã

### Frontend - Teacher:
1. ✅ Hiển thị mã lớp trong danh sách lớp
2. ✅ Mã lớp được hiển thị nổi bật để giáo viên chia sẻ

### Frontend - Student:
1. ✅ Trang "Tham gia lớp" - Nhập mã lớp
2. ✅ Menu navigation có mục "Tham gia lớp"

## 🔧 Cần cập nhật Database:

### Bước 1: Thêm cột class_code
Chạy trong Supabase SQL Editor:
```sql
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS class_code VARCHAR(10) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_classes_code ON classes(class_code);
```

### Bước 2: Tạo mã cho lớp đã có
Chạy script trong file `UPDATE_SCHEMA_CLASS_CODE.sql` hoặc:
```sql
-- Tạo mã cho các lớp đã có
DO $$
DECLARE
    class_record RECORD;
    new_code VARCHAR(10);
    code_exists BOOLEAN;
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    i INTEGER;
BEGIN
    FOR class_record IN SELECT id FROM classes WHERE class_code IS NULL OR class_code = '' LOOP
        LOOP
            new_code := '';
            FOR i IN 1..6 LOOP
                new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
            END LOOP;
            SELECT EXISTS(SELECT 1 FROM classes WHERE class_code = new_code) INTO code_exists;
            EXIT WHEN NOT code_exists;
        END LOOP;
        UPDATE classes SET class_code = new_code WHERE id = class_record.id;
    END LOOP;
END $$;
```

## 🚀 Cách sử dụng:

### Giáo viên:
1. Tạo lớp mới → Hệ thống tự động tạo mã lớp
2. Xem mã lớp trong danh sách lớp
3. Chia sẻ mã lớp cho học sinh

### Học sinh:
1. Vào menu "Tham gia lớp"
2. Nhập mã lớp do giáo viên cung cấp
3. Click "Tham gia lớp"
4. Sau khi tham gia, học sinh sẽ thấy các kỳ thi và bài tập của lớp đó

## 📝 Lưu ý:

- Mã lớp là duy nhất (6 ký tự: A-Z, 0-9)
- Học sinh chỉ có thể tham gia 1 lớp
- Nếu đã tham gia lớp, sẽ không thể tham gia lớp khác (trừ khi rời lớp)







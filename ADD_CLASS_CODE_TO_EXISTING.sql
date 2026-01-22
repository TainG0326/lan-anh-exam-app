-- Thêm cột class_code vào bảng classes (nếu chưa có)
-- Chạy trong Supabase SQL Editor

-- Thêm cột class_code nếu chưa có
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS class_code VARCHAR(10) UNIQUE;

-- Tạo index
CREATE INDEX IF NOT EXISTS idx_classes_code ON classes(class_code);

-- Tạo mã cho các lớp đã có (nếu chưa có mã)
DO $$
DECLARE
    class_record RECORD;
    new_code VARCHAR(10);
    code_exists BOOLEAN;
BEGIN
    FOR class_record IN SELECT id FROM classes WHERE class_code IS NULL OR class_code = '' LOOP
        -- Generate code
        LOOP
            new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
            SELECT EXISTS(SELECT 1 FROM classes WHERE class_code = new_code) INTO code_exists;
            EXIT WHEN NOT code_exists;
        END LOOP;
        
        -- Update class with code
        UPDATE classes SET class_code = new_code WHERE id = class_record.id;
    END LOOP;
END $$;

-- Kiểm tra
SELECT id, name, class_code FROM classes;







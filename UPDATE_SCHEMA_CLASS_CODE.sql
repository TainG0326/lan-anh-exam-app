-- Cập nhật schema để thêm class_code
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
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    i INTEGER;
BEGIN
    FOR class_record IN SELECT id FROM classes WHERE class_code IS NULL OR class_code = '' LOOP
        -- Generate unique code
        LOOP
            new_code := '';
            FOR i IN 1..6 LOOP
                new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
            END LOOP;
            
            SELECT EXISTS(SELECT 1 FROM classes WHERE class_code = new_code) INTO code_exists;
            EXIT WHEN NOT code_exists;
        END LOOP;
        
        -- Update class with code
        UPDATE classes SET class_code = new_code WHERE id = class_record.id;
        RAISE NOTICE 'Updated class % with code %', class_record.id, new_code;
    END LOOP;
END $$;

-- Kiểm tra
SELECT id, name, class_code FROM classes;







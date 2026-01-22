-- Thêm cột class_code vào bảng classes
-- Chạy script này trong Supabase SQL Editor

-- Bước 1: Thêm cột class_code
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS class_code VARCHAR(10);

-- Bước 2: Thêm unique constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'classes_class_code_key'
    ) THEN
        ALTER TABLE classes 
        ADD CONSTRAINT classes_class_code_key UNIQUE (class_code);
    END IF;
END $$;

-- Bước 3: Tạo index
CREATE INDEX IF NOT EXISTS idx_classes_code ON classes(class_code);

-- Bước 4: Tạo mã cho các lớp đã có (nếu chưa có mã)
DO $$
DECLARE
    class_record RECORD;
    new_code VARCHAR(10);
    code_exists BOOLEAN;
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    i INTEGER;
BEGIN
    FOR class_record IN 
        SELECT id FROM classes 
        WHERE class_code IS NULL OR class_code = ''
    LOOP
        -- Tạo mã duy nhất
        LOOP
            new_code := '';
            FOR i IN 1..6 LOOP
                new_code := new_code || substr(
                    chars, 
                    floor(random() * length(chars) + 1)::int, 
                    1
                );
            END LOOP;
            
            -- Kiểm tra mã đã tồn tại chưa
            SELECT EXISTS(
                SELECT 1 FROM classes WHERE class_code = new_code
            ) INTO code_exists;
            
            EXIT WHEN NOT code_exists;
        END LOOP;
        
        -- Cập nhật lớp với mã mới
        UPDATE classes 
        SET class_code = new_code 
        WHERE id = class_record.id;
        
        RAISE NOTICE 'Đã tạo mã % cho lớp %', new_code, class_record.id;
    END LOOP;
END $$;

-- Bước 5: Kiểm tra kết quả
SELECT id, name, grade, level, class_code 
FROM classes;


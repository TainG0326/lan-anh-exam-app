-- Migration: Add class_code column to classes table if it doesn't exist
-- Run this in Supabase SQL Editor if you get "column class_code does not exist" error

-- Check if column exists and add it if not
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'classes' 
        AND column_name = 'class_code'
    ) THEN
        -- Add the column
        ALTER TABLE classes 
        ADD COLUMN class_code VARCHAR(10) UNIQUE;
        
        -- Create index
        CREATE INDEX IF NOT EXISTS idx_classes_code ON classes(class_code);
        
        -- Generate codes for existing classes
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
            END LOOP;
        END $$;
        
        RAISE NOTICE 'Column class_code added successfully';
    ELSE
        RAISE NOTICE 'Column class_code already exists';
    END IF;
END $$;

-- Verify the column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'classes' 
AND column_name = 'class_code';


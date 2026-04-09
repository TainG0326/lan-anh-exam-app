-- Storage policies for "avatars" bucket
-- Run in Supabase Dashboard → SQL Editor (copy all and Run)
-- Fix: Bucket has 0 policies → upload blocked. This adds the needed policies.

-- Remove old policies if you run this again
DROP POLICY IF EXISTS "Allow avatar upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow avatar read" ON storage.objects;
DROP POLICY IF EXISTS "Allow avatar update" ON storage.objects;
DROP POLICY IF EXISTS "Allow avatar delete" ON storage.objects;

-- Allow INSERT (upload) into avatars bucket
CREATE POLICY "Allow avatar upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars');

-- Allow SELECT (read) - public can view avatars
CREATE POLICY "Allow avatar read"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow UPDATE (replace avatar)
CREATE POLICY "Allow avatar update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars');

-- Allow DELETE (remove avatar)
CREATE POLICY "Allow avatar delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars');

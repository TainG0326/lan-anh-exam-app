-- ============================================================
-- MIGRATION: App Version Management for Auto-Update
-- ============================================================
-- Table: app_versions
-- Stores version info for desktop app auto-update
-- ============================================================

-- Create table
CREATE TABLE IF NOT EXISTS app_versions (
  id SERIAL PRIMARY KEY,
  version VARCHAR(50) NOT NULL UNIQUE,
  release_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  download_url_windows TEXT,
  download_url_mac TEXT,
  download_url_linux TEXT,
  release_notes TEXT,
  is_mandatory BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_versions_version ON app_versions(version DESC);
CREATE INDEX IF NOT EXISTS idx_app_versions_active ON app_versions(is_active) WHERE is_active = TRUE;

-- ============================================================
-- INSERT DEFAULT VERSION (v1.0.0)
-- ============================================================
-- Update these URLs when you upload new installers to:
-- - Supabase Storage bucket 'app-installers'
-- - Or any public hosting (Vercel, GitHub Releases, etc.)
-- ============================================================

INSERT INTO app_versions (version, download_url_windows, download_url_mac, download_url_linux, release_notes, is_mandatory, is_active)
VALUES (
  '1.0.0',
  'https://exam-web-azure.vercel.app/api/version/download/windows',
  'https://exam-web-azure.vercel.app/api/version/download/mac',
  NULL,
  'Phiên bản đầu tiên - Hệ thống thi trực tuyến Lan Anh Exam System',
  FALSE,
  TRUE
) ON CONFLICT (version) DO NOTHING;

-- ============================================================
-- INSERT v1.1.0 (example for next update)
-- ============================================================
-- Uncomment and update when you have new installer URLs
-- INSERT INTO app_versions (version, download_url_windows, download_url_mac, release_notes, is_mandatory)
-- VALUES (
--   '1.1.0',
--   'https://your-hosting.com/LanAnhExam_v1.1.0_Setup.exe',
--   'https://your-hosting.com/LanAnhExam_v1.1.0.dmg',
--   '• Thêm tính năng Zoom Control\n• Thêm tính năng thoát bằng mật khẩu\n• Chặn phím Windows hiệu quả hơn',
--   FALSE
-- );

-- ============================================================
-- FUNCTION: Get latest version info
-- ============================================================
CREATE OR REPLACE FUNCTION get_latest_app_version(target_platform TEXT DEFAULT NULL)
RETURNS TABLE (
  version VARCHAR,
  release_date TIMESTAMP WITH TIME ZONE,
  download_url TEXT,
  release_notes TEXT,
  is_mandatory BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    av.version,
    av.release_date,
    CASE
      WHEN target_platform = 'darwin' THEN av.download_url_mac
      WHEN target_platform = 'linux' THEN av.download_url_linux
      ELSE av.download_url_windows
    END AS download_url,
    av.release_notes,
    av.is_mandatory
  FROM app_versions av
  WHERE av.is_active = TRUE
  ORDER BY av.release_date DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Enable RLS (adjust policies for your auth setup)
-- ============================================================
ALTER TABLE app_versions ENABLE ROW LEVEL SECURITY;

-- Allow public read access to version info (no auth needed for update check)
CREATE POLICY "Allow public read app_versions"
ON app_versions
FOR SELECT
USING (is_active = TRUE);

-- Only admins can insert/update/delete
-- (handled by service role key on server side)

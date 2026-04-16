import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// ============================================================
// TYPES
// ============================================================
interface AppVersionRow {
  version: string;
  release_date: string;
  release_notes: string | null;
  is_mandatory: boolean;
  download_url: string | null;
}

interface AppVersionRaw {
  version: string;
  release_date: string;
  release_notes: string | null;
  is_mandatory: boolean;
  download_url_windows: string | null;
  download_url_mac: string | null;
  download_url_linux: string | null;
}

interface VersionInfo {
  latest_version: string | null;
  release_date?: string;
  release_notes?: string | null;
  is_mandatory?: boolean;
  download_url: string | null;
}

// ============================================================
// GET /api/version - Check latest app version
// ============================================================
router.get('/', async (req, res) => {
  try {
    const platform = req.query.platform as string || 'win32';

    // Try RPC first
    const { data: versionData, error: rpcError } = await supabase
      .rpc('get_latest_app_version', { target_platform: platform })
      .maybeSingle<AppVersionRow>();

    if (!rpcError && versionData) {
      return res.status(200).json({
        latest_version: versionData.version,
        release_date: versionData.release_date,
        release_notes: versionData.release_notes,
        is_mandatory: versionData.is_mandatory || false,
        download_url: versionData.download_url,
      });
    }

    // Fallback: direct query
    const { data: fallback, error: fallbackError } = await supabase
      .from('app_versions')
      .select('version, release_date, release_notes, is_mandatory, download_url_windows, download_url_mac, download_url_linux')
      .eq('is_active', true)
      .order('release_date', { ascending: false })
      .limit(1)
      .maybeSingle<AppVersionRaw>();

    if (fallbackError || !fallback) {
      return res.status(200).json({
        latest_version: null,
        message: 'No version info available',
        download_url: null,
      });
    }

    const downloadUrl =
      platform === 'darwin'
        ? fallback.download_url_mac
        : platform === 'linux'
        ? fallback.download_url_linux
        : fallback.download_url_windows;

    return res.status(200).json({
      latest_version: fallback.version,
      release_date: fallback.release_date,
      release_notes: fallback.release_notes,
      is_mandatory: fallback.is_mandatory || false,
      download_url: downloadUrl,
    });
  } catch (err) {
    console.error('[Version API] Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================
// GET /api/version/check - Compare with current version
// ============================================================
router.get('/check', async (req, res) => {
  try {
    const { current, platform } = req.query;

    if (!current) {
      return res.status(400).json({ error: 'current version is required' });
    }

    const versionInfo = await fetchVersionInfo(platform as string || 'win32');

    if (!versionInfo.latest_version) {
      return res.status(200).json({
        hasUpdate: false,
        latestVersion: current,
        downloadUrl: null,
      });
    }

    const hasUpdate = compareVersions(versionInfo.latest_version, current as string) > 0;

    return res.status(200).json({
      hasUpdate,
      latestVersion: versionInfo.latest_version,
      currentVersion: current,
      downloadUrl: hasUpdate ? versionInfo.download_url : null,
      releaseNotes: versionInfo.release_notes || '',
      isMandatory: versionInfo.is_mandatory || false,
    });
  } catch (err) {
    console.error('[Version Check API] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================
// GET /api/version/download/:platform - Get download URL
// ============================================================
router.get('/download/:platform', async (req, res) => {
  try {
    const { platform } = req.params;

    const versionInfo = await fetchVersionInfo(platform);

    if (!versionInfo.download_url) {
      return res.status(404).json({ error: 'No download URL for this platform' });
    }

    return res.redirect(302, versionInfo.download_url);
  } catch (err) {
    console.error('[Version Download API] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================
// POST /api/version - Create/update version
// ============================================================
router.post('/', async (req, res) => {
  try {
    const { version, download_url_windows, download_url_mac, download_url_linux, release_notes, is_mandatory } = req.body;

    if (!version) {
      return res.status(400).json({ error: 'version is required' });
    }

    const { data, error } = await supabase
      .from('app_versions')
      .upsert(
        {
          version,
          download_url_windows: download_url_windows || null,
          download_url_mac: download_url_mac || null,
          download_url_linux: download_url_linux || null,
          release_notes: release_notes || null,
          is_mandatory: is_mandatory || false,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'version' }
      )
      .select()
      .single();

    if (error) {
      console.error('[Version API] Insert error:', error);
      return res.status(500).json({ error: 'Failed to save version' });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('[Version API] Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================
// Helper Functions
// ============================================================
async function fetchVersionInfo(platform: string): Promise<VersionInfo> {
  // Try RPC first
  try {
    const { data, error } = await supabase
      .rpc('get_latest_app_version', { target_platform: platform })
      .maybeSingle<AppVersionRow>();

    if (!error && data) {
      return {
        latest_version: data.version,
        release_date: data.release_date,
        release_notes: data.release_notes,
        is_mandatory: data.is_mandatory,
        download_url: data.download_url,
      };
    }
  } catch {
    // Fall through to direct query
  }

  // Direct query fallback
  const { data, error } = await supabase
    .from('app_versions')
    .select('version, release_date, release_notes, is_mandatory, download_url_windows, download_url_mac, download_url_linux')
    .eq('is_active', true)
    .order('release_date', { ascending: false })
    .limit(1)
    .maybeSingle<AppVersionRaw>();

  if (error || !data) {
    return { latest_version: null, download_url: null };
  }

  const downloadUrl =
    platform === 'darwin'
      ? data.download_url_mac
      : platform === 'linux'
      ? data.download_url_linux
      : data.download_url_windows;

  return {
    latest_version: data.version,
    release_date: data.release_date,
    release_notes: data.release_notes,
    is_mandatory: data.is_mandatory,
    download_url: downloadUrl,
  };
}

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

export default router;

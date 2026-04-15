// ============================================================
// Admin API Service
// Calls server API endpoints with Admin API Key
// ============================================================

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000/api';
const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || '';

// Singleton admin token for server-side operations
let _adminApiKey: string | null = null;

export function setAdminApiKey(key: string) {
  _adminApiKey = key;
}

export function getAdminApiKey(): string | null {
  if (_adminApiKey) return _adminApiKey;
  return ADMIN_API_KEY || null;
}

async function adminFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const apiKey = getAdminApiKey();

  if (!apiKey) {
    throw new Error(
      'Admin API key not configured. Set NEXT_PUBLIC_ADMIN_API_KEY in .env.local'
    );
  }

  const response = await fetch(`${SERVER_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Api-Key': apiKey,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Request failed: ${response.status}`);
  }

  return data;
}

// ============================================================
// Whitelist API
// ============================================================

export interface WhitelistEntry {
  id: string;
  email: string;
  name?: string;
  role?: string;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface WhitelistStats {
  teachers: number;
  students: number;
  total: number;
}

export const adminWhitelistApi = {
  /**
   * List whitelist entries
   * @param type - 'student' | 'teacher' | undefined (all)
   * @param page - Page number (default 1)
   * @param search - Search email/name
   * @param limit - Items per page (default 15)
   */
  async list(
    type?: 'student' | 'teacher',
    page = 1,
    search?: string,
    limit = 15
  ): Promise<{ data: WhitelistEntry[]; total: number; page: number }> {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    params.set('page', String(page));
    if (search) params.set('search', search);
    params.set('limit', String(limit));

    const data = await adminFetch(`/admin/whitelist?${params.toString()}`);
    return {
      data: data.data || [],
      total: data.total || 0,
      page: data.page || 1,
    };
  },

  /**
   * Add or update whitelist entry
   */
  async add(email: string, role: string, name?: string): Promise<void> {
    await adminFetch('/admin/whitelist', {
      method: 'POST',
      body: JSON.stringify({ email, role, name }),
    });
  },

  /**
   * Bulk add whitelist entries
   */
  async bulkAdd(
    emails: string[],
    role: string
  ): Promise<{ added: number; failed: number }> {
    const data = await adminFetch('/admin/whitelist/bulk', {
      method: 'POST',
      body: JSON.stringify({ emails, role }),
    });
    return { added: data.added || 0, failed: data.failed || 0 };
  },

  /**
   * Remove email from whitelist
   */
  async remove(email: string, role: string): Promise<void> {
    await adminFetch('/admin/whitelist', {
      method: 'POST',
      body: JSON.stringify({ email, role, action: 'delete' }),
    });
  },

  /**
   * Get whitelist statistics
   */
  async stats(): Promise<WhitelistStats> {
    const data = await adminFetch('/admin/whitelist/stats');
    return data.stats || { teachers: 0, students: 0, total: 0 };
  },
};

import { supabase } from '../config/supabase.js';
import crypto from 'crypto';

export interface TrustedDevice {
  id: string;
  user_id: string;
  device_token_hash: string;
  user_agent?: string;
  ip_address?: string;
  expires_at: string;
  created_at: string;
  last_used_at: string;
}

export const TrustedDeviceDB = {
  hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  },

  async findValidDevice(userId: string, rawToken: string): Promise<TrustedDevice | null> {
    if (!rawToken) return null;

    const tokenHash = this.hashToken(rawToken);
    console.log(`[TrustedDevice] findValidDevice: userId=${userId}, rawToken=${rawToken.substring(0, 8)}..., hash=${tokenHash.substring(0, 8)}...`);
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('trusted_devices')
      .select('*')
      .eq('user_id', userId)
      .eq('device_token_hash', tokenHash)
      .gt('expires_at', now)
      .single();

    if (error || !data) {
      console.log(`[TrustedDevice] findValidDevice: NOT FOUND (error: ${error?.message || 'no data'})`);
      return null;
    }
    console.log(`[TrustedDevice] findValidDevice: FOUND, id=${data.id}, expires_at=${data.expires_at}`);
    return data as TrustedDevice;
  },

  async create(data: {
    userId: string;
    rawToken: string;
    userAgent?: string;
    ipAddress?: string;
    daysValid?: number;
  }): Promise<TrustedDevice> {
    const tokenHash = this.hashToken(data.rawToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (data.daysValid ?? 30));

    const insertData = {
      user_id: data.userId,
      device_token_hash: tokenHash,
      user_agent: data.userAgent || null,
      ip_address: data.ipAddress || null,
      expires_at: expiresAt.toISOString(),
    };

    const { data: inserted, error } = await supabase
      .from('trusted_devices')
      .upsert(insertData, {
        onConflict: 'user_id,device_token_hash',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) throw error;
    console.log(`[TrustedDevice] Created: id=${inserted.id}, user_id=${inserted.user_id}, expires_at=${inserted.expires_at}`);
    return inserted as TrustedDevice;
  },

  async updateLastUsed(id: string): Promise<void> {
    const { error } = await supabase
      .from('trusted_devices')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', id);

    if (error) console.error('[TrustedDevice] updateLastUsed error:', error.message);
  },

  async revokeAll(userId: string): Promise<number> {
    const { error, count } = await supabase
      .from('trusted_devices')
      .delete()
      .eq('user_id', userId)
      .select();

    if (error) throw error;
    return count ?? 0;
  },

  async revokeExpired(): Promise<number> {
    const now = new Date().toISOString();
    const { error, count } = await supabase
      .from('trusted_devices')
      .delete()
      .lt('expires_at', now)
      .select();

    if (error) {
      console.error('[TrustedDevice] revokeExpired error:', error.message);
      return 0;
    }
    return count ?? 0;
  },

  async listByUser(userId: string): Promise<TrustedDevice[]> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('trusted_devices')
      .select('*')
      .eq('user_id', userId)
      .gt('expires_at', now)
      .order('last_used_at', { ascending: false });

    if (error) throw error;
    return (data || []) as TrustedDevice[];
  },
};

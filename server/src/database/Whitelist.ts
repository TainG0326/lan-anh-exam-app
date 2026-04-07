import { supabase } from '../config/supabase.js';

export interface EmailWhitelist {
  id: string;
  email: string;
  name?: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const WhitelistDB = {
  async findByEmail(email: string): Promise<EmailWhitelist | null> {
    const { data, error } = await supabase
      .from('email_whitelist')
      .select('*')
      .ilike('email', email)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;
    return data as EmailWhitelist;
  },

  async isEmailWhitelisted(email: string): Promise<boolean> {
    const whitelist = await this.findByEmail(email);
    return whitelist !== null;
  },

  async create(entry: {
    email: string;
    name?: string;
    role?: string;
  }): Promise<EmailWhitelist> {
    const { data, error } = await supabase
      .from('email_whitelist')
      .insert({
        email: entry.email.toLowerCase(),
        name: entry.name,
        role: entry.role || 'teacher',
      })
      .select()
      .single();

    if (error) throw error;
    return data as EmailWhitelist;
  },

  async deactivate(email: string): Promise<void> {
    const { error } = await supabase
      .from('email_whitelist')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .ilike('email', email);

    if (error) throw error;
  },

  async list(): Promise<EmailWhitelist[]> {
    const { data, error } = await supabase
      .from('email_whitelist')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as EmailWhitelist[];
  },
};

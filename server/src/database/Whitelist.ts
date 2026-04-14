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

export interface TeacherWhitelist {
  id: string;
  email: string;
  name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentWhitelist {
  id: string;
  email: string;
  name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const TeacherWhitelistDB = {
  async findByEmail(email: string): Promise<TeacherWhitelist | null> {
    const { data, error } = await supabase
      .from('teacher_whitelist')
      .select('*')
      .ilike('email', email)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;
    return data as TeacherWhitelist;
  },

  async isEmailWhitelisted(email: string): Promise<boolean> {
    const whitelist = await this.findByEmail(email);
    return whitelist !== null;
  },

  async create(entry: {
    email: string;
    name?: string;
  }): Promise<TeacherWhitelist> {
    const { data, error } = await supabase
      .from('teacher_whitelist')
      .upsert({
        email: entry.email.toLowerCase(),
        name: entry.name,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' })
      .select()
      .single();

    if (error) throw error;
    return { ...data, role: 'teacher' } as TeacherWhitelist;
  },

  async deactivate(email: string): Promise<void> {
    const { error } = await supabase
      .from('teacher_whitelist')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .ilike('email', email);

    if (error) throw error;
  },

  async activate(email: string): Promise<void> {
    const { error } = await supabase
      .from('teacher_whitelist')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .ilike('email', email);

    if (error) throw error;
  },

  async list(): Promise<TeacherWhitelist[]> {
    const { data, error } = await supabase
      .from('teacher_whitelist')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as TeacherWhitelist[];
  },

  async count(): Promise<number> {
    const { count, error } = await supabase
      .from('teacher_whitelist')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (error) return 0;
    return count || 0;
  },
};

export const StudentWhitelistDB = {
  async findByEmail(email: string): Promise<StudentWhitelist | null> {
    const { data, error } = await supabase
      .from('student_whitelist')
      .select('*')
      .ilike('email', email)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;
    return data as StudentWhitelist;
  },

  async isEmailWhitelisted(email: string): Promise<boolean> {
    const whitelistEnabled = process.env.STUDENT_WHITELIST_ENABLED !== 'false';
    
    if (!whitelistEnabled) {
      return true; // Students can register freely if whitelist is disabled
    }

    const whitelist = await this.findByEmail(email);
    return whitelist !== null;
  },

  async create(entry: {
    email: string;
    name?: string;
  }): Promise<StudentWhitelist> {
    const { data, error } = await supabase
      .from('student_whitelist')
      .upsert({
        email: entry.email.toLowerCase(),
        name: entry.name,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' })
      .select()
      .single();

    if (error) throw error;
    return data as StudentWhitelist;
  },

  async deactivate(email: string): Promise<void> {
    const { error } = await supabase
      .from('student_whitelist')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .ilike('email', email);

    if (error) throw error;
  },

  async activate(email: string): Promise<void> {
    const { error } = await supabase
      .from('student_whitelist')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .ilike('email', email);

    if (error) throw error;
  },

  async list(): Promise<StudentWhitelist[]> {
    const { data, error } = await supabase
      .from('student_whitelist')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as StudentWhitelist[];
  },

  async count(): Promise<number> {
    const { count, error } = await supabase
      .from('student_whitelist')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (error) return 0;
    return count || 0;
  },
};

// Unified email_whitelist check - uses the common email_whitelist table
export const EmailWhitelistDB = {
  async findByEmail(email: string, role?: string): Promise<EmailWhitelist | null> {
    let query = supabase
      .from('email_whitelist')
      .select('*')
      .ilike('email', email)
      .eq('is_active', true);
    
    if (role) {
      query = query.eq('role', role);
    }
    
    const { data, error } = await query.single();

    if (error || !data) return null;
    return data as EmailWhitelist;
  },

  async isEmailWhitelisted(email: string, role: string): Promise<boolean> {
    const whitelist = await this.findByEmail(email, role);
    return whitelist !== null;
  },

  async create(entry: {
    email: string;
    name?: string;
    role: string;
  }): Promise<EmailWhitelist> {
    const { data, error } = await supabase
      .from('email_whitelist')
      .upsert({
        email: entry.email.toLowerCase(),
        name: entry.name,
        role: entry.role,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' })
      .select()
      .single();

    if (error) throw error;
    return data as EmailWhitelist;
  },

  async deactivate(email: string, role?: string): Promise<void> {
    let query = supabase
      .from('email_whitelist')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .ilike('email', email);
    
    if (role) {
      query = query.eq('role', role);
    }

    const { error } = await query;
    if (error) throw error;
  },

  async activate(email: string, role?: string): Promise<void> {
    let query = supabase
      .from('email_whitelist')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .ilike('email', email);
    
    if (role) {
      query = query.eq('role', role);
    }

    const { error } = await query;
    if (error) throw error;
  },

  async list(role?: string): Promise<EmailWhitelist[]> {
    let query = supabase
      .from('email_whitelist')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (role) {
      query = query.eq('role', role);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as EmailWhitelist[];
  },

  async count(role?: string): Promise<number> {
    let query = supabase
      .from('email_whitelist')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    if (role) {
      query = query.eq('role', role);
    }

    const { count, error } = await query;
    if (error) return 0;
    return count || 0;
  },
};
  async findByEmail(email: string): Promise<EmailWhitelist | null> {
    const result = await TeacherWhitelistDB.findByEmail(email);
    if (!result) return null;
    return { ...result, role: 'teacher' } as EmailWhitelist;
  },

  async isEmailWhitelisted(email: string): Promise<boolean> {
    return TeacherWhitelistDB.isEmailWhitelisted(email);
  },

  async create(entry: {
    email: string;
    name?: string;
    role?: string;
  }): Promise<EmailWhitelist> {
    const result = await TeacherWhitelistDB.create({ email: entry.email, name: entry.name });
    return { ...result, role: 'teacher' } as EmailWhitelist;
  },

  async deactivate(email: string): Promise<void> {
    return TeacherWhitelistDB.deactivate(email);
  },

  async list(): Promise<EmailWhitelist[]> {
    const results = await TeacherWhitelistDB.list();
    return results.map(r => ({ ...r, role: 'teacher' })) as EmailWhitelist[];
  },
};

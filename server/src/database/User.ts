import { supabase } from '../config/supabase.js';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: 'teacher' | 'student' | 'admin';
  student_id?: string;
  class_id?: string;
  avatar_url?: string;
  phone?: string;
  date_of_birth?: string;
  two_factor_enabled?: boolean;
  two_factor_secret?: string;
  two_factor_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const UserDB = {
  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('email', email)
      .single();

    if (error || !data) return null;
    return data as User;
  },

  async findById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data as User;
  },

  async create(userData: {
    email: string;
    password?: string;
    name: string;
    role: 'teacher' | 'student';
    studentId?: string;
    classId?: string;
    avatar_url?: string;
  }): Promise<User> {
    const insertData: Record<string, unknown> = {
      email: userData.email.toLowerCase(),
      name: userData.name,
      role: userData.role,
      student_id: userData.studentId || null,
      class_id: userData.classId || null,
    };

    if (userData.password) {
      insertData.password = await bcrypt.hash(userData.password, 12);
    } else {
      // Google OAuth users don't have a password - use a placeholder hash
      insertData.password = await bcrypt.hash('GOOGLE_OAUTH_USER_' + userData.email, 12);
    }

    if (userData.avatar_url) {
      insertData.avatar_url = userData.avatar_url;
    }

    const { data, error } = await supabase.from('users').insert(insertData).select().single();

    if (error) throw error;
    return data as User;
  },

  async updateClassId(userId: string, classId: string | null): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ class_id: classId })
      .eq('id', userId);

    if (error) throw error;
  },

  async comparePassword(hashedPassword: string, candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, hashedPassword);
  },

  async update(userId: string, updateData: { name?: string; email?: string; password?: string; avatar_url?: string; phone?: string; date_of_birth?: string; two_factor_enabled?: boolean; two_factor_verified?: boolean; two_factor_secret?: string }): Promise<User> {
    const updateFields: any = {
      updated_at: new Date().toISOString(),
    };

    if (updateData.name) updateFields.name = updateData.name;
    if (updateData.email) updateFields.email = updateData.email.toLowerCase();
    if (updateData.password) updateFields.password = updateData.password;
    // Normalize avatar_url: skip if falsy (false, null, empty) to avoid type errors
    if (updateData.avatar_url && typeof updateData.avatar_url === 'string') {
      updateFields.avatar_url = updateData.avatar_url;
    }
    // Normalize phone: ensure string, deduplicate if prefix+digits was double-saved, truncate to 20
    if (updateData.phone !== undefined && updateData.phone !== null) {
      let phoneStr = String(updateData.phone).trim();

      // Detect and fix duplication: find if phone was prefix+digits+digits
      // Try to split phone into prefix (country code) + rest, then check if rest is duplicated
      // Try prefix lengths from 3 chars (e.g., +84) up to 5 chars (e.g., +1234)
      let bestPhone = phoneStr;
      outer:
      for (let prefixLen = 3; prefixLen <= 5; prefixLen++) {
        if (phoneStr.length < prefixLen) break;
        const prefix = phoneStr.slice(0, prefixLen);
        const rest = phoneStr.slice(prefixLen);
        // Try all possible rest lengths (must be >= 9 for valid phone, and even for duplication)
        for (let digitLen = rest.length - 1; digitLen >= 9; digitLen--) {
          const candidate = rest.slice(0, digitLen);
          if (candidate + candidate === rest) {
            bestPhone = `${prefix}${candidate}`;
            console.log(`[UserDB.update] Deduped phone (prefixLen=${prefixLen}, digitLen=${digitLen}): ${bestPhone}`);
            break outer;
          }
        }
      }
      // Fallback: if phone is suspiciously long (>13 chars for +84 phones), truncate to 13
      if (bestPhone.length > 13 && bestPhone.startsWith('+84')) {
        console.log(`[UserDB.update] Suspiciously long phone (${bestPhone.length} chars), truncating to 13`);
        bestPhone = bestPhone.slice(0, 13);
      }
      phoneStr = bestPhone;

      // Final safety: truncate to 20 chars
      if (phoneStr.length > 20) {
        phoneStr = phoneStr.substring(0, 20);
        console.log(`[UserDB.update] Truncated phone to 20 chars`);
      }

      updateFields.phone = phoneStr || null;
    }
    // Normalize date_of_birth: ensure string
    if (updateData.date_of_birth !== undefined && updateData.date_of_birth !== null) {
      const dobStr = String(updateData.date_of_birth).trim();
      updateFields.date_of_birth = dobStr || null;
    }
    if (updateData.two_factor_enabled !== undefined) updateFields.two_factor_enabled = updateData.two_factor_enabled;
    if (updateData.two_factor_verified !== undefined) updateFields.two_factor_verified = updateData.two_factor_verified;
    if (updateData.two_factor_secret !== undefined) updateFields.two_factor_secret = updateData.two_factor_secret;

    console.log(`[UserDB.update] updateFields:`, JSON.stringify(updateFields));

    const { data, error } = await supabase
      .from('users')
      .update(updateFields)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as User;
  },
};






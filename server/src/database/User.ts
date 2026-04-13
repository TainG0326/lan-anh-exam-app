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
    // Normalize phone: ensure string, not boolean
    if (updateData.phone !== undefined && updateData.phone !== null) {
      const phoneStr = String(updateData.phone).trim();
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






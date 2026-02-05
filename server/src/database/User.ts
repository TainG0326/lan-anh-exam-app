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
  created_at?: string;
  updated_at?: string;
}

export const UserDB = {
  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
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
    password: string;
    name: string;
    role: 'teacher' | 'student';
    studentId?: string;
    classId?: string;
  }): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    const { data, error } = await supabase
      .from('users')
      .insert({
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        name: userData.name,
        role: userData.role,
        student_id: userData.studentId || null,
        class_id: userData.classId || null,
      })
      .select()
      .single();

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

  async update(userId: string, updateData: { name?: string; email?: string; password?: string; avatar_url?: string }): Promise<User> {
    const updateFields: any = {
      updated_at: new Date().toISOString(),
    };

    if (updateData.name) updateFields.name = updateData.name;
    if (updateData.email) updateFields.email = updateData.email.toLowerCase();
    if (updateData.password) updateFields.password = updateData.password;
    if (updateData.avatar_url !== undefined) updateFields.avatar_url = updateData.avatar_url;

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






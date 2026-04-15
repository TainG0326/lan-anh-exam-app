import { supabase } from '../config/supabase.js';

export interface Class {
  id: string;
  name: string;
  grade: 'THCS' | 'THPT';
  level: string;
  class_code: string;
  teacher_id: string;
  created_at?: string;
  updated_at?: string;
}

export const ClassDB = {
  async create(classData: {
    name: string;
    grade: 'THCS' | 'THPT';
    level: string;
    teacherId: string;
    classCode: string;
  }): Promise<Class> {
    const { data, error } = await supabase
      .from('classes')
      .insert({
        name: classData.name,
        grade: classData.grade,
        level: classData.level,
        class_code: classData.classCode,
        teacher_id: classData.teacherId,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Class;
  },

  async findByTeacherId(teacherId: string): Promise<Class[]> {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        class_students (
          student_id,
          users:student_id (
            id,
            name,
            email,
            student_id
          )
        )
      `)
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Class[];
  },

  async findById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        class_students (
          student_id,
          users:student_id (
            id,
            name,
            email,
            student_id
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) return null;
    
    // Transform the data to match expected format
    const classData = data as any;
    const students = (classData.class_students || []).map((cs: any) => cs.users).filter(Boolean);
    
    return {
      ...classData,
      students,
    };
  },

  async addStudent(classId: string, studentId: string): Promise<void> {
    const { error } = await supabase
      .from('class_students')
      .insert({
        class_id: classId,
        student_id: studentId,
      });

    if (error && error.code !== '23505') throw error; // Ignore duplicate key error
  },

  async findByStudentId(studentId: string): Promise<Class | null> {
    const { data, error } = await supabase
      .from('class_students')
      .select('classes(*)')
      .eq('student_id', studentId)
      .single();

    if (error || !data) return null;
    return (data.classes as any) as Class;
  },

  async findByCode(classCode: string): Promise<Class | null> {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('class_code', classCode.toUpperCase())
      .single();

    if (error || !data) return null;
    return data as Class;
  },

  async update(
    id: string,
    updates: { name?: string; grade?: string; level?: string; is_locked?: boolean }
  ): Promise<Class | null> {
    const updateData: Record<string, any> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.grade !== undefined) updateData.grade = updates.grade;
    if (updates.level !== undefined) updateData.level = updates.level;
    if (updates.is_locked !== undefined) updateData.is_locked = updates.is_locked;

    const { data, error } = await supabase
      .from('classes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) return null;
    return data as Class;
  },
};


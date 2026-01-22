import { supabase } from '../config/supabase.js';

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  course_id?: string;
  class_id: string;
  teacher_id: string;
  questions: any[];
  due_date: string;
  total_points: number;
  created_at?: string;
  updated_at?: string;
}

export const AssignmentDB = {
  async create(assignmentData: Partial<Assignment>): Promise<Assignment> {
    const { data, error } = await supabase
      .from('assignments')
      .insert({
        title: assignmentData.title,
        description: assignmentData.description,
        course_id: assignmentData.course_id || null,
        class_id: assignmentData.class_id,
        teacher_id: assignmentData.teacher_id,
        questions: assignmentData.questions || [],
        due_date: assignmentData.due_date,
        total_points: assignmentData.total_points || 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Assignment;
  },

  async findByTeacherId(teacherId: string): Promise<Assignment[]> {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        classes (
          id,
          name
        ),
        courses (
          id,
          title
        )
      `)
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as any;
  },

  async findByClassId(classId: string): Promise<Assignment[]> {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        classes (
          id,
          name
        ),
        courses (
          id,
          title
        )
      `)
      .eq('class_id', classId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as any;
  },

  async findById(id: string): Promise<Assignment | null> {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data as Assignment;
  },
};







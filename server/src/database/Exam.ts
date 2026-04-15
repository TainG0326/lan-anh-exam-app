import { supabase } from '../config/supabase.js';

export interface ExamQuestion {
  question: string;
  type: 'multiple-choice' | 'fill-blank' | 'reading-comprehension';
  options?: string[];
  correctAnswer: string | string[];
  points: number;
  explanation?: string;
}

export type ExamStatus = 'draft' | 'active' | 'closed';

export interface Exam {
  id: string;
  title: string;
  description?: string;
  exam_code: string;
  access_key: string;
  class_id: string;
  allowed_class_id: string;
  teacher_id: string;
  questions: ExamQuestion[];
  start_time: string;
  end_time: string;
  duration: number;
  total_points: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  require_webcam: boolean;
  auto_submit: boolean;
  is_lockdown_required: boolean;
  status: ExamStatus;
  created_at?: string;
  updated_at?: string;
}

export const ExamDB = {
  async create(examData: Partial<Exam>): Promise<Exam> {
    const { data, error } = await supabase
      .from('exams')
      .insert({
        title: examData.title,
        description: examData.description,
        exam_code: examData.exam_code,
        access_key: examData.access_key,
        class_id: examData.class_id,
        allowed_class_id: examData.allowed_class_id,
        teacher_id: examData.teacher_id,
        questions: examData.questions || [],
        start_time: examData.start_time,
        end_time: examData.end_time,
        duration: examData.duration,
        total_points: examData.total_points || 0,
        shuffle_questions: examData.shuffle_questions || false,
        shuffle_options: examData.shuffle_options || false,
        require_webcam: examData.require_webcam || false,
        auto_submit: examData.auto_submit !== false,
        is_lockdown_required: examData.is_lockdown_required || false,
        status: examData.status || 'draft',
      })
      .select()
      .single();

    if (error) throw error;
    return data as Exam;
  },

  async findByCode(code: string): Promise<Exam | null> {
    const { data, error } = await supabase
      .from('exams')
      .select(`
        *,
        classes (
          id,
          name
        ),
        users:teacher_id (
          id,
          name
        )
      `)
      .eq('exam_code', code.toUpperCase())
      .single();

    if (error || !data) return null;
    return data as any;
  },

  async findByAccessKey(accessKey: string): Promise<Exam | null> {
    const { data, error } = await supabase
      .from('exams')
      .select(`
        *,
        classes:allowed_class_id (
          id,
          name
        ),
        users:teacher_id (
          id,
          name
        )
      `)
      .eq('access_key', accessKey.toUpperCase())
      .single();

    if (error || !data) return null;
    return data as any;
  },

  async findById(id: string): Promise<Exam | null> {
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data as Exam;
  },

  async findByIdWithRelations(id: string): Promise<Exam | null> {
    const { data, error } = await supabase
      .from('exams')
      .select(`
        *,
        classes:allowed_class_id (
          id,
          name
        ),
        class_students (
          student_id
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data as any;
  },

  async findByTeacherId(teacherId: string): Promise<Exam[]> {
    const { data, error } = await supabase
      .from('exams')
      .select(`
        *,
        classes:allowed_class_id (
          id,
          name
        )
      `)
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Exam[];
  },

  async findByClassId(classId: string): Promise<Exam[]> {
    const { data, error } = await supabase
      .from('exams')
      .select(`
        *,
        classes:allowed_class_id (
          id,
          name
        )
      `)
      .eq('allowed_class_id', classId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Exam[];
  },

  async findByAllowedClassId(classId: string): Promise<Exam[]> {
    return this.findByClassId(classId);
  },

  async update(
    id: string,
    updates: Partial<Exam>
  ): Promise<Exam | null> {
    const updateFields: Record<string, any> = {};
    if (updates.title !== undefined) updateFields.title = updates.title;
    if (updates.description !== undefined) updateFields.description = updates.description;
    if (updates.questions !== undefined) updateFields.questions = updates.questions;
    if (updates.start_time !== undefined) updateFields.start_time = updates.start_time;
    if (updates.end_time !== undefined) updateFields.end_time = updates.end_time;
    if (updates.duration !== undefined) updateFields.duration = updates.duration;
    if (updates.shuffle_questions !== undefined) updateFields.shuffle_questions = updates.shuffle_questions;
    if (updates.shuffle_options !== undefined) updateFields.shuffle_options = updates.shuffle_options;
    if (updates.require_webcam !== undefined) updateFields.require_webcam = updates.require_webcam;
    if (updates.auto_submit !== undefined) updateFields.auto_submit = updates.auto_submit;
    if (updates.is_lockdown_required !== undefined) updateFields.is_lockdown_required = updates.is_lockdown_required;
    if (updates.allowed_class_id !== undefined) updateFields.allowed_class_id = updates.allowed_class_id;
    if (updates.status !== undefined) updateFields.status = updates.status;
    if (updates.access_key !== undefined) updateFields.access_key = updates.access_key;

    const { data, error } = await supabase
      .from('exams')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) return null;
    return data as Exam;
  },

  async updateStatus(id: string, status: ExamStatus): Promise<void> {
    const { error } = await supabase
      .from('exams')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async isStudentEnrolledInClass(studentId: string, classId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('class_students')
      .select('student_id')
      .eq('class_id', classId)
      .eq('student_id', studentId)
      .single();

    if (error || !data) return false;
    return true;
  },

  async findActiveExams(): Promise<Exam[]> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('status', 'active')
      .lte('end_time', now);

    if (error) throw error;
    return (data || []) as Exam[];
  },

  async closeExpiredExams(): Promise<number> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('exams')
      .update({ status: 'closed' })
      .eq('status', 'active')
      .lt('end_time', now)
      .select('id');

    if (error) throw error;
    return (data || []).length;
  },
};

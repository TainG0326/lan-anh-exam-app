import { supabase } from '../config/supabase.js';

export interface ExamQuestion {
  question: string;
  type: 'multiple-choice' | 'fill-blank' | 'reading-comprehension';
  options?: string[];
  correctAnswer: string | string[];
  points: number;
  explanation?: string;
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  exam_code: string;
  class_id: string;
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
  status: 'draft' | 'active' | 'completed';
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
        class_id: examData.class_id,
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

  async findById(id: string): Promise<Exam | null> {
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data as Exam;
  },

  async findByTeacherId(teacherId: string): Promise<Exam[]> {
    const { data, error } = await supabase
      .from('exams')
      .select(`
        *,
        classes (
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
        classes (
          id,
          name
        )
      `)
      .eq('class_id', classId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Exam[];
  },

  async updateStatus(id: string, status: 'draft' | 'active' | 'completed'): Promise<void> {
    const { error } = await supabase
      .from('exams')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
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
};







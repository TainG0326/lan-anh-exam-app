import { supabase } from '../config/supabase.js';

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  answers: Record<string, any>;
  score?: number;
  graded: boolean;
  feedback?: string;
  submitted_at?: string;
  created_at?: string;
  updated_at?: string;
}

export const SubmissionDB = {
  async create(submissionData: {
    assignmentId: string;
    studentId: string;
    answers: Record<string, any>;
  }): Promise<Submission> {
    const { data, error } = await supabase
      .from('submissions')
      .insert({
        assignment_id: submissionData.assignmentId,
        student_id: submissionData.studentId,
        answers: submissionData.answers,
        submitted_at: new Date().toISOString(),
        graded: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Submission;
  },

  async findByAssignmentAndStudent(assignmentId: string, studentId: string): Promise<Submission | null> {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId)
      .single();

    if (error || !data) return null;
    return data as Submission;
  },

  async update(assignmentId: string, studentId: string, answers: Record<string, any>): Promise<Submission> {
    const { data, error } = await supabase
      .from('submissions')
      .update({
        answers,
        submitted_at: new Date().toISOString(),
      })
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId)
      .select()
      .single();

    if (error) throw error;
    return data as Submission;
  },

  async grade(id: string, score: number, feedback?: string): Promise<void> {
    const { error } = await supabase
      .from('submissions')
      .update({
        score,
        feedback,
        graded: true,
      })
      .eq('id', id);

    if (error) throw error;
  },

  async findByAssignmentId(assignmentId: string): Promise<Submission[]> {
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        users:student_id (
          id,
          name,
          email,
          student_id
        )
      `)
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return (data || []) as any;
  },
};







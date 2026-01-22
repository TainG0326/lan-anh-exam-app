import { supabase } from '../config/supabase.js';

export interface ExamAttempt {
  id: string;
  exam_id: string;
  student_id: string;
  answers: Record<string, any>;
  score?: number;
  graded: boolean;
  started_at: string;
  submitted_at?: string;
  auto_submitted: boolean;
  violations: any[];
  flagged: boolean; // Flagged for teacher review
  flagged_reason?: string; // Reason for flagging
  reviewed: boolean; // Teacher has reviewed
  time_spent: number;
  created_at?: string;
  updated_at?: string;
}

export const ExamAttemptDB = {
  async create(attemptData: {
    examId: string;
    studentId: string;
    startedAt: string;
  }): Promise<ExamAttempt> {
    const { data, error } = await supabase
      .from('exam_attempts')
      .insert({
        exam_id: attemptData.examId,
        student_id: attemptData.studentId,
        started_at: attemptData.startedAt,
        answers: {},
        graded: false,
        auto_submitted: false,
        violations: [],
        flagged: false,
        reviewed: false,
        time_spent: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data as ExamAttempt;
  },

  async findByExamAndStudent(examId: string, studentId: string): Promise<ExamAttempt | null> {
    const { data, error } = await supabase
      .from('exam_attempts')
      .select('*')
      .eq('exam_id', examId)
      .eq('student_id', studentId)
      .single();

    if (error || !data) return null;
    return data as ExamAttempt;
  },

  async updateAnswers(id: string, answers: Record<string, any>): Promise<void> {
    const { error } = await supabase
      .from('exam_attempts')
      .update({ answers })
      .eq('id', id);

    if (error) throw error;
  },

  async submit(id: string, submittedAt: string, score?: number): Promise<void> {
    const updateData: any = {
      submitted_at: submittedAt,
      graded: score !== undefined,
    };
    if (score !== undefined) {
      updateData.score = score;
    }

    const { error } = await supabase
      .from('exam_attempts')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  },

  async addViolation(id: string, violation: any): Promise<void> {
    const attempt = await this.findById(id);
    if (!attempt) throw new Error('Attempt not found');

    const violations = [...(attempt.violations || []), violation];
    
    // Flag for review if high severity violations (but don't force submit)
    const highSeverityCount = violations.filter((v: any) => v.severity >= 3).length;
    const shouldFlag = highSeverityCount >= 3 || violations.length >= 10;

    const updateData: any = {
      violations,
    };

    if (shouldFlag && !attempt.flagged) {
      updateData.flagged = true;
      updateData.flagged_reason = `Multiple violations detected: ${highSeverityCount} high severity, ${violations.length} total`;
    }

    const { error } = await supabase
      .from('exam_attempts')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  },

  async flagForReview(id: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from('exam_attempts')
      .update({ 
        flagged: true,
        flagged_reason: reason,
        reviewed: false,
      })
      .eq('id', id);

    if (error) throw error;
  },

  async markAsReviewed(id: string): Promise<void> {
    const { error } = await supabase
      .from('exam_attempts')
      .update({ reviewed: true })
      .eq('id', id);

    if (error) throw error;
  },

  async findById(id: string): Promise<ExamAttempt | null> {
    const { data, error } = await supabase
      .from('exam_attempts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data as ExamAttempt;
  },

  async findByExamId(examId: string): Promise<ExamAttempt[]> {
    const { data, error } = await supabase
      .from('exam_attempts')
      .select(`
        *,
        users:student_id (
          id,
          name,
          email,
          student_id
        )
      `)
      .eq('exam_id', examId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ExamAttempt[];
  },

  async updateTimeSpent(id: string, timeSpent: number): Promise<void> {
    const { error } = await supabase
      .from('exam_attempts')
      .update({ time_spent: timeSpent })
      .eq('id', id);

    if (error) throw error;
  },
};

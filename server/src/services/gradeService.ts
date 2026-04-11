import { supabase } from '../config/supabase.js';

export interface StudentGrade {
  studentId: string;
  studentName: string;
  studentEmail: string;
  examScores: { examId: string; examTitle: string; score: number; totalPoints: number }[];
  assignmentScores: { assignmentId: string; assignmentTitle: string; score: number; totalPoints: number }[];
  averageScore: number;
  totalExams: number;
  totalAssignments: number;
}

export interface ClassStatistics {
  average: number;
  highest: number;
  lowest: number;
  totalStudents: number;
  totalExams: number;
  totalAssignments: number;
}

interface ExamAttempt {
  student_id: string;
  exam_id: string;
  score: number;
  exams: { title: string; total_points: number } | null;
}

interface Submission {
  student_id: string;
  assignment_id: string;
  score: number;
  assignments: { title: string; total_points: number } | null;
}

export const GradeService = {
  async getGradesByClass(classId: string): Promise<StudentGrade[]> {
    // Get students in the class
    const { data: students, error: studentsError } = await supabase
      .from('users')
      .select('*')
      .eq('class_id', classId)
      .eq('role', 'student');

    if (studentsError) {
      console.error('[GradeService] Error fetching students:', studentsError);
      throw studentsError;
    }

    if (!students || students.length === 0) {
      return [];
    }

    const studentIds = students.map(s => s.id);

    // Get exam attempts for students in this class
    const { data: examAttempts } = await supabase
      .from('exam_attempts')
      .select('*, exams!inner(id, title, class_id, total_points)')
      .in('student_id', studentIds)
      .eq('graded', true)
      .eq('exams.class_id', classId);

    // Get assignment submissions
    const { data: submissions } = await supabase
      .from('submissions')
      .select('*, assignments!inner(id, title, class_id, total_points)')
      .in('student_id', studentIds)
      .eq('graded', true)
      .eq('assignments.class_id', classId);

    // Aggregate grades by student
    return students.map((student) => {
      const studentExamScores = (examAttempts as ExamAttempt[] || [])
        .filter((ea: ExamAttempt) => ea.student_id === student.id)
        .map((ea: ExamAttempt) => ({
          examId: ea.exam_id,
          examTitle: ea.exams?.title || 'Unknown Exam',
          score: ea.score || 0,
          totalPoints: ea.exams?.total_points || 0,
        }));

      const studentAssignmentScores = (submissions as Submission[] || [])
        .filter((s: Submission) => s.student_id === student.id)
        .map((s: Submission) => ({
          assignmentId: s.assignment_id,
          assignmentTitle: s.assignments?.title || 'Unknown Assignment',
          score: s.score || 0,
          totalPoints: s.assignments?.total_points || 0,
        }));

      const allScores = [
        ...studentExamScores.map((e) => e.score),
        ...studentAssignmentScores.map((a) => a.score),
      ];

      const averageScore = allScores.length > 0
        ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 100) / 100
        : 0;

      return {
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email,
        examScores: studentExamScores,
        assignmentScores: studentAssignmentScores,
        averageScore,
        totalExams: studentExamScores.length,
        totalAssignments: studentAssignmentScores.length,
      };
    });
  },

  async getClassStatistics(classId: string): Promise<ClassStatistics> {
    const grades = await this.getGradesByClass(classId);

    const allScores = grades.flatMap((g) => [
      ...g.examScores.map((e) => e.score),
      ...g.assignmentScores.map((a) => a.score),
    ]);

    if (allScores.length === 0) {
      return {
        average: 0,
        highest: 0,
        lowest: 0,
        totalStudents: grades.length,
        totalExams: 0,
        totalAssignments: 0,
      };
    }

    return {
      average: Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 100) / 100,
      highest: Math.max(...allScores),
      lowest: Math.min(...allScores),
      totalStudents: grades.length,
      totalExams: grades.reduce((sum, g) => sum + g.totalExams, 0),
      totalAssignments: grades.reduce((sum, g) => sum + g.totalAssignments, 0),
    };
  },

  async updateExamScore(attemptId: string, score: number) {
    const { data, error } = await supabase
      .from('exam_attempts')
      .update({ score, graded: true })
      .eq('id', attemptId)
      .select()
      .single();

    if (error) {
      console.error('[GradeService] Error updating exam score:', error);
      throw error;
    }

    return data;
  },

  async updateAssignmentScore(submissionId: string, score: number, feedback: string) {
    const { data, error } = await supabase
      .from('submissions')
      .update({ score, feedback, graded: true })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) {
      console.error('[GradeService] Error updating assignment score:', error);
      throw error;
    }

    return data;
  },
};

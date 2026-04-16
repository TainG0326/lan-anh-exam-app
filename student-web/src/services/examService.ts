import api from './api';

export interface ExamQuestion {
  question: string;
  type: 'multiple-choice' | 'fill-blank' | 'reading-comprehension';
  options?: string[];
  correctAnswer: string | string[];
  points: number;
  explanation?: string;
}

export interface Exam {
  id?: string;
  _id?: string;
  title: string;
  description?: string;
  examCode?: string;
  exam_code?: string;
  classId?: string;
  class_id?: string;
  teacherId?: string;
  teacher_id?: string;
  questions: ExamQuestion[];
  startTime?: string;
  start_time?: string;
  endTime?: string;
  end_time?: string;
  duration: number;
  totalPoints?: number;
  total_points?: number;
  shuffleQuestions?: boolean;
  shuffle_questions?: boolean;
  shuffleOptions?: boolean;
  shuffle_options?: boolean;
  requireWebcam?: boolean;
  require_webcam?: boolean;
  autoSubmit?: boolean;
  auto_submit?: boolean;
  status: 'draft' | 'active' | 'completed';
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export const getExams = async () => {
  const response = await api.get<{ success: boolean; exams: Exam[] }>('/exams');
  return response.data.exams || [];
};

export const getExamByCode = async (code: string) => {
  const response = await api.get<{ success: boolean; exam: Exam }>(`/exams/code/${code}`);
  return response.data.exam;
};

export const startExam = async (examId: string) => {
  const response = await api.post<{ success: boolean; attempt: any; exam: Exam }>('/exams/start', {
    examId,
  });
  return response.data;
};

export const submitAnswer = async (examId: string, questionIndex: number, answer: any) => {
  const response = await api.post<{ success: boolean; message: string }>('/exams/submit-answer', {
    examId,
    questionIndex,
    answer,
  });
  return response.data;
};

export const submitExam = async (examId: string, answers: Record<string, any>, timeSpent?: number) => {
  const response = await api.post<{ success: boolean; score: number; message: string }>('/exams/submit', {
    examId,
    answers,
    timeSpent,
  });
  return response.data;
};

export const getStudentAttempt = async (examId: string) => {
  const response = await api.get<{ success: boolean; attempt: any; exam: Exam }>(
    `/exams/${examId}/attempt`
  );
  return response.data;
};

export const recordViolation = async (examId: string, violation: any) => {
  const response = await api.post<{ success: boolean; message: string }>('/exams/violation', {
    examId,
    violation,
  });
  return response.data;
};

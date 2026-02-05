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
  _id: string;
  title: string;
  description: string;
  examCode: string;
  classId: string;
  teacherId: string;
  questions: ExamQuestion[];
  startTime: string;
  endTime: string;
  duration: number;
  totalPoints: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  requireWebcam: boolean;
  autoSubmit: boolean;
  status: 'draft' | 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export const createExam = async (examData: Partial<Exam>) => {
  const response = await api.post<{ success: boolean; exam: Exam }>('/exams', examData);
  return response.data;
};

export const getExams = async () => {
  const response = await api.get<{ success: boolean; data: Exam[] }>('/exams');
  return response.data.data; // Backend returns 'data' not 'exams'
};

export const getExamByCode = async (code: string) => {
  const response = await api.get<{ success: boolean; exam: Exam }>(`/exams/code/${code}`);
  return response.data.exam;
};

export const getExamResults = async (examId: string) => {
  const response = await api.get<{ success: boolean; exam: Exam; attempts: any[] }>(
    `/exams/${examId}/results`
  );
  return response.data;
};







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
  id?: string;
  title: string;
  description: string;
  examCode?: string;
  exam_code?: string;
  accessKey?: string;
  access_key?: string;
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
  shuffleOptions?: boolean;
  requireWebcam?: boolean;
  autoSubmit?: boolean;
  status: 'draft' | 'active' | 'completed';
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

export const createExam = async (examData: {
  title: string;
  description?: string;
  classId: string;
  questions: ExamQuestion[];
  startTime: string;
  endTime: string;
  duration: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  requireWebcam?: boolean;
  status?: 'draft' | 'active';
}) => {
  const payload = {
    title: examData.title,
    description: examData.description || '',
    class_id: examData.classId,
    questions: examData.questions,
    start_time: examData.startTime,
    end_time: examData.endTime,
    duration: examData.duration,
    shuffle_questions: examData.shuffleQuestions || false,
    shuffle_options: examData.shuffleOptions || false,
    require_webcam: examData.requireWebcam || false,
    status: examData.status || 'draft',
  };
  const response = await api.post<{ success: boolean; data: any }>('/exams', payload);
  return response.data;
};

export const getExams = async () => {
  const response = await api.get<{ success: boolean; data: Exam[] }>('/exams');
  return response.data.data || [];
};

export const getExamByCode = async (code: string) => {
  const response = await api.get<{ success: boolean; data: any }>(`/exams/code/${code}`);
  return response.data.data;
};

export const getExamResults = async (examId: string) => {
  const response = await api.get<{ success: boolean; data: any }>(
    `/exams/${examId}/results`
  );
  return response.data.data;
};

export const publishExam = async (examId: string) => {
  const response = await api.put<{ success: boolean; data: any }>(
    `/exams/${examId}`,
    { status: 'active' }
  );
  return response.data;
};







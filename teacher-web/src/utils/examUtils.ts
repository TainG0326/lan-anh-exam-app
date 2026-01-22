// Utility to normalize exam data from backend (snake_case) to frontend format (camelCase)
export interface NormalizedExam {
  id: string;
  _id: string;
  title: string;
  description?: string;
  examCode: string;
  exam_code: string;
  classId: string;
  class_id: string;
  teacherId: string;
  teacher_id: string;
  questions: any[];
  startTime: string;
  start_time: string;
  endTime: string;
  end_time: string;
  duration: number;
  totalPoints: number;
  total_points: number;
  status: 'draft' | 'active' | 'completed';
  requireWebcam: boolean;
  require_webcam: boolean;
}

export const normalizeExam = (exam: any): NormalizedExam => {
  return {
    id: exam.id || exam._id || '',
    _id: exam._id || exam.id || '',
    title: exam.title || '',
    description: exam.description,
    examCode: exam.examCode || exam.exam_code || '',
    exam_code: exam.exam_code || exam.examCode || '',
    classId: exam.classId || exam.class_id || '',
    class_id: exam.class_id || exam.classId || '',
    teacherId: exam.teacherId || exam.teacher_id || '',
    teacher_id: exam.teacher_id || exam.teacherId || '',
    questions: exam.questions || [],
    startTime: exam.startTime || exam.start_time || '',
    start_time: exam.start_time || exam.startTime || '',
    endTime: exam.endTime || exam.end_time || '',
    end_time: exam.end_time || exam.endTime || '',
    duration: exam.duration || 0,
    totalPoints: exam.totalPoints || exam.total_points || 0,
    total_points: exam.total_points || exam.totalPoints || 0,
    status: exam.status || 'draft',
    requireWebcam: exam.requireWebcam || exam.require_webcam || false,
    require_webcam: exam.require_webcam || exam.requireWebcam || false,
  };
};

export const normalizeExams = (exams: any[]): NormalizedExam[] => {
  return exams.map(normalizeExam);
};






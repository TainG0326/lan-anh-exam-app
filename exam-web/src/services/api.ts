import axios from 'axios';

// Configure base URL - change this to your server URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://server-three-blue.vercel.app/api'; 

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('exam_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('exam_token');
      localStorage.removeItem('exam_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const examAuth = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password, isExamLogin: true });
    return response.data;
  },
  
  sendOTP: async (email: string) => {
    const response = await api.post('/auth/exam-send-otp', { email });
    return response.data;
  },
  
  verifyOTP: async (email: string, otp: string) => {
    const response = await api.post('/auth/exam-verify-otp', { email, otp });
    if (response.data.token) {
      localStorage.setItem('exam_token', response.data.token);
      localStorage.setItem('exam_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  
  verify: async () => {
    const token = localStorage.getItem('exam_token');
    if (!token) return null;
    
    try {
      const response = await api.get('/auth/verify');
      return response.data;
    } catch {
      localStorage.removeItem('exam_token');
      localStorage.removeItem('exam_user');
      return null;
    }
  },
  
  logout: () => {
    localStorage.removeItem('exam_token');
    localStorage.removeItem('exam_user');
  },
  
  getCurrentUser: () => {
    const userStr = localStorage.getItem('exam_user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

// Exam API
export const examApi = {
  getExamByCode: async (code: string) => {
    const response = await api.get(`/exams/code/${code}`);
    return response.data;
  },
  
  startExam: async (examId: string) => {
    const response = await api.post('/exams/start', { examId });
    return response.data;
  },
  
  submitAnswer: async (examId: string, questionId: string, answer: any) => {
    const response = await api.post('/exams/submit-answer', { examId, questionId, answer });
    return response.data;
  },
  
  submitExam: async (examId: string, answers: Record<string, any>, timeSpent?: number) => {
    const response = await api.post('/exams/submit', { examId, answers, timeSpent });
    return response.data;
  },
  
  getRemainingTime: async (attemptId: string) => {
    const response = await api.get(`/exams/proctoring/${attemptId}/time`);
    return response.data;
  },
  
  autoSubmitExam: async (attemptId: string) => {
    const response = await api.post('/exams/proctoring/auto-submit', { attemptId });
    return response.data;
  },
  
  logViolation: async (attemptId: string, violation: any) => {
    const response = await api.post('/exams/proctoring/violation', { attemptId, violation });
    return response.data;
  },
  
  updateWebcamStatus: async (attemptId: string, active: boolean, photo?: string) => {
    const response = await api.post('/exams/proctoring/webcam', { attemptId, active, photo });
    return response.data;
  },
  
  updateFullscreenStatus: async (attemptId: string, active: boolean) => {
    const response = await api.post('/exams/proctoring/fullscreen', { attemptId, active });
    return response.data;
  },
  
  getProctoringSettings: async (examCode: string) => {
    const response = await api.get(`/exams/proctoring/${examCode}/settings`);
    return response.data;
  },
};


import api from './api';

export interface ParsedQuestion {
  question: string;
  type: 'multiple-choice';
  options: string[];
  correctAnswer: string;
  points: number;
  explanation?: string;
}

export const parseFile = async (file: File): Promise<{ questions: ParsedQuestion[]; count: number }> => {
  const formData = new FormData();
  formData.append('file', file);

  // Get token from localStorage
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/questions/parse`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Lỗi khi phân tích file');
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Lỗi khi phân tích file');
  }

  return { questions: data.questions, count: data.count };
};


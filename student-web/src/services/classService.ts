import api from './api';

export interface Class {
  _id: string;
  id: string;
  name: string;
  grade: 'THCS' | 'THPT';
  level: string;
  class_code: string;
  teacher_id: string;
  created_at?: string;
  updated_at?: string;
}

export const joinClassByCode = async (classCode: string, signal?: AbortSignal) => {
  const response = await api.post<{ success: boolean; message: string; class: Class }>(
    '/classes/join',
    { classCode },
    signal ? { signal } : {}
  );
  return response.data;
};

export const getClassByCode = async (code: string) => {
  const response = await api.get<{ success: boolean; class: Class }>(
    `/classes/code/${code}`
  );
  return response.data;
};

export const getMyClass = async () => {
  const response = await api.get<{ success: boolean; class: Class }>('/classes/my');
  return response.data;
};







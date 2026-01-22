import api from './api';

export interface Class {
  _id?: string;
  id?: string;
  name: string;
  grade: 'THCS' | 'THPT';
  level: string;
  class_code?: string;
  teacherId?: string;
  teacher_id?: string;
  students?: any[];
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

export const createClass = async (classData: Partial<Class>) => {
  const response = await api.post<{ success: boolean; class: Class }>('/classes', classData);
  return response.data;
};

export const getClasses = async () => {
  const response = await api.get<{ success: boolean; classes: Class[] }>('/classes');
  return response.data.classes;
};

export const getClassById = async (id: string) => {
  const response = await api.get<{ success: boolean; class: Class }>(`/classes/${id}`);
  return response.data.class;
};

export const addStudentToClass = async (classId: string, studentId: string) => {
  const response = await api.post<{ success: boolean; class: Class }>(
    `/classes/${classId}/students`,
    { studentId }
  );
  return response.data;
};


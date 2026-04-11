import api from './api';

export interface Assignment {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  courseId?: string;
  classId?: string;
  dueDate: string;
  totalPoints: number;
  questions?: any[];
  submitted?: boolean;
  score?: number;
}

export const getAssignments = async () => {
  const response = await api.get<{ success: boolean; assignments: Assignment[] }>('/assignments');
  return response.data.assignments || [];
};

export const getAssignmentById = async (id: string) => {
  const response = await api.get<{ success: boolean; assignment: Assignment }>(`/assignments/${id}`);
  return response.data.assignment;
};

export const submitAssignment = async (assignmentId: string, answers: Record<string, any>) => {
  const response = await api.post<{ success: boolean; submission: any }>(
    `/assignments/${assignmentId}/submit`,
    { answers }
  );
  return response.data;
};







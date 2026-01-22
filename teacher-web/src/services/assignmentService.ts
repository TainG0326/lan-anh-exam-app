import api from './api';

export interface Assignment {
  _id: string;
  title: string;
  description: string;
  classId: string;
  questions: any[];
  dueDate: string;
  totalPoints: number;
}

export const createAssignment = async (assignmentData: Partial<Assignment>) => {
  const response = await api.post<{ success: boolean; assignment: Assignment }>(
    '/assignments',
    assignmentData
  );
  return response.data;
};

export const getAssignments = async () => {
  const response = await api.get<{ success: boolean; assignments: Assignment[] }>(
    '/assignments'
  );
  return response.data.assignments;
};

export const getSubmissions = async (assignmentId: string) => {
  const response = await api.get<{ success: boolean; submissions: any[] }>(
    `/assignments/${assignmentId}/submissions`
  );
  return response.data.submissions;
};

export const gradeSubmission = async (submissionId: string, score: number, feedback: string) => {
  const response = await api.post<{ success: boolean; submission: any }>(
    '/assignments/grade',
    { submissionId, score, feedback }
  );
  return response.data;
};







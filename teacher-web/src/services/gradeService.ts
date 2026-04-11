import api from './api';

export interface StudentGrade {
  studentId: string;
  studentName: string;
  studentEmail: string;
  examScores: {
    examId: string;
    examTitle: string;
    score: number;
    totalPoints: number;
  }[];
  assignmentScores: {
    assignmentId: string;
    assignmentTitle: string;
    score: number;
    totalPoints: number;
  }[];
  averageScore: number;
  totalExams: number;
  totalAssignments: number;
}

export interface ClassStatistics {
  average: number;
  highest: number;
  lowest: number;
  totalStudents: number;
  totalExams: number;
  totalAssignments: number;
}

export const getGradesByClass = async (classId: string) => {
  const response = await api.get<{ success: boolean; data: StudentGrade[] }>(
    `/grades/class/${classId}`
  );
  return response.data.data;
};

export const getClassStatistics = async (classId: string) => {
  const response = await api.get<{ success: boolean; data: ClassStatistics }>(
    `/grades/class/${classId}/statistics`
  );
  return response.data.data;
};

export const updateExamScore = async (attemptId: string, score: number) => {
  const response = await api.put<{ success: boolean; message: string }>(
    '/grades/exam',
    { attemptId, score }
  );
  return response.data;
};

export const updateAssignmentScore = async (
  submissionId: string,
  score: number,
  feedback: string
) => {
  const response = await api.put<{ success: boolean; message: string }>(
    '/grades/assignment',
    { submissionId, score, feedback }
  );
  return response.data;
};

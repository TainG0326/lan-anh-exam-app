import api from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'teacher' | 'student';
  classId?: string;
  avatarUrl?: string | null;
  phone?: string | null;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  deviceToken?: string;
  trustedDevice?: boolean;
}

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', { email, password });
  if (response.data.success) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

export const register = async (data: {
  email: string;
  password: string;
  name: string;
  role: 'student';
  studentId?: string;
  classId?: string;
}): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/register', data);
  if (response.data.success) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

export const getMe = async (): Promise<User> => {
  const response = await api.get<{ success: boolean; user: User }>('/auth/me');
  return response.data.user;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('deviceToken');
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token');
};

export const updateProfile = async (updateData: {
  name?: string;
  email?: string;
  phone?: string | null;
  password?: string;
  currentPassword?: string;
  avatar_url?: string | null;
}): Promise<{ success: boolean; user: User }> => {
  const response = await api.put<{ success: boolean; user: User }>('/auth/profile', updateData);
  if (response.data.success) {
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

export const uploadAvatar = async (file: File): Promise<{ success: boolean; avatarUrl: string; user: User }> => {
  const formData = new FormData();
  formData.append('avatar', file);

  const token = localStorage.getItem('token');
  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/auth/avatar`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload avatar');
  }

  const data = await response.json();
  if (data.success) {
    localStorage.setItem('user', JSON.stringify(data.user));
  }
  return data;
};

import api from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'teacher' | 'student';
  classId?: string;
  avatarUrl?: string | null;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  user: User;
  requires2FA?: boolean;
  requiresSetup?: boolean;
  tempToken?: string;
  message?: string;
}

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', { email, password });
  if (response.data.success && response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  // If requires2FA, don't store token yet - user must complete 2FA first
  return response.data;
};

// Verify 2FA OTP for login
export const verifyLoginOTP = async (
  email: string,
  otp: string,
  tempToken: string
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/verify-login-otp', {
    email,
    otp,
    tempToken,
  });
  if (response.data.success && response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

// Request new 2FA OTP
export const request2FA = async (): Promise<{ success: boolean; message: string }> => {
  const response = await api.post<{ success: boolean; message: string }>('/auth/request-2fa');
  return response.data;
};

export const register = async (data: {
  email: string;
  password: string;
  name: string;
  role?: 'student';
}): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/register', data);
  if (response.data.success && response.data.token) {
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
  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/avatar`, {
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






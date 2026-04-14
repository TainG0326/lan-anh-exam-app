import api from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'teacher' | 'student';
  classId?: string;
  avatarUrl?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  user: User;
  requires2FA?: boolean;
  requiresSetup?: boolean;
  skipSetup?: boolean;
  tempToken?: string;
  twoFactorSecret?: string;
  twoFactorQrCode?: string;
  trustedDevice?: boolean;
  deviceToken?: string | null; // Trusted device token for 30-day bypass
  message?: string;
}

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', { email, password });
  if (response.data.success && response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    // Lưu device token nếu có (trusted device bypass 2FA)
    if (response.data.deviceToken) {
      localStorage.setItem('deviceToken', response.data.deviceToken);
    }
  }
  // If requires2FA, don't store token yet - user must complete 2FA first
  return response.data;
};

// Verify 2FA OTP for login
export const verifyLoginOTP = async (
  email: string,
  otp: string,
  tempToken: string,
  rememberDevice: boolean = false
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/verify-login-otp', {
    email,
    otp,
    tempToken,
    rememberDevice,
  });
  if (response.data.success && response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    // Lưu device token nếu user check "Remember this device"
    if (response.data.deviceToken) {
      localStorage.setItem('deviceToken', response.data.deviceToken);
    }
  }
  return response.data;
};

// Request new 2FA OTP
// Pass tempToken if calling during 2FA flow (no full auth token yet)
export const request2FA = async (tempToken?: string): Promise<{ success: boolean; message: string }> => {
  const headers: Record<string, string> = {};
  if (tempToken) {
    headers['Authorization'] = `Bearer ${tempToken}`;
  }
  const response = await api.post<{ success: boolean; message: string }>(
    '/auth/request-2fa',
    {},
    tempToken ? { headers } : undefined
  );
  return response.data;
};

export const register = async (data: {
  email: string;
  password: string;
  name: string;
  role?: 'student' | 'teacher';
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
  localStorage.removeItem('sessionActive');
  localStorage.removeItem('deviceToken'); // Also remove device token
  localStorage.removeItem('redirectUrl');
  sessionStorage.removeItem('pending2FAEmail');
  sessionStorage.removeItem('pending2FATempToken');
  sessionStorage.removeItem('pending2FASetup');
  sessionStorage.removeItem('pending2FQrCode');
  sessionStorage.removeItem('pending2FSecret');
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
  phone?: string | null;
  dateOfBirth?: string | null;
  date_of_birth?: string | null;
}): Promise<{ success: boolean; user: User }> => {
  const payload = { ...updateData };
  // Normalize dateOfBirth -> date_of_birth for server
  if (payload.dateOfBirth !== undefined) {
    payload.date_of_birth = payload.dateOfBirth;
    delete payload.dateOfBirth;
  }
  const response = await api.put<{ success: boolean; user: User }>('/auth/profile', payload);
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

export const revokeTrustedDevices = async (): Promise<{ success: boolean; message: string }> => {
  const response = await api.post<{ success: boolean; message: string }>('/auth/trusted-devices/revoke');
  // Xóa device token từ localStorage
  if (response.data.success) {
    localStorage.removeItem('deviceToken');
  }
  return response.data;
};






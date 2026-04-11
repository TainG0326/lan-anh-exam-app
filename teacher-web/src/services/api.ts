import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Quan trọng: gửi cookies kèm request (cho trusted device)
});

// Flag để tránh redirect khi đang init auth
let isAuthInitializing = true;

export const setAuthInitializing = (value: boolean) => {
  isAuthInitializing = value;
};

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Gửi device token nếu có (cho trusted device bypass 2FA)
  const deviceToken = localStorage.getItem('deviceToken');
  if (deviceToken) {
    config.headers['X-Device-Token'] = deviceToken;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Chỉ redirect khi không phải đang init auth và thực sự là lỗi 401
    if (error.response?.status === 401 && !isAuthInitializing) {
      // Kiểm tra xem có token không - nếu có thì có thể là API lỗi tạm thời
      const token = localStorage.getItem('token');
      if (!token) {
        // Không có token thật - redirect về login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      // Nếu có token, có thể là API lỗi tạm thời - không redirect
    }
    return Promise.reject(error);
  }
);

export default api;







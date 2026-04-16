import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Allow sending credentials (cookies) cross-origin
});

// Flag để tránh redirect khi đang init auth
let isAuthInitializing = true;

export const setAuthInitializing = (value: boolean) => {
  isAuthInitializing = value;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 403 - do NOT hard-redirect to login.
    // Student web may get 403 if user doesn't have class_id set yet.
    // We only clear the specific failing token and let the page handle the error gracefully.
    if (error.response?.status === 403) {
      console.warn('[API] 403 Forbidden - not redirecting to login automatically');
      // Only clear token if it's a specific auth endpoint failure, not for data endpoints
      const isAuthEndpoint = error.config?.url?.includes('/auth/');
      if (isAuthEndpoint && !isAuthInitializing) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
    // Chỉ redirect khi không phải đang init auth và thực sự là lỗi 401
    if (error.response?.status === 401 && !isAuthInitializing) {
      const token = localStorage.getItem('token');
      if (!token) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;







import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, getCurrentUser, isAuthenticated, getMe } from '../services/authService';
import { setAuthInitializing } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Timeout for auth initialization
const AUTH_INIT_TIMEOUT = 3000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = getCurrentUser();
      if (storedUser) {
        setUser(storedUser);
      }

      const timeoutId = setTimeout(() => {
        setAuthInitializing(false);
        setLoading(false);
      }, AUTH_INIT_TIMEOUT);

      if (isAuthenticated()) {
        try {
          const currentUser = await getMe();
          setUser(currentUser);
          localStorage.setItem('user', JSON.stringify(currentUser));
        } catch {
          const cachedUser = getCurrentUser();
          if (cachedUser) {
            setUser(cachedUser);
          }
        }
      }

      clearTimeout(timeoutId);
      setAuthInitializing(false);
      setLoading(false);
    };

    // Small delay to ensure localStorage is ready
    const timer = setTimeout(initAuth, 50);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};







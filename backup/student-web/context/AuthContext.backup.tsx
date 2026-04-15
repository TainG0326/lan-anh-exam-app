import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, getCurrentUser, isAuthenticated, getMe } from '../services/authService';
import { setAuthInitializing } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const initDoneRef = useRef(false);

  useEffect(() => {
    if (initDoneRef.current) return;
    initDoneRef.current = true;

    const initAuth = async () => {
      const storedUser = getCurrentUser();
      if (storedUser) {
        setUser(storedUser);
        setLoading(false);
        setAuthInitializing(false);
        return;
      }

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

      setLoading(false);
      setAuthInitializing(false);
    };

    initAuth();
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

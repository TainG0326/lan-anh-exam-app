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
      console.log('AuthContext: Starting init...');
      
      // First, try to get user from localStorage immediately
      const storedUser = getCurrentUser();
      console.log('AuthContext: storedUser from localStorage:', storedUser);
      if (storedUser) {
        setUser(storedUser);
        console.log('AuthContext: User set from localStorage');
      }

      // Set a timeout to force loading = false
      const timeoutId = setTimeout(() => {
        console.log('AuthContext: Timeout reached, setting loading=false');
        setAuthInitializing(false);
        setLoading(false);
      }, AUTH_INIT_TIMEOUT);

      // Try to verify with API if authenticated
      if (isAuthenticated()) {
        console.log('AuthContext: Token found, calling getMe...');
        try {
          const currentUser = await getMe();
          console.log('AuthContext: getMe success:', currentUser);
          setUser(currentUser);
          localStorage.setItem('user', JSON.stringify(currentUser));
        } catch (error: any) {
          console.warn('AuthContext: getMe failed, keeping cached user:', error.message);
          // Keep the user from localStorage even if API call fails
          const cachedUser = getCurrentUser();
          if (cachedUser) {
            setUser(cachedUser);
            console.log('AuthContext: Restored user from localStorage after getMe failure');
          }
        }
      } else {
        console.log('AuthContext: No token found');
      }

      // Always clear timeout and set loading = false
      clearTimeout(timeoutId);
      setAuthInitializing(false);
      setLoading(false);
      console.log('AuthContext: Loading complete, user:', user?.email);
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







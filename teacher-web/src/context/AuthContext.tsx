import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, getCurrentUser, isAuthenticated, getMe } from '../services/authService';
import { setAuthInitializing } from '../services/api';
import { supabase } from '../services/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Check if the current URL is an OAuth callback (has ?code= or #access_token)
const isOAuthCallback = (): boolean => {
  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash;
  return params.has('code') || (hash.includes('access_token='));
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    // If this is an OAuth callback, stay in loading state until the callback handles it.
    // The AuthCallback component will set token/user in localStorage and then the
    // next initAuth run will pick them up.
    if (isOAuthCallback()) {
      setLoading(true);
      setAuthInitializing(true);
      return;
    }

    const initAuth = async () => {
      setLoading(true);
      setAuthInitializing(true);

      const storedUser = getCurrentUser();
      if (storedUser) {
        setUser(storedUser);
      }

      if (isAuthenticated()) {
        try {
          const currentUser = await getMe();
          localStorage.setItem('user', JSON.stringify(currentUser));
          setUser(currentUser);
        } catch {
          const currentState = getCurrentUser();
          if (currentState) {
            localStorage.setItem('user', JSON.stringify(currentState));
          }
        }
      }

      setAuthInitializing(false);
      setLoading(false);
    };

    // Small delay to ensure localStorage is ready
    const timer = setTimeout(initAuth, 50);

    return () => clearTimeout(timer);
  }, []);

  // Watch for Supabase auth state changes (handles OAuth session exchange completion)
  useEffect(() => {
    if (isOAuthCallback()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Supabase session is ready — if our backend token is also set,
          // reload the page so AuthContext reinitializes with the correct user
          const ourToken = localStorage.getItem('token');
          if (ourToken) {
            setLoading(false);
            setAuthInitializing(false);
          }
        }
      });

      return () => subscription.unsubscribe();
    }
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







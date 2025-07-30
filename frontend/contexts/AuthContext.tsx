'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import api, { setAuthToken } from '@/lib/api';

interface User {
  id: string;
  email: string;
  username: string;
  name?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  followers: string[];
  following: string[];
  subscription_status: string;
  subscription_tier?: string;
  subscription_end_date?: string;
  weekly_uploads_used: number;
  weekly_uploads_reset_date?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  pending_cancellation?: boolean;
  auth_provider?: string;
  google_id?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        setAuthToken(token);
        const response = await api.get('/auth/me');
        console.log('refreshUser', response.data);
        setUser(response.data);
      } catch (error) {
        console.error('Error refreshing user:', error);
        localStorage.removeItem('token');
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Add a small delay to ensure localStorage is available
    const timer = setTimeout(() => {
      refreshUser();
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { access_token } = response.data;
    localStorage.setItem('token', access_token);
    setAuthToken(access_token);
    await refreshUser();
  };

  const register = async (email: string, password: string, username: string) => {
    const response = await api.post('/auth/register', { email, password, username });
    const { access_token } = response.data;
    localStorage.setItem('token', access_token);
    setAuthToken(access_token);
    await refreshUser();
  };

  const loginWithGoogle = async () => {
    try {
      // Get Google OAuth URL from backend
      const response = await api.get('/auth/google/url');
      const { auth_url } = response.data;
      
      // Redirect to Google OAuth
      window.location.href = auth_url;
    } catch (error) {
      console.error('Error initiating Google login:', error);
      throw error;
    }
  };

  const logout = async () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
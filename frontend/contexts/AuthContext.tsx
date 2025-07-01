'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
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
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshUser();
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

  const logout = async () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, refreshUser }}>
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
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
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      setAuthToken(token);
      const response = await api.get('/auth/me');
      if (response.status === 200) {
        setUser(response.data);
      } else {
        setUser(null);
        localStorage.removeItem('token');
        setAuthToken(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      localStorage.removeItem('token');
      setAuthToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      setAuthToken(access_token);

      // Now fetch user info
      const meRes = await api.get('/auth/me');
      if (meRes.status === 200) {
        setUser(meRes.data);
      } else {
        throw new Error('Failed to fetch user info');
      }
    } catch (error) {
      console.error('Login failed:', error);
      localStorage.removeItem('token');
      setAuthToken(null);
      setUser(null);
      throw error;
    }
  };

  const logout = async () => {
    localStorage.removeItem('token');
    setAuthToken(null);
    setUser(null);
  };

  const register = async (email: string, password: string, username: string) => {
    try {
      const response = await api.post('/auth/register', { email, password, username });
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      setAuthToken(access_token);

      // Now fetch user info
      const meRes = await api.get('/auth/me');
      if (meRes.status === 200) {
        setUser(meRes.data);
      } else {
        throw new Error('Failed to fetch user info');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      localStorage.removeItem('token');
      setAuthToken(null);
      setUser(null);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
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
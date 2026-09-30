import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api } from '../api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  viewportMode: 'DESKTOP' | 'MOBILE';
  setViewportMode: (mode: 'DESKTOP' | 'MOBILE') => void;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  switchDemoRole: (role: Role) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('grievancegrid_token'));
  const [loading, setLoading] = useState(true);
  const [viewportMode, setViewportMode] = useState<'DESKTOP' | 'MOBILE'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
      return 'MOBILE';
    }
    return 'DESKTOP';
  });

  // Automatically update viewport mode on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setViewportMode('MOBILE');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load user profile on mount if token exists
  useEffect(() => {
    async function loadMe() {
      if (!token) {
        // Start from clean login screen
        setLoading(false);
        return;
      }

      try {
        const res = await api.getMe();
        setUser(res.user);
      } catch (err) {
        console.error('Failed to restore session:', err);
        localStorage.removeItem('grievancegrid_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadMe();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await api.login({ email, password: pass });
      localStorage.setItem('grievancegrid_token', res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any) => {
    setLoading(true);
    try {
      const res = await api.register(data);
      localStorage.setItem('grievancegrid_token', res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('grievancegrid_token');
    setToken(null);
    setUser(null);
  };

  const switchDemoRole = async (role: Role) => {
    setLoading(true);
    try {
      let email = 'citizen@grievancegrid.gov.in';
      if (role === 'MUNICIPAL_OFFICER') {
        email = 'officer@grievancegrid.gov.in';
      } else if (role === 'FIELD_WORKER') {
        email = 'worker@grievancegrid.gov.in';
      }
      const res = await api.login({ email, password: 'Password123!' });
      localStorage.setItem('grievancegrid_token', res.token);
      setToken(res.token);
      setUser(res.user);

      // Default field worker to mobile mode as specified
      if (role === 'FIELD_WORKER') {
        setViewportMode('MOBILE');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      viewportMode,
      setViewportMode,
      login,
      register,
      logout,
      switchDemoRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

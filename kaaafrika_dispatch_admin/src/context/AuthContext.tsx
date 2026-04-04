import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Admin } from '../types';
import { authApi } from '../api/auth';

interface AuthContextValue {
  admin: Admin | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token');
    const storedAdmin = localStorage.getItem('admin_user');
    if (storedToken && storedAdmin) {
      setToken(storedToken);
      setAdmin(JSON.parse(storedAdmin));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    if (response.status && response.data) {
      const { admin: adminData, token: tokenData } = response.data;
      localStorage.setItem('admin_token', tokenData);
      localStorage.setItem('admin_user', JSON.stringify(adminData));
      setToken(tokenData);
      setAdmin(adminData);
    } else {
      throw new Error(response.message || 'Login failed');
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Silently fail — still clear local state
    } finally {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      setToken(null);
      setAdmin(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        admin,
        token,
        isLoading,
        isAuthenticated: !!token && !!admin,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

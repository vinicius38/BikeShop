import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, LoginResponse } from '../types/api';
import { api, getStoredToken, getStoredUser, setStoredAuth, clearStoredAuth } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      if (!getStoredToken()) {
        setUser(null);
        setToken(null);
        return;
      }
      const currentUser = await api.get<User>('/Auth/me');
      setUser(currentUser);
      localStorage.setItem('oficinabike_user', JSON.stringify(currentUser));
    } catch (err) {
      console.warn('Failed to refresh user', err);
      // If error occurs, keep cached user or clear if 401
    }
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    const init = async () => {
      const storedToken = getStoredToken();
      if (storedToken) {
        setToken(storedToken);
        await refreshUser();
      } else {
        // Automatically attempt login as admin for seamless experience if not set
        try {
          const res = await api.post<LoginResponse>('/Auth/login', {
            username: 'admin',
            password: 'Admin@123456',
          });
          setStoredAuth(res.accessToken, res.user);
          setToken(res.accessToken);
          setUser(res.user);
        } catch (e) {
          console.warn('Auto-login notice:', e);
        }
      }
      setIsLoading(false);
    };

    init();

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [refreshUser]);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.post<LoginResponse>('/Auth/login', { username, password });
      setStoredAuth(res.accessToken, res.user);
      setToken(res.accessToken);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearStoredAuth();
    setUser(null);
    setToken(null);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    // Admin has all permissions or check permission list
    if (user.roleName === 'Administrador' || user.permissions?.includes('*')) {
      return true;
    }
    return user.permissions?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        hasPermission,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

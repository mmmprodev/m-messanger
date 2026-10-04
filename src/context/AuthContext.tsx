import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, setAuthToken, removeAuthToken, getAuthToken } from '../services/api';
import { socket } from '../services/socket';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: { username: string; displayName: string; password: string; avatarColor?: string; bio?: string }) => Promise<void>;
  guestLogin: (name?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      const storedToken = getAuthToken();
      if (storedToken) {
        try {
          const res = await api.getMe();
          setUser(res.user);
          socket.connect();
        } catch (err) {
          console.warn('Session expired or invalid:', err);
          removeAuthToken();
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    }
    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ username, password });
      setAuthToken(res.token);
      setToken(res.token);
      setUser(res.user);
      socket.connect();
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { username: string; displayName: string; password: string; avatarColor?: string; bio?: string }) => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      setAuthToken(res.token);
      setToken(res.token);
      setUser(res.user);
      socket.connect();
    } finally {
      setIsLoading(false);
    }
  };

  const guestLogin = async (name?: string) => {
    setIsLoading(true);
    try {
      const res = await api.guestLogin(name);
      setAuthToken(res.token);
      setToken(res.token);
      setUser(res.user);
      socket.connect();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    removeAuthToken();
    socket.disconnect();
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (data: Partial<User>) => {
    const res = await api.updateProfile(data);
    setUser(res.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        guestLogin,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

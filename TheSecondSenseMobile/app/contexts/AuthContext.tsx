import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../(tabs)/apiService';

interface User {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Keep apiService token in sync with context token at all times
  useEffect(() => {
    if (token) {
      apiService.setToken(token);
    } else {
      apiService.clearToken();
    }
  }, [token]);

  const login = async (phone: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await apiService.login(phone, password);
      console.log('Login response:', data);
      
      if (data.token) {
        setTokenState(data.token);
        apiService.setToken(data.token);
      }

      if (data.user) {
        console.log('Setting user:', data.user);
        setUserState(data.user);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setTokenState(null);
      setUserState(null);
    }
  };

  const setToken = (newToken: string) => {
    setTokenState(newToken);
  };

  const setUser = (newUser: User) => {
    setUserState(newUser);
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    logout,
    setToken,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../(tabs)/apiService';

interface User {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  isVoiceAuthEnabled?: boolean;
  transferPin?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (phone: string, password: string, transferPin: string) => Promise<void>;
  logout: () => Promise<string>;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  setVoiceAuthEnabled: (enabled: boolean) => void;
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

  const login = async (phone: string, password: string, transferPin: string) => {
    setIsLoading(true);
    try {
      const data = await apiService.login(phone, password, transferPin);
      console.log('Login response:', data);
      
      if (data.token) {
        setTokenState(data.token);
        apiService.setToken(data.token);
      }

      if (data.user) {
        console.log('Setting user:', data.user);
        setUserState({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone,
          isVoiceAuthEnabled: data.user.isVoiceAuthEnabled ?? false,
          transferPin: data.user.transferPin,
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<string> => {
    try {
      const message = await apiService.logout(token ?? undefined);
      return message;
    } catch (error) {
      console.error('Logout error:', error);
      return 'Logout failed';
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

  const setVoiceAuthEnabled = (enabled: boolean) => {
    setUserState(prev => prev ? { ...prev, isVoiceAuthEnabled: enabled } : prev);
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    logout,
    setToken,
    setUser,
    setVoiceAuthEnabled,
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

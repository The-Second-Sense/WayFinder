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

  // TODO: Load token from AsyncStorage on app startup
  useEffect(() => {
    // This can be enhanced to load from persistent storage
    // const loadStoredToken = async () => {
    //   try {
    //     const storedToken = await AsyncStorage.getItem('authToken');
    //     if (storedToken) {
    //       setTokenState(storedToken);
    //     }
    //   } catch (error) {
    //     console.error('Failed to load token:', error);
    //   }
    // };
    // loadStoredToken();
  }, []);

  const login = async (phone: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await apiService.login(phone, password);
      
      if (data.token) {
        setTokenState(data.token);
        // TODO: Store token in AsyncStorage
        // await AsyncStorage.setItem('authToken', data.token);
      }

      if (data.user) {
        setUserState(data.user);
        // TODO: Store user in AsyncStorage
        // await AsyncStorage.setItem('user', JSON.stringify(data.user));
      }
    } catch (error) {
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
      // TODO: Clear AsyncStorage
      // await AsyncStorage.removeItem('authToken');
      // await AsyncStorage.removeItem('user');
    }
  };

  const setToken = (newToken: string) => {
    setTokenState(newToken);
    // TODO: Store in AsyncStorage
    // AsyncStorage.setItem('authToken', newToken);
  };

  const setUser = (newUser: User) => {
    setUserState(newUser);
    // TODO: Store in AsyncStorage
    // AsyncStorage.setItem('user', JSON.stringify(newUser));
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

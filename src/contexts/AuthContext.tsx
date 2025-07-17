
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on app load
    const token = localStorage.getItem('token');
    if (token) {
      // In a real app, you'd verify the token with the backend
      // For demo purposes, we'll use mock data
      const mockUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (mockUser) {
        setUser(mockUser);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    
    // Mock authentication - in a real app, this would be an API call
    try {
      let mockUser: User;
      
      if (username === 'admin' && password === 'admin') {
        mockUser = {
          id: 1,
          username: 'admin',
          role: 'admin',
          full_name: 'System Administrator',
          email: 'admin@hostel.com'
        };
      } else if (username === 'student' && password === 'student') {
        mockUser = {
          id: 2,
          username: 'student',
          role: 'student',
          full_name: 'John Smith',
          email: 'john@student.com',
          course: 'Computer Science'
        };
      } else {
        throw new Error('Invalid credentials');
      }

      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify(mockUser));
      setUser(mockUser);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

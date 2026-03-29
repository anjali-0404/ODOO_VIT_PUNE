import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type Role = 'Admin' | 'Manager' | 'Employee' | 'Finance' | 'CFO' | null;

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  managerId?: string;
  password?: string;
}

interface AuthContextType {
  user: User | null;
  role: Role;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  registerUser: (user: User) => boolean;
  getUsers: () => User[];
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from local storage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const getUsers = (): User[] => {
    const usersStr = localStorage.getItem('mockUsers');
    return usersStr ? JSON.parse(usersStr) : [];
  };

  const registerUser = (newUser: User): boolean => {
    const users = getUsers();
    if (users.find(u => u.email === newUser.email)) {
      return false; // Email already registered
    }
    
    // Assign random ID if not present
    const userToSave = { ...newUser, id: newUser.id || Math.random().toString(36).substring(2, 9) };
    users.push(userToSave);
    localStorage.setItem('mockUsers', JSON.stringify(users));
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role || null, token, login, logout, registerUser, getUsers, isLoading }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

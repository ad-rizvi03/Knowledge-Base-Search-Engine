import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Check session storage for persisted login state
    return sessionStorage.getItem('isAuthenticated') === 'true';
  });

  const login = useCallback((email: string, pass: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Simulate an API call
      setTimeout(() => {
        if (email === 'user@example.com' && pass === 'password') {
          setIsAuthenticated(true);
          sessionStorage.setItem('isAuthenticated', 'true');
          resolve();
        } else {
          reject(new Error('Invalid email or password'));
        }
      }, 500);
    });
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('isAuthenticated');
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

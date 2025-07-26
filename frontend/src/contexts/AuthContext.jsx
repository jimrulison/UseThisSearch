import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on app load
    const storedUser = localStorage.getItem('useThisSearch_user');
    const storedToken = localStorage.getItem('useThisSearch_token');
    
    if (storedUser && storedToken) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('useThisSearch_user');
        localStorage.removeItem('useThisSearch_token');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('useThisSearch_user', JSON.stringify(userData));
    localStorage.setItem('useThisSearch_token', 'demo_token_' + Date.now());
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('useThisSearch_user');
    localStorage.removeItem('useThisSearch_token');
  };

  const isAuthenticated = () => {
    return user !== null && localStorage.getItem('useThisSearch_token') !== null;
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
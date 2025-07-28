import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AdminAuthContext = createContext();

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const ADMIN_API = `${BACKEND_URL}/api/admin`;

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Check for existing admin session on app load
    const storedAdmin = localStorage.getItem('useThisSearch_admin');
    const storedToken = localStorage.getItem('useThisSearch_admin_token');
    
    if (storedAdmin && storedToken) {
      try {
        const adminData = JSON.parse(storedAdmin);
        setAdmin(adminData);
        setToken(storedToken);
        
        // Verify token is still valid
        verifyToken(storedToken);
      } catch (error) {
        console.error('Error parsing stored admin data:', error);
        clearAdminSession();
      }
    }
    
    setIsLoading(false);
  }, []);

  const verifyToken = async (tokenToVerify) => {
    try {
      const response = await axios.get(`${ADMIN_API}/verify`, {
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`
        }
      });
      
      if (response.data.success) {
        setAdmin(response.data.admin);
      } else {
        clearAdminSession();
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      clearAdminSession();
    }
  };

  const clearAdminSession = () => {
    setAdmin(null);
    setToken(null);
    localStorage.removeItem('useThisSearch_admin');
    localStorage.removeItem('useThisSearch_admin_token');
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${ADMIN_API}/login`, {
        email,
        password
      });
      
      if (response.data.success) {
        const { admin: adminData, token: authToken } = response.data;
        
        setAdmin(adminData);
        setToken(authToken);
        
        // Store in localStorage
        localStorage.setItem('useThisSearch_admin', JSON.stringify(adminData));
        localStorage.setItem('useThisSearch_admin_token', authToken);
        
        return { success: true };
      } else {
        return { success: false, error: 'Login failed' };
      }
    } catch (error) {
      console.error('Admin login error:', error);
      
      let errorMessage = 'Login failed';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid credentials';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await axios.post(`${ADMIN_API}/logout`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Admin logout error:', error);
    } finally {
      clearAdminSession();
    }
  };

  const isAuthenticated = () => {
    return admin !== null && token !== null;
  };

  const getAuthHeaders = () => {
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const value = {
    admin,
    token,
    login,
    logout,
    isAuthenticated,
    isLoading,
    getAuthHeaders
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export default AdminAuthContext;
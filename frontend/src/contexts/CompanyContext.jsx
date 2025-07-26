import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CompanyContext = createContext();

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const CompanyProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [activeCompany, setActiveCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get user ID for API calls
  const getUserId = () => {
    if (!user?.email) return null;
    // Create a consistent user ID from email
    return `user_${user.email.replace('@', '_').replace('.', '_')}`;
  };

  // API helper with headers
  const apiCall = async (url, options = {}) => {
    const userId = getUserId();
    if (!userId) throw new Error('User not authenticated');
    
    const headers = {
      'Content-Type': 'application/json',
      'X-User-ID': userId,
      ...options.headers
    };

    if (activeCompany) {
      headers['X-Company-ID'] = activeCompany.id;
    }

    return fetch(url, {
      ...options,
      headers
    });
  };

  // Load companies when user is authenticated
  useEffect(() => {
    if (isAuthenticated() && user) {
      loadCompanies();
    } else {
      setCompanies([]);
      setActiveCompany(null);
    }
  }, [user, isAuthenticated]);

  // Load active company from localStorage
  useEffect(() => {
    if (companies.length > 0 && !activeCompany) {
      const storedCompanyId = localStorage.getItem('useThisSearch_activeCompany');
      if (storedCompanyId) {
        const company = companies.find(c => c.id === storedCompanyId);
        if (company) {
          setActiveCompany(company);
          return;
        }
      }
      
      // Default to Personal company if no stored company or stored company not found
      const personalCompany = companies.find(c => c.is_personal);
      if (personalCompany) {
        setActiveCompany(personalCompany);
      }
    }
  }, [companies, activeCompany]);

  const loadCompanies = async () => {
    try {
      setIsLoading(true);
      const response = await apiCall(`${API}/companies`);
      
      if (response.ok) {
        const companiesData = await response.json();
        setCompanies(companiesData);
      } else {
        console.error('Failed to load companies:', response.status);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createCompany = async (name) => {
    try {
      const response = await apiCall(`${API}/companies`, {
        method: 'POST',
        body: JSON.stringify({ name })
      });

      if (response.ok) {
        const newCompany = await response.json();
        setCompanies(prev => [...prev, newCompany]);
        return { success: true, company: newCompany };
      } else {
        const error = await response.json();
        return { success: false, error: error.detail || 'Failed to create company' };
      }
    } catch (error) {
      console.error('Error creating company:', error);
      return { success: false, error: 'Network error while creating company' };
    }
  };

  const updateCompany = async (companyId, name) => {
    try {
      const response = await apiCall(`${API}/companies/${companyId}`, {
        method: 'PUT',
        body: JSON.stringify({ name })
      });

      if (response.ok) {
        const updatedCompany = await response.json();
        setCompanies(prev => prev.map(c => c.id === companyId ? updatedCompany : c));
        
        // Update active company if it was the one being updated
        if (activeCompany?.id === companyId) {
          setActiveCompany(updatedCompany);
        }
        
        return { success: true, company: updatedCompany };
      } else {
        const error = await response.json();
        return { success: false, error: error.detail || 'Failed to update company' };
      }
    } catch (error) {
      console.error('Error updating company:', error);
      return { success: false, error: 'Network error while updating company' };
    }
  };

  const deleteCompany = async (companyId) => {
    try {
      const response = await apiCall(`${API}/companies/${companyId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setCompanies(prev => prev.filter(c => c.id !== companyId));
        
        // If deleted company was active, switch to Personal
        if (activeCompany?.id === companyId) {
          const personalCompany = companies.find(c => c.is_personal);
          if (personalCompany) {
            switchCompany(personalCompany);
          }
        }
        
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.detail || 'Failed to delete company' };
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      return { success: false, error: 'Network error while deleting company' };
    }
  };

  const switchCompany = (company) => {
    setActiveCompany(company);
    localStorage.setItem('useThisSearch_activeCompany', company.id);
  };

  const getCompanySearches = async (companyId, limit = 50, offset = 0) => {
    try {
      const response = await apiCall(`${API}/companies/${companyId}/searches?limit=${limit}&offset=${offset}`);
      
      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to load company searches:', response.status);
        return [];
      }
    } catch (error) {
      console.error('Error loading company searches:', error);
      return [];
    }
  };

  const getDashboardStats = async (companyId) => {
    try {
      const response = await apiCall(`${API}/dashboard/${companyId}`);
      
      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to load dashboard stats:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      return null;
    }
  };

  const value = {
    companies,
    activeCompany,
    isLoading,
    createCompany,
    updateCompany,
    deleteCompany,
    switchCompany,
    loadCompanies,
    getCompanySearches,
    getDashboardStats,
    getUserId
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};

export default CompanyContext;
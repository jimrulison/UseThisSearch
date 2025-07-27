import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const BillingContext = createContext();

export const useBilling = () => {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
};

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const BillingProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  const [billingAlerts, setBillingAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get user ID for API calls (same method as CompanyContext)
  const getUserId = () => {
    if (!user?.email) return null;
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

    return fetch(url, {
      ...options,
      headers
    });
  };

  // Load billing data when user is authenticated
  useEffect(() => {
    if (isAuthenticated() && user) {
      loadBillingData();
    } else {
      setSubscription(null);
      setUsage(null);
      setBillingAlerts([]);
    }
  }, [user, isAuthenticated]);

  const loadBillingData = async () => {
    try {
      setIsLoading(true);
      
      // Load subscription
      const subscriptionResponse = await apiCall(`${API}/billing/subscription`);
      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();
        setSubscription(subscriptionData);
      }

      // Load usage limits
      const usageResponse = await apiCall(`${API}/billing/usage`);
      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        setUsage(usageData);
      }

      // Load billing dashboard for alerts
      const dashboardResponse = await apiCall(`${API}/billing/dashboard`);
      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        setBillingAlerts(dashboardData.alerts || []);
      }

    } catch (error) {
      console.error('Error loading billing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkUsageLimits = async () => {
    try {
      const response = await apiCall(`${API}/safe/usage-status`);
      if (response.ok) {
        const statusData = await response.json();
        return statusData;
      }
      return null;
    } catch (error) {
      console.error('Error checking usage limits:', error);
      return null;
    }
  };

  const hasUsageLeft = () => {
    if (!usage) return true; // Default to allowing usage if data not loaded
    
    // Check search limits
    if (usage.search_limit !== -1 && usage.searches_remaining <= 0) {
      return false;
    }
    
    return true;
  };

  const canCreateCompany = () => {
    if (!usage) return true;
    
    // Check company limits  
    if (usage.company_limit !== -1 && usage.companies_remaining <= 0) {
      return false;
    }
    
    return true;
  };

  const getUsageWarnings = () => {
    if (!usage) return [];
    
    const warnings = [];
    
    // Search usage warnings
    if (usage.search_limit !== -1) {
      const searchPercentage = (usage.current_searches / usage.search_limit) * 100;
      
      if (searchPercentage >= 100) {
        warnings.push({
          type: 'limit_exceeded',
          category: 'searches',
          message: `You've used all ${usage.search_limit} searches this month.`,
          action: 'upgrade_required'
        });
      } else if (searchPercentage >= 90) {
        warnings.push({
          type: 'usage_warning',
          category: 'searches', 
          message: `You've used ${usage.current_searches} of ${usage.search_limit} searches (${Math.round(searchPercentage)}%).`,
          action: 'consider_upgrade'
        });
      }
    }

    // Company usage warnings
    if (usage.company_limit !== -1) {
      const companyPercentage = (usage.current_companies / usage.company_limit) * 100;
      
      if (companyPercentage >= 100) {
        warnings.push({
          type: 'limit_exceeded',
          category: 'companies',
          message: `You've reached your limit of ${usage.company_limit} companies.`,
          action: 'upgrade_required'
        });
      }
    }
    
    return warnings;
  };

  const createSubscription = async (planType, billingPeriod, paymentMethodId) => {
    try {
      const response = await apiCall(`${API}/billing/subscription`, {
        method: 'POST',
        body: JSON.stringify({
          plan_type: planType,
          billing_period: billingPeriod,
          payment_method_id: paymentMethodId
        })
      });

      if (response.ok) {
        const newSubscription = await response.json();
        setSubscription(newSubscription);
        await loadBillingData(); // Refresh all data
        return { success: true, subscription: newSubscription };
      } else {
        const error = await response.json();
        return { success: false, error: error.detail || 'Failed to create subscription' };
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      return { success: false, error: 'Network error while creating subscription' };
    }
  };

  const updateSubscription = async (planType, billingPeriod) => {
    try {
      const response = await apiCall(`${API}/billing/subscription`, {
        method: 'PUT',
        body: JSON.stringify({
          plan_type: planType,
          billing_period: billingPeriod
        })
      });

      if (response.ok) {
        const updatedSubscription = await response.json();
        setSubscription(updatedSubscription);
        await loadBillingData();
        return { success: true, subscription: updatedSubscription };
      } else {
        const error = await response.json();
        return { success: false, error: error.detail || 'Failed to update subscription' };
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      return { success: false, error: 'Network error while updating subscription' };
    }
  };

  const cancelSubscription = async () => {
    try {
      const response = await apiCall(`${API}/billing/subscription`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadBillingData();
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.detail || 'Failed to cancel subscription' };
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return { success: false, error: 'Network error while canceling subscription' };
    }
  };

  const acknowledgeAlert = async (alertId) => {
    try {
      const response = await apiCall(`${API}/billing/alerts/${alertId}/acknowledge`, {
        method: 'POST'
      });

      if (response.ok) {
        setBillingAlerts(prev => prev.filter(alert => alert.id !== alertId));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      return false;
    }
  };

  const getPricingConfig = async () => {
    try {
      const response = await fetch(`${API}/billing/pricing`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error fetching pricing config:', error);
      return null;
    }
  };

  const value = {
    subscription,
    usage,
    billingAlerts,
    isLoading,
    hasUsageLeft,
    canCreateCompany,
    getUsageWarnings,
    checkUsageLimits,
    createSubscription,
    updateSubscription,
    cancelSubscription,
    acknowledgeAlert,
    getPricingConfig,
    loadBillingData,
    getUserId
  };

  return (
    <BillingContext.Provider value={value}>
      {children}
    </BillingContext.Provider>
  );
};

export default BillingContext;
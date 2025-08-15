import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { ToastProvider, useToast } from './hooks/use-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CompanyProvider, useCompany } from './contexts/CompanyContext';
import { BillingProvider, useBilling } from './contexts/BillingContext'; // NEW: Added BillingProvider
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext'; // NEW: Added AdminAuthProvider
import { LanguageProvider } from './contexts/LanguageContext'; // NEW: Added LanguageProvider
import SearchInterface from './components/SearchInterface';
import ResultsDisplay from './components/ResultsDisplay';
import KeywordClustering from './components/KeywordClustering';
import SalesSheet from './components/SalesSheet';
import LoginPage from './components/LoginPage';
import AdminLoginPage from './components/AdminLoginPage'; // NEW: Added AdminLoginPage
import AdminDashboard from './components/AdminDashboard'; // NEW: Added AdminDashboard
import Dashboard from './components/Dashboard';
import UsageAlerts from './components/UsageAlerts'; // NEW: Added UsageAlerts
import UserAvailabilityNotice from './components/UserAvailabilityNotice'; // NEW: Added UserAvailabilityNotice
import SafeSearchWrapper from './components/SafeSearchWrapper'; // NEW: Added SafeSearchWrapper
import { Button } from './components/ui/button';
import axios from 'axios';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Add login link to sales sheet
const SalesSheetWithLogin = () => {
  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <Button 
          onClick={() => window.location.href = '/login'}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg"
        >
          Sign In to Access Tool
        </Button>
      </div>
      <SalesSheet />
    </>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

// Login Route Component
const LoginRoute = () => {
  const { login, isAuthenticated } = useAuth();
  
  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  
  return <LoginPage onLogin={login} />;
};

// Admin Protected Route Component
const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAdminAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white">Loading admin panel...</p>
        </div>
      </div>
    );
  }
  
  return isAuthenticated() ? children : <Navigate to="/admin/login" replace />;
};

// Admin Login Route Component  
const AdminLoginRoute = () => {
  const { isAuthenticated } = useAdminAuth();
  
  if (isAuthenticated()) {
    return <Navigate to="/admin" replace />;
  }
  
  return <AdminLoginPage />;
};

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('graph');
  const { toast } = useToast();
  const { activeCompany, getUserId } = useCompany();
  const { hasUsageLeft } = useBilling(); // NEW: Added billing hook

  const handleSearch = async (term) => {
    setIsLoading(true);
    
    try {
      console.log('Searching for:', term);
      
      // NEW: Check if user has usage left before searching
      if (!hasUsageLeft()) {
        toast({
          title: "Search Limit Reached",
          description: "You've reached your search limit for this month. Please upgrade to continue.",
          variant: "destructive",
          duration: 5000,
        });
        setIsLoading(false);
        return;
      }
      
      // Prepare headers for company-aware search
      const headers = {};
      const userId = getUserId();
      if (userId) {
        headers['X-User-ID'] = userId;
      }
      if (activeCompany) {
        headers['X-Company-ID'] = activeCompany.id;
      }
      
      // NEW: Use safe billing endpoint for authenticated users
      const endpoint = userId && userId !== 'anonymous' ? 
        `${API}/search` : 
        `${API}/search`; // Use original endpoint for now
      
      const response = await axios.post(endpoint, {
        search_term: term
      }, {
        headers
      });
      
      const data = response.data;
      console.log('API Response:', data);
      
      // Transform API response to match frontend expectations
      const transformedResults = {
        questions: data.suggestions.questions || [],
        prepositions: data.suggestions.prepositions || [],
        comparisons: data.suggestions.comparisons || [],
        alphabetical: data.suggestions.alphabetical || []
      };
      
      console.log('Transformed Results:', transformedResults);
      setResults(transformedResults);
      
      // NEW: Show usage info in toast if available
      const usageInfo = data.usage_info ? 
        ` (${data.usage_info.searches_remaining} searches remaining)` : '';
      
      toast({
        title: "Search Complete!",
        description: `Found ${data.total_suggestions} suggestions for "${term}" in ${data.processing_time_ms}ms${activeCompany ? ` (${activeCompany.name})` : ''}${usageInfo}`,
        duration: 3000,
      });
      
    } catch (error) {
      console.error('Search error:', error);
      
      let errorMessage = "Something went wrong. Please try again.";
      
      if (error.response) {
        if (error.response.status === 429) {
          // NEW: Handle usage limit errors
          const errorData = error.response.data;
          errorMessage = errorData.message || "Usage limit exceeded. Please upgrade to continue.";
          
          toast({
            title: "Usage Limit Reached",
            description: errorMessage,
            variant: "destructive",
            duration: 8000,
          });
          setIsLoading(false);
          return;
        } else if (error.response.status === 400) {
          errorMessage = error.response.data.detail || "Invalid search term";
        } else if (error.response.status === 500) {
          errorMessage = "Server error. Please try again later.";
        }
      } else if (error.request) {
        errorMessage = "Unable to connect to server. Please check your connection.";
      }
      
      toast({
        title: "Search Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
      
      if (!results) {
        setResults(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 space-y-8">
        
        {/* NEW: User Availability Notice */}
        <UserAvailabilityNotice />
        
        {/* NEW: Usage Alerts */}
        <UsageAlerts />
        
        {/* Search Interface */}
        <SearchInterface 
          onSearch={handleSearch}
          isLoading={isLoading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
        
        {/* Results Display */}
        {results && (
          <>
            <ResultsDisplay 
              results={results} 
              searchTerm={searchTerm}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
            
            {/* Keyword Clustering - Premium Feature */}
            <KeywordClustering 
              searchResults={{
                suggestions: {
                  questions: results.questions || []
                }
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <LanguageProvider>
        <AuthProvider>
          <CompanyProvider>
            <BillingProvider>
              <AdminAuthProvider>
                <ToastProvider>
                  <BrowserRouter>
                    <Routes>
                      {/* Admin Routes - Must come first to avoid conflicts */}
                      <Route path="/admin/login" element={<AdminLoginRoute />} />
                      <Route 
                        path="/admin" 
                        element={
                          <AdminProtectedRoute>
                            <AdminDashboard />
                          </AdminProtectedRoute>
                        } 
                      />
                      
                      {/* User Routes */}
                      <Route path="/login" element={<LoginRoute />} />
                      <Route path="/sales" element={<SalesSheetWithLogin />} />
                      <Route 
                        path="/dashboard" 
                        element={
                          <ProtectedRoute>
                            <Dashboard />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/" 
                        element={
                          <ProtectedRoute>
                            <Home />
                          </ProtectedRoute>
                        } 
                      />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </BrowserRouter>
                </ToastProvider>
              </AdminAuthProvider>
            </BillingProvider>
          </CompanyProvider>
        </AuthProvider>
      </LanguageProvider>
    </div>
  );
}

export default App;
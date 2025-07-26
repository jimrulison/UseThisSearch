import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { ToastProvider, useToast } from './hooks/use-toast';
import SearchInterface from './components/SearchInterface';
import ResultsDisplay from './components/ResultsDisplay';
import axios from 'axios';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('graph');
  const { toast } = useToast();

  const handleSearch = async (term) => {
    setIsLoading(true);
    
    try {
      console.log('Searching for:', term);
      
      const response = await axios.post(`${API}/search`, {
        search_term: term
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
      
      setResults(transformedResults);
      
      toast({
        title: "Search Complete!",
        description: `Found ${data.total_suggestions} suggestions for "${term}" in ${data.processing_time_ms}ms`,
        duration: 3000,
      });
      
    } catch (error) {
      console.error('Search error:', error);
      
      let errorMessage = "Something went wrong. Please try again.";
      
      if (error.response) {
        // Server responded with error status
        if (error.response.status === 400) {
          errorMessage = error.response.data.detail || "Invalid search term";
        } else if (error.response.status === 500) {
          errorMessage = "Server error. Please try again later.";
        }
      } else if (error.request) {
        // Request made but no response
        errorMessage = "Unable to connect to server. Please check your connection.";
      }
      
      toast({
        title: "Search Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
      
      // Keep previous results if any
      if (!results) {
        setResults(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <SearchInterface 
          onSearch={handleSearch}
          isLoading={isLoading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
        
        {results && (
          <ResultsDisplay 
            results={results}
            searchTerm={searchTerm}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        )}
        
        {/* Footer */}
        <footer className="text-center text-muted-foreground mt-16 pb-8">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-green-600">
              🚀 **Now powered by Claude AI!** Real-time question generation and keyword research.
            </p>
            <p className="text-xs opacity-75">
              Built with React, FastAPI, MongoDB • Powered by Claude 3.5 Sonnet
            </p>
            <p className="text-xs opacity-50">
              Generate comprehensive keyword research, questions, and content ideas instantly
            </p>
          </div>
        </footer>
      </div>
      
      <Toaster />
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
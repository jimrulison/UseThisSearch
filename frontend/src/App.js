import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import SearchInterface from './components/SearchInterface';
import ResultsDisplay from './components/ResultsDisplay';
import { generateMockResults } from './data/mockData';
import { useToast } from './hooks/use-toast';
import './App.css';

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('graph');
  const { toast } = useToast();

  const handleSearch = async (term) => {
    setIsLoading(true);
    
    try {
      // Simulate API delay for realistic experience
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResults = generateMockResults(term);
      setResults(mockResults);
      
      const totalSuggestions = Object.values(mockResults).reduce((total, items) => total + items.length, 0);
      
      toast({
        title: "Search Complete!",
        description: `Found ${totalSuggestions} suggestions for "${term}"`,
        duration: 3000,
      });
      
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
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
          <p className="text-sm">
            🚀 **Note**: This is currently using mock data for demonstration. 
            The backend will integrate with Claude AI for real-time question generation.
          </p>
          <p className="text-xs mt-2 opacity-75">
            Built with React, FastAPI, and MongoDB • Powered by Claude AI
          </p>
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
import React, { useState } from 'react';
import { Search, Download, BarChart3, List, Loader2, LayoutDashboard } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import Logo from './Logo';
import UserDropdown from './UserDropdown';
import CompanySelector from './CompanySelector';
import UpgradeButton from './UpgradeButton';
import { useNavigate } from 'react-router-dom';

const SearchInterface = ({ onSearch, isLoading, searchTerm, setSearchTerm, viewMode, setViewMode }) => {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim());
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Navigation */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <CompanySelector />
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 border-blue-200 hover:border-blue-300 transition-all duration-200"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <UpgradeButton />
          <UserDropdown />
        </div>
      </div>

      {/* Hero Section with Logo */}
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <Logo size="hero" showText={true} />
        </div>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Discover what questions people are asking about your keywords. Generate 
          content ideas, SEO insights, and uncover search trends with AI-powered 
          keyword research.
        </p>
      </div>

      {/* Search Form */}
      <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Enter your keyword (e.g., digital marketing, coffee, fitness)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 text-lg border-2 focus:border-blue-500 transition-all duration-300"
                disabled={isLoading}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={isLoading || !searchTerm.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-3 text-lg font-semibold transition-all duration-300 transform hover:scale-105"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating Ideas...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-5 w-5" />
                      Get Questions
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SearchInterface;
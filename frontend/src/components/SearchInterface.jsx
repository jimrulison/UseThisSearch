import React, { useState } from 'react';
import { Search, Download, BarChart3, List, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import Logo from './Logo';

const SearchInterface = ({ onSearch, isLoading, searchTerm, setSearchTerm }) => {
  const [viewMode, setViewMode] = useState('graph');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim());
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Hero Section with Logo */}
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <Logo size="hero" showText={true} />
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover what questions people are asking about your keywords. Generate content ideas, SEO insights, and uncover search trends with AI-powered keyword research.
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
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={viewMode === 'graph' ? 'default' : 'outline'}
                  onClick={() => setViewMode('graph')}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Graph View
                </Button>
                <Button
                  type="button"
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  onClick={() => setViewMode('list')}
                  className="flex items-center gap-2"
                >
                  <List className="h-4 w-4" />
                  List View
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Quick Examples */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-3">Try these popular keywords:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {['digital marketing', 'coffee', 'fitness', 'crypto', 'AI', 'sustainability'].map((keyword) => (
            <Button
              key={keyword}
              variant="outline"
              size="sm"
              onClick={() => setSearchTerm(keyword)}
              className="hover:bg-blue-50 hover:border-blue-300 transition-colors"
              disabled={isLoading}
            >
              {keyword}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchInterface;
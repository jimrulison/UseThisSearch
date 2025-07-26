import React, { useState } from 'react';
import { Download, BarChart3, List, Search, MessageCircleQuestion, ArrowRight, Hash, BookOpen } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import GraphVisualization from './GraphVisualization';
import BlogTitleGenerator from './BlogTitleGenerator';
import MetaDescriptionGenerator from './MetaDescriptionGenerator';
import SocialMediaPostCreator from './SocialMediaPostCreator';
import FAQGenerator from './FAQGenerator';
import ContentBriefTemplates from './ContentBriefTemplates';
import ContentGuide from './ContentGuide';
import { Separator } from './ui/separator';
import { useToast } from '../hooks/use-toast';

const ResultsDisplay = ({ results, searchTerm, viewMode, setViewMode }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { toast } = useToast();

  if (!results || Object.keys(results).length === 0) {
    return null;
  }

  const handleFeatureError = (message) => {
    toast({
      title: "Content Generator",
      description: message,
      duration: 3000,
    });
  };

  if (!results || Object.keys(results).length === 0) {
    return null;
  }

  const handleExportCSV = () => {
    const csvData = [];
    csvData.push(['Category', 'Type', 'Question/Phrase', 'Popularity', 'Search Term']);
    
    Object.entries(sortedResults).forEach(([category, items]) => {
      items.forEach(item => {
        const text = typeof item === 'object' ? item.text : item;
        const popularity = typeof item === 'object' ? item.popularity : 'MEDIUM';
        csvData.push([category, category, text, popularity, searchTerm]);
      });
    });

    const csvContent = csvData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `answerthepublic-${searchTerm}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const totalSuggestions = Object.values(results).reduce((total, items) => total + items.length, 0);

  const categoryColors = {
    questions: 'bg-blue-100 text-blue-800 border-blue-200',
    prepositions: 'bg-green-100 text-green-800 border-green-200',
    comparisons: 'bg-purple-100 text-purple-800 border-purple-200',
    alphabetical: 'bg-orange-100 text-orange-800 border-orange-200'
  };

  const popularityColors = {
    HIGH: 'bg-red-100 text-red-800 border-red-200',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
    LOW: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  const popularityIcons = {
    HIGH: '🔥',
    MEDIUM: '🔸',
    LOW: '🔹'
  };

  // Sort results by popularity within each category
  const sortedResults = {};
  Object.entries(results).forEach(([category, items]) => {
    const popularityOrder = { 'HIGH': 0, 'MEDIUM': 1, 'LOW': 2 };
    sortedResults[category] = [...items].sort((a, b) => {
      const aPopularity = typeof a === 'object' ? a.popularity : 'MEDIUM';
      const bPopularity = typeof b === 'object' ? b.popularity : 'MEDIUM';
      return popularityOrder[aPopularity] - popularityOrder[bPopularity];
    });
  });

  const displayResults = selectedCategory === 'all' ? sortedResults : { [selectedCategory]: sortedResults[selectedCategory] || [] };

  const categoryIcons = {
    questions: MessageCircleQuestion,
    prepositions: ArrowRight,
    comparisons: BarChart3,
    alphabetical: Hash
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Results Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-800">
                Results for "{searchTerm}"
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Found {totalSuggestions} suggestions across {Object.keys(results).length} categories
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setViewMode(viewMode === 'graph' ? 'list' : 'graph')}
                className="flex items-center gap-2"
              >
                {viewMode === 'graph' ? (
                  <>
                    <List className="h-4 w-4" />
                    List View
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4" />
                    Graph View
                  </>
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setViewMode('guide')}
                className={`flex items-center gap-2 ${viewMode === 'guide' ? 'bg-blue-100 text-blue-700 border-blue-300' : ''}`}
              >
                <BookOpen className="h-4 w-4" />
                Expert Guide
              </Button>
              <Button 
                onClick={handleExportCSV}
                className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* View Toggle & Category Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('all')}
            size="sm"
            className="flex items-center gap-1"
          >
            <span>🔥</span>
            All - Ranked by Popularity ({totalSuggestions})
          </Button>
          {Object.entries(sortedResults).map(([category, items]) => {
            const IconComponent = categoryIcons[category];
            return (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category)}
                size="sm"
                className="flex items-center gap-1 capitalize"
              >
                {IconComponent && <IconComponent className="h-3 w-3" />}
                {category.replace('_', ' ')} ({items.length})
              </Button>
            );
          })}
        </div>
      </div>

      {/* Results Content */}
      {viewMode === 'graph' ? (
        <GraphVisualization 
          results={results} 
          searchTerm={searchTerm}
          selectedCategory={selectedCategory}
        />
      ) : (
        <div className="grid gap-6">
          {Object.entries(sortedResults)
            .filter(([category]) => selectedCategory === 'all' || selectedCategory === category)
            .map(([category, items]) => {
              const IconComponent = categoryIcons[category];
              return (
                <Card key={category} className="shadow-lg border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-xl capitalize">
                      {IconComponent && <IconComponent className="h-5 w-5 text-blue-600" />}
                      {category.replace('_', ' ')}
                      <Badge variant="secondary" className="ml-2">
                        {items.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {items.map((item, index) => {
                        const text = typeof item === 'object' ? item.text : item;
                        const popularity = typeof item === 'object' ? item.popularity : 'MEDIUM';
                        const popularityColor = popularityColors[popularity];
                        const popularityIcon = popularityIcons[popularity];
                        
                        return (
                          <div
                            key={index}
                            className={`p-3 rounded-lg border-2 ${categoryColors[category]} hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105 relative`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium text-sm flex-1">{text}</p>
                              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${popularityColor} flex-shrink-0`}>
                                <span>{popularityIcon}</span>
                                <span>{popularity}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}

      {/* Content Creation Tools - NEW FEATURES (completely isolated) */}
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">🚀 Content Creation Tools</h3>
          <p className="text-gray-600">Transform your keyword research into ready-to-use content</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BlogTitleGenerator 
            searchTerm={searchTerm} 
            onError={handleFeatureError}
          />
          <MetaDescriptionGenerator 
            searchTerm={searchTerm} 
            onError={handleFeatureError}
          />
          <SocialMediaPostCreator 
            searchTerm={searchTerm} 
            onError={handleFeatureError}
          />
          <FAQGenerator 
            searchTerm={searchTerm} 
            onError={handleFeatureError}
          />
        </div>
        
        <ContentBriefTemplates 
          searchTerm={searchTerm} 
          onError={handleFeatureError}
        />
      </div>
    </div>
  );
};

export default ResultsDisplay;
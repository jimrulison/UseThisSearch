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
import HashtagGenerator from './HashtagGenerator';
import ContentGuide from './ContentGuide';
import QuestionContentCreator from './QuestionContentCreator';
import { Separator } from './ui/separator';
import { useToast } from '../hooks/use-toast';

const ResultsDisplay = ({ results, searchTerm, viewMode, setViewMode }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeContentTool, setActiveContentTool] = useState('blog-titles'); // NEW: State for active tool
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
      <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl shadow-lg p-8 text-white mb-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">
            🎯 Results for "{searchTerm}"
          </h2>
          <p className="text-blue-100 text-lg">
            Found {totalSuggestions} suggestions across {Object.keys(results).length} categories
          </p>
        </div>
        
        {/* Action Buttons Row */}
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <Button
            variant="secondary"
            onClick={() => setViewMode('graph')}
            className={`flex items-center gap-2 transition-all duration-200 ${
              viewMode === 'graph' 
                ? 'bg-white text-purple-600 shadow-lg scale-105' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            📊 Graph View
          </Button>
          <Button
            variant="secondary"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 transition-all duration-200 ${
              viewMode === 'list' 
                ? 'bg-white text-purple-600 shadow-lg scale-105' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <List className="h-4 w-4" />
            📋 List View
          </Button>
          <Button
            variant="secondary"
            onClick={() => setViewMode('guide')}
            className={`flex items-center gap-2 transition-all duration-200 ${
              viewMode === 'guide' 
                ? 'bg-white text-purple-600 shadow-lg scale-105' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            💡 Expert Guide
          </Button>
          <Button
            variant="secondary"
            onClick={handleExportCSV}
            className="bg-green-400 text-white hover:bg-green-500 flex items-center gap-2 transition-all duration-200 hover:scale-105"
          >
            <Download className="h-4 w-4" />
            📤 Export CSV
          </Button>
        </div>
      </div>

      {/* View Toggle & Category Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-3 justify-center">
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
            const isActive = selectedCategory === category;
            
            // Define colors for each category
            const categoryColors = {
              questions: 'from-red-400 to-pink-500',
              prepositions: 'from-green-400 to-emerald-500', 
              comparisons: 'from-blue-400 to-indigo-500',
              alphabetical: 'from-purple-400 to-violet-500'
            };
            
            const categoryBgColors = {
              questions: 'bg-red-50 border-red-200 text-red-700',
              prepositions: 'bg-green-50 border-green-200 text-green-700',
              comparisons: 'bg-blue-50 border-blue-200 text-blue-700',
              alphabetical: 'bg-purple-50 border-purple-200 text-purple-700'
            };
            
            return (
              <Button
                key={category}
                variant={isActive ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category)}
                size="sm"
                className={`flex items-center gap-2 transition-all duration-300 transform hover:scale-105 capitalize ${
                  isActive 
                    ? `bg-gradient-to-r ${categoryColors[category]} text-white shadow-lg border-0` 
                    : `${categoryBgColors[category]} hover:shadow-md`
                }`}
              >
                {IconComponent && <IconComponent className="h-4 w-4" />}
                {isActive && <span className="text-lg">🔥</span>}
                {category.replace('_', ' ')} ({items.length})
              </Button>
            );
          })}
        </div>
      </div>

      {/* Results Content */}
      {viewMode === 'guide' ? (
        <ContentGuide searchTerm={searchTerm} results={results} />
      ) : viewMode === 'graph' ? (
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

      {/* Content Creation Tools - Enhanced with Colors */}
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            🚀 AI-Powered Content Creation Tools
          </h3>
          <p className="text-gray-700 text-xl max-w-3xl mx-auto leading-relaxed">
            Transform your keyword research into ready-to-use content with our advanced AI generators
          </p>
        </div>
        
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <CardContent className="p-8">
            {/* Content Tool Buttons */}
            <div className="mb-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                <Button
                  onClick={() => setActiveContentTool('blog-titles')}
                  className={`flex flex-col items-center gap-2 h-auto py-4 px-3 transition-all duration-300 hover:scale-105 rounded-xl min-h-[90px] ${
                    activeContentTool === 'blog-titles'
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg transform scale-105'
                      : 'bg-white hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 text-gray-700 border-2 hover:border-orange-200'
                  }`}
                >
                  <span className="text-2xl">✨</span>
                  <span className="font-medium text-xs text-center leading-tight">Blog Titles</span>
                </Button>
                
                <Button
                  onClick={() => setActiveContentTool('meta-descriptions')}
                  className={`flex flex-col items-center gap-2 h-auto py-4 px-3 transition-all duration-300 hover:scale-105 rounded-xl min-h-[90px] ${
                    activeContentTool === 'meta-descriptions'
                      ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg transform scale-105'
                      : 'bg-white hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 text-gray-700 border-2 hover:border-emerald-200'
                  }`}
                >
                  <span className="text-2xl">📝</span>
                  <span className="font-medium text-xs text-center leading-tight">Meta Descriptions</span>
                </Button>
                
                <Button
                  onClick={() => setActiveContentTool('social-media')}
                  className={`flex flex-col items-center gap-2 h-auto py-4 px-3 transition-all duration-300 hover:scale-105 rounded-xl min-h-[90px] ${
                    activeContentTool === 'social-media'
                      ? 'bg-gradient-to-r from-pink-400 to-rose-500 text-white shadow-lg transform scale-105'
                      : 'bg-white hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50 text-gray-700 border-2 hover:border-rose-200'
                  }`}
                >
                  <span className="text-2xl">📱</span>
                  <span className="font-medium text-xs text-center leading-tight">Social Media</span>
                </Button>
                
                <Button
                  onClick={() => setActiveContentTool('hashtags')}
                  className={`flex flex-col items-center gap-2 h-auto py-4 px-3 transition-all duration-300 hover:scale-105 rounded-xl min-h-[90px] ${
                    activeContentTool === 'hashtags'
                      ? 'bg-gradient-to-r from-indigo-400 to-blue-500 text-white shadow-lg transform scale-105'
                      : 'bg-white hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 text-gray-700 border-2 hover:border-blue-200'
                  }`}
                >
                  <span className="text-2xl">#️⃣</span>
                  <span className="font-medium text-xs text-center leading-tight">Hashtags</span>
                </Button>
                
                <Button
                  onClick={() => setActiveContentTool('faq')}
                  className={`flex flex-col items-center gap-2 h-auto py-4 px-3 transition-all duration-300 hover:scale-105 rounded-xl min-h-[90px] ${
                    activeContentTool === 'faq'
                      ? 'bg-gradient-to-r from-purple-400 to-violet-500 text-white shadow-lg transform scale-105'
                      : 'bg-white hover:bg-gradient-to-r hover:from-purple-50 hover:to-violet-50 text-gray-700 border-2 hover:border-violet-200'
                  }`}
                >
                  <span className="text-2xl">❓</span>
                  <span className="font-medium text-xs text-center leading-tight">FAQ</span>
                </Button>
                
                <Button
                  onClick={() => setActiveContentTool('content-briefs')}
                  className={`flex flex-col items-center gap-2 h-auto py-4 px-3 transition-all duration-300 hover:scale-105 rounded-xl min-h-[90px] ${
                    activeContentTool === 'content-briefs'
                      ? 'bg-gradient-to-r from-teal-400 to-cyan-500 text-white shadow-lg transform scale-105'
                      : 'bg-white hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 text-gray-700 border-2 hover:border-cyan-200'
                  }`}
                >
                  <span className="text-2xl">📋</span>
                  <span className="font-medium text-xs text-center leading-tight">Content Briefs</span>
                </Button>
                
                <Button
                  onClick={() => setActiveContentTool('question-content')}
                  className={`flex flex-col items-center gap-2 h-auto py-4 px-3 transition-all duration-300 hover:scale-105 rounded-xl min-h-[90px] ${
                    activeContentTool === 'question-content'
                      ? 'bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-lg transform scale-105'
                      : 'bg-white hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 text-gray-700 border-2 hover:border-pink-200'
                  }`}
                >
                  <span className="text-2xl">💬</span>
                  <span className="font-medium text-xs text-center leading-tight">Question Content</span>
                </Button>
              </div>
            </div>
            
            {/* Content Tool Display */}
            <div className="mt-6">
              {activeContentTool === 'blog-titles' && (
                <BlogTitleGenerator 
                  searchTerm={searchTerm} 
                  onError={handleFeatureError}
                />
              )}
              
              {activeContentTool === 'meta-descriptions' && (
                <MetaDescriptionGenerator 
                  searchTerm={searchTerm} 
                  onError={handleFeatureError}
                />
              )}
              
              {activeContentTool === 'social-media' && (
                <SocialMediaPostCreator 
                  searchTerm={searchTerm} 
                  onError={handleFeatureError}
                />
              )}
              
              {activeContentTool === 'hashtags' && (
                <HashtagGenerator 
                  searchTerm={searchTerm} 
                  onError={handleFeatureError}
                />
              )}
              
              {activeContentTool === 'faq' && (
                <FAQGenerator 
                  searchTerm={searchTerm} 
                  onError={handleFeatureError}
                />
              )}
              
              {activeContentTool === 'content-briefs' && (
                <ContentBriefTemplates 
                  searchTerm={searchTerm} 
                  onError={handleFeatureError}
                />
              )}
              
              {activeContentTool === 'question-content' && (
                <QuestionContentCreator 
                  searchTerm={searchTerm} 
                  results={results}
                  onError={handleFeatureError}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResultsDisplay;
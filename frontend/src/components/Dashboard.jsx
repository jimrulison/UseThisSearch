import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Search, 
  TrendingUp, 
  Clock, 
  BarChart3, 
  Calendar,
  Building2,
  Eye,
  Download,
  CreditCard
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/use-toast';
import { useCompany } from '../contexts/CompanyContext';
import Logo from './Logo';
import UserDropdown from './UserDropdown';
import CompanySelector from './CompanySelector';
import BillingDashboard from './BillingDashboard';

const Dashboard = () => {
  const navigate = useNavigate();
  const { activeCompany, getDashboardStats, getCompanySearches } = useCompany();
  const { toast } = useToast();
  
  const [stats, setStats] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (activeCompany) {
      loadDashboardData();
    }
  }, [activeCompany]);

  const loadDashboardData = async () => {
    if (!activeCompany) return;
    
    setIsLoading(true);
    try {
      // Load dashboard stats
      const dashboardData = await getDashboardStats(activeCompany.id);
      if (dashboardData) {
        setStats(dashboardData);
      }

      // Load recent searches with more details
      const searches = await getCompanySearches(activeCompany.id, 20, 0);
      setRecentSearches(searches);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportSearchHistory = () => {
    if (!recentSearches || recentSearches.length === 0) {
      toast({
        title: "No Data",
        description: "No search history to export.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Prepare CSV data
    const csvData = [];
    csvData.push(['Search Term', 'Suggestions Count', 'Date', 'Company']);
    
    recentSearches.forEach(search => {
      csvData.push([
        search.search_term,
        search.suggestions_count,
        formatDate(search.created_at),
        activeCompany.name
      ]);
    });

    const csvContent = csvData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `search-history-${activeCompany.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Export Complete",
      description: "Search history has been exported to CSV.",
      duration: 3000,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-600">Loading dashboard data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Search
            </Button>
            <div className="flex items-center gap-2">
              <Logo size="small" showText={false} />
              <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <CompanySelector />
            <UserDropdown />
          </div>
        </div>

        {/* Company Info */}
        {activeCompany && (
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-blue-600" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {activeCompany.name}
                    {activeCompany.is_personal && (
                      <Badge variant="secondary" className="ml-2">Personal</Badge>
                    )}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Created {formatDate(activeCompany.created_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <Search className="h-4 w-4" />
                  Total Searches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-800">
                  {stats.total_searches.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <TrendingUp className="h-4 w-4" />
                  Popular Terms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-800">
                  {stats.popular_terms.length}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <Clock className="h-4 w-4" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-800">
                  {stats.recent_searches.length}
                </div>
                <p className="text-xs text-gray-500">Last 20 searches</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <BarChart3 className="h-4 w-4" />
                  Trend Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-800">
                  {stats.search_trends.length}
                </div>
                <p className="text-xs text-gray-500">Days with activity</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Recent Searches */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Recent Searches
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={exportSearchHistory}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentSearches.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recentSearches.map((search, index) => (
                    <div key={search.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {search.search_term}
                        </p>
                        <p className="text-sm text-gray-500">
                          {search.suggestions_count} suggestions • {formatDate(search.created_at)}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          navigate('/');
                          // Note: In a real app, you'd want to trigger a search with this term
                        }}
                        className="flex-shrink-0 ml-2"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No searches found for this company.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/')}
                    className="mt-4"
                  >
                    Start Searching
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Popular Terms */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Popular Search Terms
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats && stats.popular_terms.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {stats.popular_terms.map((termData, index) => {
                    const term = Object.keys(termData)[0];
                    const count = termData[term];
                    return (
                      <div key={term} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <span className="font-medium text-gray-800">{term}</span>
                        </div>
                        <Badge variant="secondary">
                          {count} search{count !== 1 ? 'es' : ''}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No popular terms yet.</p>
                  <p className="text-sm">Search for keywords to see trends.</p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Search Trends Chart Placeholder */}
        {stats && stats.search_trends.length > 0 && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Search Activity (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.search_trends.map((trend, index) => (
                  <div key={trend.date} className="flex items-center gap-4 p-2">
                    <span className="text-sm text-gray-600 w-20">{trend.date}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min((trend.count / Math.max(...stats.search_trends.map(t => t.count))) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-800 w-12">{trend.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
};

export default Dashboard;
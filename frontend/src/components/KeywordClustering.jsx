import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Sparkles, 
  Download, 
  Layers, 
  TrendingUp, 
  Users, 
  Target, 
  BarChart3,
  BookOpen,
  Lightbulb,
  AlertTriangle,
  Crown,
  Lock,
  Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { useBilling } from '../contexts/BillingContext';
import { useToast } from '../hooks/use-toast';

const KeywordClustering = ({ searchResults }) => {
  const [clusteringResults, setClusteringResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [usageStats, setUsageStats] = useState(null);
  const [usageLimits, setUsageLimits] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  const { subscription, checkFeatureAccess } = useBilling();
  const { toast } = useToast();

  // Check if user has access to clustering
  const hasClusteringAccess = checkFeatureAccess('keyword_clustering');
  const isAnnualSubscriber = subscription?.billing_cycle === 'annual';
  const canUseClustering = hasClusteringAccess && isAnnualSubscriber;

  useEffect(() => {
    if (canUseClustering) {
      loadUsageStats();
      loadAnalysisHistory();
    }
  }, [canUseClustering, currentCompany]);

  const loadUsageStats = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/clustering/stats?user_id=${user.id}&company_id=${currentCompany.id}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (response.ok) {
        const stats = await response.json();
        setUsageStats(stats);
      }

      // Load usage limits
      const limitsResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/clustering/usage-limits?user_id=${user.id}&company_id=${currentCompany.id}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (limitsResponse.ok) {
        const limits = await limitsResponse.json();
        setUsageLimits(limits);
      }
    } catch (error) {
      console.error('Failed to load usage stats:', error);
    }
  };

  const loadAnalysisHistory = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/clustering/analyses?user_id=${user.id}&company_id=${currentCompany.id}&limit=5`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (response.ok) {
        const history = await response.json();
        setAnalysisHistory(history);
      }
    } catch (error) {
      console.error('Failed to load analysis history:', error);
    }
  };

  const performClustering = async () => {
    if (!canUseClustering) {
      toast({
        title: "Premium Feature",
        description: "Keyword clustering requires an annual subscription. Upgrade to access this feature.",
        variant: "destructive"
      });
      return;
    }

    if (!searchResults?.suggestions?.questions || searchResults.suggestions.questions.length < 2) {
      toast({
        title: "Insufficient Data",
        description: "Please perform a keyword search first to get questions for clustering.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Extract keywords from search results
      const keywords = searchResults.suggestions.questions.map(q => q.text);
      
      const requestBody = {
        keywords: keywords,
        search_volumes: null, // Could integrate with search volume API
        difficulties: null,   // Could integrate with keyword difficulty API
        user_id: user.id,
        company_id: currentCompany.id
      };

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/clustering/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Clustering analysis failed');
      }

      const results = await response.json();
      setClusteringResults(results);
      loadUsageStats(); // Refresh usage stats
      
      toast({
        title: "Analysis Complete!",
        description: `Successfully created ${results.total_clusters} keyword clusters from ${results.total_keywords} keywords.`,
      });

    } catch (error) {
      console.error('Clustering failed:', error);
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exportResults = async (format = 'csv') => {
    if (!clusteringResults) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/clustering/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          analysis_id: clusteringResults.id,
          format: format,
          include_suggestions: true,
          include_gaps: true,
          include_opportunities: true
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `keyword_clusters_${clusteringResults.id}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Export Complete",
          description: `Cluster analysis exported as ${format.toUpperCase()}`
        });
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Premium access gate
  if (!canUseClustering) {
    return (
      <Card className="mt-6 border-2 border-gradient-to-r from-purple-500 to-blue-500">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Group Keywords Engine
          </CardTitle>
          <p className="text-gray-600 mt-2">Transform scattered keywords into strategic content pillars</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Layers className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-900">Smart Clustering</h3>
              <p className="text-sm text-blue-700">AI groups related keywords by search intent and topic</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-900">Content Strategy</h3>
              <p className="text-sm text-green-700">Get pillar page recommendations and content gaps</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-purple-900">Priority Scoring</h3>
              <p className="text-sm text-purple-700">Focus on high-impact clusters first</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-6 rounded-lg text-center">
            <Lock className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Premium Annual Feature</h3>
            <p className="text-gray-600 mb-4">
              Keyword clustering is available exclusively to annual subscribers. 
              Upgrade to transform your keyword research into actionable content strategies.
            </p>
            
            <div className="space-y-2 text-sm text-gray-600 mb-6">
              <div className="flex items-center justify-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>10x faster content planning</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <span>Strategic pillar page recommendations</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <BarChart3 className="w-4 h-4 text-green-500" />
                <span>Content gap analysis & opportunities</span>
              </div>
            </div>

            <Button 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              onClick={() => window.location.href = '/billing'}
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Annual Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Header with Usage Stats */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-600" />
                Keyword Clustering Engine
                <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                  PREMIUM
                </Badge>
              </CardTitle>
              <p className="text-gray-600 mt-1">
                Group related keywords into strategic content clusters
              </p>
            </div>
            
            {usageLimits && (
              <div className="text-right">
                <div className="text-sm text-gray-600">This Month</div>
                <div className="text-lg font-semibold">
                  {usageLimits.analyses_used_this_month} / {usageLimits.monthly_analyses_limit}
                </div>
                <div className="text-xs text-gray-500">analyses used</div>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {usageStats && (
              <>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{usageStats.total_analyses}</div>
                  <div className="text-sm text-blue-700">Total Analyses</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{usageStats.total_clusters_created}</div>
                  <div className="text-sm text-green-700">Clusters Created</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{usageStats.total_keywords_clustered}</div>
                  <div className="text-sm text-purple-700">Keywords Processed</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{usageStats.average_clusters_per_analysis.toFixed(1)}</div>
                  <div className="text-sm text-orange-700">Avg Clusters</div>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-4">
            <Button 
              onClick={performClustering}
              disabled={isAnalyzing || !searchResults?.suggestions?.questions}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analyzing Keywords...
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4 mr-2" />
                  Create Clusters
                </>
              )}
            </Button>
            
            {clusteringResults && (
              <Button 
                variant="outline" 
                onClick={() => exportResults('csv')}
                className="border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Clustering Results */}
      {clusteringResults && (
        <Tabs defaultValue="clusters" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="clusters">
              Clusters ({clusteringResults.total_clusters})
            </TabsTrigger>
            <TabsTrigger value="gaps">
              Content Gaps ({clusteringResults.content_gaps.length})
            </TabsTrigger>
            <TabsTrigger value="opportunities">
              Opportunities ({clusteringResults.pillar_opportunities.length})
            </TabsTrigger>
            <TabsTrigger value="insights">
              Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clusters" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {clusteringResults.clusters.map((cluster, index) => (
                <Card 
                  key={cluster.id} 
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedCluster?.id === cluster.id 
                      ? 'ring-2 ring-purple-500 shadow-lg' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedCluster(cluster)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{cluster.name}</CardTitle>
                        <p className="text-sm text-gray-600">{cluster.keywords.length} keywords</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-purple-600">
                          {cluster.priority_score.toFixed(0)}
                        </div>
                        <div className="text-xs text-gray-500">priority</div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          {cluster.search_intent}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {cluster.buyer_journey_stage}
                        </Badge>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Primary Keyword:</div>
                        <div className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {cluster.primary_keyword}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Content Ideas:</div>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {cluster.content_suggestions.slice(0, 2).map((suggestion, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <Lightbulb className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="gaps" className="mt-6">
            <div className="space-y-4">
              {clusteringResults.content_gaps.map((gap, index) => (
                <Card key={index} className="border-l-4 border-l-orange-500">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{gap.description}</h3>
                        <p className="text-sm text-gray-600 mt-1">{gap.recommendation}</p>
                        <Badge 
                          className={`mt-2 ${
                            gap.priority === 'high' ? 'bg-red-100 text-red-800' :
                            gap.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {gap.priority} priority
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {clusteringResults.content_gaps.length === 0 && (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-gray-500">
                      <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">Great Content Coverage!</h3>
                      <p>No significant content gaps detected in your keyword clusters.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="opportunities" className="mt-6">
            <div className="space-y-4">
              {clusteringResults.pillar_opportunities.map((opportunity, index) => (
                <Card key={index} className="border-l-4 border-l-green-500">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-green-500 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-800">
                            {opportunity.type === 'pillar_page' ? 'Pillar Page Opportunity' : 'Topic Hub Opportunity'}
                          </h3>
                          <Badge className="bg-green-100 text-green-800">
                            {opportunity.priority} priority
                          </Badge>
                        </div>
                        
                        {opportunity.cluster_name && (
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Focus:</strong> {opportunity.cluster_name}
                          </p>
                        )}
                        
                        {opportunity.description && (
                          <p className="text-sm text-gray-600 mb-2">{opportunity.description}</p>
                        )}
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {opportunity.supporting_keywords && (
                            <div>
                              <span className="font-medium">Keywords:</span> {opportunity.supporting_keywords}
                            </div>
                          )}
                          {opportunity.search_volume && (
                            <div>
                              <span className="font-medium">Volume:</span> {opportunity.search_volume.toLocaleString()}
                            </div>
                          )}
                          {opportunity.total_keywords && (
                            <div>
                              <span className="font-medium">Total Keywords:</span> {opportunity.total_keywords}
                            </div>
                          )}
                          {opportunity.clusters_involved && (
                            <div>
                              <span className="font-medium">Clusters:</span> {opportunity.clusters_involved}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {clusteringResults.pillar_opportunities.length === 0 && (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-gray-500">
                      <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No Major Opportunities</h3>
                      <p>Your keyword clusters don't show clear pillar page opportunities yet. Try analyzing more keywords or different topics.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Search Intent Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Intent distribution chart would go here */}
                  <div className="space-y-3">
                    {['informational', 'commercial', 'transactional', 'navigational'].map(intent => {
                      const count = clusteringResults.clusters.filter(c => c.search_intent === intent).length;
                      const percentage = (count / clusteringResults.total_clusters * 100).toFixed(1);
                      return (
                        <div key={intent} className="flex justify-between items-center">
                          <span className="capitalize text-sm">{intent}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{width: `${percentage}%`}}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Buyer Journey Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['awareness', 'consideration', 'decision'].map(stage => {
                      const count = clusteringResults.clusters.filter(c => c.buyer_journey_stage === stage).length;
                      const percentage = (count / clusteringResults.total_clusters * 100).toFixed(1);
                      return (
                        <div key={stage} className="flex justify-between items-center">
                          <span className="capitalize text-sm">{stage}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{width: `${percentage}%`}}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Processing Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{clusteringResults.total_keywords}</div>
                    <div className="text-sm text-gray-600">Keywords Analyzed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{clusteringResults.total_clusters}</div>
                    <div className="text-sm text-gray-600">Clusters Created</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{clusteringResults.processing_time.toFixed(2)}s</div>
                    <div className="text-sm text-gray-600">Processing Time</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {(clusteringResults.total_keywords / clusteringResults.total_clusters).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Avg Keywords/Cluster</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Analysis History */}
      {analysisHistory.length > 0 && !clusteringResults && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Analyses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysisHistory.map((analysis, index) => (
                <div key={analysis.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{analysis.total_keywords} keywords → {analysis.total_clusters} clusters</div>
                    <div className="text-sm text-gray-600">
                      {new Date(analysis.created_at).toLocaleDateString()} • {analysis.processing_time.toFixed(1)}s
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Load this analysis
                      fetch(`${process.env.REACT_APP_BACKEND_URL}/api/clustering/analyses/${analysis.id}?user_id=${user.id}&company_id=${currentCompany.id}`, {
                        headers: { 'Authorization': `Bearer ${user.token}` }
                      })
                      .then(res => res.json())
                      .then(data => setClusteringResults(data));
                    }}
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default KeywordClustering;
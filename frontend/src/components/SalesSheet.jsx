import React from 'react';
import { CheckCircle, Star, TrendingUp, Users, Zap, Clock, Target, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import Logo from './Logo';

const SalesSheet = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-6">
          <Logo size="large" showText={true} className="justify-center" />
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-gray-900">
              The Ultimate AI-Powered Keyword Research Tool
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transform your content strategy with Claude AI-generated keyword insights. Discover what your audience is really searching for.
            </p>
            <div className="flex justify-center gap-2">
              <Badge className="bg-green-600 text-white border-green-700">
                🔥 AI-Powered
              </Badge>
              <Badge className="bg-blue-600 text-white border-blue-700">
                ⚡ Real-Time Results
              </Badge>
              <Badge className="bg-purple-600 text-white border-purple-700">
                📊 Data Export
              </Badge>
            </div>
          </div>
        </div>

        {/* Key Benefits */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">AI-Powered Intelligence</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Claude 3.5 Sonnet generates 70-80+ realistic keyword suggestions based on real search behavior
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Popularity Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Smart HIGH/MEDIUM/LOW popularity indicators help you prioritize the most valuable keywords
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Visual Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Interactive graph visualization and categorized lists make data analysis effortless
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle className="text-lg">Instant Results</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Get comprehensive keyword research in 10-15 seconds with professional CSV export
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Features Breakdown */}
        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Target className="h-6 w-6 text-blue-600" />
                What You Get
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Questions Category</p>
                    <p className="text-sm text-gray-600">Who, What, Where, When, Why, How questions people actually ask</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Preposition Phrases</p>
                    <p className="text-sm text-gray-600">For, with, without, to, from, near - context-based searches</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Comparison Keywords</p>
                    <p className="text-sm text-gray-600">Vs, versus, or, and, like - competitive analysis opportunities</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Alphabetical Variations</p>
                    <p className="text-sm text-gray-600">A-Z keyword combinations for comprehensive coverage</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Users className="h-6 w-6 text-purple-600" />
                Perfect For
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Star className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Content Creators</p>
                    <p className="text-sm text-gray-600">Blog topics, video ideas, social media content planning</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Star className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">SEO Professionals</p>
                    <p className="text-sm text-gray-600">Keyword research, content gap analysis, competitor insights</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Star className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Digital Marketers</p>
                    <p className="text-sm text-gray-600">Campaign ideation, audience research, trend discovery</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Star className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Business Owners</p>
                    <p className="text-sm text-gray-600">Understanding customer questions and search intent</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Technical Specs */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Technical Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-blue-600">Claude 3.5</div>
                <div className="text-sm text-gray-600">Sonnet AI Model</div>
                <div className="text-xs text-gray-500">Latest AI technology for accurate keyword insights</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-green-600">70-80+</div>
                <div className="text-sm text-gray-600">Suggestions per Search</div>
                <div className="text-xs text-gray-500">Comprehensive coverage across all categories</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-purple-600">10-15s</div>
                <div className="text-sm text-gray-600">Processing Time</div>
                <div className="text-xs text-gray-500">Fast AI-powered generation with real-time results</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Export Features */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Export & Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-gray-700">
                Export your keyword research to CSV with popularity rankings included. 
                Perfect for further analysis in Excel, Google Sheets, or your favorite SEO tools.
              </p>
              <div className="flex justify-center gap-4 flex-wrap">
                <Badge className="bg-white text-gray-700 border-gray-300">📊 CSV Export</Badge>
                <Badge className="bg-white text-gray-700 border-gray-300">🔗 API Ready</Badge>
                <Badge className="bg-white text-gray-700 border-gray-300">📱 Mobile Responsive</Badge>
                <Badge className="bg-white text-gray-700 border-gray-300">⚡ Real-time Processing</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center space-y-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <h3 className="text-3xl font-bold">Ready to Transform Your Keyword Research?</h3>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Join thousands of content creators and marketers who rely on AI-powered insights to drive their content strategy.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8">
              Start Free Search
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 font-semibold px-8">
              View Demo
            </Button>
          </div>
          <p className="text-sm opacity-75">
            No signup required • Instant results • Professional features
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm space-y-2">
          <p>Powered by Claude 3.5 Sonnet AI • Built with React, FastAPI, and MongoDB</p>
          <p>© 2025 Use This Search. Advanced AI keyword research for modern marketers.</p>
        </div>
      </div>
    </div>
  );
};

export default SalesSheet;
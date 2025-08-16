import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  BookOpen, 
  Play, 
  Download, 
  FileText, 
  Video, 
  Users, 
  Settings, 
  Search,
  X,
  ExternalLink
} from 'lucide-react';

const EducationCenter = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('tutorials');

  // Tutorial slides data - these will be converted to videos later
  const tutorialSlides = [
    {
      id: 'user-platform',
      title: 'User Platform Complete Guide',
      description: 'Learn how to use all features of the search platform',
      duration: '5-7 minutes',
      slides: [
        {
          title: 'Getting Started - Login & Access',
          content: 'Learn how to access the platform with case-insensitive email support',
          narration: 'Welcome to Use This Search. Getting started is simple - enter your email and password. Note that emails are case-insensitive.'
        },
        {
          title: 'Main Interface Tour',
          content: 'Overview of team indicators, company selector, and navigation',
          narration: 'Once logged in, notice the team size indicator, company selector for managing workspaces, and the upgrade button.'
        },
        {
          title: 'AI-Powered Search',
          content: 'How to perform searches and get 40+ keyword suggestions',
          narration: 'Type your target keyword and click Generate Ideas. The AI will return over 40 relevant suggestions across four categories.'
        },
        {
          title: 'Understanding Results',
          content: 'Graph view, list view, and category filtering',
          narration: 'View results in graph format showing connections, or list view for easy scanning. Filter by category and export to CSV.'
        },
        {
          title: 'Content Generation Tools',
          content: '6 AI-powered tools for blog titles, social posts, FAQs, and more',
          narration: 'Use the six powerful content generation tools: Blog Title Generator, Meta Description, Social Media Posts, FAQ, Content Brief, and Hashtag generators.'
        },
        {
          title: 'Dashboard & Analytics',
          content: 'Company insights, search history, and performance tracking',
          narration: 'The dashboard provides valuable insights into search activity, popular terms, and company performance across multiple workspaces.'
        }
      ]
    },
    {
      id: 'admin-platform',
      title: 'Admin Platform Complete Guide',
      description: 'Comprehensive administrative features and user management',
      duration: '4-5 minutes',
      slides: [
        {
          title: 'Admin Access & Security',
          content: 'Secure login with dedicated admin credentials',
          narration: 'Access the admin platform using dedicated login URL with administrator credentials. The interface features a professional dark theme.'
        },
        {
          title: 'System Overview Dashboard',
          content: 'Real-time metrics, user activity, and system health',
          narration: 'The admin dashboard shows real-time system metrics including total users, searches, companies, and revenue with recent user activity.'
        },
        {
          title: 'Custom Pricing System',
          content: 'Set special pricing for specific users',
          narration: 'The custom pricing widget allows administrators to override standard subscription pricing for specific users with full audit trail.'
        },
        {
          title: 'User Management & Analytics',
          content: 'User lookup, global analytics, and system oversight',
          narration: 'User lookup provides detailed insights, while global analytics shows system-wide patterns and trends across all platform usage.'
        }
      ]
    }
  ];

  // Educational materials/manuals
  const educationalMaterials = [
    {
      id: 'complete-training-guide',
      title: 'Complete Training Guide',
      description: 'Comprehensive 50+ page guide covering all platform features',
      type: 'PDF',
      size: '2.8 MB',
      pages: '50+',
      icon: BookOpen,
      content: 'Complete step-by-step training for both user and admin platforms'
    },
    {
      id: 'question-economy-whitepaper',
      title: 'The Question Economy White Paper',
      description: 'How Google\'s 2025 Algorithm Rewards Question-Answering Businesses',
      type: 'PDF',
      size: '3.2 MB',
      pages: '35',
      icon: FileText,
      content: 'Comprehensive analysis of Google\'s search transformation and strategic response framework',
      featured: true
    },
    {
      id: 'building-great-questions',
      title: 'Building Great Questions Guide',
      description: 'Master the art of question recognition and content structure',
      type: 'PDF',
      size: '1.8 MB',
      pages: '22',
      icon: Search,
      content: 'Complete guide to producing question-based content that ranks and converts'
    },
    {
      id: 'user-quick-start',
      title: 'User Quick Start Guide',
      description: 'Get started quickly with essential features',
      type: 'PDF',
      size: '800 KB',
      pages: '12',
      icon: FileText,
      content: 'Essential features for new users to get productive quickly'
    },
    {
      id: 'admin-manual',
      title: 'Administrator Manual',
      description: 'Complete admin platform documentation',
      type: 'PDF',
      size: '1.5 MB',
      pages: '25',
      icon: Settings,
      content: 'Comprehensive administrative features and best practices'
    },
    {
      id: 'best-practices',
      title: 'Best Practices Guide',
      description: 'Tips and strategies for optimal platform usage',
      type: 'PDF',
      size: '600 KB',
      pages: '8',
      icon: Users,
      content: 'Advanced strategies for teams and power users'
    },
    {
      id: 'starting-ideas-guide',
      title: 'Google Search Optimization Guide',
      description: 'Master question-based content that ranks in Google',
      type: 'PDF',
      size: '1.2 MB',
      pages: '18',
      icon: Search,
      content: 'Question recognition, answer architecture, and Google ranking strategies'
    },
    {
      id: 'beautiful-onboarding',
      title: 'Getting Started Masterclass',
      description: 'Beautiful step-by-step guide to platform success',
      type: 'PDF',
      size: '900 KB',
      pages: '15',
      icon: Play,
      content: 'Transform from newcomer to expert in 15-20 minutes'
    }
  ];

  const handleDownloadPDF = (materialId) => {
    // This will be implemented to generate/serve PDF files
    console.log(`Downloading PDF: ${materialId}`);
    // For now, we'll show a placeholder action
    alert(`PDF download functionality will be implemented for: ${materialId}`);
  };

  const handlePlayTutorial = (tutorialId) => {
    // This will be implemented when videos are created
    console.log(`Playing tutorial: ${tutorialId}`);
    alert(`Video tutorial will be available soon: ${tutorialId}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              Education Center
            </h2>
            <p className="text-blue-100 mt-1">Training materials, tutorials, and guides</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tutorials" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Video Tutorials
              </TabsTrigger>
              <TabsTrigger value="manuals" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Downloadable Manuals
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tutorials" className="mt-6">
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Interactive Tutorial Slides</h3>
                  <p className="text-gray-600">These slides will be converted to professional video tutorials</p>
                </div>

                {tutorialSlides.map((tutorial) => (
                  <Card key={tutorial.id} className="border-2 hover:border-blue-300 transition-colors">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Play className="h-5 w-5 text-blue-600" />
                            {tutorial.title}
                          </CardTitle>
                          <p className="text-gray-600 mt-1">{tutorial.description}</p>
                          <p className="text-sm text-blue-600 font-medium mt-1">Duration: {tutorial.duration}</p>
                        </div>
                        <Button
                          onClick={() => handlePlayTutorial(tutorial.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Preview Slides
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-800">Tutorial Outline:</h4>
                        {tutorial.slides.map((slide, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded-lg">
                            <h5 className="font-medium text-sm text-gray-800">{index + 1}. {slide.title}</h5>
                            <p className="text-xs text-gray-600 mt-1">{slide.content}</p>
                            <p className="text-xs text-blue-600 mt-1 italic">"{slide.narration}"</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="manuals" className="mt-6">
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Downloadable PDF Manuals</h3>
                  <p className="text-gray-600">Comprehensive guides for reference and training</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {educationalMaterials.map((material) => {
                    const IconComponent = material.icon;
                    return (
                      <Card key={material.id} className={`border-2 hover:border-green-300 transition-colors ${material.featured ? 'ring-2 ring-blue-200 bg-blue-50' : ''}`}>
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-lg ${material.featured ? 'bg-blue-100' : 'bg-green-100'}`}>
                              <IconComponent className={`h-6 w-6 ${material.featured ? 'text-blue-600' : 'text-green-600'}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-1">
                                <h4 className="font-semibold text-gray-800">{material.title}</h4>
                                {material.featured && (
                                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                    Featured
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{material.description}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                                <span className="bg-gray-100 px-2 py-1 rounded">{material.type}</span>
                                <span>{material.size}</span>
                                <span>{material.pages} pages</span>
                              </div>
                              <p className="text-xs text-gray-600 mb-4">{material.content}</p>
                              <Button
                                onClick={() => handleDownloadPDF(material.id)}
                                size="sm"
                                className={`text-white ${material.featured ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <Card className="border-2 border-blue-200 bg-blue-50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <ExternalLink className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold text-blue-800">Additional Resources</h4>
                    </div>
                    <p className="text-blue-700 text-sm mb-3">
                      Access more training materials and get personalized support:
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-blue-700">Live training sessions available upon request</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-blue-700">One-on-one admin platform training</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-blue-700">Custom team workshops and onboarding</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default EducationCenter;
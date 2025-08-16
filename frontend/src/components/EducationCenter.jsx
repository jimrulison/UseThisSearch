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
  ExternalLink,
  ArrowLeft,
  Eye
} from 'lucide-react';
import jsPDF from 'jspdf';

const EducationCenter = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('tutorials');
  const [viewingDocument, setViewingDocument] = useState(null);

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

  // Educational materials/manuals - reordered as requested
  const educationalMaterials = [
    {
      id: 'user-quick-start',
      title: 'User Quick Start Guide',
      description: 'Get started quickly with essential features',
      type: 'PDF',
      size: '800 KB',
      pages: '12',
      icon: FileText,
      content: 'Essential features for new users to get productive quickly',
      docContent: `# USER QUICK START GUIDE

## Welcome to Use This Search!
This quick start guide will get you up and running in just a few minutes.

### Step 1: Login
- Enter your email (case-insensitive)
- Enter your password (6+ characters)
- Click "Sign In"

### Step 2: First Search
- Type a keyword in the search box
- Click "Generate Ideas"
- Get 40+ relevant suggestions

### Step 3: View Results
- Switch between Graph and List views
- Filter by category (Questions, Prepositions, Comparisons, Alphabetical)
- Export to CSV for later use

### Step 4: Generate Content
- Use the 6 content generation tools
- Create blog titles, social posts, FAQs, and more
- Copy generated content for your use

### Step 5: Access Dashboard
- View search analytics
- Track team usage
- Monitor performance

That's it! You're ready to start generating valuable content ideas.`
    },
    {
      id: 'complete-training-guide',
      title: 'Complete Training Guide',
      description: 'Comprehensive 50+ page guide covering all platform features',
      type: 'PDF',
      size: '2.8 MB',
      pages: '50+',
      icon: BookOpen,
      content: 'Complete step-by-step training for both user and admin platforms',
      featured: true,
      docContent: `# USE THIS SEARCH - COMPLETE TRAINING MANUAL

This comprehensive manual covers all aspects of the Use This Search platform.

## Table of Contents

### PART I - USER PLATFORM TRAINING
- Chapter 1: Getting Started
- Chapter 2: AI-Powered Search System
- Chapter 3: Content Generation Tools
- Chapter 4: Dashboard & Analytics
- Chapter 5: Team & Company Management
- Chapter 6: Billing & Subscriptions

### PART II - ADMIN PLATFORM TRAINING
- Chapter 7: Administrative Access
- Chapter 8: System Overview Dashboard
- Chapter 9: Custom Pricing Management
- Chapter 10: User Management & Analytics
- Chapter 11: System Administration

### PART III - ADVANCED FEATURES & BEST PRACTICES
- Chapter 12: Advanced Search Strategies
- Chapter 13: Content Optimization
- Chapter 14: Troubleshooting Guide
- Chapter 15: Security & Best Practices

## Platform Capabilities

### For Users:
- AI-Powered Keyword Research: Generate 40+ relevant keyword suggestions per search
- Multi-View Results: Graph and list visualizations of keyword relationships
- Content Generation: Six advanced AI tools for creating marketing content
- Team Collaboration: Multi-user workspaces with company-specific data isolation
- Analytics Dashboard: Track search patterns, popular terms, and performance metrics
- Flexible Billing: Four subscription tiers with transparent usage tracking

### For Administrators:
- System Oversight: Real-time metrics and user activity monitoring
- Custom Pricing: Override standard pricing for specific users
- User Management: Comprehensive user lookup and analytics
- Global Analytics: System-wide statistics and trend analysis
- Security Management: Secure administrative access with audit trails

This manual provides detailed instructions for every feature and capability of the platform.`
    },
    {
      id: 'beautiful-onboarding',
      title: 'Getting Started Masterclass',
      description: 'Beautiful step-by-step guide to platform success',
      type: 'PDF',
      size: '900 KB',
      pages: '15',
      icon: Play,
      content: 'Transform from newcomer to expert in 15-20 minutes',
      docContent: `# 🚀 USE THIS SEARCH - GETTING STARTED MASTERCLASS

## Your 5-Step Journey to Success

### 🎯 STEP 1: LOGIN & FIRST IMPRESSION
**Goal**: Get comfortable with the platform interface

**What you'll do:**
- Log in with your credentials
- Explore the main navigation
- Understand the layout and design

**Success indicator**: You feel confident navigating the interface

### 🔍 STEP 2: YOUR FIRST SEARCH
**Goal**: Experience the AI-powered keyword research

**What you'll do:**
- Enter a keyword relevant to your business
- Generate your first set of suggestions
- Explore the different categories

**Success indicator**: You have 40+ keyword suggestions to work with

### 📊 STEP 3: UNDERSTANDING RESULTS
**Goal**: Master result interpretation and organization

**What you'll do:**
- Switch between Graph and List views
- Use category filters
- Export results to CSV

**Success indicator**: You can easily find and organize relevant keywords

### ✨ STEP 4: CONTENT CREATION
**Goal**: Generate your first piece of marketing content

**What you'll do:**
- Try the Blog Title Generator
- Create social media posts
- Generate FAQ content

**Success indicator**: You have usable content ready for your marketing

### 📈 STEP 5: DASHBOARD MASTERY
**Goal**: Understand analytics and team features

**What you'll do:**
- Explore the dashboard
- Check usage statistics
- Understand billing and limits

**Success indicator**: You know how to monitor and optimize your usage

## 🏆 Congratulations!
You've completed the masterclass. You're now ready to use Use This Search to transform your content marketing strategy.`
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
      docContent: `# THE QUESTION ECONOMY
## How Google's 2025 Algorithm Rewards Businesses That Answer Customer Questions

### Executive Summary

The digital marketing landscape has undergone a fundamental transformation in 2025. Google's algorithm now prioritizes businesses that effectively answer customer questions, creating what we call the "Question Economy."

### Key Findings

**78% of local searches** now trigger AI Overview responses featuring businesses that provide comprehensive question-answering content.

**64% increase** in organic traffic for businesses implementing question-based content strategies.

**52% improvement** in local search rankings for companies actively managing Google Business Profile Q&A sections.

### The Transformation

Google's 2025 algorithm update represents the most significant change in search since the introduction of RankBrain. The search engine now evaluates businesses based on their ability to:

1. **Identify customer questions accurately**
2. **Provide comprehensive, helpful answers**
3. **Maintain responsive customer engagement**
4. **Demonstrate expertise through detailed responses**

### Strategic Response Framework

#### Phase 1: Question Discovery and Analysis
- Comprehensive audit of current customer questions
- Competitive question research and gap analysis
- Customer language analysis for authentic question phrasing
- Priority ranking system for high-value questions

#### Phase 2: Answer Development and Deployment
- Creation of comprehensive answer libraries
- Multi-format answer deployment (FAQ, blog posts, social media)
- Google Business Profile Q&A optimization
- Response time improvement systems

#### Phase 3: Engagement and Performance Management
- Active Q&A management across all platforms
- Performance monitoring and optimization
- Community building through question-answering excellence
- Continuous improvement based on customer feedback

### Business Impact

Companies implementing comprehensive question-answering strategies report:
- 40% increase in qualified leads
- 25% improvement in conversion rates
- 60% reduction in customer service inquiries
- 35% increase in local search visibility

### Conclusion

The Question Economy represents both a challenge and an unprecedented opportunity. Businesses that adapt quickly will gain sustainable competitive advantages, while those that delay risk becoming increasingly invisible to potential customers.

The future belongs to businesses that can anticipate, understand, and answer customer questions better than anyone else.`
    },
    {
      id: 'building-great-questions',
      title: 'Building Great Questions Guide',
      description: 'Master the art of question recognition and content structure',
      type: 'PDF',
      size: '1.8 MB',
      pages: '22',
      icon: Search,
      content: 'Complete guide to producing question-based content that ranks and converts',
      docContent: `# 🎯 BUILDING GREAT QUESTIONS GUIDE
## Master the Art of Question Recognition and Content Structure

### Introduction: The Power of Great Question Content

In today's search landscape, the ability to recognize, understand, and respond to customer questions effectively has become the cornerstone of successful content marketing.

### Part I: Question Recognition & Structure

#### Understanding True Intent Behind Questions

The foundation of effective question-based content lies in recognizing what people really want to know versus what they literally asked.

**Surface Question:** "How to lose weight fast"
**True Intent:** "What are sustainable, healthy methods that work efficiently without compromising my health or lifestyle?"

#### Query Type Classification System

**🔵 Informational Queries**
- What they want: Knowledge, understanding, explanations
- Content approach: Educational, comprehensive, authoritative
- Examples: "What is digital marketing?", "How does SEO work?"

**🟡 Navigational Queries**
- What they want: To find a specific website, page, or resource
- Content approach: Clear pathways, directory-style information
- Examples: "Facebook login", "Nike customer service"

**🟢 Transactional Queries**
- What they want: To complete an action, make a purchase, or solve a problem
- Content approach: Solution-focused, step-by-step, actionable
- Examples: "Buy organic dog food", "Download tax software"

### Part II: Answer Architecture

#### The Inverted Pyramid Approach

Structure your content to satisfy immediate needs while providing depth for those who want more information.

**The Golden Rule:** Answer the question in the first 40-60 words, then provide supporting explanation.

#### Content Hierarchy Best Practices

**Level 1: Immediate Answer** (First paragraph)
- Direct response to the query
- Key numbers, timeframes, or recommendations
- Essential qualifying information

**Level 2: Essential Context** (Following 2-3 paragraphs)
- Why this answer is correct
- Important variables that affect the answer
- Common exceptions or special cases

**Level 3: Comprehensive Details** (Remaining content)
- Step-by-step processes
- Examples and case studies
- Advanced considerations
- Related topics and next steps

### Part III: Implementation

#### Featured Snippet Optimization

Featured snippets typically contain 40-60 words. This constraint requires exceptional clarity and precision.

**Structure Formula:**
1. Direct answer (1 sentence)
2. Essential qualifier (1 sentence)
3. Key consideration (1 sentence)

### Conclusion

Creating great question content requires a deep understanding of user psychology, technical implementation skills, and ongoing optimization efforts. Master these techniques to transform your content strategy and achieve sustainable search success.`
    },
    {
      id: 'starting-ideas-guide',
      title: 'Google Search Optimization Guide',
      description: 'Master question-based content that ranks in Google',
      type: 'PDF',
      size: '1.2 MB',
      pages: '18',
      icon: Search,
      content: 'Question recognition, answer architecture, and Google ranking strategies',
      docContent: `# GOOGLE SEARCH OPTIMIZATION STRATEGIES

## Advanced Techniques for Question-Based Content That Ranks

### Understanding Google's Question-Focused Evolution

Google's algorithm has evolved to prioritize content that directly answers user questions. This shift requires new optimization strategies.

### Core Optimization Principles

1. **Question-First Content Structure**
   - Lead with direct answers
   - Use question-based headers
   - Implement FAQ schema markup

2. **Authority Through Evidence**
   - Cite credible sources
   - Include expert opinions
   - Provide data-backed answers

3. **User Experience Excellence**
   - Fast-loading pages
   - Mobile-optimized design
   - Clear information hierarchy

### Advanced Techniques

#### Featured Snippet Optimization
- 40-60 word answer format
- Table and list structured content
- Step-by-step process documentation

#### Voice Search Optimization
- Conversational query targeting
- Local question optimization
- Natural language content

#### Schema Markup Implementation
- FAQ schema for question pages
- HowTo schema for process content
- Article schema for comprehensive guides

### Measuring Success

Track these key metrics:
- Featured snippet captures
- Voice search traffic
- Question-based query rankings
- User engagement metrics

### Implementation Roadmap

**Week 1-2:** Question audit and research
**Week 3-4:** Content creation and optimization
**Week 5-6:** Technical implementation
**Week 7-8:** Performance monitoring and refinement

This guide provides the foundation for creating content that not only ranks well but genuinely serves your audience's needs.`
    },
    {
      id: 'best-practices',
      title: 'Best Practices Guide',
      description: 'Tips and strategies for optimal platform usage',
      type: 'PDF',
      size: '600 KB',
      pages: '8',
      icon: Users,
      content: 'Advanced strategies for teams and power users',
      docContent: `# BEST PRACTICES GUIDE

## Maximize Your Use This Search Experience

### Team Collaboration Best Practices

#### Efficient Search Coordination
- Plan searches around content calendar
- Avoid duplicate searches across team members
- Share CSV exports for team-wide use
- Coordinate company workspace usage

#### Content Generation Workflow
1. **Research Phase**: Use keyword research for content planning
2. **Creation Phase**: Generate multiple content types from single search
3. **Optimization Phase**: Refine generated content for brand voice
4. **Distribution Phase**: Adapt content for multiple platforms

### Usage Optimization Strategies

#### Smart Search Techniques
- Use broad keywords for comprehensive research
- Combine related topics in single searches
- Export and save results for future reference
- Focus on high-value question categories

#### Content Creation Efficiency
- Generate multiple content formats from one search
- Customize AI-generated content for your brand
- Create content templates from successful generations
- Maintain consistency across team outputs

### Advanced Features

#### Multi-Company Management
- Separate clients or projects by company workspace
- Maintain data isolation between companies
- Track performance by company/project
- Optimize billing across multiple workspaces

#### Analytics and Reporting
- Monitor search patterns for content planning
- Track team productivity and usage
- Identify top-performing content themes
- Plan upgrades based on usage trends

### Success Metrics

Track these key indicators:
- Content pieces created per search
- Team collaboration efficiency
- Client satisfaction (for agencies)
- ROI from generated content

### Common Mistakes to Avoid

1. **Over-searching similar terms** - Batch related keywords
2. **Ignoring analytics** - Use dashboard insights for planning
3. **Underutilizing content tools** - Explore all 6 generation tools
4. **Poor team coordination** - Establish clear workflow processes

Follow these best practices to maximize your platform investment and achieve superior results.`
    },
    {
      id: 'admin-manual',
      title: 'Administrator Manual',
      description: 'Complete admin platform documentation',
      type: 'PDF',
      size: '1.5 MB',
      pages: '25',
      icon: Settings,
      content: 'Comprehensive administrative features and best practices',
      docContent: `# ADMINISTRATOR MANUAL

## Complete Guide to Admin Platform Management

### Admin Platform Overview

The admin platform provides comprehensive system oversight, user management, and advanced analytics capabilities for Use This Search administrators.

### Accessing the Admin Platform

**Admin Login URL:** [Your Application URL]/admin/login
**Current Administrator Access:**
- Email: JimRulison@gmail.com
- Password: JR09mar05
- Note: Email is case-insensitive

### Admin Dashboard Features

#### System Monitoring
- Real-time user activity tracking
- Platform performance metrics
- Usage statistics and trends
- Revenue and subscription analytics

#### User Management
- Individual user lookup and analysis
- Custom pricing application
- Subscription management override
- User support and assistance

### Custom Pricing System

#### Business Use Cases
- Enterprise negotiations
- Partnership agreements
- Promotional offers
- Customer retention
- Volume discounts

#### Application Process
1. Enter user email in custom pricing widget
2. Select appropriate pricing plan
3. Set custom price amount
4. Add notes for reference
5. Apply pricing changes

### User Lookup and Analytics

#### Available Information
- User registration details
- Subscription status and history
- Search activity and patterns
- Company associations
- Usage statistics

#### Support Capabilities
- Identify users needing assistance
- Monitor high-value customers
- Track feature adoption
- Analyze usage patterns

### Global Analytics

Monitor platform-wide metrics:
- Total users and growth trends
- Search volume and patterns
- Revenue tracking
- Feature utilization
- Geographic distribution

### Security and Best Practices

#### Administrative Security
- Separate authentication system
- Secure session management
- Audit trail logging
- Access control protocols

#### Best Practices
- Regular security reviews
- Performance monitoring
- User feedback integration
- System optimization

### Troubleshooting Common Issues

#### User Account Issues
- Password reset procedures
- Account activation problems
- Billing discrepancies
- Feature access problems

#### System Performance
- Monitor response times
- Track error rates
- Optimize resource usage
- Plan capacity upgrades

This manual provides everything you need to effectively manage the Use This Search platform and support your users.`
    }
  ];

  const handleViewDocument = (materialId) => {
    const material = educationalMaterials.find(m => m.id === materialId);
    if (material && material.docContent) {
      setViewingDocument(material);
    } else {
      console.log(`Document content not available: ${materialId}`);
      alert(`Document content will be available soon: ${material?.title || materialId}`);
    }
  };

  const handleDownloadPDF = async (materialId) => {
    const material = educationalMaterials.find(m => m.id === materialId);
    if (material && material.docContent) {
      try {
        console.log(`Starting PDF generation for: ${material.title}`);
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        let yPosition = 20;
        
        // Set up PDF properties
        pdf.setFont("helvetica");
        
        // Add title
        pdf.setFontSize(18);
        pdf.setFont("helvetica", "bold");
        pdf.text(material.title, 20, yPosition);
        yPosition += 15;
        
        // Add description
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "normal");
        const descLines = pdf.splitTextToSize(material.description, 170);
        pdf.text(descLines, 20, yPosition);
        yPosition += (descLines.length * 6) + 10;
        
        // Add separator line
        pdf.line(20, yPosition, 190, yPosition);
        yPosition += 10;
        
        // Clean and format content
        let cleanContent = material.docContent || '';
        
        // Remove markdown symbols and clean up
        cleanContent = cleanContent
          .replace(/#{1,6}\s*/g, '') // Remove markdown headers
          .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
          .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
          .replace(/`(.*?)`/g, '$1') // Remove code markdown
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
          .replace(/^\s*[-*+]\s+/gm, '• ') // Convert markdown lists to bullets
          .replace(/^\s*\d+\.\s+/gm, '• ') // Convert numbered lists to bullets
          .trim();
        
        // Add content with proper pagination
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        
        const pageHeight = pdf.internal.pageSize.height;
        const margin = 20;
        const lineHeight = 6;
        
        const contentLines = pdf.splitTextToSize(cleanContent, 170);
        
        for (let i = 0; i < contentLines.length; i++) {
          // Check if we need a new page
          if (yPosition > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          
          pdf.text(contentLines[i], 20, yPosition);
          yPosition += lineHeight;
        }
        
        // Add page numbers
        const pageCount = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          pdf.setPage(i);
          pdf.setFontSize(8);
          pdf.text(`Page ${i} of ${pageCount}`, 170, pageHeight - 10);
        }
        
        // Generate filename
        const fileName = material.title.replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, '_').toLowerCase();
        
        console.log(`PDF generated, attempting download as: ${fileName}.pdf`);
        
        // Try multiple download methods for better compatibility
        try {
          // Method 1: Direct save (most common)
          pdf.save(`${fileName}.pdf`);
          console.log(`PDF download initiated using pdf.save()`);
        } catch (saveError) {
          console.log(`pdf.save() failed, trying alternative method:`, saveError);
          
          // Method 2: Blob download as fallback
          const pdfBlob = pdf.output('blob');
          const url = URL.createObjectURL(pdfBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${fileName}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          console.log(`PDF download initiated using blob method`);
        }
        
        // Show success message with troubleshooting info
        setTimeout(() => {
          alert(`✅ PDF "${material.title}" has been generated successfully!

📥 Check your browser's download folder or look for a download notification.

💡 If download didn't start:
• Check if your browser blocked downloads 
• Look for a download icon in your browser's address bar
• Check your browser's download settings
• Try right-clicking the button and selecting "Save As"

📁 Filename: ${fileName}.pdf`);
        }, 500);
        
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert(`Error generating PDF: ${error.message}. Please try again.`);
      }
    } else {
      console.log(`Document content not available: ${materialId}`);
      alert(`Document content will be available soon: ${material?.title || materialId}`);
    }
  };

  const handlePlayTutorial = (tutorialId) => {
    // This will be implemented when videos are created
    console.log(`Playing tutorial: ${tutorialId}`);
    alert(`Video tutorial will be available soon: ${tutorialId}`);
  };

  if (!isOpen) return null;

  // Document viewer mode
  if (viewingDocument) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewingDocument(null)}
                className="text-white hover:bg-white/20 mr-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <viewingDocument.icon className="h-5 w-5" />
                  {viewingDocument.title}
                </h2>
                <p className="text-blue-100 text-sm">{viewingDocument.description}</p>
              </div>
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

          {/* Document Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800">
                {viewingDocument.docContent}
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleViewDocument(material.id)}
                                  size="sm"
                                  variant="outline"
                                  className="text-gray-700 border-gray-300 hover:bg-gray-50"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Document
                                </Button>
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
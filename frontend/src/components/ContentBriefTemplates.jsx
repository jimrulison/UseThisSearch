import React, { useState } from 'react';
import { FileText, Loader2, Copy, Check, Wand2, Target, User, Clock, BarChart } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const ContentBriefTemplates = ({ searchTerm, onError }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [contentBriefs, setContentBriefs] = useState({});
  const [copiedBrief, setCopiedBrief] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const generateContentBriefs = async () => {
    if (!searchTerm || isGenerating) return;
    
    setIsGenerating(true);
    
    try {
      // Generate different types of content briefs
      const generatedBriefs = {
        blog: {
          title: `Complete Content Brief: ${searchTerm} Guide`,
          content: `# Content Brief: The Ultimate ${searchTerm} Guide

## Project Overview
**Content Type:** Blog Post/Article
**Target Keyword:** ${searchTerm}
**Estimated Length:** 2,000-3,000 words
**Due Date:** [Insert deadline]

## Objective
Create a comprehensive, authoritative guide on ${searchTerm} that serves as the go-to resource for our target audience, drives organic traffic, and establishes thought leadership.

## Target Audience
**Primary:** Professionals and enthusiasts interested in ${searchTerm}
**Secondary:** Beginners seeking foundational knowledge
**Pain Points:** Lack of clear guidance, overwhelming information, need for practical advice

## Key Messages
1. ${searchTerm} is essential for modern success
2. With the right approach, anyone can master ${searchTerm}
3. Our expertise provides unique insights and practical solutions

## Content Structure
### Introduction (200-300 words)
- Hook: Compelling statistic or question about ${searchTerm}
- Problem statement: Why ${searchTerm} matters now
- Preview: What readers will learn

### Main Content Sections:
1. **What is ${searchTerm}?** (400-500 words)
2. **Why ${searchTerm} Matters in 2025** (400-500 words)
3. **Step-by-Step ${searchTerm} Implementation** (600-800 words)
4. **Common ${searchTerm} Mistakes to Avoid** (300-400 words)
5. **Advanced ${searchTerm} Strategies** (400-500 words)
6. **Tools and Resources for ${searchTerm}** (300-400 words)

### Conclusion (200-300 words)
- Recap key points
- Call-to-action
- Next steps for readers

## SEO Requirements
- **Primary Keyword:** ${searchTerm} (use 8-12 times naturally)
- **Secondary Keywords:** [research related terms]
- **Meta Description:** 155 characters max
- **H1:** Include primary keyword
- **H2/H3:** Use variations and related terms
- **Internal Links:** Link to 3-5 relevant internal pages
- **External Links:** 2-3 authoritative sources

## Visual Elements
- Hero image related to ${searchTerm}
- 2-3 supporting images or infographics
- Screenshots or examples where relevant
- Alt text for all images including keywords

## Success Metrics
- Organic traffic increase: 25%
- Time on page: 3+ minutes
- Social shares: 50+ across platforms
- Backlinks: 5+ within first month

## Research Requirements
- Interview 1-2 industry experts
- Include recent statistics (2024-2025)
- Reference 5+ authoritative sources
- Competitor analysis of top 3 ranking pages

## Brand Voice & Style
- Professional yet approachable
- Data-driven with practical examples
- Helpful and educational tone
- Include actionable takeaways

## Call-to-Action
- Primary: [Download our ${searchTerm} checklist]
- Secondary: [Schedule a consultation]
- Social: [Share this guide]`
        },
        video: {
          title: `Video Content Brief: ${searchTerm} Explained`,
          content: `# Video Content Brief: ${searchTerm} Made Simple

## Video Overview
**Format:** Educational/Explainer Video
**Platform:** YouTube (primary), Social Media (repurposed)
**Duration:** 8-12 minutes
**Style:** Talking head with screen shares/graphics

## Objective
Create an engaging video that explains ${searchTerm} concepts clearly, drives channel subscriptions, and positions us as industry experts.

## Target Audience
- Professionals seeking quick, actionable insights
- Visual learners who prefer video content
- Busy individuals wanting efficient information consumption

## Video Structure

### Hook (0-15 seconds)
"Did you know that 90% of people get ${searchTerm} completely wrong? In the next 10 minutes, I'll show you exactly how to master it."

### Introduction (15-45 seconds)
- Welcome viewers
- Preview what they'll learn
- Ask for likes/subscribes

### Main Content (2-9 minutes)
1. **${searchTerm} Basics** (90 seconds)
2. **Common Mistakes** (2 minutes)
3. **Step-by-Step Process** (3 minutes)
4. **Pro Tips** (90 seconds)
5. **Tools & Resources** (90 seconds)

### Conclusion (30-60 seconds)
- Recap key points
- Call-to-action
- Next video preview

## Visual Elements
- Branded intro/outro
- Lower thirds for key points
- Screen recordings of tools/examples
- B-roll footage where relevant
- Animated graphics for statistics

## Script Notes
- Conversational, energetic tone
- Include personal anecdotes
- Ask rhetorical questions
- Use "you" to address viewer directly
- Include specific examples

## SEO Optimization
- **Title:** How to Master ${searchTerm} (Step-by-Step Guide)
- **Description:** Include keywords naturally
- **Tags:** ${searchTerm}, related terms, industry keywords
- **Thumbnail:** Eye-catching with ${searchTerm} text overlay
- **Custom thumbnail A/B test planned

## Promotion Strategy
- Share across all social platforms
- Email newsletter feature
- Blog post embed
- Community forum sharing
- Influencer outreach for shares

## Success Metrics
- Views: 10,000+ in first month
- Watch time: 60%+ average
- Engagement rate: 8%+ (likes, comments, shares)
- Subscribers: 100+ from this video
- Click-through rate: 5%+`
        },
        social: {
          title: `Social Media Campaign Brief: ${searchTerm}`,
          content: `# Social Media Campaign Brief: ${searchTerm} Awareness

## Campaign Overview
**Campaign Name:** ${searchTerm} Mastery Series
**Duration:** 4 weeks
**Platforms:** LinkedIn, Twitter, Instagram, Facebook
**Objective:** Increase brand awareness and drive website traffic

## Campaign Objectives
- **Primary:** Generate 10,000 impressions across platforms
- **Secondary:** Drive 500 website visits
- **Tertiary:** Gain 100 new followers

## Target Audience
**Demographics:**
- Age: 25-45
- Profession: Marketing, Business, Tech
- Income: $50k-$150k
- Education: College+

**Interests:**
- Professional development
- Industry trends
- Business growth
- ${searchTerm} related topics

## Content Pillars
1. **Educational (40%)** - Tips, tutorials, insights
2. **Inspirational (30%)** - Success stories, motivation
3. **Behind-the-scenes (20%)** - Process, team, culture
4. **Promotional (10%)** - Products, services, CTAs

## Weekly Content Schedule

### Week 1: ${searchTerm} Fundamentals
- **Monday:** What is ${searchTerm}? (Educational post)
- **Wednesday:** ${searchTerm} success story (Inspirational)
- **Friday:** Behind the scenes: Our ${searchTerm} process

### Week 2: ${searchTerm} Implementation
- **Monday:** Step-by-step ${searchTerm} guide (Educational)
- **Wednesday:** Common ${searchTerm} mistakes (Educational)
- **Friday:** Team spotlight: ${searchTerm} expert

### Week 3: ${searchTerm} Advanced Strategies
- **Monday:** Advanced ${searchTerm} techniques (Educational)
- **Wednesday:** ${searchTerm} case study (Inspirational)
- **Friday:** Tools we use for ${searchTerm}

### Week 4: ${searchTerm} Future & CTA
- **Monday:** Future of ${searchTerm} (Educational)
- **Wednesday:** Your ${searchTerm} journey starts now (Inspirational)
- **Friday:** Free ${searchTerm} resource offer (Promotional)

## Content Formats by Platform

### LinkedIn
- Professional insights
- Industry statistics
- Thought leadership articles
- Company updates

### Twitter
- Quick tips
- Industry news commentary
- Thread series
- Poll engagement

### Instagram
- Visual quotes
- Behind-the-scenes stories
- Carousel educational posts
- IGTV tutorials

### Facebook
- Community discussions
- Live videos
- Event promotions
- User-generated content

## Hashtag Strategy
**Primary Tags:** #${searchTerm.replace(/\s+/g, '')} #BusinessGrowth #MarketingTips
**Secondary Tags:** #Professional Development #Industry Insights
**Platform-specific:** Research trending tags weekly

## Visual Guidelines
- Brand colors: [Insert brand colors]
- Fonts: [Insert brand fonts]
- Logo placement: Bottom right corner
- Image dimensions: Platform-optimized
- Video specs: 1080x1080 for feed, 1080x1920 for stories

## Engagement Strategy
- Respond to comments within 2 hours
- Like and reply to relevant industry posts
- Share user-generated content
- Host live Q&A sessions
- Create polls and ask questions

## Paid Promotion Budget
- Total Budget: $500
- Platform Distribution: 50% LinkedIn, 30% Facebook, 20% Instagram
- Targeting: Look-alike audiences based on website visitors
- A/B test ad creative and copy

## Success Metrics & KPIs
**Reach & Awareness:**
- Total impressions: 10,000+
- Reach: 7,500+ unique users
- Brand mention increase: 25%

**Engagement:**
- Engagement rate: 5%+
- Comments: 200+
- Shares: 100+
- Saves: 150+

**Conversion:**
- Website traffic: 500+ visits
- Lead generation: 50+ email signups
- Demo requests: 10+

## Reporting Schedule
- Daily: Monitor comments and engagement
- Weekly: Compile performance metrics
- Monthly: Comprehensive campaign analysis

## Content Creation Timeline
- **Week -2:** Content planning and approval
- **Week -1:** Content creation and scheduling
- **Week 1-4:** Campaign execution and optimization
- **Week 5:** Analysis and reporting`
        }
      };
      
      setContentBriefs(generatedBriefs);
      setIsVisible(true);
      
    } catch (error) {
      console.error('Error generating content briefs:', error);
      
      // Fallback brief
      const fallbackBriefs = {
        blog: {
          title: `Content Brief: ${searchTerm}`,
          content: `# Content Brief: ${searchTerm}\n\nObjective: Create comprehensive content about ${searchTerm}\nTarget Audience: Professionals interested in ${searchTerm}\nKey Points to Cover:\n- What is ${searchTerm}\n- Why it matters\n- How to implement\n- Best practices\n\nSEO Keywords: ${searchTerm} and related terms\nLength: 1,500-2,000 words`
        }
      };
      
      setContentBriefs(fallbackBriefs);
      setIsVisible(true);
      
      if (onError) {
        onError('Content briefs generated using fallback method');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const copyBrief = async (brief, type) => {
    try {
      await navigator.clipboard.writeText(brief.content);
      setCopiedBrief(type);
      setTimeout(() => setCopiedBrief(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getBriefIcon = (type) => {
    const icons = {
      blog: FileText,
      video: BarChart,
      social: User
    };
    return icons[type] || FileText;
  };

  const getBriefColor = (type) => {
    const colors = {
      blog: 'text-indigo-600',
      video: 'text-red-600',
      social: 'text-blue-600'
    };
    return colors[type] || 'text-indigo-600';
  };

  if (!isVisible && Object.keys(contentBriefs).length === 0) {
    return (
      <div className="mt-4">
        <Button
          onClick={generateContentBriefs}
          disabled={isGenerating || !searchTerm}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold transition-all duration-300 transform hover:scale-105"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Content Briefs...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              🎯 Generate Content Brief Templates
            </>
          )}
        </Button>
      </div>
    );
  }

  if (!isVisible) return null;

  return (
    <Card className="mt-6 border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-purple-50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Target className="h-5 w-5 text-indigo-600" />
            Content Brief Templates
            <Badge className="bg-indigo-600 text-white">
              🎯 New Feature
            </Badge>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </Button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Professional content briefs for "<strong>{searchTerm}</strong>" - ready to send to writers and creators
        </p>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue={Object.keys(contentBriefs)[0]} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {Object.keys(contentBriefs).map((type) => {
              const Icon = getBriefIcon(type);
              return (
                <TabsTrigger key={type} value={type} className="flex items-center gap-1 capitalize">
                  <Icon className={`h-4 w-4 ${getBriefColor(type)}`} />
                  {type === 'blog' ? 'Blog Post' : type === 'video' ? 'Video' : 'Social Media'}
                </TabsTrigger>
              );
            })}
          </TabsList>
          
          {Object.entries(contentBriefs).map(([type, brief]) => (
            <TabsContent key={type} value={type} className="mt-4">
              <div className="bg-white rounded-lg border-2 border-indigo-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {brief.title}
                  </h3>
                  <Button
                    onClick={() => copyBrief(brief, type)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {copiedBrief === type ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Brief
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">
                    {brief.content}
                  </pre>
                </div>
                
                <div className="mt-4 text-xs text-gray-500">
                  <strong>Word count:</strong> {brief.content.split(' ').length} words •{' '}
                  <strong>Estimated reading time:</strong> {Math.ceil(brief.content.split(' ').length / 200)} minutes
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
        
        <div className="mt-6 p-4 bg-indigo-100 rounded-lg border border-indigo-200">
          <div className="flex items-start gap-3">
            <Target className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-indigo-800 mb-2">Content Brief Tips:</h4>
              <ul className="text-sm text-indigo-700 space-y-1">
                <li>• <strong>Customize details:</strong> Add specific deadlines, budgets, and requirements</li>
                <li>• <strong>Include examples:</strong> Attach reference materials and competitor analysis</li>
                <li>• <strong>Set clear expectations:</strong> Define success metrics and deliverables</li>
                <li>• <strong>Provide context:</strong> Explain brand voice, audience, and business goals</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-center">
          <Button
            onClick={generateContentBriefs}
            disabled={isGenerating}
            variant="outline"
            className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate New Briefs
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentBriefTemplates;
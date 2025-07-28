import React, { useState } from 'react';
import { BookOpen, CheckCircle, XCircle, Lightbulb, Target, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';

const ContentGuide = ({ searchTerm, results }) => {
  const [selectedGuide, setSelectedGuide] = useState('questions');

  // Helper function to get questions from results
  const getQuestionsData = () => {
    if (!results || !results.questions) return [];
    return results.questions.map(q => ({
      text: typeof q === 'object' ? q.text : q,
      popularity: typeof q === 'object' ? q.popularity : 'MEDIUM'
    }));
  };

  // Helper function to get other category data
  const getCategoryData = (category) => {
    if (!results || !results[category]) return [];
    return results[category].map(item => ({
      text: typeof item === 'object' ? item.text : item,
      popularity: typeof item === 'object' ? item.popularity : 'MEDIUM'
    }));
  };

  const guideContent = {
    questions: {
      title: "Question-Based Keywords Guide",
      icon: "❓",
      description: "Master the art of question-based content that directly answers what your audience is searching for.",
      sections: {
        whatToLookFor: {
          title: "What to Look For",
          items: [
            "Long-tail questions with clear search intent (how to, what is, why does)",
            "Questions that indicate buyer readiness (how much does, which is better)",
            "Pain point questions that show urgent needs (how to fix, what causes)",
            "Comparison questions showing evaluation phase (vs, compared to, difference between)",
            "High-volume question patterns in your industry"
          ]
        },
        howToProduce: {
          title: "How to Produce Great Question Content",
          items: [
            "Start with a compelling hook that acknowledges the question directly",
            "Provide a quick answer upfront, then dive into details (featured snippet strategy)",
            "Use subheadings that mirror related questions people ask",
            "Include step-by-step instructions for 'how-to' questions",
            "Add FAQs section addressing follow-up questions",
            "Use bullet points and numbered lists for scannable answers"
          ]
        },
        keyStrengths: {
          title: "Key Things to Look For (Strengths)",
          items: [
            "Questions with commercial intent keywords (buy, best, review, price)",
            "Local intent questions (near me, in [city], local)",
            "Seasonal or trending question patterns",
            "Questions that complement your existing content strategy",
            "Voice search friendly natural language questions",
            "Questions that indicate different funnel stages"
          ]
        },
        stayAwayFrom: {
          title: "Key Things to Stay Away From",
          items: [
            "Overly broad questions with no clear intent (what is life)",
            "Questions outside your expertise or industry focus",
            "Extremely competitive questions dominated by major brands",
            "Questions with outdated or declining search trends",
            "Questions that require medical, legal, or financial advice (YMYL topics)",
            "Questions with no clear monetization potential"
          ]
        }
      }
    },
    prepositions: {
      title: "Preposition-Based Keywords Guide", 
      icon: "🔗",
      description: "Leverage preposition keywords to capture specific search intents and contextual queries.",
      sections: {
        whatToLookFor: {
          title: "What to Look For",
          items: [
            "Prepositions indicating specific use cases (for beginners, for business)",
            "Location-based prepositions (near, in, around, close to)",
            "Tool/method combinations (with Excel, using Python, through automation)",
            "Exclusion terms showing specific needs (without experience, without budget)",
            "Relationship prepositions (vs, compared to, instead of)"
          ]
        },
        howToProduce: {
          title: "How to Produce Preposition Content",
          items: [
            "Create targeted landing pages for each preposition variation",
            "Develop beginner-friendly content for 'for beginners' keywords",
            "Build location-specific pages for geographical prepositions",
            "Create tool-specific tutorials for 'with [tool]' keywords",
            "Write alternative solution content for 'instead of' keywords",
            "Optimize for local SEO when location prepositions are involved"
          ]
        },
        keyStrengths: {
          title: "Key Things to Look For (Strengths)",
          items: [
            "High commercial intent prepositions (for sale, to buy, for hire)",
            "Specific audience segments (for small business, for students)",
            "Tool integrations your audience uses (with Slack, using WordPress)",
            "Budget-conscious terms (without cost, for free, on budget)",
            "Experience level indicators (for experts, for intermediates)",
            "Time-sensitive prepositions (before, after, during)"
          ]
        },
        stayAwayFrom: {
          title: "Key Things to Stay Away From",
          items: [
            "Prepositions with unclear or vague intent",
            "Overly technical combinations beyond your expertise",
            "Prepositions targeting audiences you don't serve",
            "Location terms outside your service area",
            "Tool combinations you can't properly support or recommend",
            "Prepositions leading to thin or duplicate content"
          ]
        }
      }
    },
    comparisons: {
      title: "Comparison Keywords Guide",
      icon: "⚖️", 
      description: "Dominate comparison searches by helping users make informed decisions between options.",
      sections: {
        whatToLookFor: {
          title: "What to Look For",
          items: [
            "Direct competitor comparisons (your brand vs competitor)",
            "Product category comparisons (type A vs type B)",
            "Method comparisons (manual vs automated)",
            "Price point comparisons (premium vs budget)",
            "Feature-based comparisons (basic vs advanced)"
          ]
        },
        howToProduce: {
          title: "How to Produce Comparison Content",
          items: [
            "Create detailed comparison tables with key features",
            "Provide unbiased analysis highlighting pros and cons",
            "Include real user testimonials and case studies",
            "Add visual comparisons with charts and infographics",
            "Conclude with clear recommendations for different use cases",
            "Update regularly as products and services evolve"
          ]
        },
        keyStrengths: {
          title: "Key Things to Look For (Strengths)",
          items: [
            "High-intent comparison searches indicating purchase readiness",
            "Comparisons where you have a competitive advantage",
            "Alternative searches for expensive solutions",
            "Comparisons in growing or trending markets",
            "B2B comparisons with longer sales cycles",
            "Comparisons that showcase your unique value proposition"
          ]
        },
        stayAwayFrom: {
          title: "Key Things to Stay Away From",
          items: [
            "Comparisons heavily favoring competitors you can't compete with",
            "Biased comparisons that appear promotional rather than helpful",
            "Comparisons between products/services you don't understand well",
            "Outdated comparisons with discontinued products",
            "Comparisons that create conflicts with your partnerships",
            "Comparison topics outside your target market's interest"
          ]
        }
      }
    },
    alphabetical: {
      title: "Alphabetical Keywords Guide",
      icon: "🔤",
      description: "Discover long-tail opportunities and niche keywords through systematic alphabetical exploration.",
      sections: {
        whatToLookFor: {
          title: "What to Look For",
          items: [
            "Long-tail keyword opportunities with less competition",
            "Niche terms specific to your industry vertical",
            "Brand name combinations and product-specific terms",
            "Geographic variations and local market terms",
            "Technical terms and jargon your audience uses"
          ]
        },
        howToProduce: {
          title: "How to Produce Alphabetical Content",
          items: [
            "Group related alphabetical terms into comprehensive topic clusters",
            "Create glossary-style content for technical alphabetical terms", 
            "Develop location-specific content for geographic alphabetical keywords",
            "Build product comparison pages for brand-related alphabetical terms",
            "Write detailed guides for niche alphabetical opportunities",
            "Use alphabetical terms to identify content gaps in your strategy"
          ]
        },
        keyStrengths: {
          title: "Key Things to Look For (Strengths)",
          items: [
            "Low competition long-tail opportunities",
            "Specific product model numbers and variations",
            "Industry-specific terminology and acronyms",
            "Emerging trends and new terminology",
            "Local business names and geographic variations",
            "Technical specifications and detailed feature searches"
          ]
        },
        stayAwayFrom: {
          title: "Key Things to Stay Away From",
          items: [
            "Random letter combinations without clear search intent",
            "Alphabetical terms with extremely low search volume",
            "Trademarked terms you cannot legally target",
            "Alphabetical keywords outside your expertise area",
            "Overly technical terms your audience won't understand",
            "Alphabetical keywords that lead to thin content pages"
          ]
        }
      }
    }
  };

  const currentGuide = guideContent[selectedGuide];

  return (
    <div className="space-y-6">
      {/* Category Selection */}
      <div className="flex justify-center">
        <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-lg">
          {Object.entries(guideContent).map(([key, guide]) => (
            <button
              key={key}
              onClick={() => setSelectedGuide(key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                selectedGuide === key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {guide.icon} {guide.title.split(' Keywords')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Current Guide Content */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-2xl">
              {currentGuide.icon}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            {currentGuide.title}
          </CardTitle>
          <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
            {currentGuide.description}
          </p>
          {searchTerm && (
            <Badge className="mt-3 bg-blue-100 text-blue-800">
              Applied to: "{searchTerm}"
            </Badge>
          )}
        </CardHeader>

        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* What to Look For */}
            <Card className="border border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                  <Target className="h-5 w-5" />
                  {currentGuide.sections.whatToLookFor.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {currentGuide.sections.whatToLookFor.items.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-green-700">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* How to Produce */}
            <Card className="border border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                  <Lightbulb className="h-5 w-5" />
                  {currentGuide.sections.howToProduce.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {currentGuide.sections.howToProduce.items.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-blue-700">
                      <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Key Strengths */}
            <Card className="border border-purple-200 bg-purple-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-purple-800">
                  <CheckCircle className="h-5 w-5" />
                  {currentGuide.sections.keyStrengths.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {currentGuide.sections.keyStrengths.items.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-purple-700">
                      <CheckCircle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Things to Avoid */}
            <Card className="border border-red-200 bg-red-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-5 w-5" />
                  {currentGuide.sections.stayAwayFrom.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {currentGuide.sections.stayAwayFrom.items.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-red-700">
                      <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Expert Tips Section */}
          <Separator className="my-6" />
          
          <Card className="border border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-yellow-800">
                <BookOpen className="h-5 w-5" />
                Expert Tips for {currentGuide.title.split(' Keywords')[0]} Keywords
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-yellow-800">
                <div>
                  <h4 className="font-semibold mb-2">✅ Best Practices:</h4>
                  <ul className="space-y-1 text-yellow-700">
                    <li>• Research competitor content gaps</li>
                    <li>• Focus on search intent over volume</li>
                    <li>• Create content clusters, not individual pages</li>
                    <li>• Update and refresh content regularly</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">⚠️ Common Mistakes:</h4>
                  <ul className="space-y-1 text-yellow-700">
                    <li>• Keyword stuffing in content</li>
                    <li>• Ignoring user experience for SEO</li>
                    <li>• Creating thin, low-value content</li>
                    <li>• Not measuring and optimizing performance</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <div className="mt-6 text-center p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white">
            <h3 className="font-bold text-lg mb-2">Ready to Create High-Converting Content?</h3>
            <p className="text-blue-100 mb-3">
              Use the insights above with your {searchTerm ? `"${searchTerm}"` : 'keyword'} research to create content that ranks and converts.
            </p>
            <div className="text-sm text-blue-100">
              💡 Pro tip: Combine multiple keyword types for comprehensive content that captures all search intents
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentGuide;
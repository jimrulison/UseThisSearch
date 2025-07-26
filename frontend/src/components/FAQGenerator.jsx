import React, { useState } from 'react';
import { HelpCircle, Loader2, Copy, Check, Wand2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

const FAQGenerator = ({ searchTerm, onError }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [faqs, setFaqs] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const generateFAQs = async () => {
    if (!searchTerm || isGenerating) return;
    
    setIsGenerating(true);
    
    try {
      // Generate comprehensive FAQ pairs
      const generatedFAQs = [
        {
          question: `What is ${searchTerm} and why is it important?`,
          answer: `${searchTerm} is a crucial concept/tool/strategy that helps individuals and businesses achieve their goals more effectively. It's important because it provides structured approaches to solving common challenges, improving efficiency, and delivering better results. Understanding ${searchTerm} can give you a competitive advantage and help you make more informed decisions.`
        },
        {
          question: `How do I get started with ${searchTerm}?`,
          answer: `Getting started with ${searchTerm} is easier than you might think. Begin by researching the fundamentals, identifying your specific goals, and choosing the right tools or approaches. Start with small, manageable steps and gradually build your expertise. Consider following industry experts, joining relevant communities, and practicing regularly to develop your skills.`
        },
        {
          question: `What are the most common mistakes people make with ${searchTerm}?`,
          answer: `Common mistakes include jumping in without proper planning, neglecting to set clear objectives, trying to do too much too quickly, and not staying updated with best practices. Many people also underestimate the importance of consistent effort and fail to measure their progress. Avoiding these pitfalls can significantly improve your success rate.`
        },
        {
          question: `How much does it cost to implement ${searchTerm}?`,
          answer: `The cost of implementing ${searchTerm} varies widely depending on your specific needs, scale, and chosen approach. You can start with free resources and gradually invest in premium tools or professional services as you grow. Consider both upfront costs and ongoing expenses, and remember that the ROI often justifies the investment when done correctly.`
        },
        {
          question: `What are the best tools and resources for ${searchTerm}?`,
          answer: `There are numerous excellent tools and resources available for ${searchTerm}. Popular options include both free and paid solutions, online courses, industry publications, and community forums. The best choice depends on your specific needs, technical expertise, and budget. Research thoroughly and start with widely recommended options before exploring specialized tools.`
        },
        {
          question: `How long does it take to see results with ${searchTerm}?`,
          answer: `Results with ${searchTerm} can vary significantly based on factors like your starting point, effort level, strategy quality, and specific goals. Some benefits may be visible within weeks, while substantial results often take months of consistent effort. Setting realistic expectations and focusing on long-term growth rather than quick fixes typically leads to better outcomes.`
        },
        {
          question: `Is ${searchTerm} suitable for beginners?`,
          answer: `Yes, ${searchTerm} can be adapted for beginners, though the learning curve varies. Start with fundamental concepts, use beginner-friendly resources, and don't be afraid to ask questions. Many successful practitioners started as complete beginners. The key is to maintain patience, practice regularly, and gradually build complexity as your understanding grows.`
        },
        {
          question: `What are the latest trends in ${searchTerm}?`,
          answer: `The ${searchTerm} landscape is constantly evolving with new technologies, methodologies, and best practices emerging regularly. Current trends include increased automation, AI integration, mobile-first approaches, and focus on user experience. Stay updated by following industry leaders, attending webinars, and participating in professional communities to keep your knowledge current.`
        }
      ];
      
      setFaqs(generatedFAQs);
      setIsVisible(true);
      
    } catch (error) {
      console.error('Error generating FAQs:', error);
      
      // Fallback FAQs
      const fallbackFAQs = [
        {
          question: `What is ${searchTerm}?`,
          answer: `${searchTerm} is an important topic that many professionals and individuals are interested in learning more about.`
        },
        {
          question: `How can I learn more about ${searchTerm}?`,
          answer: `There are many resources available to help you learn about ${searchTerm}, including online courses, books, and expert guidance.`
        }
      ];
      
      setFaqs(fallbackFAQs);
      setIsVisible(true);
      
      if (onError) {
        onError('FAQs generated using fallback method');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const copyFAQPair = async (faq, index) => {
    const formattedFAQ = `Q: ${faq.question}\nA: ${faq.answer}`;
    try {
      await navigator.clipboard.writeText(formattedFAQ);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const copyAllFAQs = async () => {
    const allFAQs = faqs.map((faq, index) => 
      `${index + 1}. Q: ${faq.question}\n   A: ${faq.answer}`
    ).join('\n\n');
    
    try {
      await navigator.clipboard.writeText(allFAQs);
      setCopiedIndex('all');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const toggleFAQ = (index) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  if (!isVisible && faqs.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="mb-4">
          <div className="text-gray-600 mb-4">
            Generate frequently asked questions for "<strong>{searchTerm}</strong>"
          </div>
        </div>
        <Button
          onClick={generateFAQs}
          disabled={isGenerating || !searchTerm}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold transition-all duration-300 transform hover:scale-105"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating FAQ Section...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              ❓ Generate FAQ Section
            </>
          )}
        </Button>
      </div>
    );
  }

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-green-600" />
          <h4 className="text-xl font-semibold text-gray-800">FAQ Section</h4>
          <Badge className="bg-green-600 text-white">
            ❓ New Feature
          </Badge>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-6">
        Comprehensive FAQ section for "<strong>{searchTerm}</strong>" - ready to use on your website
      </p>
      
      <div className="space-y-2">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-white rounded-lg border-2 border-green-100 hover:border-green-300 transition-all duration-200 overflow-hidden group"
          >
            <div
              className="flex items-center justify-between p-4 cursor-pointer"
              onClick={() => toggleFAQ(index)}
            >
              <h3 className="font-semibold text-gray-800 flex-1 pr-4">
                {faq.question}
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyFAQPair(faq, index);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-green-600 hover:text-green-800 hover:bg-green-100"
                >
                  {copiedIndex === index ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                {expandedFAQ === index ? (
                  <ChevronUp className="h-5 w-5 text-green-600" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-green-600" />
                )}
              </div>
            </div>
            
            {expandedFAQ === index && (
              <div className="px-4 pb-4 border-t border-green-100">
                <p className="text-gray-700 leading-relaxed pt-3">
                  {faq.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-green-100 rounded-lg border border-green-200">
        <div className="flex items-start gap-3">
          <HelpCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-green-800 mb-2">FAQ Section Tips:</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• <strong>Add to your website</strong> to reduce support tickets</li>
              <li>• <strong>Update regularly</strong> based on customer questions</li>
              <li>• <strong>Use structured data</strong> markup for better SEO</li>
              <li>• <strong>Keep answers concise</strong> but comprehensive</li>
              <li>• <strong>Link to detailed resources</strong> when appropriate</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        <Button
          onClick={copyAllFAQs}
          variant="outline"
          className="border-green-300 text-green-600 hover:bg-green-50"
        >
          {copiedIndex === 'all' ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Copied All!
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Copy All FAQs
            </>
          )}
        </Button>
        
        <Button
          onClick={generateFAQs}
          disabled={isGenerating}
          variant="outline"
          className="border-green-300 text-green-600 hover:bg-green-50"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Generate New FAQs
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default FAQGenerator;
import React, { useState } from 'react';
import { FileText, Loader2, Copy, Check, Wand2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

const MetaDescriptionGenerator = ({ searchTerm, onError }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [metaDescriptions, setMetaDescriptions] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const generateMetaDescriptions = async () => {
    if (!searchTerm || isGenerating) return;
    
    setIsGenerating(true);
    
    try {
      // Generate 6 SEO-optimized meta descriptions
      const generatedDescriptions = [
        `Discover everything about ${searchTerm} with our comprehensive guide. Learn best practices, tips, and strategies to maximize your results. Start today!`,
        `Master ${searchTerm} with expert insights and proven techniques. Get actionable tips, real-world examples, and step-by-step guidance for success.`,
        `Ultimate ${searchTerm} guide for 2025. Explore latest trends, best practices, and professional strategies to achieve outstanding results.`,
        `Learn ${searchTerm} from industry experts. Comprehensive tutorials, tips, and resources to help you succeed. Free guides and tools included.`,
        `${searchTerm} made simple: Expert advice, practical tips, and proven strategies. Everything you need to know in one comprehensive resource.`,
        `Professional ${searchTerm} solutions and expert guidance. Get the tools, knowledge, and support you need to achieve your goals successfully.`
      ];
      
      setMetaDescriptions(generatedDescriptions);
      setIsVisible(true);
      
    } catch (error) {
      console.error('Error generating meta descriptions:', error);
      
      // Fallback descriptions
      const fallbackDescriptions = [
        `Complete guide to ${searchTerm} with expert tips and best practices for 2025.`,
        `Learn ${searchTerm} with our comprehensive tutorials and professional guidance.`,
        `Master ${searchTerm} today with proven strategies and actionable insights.`
      ];
      
      setMetaDescriptions(fallbackDescriptions);
      setIsVisible(true);
      
      if (onError) {
        onError('Meta descriptions generated using fallback method');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (description, index) => {
    try {
      await navigator.clipboard.writeText(description);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getDescriptionLength = (description) => {
    return description.length;
  };

  const getDescriptionLengthColor = (length) => {
    if (length >= 150 && length <= 160) return 'text-green-600';
    if (length >= 140 && length <= 170) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDescriptionStatus = (length) => {
    if (length >= 150 && length <= 160) return '✅ Perfect SEO length';
    if (length >= 140 && length <= 170) return '⚠️ Good length';
    if (length < 140) return '❌ Too short - add more detail';
    return '❌ Too long - consider shortening';
  };

  if (!isVisible && metaDescriptions.length === 0) {
    return (
      <div className="mt-4">
        <Button
          onClick={generateMetaDescriptions}
          disabled={isGenerating || !searchTerm}
          className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white font-semibold transition-all duration-300 transform hover:scale-105"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Meta Descriptions...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              📝 Generate Meta Descriptions
            </>
          )}
        </Button>
      </div>
    );
  }

  if (!isVisible) return null;

  return (
    <Card className="mt-6 border-0 shadow-lg bg-gradient-to-br from-blue-50 to-teal-50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            SEO Meta Descriptions
            <Badge className="bg-blue-600 text-white">
              📝 New Feature
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
          SEO-optimized meta descriptions for "<strong>{searchTerm}</strong>" - perfect for search engine results
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {metaDescriptions.map((description, index) => {
            const descLength = getDescriptionLength(description);
            const lengthColor = getDescriptionLengthColor(descLength);
            const status = getDescriptionStatus(descLength);
            
            return (
              <div
                key={index}
                className="group p-4 bg-white rounded-lg border-2 border-blue-100 hover:border-blue-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-gray-800 leading-relaxed text-sm">
                      {description}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs">
                      <span className={`font-medium ${lengthColor}`}>
                        {descLength} characters
                      </span>
                      <span className="text-gray-500">
                        {status}
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(description, index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                  >
                    {copiedIndex === index ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 p-4 bg-blue-100 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-blue-800 mb-2">Meta Description Best Practices:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>150-160 characters</strong> is optimal (Google typically shows ~155)</li>
                <li>• Include your <strong>target keyword</strong> naturally</li>
                <li>• Write <strong>compelling copy</strong> that encourages clicks</li>
                <li>• Make it <strong>unique</strong> for each page on your website</li>
                <li>• Include a <strong>call-to-action</strong> when appropriate</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-center">
          <Button
            onClick={generateMetaDescriptions}
            disabled={isGenerating}
            variant="outline"
            className="border-blue-300 text-blue-600 hover:bg-blue-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate New Descriptions
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetaDescriptionGenerator;
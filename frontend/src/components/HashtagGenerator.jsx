import React, { useState } from 'react';
import { Hash, Loader2, Copy, Check, Wand2, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const HashtagGenerator = ({ searchTerm, onError }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hashtags, setHashtags] = useState({});
  const [copiedHashtag, setCopiedHashtag] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const generateHashtags = async () => {
    if (!searchTerm || isGenerating) return;
    
    setIsGenerating(true);
    
    try {
      // Generate different categories of hashtags
      const searchTermClean = searchTerm.replace(/\s+/g, '').toLowerCase();
      const searchWords = searchTerm.split(' ');
      
      const generatedHashtags = {
        trending: [
          `#${searchTermClean}`,
          `#${searchTermClean}2025`,
          `#${searchTermClean}tips`,
          `#${searchTermClean}hack`,
          `#${searchTermClean}trends`,
          `#${searchTermClean}guide`,
          `#${searchTermClean}expert`,
          `#${searchTermClean}mastery`
        ],
        niche: [
          `#${searchTermClean}community`,
          `#${searchTermClean}strategy`,
          `#${searchTermClean}basics`,
          `#${searchTermClean}advanced`,
          `#${searchTermClean}pro`,
          `#${searchTermClean}secrets`,
          `#${searchTermClean}insider`,
          `#${searchTermClean}bootcamp`
        ],
        branded: [
          `#learn${searchTermClean}`,
          `#master${searchTermClean}`,
          `#${searchTermClean}success`,
          `#${searchTermClean}journey`,
          `#${searchTermClean}life`,
          `#${searchTermClean}world`,
          `#${searchTermClean}daily`,
          `#${searchTermClean}passion`
        ],
        long_tail: [
          `#how${searchTermClean}`,
          `#best${searchTermClean}`,
          `#${searchTermClean}tutorial`,
          `#${searchTermClean}training`,
          `#${searchTermClean}course`,
          `#${searchTermClean}workshop`,
          `#${searchTermClean}learning`,
          `#${searchTermClean}resources`
        ],
        popular: [
          '#viral',
          '#trending',
          '#popular',
          '#mustknow',
          '#2025',
          '#tips',
          '#hack',
          '#guide',
          '#expert',
          '#pro'
        ]
      };
      
      setHashtags(generatedHashtags);
      setIsVisible(true);
      
    } catch (error) {
      console.error('Error generating hashtags:', error);
      
      // Fallback hashtags
      const fallbackHashtags = {
        trending: [
          `#${searchTerm.replace(/\s+/g, '').toLowerCase()}`,
          `#${searchTerm.replace(/\s+/g, '').toLowerCase()}tips`,
          `#${searchTerm.replace(/\s+/g, '').toLowerCase()}guide`
        ],
        popular: [
          '#viral',
          '#trending',
          '#tips'
        ]
      };
      
      setHashtags(fallbackHashtags);
      setIsVisible(true);
      
      if (onError) {
        onError('Hashtags generated using fallback method');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const copyHashtag = async (hashtag, category, index) => {
    try {
      await navigator.clipboard.writeText(hashtag);
      setCopiedHashtag(`${category}-${index}`);
      setTimeout(() => setCopiedHashtag(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const copyAllHashtags = async (category) => {
    try {
      const hashtagText = hashtags[category].join(' ');
      await navigator.clipboard.writeText(hashtagText);
      setCopiedHashtag(`all-${category}`);
      setTimeout(() => setCopiedHashtag(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      trending: TrendingUp,
      niche: Hash,
      branded: Hash,
      long_tail: Hash,
      popular: TrendingUp
    };
    return icons[category] || Hash;
  };

  const getCategoryColor = (category) => {
    const colors = {
      trending: 'text-red-500',
      niche: 'text-blue-500',
      branded: 'text-purple-500',
      long_tail: 'text-green-500',
      popular: 'text-orange-500'
    };
    return colors[category] || 'text-gray-500';
  };

  const getCategoryTitle = (category) => {
    const titles = {
      trending: 'Trending',
      niche: 'Niche Specific',
      branded: 'Branded',
      long_tail: 'Long Tail',
      popular: 'Popular'
    };
    return titles[category] || category;
  };

  const getHashtagLength = (hashtag) => {
    return hashtag.length;
  };

  const getHashtagLengthColor = (length) => {
    if (length <= 20) return 'text-green-600';
    if (length <= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isVisible && Object.keys(hashtags).length === 0) {
    return (
      <div className="text-center py-8">
        <div className="mb-4">
          <div className="text-gray-600 mb-4">
            Generate trending hashtags for "<strong>{searchTerm}</strong>"
          </div>
        </div>
        <Button
          onClick={generateHashtags}
          disabled={isGenerating || !searchTerm}
          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold transition-all duration-300 transform hover:scale-105"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Hashtags...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              #️⃣ Generate Hashtags
            </>
          )}
        </Button>
      </div>
    );
  }

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Hash className="h-5 w-5 text-orange-600" />
          <h4 className="text-xl font-semibold text-gray-800">Hashtag Generator</h4>
          <Badge className="bg-orange-600 text-white">
            #️⃣ New Feature
          </Badge>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-6">
        Trending hashtags for "<strong>{searchTerm}</strong>" - boost your social media reach
      </p>
      
      <div className="space-y-6">
        {Object.entries(hashtags).map(([category, hashtagList]) => {
          const Icon = getCategoryIcon(category);
          const colorClass = getCategoryColor(category);
          const title = getCategoryTitle(category);
          
          return (
            <div key={category} className="bg-white rounded-lg border-2 border-orange-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${colorClass}`} />
                  <h5 className="font-semibold text-gray-800 capitalize">{title}</h5>
                  <Badge variant="secondary" className="text-xs">
                    {hashtagList.length}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyAllHashtags(category)}
                  className="text-orange-600 hover:text-orange-800 hover:bg-orange-100"
                >
                  {copiedHashtag === `all-${category}` ? (
                    <>
                      <Check className="mr-1 h-3 w-3" />
                      Copied All!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-3 w-3" />
                      Copy All
                    </>
                  )}
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {hashtagList.map((hashtag, index) => {
                  const hashtagLength = getHashtagLength(hashtag);
                  const lengthColor = getHashtagLengthColor(hashtagLength);
                  
                  return (
                    <div
                      key={index}
                      className="group flex items-center justify-between p-2 bg-gray-50 rounded border hover:border-orange-300 hover:bg-orange-50 transition-all duration-200"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-mono text-gray-800 truncate block">
                          {hashtag}
                        </span>
                        <div className="text-xs text-gray-500">
                          <span className={lengthColor}>
                            {hashtagLength} chars
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyHashtag(hashtag, category, index)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 h-auto text-orange-600 hover:text-orange-800"
                      >
                        {copiedHashtag === `${category}-${index}` ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 p-4 bg-orange-100 rounded-lg border border-orange-200">
        <div className="flex items-start gap-3">
          <Hash className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-orange-800 mb-2">Hashtag Best Practices:</h4>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>• <strong>Twitter:</strong> 1-2 hashtags per tweet (avoid overuse)</li>
              <li>• <strong>Instagram:</strong> 5-10 hashtags in first comment or caption</li>
              <li>• <strong>LinkedIn:</strong> 1-3 professional hashtags</li>
              <li>• <strong>TikTok:</strong> 3-5 trending hashtags for maximum reach</li>
              <li>• <strong>Mix popular and niche:</strong> Use trending tags + specific ones</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <Button
          onClick={generateHashtags}
          disabled={isGenerating}
          variant="outline"
          className="border-orange-300 text-orange-600 hover:bg-orange-50"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Generate New Hashtags
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default HashtagGenerator;
import React, { useState } from 'react';
import { Share2, Loader2, Copy, Check, Wand2, Twitter, Linkedin, Facebook, Instagram } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const SocialMediaPostCreator = ({ searchTerm, onError }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [socialPosts, setSocialPosts] = useState({});
  const [copiedPost, setCopiedPost] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const generateSocialPosts = async () => {
    if (!searchTerm || isGenerating) return;
    
    setIsGenerating(true);
    
    try {
      // Generate platform-specific social media posts
      const generatedPosts = {
        twitter: [
          `🚀 Mastering ${searchTerm}? Here are the game-changing strategies that actually work in 2025!\n\n✅ Pro tips included\n✅ Real results\n✅ Zero fluff\n\nThread below 👇 #${searchTerm.replace(/\s+/g, '')} #MarketingTips`,
          `The ${searchTerm} landscape just changed forever.\n\nWhat worked yesterday won't work tomorrow.\n\nHere's what you need to know 🧵\n\n#${searchTerm.replace(/\s+/g, '')} #Innovation`,
          `Hot take: Most people get ${searchTerm} completely wrong.\n\nHere's the truth nobody talks about:\n\n• Mistake #1: [Common error]\n• Mistake #2: [Another error]\n• The solution: [Better approach]\n\nThoughts? 👇`
        ],
        linkedin: [
          `The ${searchTerm} industry is evolving rapidly, and professionals who don't adapt risk being left behind.\n\nAfter analyzing the latest trends and working with industry leaders, here are the 5 key insights every professional should know:\n\n→ [Insight 1]\n→ [Insight 2]\n→ [Insight 3]\n→ [Insight 4]\n→ [Insight 5]\n\nWhat's your experience with ${searchTerm}? Share your thoughts in the comments.\n\n#${searchTerm.replace(/\s+/g, '')} #ProfessionalDevelopment #Industry`,
          `Question for my network: What's the biggest challenge you're facing with ${searchTerm} right now?\n\nI've been researching this extensively and found some surprising insights that could help:\n\n✅ [Solution 1]\n✅ [Solution 2]\n✅ [Solution 3]\n\nDrop a comment below - I'd love to help troubleshoot your specific situation.\n\n#${searchTerm.replace(/\s+/g, '')} #NetworkHelp #Community`
        ],
        facebook: [
          `🎯 Looking to improve your ${searchTerm} game?\n\nI just discovered these incredible resources that completely changed my perspective:\n\n📚 [Resource 1]\n🎥 [Resource 2]\n🔧 [Tool 3]\n\nThe best part? Most of these are completely free!\n\nSave this post for later and tag a friend who needs to see this! 👇\n\n#${searchTerm.replace(/\s+/g, '')} #Tips #Resources`,
          `Can we talk about ${searchTerm} for a minute? 🤔\n\nEveryone's talking about it, but here's what I've learned after diving deep into the research:\n\n✨ It's not as complicated as people make it seem\n✨ The basics still matter most\n✨ Consistency beats perfection every time\n\nWhat's been your biggest win with ${searchTerm} lately? Share in the comments! 👇`
        ],
        instagram: [
          `${searchTerm} tips that actually work ✨\n\nSwipe for the secrets that changed everything for me:\n\n1️⃣ [Tip one]\n2️⃣ [Tip two]\n3️⃣ [Tip three]\n4️⃣ [Tip four]\n5️⃣ [Tip five]\n\nWhich one will you try first? Comment below! 👇\n\n#${searchTerm.replace(/\s+/g, '')} #Tips #Growth #Success #2025Goals`,
          `POV: You finally understand ${searchTerm} 🎯\n\nThat moment when everything clicks and you realize:\n\n💡 It was simpler than you thought\n💡 You were overthinking it\n💡 The fundamentals are everything\n\nTag someone who needs this reminder! ✨\n\n#${searchTerm.replace(/\s+/g, '')} #Mindset #Growth #Motivation`
        ]
      };
      
      setSocialPosts(generatedPosts);
      setIsVisible(true);
      
    } catch (error) {
      console.error('Error generating social posts:', error);
      
      // Fallback posts
      const fallbackPosts = {
        twitter: [`Just learned something amazing about ${searchTerm}! 🚀 #${searchTerm.replace(/\s+/g, '')}`],
        linkedin: [`Insights on ${searchTerm} that every professional should know. #${searchTerm.replace(/\s+/g, '')}`],
        facebook: [`Great resources for learning about ${searchTerm}! 📚`],
        instagram: [`${searchTerm} tips coming your way! ✨ #${searchTerm.replace(/\s+/g, '')}`]
      };
      
      setSocialPosts(fallbackPosts);
      setIsVisible(true);
      
      if (onError) {
        onError('Social media posts generated using fallback method');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (post, platform, index) => {
    try {
      await navigator.clipboard.writeText(post);
      setCopiedPost(`${platform}-${index}`);
      setTimeout(() => setCopiedPost(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getPlatformIcon = (platform) => {
    const icons = {
      twitter: Twitter,
      linkedin: Linkedin,
      facebook: Facebook,
      instagram: Instagram
    };
    return icons[platform];
  };

  const getPlatformColor = (platform) => {
    const colors = {
      twitter: 'text-blue-400',
      linkedin: 'text-blue-700',
      facebook: 'text-blue-600',
      instagram: 'text-pink-500'
    };
    return colors[platform];
  };

  const getCharacterCount = (post) => {
    return post.length;
  };

  const getCharacterLimit = (platform) => {
    const limits = {
      twitter: 280,
      linkedin: 3000,
      facebook: 63206,
      instagram: 2200
    };
    return limits[platform];
  };

  if (!isVisible && Object.keys(socialPosts).length === 0) {
    return (
      <div className="text-center py-8">
        <div className="mb-4">
          <div className="text-gray-600 mb-4">
            Generate platform-specific social media posts for "<strong>{searchTerm}</strong>"
          </div>
        </div>
        <Button
          onClick={generateSocialPosts}
          disabled={isGenerating || !searchTerm}
          className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold transition-all duration-300 transform hover:scale-105"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Social Posts...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              📱 Generate Social Media Posts
            </>
          )}
        </Button>
      </div>
    );
  }

  if (!isVisible) return null;

  return (
    <Card className="mt-6 border-0 shadow-lg bg-gradient-to-br from-pink-50 to-rose-50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Share2 className="h-5 w-5 text-pink-600" />
            Social Media Posts
            <Badge className="bg-pink-600 text-white">
              📱 New Feature
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
          Ready-to-post content for all major platforms based on "<strong>{searchTerm}</strong>"
        </p>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="twitter" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {Object.keys(socialPosts).map((platform) => {
              const Icon = getPlatformIcon(platform);
              return (
                <TabsTrigger key={platform} value={platform} className="flex items-center gap-1 capitalize">
                  <Icon className={`h-4 w-4 ${getPlatformColor(platform)}`} />
                  {platform}
                </TabsTrigger>
              );
            })}
          </TabsList>
          
          {Object.entries(socialPosts).map(([platform, posts]) => (
            <TabsContent key={platform} value={platform} className="mt-4">
              <div className="space-y-3">
                {posts.map((post, index) => {
                  const charCount = getCharacterCount(post);
                  const charLimit = getCharacterLimit(platform);
                  const isOverLimit = charCount > charLimit;
                  
                  return (
                    <div
                      key={index}
                      className="group p-4 bg-white rounded-lg border-2 border-pink-100 hover:border-pink-300 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <pre className="whitespace-pre-wrap font-sans text-gray-800 text-sm leading-relaxed">
                            {post}
                          </pre>
                          <div className="flex items-center gap-4 mt-3 text-xs">
                            <span className={`font-medium ${isOverLimit ? 'text-red-600' : 'text-green-600'}`}>
                              {charCount}/{charLimit} characters
                            </span>
                            {platform === 'twitter' && (
                              <span className="text-gray-500">
                                {isOverLimit ? '❌ Too long for Twitter' : '✅ Perfect length'}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(post, platform, index)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-pink-600 hover:text-pink-800 hover:bg-pink-100"
                        >
                          {copiedPost === `${platform}-${index}` ? (
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
            </TabsContent>
          ))}
        </Tabs>
        
        <div className="mt-6 p-4 bg-pink-100 rounded-lg border border-pink-200">
          <div className="flex items-start gap-3">
            <Share2 className="h-5 w-5 text-pink-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-pink-800 mb-2">Social Media Best Practices:</h4>
              <ul className="text-sm text-pink-700 space-y-1">
                <li>• <strong>Twitter:</strong> Keep it under 280 characters, use relevant hashtags</li>
                <li>• <strong>LinkedIn:</strong> Professional tone, add value to your network</li>
                <li>• <strong>Facebook:</strong> Engaging content that encourages comments</li>
                <li>• <strong>Instagram:</strong> Visual-friendly copy with strategic hashtags</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-center">
          <Button
            onClick={generateSocialPosts}
            disabled={isGenerating}
            variant="outline"
            className="border-pink-300 text-pink-600 hover:bg-pink-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate New Posts
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SocialMediaPostCreator;
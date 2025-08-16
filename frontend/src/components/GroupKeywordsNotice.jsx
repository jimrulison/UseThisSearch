import React from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Crown, Sparkles, ArrowRight } from 'lucide-react';
import { useBilling } from '../contexts/BillingContext';

const GroupKeywordsNotice = () => {
  const { subscription, checkFeatureAccess } = useBilling();
  
  const hasGroupKeywords = checkFeatureAccess('keyword_clustering');
  const isAnnualSubscriber = subscription?.billing_cycle === 'annual';
  const canUseGroupKeywords = hasGroupKeywords && isAnnualSubscriber;

  return (
    <Card className="mt-8 border-2 border-dashed border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                {/* Custom Group Keywords Logo */}
                <img 
                  src="/group-keywords-logo.png" 
                  alt="Group Keywords" 
                  className="w-8 h-8 object-contain"
                />
                <div className="flex flex-col">
                  <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent leading-tight">
                    GROUP KEYWORDS
                  </h3>
                  <div className="text-sm text-gray-500" style={{ fontSize: '0.75em', marginTop: '-2px' }}>
                    (clustering)
                  </div>
                </div>
                <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs ml-2">
                  <Crown className="w-3 h-3 mr-1" />
                  ANNUAL ONLY
                </Badge>
              </div>
              
              {canUseGroupKeywords ? (
                <p className="text-gray-600 text-sm">
                  <Sparkles className="w-4 h-4 inline mr-1 text-yellow-500" />
                  Transform your keyword research into strategic content clusters! 
                  <span className="font-medium text-purple-600 ml-1">Available after your search.</span>
                </p>
              ) : (
                <p className="text-gray-600 text-sm">
                  Organize related keywords into strategic content groups with AI-powered analysis. 
                  <span className="font-medium text-purple-600">Upgrade to annual plan to unlock.</span>
                </p>
              )}
            </div>
          </div>
          
          <div className="flex-shrink-0">
            {canUseGroupKeywords ? (
              <div className="text-center">
                <div className="text-green-600 font-medium text-sm">✓ ACTIVE</div>
                <div className="text-xs text-gray-500">Ready to use</div>
              </div>
            ) : (
              <Button 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                onClick={() => window.location.href = '/billing'}
              >
                Upgrade Now
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>

        {/* Explanation Box - Keep this as requested */}
        <div className="mt-4 p-4 bg-red-100 border border-red-200 rounded-lg">
          <p className="text-gray-800 text-sm leading-relaxed text-center">
            Keyword clustering actually groups related keywords together so you can create one comprehensive piece of content that ranks for multiple search terms instead of dozens of separate posts.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupKeywordsNotice;
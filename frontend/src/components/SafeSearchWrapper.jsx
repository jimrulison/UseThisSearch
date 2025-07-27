import React from 'react';
import { AlertCircle, ArrowUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useBilling } from '../contexts/BillingContext';
import { useToast } from '../hooks/use-toast';

const SearchLimitModal = ({ isOpen, onClose, usageInfo, onUpgrade }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="max-w-md w-full mx-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <CardTitle>Search Limit Reached</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            <p className="mb-2">You've used all your searches for this month:</p>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between">
                <span>Searches Used:</span>
                <Badge variant="secondary">
                  {usageInfo?.searches_used || 0} / {usageInfo?.searches_limit || 0}
                </Badge>
              </div>
              <div className="flex justify-between mt-1">
                <span>Resets:</span>
                <span className="text-xs text-gray-500">
                  {usageInfo?.reset_date ? new Date(usageInfo.reset_date).toLocaleDateString() : 'Next month'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Upgrade to continue searching:</p>
            <div className="space-y-2">
              <Button 
                className="w-full flex items-center justify-between"
                onClick={() => onUpgrade('professional')}
              >
                <span>Professional Plan</span>
                <div className="text-right">
                  <div className="text-sm">500 searches/month</div>
                  <div className="text-xs opacity-75">$97/month</div>
                </div>
              </Button>
              <Button 
                className="w-full flex items-center justify-between"
                onClick={() => onUpgrade('agency')}
              >
                <span>Agency Plan</span>
                <div className="text-right">
                  <div className="text-sm">2000 searches/month</div>
                  <div className="text-xs opacity-75">$197/month</div>
                </div>
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const CompanyLimitModal = ({ isOpen, onClose, usageInfo, onUpgrade }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="max-w-md w-full mx-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <CardTitle>Company Limit Reached</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            <p className="mb-2">You've reached your company limit:</p>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between">
                <span>Companies:</span>
                <Badge variant="secondary">
                  {usageInfo?.current_count || 0} / {usageInfo?.limit || 0}
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Upgrade to create more companies:</p>
            <div className="space-y-2">
              {usageInfo?.upgrade_suggestions?.map((suggestion, index) => (
                <Button 
                  key={index}
                  className="w-full flex items-center justify-between"
                  onClick={() => onUpgrade(suggestion.plan)}
                >
                  <span>{suggestion.plan.charAt(0).toUpperCase() + suggestion.plan.slice(1)} Plan</span>
                  <div className="text-right">
                    <div className="text-sm">{suggestion.limit}</div>
                    <div className="text-xs opacity-75">{suggestion.price}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const SafeSearchWrapper = ({ children, onSearchAttempt, onCompanyCreateAttempt }) => {
  const { hasUsageLeft, canCreateCompany, usage } = useBilling();
  const { toast } = useToast();
  
  const [showSearchModal, setShowSearchModal] = React.useState(false);
  const [showCompanyModal, setShowCompanyModal] = React.useState(false);
  const [lastUsageInfo, setLastUsageInfo] = React.useState(null);

  const handleSearchAttempt = async (...args) => {
    if (!hasUsageLeft()) {
      // Show modal instead of allowing search
      setLastUsageInfo({
        searches_used: usage?.current_searches || 0,
        searches_limit: usage?.search_limit || 0,
        reset_date: usage?.reset_date
      });
      setShowSearchModal(true);
      return;
    }

    // Proceed with original search
    if (onSearchAttempt) {
      return await onSearchAttempt(...args);
    }
  };

  const handleCompanyCreateAttempt = async (...args) => {
    if (!canCreateCompany()) {
      // Show modal instead of allowing company creation
      setLastUsageInfo({
        current_count: usage?.current_companies || 0,
        limit: usage?.company_limit || 0,
        upgrade_suggestions: [
          {
            plan: 'professional',
            limit: '5 companies',
            price: '$97/month'
          },
          {
            plan: 'agency',
            limit: 'Unlimited companies',
            price: '$197/month'
          }
        ]
      });
      setShowCompanyModal(true);
      return;
    }

    // Proceed with original company creation
    if (onCompanyCreateAttempt) {
      return await onCompanyCreateAttempt(...args);
    }
  };

  const handleUpgrade = (planType) => {
    toast({
      title: "Upgrade Required",
      description: `Please upgrade to ${planType} plan to continue.`,
      duration: 5000,
    });
    
    // Close modals
    setShowSearchModal(false);
    setShowCompanyModal(false);
    
    // In real implementation, this would open Stripe checkout
    console.log(`Upgrade to ${planType} plan requested`);
  };

  // Clone children and inject our safe handlers
  const enhancedChildren = React.Children.map(children, child => {
    if (!React.isValidElement(child)) return child;

    // Look for search-related props
    const props = {};
    if (child.props.onSearch) {
      props.onSearch = handleSearchAttempt;
    }
    if (child.props.onCompanyCreate) {
      props.onCompanyCreate = handleCompanyCreateAttempt;
    }

    return React.cloneElement(child, props);
  });

  return (
    <>
      {enhancedChildren}
      
      <SearchLimitModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        usageInfo={lastUsageInfo}
        onUpgrade={handleUpgrade}
      />
      
      <CompanyLimitModal
        isOpen={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
        usageInfo={lastUsageInfo}
        onUpgrade={handleUpgrade}
      />
    </>
  );
};

export default SafeSearchWrapper;
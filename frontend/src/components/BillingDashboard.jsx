import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  Settings,
  Download,
  ArrowUp,
  X
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useBilling } from '../contexts/BillingContext';
import { useToast } from '../hooks/use-toast';
import StripeCheckout from './StripeCheckout';

const BillingDashboard = () => {
  const { 
    subscription, 
    usage, 
    billingAlerts, 
    isLoading,
    updateSubscription,
    cancelSubscription,
    acknowledgeAlert,
    loadBillingData
  } = useBilling();
  
  const { toast } = useToast();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [initialPlan, setInitialPlan] = useState('professional');

  useEffect(() => {
    loadBillingData();
  }, []);

  const handleUpgrade = (planType = 'professional') => {
    setInitialPlan(planType);
    setShowUpgradeModal(true);
  };

  const handleCancelSubscription = async () => {
    setIsCanceling(true);
    try {
      const result = await cancelSubscription();
      if (result.success) {
        toast({
          title: "Subscription Canceled",
          description: "Your subscription has been canceled. You can continue using the service until the end of your billing period.",
          duration: 5000,
        });
        setShowCancelModal(false);
        await loadBillingData();
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsCanceling(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPlanDisplayName = (planType) => {
    const names = {
      solo: 'Solo',
      professional: 'Professional',
      agency: 'Agency',
      enterprise: 'Enterprise'
    };
    return names[planType] || planType;
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      trialing: 'bg-blue-100 text-blue-800',
      canceled: 'bg-red-100 text-red-800',
      past_due: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getUsagePercentage = (current, limit) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Billing & Subscription</h2>
        {subscription && (
          <Button 
            variant="outline" 
            onClick={() => handleUpgrade(subscription.plan_type)}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Manage Plan
          </Button>
        )}
      </div>

      {/* Billing Alerts */}
      {billingAlerts && billingAlerts.length > 0 && (
        <div className="space-y-3">
          {billingAlerts.map((alert) => (
            <Card key={alert.id} className="border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {alert.alert_type.replace('_', ' ').toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-600 mb-3">
                        {alert.message}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => acknowledgeAlert(alert.id)}
                        >
                          Dismiss
                        </Button>
                        {alert.alert_type.includes('usage') && (
                          <Button 
                            size="sm"
                            onClick={() => handleUpgrade()}
                            className="flex items-center gap-1"
                          >
                            <ArrowUp className="h-3 w-3" />
                            Upgrade
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Current Subscription */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">
                      {getPlanDisplayName(subscription.plan_type)} Plan
                    </p>
                    <p className="text-sm text-gray-600 capitalize">
                      {subscription.billing_period} billing
                    </p>
                  </div>
                  <Badge className={getStatusColor(subscription.status)}>
                    {subscription.status}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current period:</span>
                    <span>{formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}</span>
                  </div>
                  
                  {subscription.trial_end && new Date(subscription.trial_end) > new Date() && (
                    <div className="flex justify-between text-sm">
                      <span>Trial ends:</span>
                      <span className="text-blue-600 font-medium">
                        {formatDate(subscription.trial_end)}
                      </span>
                    </div>
                  )}
                  
                  {subscription.canceled_at && (
                    <div className="flex justify-between text-sm">
                      <span>Canceled on:</span>
                      <span className="text-red-600">
                        {formatDate(subscription.canceled_at)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => handleUpgrade(subscription.plan_type)}
                    className="flex-1"
                  >
                    Change Plan
                  </Button>
                  {subscription.status === 'active' && (
                    <Button 
                      variant="outline"
                      onClick={() => setShowCancelModal(true)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-600 mb-4">No active subscription</p>
                <Button onClick={() => handleUpgrade()}>
                  Subscribe Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Usage Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {usage ? (
              <>
                {/* Search Usage */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Searches this month</span>
                    <span>
                      {usage.current_searches} / {usage.search_limit === -1 ? '∞' : usage.search_limit}
                    </span>
                  </div>
                  {usage.search_limit !== -1 && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          getUsageColor(getUsagePercentage(usage.current_searches, usage.search_limit))
                        }`}
                        style={{ 
                          width: `${getUsagePercentage(usage.current_searches, usage.search_limit)}%` 
                        }}
                      ></div>
                    </div>
                  )}
                </div>

                {/* Company Usage */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Companies</span>
                    <span>
                      {usage.current_companies} / {usage.company_limit === -1 ? '∞' : usage.company_limit}
                    </span>
                  </div>
                  {usage.company_limit !== -1 && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          getUsageColor(getUsagePercentage(usage.current_companies, usage.company_limit))
                        }`}
                        style={{ 
                          width: `${getUsagePercentage(usage.current_companies, usage.company_limit)}%` 
                        }}
                      ></div>
                    </div>
                  )}
                </div>

                <div className="pt-4 text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    Usage resets on {formatDate(usage.reset_date)}
                  </p>
                  {(usage.searches_remaining <= 10 && usage.searches_remaining > 0) && (
                    <Button 
                      size="sm" 
                      onClick={() => handleUpgrade()}
                      className="flex items-center gap-1"
                    >
                      <ArrowUp className="h-3 w-3" />
                      Upgrade for More
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-600">Usage data not available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cancel Subscription Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to cancel your subscription? You'll continue to have access 
              until the end of your current billing period.
            </p>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowCancelModal(false)}
                className="flex-1"
                disabled={isCanceling}
              >
                Keep Subscription
              </Button>
              <Button 
                variant="destructive"
                onClick={handleCancelSubscription}
                disabled={isCanceling}
                className="flex-1"
              >
                {isCanceling ? 'Canceling...' : 'Cancel Subscription'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upgrade Modal */}
      <StripeCheckout 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        initialPlan={initialPlan}
      />
    </div>
  );
};

export default BillingDashboard;
import React, { useState } from 'react';
import { ArrowUp, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { useBilling } from '../contexts/BillingContext';
import { useToast } from '../hooks/use-toast';
import StripeCheckout from './StripeCheckout';

const UpgradeButton = () => {
  const { subscription, updateSubscription, loadBillingData } = useBilling();
  const { toast } = useToast();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Define upgrade paths
  const getNextTier = (currentPlan) => {
    const upgradePath = {
      solo: 'professional',
      professional: 'agency', 
      agency: 'enterprise',
      enterprise: null // Already at highest tier
    };
    return upgradePath[currentPlan] || null;
  };

  // Get pricing for tiers
  const getTierPricing = () => {
    return {
      solo: { monthly: 47, yearly: 37 },
      professional: { monthly: 97, yearly: 77 },
      agency: { monthly: 197, yearly: 157 },
      enterprise: { monthly: 397, yearly: 317 }
    };
  };

  // Calculate price difference
  const getPriceDifference = (currentPlan, nextPlan, billingPeriod) => {
    const pricing = getTierPricing();
    const currentPrice = pricing[currentPlan]?.[billingPeriod] || 0;
    const nextPrice = pricing[nextPlan]?.[billingPeriod] || 0;
    return nextPrice - currentPrice;
  };

  // Get tier display names
  const getTierName = (tier) => {
    const names = {
      solo: 'Solo',
      professional: 'Professional',
      agency: 'Agency',
      enterprise: 'Enterprise'
    };
    return names[tier] || tier;
  };

  // Get tier benefits
  const getTierBenefits = (tier) => {
    const benefits = {
      solo: '1 user, 1 company, 200 searches',
      professional: '2 users, 5 companies, 500 searches',
      agency: '5 users, unlimited companies, 2000 searches',
      enterprise: '7 users, unlimited companies, unlimited searches'
    };
    return benefits[tier] || '';
  };

  const handleUpgrade = async () => {
    if (!subscription) {
      // No subscription - show full checkout modal
      setShowUpgradeModal(true);
      return;
    }

    const nextTier = getNextTier(subscription.plan_type);
    if (!nextTier) {
      toast({
        title: "Already at Highest Tier",
        description: "You're already on the Enterprise plan - the highest tier available!",
        duration: 3000,
      });
      return;
    }

    const priceDifference = getPriceDifference(
      subscription.plan_type,
      nextTier,
      subscription.billing_period
    );

    setIsUpgrading(true);

    try {
      const result = await updateSubscription(nextTier, subscription.billing_period);
      
      if (result.success) {
        await loadBillingData(); // Refresh billing data
        
        toast({
          title: "Upgrade Successful!",
          description: `Successfully upgraded to ${getTierName(nextTier)} plan. You'll be charged $${priceDifference} for the difference.`,
          duration: 5000,
        });
      } else {
        toast({
          title: "Upgrade Failed",
          description: result.error || "Failed to upgrade subscription. Please try again.",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: "Upgrade Error",
        description: "An error occurred while upgrading. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  // Don't show button if no subscription info or already at highest tier
  if (!subscription) {
    return (
      <>
        <Button
          onClick={() => setShowUpgradeModal(true)}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg flex items-center gap-2"
        >
          <ArrowUp className="h-4 w-4" />
          UPGRADE
        </Button>
        <StripeCheckout 
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          initialPlan="professional"
        />
      </>
    );
  }

  const nextTier = getNextTier(subscription.plan_type);
  
  if (!nextTier) {
    return null; // Already at highest tier
  }

  const priceDifference = getPriceDifference(
    subscription.plan_type,
    nextTier,
    subscription.billing_period || 'monthly'
  );

  return (
    <>
      <Button
        onClick={handleUpgrade}
        disabled={isUpgrading}
        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg flex items-center gap-2"
        title={`Upgrade to ${getTierName(nextTier)} for $${priceDifference}/month difference`}
      >
        {isUpgrading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            UPGRADING...
          </>
        ) : (
          <>
            <ArrowUp className="h-4 w-4" />
            UPGRADE
          </>
        )}
      </Button>
      
      <StripeCheckout 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        initialPlan={nextTier}
      />
    </>
  );
};

export default UpgradeButton;
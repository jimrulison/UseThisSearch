import React, { useState } from 'react';
import { ArrowUp, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { useBilling } from '../contexts/BillingContext';
import { useToast } from '../hooks/use-toast';
import StripeCheckout from './StripeCheckout';

const UpgradeButton = () => {
  const { subscription } = useBilling();
  const { toast } = useToast();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleUpgrade = () => {
    if (subscription) {
      // Already has subscription - could be upgrading add-ons or changing billing period
      toast({
        title: "Manage Subscription",
        description: "Visit your billing dashboard to manage your subscription and add-ons.",
        duration: 5000,
      });
      // Could redirect to billing dashboard or show upgrade options
      window.location.href = '/dashboard';
    } else {
      // No subscription - show checkout modal
      setShowUpgradeModal(true);
    }
  };

  return (
    <>
      <Button
        onClick={handleUpgrade}
        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg flex items-center gap-2"
      >
        <ArrowUp className="h-4 w-4" />
        {subscription ? 'MANAGE PLAN' : 'UPGRADE'}
      </Button>
      
      <StripeCheckout 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </>
  );
};

export default UpgradeButton;
import React, { useState } from 'react';
import { Users, AlertTriangle, CheckCircle, ArrowUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { useBilling } from '../contexts/BillingContext';
import { useAuth } from '../contexts/AuthContext';
import StripeCheckout from './StripeCheckout';

const UserAvailabilityNotice = () => {
  const { usage, subscription } = useBilling();
  const { user } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (!usage || !user) return null;

  const { current_users, user_limit, users_remaining } = usage;
  
  // Don't show if unlimited users
  if (user_limit === -1) return null;

  const getStatusColor = () => {
    if (users_remaining <= 0) return 'bg-red-100 text-red-800 border-red-200';
    if (users_remaining <= 1) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getStatusIcon = () => {
    if (users_remaining <= 0) return <AlertTriangle className="h-4 w-4" />;
    if (users_remaining <= 1) return <AlertTriangle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const getPlanName = () => {
    const planNames = {
      solo: 'Solo',
      professional: 'Professional',
      agency: 'Agency',
      enterprise: 'Enterprise'
    };
    return planNames[subscription?.plan_type] || 'Solo';
  };

  const getUpgradeOptions = () => {
    const currentPlan = subscription?.plan_type || 'solo';
    
    if (currentPlan === 'solo') return { plan: 'professional', users: 2 };
    if (currentPlan === 'professional') return { plan: 'agency', users: 5 };
    if (currentPlan === 'agency') return { plan: 'enterprise', users: 7 };
    return { plan: 'enterprise', users: 7 };
  };

  const handleUpgrade = () => {
    // This would trigger the upgrade modal
    // For now, let's just redirect to dashboard billing
    window.location.href = '/dashboard';
  };

  return (
    <Card className={`border-2 shadow-lg transition-all duration-300 hover:shadow-xl ${getStatusColor()}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-lg text-gray-800">Team Size:</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono text-lg px-3 py-1 bg-white/80">
                {current_users}/{user_limit}
              </Badge>
              <span className="text-base text-gray-700 font-medium">users</span>
            </div>
            
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="text-base font-medium">
                {users_remaining > 0 
                  ? `${users_remaining} slot${users_remaining !== 1 ? 's' : ''} remaining`
                  : 'Team full'
                }
              </span>
            </div>
            
            <Badge 
              variant="secondary" 
              className="text-base px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-md"
            >
              {getPlanName()} Plan
            </Badge>
          </div>

          {users_remaining <= 1 && (
            <Button 
              size="lg" 
              onClick={handleUpgrade}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg transition-all duration-200 hover:scale-105"
            >
              <ArrowUp className="h-4 w-4" />
              Upgrade for {getUpgradeOptions().users} users
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserAvailabilityNotice;
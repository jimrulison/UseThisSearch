import React from 'react';
import { Users, AlertTriangle, CheckCircle, ArrowUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { useBilling } from '../contexts/BillingContext';
import { useAuth } from '../contexts/AuthContext';

const UserAvailabilityNotice = () => {
  const { usage, subscription } = useBilling();
  const { user } = useAuth();

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
    <Card className={`border-2 ${getStatusColor()}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span className="font-medium">Team Size:</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {current_users}/{user_limit}
              </Badge>
              <span className="text-sm text-gray-600">users</span>
            </div>
            
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              <span className="text-sm">
                {users_remaining > 0 
                  ? `${users_remaining} slot${users_remaining !== 1 ? 's' : ''} remaining`
                  : 'Team full'
                }
              </span>
            </div>
            
            <Badge variant="secondary" className="text-xs">
              {getPlanName()} Plan
            </Badge>
          </div>

          {users_remaining <= 1 && (
            <Button 
              size="sm" 
              onClick={handleUpgrade}
              className="flex items-center gap-1"
            >
              <ArrowUp className="h-3 w-3" />
              Upgrade for {getUpgradeOptions().users} users
            </Button>
          )}
        </div>

        {users_remaining === 0 && (
          <div className="mt-3 pt-3 border-t border-red-200">
            <p className="text-sm text-red-700">
              <strong>Team at capacity:</strong> You cannot invite more users to your companies. 
              Upgrade to {getUpgradeOptions().plan} plan to add {getUpgradeOptions().users - current_users} more users.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserAvailabilityNotice;
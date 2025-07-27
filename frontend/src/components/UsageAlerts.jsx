import React, { useState, useEffect } from 'react';
import { AlertCircle, X, ArrowUp, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { useBilling } from '../contexts/BillingContext';
import { useToast } from '../hooks/use-toast';

const UsageAlerts = () => {
  const { 
    usage, 
    billingAlerts, 
    acknowledgeAlert, 
    getUsageWarnings,
    subscription 
  } = useBilling();
  
  const [warnings, setWarnings] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    const currentWarnings = getUsageWarnings();
    setWarnings(currentWarnings);
  }, [usage, getUsageWarnings]);

  const handleAcknowledgeAlert = async (alertId) => {
    const success = await acknowledgeAlert(alertId);
    if (success) {
      toast({
        title: "Alert Dismissed",
        description: "Alert has been acknowledged.",
        duration: 3000,
      });
    }
  };

  const getAlertVariant = (type) => {
    switch (type) {
      case 'limit_exceeded':
        return 'destructive';
      case 'usage_warning_90':
        return 'destructive';
      case 'usage_warning_80':
        return 'default';
      case 'payment_failed':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'limit_exceeded':
        return <X className="h-4 w-4" />;
      case 'usage_warning_90':
      case 'usage_warning_80':
        return <AlertCircle className="h-4 w-4" />;
      case 'payment_failed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const renderUpgradeButton = (warning) => {
    const currentPlan = subscription?.plan_type || 'solo';
    
    let suggestedPlan = 'professional';
    let suggestedPrice = '$97/month';
    
    if (currentPlan === 'solo') {
      suggestedPlan = 'professional';
      suggestedPrice = '$97/month';
    } else if (currentPlan === 'professional') {
      suggestedPlan = 'agency';
      suggestedPrice = '$197/month';
    } else if (currentPlan === 'agency') {
      suggestedPlan = 'enterprise';
      suggestedPrice = '$397/month';
    }

    return (
      <Button 
        size="sm" 
        className="flex items-center gap-1"
        onClick={() => {
          // This would open upgrade modal in real implementation
          toast({
            title: "Upgrade Available",
            description: `Upgrade to ${suggestedPlan} plan for ${suggestedPrice}`,
            duration: 5000,
          });
        }}
      >
        <ArrowUp className="h-3 w-3" />
        Upgrade to {suggestedPlan}
      </Button>
    );
  };

  // Don't render if no alerts or warnings
  if ((!billingAlerts || billingAlerts.length === 0) && warnings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Billing Alerts from Backend */}
      {billingAlerts && billingAlerts.map((alert) => (
        <Card key={alert.id} className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="text-orange-600 mt-0.5">
                  {getAlertIcon(alert.alert_type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getAlertVariant(alert.alert_type)}>
                      {alert.alert_type.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(alert.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    {alert.message}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                    >
                      Dismiss
                    </Button>
                    {alert.alert_type.includes('usage') && renderUpgradeButton()}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Real-time Usage Warnings */}
      {warnings.map((warning, index) => (
        <Card key={`warning-${index}`} className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="text-yellow-600 mt-0.5">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary">
                      {warning.category.toUpperCase()} WARNING
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    {warning.message}
                  </p>
                  {warning.action === 'upgrade_required' && (
                    <div className="flex items-center gap-2">
                      {renderUpgradeButton(warning)}
                    </div>
                  )}
                  {warning.action === 'consider_upgrade' && (
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        Consider Upgrading
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default UsageAlerts;
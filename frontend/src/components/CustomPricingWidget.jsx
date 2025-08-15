import React, { useState } from 'react';
import { useToast } from '../hooks/use-toast';
import { Button } from './ui/button';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const ADMIN_API = `${BACKEND_URL}/api/admin`;

const CustomPricingWidget = ({ getAuthHeaders }) => {
  const { toast } = useToast();
  
  const [userEmail, setUserEmail] = useState('');
  const [planType, setPlanType] = useState('professional');
  const [customPriceMonthly, setCustomPriceMonthly] = useState('');
  const [customPriceYearly, setCustomPriceYearly] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const planOptions = [
    { value: 'solo', label: 'Solo Plan', features: ['1 user', '1 company', '200 searches'] },
    { value: 'professional', label: 'Professional Plan', features: ['2 users', '5 companies', '500 searches'] },
    { value: 'agency', label: 'Agency Plan', features: ['5 users', 'Unlimited companies', '2000 searches'] },
    { value: 'enterprise', label: 'Enterprise Plan', features: ['7 users', 'Unlimited companies', 'Unlimited searches'] },
    { 
      value: 'annual_gift', 
      label: '🎁 Annual Gift Plan', 
      features: ['5 users', '10 companies', '1000+ searches', '🔥 Clustering Access', '500 Bonus Credits', '12-month duration'],
      isGift: true,
      description: 'Special annual gift subscription with premium features'
    }
  ];

  const handleApplyCustomPricing = async (e) => {
    e.preventDefault();
    
    if (!userEmail.trim()) {
      toast({
        title: "Missing Email",
        description: "Please enter a user email",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (!customPriceMonthly || !customPriceYearly) {
      toast({
        title: "Missing Prices",
        description: "Please enter both monthly and yearly prices",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    const monthlyPrice = parseInt(customPriceMonthly);
    const yearlyPrice = parseInt(customPriceYearly);

    if (monthlyPrice <= 0 || yearlyPrice <= 0) {
      toast({
        title: "Invalid Prices",
        description: "Prices must be greater than $0",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(`${ADMIN_API}/custom-pricing/apply`, {
        user_email: userEmail.trim(),
        plan_type: planType,
        custom_price_monthly: monthlyPrice,
        custom_price_yearly: yearlyPrice,
        notes: notes.trim()
      }, {
        headers: getAuthHeaders()
      });

      toast({
        title: "Custom Pricing Applied",
        description: `Successfully applied custom pricing for ${userEmail}`,
        duration: 5000,
      });

      // Reset form
      setUserEmail('');
      setCustomPriceMonthly('');
      setCustomPriceYearly('');
      setNotes('');
      
    } catch (error) {
      console.error('Error applying custom pricing:', error);
      let errorMessage = "Failed to apply custom pricing";
      if (error.response?.status === 404) {
        errorMessage = "User not found in system";
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPlan = planOptions.find(plan => plan.value === planType);

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center">
        <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
        Custom Pricing
      </h3>
      
      <form onSubmit={handleApplyCustomPricing} className="space-y-4">
        {/* User Email Input */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            User Email
          </label>
          <input
            type="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            placeholder="user@example.com"
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            disabled={isLoading}
          />
        </div>

        {/* Plan Type Selection */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Plan Type
          </label>
          <select
            value={planType}
            onChange={(e) => setPlanType(e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            disabled={isLoading}
          >
            {planOptions.map((plan) => (
              <option key={plan.value} value={plan.value} className="bg-slate-800">
                {plan.label}
              </option>
            ))}
          </select>
          {selectedPlan && (
            <div className="mt-2 p-3 bg-white/5 rounded-lg border border-white/10">
              <div className={`text-xs ${selectedPlan.isGift ? 'text-yellow-300' : 'text-gray-400'} mb-1`}>
                {selectedPlan.isGift ? '🎁 Gift Plan Features:' : 'Plan Features:'}
              </div>
              <div className={`text-xs ${selectedPlan.isGift ? 'text-yellow-200' : 'text-gray-300'}`}>
                {selectedPlan.features.join(' • ')}
              </div>
              {selectedPlan.description && (
                <div className="text-xs text-yellow-400 mt-1 italic">
                  {selectedPlan.description}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Custom Pricing Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              {selectedPlan?.isGift ? 'Gift Value ($)' : 'Monthly Price ($)'}
            </label>
            <input
              type="number"
              value={customPriceMonthly}
              onChange={(e) => setCustomPriceMonthly(e.target.value)}
              placeholder={selectedPlan?.isGift ? "0" : "47"}
              min={selectedPlan?.isGift ? "0" : "1"}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              disabled={isLoading}
            />
            {selectedPlan?.isGift && (
              <div className="text-xs text-yellow-400 mt-1">
                💡 Set to 0 for free gift
              </div>
            )}
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              {selectedPlan?.isGift ? 'Annual Gift Price ($)' : 'Yearly Price ($)'}
            </label>
            <input
              type="number"
              value={customPriceYearly}
              onChange={(e) => setCustomPriceYearly(e.target.value)}
              placeholder={selectedPlan?.isGift ? "0" : "37"}
              min={selectedPlan?.isGift ? "0" : "1"}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              disabled={isLoading}
            />
            {selectedPlan?.isGift && (
              <div className="text-xs text-yellow-400 mt-1">
                🎁 12-month gift duration
              </div>
            )}
          </div>
        </div>

        {/* Gift Plan Special Info */}
        {selectedPlan?.isGift && (
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🎁</span>
              <span className="text-yellow-300 font-medium text-sm">Annual Gift Plan Benefits</span>
            </div>
            <div className="text-xs text-yellow-200 space-y-1">
              <div>• Premium Keyword Clustering Engine access</div>
              <div>• 500 bonus search credits included</div>
              <div>• 12-month duration (non-renewable)</div>
              <div>• Perfect for client gifts or promotional campaigns</div>
            </div>
          </div>
        )}

        {/* Notes Input */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={selectedPlan?.isGift ? "Gift recipient info, campaign details, expiration notes..." : "Special pricing reason..."}
            rows={2}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm resize-none"
            disabled={isLoading}
          />
        </div>

        {/* Apply Button */}
        <Button
          type="submit"
          disabled={isLoading || !userEmail.trim() || !customPriceMonthly || !customPriceYearly}
          className={`w-full font-medium ${selectedPlan?.isGift ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              {selectedPlan?.isGift ? 'Setting up Gift...' : 'Applying...'}
            </div>
          ) : (
            selectedPlan?.isGift ? '🎁 Apply Gift Plan' : 'Apply Custom Pricing'
          )}
        </Button>
      </form>
    </div>
  );
};

export default CustomPricingWidget;
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
    { value: 'enterprise', label: 'Enterprise Plan', features: ['7 users', 'Unlimited companies', 'Unlimited searches'] }
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
            <div className="mt-1 text-xs text-gray-400">
              Features: {selectedPlan.features.join(', ')}
            </div>
          )}
        </div>

        {/* Custom Pricing Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Monthly Price ($)
            </label>
            <input
              type="number"
              value={customPriceMonthly}
              onChange={(e) => setCustomPriceMonthly(e.target.value)}
              placeholder="47"
              min="1"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Yearly Price ($)
            </label>
            <input
              type="number"
              value={customPriceYearly}
              onChange={(e) => setCustomPriceYearly(e.target.value)}
              placeholder="37"
              min="1"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Notes Input */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special pricing reason..."
            rows={2}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm resize-none"
            disabled={isLoading}
          />
        </div>

        {/* Apply Button */}
        <Button
          type="submit"
          disabled={isLoading || !userEmail.trim() || !customPriceMonthly || !customPriceYearly}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Applying...
            </div>
          ) : (
            'Apply Custom Pricing'
          )}
        </Button>
      </form>
    </div>
  );
};

export default CustomPricingWidget;
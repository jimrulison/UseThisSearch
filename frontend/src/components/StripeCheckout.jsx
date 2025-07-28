import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Check, CreditCard, Loader2, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useBilling } from '../contexts/BillingContext';
import { useToast } from '../hooks/use-toast';

// Load Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key_here');

const PRICING_PLANS = {
  solo: {
    name: 'Solo',
    monthly: 47,
    yearly: 37,
    features: [
      '200 searches per month',
      '1 company workspace',
      '1 user account',
      'All 6 content generators',
      'Basic analytics',
      'Email support'
    ],
    color: 'blue'
  },
  professional: {
    name: 'Professional',
    monthly: 97,
    yearly: 77,
    features: [
      '500 searches per month',
      '5 company workspaces',
      '2 user accounts',
      'All 6 content generators',
      'Enhanced analytics',
      'Priority email support'
    ],
    color: 'purple',
    popular: true
  },
  agency: {
    name: 'Agency',
    monthly: 197,
    yearly: 157,
    features: [
      '2,000 searches per month',
      'Unlimited companies',
      '5 user accounts',
      'All 6 content generators',
      'Advanced analytics',
      'Priority processing',
      'Client reports',
      'Chat support'
    ],
    color: 'green'
  },
  enterprise: {
    name: 'Enterprise',
    monthly: 397,
    yearly: 317,
    features: [
      'Unlimited searches',
      'Unlimited companies',
      '7 user accounts',
      'All 6 content generators',
      'Advanced analytics',
      'White-label options',
      'API access',
      'Team collaboration',
      'Phone support'
    ],
    color: 'gold'
  }
};

const CheckoutForm = ({ selectedPlan, billingPeriod, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { createSubscription } = useBilling();
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    const cardElement = elements.getElement(CardElement);

    try {
      // Create payment method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        setPaymentError(error.message);
        setIsProcessing(false);
        return;
      }

      // Create subscription
      const result = await createSubscription(
        selectedPlan,
        billingPeriod,
        paymentMethod.id
      );

      if (result.success) {
        toast({
          title: "Subscription Created!",
          description: `Successfully subscribed to ${PRICING_PLANS[selectedPlan].name} plan.`,
          duration: 5000,
        });
        onSuccess(result.subscription);
      } else {
        setPaymentError(result.error);
      }

    } catch (error) {
      setPaymentError(error.message || 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const plan = PRICING_PLANS[selectedPlan];
  const price = billingPeriod === 'yearly' ? plan.yearly : plan.monthly;
  const annualSavings = billingPeriod === 'yearly' ? (plan.monthly * 12) - (plan.yearly * 12) : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">
          {plan.name} Plan - ${price}/{billingPeriod === 'yearly' ? 'year' : 'month'}
        </h3>
        {billingPeriod === 'yearly' && annualSavings > 0 && (
          <p className="text-sm text-green-600">Save ${annualSavings}/year with annual billing!</p>
        )}
      </div>

      <div className="border rounded-lg p-4">
        <label className="block text-sm font-medium mb-2">
          Card Information
        </label>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>

      {paymentError && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          {paymentError}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={isProcessing}
        >
          Cancel
        </Button>
        
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 flex items-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4" />
              Subscribe ${price}/{billingPeriod === 'yearly' ? 'year' : 'month'}
            </>
          )}
        </Button>
      </div>

      <div className="text-xs text-gray-500 text-center">
        <p>🔒 Secure payment powered by Stripe</p>
        <p>14-day free trial • Cancel anytime</p>
      </div>
    </form>
  );
};

const PlanCard = ({ planKey, plan, selectedPlan, setSelectedPlan, billingPeriod }) => {
  const price = billingPeriod === 'yearly' ? plan.yearly : plan.monthly;
  const monthlyPrice = plan.monthly;
  const savings = billingPeriod === 'yearly' ? Math.round(((monthlyPrice * 12) - (price * 12)) / (monthlyPrice * 12) * 100) : 0;

  return (
    <Card 
      className={`relative cursor-pointer transition-all hover:shadow-lg ${
        selectedPlan === planKey ? 'ring-2 ring-blue-500 shadow-lg' : ''
      } ${plan.popular ? 'border-purple-500' : ''}`}
      onClick={() => setSelectedPlan(planKey)}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-purple-500 text-white px-3 py-1">
            Most Popular
          </Badge>
        </div>
      )}
      
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          {selectedPlan === planKey && <Check className="h-5 w-5 text-green-500" />}
          {plan.name}
        </CardTitle>
        <div className="space-y-1">
          <div className="text-3xl font-bold">
            ${price}
            <span className="text-lg font-normal text-gray-500">
              /{billingPeriod === 'yearly' ? 'year' : 'month'}
            </span>
          </div>
          {billingPeriod === 'yearly' && savings > 0 && (
            <p className="text-sm text-green-600">Save {savings}% annually</p>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <ul className="space-y-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

const StripeCheckout = ({ isOpen, onClose, initialPlan = 'professional' }) => {
  const [selectedPlan, setSelectedPlan] = useState(initialPlan);
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [showCheckout, setShowCheckout] = useState(false);
  const { subscription, loadBillingData } = useBilling();

  const handleProceedToCheckout = () => {
    setShowCheckout(true);
  };

  const handleCheckoutSuccess = async (newSubscription) => {
    await loadBillingData(); // Refresh billing data
    setShowCheckout(false);
    onClose();
  };

  const handleCheckoutCancel = () => {
    setShowCheckout(false);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {showCheckout ? 'Complete Your Subscription' : 'Choose Your Plan'}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {!showCheckout && (
            <div className="text-center mt-2">
              <p className="text-gray-600 text-sm">
                We will change your plan immediately and charge for the difference in your current plan versus your new plan.
              </p>
            </div>
          )}
        </DialogHeader>

        {!showCheckout ? (
          <div className="space-y-6">
            {/* Billing Period Toggle */}
            <div className="flex justify-center">
              <div className="bg-gray-100 rounded-lg p-1 flex">
                <button
                  type="button"
                  onClick={() => setBillingPeriod('monthly')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    billingPeriod === 'monthly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingPeriod('yearly')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    billingPeriod === 'yearly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Yearly
                  <Badge variant="secondary" className="ml-2">Save 20%</Badge>
                </button>
              </div>
            </div>

            {/* Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(PRICING_PLANS).map(([planKey, plan]) => (
                <PlanCard
                  key={planKey}
                  planKey={planKey}
                  plan={plan}
                  selectedPlan={selectedPlan}
                  setSelectedPlan={setSelectedPlan}
                  billingPeriod={billingPeriod}
                />
              ))}
            </div>

            {/* Selected Plan Summary */}
            {selectedPlan && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Selected Plan:</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{PRICING_PLANS[selectedPlan].name} Plan</p>
                    <p className="text-sm text-gray-600">
                      ${billingPeriod === 'yearly' ? PRICING_PLANS[selectedPlan].yearly : PRICING_PLANS[selectedPlan].monthly}
                      /{billingPeriod === 'yearly' ? 'year' : 'month'}
                    </p>
                  </div>
                  <Button onClick={handleProceedToCheckout}>
                    Continue to Payment
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Elements stripe={stripePromise}>
            <CheckoutForm
              selectedPlan={selectedPlan}
              billingPeriod={billingPeriod}
              onSuccess={handleCheckoutSuccess}
              onCancel={handleCheckoutCancel}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StripeCheckout;
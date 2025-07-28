import stripe
import os
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from models.billing_models import (
    PlanType, 
    BillingPeriod, 
    SubscriptionStatus,
    get_plan_price,
    PRICING_CONFIG
)

logger = logging.getLogger(__name__)

class StripeService:
    def __init__(self):
        # Initialize Stripe with API key from environment
        stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
        self.webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
        
        # Create products and prices in Stripe if they don't exist
        self._ensure_products_exist()
    
    def _ensure_products_exist(self):
        """Ensure all our products and prices exist in Stripe"""
        try:
            # This would typically be run once during setup
            # For demo purposes, we'll create products dynamically
            pass
        except Exception as e:
            logger.error(f"Error ensuring Stripe products exist: {e}")
    
    async def create_customer(self, user_email: str, user_name: str = None) -> str:
        """Create a Stripe customer"""
        try:
            customer = stripe.Customer.create(
                email=user_email,
                name=user_name or user_email,
                metadata={
                    'user_id': user_email,
                    'created_via': 'use_this_search'
                }
            )
            logger.info(f"Created Stripe customer for {user_email}: {customer.id}")
            return customer.id
        except Exception as e:
            logger.error(f"Error creating Stripe customer: {e}")
            raise
    
    async def create_custom_subscription(
        self, 
        customer_id: str, 
        plan_type: PlanType,
        billing_period: BillingPeriod,
        custom_price: int,
        trial_days: int = 0
    ) -> Dict[str, Any]:
        """Create a subscription with custom pricing"""
        try:
            # Create price object in Stripe with custom amount
            price = stripe.Price.create(
                unit_amount=custom_price * 100,  # Convert to cents
                currency='usd',
                recurring={
                    'interval': 'month' if billing_period == BillingPeriod.MONTHLY else 'year'
                },
                product_data={
                    'name': f'Use This Search - {plan_type.value.title()} Plan (Custom)',
                    'metadata': {
                        'plan_type': plan_type.value,
                        'billing_period': billing_period.value,
                        'custom_pricing': 'true',
                        'custom_price': str(custom_price)
                    }
                }
            )
            
            # Create subscription
            subscription_params = {
                'customer': customer_id,
                'items': [{'price': price.id}],
                'expand': ['latest_invoice.payment_intent'],
                'metadata': {
                    'plan_type': plan_type.value,
                    'billing_period': billing_period.value,
                    'custom_pricing': 'true',
                    'custom_price': str(custom_price)
                }
            }
            
            # Add trial if specified
            if trial_days > 0:
                subscription_params['trial_period_days'] = trial_days
            
            subscription = stripe.Subscription.create(**subscription_params)
            
            logger.info(f"Created custom subscription {subscription.id} for customer {customer_id} with price ${custom_price}")
            
            return {
                'subscription_id': subscription.id,
                'status': subscription.status,
                'current_period_start': datetime.fromtimestamp(subscription.current_period_start),
                'current_period_end': datetime.fromtimestamp(subscription.current_period_end),
                'trial_end': datetime.fromtimestamp(subscription.trial_end) if subscription.trial_end else None,
                'client_secret': subscription.latest_invoice.payment_intent.client_secret if subscription.latest_invoice else None
            }
            
        except Exception as e:
            logger.error(f"Error creating custom subscription: {e}")
            raise
    
    async def create_subscription(
        self, 
        customer_id: str, 
        plan_type: PlanType,
        billing_period: BillingPeriod,
        trial_days: int = 14
    ) -> Dict[str, Any]:
        """Create a subscription with trial period"""
        try:
            # Calculate price
            price_amount = get_plan_price(plan_type, billing_period)
            
            # Create price object in Stripe
            price = stripe.Price.create(
                unit_amount=price_amount * 100,  # Convert to cents
                currency='usd',
                recurring={
                    'interval': 'month' if billing_period == BillingPeriod.MONTHLY else 'year'
                },
                product_data={
                    'name': f'Use This Search - {plan_type.value.title()} Plan',
                    'metadata': {
                        'plan_type': plan_type.value,
                        'billing_period': billing_period.value
                    }
                }
            )
            
            # Create subscription with trial
            subscription = stripe.Subscription.create(
                customer=customer_id,
                items=[{'price': price.id}],
                trial_period_days=trial_days,
                expand=['latest_invoice.payment_intent'],
                metadata={
                    'plan_type': plan_type.value,
                    'billing_period': billing_period.value
                }
            )
            
            logger.info(f"Created subscription {subscription.id} for customer {customer_id}")
            
            return {
                'subscription_id': subscription.id,
                'status': subscription.status,
                'current_period_start': datetime.fromtimestamp(subscription.current_period_start),
                'current_period_end': datetime.fromtimestamp(subscription.current_period_end),
                'trial_end': datetime.fromtimestamp(subscription.trial_end) if subscription.trial_end else None,
                'client_secret': subscription.latest_invoice.payment_intent.client_secret if subscription.latest_invoice else None
            }
            
        except Exception as e:
            logger.error(f"Error creating subscription: {e}")
            raise
    
    async def update_subscription(
        self, 
        subscription_id: str, 
        new_plan_type: PlanType,
        new_billing_period: BillingPeriod
    ) -> Dict[str, Any]:
        """Update existing subscription to new plan"""
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            
            # Calculate new price
            new_price_amount = get_plan_price(new_plan_type, new_billing_period)
            
            # Create new price
            new_price = stripe.Price.create(
                unit_amount=new_price_amount * 100,
                currency='usd',
                recurring={
                    'interval': 'month' if new_billing_period == BillingPeriod.MONTHLY else 'year'
                },
                product_data={
                    'name': f'Use This Search - {new_plan_type.value.title()} Plan',
                    'metadata': {
                        'plan_type': new_plan_type.value,
                        'billing_period': new_billing_period.value
                    }
                }
            )
            
            # Update subscription
            updated_subscription = stripe.Subscription.modify(
                subscription_id,
                items=[{
                    'id': subscription['items']['data'][0].id,
                    'price': new_price.id,
                }],
                proration_behavior='immediate_with_remainder',
                metadata={
                    'plan_type': new_plan_type.value,
                    'billing_period': new_billing_period.value
                }
            )
            
            logger.info(f"Updated subscription {subscription_id} to {new_plan_type.value}")
            
            return {
                'subscription_id': updated_subscription.id,
                'status': updated_subscription.status,
                'current_period_start': datetime.fromtimestamp(updated_subscription.current_period_start),
                'current_period_end': datetime.fromtimestamp(updated_subscription.current_period_end)
            }
            
        except Exception as e:
            logger.error(f"Error updating subscription: {e}")
            raise
    
    async def cancel_subscription(self, subscription_id: str, at_period_end: bool = True) -> bool:
        """Cancel a subscription"""
        try:
            if at_period_end:
                subscription = stripe.Subscription.modify(
                    subscription_id,
                    cancel_at_period_end=True
                )
            else:
                subscription = stripe.Subscription.delete(subscription_id)
            
            logger.info(f"Canceled subscription {subscription_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error canceling subscription: {e}")
            return False
    
    async def get_subscription(self, subscription_id: str) -> Optional[Dict[str, Any]]:
        """Get subscription details from Stripe"""
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            
            return {
                'id': subscription.id,
                'status': subscription.status,
                'current_period_start': datetime.fromtimestamp(subscription.current_period_start),
                'current_period_end': datetime.fromtimestamp(subscription.current_period_end),
                'trial_end': datetime.fromtimestamp(subscription.trial_end) if subscription.trial_end else None,
                'cancel_at_period_end': subscription.cancel_at_period_end,
                'canceled_at': datetime.fromtimestamp(subscription.canceled_at) if subscription.canceled_at else None
            }
            
        except Exception as e:
            logger.error(f"Error retrieving subscription: {e}")
            return None
    
    async def create_payment_intent(
        self, 
        amount: int, 
        customer_id: str,
        metadata: Dict[str, str] = None
    ) -> Dict[str, Any]:
        """Create a payment intent for one-time payments"""
        try:
            intent = stripe.PaymentIntent.create(
                amount=amount * 100,  # Convert to cents
                currency='usd',
                customer=customer_id,
                metadata=metadata or {}
            )
            
            return {
                'client_secret': intent.client_secret,
                'payment_intent_id': intent.id
            }
            
        except Exception as e:
            logger.error(f"Error creating payment intent: {e}")
            raise
    
    def handle_webhook(self, payload: str, sig_header: str) -> Optional[Dict[str, Any]]:
        """Handle Stripe webhook events"""
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, self.webhook_secret
            )
            
            logger.info(f"Received Stripe webhook: {event['type']}")
            
            return {
                'type': event['type'],
                'data': event['data']['object']
            }
            
        except ValueError as e:
            logger.error(f"Invalid payload in webhook: {e}")
            return None
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid signature in webhook: {e}")
            return None
        except Exception as e:
            logger.error(f"Error handling webhook: {e}")
            return None

# Singleton instance
_stripe_service = None

def get_stripe_service() -> StripeService:
    """Get or create Stripe service instance"""
    global _stripe_service
    if _stripe_service is None:
        _stripe_service = StripeService()
    return _stripe_service
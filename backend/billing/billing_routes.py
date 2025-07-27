from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
from typing import List, Optional
import logging
from datetime import datetime

from models.billing_models import (
    UserSubscription,
    SubscriptionCreate,
    SubscriptionUpdate,
    BillingDashboard,
    PaymentHistory,
    BillingAlert,
    PlanType,
    BillingPeriod,
    PRICING_CONFIG
)
from billing.stripe_service import get_stripe_service
from billing.usage_tracker import get_usage_tracker
from database import db

logger = logging.getLogger(__name__)
router = APIRouter()

def get_user_id_from_request(request: Request) -> str:
    """Extract user ID from request headers (same as existing system)"""
    user_id = request.headers.get("X-User-ID")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID required")
    return user_id

@router.get("/pricing")
async def get_pricing_config():
    """Get current pricing configuration - easily changeable"""
    return {
        "plans": PRICING_CONFIG,
        "currency": "USD",
        "trial_days": 14,
        "features_comparison": {
            "solo": ["200 searches/month", "1 company", "Basic support"],
            "professional": ["500 searches/month", "5 companies", "Priority support"],
            "agency": ["2000 searches/month", "Unlimited companies", "Chat support", "Client reports"],
            "enterprise": ["Unlimited searches", "Unlimited companies", "White-label", "API access", "Phone support"]
        }
    }

@router.get("/subscription", response_model=Optional[UserSubscription])
async def get_user_subscription(request: Request):
    """Get user's current subscription"""
    try:
        user_id = get_user_id_from_request(request)
        usage_tracker = get_usage_tracker()
        
        subscription = await usage_tracker.get_user_subscription(user_id)
        return subscription
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching subscription: {e}")
        raise HTTPException(status_code=500, detail="Error fetching subscription")

@router.post("/subscription", response_model=UserSubscription)
async def create_subscription(subscription_data: SubscriptionCreate, request: Request):
    """Create a new subscription"""
    try:
        user_id = get_user_id_from_request(request)
        stripe_service = get_stripe_service()
        
        # Check if user already has active subscription
        existing_subscription = await db.user_subscriptions.find_one({
            "user_id": user_id,
            "status": {"$in": ["active", "trialing"]}
        })
        
        if existing_subscription:
            raise HTTPException(status_code=400, detail="User already has active subscription")
        
        # Create or get Stripe customer
        stripe_customer_id = None
        existing_customer = await db.user_subscriptions.find_one({"user_id": user_id})
        
        if existing_customer and existing_customer.get("stripe_customer_id"):
            stripe_customer_id = existing_customer["stripe_customer_id"]
        else:
            stripe_customer_id = await stripe_service.create_customer(user_id)
        
        # Create Stripe subscription
        stripe_subscription = await stripe_service.create_subscription(
            customer_id=stripe_customer_id,
            plan_type=subscription_data.plan_type,
            billing_period=subscription_data.billing_period,
            trial_days=14
        )
        
        # Create subscription record in our database
        new_subscription = UserSubscription(
            user_id=user_id,
            plan_type=subscription_data.plan_type,
            billing_period=subscription_data.billing_period,
            stripe_customer_id=stripe_customer_id,
            stripe_subscription_id=stripe_subscription["subscription_id"],
            current_period_start=stripe_subscription["current_period_start"],
            current_period_end=stripe_subscription["current_period_end"],
            trial_end=stripe_subscription["trial_end"]
        )
        
        await db.user_subscriptions.insert_one(new_subscription.dict())
        logger.info(f"Created subscription for {user_id}: {subscription_data.plan_type.value}")
        
        return new_subscription
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating subscription: {e}")
        raise HTTPException(status_code=500, detail="Error creating subscription")

@router.put("/subscription", response_model=UserSubscription)
async def update_subscription(subscription_data: SubscriptionUpdate, request: Request):
    """Update existing subscription"""
    try:
        user_id = get_user_id_from_request(request)
        
        # Get current subscription
        current_subscription = await db.user_subscriptions.find_one({
            "user_id": user_id,
            "status": {"$in": ["active", "trialing"]}
        })
        
        if not current_subscription:
            raise HTTPException(status_code=404, detail="No active subscription found")
        
        subscription = UserSubscription(**current_subscription)
        
        # Update plan if provided
        if subscription_data.plan_type:
            subscription.plan_type = subscription_data.plan_type
        
        if subscription_data.billing_period:
            subscription.billing_period = subscription_data.billing_period
        
        # Update in Stripe
        stripe_service = get_stripe_service()
        updated_stripe_subscription = await stripe_service.update_subscription(
            subscription.stripe_subscription_id,
            subscription.plan_type,
            subscription.billing_period
        )
        
        # Update in our database
        subscription.current_period_start = updated_stripe_subscription["current_period_start"]
        subscription.current_period_end = updated_stripe_subscription["current_period_end"]
        subscription.updated_at = datetime.utcnow()
        
        await db.user_subscriptions.update_one(
            {"id": subscription.id},
            {"$set": subscription.dict()}
        )
        
        logger.info(f"Updated subscription for {user_id}")
        return subscription
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating subscription: {e}")
        raise HTTPException(status_code=500, detail="Error updating subscription")

@router.delete("/subscription")
async def cancel_subscription(request: Request):
    """Cancel user's subscription"""
    try:
        user_id = get_user_id_from_request(request)
        
        # Get current subscription
        current_subscription = await db.user_subscriptions.find_one({
            "user_id": user_id,
            "status": {"$in": ["active", "trialing"]}
        })
        
        if not current_subscription:
            raise HTTPException(status_code=404, detail="No active subscription found")
        
        subscription = UserSubscription(**current_subscription)
        
        # Cancel in Stripe
        stripe_service = get_stripe_service()
        success = await stripe_service.cancel_subscription(
            subscription.stripe_subscription_id,
            at_period_end=True
        )
        
        if success:
            # Update status in our database
            await db.user_subscriptions.update_one(
                {"id": subscription.id},
                {
                    "$set": {
                        "status": "canceled",
                        "canceled_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            logger.info(f"Canceled subscription for {user_id}")
            return {"message": "Subscription canceled successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to cancel subscription")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error canceling subscription: {e}")
        raise HTTPException(status_code=500, detail="Error canceling subscription")

@router.get("/usage")
async def get_usage_limits(request: Request):
    """Get user's current usage and limits"""
    try:
        user_id = get_user_id_from_request(request)
        usage_tracker = get_usage_tracker()
        
        limits = await usage_tracker.get_usage_limits(user_id)
        return limits
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching usage limits: {e}")
        raise HTTPException(status_code=500, detail="Error fetching usage limits")

@router.get("/dashboard", response_model=BillingDashboard) 
async def get_billing_dashboard(request: Request):
    """Get complete billing dashboard data"""
    try:
        user_id = get_user_id_from_request(request)
        usage_tracker = get_usage_tracker()
        
        # Get subscription
        subscription = await usage_tracker.get_user_subscription(user_id)
        
        # Get usage limits
        usage = await usage_tracker.get_usage_limits(user_id)
        
        # Get payment history
        payment_history_cursor = db.payment_history.find({
            "user_id": user_id
        }).sort("created_at", -1).limit(10)
        
        payment_history = []
        async for payment in payment_history_cursor:
            payment_history.append(PaymentHistory(**payment))
        
        # Get active alerts
        alerts_cursor = db.billing_alerts.find({
            "user_id": user_id,
            "acknowledged": False
        }).sort("created_at", -1)
        
        alerts = []
        async for alert in alerts_cursor:
            alerts.append(BillingAlert(**alert))
        
        return BillingDashboard(
            subscription=subscription,
            usage=usage,
            payment_history=payment_history,
            alerts=alerts,
            pricing_config=PRICING_CONFIG
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching billing dashboard: {e}")
        raise HTTPException(status_code=500, detail="Error fetching billing dashboard")

@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str, request: Request):
    """Acknowledge a billing alert"""
    try:
        user_id = get_user_id_from_request(request)
        
        result = await db.billing_alerts.update_one(
            {
                "id": alert_id,
                "user_id": user_id
            },
            {
                "$set": {
                    "acknowledged": True,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        return {"message": "Alert acknowledged"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error acknowledging alert: {e}")
        raise HTTPException(status_code=500, detail="Error acknowledging alert")

@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    try:
        payload = await request.body()
        sig_header = request.headers.get('stripe-signature')
        
        stripe_service = get_stripe_service()
        event = stripe_service.handle_webhook(payload.decode(), sig_header)
        
        if not event:
            raise HTTPException(status_code=400, detail="Invalid webhook")
        
        # Handle different webhook events
        if event['type'] == 'invoice.payment_succeeded':
            await _handle_payment_succeeded(event['data'])
        elif event['type'] == 'invoice.payment_failed':
            await _handle_payment_failed(event['data'])
        elif event['type'] == 'customer.subscription.updated':
            await _handle_subscription_updated(event['data'])
        elif event['type'] == 'customer.subscription.deleted':
            await _handle_subscription_canceled(event['data'])
        
        return {"received": True}
        
    except Exception as e:
        logger.error(f"Error handling webhook: {e}")
        raise HTTPException(status_code=500, detail="Webhook error")

async def _handle_payment_succeeded(invoice_data):
    """Handle successful payment webhook"""
    try:
        subscription_id = invoice_data.get('subscription')
        if not subscription_id:
            return
        
        # Find subscription in our database
        subscription_record = await db.user_subscriptions.find_one({
            "stripe_subscription_id": subscription_id
        })
        
        if subscription_record:
            # Create payment history record
            payment = PaymentHistory(
                user_id=subscription_record["user_id"],
                subscription_id=subscription_record["id"],
                amount=invoice_data.get('amount_paid', 0),
                status="succeeded",
                plan_type=subscription_record["plan_type"],
                billing_period=subscription_record["billing_period"]
            )
            
            await db.payment_history.insert_one(payment.dict())
            
            # Reset usage for the new billing period
            usage_tracker = get_usage_tracker()
            await usage_tracker.reset_monthly_usage(subscription_record["user_id"])
            
            logger.info(f"Payment succeeded for user: {subscription_record['user_id']}")
            
    except Exception as e:
        logger.error(f"Error handling payment success: {e}")

async def _handle_payment_failed(invoice_data):
    """Handle failed payment webhook"""
    try:
        subscription_id = invoice_data.get('subscription')
        if not subscription_id:
            return
        
        # Find subscription in our database
        subscription_record = await db.user_subscriptions.find_one({
            "stripe_subscription_id": subscription_id
        })
        
        if subscription_record:
            # Create alert for payment failure
            alert = BillingAlert(
                user_id=subscription_record["user_id"],
                alert_type="payment_failed",
                message="Your payment failed. Please update your payment method to continue using the service."
            )
            
            await db.billing_alerts.insert_one(alert.dict())
            logger.info(f"Payment failed for user: {subscription_record['user_id']}")
            
    except Exception as e:
        logger.error(f"Error handling payment failure: {e}")

async def _handle_subscription_updated(subscription_data):
    """Handle subscription update webhook"""
    # Implementation for subscription updates
    pass

async def _handle_subscription_canceled(subscription_data):
    """Handle subscription cancellation webhook"""
    # Implementation for subscription cancellations
    pass
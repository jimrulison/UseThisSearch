from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
from typing import List, Optional
import logging
from datetime import datetime, timedelta

from models.billing_models import (
    CustomPricing,
    CustomPricingCreate,
    CustomPricingHistory,
    UserSubscription,
    PlanType,
    BillingPeriod,
    get_plan_price,
    PRICING_CONFIG
)
from models.admin_models import Admin
from billing.stripe_service import get_stripe_service
from billing.usage_tracker import get_usage_tracker
from database import db
import uuid

logger = logging.getLogger(__name__)
router = APIRouter()

async def get_admin_from_request(request: Request) -> Admin:
    """Extract admin user from request - reuse from admin_routes.py"""
    # For now, get from authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    
    token = auth_header.split(" ")[1]
    
    # Find admin session in database
    session = await db.admin_sessions.find_one({
        "token": token,
        "expires_at": {"$gt": datetime.utcnow()}
    })
    
    if not session:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Get admin user
    admin = await db.admin_users.find_one({"email": session["admin_email"]})
    if not admin:
        raise HTTPException(status_code=401, detail="Admin user not found")
    
    return Admin(**admin)

@router.post("/apply", response_model=CustomPricing)
async def apply_custom_pricing(
    pricing_data: CustomPricingCreate,
    request: Request
):
    """Apply custom pricing to a user - overrides their current subscription"""
    try:
        admin = await get_admin_from_request(request)
        
        # Validate user exists
        user_exists = await db.search_history.find_one({"user_id": pricing_data.user_email})
        if not user_exists:
            # Check if user has any activity in the system
            company_exists = await db.companies.find_one({"user_id": pricing_data.user_email})
            if not company_exists:
                raise HTTPException(status_code=404, detail="User not found in system")
        
        # Check if user already has custom pricing
        existing_custom = await db.custom_pricing.find_one({
            "user_email": pricing_data.user_email,
            "status": "active"
        })
        
        if existing_custom:
            # Cancel existing custom pricing
            await db.custom_pricing.update_one(
                {"id": existing_custom["id"]},
                {
                    "$set": {
                        "status": "canceled",
                        "updated_at": datetime.utcnow()
                    }
                }
            )
        
        # Get current subscription if exists
        current_subscription = await db.user_subscriptions.find_one({
            "user_id": pricing_data.user_email,
            "status": {"$in": ["active", "trialing"]}
        })
        
        stripe_service = get_stripe_service()
        stripe_customer_id = None
        stripe_subscription_id = None
        
        # Create or get Stripe customer
        if current_subscription and current_subscription.get("stripe_customer_id"):
            stripe_customer_id = current_subscription["stripe_customer_id"]
            stripe_subscription_id = current_subscription["stripe_subscription_id"]
            
            # Cancel existing subscription
            if stripe_subscription_id:
                await stripe_service.cancel_subscription(
                    stripe_subscription_id, 
                    at_period_end=False
                )
        else:
            # Create new Stripe customer
            stripe_customer_id = await stripe_service.create_customer(pricing_data.user_email)
        
        # Create custom pricing record
        custom_pricing = CustomPricing(
            user_email=pricing_data.user_email,
            plan_type=pricing_data.plan_type,
            custom_price_monthly=pricing_data.custom_price_monthly,
            custom_price_yearly=pricing_data.custom_price_yearly,
            applied_by=admin.email,
            stripe_customer_id=stripe_customer_id,
            notes=pricing_data.notes
        )
        
        # Insert custom pricing record
        await db.custom_pricing.insert_one(custom_pricing.dict())
        
        # Create a custom subscription with the new pricing
        # Start with monthly by default - user can change later
        custom_subscription = await stripe_service.create_custom_subscription(
            customer_id=stripe_customer_id,
            plan_type=pricing_data.plan_type,
            billing_period=BillingPeriod.MONTHLY,
            custom_price=pricing_data.custom_price_monthly,
            trial_days=0  # No trial for custom pricing
        )
        
        # Update the custom pricing record with subscription ID
        custom_pricing.stripe_subscription_id = custom_subscription["subscription_id"]
        await db.custom_pricing.update_one(
            {"id": custom_pricing.id},
            {"$set": {"stripe_subscription_id": custom_subscription["subscription_id"]}}
        )
        
        # Create/Update user subscription record
        new_subscription = UserSubscription(
            user_id=pricing_data.user_email,
            plan_type=pricing_data.plan_type,
            billing_period=BillingPeriod.MONTHLY,
            stripe_customer_id=stripe_customer_id,
            stripe_subscription_id=custom_subscription["subscription_id"],
            current_period_start=custom_subscription["current_period_start"],
            current_period_end=custom_subscription["current_period_end"]
        )
        
        # Remove old subscription
        if current_subscription:
            await db.user_subscriptions.delete_one({"id": current_subscription["id"]})
        
        # Insert new subscription
        await db.user_subscriptions.insert_one(new_subscription.dict())
        
        # Create history record
        history_record = CustomPricingHistory(
            custom_pricing_id=custom_pricing.id,
            user_email=pricing_data.user_email,
            action="applied",
            applied_by=admin.email,
            new_values={
                "plan_type": pricing_data.plan_type.value,
                "custom_price_monthly": pricing_data.custom_price_monthly,
                "custom_price_yearly": pricing_data.custom_price_yearly
            }
        )
        await db.custom_pricing_history.insert_one(history_record.dict())
        
        logger.info(f"Applied custom pricing for {pricing_data.user_email} by {admin.email}")
        
        return custom_pricing
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error applying custom pricing: {e}")
        raise HTTPException(status_code=500, detail="Error applying custom pricing")

@router.get("/user/{user_email}", response_model=Optional[CustomPricing])
async def get_user_custom_pricing(
    user_email: str,
    request: Request
):
    """Get custom pricing for a specific user"""
    try:
        admin = await get_admin_from_request(request)
        
        custom_pricing = await db.custom_pricing.find_one({
            "user_email": user_email,
            "status": "active"
        })
        
        if not custom_pricing:
            return None
            
        return CustomPricing(**custom_pricing)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching custom pricing: {e}")
        raise HTTPException(status_code=500, detail="Error fetching custom pricing")

@router.get("/history", response_model=List[CustomPricingHistory])
async def get_custom_pricing_history(
    request: Request,
    limit: int = 50,
    skip: int = 0
):
    """Get history of all custom pricing changes"""
    try:
        admin = await get_admin_from_request(request)
        
        history_cursor = db.custom_pricing_history.find().sort("created_at", -1).skip(skip).limit(limit)
        
        history = []
        async for record in history_cursor:
            history.append(CustomPricingHistory(**record))
        
        return history
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching custom pricing history: {e}")
        raise HTTPException(status_code=500, detail="Error fetching history")

@router.get("/active", response_model=List[CustomPricing])
async def get_all_active_custom_pricing(
    request: Request,
    limit: int = 100,
    skip: int = 0
):
    """Get all active custom pricing records"""
    try:
        admin = await get_admin_from_request(request)
        
        pricing_cursor = db.custom_pricing.find({
            "status": "active"
        }).sort("created_at", -1).skip(skip).limit(limit)
        
        pricing_records = []
        async for record in pricing_cursor:
            pricing_records.append(CustomPricing(**record))
        
        return pricing_records
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching active custom pricing: {e}")
        raise HTTPException(status_code=500, detail="Error fetching active custom pricing")

@router.delete("/user/{user_email}")
async def cancel_user_custom_pricing(
    user_email: str,
    request: Request
):
    """Cancel custom pricing for a user (revert to standard pricing)"""
    try:
        admin = await get_admin_from_request(request)
        
        # Find active custom pricing
        custom_pricing = await db.custom_pricing.find_one({
            "user_email": user_email,
            "status": "active"
        })
        
        if not custom_pricing:
            raise HTTPException(status_code=404, detail="No active custom pricing found for user")
        
        # Cancel the custom pricing
        await db.custom_pricing.update_one(
            {"id": custom_pricing["id"]},
            {
                "$set": {
                    "status": "canceled",
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Cancel Stripe subscription if exists
        if custom_pricing.get("stripe_subscription_id"):
            stripe_service = get_stripe_service()
            await stripe_service.cancel_subscription(
                custom_pricing["stripe_subscription_id"],
                at_period_end=False
            )
        
        # Update user subscription status
        await db.user_subscriptions.update_one(
            {"user_id": user_email, "status": {"$in": ["active", "trialing"]}},
            {
                "$set": {
                    "status": "canceled",
                    "canceled_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Create history record
        history_record = CustomPricingHistory(
            custom_pricing_id=custom_pricing["id"],
            user_email=user_email,
            action="canceled",
            applied_by=admin.email,
            previous_values={
                "status": "active",
                "custom_price_monthly": custom_pricing["custom_price_monthly"],
                "custom_price_yearly": custom_pricing["custom_price_yearly"]
            },
            new_values={"status": "canceled"}
        )
        await db.custom_pricing_history.insert_one(history_record.dict())
        
        logger.info(f"Canceled custom pricing for {user_email} by {admin.email}")
        
        return {"message": "Custom pricing canceled successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error canceling custom pricing: {e}")
        raise HTTPException(status_code=500, detail="Error canceling custom pricing")
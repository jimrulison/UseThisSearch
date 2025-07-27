import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from database import db
from models.billing_models import (
    UsageTracking, 
    UserSubscription, 
    PlanType, 
    UsageLimits,
    BillingAlert,
    get_plan_limits,
    PRICING_CONFIG
)

logger = logging.getLogger(__name__)

class UsageTracker:
    """
    Safe usage tracking that wraps around existing functionality
    WITHOUT modifying any existing code
    """
    
    def __init__(self):
        self.db = db
    
    async def get_current_usage(self, user_id: str) -> UsageTracking:
        """Get or create current month's usage tracking"""
        current_month = datetime.utcnow().strftime("%Y-%m")
        
        # Try to get existing usage record
        usage_record = await self.db.usage_tracking.find_one({
            "user_id": user_id,
            "month_year": current_month
        })
        
        if usage_record:
            return UsageTracking(**usage_record)
        
        # Create new usage record for this month
        new_usage = UsageTracking(
            user_id=user_id,
            month_year=current_month,
            search_count=0,
            company_count=0
        )
        
        await self.db.usage_tracking.insert_one(new_usage.dict())
        logger.info(f"Created new usage tracking for {user_id} - {current_month}")
        
        return new_usage
    
    async def get_user_subscription(self, user_id: str) -> Optional[UserSubscription]:
        """Get user's current subscription"""
        subscription_record = await self.db.user_subscriptions.find_one({
            "user_id": user_id,
            "status": {"$in": ["active", "trialing"]}
        })
        
        if subscription_record:
            return UserSubscription(**subscription_record)
        
        # No subscription found - user is on free tier or needs to subscribe
        return None
    
    async def get_usage_limits(self, user_id: str) -> UsageLimits:
        """Get user's current usage limits and remaining quota"""
        # Get subscription (or default to solo plan)
        subscription = await self.get_user_subscription(user_id)
        plan_type = subscription.plan_type if subscription else PlanType.SOLO
        
        # Get plan limits
        plan_config = get_plan_limits(plan_type)
        search_limit = plan_config["search_limit"]
        company_limit = plan_config["company_limit"]
        user_limit = plan_config["user_limit"]
        
        # Get current usage
        usage = await self.get_current_usage(user_id)
        current_searches = usage.search_count
        
        # Count current companies (from existing companies table - safe read)
        current_companies = await self.db.companies.count_documents({
            "user_id": user_id
        })
        
        # Count current users across all companies owned by this user
        current_users = await self.db.company_users.count_documents({
            "user_id": user_id,
            "invitation_status": "active"
        })
        # Add 1 for the owner themselves
        current_users += 1
        
        # Calculate remaining quota
        searches_remaining = max(0, search_limit - current_searches) if search_limit != -1 else -1
        companies_remaining = max(0, company_limit - current_companies) if company_limit != -1 else -1
        users_remaining = max(0, user_limit - current_users) if user_limit != -1 else -1
        
        # Next reset date (first day of next month)
        next_month = datetime.utcnow().replace(day=1) + timedelta(days=32)
        reset_date = next_month.replace(day=1)
        
        return UsageLimits(
            search_limit=search_limit,
            company_limit=company_limit,
            user_limit=user_limit,
            current_searches=current_searches,
            current_companies=current_companies,
            current_users=current_users,
            searches_remaining=searches_remaining,
            companies_remaining=companies_remaining,
            users_remaining=users_remaining,
            reset_date=reset_date
        )
    
    async def can_perform_search(self, user_id: str) -> Dict[str, Any]:
        """Check if user can perform a search"""
        limits = await self.get_usage_limits(user_id)
        
        if limits.search_limit == -1:  # Unlimited
            return {"allowed": True, "reason": "unlimited_plan"}
        
        if limits.searches_remaining > 0:
            return {"allowed": True, "remaining": limits.searches_remaining}
        
        return {
            "allowed": False, 
            "reason": "limit_exceeded",
            "limit": limits.search_limit,
            "reset_date": limits.reset_date.isoformat()
        }
    
    async def can_create_company(self, user_id: str) -> Dict[str, Any]:
        """Check if user can create a new company"""
        limits = await self.get_usage_limits(user_id)
        
        if limits.company_limit == -1:  # Unlimited
            return {"allowed": True, "reason": "unlimited_plan"}
        
        if limits.companies_remaining > 0:
            return {"allowed": True, "remaining": limits.companies_remaining}
        
        return {
            "allowed": False,
            "reason": "limit_exceeded", 
            "limit": limits.company_limit,
            "current": limits.current_companies
        }
    
    async def track_search_usage(self, user_id: str) -> bool:
        """Track a search usage (called after successful search)"""
        try:
            current_month = datetime.utcnow().strftime("%Y-%m")
            
            # Increment search count
            result = await self.db.usage_tracking.update_one(
                {
                    "user_id": user_id,
                    "month_year": current_month
                },
                {
                    "$inc": {"search_count": 1},
                    "$set": {"updated_at": datetime.utcnow()}
                },
                upsert=True
            )
            
            logger.info(f"Tracked search usage for {user_id}")
            
            # Check if user is approaching limits and create alerts
            await self._check_usage_alerts(user_id)
            
            return True
            
        except Exception as e:
            logger.error(f"Error tracking search usage: {e}")
            return False
    
    async def track_company_creation(self, user_id: str) -> bool:
        """Track company creation (called after successful company creation)"""
        try:
            current_month = datetime.utcnow().strftime("%Y-%m")
            
            # Update company count (count from actual companies table)
            company_count = await self.db.companies.count_documents({
                "user_id": user_id
            })
            
            await self.db.usage_tracking.update_one(
                {
                    "user_id": user_id,
                    "month_year": current_month
                },
                {
                    "$set": {
                        "company_count": company_count,
                        "updated_at": datetime.utcnow()
                    }
                },
                upsert=True
            )
            
            logger.info(f"Tracked company creation for {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error tracking company creation: {e}")
            return False
    
    async def _check_usage_alerts(self, user_id: str) -> None:
        """Check if user needs usage alerts (80%, 90%, 100% of limits)"""
        try:
            limits = await self.get_usage_limits(user_id)
            
            if limits.search_limit == -1:  # Unlimited plan
                return
            
            usage_percentage = (limits.current_searches / limits.search_limit) * 100
            
            # Create alerts for different thresholds
            alerts_to_create = []
            
            if usage_percentage >= 100:
                alerts_to_create.append({
                    "alert_type": "usage_exceeded",
                    "message": f"You've used all {limits.search_limit} searches this month. Upgrade to continue searching."
                })
            elif usage_percentage >= 90:
                alerts_to_create.append({
                    "alert_type": "usage_warning_90",
                    "message": f"You've used {limits.current_searches} of {limits.search_limit} searches (90%). Consider upgrading soon."
                })
            elif usage_percentage >= 80:
                alerts_to_create.append({
                    "alert_type": "usage_warning_80", 
                    "message": f"You've used {limits.current_searches} of {limits.search_limit} searches (80%). Running low!"
                })
            
            # Create alerts that don't already exist
            for alert_data in alerts_to_create:
                existing_alert = await self.db.billing_alerts.find_one({
                    "user_id": user_id,
                    "alert_type": alert_data["alert_type"],
                    "acknowledged": False
                })
                
                if not existing_alert:
                    alert = BillingAlert(
                        user_id=user_id,
                        alert_type=alert_data["alert_type"],
                        message=alert_data["message"]
                    )
                    await self.db.billing_alerts.insert_one(alert.dict())
                    logger.info(f"Created billing alert for {user_id}: {alert_data['alert_type']}")
                    
        except Exception as e:
            logger.error(f"Error checking usage alerts: {e}")
    
    async def reset_monthly_usage(self, user_id: str) -> bool:
        """Reset usage counters (typically called on subscription renewal)"""
        try:
            current_month = datetime.utcnow().strftime("%Y-%m")
            
            await self.db.usage_tracking.update_one(
                {
                    "user_id": user_id,
                    "month_year": current_month
                },
                {
                    "$set": {
                        "search_count": 0,
                        "last_reset": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                },
                upsert=True
            )
            
            logger.info(f"Reset monthly usage for {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error resetting monthly usage: {e}")
            return False

# Singleton instance
_usage_tracker = None

def get_usage_tracker() -> UsageTracker:
    """Get or create usage tracker instance"""
    global _usage_tracker
    if _usage_tracker is None:
        _usage_tracker = UsageTracker()
    return _usage_tracker
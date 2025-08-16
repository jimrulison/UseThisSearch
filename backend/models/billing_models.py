from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Union
from datetime import datetime, timedelta
import uuid
from enum import Enum

class PlanType(str, Enum):
    TRIAL = "trial"
    SOLO = "solo"
    ANNUAL = "annual"
    ADDITIONAL_USER = "additional_user"
    ADDITIONAL_WORKSPACE = "additional_workspace"
    ADDITIONAL_COMPANY = "additional_company"
    # Legacy plans for backward compatibility
    PROFESSIONAL = "professional"
    AGENCY = "agency"
    ENTERPRISE = "enterprise"
    ANNUAL_GIFT = "annual_gift"

class TrialStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired" 
    CONVERTED = "converted"
    DATA_RETENTION = "data_retention"  # 30-day grace period after trial

class UserTrialInfo(BaseModel):
    trial_start_date: datetime = Field(default_factory=datetime.utcnow)
    trial_status: TrialStatus = TrialStatus.ACTIVE
    searches_used_today: int = 0
    last_search_date: Optional[datetime] = None
    trial_reminders_sent: List[int] = []  # Days on which reminders were sent
    data_retention_start: Optional[datetime] = None  # When 30-day countdown started
    
    def days_into_trial(self) -> int:
        """Calculate how many days into the trial the user is"""
        delta = datetime.utcnow() - self.trial_start_date
        return delta.days + 1  # Day 1, 2, 3, etc.
    
    def is_trial_expired(self) -> bool:
        """Check if the 7-day trial has expired"""
        return self.days_into_trial() > 7
    
    def days_remaining(self) -> int:
        """Calculate remaining trial days (can be negative)"""
        return 7 - self.days_into_trial() + 1
    
    def should_show_reminder(self) -> bool:
        """Check if user should see trial reminder popup"""
        days = self.days_into_trial()
        return days >= 4 and days <= 7
    
    def can_search_today(self) -> bool:
        """Check if user can perform more searches today"""
        if self.is_trial_expired():
            return False
        
        # Reset daily count if it's a new day
        today = datetime.utcnow().date()
        if self.last_search_date is None or self.last_search_date.date() != today:
            return True
        
        return self.searches_used_today < 25
    
    def is_data_retention_expired(self) -> bool:
        """Check if 30-day data retention period has expired"""
        if not self.data_retention_start:
            return False
        delta = datetime.utcnow() - self.data_retention_start
        return delta.days > 30

class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    CANCELED = "canceled"
    PAST_DUE = "past_due"
    INCOMPLETE = "incomplete"
    TRIALING = "trialing"

class BillingPeriod(str, Enum):
    MONTHLY = "monthly"
    YEARLY = "yearly"

# Flexible pricing configuration - easily changeable
PRICING_CONFIG = {
    "solo": {
        "monthly": 59,  # Regular price
        "yearly": 590,  # Regular price  
        "sale_monthly": 29,  # Sale price
        "sale_yearly": 290,  # Sale price
        "search_limit": -1,  # UNLIMITED searches (except trial)
        "company_limit": 1,
        "user_limit": 1,
        "workspace_limit": 1,
        "features": [
            "1 user account",
            "1 company workspace", 
            "1 workspace",
            "Unlimited searches",
            "All content generators",
            "AI-powered insights",
            "Email support"
        ]
    },
    "annual": {
        "monthly": 0,  # Annual only
        "yearly": 590,  # Regular price
        "sale_yearly": 290,  # Sale price
        "search_limit": -1,  # UNLIMITED searches
        "company_limit": 1,
        "user_limit": 1, 
        "workspace_limit": 1,
        "includes_clustering": True,  # GROUP KEYWORDS access
        "features": [
            "All Solo Plan features",
            "GROUP KEYWORDS (clustering)",
            "Strategic keyword intelligence", 
            "Content cluster analysis",
            "2 months FREE (when marketed as yearly)"
        ]
    },
    "additional_user": {
        "monthly": 10,  # Regular price
        "yearly": 120,  # Regular price
        "sale_monthly": 5,  # Sale price
        "sale_yearly": 60,  # Sale price
        "search_limit": 0,  # Add-on doesn't add searches
        "company_limit": 0,
        "user_limit": 1,  # Adds 1 user
        "workspace_limit": 0,
        "features": [
            "Extra user access",
            "Team collaboration"
        ]
    },
    "additional_workspace": {
        "monthly": 15,  # Regular price
        "yearly": 180,  # Regular price  
        "sale_monthly": 8,  # Sale price
        "sale_yearly": 96,  # Sale price
        "search_limit": 0,  # Add-on doesn't add searches
        "company_limit": 0,
        "user_limit": 0,
        "workspace_limit": 1,  # Adds 1 workspace
        "features": [
            "Extra workspace",
            "Project organization"
        ]
    },
    "additional_company": {
        "monthly": 15,  # Regular price
        "yearly": 180,  # Regular price
        "sale_monthly": 8,  # Sale price  
        "sale_yearly": 96,  # Sale price
        "search_limit": 0,  # Add-on doesn't add searches
        "company_limit": 1,  # Adds 1 company
        "user_limit": 0,
        "workspace_limit": 0,
        "features": [
            "Extra company access",
            "Multi-client management"
        ]
    },
    # Legacy plans for backward compatibility
    "professional": {
        "monthly": 97,
        "yearly": 77,
        "search_limit": -1,  # NOW unlimited
        "company_limit": 5,
        "user_limit": 2,
        "features": [
            "Unlimited searches",  # UPDATED
            "5 company workspaces",
            "2 user accounts",
            "All content generators",
            "Enhanced analytics", 
            "CSV export",
            "Priority email support"
        ]
    },
    "agency": {
        "monthly": 197,
        "yearly": 157,
        "search_limit": -1,  # NOW unlimited
        "company_limit": -1,
        "user_limit": 5,
        "features": [
            "Unlimited searches",  # UPDATED
            "Unlimited companies",
            "5 user accounts",
            "All content generators",
            "Advanced analytics",
            "Priority processing",
            "Advanced export",
            "Chat support",
            "Client reports"
        ]
    },
    "enterprise": {
        "monthly": 397,
        "yearly": 317,
        "search_limit": -1,  # Already unlimited
        "company_limit": -1,
        "user_limit": 7,
        "features": [
            "Unlimited searches",
            "Unlimited companies",
            "7 user accounts",
            "All content generators", 
            "Advanced analytics",
            "Priority processing",
            "White-label options",
            "API access",
            "Team collaboration",
            "Phone support",
            "Custom branding"
        ]
    },
    "annual_gift": {
        "monthly": 0,
        "yearly": 0,
        "search_limit": -1,  # NOW unlimited
        "company_limit": 10,
        "user_limit": 5,
        "gift_duration_months": 12,
        "includes_clustering": True,
        "bonus_credits": 500,
        "features": [
            "🎁 Annual Gift Subscription",
            "Unlimited searches",  # UPDATED
            "10 company workspaces", 
            "5 user accounts",
            "All content generators",
            "🔥 Keyword Clustering Engine",
            "Advanced analytics",
            "Priority processing",
            "Bonus 500 search credits",
            "White-label options",
            "API access",
            "Team collaboration", 
            "Priority support",
            "12-month gift duration"
        ]
    }
}

class UserSubscription(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = Field(..., description="User email from existing auth")
    plan_type: PlanType = Field(..., description="Current subscription plan")
    billing_period: BillingPeriod = Field(..., description="Monthly or yearly")
    status: SubscriptionStatus = Field(default=SubscriptionStatus.ACTIVE)
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    current_period_start: datetime = Field(default_factory=datetime.utcnow)
    current_period_end: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    canceled_at: Optional[datetime] = None
    trial_end: Optional[datetime] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "user_id": "user@example.com",
                "plan_type": "professional",
                "billing_period": "monthly",
                "status": "active"
            }
        }

class UsageTracking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = Field(..., description="User email from existing auth")
    month_year: str = Field(..., description="YYYY-MM format for tracking period")
    search_count: int = Field(default=0, description="Number of searches this month")
    company_count: int = Field(default=0, description="Number of companies created")
    last_reset: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class PaymentHistory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = Field(..., description="User email")
    subscription_id: str = Field(..., description="Reference to UserSubscription")
    stripe_payment_intent_id: Optional[str] = None
    amount: int = Field(..., description="Amount in cents")
    currency: str = Field(default="usd")
    status: str = Field(..., description="Payment status")
    plan_type: PlanType = Field(..., description="Plan that was paid for")
    billing_period: BillingPeriod = Field(..., description="Monthly or yearly")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class BillingAlert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = Field(..., description="User email")
    alert_type: str = Field(..., description="usage_warning, usage_exceeded, payment_failed, etc.")
    message: str = Field(..., description="Alert message")
    acknowledged: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CompanyUser(BaseModel):
    """Track users associated with companies"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str = Field(..., description="Company ID")
    user_id: str = Field(..., description="User email")
    role: str = Field(default="member", description="Role in company: owner, admin, member")
    invited_by: str = Field(..., description="User ID who invited this user")
    invitation_status: str = Field(default="active", description="active, pending, revoked")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_schema_extra = {
            "example": {
                "company_id": "company_123",
                "user_id": "user@example.com",
                "role": "member",
                "invited_by": "owner@example.com",
                "invitation_status": "active"
            }
        }

class UserInvitation(BaseModel):
    """Handle user invitations to companies"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str = Field(..., description="Company ID")
    invited_email: str = Field(..., description="Email of invited user")
    invited_by: str = Field(..., description="User ID who sent invitation")
    role: str = Field(default="member", description="Role to assign")
    token: str = Field(..., description="Invitation token")
    status: str = Field(default="pending", description="pending, accepted, expired, revoked")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime = Field(..., description="Invitation expiry date")
    
    class Config:
        json_schema_extra = {
            "example": {
                "company_id": "company_123",
                "invited_email": "newuser@example.com",
                "invited_by": "owner@example.com",
                "role": "member",
                "token": "invite_token_123"
            }
        }

# Request/Response models for API
class SubscriptionCreate(BaseModel):
    plan_type: PlanType
    billing_period: BillingPeriod
    payment_method_id: str = Field(..., description="Stripe payment method ID")

class SubscriptionUpdate(BaseModel):
    plan_type: Optional[PlanType] = None
    billing_period: Optional[BillingPeriod] = None

class UsageLimits(BaseModel):
    search_limit: int
    company_limit: int
    user_limit: int  # NEW: User limit
    current_searches: int
    current_companies: int
    current_users: int  # NEW: Current users
    searches_remaining: int
    companies_remaining: int
    users_remaining: int  # NEW: Users remaining
    reset_date: datetime
    
class BillingDashboard(BaseModel):
    subscription: Optional[UserSubscription] = None
    usage: UsageLimits
    payment_history: List[PaymentHistory] = Field(default_factory=list)
    alerts: List[BillingAlert] = Field(default_factory=list)
    pricing_config: dict

def get_plan_limits(plan_type: PlanType) -> dict:
    """Get limits for a specific plan type"""
    return PRICING_CONFIG.get(plan_type.value, PRICING_CONFIG["solo"])

def get_plan_price(plan_type: PlanType, billing_period: BillingPeriod) -> int:
    """Get price for a plan (in dollars)"""
    plan_config = PRICING_CONFIG.get(plan_type.value, PRICING_CONFIG["solo"])
    return plan_config.get(billing_period.value, plan_config["monthly"])

def has_feature(plan_type: PlanType, feature: str) -> bool:
    """Check if a plan has a specific feature"""
    plan_config = PRICING_CONFIG.get(plan_type.value, PRICING_CONFIG["solo"])
    return feature in plan_config.get("features", [])

class CustomPricing(BaseModel):
    """Admin-set custom pricing for specific users"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_email: str = Field(..., description="Email of user receiving custom pricing")
    plan_type: PlanType = Field(..., description="Plan tier (features)")
    custom_price_monthly: int = Field(..., description="Custom monthly price in dollars")
    custom_price_yearly: int = Field(..., description="Custom yearly price in dollars")
    applied_by: str = Field(..., description="Admin email who applied this pricing")
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    status: str = Field(default="active", description="active, canceled, expired")
    notes: Optional[str] = Field(default="", description="Admin notes about this custom pricing")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
    
    # NEW: Enhanced expiration management
    auto_revert: bool = True  # Whether to revert to standard pricing after expiration
    expiration_notification_sent: bool = False
    original_plan_type: Optional[PlanType] = None  # Plan to revert to after expiration
    
    def is_expired(self) -> bool:
        """Check if custom pricing has expired"""
        if not self.expires_at:
            return False
        return datetime.utcnow() > self.expires_at
    
    def days_until_expiration(self) -> Optional[int]:
        """Get days until expiration (None if no expiration set)"""
        if not self.expires_at:
            return None
        delta = self.expires_at - datetime.utcnow()
        return max(0, delta.days)
    
    def should_send_expiration_warning(self, days_before: int = 7) -> bool:
        """Check if expiration warning should be sent"""
        if not self.expires_at or self.expiration_notification_sent:
            return False
        days_remaining = self.days_until_expiration()
        return days_remaining is not None and days_remaining <= days_before
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_email": "special@customer.com",
                "plan_type": "professional",
                "custom_price_monthly": 50,
                "custom_price_yearly": 40,
                "applied_by": "admin@company.com",
                "notes": "Special pricing for enterprise customer",
                "expires_at": "2025-12-31T23:59:59Z",
                "auto_revert": True
            }
        }

class CustomPricingCreate(BaseModel):
    user_email: str = Field(..., description="Email of user to apply custom pricing")
    plan_type: PlanType = Field(..., description="Plan tier")
    custom_price_monthly: int = Field(..., description="Custom monthly price in dollars")
    custom_price_yearly: int = Field(..., description="Custom yearly price in dollars")
    notes: Optional[str] = Field(default="", description="Optional notes")
    expires_at: Optional[datetime] = Field(default=None, description="Optional expiration date for custom pricing")

class CustomPricingHistory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    custom_pricing_id: str = Field(..., description="Reference to CustomPricing record")
    user_email: str = Field(..., description="User who received the pricing")
    action: str = Field(..., description="applied, updated, canceled")
    applied_by: str = Field(..., description="Admin who performed the action")
    previous_values: Optional[dict] = Field(default={}, description="Previous values before change")
    new_values: dict = Field(..., description="New values after change")
    created_at: datetime = Field(default_factory=datetime.utcnow)
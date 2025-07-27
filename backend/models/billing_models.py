from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Union
from datetime import datetime
import uuid
from enum import Enum

class PlanType(str, Enum):
    SOLO = "solo"
    PROFESSIONAL = "professional"
    AGENCY = "agency"
    ENTERPRISE = "enterprise"

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
        "monthly": 47,
        "yearly": 37,
        "search_limit": 200,
        "company_limit": 1,
        "features": [
            "basic_search",
            "all_content_generators", 
            "basic_dashboard",
            "csv_export",
            "email_support"
        ]
    },
    "professional": {
        "monthly": 97,
        "yearly": 77,
        "search_limit": 500,
        "company_limit": 5,
        "features": [
            "basic_search",
            "all_content_generators",
            "enhanced_dashboard", 
            "csv_export",
            "priority_email_support"
        ]
    },
    "agency": {
        "monthly": 197,
        "yearly": 157,
        "search_limit": 2000,
        "company_limit": -1,  # -1 means unlimited
        "features": [
            "basic_search",
            "all_content_generators",
            "advanced_dashboard",
            "priority_processing",
            "advanced_export",
            "chat_support",
            "client_reports"
        ]
    },
    "enterprise": {
        "monthly": 397,
        "yearly": 317,
        "search_limit": -1,  # -1 means unlimited
        "company_limit": -1,
        "features": [
            "basic_search",
            "all_content_generators", 
            "advanced_dashboard",
            "priority_processing",
            "white_label",
            "api_access",
            "team_access",
            "phone_support",
            "custom_branding"
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
    current_searches: int
    current_companies: int
    searches_remaining: int
    companies_remaining: int
    reset_date: datetime
    
class BillingDashboard(BaseModel):
    subscription: UserSubscription
    usage: UsageLimits
    payment_history: List[PaymentHistory]
    alerts: List[BillingAlert]
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
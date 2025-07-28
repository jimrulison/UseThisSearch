from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Union
from datetime import datetime
import uuid

class Admin(BaseModel):
    """Admin user model"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str = Field(..., description="Admin email address")
    password_hash: str = Field(..., description="Hashed password")
    name: str = Field(..., description="Admin name")
    role: str = Field(default="admin", description="Admin role")
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "admin@example.com",
                "name": "Admin User",
                "role": "admin"
            }
        }

class AdminSession(BaseModel):
    """Admin session model for tracking login sessions"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    admin_id: str = Field(..., description="Admin ID")
    token: str = Field(..., description="Session token")
    expires_at: datetime = Field(..., description="Session expiry time")
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = Field(default=True)

class AdminLogin(BaseModel):
    """Admin login request model"""
    email: str = Field(..., description="Admin email")
    password: str = Field(..., description="Admin password")

class AdminLoginResponse(BaseModel):
    """Admin login response model"""
    success: bool
    token: str
    admin: Dict = Field(..., description="Admin user data (without password)")
    expires_at: datetime

class UserMetrics(BaseModel):
    """Individual user metrics for admin view"""
    user_id: str
    user_email: str
    total_searches: int = 0
    total_companies: int = 0
    subscription_plan: Optional[str] = None
    subscription_status: Optional[str] = None
    usage_current_month: Dict = Field(default_factory=dict)
    recent_searches: List[Dict] = Field(default_factory=list)
    search_history: List[Dict] = Field(default_factory=list)
    companies: List[Dict] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    last_activity: Optional[datetime] = None

class GlobalAnalytics(BaseModel):
    """Global analytics across all users"""
    total_users: int = 0
    total_searches: int = 0
    total_companies: int = 0
    active_subscriptions: Dict[str, int] = Field(default_factory=dict)  # plan_type -> count
    subscription_revenue: Dict[str, float] = Field(default_factory=dict)  # monthly, yearly totals
    usage_stats: Dict = Field(default_factory=dict)
    popular_search_terms: List[Dict] = Field(default_factory=list)
    user_activity_trends: List[Dict] = Field(default_factory=list)
    search_trends_by_month: List[Dict] = Field(default_factory=list)
    revenue_trends: List[Dict] = Field(default_factory=list)
    user_registration_trends: List[Dict] = Field(default_factory=list)

class UserLookupRequest(BaseModel):
    """Request model for user lookup"""
    email: str = Field(..., description="User email to lookup")

class AdminDashboardData(BaseModel):
    """Complete admin dashboard data"""
    global_analytics: GlobalAnalytics
    recent_users: List[UserMetrics] = Field(default_factory=list)
    system_stats: Dict = Field(default_factory=dict)
    alerts: List[Dict] = Field(default_factory=list)
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, EmailStr
from typing import Optional
import bcrypt
import jwt
import uuid
from datetime import datetime, timedelta

from models.billing_models import UserTrialInfo, TrialStatus, PlanType
from database import get_database

router = APIRouter(prefix="/api/auth", tags=["auth"])

# JWT settings
JWT_SECRET = "your-secret-key-here"  # In production, use environment variable
JWT_ALGORITHM = "HS256"

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    token: str
    user: dict
    trial_info: Optional[dict] = None

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(user_email: str, user_id: str) -> str:
    """Create JWT access token"""
    payload = {
        "email": user_email,
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(days=30)  # 30 day expiry
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

@router.post("/register", response_model=AuthResponse)
async def register_user(user_data: UserRegister):
    """Register a new user with 7-day free trial"""
    db = get_database()
    
    # Check if user already exists
    existing_user = db.users.find_one({"email": user_data.email.lower()})
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    # Hash password
    hashed_password = hash_password(user_data.password)
    
    # Create user with trial info
    user_id = str(uuid.uuid4())
    trial_info = UserTrialInfo()
    
    new_user = {
        "id": user_id,
        "email": user_data.email.lower(),
        "password": hashed_password,
        "name": user_data.name or user_data.email.split('@')[0],
        "created_at": datetime.utcnow(),
        "is_active": True,
        "trial_info": trial_info.dict(),
        "subscription": {
            "plan_type": PlanType.TRIAL,
            "status": "active",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    }
    
    # Insert user into database
    result = db.users.insert_one(new_user)
    if not result.inserted_id:
        raise HTTPException(status_code=500, detail="Failed to create user")
    
    # Create access token
    token = create_access_token(user_data.email.lower(), user_id)
    
    # Return user data without sensitive info
    user_response = {
        "id": user_id,
        "email": user_data.email.lower(),
        "name": new_user["name"],
        "created_at": new_user["created_at"],
        "plan_type": PlanType.TRIAL
    }
    
    return AuthResponse(
        token=token,
        user=user_response,
        trial_info={
            "days_remaining": 7,
            "searches_used_today": 0,
            "searches_remaining_today": 25,
            "is_trial": True
        }
    )

@router.post("/login", response_model=AuthResponse)
async def login_user(login_data: UserLogin):
    """Login existing user"""
    db = get_database()
    
    # Find user (case insensitive)
    user = db.users.find_one({"email": login_data.email.lower()})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(login_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Check if user account is active
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account is disabled")
    
    # Handle trial users
    trial_info_response = None
    if user.get("trial_info"):
        trial_info = UserTrialInfo(**user["trial_info"])
        
        # Check if trial has expired
        if trial_info.is_trial_expired():
            # Check if 30-day data retention has also expired
            if trial_info.is_data_retention_expired():
                raise HTTPException(
                    status_code=403,
                    detail="Your trial data has been deleted after 30 days. Please create a new account."
                )
            
            # Trial expired but within 30-day retention period
            if trial_info.trial_status != TrialStatus.DATA_RETENTION:
                trial_info.trial_status = TrialStatus.DATA_RETENTION
                trial_info.data_retention_start = datetime.utcnow()
                
                # Update in database
                db.users.update_one(
                    {"email": user["email"]},
                    {"$set": {"trial_info": trial_info.dict()}}
                )
            
            raise HTTPException(
                status_code=403,
                detail="Your 7-day free trial has expired. Please upgrade to a paid plan to access your account. Your data will be saved for 30 days."
            )
        
        trial_info_response = {
            "days_remaining": trial_info.days_remaining(),
            "searches_used_today": trial_info.searches_used_today,
            "searches_remaining_today": max(0, 25 - trial_info.searches_used_today) if trial_info.can_search_today() else 0,
            "is_trial": True,
            "should_show_reminder": trial_info.should_show_reminder()
        }
    
    # Create access token
    token = create_access_token(user["email"], user["id"])
    
    # Return user data
    user_response = {
        "id": user["id"],
        "email": user["email"],
        "name": user.get("name", user["email"].split('@')[0]),
        "created_at": user["created_at"],
        "plan_type": user.get("subscription", {}).get("plan_type", PlanType.TRIAL)
    }
    
    return AuthResponse(
        token=token,
        user=user_response,
        trial_info=trial_info_response
    )

@router.post("/logout")
async def logout_user(response: Response):
    """Logout user"""
    # For JWT tokens, we just clear any client-side storage
    # In a more complex system, you might maintain a token blacklist
    
    response.delete_cookie("access_token")
    return {"message": "Successfully logged out"}

@router.get("/me")
async def get_current_user_info():
    """Get current user information"""
    # This would be called with authentication middleware
    # For now, return basic structure
    return {"message": "User info endpoint - requires authentication middleware"}
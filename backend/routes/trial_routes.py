from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from datetime import datetime, timedelta
import uuid

from ..models.billing_models import UserTrialInfo, TrialStatus, PlanType
from ..database import get_database
from ..billing.billing_middleware import get_current_user

router = APIRouter(prefix="/api/trial", tags=["trial"])

@router.get("/status")
async def get_trial_status(current_user=Depends(get_current_user)):
    """Get current user's trial status"""
    db = get_database()
    
    # Get user from database
    user = db.users.find_one({"email": current_user["email"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user has trial info
    trial_info = user.get("trial_info")
    if not trial_info:
        # This shouldn't happen for new users, but handle gracefully
        return {
            "is_trial_user": False,
            "plan_type": user.get("subscription", {}).get("plan_type", "solo")
        }
    
    trial = UserTrialInfo(**trial_info)
    
    # Check if trial has expired and update status
    if trial.is_trial_expired() and trial.trial_status == TrialStatus.ACTIVE:
        trial.trial_status = TrialStatus.EXPIRED
        trial.data_retention_start = datetime.utcnow()
        
        # Update in database
        db.users.update_one(
            {"email": current_user["email"]},
            {"$set": {"trial_info": trial.dict()}}
        )
    
    return {
        "is_trial_user": True,
        "trial_status": trial.trial_status,
        "days_into_trial": trial.days_into_trial(),
        "days_remaining": max(0, trial.days_remaining()),
        "searches_used_today": trial.searches_used_today,
        "searches_remaining_today": max(0, 25 - trial.searches_used_today) if trial.can_search_today() else 0,
        "should_show_reminder": trial.should_show_reminder(),
        "is_expired": trial.is_trial_expired(),
        "can_access": not trial.is_trial_expired()
    }

@router.post("/increment-search")
async def increment_search_count(current_user=Depends(get_current_user)):
    """Increment the daily search count for trial user"""
    db = get_database()
    
    user = db.users.find_one({"email": current_user["email"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    trial_info = user.get("trial_info")
    if not trial_info:
        raise HTTPException(status_code=400, detail="User is not on trial")
    
    trial = UserTrialInfo(**trial_info)
    
    if not trial.can_search_today():
        if trial.is_trial_expired():
            raise HTTPException(status_code=403, detail="Trial has expired")
        else:
            raise HTTPException(status_code=429, detail="Daily search limit reached")
    
    # Reset daily count if it's a new day
    today = datetime.utcnow().date()
    if trial.last_search_date is None or trial.last_search_date.date() != today:
        trial.searches_used_today = 0
    
    # Increment search count
    trial.searches_used_today += 1
    trial.last_search_date = datetime.utcnow()
    
    # Update in database
    db.users.update_one(
        {"email": current_user["email"]},
        {"$set": {"trial_info": trial.dict()}}
    )
    
    return {
        "searches_used_today": trial.searches_used_today,
        "searches_remaining": max(0, 25 - trial.searches_used_today)
    }

@router.post("/convert-to-paid")
async def convert_trial_to_paid(
    plan_type: PlanType,
    current_user=Depends(get_current_user)
):
    """Convert trial user to paid subscription"""
    db = get_database()
    
    user = db.users.find_one({"email": current_user["email"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    trial_info = user.get("trial_info")
    if not trial_info:
        raise HTTPException(status_code=400, detail="User is not on trial")
    
    trial = UserTrialInfo(**trial_info)
    trial.trial_status = TrialStatus.CONVERTED
    
    # Update user with paid subscription
    db.users.update_one(
        {"email": current_user["email"]},
        {
            "$set": {
                "trial_info": trial.dict(),
                "subscription.plan_type": plan_type,
                "subscription.status": "active",
                "subscription.updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Trial converted to paid subscription", "plan_type": plan_type}

@router.get("/reminder-needed")
async def check_reminder_needed(current_user=Depends(get_current_user)):
    """Check if user needs to see trial reminder popup"""
    db = get_database()
    
    user = db.users.find_one({"email": current_user["email"]})
    if not user:
        return {"show_reminder": False}
    
    trial_info = user.get("trial_info")
    if not trial_info:
        return {"show_reminder": False}
    
    trial = UserTrialInfo(**trial_info)
    days = trial.days_into_trial()
    
    # Show reminder on days 4, 5, 6, 7 if not already shown today
    if trial.should_show_reminder() and days not in trial.trial_reminders_sent:
        # Mark reminder as sent for today
        trial.trial_reminders_sent.append(days)
        
        # Update in database
        db.users.update_one(
            {"email": current_user["email"]},
            {"$set": {"trial_info": trial.dict()}}
        )
        
        return {
            "show_reminder": True,
            "days_remaining": trial.days_remaining(),
            "message": f"Your free trial expires in {trial.days_remaining()} day{'s' if trial.days_remaining() != 1 else ''}. Upgrade now to keep your data and continue using all features!"
        }
    
    return {"show_reminder": False}

# Admin route to clean up expired trial data
@router.delete("/cleanup-expired-data")
async def cleanup_expired_trial_data():
    """Clean up data for users whose 30-day retention period has expired"""
    db = get_database()
    
    # Find users with expired data retention
    cutoff_date = datetime.utcnow() - timedelta(days=30)
    
    expired_users = db.users.find({
        "trial_info.trial_status": TrialStatus.DATA_RETENTION,
        "trial_info.data_retention_start": {"$lt": cutoff_date}
    })
    
    deleted_count = 0
    for user in expired_users:
        # Delete user data (searches, companies, etc.)
        db.searches.delete_many({"user_email": user["email"]})
        db.companies.delete_many({"users": user["email"]})
        
        # Delete user account
        db.users.delete_one({"_id": user["_id"]})
        deleted_count += 1
    
    return {
        "message": f"Cleaned up {deleted_count} expired trial accounts",
        "deleted_users": deleted_count
    }
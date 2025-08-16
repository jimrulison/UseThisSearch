from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime, timedelta
import uuid

from models.billing_models import UserTrialInfo, TrialStatus, PlanType
from models.admin_models import Admin
from database import db
from routes.admin_custom_pricing_routes import get_admin_from_request

router = APIRouter(prefix="/admin/trial", tags=["admin-trial"])

@router.get("/users")
async def get_all_trial_users(admin: Admin = Depends(get_admin_from_request)):
    """Get all trial users with their status"""
    
    # Find all users with trial_info
    trial_users = await db.users.find({
        "trial_info": {"$exists": True}
    }).to_list(1000)
    
    users_data = []
    for user in trial_users:
        trial_info = user.get("trial_info")
        if not trial_info:
            continue
            
        trial = UserTrialInfo(**trial_info)
        
        # Calculate current status
        days_into_trial = trial.days_into_trial()
        days_remaining = trial.days_remaining()
        is_expired = trial.is_trial_expired()
        
        users_data.append({
            "id": user.get("id", str(user["_id"])),
            "email": user["email"],
            "name": user.get("name", ""),
            "trial_status": trial.trial_status.value,
            "trial_start": trial.trial_start_date.isoformat() if trial.trial_start_date else None,
            "days_into_trial": days_into_trial,
            "days_remaining": max(0, days_remaining),
            "is_expired": is_expired,
            "searches_used_today": trial.searches_used_today,
            "total_searches": user.get("total_searches", 0),
            "created_at": user.get("created_at", "").isoformat() if isinstance(user.get("created_at"), datetime) else user.get("created_at", ""),
            "last_active": user.get("last_active", "").isoformat() if isinstance(user.get("last_active"), datetime) else user.get("last_active", ""),
            "data_retention_start": trial.data_retention_start.isoformat() if trial.data_retention_start else None
        })
    
    # Sort by trial start date (most recent first)
    users_data.sort(key=lambda x: x["trial_start"] or "", reverse=True)
    
    return {
        "trial_users": users_data,
        "total_count": len(users_data),
        "active_trials": len([u for u in users_data if u["trial_status"] == "active"]),
        "expired_trials": len([u for u in users_data if u["trial_status"] == "expired"]),
        "converted_trials": len([u for u in users_data if u["trial_status"] == "converted"]),
        "data_retention": len([u for u in users_data if u["trial_status"] == "data_retention"])
    }

@router.post("/extend/{user_email}")
async def extend_trial(
    user_email: str,
    extension_days: int,
    admin: Admin = Depends(get_admin_from_request)
):
    """Extend a user's trial period"""
    
    if extension_days <= 0 or extension_days > 30:
        raise HTTPException(status_code=400, detail="Extension days must be between 1 and 30")
    
    user = await db.users.find_one({"email": user_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    trial_info = user.get("trial_info")
    if not trial_info:
        raise HTTPException(status_code=400, detail="User is not on trial")
    
    trial = UserTrialInfo(**trial_info)
    
    # Extend the trial
    trial.trial_start_date = trial.trial_start_date - timedelta(days=extension_days)
    
    # If trial was expired, reactivate it
    if trial.trial_status == TrialStatus.EXPIRED:
        trial.trial_status = TrialStatus.ACTIVE
        trial.data_retention_start = None
    
    # Update in database
    await db.users.update_one(
        {"email": user_email},
        {"$set": {"trial_info": trial.dict()}}
    )
    
    return {
        "message": f"Trial extended by {extension_days} days for {user_email}",
        "new_days_remaining": trial.days_remaining(),
        "extended_by": admin.email
    }

@router.post("/convert/{user_email}")
async def convert_trial_to_paid_admin(
    user_email: str,
    plan_type: str,
    admin: Admin = Depends(get_admin_from_request)
):
    """Convert trial user to paid subscription (admin action)"""
    
    # Validate plan type
    valid_plans = ["solo", "professional", "agency", "enterprise"]
    if plan_type not in valid_plans:
        raise HTTPException(status_code=400, detail=f"Invalid plan type. Must be one of: {valid_plans}")
    
    user = await db.users.find_one({"email": user_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    trial_info = user.get("trial_info")
    if not trial_info:
        raise HTTPException(status_code=400, detail="User is not on trial")
    
    trial = UserTrialInfo(**trial_info)
    trial.trial_status = TrialStatus.CONVERTED
    
    # Update user with paid subscription
    await db.users.update_one(
        {"email": user_email},
        {
            "$set": {
                "trial_info": trial.dict(),
                "subscription.plan_type": plan_type,
                "subscription.status": "active",
                "subscription.updated_at": datetime.utcnow(),
                "subscription.converted_by_admin": admin.email,
                "subscription.converted_at": datetime.utcnow()
            }
        }
    )
    
    return {
        "message": f"Trial converted to {plan_type} plan for {user_email}",
        "plan_type": plan_type,
        "converted_by": admin.email
    }

@router.delete("/cleanup/{user_email}")
async def cleanup_trial_user_data(
    user_email: str,
    admin: Admin = Depends(get_admin_from_request)
):
    """Manually cleanup expired trial user data"""
    
    user = await db.users.find_one({"email": user_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    trial_info = user.get("trial_info")
    if not trial_info:
        raise HTTPException(status_code=400, detail="User is not on trial")
    
    trial = UserTrialInfo(**trial_info)
    if trial.trial_status not in [TrialStatus.EXPIRED, TrialStatus.DATA_RETENTION]:
        raise HTTPException(status_code=400, detail="Can only cleanup expired or data retention users")
    
    # Delete user data (searches, companies, etc.)
    searches_deleted = await db.searches.delete_many({"user_email": user_email})
    companies_updated = await db.companies.update_many(
        {"users": user_email},
        {"$pull": {"users": user_email}}
    )
    
    # Delete user account
    await db.users.delete_one({"email": user_email})
    
    return {
        "message": f"User data cleaned up for {user_email}",
        "searches_deleted": searches_deleted.deleted_count,
        "companies_updated": companies_updated.modified_count,
        "cleaned_by": admin.email
    }

@router.get("/analytics")
async def get_trial_analytics(admin: Admin = Depends(get_admin_from_request)):
    """Get trial user analytics and conversion rates"""
    
    # Get all trial users
    trial_users = await db.users.find({
        "trial_info": {"$exists": True}
    }).to_list(1000)
    
    analytics_data = {
        "total_trial_users": 0,
        "active_trials": 0,
        "expired_trials": 0,
        "converted_trials": 0,
        "data_retention": 0,
        "conversion_rate": 0.0,
        "avg_searches_per_trial": 0.0,
        "trial_duration_stats": {
            "day_1_3": 0,
            "day_4_7": 0,
            "completed_7_days": 0
        },
        "daily_signups_last_30_days": {},
        "search_usage_distribution": {
            "0_searches": 0,
            "1_10_searches": 0,
            "11_25_searches": 0,
            "over_25_searches": 0
        }
    }
    
    today = datetime.utcnow().date()
    
    for user in trial_users:
        trial_info = user.get("trial_info")
        if not trial_info:
            continue
            
        trial = UserTrialInfo(**trial_info)
        analytics_data["total_trial_users"] += 1
        
        # Count by status
        if trial.trial_status == TrialStatus.ACTIVE:
            analytics_data["active_trials"] += 1
        elif trial.trial_status == TrialStatus.EXPIRED:
            analytics_data["expired_trials"] += 1
        elif trial.trial_status == TrialStatus.CONVERTED:
            analytics_data["converted_trials"] += 1
        elif trial.trial_status == TrialStatus.DATA_RETENTION:
            analytics_data["data_retention"] += 1
        
        # Trial duration stats
        days_into_trial = trial.days_into_trial()
        if days_into_trial <= 3:
            analytics_data["trial_duration_stats"]["day_1_3"] += 1
        elif days_into_trial <= 7:
            analytics_data["trial_duration_stats"]["day_4_7"] += 1
        else:
            analytics_data["trial_duration_stats"]["completed_7_days"] += 1
        
        # Search usage distribution
        total_searches = user.get("total_searches", 0)
        if total_searches == 0:
            analytics_data["search_usage_distribution"]["0_searches"] += 1
        elif total_searches <= 10:
            analytics_data["search_usage_distribution"]["1_10_searches"] += 1
        elif total_searches <= 25:
            analytics_data["search_usage_distribution"]["11_25_searches"] += 1
        else:
            analytics_data["search_usage_distribution"]["over_25_searches"] += 1
        
        # Daily signups (last 30 days)
        if trial.trial_start:
            signup_date = trial.trial_start.date()
            if (today - signup_date).days <= 30:
                date_str = signup_date.isoformat()
                analytics_data["daily_signups_last_30_days"][date_str] = analytics_data["daily_signups_last_30_days"].get(date_str, 0) + 1
    
    # Calculate conversion rate
    total_completed_trials = analytics_data["converted_trials"] + analytics_data["expired_trials"] + analytics_data["data_retention"]
    if total_completed_trials > 0:
        analytics_data["conversion_rate"] = round((analytics_data["converted_trials"] / total_completed_trials) * 100, 2)
    
    # Calculate average searches per trial
    total_searches = sum(user.get("total_searches", 0) for user in trial_users)
    if analytics_data["total_trial_users"] > 0:
        analytics_data["avg_searches_per_trial"] = round(total_searches / analytics_data["total_trial_users"], 2)
    
    return analytics_data

@router.post("/settings/update")
async def update_trial_settings(
    trial_duration_days: Optional[int] = None,
    daily_search_limit: Optional[int] = None,
    data_retention_days: Optional[int] = None,
    admin: Admin = Depends(get_admin_from_request)
):
    """Update global trial settings (for future trials)"""
    
    settings_update = {}
    
    if trial_duration_days is not None:
        if trial_duration_days < 1 or trial_duration_days > 30:
            raise HTTPException(status_code=400, detail="Trial duration must be between 1 and 30 days")
        settings_update["trial_duration_days"] = trial_duration_days
    
    if daily_search_limit is not None:
        if daily_search_limit < 1 or daily_search_limit > 100:
            raise HTTPException(status_code=400, detail="Daily search limit must be between 1 and 100")
        settings_update["daily_search_limit"] = daily_search_limit
    
    if data_retention_days is not None:
        if data_retention_days < 7 or data_retention_days > 90:
            raise HTTPException(status_code=400, detail="Data retention must be between 7 and 90 days")
        settings_update["data_retention_days"] = data_retention_days
    
    if not settings_update:
        raise HTTPException(status_code=400, detail="At least one setting must be provided")
    
    settings_update["updated_by"] = admin.email
    settings_update["updated_at"] = datetime.utcnow()
    
    # Store settings in database
    await db.trial_settings.update_one(
        {"_id": "global"},
        {"$set": settings_update},
        upsert=True
    )
    
    return {
        "message": "Trial settings updated successfully",
        "updated_settings": settings_update
    }
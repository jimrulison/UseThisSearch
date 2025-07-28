from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import logging

from models.admin_models import (
    UserMetrics, GlobalAnalytics, UserLookupRequest, AdminDashboardData
)
from models.search_models import Company, SearchHistory
from models.billing_models import UserSubscription, UsageTracking, PaymentHistory, PRICING_CONFIG
from routes.admin_routes import get_current_admin
from database import db

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/user-lookup", response_model=UserMetrics)
async def lookup_user_by_email(
    lookup_request: UserLookupRequest,
    current_admin = Depends(get_current_admin)
):
    """Lookup user by email and return their complete metrics"""
    try:
        user_email = lookup_request.email.strip().lower()
        
        # Get user subscription info
        subscription = await db.user_subscriptions.find_one({"user_id": user_email})
        
        # Get user usage tracking
        current_month = datetime.utcnow().strftime("%Y-%m")
        usage = await db.usage_tracking.find_one({
            "user_id": user_email,
            "month_year": current_month
        })
        
        # Get user companies
        companies = await db.companies.find({"user_id": user_email}).to_list(100)
        
        # Get search history (last 50 searches)
        search_history = await db.search_history.find(
            {"user_id": user_email}
        ).sort("created_at", -1).limit(50).to_list(50)
        
        # Get recent searches (last 10)
        recent_searches = search_history[:10] if search_history else []
        
        # Calculate totals
        total_searches = await db.search_history.count_documents({"user_id": user_email})
        total_companies = len(companies)
        
        # Get last activity
        last_search = await db.search_history.find_one(
            {"user_id": user_email},
            sort=[("created_at", -1)]
        )
        last_activity = last_search["created_at"] if last_search else None
        
        # Get user creation date (from first company or search)
        first_company = await db.companies.find_one(
            {"user_id": user_email},
            sort=[("created_at", 1)]
        )
        created_at = first_company["created_at"] if first_company else None
        
        # Prepare user metrics
        user_metrics = UserMetrics(
            user_id=user_email,
            user_email=user_email,
            total_searches=total_searches,
            total_companies=total_companies,
            subscription_plan=subscription["plan_type"] if subscription else None,
            subscription_status=subscription["status"] if subscription else None,
            usage_current_month={
                "searches": usage["search_count"] if usage else 0,
                "companies": usage["company_count"] if usage else 0,
                "last_reset": usage["last_reset"].isoformat() if usage and usage.get("last_reset") else None
            },
            recent_searches=[
                {
                    "search_term": search["search_term"],
                    "suggestions_count": search["suggestions_count"],
                    "created_at": search["created_at"].isoformat(),
                    "company_id": search.get("company_id")
                }
                for search in recent_searches
            ],
            search_history=[
                {
                    "id": search["id"],
                    "search_term": search["search_term"],
                    "suggestions_count": search["suggestions_count"],
                    "created_at": search["created_at"].isoformat(),
                    "company_id": search.get("company_id")
                }
                for search in search_history
            ],
            companies=[
                {
                    "id": company["id"],
                    "name": company["name"],
                    "is_personal": company.get("is_personal", False),
                    "created_at": company["created_at"].isoformat()
                }
                for company in companies
            ],
            created_at=created_at,
            last_activity=last_activity
        )
        
        return user_metrics
        
    except Exception as e:
        logger.error(f"Error looking up user {lookup_request.email}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to lookup user: {str(e)}")

@router.get("/global-analytics", response_model=GlobalAnalytics)
async def get_global_analytics(current_admin = Depends(get_current_admin)):
    """Get global analytics across all users"""
    try:
        # Get total counts
        total_users = await db.user_subscriptions.count_documents({})
        if total_users == 0:
            # If no subscriptions, count unique users from search history
            pipeline = [
                {"$group": {"_id": "$user_id"}},
                {"$count": "total_users"}
            ]
            result = await db.search_history.aggregate(pipeline).to_list(1)
            total_users = result[0]["total_users"] if result else 0
        
        total_searches = await db.search_history.count_documents({})
        total_companies = await db.companies.count_documents({})
        
        # Get subscription distribution
        subscription_pipeline = [
            {"$group": {"_id": "$plan_type", "count": {"$sum": 1}}}
        ]
        subscription_results = await db.user_subscriptions.aggregate(subscription_pipeline).to_list(10)
        active_subscriptions = {result["_id"]: result["count"] for result in subscription_results}
        
        # Calculate revenue (rough estimate)
        revenue_monthly = 0
        revenue_yearly = 0
        for plan_type, count in active_subscriptions.items():
            if plan_type in PRICING_CONFIG:
                plan_config = PRICING_CONFIG[plan_type]
                revenue_monthly += plan_config["monthly"] * count
                revenue_yearly += plan_config["yearly"] * count
        
        subscription_revenue = {
            "monthly_potential": revenue_monthly,
            "yearly_potential": revenue_yearly,
            "current_month": revenue_monthly  # Simplified - actual would need payment history
        }
        
        # Get popular search terms
        popular_terms_pipeline = [
            {"$group": {"_id": "$search_term", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        popular_terms_results = await db.search_history.aggregate(popular_terms_pipeline).to_list(10)
        popular_search_terms = [
            {"term": result["_id"], "count": result["count"]} 
            for result in popular_terms_results
        ]
        
        # Get search trends by month (last 6 months)
        six_months_ago = datetime.utcnow() - timedelta(days=180)
        monthly_trends_pipeline = [
            {"$match": {"created_at": {"$gte": six_months_ago}}},
            {"$group": {
                "_id": {
                    "year": {"$year": "$created_at"},
                    "month": {"$month": "$created_at"}
                },
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id.year": 1, "_id.month": 1}}
        ]
        monthly_trends_results = await db.search_history.aggregate(monthly_trends_pipeline).to_list(12)
        search_trends_by_month = [
            {
                "month": f"{result['_id']['year']}-{result['_id']['month']:02d}",
                "searches": result["count"]
            }
            for result in monthly_trends_results
        ]
        
        # Get user registration trends (based on first company creation)
        registration_pipeline = [
            {"$match": {"is_personal": True}},
            {"$group": {
                "_id": {
                    "year": {"$year": "$created_at"},
                    "month": {"$month": "$created_at"}
                },
                "new_users": {"$sum": 1}
            }},
            {"$sort": {"_id.year": 1, "_id.month": 1}}
        ]
        registration_results = await db.companies.aggregate(registration_pipeline).to_list(12)
        user_registration_trends = [
            {
                "month": f"{result['_id']['year']}-{result['_id']['month']:02d}",
                "new_users": result["new_users"]
            }
            for result in registration_results
        ]
        
        # Usage stats
        usage_stats = {
            "avg_searches_per_user": round(total_searches / max(total_users, 1), 2),
            "avg_companies_per_user": round(total_companies / max(total_users, 1), 2),
            "total_active_sessions": await db.admin_sessions.count_documents({
                "is_active": True,
                "expires_at": {"$gt": datetime.utcnow()}
            })
        }
        
        return GlobalAnalytics(
            total_users=total_users,
            total_searches=total_searches,
            total_companies=total_companies,
            active_subscriptions=active_subscriptions,
            subscription_revenue=subscription_revenue,
            usage_stats=usage_stats,
            popular_search_terms=popular_search_terms,
            search_trends_by_month=search_trends_by_month,
            user_registration_trends=user_registration_trends
        )
        
    except Exception as e:
        logger.error(f"Error getting global analytics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get analytics: {str(e)}")

@router.get("/dashboard", response_model=AdminDashboardData)
async def get_admin_dashboard(current_admin = Depends(get_current_admin)):
    """Get complete admin dashboard data"""
    try:
        # Get global analytics
        global_analytics = await get_global_analytics(current_admin)
        
        # Get recent users (last 10 users who made searches)
        recent_user_pipeline = [
            {"$group": {"_id": "$user_id", "last_activity": {"$max": "$created_at"}}},
            {"$sort": {"last_activity": -1}},
            {"$limit": 10}
        ]
        recent_user_results = await db.search_history.aggregate(recent_user_pipeline).to_list(10)
        
        recent_users = []
        for user_result in recent_user_results:
            try:
                user_metrics = await lookup_user_by_email(
                    UserLookupRequest(email=user_result["_id"]),
                    current_admin
                )
                recent_users.append(user_metrics)
            except:
                # Skip users that can't be looked up
                continue
        
        # System stats
        system_stats = {
            "database_collections": len(await db.list_collection_names()),
            "active_admin_sessions": await db.admin_sessions.count_documents({
                "is_active": True,
                "expires_at": {"$gt": datetime.utcnow()}
            }),
            "system_uptime": "N/A",  # Would need to track server start time
            "last_updated": datetime.utcnow().isoformat()
        }
        
        # Sample alerts (in production, these would be real alerts)
        alerts = []
        
        return AdminDashboardData(
            global_analytics=global_analytics,
            recent_users=recent_users,
            system_stats=system_stats,
            alerts=alerts
        )
        
    except Exception as e:
        logger.error(f"Error getting admin dashboard: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard data: {str(e)}")

@router.get("/users", response_model=List[Dict])
async def get_all_users(
    limit: int = 50,
    offset: int = 0,
    current_admin = Depends(get_current_admin)
):
    """Get all users with basic info"""
    try:
        # Get users from search history (unique user IDs)
        pipeline = [
            {"$group": {
                "_id": "$user_id",
                "total_searches": {"$sum": 1},
                "last_activity": {"$max": "$created_at"},
                "first_activity": {"$min": "$created_at"}
            }},
            {"$sort": {"last_activity": -1}},
            {"$skip": offset},
            {"$limit": limit}
        ]
        
        user_results = await db.search_history.aggregate(pipeline).to_list(limit)
        
        users = []
        for user in user_results:
            # Get subscription info
            subscription = await db.user_subscriptions.find_one({"user_id": user["_id"]})
            
            # Get company count
            company_count = await db.companies.count_documents({"user_id": user["_id"]})
            
            users.append({
                "user_id": user["_id"],
                "total_searches": user["total_searches"],
                "total_companies": company_count,
                "subscription_plan": subscription["plan_type"] if subscription else None,
                "subscription_status": subscription["status"] if subscription else None,
                "last_activity": user["last_activity"].isoformat(),
                "first_activity": user["first_activity"].isoformat()
            })
        
        return users
        
    except Exception as e:
        logger.error(f"Error getting all users: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get users: {str(e)}")

@router.get("/user/{user_email}/search-results")
async def get_user_search_results(
    user_email: str,
    limit: int = 20,
    offset: int = 0,
    current_admin = Depends(get_current_admin)
):
    """Get detailed search results for a specific user"""
    try:
        # Get search history with pagination
        search_history = await db.search_history.find(
            {"user_id": user_email.lower()}
        ).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
        
        # For each search, we would need to store the actual results
        # Since the current system doesn't store the full results, 
        # we'll return the search history with available data
        
        search_results = []
        for search in search_history:
            search_results.append({
                "id": search["id"],
                "search_term": search["search_term"],
                "suggestions_count": search["suggestions_count"],
                "created_at": search["created_at"].isoformat(),
                "company_id": search.get("company_id"),
                "ip_address": search.get("ip_address"),
                "user_agent": search.get("user_agent"),
                # Note: Actual suggestion results would need to be stored separately
                # for a full admin view of what users are seeing
                "note": "Full suggestion results not stored in current implementation"
            })
        
        return {
            "user_email": user_email,
            "search_results": search_results,
            "total_count": await db.search_history.count_documents({"user_id": user_email.lower()}),
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        logger.error(f"Error getting search results for user {user_email}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get search results: {str(e)}")
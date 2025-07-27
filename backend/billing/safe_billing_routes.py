from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from typing import Any
import logging

# Import existing search functionality (unchanged)
from routes.search_routes import search_suggestions as original_search_suggestions
from routes.company_routes import (
    create_company as original_create_company,
    get_user_companies as original_get_companies
)

# Import our new billing middleware (additive)
from billing.billing_middleware import BillingMiddleware

logger = logging.getLogger(__name__)
router = APIRouter()

# Create billing middleware instance
billing_middleware = BillingMiddleware()

@router.post("/search-with-billing")
async def search_suggestions_with_billing(
    request_data: Any,
    background_tasks: BackgroundTasks,
    http_request: Request
):
    """
    New search endpoint that wraps the existing search with billing checks
    This does NOT modify the original search_routes.py
    """
    try:
        # Check if user can perform search
        usage_check = await billing_middleware.check_search_limits(http_request)
        
        if not usage_check["allowed"]:
            if usage_check["reason"] == "limit_exceeded":
                raise HTTPException(
                    status_code=429,
                    detail={
                        "error": "Search limit exceeded",
                        "message": f"You've reached your search limit of {usage_check['limit']} searches this month.",
                        "reset_date": usage_check.get("reset_date"),
                        "upgrade_required": True,
                        "current_usage": {
                            "searches_used": usage_check.get("limit", 0) - usage_check.get("remaining", 0),
                            "searches_limit": usage_check.get("limit")
                        }
                    }
                )
        
        # Call the ORIGINAL search function (unchanged)
        result = await original_search_suggestions(
            request_data, 
            background_tasks, 
            http_request
        )
        
        # Track usage after successful search (additive)
        await billing_middleware.track_successful_search(http_request)
        
        # Add usage info to response (non-breaking)
        if isinstance(result, dict):
            result["usage_info"] = {
                "searches_remaining": usage_check.get("remaining", -1),
                "plan_type": usage_check.get("plan_type", "unknown")
            }
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in billing-aware search: {e}")
        
        # Fallback to original search function (safety)
        logger.info("Falling back to original search function due to billing error")
        return await original_search_suggestions(request_data, background_tasks, http_request)

@router.post("/companies-with-billing")
async def create_company_with_billing(
    company_data: Any,
    http_request: Request
):
    """
    New company creation endpoint with billing checks
    This does NOT modify the original company_routes.py
    """
    try:
        # Check if user can create company
        company_check = await billing_middleware.check_company_limits(http_request)
        
        if not company_check["allowed"]:
            if company_check["reason"] == "limit_exceeded":
                raise HTTPException(
                    status_code=429,
                    detail={
                        "error": "Company limit exceeded", 
                        "message": f"You've reached your limit of {company_check['limit']} companies. Upgrade to create more.",
                        "current_count": company_check.get("current"),
                        "upgrade_required": True,
                        "upgrade_suggestions": [
                            {
                                "plan": "professional",
                                "limit": "5 companies",
                                "price": "$97/month"
                            },
                            {
                                "plan": "agency", 
                                "limit": "Unlimited companies",
                                "price": "$197/month"
                            }
                        ]
                    }
                )
        
        # Call the ORIGINAL company creation function (unchanged)
        result = await original_create_company(company_data, http_request)
        
        # Track company creation (additive)
        await billing_middleware.track_successful_company_creation(http_request)
        
        # Add usage info to response
        if isinstance(result, dict):
            result["usage_info"] = {
                "companies_remaining": company_check.get("remaining", -1),
                "companies_limit": company_check.get("limit", -1)
            }
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in billing-aware company creation: {e}")
        
        # Fallback to original function (safety)
        logger.info("Falling back to original company creation due to billing error")
        return await original_create_company(company_data, http_request)

@router.get("/companies-with-usage")
async def get_companies_with_usage_info(http_request: Request):
    """
    Enhanced company listing with usage information
    Wraps the original get_user_companies function
    """
    try:
        # Call original function (unchanged)
        companies = await original_get_companies(http_request)
        
        # Add usage information (additive)
        user_id = http_request.headers.get("X-User-ID")
        if user_id and user_id != "anonymous":
            from billing.usage_tracker import get_usage_tracker
            usage_tracker = get_usage_tracker()
            usage_limits = await usage_tracker.get_usage_limits(user_id)
            
            # Enhance response with usage info
            return {
                "companies": companies,
                "usage_info": {
                    "current_companies": usage_limits.current_companies,
                    "company_limit": usage_limits.company_limit,
                    "companies_remaining": usage_limits.companies_remaining,
                    "can_create_more": usage_limits.companies_remaining > 0 or usage_limits.company_limit == -1
                }
            }
        
        # Return original response if no user ID
        return {"companies": companies}
        
    except Exception as e:
        logger.error(f"Error getting companies with usage: {e}")
        
        # Fallback to original function
        companies = await original_get_companies(http_request)
        return {"companies": companies}

@router.get("/usage-status")
async def get_user_usage_status(http_request: Request):
    """
    Get user's current usage status across all limits
    """
    try:
        user_id = http_request.headers.get("X-User-ID")
        
        if not user_id or user_id == "anonymous":
            return {
                "user_type": "anonymous",
                "limits": "none",
                "message": "Anonymous usage - no limits applied"
            }
        
        from billing.usage_tracker import get_usage_tracker
        usage_tracker = get_usage_tracker()
        
        # Get comprehensive usage info
        usage_limits = await usage_tracker.get_usage_limits(user_id)
        subscription = await usage_tracker.get_user_subscription(user_id)
        
        return {
            "user_id": user_id,
            "subscription": {
                "plan_type": subscription.plan_type if subscription else "free",
                "status": subscription.status if subscription else "none",
                "trial_end": subscription.trial_end if subscription else None
            },
            "usage": {
                "searches": {
                    "used": usage_limits.current_searches,
                    "limit": usage_limits.search_limit,
                    "remaining": usage_limits.searches_remaining,
                    "percentage": (usage_limits.current_searches / usage_limits.search_limit * 100) if usage_limits.search_limit > 0 else 0
                },
                "companies": {
                    "used": usage_limits.current_companies,
                    "limit": usage_limits.company_limit,
                    "remaining": usage_limits.companies_remaining
                }
            },
            "reset_date": usage_limits.reset_date,
            "warnings": []
        }
        
    except Exception as e:
        logger.error(f"Error getting usage status: {e}")
        return {
            "error": "Could not fetch usage status",
            "user_type": "unknown"
        }
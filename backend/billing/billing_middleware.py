import logging
from fastapi import Request, HTTPException
from typing import Callable, Any
from billing.usage_tracker import get_usage_tracker

logger = logging.getLogger(__name__)

class BillingMiddleware:
    """
    Safe middleware that wraps around existing functionality
    WITHOUT modifying the original search_routes.py
    """
    
    def __init__(self):
        self.usage_tracker = get_usage_tracker()
    
    async def check_search_limits(self, request: Request) -> dict:
        """
        Check if user can perform search
        Returns dict with 'allowed' boolean and additional info
        """
        try:
            # Extract user ID (same method as existing system)
            user_id = request.headers.get("X-User-ID")
            
            if not user_id or user_id == "anonymous":
                # Anonymous users allowed (backward compatibility)
                return {"allowed": True, "reason": "anonymous"}
            
            # Check usage limits
            usage_check = await self.usage_tracker.can_perform_search(user_id)
            return usage_check
            
        except Exception as e:
            logger.error(f"Error checking search limits: {e}")
            # On error, allow the search (fail open for safety)
            return {"allowed": True, "reason": "error_failsafe"}
    
    async def check_company_limits(self, request: Request) -> dict:
        """
        Check if user can create company
        Returns dict with 'allowed' boolean and additional info
        """
        try:
            user_id = request.headers.get("X-User-ID")
            
            if not user_id or user_id == "anonymous":
                return {"allowed": True, "reason": "anonymous"}
            
            # Check company creation limits
            company_check = await self.usage_tracker.can_create_company(user_id)
            return company_check
            
        except Exception as e:
            logger.error(f"Error checking company limits: {e}")
            return {"allowed": True, "reason": "error_failsafe"}
    
    async def track_successful_search(self, request: Request) -> bool:
        """
        Track search usage after successful search
        This is called AFTER the search completes successfully
        """
        try:
            user_id = request.headers.get("X-User-ID")
            
            if not user_id or user_id == "anonymous":
                return True  # Don't track anonymous usage
            
            success = await self.usage_tracker.track_search_usage(user_id)
            if success:
                logger.info(f"Tracked search usage for user: {user_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error tracking search usage: {e}")
            return False  # Don't fail the request if tracking fails
    
    async def track_successful_company_creation(self, request: Request) -> bool:
        """
        Track company creation after successful creation
        """
        try:
            user_id = request.headers.get("X-User-ID")
            
            if not user_id or user_id == "anonymous":
                return True
            
            success = await self.usage_tracker.track_company_creation(user_id)
            if success:
                logger.info(f"Tracked company creation for user: {user_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error tracking company creation: {e}")
            return False

def create_search_limit_decorator():
    """
    Create a decorator that can be applied to search endpoints
    WITHOUT modifying the original search function
    """
    middleware = BillingMiddleware()
    
    def decorator(original_search_function: Callable) -> Callable:
        async def wrapper(*args, **kwargs):
            # Find the request object in the arguments
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            
            if not request:
                # If no request found, call original function (safety)
                return await original_search_function(*args, **kwargs)
            
            # Check if user can perform search
            usage_check = await middleware.check_search_limits(request)
            
            if not usage_check["allowed"]:
                # User has exceeded limits
                if usage_check["reason"] == "limit_exceeded":
                    raise HTTPException(
                        status_code=429,
                        detail={
                            "error": "Search limit exceeded",
                            "message": f"You've reached your search limit of {usage_check['limit']} searches this month.",
                            "reset_date": usage_check.get("reset_date"),
                            "upgrade_required": True
                        }
                    )
            
            # Call original search function
            result = await original_search_function(*args, **kwargs)
            
            # Track usage after successful search
            await middleware.track_successful_search(request)
            
            return result
        
        return wrapper
    return decorator

def create_company_limit_decorator():
    """
    Create a decorator for company creation limits
    """
    middleware = BillingMiddleware()
    
    def decorator(original_company_function: Callable) -> Callable:
        async def wrapper(*args, **kwargs):
            # Find the request object
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            
            if not request:
                return await original_company_function(*args, **kwargs)
            
            # Check if user can create company
            company_check = await middleware.check_company_limits(request)
            
            if not company_check["allowed"]:
                if company_check["reason"] == "limit_exceeded":
                    raise HTTPException(
                        status_code=429,
                        detail={
                            "error": "Company limit exceeded",
                            "message": f"You've reached your limit of {company_check['limit']} companies. Upgrade to create more.",
                            "current_count": company_check.get("current"),
                            "upgrade_required": True
                        }
                    )
            
            # Call original function
            result = await original_company_function(*args, **kwargs)
            
            # Track company creation
            await middleware.track_successful_company_creation(request)
            
            return result
        
        return wrapper
    return decorator

# Singleton instances
_search_limit_decorator = None
_company_limit_decorator = None

def get_search_limit_decorator():
    """Get search limit decorator instance"""
    global _search_limit_decorator
    if _search_limit_decorator is None:
        _search_limit_decorator = create_search_limit_decorator()
    return _search_limit_decorator

def get_company_limit_decorator():
    """Get company limit decorator instance"""
    global _company_limit_decorator
    if _company_limit_decorator is None:
        _company_limit_decorator = create_company_limit_decorator()
    return _company_limit_decorator
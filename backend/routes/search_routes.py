from fastapi import APIRouter, HTTPException, Request, BackgroundTasks, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import time
import logging
from datetime import datetime, timedelta
import httpx

from models.search_models import (
    SearchRequest, 
    SearchResponse, 
    SearchSuggestions,
    SearchHistory,
    SearchStats
)
from models.billing_models import UserTrialInfo
from services.claude_service import get_claude_service
from database import db, ensure_personal_company
from billing.billing_middleware import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

class QuestionContentRequest(BaseModel):
    question: str

def get_user_id_from_request(request: Request) -> str:
    """Extract user ID from request headers"""
    user_id = request.headers.get("X-User-ID")
    if not user_id:
        # For backward compatibility, allow searches without user ID (will use 'anonymous')
        return "anonymous"
    return user_id

def get_company_id_from_request(request: Request) -> str:
    """Extract company ID from request headers"""
    company_id = request.headers.get("X-Company-ID")
    return company_id

@router.post("/search", response_model=SearchResponse)
async def search_suggestions(
    request: SearchRequest,
    background_tasks: BackgroundTasks,
    http_request: Request,
    current_user=Depends(get_current_user)
):
    """Generate keyword suggestions using Claude AI"""
    
    start_time = time.time()
    
    try:
        # Check trial limits for trial users
        user = await db.users.find_one({"email": current_user["email"]})
        if user and user.get("trial_info"):
            trial_info = UserTrialInfo(**user["trial_info"])
            
            # Check if trial has expired
            if trial_info.is_trial_expired():
                raise HTTPException(
                    status_code=403, 
                    detail="Your 7-day free trial has expired. Please upgrade to a paid plan to continue using the platform."
                )
            
            # Check daily search limit for trial users
            if not trial_info.can_search_today():
                remaining = max(0, 25 - trial_info.searches_used_today)
                if remaining == 0:
                    raise HTTPException(
                        status_code=429,
                        detail=f"You've reached your daily limit of 25 searches. Trial users can perform 25 searches per day. Please try again tomorrow or upgrade to remove limits."
                    )
            
            # Increment search count for trial users
            today = datetime.utcnow().date()
            if trial_info.last_search_date is None or trial_info.last_search_date.date() != today:
                trial_info.searches_used_today = 0
            
            trial_info.searches_used_today += 1
            trial_info.last_search_date = datetime.utcnow()
            
            # Update trial info in database
            await db.users.update_one(
                {"email": current_user["email"]},
                {"$set": {"trial_info": trial_info.dict()}}
            )
        
        # Validate search term
        search_term = request.search_term.strip().lower()
        if not search_term:
            raise HTTPException(status_code=400, detail="Search term cannot be empty")
        
        if len(search_term) > 100:
            raise HTTPException(status_code=400, detail="Search term too long (max 100 characters)")
        
        logger.info(f"Processing search request for: {search_term}")
        
        # Get user and company info
        user_id = get_user_id_from_request(http_request)
        company_id = get_company_id_from_request(http_request)
        
        # If user is authenticated but no company specified, use Personal company
        if user_id != "anonymous" and not company_id:
            company_id = await ensure_personal_company(user_id)
        
        # Generate suggestions using Claude (lazy-loaded)
        claude_service = get_claude_service()
        suggestions_dict = claude_service.generate_suggestions(search_term)
        suggestions = SearchSuggestions(**suggestions_dict)
        
        # Calculate processing time
        processing_time = int((time.time() - start_time) * 1000)
        
        # Calculate total suggestions
        total_suggestions = (
            len(suggestions.questions) + 
            len(suggestions.prepositions) + 
            len(suggestions.comparisons) + 
            len(suggestions.alphabetical)
        )
        
        # Create response
        response = SearchResponse(
            search_term=search_term,
            suggestions=suggestions,
            total_suggestions=total_suggestions,
            processing_time_ms=processing_time
        )
        
        # Store search history in background (only if we have user and company info)
        if user_id != "anonymous" and company_id:
            background_tasks.add_task(
                store_search_history,
                search_term,
                total_suggestions,
                user_id,
                company_id,
                http_request.client.host if http_request.client else None,
                http_request.headers.get("user-agent")
            )
        
        logger.info(f"Successfully processed search for '{search_term}' in {processing_time}ms")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing search request: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Internal server error while processing search request"
        )

@router.get("/search/history", response_model=List[SearchHistory])
async def get_search_history(limit: int = 50, offset: int = 0):
    """Get recent search history"""
    
    try:
        # Get search history from database
        cursor = db.search_history.find().sort("created_at", -1).skip(offset).limit(limit)
        history = await cursor.to_list(length=limit)
        
        return [SearchHistory(**item) for item in history]
        
    except Exception as e:
        logger.error(f"Error fetching search history: {e}")
        raise HTTPException(status_code=500, detail="Error fetching search history")

@router.get("/search/stats", response_model=SearchStats)
async def get_search_stats():
    """Get search statistics"""
    
    try:
        # Get total searches
        total_searches = await db.search_history.count_documents({})
        
        # Get popular terms (aggregation)
        popular_pipeline = [
            {
                "$group": {
                    "_id": "$search_term",
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        
        popular_cursor = db.search_history.aggregate(popular_pipeline)
        popular_terms = []
        async for doc in popular_cursor:
            popular_terms.append({doc["_id"]: doc["count"]})
        
        # Get recent searches (last 24 hours)
        recent_time = datetime.utcnow() - timedelta(hours=24)
        recent_cursor = db.search_history.find(
            {"created_at": {"$gte": recent_time}}
        ).sort("created_at", -1).limit(20)
        
        recent_searches = []
        async for doc in recent_cursor:
            recent_searches.append(doc["search_term"])
        
        # Calculate average suggestions per search
        avg_pipeline = [
            {
                "$group": {
                    "_id": None,
                    "avg_suggestions": {"$avg": "$suggestions_count"}
                }
            }
        ]
        
        avg_cursor = db.search_history.aggregate(avg_pipeline)
        avg_suggestions = 0.0
        async for doc in avg_cursor:
            avg_suggestions = round(doc["avg_suggestions"], 1)
        
        return SearchStats(
            total_searches=total_searches,
            popular_terms=popular_terms,
            recent_searches=list(set(recent_searches)),  # Remove duplicates
            average_suggestions_per_search=avg_suggestions
        )
        
    except Exception as e:
        logger.error(f"Error fetching search stats: {e}")
        raise HTTPException(status_code=500, detail="Error fetching search statistics")

@router.delete("/search/history")
async def clear_search_history():
    """Clear all search history (admin function)"""
    
    try:
        result = await db.search_history.delete_many({})
        return {"message": f"Cleared {result.deleted_count} search history records"}
        
    except Exception as e:
        logger.error(f"Error clearing search history: {e}")
        raise HTTPException(status_code=500, detail="Error clearing search history")

async def store_search_history(
    search_term: str, 
    suggestions_count: int,
    user_id: str,
    company_id: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Background task to store search history"""
    
    try:
        history_entry = SearchHistory(
            search_term=search_term,
            suggestions_count=suggestions_count,
            company_id=company_id,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        await db.search_history.insert_one(history_entry.dict())
        logger.info(f"Stored search history for: {search_term} (user: {user_id}, company: {company_id})")
        
    except Exception as e:
        logger.error(f"Error storing search history: {e}")
        # Don't raise exception as this shouldn't block the main response

@router.post("/generate-question-content")
async def generate_question_content(request: QuestionContentRequest):
    """Generate conversational content for a specific question"""
    
    try:
        logger.info(f"Generating content for question: {request.question}")
        
        # Get Claude service instance
        claude_service = get_claude_service()
        
        # Generate the conversational content using the async method
        content = await claude_service.generate_question_content_async(request.question)
        
        return {
            "question": request.question,
            "content": content,
            "character_count": len(content),
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error generating question content: {e}")
        raise HTTPException(status_code=500, detail="Error generating question content")
from fastapi import APIRouter, HTTPException, Request
from typing import List, Optional
import logging
from datetime import datetime, timedelta

from models.search_models import (
    Company,
    CompanyCreate,
    CompanyUpdate,
    SearchHistory,
    DashboardStats
)
from database import db, ensure_personal_company

logger = logging.getLogger(__name__)
router = APIRouter()

def get_user_id_from_request(request: Request) -> str:
    """Extract user ID from request headers or auth token"""
    # For now, we'll use a simple header-based approach
    # In production, this would validate JWT tokens
    user_id = request.headers.get("X-User-ID")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID required")
    return user_id

@router.get("/companies", response_model=List[Company])
async def get_user_companies(request: Request):
    """Get all companies for the authenticated user"""
    
    try:
        user_id = get_user_id_from_request(request)
        
        # Ensure user has a Personal company
        await ensure_personal_company(user_id)
        
        # Get all companies for the user
        cursor = db.companies.find({"user_id": user_id}).sort("is_personal", -1).sort("created_at", 1)
        companies = await cursor.to_list(length=None)
        
        return [Company(**company) for company in companies]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching companies for user: {e}")
        raise HTTPException(status_code=500, detail="Error fetching companies")

@router.post("/companies", response_model=Company)
async def create_company(company_data: CompanyCreate, request: Request):
    """Create a new company for the authenticated user"""
    
    try:
        user_id = get_user_id_from_request(request)
        
        # Check if company name already exists for this user
        existing_company = await db.companies.find_one({
            "user_id": user_id,
            "name": company_data.name
        })
        
        if existing_company:
            raise HTTPException(
                status_code=400, 
                detail=f"Company with name '{company_data.name}' already exists"
            )
        
        # Create new company
        new_company = Company(
            name=company_data.name,
            user_id=user_id,
            is_personal=False
        )
        
        await db.companies.insert_one(new_company.dict())
        logger.info(f"Created company '{company_data.name}' for user: {user_id}")
        
        return new_company
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating company: {e}")
        raise HTTPException(status_code=500, detail="Error creating company")

@router.put("/companies/{company_id}", response_model=Company)
async def update_company(company_id: str, company_data: CompanyUpdate, request: Request):
    """Update a company (only name can be updated)"""
    
    try:
        user_id = get_user_id_from_request(request)
        
        # Check if company exists and belongs to user
        company = await db.companies.find_one({
            "id": company_id,
            "user_id": user_id
        })
        
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Don't allow renaming Personal company
        if company.get("is_personal", False):
            raise HTTPException(status_code=400, detail="Cannot rename Personal company")
        
        # Check if new name conflicts with existing company
        existing_company = await db.companies.find_one({
            "user_id": user_id,
            "name": company_data.name,
            "id": {"$ne": company_id}
        })
        
        if existing_company:
            raise HTTPException(
                status_code=400,
                detail=f"Company with name '{company_data.name}' already exists"
            )
        
        # Update company
        updated_data = {
            "name": company_data.name,
            "updated_at": datetime.utcnow()
        }
        
        await db.companies.update_one(
            {"id": company_id, "user_id": user_id},
            {"$set": updated_data}
        )
        
        # Get updated company
        updated_company = await db.companies.find_one({"id": company_id})
        logger.info(f"Updated company {company_id} for user: {user_id}")
        
        return Company(**updated_company)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating company: {e}")
        raise HTTPException(status_code=500, detail="Error updating company")

@router.delete("/companies/{company_id}")
async def delete_company(company_id: str, request: Request):
    """Delete a company (except Personal company)"""
    
    try:
        user_id = get_user_id_from_request(request)
        
        # Check if company exists and belongs to user
        company = await db.companies.find_one({
            "id": company_id,
            "user_id": user_id
        })
        
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Don't allow deleting Personal company
        if company.get("is_personal", False):
            raise HTTPException(status_code=400, detail="Cannot delete Personal company")
        
        # Delete all search history for this company
        await db.search_history.delete_many({
            "company_id": company_id,
            "user_id": user_id
        })
        
        # Delete the company
        result = await db.companies.delete_one({
            "id": company_id,
            "user_id": user_id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Company not found")
        
        logger.info(f"Deleted company {company_id} for user: {user_id}")
        
        return {"message": "Company deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting company: {e}")
        raise HTTPException(status_code=500, detail="Error deleting company")

@router.get("/companies/{company_id}/searches", response_model=List[SearchHistory])
async def get_company_searches(
    company_id: str, 
    request: Request,
    limit: int = 50, 
    offset: int = 0
):
    """Get search history for a specific company"""
    
    try:
        user_id = get_user_id_from_request(request)
        
        # Verify company belongs to user
        company = await db.companies.find_one({
            "id": company_id,
            "user_id": user_id
        })
        
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Get search history for this company
        cursor = db.search_history.find({
            "company_id": company_id,
            "user_id": user_id
        }).sort("created_at", -1).skip(offset).limit(limit)
        
        searches = await cursor.to_list(length=limit)
        
        return [SearchHistory(**search) for search in searches]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching company searches: {e}")
        raise HTTPException(status_code=500, detail="Error fetching company searches")

@router.get("/dashboard/{company_id}", response_model=DashboardStats)
async def get_dashboard_stats(company_id: str, request: Request):
    """Get dashboard statistics for a specific company"""
    
    try:
        user_id = get_user_id_from_request(request)
        
        # Verify company belongs to user
        company = await db.companies.find_one({
            "id": company_id,
            "user_id": user_id
        })
        
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Get total searches for this company
        total_searches = await db.search_history.count_documents({
            "company_id": company_id,
            "user_id": user_id
        })
        
        # Get recent searches (last 10)
        recent_cursor = db.search_history.find({
            "company_id": company_id,
            "user_id": user_id
        }).sort("created_at", -1).limit(10)
        
        recent_searches = []
        async for search in recent_cursor:
            recent_searches.append({
                "id": search["id"],
                "search_term": search["search_term"],
                "suggestions_count": search["suggestions_count"],
                "created_at": search["created_at"]
            })
        
        # Get popular terms for this company
        popular_pipeline = [
            {
                "$match": {
                    "company_id": company_id,
                    "user_id": user_id
                }
            },
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
        
        # Get search trends (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        trends_pipeline = [
            {
                "$match": {
                    "company_id": company_id,
                    "user_id": user_id,
                    "created_at": {"$gte": thirty_days_ago}
                }
            },
            {
                "$group": {
                    "_id": {
                        "$dateToString": {
                            "format": "%Y-%m-%d",
                            "date": "$created_at"
                        }
                    },
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        
        trends_cursor = db.search_history.aggregate(trends_pipeline)
        search_trends = []
        async for doc in trends_cursor:
            search_trends.append({
                "date": doc["_id"],
                "count": doc["count"]
            })
        
        return DashboardStats(
            total_searches=total_searches,
            recent_searches=recent_searches,
            popular_terms=popular_terms,
            search_trends=search_trends,
            company_info=Company(**company)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {e}")
        raise HTTPException(status_code=500, detail="Error fetching dashboard stats")
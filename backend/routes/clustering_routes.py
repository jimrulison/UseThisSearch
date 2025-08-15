"""
API Routes for Keyword Clustering Engine
Premium feature for annual subscribers only
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import List, Dict, Optional
import asyncio
from datetime import datetime, timedelta
import json
import csv
import io
import uuid

from models.clustering_models import (
    KeywordClusterRequest, ClusterAnalysisResult, ClusterExportRequest,
    ClusterUpdateRequest, ClusterStats, ClusteringUsageLimit,
    CLUSTERING_REQUIRED_PLANS, CLUSTERING_LIMITS, CLUSTERING_FEATURE_NAME,
    CLUSTER_ANALYSES_COLLECTION, CLUSTER_USAGE_COLLECTION
)
from services.clustering_service import cluster_keywords_async
from database import get_database
from billing.billing_middleware import require_subscription_plan

router = APIRouter(prefix="/api/clustering", tags=["clustering"])

async def verify_clustering_access(user_id: str, company_id: str):
    """Verify user has access to clustering features"""
    
    db = await get_database()
    
    # Check if user has required subscription plan
    billing_collection = db["billing_subscriptions"]
    subscription = await billing_collection.find_one({
        "company_id": company_id,
        "status": "active"
    })
    
    if not subscription:
        raise HTTPException(
            status_code=403,
            detail="Active subscription required for clustering features"
        )
    
    plan_type = subscription.get("plan_type", "")
    if plan_type not in CLUSTERING_REQUIRED_PLANS:
        raise HTTPException(
            status_code=403,
            detail="Annual subscription required for clustering features. Upgrade to Professional Annual or higher."
        )
    
    return subscription

async def check_usage_limits(user_id: str, company_id: str, keywords_count: int):
    """Check if user is within usage limits"""
    
    db = await get_database()
    
    # Get user's subscription plan
    subscription = await verify_clustering_access(user_id, company_id)
    plan_type = subscription.get("plan_type", "")
    
    # Get plan limits
    limits = CLUSTERING_LIMITS.get(plan_type, CLUSTERING_LIMITS["professional_annual"])
    
    # Check current month usage
    current_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    usage_collection = db[CLUSTER_USAGE_COLLECTION]
    
    usage_record = await usage_collection.find_one({
        "user_id": user_id,
        "company_id": company_id,
        "month": current_month
    })
    
    if not usage_record:
        # Create new usage record
        usage_record = {
            "user_id": user_id,
            "company_id": company_id,
            "month": current_month,
            "analyses_count": 0,
            "keywords_processed": 0
        }
        await usage_collection.insert_one(usage_record)
    
    # Check limits
    if usage_record["analyses_count"] >= limits["monthly_analyses"]:
        raise HTTPException(
            status_code=429,
            detail=f"Monthly clustering limit reached ({limits['monthly_analyses']} analyses). Upgrade your plan for higher limits."
        )
    
    if keywords_count > limits["keywords_per_analysis"]:
        raise HTTPException(
            status_code=400,
            detail=f"Too many keywords for analysis. Limit: {limits['keywords_per_analysis']} keywords per analysis."
        )
    
    return usage_record

async def update_usage_stats(user_id: str, company_id: str, keywords_count: int, clusters_count: int):
    """Update usage statistics"""
    
    db = await get_database()
    current_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Update monthly usage
    usage_collection = db[CLUSTER_USAGE_COLLECTION]
    await usage_collection.update_one(
        {
            "user_id": user_id,
            "company_id": company_id,
            "month": current_month
        },
        {
            "$inc": {
                "analyses_count": 1,
                "keywords_processed": keywords_count,
                "clusters_created": clusters_count
            },
            "$set": {
                "last_analysis_date": datetime.utcnow()
            }
        },
        upsert=True
    )

@router.post("/analyze", response_model=ClusterAnalysisResult)
async def cluster_keywords(
    request: KeywordClusterRequest,
    background_tasks: BackgroundTasks
):
    """
    Perform keyword clustering analysis
    Premium feature - requires annual subscription
    """
    
    try:
        # Verify access and usage limits
        await verify_clustering_access(request.user_id, request.company_id)
        usage_record = await check_usage_limits(request.user_id, request.company_id, len(request.keywords))
        
        # Perform clustering analysis
        clustering_result = await cluster_keywords_async(
            keywords=request.keywords,
            search_volumes=request.search_volumes,
            difficulties=request.difficulties
        )
        
        # Create analysis result
        analysis_id = str(uuid.uuid4())
        
        # Convert clustering result to database model
        clusters_data = []
        for cluster in clustering_result.clusters:
            clusters_data.append({
                "id": cluster.id,
                "name": cluster.name,
                "primary_keyword": cluster.primary_keyword,
                "keywords": cluster.keywords,
                "search_intent": cluster.search_intent,
                "topic_theme": cluster.topic_theme,
                "search_volume_total": cluster.search_volume_total,
                "difficulty_average": cluster.difficulty_average,
                "content_suggestions": cluster.content_suggestions,
                "buyer_journey_stage": cluster.buyer_journey_stage,
                "priority_score": cluster.priority_score,
                "created_at": cluster.created_at
            })
        
        content_gaps_data = []
        for gap in clustering_result.content_gaps:
            content_gaps_data.append({
                "type": gap["type"],
                "intent": gap.get("intent"),
                "stage": gap.get("stage"),
                "description": gap["description"],
                "recommendation": gap["recommendation"],
                "priority": gap["priority"]
            })
        
        pillar_opportunities_data = []
        for opportunity in clustering_result.pillar_opportunities:
            pillar_opportunities_data.append({
                "type": opportunity["type"],
                "cluster_name": opportunity.get("cluster_name"),
                "primary_keyword": opportunity.get("primary_keyword"),
                "intent": opportunity.get("intent"),
                "supporting_keywords": opportunity.get("supporting_keywords"),
                "clusters_involved": opportunity.get("clusters_involved"),
                "total_keywords": opportunity.get("total_keywords"),
                "search_volume": opportunity.get("search_volume"),
                "total_search_volume": opportunity.get("total_search_volume"),
                "content_suggestions": opportunity.get("content_suggestions"),
                "description": opportunity.get("description"),
                "priority": opportunity["priority"]
            })
        
        analysis_result = ClusterAnalysisResult(
            id=analysis_id,
            user_id=request.user_id,
            company_id=request.company_id,
            total_keywords=clustering_result.total_keywords,
            total_clusters=clustering_result.total_clusters,
            clusters=clusters_data,
            unclustered_keywords=clustering_result.unclustered_keywords,
            content_gaps=content_gaps_data,
            pillar_opportunities=pillar_opportunities_data,
            processing_time=clustering_result.processing_time,
            created_at=datetime.utcnow()
        )
        
        # Save to database
        db = await get_database()
        analyses_collection = db[CLUSTER_ANALYSES_COLLECTION]
        
        await analyses_collection.insert_one(analysis_result.dict())
        
        # Update usage stats in background
        background_tasks.add_task(
            update_usage_stats,
            request.user_id,
            request.company_id,
            len(request.keywords),
            len(clusters_data)
        )
        
        return analysis_result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Clustering analysis failed: {str(e)}"
        )

@router.get("/analyses", response_model=List[Dict])
async def get_user_analyses(
    user_id: str,
    company_id: str,
    limit: int = 10,
    skip: int = 0
):
    """Get user's clustering analyses history"""
    
    await verify_clustering_access(user_id, company_id)
    
    db = await get_database()
    analyses_collection = db[CLUSTER_ANALYSES_COLLECTION]
    
    # Get analyses for user/company
    cursor = analyses_collection.find(
        {
            "user_id": user_id,
            "company_id": company_id
        }
    ).sort("created_at", -1).skip(skip).limit(limit)
    
    analyses = []
    async for analysis in cursor:
        # Return summary without full cluster data
        analyses.append({
            "id": analysis["id"],
            "total_keywords": analysis["total_keywords"],
            "total_clusters": analysis["total_clusters"],
            "processing_time": analysis["processing_time"],
            "created_at": analysis["created_at"]
        })
    
    return analyses

@router.get("/analyses/{analysis_id}", response_model=ClusterAnalysisResult)
async def get_analysis_details(
    analysis_id: str,
    user_id: str,
    company_id: str
):
    """Get detailed analysis results"""
    
    await verify_clustering_access(user_id, company_id)
    
    db = await get_database()
    analyses_collection = db[CLUSTER_ANALYSES_COLLECTION]
    
    analysis = await analyses_collection.find_one({
        "id": analysis_id,
        "user_id": user_id,
        "company_id": company_id
    })
    
    if not analysis:
        raise HTTPException(
            status_code=404,
            detail="Analysis not found"
        )
    
    return ClusterAnalysisResult(**analysis)

@router.post("/export")
async def export_analysis(request: ClusterExportRequest, user_id: str, company_id: str):
    """Export clustering analysis in various formats"""
    
    await verify_clustering_access(user_id, company_id)
    
    db = await get_database()
    analyses_collection = db[CLUSTER_ANALYSES_COLLECTION]
    
    analysis = await analyses_collection.find_one({
        "id": request.analysis_id,
        "user_id": user_id,
        "company_id": company_id
    })
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    if request.format.lower() == "csv":
        return await export_csv(analysis, request)
    elif request.format.lower() == "json":
        return await export_json(analysis, request)
    else:
        raise HTTPException(status_code=400, detail="Unsupported export format")

async def export_csv(analysis: Dict, request: ClusterExportRequest):
    """Export analysis as CSV"""
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    headers = [
        "Cluster_ID", "Cluster_Name", "Primary_Keyword", "Keywords", 
        "Search_Intent", "Buyer_Journey_Stage", "Search_Volume_Total",
        "Difficulty_Average", "Priority_Score"
    ]
    
    if request.include_suggestions:
        headers.append("Content_Suggestions")
    
    writer.writerow(headers)
    
    # Write cluster data
    for cluster in analysis["clusters"]:
        row = [
            cluster["id"],
            cluster["name"],
            cluster["primary_keyword"],
            "; ".join(cluster["keywords"]),
            cluster["search_intent"],
            cluster["buyer_journey_stage"],
            cluster["search_volume_total"],
            cluster["difficulty_average"],
            cluster["priority_score"]
        ]
        
        if request.include_suggestions:
            row.append("; ".join(cluster["content_suggestions"]))
        
        writer.writerow(row)
    
    # Add gaps section if requested
    if request.include_gaps and analysis["content_gaps"]:
        writer.writerow([])  # Empty row
        writer.writerow(["CONTENT GAPS"])
        writer.writerow(["Type", "Description", "Recommendation", "Priority"])
        
        for gap in analysis["content_gaps"]:
            writer.writerow([
                gap["type"],
                gap["description"],
                gap["recommendation"],
                gap["priority"]
            ])
    
    # Add opportunities section if requested
    if request.include_opportunities and analysis["pillar_opportunities"]:
        writer.writerow([])  # Empty row
        writer.writerow(["PILLAR OPPORTUNITIES"])
        writer.writerow(["Type", "Description", "Priority", "Keywords", "Search_Volume"])
        
        for opp in analysis["pillar_opportunities"]:
            writer.writerow([
                opp["type"],
                opp.get("description", ""),
                opp["priority"],
                opp.get("total_keywords", opp.get("supporting_keywords", "")),
                opp.get("total_search_volume", opp.get("search_volume", ""))
            ])
    
    output.seek(0)
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=keyword_clusters_{analysis['id']}.csv"}
    )

async def export_json(analysis: Dict, request: ClusterExportRequest):
    """Export analysis as JSON"""
    
    export_data = {
        "analysis_id": analysis["id"],
        "created_at": analysis["created_at"].isoformat(),
        "total_keywords": analysis["total_keywords"],
        "total_clusters": analysis["total_clusters"],
        "clusters": analysis["clusters"]
    }
    
    if request.include_gaps:
        export_data["content_gaps"] = analysis["content_gaps"]
    
    if request.include_opportunities:
        export_data["pillar_opportunities"] = analysis["pillar_opportunities"]
    
    json_str = json.dumps(export_data, indent=2, default=str)
    
    return StreamingResponse(
        io.BytesIO(json_str.encode()),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=keyword_clusters_{analysis['id']}.json"}
    )

@router.get("/stats", response_model=ClusterStats)
async def get_clustering_stats(user_id: str, company_id: str):
    """Get user's clustering usage statistics"""
    
    await verify_clustering_access(user_id, company_id)
    
    db = await get_database()
    analyses_collection = db[CLUSTER_ANALYSES_COLLECTION]
    
    # Aggregate statistics
    pipeline = [
        {"$match": {"user_id": user_id, "company_id": company_id}},
        {"$group": {
            "_id": None,
            "total_analyses": {"$sum": 1},
            "total_keywords": {"$sum": "$total_keywords"},
            "total_clusters": {"$sum": "$total_clusters"},
            "last_analysis": {"$max": "$created_at"}
        }}
    ]
    
    stats_result = await analyses_collection.aggregate(pipeline).to_list(1)
    
    if not stats_result:
        # No analyses yet
        return ClusterStats(
            total_analyses=0,
            total_keywords_clustered=0,
            total_clusters_created=0,
            average_clusters_per_analysis=0.0,
            most_common_intent="informational",
            most_common_stage="awareness",
            last_analysis_date=None,
            premium_features_used=["keyword_clustering"]
        )
    
    stats = stats_result[0]
    
    # Get most common intent and stage
    intent_pipeline = [
        {"$match": {"user_id": user_id, "company_id": company_id}},
        {"$unwind": "$clusters"},
        {"$group": {
            "_id": "$clusters.search_intent",
            "count": {"$sum": 1}
        }},
        {"$sort": {"count": -1}},
        {"$limit": 1}
    ]
    
    stage_pipeline = [
        {"$match": {"user_id": user_id, "company_id": company_id}},
        {"$unwind": "$clusters"},
        {"$group": {
            "_id": "$clusters.buyer_journey_stage",
            "count": {"$sum": 1}
        }},
        {"$sort": {"count": -1}},
        {"$limit": 1}
    ]
    
    intent_result = await analyses_collection.aggregate(intent_pipeline).to_list(1)
    stage_result = await analyses_collection.aggregate(stage_pipeline).to_list(1)
    
    most_common_intent = intent_result[0]["_id"] if intent_result else "informational"
    most_common_stage = stage_result[0]["_id"] if stage_result else "awareness"
    
    return ClusterStats(
        total_analyses=stats["total_analyses"],
        total_keywords_clustered=stats["total_keywords"],
        total_clusters_created=stats["total_clusters"],
        average_clusters_per_analysis=stats["total_clusters"] / stats["total_analyses"],
        most_common_intent=most_common_intent,
        most_common_stage=most_common_stage,
        last_analysis_date=stats["last_analysis"],
        premium_features_used=["keyword_clustering"]
    )

@router.get("/usage-limits", response_model=ClusteringUsageLimit)
async def get_usage_limits(user_id: str, company_id: str):
    """Get current usage limits and consumption"""
    
    subscription = await verify_clustering_access(user_id, company_id)
    plan_type = subscription.get("plan_type", "")
    
    # Get plan limits
    limits = CLUSTERING_LIMITS.get(plan_type, CLUSTERING_LIMITS["professional_annual"])
    
    # Get current usage
    db = await get_database()
    current_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    usage_collection = db[CLUSTER_USAGE_COLLECTION]
    
    usage_record = await usage_collection.find_one({
        "user_id": user_id,
        "company_id": company_id,
        "month": current_month
    })
    
    analyses_used = usage_record["analyses_count"] if usage_record else 0
    
    # Calculate reset date (first day of next month)
    next_month = current_month + timedelta(days=32)
    reset_date = next_month.replace(day=1)
    
    return ClusteringUsageLimit(
        plan_type=plan_type,
        monthly_analyses_limit=limits["monthly_analyses"],
        keywords_per_analysis_limit=limits["keywords_per_analysis"],
        analyses_used_this_month=analyses_used,
        reset_date=reset_date
    )

@router.delete("/analyses/{analysis_id}")
async def delete_analysis(analysis_id: str, user_id: str, company_id: str):
    """Delete a clustering analysis"""
    
    await verify_clustering_access(user_id, company_id)
    
    db = await get_database()
    analyses_collection = db[CLUSTER_ANALYSES_COLLECTION]
    
    result = await analyses_collection.delete_one({
        "id": analysis_id,
        "user_id": user_id,
        "company_id": company_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return {"message": "Analysis deleted successfully"}
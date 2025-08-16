"""
Database models for Keyword Clustering Engine
Premium feature for annual subscribers
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum

class SearchIntent(str, Enum):
    """Search intent categories"""
    INFORMATIONAL = "informational"
    COMMERCIAL = "commercial"
    TRANSACTIONAL = "transactional"
    NAVIGATIONAL = "navigational"

class BuyerJourneyStage(str, Enum):
    """Buyer journey stages"""
    AWARENESS = "awareness"
    CONSIDERATION = "consideration"
    DECISION = "decision"

class ClusterPriority(str, Enum):
    """Cluster priority levels"""
    LOW = "low"
    MEDIUM = "medium" 
    HIGH = "high"
    CRITICAL = "critical"

class KeywordClusterRequest(BaseModel):
    """Request model for clustering keywords"""
    keywords: List[str] = Field(..., min_items=2, max_items=500, description="Keywords to cluster")
    search_volumes: Optional[List[int]] = Field(None, description="Search volumes for keywords")
    difficulties: Optional[List[float]] = Field(None, description="Keyword difficulties (0-100)")
    max_clusters: Optional[int] = Field(15, ge=2, le=25, description="Maximum number of clusters")
    user_id: str = Field(..., description="User ID for tracking")
    company_id: str = Field(..., description="Company ID for data isolation")

class KeywordClusterModel(BaseModel):
    """Model for a keyword cluster"""
    id: str = Field(..., description="Unique cluster identifier")
    name: str = Field(..., description="Human-readable cluster name")
    primary_keyword: str = Field(..., description="Most representative keyword")
    keywords: List[str] = Field(..., description="All keywords in cluster")
    search_intent: SearchIntent = Field(..., description="Dominant search intent")
    topic_theme: str = Field(..., description="Main topic theme")
    search_volume_total: int = Field(0, ge=0, description="Total search volume")
    difficulty_average: float = Field(0.0, ge=0.0, le=100.0, description="Average keyword difficulty")
    content_suggestions: List[str] = Field(..., description="Suggested content titles")
    buyer_journey_stage: BuyerJourneyStage = Field(..., description="Buyer journey stage")
    priority_score: float = Field(..., ge=0.0, le=100.0, description="Priority score (0-100)")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ContentGap(BaseModel):
    """Model for content gap analysis"""
    type: str = Field(..., description="Type of gap (search_intent_gap, buyer_journey_gap)")
    intent: Optional[str] = Field(None, description="Search intent with gap")
    stage: Optional[str] = Field(None, description="Buyer journey stage with gap")
    description: str = Field(..., description="Gap description")
    recommendation: str = Field(..., description="Recommended action")
    priority: ClusterPriority = Field(..., description="Gap priority level")

class PillarOpportunity(BaseModel):
    """Model for content pillar opportunities"""
    type: str = Field(..., description="Opportunity type (pillar_page, topic_hub)")
    cluster_name: Optional[str] = Field(None, description="Related cluster name")
    primary_keyword: Optional[str] = Field(None, description="Primary target keyword")
    intent: Optional[str] = Field(None, description="Search intent for topic hub")
    supporting_keywords: Optional[int] = Field(None, description="Number of supporting keywords")
    clusters_involved: Optional[int] = Field(None, description="Number of clusters in hub")
    total_keywords: Optional[int] = Field(None, description="Total keywords involved")
    search_volume: Optional[int] = Field(None, description="Total search volume")
    total_search_volume: Optional[int] = Field(None, description="Total search volume for hub")
    content_suggestions: Optional[List[str]] = Field(None, description="Content suggestions")
    description: Optional[str] = Field(None, description="Opportunity description")
    priority: ClusterPriority = Field(..., description="Opportunity priority")

class ClusterAnalysisResult(BaseModel):
    """Complete clustering analysis result"""
    id: str = Field(..., description="Analysis ID")
    user_id: str = Field(..., description="User who requested analysis")
    company_id: str = Field(..., description="Company workspace")
    total_keywords: int = Field(..., ge=0, description="Total keywords analyzed")
    total_clusters: int = Field(..., ge=0, description="Number of clusters created")
    clusters: List[KeywordClusterModel] = Field(..., description="All keyword clusters")
    unclustered_keywords: List[str] = Field(default_factory=list, description="Keywords not assigned to clusters")
    content_gaps: List[ContentGap] = Field(default_factory=list, description="Identified content gaps")
    pillar_opportunities: List[PillarOpportunity] = Field(default_factory=list, description="Content pillar opportunities")
    processing_time: float = Field(..., ge=0.0, description="Processing time in seconds")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
class ClusterExportRequest(BaseModel):
    """Request for exporting cluster data"""
    analysis_id: str = Field(..., description="Analysis ID to export")
    format: str = Field("csv", description="Export format (csv, json, xlsx)")
    include_suggestions: bool = Field(True, description="Include content suggestions")
    include_gaps: bool = Field(True, description="Include gap analysis")
    include_opportunities: bool = Field(True, description="Include pillar opportunities")

class ClusterUpdateRequest(BaseModel):
    """Request for updating cluster information"""
    cluster_id: str = Field(..., description="Cluster ID to update")
    name: Optional[str] = Field(None, description="New cluster name")
    primary_keyword: Optional[str] = Field(None, description="New primary keyword")
    keywords: Optional[List[str]] = Field(None, description="Updated keyword list")
    search_intent: Optional[SearchIntent] = Field(None, description="Updated search intent")
    buyer_journey_stage: Optional[BuyerJourneyStage] = Field(None, description="Updated journey stage")

class ClusterStats(BaseModel):
    """Statistics about user's clustering usage"""
    total_analyses: int = Field(..., description="Total clustering analyses performed")
    total_keywords_clustered: int = Field(..., description="Total keywords processed")
    total_clusters_created: int = Field(..., description="Total clusters created")
    average_clusters_per_analysis: float = Field(..., description="Average clusters per analysis")
    most_common_intent: str = Field(..., description="Most common search intent")
    most_common_stage: str = Field(..., description="Most common buyer journey stage")
    last_analysis_date: Optional[datetime] = Field(None, description="Date of last analysis")
    premium_features_used: List[str] = Field(default_factory=list, description="Premium features utilized")

class ClusteringUsageLimit(BaseModel):
    """Usage limits for clustering feature"""
    plan_type: str = Field(..., description="Subscription plan type")
    monthly_analyses_limit: int = Field(..., description="Monthly clustering analyses allowed")
    keywords_per_analysis_limit: int = Field(..., description="Keywords per analysis limit")
    analyses_used_this_month: int = Field(0, description="Analyses used in current month")
    reset_date: datetime = Field(..., description="When usage counters reset")

# MongoDB collection names
CLUSTER_ANALYSES_COLLECTION = "cluster_analyses"
CLUSTER_USAGE_COLLECTION = "cluster_usage"
CLUSTER_STATS_COLLECTION = "cluster_stats"

# Access control constants
CLUSTERING_REQUIRED_PLANS = ["annual", "professional_annual", "agency_annual", "enterprise_annual", "annual_gift"]
CLUSTERING_FEATURE_NAME = "keyword_clustering"

# Default limits by plan
CLUSTERING_LIMITS = {
    "annual": {
        "monthly_analyses": 100,
        "keywords_per_analysis": 1000
    },
    "professional_annual": {
        "monthly_analyses": 50,
        "keywords_per_analysis": 500
    },
    "agency_annual": {
        "monthly_analyses": 200,
        "keywords_per_analysis": 1000
    },
    "enterprise_annual": {
        "monthly_analyses": 1000,
        "keywords_per_analysis": 2000
    },
    "annual_gift": {
        "monthly_analyses": 100,  # Enhanced limits for gift recipients
        "keywords_per_analysis": 1000,
        "bonus_credits": 500,
        "priority_processing": True
    }
}
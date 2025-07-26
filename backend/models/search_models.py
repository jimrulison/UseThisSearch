from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Union
from datetime import datetime
import uuid

class SearchRequest(BaseModel):
    search_term: str = Field(..., min_length=1, max_length=100, description="The keyword to search for")
    
    class Config:
        json_schema_extra = {
            "example": {
                "search_term": "digital marketing"
            }
        }

class SuggestionItem(BaseModel):
    text: str = Field(..., description="The suggestion text")
    popularity: str = Field(..., description="Popularity level: HIGH, MEDIUM, or LOW")

class SearchSuggestions(BaseModel):
    questions: List[SuggestionItem] = Field(default_factory=list, description="Question-based suggestions with popularity")
    prepositions: List[SuggestionItem] = Field(default_factory=list, description="Preposition-based suggestions with popularity") 
    comparisons: List[SuggestionItem] = Field(default_factory=list, description="Comparison-based suggestions with popularity")
    alphabetical: List[SuggestionItem] = Field(default_factory=list, description="Alphabetical suggestions with popularity")

class SearchResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    search_term: str
    suggestions: SearchSuggestions
    total_suggestions: int
    created_at: datetime = Field(default_factory=datetime.utcnow)
    processing_time_ms: Optional[int] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "search_term": "digital marketing",
                "suggestions": {
                    "questions": [
                        {"text": "what is digital marketing", "popularity": "HIGH"},
                        {"text": "how to start digital marketing", "popularity": "HIGH"}
                    ],
                    "prepositions": [
                        {"text": "digital marketing for beginners", "popularity": "HIGH"},
                        {"text": "digital marketing with AI", "popularity": "MEDIUM"}
                    ],
                    "comparisons": [
                        {"text": "digital marketing vs traditional marketing", "popularity": "HIGH"}
                    ],
                    "alphabetical": [
                        {"text": "affordable digital marketing", "popularity": "HIGH"},
                        {"text": "best digital marketing tools", "popularity": "HIGH"}
                    ]
                },
                "total_suggestions": 45,
                "created_at": "2025-01-16T10:30:00Z",
                "processing_time_ms": 1250
            }
        }

class SearchHistory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    search_term: str
    suggestions_count: int
    company_id: str = Field(..., description="ID of the company this search belongs to")
    user_id: str = Field(..., description="ID of the user who performed the search")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

class Company(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(..., min_length=1, max_length=100, description="Company name")
    user_id: str = Field(..., description="ID of the user who owns this company")
    is_personal: bool = Field(default=False, description="Whether this is the default Personal company")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "name": "My Marketing Agency",
                "user_id": "user_123",
                "is_personal": False,
                "created_at": "2025-01-16T10:30:00Z",
                "updated_at": "2025-01-16T10:30:00Z"
            }
        }

class CompanyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Company name")
    
class CompanyUpdate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Updated company name")

class DashboardStats(BaseModel):
    total_searches: int = 0
    recent_searches: List[Dict] = Field(default_factory=list, description="Recent searches with details")
    popular_terms: List[Dict[str, int]] = Field(default_factory=list)
    search_trends: List[Dict] = Field(default_factory=list, description="Search trends over time")
    company_info: Optional[Company] = None

class SearchStats(BaseModel):
    total_searches: int = 0
    popular_terms: List[Dict[str, int]] = Field(default_factory=list)
    recent_searches: List[str] = Field(default_factory=list)
    average_suggestions_per_search: float = 0.0
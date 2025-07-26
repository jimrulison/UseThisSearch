from pydantic import BaseModel, Field
from typing import List, Dict, Optional
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

class SearchSuggestions(BaseModel):
    questions: List[str] = Field(default_factory=list, description="Question-based suggestions")
    prepositions: List[str] = Field(default_factory=list, description="Preposition-based suggestions") 
    comparisons: List[str] = Field(default_factory=list, description="Comparison-based suggestions")
    alphabetical: List[str] = Field(default_factory=list, description="Alphabetical suggestions")

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
                    "questions": ["what is digital marketing", "how to start digital marketing"],
                    "prepositions": ["digital marketing for beginners", "digital marketing with AI"],
                    "comparisons": ["digital marketing vs traditional marketing"],
                    "alphabetical": ["affordable digital marketing", "best digital marketing tools"]
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
    created_at: datetime = Field(default_factory=datetime.utcnow)
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

class SearchStats(BaseModel):
    total_searches: int = 0
    popular_terms: List[Dict[str, int]] = Field(default_factory=list)
    recent_searches: List[str] = Field(default_factory=list)
    average_suggestions_per_search: float = 0.0
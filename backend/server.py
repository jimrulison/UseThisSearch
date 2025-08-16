from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime
import asyncio
from contextlib import asynccontextmanager

# Import new modules - using absolute imports
import sys
sys.path.append('/app/backend')

from routes.search_routes import router as search_router
from routes.company_routes import router as company_router
from routes.user_management_routes import router as user_management_router

# NEW: Import billing routes (additive - don't modify existing imports)
from billing.billing_routes import router as billing_router
from billing.safe_billing_routes import router as safe_billing_router

# NEW: Import admin routes (additive)
from routes.admin_routes import router as admin_router
from routes.admin_analytics_routes import router as admin_analytics_router
from routes.admin_custom_pricing_routes import router as admin_custom_pricing_router
from routes.admin_trial_routes import router as admin_trial_router

# NEW: Import clustering routes (additive)
from routes.clustering_routes import router as clustering_router

# NEW: Import support routes (additive)
from routes.support_routes import router as support_router
from routes.admin_support_routes import router as admin_support_router

# NEW: Import trial and auth routes (additive)
from routes.trial_routes import router as trial_router
from routes.auth_routes import router as auth_router

# Import scheduler
from services.trial_scheduler import get_trial_scheduler

from database import init_database, close_database

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    logger.info("Starting Use This Search API...")
    
    # Initialize database
    await init_database()
    
    # Start trial scheduler
    scheduler = get_trial_scheduler()
    scheduler_task = asyncio.create_task(scheduler.start_scheduler())
    logger.info("Trial scheduler started")
    
    yield
    
    # Cleanup
    scheduler.stop_scheduler()
    scheduler_task.cancel()
    try:
        await scheduler_task
    except asyncio.CancelledError:
        pass
    
    await close_database()
    logger.info("API shutdown complete!")

# Create the main app without a prefix
app = FastAPI(
    title="Use This Search - AI Keyword Research Tool",
    description="AI-powered keyword research and question generation API for content creators and marketers",
    version="1.0.0",
    lifespan=lifespan
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models (keeping existing ones for compatibility)
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Add existing routes (keeping for compatibility)
@api_router.get("/")
async def root():
    return {"message": "Use This Search API - Ready to generate keyword suggestions!"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Health check endpoint
@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Use This Search API",
        "timestamp": datetime.utcnow().isoformat()
    }

# Include the search routes (UNCHANGED)
api_router.include_router(search_router, tags=["search"])

# Include the company routes (UNCHANGED)
api_router.include_router(company_router, tags=["companies"])

# NEW: Include user management routes (additive)
api_router.include_router(user_management_router, prefix="/users", tags=["user-management"])

# NEW: Include billing routes (additive)
api_router.include_router(billing_router, prefix="/billing", tags=["billing"])
api_router.include_router(safe_billing_router, prefix="/safe", tags=["safe-billing"])

# NEW: Include admin routes (additive)
api_router.include_router(admin_router, prefix="/admin", tags=["admin"])
api_router.include_router(admin_analytics_router, prefix="/admin/analytics", tags=["admin-analytics"])
api_router.include_router(admin_custom_pricing_router, prefix="/admin/custom-pricing", tags=["admin-custom-pricing"])
api_router.include_router(admin_trial_router, tags=["admin-trial"])

# NEW: Include clustering routes (additive)
api_router.include_router(clustering_router, prefix="/clustering", tags=["clustering"])

# NEW: Include support routes (additive)
api_router.include_router(support_router, tags=["support"])
api_router.include_router(admin_support_router, tags=["admin-support"])

# NEW: Include trial and auth routes (additive)
api_router.include_router(trial_router, tags=["trial"])
api_router.include_router(auth_router, tags=["auth"])

# Include the router in the main app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
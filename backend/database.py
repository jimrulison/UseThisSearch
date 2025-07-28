from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def init_database():
    """Initialize database with indexes and collections"""
    
    try:
        # Create indexes for better performance
        
        # Search history indexes (EXISTING - unchanged)
        await db.search_history.create_index("search_term")
        await db.search_history.create_index("created_at")
        await db.search_history.create_index("user_id")
        await db.search_history.create_index("company_id")
        await db.search_history.create_index([("user_id", 1), ("company_id", 1), ("created_at", -1)])
        await db.search_history.create_index([("search_term", 1), ("created_at", -1)])
        
        # Company indexes (EXISTING - unchanged)
        await db.companies.create_index("user_id")
        await db.companies.create_index([("user_id", 1), ("name", 1)], unique=True)
        await db.companies.create_index([("user_id", 1), ("is_personal", 1)])
        
        # NEW: Billing-related indexes (additive)
        # User subscriptions indexes
        await db.user_subscriptions.create_index("user_id")
        await db.user_subscriptions.create_index("stripe_customer_id")
        await db.user_subscriptions.create_index("stripe_subscription_id")
        await db.user_subscriptions.create_index([("user_id", 1), ("status", 1)])
        
        # Usage tracking indexes
        await db.usage_tracking.create_index([("user_id", 1), ("month_year", 1)], unique=True)
        await db.usage_tracking.create_index("user_id")
        await db.usage_tracking.create_index("month_year")
        
        # Payment history indexes
        await db.payment_history.create_index("user_id")
        await db.payment_history.create_index("subscription_id")
        await db.payment_history.create_index("created_at")
        await db.payment_history.create_index([("user_id", 1), ("created_at", -1)])
        
        # Billing alerts indexes
        await db.billing_alerts.create_index("user_id")
        await db.billing_alerts.create_index([("user_id", 1), ("acknowledged", 1)])
        await db.billing_alerts.create_index("created_at")
        
        # NEW: Admin-related indexes (additive)
        # Admin users indexes
        await db.admins.create_index("email", unique=True)
        await db.admins.create_index([("email", 1), ("is_active", 1)])
        
        # Admin sessions indexes
        await db.admin_sessions.create_index("admin_id")
        await db.admin_sessions.create_index("token", unique=True)
        await db.admin_sessions.create_index([("admin_id", 1), ("is_active", 1)])
        await db.admin_sessions.create_index("expires_at")
        
        logger.info("Database indexes created successfully (including billing and admin indexes)")
        
    except Exception as e:
        logger.error(f"Error initializing database: {e}")

async def ensure_personal_company(user_id: str) -> str:
    """Ensure user has a Personal company and return its ID"""
    try:
        # Check if user already has a Personal company
        personal_company = await db.companies.find_one({
            "user_id": user_id,
            "is_personal": True
        })
        
        if personal_company:
            return personal_company["id"]
        
        # Create Personal company for user
        from models.search_models import Company
        personal_company = Company(
            name="Personal",
            user_id=user_id,
            is_personal=True
        )
        
        await db.companies.insert_one(personal_company.dict())
        logger.info(f"Created Personal company for user: {user_id}")
        return personal_company.id
        
    except Exception as e:
        logger.error(f"Error ensuring personal company for user {user_id}: {e}")
        raise

async def close_database():
    """Close database connection"""
    try:
        client.close()
        logger.info("Database connection closed")
    except Exception as e:
        logger.error(f"Error closing database: {e}")
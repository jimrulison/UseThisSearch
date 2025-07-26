from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging

logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def init_database():
    """Initialize database with indexes and collections"""
    
    try:
        # Create indexes for better performance
        
        # Search history indexes
        await db.search_history.create_index("search_term")
        await db.search_history.create_index("created_at")
        await db.search_history.create_index([("search_term", 1), ("created_at", -1)])
        
        logger.info("Database indexes created successfully")
        
    except Exception as e:
        logger.error(f"Error initializing database: {e}")

async def close_database():
    """Close database connection"""
    try:
        client.close()
        logger.info("Database connection closed")
    except Exception as e:
        logger.error(f"Error closing database: {e}")
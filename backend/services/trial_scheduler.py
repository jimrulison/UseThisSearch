import asyncio
import logging
from datetime import datetime, timedelta
from typing import List

from ..models.billing_models import UserTrialInfo, TrialStatus
from ..database import get_database
from .email_service import get_email_service

logger = logging.getLogger(__name__)

class TrialScheduler:
    """Background scheduler for trial-related tasks"""
    
    def __init__(self):
        self.email_service = get_email_service()
        self.is_running = False
    
    async def start_scheduler(self):
        """Start the background scheduler"""
        if self.is_running:
            return
        
        self.is_running = True
        logger.info("Trial scheduler started")
        
        # Run scheduler loop
        while self.is_running:
            try:
                await self._run_daily_tasks()
                # Sleep for 1 hour between checks
                await asyncio.sleep(3600)
            except Exception as e:
                logger.error(f"Error in trial scheduler: {e}")
                await asyncio.sleep(300)  # Sleep 5 minutes on error
    
    def stop_scheduler(self):
        """Stop the scheduler"""
        self.is_running = False
        logger.info("Trial scheduler stopped")
    
    async def _run_daily_tasks(self):
        """Run daily trial management tasks"""
        try:
            # Send trial reminders
            await self._send_trial_reminders()
            
            # Send trial expired notices
            await self._send_trial_expired_notices()
            
            # Send data deletion warnings
            await self._send_data_deletion_warnings()
            
            # Clean up expired data
            await self._cleanup_expired_data()
            
            logger.info("Daily trial tasks completed")
            
        except Exception as e:
            logger.error(f"Error running daily trial tasks: {e}")
    
    async def _send_trial_reminders(self):
        """Send reminders to users on days 4, 5, 6, 7 of trial"""
        db = get_database()
        
        # Find active trial users who need reminders
        trial_users = db.users.find({
            "trial_info.trial_status": TrialStatus.ACTIVE,
            "subscription.plan_type": "trial"
        })
        
        reminder_count = 0
        
        async for user in trial_users:
            try:
                trial_info = UserTrialInfo(**user["trial_info"])
                days_into_trial = trial_info.days_into_trial()
                
                # Send reminder on days 4, 5, 6, 7 if not already sent
                if 4 <= days_into_trial <= 7 and days_into_trial not in trial_info.trial_reminders_sent:
                    
                    days_remaining = trial_info.days_remaining()
                    
                    await self.email_service.send_trial_reminder(
                        user["email"],
                        user.get("name", user["email"].split('@')[0]),
                        days_remaining
                    )
                    
                    # Mark reminder as sent
                    trial_info.trial_reminders_sent.append(days_into_trial)
                    
                    # Update database
                    db.users.update_one(
                        {"email": user["email"]},
                        {"$set": {"trial_info": trial_info.dict()}}
                    )
                    
                    reminder_count += 1
                    
            except Exception as e:
                logger.error(f"Error sending trial reminder to {user.get('email', 'unknown')}: {e}")
        
        if reminder_count > 0:
            logger.info(f"Sent {reminder_count} trial reminder emails")
    
    async def _send_trial_expired_notices(self):
        """Send notices to users whose trials just expired"""
        db = get_database()
        
        # Find users whose trials expired today
        trial_users = db.users.find({
            "trial_info.trial_status": TrialStatus.ACTIVE,
            "subscription.plan_type": "trial"
        })
        
        expired_count = 0
        
        async for user in trial_users:
            try:
                trial_info = UserTrialInfo(**user["trial_info"])
                
                # Check if trial expired (day 8+)
                if trial_info.is_trial_expired():
                    
                    # Update trial status to expired
                    trial_info.trial_status = TrialStatus.EXPIRED
                    trial_info.data_retention_start = datetime.utcnow()
                    
                    # Send expired notice
                    await self.email_service.send_trial_expired_notice(
                        user["email"],
                        user.get("name", user["email"].split('@')[0])
                    )
                    
                    # Update database
                    db.users.update_one(
                        {"email": user["email"]},
                        {"$set": {"trial_info": trial_info.dict()}}
                    )
                    
                    expired_count += 1
                    
            except Exception as e:
                logger.error(f"Error processing expired trial for {user.get('email', 'unknown')}: {e}")
        
        if expired_count > 0:
            logger.info(f"Processed {expired_count} expired trials")
    
    async def _send_data_deletion_warnings(self):
        """Send warnings before data deletion (7 days, 3 days, 1 day before)"""
        db = get_database()
        
        # Find users in data retention period
        retention_users = db.users.find({
            "trial_info.trial_status": TrialStatus.DATA_RETENTION
        })
        
        warning_count = 0
        
        async for user in retention_users:
            try:
                trial_info = UserTrialInfo(**user["trial_info"])
                
                if trial_info.data_retention_start:
                    days_since_expiry = (datetime.utcnow() - trial_info.data_retention_start).days
                    days_until_deletion = 30 - days_since_expiry
                    
                    # Send warnings at 7, 3, and 1 days before deletion
                    if days_until_deletion in [7, 3, 1]:
                        
                        # Check if we already sent this warning
                        warning_key = f"deletion_warning_{days_until_deletion}"
                        if warning_key not in trial_info.trial_reminders_sent:
                            
                            await self.email_service.send_data_deletion_warning(
                                user["email"],
                                user.get("name", user["email"].split('@')[0]),
                                days_until_deletion
                            )
                            
                            # Mark warning as sent
                            trial_info.trial_reminders_sent.append(warning_key)
                            
                            # Update database
                            db.users.update_one(
                                {"email": user["email"]},
                                {"$set": {"trial_info": trial_info.dict()}}
                            )
                            
                            warning_count += 1
                            
            except Exception as e:
                logger.error(f"Error sending deletion warning to {user.get('email', 'unknown')}: {e}")
        
        if warning_count > 0:
            logger.info(f"Sent {warning_count} data deletion warnings")
    
    async def _cleanup_expired_data(self):
        """Clean up data for users whose 30-day retention period has expired"""
        db = get_database()
        
        # Find users whose data retention has expired (30+ days after trial expiry)
        cutoff_date = datetime.utcnow() - timedelta(days=30)
        
        expired_users = db.users.find({
            "trial_info.trial_status": TrialStatus.DATA_RETENTION,
            "trial_info.data_retention_start": {"$lt": cutoff_date}
        })
        
        deleted_count = 0
        
        async for user in expired_users:
            try:
                user_email = user["email"]
                
                # Delete user's search history
                search_result = db.search_history.delete_many({"user_email": user_email})
                
                # Delete user's companies
                company_result = db.companies.delete_many({"user_email": user_email})
                
                # Delete user's support tickets and messages
                db.support_tickets.delete_many({"user_email": user_email})
                db.support_messages.delete_many({"sender_email": user_email})
                
                # Delete user account
                user_result = db.users.delete_one({"_id": user["_id"]})
                
                if user_result.deleted_count > 0:
                    deleted_count += 1
                    logger.info(f"Deleted expired trial data for {user_email}")
                    
            except Exception as e:
                logger.error(f"Error deleting expired data for {user.get('email', 'unknown')}: {e}")
        
        if deleted_count > 0:
            logger.info(f"Cleaned up {deleted_count} expired trial accounts")
        
        return deleted_count

# Global scheduler instance
_trial_scheduler = None

def get_trial_scheduler() -> TrialScheduler:
    """Get trial scheduler instance"""
    global _trial_scheduler
    if _trial_scheduler is None:
        _trial_scheduler = TrialScheduler()
    return _trial_scheduler

async def start_trial_scheduler():
    """Start the trial scheduler"""
    scheduler = get_trial_scheduler()
    await scheduler.start_scheduler()

def stop_trial_scheduler():
    """Stop the trial scheduler"""
    scheduler = get_trial_scheduler()
    scheduler.stop_scheduler()
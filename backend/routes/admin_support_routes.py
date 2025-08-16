from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
import uuid

from models.support_models import (
    FAQItem, FAQItemCreate, FAQItemUpdate,
    ChatMessage, ChatMessageCreate, ChatMessageResponse,
    SupportTicket, SupportTicketUpdate,
    SupportMessage, SupportMessageCreate, SupportMessageResponse,
    AdminNotification, AdminNotificationResponse,
    SupportDashboard, SupportTicketStatus
)
from database import get_database
from billing.billing_middleware import get_admin_user

router = APIRouter(prefix="/api/admin/support", tags=["admin-support"])

# Admin FAQ Management
@router.get("/faq", response_model=List[FAQItem])
async def get_all_faq_items(current_admin=Depends(get_admin_user)):
    """Get all FAQ items including inactive ones (admin only)"""
    db = get_database()
    
    faq_items = list(db.faq_items.find({}).sort("order", 1))
    
    for item in faq_items:
        item["id"] = str(item["_id"])
        del item["_id"]
    
    return faq_items

@router.post("/faq", response_model=FAQItem)
async def create_faq_item(
    faq_data: FAQItemCreate,
    current_admin=Depends(get_admin_user)
):
    """Create a new FAQ item"""
    db = get_database()
    
    faq_item = FAQItem(**faq_data.dict())
    
    result = db.faq_items.insert_one(faq_item.dict())
    faq_item.id = str(result.inserted_id)
    
    return faq_item

@router.put("/faq/{faq_id}", response_model=FAQItem)
async def update_faq_item(
    faq_id: str,
    faq_data: FAQItemUpdate,
    current_admin=Depends(get_admin_user)
):
    """Update an FAQ item"""
    db = get_database()
    
    update_data = {k: v for k, v in faq_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    result = db.faq_items.update_one(
        {"_id": faq_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="FAQ item not found")
    
    updated_item = db.faq_items.find_one({"_id": faq_id})
    updated_item["id"] = str(updated_item["_id"])
    del updated_item["_id"]
    
    return updated_item

@router.delete("/faq/{faq_id}")
async def delete_faq_item(
    faq_id: str,
    current_admin=Depends(get_admin_user)
):
    """Delete an FAQ item"""
    db = get_database()
    
    result = db.faq_items.delete_one({"_id": faq_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="FAQ item not found")
    
    return {"message": "FAQ item deleted successfully"}

# Admin Chat Management
@router.post("/chat/message", response_model=ChatMessageResponse)
async def admin_create_chat_message(
    message_data: ChatMessageCreate,
    current_admin=Depends(get_admin_user)
):
    """Create a chat message as admin"""
    db = get_database()
    
    message = ChatMessage(
        user_email=current_admin["email"],
        user_name="Support Team",
        message=message_data.message,
        reply_to_id=message_data.reply_to_id,
        is_admin=True
    )
    
    result = db.chat_messages.insert_one(message.dict())
    message.id = str(result.inserted_id)
    
    return ChatMessageResponse(**message.dict(), replies=[])

@router.delete("/chat/message/{message_id}")
async def delete_chat_message(
    message_id: str,
    current_admin=Depends(get_admin_user)
):
    """Delete a chat message (admin only)"""
    db = get_database()
    
    result = db.chat_messages.update_one(
        {"_id": message_id},
        {"$set": {"is_deleted": True, "updated_at": datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    
    return {"message": "Chat message deleted successfully"}

# Admin Support Ticket Management
@router.get("/tickets", response_model=List[SupportTicket])
async def get_all_support_tickets(
    status: Optional[SupportTicketStatus] = None,
    current_admin=Depends(get_admin_user)
):
    """Get all support tickets (admin only)"""
    db = get_database()
    
    query = {}
    if status:
        query["status"] = status
    
    tickets = list(db.support_tickets.find(query).sort("created_at", -1))
    
    for ticket in tickets:
        ticket["id"] = str(ticket["_id"])
        del ticket["_id"]
    
    return tickets

@router.put("/tickets/{ticket_id}", response_model=SupportTicket)
async def update_support_ticket(
    ticket_id: str,
    ticket_data: SupportTicketUpdate,
    current_admin=Depends(get_admin_user)
):
    """Update a support ticket (admin only)"""
    db = get_database()
    
    update_data = {k: v for k, v in ticket_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    if ticket_data.status == SupportTicketStatus.RESOLVED:
        update_data["resolved_at"] = datetime.utcnow()
    
    result = db.support_tickets.update_one(
        {"_id": ticket_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    updated_ticket = db.support_tickets.find_one({"_id": ticket_id})
    updated_ticket["id"] = str(updated_ticket["_id"])
    del updated_ticket["_id"]
    
    return updated_ticket

@router.post("/tickets/{ticket_id}/reply", response_model=SupportMessageResponse)
async def reply_to_ticket(
    ticket_id: str,
    message_data: SupportMessageCreate,
    current_admin=Depends(get_admin_user)
):
    """Reply to a support ticket as admin"""
    db = get_database()
    
    # Verify ticket exists
    ticket = db.support_tickets.find_one({"_id": ticket_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Create admin message
    message = SupportMessage(
        ticket_id=ticket_id,
        sender_email=current_admin["email"],
        sender_name="Support Team",
        is_admin=True,
        message=message_data.message
    )
    
    result = db.support_messages.insert_one(message.dict())
    message.id = str(result.inserted_id)
    
    # Update ticket status if it was closed
    if ticket.get("status") == SupportTicketStatus.CLOSED:
        db.support_tickets.update_one(
            {"_id": ticket_id},
            {"$set": {"status": SupportTicketStatus.IN_PROGRESS, "updated_at": datetime.utcnow()}}
        )
    
    return message

# Admin Notifications
@router.get("/notifications", response_model=List[AdminNotificationResponse])
async def get_admin_notifications(
    limit: int = 20,
    current_admin=Depends(get_admin_user)
):
    """Get admin notifications"""
    db = get_database()
    
    notifications = list(db.admin_notifications.find({}).sort("created_at", -1).limit(limit))
    
    for notification in notifications:
        notification["id"] = str(notification["_id"])
        del notification["_id"]
    
    return notifications

@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_admin=Depends(get_admin_user)
):
    """Mark a notification as read"""
    db = get_database()
    
    result = db.admin_notifications.update_one(
        {"_id": notification_id},
        {"$set": {"is_read": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification marked as read"}

@router.put("/notifications/read-all")
async def mark_all_notifications_read(current_admin=Depends(get_admin_user)):
    """Mark all notifications as read"""
    db = get_database()
    
    db.admin_notifications.update_many(
        {"is_read": False},
        {"$set": {"is_read": True}}
    )
    
    return {"message": "All notifications marked as read"}

# Admin Dashboard
@router.get("/dashboard", response_model=SupportDashboard)
async def get_support_dashboard(current_admin=Depends(get_admin_user)):
    """Get admin support dashboard data"""
    db = get_database()
    
    # Count unread notifications
    unread_notifications = db.admin_notifications.count_documents({"is_read": False})
    
    # Count new chat messages (from last 24 hours)
    from datetime import timedelta
    yesterday = datetime.utcnow() - timedelta(days=1)
    new_chat_messages = db.chat_messages.count_documents({
        "created_at": {"$gte": yesterday},
        "is_admin": False,
        "is_deleted": False
    })
    
    # Count open tickets
    open_tickets = db.support_tickets.count_documents({
        "status": {"$in": [SupportTicketStatus.OPEN, SupportTicketStatus.IN_PROGRESS]}
    })
    
    # Get recent activity
    recent_notifications = list(db.admin_notifications.find({}).sort("created_at", -1).limit(5))
    recent_activity = []
    
    for notification in recent_notifications:
        recent_activity.append({
            "type": notification["type"],
            "title": notification["title"],
            "message": notification["message"],
            "created_at": notification["created_at"],
            "is_read": notification["is_read"]
        })
    
    return SupportDashboard(
        unread_notifications=unread_notifications,
        new_chat_messages=new_chat_messages,
        open_tickets=open_tickets,
        recent_activity=recent_activity
    )
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
import uuid

from models.support_models import (
    FAQItem, FAQItemCreate, FAQItemUpdate,
    ChatMessage, ChatMessageCreate, ChatMessageResponse,
    SupportTicket, SupportTicketCreate, SupportTicketUpdate,
    SupportMessage, SupportMessageCreate, SupportMessageResponse,
    AdminNotification, AdminNotificationResponse,
    SupportDashboard, SupportCategory, SupportTicketStatus
)
from database import get_database
from billing.billing_middleware import get_current_user

router = APIRouter(prefix="/support", tags=["support"])

# FAQ Routes
@router.get("/faq", response_model=List[FAQItem])
async def get_faq_items(category: Optional[str] = None):
    """Get all active FAQ items, optionally filtered by category"""
    db = get_database()
    
    query = {"is_active": True}
    if category:
        query["category"] = category
    
    faq_items = list(db.faq_items.find(query).sort("order", 1))
    
    # Convert MongoDB documents to Pydantic models
    for item in faq_items:
        item["id"] = str(item["_id"])
        del item["_id"]
    
    return faq_items

@router.get("/faq/categories")
async def get_faq_categories():
    """Get all FAQ categories"""
    db = get_database()
    
    categories = db.faq_items.distinct("category", {"is_active": True})
    return {"categories": [cat for cat in categories if cat]}

# Chat/Forum Routes
@router.get("/chat/messages", response_model=List[ChatMessageResponse])
async def get_chat_messages(limit: int = 50, offset: int = 0):
    """Get chat messages with threading support"""
    db = get_database()
    
    # Get all messages (not deleted)
    messages = list(db.chat_messages.find(
        {"is_deleted": False}
    ).sort("created_at", -1).limit(limit).skip(offset))
    
    # Convert to response format
    message_dict = {}
    root_messages = []
    
    for msg in messages:
        msg["id"] = str(msg["_id"])
        del msg["_id"]
        
        msg_response = ChatMessageResponse(**msg, replies=[])
        message_dict[msg["id"]] = msg_response
        
        if not msg.get("reply_to_id"):
            root_messages.append(msg_response)
    
    # Build threaded structure
    for msg in messages:
        if msg.get("reply_to_id") and msg["reply_to_id"] in message_dict:
            parent = message_dict[msg["reply_to_id"]]
            child = message_dict[msg["id"]]
            parent.replies.append(child)
    
    return root_messages

@router.post("/chat/message", response_model=ChatMessageResponse)
async def create_chat_message(
    message_data: ChatMessageCreate,
    current_user=Depends(get_current_user)
):
    """Create a new chat message"""
    db = get_database()
    
    # Create message
    message = ChatMessage(
        user_email=current_user["email"],
        user_name=current_user.get("name", current_user["email"]),
        company_id=current_user.get("company_id"),
        message=message_data.message,
        reply_to_id=message_data.reply_to_id,
        is_admin=False
    )
    
    # Insert into database
    result = db.chat_messages.insert_one(message.dict())
    message.id = str(result.inserted_id)
    
    # Create admin notification
    notification = AdminNotification(
        type="new_chat",
        title="New Chat Message",
        message=f"New message from {current_user['email']}: {message_data.message[:50]}...",
        reference_id=message.id
    )
    db.admin_notifications.insert_one(notification.dict())
    
    return ChatMessageResponse(**message.dict(), replies=[])

# Support Ticket Routes
@router.get("/tickets", response_model=List[SupportTicket])
async def get_user_tickets(current_user=Depends(get_current_user)):
    """Get current user's support tickets"""
    db = get_database()
    
    tickets = list(db.support_tickets.find(
        {"user_email": current_user["email"]}
    ).sort("created_at", -1))
    
    for ticket in tickets:
        ticket["id"] = str(ticket["_id"])
        del ticket["_id"]
    
    return tickets

@router.post("/tickets", response_model=SupportTicket)
async def create_support_ticket(
    ticket_data: SupportTicketCreate,
    current_user=Depends(get_current_user)
):
    """Create a new support ticket"""
    db = get_database()
    
    # Create ticket
    ticket = SupportTicket(
        user_email=current_user["email"],
        user_name=current_user.get("name", current_user["email"]),
        company_id=current_user.get("company_id"),
        category=ticket_data.category,
        subject=ticket_data.subject,
        description=ticket_data.description
    )
    
    # Insert into database
    result = db.support_tickets.insert_one(ticket.dict())
    ticket.id = str(result.inserted_id)
    
    # Create admin notification
    notification = AdminNotification(
        type="new_ticket",
        title="New Support Ticket",
        message=f"New {ticket_data.category} ticket from {current_user['email']}: {ticket_data.subject}",
        reference_id=ticket.id
    )
    db.admin_notifications.insert_one(notification.dict())
    
    return ticket

@router.get("/tickets/{ticket_id}/messages", response_model=List[SupportMessageResponse])
async def get_ticket_messages(
    ticket_id: str,
    current_user=Depends(get_current_user)
):
    """Get messages for a specific support ticket"""
    db = get_database()
    
    # Verify user owns this ticket
    ticket = db.support_tickets.find_one({"_id": ticket_id, "user_email": current_user["email"]})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    messages = list(db.support_messages.find(
        {"ticket_id": ticket_id}
    ).sort("created_at", 1))
    
    for msg in messages:
        msg["id"] = str(msg["_id"])
        del msg["_id"]
        
        # Mark user messages as read when user views them
        if not msg["is_admin"] and msg["sender_email"] != current_user["email"]:
            db.support_messages.update_one(
                {"_id": msg["id"]},
                {"$set": {"is_read": True}}
            )
    
    return messages

@router.post("/tickets/{ticket_id}/messages", response_model=SupportMessageResponse)
async def send_ticket_message(
    ticket_id: str,
    message_data: SupportMessageCreate,
    current_user=Depends(get_current_user)
):
    """Send a message in a support ticket"""
    db = get_database()
    
    # Verify user owns this ticket
    ticket = db.support_tickets.find_one({"_id": ticket_id, "user_email": current_user["email"]})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Create message
    message = SupportMessage(
        ticket_id=ticket_id,
        sender_email=current_user["email"],
        sender_name=current_user.get("name", current_user["email"]),
        is_admin=False,
        message=message_data.message
    )
    
    # Insert into database
    result = db.support_messages.insert_one(message.dict())
    message.id = str(result.inserted_id)
    
    # Update ticket status if closed
    if ticket.get("status") == SupportTicketStatus.CLOSED:
        db.support_tickets.update_one(
            {"_id": ticket_id},
            {"$set": {"status": SupportTicketStatus.OPEN, "updated_at": datetime.utcnow()}}
        )
    
    # Create admin notification
    notification = AdminNotification(
        type="new_message",
        title="New Ticket Message",
        message=f"New message from {current_user['email']} on ticket: {ticket.get('subject', 'Unknown')}",
        reference_id=ticket_id
    )
    db.admin_notifications.insert_one(notification.dict())
    
    return message

# Support Stats for User
@router.get("/stats")
async def get_support_stats(current_user=Depends(get_current_user)):
    """Get support statistics for current user"""
    db = get_database()
    
    # Count user's tickets by status
    open_tickets = db.support_tickets.count_documents({
        "user_email": current_user["email"],
        "status": {"$in": [SupportTicketStatus.OPEN, SupportTicketStatus.IN_PROGRESS]}
    })
    
    total_tickets = db.support_tickets.count_documents({
        "user_email": current_user["email"]
    })
    
    # Count unread messages in user's tickets
    user_tickets = list(db.support_tickets.find(
        {"user_email": current_user["email"]},
        {"_id": 1}
    ))
    
    ticket_ids = [str(t["_id"]) for t in user_tickets]
    
    unread_messages = db.support_messages.count_documents({
        "ticket_id": {"$in": ticket_ids},
        "is_admin": True,
        "is_read": False
    })
    
    return {
        "open_tickets": open_tickets,
        "total_tickets": total_tickets,
        "unread_messages": unread_messages
    }
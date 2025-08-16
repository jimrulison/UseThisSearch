from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

class SupportCategory(str, Enum):
    BILLING = "Billing"
    SOFTWARE_ISSUE = "Software Issue"
    TRAINING_HELP = "Training Help"
    SUGGESTIONS = "Suggestions"
    OTHER = "Other"

class SupportTicketStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"

# FAQ Models
class FAQItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    answer: str
    category: Optional[str] = None
    order: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class FAQItemCreate(BaseModel):
    question: str
    answer: str
    category: Optional[str] = None
    order: int = 0

class FAQItemUpdate(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None
    category: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None

# Chat/Forum Models
class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_email: str
    user_name: str
    company_id: Optional[str] = None
    message: str
    is_admin: bool = False
    reply_to_id: Optional[str] = None  # For threaded conversations
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    is_deleted: bool = False

class ChatMessageCreate(BaseModel):
    message: str
    reply_to_id: Optional[str] = None

class ChatMessageResponse(BaseModel):
    id: str
    user_email: str
    user_name: str
    company_id: Optional[str]
    message: str
    is_admin: bool
    reply_to_id: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    is_deleted: bool
    replies: List['ChatMessageResponse'] = []

# Support Ticket Models
class SupportTicket(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_email: str
    user_name: str
    company_id: Optional[str] = None
    category: SupportCategory
    subject: str
    description: str
    status: SupportTicketStatus = SupportTicketStatus.OPEN
    priority: str = "medium"  # low, medium, high, urgent
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None
    admin_notes: Optional[str] = None

class SupportTicketCreate(BaseModel):
    category: SupportCategory
    subject: str
    description: str

class SupportTicketUpdate(BaseModel):
    status: Optional[SupportTicketStatus] = None
    priority: Optional[str] = None
    admin_notes: Optional[str] = None

# Support Message Models (Internal messaging system)
class SupportMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ticket_id: str
    sender_email: str
    sender_name: str
    is_admin: bool = False
    message: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_read: bool = False

class SupportMessageCreate(BaseModel):
    ticket_id: str
    message: str

class SupportMessageResponse(BaseModel):
    id: str
    ticket_id: str
    sender_email: str
    sender_name: str
    is_admin: bool
    message: str
    created_at: datetime
    is_read: bool

# Admin Notification Models
class AdminNotification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str  # "new_chat", "new_ticket", "new_message"
    title: str
    message: str
    reference_id: Optional[str] = None  # ID of the chat/ticket/message
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AdminNotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    message: str
    reference_id: Optional[str]
    is_read: bool
    created_at: datetime

# Response Models
class SupportDashboard(BaseModel):
    unread_notifications: int
    new_chat_messages: int
    open_tickets: int
    recent_activity: List[Dict[str, Any]]

import uuid
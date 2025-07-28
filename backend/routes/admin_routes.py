from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import hashlib
import secrets
import uuid
import os
from typing import Optional

from models.admin_models import (
    Admin, AdminSession, AdminLogin, AdminLoginResponse
)
from database import db
import logging

router = APIRouter()
security = HTTPBearer()
logger = logging.getLogger(__name__)

# Admin credentials - in production, these should be in environment variables
INITIAL_ADMIN_EMAIL = "JimRulison@gmail.com"
INITIAL_ADMIN_PASSWORD = "JR09mar05"
INITIAL_ADMIN_NAME = "Jim Rulison"

def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return hash_password(password) == hashed

def generate_session_token() -> str:
    """Generate secure session token"""
    return secrets.token_urlsafe(32)

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Admin:
    """Get current admin from token"""
    try:
        token = credentials.credentials
        
        # Find active session
        session = await db.admin_sessions.find_one({
            "token": token,
            "is_active": True,
            "expires_at": {"$gt": datetime.utcnow()}
        })
        
        if not session:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        
        # Get admin user
        admin = await db.admins.find_one({"id": session["admin_id"]})
        if not admin or not admin.get("is_active", False):
            raise HTTPException(status_code=401, detail="Admin not found or inactive")
        
        return Admin(**admin)
        
    except Exception as e:
        logger.error(f"Error getting current admin: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

async def ensure_initial_admin():
    """Ensure the initial admin user exists"""
    try:
        # Check if initial admin exists
        existing_admin = await db.admins.find_one({"email": INITIAL_ADMIN_EMAIL})
        
        if not existing_admin:
            # Create initial admin
            admin = Admin(
                email=INITIAL_ADMIN_EMAIL,
                password_hash=hash_password(INITIAL_ADMIN_PASSWORD),
                name=INITIAL_ADMIN_NAME,
                role="super_admin"
            )
            
            await db.admins.insert_one(admin.dict())
            logger.info(f"Created initial admin user: {INITIAL_ADMIN_EMAIL}")
        else:
            logger.info("Initial admin user already exists")
            
    except Exception as e:
        logger.error(f"Error ensuring initial admin: {e}")

@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(login_request: AdminLogin, request: Request):
    """Admin login endpoint"""
    try:
        # Ensure initial admin exists
        await ensure_initial_admin()
        
        # Find admin by email (case-insensitive)
        admin_data = await db.admins.find_one({"email": login_request.email.lower()})
        if not admin_data:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        admin = Admin(**admin_data)
        
        # Check if admin is active
        if not admin.is_active:
            raise HTTPException(status_code=401, detail="Admin account is disabled")
        
        # Verify password
        if not verify_password(login_request.password, admin.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Generate session token
        token = generate_session_token()
        expires_at = datetime.utcnow() + timedelta(hours=24)  # 24 hour session
        
        # Create admin session
        session = AdminSession(
            admin_id=admin.id,
            token=token,
            expires_at=expires_at,
            ip_address=getattr(request.client, 'host', None),
            user_agent=request.headers.get('user-agent')
        )
        
        await db.admin_sessions.insert_one(session.dict())
        
        # Update last login
        await db.admins.update_one(
            {"id": admin.id},
            {"$set": {"last_login": datetime.utcnow(), "updated_at": datetime.utcnow()}}
        )
        
        # Prepare response (exclude password)
        admin_response = admin.dict()
        del admin_response['password_hash']
        
        return AdminLoginResponse(
            success=True,
            token=token,
            admin=admin_response,
            expires_at=expires_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during admin login: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

@router.post("/logout")
async def admin_logout(current_admin: Admin = Depends(get_current_admin)):
    """Admin logout endpoint"""
    try:
        # Deactivate all sessions for this admin
        await db.admin_sessions.update_many(
            {"admin_id": current_admin.id, "is_active": True},
            {"$set": {"is_active": False}}
        )
        
        return {"success": True, "message": "Logged out successfully"}
        
    except Exception as e:
        logger.error(f"Error during admin logout: {e}")
        raise HTTPException(status_code=500, detail="Logout failed")

@router.get("/verify")
async def verify_admin_token(current_admin: Admin = Depends(get_current_admin)):
    """Verify admin token and return admin info"""
    admin_data = current_admin.dict()
    del admin_data['password_hash']  # Never return password hash
    return {"success": True, "admin": admin_data}

@router.get("/sessions")
async def get_admin_sessions(current_admin: Admin = Depends(get_current_admin)):
    """Get active admin sessions"""
    try:
        sessions = await db.admin_sessions.find({
            "admin_id": current_admin.id,
            "is_active": True,
            "expires_at": {"$gt": datetime.utcnow()}
        }).to_list(100)
        
        return {"sessions": sessions}
        
    except Exception as e:
        logger.error(f"Error getting admin sessions: {e}")
        raise HTTPException(status_code=500, detail="Failed to get sessions")
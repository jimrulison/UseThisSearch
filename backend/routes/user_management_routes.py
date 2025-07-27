from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
from typing import List, Optional
import logging
from datetime import datetime, timedelta
import secrets
import string

from models.billing_models import CompanyUser, UserInvitation
from billing.usage_tracker import get_usage_tracker
from database import db

logger = logging.getLogger(__name__)
router = APIRouter()

def get_user_id_from_request(request: Request) -> str:
    """Extract user ID from request headers"""
    user_id = request.headers.get("X-User-ID")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID required")
    return user_id

def get_company_id_from_request(request: Request) -> str:
    """Extract company ID from request headers"""
    company_id = request.headers.get("X-Company-ID")
    if not company_id:
        raise HTTPException(status_code=400, detail="Company ID required")
    return company_id

def generate_invitation_token() -> str:
    """Generate a secure invitation token"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(32))

@router.get("/companies/{company_id}/users")
async def get_company_users(company_id: str, request: Request):
    """Get all users in a company"""
    try:
        user_id = get_user_id_from_request(request)
        usage_tracker = get_usage_tracker()
        
        # Check if user owns this company or is a member
        company = await db.companies.find_one({"id": company_id})
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Check if user is owner or member of this company
        is_owner = company["user_id"] == user_id
        is_member = await db.company_users.find_one({
            "company_id": company_id,
            "user_id": user_id,
            "invitation_status": "active"
        })
        
        if not is_owner and not is_member:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get all users in the company
        users = await usage_tracker.get_company_users(company_id)
        
        # Add owner to the list
        users.insert(0, {
            "id": "owner",
            "user_id": company["user_id"],
            "role": "owner",
            "invited_by": company["user_id"],
            "created_at": company["created_at"]
        })
        
        return {"users": users}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting company users: {e}")
        raise HTTPException(status_code=500, detail="Error fetching company users")

@router.post("/companies/{company_id}/users/invite")
async def invite_user_to_company(company_id: str, request: Request):
    """Invite a user to join a company"""
    try:
        user_id = get_user_id_from_request(request)
        usage_tracker = get_usage_tracker()
        
        # Check if user owns this company
        company = await db.companies.find_one({"id": company_id, "user_id": user_id})
        if not company:
            raise HTTPException(status_code=404, detail="Company not found or access denied")
        
        # Check if user can invite more users
        can_invite = await usage_tracker.can_invite_user(user_id)
        if not can_invite["allowed"]:
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "User limit exceeded",
                    "message": f"You've reached your user limit of {can_invite['limit']} users. Upgrade to invite more.",
                    "current_count": can_invite.get("current"),
                    "upgrade_required": True
                }
            )
        
        # Get invitation data from request
        body = await request.json()
        invited_email = body.get("email")
        role = body.get("role", "member")
        
        if not invited_email:
            raise HTTPException(status_code=400, detail="Email is required")
        
        # Check if user is already invited or in company
        existing_invitation = await db.user_invitations.find_one({
            "company_id": company_id,
            "invited_email": invited_email,
            "status": "pending"
        })
        
        if existing_invitation:
            raise HTTPException(status_code=400, detail="User already invited")
        
        # Check if user is already in company
        existing_user = await db.company_users.find_one({
            "company_id": company_id,
            "user_id": f"user_{invited_email.replace('@', '_').replace('.', '_')}",
            "invitation_status": "active"
        })
        
        if existing_user:
            raise HTTPException(status_code=400, detail="User already in company")
        
        # Create invitation
        invitation_token = generate_invitation_token()
        expires_at = datetime.utcnow() + timedelta(days=7)  # 7 days to accept
        
        new_invitation = UserInvitation(
            company_id=company_id,
            invited_email=invited_email,
            invited_by=user_id,
            role=role,
            token=invitation_token,
            expires_at=expires_at
        )
        
        await db.user_invitations.insert_one(new_invitation.dict())
        
        # TODO: Send invitation email (would need email service integration)
        logger.info(f"User {invited_email} invited to company {company_id} by {user_id}")
        
        return {
            "message": "User invited successfully",
            "invitation_id": new_invitation.id,
            "expires_at": expires_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error inviting user: {e}")
        raise HTTPException(status_code=500, detail="Error inviting user")

@router.post("/companies/{company_id}/users/{target_user_id}/remove")
async def remove_user_from_company(company_id: str, target_user_id: str, request: Request):
    """Remove a user from a company"""
    try:
        user_id = get_user_id_from_request(request)
        usage_tracker = get_usage_tracker()
        
        # Check if user owns this company
        company = await db.companies.find_one({"id": company_id, "user_id": user_id})
        if not company:
            raise HTTPException(status_code=404, detail="Company not found or access denied")
        
        # Can't remove owner
        if target_user_id == user_id:
            raise HTTPException(status_code=400, detail="Cannot remove company owner")
        
        # Remove user from company
        success = await usage_tracker.remove_user_from_company(company_id, target_user_id)
        
        if success:
            logger.info(f"User {target_user_id} removed from company {company_id} by {user_id}")
            return {"message": "User removed successfully"}
        else:
            raise HTTPException(status_code=404, detail="User not found in company")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing user: {e}")
        raise HTTPException(status_code=500, detail="Error removing user")

@router.get("/invitations/{invitation_token}")
async def get_invitation_details(invitation_token: str):
    """Get invitation details for accepting an invitation"""
    try:
        invitation = await db.user_invitations.find_one({
            "token": invitation_token,
            "status": "pending"
        })
        
        if not invitation:
            raise HTTPException(status_code=404, detail="Invitation not found or expired")
        
        # Check if invitation is expired
        if datetime.utcnow() > invitation["expires_at"]:
            # Mark as expired
            await db.user_invitations.update_one(
                {"token": invitation_token},
                {"$set": {"status": "expired"}}
            )
            raise HTTPException(status_code=410, detail="Invitation expired")
        
        # Get company details
        company = await db.companies.find_one({"id": invitation["company_id"]})
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        return {
            "invitation_id": invitation["id"],
            "company_name": company["name"],
            "company_id": company["id"],
            "invited_email": invitation["invited_email"],
            "role": invitation["role"],
            "invited_by": invitation["invited_by"],
            "expires_at": invitation["expires_at"].isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting invitation details: {e}")
        raise HTTPException(status_code=500, detail="Error fetching invitation")

@router.post("/invitations/{invitation_token}/accept")
async def accept_invitation(invitation_token: str, request: Request):
    """Accept an invitation to join a company"""
    try:
        user_id = get_user_id_from_request(request)
        usage_tracker = get_usage_tracker()
        
        # Get invitation
        invitation = await db.user_invitations.find_one({
            "token": invitation_token,
            "status": "pending"
        })
        
        if not invitation:
            raise HTTPException(status_code=404, detail="Invitation not found")
        
        # Check if invitation is expired
        if datetime.utcnow() > invitation["expires_at"]:
            await db.user_invitations.update_one(
                {"token": invitation_token},
                {"$set": {"status": "expired"}}
            )
            raise HTTPException(status_code=410, detail="Invitation expired")
        
        # Check if user matches invited email
        # Extract email from user_id (assuming format: user_email_com)
        user_email = user_id.replace("user_", "").replace("_", "@", 1).replace("_", ".")
        if user_email != invitation["invited_email"]:
            raise HTTPException(status_code=403, detail="Email mismatch")
        
        # Add user to company
        success = await usage_tracker.add_user_to_company(
            invitation["company_id"],
            user_id,
            invitation["invited_by"],
            invitation["role"]
        )
        
        if success:
            # Mark invitation as accepted
            await db.user_invitations.update_one(
                {"token": invitation_token},
                {"$set": {"status": "accepted"}}
            )
            
            logger.info(f"User {user_id} accepted invitation to company {invitation['company_id']}")
            return {"message": "Invitation accepted successfully"}
        else:
            raise HTTPException(status_code=400, detail="User already in company")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error accepting invitation: {e}")
        raise HTTPException(status_code=500, detail="Error accepting invitation")

@router.get("/users/{user_id}/companies")
async def get_user_companies(user_id: str, request: Request):
    """Get all companies a user has access to"""
    try:
        requesting_user_id = get_user_id_from_request(request)
        
        # Users can only see their own companies
        if requesting_user_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        usage_tracker = get_usage_tracker()
        companies = await usage_tracker.get_user_companies(user_id)
        
        return {"companies": companies}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user companies: {e}")
        raise HTTPException(status_code=500, detail="Error fetching companies")
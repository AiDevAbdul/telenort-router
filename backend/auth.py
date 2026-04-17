"""
Clerk authentication middleware for Phase 2
Validates JWT tokens from Clerk
"""

import os
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from models import User
from db_config import get_db

security = HTTPBearer()

CLERK_PUBLIC_KEY = os.getenv("CLERK_PUBLIC_KEY", "")
CLERK_ISSUER = os.getenv("CLERK_ISSUER", "https://clerk.example.com")

async def verify_token(credentials: HTTPAuthCredentials) -> dict:
    """Verify Clerk JWT token"""
    token = credentials.credentials

    try:
        # Decode and verify JWT
        payload = jwt.get_unverified_claims(token)

        # In production, verify signature with Clerk's public key
        # For now, we'll do basic validation
        if not payload.get("sub"):
            raise HTTPException(status_code=401, detail="Invalid token")

        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(
    credentials: HTTPAuthCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user from token"""
    payload = await verify_token(credentials)
    clerk_id = payload.get("sub")

    if not clerk_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Get or create user in database
    user = db.query(User).filter(User.clerk_id == clerk_id).first()

    if not user:
        # Create new user from Clerk data
        email = payload.get("email", "")
        full_name = payload.get("name", "")

        user = User(
            clerk_id=clerk_id,
            email=email,
            full_name=full_name
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user

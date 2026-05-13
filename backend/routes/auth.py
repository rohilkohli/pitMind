from fastapi import APIRouter, HTTPException, Header, Depends
try:
    from firebase_admin import auth as firebase_auth
except ImportError:
    firebase_auth = None

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

import logging

logger = logging.getLogger(__name__)

async def verify_token(authorization: str = Header(None)) -> str:
    """Verify Firebase ID token or allow mock UID in development."""
    if not authorization:
        logger.warning("Missing Authorization header")
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
        
    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Authorization header malformed")
    
    # In development without Firebase, allow mock token for testing
    if firebase_auth is None:
        logger.warning("Firebase auth not configured; using mock UID for development")
        # Only in non-production, allow dev testing
        import os
        if os.getenv("ENVIRONMENT") == "development" and token.startswith("dev_"):
            return token.replace("Bearer ", "")
        raise HTTPException(status_code=401, detail="Firebase authentication not configured")
        
    try:
        decoded = firebase_auth.verify_id_token(token)
        return decoded["uid"]
    except Exception as e:
        logger.warning(f"Token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token") from e

@router.get("/verify")
async def verify_auth(uid: str = Depends(verify_token)):
    """Validates Google OAuth tokens passed by the frontend."""
    return {"status": "ok", "uid": uid}

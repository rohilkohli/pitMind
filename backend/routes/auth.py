import logging
import jwt
import os
from fastapi import APIRouter, HTTPException, Header
try:
    from firebase_admin import auth as firebase_auth
except ImportError:
    firebase_auth = None

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

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
    if os.getenv("ENVIRONMENT") != "production" and not firebase_auth:
        if token == "mock-token-for-dev":
            return "mock-uid-12345"

    # For CI environments where we use a custom test secret
    test_secret = os.getenv("JWT_SECRET_KEY")
    if os.getenv("ENVIRONMENT") == "test" and test_secret:
        try:
            # First try decoding as a simple mock token if it's the specific test token
            if token == "mock-token-for-ci":
                return "test-uid"

            # If not the simple mock, try to verify it using PyJWT (which is what tests usually do)
            payload = jwt.decode(token, test_secret, algorithms=["HS256"])
            return payload.get("sub", "test-uid")
        except jwt.PyJWTError:
            # Fall back to trying Firebase if PyJWT fails
            pass

    if firebase_auth is None:
        raise HTTPException(status_code=500, detail="Firebase auth not configured")
        
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token["uid"]
    except Exception as e:
        logger.error(f"Firebase token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

import logging
import jwt
import os

from fastapi import APIRouter, HTTPException, Header, Depends
try:
    from firebase_admin import auth as firebase_auth
except ImportError:
    firebase_auth = None

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


logger = logging.getLogger(__name__)

async def verify_token(authorization: str = Header(None)) -> str:
    """Verify Firebase ID token with proper signature validation."""
    if not authorization:
        logger.warning("Missing Authorization header")
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Authorization header malformed")

    try:
        from config import get_settings
        settings = get_settings()

        # Always verify tokens using Firebase JWKS for production-grade security
        jwks_url = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
        jwks_client = jwt.PyJWKClient(jwks_url)
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        decoded = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=settings.firebase_project_id,
            issuer=f"https://securetoken.google.com/{settings.firebase_project_id}",
            options={"verify_exp": True, "verify_iat": True}
        )

        uid = decoded.get("uid") or decoded.get("user_id") or decoded.get("sub")
        if not uid:
            raise HTTPException(status_code=401, detail="Token missing user identifier")

        return uid

    except jwt.ExpiredSignatureError:
        logger.warning("Token has expired")
        raise HTTPException(status_code=401, detail="Token has expired") from None
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid token: {e}")
        raise HTTPException(status_code=401, detail="Invalid token") from e
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed") from e

@router.get("/verify")
async def verify_auth(uid: str = Depends(verify_token)):
    """Validates Google OAuth tokens passed by the frontend."""
    return {"status": "ok", "uid": uid}

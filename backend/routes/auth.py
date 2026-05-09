from fastapi import APIRouter, HTTPException, Header, Depends
try:
    from firebase_admin import auth as firebase_auth
except ImportError:
    firebase_auth = None

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

async def verify_token(authorization: str = Header(...)) -> str:
    if firebase_auth is None:
        # Fallback for local development if Firebase Admin isn't set up yet
        return "mock_uid_123"
        
    token = authorization.removeprefix("Bearer ")
    try:
        decoded = firebase_auth.verify_id_token(token)
        return decoded["uid"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.get("/verify")
async def verify_auth(uid: str = Depends(verify_token)):
    """Validates Google OAuth tokens passed by the frontend."""
    return {"status": "ok", "uid": uid}

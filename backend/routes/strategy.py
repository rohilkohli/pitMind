from fastapi import APIRouter, File, HTTPException, Request, UploadFile, Depends

from models.race_state import TelemetryPayload
from routes.auth import verify_token
from services import pipeline as pipeline_svc
from services import sanitize

router = APIRouter(prefix="/api/v1/strategy", tags=["strategy"])

@router.post("/recommend")
async def recommend_strategy(request: Request, payload: TelemetryPayload, uid: str = Depends(verify_token)) -> dict:
    result = await pipeline_svc.run_strategy_pipeline(payload)
    return result.model_dump()

@router.post("/telemetry/upload")
async def upload_telemetry(request: Request, file: UploadFile = File(...), uid: str = Depends(verify_token)) -> TelemetryPayload:
    raw = await file.read()
    name = (file.filename or "").lower()
    try:
        if name.endswith(".csv"):
            return sanitize.parse_upload_csv(raw)
        if name.endswith(".json"):
            return sanitize.parse_upload_json(raw)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    raise HTTPException(status_code=400, detail="Unsupported file type (use .csv or .json)")

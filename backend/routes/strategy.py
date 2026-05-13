from fastapi import APIRouter, File, HTTPException, Request, UploadFile, Depends

from models.race_state import TelemetryPayload
from routes.auth import verify_token
from services import pipeline as pipeline_svc
from services import sanitize

router = APIRouter(prefix="/api/v1/strategy", tags=["strategy"])

@router.post("/recommend")
async def recommend_strategy(request: Request, payload: TelemetryPayload, uid: str = Depends(verify_token)) -> dict:
    """Generate strategy recommendation with transparent heuristic scoring and AI explanation."""
    try:
        if not payload.laps:
            raise HTTPException(status_code=400, detail="No telemetry laps provided")
        result = await pipeline_svc.run_strategy_pipeline(payload)
        return result.model_dump()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid telemetry: {str(e)}") from e
    except Exception as e:
        import logging
        logging.error(f"Strategy recommendation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Strategy pipeline error") from e

@router.post("/telemetry/upload")
async def upload_telemetry(request: Request, file: UploadFile = File(...), uid: str = Depends(verify_token)) -> TelemetryPayload:
    """Upload and parse telemetry CSV/JSON for strategy analysis."""
    try:
        raw = await file.read()
        name = (file.filename or "").lower()
        if name.endswith(".csv"):
            return sanitize.parse_upload_csv(raw)
        if name.endswith(".json"):
            return sanitize.parse_upload_json(raw)
        raise HTTPException(status_code=400, detail="Unsupported file type (use .csv or .json)")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"File parsing error: {str(exc)}") from exc

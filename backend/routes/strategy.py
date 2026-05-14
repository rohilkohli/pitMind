from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, Request, UploadFile, Depends

try:
    from ..models.race_state import TelemetryPayload
    from ..models.strategy import FastF1Request, StrategyCommitRequest, StrategyCommitResponse
    from .auth import verify_token
    from ..services import pipeline as pipeline_svc
    from ..services import sanitize
    from ..services import fastf1_service
except ImportError:
    from models.race_state import TelemetryPayload
    from models.strategy import FastF1Request, StrategyCommitRequest, StrategyCommitResponse
    from routes.auth import verify_token
    from services import pipeline as pipeline_svc
    from services import sanitize
    from services import fastf1_service

router = APIRouter(prefix="/api/v1/strategy", tags=["strategy"])
STRATEGY_AUDIT_LOG: list[dict] = []

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

@router.post("/fastf1/load")
async def load_fastf1_session(request: Request, body: FastF1Request, uid: str = Depends(verify_token)) -> TelemetryPayload:
    """Fetch real session data from FastF1 API."""
    try:
        return await fastf1_service.fetch_session_telemetry(
            body.year, body.event, body.session_type, body.driver_code
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        import logging
        logging.error(f"FastF1 load failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal error fetching session data")


@router.post("/commit", response_model=StrategyCommitResponse)
async def commit_strategy(
    request: Request,
    body: StrategyCommitRequest,
    uid: str = Depends(verify_token),
) -> StrategyCommitResponse:
    """Commit a strategy call and append an audit record for traceability."""
    readiness = (
        int(body.checklist.pit_crew_ready)
        + int(body.checklist.tyre_set_confirmed)
        + int(body.checklist.radio_call_prepared)
    )

    audit_id = f"strat-{uuid4().hex[:12]}"
    committed_at = datetime.now(timezone.utc).isoformat()
    record = {
        "audit_id": audit_id,
        "uid": uid,
        "committed_at": committed_at,
        "client": request.client.host if request.client else "unknown",
        "readiness_checks_complete": readiness,
        "recommendation": body.recommendation.model_dump(),
        "checklist": body.checklist.model_dump(),
        "execution_brief": body.execution_brief,
        "session_context": body.session_context,
    }
    STRATEGY_AUDIT_LOG.append(record)

    status = "committed" if readiness == 3 else "committed_with_warnings"
    message = "Strategy committed to audit log." if readiness == 3 else "Strategy committed, but checklist is incomplete."

    return StrategyCommitResponse(
        audit_id=audit_id,
        status=status,
        message=message,
        committed_at=committed_at,
    )

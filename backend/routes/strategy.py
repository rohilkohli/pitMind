from datetime import datetime, timezone
from uuid import uuid4
import logging
from typing import Optional

from fastapi import APIRouter, File, HTTPException, Request, UploadFile, Depends
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

try:
    from ..models.race_state import TelemetryPayload
    from ..models.strategy import FastF1Request, StrategyCommitRequest, StrategyCommitResponse
    from ..models.audit_log import AuditLog
    from ..models.database import get_db
    from .auth import verify_token
    from ..services import pipeline as pipeline_svc
    from ..services import sanitize
    from ..services import fastf1_service
    from ..services.cache_manager import (
        invalidate_cache,
        invalidate_driver_cache,
        invalidate_session_cache,
        reset_cache_stats,
        warm_cache_for_scenario,
        _cache_stats,
    )
    from ..services.cache_invalidator import cache_invalidator
except ImportError:
    from models.race_state import TelemetryPayload
    from models.strategy import FastF1Request, StrategyCommitRequest, StrategyCommitResponse
    from models.audit_log import AuditLog
    from models.database import get_db
    from routes.auth import verify_token
    from services import pipeline as pipeline_svc
    from services import sanitize
    from services import fastf1_service
    from services.cache_manager import (
        invalidate_cache,
        invalidate_driver_cache,
        invalidate_session_cache,
        reset_cache_stats,
        warm_cache_for_scenario,
        _cache_stats,
    )
    from services.cache_invalidator import cache_invalidator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/strategy", tags=["strategy"])
limiter = Limiter(key_func=get_remote_address)

# In-memory fallback for when database is unavailable
STRATEGY_AUDIT_LOG: list[dict] = []

@router.post("/recommend")
@limiter.limit("10/minute")  # Strict rate limit for AI-powered strategy recommendations
async def recommend_strategy(
    request: Request,
    payload: TelemetryPayload,
    uid: str = Depends(verify_token),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """Generate strategy recommendation with transparent heuristic scoring and AI explanation."""
    try:
        if not payload.laps:
            raise HTTPException(status_code=400, detail="No telemetry laps provided")
        
        result = await pipeline_svc.run_strategy_pipeline(payload)
        
        # Save to database (graceful degradation if unavailable)
        try:
            # Extract relevant data from result
            audit_log = AuditLog(
                timestamp=datetime.now(timezone.utc),
                session_id=payload.session_label if hasattr(payload, "session_label") and payload.session_label else "unknown",
                driver=payload.driver or "unknown",
                lap=payload.laps[-1].lap if payload.laps else 0,
                strategy_type=result.action or "unknown",
                confidence=result.confidence,
                reasoning=result.explanation or "",
                telemetry_snapshot=payload.model_dump(),
                metadata={
                    "uid": uid,
                    "client": request.client.host if request.client else "unknown",
                    "pipeline_version": "1.0"
                }
            )
            
            db.add(audit_log)
            await db.commit()
            logger.info(f"Strategy recommendation saved to database: {audit_log.id}")
            
        except Exception as db_error:
            logger.warning(f"Failed to save strategy to database: {db_error}")
            # Continue execution - database failure shouldn't break the API
            await db.rollback()
        
        return result.model_dump()
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid telemetry: {str(e)}") from e
    except Exception as e:
        logger.error(f"Strategy recommendation failed: {e}", exc_info=True)
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
    db: AsyncSession = Depends(get_db),
) -> StrategyCommitResponse:
    """Commit a strategy call and append an audit record for traceability."""
    readiness = (
        int(body.checklist.pit_crew_ready)
        + int(body.checklist.tyre_set_confirmed)
        + int(body.checklist.radio_call_prepared)
    )

    audit_id = f"strat-{uuid4().hex[:12]}"
    committed_at = datetime.now(timezone.utc).isoformat()
    
    # Create audit record
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
    
    # Save to database (with fallback to in-memory)
    try:
        audit_log = AuditLog(
            timestamp=datetime.now(timezone.utc),
            session_id=body.session_context.get("session_id", "unknown") if body.session_context else "unknown",
            driver=body.session_context.get("driver", "unknown") if body.session_context else "unknown",
            lap=body.session_context.get("lap", 0) if body.session_context else 0,
            strategy_type="commit",
            confidence=1.0,
            reasoning=body.execution_brief or "",
            telemetry_snapshot=None,
            metadata=record
        )
        
        db.add(audit_log)
        await db.commit()
        logger.info(f"Strategy commit saved to database: {audit_log.id}")
        
    except Exception as db_error:
        logger.warning(f"Failed to save commit to database, using in-memory fallback: {db_error}")
        STRATEGY_AUDIT_LOG.append(record)
        await db.rollback()

    status = "committed" if readiness == 3 else "committed_with_warnings"
    message = "Strategy committed to audit log." if readiness == 3 else "Strategy committed, but checklist is incomplete."

    return StrategyCommitResponse(
        audit_id=audit_id,
        status=status,
        message=message,
        committed_at=committed_at,
    )


@router.get("/audit/history")
async def get_audit_history(
    request: Request,
    session_id: str | None = None,
    driver: str | None = None,
    limit: int = 100,
    offset: int = 0,
    uid: str = Depends(verify_token),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Retrieve audit log history from database with pagination.

    Args:
        session_id: Filter by session ID
        driver: Filter by driver name
        limit: Maximum number of records to return (default: 100, max: 1000)
        offset: Number of records to skip (for pagination)

    Returns:
        dict with 'total', 'limit', 'offset', and 'records' keys
    """
    try:
        # Input validation to prevent SQL injection
        if session_id:
            # Validate session_id: alphanumeric, underscores, hyphens only, max 128 chars
            if len(session_id) > 128 or not all(c.isalnum() or c in "_-" for c in session_id):
                raise HTTPException(
                    status_code=400,
                    detail="Invalid session_id format. Use alphanumeric characters, underscores, and hyphens only."
                )

        if driver:
            # Validate driver: alphanumeric, spaces, hyphens only, max 64 chars
            if len(driver) > 64 or not all(c.isalnum() or c in " -" for c in driver):
                raise HTTPException(
                    status_code=400,
                    detail="Invalid driver format. Use alphanumeric characters, spaces, and hyphens only."
                )

        # Validate limit and offset to prevent abuse
        if limit < 0:
            raise HTTPException(status_code=400, detail="Limit must be non-negative")
        if offset < 0:
            raise HTTPException(status_code=400, detail="Offset must be non-negative")

        limit = min(limit, 1000)

        # Build query with parameterized values (SQLAlchemy ORM handles parameterization)
        query = select(AuditLog).order_by(desc(AuditLog.timestamp))

        # Apply filters using parameterized queries
        if session_id:
            query = query.where(AuditLog.session_id == session_id)
        if driver:
            query = query.where(AuditLog.driver == driver)
        
        # Apply pagination
        query = query.limit(limit).offset(offset)
        
        # Execute query
        result = await db.execute(query)
        audit_logs = result.scalars().all()
        
        # Convert to dict
        records = [log.to_dict() for log in audit_logs]
        
        # Get total count (for pagination info)
        count_query = select(AuditLog)
        if session_id:
            count_query = count_query.where(AuditLog.session_id == session_id)
        if driver:
            count_query = count_query.where(AuditLog.driver == driver)
        
        from sqlalchemy import func
        count_result = await db.execute(select(func.count()).select_from(count_query.subquery()))
        total = count_result.scalar() or 0
        
        return {
            "total": total,
            "limit": limit,
            "offset": offset,
            "records": records,
        }
        
    except Exception as e:
        logger.error(f"Failed to retrieve audit history: {e}")
        # Fallback to in-memory log
        filtered_records = STRATEGY_AUDIT_LOG
        if session_id:
            filtered_records = [r for r in filtered_records if r.get("session_context", {}).get("session_id") == session_id]
        if driver:
            filtered_records = [r for r in filtered_records if r.get("session_context", {}).get("driver") == driver]
        
        return {
            "total": len(filtered_records),
            "limit": limit,
            "offset": offset,
            "records": filtered_records[offset:offset + limit],
            "source": "in_memory_fallback"
        }



# Cache Management Endpoints

@router.get("/cache/stats")
async def get_cache_statistics(
    request: Request,
    uid: str = Depends(verify_token),
) -> dict:
    """
    Get cache statistics including hit/miss rates.
    
    Returns cache performance metrics for monitoring.
    """
    total_requests = _cache_stats["hits"] + _cache_stats["misses"]
    hit_rate = (_cache_stats["hits"] / total_requests * 100) if total_requests > 0 else 0.0
    
    return {
        "hits": _cache_stats["hits"],
        "misses": _cache_stats["misses"],
        "sets": _cache_stats["sets"],
        "invalidations": _cache_stats["invalidations"],
        "errors": _cache_stats["errors"],
        "hit_rate": round(hit_rate, 2),
        "total_requests": total_requests,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/cache/invalidate")
async def invalidate_strategy_cache(
    request: Request,
    pattern: Optional[str] = None,
    driver: Optional[str] = None,
    session_id: Optional[str] = None,
    uid: str = Depends(verify_token),
) -> dict:
    """
    Invalidate cache entries based on pattern, driver, or session.
    
    Args:
        pattern: Redis key pattern (e.g., "strategy:v1:*")
        driver: Driver name to invalidate cache for
        session_id: Session ID to invalidate cache for
        
    Returns:
        Number of cache entries invalidated
    """
    try:
        invalidated = 0
        
        if pattern:
            invalidated = await invalidate_cache(pattern)
            logger.info(f"Cache invalidated by pattern '{pattern}': {invalidated} entries (uid: {uid})")
        
        elif driver and session_id:
            invalidated = await invalidate_driver_cache(driver, session_id)
            logger.info(f"Cache invalidated for driver '{driver}' in session '{session_id}': {invalidated} entries (uid: {uid})")
        
        elif driver:
            invalidated = await invalidate_driver_cache(driver)
            logger.info(f"Cache invalidated for driver '{driver}': {invalidated} entries (uid: {uid})")
        
        elif session_id:
            invalidated = await invalidate_session_cache(session_id)
            logger.info(f"Cache invalidated for session '{session_id}': {invalidated} entries (uid: {uid})")
        
        else:
            raise HTTPException(
                status_code=400,
                detail="Must provide pattern, driver, or session_id parameter"
            )
        
        return {
            "invalidated": invalidated,
            "pattern": pattern,
            "driver": driver,
            "session_id": session_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Cache invalidation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Cache invalidation error: {str(e)}")


@router.post("/cache/warm")
async def warm_strategy_cache(
    request: Request,
    payload: TelemetryPayload,
    strategy_types: list[str] = ["pit_stop", "tire_choice", "fuel_management"],
    session_id: Optional[str] = None,
    uid: str = Depends(verify_token),
) -> dict:
    """
    Pre-warm cache for common strategy scenarios.
    
    Useful for preparing cache before race sessions to reduce latency.
    
    Args:
        payload: Telemetry payload to warm cache for
        strategy_types: List of strategy types to pre-compute
        session_id: Optional session identifier
        
    Returns:
        Number of cache entries warmed
    """
    try:
        warmed = await warm_cache_for_scenario(payload, strategy_types, session_id)
        
        logger.info(
            f"Cache warmed for {len(strategy_types)} strategy types: "
            f"{warmed} entries prepared (uid: {uid})"
        )
        
        return {
            "warmed": warmed,
            "strategy_types": strategy_types,
            "driver": payload.driver,
            "session_id": session_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        
    except Exception as e:
        logger.error(f"Cache warming failed: {e}")
        raise HTTPException(status_code=500, detail=f"Cache warming error: {str(e)}")


@router.post("/cache/race-condition")
async def handle_race_condition(
    request: Request,
    condition: str,
    session_id: str,
    driver: Optional[str] = None,
    metadata: Optional[dict] = None,
    uid: str = Depends(verify_token),
) -> dict:
    """
    Trigger cache invalidation based on race condition.
    
    Handles smart cache invalidation for events like:
    - safety_car
    - virtual_safety_car
    - red_flag
    - weather_change
    - pit_stop_completed
    
    Args:
        condition: Race condition type
        session_id: Session identifier
        driver: Optional driver identifier
        metadata: Optional metadata about the condition
        
    Returns:
        Number of cache entries invalidated
    """
    try:
        from services.cache_invalidator import RaceCondition
        
        # Validate condition
        try:
            race_condition = RaceCondition(condition)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid race condition. Must be one of: {[c.value for c in RaceCondition]}"
            )
        
        invalidated = await cache_invalidator.on_race_condition(
            race_condition,
            session_id,
            driver,
            metadata
        )
        
        logger.info(
            f"Race condition '{condition}' handled: {invalidated} cache entries invalidated "
            f"(session: {session_id}, driver: {driver}, uid: {uid})"
        )
        
        return {
            "condition": condition,
            "invalidated": invalidated,
            "session_id": session_id,
            "driver": driver,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Race condition handling failed: {e}")
        raise HTTPException(status_code=500, detail=f"Race condition handling error: {str(e)}")


@router.get("/cache/invalidation-log")
async def get_invalidation_log(
    request: Request,
    limit: int = 50,
    uid: str = Depends(verify_token),
) -> dict:
    """
    Get recent cache invalidation events.
    
    Args:
        limit: Maximum number of events to return (default: 50, max: 100)
        
    Returns:
        List of recent invalidation events
    """
    try:
        limit = min(limit, 100)
        
        events = cache_invalidator.get_invalidation_log(limit)
        
        return {
            "total": len(events),
            "limit": limit,
            "events": events,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        
    except Exception as e:
        logger.error(f"Failed to retrieve invalidation log: {e}")
        raise HTTPException(status_code=500, detail=f"Invalidation log error: {str(e)}")


@router.post("/cache/reset-stats")
async def reset_cache_statistics(
    request: Request,
    uid: str = Depends(verify_token),
) -> dict:
    """
    Reset cache statistics counters.
    
    Useful for testing or after maintenance windows.
    """
    try:
        reset_cache_stats()
        
        logger.info(f"Cache statistics reset (uid: {uid})")
        
        return {
            "message": "Cache statistics reset successfully",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        
    except Exception as e:
        logger.error(f"Failed to reset cache statistics: {e}")
        raise HTTPException(status_code=500, detail=f"Cache stats reset error: {str(e)}")

import os
import tempfile
from fastapi import APIRouter, File, HTTPException, Request, UploadFile, Depends

try:
    from ..models.chat import ChatRequest, ChatResponse, DebriefResponse
    from ..models.strategy import DriverCompareRequest, DriverCompareResponse
    from ..models.race_state import TelemetryPayload
    from .auth import verify_token
    from ..services import granite
    from ..services import pipeline as pipeline_svc
    from ..services import sanitize
    from ..services.strategy_engine import predict_strategy
except ImportError:
    from models.chat import ChatRequest, ChatResponse, DebriefResponse
    from models.strategy import DriverCompareRequest, DriverCompareResponse
    from models.race_state import TelemetryPayload
    from routes.auth import verify_token
    from services import granite
    from services import pipeline as pipeline_svc
    from services import sanitize
    from services.strategy_engine import predict_strategy

router = APIRouter(prefix="/api/v1", tags=["commentary"])

DEBRIEF_MAX_BYTES = 5 * 1024 * 1024

MAX_CHAT_MESSAGES = 20
MAX_CHAT_CHARS_TOTAL = 12000
MAX_CONTEXT_CHARS = 4000


@router.post("/compare/drivers")
async def compare_drivers(request: Request, body: DriverCompareRequest, uid: str = Depends(verify_token)) -> DriverCompareResponse:
    series_a = _series_from_payload(body.driver_a)
    series_b = _series_from_payload(body.driver_b)

    sa = _brief_summary(body.driver_a)
    sb = _brief_summary(body.driver_b)
    narrative = await pipeline_svc.compare_narrative(sa, sb)

    return DriverCompareResponse(
        chart_series={"driver_a": series_a, "driver_b": series_b},
        narrative=narrative,
    )

@router.post("/chat/explain")
async def chat_explain(request: Request, body: ChatRequest, uid: str = Depends(verify_token)) -> ChatResponse:
    system = (
        "You are PitMind Granite assistant: concise motorsport strategy explanations only. "
        "Refuse unrelated topics."
    )
    if len(body.messages) > MAX_CHAT_MESSAGES:
        raise HTTPException(status_code=400, detail=f"Too many messages; max {MAX_CHAT_MESSAGES}.")

    total_chars = sum(len(m.content) for m in body.messages)
    if total_chars > MAX_CHAT_CHARS_TOTAL:
        raise HTTPException(status_code=400, detail="Chat payload too large.")

    transcript = "\n".join(f"{m.role}: {m.content.strip()}" for m in body.messages[-12:])
    extra = ""
    if body.telemetry_context:
        safe_context = str(body.telemetry_context)[:MAX_CONTEXT_CHARS]
        extra = f"\nContext JSON: {safe_context}"
    user = (transcript + extra)[:MAX_CHAT_CHARS_TOTAL + MAX_CONTEXT_CHARS]
    reply = await granite.granite_generate(system, user)
    return ChatResponse(reply=reply)

@router.post("/debrief/upload")
async def debrief_upload(request: Request, file: UploadFile = File(...), uid: str = Depends(verify_token)) -> DebriefResponse:
    raw = await file.read()
    if len(raw) > DEBRIEF_MAX_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds debrief maximum size")
    text = ""
    name = (file.filename or "").lower()
    try:
        if name.endswith(".csv"):
            payload = sanitize.parse_upload_csv(raw)
            text = payload.model_dump_json()
        elif name.endswith(".json"):
            payload = sanitize.parse_upload_json(raw)
            text = payload.model_dump_json()
        elif name.endswith(".pdf"):
            text = _try_docling_pdf(raw)
        else:
            text = raw.decode("utf-8", errors="replace")[:50000]
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    report = await pipeline_svc.debrief_from_text(text)
    note = "Granite-generated debrief from uploaded race data."
    if name.endswith(".pdf"):
        note += " PDF parsed with Docling when available."
    return DebriefResponse(report_markdown=report, source_note=note)

def _series_from_payload(payload: TelemetryPayload) -> list[dict[str, float | int | None]]:
    rows = []
    for lp in sorted(payload.laps, key=lambda x: x.lap):
        rows.append({
            "lap": lp.lap,
            "lap_time_s": lp.lap_time_s,
            "tyre_wear_pct": lp.tyre_wear_pct,
            "gap_ahead_s": lp.gap_ahead_s,
        })
    return rows

def _brief_summary(payload: TelemetryPayload) -> str:
    if not payload.laps:
        return f"{payload.driver}: no laps"
    last = sorted(payload.laps, key=lambda x: x.lap)[-1]
    scores, reasons, meta = predict_strategy(payload)
    return (
        f"{payload.driver} @ {payload.circuit}: lap {last.lap}, wear ~{meta['wear']:.0f}%, "
        f"pit urgency {scores.pit_urgency:.1f}. Reasons: {'; '.join(reasons)}"
    )

def _try_docling_pdf(raw: bytes) -> str:
    try:
        from docling.document_converter import DocumentConverter
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(raw)
            path = tmp.name
        try:
            conv = DocumentConverter()
            res = conv.convert(path)
            return res.document.export_to_markdown()
        finally:
            try:
                os.unlink(path)
            except OSError:
                pass
    except Exception:
        return "[Docling unavailable — install docling and retry for PDF text extraction]"

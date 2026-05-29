"""Commentary, chat, and debrief routes — wired to IBM Granite and Docling."""

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
async def compare_drivers(
    request: Request,
    body: DriverCompareRequest,
    uid: str = Depends(verify_token),
) -> DriverCompareResponse:
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
async def chat_explain(
    request: Request,
    body: ChatRequest,
    uid: str = Depends(verify_token),
) -> ChatResponse:
    system = (
        "You are the PitMind Strategy Oracle, an elite F1 race engineer copilot powered by IBM Granite. "
        "Provide sharp, data-driven motorsport strategy explanations. "
        "Use authentic F1 terminology (e.g., undercut, overcut, degradation, dirty air, delta). "
        "Structure your response with a clear recommendation or insight, followed by 1-3 brief bullet points of supporting evidence if applicable. "
        "Keep it punchy, professional, and directly actionable. Refuse unrelated topics. Maximum 100 words."
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
async def debrief_upload(
    request: Request,
    file: UploadFile = File(...),
    uid: str = Depends(verify_token),
) -> DebriefResponse:
    """
    Upload race data or PDF for AI post-race debrief.

    PDF files are parsed with Docling (structure-aware document AI) before
    being passed to IBM Granite for strategic narrative generation.
    """
    raw = await file.read()
    if len(raw) > DEBRIEF_MAX_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds debrief maximum size (5 MB)")
    text = ""
    docling_meta: dict = {}
    name = (file.filename or "").lower()
    try:
        if name.endswith(".csv"):
            payload = sanitize.parse_upload_csv(raw)
            text = payload.model_dump_json()
        elif name.endswith(".json"):
            payload = sanitize.parse_upload_json(raw)
            text = payload.model_dump_json()
        elif name.endswith(".pdf"):
            text, docling_meta = _try_docling_pdf(raw)
        else:
            text = raw.decode("utf-8", errors="replace")[:50000]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    report = await pipeline_svc.debrief_from_text(text)

    # Build a human-readable source note that surfaces Docling provenance
    if name.endswith(".pdf") and docling_meta.get("docling_used"):
        pages = docling_meta.get("page_count", 0)
        tables = docling_meta.get("table_count", 0)
        figures = docling_meta.get("figure_count", 0)
        version = docling_meta.get("docling_version", "")
        ver_str = f" v{version}" if version and version != "unknown" else ""
        note = (
            f"PDF parsed with Docling{ver_str} — "
            f"{pages} page(s), {tables} table(s), {figures} figure(s) extracted. "
            "Narrative generated by IBM Granite (Watsonx.ai)."
        )
    elif name.endswith(".pdf"):
        note = "PDF received. Docling unavailable — plain text extraction used. Narrative by IBM Granite."
    else:
        note = "Granite-generated debrief from uploaded race data."

    return DebriefResponse(report_markdown=report, source_note=note)


# ── Internal helpers ──────────────────────────────────────────────────────────

def _series_from_payload(payload: TelemetryPayload) -> list[dict]:
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


def _try_docling_pdf(raw: bytes) -> tuple[str, dict]:
    """
    Parse a PDF with Docling (IBM's document AI) and return (markdown_text, metadata).

    Metadata includes:
      - docling_used: bool — True only if Docling ran successfully
      - page_count: int — number of PDF pages parsed
      - table_count: int — number of tables extracted
      - figure_count: int — number of figures/images extracted
      - docling_version: str — installed Docling version for provenance

    Falls back gracefully if Docling is not installed (e.g. plain text or stub).
    """
    import logging
    logger = logging.getLogger("docling_pdf")

    meta: dict = {
        "docling_used": False,
        "page_count": 0,
        "table_count": 0,
        "figure_count": 0,
        "docling_version": None,
    }
    try:
        logger.info("Attempting Docling import...")
        import docling  # noqa: F401
        from docling.document_converter import DocumentConverter
        logger.info("Docling imported successfully")

        # Capture installed Docling version for traceability
        try:
            meta["docling_version"] = docling.__version__
        except AttributeError:
            meta["docling_version"] = "unknown"
        logger.info("Docling version: %s", meta["docling_version"])

        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(raw)
            path = tmp.name
        logger.info("Wrote PDF to temp file: %s (%d bytes)", path, len(raw))

        try:
            logger.info("Creating DocumentConverter...")
            conv = DocumentConverter()
            logger.info("Converting PDF...")
            res = conv.convert(path)
            doc = res.document
            logger.info("Conversion complete, exporting to markdown...")

            markdown_text = doc.export_to_markdown()
            logger.info("Markdown export done, length=%d", len(markdown_text))

            # Page count
            try:
                meta["page_count"] = len(doc.pages) if hasattr(doc, "pages") else 0
            except Exception:
                meta["page_count"] = 0

            # Table + figure counts via Docling item iterator
            try:
                from docling_core.types.doc import TableItem, PictureItem
                for item, _ in doc.iterate_items():
                    if isinstance(item, TableItem):
                        meta["table_count"] += 1
                    elif isinstance(item, PictureItem):
                        meta["figure_count"] += 1
            except Exception:
                pass  # docling_core import might differ by version

            meta["docling_used"] = True
            logger.info("Docling SUCCESS: pages=%d, tables=%d, figures=%d",
                        meta["page_count"], meta["table_count"], meta["figure_count"])
            return markdown_text, meta

        finally:
            try:
                os.unlink(path)
            except OSError:
                pass

    except ImportError as exc:
        logger.error("Docling ImportError: %s", exc)
        fallback = (
            "[Docling not installed — run `pip install docling>=2.0.0` "
            "or uncomment it in requirements.txt for structured PDF extraction]"
        )
        return fallback, meta
    except Exception as exc:
        logger.error("Docling FAILED with %s: %s", type(exc).__name__, exc, exc_info=True)
        fallback = f"[Docling PDF parse failed: {exc}]"
        return fallback, meta

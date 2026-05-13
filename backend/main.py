"""PitMind FastAPI entrypoint."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import firebase_admin
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

try:
    # This will use GOOGLE_APPLICATION_CREDENTIALS environment variable
    firebase_admin.initialize_app()
except ValueError:
    pass  # App already initialized or no credentials provided

from config import cors_origin_list, get_settings
from models.chat import ChatRequest, ChatResponse, DebriefResponse
from models.strategy import DriverCompareRequest, DriverCompareResponse, StrategyRecommendation
from models.race_state import TelemetryPayload
from services import sanitize
from services import pipeline as pipeline_svc
from services import granite
from services.strategy_engine import predict_strategy

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)
RATE_LIMIT = f"{get_settings().rate_limit_per_minute}/minute"
app = FastAPI(title="PitMind API", version="0.1.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origin_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    response.headers["Cache-Control"] = "no-store"
    return response

@app.get("/health")
async def health() -> dict[str, Any]:
    return {"status": "ok", **granite.get_ai_status()}


@app.get("/api/health")
async def api_health() -> dict[str, Any]:
    return {"status": "ok", **granite.get_ai_status()}

from routes import strategy, commentary, fan, auth

app.include_router(strategy.router)
app.include_router(commentary.router)
app.include_router(fan.router)
app.include_router(auth.router)

"""Optional Langflow HTTP runner; falls back to local pipeline metadata."""

from __future__ import annotations

import logging
from typing import Any

import httpx

try:
    from ..config import get_settings
except ImportError:
    from config import get_settings

logger = logging.getLogger(__name__)


async def run_strategy_flow(payload: dict[str, Any]) -> dict[str, Any] | None:
    settings = get_settings()
    base = settings.langflow_api_url.rstrip("/") if settings.langflow_api_url else ""
    flow_id = settings.langflow_flow_id
    if not base or not flow_id:
        return None

    url = f"{base}/api/v1/run/{flow_id}"
    headers: dict[str, str] = {"Content-Type": "application/json"}
    if settings.langflow_api_key:
        headers["Authorization"] = f"Bearer {settings.langflow_api_key}"

    body = {"inputs": payload}
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            r = await client.post(url, json=body, headers=headers)
            r.raise_for_status()
            return r.json()
    except Exception as exc:  # noqa: BLE001
        logger.warning("Langflow call failed: %s", exc)
        return None

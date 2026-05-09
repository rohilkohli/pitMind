"""IBM Granite integrations: Watsonx → Replicate fallback → deterministic stub."""

from __future__ import annotations

import json
import logging
from typing import Any

import httpx

from config import get_settings

logger = logging.getLogger(__name__)


async def granite_generate(system: str, user: str, max_tokens: int = 512) -> str:
    settings = get_settings()

    if settings.watsonx_api_key and settings.watsonx_project_id:
        text = await _watsonx_chat(system, user, max_tokens)
        if text:
            return text

    if settings.replicate_api_token and settings.replicate_model_owner and settings.replicate_model_name:
        text = await _replicate_run(system, user, max_tokens)
        if text:
            return text

    if settings.hf_api_token and settings.hf_model_id:
        text = await _hf_run(system, user, max_tokens)
        if text:
            return text

    return _offline_stub(system, user)


async def _watsonx_chat(system: str, user: str, max_tokens: int) -> str | None:
    settings = get_settings()
    base = settings.watsonx_url.rstrip("/")
    token_url = "https://iam.cloud.ibm.com/identity/token"
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            tok = await client.post(
                token_url,
                data={
                    "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
                    "apikey": settings.watsonx_api_key,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            tok.raise_for_status()
            access = tok.json().get("access_token")
            if not access:
                return None

            model_id = settings.watsonx_model_id
            url = f"{base}/ml/v1/text/generation?version=2023-05-29"
            payload = {
                "input": f"<|system|>\n{system}\n<|user|>\n{user}\n<|assistant|>\n",
                "parameters": {
                    "decoding_method": "greedy",
                    "max_new_tokens": max_tokens,
                    "min_new_tokens": 1,
                },
                "model_id": model_id,
                "project_id": settings.watsonx_project_id,
            }
            r = await client.post(
                url,
                json=payload,
                headers={
                    "Authorization": f"Bearer {access}",
                    "Content-Type": "application/json",
                },
            )
            r.raise_for_status()
            data = r.json()
            results = data.get("results") or []
            if results and "generated_text" in results[0]:
                return results[0]["generated_text"].strip()
    except Exception as exc:  # noqa: BLE001
        logger.warning("Watsonx generation failed: %s", exc)
    return None


async def _replicate_run(system: str, user: str, max_tokens: int) -> str | None:
    settings = get_settings()
    version_url = (
        f"https://api.replicate.com/v1/models/"
        f"{settings.replicate_model_owner}/{settings.replicate_model_name}/latest"
    )
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            ver = await client.get(
                version_url,
                headers={"Authorization": f"Token {settings.replicate_api_token}"},
            )
            ver.raise_for_status()
            version_id = ver.json().get("id")
            if not version_id:
                return None

            input_payload: dict[str, Any] = {
                "prompt": f"{system}\n\n{user}",
                "max_tokens": max_tokens,
            }
            pred = await client.post(
                "https://api.replicate.com/v1/predictions",
                json={"version": version_id, "input": input_payload},
                headers={"Authorization": f"Token {settings.replicate_api_token}"},
            )
            pred.raise_for_status()
            pred_id = pred.json().get("id")
            get_url = pred.json().get("urls", {}).get("get")
            if not pred_id or not get_url:
                return None

            import asyncio

            for _ in range(45):
                pr = await client.get(get_url, headers={"Authorization": f"Token {settings.replicate_api_token}"})
                pr.raise_for_status()
                body = pr.json()
                if body.get("status") == "succeeded":
                    out = body.get("output")
                    if isinstance(out, list):
                        return "".join(out).strip()
                    if isinstance(out, str):
                        return out.strip()
                    return json.dumps(out)
                if body.get("status") in {"failed", "canceled"}:
                    return None
                await asyncio.sleep(2)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Replicate generation failed: %s", exc)
    return None


async def _hf_run(system: str, user: str, max_tokens: int) -> str | None:
    settings = get_settings()
    url = f"https://api-inference.huggingface.co/models/{settings.hf_model_id}/v1/chat/completions"
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            payload = {
                "model": settings.hf_model_id,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user}
                ],
                "max_tokens": max_tokens,
                "temperature": 0.0
            }
            res = await client.post(
                url,
                json=payload,
                headers={"Authorization": f"Bearer {settings.hf_api_token}"}
            )
            res.raise_for_status()
            data = res.json()
            if "choices" in data and len(data["choices"]) > 0:
                return data["choices"][0]["message"]["content"].strip()
    except Exception as exc:  # noqa: BLE001
        logger.warning("HuggingFace generation failed: %s", exc)
    return None


def _offline_stub(system: str, user: str) -> str:
    return (
        "[Granite offline stub — configure WATSONX_* or REPLICATE_* in .env] "
        "Summary based on embedded telemetry context:\n"
        f"{user[:1200]}"
    )

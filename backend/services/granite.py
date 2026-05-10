"""PitMind Granite integration via Hugging Face Inference API."""

from __future__ import annotations

import json
import logging
from typing import Any

import httpx

from config import get_settings

logger = logging.getLogger(__name__)

HF_CHAT_COMPLETIONS_URL = "https://router.huggingface.co/v1/chat/completions"
STRATEGY_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": [
        "recommendation",
        "prose",
        "evidence",
        "confidence",
        "assumptions",
        "alternative",
    ],
    "properties": {
        "recommendation": {"type": "string"},
        "prose": {"type": "string"},
        "evidence": {
            "type": "array",
            "items": {"type": "string"},
        },
        "confidence": {"type": "number", "minimum": 0, "maximum": 100},
        "assumptions": {
            "type": "array",
            "items": {"type": "string"},
        },
        "alternative": {"type": "string"},
    },
}


async def granite_generate(system: str, user: str, max_tokens: int = 512) -> str:
    settings = get_settings()

    # Try Watsonx first
    if settings.watsonx_api_key and settings.watsonx_project_id:
        text = await _watsonx_chat(system, user, max_tokens)
        if text:
            return text

    # Fall back to HuggingFace
    if settings.hf_api_token and settings.hf_model_id:
        text = await _hf_run(system, user, max_tokens)
        if text:
            return text

    return _offline_stub(system, user)


def get_ai_status() -> dict[str, Any]:
    settings = get_settings()
    watsonx_ready = bool(settings.watsonx_api_key.strip() and settings.watsonx_project_id.strip())
    hf_ready = bool(settings.hf_api_token.strip() and settings.hf_model_id.strip())
    
    if watsonx_ready:
        provider = "watsonx"
    elif hf_ready:
        provider = "granite"
    else:
        provider = "stub"
    
    return {
        "provider": provider,
        "watsonx_configured": watsonx_ready,
        "hf_token_loaded": hf_ready,
        "hf_model_id": settings.hf_model_id,
    }


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
            # Updated Watsonx API version
            url = f"{base}/ml/v1/text/generation?version=2024-05-01"
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
            try:
                r.raise_for_status()
            except httpx.HTTPStatusError as exc:
                # Log full response body for debugging IBM errors
                resp = exc.response
                try:
                    body_text = resp.text
                except Exception:
                    body_text = "<unreadable response body>"
                print(f"DEBUG: Watsonx HTTP {resp.status_code}: {body_text}")
                logger.warning("Watsonx HTTP %s: %s", resp.status_code, body_text)
                return None
            data = r.json()
            results = data.get("results") or []
            if results and "generated_text" in results[0]:
                return results[0]["generated_text"].strip()
    except httpx.HTTPStatusError as exc:  # noqa: BLE001
        resp = exc.response
        try:
            body_text = resp.text
        except Exception:
            body_text = "<unreadable response body>"
        print(f"DEBUG: Watsonx HTTP exception: {resp.status_code} {body_text}")
        logger.warning("Watsonx HTTP exception: %s %s", resp.status_code, body_text)
    except Exception as exc:  # noqa: BLE001
        print(f"DEBUG: Watsonx Exception: {exc}")
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
    expects_json = _expects_json_response(system, user)
    payload: dict[str, Any] = {
        "model": settings.hf_model_id,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "max_tokens": max_tokens,
        "temperature": 0.0,
        "top_p": 1.0,
    }
    if expects_json:
        payload["response_format"] = {
            "type": "json_schema",
            "json_schema": {
                "name": "pitmind_strategy_response",
                "description": "Strict PitMind strategy JSON output",
                "schema": STRATEGY_SCHEMA,
                "strict": True,
            },
        }
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(
                HF_CHAT_COMPLETIONS_URL,
                json=payload,
                headers={"Authorization": f"Bearer {settings.hf_api_token}", "Content-Type": "application/json"},
            )
            res.raise_for_status()
            data = res.json()
            if "choices" in data and len(data["choices"]) > 0:
                content = data["choices"][0]["message"]["content"]
                if expects_json:
                    return _normalize_strategy_json(content, system, user)
                return content.strip()
    except Exception as exc:  # noqa: BLE001
        logger.warning("HuggingFace generation failed: %s", exc)
    return None


def _expects_json_response(system: str, user: str) -> bool:
    haystack = f"{system}\n{user}".lower()
    return (
        "return only json" in haystack
        or "json schema" in haystack
        or '"recommendation"' in haystack
        or '"prose"' in haystack
        or ("evidence" in haystack and "assumptions" in haystack and "alternative" in haystack)
    )


def _normalize_strategy_json(content: str, system: str, user: str) -> str:
    payload = _extract_json_object(content)
    if not isinstance(payload, dict):
        payload = _repair_strategy_payload(content, system, user)
    normalized = _coerce_strategy_payload(payload, content, user)
    return json.dumps(normalized, ensure_ascii=False)


def _extract_json_object(content: str) -> Any:
    if not isinstance(content, str):
        return None
    text = content.strip()
    if not text:
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start < 0 or end <= start:
            return None
        try:
            return json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            return None


def _repair_strategy_payload(content: str, system: str, user: str) -> dict[str, Any]:
    fallback_text = content.strip() or user.strip() or "Strategy output unavailable."
    payload = {
        "recommendation": fallback_text[:160],
        "prose": fallback_text,
        "evidence": [],
        "confidence": 0,
        "assumptions": [],
        "alternative": "No alternative available.",
    }
    if system.strip():
        payload["assumptions"] = [system.strip()[:200]]
    return payload


def _coerce_strategy_payload(payload: Any, raw_text: str, user: str) -> dict[str, Any]:
    if not isinstance(payload, dict):
        payload = {}
    recommendation = _coerce_text(
        payload.get("recommendation") or payload.get("summary") or payload.get("explanation"),
        (user.strip() or raw_text.strip() or "Strategy output unavailable.")[:160],
    )
    prose = _coerce_text(payload.get("prose") or payload.get("summary") or payload.get("explanation"), raw_text.strip() or recommendation)
    evidence = _coerce_list(payload.get("evidence"))
    assumptions = _coerce_list(payload.get("assumptions"))
    confidence = _coerce_confidence(payload.get("confidence"))
    alternative = _coerce_text(payload.get("alternative"), "No alternative available.")
    return {
        "recommendation": recommendation,
        "prose": prose,
        "evidence": evidence,
        "confidence": confidence,
        "assumptions": assumptions,
        "alternative": alternative,
    }


def _coerce_text(value: Any, fallback: str) -> str:
    if isinstance(value, str):
        text = value.strip()
        if text:
            return text
    return fallback.strip() if fallback.strip() else fallback


def _coerce_list(value: Any) -> list[str]:
    if isinstance(value, list):
        items = [str(item).strip() for item in value if str(item).strip()]
        if items:
            return items
    return []


def _coerce_confidence(value: Any) -> int:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return 0
    if number <= 1.0:
        number *= 100.0
    return max(0, min(100, int(round(number))))


def _offline_stub(system: str, user: str) -> str:
    return (
        "[Granite offline stub — configure HF_API_TOKEN in backend/.env] "
        "Summary based on embedded telemetry context:\n"
        f"{user[:1200]}"
    )

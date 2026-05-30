"""PitMind Granite integration via Hugging Face Inference API."""

from __future__ import annotations

import asyncio
import json
import re
import time
from typing import Any, Optional

import httpx

try:
    from ..config import get_settings
    from .cache_manager import (
        generate_ai_response_cache_key,
        get_cached_strategy,
        set_cached_strategy,
    )
    from .logger import get_logger
except ImportError:
    from config import get_settings
    from services.cache_manager import (
        generate_ai_response_cache_key,
        get_cached_strategy,
        set_cached_strategy,
    )
    from services.logger import get_logger

logger = get_logger(__name__)

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


async def granite_generate(
    system: str,
    user: str,
    max_tokens: int = 512,
    bypass_cache: bool = False,
) -> str:
    """
    Generate AI response with caching support and parallel provider calls.

    Uses asyncio.gather with first-success pattern to try all providers
    simultaneously with 5s timeout per provider for optimal performance.

    Args:
        system: System prompt
        user: User prompt
        max_tokens: Maximum tokens for response
        bypass_cache: If True, skip cache and force fresh AI call

    Returns:
        Generated text response
    """
    settings = get_settings()
    start_time = time.time()

    # Check cache first (unless bypassed or disabled)
    if settings.cache_enabled and not bypass_cache:
        cache_key = generate_ai_response_cache_key(system, user, max_tokens)
        cached_response = await get_cached_strategy(cache_key)

        if cached_response is not None:
            logger.info("Cache HIT for AI response", cache_key_prefix=cache_key[:32])
            # Extract the actual response from cache entry
            if isinstance(cached_response, dict) and "data" in cached_response:
                return cached_response["data"]
            return str(cached_response)

    # Cache miss or bypassed - try providers in parallel with timeout
    generated_text: Optional[str] = None
    provider_used: Optional[str] = None

    # Build list of provider tasks
    provider_tasks = []
    provider_names = []

    # Add Watsonx if configured
    if settings.watsonx_api_key.strip() and settings.watsonx_project_id.strip():
        provider_tasks.append(
            asyncio.create_task(
                _call_provider_with_timeout(
                    "watsonx", _watsonx_chat, system, user, max_tokens
                )
            )
        )
        provider_names.append("watsonx")

    # Add HuggingFace if configured
    if settings.hf_api_token.strip() and settings.hf_model_id.strip():
        provider_tasks.append(
            asyncio.create_task(
                _call_provider_with_timeout(
                    "huggingface", _hf_run, system, user, max_tokens
                )
            )
        )
        provider_names.append("huggingface")

    # Add Replicate if configured
    if settings.replicate_api_token.strip():
        provider_tasks.append(
            asyncio.create_task(
                _call_provider_with_timeout(
                    "replicate", _replicate_run, system, user, max_tokens
                )
            )
        )
        provider_names.append("replicate")

    # Try all providers in parallel if any are configured
    if provider_tasks:
        try:
            # Use return_when=FIRST_COMPLETED to get first successful response
            done, pending = await asyncio.wait(
                provider_tasks,
                return_when=asyncio.FIRST_COMPLETED,
                timeout=45.0,  # Overall timeout for all providers
            )

            # Cancel pending tasks
            for task in pending:
                task.cancel()

            # Get first successful result
            for task in done:
                try:
                    result = await task
                    if result and result.get("text"):
                        generated_text = result["text"]
                        provider_used = result["provider"]
                        duration_ms = (time.time() - start_time) * 1000
                        logger.log_ai_request(
                            provider=provider_used,
                            model="granite",
                            duration_ms=duration_ms,
                            success=True,
                        )
                        logger.info(
                            "AI provider succeeded",
                            provider=provider_used,
                            duration_ms=round(duration_ms, 2),
                        )
                        break
                except Exception as e:
                    logger.warning("Provider task failed", exc_info=e)

        except asyncio.TimeoutError:
            logger.warning("All AI providers timed out", timeout_seconds=45.0)
        except Exception as e:
            logger.error("Error in parallel provider execution", exc_info=e)

    # Final fallback if no provider succeeded
    if not generated_text:
        logger.warning("All AI providers unavailable; using local fallback")
        generated_text = _local_fallback_response(system, user)
        provider_used = "local_fallback"

    # Cache the successful response
    if settings.cache_enabled and generated_text and not bypass_cache:
        cache_key = generate_ai_response_cache_key(system, user, max_tokens)
        # Use strategy TTL for AI responses
        await set_cached_strategy(
            cache_key, generated_text, ttl=settings.cache_ttl_strategy
        )
        logger.info("Cached AI response", cache_key_prefix=cache_key[:32])

    return generated_text


async def _call_provider_with_timeout(
    provider_name: str,
    provider_func,
    system: str,
    user: str,
    max_tokens: int,
    timeout: float = 30.0,
) -> dict[str, Any]:
    """
    Call an AI provider with timeout handling.

    Args:
        provider_name: Name of the provider
        provider_func: Async function to call
        system: System prompt
        user: User prompt
        max_tokens: Maximum tokens
        timeout: Timeout in seconds

    Returns:
        Dict with provider name and generated text, or None if failed
    """
    try:
        text = await asyncio.wait_for(
            provider_func(system, user, max_tokens), timeout=timeout
        )
        if text:
            return {"provider": provider_name, "text": text}
        return {"provider": provider_name, "text": None}
    except asyncio.TimeoutError:
        logger.warning(
            "Provider timeout", provider=provider_name, timeout_seconds=timeout
        )
        return {"provider": provider_name, "text": None}
    except Exception as e:
        logger.warning("Provider failed", provider=provider_name, exc_info=e)
        return {"provider": provider_name, "text": None}


def get_ai_status() -> dict[str, Any]:
    settings = get_settings()
    watsonx_ready = bool(
        settings.watsonx_api_key.strip()
        and settings.watsonx_project_id.strip()
        and settings.watsonx_url.strip()
    )
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
        "watsonx_url": settings.watsonx_url,
        "missing_requirements": [
            name
            for name, present in {
                "WATSONX_API_KEY": bool(settings.watsonx_api_key.strip()),
                "WATSONX_PROJECT_ID": bool(settings.watsonx_project_id.strip()),
                "WATSONX_URL": bool(settings.watsonx_url.strip()),
            }.items()
            if not present
        ],
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
                logger.error(
                    "Watsonx HTTP error", status_code=resp.status_code, body=body_text
                )
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
        logger.error(
            "Watsonx HTTP exception", status_code=resp.status_code, body=body_text
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("Watsonx generation failed", exc_info=exc)
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

            poll_interval = 0.5
            max_interval = 5.0
            for _ in range(45):
                pr = await client.get(
                    get_url,
                    headers={"Authorization": f"Token {settings.replicate_api_token}"},
                )
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
                await asyncio.sleep(poll_interval)
                poll_interval = min(poll_interval * 1.5, max_interval)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Replicate generation failed", exc_info=exc)
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
                headers={
                    "Authorization": f"Bearer {settings.hf_api_token}",
                    "Content-Type": "application/json",
                },
            )
            res.raise_for_status()
            data = res.json()
            if "choices" in data and len(data["choices"]) > 0:
                content = data["choices"][0]["message"]["content"]
                if expects_json:
                    return _normalize_strategy_json(content, system, user)
                return content.strip()
    except Exception as exc:  # noqa: BLE001
        logger.warning("HuggingFace generation failed", exc_info=exc)
    return None


def _expects_json_response(system: str, user: str) -> bool:
    haystack = f"{system}\n{user}".lower()
    return (
        "return only json" in haystack
        or "json schema" in haystack
        or '"recommendation"' in haystack
        or '"prose"' in haystack
        or (
            "evidence" in haystack
            and "assumptions" in haystack
            and "alternative" in haystack
        )
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
        payload.get("recommendation")
        or payload.get("summary")
        or payload.get("explanation"),
        (user.strip() or raw_text.strip() or "Strategy output unavailable.")[:160],
    )
    prose = _coerce_text(
        payload.get("prose") or payload.get("summary") or payload.get("explanation"),
        raw_text.strip() or recommendation,
    )
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


def _local_fallback_response(system: str, user: str) -> str:
    """Deterministic offline fallback to avoid exposing stub errors in UX."""
    cleaned = re.sub(r"\s+", " ", user).strip()
    if not cleaned:
        return "No chat context was provided. Share telemetry or a strategy question to continue."

    preview = cleaned[:420]
    return (
        "AI provider is not configured or is currently unreachable or timed out. PitMind is running in secure local fallback mode. "
        "Based on your latest chat context, prioritize tyre wear trend, lap-time delta, and gap evolution "
        "before committing a pit call. "
        f"Context preview: {preview}"
    )

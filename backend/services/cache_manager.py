"""
Comprehensive caching layer for AI responses and strategy recommendations.

This module provides:
- Deterministic cache key generation based on telemetry data
- Redis-backed cache operations with TTL management
- Cache statistics and monitoring
- Smart cache invalidation strategies
- Graceful degradation when cache is unavailable
"""

from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime
from typing import Any, Optional

import asyncio

try:
    from ..config import get_settings  # noqa: F401
    from ..models.race_state import TelemetryPayload  # noqa: F401
    from ..models.strategy import StrategyRecommendation  # noqa: F401
    from .redis_client import cache_get, cache_set, cache_delete, redis_operation  # noqa: F401
except ImportError:
    from config import get_settings
    from models.race_state import TelemetryPayload
    from services.redis_client import cache_get, cache_set, redis_operation

logger = logging.getLogger(__name__)

# Cache key version for schema changes
CACHE_VERSION = "v1"

# Cache key prefixes
PREFIX_STRATEGY = "strategy"
PREFIX_HEURISTIC = "heuristic"
PREFIX_TELEMETRY = "telemetry"
PREFIX_AI_RESPONSE = "ai_response"

# Cache statistics
_cache_stats = {
    "hits": 0,
    "misses": 0,
    "sets": 0,
    "invalidations": 0,
    "errors": 0,
}


def _normalize_telemetry_for_hash(payload: TelemetryPayload) -> dict[str, Any]:
    """
    Normalize telemetry payload for deterministic hashing.
    
    Extracts key fields that affect strategy decisions:
    - Latest lap data (lap number, times, wear, compound, fuel, gaps)
    - Circuit and driver context
    - Session type
    
    Args:
        payload: Telemetry payload to normalize
        
    Returns:
        Normalized dictionary for hashing
    """
    if not payload.laps:
        return {
            "circuit": payload.circuit,
            "driver": payload.driver,
            "session": payload.session_label,
            "laps": [],
        }
    
    # Sort laps by lap number for consistency
    sorted_laps = sorted(payload.laps, key=lambda x: x.lap)
    
    # Get latest lap data (most recent 5 laps for context)
    recent_laps = sorted_laps[-5:]
    
    normalized_laps = []
    for lap in recent_laps:
        normalized_laps.append({
            "lap": lap.lap,
            "lap_time_s": round(lap.lap_time_s, 3) if lap.lap_time_s else None,
            "tyre_wear_pct": round(lap.tyre_wear_pct, 1) if lap.tyre_wear_pct else None,
            "tyre_compound": lap.tyre_compound,
            "fuel_kg": round(lap.fuel_kg, 1) if lap.fuel_kg else None,
            "gap_ahead_s": round(lap.gap_ahead_s, 2) if lap.gap_ahead_s else None,
            "gap_behind_s": round(lap.gap_behind_s, 2) if lap.gap_behind_s else None,
        })
    
    return {
        "circuit": payload.circuit,
        "driver": payload.driver,
        "session": payload.session_label,
        "laps": normalized_laps,
    }


def _compute_telemetry_hash(payload: TelemetryPayload) -> str:
    """
    Compute deterministic hash of telemetry data.
    
    Uses SHA-256 for consistent hashing across requests with identical telemetry.
    
    Args:
        payload: Telemetry payload to hash
        
    Returns:
        Hexadecimal hash string (first 16 characters for brevity)
    """
    normalized = _normalize_telemetry_for_hash(payload)
    
    # Convert to JSON with sorted keys for deterministic output
    json_str = json.dumps(normalized, sort_keys=True, separators=(',', ':'))
    
    # Compute SHA-256 hash
    hash_obj = hashlib.sha256(json_str.encode('utf-8'))
    
    # Return first 16 characters for brevity while maintaining uniqueness
    return hash_obj.hexdigest()[:16]


def generate_strategy_cache_key(
    payload: TelemetryPayload,
    strategy_type: str = "pit_stop",
    session_id: Optional[str] = None,
) -> str:
    """
    Generate cache key for strategy recommendations.
    
    Format: strategy:v1:{driver}:{telemetry_hash}:{strategy_type}[:session_id]
    
    Args:
        payload: Telemetry payload
        strategy_type: Type of strategy (pit_stop, tire_choice, fuel_management)
        session_id: Optional session identifier for context
        
    Returns:
        Cache key string
    """
    telemetry_hash = _compute_telemetry_hash(payload)
    driver = payload.driver.replace(" ", "_").lower()
    
    key_parts = [
        PREFIX_STRATEGY,
        CACHE_VERSION,
        driver,
        telemetry_hash,
        strategy_type,
    ]
    
    if session_id:
        key_parts.append(session_id)
    
    return ":".join(key_parts)


def generate_heuristic_cache_key(
    payload: TelemetryPayload,
    session_id: Optional[str] = None,
) -> str:
    """
    Generate cache key for heuristic scoring results.
    
    Format: heuristic:v1:{driver}:{telemetry_hash}[:session_id]
    
    Args:
        payload: Telemetry payload
        session_id: Optional session identifier
        
    Returns:
        Cache key string
    """
    telemetry_hash = _compute_telemetry_hash(payload)
    driver = payload.driver.replace(" ", "_").lower()
    
    key_parts = [
        PREFIX_HEURISTIC,
        CACHE_VERSION,
        driver,
        telemetry_hash,
    ]
    
    if session_id:
        key_parts.append(session_id)
    
    return ":".join(key_parts)


def generate_ai_response_cache_key(
    system_prompt: str,
    user_prompt: str,
    max_tokens: int = 512,
) -> str:
    """
    Generate cache key for AI provider responses.
    
    Format: ai_response:v1:{prompt_hash}:{max_tokens}
    
    Args:
        system_prompt: System prompt for AI
        user_prompt: User prompt for AI
        max_tokens: Maximum tokens for response
        
    Returns:
        Cache key string
    """
    # Combine prompts for hashing
    combined = f"{system_prompt}\n\n{user_prompt}"
    
    # Compute hash
    hash_obj = hashlib.sha256(combined.encode('utf-8'))
    prompt_hash = hash_obj.hexdigest()[:16]
    
    return f"{PREFIX_AI_RESPONSE}:{CACHE_VERSION}:{prompt_hash}:{max_tokens}"


async def get_cached_strategy(cache_key: str) -> Optional[dict[str, Any]]:
    """
    Retrieve cached strategy recommendation.
    
    Args:
        cache_key: Cache key to retrieve
        
    Returns:
        Cached strategy data if found, None otherwise
    """
    try:
        cached_data = await cache_get(cache_key)
        
        if cached_data is not None:
            _cache_stats["hits"] += 1
            logger.debug(f"Cache HIT: {cache_key}")
            return cached_data
        
        _cache_stats["misses"] += 1
        logger.debug(f"Cache MISS: {cache_key}")
        return None
        
    except Exception as e:
        _cache_stats["errors"] += 1
        logger.error(f"Cache retrieval error for {cache_key}: {e}")
        return None


async def set_cached_strategy(
    cache_key: str,
    strategy_data: dict[str, Any] | str,
    ttl: Optional[int] = None,
) -> bool:
    """
    Store strategy recommendation in cache.
    
    Args:
        cache_key: Cache key to store under
        strategy_data: Strategy data to cache (dict or string)
        ttl: Time to live in seconds (None for default)
        
    Returns:
        True if successful, False otherwise
    """
    try:
        settings = get_settings()
        
        # Use default TTL if not specified
        if ttl is None:
            ttl = settings.cache_ttl_default
        
        # Add cache metadata
        cache_entry = {
            "data": strategy_data,
            "cached_at": datetime.utcnow().isoformat(),
            "ttl": ttl,
        }
        
        success = await cache_set(cache_key, cache_entry, ttl)
        
        if success:
            _cache_stats["sets"] += 1
            logger.debug(f"Cache SET: {cache_key} (TTL: {ttl}s)")
        
        return success
        
    except Exception as e:
        _cache_stats["errors"] += 1
        logger.error(f"Cache storage error for {cache_key}: {e}")
        return False


async def invalidate_cache(pattern: str) -> int:
    """
    Invalidate cache entries matching a pattern.
    
    Args:
        pattern: Redis key pattern (e.g., "strategy:v1:verstappen:*")
        
    Returns:
        Number of keys invalidated
    """
    try:
        async with redis_operation() as client:
            if client is None:
                logger.warning("Redis unavailable for cache invalidation")
                return 0
            
            # Scan for matching keys
            keys_to_delete = []
            async for key in client.scan_iter(match=pattern, count=100):
                keys_to_delete.append(key)
            
            if not keys_to_delete:
                logger.debug(f"No keys found matching pattern: {pattern}")
                return 0
            
            # Delete keys in batches
            deleted = await client.delete(*keys_to_delete)
            
            _cache_stats["invalidations"] += deleted
            logger.info(f"Cache invalidated: {deleted} keys matching {pattern}")
            
            return deleted
            
    except Exception as e:
        _cache_stats["errors"] += 1
        logger.error(f"Cache invalidation error for pattern {pattern}: {e}")
        return 0


async def invalidate_driver_cache(driver: str, session_id: Optional[str] = None) -> int:
    """
    Invalidate all cache entries for a specific driver.
    
    Args:
        driver: Driver name
        session_id: Optional session identifier to limit scope
        
    Returns:
        Number of keys invalidated
    """
    driver_normalized = driver.replace(" ", "_").lower()
    
    if session_id:
        pattern = f"*:{driver_normalized}:*:{session_id}"
    else:
        pattern = f"*:{driver_normalized}:*"
    
    return await invalidate_cache(pattern)


async def invalidate_session_cache(session_id: str) -> int:
    """
    Invalidate all cache entries for a specific session.
    
    Args:
        session_id: Session identifier
        
    Returns:
        Number of keys invalidated
    """
    pattern = f"*:{session_id}"
    return await invalidate_cache(pattern)


def reset_cache_stats() -> None:
    """Reset cache statistics counters."""
    _cache_stats.update({
        "hits": 0,
        "misses": 0,
        "sets": 0,
        "invalidations": 0,
        "errors": 0,
    })
    logger.info("Cache statistics reset")


async def warm_cache_for_scenario(
    payload: TelemetryPayload,
    strategy_types: list[str],
    session_id: Optional[str] = None,
) -> int:
    """
    Pre-warm cache for common strategy scenarios.
    
    Useful for preparing cache before race sessions.
    
    Args:
        payload: Telemetry payload to warm cache for
        strategy_types: List of strategy types to pre-compute
        session_id: Optional session identifier
        
    Returns:
        Number of cache entries warmed
    """
    warmed = 0
    
    async def check_and_prepare(strategy_type: str) -> bool:
        cache_key = generate_strategy_cache_key(payload, strategy_type, session_id)
        
        # Check if already cached
        existing = await get_cached_strategy(cache_key)
        if existing is not None:
            logger.debug(f"Cache already warm for {cache_key}")
            return False

        # Note: Actual strategy computation would happen here
        # For now, we just generate the key structure
        logger.debug(f"Cache warming prepared for {cache_key}")
        return True

    results = await asyncio.gather(
        *(check_and_prepare(strategy_type) for strategy_type in strategy_types)
    )

    warmed = sum(1 for result in results if result)
    
    return warmed


# Made with Bob
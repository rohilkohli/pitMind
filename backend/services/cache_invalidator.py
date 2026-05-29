"""
Smart cache invalidation for race state changes.

This module monitors race conditions and triggers selective cache invalidation:
- Safety car deployments
- Red flag conditions
- Weather changes
- Pit stop completions
- Race state transitions
"""

from __future__ import annotations

import logging
from datetime import datetime
from enum import Enum
from typing import Optional

try:
    from .cache_manager import (
        invalidate_cache,
        invalidate_driver_cache,
        invalidate_session_cache,
    )
except ImportError:
    from services.cache_manager import (
        invalidate_cache,
        invalidate_driver_cache,
        invalidate_session_cache,
    )

logger = logging.getLogger(__name__)


class RaceCondition(str, Enum):
    """Race conditions that trigger cache invalidation."""
    SAFETY_CAR = "safety_car"
    VIRTUAL_SAFETY_CAR = "virtual_safety_car"
    RED_FLAG = "red_flag"
    WEATHER_CHANGE = "weather_change"
    PIT_STOP_COMPLETED = "pit_stop_completed"
    RACE_START = "race_start"
    RACE_END = "race_end"
    SESSION_CHANGE = "session_change"


class InvalidationStrategy(str, Enum):
    """Cache invalidation strategies."""
    FULL_SESSION = "full_session"  # Invalidate all cache for session
    DRIVER_ONLY = "driver_only"  # Invalidate only driver-specific cache
    SELECTIVE = "selective"  # Invalidate based on condition type
    PRESERVE_HISTORICAL = "preserve_historical"  # Keep historical data


# Invalidation rules: maps race conditions to strategies
INVALIDATION_RULES = {
    RaceCondition.SAFETY_CAR: InvalidationStrategy.FULL_SESSION,
    RaceCondition.VIRTUAL_SAFETY_CAR: InvalidationStrategy.SELECTIVE,
    RaceCondition.RED_FLAG: InvalidationStrategy.FULL_SESSION,
    RaceCondition.WEATHER_CHANGE: InvalidationStrategy.FULL_SESSION,
    RaceCondition.PIT_STOP_COMPLETED: InvalidationStrategy.DRIVER_ONLY,
    RaceCondition.RACE_START: InvalidationStrategy.FULL_SESSION,
    RaceCondition.RACE_END: InvalidationStrategy.PRESERVE_HISTORICAL,
    RaceCondition.SESSION_CHANGE: InvalidationStrategy.FULL_SESSION,
}


class CacheInvalidator:
    """Manages smart cache invalidation based on race conditions."""
    
    def __init__(self):
        self.invalidation_log: list[dict] = []
        self._last_conditions: dict[str, RaceCondition] = {}
    
    async def on_race_condition(
        self,
        condition: RaceCondition,
        session_id: str,
        driver: Optional[str] = None,
        metadata: Optional[dict] = None,
    ) -> int:
        """
        Handle race condition and trigger appropriate cache invalidation.
        
        Args:
            condition: Race condition that occurred
            session_id: Session identifier
            driver: Optional driver identifier
            metadata: Optional metadata about the condition
            
        Returns:
            Number of cache entries invalidated
        """
        strategy = INVALIDATION_RULES.get(condition, InvalidationStrategy.SELECTIVE)
        
        logger.info(
            f"Race condition detected: {condition.value} "
            f"(session: {session_id}, driver: {driver}, strategy: {strategy.value})"
        )
        
        invalidated = 0
        
        if strategy == InvalidationStrategy.FULL_SESSION:
            invalidated = await self._invalidate_full_session(session_id)
        
        elif strategy == InvalidationStrategy.DRIVER_ONLY and driver:
            invalidated = await self._invalidate_driver(driver, session_id)
        
        elif strategy == InvalidationStrategy.SELECTIVE:
            invalidated = await self._invalidate_selective(condition, session_id, driver)
        
        elif strategy == InvalidationStrategy.PRESERVE_HISTORICAL:
            invalidated = await self._invalidate_preserve_historical(session_id)
        
        # Log invalidation event
        self._log_invalidation(condition, session_id, driver, invalidated, metadata)
        
        return invalidated
    
    async def _invalidate_full_session(self, session_id: str) -> int:
        """Invalidate all cache entries for a session."""
        logger.info(f"Full session cache invalidation: {session_id}")
        return await invalidate_session_cache(session_id)
    
    async def _invalidate_driver(self, driver: str, session_id: str) -> int:
        """Invalidate cache entries for a specific driver."""
        logger.info(f"Driver cache invalidation: {driver} (session: {session_id})")
        return await invalidate_driver_cache(driver, session_id)
    
    async def _invalidate_selective(
        self,
        condition: RaceCondition,
        session_id: str,
        driver: Optional[str] = None,
    ) -> int:
        """
        Selectively invalidate cache based on condition type.
        
        For VSC, only invalidate strategy recommendations but keep telemetry analysis.
        """
        invalidated = 0
        
        if condition == RaceCondition.VIRTUAL_SAFETY_CAR:
            # Only invalidate strategy cache, keep heuristic scoring
            pattern = f"strategy:*:{session_id}"
            invalidated = await invalidate_cache(pattern)
            logger.info(f"Selective invalidation (VSC): {invalidated} strategy entries")
        
        elif driver:
            invalidated = await self._invalidate_driver(driver, session_id)
        
        else:
            invalidated = await self._invalidate_full_session(session_id)
        
        return invalidated
    
    async def _invalidate_preserve_historical(self, session_id: str) -> int:
        """
        Invalidate active cache but preserve historical data.
        
        Used at race end to keep post-race analysis cached.
        """
        # Only invalidate real-time strategy cache, keep historical and post-race
        pattern = f"strategy:*:{session_id}"
        invalidated = await invalidate_cache(pattern)
        
        logger.info(
            f"Preserved historical cache, invalidated {invalidated} active entries "
            f"(session: {session_id})"
        )
        
        return invalidated
    
    def _log_invalidation(
        self,
        condition: RaceCondition,
        session_id: str,
        driver: Optional[str],
        invalidated: int,
        metadata: Optional[dict],
    ) -> None:
        """Log invalidation event for monitoring."""
        event = {
            "timestamp": datetime.utcnow().isoformat(),
            "condition": condition.value,
            "session_id": session_id,
            "driver": driver,
            "invalidated_count": invalidated,
            "metadata": metadata or {},
        }
        
        self.invalidation_log.append(event)
        
        # Keep only last 100 events
        if len(self.invalidation_log) > 100:
            self.invalidation_log = self.invalidation_log[-100:]
    
    def get_invalidation_log(self, limit: int = 50) -> list[dict]:
        """
        Get recent invalidation events.
        
        Args:
            limit: Maximum number of events to return
            
        Returns:
            List of invalidation events
        """
        return self.invalidation_log[-limit:]
    
    async def on_safety_car_deployed(self, session_id: str) -> int:
        """Handle safety car deployment."""
        return await self.on_race_condition(
            RaceCondition.SAFETY_CAR,
            session_id,
            metadata={"reason": "Safety car deployed - all strategies invalidated"}
        )
    
    async def on_virtual_safety_car(self, session_id: str) -> int:
        """Handle virtual safety car."""
        return await self.on_race_condition(
            RaceCondition.VIRTUAL_SAFETY_CAR,
            session_id,
            metadata={"reason": "VSC - selective strategy invalidation"}
        )
    
    async def on_red_flag(self, session_id: str) -> int:
        """Handle red flag."""
        return await self.on_race_condition(
            RaceCondition.RED_FLAG,
            session_id,
            metadata={"reason": "Red flag - full session invalidation"}
        )
    
    async def on_weather_change(
        self,
        session_id: str,
        old_condition: str,
        new_condition: str,
    ) -> int:
        """Handle weather change."""
        return await self.on_race_condition(
            RaceCondition.WEATHER_CHANGE,
            session_id,
            metadata={
                "reason": "Weather change",
                "old_condition": old_condition,
                "new_condition": new_condition,
            }
        )
    
    async def on_pit_stop_completed(
        self,
        session_id: str,
        driver: str,
        compound: str,
    ) -> int:
        """Handle pit stop completion."""
        return await self.on_race_condition(
            RaceCondition.PIT_STOP_COMPLETED,
            session_id,
            driver=driver,
            metadata={
                "reason": "Pit stop completed",
                "compound": compound,
            }
        )
    
    async def on_race_start(self, session_id: str) -> int:
        """Handle race start."""
        return await self.on_race_condition(
            RaceCondition.RACE_START,
            session_id,
            metadata={"reason": "Race start - clearing pre-race cache"}
        )
    
    async def on_race_end(self, session_id: str) -> int:
        """Handle race end."""
        return await self.on_race_condition(
            RaceCondition.RACE_END,
            session_id,
            metadata={"reason": "Race end - preserving historical data"}
        )
    
    async def on_session_change(
        self,
        old_session_id: str,
        new_session_id: str,
    ) -> int:
        """Handle session change (e.g., practice to qualifying)."""
        invalidated = await self.on_race_condition(
            RaceCondition.SESSION_CHANGE,
            old_session_id,
            metadata={
                "reason": "Session change",
                "old_session": old_session_id,
                "new_session": new_session_id,
            }
        )
        
        # Also invalidate new session to start fresh
        invalidated += await invalidate_session_cache(new_session_id)
        
        return invalidated


# Global invalidator instance
cache_invalidator = CacheInvalidator()


def get_cache_invalidator() -> CacheInvalidator:
    """Return shared cache invalidator instance."""
    return cache_invalidator


# Made with Bob
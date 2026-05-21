"""Middleware package for pitMind."""

from middleware.error_handler import (
    register_exception_handlers,
    ErrorTrackingMiddleware,
    PitMindException,
    CacheError,
    DatabaseError,
    AIProviderError,
    RateLimitError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    ResourceNotFoundError,
    ConfigurationError,
)

__all__ = [
    'register_exception_handlers',
    'ErrorTrackingMiddleware',
    'PitMindException',
    'CacheError',
    'DatabaseError',
    'AIProviderError',
    'RateLimitError',
    'ValidationError',
    'AuthenticationError',
    'AuthorizationError',
    'ResourceNotFoundError',
    'ConfigurationError',
]

# Made with Bob

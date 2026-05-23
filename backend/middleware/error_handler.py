"""
Global error handling middleware for pitMind.

Provides custom exception classes, error response formatting,
and centralized error handling for the FastAPI application.
"""

from typing import Any, Dict, Optional
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from services.logger import get_logger

logger = get_logger(__name__)


# Custom Exception Classes

class PitMindException(Exception):
    """Base exception for pitMind application."""
    
    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize pitMind exception.
        
        Args:
            message: Error message
            status_code: HTTP status code
            error_code: Application-specific error code
            details: Additional error details
        """
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or self.__class__.__name__
        self.details = details or {}
        super().__init__(self.message)


class CacheError(PitMindException):
    """Exception raised for cache-related errors."""
    
    def __init__(
        self,
        message: str = "Cache operation failed",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code="CACHE_ERROR",
            details=details
        )


class DatabaseError(PitMindException):
    """Exception raised for database-related errors."""
    
    def __init__(
        self,
        message: str = "Database operation failed",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code="DATABASE_ERROR",
            details=details
        )


class AIProviderError(PitMindException):
    """Exception raised for AI provider errors."""
    
    def __init__(
        self,
        message: str = "AI provider request failed",
        provider: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        error_details = details or {}
        if provider:
            error_details['provider'] = provider
        
        super().__init__(
            message=message,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code="AI_PROVIDER_ERROR",
            details=error_details
        )


class RateLimitError(PitMindException):
    """Exception raised when rate limit is exceeded."""
    
    def __init__(
        self,
        message: str = "Rate limit exceeded",
        retry_after: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        error_details = details or {}
        if retry_after:
            error_details['retry_after'] = retry_after
        
        super().__init__(
            message=message,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            error_code="RATE_LIMIT_EXCEEDED",
            details=error_details
        )


class ValidationError(PitMindException):
    """Exception raised for validation errors."""
    
    def __init__(
        self,
        message: str = "Validation failed",
        field: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        error_details = details or {}
        if field:
            error_details['field'] = field
        
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code="VALIDATION_ERROR",
            details=error_details
        )


class AuthenticationError(PitMindException):
    """Exception raised for authentication errors."""
    
    def __init__(
        self,
        message: str = "Authentication failed",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="AUTHENTICATION_ERROR",
            details=details
        )


class AuthorizationError(PitMindException):
    """Exception raised for authorization errors."""
    
    def __init__(
        self,
        message: str = "Access denied",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="AUTHORIZATION_ERROR",
            details=details
        )


class ResourceNotFoundError(PitMindException):
    """Exception raised when a resource is not found."""
    
    def __init__(
        self,
        message: str = "Resource not found",
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        error_details = details or {}
        if resource_type:
            error_details['resource_type'] = resource_type
        if resource_id:
            error_details['resource_id'] = resource_id
        
        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="RESOURCE_NOT_FOUND",
            details=error_details
        )


class ConfigurationError(PitMindException):
    """Exception raised for configuration errors."""
    
    def __init__(
        self,
        message: str = "Configuration error",
        config_key: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        error_details = details or {}
        if config_key:
            error_details['config_key'] = config_key
        
        super().__init__(
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="CONFIGURATION_ERROR",
            details=error_details
        )


# Error Response Formatting

def format_error_response(
    error_code: str,
    message: str,
    status_code: int,
    details: Optional[Dict[str, Any]] = None,
    request_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Format error response in consistent structure.
    
    Args:
        error_code: Application-specific error code
        message: Error message
        status_code: HTTP status code
        details: Additional error details
        request_id: Request ID for tracing
        
    Returns:
        Formatted error response dictionary
    """
    response: Dict[str, Any] = {
        'error': {
            'code': error_code,
            'message': message,
            'status_code': status_code
        }
    }
    
    if details:
        response['error']['details'] = details
    
    if request_id:
        response['request_id'] = request_id
    
    return response


# Exception Handlers

async def pitmind_exception_handler(request: Request, exc: PitMindException) -> JSONResponse:
    """
    Handle custom pitMind exceptions.
    
    Args:
        request: FastAPI request
        exc: PitMind exception
        
    Returns:
        JSON error response
    """
    from services.logger import get_request_id
    
    request_id = get_request_id()
    
    # Log error
    logger.error(
        f"Application error: {exc.error_code}",
        exc_info=exc,
        error_code=exc.error_code,
        status_code=exc.status_code,
        path=str(request.url),
        method=request.method,
        details=exc.details
    )
    
    # Format response
    response = format_error_response(
        error_code=exc.error_code,
        message=exc.message,
        status_code=exc.status_code,
        details=exc.details,
        request_id=request_id
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=response
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """
    Handle HTTP exceptions.
    
    Args:
        request: FastAPI request
        exc: HTTP exception
        
    Returns:
        JSON error response
    """
    from services.logger import get_request_id
    
    request_id = get_request_id()
    
    # Log error
    logger.warning(
        f"HTTP error: {exc.status_code}",
        status_code=exc.status_code,
        path=str(request.url),
        method=request.method,
        detail=exc.detail
    )
    
    # Format response
    response = format_error_response(
        error_code=f"HTTP_{exc.status_code}",
        message=exc.detail,
        status_code=exc.status_code,
        request_id=request_id
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=response
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Handle request validation errors.
    
    Args:
        request: FastAPI request
        exc: Validation error
        
    Returns:
        JSON error response
    """
    from services.logger import get_request_id
    
    request_id = get_request_id()
    
    # Extract validation errors
    errors = []
    for error in exc.errors():
        errors.append({
            'field': '.'.join(str(loc) for loc in error['loc']),
            'message': error['msg'],
            'type': error['type']
        })
    
    # Log error
    logger.warning(
        "Request validation failed",
        path=str(request.url),
        method=request.method,
        validation_errors=errors
    )
    
    # Format response
    response = format_error_response(
        error_code="VALIDATION_ERROR",
        message="Request validation failed",
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        details={'validation_errors': errors},
        request_id=request_id
    )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=response
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Handle unexpected exceptions.
    
    Args:
        request: FastAPI request
        exc: Exception
        
    Returns:
        JSON error response
    """
    from services.logger import get_request_id
    
    request_id = get_request_id()
    
    # Log error with full traceback
    logger.critical(
        "Unhandled exception",
        exc_info=exc,
        path=str(request.url),
        method=request.method,
        exception_type=type(exc).__name__
    )
    
    # Format response (don't expose internal details in production)
    response = format_error_response(
        error_code="INTERNAL_SERVER_ERROR",
        message="An unexpected error occurred",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        request_id=request_id
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=response
    )


# Middleware for error tracking

class ErrorTrackingMiddleware:
    """Middleware to track and log errors."""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        """Track errors in requests."""
        if scope['type'] != 'http':
            await self.app(scope, receive, send)
            return
        
        # Track if error occurred
        error_occurred = False
        status_code = 200
        
        async def send_wrapper(message):
            nonlocal error_occurred, status_code
            
            if message['type'] == 'http.response.start':
                status_code = message['status']
                if status_code >= 400:
                    error_occurred = True
            
            await send(message)
        
        try:
            await self.app(scope, receive, send_wrapper)
        except Exception as exc:
            error_occurred = True
            logger.error(
                "Error in request processing",
                exc_info=exc,
                path=scope.get('path'),
                method=scope.get('method')
            )
            raise
        finally:
            # Log error metrics
            if error_occurred:
                logger.info(
                    "Request completed with error",
                    path=scope.get('path'),
                    method=scope.get('method'),
                    status_code=status_code
                )


def register_exception_handlers(app):
    """
    Register all exception handlers with FastAPI app.
    
    Args:
        app: FastAPI application instance
    """
    app.add_exception_handler(PitMindException, pitmind_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)

# Made with Bob

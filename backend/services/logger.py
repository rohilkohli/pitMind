"""
Structured logging service for pitMind.

Provides JSON-formatted logging with request tracking, performance metrics,
and error context capture for production environments.
"""

import json
import logging
import sys
import time
import traceback
from contextvars import ContextVar
from datetime import datetime
from typing import Any, Dict, Optional
from uuid import uuid4

# Context variable for request ID tracking
request_id_var: ContextVar[Optional[str]] = ContextVar('request_id', default=None)


class StructuredLogger:
    """Structured logger with JSON formatting and context tracking."""
    
    def __init__(self, name: str, level: int = logging.INFO):
        """
        Initialize structured logger.
        
        Args:
            name: Logger name (typically module name)
            level: Logging level (default: INFO)
        """
        self.logger = logging.getLogger(name)
        self.logger.setLevel(level)
        
        # Remove existing handlers to avoid duplicates
        self.logger.handlers.clear()
        
        # Add JSON formatter handler
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JSONFormatter())
        self.logger.addHandler(handler)
        
        # Prevent propagation to root logger
        self.logger.propagate = False
    
    def _build_log_dict(
        self,
        level: str,
        message: str,
        extra: Optional[Dict[str, Any]] = None,
        exc_info: Optional[Exception] = None
    ) -> Dict[str, Any]:
        """
        Build structured log dictionary.
        
        Args:
            level: Log level
            message: Log message
            extra: Additional context
            exc_info: Exception information
            
        Returns:
            Structured log dictionary
        """
        log_dict = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'level': level,
            'message': message,
            'logger': self.logger.name,
            'request_id': request_id_var.get(),
        }
        
        if extra:
            # Safe-serialize: convert any non-JSON-serializable value to str
            safe_extra = {}
            for k, v in extra.items():
                try:
                    json.dumps(v)
                    safe_extra[k] = v
                except (TypeError, ValueError):
                    safe_extra[k] = str(v)
            log_dict.update(safe_extra)
        
        if exc_info:
            log_dict['exception'] = {
                'type': type(exc_info).__name__,
                'message': str(exc_info),
                'traceback': traceback.format_exc()
            }
        
        return log_dict
    
    def debug(self, message: str, **kwargs):
        """Log debug message."""
        log_dict = self._build_log_dict('DEBUG', message, kwargs)
        self.logger.debug(json.dumps(log_dict))
    
    def info(self, message: str, **kwargs):
        """Log info message."""
        log_dict = self._build_log_dict('INFO', message, kwargs)
        self.logger.info(json.dumps(log_dict))
    
    def warning(self, message: str, exc_info: Optional[Exception] = None, **kwargs):
        """Log warning message with optional exception."""
        log_dict = self._build_log_dict('WARNING', message, kwargs, exc_info)
        self.logger.warning(json.dumps(log_dict))
    
    def error(self, message: str, exc_info: Optional[Exception] = None, **kwargs):
        """Log error message with optional exception."""
        log_dict = self._build_log_dict('ERROR', message, kwargs, exc_info)
        self.logger.error(json.dumps(log_dict))
    
    def critical(self, message: str, exc_info: Optional[Exception] = None, **kwargs):
        """Log critical message with optional exception."""
        log_dict = self._build_log_dict('CRITICAL', message, kwargs, exc_info)
        self.logger.critical(json.dumps(log_dict))
    
    def log_request(
        self,
        method: str,
        path: str,
        status_code: int,
        duration_ms: float,
        **kwargs
    ):
        """
        Log HTTP request with performance metrics.
        
        Args:
            method: HTTP method
            path: Request path
            status_code: Response status code
            duration_ms: Request duration in milliseconds
            **kwargs: Additional context
        """
        self.info(
            'HTTP request completed',
            method=method,
            path=path,
            status_code=status_code,
            duration_ms=round(duration_ms, 2),
            **kwargs
        )
    
    def log_performance(
        self,
        operation: str,
        duration_ms: float,
        success: bool = True,
        **kwargs
    ):
        """
        Log performance metrics for operations.
        
        Args:
            operation: Operation name
            duration_ms: Operation duration in milliseconds
            success: Whether operation succeeded
            **kwargs: Additional context
        """
        self.info(
            'Performance metric',
            operation=operation,
            duration_ms=round(duration_ms, 2),
            success=success,
            **kwargs
        )
    
    def log_cache_operation(
        self,
        operation: str,
        key: str,
        hit: Optional[bool] = None,
        duration_ms: Optional[float] = None,
        **kwargs
    ):
        """
        Log cache operations.
        
        Args:
            operation: Cache operation (get, set, delete, etc.)
            key: Cache key
            hit: Whether cache hit occurred (for get operations)
            duration_ms: Operation duration
            **kwargs: Additional context
        """
        log_data = {
            'operation': operation,
            'cache_key': key,
            **kwargs
        }
        
        if hit is not None:
            log_data['cache_hit'] = hit
        
        if duration_ms is not None:
            log_data['duration_ms'] = round(duration_ms, 2)
        
        self.info('Cache operation', **log_data)
    
    def log_database_query(
        self,
        query_type: str,
        table: str,
        duration_ms: float,
        rows_affected: Optional[int] = None,
        **kwargs
    ):
        """
        Log database query performance.
        
        Args:
            query_type: Query type (SELECT, INSERT, UPDATE, DELETE)
            table: Table name
            duration_ms: Query duration
            rows_affected: Number of rows affected
            **kwargs: Additional context
        """
        log_data = {
            'query_type': query_type,
            'table': table,
            'duration_ms': round(duration_ms, 2),
            **kwargs
        }
        
        if rows_affected is not None:
            log_data['rows_affected'] = rows_affected
        
        self.info('Database query', **log_data)
    
    def log_ai_request(
        self,
        provider: str,
        model: str,
        duration_ms: float,
        success: bool,
        tokens_used: Optional[int] = None,
        **kwargs
    ):
        """
        Log AI provider requests.
        
        Args:
            provider: AI provider name
            model: Model name
            duration_ms: Request duration
            success: Whether request succeeded
            tokens_used: Number of tokens used
            **kwargs: Additional context
        """
        log_data = {
            'provider': provider,
            'model': model,
            'duration_ms': round(duration_ms, 2),
            'success': success,
            **kwargs
        }
        
        if tokens_used is not None:
            log_data['tokens_used'] = tokens_used
        
        self.info('AI request', **log_data)


class JSONFormatter(logging.Formatter):
    """JSON formatter for log records."""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON string."""
        # If message is already JSON, return as-is
        if record.msg.startswith('{'):
            return record.msg
        
        # Otherwise, create basic JSON structure
        log_dict = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'level': record.levelname,
            'message': record.getMessage(),
            'logger': record.name,
            'request_id': request_id_var.get(),
        }
        
        if record.exc_info:
            log_dict['exception'] = {
                'type': record.exc_info[0].__name__ if record.exc_info[0] else None,
                'message': str(record.exc_info[1]) if record.exc_info[1] else None,
                'traceback': self.formatException(record.exc_info)
            }
        
        return json.dumps(log_dict)


class RequestIDMiddleware:
    """Middleware to generate and track request IDs."""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        """Generate request ID and store in context."""
        if scope['type'] == 'http':
            # Generate or extract request ID
            headers = dict(scope.get('headers', []))
            request_id = headers.get(b'x-request-id', str(uuid4()).encode()).decode()
            
            # Store in context variable
            request_id_var.set(request_id)
            
            # Add to response headers
            async def send_with_request_id(message):
                if message['type'] == 'http.response.start':
                    headers = message.get('headers', [])
                    headers.append((b'x-request-id', request_id.encode()))
                    message['headers'] = headers
                await send(message)
            
            await self.app(scope, receive, send_with_request_id)
        else:
            await self.app(scope, receive, send)


class PerformanceTimer:
    """Context manager for timing operations."""
    
    def __init__(self, logger: StructuredLogger, operation: str, **kwargs):
        """
        Initialize performance timer.
        
        Args:
            logger: Structured logger instance
            operation: Operation name
            **kwargs: Additional context
        """
        self.logger = logger
        self.operation = operation
        self.context = kwargs
        self.start_time: float = 0.0
        self.success = True
    
    def __enter__(self):
        """Start timer."""
        self.start_time = time.time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Stop timer and log performance."""
        duration_ms = (time.time() - self.start_time) * 1000
        
        if exc_type is not None:
            self.success = False
            self.logger.error(
                f'Operation failed: {self.operation}',
                exc_info=exc_val,
                duration_ms=round(duration_ms, 2),
                **self.context
            )
        else:
            self.logger.log_performance(
                self.operation,
                duration_ms,
                success=self.success,
                **self.context
            )
        
        return False  # Don't suppress exceptions


# Global logger instances
def get_logger(name: str, level: int = logging.INFO) -> StructuredLogger:
    """
    Get or create a structured logger.
    
    Args:
        name: Logger name
        level: Logging level
        
    Returns:
        StructuredLogger instance
    """
    return StructuredLogger(name, level)


# Convenience function to set request ID
def set_request_id(request_id: str):
    """Set request ID in context."""
    request_id_var.set(request_id)


# Convenience function to get request ID
def get_request_id() -> Optional[str]:
    """Get current request ID from context."""
    return request_id_var.get()

# Made with Bob

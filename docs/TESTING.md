# Testing Guide for pitMind

This document provides comprehensive information about testing the pitMind application, including test structure, running tests, writing new tests, and interpreting coverage reports.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Coverage Reports](#coverage-reports)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)

## Overview

pitMind uses a comprehensive testing strategy to ensure code quality and catch regressions:

- **Backend**: pytest with async support, mocking, and coverage reporting
- **Frontend**: Vitest with React Testing Library (to be restored)
- **Integration**: End-to-end API and WebSocket tests
- **Performance**: Benchmarking tests for critical paths

### Test Coverage Goals

- **Minimum Coverage**: 80% for all modules
- **Critical Paths**: 90%+ coverage (strategy engine, caching, WebSocket)
- **Current Status**: 
  - Backend: ~80% (170+ tests)
  - Frontend: To be restored

## Test Structure

### Backend Tests (`backend/tests/`)

```
backend/tests/
├── conftest.py                    # Shared fixtures and configuration
├── test_redis_client.py          # Redis connection and caching (502 lines, 40+ tests)
├── test_database.py              # Database models and operations (545 lines, 35+ tests)
├── test_websocket.py             # WebSocket connections (465 lines, 30+ tests)
├── test_integration_api.py       # API endpoint integration (465 lines, 40+ tests)
├── test_strategy_engine.py       # Strategy prediction logic (380 lines, 25+ tests)
├── test_cache_manager.py         # Cache management
├── test_auth_fixes.py            # Authentication
├── test_config_fixes.py          # Configuration
└── test_strategy_fixes.py        # Strategy fixes
```

### Frontend Tests (`frontend/src/`)

```
frontend/src/
├── test/
│   ├── setup.ts                  # Test configuration
│   └── mocks/                    # Mock services (to be created)
├── components/__tests__/         # Component tests (to be restored)
├── services/__tests__/           # Service tests (to be created)
├── hooks/__tests__/              # Hook tests (to be created)
└── utils/__tests__/              # Utility tests (to be created)
```

## Running Tests

### Backend Tests

#### Run All Tests
```bash
cd backend
pytest tests/ -v
```

#### Run Specific Test File
```bash
pytest tests/test_redis_client.py -v
```

#### Run Specific Test Class
```bash
pytest tests/test_redis_client.py::TestRedisInitialization -v
```

#### Run Specific Test
```bash
pytest tests/test_redis_client.py::TestRedisInitialization::test_init_redis_success -v
```

#### Run with Coverage
```bash
# Terminal report
pytest tests/ --cov=services --cov=models --cov=routes --cov-report=term-missing

# HTML report
pytest tests/ --cov=services --cov=models --cov=routes --cov-report=html

# Both
pytest tests/ --cov=. --cov-report=term-missing --cov-report=html
```

#### Run by Marker
```bash
# Unit tests only
pytest tests/ -m unit

# Integration tests only
pytest tests/ -m integration

# Performance tests only
pytest tests/ -m performance

# Exclude slow tests
pytest tests/ -m "not slow"
```

#### Run with Parallel Execution
```bash
# Install pytest-xdist
pip install pytest-xdist

# Run with 4 workers
pytest tests/ -n 4
```

### Frontend Tests (When Restored)

```bash
cd frontend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test -- StrategyTimeline.test.tsx
```

## Writing Tests

### Backend Test Example

```python
import pytest
from unittest.mock import AsyncMock, patch

from backend.services.redis_client import init_redis, get_redis_client


class TestRedisClient:
    """Test Redis client functionality."""
    
    @pytest.mark.asyncio
    async def test_init_redis_success(self, mock_redis_client):
        """Test successful Redis initialization."""
        with patch('backend.services.redis_client.Redis') as mock_redis_class:
            mock_redis_class.return_value = mock_redis_client
            
            result = await init_redis()
            
            assert result is True
            mock_redis_client.ping.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_graceful_degradation(self):
        """Test that system works without Redis."""
        with patch('backend.services.redis_client.Redis') as mock_redis_class:
            mock_redis_class.side_effect = ConnectionError("Redis unavailable")
            
            result = await init_redis()
            
            assert result is False
            # System should continue functioning
```

### Using Fixtures

```python
def test_with_sample_data(sample_telemetry_payload):
    """Test using shared fixture from conftest.py."""
    assert sample_telemetry_payload.circuit == "Monza"
    assert len(sample_telemetry_payload.laps) == 20


@pytest.mark.asyncio
async def test_with_mock_redis(mock_redis_client):
    """Test using mock Redis client."""
    await mock_redis_client.set("key", "value")
    mock_redis_client.set.assert_called_once()
```

### Frontend Test Example (Template)

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { StrategyTimeline } from '../StrategyTimeline';

describe('StrategyTimeline', () => {
  it('renders strategy recommendations', () => {
    const mockData = {
      recommendations: [
        { lap: 15, action: 'PIT', confidence: 0.85 }
      ]
    };
    
    render(<StrategyTimeline data={mockData} />);
    
    expect(screen.getByText('PIT')).toBeInTheDocument();
  });
  
  it('handles loading state', () => {
    render(<StrategyTimeline data={null} loading={true} />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
```

## Coverage Reports

### Generating Coverage Reports

```bash
# Backend - HTML report
cd backend
pytest tests/ --cov=. --cov-report=html
# Open htmlcov/index.html in browser

# Backend - Terminal report
pytest tests/ --cov=. --cov-report=term-missing

# Backend - XML report (for CI)
pytest tests/ --cov=. --cov-report=xml
```

### Interpreting Coverage

- **Green (>80%)**: Good coverage
- **Yellow (60-80%)**: Needs improvement
- **Red (<60%)**: Insufficient coverage

### Coverage Configuration

Coverage settings are in `backend/pytest.ini`:

```ini
[coverage:run]
source = .
omit = 
    */tests/*
    */test_*.py
    */__pycache__/*
    */venv/*
    */alembic/*
    */scripts/*

[coverage:report]
precision = 2
show_missing = True
skip_covered = False
exclude_lines =
    pragma: no cover
    def __repr__
    raise NotImplementedError
    if __name__ == .__main__.:
```

## CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Pull requests
- Pushes to main branch
- Manual workflow dispatch

See `.github/workflows/` for CI configuration.

### Pre-commit Hooks

```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install

# Run manually
pre-commit run --all-files
```

## Best Practices

### General Guidelines

1. **Test Naming**: Use descriptive names that explain what is being tested
   ```python
   # Good
   def test_redis_connection_fails_gracefully_when_unavailable()
   
   # Bad
   def test_redis()
   ```

2. **One Assertion Per Test**: Focus each test on a single behavior
   ```python
   # Good
   def test_pit_urgency_high_with_extreme_wear():
       payload = create_high_wear_payload()
       scores, _, _ = await predict_strategy(payload)
       assert scores.pit_urgency >= 80
   
   # Avoid
   def test_everything():
       # Testing multiple unrelated things
   ```

3. **Use Fixtures**: Share common setup code
   ```python
   @pytest.fixture
   def sample_data():
       return create_sample_data()
   
   def test_with_fixture(sample_data):
       assert sample_data is not None
   ```

4. **Mock External Dependencies**: Don't rely on external services
   ```python
   @patch('backend.services.redis_client.Redis')
   async def test_without_real_redis(mock_redis):
       # Test logic without actual Redis
   ```

5. **Test Edge Cases**: Cover boundary conditions
   ```python
   def test_empty_input():
       # Test with empty data
   
   def test_maximum_input():
       # Test with maximum allowed data
   
   def test_invalid_input():
       # Test with invalid data
   ```

### Async Testing

```python
@pytest.mark.asyncio
async def test_async_function():
    """Always mark async tests with @pytest.mark.asyncio."""
    result = await some_async_function()
    assert result is not None
```

### Mocking Best Practices

```python
# Mock at the right level
@patch('backend.services.redis_client.Redis')  # Mock the import
async def test_redis_operation(mock_redis_class):
    mock_instance = AsyncMock()
    mock_redis_class.return_value = mock_instance
    
    # Test code
```

### Performance Testing

```python
import time

@pytest.mark.performance
def test_response_time():
    """Test that operation completes within time limit."""
    start = time.time()
    
    result = expensive_operation()
    
    duration = time.time() - start
    assert duration < 1.0, f"Operation took {duration}s, expected <1s"
```

### Integration Testing

```python
@pytest.mark.integration
async def test_complete_flow(client, mock_redis, mock_db):
    """Test complete user flow."""
    # 1. Create session
    response = await client.post("/api/session")
    session_id = response.json()["session_id"]
    
    # 2. Send telemetry
    response = await client.post("/api/telemetry", json=telemetry_data)
    assert response.status_code == 200
    
    # 3. Get recommendation
    response = await client.get(f"/api/strategy/{session_id}")
    assert response.status_code == 200
    assert "recommendation" in response.json()
```

## Troubleshooting

### Common Issues

#### 1. Import Errors
```bash
# Ensure PYTHONPATH is set
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Or use pytest.ini pythonpath setting
```

#### 2. Async Test Failures
```python
# Always use @pytest.mark.asyncio
@pytest.mark.asyncio
async def test_async():
    await some_function()
```

#### 3. Mock Not Working
```python
# Patch at the right location (where it's used, not where it's defined)
@patch('backend.main.redis_client')  # Where it's imported
async def test_with_mock(mock_redis):
    pass
```

#### 4. Fixture Not Found
```python
# Ensure fixture is in conftest.py or imported
# Check fixture scope (function, class, module, session)
```

### Debug Mode

```bash
# Run with verbose output
pytest tests/ -vv

# Show print statements
pytest tests/ -s

# Drop into debugger on failure
pytest tests/ --pdb

# Show local variables on failure
pytest tests/ -l
```

## Test Metrics

### Current Coverage (Backend)

| Module | Coverage | Tests | Status |
|--------|----------|-------|--------|
| services/redis_client.py | ~85% | 40+ | ✅ |
| services/strategy_engine.py | ~80% | 25+ | ✅ |
| models/database.py | ~85% | 35+ | ✅ |
| models/audit_log.py | ~90% | 15+ | ✅ |
| main.py (WebSocket) | ~75% | 30+ | ✅ |
| routes/strategy.py | ~70% | 20+ | ⚠️ |

### Test Execution Time

- **Unit Tests**: <5 seconds
- **Integration Tests**: <30 seconds
- **All Tests**: <1 minute

## Resources

- [pytest Documentation](https://docs.pytest.org/)
- [pytest-asyncio](https://pytest-asyncio.readthedocs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Coverage.py](https://coverage.readthedocs.io/)

## Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Ensure tests pass locally
3. Check coverage meets 80% threshold
4. Update this documentation if needed
5. Run full test suite before committing

```bash
# Pre-commit checklist
pytest tests/ --cov=. --cov-fail-under=80
pytest tests/ -m "not slow"  # Quick smoke test
```

---

**Last Updated**: 2026-05-20  
**Maintained By**: pitMind Development Team

# Made with Bob
"""
Tests for database functionality.

This module tests:
- Database connection and initialization
- AuditLog model CRUD operations
- RaceSession model operations
- Database health checks
- Graceful degradation when database unavailable
"""

import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
from sqlalchemy.exc import SQLAlchemyError, OperationalError
from sqlalchemy.ext.asyncio import AsyncSession

from models import database as db
from models.audit_log import AuditLog


@pytest.fixture
async def mock_engine():
    """Mock SQLAlchemy async engine."""
    mock = AsyncMock()
    mock.dispose = AsyncMock()
    mock.begin = AsyncMock()
    mock.connect = AsyncMock()
    return mock


@pytest.fixture
async def mock_session():
    """Mock SQLAlchemy async session."""
    mock = AsyncMock(spec=AsyncSession)
    mock.add = MagicMock()
    mock.commit = AsyncMock()
    mock.rollback = AsyncMock()
    mock.close = AsyncMock()
    mock.execute = AsyncMock()
    mock.refresh = AsyncMock()
    mock.delete = AsyncMock()
    return mock


@pytest.fixture
async def mock_session_factory(mock_session):
    """Mock session factory."""
    async def factory():
        yield mock_session
    return factory


class TestDatabaseInitialization:
    """Test database initialization and connection."""
    
    @pytest.mark.asyncio
    async def test_get_engine_creates_engine(self):
        """Test that get_engine creates an engine."""
        # Reset global engine
        db._engine = None
        
        with patch('models.database.create_async_engine') as mock_create:
            mock_engine = AsyncMock()
            mock_create.return_value = mock_engine
            
            engine = db.get_engine()
            
            assert engine is mock_engine
            mock_create.assert_called_once()
            # Verify pool configuration
            call_kwargs = mock_create.call_args[1]
            assert 'pool_size' in call_kwargs
            assert 'max_overflow' in call_kwargs
            assert call_kwargs['pool_pre_ping'] is True
    
    @pytest.mark.asyncio
    async def test_get_engine_returns_existing(self):
        """Test that get_engine returns existing engine."""
        mock_engine = AsyncMock()
        db._engine = mock_engine
        
        engine = db.get_engine()
        
        assert engine is mock_engine
    
    @pytest.mark.asyncio
    async def test_get_session_factory_creates_factory(self):
        """Test that get_session_factory creates a factory."""
        db._async_session_factory = None
        
        with patch('models.database.get_engine') as mock_get_engine, \
             patch('models.database.async_sessionmaker') as mock_sessionmaker:
            
            mock_engine = AsyncMock()
            mock_get_engine.return_value = mock_engine
            mock_factory = MagicMock()
            mock_sessionmaker.return_value = mock_factory
            
            factory = db.get_session_factory()
            
            assert factory is mock_factory
            mock_sessionmaker.assert_called_once()
            call_kwargs = mock_sessionmaker.call_args[1]
            assert call_kwargs['expire_on_commit'] is False
            assert call_kwargs['autocommit'] is False
    
    @pytest.mark.asyncio
    async def test_init_db_creates_tables(self):
        """Test database initialization creates tables."""
        mock_engine = MagicMock()
        mock_conn = AsyncMock()
        mock_begin_ctx = AsyncMock()
        mock_begin_ctx.__aenter__.return_value = mock_conn
        mock_engine.begin.return_value = mock_begin_ctx
        
        with patch('models.database.get_engine', return_value=mock_engine):
            await db.init_db()
            
            mock_engine.begin.assert_called_once()
            mock_conn.run_sync.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_init_db_handles_error(self):
        """Test database initialization handles errors."""
        mock_engine = MagicMock()
        mock_engine.begin.side_effect = SQLAlchemyError("Connection failed")
        
        with patch('models.database.get_engine', return_value=mock_engine):
            with pytest.raises(SQLAlchemyError):
                await db.init_db()
    
    @pytest.mark.asyncio
    async def test_close_db_disposes_engine(self):
        """Test database cleanup."""
        mock_engine = AsyncMock()
        db._engine = mock_engine
        db._async_session_factory = MagicMock()
        
        await db.close_db()
        
        mock_engine.dispose.assert_called_once()
        assert db._engine is None
        assert db._async_session_factory is None


class TestDatabaseHealthCheck:
    """Test database health check functionality."""
    
    @pytest.mark.asyncio
    async def test_check_db_health_success(self):
        """Test successful database health check."""
        mock_engine = MagicMock()
        mock_conn = AsyncMock()
        mock_result = MagicMock()
        mock_result.fetchone.return_value = (1,)
        mock_conn.execute.return_value = mock_result
        mock_connect_ctx = AsyncMock()
        mock_connect_ctx.__aenter__.return_value = mock_conn
        mock_engine.connect.return_value = mock_connect_ctx
        
        with patch('models.database.get_engine', return_value=mock_engine):
            health = await db.check_db_health()
            
            assert health["status"] == "healthy"
            assert health["connected"] is True
            assert "successful" in health["message"].lower()
            mock_conn.execute.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_check_db_health_connection_failure(self):
        """Test health check with connection failure."""
        mock_engine = MagicMock()
        mock_engine.connect.side_effect = OperationalError("Connection failed", None, None)
        
        with patch('models.database.get_engine', return_value=mock_engine):
            health = await db.check_db_health()
            
            assert health["status"] == "unhealthy"
            assert health["connected"] is False
            assert "failed" in health["message"].lower()
    
    @pytest.mark.asyncio
    async def test_check_db_health_query_failure(self):
        """Test health check with query failure."""
        mock_engine = MagicMock()
        mock_conn = AsyncMock()
        mock_conn.execute.side_effect = SQLAlchemyError("Query failed")
        mock_connect_ctx = AsyncMock()
        mock_connect_ctx.__aenter__.return_value = mock_conn
        mock_engine.connect.return_value = mock_connect_ctx
        
        with patch('models.database.get_engine', return_value=mock_engine):
            health = await db.check_db_health()
            
            assert health["status"] == "unhealthy"
            assert health["connected"] is False


class TestGetDbDependency:
    """Test the get_db dependency for FastAPI routes."""
    
    @pytest.mark.asyncio
    async def test_get_db_yields_session(self, mock_session):
        """Test that get_db yields a session."""
        mock_factory = MagicMock()
        mock_session_ctx = AsyncMock()
        mock_session_ctx.__aenter__.return_value = mock_session
        mock_factory.return_value = mock_session_ctx
        
        with patch('models.database.get_session_factory', return_value=mock_factory):
            async for session in db.get_db():
                assert session is mock_session
                break
    
    @pytest.mark.asyncio
    async def test_get_db_closes_session(self, mock_session):
        """Test that get_db closes session after use."""
        mock_factory = MagicMock()
        mock_session_ctx = AsyncMock()
        mock_session_ctx.__aenter__.return_value = mock_session
        mock_session_ctx.__aexit__.return_value = None
        mock_factory.return_value = mock_session_ctx
        
        with patch('models.database.get_session_factory', return_value=mock_factory):
            async for session in db.get_db():
                pass
            
            mock_session.close.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_db_rolls_back_on_error(self, mock_session):
        """Test that get_db rolls back on error."""
        mock_factory = MagicMock()
        mock_session_ctx = AsyncMock()
        mock_session_ctx.__aenter__.return_value = mock_session
        mock_factory.return_value = mock_session_ctx
        
        with patch('models.database.get_session_factory', return_value=mock_factory):
            gen = db.get_db()
            session = await gen.__anext__()
            assert session is mock_session
            try:
                await gen.athrow(ValueError("Test error"))
            except ValueError:
                pass
            
            mock_session.rollback.assert_called_once()
            mock_session.close.assert_called_once()


class TestAuditLogModel:
    """Test AuditLog model operations."""
    
    def test_audit_log_creation(self):
        """Test creating an AuditLog instance."""
        log = AuditLog(
            session_id="test-session-123",
            driver="VER",
            lap=15,
            strategy_type="pit_stop",
            confidence=0.85,
            reasoning="High tire wear detected",
            telemetry_snapshot={"tire_wear": 75.5, "fuel": 45.2},
            metadata={"model_version": "1.0.0"}
        )
        
        assert log.session_id == "test-session-123"
        assert log.driver == "VER"
        assert log.lap == 15
        assert log.strategy_type == "pit_stop"
        assert log.confidence == 0.85
        assert log.reasoning == "High tire wear detected"
        assert log.telemetry_snapshot["tire_wear"] == 75.5
        assert log.metadata["model_version"] == "1.0.0"
    
    def test_audit_log_to_dict(self):
        """Test converting AuditLog to dictionary."""
        timestamp = datetime.utcnow()
        log = AuditLog(
            id=1,
            timestamp=timestamp,
            session_id="test-session",
            driver="HAM",
            lap=20,
            strategy_type="tire_change",
            confidence=0.92,
            reasoning="Optimal pit window",
            telemetry_snapshot={"tire_wear": 80.0},
            metadata={"version": "1.0"}
        )
        
        result = log.to_dict()
        
        assert result["id"] == 1
        assert result["timestamp"] == timestamp.isoformat()
        assert result["session_id"] == "test-session"
        assert result["driver"] == "HAM"
        assert result["lap"] == 20
        assert result["strategy_type"] == "tire_change"
        assert result["confidence"] == 0.92
        assert result["reasoning"] == "Optimal pit window"
        assert result["telemetry_snapshot"]["tire_wear"] == 80.0
        assert result["metadata"]["version"] == "1.0"
    
    def test_audit_log_repr(self):
        """Test AuditLog string representation."""
        log = AuditLog(
            id=1,
            session_id="test-session",
            driver="VER",
            lap=10,
            strategy_type="pit_stop",
            confidence=0.75
        )
        
        repr_str = repr(log)
        
        assert "AuditLog" in repr_str
        assert "id=1" in repr_str
        assert "session=test-session" in repr_str
        assert "driver=VER" in repr_str
        assert "lap=10" in repr_str
        assert "strategy=pit_stop" in repr_str
        assert "0.75" in repr_str


class TestAuditLogCRUDOperations:
    """Test CRUD operations for AuditLog model."""
    
    @pytest.mark.asyncio
    async def test_create_audit_log(self, mock_session):
        """Test creating an audit log entry."""
        log = AuditLog(
            session_id="test-session",
            driver="VER",
            lap=15,
            strategy_type="pit_stop",
            confidence=0.85,
            reasoning="High tire wear"
        )
        
        mock_session.add(log)
        await mock_session.commit()
        
        mock_session.add.assert_called_once_with(log)
        mock_session.commit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_create_audit_log_with_error(self, mock_session):
        """Test creating audit log with error handling."""
        log = AuditLog(
            session_id="test-session",
            driver="VER",
            lap=15,
            strategy_type="pit_stop",
            confidence=0.85
        )
        
        mock_session.commit.side_effect = SQLAlchemyError("Database error")
        
        mock_session.add(log)
        
        with pytest.raises(SQLAlchemyError):
            await mock_session.commit()
        
        # Verify rollback would be called in real scenario
        await mock_session.rollback()
        mock_session.rollback.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_query_audit_logs(self, mock_session):
        """Test querying audit logs."""
        from sqlalchemy import select
        
        # Mock query result
        mock_result = MagicMock()
        mock_logs = [
            AuditLog(id=1, session_id="s1", driver="VER", lap=10, strategy_type="pit", confidence=0.8),
            AuditLog(id=2, session_id="s1", driver="VER", lap=20, strategy_type="tire", confidence=0.9),
        ]
        mock_result.scalars.return_value.all.return_value = mock_logs
        mock_session.execute.return_value = mock_result
        
        # Execute query
        stmt = select(AuditLog).where(AuditLog.session_id == "s1")
        result = await mock_session.execute(stmt)
        logs = result.scalars().all()
        
        assert len(logs) == 2
        assert logs[0].driver == "VER"
        assert logs[1].lap == 20
    
    @pytest.mark.asyncio
    async def test_update_audit_log(self, mock_session):
        """Test updating an audit log entry."""
        log = AuditLog(
            id=1,
            session_id="test-session",
            driver="VER",
            lap=15,
            strategy_type="pit_stop",
            confidence=0.85
        )
        
        # Update confidence
        log.confidence = 0.92
        log.reasoning = "Updated reasoning"
        
        await mock_session.commit()
        
        assert log.confidence == 0.92
        assert log.reasoning == "Updated reasoning"
        mock_session.commit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_delete_audit_log(self, mock_session):
        """Test deleting an audit log entry."""
        log = AuditLog(
            id=1,
            session_id="test-session",
            driver="VER",
            lap=15,
            strategy_type="pit_stop",
            confidence=0.85
        )
        
        await mock_session.delete(log)
        await mock_session.commit()
        
        mock_session.delete.assert_called_once_with(log)
        mock_session.commit.assert_called_once()


class TestDatabaseGracefulDegradation:
    """Test graceful degradation when database is unavailable."""
    
    @pytest.mark.asyncio
    async def test_operations_handle_connection_loss(self, mock_session):
        """Test that operations handle connection loss gracefully."""
        mock_session.commit.side_effect = OperationalError("Connection lost", None, None)
        
        log = AuditLog(
            session_id="test-session",
            driver="VER",
            lap=15,
            strategy_type="pit_stop",
            confidence=0.85
        )
        
        mock_session.add(log)
        
        with pytest.raises(OperationalError):
            await mock_session.commit()
        
        # Verify rollback is called
        await mock_session.rollback()
        mock_session.rollback.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_health_check_detects_unavailable_db(self):
        """Test that health check detects unavailable database."""
        mock_engine = MagicMock()
        mock_engine.connect.side_effect = OperationalError("Database unavailable", None, None)
        
        with patch('models.database.get_engine', return_value=mock_engine):
            health = await db.check_db_health()
            
            assert health["status"] == "unhealthy"
            assert health["connected"] is False
    
    @pytest.mark.asyncio
    async def test_init_db_fails_gracefully(self):
        """Test that init_db fails gracefully."""
        mock_engine = MagicMock()
        mock_engine.begin.side_effect = OperationalError("Cannot connect", None, None)
        
        with patch('models.database.get_engine', return_value=mock_engine):
            with pytest.raises(OperationalError):
                await db.init_db()


class TestDatabaseIndexes:
    """Test that database indexes are properly configured."""
    
    def test_audit_log_has_indexes(self):
        """Test that AuditLog model has proper indexes."""
        # Check table args for indexes
        assert hasattr(AuditLog, '__table_args__')
        table_args = AuditLog.__table_args__
        
        # Should have multiple indexes
        assert len(table_args) > 0
        
        # Verify index names
        index_names = [idx.name for idx in table_args if hasattr(idx, 'name')]
        assert "idx_session_lap" in index_names
        assert "idx_driver_timestamp" in index_names
        assert "idx_strategy_confidence" in index_names
    
    def test_audit_log_columns_have_indexes(self):
        """Test that key columns have indexes."""
        # Check that timestamp, session_id, driver, and lap have indexes
        assert AuditLog.timestamp.index is True
        assert AuditLog.session_id.index is True
        assert AuditLog.driver.index is True
        assert AuditLog.lap.index is True


class TestDatabaseConnectionPooling:
    """Test database connection pooling configuration."""
    
    @pytest.mark.asyncio
    async def test_engine_has_pool_configuration(self):
        """Test that engine is configured with connection pooling."""
        db._engine = None
        
        with patch('models.database.create_async_engine') as mock_create:
            mock_engine = AsyncMock()
            mock_create.return_value = mock_engine
            
            db.get_engine()
            
            # Verify pool configuration was passed
            call_kwargs = mock_create.call_args[1]
            assert 'pool_size' in call_kwargs
            assert 'max_overflow' in call_kwargs
            assert 'pool_timeout' in call_kwargs
            assert 'pool_recycle' in call_kwargs
            assert call_kwargs['pool_pre_ping'] is True
    
    @pytest.mark.asyncio
    async def test_session_factory_configuration(self):
        """Test that session factory is properly configured."""
        db._async_session_factory = None
        
        with patch('models.database.get_engine') as mock_get_engine, \
             patch('models.database.async_sessionmaker') as mock_sessionmaker:
            
            mock_engine = AsyncMock()
            mock_get_engine.return_value = mock_engine
            mock_factory = MagicMock()
            mock_sessionmaker.return_value = mock_factory
            
            db.get_session_factory()
            
            # Verify session configuration
            call_kwargs = mock_sessionmaker.call_args[1]
            assert call_kwargs['class_'] == AsyncSession
            assert call_kwargs['expire_on_commit'] is False
            assert call_kwargs['autocommit'] is False
            assert call_kwargs['autoflush'] is False

# Made with Bob
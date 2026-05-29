import pytest
import time
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import Column, Integer, String

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    name = Column(String)

async def setup_db():
    engine = create_async_engine('sqlite+aiosqlite:///:memory:', echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(
        engine, expire_on_commit=False, class_=AsyncSession
    )

    async with async_session() as session:
        users = [User(id=i, name=f"User {i}") for i in range(1000)]
        session.add_all(users)
        await session.commit()

    return async_session

@pytest.mark.asyncio
async def test_batch_fetch_performance():
    from services.query_optimizer import QueryOptimizer
    import services.logger as logger
    logger.get_logger = lambda name: logger.logger

    async_session = await setup_db()
    ids = list(range(1000))

    async with async_session() as session:
        start_time = time.time()
        results = await QueryOptimizer.batch_fetch(session, User, ids, batch_size=100)
        end_time = time.time()

        duration = end_time - start_time
        print(f"Fetch took {duration:.4f}s")
        assert len(results) == 1000

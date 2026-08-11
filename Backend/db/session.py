"""
We See You - Database Session & Connection Pool Manager
Provides high-performance asynchronous PostgreSQL connections via AsyncPG & SQLAlchemy 2.0.
"""

import os
import logging
from typing import AsyncGenerator, Optional
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

load_dotenv()

logger = logging.getLogger(__name__)

# Retrieve database connection string from environment
DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL")

# Normalize connection protocol for asyncpg
if DATABASE_URL:
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
    elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+asyncpg://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# Asynchronous engine configuration (cost-optimized connection pooling)
engine: Optional[AsyncEngine] = None
AsyncSessionLocal: Optional[async_sessionmaker[AsyncSession]] = None

if DATABASE_URL:
    try:
        engine = create_async_engine(
            DATABASE_URL,
            echo=os.getenv("SQL_ECHO", "false").lower() == "true",
            pool_size=10,
            max_overflow=20,
            pool_recycle=1800,
            pool_pre_ping=True,
        )
        AsyncSessionLocal = async_sessionmaker(
            bind=engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
        )
        logger.info("Asynchronous database engine initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize database engine: {e}")
        engine = None
        AsyncSessionLocal = None
else:
    logger.info("DATABASE_URL not detected. Running in offline/file-cache mode.")


def is_database_configured() -> bool:
    """Returns True if the async database engine is configured and active."""
    return engine is not None and AsyncSessionLocal is not None


async def get_db() -> AsyncGenerator[Optional[AsyncSession], None]:
    """
    FastAPI dependency injection provider for asynchronous database sessions.
    Yields an AsyncSession when database is configured, or None in offline mode.
    """
    if not is_database_configured() or AsyncSessionLocal is None:
        yield None
        return

    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

"""
We See You - Ingestion Log SQLAlchemy Model
Tracks scheduled background ETL executions, metrics, and errors.
"""

import uuid
from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from db.base import Base


class IngestionLog(Base):
    __tablename__ = "ingestion_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_api = Column(String(100), nullable=False) # e.g. "FEC", "Congress.gov", "Wikipedia"
    job_type = Column(String(100), nullable=False)   # e.g. "weekly_filings_sync"
    records_synced = Column(Integer, nullable=False, default=0)
    records_skipped = Column(Integer, nullable=False, default=0)
    status = Column(String(50), nullable=False, default="RUNNING") # "SUCCESS", "FAILED", "RUNNING"
    error_message = Column(Text, nullable=True)

    started_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

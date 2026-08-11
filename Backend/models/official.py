"""
We See You - Official Profile SQLAlchemy Model
Represents public officials across Federal, State, and Municipal jurisdictions using a Hybrid Relational + JSONB schema.
"""

from datetime import datetime
from typing import Any, Dict, List
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Index,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from db.base import Base


class OfficialProfile(Base):
    __tablename__ = "official_profiles"

    # Composite Primary Key (Required for PostgreSQL Declarative Partitioning by jurisdiction_branch)
    id = Column(String(64), primary_key=True, nullable=False)
    jurisdiction_branch = Column(String(50), primary_key=True, nullable=False)

    # Cross-Reference Identifiers
    bioguide_id = Column(String(32), index=True, nullable=True)
    fec_candidate_id = Column(String(32), nullable=True)

    # Core Relational Attributes
    first_name = Column(String(100), nullable=False)
    middle_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=False)
    full_name = Column(String(255), nullable=False, index=True)

    current_title = Column(String(150), nullable=False)
    current_chamber = Column(String(50), nullable=True, index=True)
    party = Column(String(50), nullable=True)
    state = Column(String(2), nullable=False, index=True)
    county_name = Column(String(100), nullable=True)
    county_fips = Column(String(5), nullable=True, index=True)
    city_name = Column(String(100), nullable=True)
    district = Column(String(50), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)

    # Checksum for Idempotent Lambda Ingestion (Skips unchanged writes)
    record_hash = Column(String(32), nullable=True)

    # Deep Extensible JSONB Documents
    political_history = Column(JSONB, nullable=False, default=list)
    financial_history = Column(JSONB, nullable=False, default=dict)
    legislative_or_judicial_history = Column(JSONB, nullable=False, default=dict)
    personal_profile = Column(JSONB, nullable=False, default=dict)
    controversies_and_news = Column(JSONB, nullable=False, default=list)
    external_identifiers = Column(JSONB, nullable=False, default=dict)

    # Audit Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    __table_args__ = (
        Index("idx_profiles_state_party", "state", "party"),
        Index("idx_profiles_local_lookup", "state", "county_name", "city_name"),
        {"postgresql_partition_by": "LIST (jurisdiction_branch)"},
    )

    def to_dict(self) -> Dict[str, Any]:
        """Serializes model instance into a JSON-compatible dictionary."""
        return {
            "id": self.id,
            "jurisdiction_branch": self.jurisdiction_branch,
            "bioguide_id": self.bioguide_id,
            "fec_candidate_id": self.fec_candidate_id,
            "first_name": self.first_name,
            "middle_name": self.middle_name,
            "last_name": self.last_name,
            "full_name": self.full_name,
            "current_title": self.current_title,
            "current_chamber": self.current_chamber,
            "party": self.party,
            "state": self.state,
            "county_name": self.county_name,
            "county_fips": self.county_fips,
            "city_name": self.city_name,
            "district": self.district,
            "is_active": self.is_active,
            "political_history": self.political_history,
            "financial_history": self.financial_history,
            "legislative_or_judicial_history": self.legislative_or_judicial_history,
            "personal_profile": self.personal_profile,
            "controversies_and_news": self.controversies_and_news,
            "external_identifiers": self.external_identifiers,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

"""
Unit tests for Database Models, Repository Layer, and Seeding Utilities
"""

import pytest
from models.official import OfficialProfile
from models.ingestion import IngestionLog
from scripts.seed_database import compute_record_hash
from services.official_repository import get_official_by_id, list_officials
from db.session import is_database_configured


def test_official_profile_model_instantiation():
    profile = OfficialProfile(
        id="T000001",
        jurisdiction_branch="federal_legislative",
        first_name="Test",
        last_name="Senator",
        full_name="Test Senator",
        current_title="U.S. Senator",
        current_chamber="Senate",
        party="Democrat",
        state="TN",
        is_active=True,
        financial_history={"total_raised": 500000},
    )

    data = profile.to_dict()
    assert data["id"] == "T000001"
    assert data["jurisdiction_branch"] == "federal_legislative"
    assert data["full_name"] == "Test Senator"
    assert data["financial_history"]["total_raised"] == 500000


def test_ingestion_log_model_instantiation():
    log = IngestionLog(
        source_api="FEC",
        job_type="weekly_filings_sync",
        records_synced=535,
        status="SUCCESS",
    )
    assert log.source_api == "FEC"
    assert log.records_synced == 535
    assert log.status == "SUCCESS"


def test_compute_record_hash_consistency():
    data_1 = {"id": "S000033", "full_name": "Bernie Sanders", "state": "VT"}
    data_2 = {"state": "VT", "full_name": "Bernie Sanders", "id": "S000033"}
    data_3 = {"id": "S000033", "full_name": "Bernie Sanders", "state": "TN"}

    # Hash should be key-order agnostic
    assert compute_record_hash(data_1) == compute_record_hash(data_2)
    # Hash should change when data changes
    assert compute_record_hash(data_1) != compute_record_hash(data_3)


def test_official_repository_fallback():
    import asyncio
    
    async def _test():
        # In offline test environment without DATABASE_URL, repository falls back gracefully
        assert not is_database_configured()

        officials = await list_officials(state="TN")
        assert isinstance(officials, list)

        official = await get_official_by_id("non_existent_id")
        assert official is None

    asyncio.run(_test())

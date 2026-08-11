"""
We See You - Database Seed & Ingestion Script
Populates the RDS PostgreSQL database with all current Members of Congress,
Executive Branch Cabinet officers, Federal Judges, and verified Campaign Finance datasets.
"""

import asyncio
import hashlib
import json
import logging
import os
import sys
from typing import Any, Dict, List

# Add Backend root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy.dialects.postgresql import insert
from db.session import AsyncSessionLocal, is_database_configured
from models.official import OfficialProfile
from models.ingestion import IngestionLog
from services.legislator_service import load_congress_data, _politicians_cache
from services.finance_service import _finance_cache as finance_cache, _init_cache_from_disk
from services.judicial_service import load_judicial_data, _judges_cache

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("db_seeder")


def compute_record_hash(data: Dict[str, Any]) -> str:
    """Computes a deterministic MD5 hash for idempotent change detection."""
    serialized = json.dumps(data, sort_keys=True, default=str)
    return hashlib.md5(serialized.encode("utf-8")).hexdigest()


async def seed_database() -> None:
    logger.info("Starting database seeding process...")

    if not is_database_configured() or AsyncSessionLocal is None:
        logger.error("DATABASE_URL not set or database engine failed to initialize. Cannot seed.")
        return

    # 1. Load in-memory datasets
    logger.info("Loading Congressional, Executive, Judicial, and Campaign Finance datasets...")
    load_congress_data()
    _init_cache_from_disk()
    load_judicial_data()

    profiles_to_upsert: List[Dict[str, Any]] = []

    # 2. Map Federal Legislators & Executive Cabinet Members
    for pol in _politicians_cache:
        # Determine jurisdiction branch
        if pol.chamber.value == "Executive":
            jurisdiction = "federal_executive"
            chamber_val = "Cabinet"
        else:
            jurisdiction = "federal_legislative"
            chamber_val = pol.chamber.value

        # Fetch financial history for this official
        raw_fin = finance_cache.get(pol.id, {})
        fin_data = {
            cycle: (summary.model_dump() if hasattr(summary, "model_dump") else summary)
            for cycle, summary in raw_fin.items()
        }

        profile_data = {
            "id": pol.id,
            "jurisdiction_branch": jurisdiction,
            "bioguide_id": pol.id if not pol.id.startswith("EXEC-") else None,
            "fec_candidate_id": pol.fec_ids[0] if pol.fec_ids else None,
            "first_name": pol.first_name,
            "middle_name": None,
            "last_name": pol.last_name,
            "full_name": f"{pol.first_name} {pol.last_name}",
            "current_title": pol.title,
            "current_chamber": chamber_val,
            "party": pol.party.value if hasattr(pol.party, "value") else str(pol.party),
            "state": pol.state,
            "county_name": None,
            "county_fips": None,
            "city_name": None,
            "district": pol.district if hasattr(pol, "district") else None,
            "is_active": True,
            "political_history": [term.model_dump() for term in pol.terms_history] if pol.terms_history else [],
            "financial_history": fin_data,
            "legislative_or_judicial_history": {},
            "personal_profile": {
                "website_url": pol.website_url,
                "profile_image_url": pol.profile_image_url,
                "wikipedia_id": pol.wikipedia_id,
                "next_election": pol.next_election,
                "stances": pol.stances,
                "affiliations": pol.affiliations,
            },
            "controversies_and_news": pol.controversies,
            "external_identifiers": {
                "bioguide": pol.id if not pol.id.startswith("EXEC-") else None,
                "fec_ids": pol.fec_ids,
                "wikipedia": pol.wikipedia_id,
            },
        }

        profile_data["record_hash"] = compute_record_hash(profile_data)
        profiles_to_upsert.append(profile_data)

    # 3. Map Federal Judges
    for judge in _judges_cache:
        judge_data = {
            "id": judge.id,
            "jurisdiction_branch": "federal_judicial",
            "bioguide_id": None,
            "fec_candidate_id": None,
            "first_name": judge.first_name,
            "middle_name": None,
            "last_name": judge.last_name,
            "full_name": f"{judge.first_name} {judge.last_name}",
            "current_title": judge.title,
            "current_chamber": judge.court,
            "party": judge.party if hasattr(judge, "party") else "Nonpartisan",
            "state": judge.state if hasattr(judge, "state") else "US",
            "county_name": None,
            "county_fips": None,
            "city_name": None,
            "district": None,
            "is_active": True,
            "political_history": [],
            "financial_history": {},
            "legislative_or_judicial_history": {
                "court": judge.court,
                "appointing_president": getattr(judge, "appointing_president", None),
                "confirmation_year": getattr(judge, "confirmation_year", None),
                "key_rulings": getattr(judge, "key_rulings", []),
            },
            "personal_profile": {
                "profile_image_url": getattr(judge, "profile_image_url", None),
                "wikipedia_id": getattr(judge, "wikipedia_id", None),
            },
            "controversies_and_news": getattr(judge, "controversies", []),
            "external_identifiers": {
                "wikipedia": getattr(judge, "wikipedia_id", None),
            },
        }
        judge_data["record_hash"] = compute_record_hash(judge_data)
        profiles_to_upsert.append(judge_data)

    logger.info(f"Total compiled official profiles to seed: {len(profiles_to_upsert)}")

    # 4. Bulk Upsert into PostgreSQL
    async with AsyncSessionLocal() as session:
        try:
            synced_count = 0
            for profile in profiles_to_upsert:
                stmt = insert(OfficialProfile).values(**profile)
                upsert_stmt = stmt.on_conflict_do_update(
                    index_elements=["id", "jurisdiction_branch"],
                    set_={
                        "full_name": stmt.excluded.full_name,
                        "current_title": stmt.excluded.current_title,
                        "current_chamber": stmt.excluded.current_chamber,
                        "party": stmt.excluded.party,
                        "state": stmt.excluded.state,
                        "political_history": stmt.excluded.political_history,
                        "financial_history": stmt.excluded.financial_history,
                        "legislative_or_judicial_history": stmt.excluded.legislative_or_judicial_history,
                        "personal_profile": stmt.excluded.personal_profile,
                        "controversies_and_news": stmt.excluded.controversies_and_news,
                        "external_identifiers": stmt.excluded.external_identifiers,
                        "record_hash": stmt.excluded.record_hash,
                        "updated_at": stmt.excluded.updated_at,
                    },
                    where=(OfficialProfile.record_hash != stmt.excluded.record_hash)
                )
                await session.execute(upsert_stmt)
                synced_count += 1

            # Record Ingestion Log
            log_entry = IngestionLog(
                source_api="Congress.gov / FEC / Wikipedia",
                job_type="initial_database_seed",
                records_synced=synced_count,
                records_skipped=0,
                status="SUCCESS",
            )
            session.add(log_entry)
            await session.commit()
            logger.info(f"Successfully seeded {synced_count} officials into PostgreSQL.")

        except Exception as e:
            await session.rollback()
            logger.error(f"Error during database seeding: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(seed_database())

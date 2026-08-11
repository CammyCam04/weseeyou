"""
We See You - Official Profiles Repository Layer
Provides unified async PostgreSQL database queries with graceful fallback to in-memory/file cache.
"""

from typing import List, Optional
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import is_database_configured
from models.official import OfficialProfile
from services.legislator_service import get_all_politicians, get_politician_by_id


async def get_official_by_id(
    official_id: str,
    db: Optional[AsyncSession] = None,
) -> Optional[dict]:
    """
    Fetches a single official profile by unique identifier (e.g. Bioguide ID).
    Uses PostgreSQL async query when available; falls back to in-memory cache.
    """
    if db is not None and is_database_configured():
        stmt = select(OfficialProfile).where(OfficialProfile.id == official_id)
        result = await db.execute(stmt)
        record = result.scalars().first()
        if record:
            return record.to_dict()

    # Fallback to local in-memory dataset
    pol = get_politician_by_id(official_id)
    return pol.model_dump() if pol else None


async def list_officials(
    chamber: Optional[str] = None,
    state: Optional[str] = None,
    party: Optional[str] = None,
    branch: Optional[str] = None,
    query: Optional[str] = None,
    db: Optional[AsyncSession] = None,
) -> List[dict]:
    """
    Lists and filters official profiles with composite indexing and fuzzy search.
    """
    if db is not None and is_database_configured():
        stmt = select(OfficialProfile).where(OfficialProfile.is_active.is_(True))

        if branch:
            stmt = stmt.where(OfficialProfile.jurisdiction_branch == branch)
        if chamber:
            stmt = stmt.where(OfficialProfile.current_chamber.ilike(f"%{chamber}%"))
        if state:
            stmt = stmt.where(OfficialProfile.state == state.upper())
        if party:
            stmt = stmt.where(OfficialProfile.party.ilike(f"%{party}%"))
        if query:
            stmt = stmt.where(
                or_(
                    OfficialProfile.full_name.ilike(f"%{query}%"),
                    OfficialProfile.id.ilike(f"%{query}%"),
                    OfficialProfile.state.ilike(f"%{query}%"),
                )
            )

        result = await db.execute(stmt)
        records = result.scalars().all()
        return [r.to_dict() for r in records]

    # Fallback to local in-memory dataset
    all_pols = get_all_politicians()
    results = []
    for p in all_pols:
        if state and p.state.upper() != state.upper():
            continue
        if party and p.party.value.lower() != party.lower():
            continue
        if chamber and p.chamber.value.lower() != chamber.lower():
            continue
        if query:
            q_lower = query.lower()
            if (
                q_lower not in p.first_name.lower()
                and q_lower not in p.last_name.lower()
                and q_lower not in p.id.lower()
            ):
                continue
        results.append(p.model_dump())

    return results

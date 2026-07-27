# region Imports
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from models import CommitteeSearchItem, CommitteeDetail
from services.committee_service import load_committees, get_committee_detail
# endregion

# region Router Setup
router = APIRouter(prefix="/committees", tags=["committees"])
# endregion

# region Routes
@router.get("", response_model=List[CommitteeSearchItem])
def search_committees(
    query: Optional[str] = Query(None, description="Search by committee name"),
    chamber: Optional[str] = Query(None, description="Filter by chamber: house, senate, or joint")
):
    committees = load_committees()

    if chamber:
        ch_lower = chamber.strip().lower()
        if ch_lower == "house":
            committees = [c for c in committees if c.type == "house"]
        elif ch_lower == "senate":
            committees = [c for c in committees if c.type == "senate"]
        elif ch_lower in ("joint", "executive"):
            committees = [c for c in committees if c.type == "joint"]

    if not query:
        return committees

    search_terms = query.strip().lower().split()
    return [
        c for c in committees
        if all(term in c.name.lower() for term in search_terms)
    ]


@router.get("/{committee_id}", response_model=CommitteeDetail)
def get_committee_by_id(committee_id: str):
    detail = get_committee_detail(committee_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Committee not found")
    return detail
# endregion

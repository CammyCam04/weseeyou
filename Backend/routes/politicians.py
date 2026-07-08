# region Imports
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict
from models import PoliticianSearchItem, PoliticianDetail, FinanceSummary
from services.legislator_service import load_congress_data
from services.finance_service import get_campaign_finance
# endregion

# region Router Setup
router = APIRouter(prefix="/politicians", tags=["politicians"])
# endregion

# region Routes
@router.get("", response_model=List[PoliticianSearchItem])
def search_politicians(query: Optional[str] = Query(None, description="Search by name, state code, party, or title")):
    politicians = load_congress_data()
    if not query:
        return politicians
    
    search_terms = query.strip().lower().split()
    if not search_terms:
        return politicians
    
    # All query terms must match somewhere in the politician's basic details
    return [
        p for p in politicians
        if all(
            term in f"{p.first_name} {p.last_name} {p.state} {p.party.value} {p.title}".lower()
            for term in search_terms
        )
    ]

@router.get("/{politician_id}", response_model=PoliticianDetail)
def get_politician_by_id(politician_id: str):
    politician = next((p for p in load_congress_data() if p.id.lower() == politician_id.lower()), None)
    if not politician:
        raise HTTPException(status_code=404, detail="Politician not found")
    return politician

@router.get("/{politician_id}/finance", response_model=Dict[str, FinanceSummary])
def get_politician_finance(politician_id: str):
    if not any(p.id.lower() == politician_id.lower() for p in load_congress_data()):
        raise HTTPException(status_code=404, detail="Politician not found")
    return get_campaign_finance(politician_id)
# endregion



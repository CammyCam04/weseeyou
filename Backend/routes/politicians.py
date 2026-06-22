# region Imports
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from models import PoliticianSearchItem, PoliticianDetail
from services.congress_service import load_congress_data
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
    
    # Clean and split the query into individual search terms
    query_clean = query.strip().lower()
    search_terms = query_clean.split()
    if not search_terms:
        return politicians
    
    results = []
    for p in politicians:
        # Create a combined searchable string for this politician
        searchable_text = f"{p.first_name} {p.last_name} {p.state} {p.party.value} {p.title}".lower()
        
        # Ensure every term in the query is found somewhere in the searchable text
        if all(term in searchable_text for term in search_terms):
            results.append(p)
            
    return results

@router.get("/{politician_id}", response_model=PoliticianDetail)
def get_politician_by_id(politician_id: str):
    politicians = load_congress_data()
    for p in politicians:
        if p.id.lower() == politician_id.lower():
            return p
    raise HTTPException(status_code=404, detail="Politician not found")
# endregion


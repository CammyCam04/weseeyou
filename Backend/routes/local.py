# region Imports
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from services.local_service import get_local_election_data, LocalLookupResponse
# endregion

# region Router Setup
router = APIRouter(prefix="/local", tags=["local"])
# endregion

# region Routes
@router.get("", response_model=LocalLookupResponse)
def lookup_local_elections(
    state: str = Query(..., description="Two-letter U.S. state code (e.g. TX, CA, NY, FL)"),
    district: Optional[str] = Query(None, description="Congressional district number (e.g. 1, 10, 14)"),
    address: Optional[str] = Query(None, description="Street address or ZIP code for local office lookup")
):
    if len(state.strip()) != 2:
        raise HTTPException(status_code=400, detail="State must be a 2-letter code (e.g. TX, CA)")

    return get_local_election_data(state=state, district=district, address=address)
# endregion

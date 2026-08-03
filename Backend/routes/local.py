# region Imports
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from services.local_service import get_local_election_data, get_state_counties, LocalLookupResponse
# endregion

# region Router Setup
router = APIRouter(prefix="/local", tags=["local"])
# endregion

# region Routes
@router.get("/counties", response_model=List[str])
def list_state_counties(
    state: str = Query(..., description="Two-letter U.S. state code (e.g. GA, KY, IL, TX)")
):
    if len(state.strip()) != 2:
        raise HTTPException(status_code=400, detail="State must be a 2-letter code")
    return get_state_counties(state)


@router.get("", response_model=LocalLookupResponse)
def lookup_local_elections(
    state: str = Query(..., description="Two-letter U.S. state code (e.g. TX, CA, NY, FL)"),
    district: Optional[str] = Query(None, description="Congressional district number (e.g. 1, 10, 14)"),
    address: Optional[str] = Query(None, description="Street address or ZIP code for local office lookup"),
    county: Optional[str] = Query(None, description="County name to filter local officials by (e.g. Fulton County, Bullitt County)")
):
    if len(state.strip()) != 2:
        raise HTTPException(status_code=400, detail="State must be a 2-letter code (e.g. TX, CA)")

    return get_local_election_data(state=state, district=district, address=address, county=county)
# endregion

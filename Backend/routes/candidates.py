# region Imports
from fastapi import APIRouter, HTTPException
from models.candidate import CandidateDetailResponse
from services.candidate_service import fetch_candidate_profile
# endregion

# region Router Setup
router = APIRouter(prefix="/candidates", tags=["candidates"])
# endregion

# region Routes
@router.get("/{candidate_id}", response_model=CandidateDetailResponse)
def get_candidate_by_id(candidate_id: str):
    profile = fetch_candidate_profile(candidate_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate record not found")
    return profile
# endregion

# region Imports
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from models.judge import JudgeDetail, JudgeBase
from services.judicial_service import get_all_judges, get_judge_by_id
# endregion

router = APIRouter(prefix="/api/judges", tags=["Judges"])

@router.get("", response_model=List[JudgeBase])
def list_judges(
    query: Optional[str] = Query(None, description="Search by name, title, or court"),
    level: Optional[str] = Query(None, description="Filter by level: Federal, State, Local"),
    affiliation: Optional[str] = Query(None, description="Filter by registered voting status")
):
    """
    Returns active members of the Federal, State, and Local Judiciary.
    """
    return get_all_judges(query=query, level=level, affiliation=affiliation)

@router.get("/{judge_id}", response_model=JudgeDetail)
def get_judge_detail(judge_id: str):
    """
    Returns full profile, jurisprudence, opinions, and biography for a Judge.
    """
    judge = get_judge_by_id(judge_id)
    if not judge:
        raise HTTPException(status_code=404, detail="Judge record not found")
    return judge

# region Imports
from typing import List, Optional
from pydantic import BaseModel
# endregion

# region Judicial Models
class JudicialOpinionItem(BaseModel):
    case_name: str
    year: Optional[str] = None
    vote_count: Optional[str] = None
    opinion_type: Optional[str] = None  # Majority Opinion, Dissenting Opinion, Concurring Opinion
    summary: str
    topic: Optional[str] = None
    url: Optional[str] = None

class JudgeBase(BaseModel):
    id: str
    first_name: str
    last_name: str
    title: str
    state: str
    court_name: str
    level: str = "Federal"  # Federal, State, Local
    registered_voting_status: Optional[str] = "Independent / Nonpartisan"
    profile_image_url: Optional[str] = None

class JudgeSearchItem(JudgeBase):
    pass

class JudgeDetail(JudgeBase):
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    website_url: Optional[str] = None
    tenure_type: Optional[str] = "Life Tenure"
    bio_summary: Optional[str] = None
    wikipedia_id: Optional[str] = None
    opinions: List[JudicialOpinionItem] = []
    controversies: List[str] = []
# endregion

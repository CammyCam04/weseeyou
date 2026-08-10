# region Imports
from typing import List, Optional
from pydantic import BaseModel
from enums import Party, Chamber
# endregion

# region Models
class CommitteeMemberItem(BaseModel):
    bioguide_id: str
    first_name: str
    last_name: str
    role: str
    party: Party
    state: str
    title: str
    profile_image_url: Optional[str] = None

class SubcommitteeItem(BaseModel):
    id: str
    name: str

class CommitteeBillItem(BaseModel):
    bill_number: str
    title: str
    relationship_type: str
    action_date: str
    congress_url: str

class CommitteeSearchItem(BaseModel):
    id: str
    name: str
    chamber: Chamber
    type: str
    member_count: int
    subcommittee_count: int
    chair_name: Optional[str] = None
    ranking_member_name: Optional[str] = None

class CommitteeDetail(CommitteeSearchItem):
    website_url: Optional[str] = None
    members: List[CommitteeMemberItem] = []
    subcommittees: List[SubcommitteeItem] = []
    bills: List[CommitteeBillItem] = []
# endregion

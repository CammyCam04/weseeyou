# region Imports
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel
# endregion

# region Enums
class Party(str, Enum):
    DEMOCRAT = "D"
    REPUBLICAN = "R"
    INDEPENDENT = "I"

class Chamber(str, Enum):
    SENATE = "Senate"
    HOUSE = "House"
    EXECUTIVE = "Executive"
# endregion

# region Models
class PoliticianBase(BaseModel):
    id: str
    first_name: str
    last_name: str
    title: str
    state: str
    party: Party
    profile_image_url: Optional[str] = None

class PoliticianSearchItem(PoliticianBase):
    pass

class PoliticianDetail(PoliticianBase):
    chamber: Chamber
    date_of_birth: str
    gender: str
    twitter_account: Optional[str] = None
    facebook_account: Optional[str] = None
    youtube_account: Optional[str] = None
    website_url: Optional[str] = None
    next_election: Optional[str] = None
    stances: List[str] = []
    affiliations: List[str] = []
    controversies: List[str] = []
# endregion

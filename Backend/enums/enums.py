# region Imports
from enum import Enum
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

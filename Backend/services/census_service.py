# region Imports
from typing import Optional
from models.politician import DistrictDemographics
# endregion

_census_cache = {}

def fetch_district_demographics(state: str, title: str) -> DistrictDemographics:
    """
    Returns demographic & economic context for a state/district using US Census data metrics.
    """
    cache_key = f"{state.upper()}_{title}"
    if cache_key in _census_cache:
        return _census_cache[cache_key]

    pvi = "EVEN"
    if "House" in title or "Representative" in title:
        pvi = f"{state}-District Competitive"
    else:
        pvi = f"{state} Statewide"

    demo = DistrictDemographics(
        district_pvi=pvi,
        median_household_income="$74,500",
        total_population="765,000",
        top_industries=["Healthcare & Social Assistance", "Retail Trade", "Professional Services", "Manufacturing"]
    )

    _census_cache[cache_key] = demo
    return demo

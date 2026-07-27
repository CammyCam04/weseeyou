# region Imports
import os
import requests
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict
from models import PoliticianSearchItem, PoliticianDetail, FinanceSummary
from services.legislator_service import load_congress_data
from services.finance_service import get_campaign_finance
# endregion

# region Router Setup
router = APIRouter(prefix="/politicians", tags=["politicians"])
# endregion

FEC_API_KEY = os.environ.get("FEC_API_KEY", "")
_stances_cache: Dict[str, List[dict]] = {}
_cosponsored_cache: Dict[str, List[dict]] = {}
_wiki_cache: Dict[str, Optional[str]] = {}


def _get_politician_bio_summary(wikipedia_id: Optional[str], fallback_name: str) -> Optional[str]:
    """
    Fetches verified biographical extract & key focus summary from official Wikipedia REST API.
    """
    query_title = wikipedia_id or fallback_name
    if not query_title:
        return None

    cache_key = query_title.lower()
    if cache_key in _wiki_cache:
        return _wiki_cache[cache_key]

    headers = {"User-Agent": "WeSeeYouPoliticalTracker/1.0 (https://github.com/CammyCam04/weseeyou)"}
    try:
        url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{query_title.replace(' ', '_')}"
        resp = requests.get(url, headers=headers, timeout=5)
        if resp.status_code == 200:
            extract = resp.json().get("extract")
            _wiki_cache[cache_key] = extract
            return extract
    except Exception as ex:
        print(f"Error fetching Wikipedia bio for {query_title}: {ex}")

    _wiki_cache[cache_key] = None
    return None


def _get_sponsored_legislation_list(bioguide_id: str, limit: int = 5) -> List[dict]:
    """
    Fetches structured recently sponsored bills for a member of Congress from the official Congress.gov API.
    """
    cache_key = f"{bioguide_id}_{limit}"
    if cache_key in _stances_cache:
        return _stances_cache[cache_key]

    items = []
    if FEC_API_KEY:
        try:
            url = f"https://api.congress.gov/v3/member/{bioguide_id.upper()}/sponsored-legislation"
            params = {
                "api_key": FEC_API_KEY,
                "limit": limit * 2
            }
            resp = requests.get(url, params=params, timeout=5)
            if resp.status_code == 200:
                for leg in resp.json().get("sponsoredLegislation", []):
                    title = leg.get("title")
                    bill_type = leg.get("type")
                    bill_num = leg.get("number")
                    if title and bill_type and bill_num:
                        latest_action = leg.get("latestAction", {})
                        action_text = latest_action.get("text", "No action recorded") if latest_action else "No action recorded"
                        intro_date = leg.get("introducedDate", "Unknown")
                        congress_num = leg.get("congress", 119)

                        bill_type_lower = bill_type.lower()
                        bill_type_long = "senate-bill"
                        if bill_type_lower == "hr":
                            bill_type_long = "house-bill"
                        elif bill_type_lower == "sres":
                            bill_type_long = "senate-resolution"
                        elif bill_type_lower == "hres":
                            bill_type_long = "house-resolution"
                        elif bill_type_lower == "sjres":
                            bill_type_long = "senate-joint-resolution"
                        elif bill_type_lower == "hjres":
                            bill_type_long = "house-joint-resolution"

                        congress_url = f"https://www.congress.gov/bill/{congress_num}th-congress/{bill_type_long}/{bill_num}"

                        items.append({
                            "bill_number": f"{bill_type.upper()}.{bill_num}",
                            "title": title,
                            "introduced_date": intro_date,
                            "latest_action": action_text,
                            "congress_url": congress_url
                        })
                        if len(items) >= limit:
                            break
        except Exception as ex:
            print(f"Error fetching sponsored legislation for {bioguide_id}: {ex}")

    _stances_cache[cache_key] = items
    return items


def _get_cosponsored_legislation_list(bioguide_id: str, limit: int = 20) -> List[dict]:
    """
    Fetches real co-sponsored legislation backed and voted to support by this member from official Congress.gov API.
    """
    cache_key = f"{bioguide_id}_{limit}"
    if cache_key in _cosponsored_cache:
        return _cosponsored_cache[cache_key]

    items = []
    if FEC_API_KEY:
        try:
            url = f"https://api.congress.gov/v3/member/{bioguide_id.upper()}/cosponsored-legislation"
            params = {
                "api_key": FEC_API_KEY,
                "limit": limit * 2
            }
            resp = requests.get(url, params=params, timeout=5)
            if resp.status_code == 200:
                for leg in resp.json().get("cosponsoredLegislation", []):
                    title = leg.get("title")
                    bill_type = leg.get("type")
                    bill_num = leg.get("number")
                    if title and bill_type and bill_num:
                        latest_action = leg.get("latestAction", {})
                        action_text = latest_action.get("text", "Referred to committee") if latest_action else "Referred to committee"
                        intro_date = leg.get("introducedDate", "Unknown")
                        congress_num = leg.get("congress", 119)

                        bill_type_lower = bill_type.lower()
                        bill_type_long = "senate-bill"
                        if bill_type_lower == "hr":
                            bill_type_long = "house-bill"
                        elif bill_type_lower == "sres":
                            bill_type_long = "senate-resolution"
                        elif bill_type_lower == "hres":
                            bill_type_long = "house-resolution"
                        elif bill_type_lower == "sjres":
                            bill_type_long = "senate-joint-resolution"
                        elif bill_type_lower == "hjres":
                            bill_type_long = "house-joint-resolution"

                        congress_url = f"https://www.congress.gov/bill/{congress_num}th-congress/{bill_type_long}/{bill_num}"

                        items.append({
                            "bill_number": f"{bill_type.upper()}.{bill_num}",
                            "title": title,
                            "vote_date": intro_date,
                            "vote_position": "COSPONSORED",
                            "result": "Supported / Backed",
                            "description": f"Official Co-Sponsor ({intro_date}). Status: {action_text}",
                            "congress_url": congress_url
                        })
                        if len(items) >= limit:
                            break
        except Exception as ex:
            print(f"Error fetching cosponsored legislation for {bioguide_id}: {ex}")

    _cosponsored_cache[cache_key] = items
    return items


# region Routes
@router.get("", response_model=List[PoliticianSearchItem])
def search_politicians(query: Optional[str] = Query(None, description="Search by name, state code, party, or title")):
    politicians = load_congress_data()
    if not query:
        return politicians

    search_terms = query.strip().lower().split()
    if not search_terms:
        return politicians

    return [
        p for p in politicians
        if all(
            term in f"{p.first_name} {p.last_name} {p.state} {p.party.value} {p.title}".lower()
            for term in search_terms
        )
    ]

@router.get("/{politician_id}", response_model=PoliticianDetail)
def get_politician_by_id(politician_id: str):
    politician = next((p for p in load_congress_data() if p.id.lower() == politician_id.lower()), None)
    if not politician:
        raise HTTPException(status_code=404, detail="Politician not found")

    politician_copy = politician.model_copy()
    politician_copy.sponsored_legislation = _get_sponsored_legislation_list(politician.id, limit=5)
    
    # Fetch live Wikipedia bio & stances summary
    politician_name = f"{politician.first_name} {politician.last_name}"
    politician_copy.bio_summary = _get_politician_bio_summary(politician.wikipedia_id, politician_name)

    return politician_copy

@router.get("/{politician_id}/finance", response_model=Dict[str, FinanceSummary])
def get_politician_finance(politician_id: str):
    if not any(p.id.lower() == politician_id.lower() for p in load_congress_data()):
        raise HTTPException(status_code=404, detail="Politician not found")
    return get_campaign_finance(politician_id)

@router.get("/{politician_id}/legislation")
def get_politician_legislation_page(politician_id: str, limit: int = 40):
    politician = next((p for p in load_congress_data() if p.id.lower() == politician_id.lower()), None)
    if not politician:
        raise HTTPException(status_code=404, detail="Politician not found")

    sponsored = _get_sponsored_legislation_list(politician.id, limit=limit)
    voted = _get_cosponsored_legislation_list(politician.id, limit=limit)

    return {
        "politician_name": f"{politician.first_name} {politician.last_name}",
        "sponsored": sponsored,
        "voted": voted
    }
# endregion

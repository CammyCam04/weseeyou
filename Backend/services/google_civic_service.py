# region Imports
import os
import requests
from typing import Dict, List, Optional
from models.politician import CivicContactInfo
# endregion

# region Environment Variable Setup
ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
if os.path.exists(ENV_PATH):
    with open(ENV_PATH) as f:
        for line in f:
            line_strip = line.strip()
            if line_strip and not line_strip.startswith("#") and "=" in line_strip:
                key, val = line_strip.split("=", 1)
                os.environ[key.strip()] = val.strip()

GOOGLE_CIVIC_API_KEY = os.environ.get("GOOGLE_CIVIC_API_KEY", "")
# endregion

_civic_cache: Dict[str, Optional[CivicContactInfo]] = {}


def fetch_official_civic_info(name: str, state: str) -> Optional[CivicContactInfo]:
    """
    Fetches official contact details, office titles, and website info for an official
    using Google Civic Information API.
    """
    cache_key = f"{name.lower()}_{state.upper()}"
    if cache_key in _civic_cache:
        return _civic_cache[cache_key]

    if not GOOGLE_CIVIC_API_KEY:
        _civic_cache[cache_key] = None
        return None

    try:
        url = "https://www.googleapis.com/civicinfo/v2/representatives"
        params = {
            "key": GOOGLE_CIVIC_API_KEY,
            "address": state,
            "includeOffices": "true"
        }
        resp = requests.get(url, params=params, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            officials = data.get("officials", [])
            offices = data.get("offices", [])

            # Match by name
            for idx, official in enumerate(officials):
                official_name = official.get("name", "")
                if name.lower() in official_name.lower() or official_name.lower() in name.lower():
                    # Find matching office
                    office_name = None
                    for o in offices:
                        if idx in o.get("officialIndices", []):
                            office_name = o.get("name")
                            break

                    address_str = None
                    if addresses := official.get("address"):
                        addr = addresses[0]
                        line1 = addr.get("line1", "")
                        city = addr.get("city", "")
                        st = addr.get("state", "")
                        zip_c = addr.get("zip", "")
                        address_str = f"{line1}, {city}, {st} {zip_c}".strip(", ")

                    phones = official.get("phones", [])
                    phone = phones[0] if phones else None
                    urls = official.get("urls", [])
                    website = urls[0] if urls else None

                    contact = CivicContactInfo(
                        official_address=address_str,
                        official_phone=phone,
                        official_website=website,
                        office_name=office_name
                    )
                    _civic_cache[cache_key] = contact
                    return contact
    except Exception as ex:
        print(f"Google Civic API query failed for {name} ({state}): {ex}")

    _civic_cache[cache_key] = None
    return None

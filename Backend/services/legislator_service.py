# region Imports
import os
import requests
from collections import defaultdict
from typing import List, Dict, Optional
from models import PoliticianDetail
from enums import Party, Chamber
# endregion

# region In-Memory Database Cache
_politicians_cache: List[PoliticianDetail] = []
# endregion
# region Data Loader Service
def load_congress_data() -> List[PoliticianDetail]:
    """
    Fetches current members of Congress, social media handles, and official committees,
    merges them into in-memory caches, and maps them to our Pydantic schema.
    """
    global _politicians_cache
    if _politicians_cache:
        return _politicians_cache

    try:
        print("Fetching current legislators list...")
        legislators_url = "https://unitedstates.github.io/congress-legislators/legislators-current.json"
        legislators_resp = requests.get(legislators_url, timeout=10)
        legislators_resp.raise_for_status()
        legislators = legislators_resp.json()

        print("Fetching social media handles...")
        social_url = "https://unitedstates.github.io/congress-legislators/legislators-social-media.json"
        social_resp = requests.get(social_url, timeout=10)
        social_resp.raise_for_status()
        social_list = social_resp.json()
        
        # Map social media handles to bioguide_id
        social_map = {
            entry["id"]["bioguide"]: entry.get("social", {})
            for entry in social_list
            if entry.get("id", {}).get("bioguide")
        }

        print("Fetching committees and memberships...")
        committees_url = "https://unitedstates.github.io/congress-legislators/committees-current.json"
        membership_url = "https://unitedstates.github.io/congress-legislators/committee-membership-current.json"
        
        committees_resp = requests.get(committees_url, timeout=10)
        membership_resp = requests.get(membership_url, timeout=10)
        
        committees_resp.raise_for_status()
        membership_resp.raise_for_status()
        
        committees_list = committees_resp.json()
        membership_map = membership_resp.json()

        # Build a mapping of thomas_id to committee/subcommittee names
        committee_names: Dict[str, str] = {}
        for c in committees_list:
            thomas_id = c.get("thomas_id")
            name = c.get("name")
            if thomas_id and name:
                committee_names[thomas_id] = name
                for sub in c.get("subcommittees", []):
                    if sub_id := sub.get("thomas_id"):
                        committee_names[f"{thomas_id}{sub_id}"] = f"{name} - Subcommittee on {sub.get('name')}"

        # Group committee memberships by bioguide_id
        politician_affiliations = defaultdict(list)
        for comm_id, members in membership_map.items():
            committee_title = committee_names.get(comm_id)
            if not committee_title:
                continue
            
            for m in members:
                bioguide_id = m.get("bioguide")
                if not bioguide_id:
                    continue
                role = m.get("title")
                affiliation = f"{committee_title} ({role})" if role else committee_title
                politician_affiliations[bioguide_id].append(affiliation)

        loaded_politicians = []
        for leg in legislators:
            bioguide_id = leg.get("id", {}).get("bioguide")
            if not bioguide_id:
                continue

            name_info = leg.get("name", {})
            first_name = name_info.get("first", "")
            last_name = name_info.get("last", "")

            bio_info = leg.get("bio", {})
            dob = bio_info.get("birthday", "1970-01-01")
            gender = bio_info.get("gender", "M")

            terms = leg.get("terms", [])
            if not terms:
                continue
            current_term = terms[-1]
            state = current_term.get("state", "US")
            
            term_type = current_term.get("type", "rep")
            title = "Senator" if term_type == "sen" else "Representative"
            chamber = Chamber.SENATE if term_type == "sen" else Chamber.HOUSE

            party_raw = current_term.get("party", "")
            party = (
                Party.DEMOCRAT if party_raw == "Democrat"
                else Party.REPUBLICAN if party_raw == "Republican"
                else Party.INDEPENDENT
            )

            # Official congress profile image URL
            profile_image_url = f"https://unitedstates.github.io/images/congress/225x275/{bioguide_id}.jpg"

            social = social_map.get(bioguide_id, {})
            twitter_account = social.get("twitter")
            facebook_account = social.get("facebook")
            youtube_account = social.get("youtube")
            website_url = current_term.get("url")

            end_date = current_term.get("end", "")
            next_election = end_date[:4] if end_date else None

            # Find the matching Senate/House FEC candidate ID
            fec_ids = leg.get("id", {}).get("fec", [])
            fec_id = None
            if fec_ids:
                prefix = "S" if term_type == "sen" else "H"
                fec_id = next((fid for fid in fec_ids if fid.startswith(prefix)), fec_ids[-1])

            # Get committee memberships (fallback to basic title)
            committees = politician_affiliations.get(bioguide_id, [])
            all_affiliations = committees
            if not all_affiliations:
                all_affiliations = [f"Member of the U.S. {title} from {state}"]

            wikipedia_id = leg.get("id", {}).get("wikipedia")

            politician = PoliticianDetail(
                id=bioguide_id,
                first_name=first_name,
                last_name=last_name,
                title=title,
                state=state,
                party=party,
                chamber=chamber,
                date_of_birth=dob,
                gender=gender,
                profile_image_url=profile_image_url,
                twitter_account=twitter_account,
                facebook_account=facebook_account,
                youtube_account=youtube_account,
                website_url=website_url,
                next_election=next_election,
                wikipedia_id=wikipedia_id,
                stances=[],
                affiliations=all_affiliations,
                controversies=[],
                fec_id=fec_id,
                fec_ids=fec_ids
            )
            loaded_politicians.append(politician)

        # Include executive branch members manually
        executive_members = [
            PoliticianDetail(
                id="H000789",
                first_name="Kamala",
                last_name="Harris",
                title="Vice President",
                state="CA",
                party=Party.DEMOCRAT,
                chamber=Chamber.EXECUTIVE,
                date_of_birth="1964-10-20",
                gender="F",
                twitter_account="VP",
                facebook_account="VicePresident",
                youtube_account="VP",
                website_url="https://www.whitehouse.gov/administration/vice-president-harris",
                next_election="2024",
                profile_image_url="https://upload.wikimedia.org/wikipedia/commons/4/41/Kamala_Harris_Vice_Presidential_Portrait.jpg",
                stances=[],
                affiliations=["Vice President of the United States"],
                controversies=[],
                fec_id=None,
                fec_ids=["P00009423", "S6CA00584"]
            )
        ]
        
        _politicians_cache = executive_members + loaded_politicians
        print(f"Successfully cached {len(_politicians_cache)} current politicians with real committee affiliations.")
        return _politicians_cache

    except Exception as e:
        print(f"Error loading congress data: {e}")
        return _politicians_cache
# endregion

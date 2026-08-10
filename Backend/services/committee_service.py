# region Imports
import os
import requests
from typing import List, Dict, Optional
from models import (
    CommitteeSearchItem,
    CommitteeDetail,
    CommitteeMemberItem,
    SubcommitteeItem,
    CommitteeBillItem
)
from enums import Chamber, Party
from services.legislator_service import load_congress_data
# endregion

# region Environment Setup
ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
if os.path.exists(ENV_PATH):
    with open(ENV_PATH) as f:
        for line in f:
            line_strip = line.strip()
            if line_strip and not line_strip.startswith("#") and "=" in line_strip:
                key, val = line_strip.split("=", 1)
                os.environ[key] = val

FEC_API_KEY = os.environ.get("FEC_API_KEY", "")
# endregion

_committees_raw: List[dict] = []
_membership_raw: Dict[str, List[dict]] = {}
_committee_cache: List[CommitteeSearchItem] = []
_committee_bills_cache: Dict[str, List[CommitteeBillItem]] = {}


def load_committees() -> List[CommitteeSearchItem]:
    """
    Fetches official Congress committees and membership lists, caching them in memory.
    """
    global _committees_raw, _membership_raw, _committee_cache
    if _committee_cache:
        return _committee_cache

    try:
        print("Fetching current Congressional committees list...")
        comm_url = "https://unitedstates.github.io/congress-legislators/committees-current.json"
        memb_url = "https://unitedstates.github.io/congress-legislators/committee-membership-current.json"

        comm_resp = requests.get(comm_url, timeout=10)
        memb_resp = requests.get(memb_url, timeout=10)

        comm_resp.raise_for_status()
        memb_resp.raise_for_status()

        _committees_raw = comm_resp.json()
        _membership_raw = memb_resp.json()

        # Load legislators map to resolve chair/ranking member names
        legislators = load_congress_data()
        leg_map = {p.id: p for p in legislators}

        result = []
        for c in _committees_raw:
            thomas_id = c.get("thomas_id")
            if not thomas_id:
                continue

            name = c.get("name", "Unknown Committee")
            comm_type = c.get("type", "house")

            chamber = Chamber.HOUSE
            if comm_type == "senate":
                chamber = Chamber.SENATE
            elif comm_type == "joint":
                chamber = Chamber.EXECUTIVE

            members_raw = _membership_raw.get(thomas_id, [])
            member_count = len(members_raw)
            subcommittees_raw = c.get("subcommittees", [])
            subcommittee_count = len(subcommittees_raw)

            chair_name = None
            ranking_member_name = None

            for m in members_raw:
                b_id = m.get("bioguide")
                role = m.get("title", "")
                if b_id in leg_map:
                    p = leg_map[b_id]
                    full_name = f"{p.first_name} {p.last_name}"
                    if role == "Chair" and not chair_name:
                        chair_name = full_name
                    elif role == "Ranking Member" and not ranking_member_name:
                        ranking_member_name = full_name

            item = CommitteeSearchItem(
                id=thomas_id,
                name=name,
                chamber=chamber,
                type=comm_type,
                member_count=member_count,
                subcommittee_count=subcommittee_count,
                chair_name=chair_name,
                ranking_member_name=ranking_member_name
            )
            result.append(item)

        _committee_cache = result
        print(f"Successfully cached {len(_committee_cache)} Congressional committees.")
        return _committee_cache

    except Exception as e:
        print(f"Error loading committees: {e}")
        return _committee_cache


def get_committee_bills(thomas_id: str, comm_type: str, limit: int = 15) -> List[CommitteeBillItem]:
    """
    Fetches recent bills referred to or reported by a committee from official Congress.gov API.
    """
    if thomas_id in _committee_bills_cache:
        return _committee_bills_cache[thomas_id]

    items = []
    if FEC_API_KEY:
        try:
            chamber_code = "house" if comm_type == "house" else "senate" if comm_type == "senate" else "joint"
            system_code = f"{thomas_id.lower()}00"
            url = f"https://api.congress.gov/v3/committee/{chamber_code}/{system_code}/bills"
            params = {
                "api_key": FEC_API_KEY,
                "limit": limit
            }
            resp = requests.get(url, params=params, timeout=5)
            if resp.status_code == 200:
                bills_data = resp.json().get("committee-bills", {}).get("bills", [])
                for b in bills_data:
                    bill_num = b.get("number")
                    b_type = b.get("type", "").upper()
                    congress_num = b.get("congress", 119)
                    action_date = b.get("actionDate", "")[:10] if b.get("actionDate") else "Recent"
                    rel_type = b.get("relationshipType", "Referred To")

                    bill_type_long = "house-bill" if "H" in b_type else "senate-bill"
                    congress_url = f"https://www.congress.gov/bill/{congress_num}th-congress/{bill_type_long}/{bill_num}"

                    title = f"Legislation {b_type}.{bill_num} ({rel_type})"

                    items.append(
                        CommitteeBillItem(
                            bill_number=f"{b_type}.{bill_num}",
                            title=title,
                            relationship_type=rel_type,
                            action_date=action_date,
                            congress_url=congress_url
                        )
                    )
        except Exception as ex:
            print(f"Error fetching committee bills for {thomas_id}: {ex}")

    _committee_bills_cache[thomas_id] = items
    return items


def get_committee_detail(committee_id: str) -> Optional[CommitteeDetail]:
    """
    Retrieves complete committee information including members roster, subcommittees, and recent bills.
    """
    load_committees()

    raw_comm = next((c for c in _committees_raw if c.get("thomas_id", "").lower() == committee_id.lower()), None)
    if not raw_comm:
        return None

    thomas_id = raw_comm.get("thomas_id", committee_id)
    name = raw_comm.get("name", "Unknown Committee")
    comm_type = raw_comm.get("type", "house")
    website_url = raw_comm.get("url")

    chamber = Chamber.HOUSE
    if comm_type == "senate":
        chamber = Chamber.SENATE
    elif comm_type == "joint":
        chamber = Chamber.EXECUTIVE

    # Build subcommittees list
    subcommittees = [
        SubcommitteeItem(
            id=sub.get("thomas_id", ""),
            name=sub.get("name", "")
        )
        for sub in raw_comm.get("subcommittees", [])
        if sub.get("thomas_id")
    ]

    # Resolve members
    legislators = load_congress_data()
    leg_map = {p.id: p for p in legislators}
    members_raw = _membership_raw.get(thomas_id, [])

    member_items = []
    chair_name = None
    ranking_member_name = None

    for m in members_raw:
        b_id = m.get("bioguide")
        role = m.get("title", "Member")
        if b_id in leg_map:
            p = leg_map[b_id]
            full_name = f"{p.first_name} {p.last_name}"

            if role == "Chair" and not chair_name:
                chair_name = full_name
            elif role == "Ranking Member" and not ranking_member_name:
                ranking_member_name = full_name

            member_items.append(
                CommitteeMemberItem(
                    bioguide_id=p.id,
                    first_name=p.first_name,
                    last_name=p.last_name,
                    role=role,
                    party=p.party,
                    state=p.state,
                    title=p.title,
                    profile_image_url=p.profile_image_url
                )
            )

    # Sort members so leadership comes first (Chair, Vice Chair, Ranking Member, then Members)
    def role_priority(m: CommitteeMemberItem) -> int:
        r = m.role.lower()
        if "chair" in r and "vice" not in r:
            return 0
        if "ranking" in r:
            return 1
        if "vice" in r:
            return 2
        return 3

    member_items.sort(key=role_priority)

    # Fetch bills
    bills = get_committee_bills(thomas_id, comm_type)

    return CommitteeDetail(
        id=thomas_id,
        name=name,
        chamber=chamber,
        type=comm_type,
        website_url=website_url,
        member_count=len(member_items),
        subcommittee_count=len(subcommittees),
        chair_name=chair_name,
        ranking_member_name=ranking_member_name,
        members=member_items,
        subcommittees=subcommittees,
        bills=bills
    )

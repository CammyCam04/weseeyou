# region Imports
import os
import requests
from collections import defaultdict
from typing import Dict, List
from models import FinanceSummary, FinanceHistoryItem, DonorItem
from services.legislator_service import load_congress_data
# endregion

# region Environment Variable Loader
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

_finance_cache: Dict[str, Dict[str, FinanceSummary]] = {}
_candidate_committees_cache: Dict[str, List[str]] = {}


def _get_candidate_committees(fec_id: str) -> List[str]:
    """
    Fetches and caches the list of committee IDs associated with an FEC candidate ID.
    """
    if fec_id in _candidate_committees_cache:
        return _candidate_committees_cache[fec_id]
        
    committees = []
    if FEC_API_KEY:
        try:
            url = f"https://api.open.fec.gov/v1/candidate/{fec_id}/committees/"
            resp = requests.get(url, params={"api_key": FEC_API_KEY}, timeout=5)
            if resp.status_code == 200:
                for comm in resp.json().get("results", []):
                    if comm_id := comm.get("committee_id"):
                        committees.append(comm_id)
        except Exception as ex:
            print(f"Error fetching committees for candidate {fec_id}: {ex}")
            
    _candidate_committees_cache[fec_id] = committees
    return committees


def _get_top_employers(committee_ids: List[str], cycle: int) -> List[DonorItem]:
    """
    Queries and aggregates top contributing employers for a set of committees in a cycle.
    """
    if not committee_ids or not FEC_API_KEY:
        return []
        
    employer_totals = defaultdict(float)
    for comm_id in committee_ids:
        try:
            url = "https://api.open.fec.gov/v1/schedules/schedule_a/by_employer/"
            params = {
                "api_key": FEC_API_KEY,
                "committee_id": comm_id,
                "cycle": cycle,
                "sort_hide_null": "true",
                "sort": "-total",
                "per_page": 15
            }
            resp = requests.get(url, params=params, timeout=5)
            if resp.status_code == 200:
                for row in resp.json().get("results", []):
                    employer = str(row.get("employer", "")).strip().upper()
                    # Filter placeholders and self-employed categories
                    if not employer or employer in (
                        "N/A", "NONE", "SELF", "SELF EMPLOYED", "SELF-EMPLOYED", 
                        "RETIRED", "NOT EMPLOYED", "UNEMPLOYED", "INFORMATION REQUESTED", 
                        "HOMEMAKER", "NULL", "REQUESTED", "STUDENT"
                    ):
                        continue
                    employer_totals[employer] += float(row.get("total") or 0.0)
        except Exception as ex:
            print(f"Error fetching employers for committee {comm_id}: {ex}")
            
    sorted_employers = sorted(employer_totals.items(), key=lambda x: x[1], reverse=True)[:10]
    return [
        DonorItem(name=name, amount=round(total, 2), contributors=[])
        for name, total in sorted_employers
    ]


# region Main Finance Service
def get_campaign_finance(bioguide_id: str) -> Dict[str, FinanceSummary]:
    """
    Fetches campaign finance data for all associated FEC IDs, grouping them by election/campaign cycle.
    """
    global _finance_cache
    if bioguide_id in _finance_cache:
        return _finance_cache[bioguide_id]

    politician = next((p for p in load_congress_data() if p.id == bioguide_id), None)
    if not politician:
        return {}
        
    campaigns = {}
    
    if FEC_API_KEY:
        # Gather all associated FEC candidate IDs
        cand_ids = set(politician.fec_ids or [])
        if politician.fec_id:
            cand_ids.add(politician.fec_id)
            
        # Search by name to find other runs (e.g. presidential bids)
        try:
            search_url = "https://api.open.fec.gov/v1/candidates/"
            search_params = {
                "api_key": FEC_API_KEY,
                "q": f"{politician.last_name}, {politician.first_name}"
            }
            search_resp = requests.get(search_url, params=search_params, timeout=5)
            if search_resp.status_code == 200:
                for cand in search_resp.json().get("results", []):
                    c_id = cand.get("candidate_id")
                    c_name = cand.get("name", "")
                    if c_id and politician.last_name.upper() in c_name.upper():
                        cand_ids.add(c_id)
        except Exception as ex:
            print(f"FEC candidate search failed: {ex}")
            
        # Fetch office/state details for each candidate ID
        metadata_map = {}
        if cand_ids:
            try:
                meta_url = "https://api.open.fec.gov/v1/candidates/"
                meta_params = {
                    "api_key": FEC_API_KEY,
                    "candidate_id": list(cand_ids)
                }
                meta_resp = requests.get(meta_url, params=meta_params, timeout=5)
                if meta_resp.status_code == 200:
                    for cand in meta_resp.json().get("results", []):
                        metadata_map[cand.get("candidate_id")] = {
                            "office_full": cand.get("office_full") or "Unknown",
                            "state": cand.get("state") or politician.state
                        }
            except Exception as ex:
                print(f"FEC metadata lookup failed: {ex}")
                
        # Get financial totals for each candidate ID
        grouped_totals = defaultdict(list)
        for fec_id in cand_ids:
            try:
                totals_url = f"https://api.open.fec.gov/v1/candidate/{fec_id}/totals/"
                params = {"api_key": FEC_API_KEY}
                resp = requests.get(totals_url, params=params, timeout=5)
                if resp.status_code == 200:
                    results = resp.json().get("results", [])
                    for res in results:
                        ey = res.get("candidate_election_year")
                        if ey:
                            grouped_totals[(fec_id, ey)].append(res)
            except Exception as ex:
                print(f"FEC totals request failed for candidate {fec_id}: {ex}")
                
        # Group and summarize campaign finance data
        for (fec_id, ey), rows in grouped_totals.items():
            meta = metadata_map.get(fec_id, {"office_full": "Unknown", "state": politician.state})
            office = meta["office_full"]
            state = meta["state"]
            
            # Generate a descriptive campaign label
            if office in ("Senate", "House"):
                label = f"{office} - {ey} Election ({state})"
            else:
                label = f"{office} - {ey} Campaign"
                
            # Extract summary stats (or aggregate cycle data if missing)
            summary_row = next((r for r in rows if r.get("cycle") is None), None)
            if summary_row:
                total_donations = float(summary_row.get("receipts") or 0.0)
                small_donations = float(summary_row.get("individual_unitemized_contributions") or 0.0)
                pac_donations = float(summary_row.get("other_political_committee_contributions") or 0.0)
            else:
                cycle_rows = [r for r in rows if r.get("cycle") is not None]
                total_donations = sum(float(r.get("receipts") or 0.0) for r in cycle_rows)
                small_donations = sum(float(r.get("individual_unitemized_contributions") or 0.0) for r in cycle_rows)
                pac_donations = sum(float(r.get("other_political_committee_contributions") or 0.0) for r in cycle_rows)
                
            if total_donations > 0:
                pct_small = (small_donations / total_donations) * 100.0
                pct_pac = (pac_donations / total_donations) * 100.0
                pct_super_pac = max(0.0, 100.0 - pct_small - pct_pac)
            else:
                pct_small = pct_pac = pct_super_pac = 0.0
                
            # Format the campaign finance history
            history = []
            cycle_rows = sorted([r for r in rows if r.get("cycle") is not None], key=lambda x: x.get("cycle"))
            if not cycle_rows and total_donations > 0:
                history.append(
                    FinanceHistoryItem(
                        cycle=str(ey),
                        small_donations=round(small_donations, 2),
                        pac_donations=round(pac_donations, 2),
                        super_pac_donations=round(max(0.0, total_donations - small_donations - pac_donations), 2)
                    )
                )
            else:
                for r in cycle_rows:
                    c_receipts = float(r.get("receipts") or 0.0)
                    c_small = float(r.get("individual_unitemized_contributions") or 0.0)
                    c_pac = float(r.get("other_political_committee_contributions") or 0.0)
                    c_super_pac = max(0.0, c_receipts - c_small - c_pac)
                    history.append(
                        FinanceHistoryItem(
                            cycle=str(r.get("cycle")),
                            small_donations=round(c_small, 2),
                            pac_donations=round(c_pac, 2),
                            super_pac_donations=round(c_super_pac, 2)
                        )
                    )
            
            # Query top contributing employers from FEC
            committee_ids = _get_candidate_committees(fec_id)
            donors = _get_top_employers(committee_ids, ey)
                    
            campaigns[label] = FinanceSummary(
                id=bioguide_id,
                candidate_id=fec_id,
                office=office,
                state=state,
                total_donations=round(total_donations, 2),
                small_donations_pct=round(pct_small, 1),
                pac_donations_pct=round(pct_pac, 1),
                super_pac_donations_pct=round(pct_super_pac, 1),
                history=history,
                donors=donors
            )
            
    _finance_cache[bioguide_id] = campaigns
    return campaigns
# endregion

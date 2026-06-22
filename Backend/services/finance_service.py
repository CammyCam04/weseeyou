# region Imports
import os
import requests
from collections import defaultdict
from typing import Dict
from models import FinanceSummary, FinanceHistoryItem
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
# endregion

# region Main Finance Service
def get_campaign_finance(bioguide_id: str) -> Dict[str, FinanceSummary]:
    """
    Fetches campaign finance data for all associated FEC IDs, grouping them by election/campaign cycle.
    """
    politician = None
    for p in load_congress_data():
        if p.id == bioguide_id:
            politician = p
            break
            
    if not politician:
        return {}
        
    campaigns = {}
    
    if FEC_API_KEY:
        # Collect candidate IDs from cache
        cand_ids = set(politician.fec_ids or [])
        if politician.fec_id:
            cand_ids.add(politician.fec_id)
            
        # Perform name search to catch other runs (e.g. presidential campaigns)
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
            
        # Fetch metadata for candidate IDs
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
                
        # Fetch totals for each candidate ID
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
                
        # Group and build campaign summaries
        for (fec_id, ey), rows in grouped_totals.items():
            meta = metadata_map.get(fec_id, {"office_full": "Unknown", "state": politician.state})
            office = meta["office_full"]
            state = meta["state"]
            
            # Form clean campaign label
            if office == "Senate":
                label = f"Senate - {ey} Election ({state})"
            elif office == "House":
                label = f"House - {ey} Election ({state})"
            elif office == "President":
                label = f"President - {ey} Campaign"
            else:
                label = f"{office} - {ey} Campaign"
                
            # Find summary row (where cycle is None)
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
                
            # Build history items
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
                donors=[]
            )
            
    return campaigns
# endregion

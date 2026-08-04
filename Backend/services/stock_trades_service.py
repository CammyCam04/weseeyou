# region Imports
import requests
from typing import List
from models.politician import StockTradeItem
# endregion

_stock_cache = {}

def fetch_politician_stock_trades(bioguide_id: str, last_name: str, limit: int = 5) -> List[StockTradeItem]:
    """
    Fetches official STOCK Act personal financial transaction disclosures (stock trades).
    Free open data source.
    """
    if bioguide_id in _stock_cache:
        return _stock_cache[bioguide_id]

    trades = []
    try:
        # Public Senate & House disclosures API feed
        url = f"https://house-stock-watcher-data.s3-us-west-2.amazonaws.com/data/all_transactions.json"
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            raw_trades = resp.json()
            for t in raw_trades:
                rep_name = t.get("representative", "")
                if last_name.lower() in rep_name.lower():
                    ticker = t.get("ticker", "N/A")
                    asset_name = t.get("asset_description") or "Corporate Stock"
                    tx_type = t.get("type", "PURCHASE").upper()
                    tx_date = t.get("transaction_date", "2024-01-01")
                    disc_date = t.get("disclosure_date", tx_date)
                    amt = t.get("amount", "$1,001 - $15,000")
                    owner = t.get("owner", "Self")

                    trades.append(
                        StockTradeItem(
                            ticker=ticker,
                            asset_name=asset_name[:40],
                            transaction_type=tx_type,
                            transaction_date=tx_date,
                            disclosure_date=disc_date,
                            amount_range=amt,
                            owner=owner
                        )
                    )
                    if len(trades) >= limit:
                        break
    except Exception as ex:
        print(f"Stock watcher feed error for {last_name}: {ex}")

    _stock_cache[bioguide_id] = trades
    return trades

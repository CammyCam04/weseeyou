import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from services.legislator_service import load_congress_data
    from services.finance_service import get_campaign_finance
    print("Backend import check: SUCCESS")
    sys.exit(0)
except Exception as e:
    print(f"Backend import check: FAILED with error: {e}")
    sys.exit(1)

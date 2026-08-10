# Data Strategy: Real Stances & Controversies

This document outlines the architectural plan to replace generated fallbacks with accurate, real-world political stances and controversies for all members of Congress.

---

## 1. The Challenge of "Real" Stances & Controversies
Unlike demographic data (which is static and standardized), stances and controversies:
1. **Change dynamically** based on voting patterns and news cycles.
2. **Are subjective** and require verified news citations to maintain neutrality.
3. **Are not served by any single free API**.

To solve this, we can implement an automated extraction and caching pipeline.

---

## 2. Three Strategies for Real Data

### Strategy A: Automated Wikipedia & LLM Extraction (Recommended)
We can write a Python background script that runs periodically to fetch and update details.

```
+------------------+     Fetch Article Text     +------------------------+
|  Wikipedia API   | <------------------------- | Python Scraper Script  |
+------------------+                            +------------------------+
                                                            |
                                                   Pass text to extract
                                                            v
+------------------+     Clean JSON Profile     +------------------------+
| FastAPI Backend  | <------------------------- | Gemini/LLM API Parser  |
|  (JSON/Database) |                            +------------------------+
+------------------+
```

1. **Scrape**: Use the Wikipedia API to retrieve the article text for the politician (specifically matching the `wikipedia` field in the `@unitedstates` dataset).
2. **Extract**: Pass the text (focusing on sections like "Political positions", "Voting record", and "Controversies") to an LLM (such as Gemini 1.5 Flash) with a structured prompt.
3. **Format**: Have the LLM return a clean JSON object containing a list of 4-5 verified stances and 2-3 controversies with context.
4. **Cache**: Store the extracted JSON locally in a database (SQLite or PostgreSQL) so it loads instantly for users.

---

### Strategy B: VoteSmart / OpenSecrets API Integration
If we prefer raw, data-driven stances over textual summaries:
1. **VoteSmart API**: Provides politician voting records and ratings from special interest groups (e.g. NRA, Sierra Club) on key issues.
2. **OpenSecrets API**: Tracks campaign contributions and industries funding each candidate, which serves as a proxy for their political alignments.

---

### Strategy C: Admin Curation & Crowdsourcing
Create a database table (`stances` and `controversies`) where team members or approved users can submit updates with news source links, creating a trusted, hand-curated library.

---

## 3. Code Cleanup Tasks
To keep the codebase clean, modular, and ready for real data:

* [x] **Task 1**: Delete the deprecated [mock_data.py](file:///D:/WebProjects/weseeyou/Backend/mock_data.py) file.
* [ ] **Task 2**: Create a local SQLite database configuration in the Backend directory to store real profiles once extracted.
* [ ] **Task 3**: Create a Python CLI script (`Backend/scripts/update_profiles.py`) that implements the Wikipedia + LLM extraction pipeline.
* [ ] **Task 4**: Create Pydantic schemas mapping stances and controversies to database tables.

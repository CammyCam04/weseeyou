# Feature Plan: Search and Profile Pages

This document outlines the step-by-step implementation plan for creating a basic politician search page and profile details page. We will use a proxy pattern where the Next.js frontend calls our FastAPI backend, and the backend fetches data from external APIs.

---

## Step 1: Define the Data Model (TypeScript & Python)
To keep the frontend and backend aligned, we will establish a clean, minimal data contract representing a politician.

### Politician Data Structure:
```json
{
  "id": "A000360",
  "first_name": "Lamar",
  "last_name": "Alexander",
  "title": "Senator",
  "state": "TN",
  "party": "R",
  "date_of_birth": "1940-07-03",
  "gender": "M",
  "twitter_account": "LamarAlexander",
  "facebook_account": "senatorlamaralexander",
  "youtube_account": "lamaralexander",
  "url": "https://www.alexander.senate.gov/public",
  "next_election": "2020",
  "profile_image_url": "https://images.wikidata.org/wiki/Special:FilePath/Lamar%20Alexander%20official%20portrait.jpg"
}
```

---

## Step 2: Select the Politician Data API
We have a few choices for fetching current politicians. For a minimal, clean, and reliable starting point:

1. **ProPublica Congress API** (Recommended for federal politicians):
   * **Pros**: Rich data on current members of the House and Senate, voting history, bills, and roles.
   * **Auth**: Requires a free API Key (issued instantly).
   * **Endpoint**: `/members/current/{chamber}/state/members.json`
2. **Wikidata API** (Recommended for biographical details and images):
   * **Pros**: No API key required, open database, covers state and local politicians as well as candidates.
3. **Google Civic Information API** (Recommended for search-by-address):
   * **Pros**: Finds representatives matching a specific physical address (from local school boards up to the presidency).
   * **Auth**: Requires a Google Developer API Key.

**Initial Plan**: We will start by mocking the data in our FastAPI backend to get the pages working first. Then, we will integrate the **ProPublica Congress API** or a web scraper.

---

## Step 3: Backend API Endpoints (FastAPI)
We will create two clean endpoints in FastAPI to support our frontend:

1. **Search Endpoint**:
   * `GET /api/politicians?query={name_or_state}`
   * Returns a list of matching politicians (id, name, party, state, title, image).
2. **Details Endpoint**:
   * `GET /api/politicians/{id}`
   * Returns full profile information (stances, affiliations, social media, contact info).

---

## Step 4: Frontend Pages & Routing (Next.js App Router)
We will use Next.js's App Router to define two routes:

1. **Search Page (`app/page.tsx` or `app/search/page.tsx`)**:
   * A clean search input bar.
   * Responsive list/grid of politician cards displaying names, states, parties, and basic titles.
2. **Profile Page (`app/profile/[id]/page.tsx`)**:
   * Dynamic route capturing the politician's unique ID.
   * Detailed dashboard style layout showing:
     * Bio & basic info.
     * Affiliations and next election year.
     * Social media links.

---

## Step-by-Step Implementation Steps

We will build this incrementally so you can inspect and approve each stage:

* [x] **Step 4.1**: Set up mock data and backend endpoints in FastAPI ([Backend/main.py](file:///D:/WebProjects/weseeyou/Backend/main.py)).
* [x] **Step 4.2**: Verify backend endpoints manually via Swagger docs (`http://127.0.0.1:8000/docs`).
* [x] **Step 4.3**: Create Next.js API client utility to fetch from our backend.
* [x] **Step 4.4**: Build the React Search component and styling in `page.module.scss`.
* [x] **Step 4.5**: Create the dynamic Profile page (`app/profile/[id]/page.tsx`) and its layout.
* [x] **Step 4.6**: Swap out mock backend data for the real ProPublica Congress API or scraping logic.

# region Imports
import urllib.parse
import xml.etree.ElementTree as ET
import requests
from typing import List
from models.politician import NewsArticleItem
# endregion

_news_cache = {}

def fetch_politician_news(name: str, state: str, limit: int = 5) -> List[NewsArticleItem]:
    """
    Fetches real-time, verified news articles for a politician using free Google News RSS XML feed.
    No API key required.
    """
    cache_key = f"{name.lower()}_{state.upper()}"
    if cache_key in _news_cache:
        return _news_cache[cache_key]

    articles = []
    headers = {"User-Agent": "WeSeeYouCivicApp/1.0 (contact@weseeyou.org)"}
    query_str = urllib.parse.quote(f'"{name}" {state} congress OR election')

    try:
        url = f"https://news.google.com/rss/search?q={query_str}&hl=en-US&gl=US&ceid=US:en"
        resp = requests.get(url, headers=headers, timeout=5)
        if resp.status_code == 200:
            root = ET.fromstring(resp.content)
            channel = root.find("channel")
            if channel is not None:
                for item in channel.findall("item"):
                    title_elem = item.find("title")
                    link_elem = item.find("link")
                    pubdate_elem = item.find("pubDate")
                    source_elem = item.find("source")

                    title = title_elem.text if title_elem is not None else "Civic Update"
                    link = link_elem.text if link_elem is not None else "#"
                    pub_date = pubdate_elem.text if pubdate_elem is not None else ""
                    source_name = source_elem.text if source_elem is not None else "News Outlet"

                    # Clean pub_date string
                    if pub_date:
                        parts = pub_date.split()
                        if len(parts) >= 4:
                            pub_date = " ".join(parts[1:4])

                    articles.append(
                        NewsArticleItem(
                            title=title,
                            source=source_name,
                            publication_date=pub_date,
                            url=link,
                            snippet=f"Latest news coverage regarding {name}"
                        )
                    )
                    if len(articles) >= limit:
                        break
    except Exception as ex:
        print(f"News RSS feed parse error for {name}: {ex}")

    _news_cache[cache_key] = articles
    return articles

# =============================================================================
# In-Memory Cache Service with TTL & HTTP Cache Control Header Generation
# =============================================================================
import time
from typing import Dict, Any, Optional
from fastapi import Response

class InMemoryCache:
    """High-performance in-memory TTL cache for API responses."""
    def __init__(self):
        self._store: Dict[str, Dict[str, Any]] = {}

    def get(self, key: str) -> Optional[Any]:
        if key in self._store:
            entry = self._store[key]
            if time.time() < entry["expires_at"]:
                return entry["data"]
            else:
                del self._store[key]
        return None

    def set(self, key: str, data: Any, ttl_seconds: int = 300) -> None:
        self._store[key] = {
            "data": data,
            "expires_at": time.time() + ttl_seconds
        }

    def clear(self) -> None:
        self._store.clear()

# Global cache instance
cache = InMemoryCache()

def apply_cache_headers(response: Response, max_age: int = 300, s_maxage: int = 3600):
    """Sets HTTP Cache-Control headers for browser & Cloudflare CDN caching."""
    response.headers["Cache-Control"] = f"public, max-age={max_age}, s-maxage={s_maxage}, stale-while-revalidate=86400"

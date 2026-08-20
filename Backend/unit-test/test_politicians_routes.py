import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_search_politicians_general():
    """Verify that politicians search returns a valid list of candidates."""
    response = client.get("/api/politicians?query=sanders")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        first = data[0]
        assert "first_name" in first
        assert "last_name" in first
        assert "id" in first or "bioguide_id" in first


def test_search_politicians_all():
    """Verify requesting politicians with no query returns full list and cache headers."""
    response = client.get("/api/politicians")
    assert response.status_code == 200
    assert "cache-control" in response.headers
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0


def test_get_invalid_politician_returns_404():
    """Verify requesting a non-existent bioguide ID returns 404 Not Found."""
    response = client.get("/api/politicians/INVALID_ID_999999")
    assert response.status_code == 404


def test_get_politician_by_id_and_cache():
    """Verify fetching a single politician profile returns data, headers, and caches."""
    response = client.get("/api/politicians/S000033")
    assert response.status_code == 200
    assert "cache-control" in response.headers
    data = response.json()
    assert data["id"] == "S000033"
    assert data["first_name"] == "Bernard" or data["first_name"] == "Bernie"
    assert "sponsored_legislation" in data
    assert "voted_legislation" in data

    # 2nd call should hit cache cleanly
    response_cached = client.get("/api/politicians/S000033")
    assert response_cached.status_code == 200
    assert response_cached.json()["id"] == "S000033"


def test_get_politician_finance():
    """Verify fetching campaign finance records returns structured data and cache headers."""
    response = client.get("/api/politicians/S000033/finance")
    assert response.status_code == 200
    assert "cache-control" in response.headers
    data = response.json()
    assert isinstance(data, dict)

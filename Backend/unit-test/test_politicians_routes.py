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
    """Verify requesting politicians with no query returns full list."""
    response = client.get("/api/politicians")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0


def test_get_invalid_politician_returns_404():
    """Verify requesting a non-existent bioguide ID returns 404 Not Found."""
    response = client.get("/api/politicians/INVALID_ID_999999")
    assert response.status_code == 404

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_get_all_committees():
    """Verify that committees endpoint returns a non-empty list of committees."""
    response = client.get("/api/committees")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    first = data[0]
    assert "id" in first
    assert "name" in first
    assert "type" in first


def test_filter_committees_by_chamber():
    """Verify chamber filter returns only matching chamber committees."""
    response = client.get("/api/committees?chamber=senate")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    for c in data:
        assert c["type"] == "senate"


def test_get_invalid_committee_returns_404():
    """Verify requesting a non-existent committee ID returns 404."""
    response = client.get("/api/committees/NON_EXISTENT_COMMITTEE_XYZ")
    assert response.status_code == 404

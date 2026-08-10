import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_list_judges():
    """Verify judges endpoint returns judicial roster."""
    response = client.get("/api/judges")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        first = data[0]
        assert "id" in first
        assert "first_name" in first
        assert "last_name" in first
        assert "title" in first


def test_get_invalid_judge_returns_404():
    """Verify non-existent judge returns 404."""
    response = client.get("/api/judges/INVALID_JUDGE_9999")
    assert response.status_code == 404

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_root_endpoint():
    """Verify that root endpoint responds with 200 OK and expected welcome message."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "political tracker" in data["message"].lower()


def test_openapi_schema_generation():
    """Verify that OpenAPI /openapi.json is generated without routing or schema errors."""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    assert schema["info"]["title"] == "We See You API"
    assert "/api/politicians" in schema["paths"]
    assert "/api/committees" in schema["paths"]

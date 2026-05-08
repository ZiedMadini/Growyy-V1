from fastapi.testclient import TestClient
import pytest


@pytest.fixture
def client():
    from main import app
    return TestClient(app)


def test_health_returns_ok(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "ollama" in data
    assert "simulation" in data

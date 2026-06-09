import pytest
from fastapi.testclient import TestClient
from backend.main import app, get_current_user

# Mocking authenticated user dependency
def mock_get_current_user():
    return {"id": "test-user-uuid-12345", "email": "test@example.com"}

app.dependency_overrides[get_current_user] = mock_get_current_user

client = TestClient(app)

def test_purchase_subapp():
    response = client.post(
        "/api/v1/subapps/purchase",
        json={"pid": "carbon-tracker-pro", "pin": "1234"}
    )
    assert response.status_code == 200
    assert "Successfully purchased sub-application carbon-tracker-pro" in response.json()["message"]

def test_verify_subapp():
    response = client.post(
        "/api/v1/subapps/verify",
        json={"pid": "carbon-tracker-pro", "pin": "1234"}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "authorized"
    assert response.json()["pid"] == "carbon-tracker-pro"

def test_carbon_logging():
    # Log clean transport entry
    response = client.post(
        "/api/v1/carbon/logs",
        json={"category": "transportation", "value": 15.5, "details": {"type": "electric_train"}}
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Carbon log added successfully"

    # Get logs
    response = client.get("/api/v1/carbon/logs")
    assert response.status_code == 200
    logs = response.json()
    assert len(logs) > 0
    assert logs[0]["category"] == "transportation"
    assert logs[0]["value"] == 15.5

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_carbon_logging():
    # Log clean transport entry
    response = client.post(
        "/api/v1/carbon/logs",
        json={"category": "Transportation", "value": 15.5, "details": {"type": "electric_train"}}
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Carbon log added successfully"
    assert response.json()["log"]["category"] == "Transportation"
    assert response.json()["log"]["value"] == 15.5

def test_get_carbon_logs():
    # Get logs
    response = client.get("/api/v1/carbon/logs")
    assert response.status_code == 200
    logs = response.json()
    assert len(logs) > 0
    # The first item should be our newly added log if tests run in sequence or the default mock db
    assert any(log["category"] == "Transportation" and log["value"] == 15.5 for log in logs)

def test_get_insights():
    response = client.get("/api/v1/carbon/insights")
    assert response.status_code == 200
    data = response.json()
    assert "insights" in data
    assert "total_emissions" in data
    assert len(data["insights"]) > 0

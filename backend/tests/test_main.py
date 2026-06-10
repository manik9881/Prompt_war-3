from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

# Helper headers for bypass authentication
BYPASS_HEADERS = {"X-Test-Bypass": "true"}
MOCK_TOKEN_HEADERS = {"Authorization": "Bearer mock-test-token"}

def test_auth_signup():
    response = client.post(
        "/api/v1/auth/signup",
        json={"email": "test@example.com", "password": "securepassword"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "user_id" in data
    assert data["message"] == "User registered successfully"

def test_carbon_logging_with_bypass():
    response = client.post(
        "/api/v1/carbon/logs",
        headers=BYPASS_HEADERS,
        json={"category": "Transportation", "value": 15.5, "details": {"type": "electric_train"}}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Carbon log added successfully"
    assert data["log"]["category"] == "Transportation"
    assert data["log"]["value"] == 15.5

def test_carbon_logging_with_mock_token():
    response = client.post(
        "/api/v1/carbon/logs",
        headers=MOCK_TOKEN_HEADERS,
        json={"category": "Energy", "value": 10.2, "details": {"source": "solar"}}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["log"]["category"] == "Energy"
    assert data["log"]["value"] == 10.2

def test_carbon_logging_unauthorized():
    response = client.post(
        "/api/v1/carbon/logs",
        json={"category": "Food", "value": 3.4}
    )
    assert response.status_code == 401

def test_get_carbon_logs():
    response = client.get("/api/v1/carbon/logs", headers=BYPASS_HEADERS)
    assert response.status_code == 200
    logs = response.json()
    assert len(logs) > 0
    assert any(log["category"] == "Transportation" and log["value"] == 15.5 for log in logs)

def test_get_insights():
    response = client.get("/api/v1/carbon/insights", headers=BYPASS_HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert "insights" in data
    assert "total_emissions" in data
    assert len(data["insights"]) > 0

def test_sub_app_purchase_and_verification():
    # 1. Purchase Carbon Tracker Pro
    purchase_payload = {"pid": "carbon-tracker-pro", "pin": "1234"}
    purchase_response = client.post(
        "/api/v1/subapps/purchase",
        headers=BYPASS_HEADERS,
        json=purchase_payload
    )
    assert purchase_response.status_code == 200
    assert purchase_response.json()["message"] == "Sub-application purchased successfully"

    # 2. Verify with valid PIN
    verify_response = client.post(
        "/api/v1/subapps/verify",
        headers=BYPASS_HEADERS,
        json=purchase_payload
    )
    assert verify_response.status_code == 200
    assert verify_response.json()["status"] == "authorized"

    # 3. Verify with invalid PIN
    invalid_verify_response = client.post(
        "/api/v1/subapps/verify",
        headers=BYPASS_HEADERS,
        json={"pid": "carbon-tracker-pro", "pin": "9999"}
    )
    assert invalid_verify_response.status_code == 401

def test_verify_nonexistent_sub_app():
    response = client.post(
        "/api/v1/subapps/verify",
        headers=BYPASS_HEADERS,
        json={"pid": "nonexistent-app", "pin": "1234"}
    )
    assert response.status_code == 401

from fastapi.testclient import TestClient
from unittest.mock import patch
from .main import app

def test_health_check():
    with TestClient(app) as client:
        response = client.get("/api/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}

@patch("app.main.generate_civic_assistance")
def test_chat_endpoint(mock_generate):
    mock_generate.return_value = "This is a mock assistant response."
    payload = {
        "query": "Where can I get Aadhaar card?",
        "history": [],
        "language": "en"
    }
    with TestClient(app) as client:
        response = client.post("/api/chat", json=payload)
        assert response.status_code == 200
        assert response.json() == {"response": "This is a mock assistant response."}

def test_services_catalog_endpoint():
    with TestClient(app) as client:
        response = client.get("/api/services")
        assert response.status_code == 200
        services = response.json()
        assert len(services) > 0
        assert any(s["name"] == "PM Kisan Samman Nidhi" for s in services)

def test_save_profile_and_complaint():
    citizen_payload = {
        "id": "test-citizen-id",
        "name": "Test User",
        "email": "test@demo.in",
        "age": 30,
        "occupation": "Farmer",
        "income_bracket": "50000"
    }
    with TestClient(app) as client:
        # 1. Create profile
        response = client.post("/api/profile", json=citizen_payload)
        assert response.status_code == 200
        assert response.json()["name"] == "Test User"

        # 2. File complaint
        import uuid
        unique_desc = f"Pipe broken near primary school {uuid.uuid4()}"
        complaint_payload = {
            "category": "Water Leakage",
            "description": unique_desc,
            "location": "Ward 4"
        }
        headers = {"Authorization": "Bearer test-token"}
        response = client.post("/api/complaints", json=complaint_payload, headers=headers)
        assert response.status_code == 200
        assert response.json()["category"] == "Water Leakage"
        assert response.json()["status"] == "Submitted"

        # 3. Retrieve complaints
        response = client.get("/api/complaints", headers=headers)
        assert response.status_code == 200
        complaints = response.json()
        assert len(complaints) > 0
        assert complaints[0]["category"] == "Water Leakage"

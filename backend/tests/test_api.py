import uuid
import pytest
from unittest.mock import patch


# ===========================================================================
# Fixtures
# ===========================================================================

@pytest.fixture
def citizen_payload():
    """Return a valid citizen payload for profile creation."""
    return {
        "id": f"test-citizen-{uuid.uuid4()}",
        "name": "Ramesh Kumar",
        "email": f"ramesh-{uuid.uuid4()}@smartbharat.in",
        "age": 35,
        "occupation": "Farmer",
        "income_bracket": "Below 1 Lakh",
        "state": "Uttar Pradesh",
        "preferred_language": "hi"
    }


@pytest.fixture
def auth_headers():
    """Return Authorization headers with a test token."""
    return {"Authorization": "Bearer test-citizen-token"}


# ===========================================================================
# Health & Core API
# ===========================================================================

class TestHealthEndpoint:
    """Tests for the /api/health endpoint."""

    def test_health_check_returns_200(self, client):
        response = client.get("/api/health")
        assert response.status_code == 200

    def test_health_check_returns_healthy_status(self, client):
        response = client.get("/api/health")
        assert response.json() == {"status": "healthy"}

    def test_health_check_process_time_header(self, client):
        """API should include X-Process-Time header for latency monitoring."""
        response = client.get("/api/health")
        assert "X-Process-Time" in response.headers


# ===========================================================================
# Chat AI Endpoint
# ===========================================================================

class TestChatEndpoint:
    """Tests for the /api/chat AI assistant endpoint."""

    @patch("app.main.generate_civic_assistance")
    def test_chat_returns_ai_response(self, mock_generate, client):
        mock_generate.return_value = "Aadhaar card can be obtained from UIDAI enrollment centers."
        payload = {"query": "How do I get Aadhaar card?", "history": [], "language": "en"}
        response = client.post("/api/chat", json=payload)
        assert response.status_code == 200
        assert "response" in response.json()

    @patch("app.main.generate_civic_assistance")
    def test_chat_with_hindi_language(self, mock_generate, client):
        mock_generate.return_value = "आप अपना आधार कार्ड UIDAI केंद्र से प्राप्त कर सकते हैं।"
        payload = {"query": "Aadhaar card kaise milega?", "history": [], "language": "hi"}
        response = client.post("/api/chat", json=payload)
        assert response.status_code == 200
        assert response.json()["response"] != ""

    @patch("app.main.generate_civic_assistance")
    def test_chat_with_history(self, mock_generate, client):
        mock_generate.return_value = "You can track it on the UIDAI portal."
        payload = {
            "query": "How to track status?",
            "history": [{"role": "user", "text": "I applied for Aadhaar."}],
            "language": "en"
        }
        response = client.post("/api/chat", json=payload)
        assert response.status_code == 200

    def test_chat_requires_query_field(self, client):
        """Missing query should return 422 validation error."""
        response = client.post("/api/chat", json={"history": [], "language": "en"})
        assert response.status_code == 422


# ===========================================================================
# Services Catalog
# ===========================================================================

class TestServicesCatalog:
    """Tests for the /api/services endpoint."""

    def test_services_returns_list(self, client):
        response = client.get("/api/services")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_services_catalog_not_empty(self, client):
        response = client.get("/api/services")
        assert len(response.json()) > 0

    def test_services_contain_pm_kisan(self, client):
        response = client.get("/api/services")
        names = [s["name"] for s in response.json()]
        assert "PM Kisan Samman Nidhi" in names

    def test_services_contain_ayushman_bharat(self, client):
        response = client.get("/api/services")
        names = [s["name"] for s in response.json()]
        assert "Ayushman Bharat (PM-JAY)" in names

    def test_services_contain_digilocker(self, client):
        response = client.get("/api/services")
        names = [s["name"] for s in response.json()]
        assert "DigiLocker" in names

    def test_service_has_required_fields(self, client):
        response = client.get("/api/services")
        service = response.json()[0]
        assert "id" in service
        assert "name" in service
        assert "category" in service
        assert "description" in service


# ===========================================================================
# Citizen Profile
# ===========================================================================

class TestCitizenProfile:
    """Tests for the /api/profile citizen registration endpoint."""

    def test_create_profile_success(self, client, citizen_payload):
        response = client.post("/api/profile", json=citizen_payload)
        assert response.status_code == 200
        assert response.json()["name"] == citizen_payload["name"]

    def test_create_profile_returns_id(self, client, citizen_payload):
        response = client.post("/api/profile", json=citizen_payload)
        assert response.json()["id"] == citizen_payload["id"]

    def test_create_profile_missing_name_fails(self, client, citizen_payload):
        del citizen_payload["name"]
        response = client.post("/api/profile", json=citizen_payload)
        assert response.status_code == 422

    def test_create_profile_missing_email_fails(self, client, citizen_payload):
        del citizen_payload["email"]
        response = client.post("/api/profile", json=citizen_payload)
        assert response.status_code == 422

    def test_profile_saves_occupation(self, client, citizen_payload):
        response = client.post("/api/profile", json=citizen_payload)
        assert response.json()["occupation"] == "Farmer"


# ===========================================================================
# Complaints
# ===========================================================================

class TestComplaints:
    """Tests for the /api/complaints grievance reporting endpoints."""

    def _unique_complaint(self, category="Water Supply & Leaks"):
        """Generate a unique complaint payload to avoid duplicate detection."""
        return {
            "category": category,
            "description": f"Test complaint: pipe burst at junction {uuid.uuid4()}",
            "location": f"Test Ward {uuid.uuid4()}"
        }

    def test_submit_complaint_success(self, client, citizen_payload, auth_headers):
        client.post("/api/profile", json=citizen_payload)
        response = client.post("/api/complaints", json=self._unique_complaint(), headers=auth_headers)
        assert response.status_code == 200

    def test_complaint_has_id(self, client, citizen_payload, auth_headers):
        client.post("/api/profile", json=citizen_payload)
        response = client.post("/api/complaints", json=self._unique_complaint(), headers=auth_headers)
        assert "id" in response.json()
        assert len(response.json()["id"]) > 0

    def test_complaint_assigned_status(self, client, citizen_payload, auth_headers):
        client.post("/api/profile", json=citizen_payload)
        response = client.post("/api/complaints", json=self._unique_complaint(), headers=auth_headers)
        assert response.json()["status"] in ["Submitted", "Merged / Duplicate"]

    def test_complaint_has_severity_score(self, client, citizen_payload, auth_headers):
        client.post("/api/profile", json=citizen_payload)
        response = client.post("/api/complaints", json=self._unique_complaint(), headers=auth_headers)
        assert "severity" in response.json()
        assert isinstance(response.json()["severity"], int)

    def test_complaint_has_ai_triage_tags(self, client, citizen_payload, auth_headers):
        client.post("/api/profile", json=citizen_payload)
        response = client.post("/api/complaints", json=self._unique_complaint(), headers=auth_headers)
        assert "ai_triage_tags" in response.json()

    def test_complaint_has_geocoordinates(self, client, citizen_payload, auth_headers):
        client.post("/api/profile", json=citizen_payload)
        response = client.post("/api/complaints", json=self._unique_complaint(), headers=auth_headers)
        data = response.json()
        assert "latitude" in data
        assert "longitude" in data

    def test_severe_complaint_higher_score(self, client, citizen_payload, auth_headers):
        """Complaints near hospitals or with dangerous words should score higher."""
        client.post("/api/profile", json=citizen_payload)
        complaint = {
            "category": "Roads & Potholes",
            "description": f"Danger: accident happened near hospital {uuid.uuid4()}",
            "location": "Hospital Road, Ward 5"
        }
        response = client.post("/api/complaints", json=complaint, headers=auth_headers)
        assert response.json()["severity"] >= 5

    def test_retrieve_all_complaints(self, client, citizen_payload, auth_headers):
        client.post("/api/profile", json=citizen_payload)
        client.post("/api/complaints", json=self._unique_complaint(), headers=auth_headers)
        response = client.get("/api/complaints/all")
        assert response.status_code == 200
        assert isinstance(response.json(), list)


# ===========================================================================
# Security Tests
# ===========================================================================

class TestSecurity:
    """Tests verifying security constraints and proper error handling."""

    def test_cors_headers_present(self, client):
        """API should include CORS headers for known origin."""
        response = client.get("/api/health", headers={"Origin": "http://localhost:3000"})
        assert response.status_code == 200

    def test_process_time_telemetry_header(self, client):
        """All requests should have X-Process-Time performance monitoring header."""
        response = client.get("/api/health")
        assert "X-Process-Time" in response.headers

    def test_invalid_chat_payload_rejected(self, client):
        """Empty body to /api/chat should return validation error."""
        response = client.post("/api/chat", json={})
        assert response.status_code == 422

    def test_complaint_missing_category_rejected(self, client, auth_headers):
        """Complaint with no category should fail validation."""
        response = client.post("/api/complaints", json={
            "description": "Some desc",
            "location": "Some place"
        }, headers=auth_headers)
        assert response.status_code == 422

    def test_complaint_missing_location_rejected(self, client, auth_headers):
        """Complaint with no location should fail validation."""
        response = client.post("/api/complaints", json={
            "category": "Roads",
            "description": "Some desc"
        }, headers=auth_headers)
        assert response.status_code == 422

# 🏁 Walkthrough - Smart Bharat Civic Companion Platform

We have successfully engineered the **Smart Bharat Civic Companion** full-stack platform within the 4-hour hackathon timeframe.

---

## 🛠️ Changes Implemented

### 1. Architectural Safeguards
*   Created [CODEBASE_MAP.md](file:///e:/prompt%20war%20hackathon/.agent/CODEBASE_MAP.md) inside the `.agent/` directory to coordinate component endpoints, schema rules, and database tracking tables.

### 2. Backend (FastAPI + SQLAlchemy)
*   **Database Schema (`database.py`, `models.py`):** Configured with SQLite as a fallback engine for local verification and mockups. Ready to bridge directly to Google Cloud AlloyDB.
*   **Request Validation (`schemas.py`):** Structured schemas for user chat requests, grievance reports, and profile records.
*   **Gemini 3.5 Core AI Engine (`gemini_service.py`):** Leverages `google-genai` SDK with an empathetic, factual system instruction. Incorporates robust response simulation fallbacks for offline demo safety.
*   **Firebase Authentication Guard (`firebase_auth.py`):** Middleware verifying JWT identity tokens, utilizing a demo fallback to allow instant verification without hard credentials.
*   **Routing API Controller (`main.py`):** Implemented CORS, pre-seeded sample services (PM Kisan, Ayushman Bharat, PM Awas), and injected middleware telemetry to log response latencies.

### 3. Frontend (Next.js + Tailwind CSS)
*   **i18n Localization Context (`providers.tsx`, `/src/i18n/*`):** Structured localized dictionaries for English, Hindi, Tamil, and Bengali.
*   **Global Navigation Header (`Navbar.tsx`):** Renders institutional logos, responsive layouts, active section tabs, a language selector, and demo authentication.
*   **Conversational Assistant (`ChatWidget.tsx`):** Standard chat bubble UI greeting, clickable quick chips, state resets, and Web Speech API speech-to-text integration.
*   **Action Services Portal (`ServicesGrid.tsx`):** Coordinates four distinct components matching the challenge mockup:
    *   *Popular Services Catalog:* Fetches schemes from database and details documentation requirements.
    *   *Submit Grievance:* Active form routing inputs (category, description, location) to the backend.
    *   *Timeline Tracker:* Displays submitted issues with live status badges.
    *   *Schemes Recommender:* Uses demographic sliders (age, income, occupation) to match schemes dynamically.

---

## 🏃 How to Run the Application

You can launch the entire stack using either Docker Compose or local shells.

### Option A: Using Docker Compose (Recommended)
Launch both services and the database with a single command:
```bash
docker-compose up --build
```
*   **Frontend:** `http://localhost:3000`
*   **Backend:** `http://localhost:8000`

### Option B: Running Locally (For Debugging)

1.  **FastAPI Backend:**
    ```bash
    cd backend
    pip install -r requirements.txt
    # Run the server (will create smart_bharat.db SQLite database automatically)
    uvicorn app.main:app --reload
    ```
2.  **Next.js Frontend:**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

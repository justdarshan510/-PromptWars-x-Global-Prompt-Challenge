# 📋 Smart Bharat – 4-Hour Technical Implementation Plan

This document outlines the step-by-step file structure, database schema, API design, and frontend layout required to build the **Smart Bharat Civic Companion** platform within a 4-hour hackathon window.

---

## 📂 Monorepo Directory Structure

We will structure the project as a decoupled monorepo to separate concerns and allow parallel development:

```
smart-bharat/
├── .agent/
│   └── CODEBASE_MAP.md        # AI Memory Bank & Anti-Regression Ledger
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI Entrypoint & Routing
│   │   ├── database.py        # SQLAlchemy & AlloyDB Connection
│   │   ├── models.py          # SQLAlchemy Models
│   │   ├── schemas.py         # Pydantic Validation Schemas
│   │   ├── firebase_auth.py   # Firebase Middleware & JWT Verification
│   │   └── gemini_service.py  # Gemini 3.5 Flash RAG & Translation Logic
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx     # Root Layout, Fonts, Global CSS
│   │   │   ├── page.tsx       # Landing Page & Chat Mockup
│   │   │   └── providers.tsx  # Auth & i18n Providers
│   │   ├── components/
│   │   │   ├── Navbar.tsx     # Nav bar, Logo, Language Selector
│   │   │   ├── ChatWidget.tsx # Floating Chat UI (Bilingual, Voice)
│   │   │   ├── ServicesGrid.tsx # 4 Action Cards & Service Catalog
│   │   │   └── Tracker.tsx    # Complaint tracking timeline
│   │   ├── i18n/
│   │   │   ├── en.json        # English translation bundle
│   │   │   ├── hi.json        # Hindi translation bundle
│   │   │   ├── ta.json        # Tamil translation bundle
│   │   │   └── bn.json        # Bengali translation bundle
│   │   └── styles/
│   │       └── globals.css
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml
```

---

## 🗄️ Phase 1: Database Schema (SQLAlchemy/AlloyDB)
File: `backend/app/models.py`

We require four tables to represent citizens, complaints, services, and document criteria:

```sql
-- Citizens Table
CREATE TABLE citizens (
    id VARCHAR(255) PRIMARY KEY, -- Firebase UID
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    preferred_language VARCHAR(50) DEFAULT 'en',
    age INTEGER,
    state VARCHAR(100),
    income_bracket VARCHAR(100),
    occupation VARCHAR(100)
);

-- Complaints Table
CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    citizen_id VARCHAR(255) REFERENCES citizens(id),
    category VARCHAR(100) NOT NULL, -- Road, Water, Sanitation, etc.
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'Submitted', -- Submitted, In Progress, Resolved
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Services Catalog
CREATE TABLE services_catalog (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    eligibility_criteria JSONB,
    required_documents JSONB
);
```

---

## 🤖 Phase 2: Backend API & AI Integration (FastAPI)

### 1. The Core AI Integration
File: `backend/app/gemini_service.py`

This service runs Gemini 3.5 Flash using the `google-genai` SDK. It parses public scheme data and formats citizen guides.

```python
import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

def generate_civic_assistance(query: str, history: list, language: str) -> str:
    system_instruction = (
        "You are NagrikAI, an empathetic, factual, and highly accurate Indian civic companion. "
        "Your mission is to simplify complex government scheme criteria and bureaucratic jargon. "
        f"You must respond strictly in the requested language: {language}. "
        "If the user asks about eligibility, explain clearly. "
        "Keep responses structured with bullet points. Cite official sources where possible."
    )
    
    response = client.models.generate_content(
        model='gemini-3.5-flash',
        contents=history + [query],
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.2,
        ),
    )
    return response.text
```

### 2. API Endpoints
File: `backend/app/main.py`

We expose six critical routes:

| Route | Method | Description | Auth Required |
|---|---|---|---|
| `/api/chat` | `POST` | Process conversation queries with Gemini 3.5 | No (Optional) |
| `/api/profile` | `POST` / `GET` | Save/Fetch citizen profile for customization | Yes |
| `/api/complaints` | `POST` | File a new civic complaint | Yes |
| `/api/complaints/{id}` | `GET` | Track complaint status timeline | No |
| `/api/services` | `GET` | Fetch service catalog and filtered schemes | No |

---

## 🎨 Phase 3: Frontend Layout & UI/UX (Next.js & Tailwind)

### 1. Landing Page Composition
File: `frontend/src/app/page.tsx`

The layout will render the visual items exactly matching the challenge mockup:

*   **Navbar (`Navbar.tsx`):**
    *   Left side: "Smart Bharat" branding logo + Indian flag asset.
    *   Center: Navigation links (`Home`, `Services`, `My Complaints`, `Resources`).
    *   Right side: Language Selector dropdown (English, Hindi, Tamil, Bengali) + Profile Avatar.
*   **Hero Section:**
    *   Header: *"Empowering Citizens. Simplifying Governance."*
    *   Subtext: *"AI-powered assistance for a smarter and transparent India."*
*   **Search/Chat Hub (`ChatWidget.tsx`):**
    *   Greeting: *"Hello! 👋 How can I help you today?"*
    *   Sub-prompt: *"Ask me anything about government services, schemes, documents, or report an issue."*
    *   Suggested chip pills (clickable):
        1.  *"How to get a Birth Certificate?"*
        2.  *"Documents required for PM Awas Yojana?"*
        3.  *"How to report a broken street light?"*
*   **Action Cards Grid (`ServicesGrid.tsx`):**
    *   `Popular Services` 🏛️ (Navigates to services list)
    *   `Report an Issue` 🚨 (Opens complaint popup)
    *   `Track Complaints` 📋 (Scrolls to tracking view)
    *   `Schemes for You` 👥 (Triggers AI profile personalization)

---

## 🌐 i18n Localization Bundles
File: `frontend/src/i18n/hi.json` (Hindi Translation Example)

```json
{
  "nav": {
    "home": "होम",
    "services": "सेवाएं",
    "complaints": "मेरी शिकायतें",
    "resources": "संसाधन"
  },
  "hero": {
    "welcome": "नमस्ते! 👋 आज मैं आपकी क्या सहायता कर सकता हूँ?",
    "sub": "सरकारी सेवाओं, योजनाओं, दस्तावेजों के बारे में पूछें, या किसी समस्या की रिपोर्ट करें।"
  },
  "cards": {
    "popular": "लोकप्रिय सेवाएं",
    "report": "समस्या की रिपोर्ट करें",
    "track": "शिकायत ट्रैक करें",
    "schemes": "आपके लिए योजनाएं"
  }
}
```

---

## ⚙️ Anti-Regression Configuration
File: `.agent/CODEBASE_MAP.md`

We will write this file first to ensure the development agent does not lose context or delete critical files during multi-file refactors.

```markdown
# Smart Bharat - Technical Map

## Core Integrations
* Frontend Target: http://localhost:3000
* Backend Target: http://localhost:8000
* Gemini Model: gemini-3.5-flash
* Auth: Firebase Authentication

## Critical Rules
1. Never edit `backend/app/gemini_service.py` system instructions without updating this map.
2. Ensure the language translation files (en.json, hi.json, etc.) contain matching JSON keys.
3. Keep the complaint tracker timeline states matching: `['Submitted', 'In Progress', 'Resolved']`.
```

---

## 🚀 Telemetry & Verification (Hour 4)

1.  **Latency Tracking:** Use standard FastAPI middleware to track and output response latency for every `/api/chat` call.
2.  **Visual Check:** Run Chrome DevTools through Antigravity's browser subagent to verify the exact padding, alignment, and responsiveness of the navbar and 4-card grid across mobile and desktop.
3.  **Deployment Verification:** Run a dry-run Docker build:
    ```bash
    docker-compose build
    ```

from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Any
from datetime import datetime

class CitizenBase(BaseModel):
    name: str
    email: str
    preferred_language: Optional[str] = "en"
    age: Optional[int] = None
    state: Optional[str] = None
    income_bracket: Optional[str] = None
    occupation: Optional[str] = None

class CitizenCreate(CitizenBase):
    id: str  # Firebase UID

class CitizenResponse(CitizenBase):
    id: str
    model_config = ConfigDict(from_attributes=True)

class ComplaintBase(BaseModel):
    category: str
    description: str
    location: str
    image_url: Optional[str] = None

class ComplaintCreate(ComplaintBase):
    citizen_id: Optional[str] = None

class ComplaintResponse(ComplaintBase):
    id: str
    citizen_id: Optional[str]
    status: str
    severity: int
    ai_triage_tags: Optional[str]
    is_duplicate: int
    latitude: Optional[str]
    longitude: Optional[str]
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ServiceCatalogResponse(BaseModel):
    id: int
    name: str
    category: str
    description: str
    eligibility_criteria: Optional[Any] = None
    required_documents: Optional[Any] = None
    model_config = ConfigDict(from_attributes=True)

class ChatRequest(BaseModel):
    query: str
    history: List[dict] = []
    language: str = "en"

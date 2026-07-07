import uuid
from sqlalchemy import Column, String, Integer, Text, ForeignKey, DateTime, JSON
from sqlalchemy.sql import func
from .database import Base

class Citizen(Base):
    __tablename__ = "citizens"
    
    id = Column(String(255), primary_key=True)  # Firebase UID
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    preferred_language = Column(String(50), default="en")
    age = Column(Integer, nullable=True)
    state = Column(String(100), nullable=True)
    income_bracket = Column(String(100), nullable=True)
    occupation = Column(String(100), nullable=True)

class Complaint(Base):
    __tablename__ = "complaints"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    citizen_id = Column(String(255), ForeignKey("citizens.id"), nullable=True)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String(255), nullable=False)
    status = Column(String(50), default="Submitted")  # Submitted, In Progress, Resolved
    image_url = Column(Text, nullable=True)
    severity = Column(Integer, default=1)
    ai_triage_tags = Column(String(255), nullable=True)
    is_duplicate = Column(Integer, default=0)
    latitude = Column(String(50), nullable=True)
    longitude = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

class ServiceCatalog(Base):
    __tablename__ = "services_catalog"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    eligibility_criteria = Column(JSON, nullable=True)
    required_documents = Column(JSON, nullable=True)

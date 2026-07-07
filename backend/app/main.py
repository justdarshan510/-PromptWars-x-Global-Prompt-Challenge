from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import time

from .database import engine, Base, get_db
from .models import Citizen, Complaint, ServiceCatalog
from .schemas import (
    ChatRequest, CitizenCreate, CitizenResponse, 
    ComplaintCreate, ComplaintResponse, ServiceCatalogResponse
)
from .firebase_auth import get_current_user_id
from .gemini_service import generate_civic_assistance

# Create SQLite database tables on startup automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Smart Bharat API", version="1.0.0")

# Enable CORS configuration for frontend client integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pre-seed Database
@app.on_event("startup")
def seed_database():
    db = next(get_db())
    try:
        if db.query(ServiceCatalog).count() == 0:
            services = [
                ServiceCatalog(
                    name="PM Kisan Samman Nidhi",
                    category="Agriculture",
                    description="Income support of Rs. 6000 per year in three equal installments to small and marginal farmer families.",
                    eligibility_criteria={"min_age": 18, "occupation": "Farmer", "landholding": "<= 2 hectares"},
                    required_documents=["Aadhaar Card", "Land Ownership Documents", "Bank Account Details"]
                ),
                ServiceCatalog(
                    name="Ayushman Bharat (PM-JAY)",
                    category="Health",
                    description="Provides health cover of Rs. 5 Lakhs per family per year for secondary and tertiary care hospitalization.",
                    eligibility_criteria={"economic_status": "Low Income / SECC Database"},
                    required_documents=["Aadhaar Card", "Ration Card", "Income Certificate"]
                ),
                ServiceCatalog(
                    name="PM Awas Yojana (PMAY)",
                    category="Housing",
                    description="Provides affordable housing with a subsidy on interest rates for home loans.",
                    eligibility_criteria={"has_pucca_house": False},
                    required_documents=["Aadhaar Card", "Voter ID", "Address Proof", "Affidavit"]
                ),
                ServiceCatalog(
                    name="DigiLocker",
                    category="Identity",
                    description="Access authentic digital documents anytime, anywhere from original issuers.",
                    eligibility_criteria={},
                    required_documents=["Aadhaar Card"]
                )
            ]
            db.bulk_save_objects(services)
            db.commit()
    except Exception as e:
        print(f"Error seeding database: {e}")

# Performance latency telemetry middleware
@app.middleware("http")
async def add_process_time_header(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    print(f"Path: {request.url.path} | Latency: {process_time:.4f}s")
    return response

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

@app.post("/api/chat")
def chat_endpoint(request: ChatRequest):
    response_text = generate_civic_assistance(
        query=request.query,
        history=request.history,
        language=request.language
    )
    return {"response": response_text}

@app.post("/api/profile", response_model=CitizenResponse)
def save_profile(profile: CitizenCreate, db: Session = Depends(get_db)):
    db_citizen = db.query(Citizen).filter(Citizen.id == profile.id).first()
    if db_citizen:
        for key, value in profile.dict().items():
            setattr(db_citizen, key, value)
    else:
        db_citizen = Citizen(**profile.dict())
        db.add(db_citizen)
    db.commit()
    db.refresh(db_citizen)
    return db_citizen

@app.get("/api/profile", response_model=CitizenResponse)
def get_profile(uid: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    db_citizen = db.query(Citizen).filter(Citizen.id == uid).first()
    if not db_citizen:
        db_citizen = Citizen(id=uid, name="Demo Citizen", email="citizen@demo.in")
        db.add(db_citizen)
        db.commit()
        db.refresh(db_citizen)
    return db_citizen

import difflib
import random

@app.post("/api/complaints", response_model=ComplaintResponse)
def create_complaint(complaint: ComplaintCreate, uid: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    # 1. Automated Triage (Severity Calculation)
    severity_score = 3
    desc_lower = complaint.description.lower()
    loc_lower = complaint.location.lower()
    
    # Priority keywords
    if "pothole" in desc_lower: severity_score += 1
    if "flood" in desc_lower or "water logging" in desc_lower: severity_score += 2
    if "danger" in desc_lower or "hazard" in desc_lower: severity_score += 2
    if "accident" in desc_lower or "injured" in desc_lower: severity_score += 3
    if "wire" in desc_lower or "electricity" in desc_lower: severity_score += 2
    if "contamination" in desc_lower or "toxic" in desc_lower: severity_score += 3
    
    # Proximity risk factors
    if "school" in loc_lower or "college" in loc_lower: severity_score += 2
    if "hospital" in loc_lower or "clinic" in loc_lower: severity_score += 3
    if "metro" in loc_lower or "station" in loc_lower: severity_score += 2
    if "highway" in loc_lower or "main road" in loc_lower: severity_score += 2
    
    severity_score = min(severity_score, 10)
    
    # 2. Duplicate Detection
    is_duplicate_flag = 0
    recent_complaints = db.query(Complaint).order_by(Complaint.created_at.desc()).limit(50).all()
    for rc in recent_complaints:
        # Match similarity in description
        similarity = difflib.SequenceMatcher(None, desc_lower, rc.description.lower()).ratio()
        if similarity > 0.75 and rc.category == complaint.category:
            is_duplicate_flag = 1
            break
            
    # 3. Computer Vision Simulation & Triage Tagging
    vision_tags = []
    if complaint.image_url:
        vision_tags.append("vision-analyzed")
    if "road" in desc_lower or "pothole" in desc_lower:
        vision_tags.append("surface-damage")
    if "water" in desc_lower or "leak" in desc_lower:
        vision_tags.append("plumbing-leak")
    if "wire" in desc_lower or "dark" in desc_lower or "light" in desc_lower:
        vision_tags.append("electrical-hazard")
    if "garbage" in desc_lower or "dump" in desc_lower:
        vision_tags.append("waste-hazard")
        
    ai_tags_str = ", ".join(vision_tags) if vision_tags else "general-civic"
    
    # 4. Auto Geocoding Simulation (Delhi NCR boundary box)
    # Using hash of location to get consistent lat/lng for identical location strings
    loc_hash = hash(complaint.location)
    random.seed(loc_hash)
    lat_val = str(round(28.5200 + random.random() * (28.6800 - 28.5200), 5))
    lng_val = str(round(77.1000 + random.random() * (77.3000 - 77.1000), 5))
    
    db_complaint = Complaint(
        citizen_id=uid,
        category=complaint.category,
        description=complaint.description,
        location=complaint.location,
        image_url=complaint.image_url,
        severity=severity_score,
        ai_triage_tags=ai_tags_str,
        is_duplicate=is_duplicate_flag,
        latitude=lat_val,
        longitude=lng_val,
        status="Submitted" if is_duplicate_flag == 0 else "Merged / Duplicate"
    )
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    return db_complaint

@app.get("/api/complaints", response_model=List[ComplaintResponse])
def get_complaints(uid: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    return db.query(Complaint).filter(Complaint.citizen_id == uid).all()

@app.get("/api/complaints/all", response_model=List[ComplaintResponse])
def get_all_complaints(db: Session = Depends(get_db)):
    return db.query(Complaint).all()

@app.get("/api/complaints/{id}", response_model=ComplaintResponse)
def get_complaint_status(id: str, db: Session = Depends(get_db)):
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint

@app.get("/api/services", response_model=List[ServiceCatalogResponse])
def list_services(db: Session = Depends(get_db)):
    return db.query(ServiceCatalog).all()

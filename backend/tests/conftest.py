"""conftest.py - Shared pytest fixtures using isolated in-memory database."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.models import ServiceCatalog
from app.main import app


# Create an isolated in-memory SQLite engine for tests
TEST_DATABASE_URL = "sqlite://"  # In-memory database

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,  # Single connection shared across threads — safe for tests
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    """Override DB dependency to use in-memory test database."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def _seed_services(db):
    """Seed government services catalog into the test database."""
    if db.query(ServiceCatalog).count() > 0:
        return
    services = [
        ServiceCatalog(
            name="PM Kisan Samman Nidhi",
            category="Agriculture",
            description="Income support of Rs. 6000 per year to small and marginal farmer families.",
            eligibility_criteria={"min_age": 18, "occupation": "Farmer"},
            required_documents=["Aadhaar Card", "Land Ownership Documents", "Bank Account Details"]
        ),
        ServiceCatalog(
            name="Ayushman Bharat (PM-JAY)",
            category="Healthcare",
            description="Health insurance of Rs. 5 lakh per family per year for BPL families.",
            eligibility_criteria={"income": "Below Poverty Line"},
            required_documents=["Aadhaar Card", "Ration Card", "Income Certificate"]
        ),
        ServiceCatalog(
            name="DigiLocker",
            category="Digital Services",
            description="Secure digital document wallet for citizens.",
            eligibility_criteria={"min_age": 18},
            required_documents=["Aadhaar Card", "Mobile Number"]
        ),
        ServiceCatalog(
            name="PM Awas Yojana (Gramin)",
            category="Housing",
            description="Financial assistance for rural housing construction.",
            eligibility_criteria={"residence": "Rural", "income": "Below 3 Lakh"},
            required_documents=["Aadhaar Card", "BPL Certificate", "Bank Passbook"]
        ),
    ]
    db.add_all(services)
    db.commit()


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Create all tables in the in-memory database and seed once per test session."""
    Base.metadata.create_all(bind=test_engine)
    app.dependency_overrides[get_db] = override_get_db
    # Seed the database once
    db = TestingSessionLocal()
    try:
        _seed_services(db)
    finally:
        db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)
    app.dependency_overrides.clear()


@pytest.fixture(scope="session")
def client(setup_test_database):
    """Session-scoped client using the test in-memory database."""
    with TestClient(app) as c:
        yield c

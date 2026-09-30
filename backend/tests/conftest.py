import os
# Ensure test environment is explicitly isolated before app modules load
os.environ["ENVIRONMENT"] = "test"
os.environ["TEST_DATABASE_URL"] = "sqlite:///./test_grievancegrid.db"

import pytest
from app.database import engine, Base, SessionLocal
from app.seed import seed_data_if_empty

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_data_if_empty(db)
    finally:
        db.close()
    yield
    # Cleanup after session
    Base.metadata.drop_all(bind=engine)

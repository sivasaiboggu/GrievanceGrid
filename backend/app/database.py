import time
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

db_url = settings.active_db_url

# Configure database connectivity
connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}

engine = create_engine(
    db_url, 
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def verify_and_init_db(max_retries: int = 5, retry_interval: float = 1.0):
    """
    Ensure database is reachable before initializing tables and extensions.
    Provides startup retry resilience for Docker orchestration and clear actionable error messages.
    """
    if db_url.startswith("sqlite"):
        Base.metadata.create_all(bind=engine)
        return

    connected = False
    last_err = None
    for attempt in range(1, max_retries + 1):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1;"))
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                conn.commit()
            connected = True
            break
        except Exception as e:
            last_err = e
            if attempt < max_retries:
                time.sleep(retry_interval)

    if not connected:
        print("\n" + "=" * 72)
        print("[DATABASE ERROR] PostgreSQL is unavailable on localhost:5432.")
        print("Start the database service and retry:")
        print("  docker compose up -d db")
        print(f"Details: {last_err}")
        print("=" * 72 + "\n")
        raise RuntimeError(
            "PostgreSQL is unavailable. Start the database service with 'docker compose up -d db' and retry."
        )

    # Create all defined model tables
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

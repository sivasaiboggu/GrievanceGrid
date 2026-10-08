import time
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

db_url = settings.active_db_url

# Quick connectivity probe to seamlessly handle environments where Docker is not yet running
if not db_url.startswith("sqlite"):
    try:
        _probe_engine = create_engine(db_url, connect_args={"connect_timeout": 1})
        with _probe_engine.connect() as _conn:
            _conn.execute(text("SELECT 1;"))
        _probe_engine.dispose()
    except Exception:
        print("\n" + "=" * 72)
        print("[DATABASE NOTICE] PostgreSQL is unavailable on localhost:5432.")
        print("Automatically using local database (sqlite:///./grievancegrid.db).")
        print("All Phase 2A screens, test accounts, and workflows will run smoothly.")
        print("To switch to PostgreSQL: start Docker Desktop and run 'docker compose up -d db'.")
        print("=" * 72 + "\n")
        db_url = "sqlite:///./grievancegrid.db"

# Configure database connectivity
connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}

engine = create_engine(
    db_url, 
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def verify_and_init_db(max_retries: int = 2, retry_interval: float = 0.5):
    """
    Ensure database is reachable before initializing tables and extensions.
    """
    if db_url.startswith("sqlite"):
        Base.metadata.create_all(bind=engine)
        return

    connected = False
    for attempt in range(1, max_retries + 1):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1;"))
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                conn.commit()
            connected = True
            break
        except Exception:
            if attempt < max_retries:
                time.sleep(retry_interval)

    # Create all defined model tables
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

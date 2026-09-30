import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "GrievanceGrid Civic Resolution Platform"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "grievancegrid_secure_jwt_secret_token_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Authoritative Application Database: PostgreSQL + PostGIS + pgvector
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://grievancegrid:grievancegrid_secure_password_2026@127.0.0.1:5432/grievancegrid"
    )

    # Isolated Testing Database (strictly for CI/unit test execution)
    TEST_DATABASE_URL: str = os.getenv(
        "TEST_DATABASE_URL",
        "sqlite:///./test_grievancegrid.db"
    )

    # S3 Object Storage (MinIO / AWS S3 compatible)
    S3_ENDPOINT_URL: str = os.getenv("S3_ENDPOINT_URL", "")
    S3_ACCESS_KEY: str = os.getenv("S3_ACCESS_KEY", "")
    S3_SECRET_KEY: str = os.getenv("S3_SECRET_KEY", "")
    S3_BUCKET_NAME: str = os.getenv("S3_BUCKET_NAME", "grievancegrid-evidence-vault")
    S3_REGION: str = os.getenv("S3_REGION", "us-east-1")

    # Redis for Celery background processing
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    @property
    def is_testing(self) -> bool:
        return "PYTEST_CURRENT_TEST" in os.environ or os.getenv("ENVIRONMENT") == "test"

    @property
    def active_db_url(self) -> str:
        if self.is_testing:
            return self.TEST_DATABASE_URL
        return self.DATABASE_URL

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

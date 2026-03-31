from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator
import os


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./internatlas.db"
    sync_database_url: str = "sqlite:///./internatlas.db"
    jwt_secret: str = "devsecret"
    jwt_algorithm: str = "HS256"
    vector_backend: str = "auto"
    gemini_api_key: str = ""

    model_config = SettingsConfigDict(env_file="../../.env", extra="ignore")

    @model_validator(mode="after")
    def fix_database_urls(self) -> "Settings":
        env_url = os.getenv("POSTGRES_URL") or os.getenv("DATABASE_URL") or self.database_url
        
        if env_url and not env_url.startswith("sqlite"):
            if env_url.startswith("postgres://"):
                self.database_url = env_url.replace("postgres://", "postgresql+asyncpg://", 1)
                self.sync_database_url = env_url.replace("postgres://", "postgresql://", 1)
            elif env_url.startswith("postgresql://") and not env_url.startswith("postgresql+asyncpg://"):
                self.database_url = env_url.replace("postgresql://", "postgresql+asyncpg://", 1)
                self.sync_database_url = env_url
            elif env_url.startswith("postgresql+asyncpg://"):
                self.database_url = env_url
                self.sync_database_url = env_url.replace("postgresql+asyncpg://", "postgresql://", 1)
            else:
                self.database_url = env_url
                self.sync_database_url = env_url

        return self

settings = Settings()

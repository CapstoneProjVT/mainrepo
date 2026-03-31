from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator
import os


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./internatlas.db"
    async_database_url: str = ""
    sync_database_url: str = "sqlite:///./internatlas.db"
    jwt_secret: str = "devsecret"
    jwt_algorithm: str = "HS256"
    vector_backend: str = "auto"
    gemini_api_key: str = ""

    model_config = SettingsConfigDict(env_file="../../.env", extra="ignore")

    @model_validator(mode="after")
    def fix_database_urls(self) -> "Settings":
        # If explicit ASYNC_DATABASE_URL is provided, use it directly
        if self.async_database_url:
            self.database_url = self.async_database_url

        # If SYNC_DATABASE_URL was provided via env, pydantic already loaded it.
        # Only run the normalization logic if we still have defaults (sqlite)
        # and there's a DATABASE_URL or POSTGRES_URL to derive from.
        env_url = os.getenv("POSTGRES_URL") or os.getenv("DATABASE_URL")

        if env_url and self.database_url.startswith("sqlite"):
            # Normalize into async URL
            if env_url.startswith("postgres://"):
                self.database_url = env_url.replace("postgres://", "postgresql+asyncpg://", 1)
            elif env_url.startswith("postgresql://") and "+asyncpg" not in env_url:
                self.database_url = env_url.replace("postgresql://", "postgresql+asyncpg://", 1)
            elif env_url.startswith("postgresql+asyncpg://"):
                self.database_url = env_url
            else:
                self.database_url = env_url

        if env_url and self.sync_database_url.startswith("sqlite"):
            # Normalize into sync URL
            if env_url.startswith("postgres://"):
                self.sync_database_url = env_url.replace("postgres://", "postgresql://", 1)
            elif env_url.startswith("postgresql+asyncpg://"):
                self.sync_database_url = env_url.replace("postgresql+asyncpg://", "postgresql://", 1)
            elif env_url.startswith("postgresql://"):
                self.sync_database_url = env_url
            else:
                self.sync_database_url = env_url

        return self

settings = Settings()

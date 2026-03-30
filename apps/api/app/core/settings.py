from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./internatlas.db"
    sync_database_url: str = "sqlite:///./internatlas.db"
    jwt_secret: str = "devsecret"
    jwt_algorithm: str = "HS256"
    vector_backend: str = "auto"
    gemini_api_key: str = ""

    model_config = SettingsConfigDict(env_file="../../.env", extra="ignore")

settings = Settings()

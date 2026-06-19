"""Application configuration loaded from environment variables."""

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── Database ─────────────────────────────────────────────
    database_url: str = (
        "postgresql+psycopg2://postgres:postgres@localhost:5432/odyssey"
    )
    db_echo: bool = False

    # ── JWT ──────────────────────────────────────────────────
    jwt_secret: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    # ── Upload ───────────────────────────────────────────────
    upload_dir: str = "uploads"
    max_avatar_size: int = 2 * 1024 * 1024  # 2 MB

    # ── CORS ─────────────────────────────────────────────────
    cors_origins: str = "http://localhost:3000"

    # ── LLM ──────────────────────────────────────────────────
    # Provider preset: "openai" | "deepseek" | "bailian" | "claude" | "custom"
    llm_provider: str = "openai"
    # API key for the chosen provider (required for assessment)
    llm_api_key: str = ""
    # Override the provider's default base URL (empty = use provider default)
    llm_base_url: str = ""
    # Model name — provider-specific (e.g. "gpt-4o", "deepseek-chat", "qwen-plus")
    llm_model: str = "gpt-4o"
    # Assessment temperature — 0.0 = deterministic
    llm_temperature: float = 0.0
    # Timeout per LLM call in seconds
    llm_timeout_seconds: int = 60

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @field_validator("database_url")
    @classmethod
    def normalize_db_url(cls, v: str) -> str:
        """Ensure DATABASE_URL uses psycopg2 driver and has no empty port."""
        if v.startswith("postgresql://"):
            v = "postgresql+psycopg2://" + v[len("postgresql://"):]
        # Fix empty port: protect scheme "://" then remove stray ":/"
        v = v.replace("://", "\x00S\x00", 1)
        v = v.replace(":/", "/")
        v = v.replace("\x00S\x00", "://", 1)
        return v


settings = Settings()

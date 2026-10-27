from typing import List, Optional
from urllib.parse import urlparse
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    lm_studio_base_url: str = Field(
        default="http://127.0.0.1:1234/v1",
        description="Base URL for the LM Studio OpenAI-compatible API"
    )
    lm_studio_model: str = Field(
        default="qwen/qwen3-vl-4b",
        description="The vision-language model ID loaded in LM Studio"
    )
    max_upload_mb: int = Field(
        default=10,
        description="Maximum allowed image upload size in megabytes"
    )
    lm_studio_api_key: Optional[str] = Field(
        default=None,
        description="Optional API key for LM Studio (if authentication is enabled)"
    )
    api_key: Optional[str] = Field(
        default=None,
        description="Optional API key for ZoodSle client authorization (X-ZoodSle-Key header)"
    )
    max_concurrency: int = Field(
        default=1,
        description="Maximum concurrent local vision model requests (protects local GPU/RAM)"
    )
    enforce_loopback_only: bool = Field(
        default=True,
        description="Restricts access to loopback clients (127.0.0.1, ::1) unless an API key is provided"
    )
    host: str = Field(default="127.0.0.1", description="Backend host binding")
    port: int = Field(default=8000, description="Backend port")
    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def is_local_endpoint(self) -> bool:
        """Determines if the configured AI endpoint points to a local address."""
        try:
            parsed = urlparse(self.lm_studio_base_url)
            hostname = (parsed.hostname or "").lower()
            return hostname in {
                "localhost",
                "127.0.0.1",
                "::1",
                "0.0.0.0"
            }
        except Exception:
            return False

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024


settings = Settings()

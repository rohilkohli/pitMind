from functools import lru_cache
from pathlib import Path
import os

from dotenv import load_dotenv
from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Robust .env path resolution for both local development and Docker environments
BASE_DIR = Path(__file__).resolve().parent
ENV_FILES = []

# Check common .env locations in order of precedence
candidate_paths = [
    Path(os.getenv("ENV_FILE")) if os.getenv("ENV_FILE") else None,  # Explicit ENV_FILE variable
    BASE_DIR / ".env",  # Adjacent to config.py (local development)
    BASE_DIR.parent / ".env",  # Parent directory (Docker build root)
    Path("/app/.env"),  # Docker absolute path
    Path("/.env"),  # Root (some container setups)
]

for env_path in candidate_paths:
    if env_path and env_path.exists():
        ENV_FILES.append(env_path)
        load_dotenv(env_path, override=False)

if not ENV_FILES:
    # Fallback: still try to load from default locations even if they don't exist
    # pydantic_settings will handle missing files gracefully
    ENV_FILES = [BASE_DIR / ".env", BASE_DIR.parent / ".env"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=tuple(str(path) for path in ENV_FILES if path.exists()),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    backend_cors_origins: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173,http://127.0.0.1:5174,http://localhost:5174",
        description="Comma-separated allowed origins",
        validation_alias=AliasChoices("BACKEND_CORS_ORIGINS", "backend_cors_origins"),
    )
    rate_limit_per_minute: int = Field(
        default=120,
        validation_alias=AliasChoices("RATE_LIMIT_PER_MINUTE", "rate_limit_per_minute"),
    )

    watsonx_url: str = Field(
        default="https://us-south.ml.cloud.ibm.com",
        validation_alias=AliasChoices("WATSONX_URL", "watsonx_url"),
    )
    watsonx_project_id: str = Field(
        default="",
        validation_alias=AliasChoices("WATSONX_PROJECT_ID", "watsonx_project_id", "PROJECT_ID"),
    )
    watsonx_api_key: str = Field(
        default="",
        validation_alias=AliasChoices("WATSONX_API_KEY", "watsonx_api_key", "IBM_CLOUD_API_KEY", "API_KEY"),
    )
    watsonx_model_id: str = Field(
        default="ibm/granite-3-1-8b-instruct",
        validation_alias=AliasChoices("WATSONX_MODEL_ID", "watsonx_model_id"),
    )

    hf_api_token: str = Field(
        default="",
        validation_alias=AliasChoices("HF_API_TOKEN", "hf_api_token", "HUGGINGFACEHUB_API_TOKEN"),
    )
    hf_model_id: str = Field(
        default="ibm-granite/granite-3.1-8b-instruct",
        validation_alias=AliasChoices("HF_MODEL_ID", "hf_model_id"),
    )

    langflow_api_url: str = Field(default="", validation_alias=AliasChoices("LANGFLOW_API_URL", "langflow_api_url"))
    langflow_flow_id: str = Field(default="", validation_alias=AliasChoices("LANGFLOW_FLOW_ID", "langflow_flow_id"))
    langflow_api_key: str = Field(default="", validation_alias=AliasChoices("LANGFLOW_API_KEY", "langflow_api_key"))

    replicate_api_token: str = Field(default="", validation_alias=AliasChoices("REPLICATE_API_TOKEN", "replicate_api_token"))
    replicate_model_owner: str = Field(default="replicate", validation_alias=AliasChoices("REPLICATE_MODEL_OWNER", "replicate_model_owner"))
    replicate_model_name: str = Field(default="llama-2-70b-chat", validation_alias=AliasChoices("REPLICATE_MODEL_NAME", "replicate_model_name"))

    google_maps_api_key: str = Field(default="", validation_alias=AliasChoices("GOOGLE_MAPS_API_KEY", "google_maps_api_key"))
    firebase_project_id: str = Field(default="pitminds-ibm", validation_alias=AliasChoices("FIREBASE_PROJECT_ID", "firebase_project_id"))

    # Redis Configuration
    redis_url: str = Field(
        default="redis://localhost:6379/0",
        validation_alias=AliasChoices("REDIS_URL", "redis_url"),
        description="Redis connection URL for caching and session management"
    )
    redis_max_connections: int = Field(
        default=50,
        validation_alias=AliasChoices("REDIS_MAX_CONNECTIONS", "redis_max_connections"),
        description="Redis connection pool size (increased for WebSocket scale)"
    )
    redis_socket_timeout: int = Field(
        default=5,
        validation_alias=AliasChoices("REDIS_SOCKET_TIMEOUT", "redis_socket_timeout"),
    )
    redis_socket_connect_timeout: int = Field(
        default=5,
        validation_alias=AliasChoices("REDIS_SOCKET_CONNECT_TIMEOUT", "redis_socket_connect_timeout"),
    )

    # PostgreSQL Configuration
    database_url: str = Field(
        default="postgresql+asyncpg://pitmind:pitmind@localhost:5432/pitmind",
        validation_alias=AliasChoices("DATABASE_URL", "database_url"),
        description="PostgreSQL connection URL with asyncpg driver"
    )
    db_pool_size: int = Field(
        default=20,
        validation_alias=AliasChoices("DB_POOL_SIZE", "db_pool_size"),
        description="Database connection pool size (increased for production load)"
    )
    db_max_overflow: int = Field(
        default=30,
        validation_alias=AliasChoices("DB_MAX_OVERFLOW", "db_max_overflow"),
        description="Maximum overflow connections beyond pool size"
    )
    db_pool_timeout: int = Field(
        default=30,
        validation_alias=AliasChoices("DB_POOL_TIMEOUT", "db_pool_timeout"),
    )
    db_pool_recycle: int = Field(
        default=3600,
        validation_alias=AliasChoices("DB_POOL_RECYCLE", "db_pool_recycle"),
    )

    # Cache Configuration
    cache_enabled: bool = Field(
        default=True,
        validation_alias=AliasChoices("CACHE_ENABLED", "cache_enabled"),
        description="Enable/disable caching layer"
    )
    cache_ttl_default: int = Field(
        default=300,
        validation_alias=AliasChoices("CACHE_TTL_DEFAULT", "cache_ttl_default"),
        description="Default cache TTL in seconds (5 minutes)"
    )
    cache_ttl_strategy: int = Field(
        default=300,
        validation_alias=AliasChoices("CACHE_TTL_STRATEGY", "cache_ttl_strategy"),
        description="Strategy recommendation cache TTL in seconds (5 minutes)"
    )
    cache_ttl_historical: int = Field(
        default=3600,
        validation_alias=AliasChoices("CACHE_TTL_HISTORICAL", "cache_ttl_historical"),
        description="Historical race data cache TTL in seconds (1 hour)"
    )
    cache_ttl_post_race: int = Field(
        default=86400,
        validation_alias=AliasChoices("CACHE_TTL_POST_RACE", "cache_ttl_post_race"),
        description="Post-race analysis cache TTL in seconds (24 hours)"
    )
    cache_ttl_session: int = Field(
        default=3600,
        validation_alias=AliasChoices("CACHE_TTL_SESSION", "cache_ttl_session"),
        description="Session state cache TTL in seconds (1 hour)"
    )
    cache_ttl_health: int = Field(
        default=60,
        validation_alias=AliasChoices("CACHE_TTL_HEALTH", "cache_ttl_health"),
        description="Health metrics cache TTL in seconds (1 minute)"
    )
    cache_max_size: int = Field(
        default=1000,
        validation_alias=AliasChoices("CACHE_MAX_SIZE", "cache_max_size"),
        description="Maximum cache entries per session"
    )




@lru_cache
def get_settings() -> Settings:
    return Settings()


def cors_origin_list() -> list[str]:
    raw = get_settings().backend_cors_origins
    return [o.strip() for o in raw.split(",") if o.strip()]

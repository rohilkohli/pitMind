from functools import lru_cache

from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = BASE_DIR / ".env"
if not ENV_FILE.exists():
    ENV_FILE = BASE_DIR.parent / ".env"

if ENV_FILE.exists():
    load_dotenv(ENV_FILE, override=False)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(ENV_FILE), env_file_encoding="utf-8", extra="ignore")

    backend_cors_origins: str = Field(
        default="http://localhost:5173",
        description="Comma-separated allowed origins",
    )
    rate_limit_per_minute: int = 120

    watsonx_url: str = ""
    watsonx_project_id: str = ""
    watsonx_api_key: str = ""
    watsonx_model_id: str = "ibm/granite-3-1-8b-instruct"

    replicate_api_token: str = ""
    replicate_model_owner: str = ""
    replicate_model_name: str = ""

    hf_api_token: str = ""
    hf_model_id: str = "ibm-granite/granite-3.1-8b-instruct"

    langflow_api_url: str = ""
    langflow_flow_id: str = ""
    langflow_api_key: str = ""

    google_maps_api_key: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()


def cors_origin_list() -> list[str]:
    raw = get_settings().backend_cors_origins
    return [o.strip() for o in raw.split(",") if o.strip()]

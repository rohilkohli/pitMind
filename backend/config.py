from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    backend_cors_origins: str = Field(
        default="http://localhost:5173",
        description="Comma-separated allowed origins",
    )
    rate_limit_per_minute: int = 120

    watsonx_url: str = ""
    watsonx_project_id: str = ""
    watsonx_api_key: str = ""
    watsonx_model_id: str = "ibm/granite-3-8b-instruct"

    replicate_api_token: str = ""
    replicate_model_owner: str = ""
    replicate_model_name: str = ""

    hf_api_token: str = ""
    hf_model_id: str = "ibm-granite-community/granite-3.1-8b-instruct"

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

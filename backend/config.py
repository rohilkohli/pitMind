from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent
ENV_FILES = [BASE_DIR / ".env", BASE_DIR.parent / ".env"]

for env_file in ENV_FILES:
    if env_file.exists():
        load_dotenv(env_file, override=False)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=tuple(str(path) for path in ENV_FILES if path.exists()),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    backend_cors_origins: str = Field(
        default="http://localhost:5173",
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

    google_maps_api_key: str = Field(default="", validation_alias=AliasChoices("GOOGLE_MAPS_API_KEY", "google_maps_api_key"))


@lru_cache
def get_settings() -> Settings:
    return Settings()


def cors_origin_list() -> list[str]:
    raw = get_settings().backend_cors_origins
    return [o.strip() for o in raw.split(",") if o.strip()]

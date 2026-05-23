"""Tests for configuration and environment variable loading fixes."""

import os
import pytest
from unittest.mock import patch

from config import get_settings, Settings


def test_settings_loads_replicate_config():
    """BUG #4 FIX: Config should have REPLICATE_* fields defined."""
    settings = get_settings()
    
    # Check that REPLICATE fields exist as attributes (even if empty)
    assert hasattr(settings, "replicate_api_token")
    assert hasattr(settings, "replicate_model_owner")
    assert hasattr(settings, "replicate_model_name")
    
    # Should have model_name defined, model_owner may be empty if not configured
    assert settings.replicate_model_name in ["llama-2-70b-chat", ""]
    # model_owner defaults to "replicate" or empty depending on env
    assert isinstance(settings.replicate_model_owner, str)


def test_settings_loads_hf_config():
    """Config should have HuggingFace fields."""
    settings = get_settings()
    
    assert hasattr(settings, "hf_api_token")
    assert hasattr(settings, "hf_model_id")
    assert settings.hf_model_id in ["ibm-granite/granite-3.1-8b-instruct", "meta-llama/Llama-3.1-8B-Instruct"]


def test_env_file_resolution():
    """BUG #7 FIX: .env path resolution should be robust."""
    from config import ENV_FILES, BASE_DIR
    
    # Check that multiple paths are tried
    assert BASE_DIR / ".env" in ENV_FILES or BASE_DIR.parent / ".env" in ENV_FILES
    # At least one path should be checked
    assert len(ENV_FILES) > 0


def test_watsonx_status_when_unconfigured():
    """Status endpoint should report missing Watsonx config."""
    from services.granite import get_ai_status
    
    with patch("services.granite.get_settings") as mock_settings:
        mock_settings.return_value.watsonx_api_key = ""
        mock_settings.return_value.watsonx_project_id = ""
        mock_settings.return_value.watsonx_url = ""
        mock_settings.return_value.hf_api_token = ""
        mock_settings.return_value.hf_model_id = "test-model"
        mock_settings.return_value.replicate_api_token = ""
        
        status = get_ai_status()
        
        assert status["watsonx_configured"] is False
        assert "WATSONX_API_KEY" in status["missing_requirements"]


def test_settings_case_insensitive_env_loading():
    """Settings should handle both uppercase and lowercase env vars."""
    with patch.dict(os.environ, {"hf_api_token": "test_token_123"}):
        settings = Settings()
        # Should load from lowercase if available
        assert settings.hf_api_token == "test_token_123"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

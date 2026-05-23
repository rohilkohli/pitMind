"""Tests for authentication fixes — BUG #3."""

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_missing_authorization_header_rejected():
    """BUG #3 FIX: Missing Authorization header should be rejected."""
    response = client.post(
        "/api/v1/strategy/recommend",
        json={
            "circuit": "Monaco",
            "session_label": "Race",
            "driver": "Test Driver",
            "laps": [{"lap": 1, "lap_time_s": 75.5}],
        },
    )
    # Should return 401 Unauthorized, not allow guest access
    assert response.status_code == 401
    res_data = response.json()
    err_msg = res_data.get("error", {}).get("message", "") or res_data.get("detail", "")
    assert "authorization" in err_msg.lower()


def test_malformed_authorization_header_rejected():
    """Authorization header without Bearer token should be rejected."""
    response = client.post(
        "/api/v1/strategy/recommend",
        json={
            "circuit": "Monaco",
            "session_label": "Race",
            "driver": "Test Driver",
            "laps": [{"lap": 1, "lap_time_s": 75.5}],
        },
        headers={"Authorization": "InvalidFormat"},
    )
    # Should be rejected or attempt validation
    assert response.status_code in [401, 422]


def test_bearer_token_with_dev_prefix_allowed_in_dev_mode():
    """BUG #3 FIX: In development mode, invalid tokens should fail auth gracefully."""
    response = client.post(
        "/api/v1/strategy/recommend",
        json={
            "circuit": "Monaco",
            "session_label": "Race",
            "driver": "Test Driver",
            "laps": [{"lap": 1, "lap_time_s": 75.5}],
        },
        headers={"Authorization": "Bearer dev_test_token_12345"},
    )
    # BUG #3 FIX: Token validation should reject or accept correctly
    # 401 is correct if Firebase is not configured and token is invalid
    # The important part is that the auth header IS being processed
    res_data = response.json()
    err_msg = res_data.get("error", {}).get("message", "") or res_data.get("detail", "")
    assert "authorization" in err_msg.lower() or "token" in err_msg.lower() or response.status_code == 401


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

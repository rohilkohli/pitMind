import pytest
from backend.services.granite import _local_fallback_response

def test_local_fallback_response_normal():
    system = "You are an AI."
    user = "Should I pit now?"
    result = _local_fallback_response(system, user)
    assert "AI provider is not configured" in result
    assert "Context preview: Should I pit now?" in result

def test_local_fallback_response_empty():
    system = "You are an AI."
    user = ""
    result = _local_fallback_response(system, user)
    assert result == "No chat context was provided. Share telemetry or a strategy question to continue."

def test_local_fallback_response_whitespace_only():
    system = "You are an AI."
    user = "   \n  \t   "
    result = _local_fallback_response(system, user)
    assert result == "No chat context was provided. Share telemetry or a strategy question to continue."

def test_local_fallback_response_whitespace_cleanup():
    system = "You are an AI."
    user = "  Hello \n world,   this\tis  a test.  "
    result = _local_fallback_response(system, user)
    assert "Context preview: Hello world, this is a test." in result

def test_local_fallback_response_truncation():
    system = "You are an AI."
    user = "A" * 500
    result = _local_fallback_response(system, user)
    assert "Context preview: " + "A" * 420 in result
    assert len("Context preview: " + "A" * 420) <= len(result)
    assert "A" * 421 not in result

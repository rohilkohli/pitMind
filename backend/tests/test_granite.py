import pytest
from backend.services.granite import _repair_strategy_payload

def test_repair_strategy_payload_basic():
    content = "The strategy is looking good."
    system = "You are a race strategist."
    user = "What is the strategy?"

    result = _repair_strategy_payload(content, system, user)

    assert result["recommendation"] == "The strategy is looking good."
    assert result["prose"] == "The strategy is looking good."
    assert result["evidence"] == []
    assert result["confidence"] == 0
    assert result["assumptions"] == ["You are a race strategist."]
    assert result["alternative"] == "No alternative available."

def test_repair_strategy_payload_fallback_to_user():
    content = ""
    system = "You are a race strategist."
    user = "What is the strategy?"

    result = _repair_strategy_payload(content, system, user)

    assert result["recommendation"] == "What is the strategy?"
    assert result["prose"] == "What is the strategy?"

def test_repair_strategy_payload_fallback_to_default():
    content = "   "
    system = "You are a race strategist."
    user = "   "

    result = _repair_strategy_payload(content, system, user)

    assert result["recommendation"] == "Strategy output unavailable."
    assert result["prose"] == "Strategy output unavailable."

def test_repair_strategy_payload_empty_system():
    content = "The strategy is looking good."
    system = "   "
    user = "What is the strategy?"

    result = _repair_strategy_payload(content, system, user)

    assert result["assumptions"] == []

def test_repair_strategy_payload_truncation():
    # Content longer than 160 characters
    content = "A" * 200
    system = "B" * 250
    user = "What is the strategy?"

    result = _repair_strategy_payload(content, system, user)

    assert result["recommendation"] == "A" * 160
    assert result["prose"] == "A" * 200
    assert result["assumptions"] == ["B" * 200]

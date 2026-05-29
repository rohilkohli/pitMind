import json

from backend.services.granite import (
    _normalize_strategy_json,
    _extract_json_object,
    _repair_strategy_payload,
    _coerce_strategy_payload,
    _local_fallback_response,
)


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

def test_normalize_strategy_json_valid():
    content = '{"recommendation": "Pit now", "prose": "Pit for hard tires.", "evidence": ["high wear"], "confidence": 90, "assumptions": [], "alternative": "Stay out"}'
    system = "System prompt"
    user = "User input"

    result = _normalize_strategy_json(content, system, user)

    assert isinstance(result, str)
    parsed = json.loads(result)
    assert parsed["recommendation"] == "Pit now"
    assert parsed["prose"] == "Pit for hard tires."
    assert parsed["evidence"] == ["high wear"]
    assert parsed["confidence"] == 90
    assert parsed["assumptions"] == []
    assert parsed["alternative"] == "Stay out"

def test_normalize_strategy_json_invalid_json():
    content = 'This is not valid JSON.'
    system = "System prompt"
    user = "User input"

    result = _normalize_strategy_json(content, system, user)

    assert isinstance(result, str)
    parsed = json.loads(result)
    assert parsed["recommendation"] == content[:160]
    assert parsed["prose"] == content
    assert parsed["confidence"] == 0
    assert parsed["assumptions"] == [system[:200]]

def test_normalize_strategy_json_partial_json():
    content = 'Some text here {"recommendation": "Pit now", "prose": "Pit for hard tires."} more text'
    system = "System prompt"
    user = "User input"

    result = _normalize_strategy_json(content, system, user)

    assert isinstance(result, str)
    parsed = json.loads(result)
    assert parsed["recommendation"] == "Pit now"
    assert parsed["prose"] == "Pit for hard tires."
    # The coerced payload will have defaults for missing fields
    assert "evidence" in parsed
    assert "confidence" in parsed

def test_normalize_strategy_json_empty_content():
    content = ""
    system = "System prompt"
    user = "User input"

    result = _normalize_strategy_json(content, system, user)

    assert isinstance(result, str)
    parsed = json.loads(result)
    assert parsed["recommendation"] == user[:160]

def test_extract_json_object():
    assert _extract_json_object('{"key": "value"}') == {"key": "value"}
    assert _extract_json_object('  {"key": "value"}  ') == {"key": "value"}
    assert _extract_json_object('text before {"key": "value"} text after') == {"key": "value"}
    assert _extract_json_object('not json') is None
    assert _extract_json_object(None) is None
    assert _extract_json_object('') is None

def test_extract_json_object_with_invalid_inner_json():
    # Tests line 442-443 where there are {} but it's not valid json
    content = "some text { this is not json } more text"
    assert _extract_json_object(content) is None

def test_extract_json_object_missing_brackets():
    # Tests line 438-439
    content = "some text } { more text"
    assert _extract_json_object(content) is None

def test_extract_json_object_no_brackets():
    content = "just some regular text"
    assert _extract_json_object(content) is None

def test_coerce_strategy_payload_not_dict():
    # Tests line 463
    payload = None
    result = _coerce_strategy_payload(payload, "raw text", "user input")
    assert isinstance(result, dict)
    assert result["recommendation"] == "user input"
    assert result["prose"] == "raw text"

def test_expects_json_response():
    from backend.services.granite import _expects_json_response
    assert _expects_json_response("Please return only json", "") is True
    assert _expects_json_response("", "Using this JSON schema") is True
    assert _expects_json_response('Give me a "recommendation"', "") is True
    assert _expects_json_response("", 'Here is some "prose"') is True
    assert _expects_json_response("evidence assumptions alternative", "") is True
    assert _expects_json_response("Just write a paragraph", "About F1") is False

def test_coerce_text():
    from backend.services.granite import _coerce_text
    assert _coerce_text(" valid text ", "fallback") == "valid text"
    assert _coerce_text("", "fallback") == "fallback"
    assert _coerce_text(None, "fallback") == "fallback"
    assert _coerce_text(123, "fallback") == "fallback"

def test_coerce_list():
    from backend.services.granite import _coerce_list
    assert _coerce_list([" item 1 ", "item 2"]) == ["item 1", "item 2"]
    assert _coerce_list(["", "item 2"]) == ["item 2"]
    assert _coerce_list([]) == []
    assert _coerce_list(None) == []
    assert _coerce_list("not a list") == []

def test_coerce_confidence():
    from backend.services.granite import _coerce_confidence
    assert _coerce_confidence(85) == 85
    assert _coerce_confidence(85.5) == 86
    assert _coerce_confidence(0.9) == 90
    assert _coerce_confidence("90") == 90
    assert _coerce_confidence(150) == 100
    assert _coerce_confidence(-10) == 0
    assert _coerce_confidence("invalid") == 0
    assert _coerce_confidence(None) == 0

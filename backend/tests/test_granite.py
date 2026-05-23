import json
from backend.services.granite import (
    _normalize_strategy_json,
    _extract_json_object,
    _coerce_strategy_payload,
)

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

def test_local_fallback_response():
    from backend.services.granite import _local_fallback_response

    response = _local_fallback_response("system", "  clean this   ")
    assert "AI provider is not configured" in response

    empty_response = _local_fallback_response("system", "   ")
    assert "No chat context was provided" in empty_response

import pytest
from backend.services.granite import _expects_json_response

@pytest.mark.parametrize(
    "system, user, expected",
    [
        # "return only json"
        ("You must return only json.", "Hello", True),
        ("Hello", "Return only json format.", True),
        ("RETURN ONLY JSON", "", True),

        # "json schema"
        ("Use this JSON schema", "...", True),
        ("...", "Match this json schema.", True),

        # '"recommendation"'
        ('Should output "recommendation" field.', "", True),
        ("", 'Give me a "recommendation"', True),

        # '"prose"'
        ('Include "prose" key.', "", True),
        ("", 'Write some "prose"', True),

        # "evidence" and "assumptions" and "alternative"
        ("Include evidence, assumptions, and alternative.", "", True),
        ("", "evidence assumptions alternative", True),
        ("evidence", "assumptions and alternative", True),

        # Negative cases
        ("Hello world", "How are you?", False),
        ("Return JSON", "Please", False),
        ('"recommendations"', "plural", False),
        ("evidence and assumptions", "but no alt", False),
    ]
)
def test_expects_json_response(system, user, expected):
    assert _expects_json_response(system, user) == expected

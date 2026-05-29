from backend.services.pipeline import _extract_granite_json

class TestExtractGraniteJson:
    def test_empty_string(self):
        assert _extract_granite_json("") is None

    def test_none_input(self):
        assert _extract_granite_json(None) is None

    def test_no_opening_brace(self):
        assert _extract_granite_json("this is just text without any json") is None

    def test_no_closing_brace(self):
        assert _extract_granite_json("this has an opening { but no closing brace") is None

    def test_simple_json(self):
        raw = '{"key": "value"}'
        assert _extract_granite_json(raw) == {"key": "value"}

    def test_nested_json(self):
        raw = '{"key": {"nested": "value"}}'
        assert _extract_granite_json(raw) == {"key": {"nested": "value"}}

    def test_json_with_prefix(self):
        raw = 'Here is the json: {"key": "value"}'
        assert _extract_granite_json(raw) == {"key": "value"}

    def test_json_with_suffix(self):
        raw = '{"key": "value"} and that is it.'
        assert _extract_granite_json(raw) == {"key": "value"}

    def test_json_with_prefix_and_suffix(self):
        raw = 'Prefix {"key": "value"} Suffix'
        assert _extract_granite_json(raw) == {"key": "value"}

    def test_multiple_jsons(self):
        raw = 'First: {"key1": "value1"}, Second: {"key2": "value2"}'
        assert _extract_granite_json(raw) == {"key1": "value1"}

    def test_invalid_json_inside_braces(self):
        raw = '{"key": value}' # missing quotes around value
        assert _extract_granite_json(raw) is None

    def test_complex_whitespace(self):
        raw = '   \n\t{"key": \n\t "value"}\n   '
        assert _extract_granite_json(raw) == {"key": "value"}

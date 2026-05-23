import pytest
from backend.services.sanitize import telemetry_from_records

class TestSanitize:
    def test_telemetry_from_records_too_many_rows(self):
        records = [{}] * 401
        with pytest.raises(ValueError, match="Too many rows"):
            telemetry_from_records(records)

    def test_telemetry_from_records_success(self):
        records = [
            {
                "tyre_compound": "SOFT",
                "lap": 1,
                "lap_time_s": 90.5,
                "circuit": "Monza",
                "driver": "Max",
                "session": "Race"
            }
        ]
        payload = telemetry_from_records(records)
        assert payload.circuit == "Monza"
        assert payload.driver == "Max"
        assert payload.session_label == "Race"
        assert len(payload.laps) == 1

        lap = payload.laps[0]
        assert lap.lap == 1
        assert lap.lap_time_s == 90.5
        assert lap.tyre_compound == "SOFT"

    def test_telemetry_from_records_empty(self):
        with pytest.raises(IndexError):
             telemetry_from_records([])

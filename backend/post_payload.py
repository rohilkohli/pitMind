import httpx

payload = {
    "circuit": "Monza",
    "session_label": "R",
    "driver": "VER",
    "laps": [
        {"lap":1, "lap_time_s":82.0, "sector1_s":27.0, "sector2_s":27.0, "sector3_s":28.0, "tyre_wear_pct":45.0, "tyre_compound":"SOFT", "fuel_kg":100, "gap_ahead_s":1.0, "gap_behind_s":1.5},
        {"lap":2, "lap_time_s":82.2, "sector1_s":27.2, "sector2_s":27.0, "sector3_s":28.0, "tyre_wear_pct":46.2, "tyre_compound":"SOFT", "fuel_kg":98.5, "gap_ahead_s":0.95, "gap_behind_s":1.4}
    ]
}

url = "http://127.0.0.1:8000/api/v1/strategy/recommend"

with httpx.Client(timeout=120.0) as c:
    r = c.post(url, json=payload)
    print(r.status_code)
    print(r.text)

"""
Generate `data/sample_fastf1_export.csv` using FastF1 (optional dependency).

Usage:
  pip install fastf1 pandas
  python scripts/export_fastf1_sample.py

Requires outbound network on first run for Ergast/cache bootstrap.
"""

from __future__ import annotations

import pathlib

import pandas as pd


def main() -> None:
    import fastf1  # type: ignore

    session = fastf1.get_session(2023, "Monza", "R")
    session.load()
    laps = session.laps

    rows = []
    for _, lap in laps.iterrows():
        rows.append(
            {
                "circuit": "Monza",
                "driver": lap.get("Driver", "UNK"),
                "session": "Race",
                "lap": lap.get("LapNumber"),
                "lap_time_s": lap.get("LapTime"),
                "sector1_s": lap.get("Sector1Time"),
                "sector2_s": lap.get("Sector2Time"),
                "sector3_s": lap.get("Sector3Time"),
                "tyre_compound": lap.get("Compound"),
            }
        )

    df = pd.DataFrame(rows)
    out = pathlib.Path(__file__).resolve().parents[2] / "data" / "sample_fastf1_export.csv"
    df.to_csv(out, index=False)
    print(f"wrote {out}")


if __name__ == "__main__":
    main()

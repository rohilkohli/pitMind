"""Generate a sample F1 race debrief PDF for Docling demo."""

from fpdf import FPDF


class RaceDebriefPDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(180, 0, 0)
        self.cell(0, 6, "CONFIDENTIAL - TEAM USE ONLY", align="R", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(200, 0, 0)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 10, f"PitMind Race Engineering - Page {self.page_no()}/{{nb}}", align="C")


def build_pdf(output_path: str):
    pdf = RaceDebriefPDF()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    # Title
    pdf.set_font("Helvetica", "B", 22)
    pdf.set_text_color(20, 20, 30)
    pdf.cell(0, 14, "POST-RACE STRATEGIC DEBRIEF", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 13)
    pdf.set_text_color(60, 60, 60)
    pdf.cell(0, 8, "2024 Italian Grand Prix - Autodromo Nazionale Monza", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 7, "Race Date: 1 September 2024  |  Report Compiled: 2 September 2024", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)

    # Session summary table
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_fill_color(225, 6, 0)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 9, "  SESSION SUMMARY", fill=True, new_x="LMARGIN", new_y="NEXT")
    pdf.set_text_color(20, 20, 30)

    table_data = [
        ["Parameter", "Value"],
        ["Circuit", "Autodromo Nazionale Monza (5.793 km)"],
        ["Laps Completed", "53 / 53"],
        ["Starting Position", "P4"],
        ["Finishing Position", "P2"],
        ["Fastest Lap", "1:21.547 (Lap 47)"],
        ["Pit Stops", "2 (Lap 16 Soft>Medium, Lap 38 Medium>Hard)"],
        ["Total Pit Time Loss", "46.3s (23.1s + 23.2s)"],
        ["Weather", "Dry, 28C Air / 52C Track"],
        ["Safety Cars", "1 (Lap 22-25)"],
    ]

    col_widths = [55, 135]
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_fill_color(240, 240, 240)
    for i, cell_text in enumerate(table_data[0]):
        pdf.cell(col_widths[i], 7, f"  {cell_text}", border=1, fill=True)
    pdf.ln()

    pdf.set_font("Helvetica", "", 9)
    for row in table_data[1:]:
        for i, cell_text in enumerate(row):
            pdf.cell(col_widths[i], 7, f"  {cell_text}", border=1)
        pdf.ln()
    pdf.ln(6)

    # Section 1: Performance & Pace Analysis
    _section(pdf, "1. PERFORMANCE & PACE ANALYSIS")
    _body(pdf, (
        "Stint 1 (Laps 1-16, Soft): Average pace 1:23.142 with degradation of +0.08s/lap. "
        "Initial undercut opportunity identified on Lap 14 but delayed to Lap 16 due to traffic in pit lane.\n\n"
        "Stint 2 (Laps 17-38, Medium): Strongest stint of the race. Average pace 1:22.876, "
        "0.3s faster than P1 on identical compound. Degradation contained to +0.04s/lap thanks to "
        "optimal tyre preparation on out-lap.\n\n"
        "Stint 3 (Laps 39-53, Hard): Conservative pace management to protect P2. "
        "Average pace 1:23.544. Gap to P3 managed at >3.5s throughout."
    ))

    # Lap time table
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 8, "Lap Time Comparison (Selected Laps)", new_x="LMARGIN", new_y="NEXT")
    lap_table = [
        ["Lap", "Time", "Compound", "Tyre Wear %", "Gap to P1", "Delta to Avg"],
        ["5", "1:22.987", "Soft", "18.2%", "+1.234s", "-0.155s"],
        ["10", "1:23.105", "Soft", "34.7%", "+1.892s", "-0.037s"],
        ["15", "1:23.601", "Soft", "52.1%", "+2.445s", "+0.459s"],
        ["20", "1:22.634", "Medium", "11.3%", "+1.102s", "-0.242s"],
        ["30", "1:22.811", "Medium", "28.9%", "+0.654s", "-0.065s"],
        ["38", "1:23.199", "Medium", "47.2%", "+0.203s", "+0.323s"],
        ["45", "1:23.312", "Hard", "15.6%", "+0.891s", "-0.232s"],
        ["47", "1:21.547", "Hard", "18.1%", "+0.445s", "-1.997s"],
        ["53", "1:23.889", "Hard", "31.4%", "+1.202s", "+0.345s"],
    ]
    lcols = [18, 28, 30, 30, 30, 30]
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_fill_color(240, 240, 240)
    for i, h in enumerate(lap_table[0]):
        pdf.cell(lcols[i], 6, h, border=1, fill=True, align="C")
    pdf.ln()
    pdf.set_font("Helvetica", "", 8)
    for row in lap_table[1:]:
        for i, v in enumerate(row):
            pdf.cell(lcols[i], 6, v, border=1, align="C")
        pdf.ln()
    pdf.ln(6)

    # Section 2: Tyre Management
    _section(pdf, "2. TYRE MANAGEMENT & DEGRADATION")
    _body(pdf, (
        "Tyre strategy executed as planned (Soft-Medium-Hard), with the Medium stint providing "
        "the critical race advantage.\n\n"
        "Key Findings:\n"
        "  - Soft compound showed higher-than-expected front-left graining in first 5 laps "
        "(+0.12s penalty vs. simulation)\n"
        "  - Medium compound performed 0.15s/lap better than pre-race simulation predicted, "
        "suggesting optimal track rubbering-in during the Stint 1 window\n"
        "  - Hard compound degradation was linear and predictable at +0.03s/lap\n"
        "  - Front-left tyre temperature peaked at 108.3C during Stint 1 (threshold: 110C)\n"
        "  - Rear tyre temperatures were well-managed at 97-101C across all stints"
    ))

    # Section 3: Critical Strategy Calls
    pdf.add_page()
    _section(pdf, "3. CRITICAL STRATEGY CALLS")

    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 8, "Decision Log", new_x="LMARGIN", new_y="NEXT")
    decisions = [
        ["Lap", "Decision", "Outcome", "Time Delta"],
        ["14", "Hold pit stop (traffic)", "Correct: saved 2.1s", "+2.1s gained"],
        ["16", "Box for Mediums (undercut)", "Optimal: gained P3", "+1.8s gained"],
        ["22", "Stay out under SC", "Sub-optimal: P1 pitted free", "-3.2s lost"],
        ["38", "Box for Hards (overcut)", "Correct: P1 tyres done", "+0.9s gained"],
    ]
    dcols = [18, 55, 55, 32]
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_fill_color(240, 240, 240)
    for i, h in enumerate(decisions[0]):
        pdf.cell(dcols[i], 6, h, border=1, fill=True, align="C")
    pdf.ln()
    pdf.set_font("Helvetica", "", 8)
    for row in decisions[1:]:
        for i, v in enumerate(row):
            pdf.cell(dcols[i], 6, v, border=1, align="C" if i == 0 else "L")
        pdf.ln()
    pdf.ln(4)

    _body(pdf, (
        "Net Strategy Impact: +1.6s gained vs. baseline simulation.\n\n"
        "The Safety Car decision on Lap 22 was the key missed opportunity. "
        "Post-analysis shows pitting under SC would have cost only 14.8s vs. the 23.2s we paid "
        "at Lap 38. This single decision is the primary gap to P1 (final gap: 1.202s).\n\n"
        "Recommendation: Update SC response protocol to weight 'free stop' probability higher "
        "when current compound has >40% wear."
    ))

    # Section 4: Risk & Incident Assessment
    _section(pdf, "4. RISK & INCIDENT ASSESSMENT")
    _body(pdf, (
        "- Safety Car (Lap 22-25): Triggered by debris at Turn 4. No contact with our car. "
        "Impact: Lost strategic advantage due to decision to stay out.\n\n"
        "- Blue Flag Incident (Lap 31): P18 backmarker delayed our car by 1.4s through "
        "Variante Ascari. FIA race control reviewed -- no penalty issued.\n\n"
        "- DRS Failure (Lap 41-42): Intermittent DRS activation failure on main straight. "
        "Engineering confirmed rear wing actuator reset on Lap 43. Estimated time loss: 0.6s.\n\n"
        "- Brake Temperature Alert (Lap 48): Front-left brake temperature reached 1,042C "
        "(threshold: 1,050C). Managed via ERS harvesting increase. No performance impact."
    ))

    # Section 5: Forward-Looking Actions
    _section(pdf, "5. FORWARD-LOOKING ACTIONS (NEXT RACE: AZERBAIJAN GP)")
    _body(pdf, (
        "Action Items:\n\n"
        "  1. SC Response Protocol -- Revise decision tree to prioritize 'free stop' scenarios "
        "when compound wear exceeds 40%. Target: Reduce SC-related time loss by 60%.\n\n"
        "  2. Soft Compound Preparation -- Investigate front-left graining in opening stint. "
        "Increase formation lap tyre prep temperature by 3C to improve initial grip window.\n\n"
        "  3. DRS Reliability -- Conduct full actuator diagnostic. Preemptive replacement if "
        "cycle count exceeds 2,000 activations.\n\n"
        "  4. Baku Setup Baseline -- Apply Monza high-speed aero learnings to Baku street circuit "
        "long-straight configuration. Focus on rear downforce vs. drag trade-off for Sectors 1-2.\n\n"
        "  5. Pit Stop Practice -- Target sub-2.2s stops at Baku. Monza average was 2.35s "
        "(0.15s above target). Review left-rear gunner sequence timing."
    ))

    pdf.ln(8)
    pdf.set_draw_color(200, 0, 0)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(4)
    pdf.set_font("Helvetica", "I", 9)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 6, "Prepared by: Chief Race Strategist  |  Distribution: Senior Engineering Staff Only", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, "Document ID: PIT-2024-ITA-DEBRIEF-001  |  Classification: Internal", align="C")

    pdf.output(output_path)
    print(f"PDF generated: {output_path}")


def _section(pdf: FPDF, title: str):
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_fill_color(225, 6, 0)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 9, f"  {title}", fill=True, new_x="LMARGIN", new_y="NEXT")
    pdf.set_text_color(20, 20, 30)
    pdf.ln(3)


def _body(pdf: FPDF, text: str):
    pdf.set_font("Helvetica", "", 9.5)
    pdf.set_text_color(40, 40, 40)
    pdf.multi_cell(0, 5.5, text)
    pdf.ln(4)


if __name__ == "__main__":
    build_pdf("docs/sample_race_debrief_monza_2024.pdf")

# PITMIND Visual UI Audit
Date: 2026-05-24
Tool: VS Code Built-in Browser
Viewport: 1440 primary
Pages: Landing, Login, Dashboard×2, Strategy, Telemetry
Excluded: Fan Mode

---

## Summary Table

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High     | 1 |
| Medium   | 2 |
| Low      | 0 |
| Total    | 3 |

---

## Page: Landing (P01)

P01 Landing — all abbreviated checks passed.

---

## Page: Login (P02)

N/A — This page uses Google sign-in only; there are no email/password fields, password reveal controls, or empty-form validation states to test.

---

## Page: Dashboard — Engineer (P03)


### [VIS-002] MEDIUM: Health Console metrics run together without spacing

**Category:** Typography / Spacing
**Page:** Dashboard — Engineer — http://localhost:5173/dashboard
**Element:** Health Console metric grid
**Visible When:** On scroll / Always when expanded
**Viewport:** 1440
**Screenshot:** audit/screenshots/P03-dashboard-health-console-spacing.png

**What I See:**
The metric values and units are visually merged in several Health Console rows. For example, Engineer Approvals renders as 4decisions and Strategy Calls renders as 12total, so the number and label read as a single word.

**What It Should Look Like:**
The numeric value and its unit or noun should be separated by visible spacing, or the unit should be styled as a distinct secondary token like the other health rows.

**Impact:**
Dashboard users have to re-read the rows to understand the values, which slows down quick status checks.

**Likely Cause:**
The metric text is being concatenated into one inline string without a separating space or dedicated wrapper element.

**Fix:**
Render the value and suffix in separate elements with a small horizontal gap, or insert a literal space in the formatter for labels such as decisions and total.

**Status:** FIXED — verified in-browser; the metric now renders as `4 decisions` and `12 total` with separate value/unit spans.

**Known Issue Ref:** NEW

### [VIS-003] MEDIUM: Live System Feed source tags are clipped

**Category:** Typography / Layout
**Page:** Dashboard — Engineer — http://localhost:5173/dashboard
**Element:** Live System Feed source badges
**Visible When:** On scroll
**Viewport:** 1440
**Screenshot:** audit/screenshots/P03-dashboard-feed-tags.png

**What I See:**
Several feed source tags are cut off at the badge edge. The labels show as FIREBAS, TELEMET, and STRATEG instead of the full source names, which makes the badges look truncated rather than intentionally abbreviated.

**What It Should Look Like:**
The source badges should either show the full label or use a clear, intentional abbreviation pattern that does not look clipped.

**Impact:**
The feed is still readable, but the source names look unfinished and less polished, especially at a glance.

**Likely Cause:**
A fixed badge width or overflow-hidden label is clipping the final character in the feed source chip.

**Fix:**
Widen the badge, reduce the label text size slightly, or switch to a deliberate abbreviation scheme with a tooltip for the full name.

**Status:** FIXED — verified in-browser; the feed now shows full module names with a tooltip and no clipped suffixes.

**Known Issue Ref:** NEW

### VIS-001 Investigation Notes

Source file: [frontend/src/components/dashboard/StreamHealthMonitor.tsx](../frontend/src/components/dashboard/StreamHealthMonitor.tsx)

Value source: `useStreamConnection` state, derived from latency and packet-loss measurements.

Role dependency: no direct role binding found in the signal calculation; the role switch only re-renders the same stream state.

Suspected cause: the displayed percentage is computed as `Math.round((1 - state.latency / 500) * 100)`, so stale or high latency can drive the value below 0.

Recommended action: a developer should clamp the derived signal percentage to 0-100 and verify the stream-latency source before shipping.
---

## Page: Dashboard — Commentator (P04)


### [VIS-001] HIGH: Signal strength becomes negative in the status card

**Category:** Color / Typography / Component
**Page:** Dashboard — Commentator — http://localhost:5173/dashboard
**Element:** Top-right connection status card, Signal Strength field
**Visible When:** On click
**Viewport:** 1440
**Screenshot:** audit/screenshots/P04-dashboard-commentator-signal-strength.png

**What I See:**
After switching from Engineer to Commentator, the Signal Strength value in the top-right card reads -203%. Earlier in the same interaction it also showed -264% while the role menu was open.

**What It Should Look Like:**
The value should remain a normal percentage in the expected range and should not change to a negative number when the role changes.

**Impact:**
This is immediately visible in the dashboard header and makes the system status appear invalid.

**Likely Cause:**
The role switch is feeding an incorrect value into the signal-strength formatter, or a style/transform bug is altering the visible number readout.

**Fix:**
Clamp the signal value to the valid range and verify the displayed text is sourced from the connection metric rather than any role-dependent state.

**Known Issue Ref:** NEW

### B2 Remaining Instances

- [frontend/src/components/dashboard/RoleSwitcher.tsx](../frontend/src/components/dashboard/RoleSwitcher.tsx): the role detail chips render at 9px inside the dropdown.
- [frontend/src/components/dashboard/StrategyTimeline.tsx](../frontend/src/components/dashboard/StrategyTimeline.tsx): the waiting-state labels use 9px text.
- [frontend/src/components/dashboard/EvidenceDrilldownModal.tsx](../frontend/src/components/dashboard/EvidenceDrilldownModal.tsx): the lap marker text still uses 9px.
- [frontend/src/components/dashboard/StreamHealthMonitor.tsx](../frontend/src/components/dashboard/StreamHealthMonitor.tsx): the reconnect button uses 9px text when the stream is down.
---

## Page: Strategy (P05)

P05 Strategy — all abbreviated checks passed.

---

## Page: Telemetry (P06)

P06 Telemetry — all abbreviated checks passed.

---

## Cross-Page Inconsistencies

---

## Known Issue Verification

| Code | Issue | Status |
|------|-------|--------|
| A1   | Scanline z-index | FIXED |
| A2   | Scrollbar 4px | STILL PRESENT |
| A3   | Topbar sticky | FIXED |
| B2   | 9px fonts | PARTIALLY FIXED |
| C1   | Feed text contrast | FIXED |
| D2-D6 | Double headers | FIXED |
| E1   | Hover padding-left | FIXED |
| Lap Time Y-axis | Y-axis clip | FIXED |
| Branching Sim | Card alignment | FIXED |
| Confidence swap | Panel position | CORRECT ORDER |

---

## Priority Fix Order

| Rank | Finding | Severity | Fix Effort | Status |
|------|---------|----------|------------|--------|
| 1    | VIS-001 | High     | Developer (data bug) | FLAGGED |
| 2    | VIS-002 | Medium   | 30 min | FIXED |
| 3    | VIS-003 | Medium   | 30 min | FIXED |
| 4    | B2 remaining | Medium | 1 hour sweep | IN PROGRESS |

---

## Screenshots Index

| File | Page | State | Finding |
|------|------|-------|---------|
| audit/screenshots/P01-landing-load.png | Landing | Initial load | Pass |
| audit/screenshots/P03-dashboard-fix-top.png | Dashboard — Commentator | Top viewport after fix | VIS-001 / VIS-002 / VIS-003 |
| audit/screenshots/P03-dashboard-feed-hover-before.png | Dashboard — Commentator | Feed row hover before | E1 reverify |
| audit/screenshots/P03-dashboard-feed-hover-after.png | Dashboard — Commentator | Feed row hover after | E1 reverify |
| audit/screenshots/P05-strategy-load.png | Strategy | Abbreviated audit load | Pass |
| audit/screenshots/P06-telemetry-load.png | Telemetry | Abbreviated audit load | Pass |

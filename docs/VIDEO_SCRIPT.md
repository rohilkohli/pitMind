<div align="center">

# 🎬 PitMind Solution Video Script
### 3-Minute Presentation Outline

[![PitMind Platform](https://img.shields.io/badge/PitMind-Video_Script-e10600.svg?style=for-the-badge)](#)

</div>

<br/>

> [!NOTE]
> This script is designed for a **3-minute solution video** as required by the May Challenge submission. Timestamps are approximate — adapt pacing as needed.

---

## 🎯 Script Structure

### [0:00 – 0:25] **Hook & Problem** *(25 seconds)*

**SHOW:** PitMind landing page → rapid montage of live dashboard

**SAY (voiceover):**

> *"In Formula 1, a single pit stop decision can win or lose a race. Teams process thousands of data points per second — tyre wear, fuel loads, gap deltas — but their tools are fragmented, opaque, and inaccessible.*
>
> *Strategy calls are 'black box.' Fans are locked out. Post-race analysis takes hours.*
>
> *PitMind changes that."*

**KEY POINT:** Establish the problem clearly — judges need to hear *what problem you're solving*.

---

### [0:25 – 1:15] **Live Demo — Engineer Mode** *(50 seconds)*

**SHOW:** Live dashboard at `pitmind-frontend.*.codeengine.appdomain.cloud`

**Walk through these screens (spend ~10s on each):**

1. **Login → Dashboard** — Show the glassmorphic engineer console with live telemetry
2. **Strategy Recommendation** — Click "Analyze" → show the pit urgency scores, suggested compound, and AI narration
3. **⭐ Confidence Decomposition** *(spend extra time here — this is your differentiator)* — Show the 4-dimension breakdown: Data Quality, Model Certainty, Stability, Regret Bound. Explain: *"Engineers don't just get a number — they see exactly WHY the AI is confident or uncertain."*
4. **Copilot Chat** — Type a question like *"Should we pit this lap?"* → show Granite responding with data-backed reasoning

**SAY:**
> *"PitMind turns raw telemetry into explainable strategy. Every recommendation comes with transparent confidence decomposition — engineers see exactly which data dimensions are driving the AI's advice."*

---

### [1:15 – 1:45] **Fan Mode & Docling Debrief** *(30 seconds)*

**SHOW:** Switch to Fan Mode (`/fan` route)

**Walk through:**
1. **Fan Mode** — Show the simplified AI commentary, battle cards, intensity tracking. *"Fans get the same strategic intelligence — translated into plain English."*
2. **PDF Debrief** — Upload a sample PDF → show Docling parsing it → Granite generating the 5-section strategic debrief. *"Post-race, teams upload FIA documents — Docling extracts structure, Granite generates instant debriefs."*

---

### [1:45 – 2:30] **Technical Architecture & IBM Tools** *(45 seconds)*

**SHOW:** Architecture diagram from README (or screen-share the docs page)

**SAY:**
> *"PitMind uses three IBM AI technologies:*
>
> *First, IBM Granite via Watsonx.ai — the core AI backbone. Our heuristic engine calculates pit urgency scores, then Granite explains the math in natural language. The key design choice: Granite explains pre-computed scores rather than inventing strategy — ensuring accuracy.*
>
> *Second, Docling — IBM's document AI. It converts race PDFs into structured Markdown, preserving tables and figures, before Granite generates debriefs.*
>
> *Third, Langflow — visual pipeline orchestration. It lets us merge external signals like weather data into the strategy context without touching backend code.*
>
> *The system runs live on IBM Cloud Code Engine with Redis caching, PostgreSQL audit logs, and WebSocket streaming."*

**KEY POINT:** Explicitly name all 3 IBM tools and explain *how* each is used — this directly satisfies the judging criteria.

---

### [2:30 – 3:00] **Impact & Closing** *(30 seconds)*

**SHOW:** "Why This Matters" section from README, or the live demo one more time

**SAY:**
> *"AI in racing isn't just about going faster — it's about making decisions faster, more transparent, and more inclusive.*
>
> *PitMind gives engineers trust through explainability, gives strategists instant analysis through Docling, and gives fans access to the strategic chess match.*
>
> *Built with IBM Granite, Docling, and Langflow. Deployed live on IBM Cloud. This is PitMind."*

**END:** Show the PitMind logo + live demo URL.

---

## ✅ Pre-Recording Checklist

- [ ] Live demo is accessible and backend is healthy (check `/health` endpoint)
- [ ] Prepare a sample telemetry payload to demo strategy recommendations
- [ ] Prepare a sample PDF to demo Docling debrief upload
- [ ] Test Fan Mode is rendering correctly
- [ ] Screen recording tool is set up (OBS, Loom, or QuickTime)
- [ ] Microphone audio is clear
- [ ] Video is under 3 minutes

## 💡 Pro Tips for Judges

1. **Lead with Confidence Decomposition** — it's your strongest innovation differentiator
2. **Show the live deployment** — proving it works on IBM Cloud is a huge credibility signal
3. **Name all 3 IBM tools explicitly** — don't make judges guess which tools you used
4. **Keep the energy high** — F1 is exciting, your video should match that energy
5. **End with the "why"** — connect back to the challenge theme of trust and explainability

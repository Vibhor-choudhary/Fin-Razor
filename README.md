# REVORA — Checkout Recovery Agent

Revora is a guardrailed AI system designed to safely recover checkout revenue without blind retries. It observes payment lifecycle events, detects at-risk sessions, and uses an LLM to propose bounded recovery strategies—such as retries or nudges—all while strictly adhering to deterministic guardrails.

## Demo

Watch Revora in action:

<video src="UI.mp4" controls="controls" style="max-width: 100%;">
  Your browser does not support the video tag.
</video>

*(If the video does not load, you can download or view it directly [here](UI.mp4))*

## Key Features

- **Safe Intervention:** Strictly limits actions to one per session, preventing overcharging or customer frustration.
- **Real & Simulated Modes:** Supports real Hyperswitch sandbox execution and deterministic simulation for nudges and responses.
- **Immutable Guardrails:** Bounded execution prevents modifying checkout amounts or intervening without adequate cooldown periods.
- **Audit Trails:** Comprehensive ledger of every decision, including raw payloads and abstentions.

## Tech Stack

- **Backend:** FastAPI, Python, SQLAlchemy, SQLite
- **Agent/AI:** Upsonic, Gemini / Groq
- **Payments:** Hyperswitch Sandbox
- **Frontend:** React, Vite, TypeScript

## Quick Start (Local Sandbox)

1. **Environment Configuration:**
   ```bash
   cp .env.example .env
   # Set up required keys (HYPERSWITCH_API_KEY_TEST, etc.)
   ```

2. **Backend Setup:**
   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python migrate.py
   python seed.py
   uvicorn main:app --reload --port 8000
   ```

3. **Frontend Setup (New Terminal):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Run Live Tests:**
   Navigate to the **Recovery Lab** (`http://localhost:5173/lab`) to trigger sandbox payment scenarios and observe the agent's recovery interventions in real time.

## Architecture

Revora consists of a FastAPI backend orchestrating an Upsonic AI agent, strictly bounded by deterministic guardrails, and a modern React/Vite dashboard to monitor recovery events and decisions. 

> To view the detailed architecture diagram, open `docs/ArchitectureDiagram.mmd` in any Mermaid viewer.

## License

MIT

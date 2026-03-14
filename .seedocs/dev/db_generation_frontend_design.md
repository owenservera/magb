# DB Generation Engine — Frontend Architecture & UI Design

## The Core Problem

The Universal Knowledge Engine (UKE) generation pipeline is a massive, parallelized, cost-incurring, and potentially fallible process. While the CLI is great for CI/CD and terminal-savvy operators, a full-scale knowledge extraction run (e.g., generating all of Python 3.12 across 12 phases) involves thousands of API calls, costs real money, and can hit rate limits or validation errors. 

We need a **Control Center** (Frontend) for the DB Generation Engine that provides:
1. **Total Observability:** Real-time visibility into what the LLMs are doing, how much they are spending, and where they are failing.
2. **Intervention Hooks:** The ability to pause, resume, manually fix, or override the LLM's decisions mid-flight.
3. **Pipeline Orchestration:** Visualizing the 12-phase pipeline so operators can see the forest (overall progress) and the trees (individual prompt failures).

---

## 1. Information Architecture

The application is organized around the lifecycle of a **Generation Run**.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  magB Engine Control Center                                             │
│  ┌──────────────┬──────────────┬──────────────┬─────────────┬────────┐  │
│  │ Dashboard    │ Targets      │ Active Runs  │ Immune Sys  │ Config │  │
│  └──────────────┴──────────────┴──────────────┴─────────────┴────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Pages / Routes
1. **`/` (Dashboard)**: Global overview. Current spend vs budget, active runs, recent failures, overall DB size.
2. **`/targets`**: The Target Universe. What is documented, what is pending, what has drifted. Queue new targets here.
3. **`/runs`**: List of all historical and active generation runs.
4. **`/runs/[run_id]`**: The **Pipeline Visualizer**. The most important screen.
5. **`/immune-system`**: Health events requiring human intervention (e.g., "PDF 2.0 spec changed, please review").
6. **`/config`**: LLM API keys, budget limits, rate limit tuning.

---

## 2. Key Interface Designs

### A. The Target Universe & Queue
*Goal: Select what to generate next.*

- **Grid/Table View**: Lists all known targets (Python, Rust, PPTX, PNG).
- **Status Indicators**: `Documented`, `Needs Update`, `Generating`, `Queued`.
- **Action**: "Queue Generation". Opens a modal to select:
  - Version (e.g., "3.13")
  - Depth (Layers 1, 2, 3)
  - Max Budget limit for this run
  - Concurrency limit

### B. The Pipeline Visualizer (The Run Detail Page)
*Goal: Watch the machine think.*

This is the heroic view of the application. It looks like a hybrid between a CI/CD pipeline (like GitHub Actions) and an APM dashboard (like Datadog).

```text
Run: Python 3.13 Generation  [ PAUSE ] [ CANCEL ]
Status: IN PROGRESS (Phase 3/12)
Budget: $12.40 / $50.00 used  |  Tokens: 1.2M IN / 400K OUT

┌── PIPELINE ─────────────────────────────────────────────────────────────┐
│                                                                         │
│  [✓] 1. Decompose    [✓] 2. Enumerate     [⚙] 3. Generate Content       │
│      150 nodes           4 anchors            452 / 1500 complete       │
│                                                                         │
│  [ ] 4. Gap Analyze  [ ] 5. Fill Gaps     [ ] 6. Validate               │
│                                                                         │
│  [ ] 7. Capabilities [ ] 8. Format Atoms  [ ] 9. Algorithms             │
│                                                                         │
│  [ ] 10. Impl. Specs [ ] 11. Blueprints   [ ] 12. Final Validation      │
└─────────────────────────────────────────────────────────────────────────┘

┌── LIVE LOG / WORKERS (10 concurrent) ───────────────────────────────────┐
│                                                                         │
│  Worker 1: Generating Python/Control Flow/For Loop...     [2.1s]        │
│  Worker 2: Generating Python/Data Types/Dict...           [4.5s]        │
│  Worker 3: ⚠️ FAILED (Rate Limit) -> Retrying in 4s...                  │
│  Worker 4: Generating Python/Classes/Multiple Inherit...  [1.2s]        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Features of the Visualizer:**
- **Live Waterfall**: See exactly which nodes are being generated right now.
- **Cost Ticker**: Real-time USD counter updating every second based on token usage.
- **Intervention Panel**: If a prompt fails 3 times, it pauses that branch and highlights it in red, allowing the human operator to view the prompt, tweak it, and resume.

### C. The Immune System Triage
*Goal: Manage the decay of the database.*

- **Inbox UI**: Looks like an email inbox but for knowledge rot.
- **Items**: "Python 3.13 released", "Contradiction found in JS Async docs".
- **Actions**: "Auto-Heal (Est. $0.40)", "Manual Review", "Ignore".

---

## 3. Technology Stack

Since this is an internal/operator tool, it needs to be fast, data-dense, and highly reactive.

- **Framework**: React + Vite (SPA) or Next.js (App Router). *Recommendation: Next.js for unified full-stack with the DB API.*
- **Styling**: Tailwind CSS + shadcn/ui. (Dense, dark-mode preferred UI, similar to Vercel/Linear).
- **State/Data Fetching**: TanStack React Query (polling for live run status) or WebSockets for real-time log streaming.
- **Graph Visualization**: ReactFlow for visualizing the generated topic trees and blueprints in real-time.
- **Code Editor**: Monaco Editor (for reviewing and manually fixing generated code/JSON during interventions).

---

## 4. API Contract Requirements

To power this frontend, the CLI/Engine needs to expose an HTTP API (or the frontend runs as the server orchestrating the engine). 

**Required Endpoints:**
- `GET /api/runs` (List active/historical runs)
- `GET /api/runs/{id}/status` (Polling endpoint for the pipeline state, token usage, cost)
- `POST /api/runs/{id}/pause`
- `POST /api/runs/{id}/resume`
- `GET /api/runs/{id}/logs` (Server-Sent Events or WebSocket for live worker logs)
- `POST /api/targets/queue` (Trigger a new run)

---

## 5. Visual Aesthetic

- **Theme**: "Engineering Control Room". Dark backgrounds (`#0a0a0b`), monospace fonts for logs and metrics (`JetBrains Mono`), bright accent colors for states:
  - 🟢 Green (`#22c55e`): Completed, Healthy
  - 🟡 Yellow (`#eab308`): In Progress, Retrying
  - 🔴 Red (`#ef4444`): Failed, Budget Exceeded
  - 🟣 Purple (`#a855f7`): AI Generation / Thinking state
- **Density**: High density. Operators want to see as much data as possible without scrolling. Use tooltips for full JSON payloads instead of expanding rows.

## 6. Implementation Phases

1. **Phase 1: Read-Only Dashboard**: Connect to the SQLite DB and display historical runs, total cost, and database size.
2. **Phase 2: Live Orchestration**: Implement the Pipeline Visualizer with live polling of a running generation process. Add Pause/Cancel buttons.
3. **Phase 3: Human-in-the-loop**: Add the ability to click a failed generation node, see the raw LLM output and the parse error, manually edit the JSON, and force the pipeline to accept it and continue.

# Schema Completeness Evaluation Report
**Objective:** Evaluate the current [schema.prisma](file:///c:/0-BlackBoxProject-0/magb/prisma/schema.prisma) against the original seed documentation (`magB_Database Architecture` docs and `MISSING ELEMENTS` docs) to identify missing elements and discrepancies.

## Executive Summary
The current [schema.prisma](file:///c:/0-BlackBoxProject-0/magb/prisma/schema.prisma) is highly aligned with the Cathedral architecture (Opus 4.6 "Thinking") and implements almost all the required conceptual models (Concepts, Targets, Layered Generation, Graph Relations, Observability, Completeness Anchors). It successfully synthesizes the need for distinct tables while preserving polymorphic graphing.

However, when compared against the `MISSING ELEMENTS` documentation—which focuses on the pragmatic, operational needs of the **Seed Project**—several discrepancies and missing components emerge. The current schema is built for the *final* system, lacking some structures required to actually run the *MVP*.

## Key Discrepancies & Missing Elements

### 1. The MVP Database Engine Conflict (SQLite vs. PostgreSQL)
- **Seed Doc Requirement:** Gap 3 states: *"Decision: Start with SQLite + sqlite-vec, migrate to PostgreSQL when we hit limits. Zero deployment friction."*
- **Schema Reality:** The Prisma schema explicitly enforces PostgreSQL. It uses `provider = "postgresql"`, relies on postgres arrays (`String[]`), and uses `Unsupported("vector(1536)")`.
- **Missing Impact:** The schema cannot be run incrementally on SQLite for the Seed Project. This blocks the primary mandate of the MVP.

### 2. Granular Resume & Checkpoint State 
- **Seed Doc Requirement:** Gap 5 details a `PhaseCheckpoint` and `PipelineCheckpoint` system to survive crashes. It explicitly tracks `processed_ids`, `failed_items`, and per-phase `cost_usd`.
- **Schema Reality:** The `GenerationRun` model handles overall progress (`currentPhase`, `totalCostUsd`) and has a generic `errors Json` field.
- **Missing Elements:** There is no schema-enforced structure for **Phase Checkpoints**. To resume smoothly, we are missing a `GenerationPhaseRun` model (or structured JSON column) that tracks exact sets of `processed_ids` and precise token/error counts per individual pipeline phase.

### 3. Budget Limits and Cost Controls
- **Seed Doc Requirement:** Gap 6 introduces strict budget enforcement (`max_per_target_usd`, `max_per_phase_usd`).
- **Schema Reality:** `GenerationRun` tracks the *spent* cost (`totalCostUsd`), but neither `Target` nor `GenerationRun` models have fields to store the actual **budget limits**.
- **Missing Elements:** To enforce costs at the schema level, `GenerationRun` and/or `Target` should include `budgetLimitUsd` or similar configuration columns so the pipeline knows when to hard-stop via database state, rather than just app-level config.

### 4. Target Registry Pragmatism
- **Seed Doc Requirement:** A runnable target registry needs to track `complexity` and prioritize execution.
- **Schema Reality:** The `Target` model correctly contains `tier` (CORE, ECOSYSTEM, etc.) and `popularityScore`.
- **Missing Elements:** Conceptually complete, but it lacks execution-specific metadata fields like `estimatedCost`, `complexityLevel`, or explicit `isEnabled` / `isSeedTarget` flags to differentiate the single Python 3.12 target from the 10,000 others.

### 5. Application-Level Assets
- **Seed Doc Requirement:** Prompt Libraries, Context Parsers.
- **Schema Reality:** The schema doesn't store prompts or config templates (unless implicitly inside `metadata Json`).
- **Verdict:** Properly excluded. Storing prompt templates in code (`prompt_lab.py`) is standard for an MVP.

## Conclusion & Recommendations

The schema is beautiful but currently "too enterprise" for the dictated Seed phase. To make it strictly compliant with the MVP requirements:

1. **Resolve the SQLite Constraint:** Either accept the friction of deploying Postgres + pgvector for the Seed project, or refactor the Prisma schema to be SQLite-compatible (removing arrays, replacing pgvector with JSON/blobs for now).
2. **Add Checkpoint Granularity:** Add a `GenerationPhaseCheckpoint` model connected to `GenerationRun` to store explicit arrays of processed/failed entity IDs per phase.
3. **Add Budget Controls:** Implement `budgetLimitUsd` fields in `Target` and `GenerationRun`.

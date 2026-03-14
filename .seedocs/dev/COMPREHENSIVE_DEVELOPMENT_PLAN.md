# Comprehensive Development Plan: Universal Knowledge Engine (magB)

This document provides a highly detailed, phased development plan to build the Universal Blueprint Machine (magB) from scratch to a working, scalable system. 

It has been updated to reflect the **actual state of the repository**, which is initialized as a **TypeScript + Bun** project using **Prisma** as the ORM, connected to a **Google Cloud PostgreSQL** database.

---

## Executive Summary of Technical Stack

*   **Core Backend & Pipeline Engine**: TypeScript, Bun *(Actual Repo State)*
*   **Database (Production Ready)**: PostgreSQL with `pgvector` hosted on Google Cloud SQL *(User confirmed)*. 
*   **ORM**: Prisma *(Actual Repo State)*
*   **LLM Provider (POC/Initial)**: Z.ai SDK using `glm-4.7-flash` (via REST or TS SDK wrapper) for high-volume tasks and JSON extraction.
*   **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, Zustand, React Query. 
*   **Graph/UI Viz**: D3.js, ReactFlow.

*Note: The original conceptual documents proposed a Python/FastAPI/SQLite MVP. Based on the actual repository setup, we are bypassing the SQLite MVP and building directly on the scalable TypeScript/Postgres/Prisma stack.*

---

## PHASE 1: FOUNDATION & CLOUD DB WIRING (Weeks 1-2)
**Goal:** Verify the database connection, seed the universal taxonomy, and build a prompt testing harness in TypeScript to validate the LLM outputs.

### 1.1 Database Connectivity & Migration
*   **Action**: Ensure `cloud-sql-proxy` connects securely to the Google Cloud PostgreSQL instance.
*   **Action**: Apply the comprehensive `prisma/schema.prisma` to the cloud database (`bunx prisma db push` or `bunx prisma migrate dev`).
*   **Action**: Write basic health check scripts in `index.ts` to verify read/write access to the database.

### 1.2 LLM Client & Z.ai Integration (TypeScript)
*   **Action**: Build the robust `LLMClient` class in TypeScript.
*   **Implementation**: Create methods for `generate` and `generate_json` using the Z.ai API (`glm-4.7-flash`). Implement strict exponential backoff, rate limiting (Token Bucket), and error handling for API timeouts.
*   **Action**: Build a robust `ResponseParser` in TypeScript to clean up LLM JSON (handling markdown fences, trailing commas, and truncated responses).

### 1.3 The Prompt Lab (TypeScript)
*   **Action**: Create `src/prompt_lab.ts` to manually test and iterate on prompt templates without running the full pipeline.
*   **Testing**: Run prompts for `discover_capabilities`, `extract_structural_template`, and `extract_algorithm` specifically targeting **JSON** as a simple test format.

### 1.4 Seed Taxonomy & Target Registry
*   **Action**: Create seed scripts (`src/seed/taxonomy.ts` and `src/seed/registry.ts`).
*   **Action**: Populate the DB with the hand-curated `Concept` taxonomy (e.g., `control.iteration.for`, `format.img.pixel`).
*   **Action**: Define the `Target` registry prioritizing JSON (Tier 1 Data), PNG (Tier 1 Binary), and Python 3.12 (Tier 1 Language).

---

## PHASE 2: LAYER 1 GENERATION PIPELINE (Weeks 3-4)
**Goal:** Build the TypeScript orchestrator to automate the generation of "Layer 1: Reference" knowledge for a single target (JSON).

### 2.1 The 6-Phase Pipeline Engine (in TS)
*   **Phase 1: Decompose**: Build the hierarchical `TopicNode` tree.
*   **Phase 2: Enumerate**: Generate `CompletenessAnchor`s (e.g., all valid JSON value types).
*   **Phase 3: Generate**: Massively parallel generation of `Entry` content for every leaf node at multiple resolutions (Micro, Standard, Exhaustive).
*   **Phase 4: Gap Analysis**: Cross-reference the tree against anchors.
*   **Phase 5: Fill Gaps**: Decompose and generate for missing items.
*   **Phase 6: Validate**: Spot-check via an alternate LLM prompt.

### 2.2 Orchestration & Resilience
*   **Checkpoint/Resume System**: Implement a `GenerationRun` state tracker in Prisma so that a crash at item 400/500 can seamlessly resume.
*   **Budget Controller**: Implement hard-stop budget enforcements for API spend.

### 2.3 Initial Run & Quality Audit
*   **Action**: Run the pipeline end-to-end on the **JSON format**.
*   **Audit**: Check if the pipeline accurately captures object structures, string escaping rules, and valid numeric formats into the PostgreSQL database.

---

## PHASE 3: IMPLEMENTATION LAYER & DEDUPLICATION (Weeks 5-6)
**Goal:** Generate Layer 2 (Atoms) and Layer 3 (Blueprints). Validate cross-target connections and deduplication logic.

### 3.1 Pipeline V2: Phases 7-12
*   **Phase 7: Enumerate Capabilities**: Extract user-facing features (e.g., "Encode RGB pixels to PNG").
*   **Phase 8: Extract Format Atoms**: Catalog binary fields, XML elements, magic bytes into the `Atom` table.
*   **Phase 9: Extract Algorithms**: Extract mathematical specs and implementation code (e.g., DEFLATE, CRC32).
*   **Phase 10: Implementation Specs**: Write the step-by-step assembly guides.
*   **Phase 11: Assemble Blueprints**: Design the architecture modules combining capabilities.
*   **Phase 12: Validate Implementations**: Attempt to parse/run the generated code.

### 3.2 Deduplication Engine
*   **Action**: Implement deduplication logic leveraging the `pgvector` embeddings. Before creating a new algorithm, run a similarity search to link to existing algorithms (e.g., ensuring ZIP and PNG both point to the *same* DEFLATE algorithm node).

### 3.3 Second Target Generation
*   **Action**: Run the pipeline on **PNG format** to test binary layout specifications and algorithm sharing.

---

## PHASE 4: THE ACCESS LAYER & API (Weeks 7-8)
**Goal:** Expose the generated Postgres DB via a robust backend intended for developers, AI Agents, and the internal UI. (Recommended: Elysia.js or Next.js API Routes).

### 4.1 Core Retrieval Endpoints
*   `GET /v1/search`: Hybrid full-text (`pg_trgm`) and semantic search (`pgvector`).
*   `GET /v1/explore/targets` and `/targets/{id}/tree`: Topic tree navigation.
*   `GET /v1/retrieve/entry/{id}`: Fetch multi-resolution knowledge entries.
*   `GET /v1/capabilities/{id}/bundle`: The "Everything" endpoint (templates, atoms, algorithms, code).

### 4.2 AI Context Assembly Service
*   **Action**: Build `ContextService.assemble()`.
*   **Logic**: Accept a natural language task and a `token_budget`. Perform vector search, score candidates (relevance * quality * novelty), select optimal resolutions (Micro vs Exhaustive) to fit the budget, and return a concatenated context string.

### 4.3 Implementation Synthesis
*   `POST /v1/implement/plan`: Accept a goal (e.g., "Create a PPTX slide"), determine feasibility, and output an ordered `ImplementationStep` array containing exact structural templates and code.

---

## PHASE 5: THE FRONTEND PLATFORM (Weeks 9-10)
**Goal:** Build the React/Next.js application to explore the database, build software, and operate the pipeline.

### 5.1 Application Shell & Dashboard
*   **Setup**: Next.js App Router, Tailwind CSS, shadcn/ui.
*   **Features**: Global Search (Command Palette ⌘K), Vitality Gauge components.
*   **Landing Page**: "The Universal Knowledge Engine" search hero, Target Grids, and recent drift events.

### 5.2 Explorer Mode
*   **Target Detail View**: Topic tree explorer, coordinate system visualizers.
*   **Entry Viewer**: Crucial feature: **Resolution Toggle** (Micro / Standard / Exhaustive) that dynamically swaps the visible content and updates token counts.
*   **Graph Explorer**: Use D3.js or ReactFlow to visualize the dependency graph using the `Relation` table.

### 5.3 Builder Mode
*   **Assemble Workspace**: A split-pane view where developers input a task, specify the target format and language, and receive the Knowledge Bundle or AI Context output. Includes one-click copy blocks.
*   **Comparison Tool**: Side-by-side view of concepts across targets (e.g., Error Handling in Rust vs Go).

---

## PHASE 6: OBSERVABILITY & THE IMMUNE SYSTEM (Weeks 11-12)
**Goal:** Transition the database from a static snapshot to a "living organism" that tracks its own decay and triggers auto-healing.

### 6.1 The Five Vital Signs & Ledger
*   **Implement Analyzers**:
    *   *Coverage*: Compare `CompletenessAnchor` arrays to generated paths.
    *   *Accuracy*: Spot-check entries via secondary LLM prompts.
    *   *Freshness*: Implement `NodeVitality.compute_freshness_decay()` using exponential decay based on `DecayRate`.
    *   *Depth*: Check for the presence of Layer 2/3 assets.
    *   *Coherence*: Find broken dependency relations or semantic duplicates.
*   **Action**: Write these metrics periodically to `HealthSnapshot`.

### 6.2 External Sensors & Drift Detection
*   **Implementation**: Build `GitHubReleaseSensor` and `SpecificationChangeSensor` to periodically check target ecosystems.
*   **Action**: When a sensor detects a change, record a `HealthEvent` and trigger a freshness downgrade.

### 6.3 The Immune System (Auto-Healing)
*   **Implementation**: Build `HealingLoop`. 
*   **Logic**: Consume the highest-priority drift events within a daily USD budget. Trigger automated regenerations for stale nodes and record the fixes.

---

## PHASE 7: SCALE AND PRODUCTIONIZE (Month 4+)
**Goal:** Move beyond the POC targets to the full Tier 1 set.

### 7.1 Tier 1 Generation Wave
*   Execute generation runs for top languages (Rust, JavaScript, Go, C++) and document formats (PPTX, DOCX, PDF, HTML, CSS).
*   Optimize the TypeScript orchestration scripts for multi-threading without violating Z.ai RPM/TPM rate limits.

### 7.2 Artifact Management
*   Move large generated artifacts (e.g., full blueprint code repositories) to blob storage (Google Cloud Storage), updating `contentRef` pointers in the database.

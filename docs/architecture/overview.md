# 🏗️ Architecture Overview

This document provides a technical overview of magB's architecture for contributors and developers.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     magB System Architecture                     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                   CLI / API Interface                       │  │
│  │   magb generate   magb query   magb browse   magb ace      │  │
│  └──────────────────────────┬─────────────────────────────────┘  │
│                              │                                    │
│  ┌──────────────────────────▼─────────────────────────────────┐  │
│  │                  ORCHESTRATOR                               │  │
│  │   State machine driving the pipeline phases                 │  │
│  │   Checkpoint/resume │ Progress tracking │ Cost accounting   │  │
│  └──────────┬──────────────────────────────┬──────────────────┘  │
│             │                              │                      │
│  ┌──────────▼──────────┐     ┌─────────────▼────────────────┐   │
│  │   GENERATION        │     │   QUERY ENGINE                │   │
│  │   PIPELINE          │     │                               │   │
│  │                     │     │   Semantic search (pgvector)   │   │
│  │   Phase 1: Discover │     │   Graph traversal (CTE)       │   │
│  │   Phase 2: Extract  │     │   Context budget planning     │   │
│  │   Phase 3: Validate │     │   Multi-resolution selection  │   │
│  │   Phase 4: Integrate│     │                               │   │
│  └──────────┬──────────┘     └─────────────┬────────────────┘   │
│             │                              │                      │
│  ┌──────────▼──────────────────────────────▼──────────────────┐  │
│  │                  LLM CLIENT POOL                            │  │
│  │                                                             │  │
│  │   Cheap (Haiku/4o-mini) │ Mid (Sonnet/4o) │ Premium (Opus) │  │
│  │   Rate limiting │ Retry │ JSON enforcement │ Cost tracking  │  │
│  └──────────┬──────────────────────────────────────────────────┘  │
│             │                                                     │
│  ┌──────────▼──────────────────────────────────────────────────┐  │
│  │                  KNOWLEDGE DATABASE                          │  │
│  │                  PostgreSQL + pgvector                       │  │
│  │                                                              │  │
│  │   Core Layer:    concepts, families, targets, versions       │  │
│  │   Knowledge:     entries (multi-res), examples               │  │
│  │   Implementation: atoms, algorithms, capabilities, blueprints│  │
│  │   Graph:         relations (typed, weighted, directional)    │  │
│  │   Ops:           generation_runs, validations, embeddings    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                  OBSERVABILITY                                │  │
│  │   Coverage │ Accuracy │ Freshness │ Depth │ Coherence        │  │
│  │   Diagnostic engines │ Health ledger │ Immune system          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                  ACE (AI Contribution Engine)                 │  │
│  │   Secure vault │ Budget manager │ Task allocator │ Dashboard  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

### Generation Pipeline
The 4-phase (12-step internally) pipeline that transforms a target name into a complete knowledge base. See [Pipeline Details](pipeline.md).

### Knowledge Database
PostgreSQL with pgvector extension. 12+ tables organized in 5 layers (Core, Knowledge, Implementation, Graph, Operations). See [Database Schema](database-schema.md).

### LLM Client Pool
Multi-provider async client with model-tier routing, rate limiting, retry logic, and cost tracking. Supports OpenAI, Anthropic, Google, and local models.

### Query Engine
Combines semantic vector search (pgvector HNSW), graph traversal (recursive CTEs), and context-window budget planning for intelligent knowledge retrieval.

### Observability
Continuous monitoring of 5 knowledge health dimensions with automated healing. See [Observability](../concepts/observability.md).

### ACE
Community-driven AI resource pooling. See [ACE](../concepts/ace.md).

---

## Data Flow

```
TARGET INPUT ("Python 3.12")
       │
       ▼
    Discover ──▶ Topic tree (~1,500 nodes)
       │
       ▼
    Extract  ──▶ Content entries (3 resolutions each)
       │          Atoms, algorithms, capabilities
       ▼
    Validate ──▶ Gap analysis against completeness anchors
       │          Code execution verification
       │          Cross-model accuracy checking
       ▼
    Integrate ──▶ Blueprints, composition rules
       │           Knowledge graph relations
       ▼
    KNOWLEDGE DATABASE
       │
       ├──▶ Human queries (CLI, API)
       ├──▶ AI context injection (COMPLETE_DATABASE.json)
       └──▶ Automated tools (structured JSON)
```

---

## Technology Stack

| Component | Technology | Why |
|---|---|---|
| Runtime | Bun | Fast, modern JavaScript runtime |
| Database | PostgreSQL + pgvector | Vector search + graph traversal + full-text in one DB |
| Schema | Prisma | Type-safe ORM with migrations |
| AI Providers | OpenAI, Anthropic, etc. | Multi-provider for cost optimization and redundancy |
| CLI | Custom | Direct control and scripting |
| Deployment | Docker + K8s (optional) | Simple local or cloud deployment |

---

## Learn More

- **[Database Schema](database-schema.md)** — Complete table specifications
- **[Generation Pipeline](pipeline.md)** — Detailed pipeline walkthrough
- **[The Three Layers](../concepts/three-layers.md)** — Conceptual model

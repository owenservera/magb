# magB Architecture

## System Overview

magB (The Universal Blueprint Machine) is an AI-powered knowledge extraction system that generates complete, structured, verified knowledge bases for programming languages, file formats, and software tools.

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js 14)                   │
│  Dashboard · Search · Explore · Build · Health               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Next.js API Routes)            │
│  /api/v1/health · /targets · /search · /vitality · ...       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Engine Layer (TypeScript)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Generation  │  │  Validation  │  │     LLM      │       │
│  │   Executor   │  │    Engine    │  │   Clients    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│  ┌──────────────┐  ┌──────────────┐                          │
│  │   Planner    │  │   Logging    │                          │
│  └──────────────┘  └──────────────┘                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               Database (PostgreSQL 15 + pgvector)            │
│  20+ tables · Knowledge Graph · Vector Embeddings · FTS      │
└─────────────────────────────────────────────────────────────┘
```

## Core Concepts

### The Three Layers of Knowledge

magB organizes knowledge into three layers:

**Layer 1: Capability Knowledge** — *What can this technology do?*
- Complete feature inventory
- Organized tree with dependencies mapped
- Example: "JSON supports objects, arrays, strings, numbers, booleans, null"

**Layer 2: Implementation Knowledge** — *How does each feature actually work?*
- Exact templates (XML, JSON, binary structures)
- Working algorithms with math and code
- Coordinate systems, unit conversions, constraints

**Layer 3: Integration Knowledge** — *How do I build complete applications?*
- Architecture blueprints for real applications
- Composition rules (what happens when features combine)
- Complete runnable starter implementations

### Knowledge Graph Structure

```
Target (e.g., "JSON")
├── Capability (e.g., "Parse JSON")
│   ├── Atom (structural template)
│   └── Algorithm (parsing logic)
├── Capability (e.g., "Stringify JSON")
│   ├── Atom (output format)
│   └── Algorithm (serialization)
└── Concept (e.g., "Data Serialization")
    └── Entry (JSON-specific implementation)
```

### Entity Types

| Entity | Description | Example |
|--------|-------------|---------|
| **Target** | A programming language, file format, or tool | JSON, Python, PPTX |
| **Capability** | A user-facing feature | "Parse JSON", "Draw Rectangle" |
| **Atom** | Irreducible structural building block | XML element, binary field |
| **Algorithm** | Computational procedure with math foundation | CRC32, Gaussian Blur |
| **Entry** | Multi-resolution knowledge (micro/standard/exhaustive) | "Definite Iteration" |
| **Concept** | Universal idea spanning multiple targets | "Iteration", "Error Handling" |
| **Relation** | Connection between entities | IMPLEMENTS, REQUIRES, ANALOGOUS_IN |

## Generation Pipeline

The 12-stage extraction state machine:

```
1. DECOMPOSE      → Break target into manageable chunks
2. ENUMERATE      → List all capabilities (Layer 1)
3. GENERATE       → Extract templates and algorithms (Layer 2)
4. GAP_ANALYZE    → Identify missing knowledge
5. FILL           → Generate gap-filling content
6. VALIDATE       → Execute code, verify correctness
```

### Task Planning

Tasks are organized in a dependency graph:
- **Layer 1** tasks have no dependencies (run first)
- **Layer 2** tasks depend on Layer 1 capability discovery
- **Layer 3** tasks depend on Layer 2 completion

### Checkpoint System

The pipeline supports resumption:
- Each task is checkpointed on completion
- Failed tasks can be retried
- Progress persists across restarts

## Observability Model

### Five Vital Signs

Knowledge health is tracked via five metrics:

1. **Freshness** — How recent is the knowledge?
   - Decay based on half-life (eternal/stable/normal/fast/volatile)
   
2. **Correctness** — How validated is the content?
   - Based on validation pass rate and confidence scores
   
3. **Completeness** — How much of the target is covered?
   - Ratio of expected vs actual entries
   
4. **Connectivity** — How well-linked is the graph?
   - Orphan nodes, dangling edges
   
5. **Usage** — How often is knowledge accessed?
   - Query frequency, API calls

### Vitality Scoring

```
overall_vitality = geometric_mean(freshness, correctness, completeness)
```

Scores range from 0-100:
- **80-100**: Healthy (green)
- **60-79**: Warning (yellow)
- **40-59**: Critical (orange)
- **0-39**: Decayed (red)

## API Architecture

### REST Endpoints

| Category | Endpoints |
|----------|-----------|
| **Explore** | `GET /targets`, `GET /targets/:id`, `GET /concepts`, `GET /graph/neighbors/:id` |
| **Retrieve** | `GET /capabilities/:id/bundle`, `GET /algorithms/:id`, `GET /structures/:id` |
| **Synthesize** | `POST /assemble`, `POST /blueprint`, `POST /diagnose` |
| **Search** | `POST /search`, `GET /search/algorithms` |
| **AI** | `POST /ai/context`, `GET /ai/system-prompt/:id` |
| **Health** | `GET /vitality`, `GET /vitality/drift-events` |
| **Meta** | `GET /meta/statistics`, `GET /meta/node-types` |

### Response Format

```typescript
interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    limit?: number;
    offset?: number;
    timestamp?: string;
  };
}
```

## Database Schema

### Core Tables (12+)

1. **targets** — Documented technologies
2. **target_versions** — Version tracking with delta chains
3. **concepts** — Universal ideas
4. **entries** — Multi-resolution knowledge
5. **examples** — Version-aware code examples
6. **atoms** — Structural building blocks
7. **algorithms** — Computational procedures
8. **capabilities** — User-facing features
9. **blueprints** — Architecture templates
10. **relations** — Graph edges
11. **generation_runs** — Pipeline execution history
12. **validations** — Validation results

### Extensions

- **pgvector** — Vector embeddings for semantic search
- **pg_trgm** — Trigram-based fuzzy search

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React 19, TypeScript |
| **Styling** | Tailwind CSS v4, Radix UI |
| **State** | Zustand, TanStack Query |
| **Backend** | Next.js API Routes |
| **Database** | PostgreSQL 15, pgvector |
| **ORM** | Prisma |
| **LLM** | Z.AI API (extensible to OpenAI, Anthropic) |
| **Runtime** | Bun |
| **Testing** | Vitest, Testing Library |
| **CI/CD** | GitHub Actions |

## Deployment

### Docker

```bash
docker-compose up --build
```

### Environment Variables

```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
ZAI_API_KEY=your-api-key
LOG_LEVEL=INFO
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Google Cloud SQL

For production, magB uses Google Cloud SQL for PostgreSQL:
- Instance: `db-f1-micro` (POC), scalable to `db-custom`
- Region: `us-central1`
- Extensions: `pgvector`, `pg_trgm`
- Connection: Cloud SQL Auth Proxy (port 5433)

## Security Considerations

1. **API Key Management** — Keys stored in environment variables, never committed
2. **Database Access** — Cloud SQL Auth Proxy, no public IP
3. **Code Execution** — Sandboxed Python execution with timeout
4. **Rate Limiting** — Token bucket algorithm prevents API abuse
5. **Input Validation** — Zod schemas validate all user input

---

*Last Updated: 2026-03-13*  
*magB — The Universal Blueprint Machine*

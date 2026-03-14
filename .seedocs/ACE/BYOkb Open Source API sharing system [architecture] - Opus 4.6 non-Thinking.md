

# ACE: AI Contribution Engine — Production Architecture

## The Core Insight Shift

Your original design prompt was about a generic contribution system. This refined context reveals the **actual product**: a decentralized knowledge generation factory where the orchestrator doesn't *do* the AI work — it **dispatches** work units to a swarm of contributor-donated compute, then **validates** the results through gamified human review.

This changes the architecture fundamentally.

---

## Architecture: The Inverted Pipeline

```
                    THE KNOWLEDGE FACTORY
                    
    ┌─────────────────────────────────────────────────┐
    │            DEMAND SIDE                           │
    │                                                 │
    │  Target Registry    Community Votes   Gap       │
    │  "What to generate" "What's next"    Analyzer   │
    │         │                │               │      │
    │         └────────────────┼───────────────┘      │
    │                          ▼                      │
    │              ┌────────────────────┐             │
    │              │  Work Unit Planner │             │
    │              │  (Decompose into   │             │
    │              │   dispatchable     │             │
    │              │   micro-tasks)     │             │
    │              └────────┬───────────┘             │
    └───────────────────────┼─────────────────────────┘
                            │
                            ▼
    ┌─────────────────────────────────────────────────┐
    │           ACE ORCHESTRATOR (Central)             │
    │                                                 │
    │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
    │  │ Task     │  │ Budget   │  │ Result       │  │
    │  │ Queue    │  │ Ledger   │  │ Aggregator   │  │
    │  │ (Redis)  │  │          │  │ & Dedup      │  │
    │  └────┬─────┘  └──────────┘  └──────┬───────┘  │
    │       │                              │          │
    └───────┼──────────────────────────────┼──────────┘
            │                              │
            ▼                              ▼
    ┌───────────────────┐    ┌────────────────────────┐
    │   SUPPLY SIDE     │    │   VALIDATION SIDE      │
    │                   │    │                         │
    │ ┌───┐ ┌───┐ ┌───┐│    │  ┌─────────────────┐   │
    │ │API│ │API│ │GPU││    │  │ "Tinder for Code"│   │
    │ │Key│ │Key│ │Wrk││    │  │  Human review    │   │
    │ │ A │ │ B │ │ C ││    │  │  Leaderboards    │   │
    │ └─┬─┘ └─┬─┘ └─┬─┘│    │  │  Consensus       │   │
    │   │     │     │   │    │  └─────────────────┘   │
    │   ▼     ▼     ▼   │    │                         │
    │  Workers pull      │    │  Validators review     │
    │  tasks, execute,   │    │  generated output,     │
    │  push results back │    │  upvote/flag/fix       │
    └───────────────────┘    └────────────────────────┘
            │                              │
            └──────────────┬───────────────┘
                           ▼
                ┌─────────────────────┐
                │  Knowledge Database │
                │  (The Output)       │
                │  SQLite + HF Dumps  │
                └─────────────────────┘
```

---

## Monorepo Structure

```
open-blueprint/
├── README.md
├── LICENSE-CODE                         # Apache 2.0 (engine)
├── LICENSE-DATA                         # CC-BY 4.0 (generated knowledge)
├── turbo.json                           # Turborepo config
├── pnpm-workspace.yaml
├── docker-compose.yml
├── docker-compose.dev.yml
├── Makefile
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── deploy.yml
│   │   ├── data-release.yml            # Monthly HuggingFace dumps
│   │   └── seed-generation.yml         # Phase 1 seed targets
│   ├── ISSUE_TEMPLATE/
│   │   ├── token-bounty.yml            # "We need 5M tokens for C++"
│   │   ├── target-request.yml          # "Please generate Lua"
│   │   └── bug-report.yml
│   └── CODEOWNERS
│
├── .devcontainer/                       # Zero-setup GitHub Codespaces
│   ├── devcontainer.json
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── post-create.sh
│
├── apps/
│   ├── web-portal/                      # Next.js — Dashboard, voting, validation
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx             # Landing + live generation stats
│   │   │   │   ├── explore/
│   │   │   │   │   └── page.tsx         # Browse generated knowledge
│   │   │   │   ├── vote/
│   │   │   │   │   └── page.tsx         # Vote on next targets
│   │   │   │   ├── validate/
│   │   │   │   │   └── page.tsx         # "Tinder for Code" UI
│   │   │   │   ├── donate/
│   │   │   │   │   └── page.tsx         # BYOK donation portal
│   │   │   │   ├── leaderboard/
│   │   │   │   │   └── page.tsx         # Top donors & validators
│   │   │   │   ├── sponsor/
│   │   │   │   │   └── [target]/
│   │   │   │   │       └── page.tsx     # "Adopt a Language"
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx         # Contributor dashboard
│   │   │   │   └── api/
│   │   │   │       ├── auth/[...nextauth]/route.ts
│   │   │   │       └── trpc/[trpc]/route.ts
│   │   │   ├── components/
│   │   │   │   ├── ValidationCard.tsx   # Single validation unit
│   │   │   │   ├── TargetVoteCard.tsx
│   │   │   │   ├── DonationWidget.tsx
│   │   │   │   ├── GenerationStatus.tsx
│   │   │   │   ├── KnowledgeViewer.tsx
│   │   │   │   ├── LeaderboardTable.tsx
│   │   │   │   └── BudgetMeter.tsx
│   │   │   ├── lib/
│   │   │   │   ├── trpc.ts
│   │   │   │   └── auth.ts
│   │   │   └── hooks/
│   │   │       ├── useValidation.ts
│   │   │       └── useRealtimeStatus.ts
│   │   └── public/
│   │       └── badges/                  # Contributor badge images
│   │
│   ├── ace-gateway/                     # FastAPI — Central orchestrator API
│   │   ├── pyproject.toml
│   │   ├── Dockerfile
│   │   ├── alembic.ini
│   │   ├── migrations/
│   │   ├── src/
│   │   │   ├── __init__.py
│   │   │   ├── main.py                 # FastAPI app entry
│   │   │   ├── config.py               # Settings via pydantic-settings
│   │   │   ├── deps.py                 # Dependency injection
│   │   │   │
│   │   │   ├── api/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── auth.py             # GitHub OAuth endpoints
│   │   │   │   ├── donations.py        # BYOK key registration
│   │   │   │   ├── targets.py          # Target CRUD + voting
│   │   │   │   ├── tasks.py            # Work unit dispatch/results
│   │   │   │   ├── validation.py       # Human validation endpoints
│   │   │   │   ├── leaderboard.py      # Scores & badges
│   │   │   │   ├── knowledge.py        # Query generated knowledge
│   │   │   │   └── webhooks.py         # GitHub webhook handler
│   │   │   │
│   │   │   ├── orchestrator/           # THE CORE
│   │   │   │   ├── __init__.py
│   │   │   │   ├── dispatcher.py       # Work unit dispatch logic
│   │   │   │   ├── planner.py          # Target → work units decomposition
│   │   │   │   ├── aggregator.py       # Collect & merge partial results
│   │   │   │   ├── scheduler.py        # Priority queue + fair scheduling
│   │   │   │   └── reconciler.py       # Handle conflicts, retries, dedup
│   │   │   │
│   │   │   ├── budget/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── ledger.py           # Immutable spend tracking
│   │   │   │   ├── caps.py             # Hard-cap enforcement
│   │   │   │   ├── estimator.py        # Pre-execution cost estimation
│   │   │   │   └── alerts.py           # Budget threshold notifications
│   │   │   │
│   │   │   ├── credentials/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── vault.py            # AES-256-GCM encrypted storage
│   │   │   │   ├── proxy.py            # API key proxy (keys never leave server)
│   │   │   │   └── rotation.py
│   │   │   │
│   │   │   ├── validation/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── consensus.py        # Multi-reviewer consensus logic
│   │   │   │   ├── scoring.py          # Validator reputation scoring
│   │   │   │   ├── queue.py            # Validation queue management
│   │   │   │   └── badges.py           # Achievement/badge system
│   │   │   │
│   │   │   ├── models/                 # SQLAlchemy models
│   │   │   │   ├── __init__.py
│   │   │   │   ├── user.py
│   │   │   │   ├── donation.py
│   │   │   │   ├── target.py
│   │   │   │   ├── work_unit.py
│   │   │   │   ├── generation.py
│   │   │   │   ├── validation_vote.py
│   │   │   │   ├── badge.py
│   │   │   │   └── knowledge_node.py
│   │   │   │
│   │   │   ├── events/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── bus.py              # Event bus
│   │   │   │   ├── handlers.py         # Event handlers
│   │   │   │   └── notifications.py    # Discord/Slack/email
│   │   │   │
│   │   │   └── worker/
│   │   │       ├── __init__.py
│   │   │       ├── celery_app.py       # Celery for background jobs
│   │   │       └── tasks.py            # Background task definitions
│   │   │
│   │   └── tests/
│   │       ├── unit/
│   │       ├── integration/
│   │       └── conftest.py
│   │
│   ├── prompt-lab/                      # Next.js — Prompt tuning web UI
│   │   ├── package.json
│   │   └── src/
│   │       ├── app/
│   │       │   ├── page.tsx             # Target selector + prompt editor
│   │       │   ├── playground/
│   │       │   │   └── page.tsx         # Live prompt testing
│   │       │   └── submit/
│   │       │       └── page.tsx         # Submit improved prompts as PRs
│   │       └── components/
│   │           ├── PromptEditor.tsx
│   │           ├── TargetSelector.tsx
│   │           ├── OutputPreview.tsx
│   │           └── DiffViewer.tsx
│   │
│   └── local-worker/                    # Standalone background worker
│       ├── pyproject.toml
│       ├── Dockerfile
│       ├── src/
│       │   ├── __init__.py
│       │   ├── main.py                  # `npx openblueprint-worker` entry
│       │   ├── runner.py                # Task execution loop
│       │   ├── heartbeat.py             # Health reporting to gateway
│       │   └── providers/
│       │       ├── __init__.py
│       │       ├── base.py
│       │       ├── ollama.py            # Local Ollama integration
│       │       ├── vllm.py              # vLLM integration
│       │       ├── llamacpp.py          # llama.cpp integration
│       │       └── api_proxy.py         # Execute via gateway-proxied API keys
│       └── tests/
│
├── packages/
│   ├── core-schema/                     # Shared Pydantic models
│   │   ├── pyproject.toml
│   │   └── src/
│   │       ├── __init__.py
│   │       ├── target.py                # Target definitions
│   │       ├── work_unit.py             # Work unit schema
│   │       ├── knowledge_node.py        # Generated knowledge schema
│   │       ├── validation.py            # Validation types
│   │       ├── contributor.py           # Contributor/donation types
│   │       └── events.py               # Event schemas
│   │
│   ├── pipeline/                        # The 12-stage generation engine
│   │   ├── pyproject.toml
│   │   └── src/
│   │       ├── __init__.py
│   │       ├── stages/
│   │       │   ├── __init__.py
│   │       │   ├── s01_skeleton_discovery.py
│   │       │   ├── s02_concept_enumeration.py
│   │       │   ├── s03_deep_generation.py
│   │       │   ├── s04_cross_reference.py
│   │       │   ├── s05_gap_analysis.py
│   │       │   ├── s06_validation.py
│   │       │   ├── s07_enrichment.py
│   │       │   ├── s08_indexing.py
│   │       │   ├── s09_packaging.py
│   │       │   ├── s10_quality_scoring.py
│   │       │   ├── s11_publishing.py
│   │       │   └── s12_monitoring.py
│   │       ├── prompts/
│   │       │   ├── templates/           # Jinja2 prompt templates
│   │       │   └── registry.py          # Prompt template registry
│   │       └── executor.py              # Stage executor
│   │
│   ├── ace-engine/                      # Orchestration core (reusable)
│   │   ├── pyproject.toml
│   │   └── src/
│   │       ├── __init__.py
│   │       ├── providers/
│   │       │   ├── __init__.py
│   │       │   ├── base.py              # Abstract adapter
│   │       │   ├── registry.py          # Auto-discovery registry
│   │       │   ├── router.py            # Multi-provider router
│   │       │   ├── openai.py
│   │       │   ├── anthropic.py
│   │       │   ├── google.py
│   │       │   ├── mistral.py
│   │       │   └── local.py
│   │       ├── budget.py                # Budget management
│   │       └── crypto.py               # Credential encryption
│   │
│   ├── sdk-python/                      # pip install openblueprint
│   │   ├── pyproject.toml
│   │   └── src/
│   │       ├── __init__.py
│   │       ├── client.py               # Query client
│   │       ├── models.py
│   │       └── offline.py              # SQLite local query
│   │
│   └── sdk-js/                          # npm install openblueprint
│       ├── package.json
│       └── src/
│           ├── index.ts
│           ├── client.ts
│           └── types.ts
│
├── data/
│   ├── taxonomy.json                    # Master taxonomy
│   ├── targets/                         # Target registry
│   │   ├── python.json
│   │   ├── json.json
│   │   ├── pptx.json
│   │   └── png.json
│   ├── seeds/                           # Phase 1 seed data
│   └── anchors/                         # Expert-submitted completeness anchors
│
├── extensions/
│   └── vscode/                          # VS Code extension
│       ├── package.json
│       ├── src/
│       │   ├── extension.ts
│       │   ├── providers/
│       │   │   ├── completionProvider.ts
│       │   │   └── hoverProvider.ts
│       │   └── db/
│       │       └── localQuery.ts        # Query local SQLite
│       └── README.md
│
├── docs/
│   ├── CONTRIBUTING.md                  # "Contribute in 60 seconds"
│   ├── ARCHITECTURE.md
│   ├── ROADMAP.md
│   ├── SECURITY.md                      # API key handling policy
│   ├── BYOK-GUIDE.md                   # "How your API key is protected"
│   └── PLUGIN-GUIDE.md                 # "Write a new provider in 20 lines"
│
└── scripts/
    ├── seed-generate.py                 # Generate Phase 1 seed targets
    ├── data-export.py                   # Export to HuggingFace
    └── benchmark.py                     # Cost/quality benchmarking
```

---

## Core Implementation: The Dispatch Architecture

### 1. Work Unit — The Atomic Unit of Distributed Generation

```python
# packages/core-schema/src/work_unit.py
"""
The Work Unit is the atomic unit of work in the ACE system.

A Target (e.g., "Python") is decomposed into hundreds of Work Units,
each small enough to be executed by a single API call or local GPU inference.
Work Units are dispatched to contributors' donated compute and results
are aggregated back into the knowledge database.

Design principles:
- Self-contained: carries all context needed for execution
- Idempotent: safe to retry or re-execute
- Small: typically 1 API call, ~2000-4000 output tokens
- Auditable: full provenance chain from donor to output
"""

from __future__ import annotations

import hashlib
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, computed_field


class WorkUnitPhase(str, Enum):
    """
    Which pipeline phase this work unit belongs to.
    Determines model tier routing and cost allocation.
    """
    SKELETON_DISCOVERY = "skeleton_discovery"     # Cheap: enumerate concepts
    CONCEPT_ENUMERATION = "concept_enumeration"   # Cheap: list sub-topics
    DEEP_GENERATION = "deep_generation"           # Expensive: full knowledge gen
    CROSS_REFERENCE = "cross_reference"           # Medium: link concepts
    GAP_ANALYSIS = "gap_analysis"                 # Medium: find missing pieces
    VALIDATION = "validation"                     # Cheap: verify correctness
    ENRICHMENT = "enrichment"                     # Medium: add examples/gotchas


class WorkUnitStatus(str, Enum):
    PENDING = "pending"           # In queue, not yet dispatched
    DISPATCHED = "dispatched"     # Sent to a worker, awaiting result
    EXECUTING = "executing"       # Worker confirmed execution started
    COMPLETED = "completed"       # Result received, not yet validated
    VALIDATED = "validated"       # Human-validated and accepted
    REJECTED = "rejected"         # Human-validated and rejected
    FAILED = "failed"             # Execution failed
    EXPIRED = "expired"           # Dispatch timed out, will be re-queued
    CANCELLED = "cancelled"


class ModelTierRequirement(str, Enum):
    """Which tier of model is needed for this work unit."""
    FRONTIER = "frontier"         # GPT-4o, Claude Sonnet 4 — deep generation
    STANDARD = "standard"         # GPT-4o-mini, Haiku — most tasks
    EFFICIENT = "efficient"       # Local LLMs, small models — skeleton/validation
    ANY = "any"                   # Worker can use whatever they have


class WorkUnit(BaseModel):
    """
    A single dispatchable unit of AI generation work.
    
    The orchestrator creates these by decomposing a Target into
    pipeline-stage-specific micro-tasks. Workers pull these from
    the task queue, execute them, and push results back.
    """
    
    # ── Identity ───────────────────────────────────────────────────
    id: UUID = Field(default_factory=uuid4)
    target_id: str = Field(..., description="e.g., 'python', 'pptx', 'lua'")
    phase: WorkUnitPhase
    sequence: int = Field(
        0, description="Ordering within phase for dependency resolution"
    )
    
    # ── The Prompt ─────────────────────────────────────────────────
    system_prompt: str = ""
    user_prompt: str = Field(
        ..., description="The actual prompt to send to the AI model"
    )
    context_payload: Dict[str, Any] = Field(
        default_factory=dict,
        description="Structured context: parent concepts, taxonomy path, etc."
    )
    
    # ── Execution Parameters ───────────────────────────────────────
    model_tier: ModelTierRequirement = ModelTierRequirement.STANDARD
    max_tokens: int = 4096
    temperature: float = 0.4
    json_mode: bool = False
    expected_output_schema: Optional[Dict[str, Any]] = Field(
        None, description="JSON Schema for structured output validation"
    )
    
    # ── Budget ─────────────────────────────────────────────────────
    estimated_input_tokens: int = 500
    estimated_output_tokens: int = 2000
    estimated_cost_usd: float = 0.0
    max_cost_usd: float = Field(
        0.50, description="Hard cap — abort if estimated cost exceeds this"
    )
    
    # ── Dependencies ───────────────────────────────────────────────
    depends_on: List[UUID] = Field(
        default_factory=list,
        description="Work unit IDs that must complete before this one"
    )
    
    # ── Dispatch State ─────────────────────────────────────────────
    status: WorkUnitStatus = WorkUnitStatus.PENDING
    priority: int = Field(5, ge=1, le=10, description="1=highest, 10=lowest")
    
    # ── Assignment ─────────────────────────────────────────────────
    assigned_to_donor_id: Optional[UUID] = None
    assigned_to_worker_id: Optional[str] = None
    assigned_provider: Optional[str] = None
    dispatched_at: Optional[datetime] = None
    execution_started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # ── Timeout & Retry ────────────────────────────────────────────
    timeout_seconds: int = 300         # 5 min default
    max_retries: int = 3
    retry_count: int = 0
    
    # ── Result ─────────────────────────────────────────────────────
    result_content: Optional[str] = None
    result_structured: Optional[Dict[str, Any]] = None
    result_model_used: Optional[str] = None
    result_provider_used: Optional[str] = None
    result_tokens_used: Optional[int] = None
    result_cost_usd: Optional[float] = None
    result_latency_ms: Optional[float] = None
    
    # ── Validation ─────────────────────────────────────────────────
    validation_score: Optional[float] = None    # 0.0 - 1.0 from human review
    validation_votes_up: int = 0
    validation_votes_down: int = 0
    validation_flags: List[str] = Field(default_factory=list)
    
    # ── Provenance ─────────────────────────────────────────────────
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    @computed_field
    @property
    def content_hash(self) -> str:
        """Deterministic hash for deduplication."""
        payload = f"{self.target_id}:{self.phase.value}:{self.user_prompt}"
        return hashlib.sha256(payload.encode()).hexdigest()[:16]
    
    @computed_field
    @property
    def is_expired(self) -> bool:
        """Check if dispatch has timed out."""
        if self.dispatched_at and self.status == WorkUnitStatus.DISPATCHED:
            elapsed = (datetime.utcnow() - self.dispatched_at).total_seconds()
            return elapsed > self.timeout_seconds
        return False
    
    @computed_field
    @property
    def can_retry(self) -> bool:
        return self.retry_count < self.max_retries


class WorkUnitResult(BaseModel):
    """Submitted by a worker when a work unit completes."""
    work_unit_id: UUID
    worker_id: str
    donor_id: UUID
    
    content: str
    structured_output: Optional[Dict[str, Any]] = None
    
    model_used: str
    provider_used: str
    input_tokens: int
    output_tokens: int
    total_tokens: int
    cost_usd: float
    latency_ms: float
    
    # Worker self-assessment
    confidence: float = Field(
        0.5, ge=0.0, le=1.0,
        description="Worker's self-assessed confidence in output quality"
    )
    
    error: Optional[str] = None
    completed_at: datetime = Field(default_factory=datetime.utcnow)


class WorkUnitBatch(BaseModel):
    """A batch of work units for efficient dispatch."""
    target_id: str
    phase: WorkUnitPhase
    units: List[WorkUnit]
    total_estimated_cost_usd: float
    total_estimated_tokens: int
    
    @computed_field
    @property
    def unit_count(self) -> int:
        return len(self.units)
```

### 2. The Dispatcher — Heart of the Decentralized Architecture

```python
# apps/ace-gateway/src/orchestrator/dispatcher.py
"""
The Dispatcher is the central brain of ACE.

It does NOT execute AI work. Instead it:
1. Maintains a priority queue of pending work units
2. Matches work units to available donor compute
3. Dispatches units to workers (API-key-proxied or local GPU)
4. Tracks execution state and handles timeouts/retries
5. Collects results and routes them to aggregation

Think of it as a job scheduler for a heterogeneous compute grid
where each node has different capabilities, cost profiles, and
hard budget caps set by the humans who donated them.
"""

from __future__ import annotations

import asyncio
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Set, Tuple
from uuid import UUID, uuid4

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from core_schema.work_unit import (
    ModelTierRequirement,
    WorkUnit,
    WorkUnitBatch,
    WorkUnitPhase,
    WorkUnitResult,
    WorkUnitStatus,
)

logger = structlog.get_logger(__name__)


# ── Donor & Worker Models ──────────────────────────────────────────

@dataclass
class DonorProfile:
    """
    A contributor who has donated API keys or local compute.
    Tracks their budget, preferences, and current allocation.
    """
    donor_id: UUID
    display_name: str
    github_username: Optional[str] = None
    
    # What providers they've donated
    available_providers: Dict[str, "DonorProviderSlot"] = field(
        default_factory=dict
    )
    
    # Sponsorship preferences
    sponsored_targets: Set[str] = field(default_factory=set)  # e.g., {"lua", "rust"}
    
    # Lifetime stats
    total_tokens_donated: int = 0
    total_cost_donated_usd: float = 0.0
    total_work_units_completed: int = 0
    joined_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class DonorProviderSlot:
    """
    A single provider credential donated by a contributor.
    Encapsulates budget cap and current spend.
    """
    provider_name: str           # "openai", "anthropic", "local"
    credential_id: str           # Reference into the credential vault
    
    # Hard caps (set by donor)
    budget_cap_usd: Optional[float] = None     # e.g., $10.00
    token_cap: Optional[int] = None            # e.g., 2_000_000
    rate_limit_rpm: Optional[int] = None       # Requests per minute
    
    # Model tier this slot can serve
    tier_capabilities: Set[ModelTierRequirement] = field(
        default_factory=lambda: {
            ModelTierRequirement.STANDARD,
            ModelTierRequirement.EFFICIENT,
            ModelTierRequirement.ANY,
        }
    )
    
    # Current spend tracking
    tokens_used: int = 0
    cost_spent_usd: float = 0.0
    requests_today: int = 0
    
    # State
    is_active: bool = True
    is_exhausted: bool = False
    last_used_at: Optional[datetime] = None
    cooldown_until: Optional[datetime] = None  # Rate-limit backoff
    
    @property
    def budget_remaining_usd(self) -> float:
        if self.budget_cap_usd is None:
            return float("inf")
        return max(0.0, self.budget_cap_usd - self.cost_spent_usd)
    
    @property
    def tokens_remaining(self) -> Optional[int]:
        if self.token_cap is None:
            return None
        return max(0, self.token_cap - self.tokens_used)
    
    @property
    def is_available(self) -> bool:
        if not self.is_active or self.is_exhausted:
            return False
        if self.cooldown_until and datetime.utcnow() < self.cooldown_until:
            return False
        if self.budget_cap_usd and self.cost_spent_usd >= self.budget_cap_usd:
            return False
        if self.token_cap and self.tokens_used >= self.token_cap:
            return False
        return True
    
    def can_afford(self, estimated_cost: float, estimated_tokens: int) -> bool:
        if not self.is_available:
            return False
        if self.budget_cap_usd and (self.cost_spent_usd + estimated_cost) > self.budget_cap_usd:
            return False
        if self.token_cap and (self.tokens_used + estimated_tokens) > self.token_cap:
            return False
        return True


@dataclass
class LocalWorker:
    """
    A local GPU worker node (like Folding@Home).
    Connected via WebSocket, pulls tasks from the queue.
    """
    worker_id: str
    donor_id: UUID
    
    # Capabilities
    model_name: str                   # e.g., "codellama:34b"
    provider_type: str                # "ollama", "vllm", "llamacpp"
    tier_capability: ModelTierRequirement = ModelTierRequirement.EFFICIENT
    max_concurrent_tasks: int = 1
    
    # State
    is_connected: bool = True
    current_tasks: int = 0
    last_heartbeat: datetime = field(default_factory=datetime.utcnow)
    total_completed: int = 0
    
    @property
    def has_capacity(self) -> bool:
        return (
            self.is_connected and 
            self.current_tasks < self.max_concurrent_tasks and
            (datetime.utcnow() - self.last_heartbeat) < timedelta(minutes=2)
        )


# ── Dispatch Strategies ────────────────────────────────────────────

class DispatchStrategy:
    """
    Determines how work units are matched to donor compute.
    
    The key insight: different phases need different strategies.
    - Skeleton/Validation: prefer local GPUs (free, good enough)
    - Deep Generation: need frontier models (use expensive API keys)
    - Gap Analysis: standard models work fine
    """
    
    # Phase → preferred model tier mapping
    PHASE_TIER_MAP: Dict[WorkUnitPhase, ModelTierRequirement] = {
        WorkUnitPhase.SKELETON_DISCOVERY: ModelTierRequirement.EFFICIENT,
        WorkUnitPhase.CONCEPT_ENUMERATION: ModelTierRequirement.EFFICIENT,
        WorkUnitPhase.DEEP_GENERATION: ModelTierRequirement.FRONTIER,
        WorkUnitPhase.CROSS_REFERENCE: ModelTierRequirement.STANDARD,
        WorkUnitPhase.GAP_ANALYSIS: ModelTierRequirement.STANDARD,
        WorkUnitPhase.VALIDATION: ModelTierRequirement.EFFICIENT,
        WorkUnitPhase.ENRICHMENT: ModelTierRequirement.STANDARD,
    }
    
    @staticmethod
    def score_slot_for_unit(
        slot: DonorProviderSlot, 
        unit: WorkUnit,
        donor: DonorProfile,
    ) -> float:
        """
        Score a donor slot for executing a work unit.
        Higher score = better match. Return -1 if incompatible.
        """
        if not slot.is_available:
            return -1.0
        
        if not slot.can_afford(unit.estimated_cost_usd, unit.estimated_output_tokens):
            return -1.0
        
        # Check tier compatibility
        if unit.model_tier != ModelTierRequirement.ANY:
            if unit.model_tier not in slot.tier_capabilities:
                return -1.0
        
        score = 50.0  # Base score
        
        # Prefer donors who sponsored this specific target
        if unit.target_id in donor.sponsored_targets:
            score += 30.0
        
        # Prefer slots with more remaining budget (don't drain anyone dry)
        if slot.budget_cap_usd and slot.budget_cap_usd > 0:
            utilization = slot.cost_spent_usd / slot.budget_cap_usd
            score += (1.0 - utilization) * 20.0  # More headroom = better
        
        # Prefer local compute for cheap phases (save API dollars)
        if slot.provider_name == "local":
            preferred_tier = DispatchStrategy.PHASE_TIER_MAP.get(
                unit.phase, ModelTierRequirement.STANDARD
            )
            if preferred_tier == ModelTierRequirement.EFFICIENT:
                score += 25.0  # Strong preference for local on cheap work
            else:
                score -= 10.0  # Mild penalty for local on complex work
        
        # Prefer API keys for frontier work
        if unit.model_tier == ModelTierRequirement.FRONTIER:
            if ModelTierRequirement.FRONTIER in slot.tier_capabilities:
                score += 20.0
        
        # Recency: prefer slots that haven't been used recently (spread load)
        if slot.last_used_at:
            seconds_since_use = (
                datetime.utcnow() - slot.last_used_at
            ).total_seconds()
            score += min(seconds_since_use / 60.0, 10.0)  # Up to +10 for idle
        
        return score


# ── The Dispatcher ─────────────────────────────────────────────────

class Dispatcher:
    """
    Central dispatch engine for the ACE system.
    
    Architecture:
    - Work units enter via the Planner (target decomposition)
    - Units are enqueued in a priority queue (Redis-backed in production)
    - The dispatch loop matches units to available donor compute
    - API-key units are executed via the Gateway's credential proxy
    - Local GPU units are dispatched to connected workers via WebSocket
    - Results flow back through the result ingestion pipeline
    
    This class coordinates all of that.
    """
    
    def __init__(
        self,
        credential_proxy: "CredentialProxy",
        event_bus: "EventBus",
        db_session_factory: Any = None,
    ):
        self._credential_proxy = credential_proxy
        self._event_bus = event_bus
        self._db_session_factory = db_session_factory
        
        # In-memory state (production: Redis-backed)
        self._pending_queue: asyncio.PriorityQueue = asyncio.PriorityQueue()
        self._dispatched: Dict[UUID, WorkUnit] = {}
        self._donors: Dict[UUID, DonorProfile] = {}
        self._local_workers: Dict[str, LocalWorker] = {}
        
        # Metrics
        self._total_dispatched = 0
        self._total_completed = 0
        self._total_failed = 0
        self._total_cost_usd = 0.0
        
        # Background tasks
        self._dispatch_loop_task: Optional[asyncio.Task] = None
        self._expiry_loop_task: Optional[asyncio.Task] = None
        self._running = False
    
    # ── Lifecycle ──────────────────────────────────────────────────
    
    async def start(self):
        """Start the dispatch and expiry loops."""
        self._running = True
        self._dispatch_loop_task = asyncio.create_task(self._dispatch_loop())
        self._expiry_loop_task = asyncio.create_task(self._expiry_check_loop())
        logger.info("dispatcher_started")
    
    async def stop(self):
        """Gracefully stop the dispatcher."""
        self._running = False
        if self._dispatch_loop_task:
            self._dispatch_loop_task.cancel()
        if self._expiry_loop_task:
            self._expiry_loop_task.cancel()
        logger.info("dispatcher_stopped")
    
    # ── Donor Management ───────────────────────────────────────────
    
    async def register_donor(
        self,
        donor_id: UUID,
        display_name: str,
        github_username: Optional[str],
        providers: List[Dict[str, Any]],
        sponsored_targets: Optional[List[str]] = None,
    ) -> DonorProfile:
        """
        Register a compute donor.
        
        Called when a user submits API keys via the web portal.
        Keys are stored encrypted in the vault; we only keep
        a reference (credential_id) and budget metadata here.
        """
        donor = DonorProfile(
            donor_id=donor_id,
            display_name=display_name,
            github_username=github_username,
            sponsored_targets=set(sponsored_targets or []),
        )
        
        for prov in providers:
            provider_name = prov["name"]
            credential_id = f"donor_{donor_id}_{provider_name}"
            
            # Store the actual API key in the encrypted vault
            await self._credential_proxy.store_key(
                credential_id=credential_id,
                provider=provider_name,
                api_key=prov["api_key"],
            )
            
            # Determine tier capabilities based on provider
            tier_caps = self._infer_tier_capabilities(provider_name)
            
            slot = DonorProviderSlot(
                provider_name=provider_name,
                credential_id=credential_id,
                budget_cap_usd=prov.get("budget_usd"),
                token_cap=prov.get("token_limit"),
                rate_limit_rpm=prov.get("rate_limit_rpm"),
                tier_capabilities=tier_caps,
            )
            donor.available_providers[provider_name] = slot
        
        self._donors[donor_id] = donor
        
        await self._event_bus.emit("donor.registered", {
            "donor_id": str(donor_id),
            "display_name": display_name,
            "providers": list(donor.available_providers.keys()),
            "sponsored_targets": list(donor.sponsored_targets),
        })
        
        logger.info(
            "donor_registered",
            donor_id=str(donor_id),
            display_name=display_name,
            providers=list(donor.available_providers.keys()),
            total_budget_usd=sum(
                s.budget_cap_usd or 0 
                for s in donor.available_providers.values()
            ),
        )
        
        return donor
    
    # ── Worker Management ──────────────────────────────────────────
    
    async def register_local_worker(
        self,
        worker_id: str,
        donor_id: UUID,
        model_name: str,
        provider_type: str = "ollama",
        max_concurrent: int = 1,
    ) -> LocalWorker:
        """
        Register a local GPU worker.
        Called when `npx openblueprint-worker` connects via WebSocket.
        """
        worker = LocalWorker(
            worker_id=worker_id,
            donor_id=donor_id,
            model_name=model_name,
            provider_type=provider_type,
            max_concurrent_tasks=max_concurrent,
        )
        self._local_workers[worker_id] = worker
        
        # Also ensure the donor has a "local" provider slot
        if donor_id in self._donors:
            donor = self._donors[donor_id]
            if "local" not in donor.available_providers:
                donor.available_providers["local"] = DonorProviderSlot(
                    provider_name="local",
                    credential_id=f"local_{worker_id}",
                    # No budget cap for local compute
                    tier_capabilities={
                        ModelTierRequirement.EFFICIENT,
                        ModelTierRequirement.ANY,
                    },
                )
        
        await self._event_bus.emit("worker.connected", {
            "worker_id": worker_id,
            "donor_id": str(donor_id),
            "model": model_name,
        })
        
        logger.info(
            "local_worker_registered",
            worker_id=worker_id,
            model=model_name,
        )
        
        return worker
    
    async def worker_heartbeat(self, worker_id: str):
        """Update worker heartbeat timestamp."""
        worker = self._local_workers.get(worker_id)
        if worker:
            worker.last_heartbeat = datetime.utcnow()
    
    # ── Enqueueing ─────────────────────────────────────────────────
    
    async def enqueue_work_units(
        self, units: List[WorkUnit]
    ) -> int:
        """
        Add work units to the dispatch queue.
        Called by the Planner after decomposing a target.
        Returns number of units enqueued.
        """
        enqueued = 0
        for unit in units:
            # Check for duplicates via content hash
            if self._is_duplicate(unit):
                logger.debug("duplicate_skipped", hash=unit.content_hash)
                continue
            
            # Priority tuple: (priority, timestamp, unit_id)
            # Lower priority number = higher priority
            # Timestamp breaks ties (FIFO within same priority)
            await self._pending_queue.put((
                unit.priority,
                unit.created_at.timestamp(),
                unit,
            ))
            enqueued += 1
        
        logger.info(
            "work_units_enqueued",
            total=len(units),
            enqueued=enqueued,
            duplicates_skipped=len(units) - enqueued,
            queue_size=self._pending_queue.qsize(),
        )
        
        return enqueued
    
    # ── The Core Dispatch Loop ─────────────────────────────────────
    
    async def _dispatch_loop(self):
        """
        Main dispatch loop. Continuously matches work units to compute.
        
        This is the heart of the system. It:
        1. Pulls the highest-priority work unit from the queue
        2. Checks if its dependencies are met
        3. Finds the best donor/slot to execute it
        4. Dispatches via either API-key proxy or local worker WebSocket
        """
        logger.info("dispatch_loop_started")
        
        while self._running:
            try:
                # Non-blocking get with timeout
                try:
                    priority, timestamp, unit = await asyncio.wait_for(
                        self._pending_queue.get(), timeout=1.0
                    )
                except asyncio.TimeoutError:
                    continue
                
                # Check dependencies
                if not self._dependencies_met(unit):
                    # Re-enqueue with slight delay
                    unit.priority = min(unit.priority + 1, 10)
                    await self._pending_queue.put((
                        unit.priority, timestamp, unit
                    ))
                    await asyncio.sleep(0.1)
                    continue
                
                # Find best compute match
                match = self._find_best_match(unit)
                
                if match is None:
                    # No available compute right now — re-enqueue
                    await self._pending_queue.put((priority, timestamp, unit))
                    await asyncio.sleep(2.0)  # Back off
                    continue
                
                donor, slot, worker = match
                
                # Dispatch!
                await self._dispatch_unit(unit, donor, slot, worker)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("dispatch_loop_error", error=str(e))
                await asyncio.sleep(1.0)
    
    def _find_best_match(
        self, unit: WorkUnit
    ) -> Optional[Tuple[DonorProfile, DonorProviderSlot, Optional[LocalWorker]]]:
        """
        Find the best donor + slot + optional worker for a work unit.
        
        Strategy:
        1. Score all available slots using DispatchStrategy
        2. Pick the highest-scoring slot
        3. If it's a local provider, find an available worker
        """
        candidates: List[Tuple[float, DonorProfile, DonorProviderSlot, Optional[LocalWorker]]] = []
        
        for donor in self._donors.values():
            for slot in donor.available_providers.values():
                score = DispatchStrategy.score_slot_for_unit(slot, unit, donor)
                if score < 0:
                    continue
                
                if slot.provider_name == "local":
                    # Find an available worker for this donor
                    worker = self._find_available_worker(donor.donor_id)
                    if worker:
                        candidates.append((score, donor, slot, worker))
                else:
                    candidates.append((score, donor, slot, None))
        
        if not candidates:
            return None
        
        # Sort by score descending
        candidates.sort(key=lambda x: x[0], reverse=True)
        best_score, best_donor, best_slot, best_worker = candidates[0]
        
        return (best_donor, best_slot, best_worker)
    
    def _find_available_worker(self, donor_id: UUID) -> Optional[LocalWorker]:
        """Find an available local worker belonging to a donor."""
        for worker in self._local_workers.values():
            if worker.donor_id == donor_id and worker.has_capacity:
                return worker
        return None
    
    async def _dispatch_unit(
        self,
        unit: WorkUnit,
        donor: DonorProfile,
        slot: DonorProviderSlot,
        worker: Optional[LocalWorker],
    ):
        """
        Actually dispatch a work unit for execution.
        
        Two paths:
        1. API Key: Execute via credential proxy (keys never leave the server)
        2. Local Worker: Send task to worker via WebSocket
        """
        unit.status = WorkUnitStatus.DISPATCHED
        unit.assigned_to_donor_id = donor.donor_id
        unit.assigned_provider = slot.provider_name
        unit.dispatched_at = datetime.utcnow()
        
        if worker:
            # Local GPU execution
            unit.assigned_to_worker_id = worker.worker_id
            worker.current_tasks += 1
            
            # Send task to worker via WebSocket (handled by gateway)
            await self._event_bus.emit("dispatch.to_worker", {
                "worker_id": worker.worker_id,
                "work_unit": unit.model_dump(mode="json"),
            })
            
            logger.info(
                "dispatched_to_local_worker",
                unit_id=str(unit.id),
                worker_id=worker.worker_id,
                model=worker.model_name,
                target=unit.target_id,
                phase=unit.phase.value,
            )
        else:
            # API key execution via credential proxy
            # The proxy fetches the encrypted key, makes the API call,
            # and returns the result — the key never leaves the server
            asyncio.create_task(
                self._execute_via_proxy(unit, donor, slot)
            )
            
            logger.info(
                "dispatched_via_api_proxy",
                unit_id=str(unit.id),
                donor=donor.display_name,
                provider=slot.provider_name,
                target=unit.target_id,
                phase=unit.phase.value,
                estimated_cost=unit.estimated_cost_usd,
            )
        
        self._dispatched[unit.id] = unit
        self._total_dispatched += 1
        
        await self._event_bus.emit("work_unit.dispatched", {
            "unit_id": str(unit.id),
            "target": unit.target_id,
            "phase": unit.phase.value,
            "donor": donor.display_name,
            "provider": slot.provider_name,
            "worker": worker.worker_id if worker else None,
        })
    
    async def _execute_via_proxy(
        self,
        unit: WorkUnit,
        donor: DonorProfile,
        slot: DonorProviderSlot,
    ):
        """
        Execute a work unit using a donor's API key via the credential proxy.
        
        CRITICAL SECURITY: The API key is fetched from the vault, used
        for a single request, and never exposed outside this process.
        """
        try:
            unit.status = WorkUnitStatus.EXECUTING
            unit.execution_started_at = datetime.utcnow()
            
            # Execute through credential proxy
            result = await self._credential_proxy.execute_completion(
                credential_id=slot.credential_id,
                provider=slot.provider_name,
                system_prompt=unit.system_prompt,
                user_prompt=unit.user_prompt,
                max_tokens=unit.max_tokens,
                temperature=unit.temperature,
                json_mode=unit.json_mode,
                model_tier=unit.model_tier,
            )
            
            # Build result
            work_result = WorkUnitResult(
                work_unit_id=unit.id,
                worker_id=f"proxy_{slot.provider_name}",
                donor_id=donor.donor_id,
                content=result.content,
                structured_output=result.structured_output,
                model_used=result.model,
                provider_used=result.provider,
                input_tokens=result.usage.prompt_tokens,
                output_tokens=result.usage.completion_tokens,
                total_tokens=result.usage.total_tokens,
                cost_usd=result.usage.estimated_cost_usd,
                latency_ms=result.latency_ms,
            )
            
            await self.receive_result(work_result)
            
        except Exception as e:
            logger.error(
                "proxy_execution_failed",
                unit_id=str(unit.id),
                error=str(e),
            )
            unit.status = WorkUnitStatus.FAILED
            
            if unit.can_retry:
                unit.retry_count += 1
                unit.status = WorkUnitStatus.PENDING
                await self._pending_queue.put((
                    unit.priority, unit.created_at.timestamp(), unit
                ))
                logger.info(
                    "work_unit_requeued",
                    unit_id=str(unit.id),
                    retry=unit.retry_count,
                )
    
    # ── Result Ingestion ───────────────────────────────────────────
    
    async def receive_result(self, result: WorkUnitResult):
        """
        Process a completed work unit result.
        Called by both API proxy and local workers.
        """
        unit = self._dispatched.get(result.work_unit_id)
        if not unit:
            logger.warning("result_for_unknown_unit", id=str(result.work_unit_id))
            return
        
        # Update work unit
        unit.status = WorkUnitStatus.COMPLETED
        unit.completed_at = result.completed_at
        unit.result_content = result.content
        unit.result_structured = result.structured_output
        unit.result_model_used = result.model_used
        unit.result_provider_used = result.provider_used
        unit.result_tokens_used = result.total_tokens
        unit.result_cost_usd = result.cost_usd
        unit.result_latency_ms = result.latency_ms
        
        # Update donor budget tracking
        donor = self._donors.get(result.donor_id)
        if donor:
            slot = donor.available_providers.get(result.provider_used)
            if slot:
                slot.tokens_used += result.total_tokens
                slot.cost_spent_usd += result.cost_usd
                slot.last_used_at = datetime.utcnow()
                
                # Check if exhausted
                if slot.budget_cap_usd and slot.cost_spent_usd >= slot.budget_cap_usd:
                    slot.is_exhausted = True
                    await self._event_bus.emit("donor.budget_exhausted", {
                        "donor_id": str(donor.donor_id),
                        "donor_name": donor.display_name,
                        "provider": slot.provider_name,
                        "total_spent": slot.cost_spent_usd,
                    })
            
            donor.total_tokens_donated += result.total_tokens
            donor.total_cost_donated_usd += result.cost_usd
            donor.total_work_units_completed += 1
        
        # Update local worker state
        if unit.assigned_to_worker_id:
            worker = self._local_workers.get(unit.assigned_to_worker_id)
            if worker:
                worker.current_tasks = max(0, worker.current_tasks - 1)
                worker.total_completed += 1
        
        # Remove from dispatched tracking
        self._dispatched.pop(result.work_unit_id, None)
        
        self._total_completed += 1
        self._total_cost_usd += result.cost_usd
        
        # Route to validation queue
        await self._event_bus.emit("work_unit.completed", {
            "unit_id": str(unit.id),
            "target": unit.target_id,
            "phase": unit.phase.value,
            "donor": donor.display_name if donor else "unknown",
            "cost_usd": result.cost_usd,
            "tokens": result.total_tokens,
            "model": result.model_used,
        })
        
        logger.info(
            "result_received",
            unit_id=str(unit.id),
            target=unit.target_id,
            cost=result.cost_usd,
            tokens=result.total_tokens,
            donor=donor.display_name if donor else "unknown",
        )
    
    # ── Expiry & Retry ─────────────────────────────────────────────
    
    async def _expiry_check_loop(self):
        """Periodically check for expired dispatches and requeue them."""
        while self._running:
            try:
                await asyncio.sleep(30)  # Check every 30 seconds
                
                expired = [
                    unit for unit in self._dispatched.values()
                    if unit.is_expired
                ]
                
                for unit in expired:
                    logger.warning(
                        "work_unit_expired",
                        unit_id=str(unit.id),
                        target=unit.target_id,
                    )
                    
                    self._dispatched.pop(unit.id, None)
                    
                    if unit.can_retry:
                        unit.retry_count += 1
                        unit.status = WorkUnitStatus.PENDING
                        unit.assigned_to_donor_id = None
                        unit.assigned_to_worker_id = None
                        unit.dispatched_at = None
                        await self._pending_queue.put((
                            unit.priority,
                            unit.created_at.timestamp(),
                            unit,
                        ))
                    else:
                        unit.status = WorkUnitStatus.EXPIRED
                        self._total_failed += 1
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("expiry_check_error", error=str(e))
    
    def _dependencies_met(self, unit: WorkUnit) -> bool:
        """Check if all dependencies for a work unit are satisfied."""
        if not unit.depends_on:
            return True
        # A dependency is met if it's been completed (not in dispatched or queue)
        for dep_id in unit.depends_on:
            if dep_id in self._dispatched:
                return False
        return True
    
    def _is_duplicate(self, unit: WorkUnit) -> bool:
        """Check if an equivalent work unit is already in flight."""
        for dispatched in self._dispatched.values():
            if dispatched.content_hash == unit.content_hash:
                return True
        return False
    
    def _infer_tier_capabilities(
        self, provider_name: str
    ) -> Set[ModelTierRequirement]:
        """Infer model tier capabilities from provider name."""
        tier_map = {
            "openai": {
                ModelTierRequirement.FRONTIER,
                ModelTierRequirement.STANDARD,
                ModelTierRequirement.EFFICIENT,
                ModelTierRequirement.ANY,
            },
            "anthropic": {
                ModelTierRequirement.FRONTIER,
                ModelTierRequirement.STANDARD,
                ModelTierRequirement.ANY,
            },
            "google": {
                ModelTierRequirement.FRONTIER,
                ModelTierRequirement.STANDARD,
                ModelTierRequirement.EFFICIENT,
                ModelTierRequirement.ANY,
            },
            "mistral": {
                ModelTierRequirement.STANDARD,
                ModelTierRequirement.EFFICIENT,
                ModelTierRequirement.ANY,
            },
            "local": {
                ModelTierRequirement.EFFICIENT,
                ModelTierRequirement.ANY,
            },
        }
        return tier_map.get(
            provider_name, 
            {ModelTierRequirement.STANDARD, ModelTierRequirement.ANY}
        )
    
    # ── Status & Metrics ───────────────────────────────────────────
    
    async def get_status(self) -> Dict[str, Any]:
        """Comprehensive dispatcher status for the dashboard."""
        active_donors = sum(
            1 for d in self._donors.values()
            if any(s.is_available for s in d.available_providers.values())
        )
        
        total_budget = sum(
            s.budget_cap_usd or 0
            for d in self._donors.values()
            for s in d.available_providers.values()
        )
        total_spent = sum(
            s.cost_spent_usd
            for d in self._donors.values()
            for s in d.available_providers.values()
        )
        
        return {
            "queue_depth": self._pending_queue.qsize(),
            "in_flight": len(self._dispatched),
            "total_dispatched": self._total_dispatched,
            "total_completed": self._total_completed,
            "total_failed": self._total_failed,
            "total_cost_usd": round(self._total_cost_usd, 4),
            "donors": {
                "total": len(self._donors),
                "active": active_donors,
                "total_budget_usd": round(total_budget, 2),
                "total_spent_usd": round(total_spent, 4),
                "budget_remaining_usd": round(total_budget - total_spent, 4),
            },
            "local_workers": {
                "total": len(self._local_workers),
                "connected": sum(
                    1 for w in self._local_workers.values() if w.is_connected
                ),
                "busy": sum(
                    1 for w in self._local_workers.values() if w.current_tasks > 0
                ),
            },
            "donors_detail": [
                {
                    "name": d.display_name,
                    "github": d.github_username,
                    "providers": {
                        name: {
                            "budget": s.budget_cap_usd,
                            "spent": round(s.cost_spent_usd, 4),
                            "remaining": round(s.budget_remaining_usd, 4) 
                                if s.budget_cap_usd else None,
                            "tokens_used": s.tokens_used,
                            "is_active": s.is_available,
                        }
                        for name, s in d.available_providers.items()
                    },
                    "sponsored_targets": list(d.sponsored_targets),
                    "lifetime_donated_usd": round(d.total_cost_donated_usd, 4),
                    "lifetime_tokens": d.total_tokens_donated,
                    "units_completed": d.total_work_units_completed,
                }
                for d in sorted(
                    self._donors.values(),
                    key=lambda x: x.total_cost_donated_usd,
                    reverse=True,
                )
            ],
        }
```

### 3. Credential Proxy — Keys Never Leave the Server

```python
# apps/ace-gateway/src/credentials/proxy.py
"""
Credential Proxy: The security boundary for donor API keys.

CRITICAL DESIGN PRINCIPLE:
Donor API keys NEVER leave the ACE gateway server. When a work unit
needs to use a donor's API key:

1. The proxy fetches the encrypted key from the vault
2. Makes the API call directly from the gateway
3. Returns only the result (content, usage, cost)
4. The key is held only in memory for the duration of the call

This means:
- Workers never see API keys
- Keys are encrypted at rest (AES-256-GCM)
- The gateway is the only process that touches keys
- Audit log records every key access
"""

from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import structlog

from ace_engine.providers.registry import provider_registry
from ace_engine.providers.base import (
    AIProviderAdapter,
    CompletionRequest,
    CompletionResponse,
    ModelTier,
    TokenUsage,
)
from core_schema.work_unit import ModelTierRequirement

logger = structlog.get_logger(__name__)


MODEL_TIER_MAP = {
    ModelTierRequirement.FRONTIER: ModelTier.FRONTIER,
    ModelTierRequirement.STANDARD: ModelTier.STANDARD,
    ModelTierRequirement.EFFICIENT: ModelTier.EFFICIENT,
    ModelTierRequirement.ANY: ModelTier.STANDARD,
}


@dataclass
class ProxyResult:
    """Result from a proxied API call."""
    content: str
    structured_output: Optional[Dict[str, Any]]
    model: str
    provider: str
    usage: TokenUsage
    latency_ms: float


class CredentialProxy:
    """
    Securely executes AI API calls using donor credentials
    without exposing the credentials to any external system.
    """
    
    def __init__(self, vault: "CredentialVault"):
        self._vault = vault
        self._adapter_cache: Dict[str, AIProviderAdapter] = {}
        self._access_log: List[Dict[str, Any]] = []
    
    async def store_key(
        self,
        credential_id: str,
        provider: str,
        api_key: str,
        extra_secrets: Dict[str, str] = None,
    ) -> None:
        """Store a donor's API key in the encrypted vault."""
        secrets = {"api_key": api_key}
        if extra_secrets:
            secrets.update(extra_secrets)
        
        await self._vault.store_credentials(
            credential_id=credential_id,
            secrets=secrets,
            metadata={"provider": provider},
        )
        
        logger.info(
            "key_stored",
            credential_id=credential_id,
            provider=provider,
        )
    
    async def execute_completion(
        self,
        credential_id: str,
        provider: str,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 4096,
        temperature: float = 0.4,
        json_mode: bool = False,
        model_tier: ModelTierRequirement = ModelTierRequirement.STANDARD,
    ) -> ProxyResult:
        """
        Execute a completion using a donor's credentials.
        
        The API key is fetched from the vault, used for ONE request,
        and never returned to the caller.
        """
        start = time.monotonic()
        
        # Get or create adapter (cached for connection reuse)
        adapter = await self._get_adapter(credential_id, provider)
        
        # Build request
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": user_prompt})
        
        request = CompletionRequest(
            messages=messages,
            model_tier=MODEL_TIER_MAP.get(model_tier, ModelTier.STANDARD),
            max_tokens=max_tokens,
            temperature=temperature,
            json_mode=json_mode,
        )
        
        # Execute
        response = await adapter.complete(request)
        latency = (time.monotonic() - start) * 1000
        
        # Audit log
        self._access_log.append({
            "credential_id": credential_id,
            "provider": provider,
            "model": response.model,
            "tokens": response.usage.total_tokens,
            "cost_usd": response.usage.estimated_cost_usd,
            "timestamp": time.time(),
        })
        
        # Parse structured output if json_mode
        structured = None
        if json_mode:
            import json
            try:
                structured = json.loads(response.content)
            except json.JSONDecodeError:
                pass
        
        return ProxyResult(
            content=response.content,
            structured_output=structured,
            model=response.model,
            provider=provider,
            usage=response.usage,
            latency_ms=latency,
        )
    
    async def _get_adapter(
        self, credential_id: str, provider: str
    ) -> AIProviderAdapter:
        """Get or create a cached adapter instance."""
        if credential_id not in self._adapter_cache:
            adapter = provider_registry.create_adapter(
                name=provider,
                credential_id=credential_id,
            )
            await adapter.initialize()
            self._adapter_cache[credential_id] = adapter
        return self._adapter_cache[credential_id]
    
    async def revoke_key(self, credential_id: str) -> None:
        """Revoke and delete a donor's API key."""
        # Remove cached adapter
        adapter = self._adapter_cache.pop(credential_id, None)
        if adapter:
            await adapter.shutdown()
        
        # Delete from vault
        await self._vault.delete_credentials(credential_id)
        
        logger.info("key_revoked", credential_id=credential_id)
```

### 4. The "Tinder for Code" Validation System

```python
# apps/ace-gateway/src/validation/consensus.py
"""
Human validation system with gamification.

The "Tinder for Code" UI shows generated knowledge snippets to users
who swipe right (accept) or left (reject), with optional detailed
feedback. Consensus is reached through multiple independent reviews.

Gamification:
- Points for reviewing (more for detailed feedback)
- Accuracy bonus (agreement with consensus)
- Leaderboard & badges
- Reputation weighting (expert votes count more)
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

import structlog

logger = structlog.get_logger(__name__)


class VoteType(str, Enum):
    APPROVE = "approve"          # Looks correct
    REJECT = "reject"            # Incorrect/low quality
    NEEDS_EDIT = "needs_edit"    # Mostly right, needs tweaks
    SKIP = "skip"                # Can't evaluate / not my area
    FLAG = "flag"                # Harmful/inappropriate content


class BadgeType(str, Enum):
    FIRST_REVIEW = "first_review"
    REVIEW_10 = "review_10"
    REVIEW_100 = "review_100"
    REVIEW_1000 = "review_1000"
    ACCURACY_STAR = "accuracy_star"       # 90%+ agreement rate
    DOMAIN_EXPERT = "domain_expert"       # 50+ reviews in one target
    STREAK_7 = "streak_7"                 # 7-day review streak
    QUALITY_HERO = "quality_hero"         # Caught 10+ bad generations
    PIONEER = "pioneer"                   # Reviewed first 100 items
    SPONSOR_BADGE = "sponsor_badge"       # Donated compute


@dataclass
class ValidationVote:
    """A single vote on a generated knowledge item."""
    id: UUID = field(default_factory=uuid4)
    work_unit_id: UUID = field(default_factory=uuid4)
    voter_id: UUID = field(default_factory=uuid4)
    
    vote: VoteType = VoteType.SKIP
    confidence: float = 0.5          # How sure the voter is (0-1)
    comment: Optional[str] = None    # Optional detailed feedback
    suggested_edit: Optional[str] = None  # Proposed correction
    time_spent_seconds: float = 0.0  # How long they looked at it
    
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class ValidatorProfile:
    """Profile tracking a human validator's activity and reputation."""
    user_id: UUID
    display_name: str
    github_username: Optional[str] = None
    
    # Stats
    total_reviews: int = 0
    approvals: int = 0
    rejections: int = 0
    edits_suggested: int = 0
    flags_raised: int = 0
    
    # Reputation
    reputation_score: float = 1.0    # Starts at 1.0, updated by agreement rate
    agreement_rate: float = 0.5      # How often they agree with consensus
    average_time_per_review: float = 0.0
    
    # Gamification
    points: int = 0
    level: int = 1
    badges: List[BadgeType] = field(default_factory=list)
    current_streak_days: int = 0
    last_review_date: Optional[str] = None
    
    # Expertise tracking (target_id → review count)
    domain_reviews: Dict[str, int] = field(default_factory=dict)
    
    @property
    def vote_weight(self) -> float:
        """
        Weight of this validator's votes in consensus calculations.
        Experts in a domain get higher weight.
        Base weight scales with reputation and review count.
        """
        base = min(self.reputation_score, 3.0)  # Cap at 3x
        experience_bonus = min(self.total_reviews / 100, 1.0)  # Up to +1.0
        return base + experience_bonus


class ConsensusEngine:
    """
    Determines when a generated item has received enough human
    validation to be accepted or rejected.
    
    Consensus rules:
    - Minimum 3 independent reviews required
    - Weighted votes: experienced validators count more
    - Items need >66% weighted approval to be accepted
    - Flagged items go to a special review queue
    - Edge cases (mixed votes) get additional reviews
    """
    
    MINIMUM_REVIEWS = 3
    APPROVAL_THRESHOLD = 0.66      # 66% weighted approval needed
    REJECTION_THRESHOLD = 0.66     # 66% weighted rejection to auto-reject
    UNCERTAIN_ADDITIONAL_REVIEWS = 2  # Extra reviews if consensus is unclear
    
    def __init__(self):
        self._validators: Dict[UUID, ValidatorProfile] = {}
        self._votes: Dict[UUID, List[ValidationVote]] = {}  # work_unit_id → votes
        
        # Points awards
        self.POINTS_PER_REVIEW = 10
        self.POINTS_DETAILED_FEEDBACK = 25
        self.POINTS_SUGGESTED_EDIT = 30
        self.POINTS_CONSENSUS_AGREEMENT = 15
        self.POINTS_CAUGHT_BAD_GENERATION = 50
    
    def register_validator(
        self, user_id: UUID, display_name: str, 
        github_username: Optional[str] = None
    ) -> ValidatorProfile:
        """Register a new human validator."""
        profile = ValidatorProfile(
            user_id=user_id,
            display_name=display_name,
            github_username=github_username,
        )
        self._validators[user_id] = profile
        return profile
    
    async def submit_vote(self, vote: ValidationVote) -> Dict[str, Any]:
        """
        Submit a human validation vote.
        
        Returns:
            Status dict with consensus state and points awarded.
        """
        # Record vote
        if vote.work_unit_id not in self._votes:
            self._votes[vote.work_unit_id] = []
        self._votes[vote.work_unit_id].append(vote)
        
        # Update validator profile
        validator = self._validators.get(vote.voter_id)
        points_awarded = 0
        new_badges = []
        
        if validator:
            validator.total_reviews += 1
            points_awarded += self.POINTS_PER_REVIEW
            
            if vote.vote == VoteType.APPROVE:
                validator.approvals += 1
            elif vote.vote == VoteType.REJECT:
                validator.rejections += 1
            
            if vote.comment:
                points_awarded += self.POINTS_DETAILED_FEEDBACK
            
            if vote.suggested_edit:
                validator.edits_suggested += 1
                points_awarded += self.POINTS_SUGGESTED_EDIT
            
            if vote.vote == VoteType.FLAG:
                validator.flags_raised += 1
                points_awarded += self.POINTS_CAUGHT_BAD_GENERATION
            
            validator.points += points_awarded
            
            # Check for new badges
            new_badges = self._check_badges(validator)
            
            # Update streak
            today = datetime.utcnow().strftime("%Y-%m-%d")
            if validator.last_review_date != today:
                if validator.last_review_date == (
                    datetime.utcnow().replace(
                        day=datetime.utcnow().day - 1
                    ).strftime("%Y-%m-%d")
                ):
                    validator.current_streak_days += 1
                else:
                    validator.current_streak_days = 1
                validator.last_review_date = today
            
            # Update level (every 500 points)
            validator.level = max(1, validator.points // 500 + 1)
        
        # Check consensus
        consensus = self._evaluate_consensus(vote.work_unit_id)
        
        return {
            "points_awarded": points_awarded,
            "new_badges": [b.value for b in new_badges],
            "total_points": validator.points if validator else 0,
            "level": validator.level if validator else 1,
            "consensus": consensus,
        }
    
    def _evaluate_consensus(self, work_unit_id: UUID) -> Dict[str, Any]:
        """
        Evaluate whether consensus has been reached for a work unit.
        """
        votes = self._votes.get(work_unit_id, [])
        
        # Filter out skips
        substantive_votes = [v for v in votes if v.vote != VoteType.SKIP]
        
        if len(substantive_votes) < self.MINIMUM_REVIEWS:
            return {
                "status": "pending",
                "reviews_needed": self.MINIMUM_REVIEWS - len(substantive_votes),
                "current_votes": len(substantive_votes),
            }
        
        # Check for flags (auto-escalate)
        flags = [v for v in substantive_votes if v.vote == VoteType.FLAG]
        if flags:
            return {
                "status": "flagged",
                "flag_count": len(flags),
                "needs_manual_review": True,
            }
        
        # Calculate weighted votes
        weighted_approve = 0.0
        weighted_reject = 0.0
        weighted_edit = 0.0
        total_weight = 0.0
        
        for vote in substantive_votes:
            validator = self._validators.get(vote.voter_id)
            weight = validator.vote_weight if validator else 1.0
            weight *= vote.confidence  # Scale by voter's self-reported confidence
            
            if vote.vote == VoteType.APPROVE:
                weighted_approve += weight
            elif vote.vote == VoteType.REJECT:
                weighted_reject += weight
            elif vote.vote == VoteType.NEEDS_EDIT:
                weighted_edit += weight
            
            total_weight += weight
        
        if total_weight == 0:
            return {"status": "pending", "reviews_needed": self.MINIMUM_REVIEWS}
        
        approve_ratio = weighted_approve / total_weight
        reject_ratio = weighted_reject / total_weight
        edit_ratio = weighted_edit / total_weight
        
        if approve_ratio >= self.APPROVAL_THRESHOLD:
            status = "accepted"
        elif reject_ratio >= self.REJECTION_THRESHOLD:
            status = "rejected"
        elif edit_ratio > 0.3:
            status = "needs_revision"
        else:
            status = "uncertain"
        
        result = {
            "status": status,
            "approval_ratio": round(approve_ratio, 3),
            "rejection_ratio": round(reject_ratio, 3),
            "edit_ratio": round(edit_ratio, 3),
            "total_reviews": len(substantive_votes),
            "total_weight": round(total_weight, 2),
        }
        
        # If uncertain, request more reviews
        if status == "uncertain":
            result["additional_reviews_requested"] = self.UNCERTAIN_ADDITIONAL_REVIEWS
        
        # Update validator agreement rates if consensus reached
        if status in ("accepted", "rejected"):
            self._update_agreement_rates(
                substantive_votes, 
                consensus_is_approve=(status == "accepted")
            )
        
        return result
    
    def _update_agreement_rates(
        self, votes: List[ValidationVote], consensus_is_approve: bool
    ):
        """Update validators' agreement rates after consensus."""
        consensus_vote = VoteType.APPROVE if consensus_is_approve else VoteType.REJECT
        
        for vote in votes:
            validator = self._validators.get(vote.voter_id)
            if not validator:
                continue
            
            agreed = vote.vote == consensus_vote
            
            # Exponential moving average
            alpha = 0.1
            validator.agreement_rate = (
                alpha * (1.0 if agreed else 0.0) +
                (1 - alpha) * validator.agreement_rate
            )
            
            # Reputation adjusts based on agreement
            if agreed:
                validator.reputation_score = min(
                    3.0, validator.reputation_score + 0.05
                )
                validator.points += self.POINTS_CONSENSUS_AGREEMENT
            else:
                validator.reputation_score = max(
                    0.1, validator.reputation_score - 0.02
                )
    
    def _check_badges(self, validator: ValidatorProfile) -> List[BadgeType]:
        """Check and award new badges."""
        new_badges = []
        
        badge_checks = [
            (BadgeType.FIRST_REVIEW, validator.total_reviews >= 1),
            (BadgeType.REVIEW_10, validator.total_reviews >= 10),
            (BadgeType.REVIEW_100, validator.total_reviews >= 100),
            (BadgeType.REVIEW_1000, validator.total_reviews >= 1000),
            (BadgeType.ACCURACY_STAR, validator.agreement_rate >= 0.9 and validator.total_reviews >= 20),
            (BadgeType.STREAK_7, validator.current_streak_days >= 7),
            (BadgeType.QUALITY_HERO, validator.flags_raised >= 10),
        ]
        
        # Domain expert: 50+ reviews in any single target
        for target, count in validator.domain_reviews.items():
            if count >= 50 and BadgeType.DOMAIN_EXPERT not in validator.badges:
                badge_checks.append((BadgeType.DOMAIN_EXPERT, True))
                break
        
        for badge, earned in badge_checks:
            if earned and badge not in validator.badges:
                validator.badges.append(badge)
                new_badges.append(badge)
                logger.info(
                    "badge_awarded",
                    user=validator.display_name,
                    badge=badge.value,
                )
        
        return new_badges
    
    # ── Validation Queue ───────────────────────────────────────────
    
    async def get_next_for_review(
        self,
        reviewer_id: UUID,
        target_filter: Optional[str] = None,
        batch_size: int = 1,
    ) -> List[Dict[str, Any]]:
        """
        Get the next items for a reviewer to validate.
        
        Selection criteria:
        - Items the reviewer hasn't already voted on
        - Items needing more reviews for consensus
        - Prefer items matching reviewer's domain expertise
        - Don't show items to reviewers who generated them
        """
        candidates = []
        
        reviewer_voted = set()
        for unit_id, votes in self._votes.items():
            for vote in votes:
                if vote.voter_id == reviewer_id:
                    reviewer_voted.add(unit_id)
        
        # Find items needing reviews (this would query the DB in production)
        for unit_id, votes in self._votes.items():
            if unit_id in reviewer_voted:
                continue
            
            substantive = [v for v in votes if v.vote != VoteType.SKIP]
            if len(substantive) < self.MINIMUM_REVIEWS:
                consensus = self._evaluate_consensus(unit_id)
                if consensus["status"] in ("pending", "uncertain"):
                    candidates.append({
                        "work_unit_id": str(unit_id),
                        "current_reviews": len(substantive),
                        "reviews_needed": self.MINIMUM_REVIEWS - len(substantive),
                    })
        
        return candidates[:batch_size]
    
    # ── Leaderboard ────────────────────────────────────────────────
    
    def get_leaderboard(
        self, 
        sort_by: str = "points",
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get the validator leaderboard."""
        validators = list(self._validators.values())
        
        sort_keys = {
            "points": lambda v: v.points,
            "reviews": lambda v: v.total_reviews,
            "reputation": lambda v: v.reputation_score,
            "accuracy": lambda v: v.agreement_rate,
            "streak": lambda v: v.current_streak_days,
        }
        
        key_fn = sort_keys.get(sort_by, sort_keys["points"])
        validators.sort(key=key_fn, reverse=True)
        
        return [
            {
                "rank": i + 1,
                "display_name": v.display_name,
                "github": v.github_username,
                "points": v.points,
                "level": v.level,
                "reviews": v.total_reviews,
                "reputation": round(v.reputation_score, 2),
                "accuracy": round(v.agreement_rate * 100, 1),
                "streak": v.current_streak_days,
                "badges": [b.value for b in v.badges],
            }
            for i, v in enumerate(validators[:limit])
        ]
```

### 5. Target Planner — Decomposing Targets into Work Units

```python
# apps/ace-gateway/src/orchestrator/planner.py
"""
Target Planner: Decomposes a knowledge target (e.g., "Python", "PPTX")
into dispatchable Work Units across pipeline stages.

This is where the 12-stage generation pipeline meets the
distributed dispatch architecture.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from uuid import uuid4

import structlog

from core_schema.work_unit import (
    ModelTierRequirement,
    WorkUnit,
    WorkUnitBatch,
    WorkUnitPhase,
)

logger = structlog.get_logger(__name__)


# ── Prompt Templates per Phase ─────────────────────────────────────

PHASE_PROMPTS = {
    WorkUnitPhase.SKELETON_DISCOVERY: {
        "system": (
            "You are a knowledge architect. Your job is to enumerate "
            "the complete concept skeleton for a technology/format. "
            "Be exhaustive. Think like an expert writing a reference manual."
        ),
        "user": (
            "Enumerate ALL major concepts, features, APIs, and components "
            "for: {target_name}\n\n"
            "Category: {target_category}\n"
            "Description: {target_description}\n\n"
            "Return a JSON array of concept names with brief descriptions. "
            "Be exhaustive — aim for completeness over brevity.\n\n"
            "```json\n"
            '[{{"concept": "name", "category": "category", '
            '"brief": "one-line description", '
            '"complexity": "basic|intermediate|advanced"}}]\n'
            "```"
        ),
        "tier": ModelTierRequirement.STANDARD,
        "temperature": 0.3,
        "max_tokens": 8000,
        "json_mode": True,
    },
    
    WorkUnitPhase.DEEP_GENERATION: {
        "system": (
            "You are the world's foremost expert on {target_name}. "
            "Generate comprehensive, production-quality documentation "
            "for the given concept. Include:\n"
            "- Detailed explanation\n"
            "- Complete, runnable code examples\n"
            "- Common pitfalls and gotchas\n"
            "- Best practices\n"
            "- Related concepts and cross-references\n"
            "- Edge cases\n\n"
            "Your output will be used to help developers who have NEVER "
            "seen this before implement it correctly. Be thorough."
        ),
        "user": (
            "Generate exhaustive documentation for this concept:\n\n"
            "Target: {target_name}\n"
            "Concept: {concept_name}\n"
            "Category: {concept_category}\n"
            "Brief: {concept_brief}\n\n"
            "Parent concepts (for context): {parent_concepts}\n"
            "Related concepts: {related_concepts}\n\n"
            "Return structured JSON:\n"
            "```json\n"
            '{{\n'
            '  "concept": "{concept_name}",\n'
            '  "explanation": "detailed multi-paragraph explanation",\n'
            '  "syntax": "formal syntax/structure if applicable",\n'
            '  "code_examples": [\n'
            '    {{"title": "...", "code": "...", "explanation": "..."}}\n'
            '  ],\n'
            '  "gotchas": ["..."],\n'
            '  "best_practices": ["..."],\n'
            '  "related_concepts": ["..."],\n'
            '  "edge_cases": ["..."],\n'
            '  "common_mistakes": ["..."]\n'
            '}}\n'
            "```"
        ),
        "tier": ModelTierRequirement.FRONTIER,
        "temperature": 0.4,
        "max_tokens": 4096,
        "json_mode": True,
    },
    
    WorkUnitPhase.VALIDATION: {
        "system": (
            "You are a code reviewer and fact-checker. Evaluate the "
            "following generated documentation for accuracy, completeness, "
            "and correctness of code examples."
        ),
        "user": (
            "Review this generated documentation:\n\n"
            "Target: {target_name}\n"
            "Concept: {concept_name}\n\n"
            "Generated content:\n{content}\n\n"
            "Evaluate:\n"
            "1. Factual accuracy (are statements correct?)\n"
            "2. Code correctness (would examples run?)\n"
            "3. Completeness (anything missing?)\n"
            "4. Quality score (0.0-1.0)\n\n"
            "Return JSON:\n"
            "```json\n"
            '{{"quality_score": 0.0, "issues": ["..."], '
            '"corrections": ["..."], "missing": ["..."]}}\n'
            "```"
        ),
        "tier": ModelTierRequirement.EFFICIENT,
        "temperature": 0.2,
        "max_tokens": 2000,
        "json_mode": True,
    },
    
    WorkUnitPhase.GAP_ANALYSIS: {
        "system": (
            "You are a completeness auditor. Given a list of concepts "
            "already documented for a technology, identify what's missing."
        ),
        "user": (
            "Target: {target_name}\n\n"
            "Already documented concepts:\n{existing_concepts}\n\n"
            "What important concepts, APIs, patterns, or features are "
            "MISSING from this list? Be thorough.\n\n"
            "Return JSON array of missing concepts:\n"
            "```json\n"
            '[{{"concept": "name", "category": "...", "importance": "critical|important|nice-to-have", '
            '"brief": "why this is needed"}}]\n'
            "```"
        ),
        "tier": ModelTierRequirement.STANDARD,
        "temperature": 0.4,
        "max_tokens": 4000,
        "json_mode": True,
    },
}


# ── Cost Estimation ────────────────────────────────────────────────

# Average cost per 1M output tokens by tier
TIER_COST_PER_1M_OUTPUT = {
    ModelTierRequirement.FRONTIER: 12.0,   # ~$12/1M tokens (GPT-4o, Claude Sonnet)
    ModelTierRequirement.STANDARD: 1.5,    # ~$1.50/1M tokens (GPT-4o-mini, Haiku)
    ModelTierRequirement.EFFICIENT: 0.3,   # ~$0.30/1M tokens (local, small models)
    ModelTierRequirement.ANY: 1.5,
}


class TargetPlanner:
    """
    Decomposes a target into work units for distributed execution.
    
    Flow:
    1. Start with skeleton discovery (cheap, enumerate concepts)
    2. Fan out into deep generation (one work unit per concept)
    3. Follow up with validation (cheap, verify quality)
    4. Run gap analysis (find what's missing)
    5. Generate missing concepts (loop back to step 2)
    """
    
    def __init__(self, dispatcher: "Dispatcher"):
        self._dispatcher = dispatcher
    
    async def plan_target(
        self,
        target_id: str,
        target_name: str,
        target_category: str,
        target_description: str,
        concept_hints: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Create the initial batch of work units for a target.
        
        Phase 1: Skeleton discovery — enumerate all concepts.
        Subsequent phases are triggered as results come in.
        """
        
        # Phase 1: Skeleton Discovery
        phase_config = PHASE_PROMPTS[WorkUnitPhase.SKELETON_DISCOVERY]
        
        skeleton_unit = WorkUnit(
            target_id=target_id,
            phase=WorkUnitPhase.SKELETON_DISCOVERY,
            sequence=0,
            system_prompt=phase_config["system"],
            user_prompt=phase_config["user"].format(
                target_name=target_name,
                target_category=target_category,
                target_description=target_description,
            ),
            model_tier=phase_config["tier"],
            max_tokens=phase_config["max_tokens"],
            temperature=phase_config["temperature"],
            json_mode=phase_config["json_mode"],
            estimated_output_tokens=phase_config["max_tokens"],
            estimated_cost_usd=self._estimate_cost(
                phase_config["tier"],
                phase_config["max_tokens"],
            ),
            priority=1,  # High priority — unlocks everything else
            context_payload={
                "target_name": target_name,
                "target_category": target_category,
                "target_description": target_description,
                "concept_hints": concept_hints or [],
            },
        )
        
        # If we have concept hints, also create deep generation units
        # immediately (don't wait for skeleton discovery)
        deep_gen_units = []
        if concept_hints:
            for i, concept in enumerate(concept_hints):
                unit = self._create_deep_gen_unit(
                    target_id=target_id,
                    target_name=target_name,
                    concept_name=concept,
                    concept_category="user_provided",
                    concept_brief="User-suggested concept",
                    sequence=i,
                    depends_on=[],  # No dependency on skeleton
                )
                deep_gen_units.append(unit)
        
        all_units = [skeleton_unit] + deep_gen_units
        
        # Enqueue
        enqueued = await self._dispatcher.enqueue_work_units(all_units)
        
        # Calculate cost estimate
        total_estimated_cost = sum(u.estimated_cost_usd for u in all_units)
        
        logger.info(
            "target_planned",
            target=target_id,
            skeleton_units=1,
            deep_gen_units=len(deep_gen_units),
            total_units=len(all_units),
            estimated_cost_usd=round(total_estimated_cost, 4),
        )
        
        return {
            "target_id": target_id,
            "target_name": target_name,
            "phase": "skeleton_discovery",
            "units_created": len(all_units),
            "units_enqueued": enqueued,
            "estimated_cost_usd": round(total_estimated_cost, 4),
        }
    
    async def expand_from_skeleton(
        self,
        target_id: str,
        target_name: str,
        skeleton_concepts: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Called when skeleton discovery completes.
        Creates deep generation work units for each discovered concept.
        """
        deep_gen_units = []
        validation_units = []
        
        for i, concept in enumerate(skeleton_concepts):
            # Deep generation unit
            deep_unit = self._create_deep_gen_unit(
                target_id=target_id,
                target_name=target_name,
                concept_name=concept.get("concept", f"concept_{i}"),
                concept_category=concept.get("category", "general"),
                concept_brief=concept.get("brief", ""),
                sequence=i,
                depends_on=[],
            )
            deep_gen_units.append(deep_unit)
            
            # Validation unit (depends on deep generation)
            val_config = PHASE_PROMPTS[WorkUnitPhase.VALIDATION]
            val_unit = WorkUnit(
                target_id=target_id,
                phase=WorkUnitPhase.VALIDATION,
                sequence=i,
                system_prompt=val_config["system"],
                user_prompt="[Content will be filled from deep generation result]",
                model_tier=val_config["tier"],
                max_tokens=val_config["max_tokens"],
                temperature=val_config["temperature"],
                json_mode=val_config["json_mode"],
                estimated_output_tokens=val_config["max_tokens"],
                estimated_cost_usd=self._estimate_cost(
                    val_config["tier"], val_config["max_tokens"]
                ),
                depends_on=[deep_unit.id],  # Wait for deep gen
                priority=7,  # Lower priority than generation
                context_payload={
                    "target_name": target_name,
                    "concept_name": concept.get("concept", ""),
                },
            )
            validation_units.append(val_unit)
        
        # Gap analysis unit (depends on all deep generation)
        gap_config = PHASE_PROMPTS[WorkUnitPhase.GAP_ANALYSIS]
        gap_unit = WorkUnit(
            target_id=target_id,
            phase=WorkUnitPhase.GAP_ANALYSIS,
            sequence=0,
            system_prompt=gap_config["system"],
            user_prompt=gap_config["user"].format(
                target_name=target_name,
                existing_concepts="\n".join(
                    f"- {c.get('concept', '')}: {c.get('brief', '')}"
                    for c in skeleton_concepts
                ),
            ),
            model_tier=gap_config["tier"],
            max_tokens=gap_config["max_tokens"],
            temperature=gap_config["temperature"],
            json_mode=gap_config["json_mode"],
            estimated_output_tokens=gap_config["max_tokens"],
            estimated_cost_usd=self._estimate_cost(
                gap_config["tier"], gap_config["max_tokens"]
            ),
            depends_on=[u.id for u in deep_gen_units],
            priority=5,
        )
        
        all_units = deep_gen_units + validation_units + [gap_unit]
        enqueued = await self._dispatcher.enqueue_work_units(all_units)
        
        total_estimated_cost = sum(u.estimated_cost_usd for u in all_units)
        
        logger.info(
            "skeleton_expanded",
            target=target_id,
            concepts=len(skeleton_concepts),
            deep_gen_units=len(deep_gen_units),
            validation_units=len(validation_units),
            gap_analysis_units=1,
            total_units=len(all_units),
            estimated_cost_usd=round(total_estimated_cost, 4),
        )
        
        return {
            "target_id": target_id,
            "concepts_discovered": len(skeleton_concepts),
            "deep_gen_units": len(deep_gen_units),
            "validation_units": len(validation_units),
            "total_units": len(all_units),
            "estimated_cost_usd": round(total_estimated_cost, 4),
        }
    
    def _create_deep_gen_unit(
        self,
        target_id: str,
        target_name: str,
        concept_name: str,
        concept_category: str,
        concept_brief: str,
        sequence: int,
        depends_on: List,
    ) -> WorkUnit:
        """Create a deep generation work unit for a single concept."""
        phase_config = PHASE_PROMPTS[WorkUnitPhase.DEEP_GENERATION]
        
        return WorkUnit(
            target_id=target_id,
            phase=WorkUnitPhase.DEEP_GENERATION,
            sequence=sequence,
            system_prompt=phase_config["system"].format(target_name=target_name),
            user_prompt=phase_config["user"].format(
                target_name=target_name,
                concept_name=concept_name,
                concept_category=concept_category,
                concept_brief=concept_brief,
                parent_concepts="",
                related_concepts="",
            ),
            model_tier=phase_config["tier"],
            max_tokens=phase_config["max_tokens"],
            temperature=phase_config["temperature"],
            json_mode=phase_config["json_mode"],
            estimated_output_tokens=phase_config["max_tokens"],
            estimated_cost_usd=self._estimate_cost(
                phase_config["tier"], phase_config["max_tokens"]
            ),
            depends_on=depends_on,
            priority=3,  # Medium-high priority
            context_payload={
                "target_name": target_name,
                "concept_name": concept_name,
                "concept_category": concept_category,
            },
        )
    
    def _estimate_cost(
        self, tier: ModelTierRequirement, output_tokens: int
    ) -> float:
        """Estimate cost for a work unit."""
        cost_per_1m = TIER_COST_PER_1M_OUTPUT.get(tier, 1.5)
        # Assume input is ~1.5x output tokens
        input_tokens = int(output_tokens * 1.5)
        input_cost = (input_tokens / 1_000_000) * (cost_per_1m / 4)
        output_cost = (output_tokens / 1_000_000) * cost_per_1m
        return round(input_cost + output_cost, 6)
```

### 6. Local Worker (The `npx openblueprint-worker`)

```python
# apps/local-worker/src/main.py
"""
Local GPU worker for the ACE network.

Usage:
    # Via pip
    pip install openblueprint-worker
    openblueprint-worker --gateway wss://ace.openblueprint.dev/ws/worker

    # Via npx (thin wrapper)
    npx openblueprint-worker

    # Via Docker
    docker run -it --gpus all openblueprint/worker

The worker:
1. Connects to the ACE gateway via WebSocket
2. Registers its capabilities (model, GPU specs)
3. Pulls work units from the dispatch queue
4. Executes them using local LLM (Ollama/vLLM/llama.cpp)
5. Pushes results back to the gateway
6. Sends periodic heartbeats

This is the "Folding@Home for AI Knowledge Generation."
"""

from __future__ import annotations

import asyncio
import json
import platform
import time
from typing import Any, Dict, Optional
from uuid import uuid4

import click
import structlog
import websockets
from websockets.asyncio.client import connect

logger = structlog.get_logger(__name__)


@click.command()
@click.option(
    "--gateway", "-g",
    default="wss://ace.openblueprint.dev/ws/worker",
    help="ACE gateway WebSocket URL",
)
@click.option(
    "--donor-token", "-t",
    envvar="OPENBLUEPRINT_DONOR_TOKEN",
    help="Your donor authentication token",
)
@click.option(
    "--provider", "-p",
    type=click.Choice(["ollama", "vllm", "llamacpp"]),
    default="ollama",
    help="Local LLM provider",
)
@click.option(
    "--model", "-m",
    default="llama3.1:8b",
    help="Model to use (e.g., codellama:34b, mistral:7b)",
)
@click.option(
    "--ollama-host",
    default="http://localhost:11434",
    help="Ollama API host",
)
@click.option(
    "--max-concurrent", "-c",
    default=1,
    type=int,
    help="Max concurrent tasks",
)
def main(
    gateway: str,
    donor_token: str,
    provider: str,
    model: str,
    ollama_host: str,
    max_concurrent: int,
):
    """
    🧠 OpenBlueprint Local Worker
    
    Donate your GPU compute to help build the universal knowledge base.
    Your machine runs AI inference locally — no API keys needed.
    """
    click.echo("🧠 OpenBlueprint Local Worker")
    click.echo(f"   Provider: {provider}")
    click.echo(f"   Model: {model}")
    click.echo(f"   Gateway: {gateway}")
    click.echo(f"   Max concurrent: {max_concurrent}")
    click.echo()
    
    if not donor_token:
        click.echo(
            "⚠️  No donor token provided. Get one at "
            "https://openblueprint.dev/donate"
        )
        click.echo("   Set OPENBLUEPRINT_DONOR_TOKEN or use --donor-token")
        return
    
    worker = LocalWorkerProcess(
        gateway_url=gateway,
        donor_token=donor_token,
        provider_type=provider,
        model_name=model,
        ollama_host=ollama_host,
        max_concurrent=max_concurrent,
    )
    
    asyncio.run(worker.run())


class LocalWorkerProcess:
    """Main worker process that connects to ACE and processes tasks."""
    
    def __init__(
        self,
        gateway_url: str,
        donor_token: str,
        provider_type: str,
        model_name: str,
        ollama_host: str = "http://localhost:11434",
        max_concurrent: int = 1,
    ):
        self.gateway_url = gateway_url
        self.donor_token = donor_token
        self.provider_type = provider_type
        self.model_name = model_name
        self.ollama_host = ollama_host
        self.max_concurrent = max_concurrent
        self.worker_id = f"worker_{uuid4().hex[:8]}"
        
        self._running = True
        self._current_tasks = 0
        self._total_completed = 0
        self._semaphore = asyncio.Semaphore(max_concurrent)
        
        # Initialize local provider
        self._provider = self._create_provider()
    
    def _create_provider(self) -> "LocalProvider":
        """Create the appropriate local LLM provider."""
        if self.provider_type == "ollama":
            return OllamaProvider(
                host=self.ollama_host, 
                model=self.model_name,
            )
        elif self.provider_type == "vllm":
            return VLLMProvider(model=self.model_name)
        else:
            raise ValueError(f"Unsupported provider: {self.provider_type}")
    
    async def run(self):
        """Main run loop with automatic reconnection."""
        while self._running:
            try:
                await self._connect_and_work()
            except websockets.exceptions.ConnectionClosed:
                logger.warning("connection_lost_reconnecting")
                await asyncio.sleep(5)
            except Exception as e:
                logger.error("worker_error", error=str(e))
                await asyncio.sleep(10)
    
    async def _connect_and_work(self):
        """Connect to gateway and process tasks."""
        async with connect(
            self.gateway_url,
            additional_headers={
                "Authorization": f"Bearer {self.donor_token}",
                "X-Worker-ID": self.worker_id,
            },
        ) as ws:
            logger.info("connected_to_gateway", url=self.gateway_url)
            
            # Register capabilities
            await ws.send(json.dumps({
                "type": "register",
                "worker_id": self.worker_id,
                "capabilities": {
                    "provider": self.provider_type,
                    "model": self.model_name,
                    "max_concurrent": self.max_concurrent,
                    "platform": platform.platform(),
                },
            }))
            
            # Start heartbeat
            heartbeat_task = asyncio.create_task(
                self._heartbeat_loop(ws)
            )
            
            try:
                # Listen for dispatched tasks
                async for message in ws:
                    data = json.loads(message)
                    
                    if data["type"] == "dispatch":
                        work_unit = data["work_unit"]
                        asyncio.create_task(
                            self._execute_task(ws, work_unit)
                        )
                    
                    elif data["type"] == "ping":
                        await ws.send(json.dumps({"type": "pong"}))
                    
                    elif data["type"] == "shutdown":
                        logger.info("shutdown_requested")
                        self._running = False
                        break
                        
            finally:
                heartbeat_task.cancel()
    
    async def _execute_task(self, ws, work_unit: Dict[str, Any]):
        """Execute a single work unit using local LLM."""
        async with self._semaphore:
            unit_id = work_unit["id"]
            self._current_tasks += 1
            
            logger.info(
                "executing_task",
                unit_id=unit_id,
                target=work_unit.get("target_id"),
                phase=work_unit.get("phase"),
            )
            
            start = time.monotonic()
            
            try:
                # Notify gateway we're starting
                await ws.send(json.dumps({
                    "type": "task_started",
                    "work_unit_id": unit_id,
                }))
                
                # Execute via local provider
                result = await self._provider.complete(
                    system_prompt=work_unit.get("system_prompt", ""),
                    user_prompt=work_unit.get("user_prompt", ""),
                    max_tokens=work_unit.get("max_tokens", 4096),
                    temperature=work_unit.get("temperature", 0.4),
                    json_mode=work_unit.get("json_mode", False),
                )
                
                latency = (time.monotonic() - start) * 1000
                
                # Send result back
                await ws.send(json.dumps({
                    "type": "task_result",
                    "work_unit_id": unit_id,
                    "result": {
                        "content": result["content"],
                        "model_used": self.model_name,
                        "provider_used": self.provider_type,
                        "input_tokens": result.get("input_tokens", 0),
                        "output_tokens": result.get("output_tokens", 0),
                        "total_tokens": result.get("total_tokens", 0),
                        "cost_usd": 0.0,  # Local = free
                        "latency_ms": latency,
                    },
                }))
                
                self._total_completed += 1
                logger.info(
                    "task_completed",
                    unit_id=unit_id,
                    tokens=result.get("total_tokens", 0),
                    latency_ms=round(latency, 0),
                    total_completed=self._total_completed,
                )
                
            except Exception as e:
                logger.error(
                    "task_failed",
                    unit_id=unit_id,
                    error=str(e),
                )
                await ws.send(json.dumps({
                    "type": "task_failed",
                    "work_unit_id": unit_id,
                    "error": str(e),
                }))
            
            finally:
                self._current_tasks -= 1
    
    async def _heartbeat_loop(self, ws):
        """Send periodic heartbeats."""
        while True:
            try:
                await asyncio.sleep(30)
                await ws.send(json.dumps({
                    "type": "heartbeat",
                    "worker_id": self.worker_id,
                    "current_tasks": self._current_tasks,
                    "total_completed": self._total_completed,
                }))
            except asyncio.CancelledError:
                break


class OllamaProvider:
    """Execute tasks via local Ollama instance."""
    
    def __init__(self, host: str, model: str):
        self.host = host.rstrip("/")
        self.model = model
    
    async def complete(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 4096,
        temperature: float = 0.4,
        json_mode: bool = False,
    ) -> Dict[str, Any]:
        """Execute completion via Ollama API."""
        import httpx
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": user_prompt})
        
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }
        
        if json_mode:
            payload["format"] = "json"
        
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                f"{self.host}/api/chat",
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
        
        return {
            "content": data["message"]["content"],
            "input_tokens": data.get("prompt_eval_count", 0),
            "output_tokens": data.get("eval_count", 0),
            "total_tokens": (
                data.get("prompt_eval_count", 0) + 
                data.get("eval_count", 0)
            ),
        }


class VLLMProvider:
    """Execute tasks via local vLLM instance."""
    
    def __init__(self, model: str, host: str = "http://localhost:8000"):
        self.model = model
        self.host = host
    
    async def complete(self, **kwargs) -> Dict[str, Any]:
        import httpx
        
        # vLLM exposes an OpenAI-compatible API
        messages = []
        if kwargs.get("system_prompt"):
            messages.append({"role": "system", "content": kwargs["system_prompt"]})
        messages.append({"role": "user", "content": kwargs["user_prompt"]})
        
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                f"{self.host}/v1/chat/completions",
                json={
                    "model": self.model,
                    "messages": messages,
                    "max_tokens": kwargs.get("max_tokens", 4096),
                    "temperature": kwargs.get("temperature", 0.4),
                },
            )
            response.raise_for_status()
            data = response.json()
        
        usage = data.get("usage", {})
        return {
            "content": data["choices"][0]["message"]["content"],
            "input_tokens": usage.get("prompt_tokens", 0),
            "output_tokens": usage.get("completion_tokens", 0),
            "total_tokens": usage.get("total_tokens", 0),
        }


if __name__ == "__main__":
    main()
```

### 7. Web Portal — Donation Widget Component

```tsx
// apps/web-portal/src/components/DonationWidget.tsx
/**
 * The BYOK (Bring Your Own Key) donation widget.
 * 
 * A contributor authenticates via GitHub, selects a provider,
 * enters their API key, sets a hard budget cap, and optionally
 * sponsors specific targets.
 * 
 * Key UX principles:
 * - 60-second setup (promise kept)
 * - Hard cap is PROMINENTLY displayed — no surprise bills
 * - Key is transmitted over TLS and encrypted at rest
 * - Clear explanation of what happens to their key
 */

"use client";

import React, { useState, useCallback } from "react";
import { useSession } from "next-auth/react";

type Provider = "openai" | "anthropic" | "google" | "mistral";

interface DonationConfig {
  provider: Provider;
  apiKey: string;
  budgetUsd: number;
  tokenLimit?: number;
  sponsoredTargets: string[];
}

const PROVIDERS: Record<Provider, { name: string; keyPrefix: string; keyPlaceholder: string }> = {
  openai: {
    name: "OpenAI",
    keyPrefix: "sk-",
    keyPlaceholder: "sk-proj-...",
  },
  anthropic: {
    name: "Anthropic",
    keyPrefix: "sk-ant-",
    keyPlaceholder: "sk-ant-...",
  },
  google: {
    name: "Google Gemini",
    keyPrefix: "AI",
    keyPlaceholder: "AIza...",
  },
  mistral: {
    name: "Mistral",
    keyPrefix: "",
    keyPlaceholder: "your-api-key",
  },
};

const BUDGET_PRESETS = [
  { label: "$5", value: 5, description: "~200 concepts generated" },
  { label: "$10", value: 10, description: "~400 concepts generated" },
  { label: "$25", value: 25, description: "~1,000 concepts generated" },
  { label: "$50", value: 50, description: "~2,000 concepts generated" },
  { label: "Custom", value: -1, description: "Set your own limit" },
];

// Popular targets that can be sponsored
const SPONSORABLE_TARGETS = [
  { id: "python", name: "Python", icon: "🐍", progress: 72 },
  { id: "rust", name: "Rust", icon: "🦀", progress: 15 },
  { id: "lua", name: "Lua", icon: "🌙", progress: 3 },
  { id: "pptx", name: "PowerPoint (PPTX)", icon: "📊", progress: 45 },
  { id: "pdf", name: "PDF Format", icon: "📄", progress: 8 },
  { id: "midi", name: "MIDI", icon: "🎵", progress: 0 },
  { id: "svg", name: "SVG", icon: "🖼️", progress: 22 },
  { id: "wasm", name: "WebAssembly", icon: "⚡", progress: 5 },
];

export function DonationWidget() {
  const { data: session } = useSession();
  const [step, setStep] = useState<"provider" | "key" | "budget" | "sponsor" | "confirm" | "done">("provider");
  const [config, setConfig] = useState<DonationConfig>({
    provider: "openai",
    apiKey: "",
    budgetUsd: 10,
    sponsoredTargets: [],
  });
  const [customBudget, setCustomBudget] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keyVisible, setKeyVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!session?.user) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: config.provider,
          api_key: config.apiKey,
          budget_usd: config.budgetUsd,
          sponsored_targets: config.sponsoredTargets,
        }),
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to register donation");
      }
      
      setStep("done");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [session, config]);

  if (!session?.user) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center">
        <h3 className="text-xl font-semibold mb-2">Donate AI Compute</h3>
        <p className="text-gray-600 mb-4">
          Sign in with GitHub to contribute your API tokens
        </p>
        <button
          onClick={() => {/* signIn("github") */}}
          className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 
                     flex items-center gap-2 mx-auto"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          Sign in with GitHub
        </button>
      </div>
    );
  }

  // Step: Done
  if (step === "done") {
    return (
      <div className="rounded-2xl bg-green-50 border-2 border-green-200 p-8 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-green-800 mb-2">
          Thank You, {session.user.name}!
        </h3>
        <p className="text-green-700 mb-4">
          Your ${config.budgetUsd} of {PROVIDERS[config.provider].name} compute
          is now powering knowledge generation.
        </p>
        {config.sponsoredTargets.length > 0 && (
          <p className="text-green-600 text-sm">
            Sponsoring: {config.sponsoredTargets.join(", ")}
            <br />
            Your name will appear in the "Generated By" metadata. ✨
          </p>
        )}
        <div className="mt-6 flex gap-3 justify-center">
          <button
            onClick={() => {
              setStep("provider");
              setConfig({ provider: "openai", apiKey: "", budgetUsd: 10, sponsoredTargets: [] });
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Donate More
          </button>
          <a
            href="/leaderboard"
            className="px-4 py-2 bg-white border border-green-300 text-green-700 
                       rounded-lg hover:bg-green-50"
          >
            View Leaderboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-gray-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <h3 className="text-xl font-bold">🧠 Donate AI Compute</h3>
        <p className="text-blue-100 text-sm mt-1">
          Help build the universal knowledge base — takes 60 seconds
        </p>
        {/* Progress indicator */}
        <div className="flex gap-1 mt-4">
          {["provider", "key", "budget", "sponsor", "confirm"].map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${
                ["provider", "key", "budget", "sponsor", "confirm"].indexOf(step) >= i
                  ? "bg-white"
                  : "bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Select Provider */}
        {step === "provider" && (
          <div>
            <h4 className="font-semibold mb-4">Select your AI provider</h4>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(PROVIDERS) as [Provider, typeof PROVIDERS[Provider]][]).map(
                ([key, prov]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setConfig((c) => ({ ...c, provider: key }));
                      setStep("key");
                    }}
                    className={`p-4 rounded-xl border-2 text-left hover:border-blue-500 
                               hover:bg-blue-50 transition ${
                      config.provider === key
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="font-semibold">{prov.name}</div>
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Step 2: API Key */}
        {step === "key" && (
          <div>
            <h4 className="font-semibold mb-2">
              Enter your {PROVIDERS[config.provider].name} API key
            </h4>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm">
              <strong>🔒 Security Promise:</strong>
              <ul className="mt-1 list-disc list-inside text-amber-800">
                <li>Your key is encrypted with AES-256 at rest</li>
                <li>It NEVER leaves our server — we proxy all API calls</li>
                <li>You can revoke it anytime from your dashboard</li>
                <li>Your hard budget cap is enforced server-side</li>
              </ul>
            </div>
            
            <div className="relative">
              <input
                type={keyVisible ? "text" : "password"}
                value={config.apiKey}
                onChange={(e) => setConfig((c) => ({ ...c, apiKey: e.target.value }))}
                placeholder={PROVIDERS[config.provider].keyPlaceholder}
                className="w-full px-4 py-3 border rounded-lg font-mono text-sm pr-20"
              />
              <button
                onClick={() => setKeyVisible(!keyVisible)}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 
                           text-sm text-gray-500 hover:text-gray-700"
              >
                {keyVisible ? "Hide" : "Show"}
              </button>
            </div>
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setStep("provider")}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => config.apiKey.length > 10 && setStep("budget")}
                disabled={config.apiKey.length <= 10}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg 
                           hover:bg-blue-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Budget */}
        {step === "budget" && (
          <div>
            <h4 className="font-semibold mb-4">Set your hard budget cap</h4>
            <p className="text-gray-600 text-sm mb-4">
              We will NEVER exceed this amount. When it&apos;s reached, your key
              stops being used. Period.
            </p>
            
            <div className="grid grid-cols-3 gap-3">
              {BUDGET_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    if (preset.value > 0) {
                      setConfig((c) => ({ ...c, budgetUsd: preset.value }));
                    }
                  }}
                  className={`p-3 rounded-xl border-2 text-center transition ${
                    config.budgetUsd === preset.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className="text-lg font-bold">{preset.label}</div>
                  <div className="text-xs text-gray-500">{preset.description}</div>
                </button>
              ))}
            </div>
            
            {config.budgetUsd === -1 && (
              <input
                type="number"
                min={1}
                max={500}
                value={customBudget}
                onChange={(e) => {
                  setCustomBudget(e.target.value);
                  const val = parseFloat(e.target.value);
                  if (val > 0) setConfig((c) => ({ ...c, budgetUsd: val }));
                }}
                placeholder="Enter amount in USD"
                className="w-full mt-3 px-4 py-3 border rounded-lg"
              />
            )}
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-center">
              <span className="text-3xl font-bold text-blue-600">
                ${config.budgetUsd > 0 ? config.budgetUsd.toFixed(2) : "0.00"}
              </span>
              <span className="text-blue-400 text-sm ml-2">maximum spend</span>
            </div>
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setStep("key")}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => config.budgetUsd > 0 && setStep("sponsor")}
                disabled={config.budgetUsd <= 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg 
                           hover:bg-blue-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Sponsor Targets (Optional) */}
        {step === "sponsor" && (
          <div>
            <h4 className="font-semibold mb-2">Adopt a Language (Optional)</h4>
            <p className="text-gray-600 text-sm mb-4">
              Focus your donation on specific targets. Your name appears
              in the &quot;Generated By&quot; metadata. Leave empty for general pool.
            </p>
            
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {SPONSORABLE_TARGETS.map((target) => (
                <button
                  key={target.id}
                  onClick={() => {
                    setConfig((c) => ({
                      ...c,
                      sponsoredTargets: c.sponsoredTargets.includes(target.id)
                        ? c.sponsoredTargets.filter((t) => t !== target.id)
                        : [...c.sponsoredTargets, target.id],
                    }));
                  }}
                  className={`p-3 rounded-lg border-2 text-left transition ${
                    config.sponsoredTargets.includes(target.id)
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{target.icon}</span>
                    <span className="font-medium">{target.name}</span>
                  </div>
                  <div className="mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-purple-500 h-1.5 rounded-full"
                        style={{ width: `${target.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {target.progress}% complete
                    </span>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setStep("budget")}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => setStep("confirm")}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {config.sponsoredTargets.length > 0 ? "Next" : "Skip — Use General Pool"}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Confirm */}
        {step === "confirm" && (
          <div>
            <h4 className="font-semibold mb-4">Confirm Your Donation</h4>
            
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Provider</span>
                <span className="font-semibold">
                  {PROVIDERS[config.provider].name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Budget Cap</span>
                <span className="font-semibold text-blue-600">
                  ${config.budgetUsd.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">API Key</span>
                <span className="font-mono text-sm">
                  {config.apiKey.slice(0, 8)}...{config.apiKey.slice(-4)}
                </span>
              </div>
              {config.sponsoredTargets.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Sponsoring</span>
                  <span className="font-semibold">
                    {config.sponsoredTargets.join(", ")}
                  </span>
                </div>
              )}
            </div>
            
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
              ✅ Your key is encrypted end-to-end and never leaves our server.
              <br />
              ✅ Hard budget cap of <strong>${config.budgetUsd}</strong> is enforced.
              <br />
              ✅ You can revoke access anytime from your dashboard.
            </div>
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setStep("sponsor")}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 
                           text-white rounded-lg hover:from-blue-700 hover:to-purple-700 
                           disabled:opacity-50 font-semibold text-lg"
              >
                {isSubmitting ? "Encrypting & Registering..." : "🚀 Start Contributing"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 8. Validation UI — "Tinder for Code"

```tsx
// apps/web-portal/src/components/ValidationCard.tsx
/**
 * "Tinder for Code" — Swipe-style validation interface.
 * 
 * Shows a generated knowledge snippet and lets the user:
 * - ✅ Approve (swipe right / green button)
 * - ❌ Reject (swipe left / red button)  
 * - ✏️ Suggest edit (opens editor)
 * - 🚩 Flag (problematic content)
 * - ⏭️ Skip (can't evaluate)
 */

"use client";

import React, { useState, useCallback, useEffect } from "react";

interface ValidationItem {
  workUnitId: string;
  targetName: string;
  targetIcon: string;
  conceptName: string;
  phase: string;
  content: string;
  codeExamples?: { title: string; code: string; language: string }[];
  modelUsed: string;
  currentReviews: number;
  reviewsNeeded: number;
}

interface VoteResult {
  pointsAwarded: number;
  newBadges: string[];
  totalPoints: number;
  level: number;
  consensus: {
    status: string;
    approvalRatio?: number;
  };
}

export function ValidationCard() {
  const [item, setItem] = useState<ValidationItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [comment, setComment] = useState("");
  const [confidence, setConfidence] = useState(0.7);
  const [lastResult, setLastResult] = useState<VoteResult | null>(null);
  const [stats, setStats] = useState({ reviewed: 0, streak: 0 });

  const fetchNext = useCallback(async () => {
    setIsLoading(true);
    setShowEditor(false);
    setComment("");
    setEditContent("");
    setLastResult(null);
    
    try {
      const res = await fetch("/api/validation/next");
      if (res.ok) {
        const data = await res.json();
        setItem(data);
      } else {
        setItem(null); // No more items to review
      }
    } catch {
      setItem(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchNext(); }, [fetchNext]);

  const submitVote = useCallback(async (
    vote: "approve" | "reject" | "needs_edit" | "skip" | "flag"
  ) => {
    if (!item) return;
    
    try {
      const res = await fetch("/api/validation/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          work_unit_id: item.workUnitId,
          vote,
          confidence,
          comment: comment || undefined,
          suggested_edit: showEditor ? editContent : undefined,
        }),
      });
      
      if (res.ok) {
        const result: VoteResult = await res.json();
        setLastResult(result);
        setStats((s) => ({
          reviewed: s.reviewed + 1,
          streak: s.streak + 1,
        }));
        
        // Auto-advance after brief pause to show points
        setTimeout(fetchNext, 1500);
      }
    } catch (e) {
      console.error("Vote failed:", e);
    }
  }, [item, confidence, comment, editContent, showEditor, fetchNext]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showEditor) return; // Don't capture when editing
      if (e.key === "ArrowRight" || e.key === "a") submitVote("approve");
      if (e.key === "ArrowLeft" || e.key === "r") submitVote("reject");
      if (e.key === "s") submitVote("skip");
      if (e.key === "e") setShowEditor(true);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [submitVote, showEditor]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="animate-pulse text-4xl mb-4">🔍</div>
        <p className="text-gray-500">Finding next item to review...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center bg-green-50 rounded-2xl">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-xl font-bold text-green-800">All caught up!</h3>
        <p className="text-green-600 mt-2">
          No items need review right now. Check back soon!
        </p>
        <p className="text-green-500 text-sm mt-4">
          You reviewed {stats.reviewed} items this session
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Points popup */}
      {lastResult && (
        <div className="fixed top-20 right-8 bg-yellow-400 text-yellow-900 
                        px-4 py-2 rounded-full font-bold animate-bounce shadow-lg z-50">
          +{lastResult.pointsAwarded} pts!
          {lastResult.newBadges.length > 0 && (
            <span className="ml-2">🏆 New badge!</span>
          )}
        </div>
      )}

      {/* Stats bar */}
      <div className="flex justify-between items-center mb-4 text-sm text-gray-500">
        <span>
          {item.targetIcon} {item.targetName} / {item.conceptName}
        </span>
        <div className="flex gap-4">
          <span>Reviewed today: {stats.reviewed}</span>
          <span>🔥 Streak: {stats.streak}</span>
        </div>
      </div>

      {/* The card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
          <div>
            <span className="text-xs font-mono text-gray-400">
              {item.phase.replace("_", " ")}
            </span>
            <h3 className="font-semibold text-lg">{item.conceptName}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {item.currentReviews}/{item.reviewsNeeded + item.currentReviews} reviews
            </span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
              {item.modelUsed}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[400px] overflow-y-auto">
          <div className="prose prose-sm max-w-none">
            {/* Render the generated content */}
            <div className="whitespace-pre-wrap text-sm">
              {item.content}
            </div>
            
            {/* Code examples */}
            {item.codeExamples?.map((ex, i) => (
              <div key={i} className="mt-3">
                <div className="text-xs font-semibold text-gray-500 mb-1">
                  {ex.title}
                </div>
                <pre className="bg-gray-900 text-green-400 p-3 rounded-lg 
                                text-xs overflow-x-auto">
                  <code>{ex.code}</code>
                </pre>
              </div>
            ))}
          </div>
        </div>

        {/* Edit panel (expandable) */}
        {showEditor && (
          <div className="px-6 py-4 bg-yellow-50 border-t border-yellow-200">
            <h4 className="font-semibold text-sm mb-2">✏️ Suggest an edit</h4>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-32 p-3 border rounded-lg text-sm font-mono"
              placeholder="Paste your corrected version here..."
            />
          </div>
        )}

        {/* Comment & confidence */}
        <div className="px-6 py-3 bg-gray-50 border-t">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional: Add a comment about this item..."
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-500">Your confidence:</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={confidence}
              onChange={(e) => setConfidence(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs font-mono w-8">
              {Math.round(confidence * 100)}%
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-6 py-4 flex gap-3 justify-center border-t">
          <button
            onClick={() => submitVote("reject")}
            className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold 
                       hover:bg-red-600 transition flex items-center justify-center gap-2"
            title="Keyboard: ← or R"
          >
            ❌ Reject
          </button>
          
          <button
            onClick={() => submitVote("skip")}
            className="px-4 py-3 bg-gray-200 text-gray-600 rounded-xl 
                       hover:bg-gray-300 transition"
            title="Keyboard: S"
          >
            ⏭️
          </button>
          
          <button
            onClick={() => setShowEditor(!showEditor)}
            className="px-4 py-3 bg-yellow-100 text-yellow-700 rounded-xl 
                       hover:bg-yellow-200 transition"
            title="Keyboard: E"
          >
            ✏️
          </button>
          
          <button
            onClick={() => submitVote("flag")}
            className="px-4 py-3 bg-orange-100 text-orange-700 rounded-xl 
                       hover:bg-orange-200 transition"
          >
            🚩
          </button>
          
          <button
            onClick={() => submitVote(showEditor ? "needs_edit" : "approve")}
            className="flex-1 py-3 bg-green-500 text-white rounded-xl font-semibold 
                       hover:bg-green-600 transition flex items-center justify-center gap-2"
            title="Keyboard: → or A"
          >
            ✅ Approve
          </button>
        </div>

        {/* Keyboard shortcut hints */}
        <div className="px-6 py-2 bg-gray-50 border-t text-center">
          <span className="text-xs text-gray-400">
            ← Reject | → Approve | S Skip | E Edit | Keyboard shortcuts enabled
          </span>
        </div>
      </div>
    </div>
  );
}
```

---

## DevContainer for Zero-Setup Contributing

```json
// .devcontainer/devcontainer.json
{
  "name": "OpenBlueprint Development",
  "dockerComposeFile": "docker-compose.yml",
  "service": "devcontainer",
  "workspaceFolder": "/workspace",

  "features": {
    "ghcr.io/devcontainers/features/python:1": { "version": "3.12" },
    "ghcr.io/devcontainers/features/node:1": { "version": "20" },
    "ghcr.io/devcontainers/features/docker-in-docker:2": {},
    "ghcr.io/devcontainers/features/github-cli:1": {}
  },

  "postCreateCommand": "bash .devcontainer/post-create.sh",

  "customizations": {
    "vscode": {
      "extensions": [
        "ms-python.python",
        "ms-python.vscode-pylance",
        "charliermarsh.ruff",
        "bradlc.vscode-tailwindcss",
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "mtxr.sqltools",
        "mtxr.sqltools-driver-pg"
      ],
      "settings": {
        "python.defaultInterpreterPath": "/usr/local/bin/python",
        "[python]": {
          "editor.defaultFormatter": "charliermarsh.ruff"
        }
      }
    }
  },

  "forwardPorts": [3000, 3001, 8000, 5432, 6379],
  "portsAttributes": {
    "3000": { "label": "Web Portal" },
    "3001": { "label": "Prompt Lab" },
    "8000": { "label": "ACE Gateway API" },
    "5432": { "label": "PostgreSQL" },
    "6379": { "label": "Redis" }
  }
}
```

---

## Data Flow Summary

```
                    THE COMPLETE FLOW
                    
 ┌────────────────────────────────────────────────────┐
 │  1. DEMAND: "Generate knowledge for Rust"          │
 │     - Community votes on Target                    │
 │     - Or: donor sponsors it directly               │
 └────────────────────┬───────────────────────────────┘
                      ▼
 ┌────────────────────────────────────────────────────┐
 │  2. PLANNING: Planner decomposes target            │
 │     → 1 skeleton discovery unit (cheap)            │
 │     → skeleton returns 150 concepts                │
 │     → 150 deep generation units (expensive)        │
 │     → 150 validation units (cheap)                 │
 │     → 1 gap analysis unit (medium)                 │
 │     → estimated cost: $8.50                        │
 └────────────────────┬───────────────────────────────┘
                      ▼
 ┌────────────────────────────────────────────────────┐
 │  3. DISPATCH: Dispatcher matches units to compute  │
 │                                                    │
 │  Skeleton discovery → Carol's local Ollama (free)  │
 │  Deep gen unit #1   → Alice's GPT-4o ($0.04)      │
 │  Deep gen unit #2   → Bob's Claude ($0.05)         │
 │  Deep gen unit #3   → Alice's GPT-4o ($0.04)      │
 │  ...                                               │
 │  Validation unit #1 → Dave's local GPU (free)      │
 │  Gap analysis       → Bob's Claude ($0.03)         │
 │                                                    │
 │  Total: $8.50 spread across 5 donors               │
 │  Alice: $2.50 | Bob: $3.00 | Carol: $0 | Dave: $0 │
 │  Eve: $3.00                                        │
 └────────────────────┬───────────────────────────────┘
                      ▼
 ┌────────────────────────────────────────────────────┐
 │  4. EXECUTION: Workers execute & return results    │
 │     - API keys never leave the server              │
 │     - Local workers run inference locally           │
 │     - Results streamed back via WebSocket/HTTP     │
 └────────────────────┬───────────────────────────────┘
                      ▼
 ┌────────────────────────────────────────────────────┐
 │  5. AGGREGATION: Results collected & assembled     │
 │     - Dedup overlapping content                    │
 │     - Merge into knowledge nodes                   │
 │     - Quality scoring                              │
 └────────────────────┬───────────────────────────────┘
                      ▼
 ┌────────────────────────────────────────────────────┐
 │  6. HUMAN VALIDATION: "Tinder for Code"            │
 │     - 3+ independent reviews per item              │
 │     - Weighted by reviewer reputation              │
 │     - Gamified: points, badges, leaderboard        │
 │     - Consensus → accepted / rejected / needs edit │
 └────────────────────┬───────────────────────────────┘
                      ▼
 ┌────────────────────────────────────────────────────┐
 │  7. PUBLICATION: Knowledge enters the database     │
 │     - SQLite + PostgreSQL                          │
 │     - Monthly HuggingFace data dumps               │
 │     - REST API for LLM context retrieval           │
 │     - VS Code extension auto-complete              │
 │     - Web viewer (searchable docs)                 │
 │                                                    │
 │  Metadata includes:                                │
 │  "generated_by": ["alice", "bob"],                 │
 │  "validated_by": ["charlie", "diana", "frank"],    │
 │  "sponsored_by": "eve",                            │
 │  "model_used": "gpt-4o",                          │
 │  "confidence": 0.94                                │
 └────────────────────────────────────────────────────┘
```

---

## Key Architectural Differences from V1

| Aspect | V1 (Generic Contribution) | V2 (Knowledge Factory) |
|--------|--------------------------|----------------------|
| **Execution model** | Gateway executes everything | Gateway dispatches; workers execute |
| **API key handling** | Direct adapter creation | Credential proxy — keys never leave server |
| **Work units** | Generic "tasks" | Pipeline-phase-specific units with cost tiers |
| **Local compute** | Afterthought | First-class: `npx openblueprint-worker` |
| **Routing strategy** | Quality/cost optimization | Phase-aware: local for cheap, API for deep |
| **Human involvement** | Optional code review | Mandatory gamified validation ("Tinder for Code") |
| **Motivation model** | Altruistic contribution | Gamification + sponsorship + attribution |
| **Output** | Code/PRs for a project | Structured knowledge database (the asset) |
| **Budget model** | Per-contributor limits | Per-contributor + per-target sponsorship |
| **Scale model** | Single project | Universal: 1000+ targets, community-driven |

This architecture transforms the system from "a tool that uses donated API keys" into **"a decentralized factory that converts donated compute into structured knowledge, validated by gamified human review."** The Wikipedia of Implementation, powered by a compute donation network.

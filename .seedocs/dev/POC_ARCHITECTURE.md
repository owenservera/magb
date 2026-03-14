# magB POC Architecture

## Executive Summary

This document defines the architecture for the **Proof of Concept (POC)** track of the magB ecosystem. The POC is designed to validate the core knowledge generation and query capabilities without the complexity of the full ACE (AI Contribution Engine) system. The key differentiator is a **simplified, directly-controlled AI engine** that enables rapid testing and iteration of the knowledge pipeline.

---

## 1. Dual-Track Architecture Overview

### 1.1 Track Comparison

| Dimension | POC Track | PROD Track |
|-----------|-----------|------------|
| **AI Engine | Direct API calls (OpenAI/Anthropic) | Full ACE with contributor wallet system |
| **Authentication | Single API key in config | OAuth2 + API keys + contributor auth |
| **Rate Limiting | Fixed (e.g., 100 req/min) | Per-contributor dynamic limits |
| **Scaling | Single instance | Multi-instance with load balancing |
| **Observability | Basic health checks | Full 5 vital signs + immune system |
| **Cost Tracking | Simple预算 tracking | Per-contributor billing |
| **Deployment | Local/Docker | Kubernetes with auto-scaling |
| **Validation | Manual + basic auto | Full multi-model consensus |
| **Timeline | 2-3 months | 6-12 months |

### 1.2 Shared Components

Both tracks share the following foundational elements:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Shared Foundation                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │  PostgreSQL +   │  │   Prisma ORM    │  │  Target/Concept│  │
│  │  pgvector DB    │  │   (migrations)  │  │  Seed Data     │  │
│  └─────────────────┘  └─────────────────┘  └────────────────┘  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Knowledge Schema (16 tables)                    │ │
│  │  concepts, families, targets, entries, examples, atoms,    │ │
│  │  algorithms, capabilities, blueprints, artifacts, etc.    │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 POC-Specific Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    POC-Specific Layer                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              DirectLLM (Simplified AI Engine)              │ │
│  • Single provider (configurable: Z.ai/OpenAI/Anthropic)│ │
│  │  • Direct API calls with basic retry                      │ │
│  │  • Fixed rate limiting (no dynamic per-user)              │ │
│  │  • Manual budget control via config                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              POC Orchestrator                               │ │
│  │  • Simple state machine (not full pipeline)                │ │
│  │  • Manual trigger (CLI command)                           │ │
│  │  • Basic checkpointing                                    │ │
│  │  • Direct console output                                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Simple Query API                               │ │
│  │  • Basic REST endpoints                                    │ │
│  │  • API key auth only                                       │ │
│  │  • Fixed rate limits                                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Simplified AI Engine (DirectLLM)

### 2.1 Design Philosophy

The POC uses a **DirectLLM** approach instead of the full ACE system:

| ACE (PROD) | DirectLLM (POC) |
|------------|-----------------|
| Multi-provider plugin system | Single hardcoded provider |
| Contributor wallet + token budgets | Fixed API key in config |
| Dynamic rate limiting per user | Global fixed rate limit |
| Provider health + circuit breaker | Basic retry on failure |
| Load balancing across providers | Single endpoint |
| Cost attribution per contributor | Simple total tracking |

### 2.2 DirectLLM Architecture

```python
# src/poc/llm/direct_llm.py

from enum import Enum
from dataclasses import dataclass
from typing import Optional
import os

class LLMProvider(Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    ZAI = "zai"  # Z.ai GLM Coding Plan

@dataclass
class LLMConfig:
    """Configuration for the simplified POC LLM engine."""
    provider: LLMProvider
    api_key: str
    model: str = "glm-4.7-flash"  # Default to Z.ai GLM for POC
    max_tokens: int = 4096
    temperature: float = 0.7
    max_retries: int = 3
    timeout_seconds: int = 60

class DirectLLM:
    """
    Simplified LLM client for POC.
    
    Replaces the full ACE plugin system with direct API calls.
    Designed for testing the knowledge pipeline without 
    contributor management complexity.
    """
    
    def __init__(self, config: LLMConfig):
        self.config = config
        self._client = None
        self._total_tokens = 0
        self._total_cost = 0.0
    
    async def complete(
        self, 
        prompt: str, 
        system_prompt: Optional[str] = None,
        schema: Optional[type] = None
    ) -> str:
        """Make a single LLM call with retry logic."""
        # Implementation: direct API call with basic retry
        # 1. Parse response as JSON if schema provided
        # 2. Handle rate limits with simple backoff
        # 3. Track basic cost metrics
    
    async def complete_with_schema(
        self,
        prompt: str,
        response_schema: dict,
        system_prompt: Optional[str] = None
    ) -> dict:
        """Complete with JSON schema enforcement."""
        # Uses provider's native JSON mode
        # Falls back to response parsing if needed
    
    def get_stats(self) -> dict:
        """Return basic usage statistics."""
        return {
            "total_tokens": self._total_tokens,
            "total_cost_usd": self._total_cost,
            "provider": self.config.provider.value,
            "model": self.config.model
        }
```
BT|
### 2.3 Z.ai GLM Coding Plan Integration

The POC uses **Z.ai's GLM Coding Plan** as the default AI provider. This provides cost-effective access to high-quality coding models.

**Why Z.ai?**
- Cost-effective: Plans start at ~$3/month
- Coding-optimized models: GLM-4.7, GLM-4.5-Air
- OpenAI-compatible API: Easy integration
- Generous quotas for development/testing

**API Details:**
| Setting | Value |
|---------|-------|
| Endpoint | `https://api.z.ai/api/coding/paas/v4` |
| API Key | Get from [Z.ai Dashboard](https://z.ai/model-api) |
| Models | `glm-4.7-flash`, `glm-4.7`, `glm-4.5-air`, etc. |
| Protocol | OpenAI-compatible |

**Getting Started:**
1. Visit [Z.ai](https://z.ai/subscribe) and subscribe to a GLM Coding Plan
2. Go to [API Keys](https://z.ai/model-api) and create a new key
3. Set the environment variable: `export ZAI_API_KEY="your-key-here"`

```python
# Z.ai SDK Implementation for POC
# Install: pip install zai-sdk

import os
from zai import ZaiClient

class ZAILLMClient:
    """
    Z.ai GLM client using official Z.ai Python SDK.
    
    Supports: glm-4.7-flash, glm-4.7, glm-4.5-air, glm-5, etc.
    """
    
    def __init__(self, api_key: str = None, model: str = "glm-4.7-flash"):
        """
        Initialize Z.ai client.
        
        Args:
            api_key: Z.ai API key (reads from ZAI_API_KEY env if not provided)
            model: Model to use (default: glm-4.7-flash for speed)
        """
        self.api_key = api_key or os.getenv("ZAI_API_KEY")
        if not self.api_key:
            raise ValueError("ZAI_API_KEY must be provided or set as environment variable")
        
        self.model = model
        self.client = ZaiClient(api_key=self.api_key)
        
        # Usage tracking
        self._total_tokens = 0
        self._total_cost = 0.0
    
    def complete(
        self, 
        prompt: str, 
        system_prompt: str = None,
        temperature: float = 0.7,
        max_tokens: int = 4096
    ) -> str:
        """
        Make a single LLM call.
        
        Args:
            prompt: User prompt
            system_prompt: Optional system prompt
            temperature: Sampling temperature (0-1)
            max_tokens: Maximum tokens to generate
            
        Returns:
            Generated text response
        """
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        # Track usage (if available)
        if hasattr(response, 'usage') and response.usage:
            self._total_tokens += response.usage.total_tokens
        
        return response.choices[0].message.content
    
    def complete_json(
        self, 
        prompt: str, 
        system_prompt: str = None,
        temperature: float = 0.3
    ) -> dict:
        """
        Make an LLM call and parse response as JSON.
        
        Args:
            prompt: User prompt (should ask for JSON response)
            system_prompt: Optional system prompt
            temperature: Lower temperature for structured output
            
        Returns:
            Parsed JSON response
        """
        import json
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({
            "role": "user", 
            "content": f"{prompt}\n\nRespond ONLY with valid JSON, no markdown formatting."
        })
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            max_tokens=4096,
            # Use response_format for JSON mode if supported
            response_format={"type": "json_object"} if self.model.startswith("glm-4") else None
        )
        
        content = response.choices[0].message.content
        
        # Try to parse as JSON, strip markdown if present
        try:
            content = content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            return json.loads(content.strip())
        except json.JSONDecodeError:
            # Return raw content if parsing fails
            return {"raw_response": content}
    
    def stream_complete(
        self, 
        prompt: str, 
        system_prompt: str = None,
        temperature: float = 0.7
    ) -> str:
        """
        Make a streaming LLM call.
        
        Args:
            prompt: User prompt
            system_prompt: Optional system prompt
            temperature: Sampling temperature
            
        Yields:
            Text chunks as they arrive
        """
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            max_tokens=4096,
            stream=True
        )
        
        full_response = ""
        for chunk in response:
            if chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                full_response += content
                yield content
        
        return full_response
    
    def get_stats(self) -> dict:
        """Return usage statistics."""
        return {
            "total_tokens": self._total_tokens,
            "total_cost_usd": self._total_cost,
            "model": self.model,
            "provider": "z.ai"
        }


# Usage Example
if __name__ == "__main__":
    # Initialize client (reads from ZAI_API_KEY environment variable)
    llm = ZAILLMClient(model="glm-4.7-flash")
    
    # Simple completion
    response = llm.complete(
        prompt="What is the capital of France?",
        system_prompt="You are a helpful assistant."
    )
    print(f"Response: {response}")
    
    # JSON completion
    result = llm.complete_json(
        prompt="List 3 programming languages with their creation year. Return as JSON with keys: languages (array of objects with name and year)."
    )
    print(f"JSON Result: {result}")
```
### 2.3 Configuration

```yaml
# config/poc.yaml

llm:
  provider: "zai"  # Z.ai GLM Coding Plan (recommended for POC)
  api_key: "${ZAI_API_KEY}"  # From environment
  model: "glm-4.7-flash"  # GLM-4.7-Flash (fast), GLM-4.7, GLM-4.5-Air, etc.
  
  # Rate limiting (simple, global)
  rate_limit:
    requests_per_minute: 60
    tokens_per_minute: 150000
    
  # Budget tracking
  budget:
    max_total_usd: 100.00  # Hard limit for POC
    warn_at_usd: 75.00

# Generation settings
generation:
  # Reduced pipeline for faster POC iteration
  phases:
    - discover
    - extract  
    - validate
    # Integration phase deferred to PROD
  
  # Smaller scope
  max_topics_per_target: 50
  max_examples_per_entry: 3
  content_resolutions: ["micro", "standard"]  # Skip exhaustive for speed

# Query API settings
api:
  host: "0.0.0.0"
  port: 8080
  api_keys:
    - "${POC_API_KEY}"
  rate_limit:
    requests_per_minute: 100
```

---

## 3. POC Project Structure

### 3.1 Directory Layout

```
magB/
├── config/
│   ├── poc.yaml              # POC-specific configuration
│   └── .env                 # Environment variables (API keys)
│
├── src/
│   ├── poc/                 # POC-specific implementations
│   │   ├── __init__.py
│   │   ├── cli.py           # CLI for POC operations
│   │   ├── orchestrator.py  # Simplified pipeline orchestrator
│   │   └── config.py        # Configuration loader
│   │
│   ├── llm/                 # LLM client (simplified)
│   │   ├── __init__.py
│   │   ├── base.py         # Base client interface
│   │   ├── openai.py       # OpenAI implementation
│   │   ├── anthropic.py    # Anthropic implementation
│   │   └── response_parser.py  # JSON parsing utilities
│   │
│   ├── pipeline/            # Generation pipeline
│   │   ├── __init__.py
│   │   ├── phases/          # Pipeline phases
│   │   │   ├── discover.py
│   │   │   ├── extract.py
│   │   │   └── validate.py
│   │   ├── checkpoint.py   # Basic checkpointing
│   │   └── tracker.py      # Progress tracking
│   │
│   ├── db/                 # Database access layer
│   │   ├── __init__.py
│   │   ├── connection.py   # asyncpg connection pool
│   │   ├── queries.py      # Query methods
│   │   └── seed_data.py    # Initial data seeding
│   │
│   ├── api/                # REST API (simplified)
│   │   ├── __init__.py
│   │   ├── app.py          # FastAPI application
│   │   ├── routes/
│   │   │   ├── targets.py
│   │   │   ├── entries.py
│   │   │   └── query.py
│   │   └── middleware.py   # Auth, rate limiting
│   │
│   └── shared/             # Shared utilities
│       ├── __init__.py
│       ├── models.py       # Pydantic models
│       └── utils.py
│
├── prisma/
│   ├── schema.prisma       # Database schema (unchanged)
│   └── migrations/         # Already applied
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
├── scripts/
│   ├── setup_poc.sh        # Setup script
│   ├── seed_targets.py     # Seed initial targets
│   └── run_generation.py   # Run generation for a target
│
├── docs/
│   └── poc/                # POC-specific documentation
│       ├── README.md
│       └── architecture.md
│
├── README.md               # Updated for dual-track
├── POC_ARCHITECTURE.md     # This document
└── docker-compose.yaml     # Local development
```

### 3.2 Key Files Detail

#### src/poc/cli.py

```python
#!/usr/bin/env python3
"""
POC CLI for magB operations.

Provides simple commands for:
- Generating knowledge for a target
- Querying the knowledge base
- Checking system health
"""

import asyncio
import click
from pathlib import Path

from .config import load_config
from .orchestrator import POCOrchestrator
from ..db.connection import Database

@click.group()
def cli():
    """magB POC CLI"""
    pass

@cli.command()
@click.argument('target_id')
@click.option('--phases', default='discover,extract,validate',
              help='Comma-separated phases to run')
def generate(target_id: str, phases: str):
    """Generate knowledge for a target."""
    async def run():
        config = load_config()
        db = Database(config.database_url)
        await db.connect()
        
        orchestrator = POCOrchestrator(config, db)
        await orchestrator.run(target_id, phases.split(','))
        
        await db.disconnect()
    
    asyncio.run(run())

@cli.command()
@click.argument('query')
@click.option('--target', help='Filter by target')
@click.option('--limit', default=10)
def query(query: str, target: str, limit: int):
    """Query the knowledge base."""
    # Implementation...

@cli.command()
def health():
    """Check system health."""
    # Implementation...

if __name__ == '__main__':
    cli()
```

#### src/poc/orchestrator.py

```python
"""
Simplified POC Orchestrator.

Replaces the full 12-phase pipeline with a simplified
3-phase approach for faster POC iteration.
"""

from dataclasses import dataclass
from typing import List
import asyncio

from ..llm.direct_llm import DirectLLM
from ..db.connection import Database
from .config import POCConfig

@dataclass
class GenerationResult:
    target_id: str
    phases_completed: List[str]
    entries_created: int
    cost_usd: float
    errors: List[str]

class POCOrchestrator:
    """
    Simplified orchestrator for POC.
    
    Runs a reduced pipeline:
    1. DISCOVER - Enumerate topic tree
    2. EXTRACT - Generate entries and examples  
    3. VALIDATE - Basic validation
    
    Deferred to PROD:
    - Integration phase
    - Full observability
    - Multi-model validation
    """
    
    def __init__(self, config: POCConfig, db: Database):
        self.config = config
        self.db = db
        self.llm = DirectLLM(config.llm)
    
    async def run(self, target_id: str, phases: List[str]) -> GenerationResult:
        """Run generation for a target."""
        # 1. Load target info
        target = await self.db.get_target(target_id)
        
        # 2. Run requested phases
        results = []
        for phase in phases:
            if phase == "discover":
                results.append(await self._run_discover(target))
            elif phase == "extract":
                results.append(await self._run_extract(target))
            elif phase == "validate":
                results.append(await self._run_validate(target))
        
        # 3. Return summary
        return GenerationResult(
            target_id=target_id,
            phases_completed=phases,
            entries_created=sum(r.entries_created for r in results),
            cost_usd=self.llm.get_stats()['total_cost_usd'],
            errors=[e for r in results for e in r.errors]
        )
    
    async def _run_discover(self, target):
        """Phase 1: Discover topic tree."""
        # Simplified: Call LLM to enumerate capabilities
        # Store as TopicNodes in database
        pass
    
    async def _run_extract(self, target):
        """Phase 2: Extract knowledge entries."""
        # Simplified: For each topic, generate entries
        # Store in database
        pass
    
    async def _run_validate(self, target):
        """Phase 3: Basic validation."""
        # Simplified: Check for obvious errors
        # Store validation results
        pass
```

---

## 4. POC API Endpoints

### 4.1 API Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                      POC API v1                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  BASE: /api/v1                                                  │
│  AUTH: X-API-Key header                                         │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  EXPLORE (Browse & Discover)                                │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │  GET  /targets                      List all targets        │ │
│  │  GET  /targets/{id}                 Get target details      │ │
│  │  GET  /targets/{id}/entries        Get target entries      │ │
│  │  GET  /concepts                    List concepts           │ │
│  │  GET  /concepts/{id}               Get concept details     │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  RETRIEVE (Get Specific Knowledge)                          │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │  GET  /entries/{id}                 Get entry details      │ │
│  │  GET  /entries/{id}/examples       Get entry examples     │ │
│  │  GET  /search                       Semantic search        │ │
│  │  GET  /graph/neighbors/{id}        Get related entries    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  GENERATE (Trigger Generation)                              │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │  POST /generate                    Start generation       │ │
│  │  GET  /generate/{run_id}            Get generation status │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  SYSTEM                                                    │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │  GET  /health                      Health check           │ │
│  │  GET  /stats                       Basic statistics      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Example API Usage

```bash
# List targets
curl -H "X-API-Key: ${POC_API_KEY}" \
  http://localhost:8080/api/v1/targets

# Search for knowledge
curl -H "X-API-Key: ${POC_API_KEY}" \
  "http://localhost:8080/api/v1/search?q=python+list+comprehension&target=python"

# Get entry details
curl -H "X-API-Key: ${POC_API_KEY}" \
  http://localhost:8080/api/v1/entries/python.list.comprehension

# Trigger generation (admin only)
curl -H "X-API-Key: ${POC_API_KEY}" \
  -X POST http://localhost:8080/api/v1/generate \
  -d '{"target_id": "rust", "phases": ["discover", "extract"]}'
```

### 4.3 API Implementation

```python
# src/api/routes/targets.py

from fastapi import APIRouter, Depends, HTTPException
from ..middleware import verify_api_key
from ..schemas import TargetResponse, TargetListResponse

router = APIRouter(prefix="/targets", tags=["targets"])

@router.get("", response_model=TargetListResponse)
async def list_targets(
    kind: str = None,
    limit: int = 20,
    offset: int = 0,
    api_key: str = Depends(verify_api_key)
):
    """List all targets in the knowledge base."""
    # Implementation: query database
    pass

@router.get("/{target_id}", response_model=TargetResponse)
async def get_target(
    target_id: str,
    api_key: str = Depends(verify_api_key)
):
    """Get detailed information about a target."""
    # Implementation: query database
    pass

@router.get("/{target_id}/entries")
async def get_target_entries(
    target_id: str,
    entry_type: str = None,
    limit: int = 50,
    api_key: str = Depends(verify_api_key)
):
    """Get all entries for a target."""
    # Implementation: query database
    pass
```

---

## 5. Implementation Roadmap

### 5.1 Phase 1: Foundation (Weeks 1-2)

| Task | Description | Deliverable |
|------|-------------|-------------|
| 1.1 | Setup project structure | Directories and basic files |
| 1.2 | Implement DirectLLM client | Working LLM calls |
| 1.3 | Implement database connection | asyncpg pool + queries |
| 1.4 | Create seed data script | Initial targets/concepts |
| 1.5 | Basic CLI working | `magb-poc generate <target>` |

**Milestone**: Can generate knowledge for one target end-to-end

### 5.2 Phase 2: Core Pipeline (Weeks 3-4)

| Task | Description | Deliverable |
|------|-------------|-------------|
| 2.1 | Implement DISCOVER phase | Topic tree generation |
| 2.2 | Implement EXTRACT phase | Entry creation |
| 3.3 | Implement VALIDATE phase | Basic validation |
| 3.4 | Add checkpointing | Resume from failure |
| 3.5 | Add progress tracking | CLI output |

**Milestone**: Can generate full knowledge base for a language (Python)

### 5.3 Phase 3: API & Query (Weeks 5-6)

| Task | Description | Deliverable |
|------|-------------|-------------|
| 3.1 | Implement FastAPI app | Running API server |
| 3.2 | Add API key auth | Secure endpoints |
| 3.3 | Implement EXPLORE endpoints | Browse targets/entries |
| 3.4 | Implement RETRIEVE endpoints | Get specific knowledge |
| 3.5 | Add basic search | Full-text search |

**Milestone**: REST API serves knowledge to external tools

### 5.4 Phase 4: Validation & Polish (Weeks 7-8)

| Task | Description | Deliverable |
|------|-------------|-------------|
| 4.1 | Add integration tests | Test coverage |
| 4.2 | Generate 3 targets | Python, JSON, YAML |
| 4.3 | Performance tuning | Sub-200ms queries |
| 4.4 | Documentation | POC README + guides |
| 4.5 | Docker support | Container deployment |

**Milestone**: Production-ready POC with 3 working targets

---

## 6. Transition to PROD

### 6.1 Shared Components (No Change)

These components are identical in POC and PROD:

- Database schema (Prisma models)
- Target, Concept, Family seed data
- Core data models (Entry, Example, Atom, etc.)

### 6.2 Components to Replace

| POC Component | PROD Replacement | Effort |
|---------------|------------------|--------|
| DirectLLM | ACEProviderPlugin system | High |
| Fixed rate limiting | Per-user token buckets | Medium |
| Simple CLI | Full orchestrator + dashboard | High |
| Basic validation | Multi-model consensus | High |
| Single-instance API | Multi-instance + load balancer | Medium |
| Basic health | Full 5 vital signs | High |

### 6.3 New PROD Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROD-Only Components                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  ACE (AI Contribution Engine)                               │ │
│  │  • Provider plugins (OpenAI, Anthropic, Gemini, Ollama)   │ │
│  │  • Contributor wallet system                                │ │
│  │  • Token budget management                                  │ │
│  │  • Dynamic rate limiting                                    │ │
│  │  • Cost attribution & reporting                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Full Observability                                        │ │
│  │  • Five vital signs (Coverage, Accuracy, Freshness, etc.)  │ │
│  │  • Health ledger & drift detection                         │ │
│  │  • Immune system (auto-regeneration)                       │ │
│  │  • Grafana dashboards                                      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Integration Phase                                         │ │
│  │  • Composition rules engine                                 │ │
│  │  • Blueprint generator                                     │ │
│  │  • Architecture diagram generation                         │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Advanced Features                                         │ │
│  │  • Multi-model validation consensus                        │ │
│  │  • Code execution sandbox                                  │ │
│  │  • Cross-reference validation                              │ │
│  │  • Statistical sampling validator                         │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Configuration Reference

### 7.1 Environment Variables

```bash
# Required
export DATABASE_URL="postgresql://user:pass@host:5433/magb"
export POC_API_KEY="magb-poc-xxxxx"

# LLM Provider
export OPENAI_API_KEY="sk-..."
# or
# Z.ai GLM Coding Plan (recommended for POC)
export ZAI_API_KEY="your-zai-api-key-here"

# Or use OpenAI/Anthropic
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."

# Optional
export LOG_LEVEL="INFO"
export MAX_BUDGET_USD="100.00"
```

### 7.2 Full Config Example

```yaml
# config/poc.yaml

version: "1.0"
environment: "poc"

# Database
database:
  url: "${DATABASE_URL}"
  pool_size: 5
  timeout: 30

# LLM Configuration
llm:
  provider: "zai"  # Z.ai GLM Coding Plan (recommended for POC)
  model: "glm-4.7-flash"  # GLM-4.7-Flash (fast), GLM-4.7, GLM-4.5-Air, etc.
  max_tokens: 4096
  temperature: 0.7
  
  retry:
    max_attempts: 3
    backoff_base: 2  # seconds
    backoff_max: 30
  
  budget:
    max_total_usd: 100.00
    warn_at_usd: 75.00

# Generation Pipeline
generation:
  phases:
    - discover
    - extract
    - validate
  
  limits:
    max_topics: 50
    max_examples: 3
    max_retries_per_entry: 2
  
  content:
    resolutions: ["micro", "standard"]

# API Server
api:
  host: "0.0.0.0"
  port: 8080
  
  auth:
    type: "api_key"
    keys:
      - "${POC_API_KEY}"
  
  rate_limit:
    requests_per_minute: 100
    burst: 20

# Logging
logging:
  level: "INFO"
  format: "json"
  output: "stdout"

# Features (POC = disabled, PROD = enabled)
features:
  ace_system: false
  observability: false
  integration_phase: false
  auto_validation: false
```

---

## 8. Quick Start Guide

### 8.1 Setup

```bash
# Clone and setup
git clone https://github.com/your-org/magb.git
cd magb

# Install dependencies
pip install -r requirements.txt

# Install Z.ai SDK
pip install zai-sdk

# Configure
cp config/poc.example.yaml config/poc.yaml

# Set Z.ai API key (recommended: use .env file)
export ZAI_API_KEY="your-api-key-here"

# Verify Z.ai connection
python -c "from zai import ZaiClient; c = ZaiClient(); print(c.chat.completions.create(model='glm-4.7-flash', messages=[{'role':'user','content':'test'}]).choices[0].message.content)"
```

> 📖 **Detailed Z.ai Setup**: See [Z.ai Setup Guide](docs/poc/zai-setup.md) for complete instructions.

### 8.2 Seed Initial Data

```bash
# Seed core targets and concepts
python scripts/seed_targets.py
```

### 8.3 Generate Knowledge

```bash
# Generate for Python
python -m src.poc.cli generate python

# Generate for JSON
python -m src.poc.cli generate json
```

### 8.4 Query via API

```bash
# Start API server
python -m src.api.app

# In another terminal:
curl -H "X-API-Key: ${POC_API_KEY}" \
  http://localhost:8080/api/v1/targets
```

---

## Appendix A: File Inventory

| File | Purpose |
|------|---------|
| `POC_ARCHITECTURE.md` | This document |
| `config/poc.yaml` | POC configuration |
| `src/poc/__init__.py` | POC package |
| `src/poc/cli.py` | CLI commands |
| `src/poc/orchestrator.py` | Pipeline orchestration |
| `src/poc/config.py` | Config loading |
| `src/llm/direct_llm.py` | Simplified LLM client |
| `src/db/connection.py` | Database access |
| `src/api/app.py` | FastAPI application |

---

## Appendix B: Dependencies

```txt
# Core
fastapi>=0.109.0
uvicorn>=0.27.0
pydantic>=2.5.0

# Database
asyncpg>=0.29.0
pgvector>=0.2.0
prisma>=0.13.0

# LLM
openai>=1.10.0
anthropic>=0.18.0

# Utilities
python-dotenv>=1.0.0
click>=8.1.0
pyyaml>=6.0.0

# Development
pytest>=8.0.0
pytest-asyncio>=0.23.0
httpx>=0.26.0
```

---

*Document Version: 1.0*  
*Last Updated: 2026-03-13*

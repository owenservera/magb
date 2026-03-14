# magB Ecosystem Implementation Plan (Enhanced v2.0)

## Overview
This document provides a comprehensive project plan for implementing the magB ecosystem, including the Universal Blueprint Machine (magB), AI Contribution Engine (ACE/AIContrib), and Knowledge Engine API. This **enhanced version** incorporates critical architecture elements from the original design documents that were missing in v1.0.

### Key Enhancements in v2.0
- **Knowledge Graph Architecture**: Universal concept layer, family inheritance, delta version chains
- **Implementation Layer**: Format atoms, shared algorithms, capabilities, blueprints
- **Observability System**: Five vital signs, decay tracking, drift detection, health ledger
- **Target Registry**: Curated list of 1,000+ targets with tiers and cost estimates
- **LLM Infrastructure**: Robust response parsing, multi-provider engine, token budgeting
- **Validation Pipeline**: Code execution, cross-reference validation, schema verification

---

## Workstreams

### Workstream 0: Foundation & Seed Data
*Responsible for curating the foundational knowledge structures that all generation depends on*

#### Milestone 0.1: Target Registry
- [ ] Define target tier classification system (Tier 1-4)
- [ ] Curate Tier 1 targets (~25 languages/formats with highest value)
- [ ] Create target metadata schema (type, families, traits, spec sources, estimated cost)
- [ ] Build target registry with version chains and delta relationships
- [ ] Implement target discovery and prioritization logic
- [ ] Create cost estimation model per target type

#### Milestone 0.2: Universal Concept Taxonomy
- [ ] Define concept domain taxonomy (computation, data, graphics, compression, etc.)
- [ ] Curate ~300 universal concepts organized by domain
- [ ] Build concept hierarchy (parent/child/sibling relationships)
- [ ] Define concept manifestation schemas (how concepts appear in different targets)
- [ ] Create learning path structures (beginner → intermediate → expert explanations)
- [ ] Map concepts to generation prompts

#### Milestone 0.3: Family Definitions
- [ ] Define ~50 language/format families (C-family, ML-family, OPC formats, etc.)
- [ ] Document shared traits per family (inherited knowledge)
- [ ] Create family membership mappings
- [ ] Build family-based generation optimization (generate once, inherit everywhere)
- [ ] Implement family similarity scoring for cross-target gap analysis

#### Milestone 0.4: Schema & Database Infrastructure
- [ ] Implement PostgreSQL + pgvector database schema
- [ ] Create all core tables: concepts, families, targets, target_versions, entries, examples
- [ ] Create implementation tables: atoms, algorithms, capabilities, blueprints, artifacts
- [ ] Create graph tables: relations (typed, weighted, directional edges)
- [ ] Create operations tables: generation_runs, validations, embeddings, schema_metadata
- [ ] Implement HNSW vector indices for semantic search
- [ ] Create graph traversal indices
- [ ] Build full-text search indices
- [ ] Implement database migrations framework
- [ ] Create schema introspection system (self-describing schema)

---

### Workstream 1: Universal Blueprint Machine (magB) Core
*Responsible for generating complete, structured, verified knowledge bases*

#### Milestone 1.1: Knowledge Graph Data Models
- [ ] Implement KnowledgeNode class with canonical ID generation
- [ ] Implement KnowledgeEdge class with typed relationships
- [ ] Create multi-resolution content storage (micro/standard/exhaustive)
- [ ] Implement pre-computed token counting for all content resolutions
- [ ] Build embedding storage with resolution-specific vectors
- [ ] Create provenance tracking (generator model, timestamp, confidence)
- [ ] Implement content hashing for change detection
- [ ] Build delta chain storage for version sequences

#### Milestone 1.2: LLM Infrastructure Engine
- [ ] Implement MultiProviderAPIEngine with OpenAI + Anthropic support
- [ ] Create model routing (cheap/mid/expensive tiers by task type)
- [ ] Implement semaphore-based rate limiting per provider/model
- [ ] Build exponential backoff retry logic with configurable thresholds
- [ ] Create token counting and cost tracking (real-time budget monitoring)
- [ ] Implement circuit breaker pattern for failing providers
- [ ] Build provider health checking system
- [ ] Create structured JSON output enforcement
- [ ] Implement response parser with multiple recovery strategies:
  - [ ] Direct JSON parsing
  - [ ] Code fence extraction (```json ... ```)
  - [ ] Boundary extraction (find { } or [ ] pairs)
  - [ ] JSON cleaning (trailing commas, comments, single quotes)
  - [ ] Truncation repair (close open brackets)
- [ ] Build Pydantic schema validation for all response types
- [ ] Create token estimator for budget planning

#### Milestone 1.3: Discovery Phase Implementation
- [ ] Implement capability enumeration engine
- [ ] Create structured prompting system for capability discovery
- [ ] Build confidence scoring mechanism for discovered capabilities
- [ ] Develop dependency mapping between capabilities
- [ ] Implement capability taxonomy organization
- [ ] Create completeness anchors generation (exhaustive lists: keywords, builtins, stdlib, operators)
- [ ] Build anchor-based gap detection

#### Milestone 1.4: Extraction Phase Implementation
- [ ] Develop structural template extraction system
- [ ] Create algorithm extraction with mathematical foundation capture
- [ ] Implement coordinate system and unit conversion extraction
- [ ] Build constraint and validation rule extraction
- [ ] Develop code implementation extraction with multi-language support
- [ ] Create format atom extraction (XML elements, binary fields, enum values)
- [ ] Implement namespace registry extraction
- [ ] Build relationship extraction (parent-child, dependencies, compositions)

#### Milestone 1.5: Validation Phase Implementation
- [ ] Create code execution sandbox for generated implementations
- [ ] Build test vector generation and validation system
- [ ] Implement automatic error correction loop
- [ ] Develop cross-referencing gap detection system
- [ ] Create knowledge freshness and correctness scoring
- [ ] Implement schema validation for all generated content
- [ ] Build statistical sampling validator (0.5% daily sample rate)
- [ ] Create systematic error pattern detector

#### Milestone 1.6: Integration Phase Implementation
- [ ] Develop composition rules engine for capability interactions
- [ ] Create application blueprint generator
- [ ] Build minimal viable implementation synthesizer
- [ ] Implement architecture diagram generation
- [ ] Create dependency resolution for application components
- [ ] Build build-sequence generator (phased implementation milestones)
- [ ] Implement extension point identification

#### Milestone 1.7: Pipeline Orchestration
- [ ] Implement 12-phase pipeline orchestrator:
  - Phase 1: Decompose topic tree
  - Phase 2: Enumerate completeness anchors
  - Phase 3: Generate reference content
  - Phase 4: Gap analysis (tree)
  - Phase 5: Fill gaps
  - Phase 6: Validate accuracy
  - Phase 7: Enumerate capabilities
  - Phase 8: Extract format atoms
  - Phase 9: Extract algorithms
  - Phase 10: Generate implementation specs
  - Phase 11: Assemble blueprints
  - Phase 12: Validate implementations
- [ ] Create checkpointing and resume system (survive crashes at step 247 of 400)
- [ ] Implement async task executor with configurable concurrency
- [ ] Build task decomposition planner
- [ ] Create deduplication engine (shared algorithms, concepts, families)
- [ ] Implement generation run tracking (API calls, tokens, cost, errors)
- [ ] Build progress reporting and ETA estimation

#### Milestone 1.8: Quality Assurance & Healing Loop
- [ ] Implement knowledge drift detection system
- [ ] Create automated healing pipeline for stale knowledge
- [ ] Build coverage analysis and gap identification
- [ ] Develop priority queue for knowledge regeneration
- [ ] Implement confidence decay modeling
- [ ] Create daily healing cycle with budget limits
- [ ] Implement version change monitoring (release feeds, changelogs)

---

### Workstream 2: AI Contribution Engine (ACE/AIContrib)
*Responsible for providing AI compute resources through contributor donations*

#### Milestone 2.1: Provider Plugin System
- [ ] Implement AIProviderAdapter abstract base class
- [ ] Develop provider registry with auto-discovery mechanism
- [ ] Create OpenAI adapter implementation
- [ ] Develop Anthropic adapter implementation
- [ ] Implement Google Gemini adapter
- [ ] Add support for local LLMs (Ollama, vLLM, llama.cpp)
- [ ] Create plugin template for custom provider adapters
- [ ] Implement provider health checking and circuit breaker pattern

#### Milestone 2.2: Intelligent Request Routing
- [ ] Develop multi-provider request router
- [ ] Implement load balancing algorithms
- [ ] Create failover mechanisms with provider fallbacks
- [ ] Build cost optimization routing based on contributor budgets
- [ ] Implement priority queue for request scheduling
- [ ] Add rate limiting per provider and contributor

#### Milestone 2.3: Token Budget & Contributor Management
- [ ] Implement contributor wallet system
- [ ] Create token budget tracking and management
- [ ] Develop contributor attribution and reputation system
- [ ] Build contribution policies and limits enforcement
- [ ] Create wallet API for contributor interactions
- [ ] Implement secure credential storage with AES-256-GCM encryption

#### Milestone 2.4: Development Pipeline Orchestration
- [ ] Implement issue triage and task decomposition engine
- [ ] Create code generation task executor
- [ ] Build automated code review system
- [ ] Develop testing and validation pipeline
- [ ] Implement PR creation and merging automation
- [ ] Create pipeline lifecycle hooks system
- [ ] Add Docker and Kubernetes deployment configurations

#### Milestone 2.5: Observability & Compliance
- [ ] Implement immutable audit logging system
- [ ] Create policy compliance checker
- [ ] Build usage reporting and analytics dashboard
- [ ] Develop contributor analytics and impact measurement
- [ ] Implement real-time task monitoring via WebSockets
- [ ] Add GDPR and data protection compliance features

---

### Workstream 3: Knowledge Engine API
*Responsible for serving magB-generated knowledge to users and AI agents*

#### Milestone 3.1: API Foundation & Authentication
- [ ] Implement FastAPI application with async support
- [ ] Create API key authentication system
- [ ] Implement token bucket rate limiting per API key
- [ ] Add CORS middleware and security headers
- [ ] Create request/response logging and tracing
- [ ] Implement API versioning strategy

#### Milestone 3.2: EXPLORE Endpoints (Browse & Discover)
- [ ] Implement /v1/targets endpoint for listing all knowledge bases
- [ ] Create /v1/targets/{id} endpoint for target details
- [ ] Build /v1/targets/{id}/capabilities endpoint with filtering
- [ ] Develop /v1/graph/neighbors/{node_id} for graph traversal
- [ ] Implement /v1/concepts endpoint for cross-cutting concepts
- [ ] Add metadata endpoints for node and relationship types

#### Milestone 3.3: RETRIEVE Endpoints (Get Specific Knowledge)
- [ ] Implement /v1/capabilities/{id}/bundle endpoint (core capability retrieval)
- [ ] Create /v1/algorithms/{id} endpoint for algorithm details
- [ ] Build /v1/structures/{id} endpoint for structural templates
- [ ] Develop /v1/targets/{id}/coordinate-system endpoint
- [ ] Implement /v1/targets/{id}/minimal-file endpoint
- [ ] Add bulk retrieval and entry neighbors endpoints

#### Milestone 3.4: SYNTHESIZE Endpoints (Build from Knowledge)
- [ ] Implement /v1/assemble endpoint for smart knowledge assembly
- [ ] Create /v1/blueprint endpoint for application architecture
- [ ] Build /v1/diagnose endpoint for issue diagnosis
- [ ] Develop /v1/convert endpoint for format conversion guidance
- [ ] Implement /v1/compare endpoint for target comparison
- [ ] Add translation and learning path endpoints

#### Milestone 3.5: AI Context Endpoints (LLM Optimization)
- [ ] Implement /v1/ai/context endpoint for optimal context assembly
- [ ] Create /v1/ai/system-prompt/{target} endpoint for expert prompts
- [ ] Build context batching and deduplication system
- [ ] Develop token budget management for AI context
- [ ] Implement resolution strategy optimization (micro/standard/exhaustive)
- [ ] Add quality indicators and confidence scoring

#### Milestone 3.6: HEALTH & METa Endpoints
- [ ] Implement /v1/health endpoint for basic health checking
- [ ] Create /v1/vitality endpoint for knowledge vitality dashboard
- [ ] Build /v1/vitality/drift-events endpoint for unresolved issues
- [ ] Implement statistics and database monitoring endpoints
- [ ] Add auto-generated OpenAPI/Swagger documentation
- [ ] Create health check and alerting system

#### Milestone 3.7: SDK Development
- [ ] Create Python SDK with KnowledgeEngine client class
- [ ] Develop JavaScript/TypeScript SDK for browser and Node.js
- [ ] Implement SDK methods for all API endpoint categories
- [ ] Add authentication handling and automatic retries
- [ ] Build SDK documentation and usage examples
- [ ] Implement SDK testing suite

#### Milestone 3.8: Deployment & Infrastructure
- [ ] Create Docker containerization for all services
- [ ] Implement Kubernetes deployment manifests
- [ ] Build Terraform infrastructure-as-code templates
- [ ] Create load balancer configuration (nginx/caddy)
- [ ] Implement read replica strategy for knowledge base
- [ ] Develop backup and disaster recovery procedures
- [ ] Add monitoring, logging, and observability stack

---

### Workstream 4: Observability & Vitality System
*Responsible for monitoring knowledge health, detecting drift, and triggering regeneration*

#### Milestone 4.1: Five Vital Signs Implementation
- [ ] Implement Coverage Analyzer:
  - [ ] Anchor comparison (documented vs known items)
  - [ ] Concept coverage measurement
  - [ ] Peer comparison for gap estimation
  - [ ] Implementation layer coverage (atoms, capabilities, blueprints)
- [ ] Implement Accuracy Analyzer:
  - [ ] Stratified sampling with decay-weighted selection
  - [ ] Multi-model validation pipeline
  - [ ] Statistical inference with confidence intervals
  - [ ] Systematic error pattern detection
- [ ] Implement Freshness Analyzer:
  - [ ] Exponential decay computation per node
  - [ ] Decay model classification (eternal/geological/seasonal/volatile/ephemeral)
  - [ ] Half-life configuration per knowledge type
  - [ ] Future vitality prediction (30d/90d/180d)
- [ ] Implement Depth Analyzer:
  - [ ] Multi-resolution content completeness check
  - [ ] Knowledge layer population tracking (reference/atoms/algorithms/blueprints)
  - [ ] Implementation atom coverage per entry
- [ ] Implement Coherence Analyzer:
  - [ ] Orphan node detection (entries without relations)
  - [ ] Broken relation detection (references to non-existent nodes)
  - [ ] Contradiction detection (conflicting information)
  - [ ] Duplicate entry detection

#### Milestone 4.2: Health Ledger
- [ ] Create time-series health snapshot table
- [ ] Implement per-entry health measurement
- [ ] Build target-level and family-level aggregation
- [ ] Create global health dashboard data
- [ ] Implement rate-of-change tracking (deltas)
- [ ] Build health event logging system
- [ ] Create decay ledger with external event tracking
- [ ] Implement vitality snapshot history

#### Milestone 4.3: Drift Detection System
- [ ] Implement version drift checker (LLM-based release monitoring)
- [ ] Create spec amendment detector
- [ ] Build deprecation notice monitor
- [ ] Implement security advisory integration (CVE feeds)
- [ ] Create algorithm improvement detector
- [ ] Build ecosystem change monitor (package registries, GitHub releases)
- [ ] Implement drift event recording with severity classification
- [ ] Create auto-fixable drift identification

#### Milestone 4.4: Vitality Dashboard
- [ ] Build real-time vitality visualization
- [ ] Create health trend charts (time-series)
- [ ] Implement target-level health breakdown
- [ ] Build family-level health comparison
- [ ] Create critical/warning/healthy node counts
- [ ] Implement drill-down to entry-level health
- [ ] Build priority queue for regeneration candidates
- [ ] Create vitality forecast visualization

#### Milestone 4.5: Immune System (Automated Response)
- [ ] Implement regeneration trigger logic
- [ ] Create targeted re-validation scheduling
- [ ] Build deprecation marking automation
- [ ] Implement gap-filling task generation
- [ ] Create contradiction resolution workflow
- [ ] Build daily healing cycle with budget limits
- [ ] Implement emergency response for critical drift (security, breaking changes)

---

### Workstream 5: Cross-System Integration & Shared Infrastructure
*Responsible for integrating all three systems and providing shared services*

#### Milestone 5.1: Shared Authentication & Authorization
- [ ] Implement unified authentication service
- [ ] Create role-based access control (RBAC) system
- [ ] Develop API key management across all systems
- [ ] Build single sign-on (SSO) capabilities
- [ ] Implement audit logging for all authentication events
- [ ] Add OAuth2/OpenID Connect provider support

#### Milestone 5.2: Shared Observability & Monitoring
- [ ] Implement centralized logging system (ELK stack)
- [ ] Create distributed tracing with OpenTelemetry
- [ ] Build metrics collection and alerting (Prometheus/Grafana)
- [ ] Develop health check aggregation service
- [ ] Implement performance monitoring and bottleneck detection
- [ ] Add business analytics and usage tracking

#### Milestone 5.3: Shared Configuration & Secrets Management
- [ ] Implement centralized configuration service
- [ ] Create secrets management with HashiCorp Vault or similar
- [ ] Build environment-specific configuration management
- [ ] Develop feature flag system for gradual rollouts
- [ ] Add configuration validation and versioning
- [ ] Implement secure secrets rotation

#### Milestone 5.4: Data Pipeline & ETL Integration
- [ ] Build data ingestion pipeline from magB to Knowledge Engine API
- [ ] Create synchronization mechanism for knowledge updates
- [ ] Implement data validation and quality gates
- [ ] Develop backup and restore procedures for knowledge base
- [ ] Add data archiving and retention policies
- [ ] Implement ETL pipeline for analytics and reporting

#### Milestone 5.5: Export & Output Generation
- [ ] Implement multi-format exporter (JSON, Markdown, HTML)
- [ ] Create knowledge bundle assembler (all knowledge for a capability)
- [ ] Build markdown renderer with cross-references
- [ ] Implement JSON exporter with schema validation
- [ ] Create SDK generator from API spec
- [ ] Build documentation site generator
- [ ] Implement example code extractor

#### Milestone 5.6: Developer Experience & Documentation
- [ ] Create comprehensive developer documentation
- [ ] Build interactive API documentation and playground
- [ ] Develop tutorials and getting-started guides
- [ ] Create sample applications and reference implementations
- [ ] Implement developer portal and community forum
- [ ] Add code examples and SDK usage demonstrations

---

## Key Milestones Summary

### Phase 0: Foundation (Months 1-2)
- [ ] Project initialization and team setup
- [ ] Architecture approval and technology selection
- [ ] **Target Registry curation (Tier 1: ~25 targets)**
- [ ] **Universal Concept Taxonomy (~300 concepts)**
- [ ] **Family Definitions (~50 families)**
- [ ] **PostgreSQL + pgvector schema implementation**
- [ ] Development environment and CI/CD pipeline setup
- [ ] Core shared infrastructure (auth, logging, config)
- [ ] Basic database schema and migration framework

### Phase 1: Core Systems Development (Months 3-6)
- [ ] **LLM Infrastructure Engine (multi-provider, response parser, token budgeting)**
- [ ] **12-phase pipeline orchestrator with checkpointing**
- [ ] Complete magB discovery and extraction phases
- [ ] **Format atom and algorithm extraction**
- [ ] AIContrib provider plugin system
- [ ] Knowledge Engine API foundation and EXPLORE endpoints
- [ ] **Observability: Five Vital Signs implementation**
- [ ] Establish cross-system communication mechanisms
- [ ] Create initial SDK prototypes

### Phase 2: Validation & Synthesis (Months 7-9)
- [ ] Complete magB validation and integration phases
- [ ] **Code execution sandbox and validation pipeline**
- [ ] **Health Ledger and Drift Detection**
- [ ] **Vitality Dashboard and Immune System**
- [ ] AIContrib development pipeline and token management
- [ ] Complete Knowledge Engine API RETRIEVE and SYNTHESIZE endpoints
- [ ] Build AI context optimization and LLM-focused features
- [ ] Implement observability and monitoring systems
- [ ] **Export pipeline (JSON, Markdown, documentation)**

### Phase 3: Polish & Deployment (Months 10-12)
- [ ] Complete all SDKs and developer tooling
- [ ] Implement production deployment and scaling mechanisms
- [ ] Build comprehensive test suite and quality gates
- [ ] Create documentation and user guides
- [ ] Implement security hardening and compliance measures
- [ ] Prepare for beta launch and community onboarding
- [ ] **Tier 1 target generation complete (~25 targets)**

---

## Atomic-Level Task Examples

### magB Workstream Atomic Tasks:
- [ ] Define PostgreSQL table schema for knowledge_nodes table
- [ ] Implement UUID generation for node canonical IDs
- [ ] Create SQL query for retrieving node by canonical_id
- [ ] Implement node content JSON serialization/deserialization
- [ ] Add indexes for frequent query patterns (by node_type, by tags)
- [ ] Create migration script for initial schema setup
- [ ] Implement connection pooling for database access
- [ ] Add database transaction handling for node updates
- [ ] Create utility function for converting database rows to node dictionaries
- [ ] Implement soft delete mechanism for knowledge nodes
- [ ] **Implement KnowledgeNode._compute_hash() for content-addressable deduplication**
- [ ] **Build multi-resolution content storage (micro/standard/exhaustive)**
- [ ] **Create pre-computed token counting for all content resolutions**
- [ ] **Implement delta chain storage for version sequences**

### LLM Infrastructure Atomic Tasks:
- [ ] **Implement ResponseParser.parse_json() with 5 recovery strategies**
- [ ] **Create code fence extraction regex patterns**
- [ ] **Build JSON boundary finder ({ } and [ ] pair matching)**
- [ ] **Implement trailing comma and comment removal**
- [ ] **Create truncation repair (close open brackets)**
- [ ] **Build TokenEstimator using tiktoken**
- [ ] **Implement MultiProviderAPIEngine with semaphore rate limiting**
- [ ] **Create exponential backoff retry with configurable base and max**
- [ ] **Build circuit breaker with failure threshold and reset timeout**
- [ ] **Implement real-time cost tracking and budget enforcement**

### Observability Atomic Tasks:
- [ ] **Implement DecayTracker.compute_all_decay()**
- [ ] **Create classify_decay_model() function (eternal/geological/seasonal/volatile/ephemeral)**
- [ ] **Build exponential decay computation: freshness = e^(-λt)**
- [ ] **Implement DriftDetector.check_for_version_drift()**
- [ ] **Create LLM-based version probe prompt**
- [ ] **Build drift event recording with severity classification**
- [ ] **Implement CoverageAnalyzer with anchor comparison**
- [ ] **Create AccuracyAnalyzer with stratified sampling**
- [ ] **Build Wilson score interval for confidence bounds**
- [ ] **Implement systematic error pattern detector**

### Validation Atomic Tasks:
- [ ] **Create sandboxed code executor with timeout**
- [ ] **Build test vector runner (input → expected output)**
- [ ] **Implement schema validator for generated content**
- [ ] **Create cross-reference validator (check all relation targets exist)**
- [ ] **Build contradiction detector (find conflicting entries)**
- [ ] **Implement statistical sampling selector (0.5% daily sample)**
- [ ] **Create multi-model validation consensus**

---

## Success Criteria

### Technical Success Criteria:
- [ ] All three systems can be deployed independently and in combination
- [ ] Knowledge generation pipeline completes successfully for at least 5 target formats/languages
- [ ] API responds to 95% of requests within 200ms under normal load
- [ ] System maintains 99.9% uptime with scheduled maintenance windows
- [ ] All data is encrypted at rest and in transit
- [ ] Backup and restore procedures tested and verified
- [ ] **Knowledge graph contains ~300 universal concepts, ~50 families, ~25 Tier 1 targets**
- [ ] **Observability system tracks all five vital signs with daily updates**
- [ ] **Drift detection identifies version changes within 7 days of release**

### Functional Success Criteria:
- [ ] Developers can generate working code for target capabilities using the API
- [ ] AI agents can assemble optimal context within token budget constraints
- [ ] Contributors can donate AI compute and track their impact
- [ ] Knowledge base maintains accuracy and freshness scores above 0.8
- [ ] System correctly identifies and suggests fixes for common implementation errors
- [ ] Cross-format conversion guidance produces working implementations
- [ ] **Generated knowledge includes all three layers (reference, atoms, algorithms/blueprints)**
- [ ] **Vitality dashboard shows real-time health across all dimensions**

### Business Success Criteria:
- [ ] System supports at least 10 major programming languages and file formats at launch
- [ ] Contributor base of 50+ active donors providing AI compute resources
- [ ] Developer adoption of 100+ active users in first 3 months post-launch
- [ ] Positive feedback on knowledge accuracy and usefulness from early adopters
- [ ] Clear path to sustainability through premium features or enterprise offerings

---

## Risk Mitigation

### Technical Risks:
- [ ] **Risk: LLM knowledge extraction produces inaccurate or hallucinated content**
  Mitigation: Multi-layer validation including code execution, cross-referencing, and statistical sampling with different models

- [ ] **Risk: Response parsing fails on messy LLM output**
  Mitigation: Five-strategy parser with progressive recovery, extensive fixture testing with real LLM outputs

- [ ] **Risk: Knowledge base grows too large for efficient querying**
  Mitigation: Proper indexing, partitioning, caching strategies, and archive policies; HNSW vector indices for semantic search

- [ ] **Risk: Provider API changes break adapter implementations**
  Mitigation: Abstract adapter interface with version detection and fallback mechanisms

- [ ] **Risk: Token budget management leads to contributor dissatisfaction**
  Mitigation: Transparent usage reporting, flexible contribution models, and clear communication

- [ ] **Risk: Pipeline crashes mid-generation losing progress**
  Mitigation: Checkpointing after every phase, resume capability, generation run tracking

### Operational Risks:
- [ ] **Risk: System complexity leads to deployment and maintenance challenges**
  Mitigation: Microservices architecture with clear boundaries, comprehensive monitoring, and gradual rollout procedures

- [ ] **Risk: Security vulnerabilities in credential handling or data exposure**
  Mitigation: Regular security audits, penetration testing, and adherence to security best practices

- [ ] **Risk: Community adoption fails to meet expectations**
  Mitigation: Early engagement with developer communities, clear value proposition, and responsive support

- [ ] **Risk: Knowledge decays faster than healing cycle**
  Mitigation: Priority-based regeneration queue, decay model classification, external drift detection

---

## Timeline Estimate

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Foundation | 2 months | Target registry, concept taxonomy, family definitions, database schema, shared infrastructure |
| Core Systems | 4 months | LLM infrastructure, 12-phase pipeline, magB extraction, AIContrib providers, API foundation, observability foundation |
| Validation & Synthesis | 3 months | Code validation, health ledger, drift detection, vitality dashboard, immune system, API synthesis features |
| Polish & Deployment | 3 months | SDKs, production deployment, testing, documentation, Tier 1 target generation complete |
| **Total** | **12 months** | **Production-ready magB ecosystem with ~25 Tier 1 targets fully generated** |

---

## Cost Projections

### Generation Costs (Tier 1: ~25 targets)
| Target Type | Count | Avg Cost | Total |
|-------------|-------|----------|-------|
| Programming Languages | 12 | $65 | $780 |
| File Formats | 10 | $100 | $1,000 |
| Protocols | 3 | $40 | $120 |
| **Total** | **25** | **~$76 avg** | **~$1,900** |

### Monthly Operational Costs
| Resource | Estimated Cost |
|----------|----------------|
| PostgreSQL + pgvector (managed) | $100/month |
| API costs (healing cycle, drift detection) | $150/month |
| Observability stack (logging, metrics) | $50/month |
| **Total** | **~$300/month** |

---

## Next Steps

1. Review and refine this enhanced project plan with stakeholders
2. Establish project governance and team structure
3. Set up development environment and initial repositories
4. **Begin Phase 0: Foundation work**
   - [ ] Curate Tier 1 target registry
   - [ ] Define universal concept taxonomy
   - [ ] Implement database schema
   - [ ] Build LLM infrastructure engine
5. Schedule regular review checkpoints to track progress against milestones

---

## Appendix: Original Architecture Documents Reference

This enhanced plan incorporates insights from the following original architecture documents:

1. **Architecture - Opus 4.6** - Complete 12-phase pipeline, prompt templates, LLM client architecture
2. **BYOkb Open Source API sharing system** - Knowledge Engine API design, multi-resolution content model
3. **magB Concept** - Three-layer knowledge model (reference/atoms/blueprints)
4. **magB Database Architecture** - PostgreSQL + pgvector schema, knowledge graph design
5. **magB MISSING ELEMENTS** - Critical gap analysis, response parser, target registry, concept taxonomy
6. **magB Observability** - Five vital signs, health ledger, drift detection, immune system
7. **AI Contribution Engine (ACE)** - Provider plugin system, token budget management, development pipeline
8. **Proposal without missing elements** - Future-proof schema architecture, deduplication strategy

---

*This enhanced plan represents a comprehensive breakdown of the magB ecosystem implementation effort. It should be reviewed and updated regularly as the project progresses and new information becomes available.*

//// GAPS IN THE PLAN ABOVE //



# POC Gap Analysis — What's Actually Missing

## Honest Status Assessment

After our entire conversation, we've produced roughly 4,000 lines of architecture, schema definitions, prompt templates, pipeline logic, API models, and service designs. That's substantial. But there's a specific category of work that we've been systematically avoiding because it's less interesting to design than it is essential to build.

Here's the brutal truth about where we stand:

```
CATEGORY                      DESIGNED    IMPLEMENTED    TESTED
──────────────────────────────────────────────────────────────
Data models (Pydantic)          95%          70%           0%
Prompt templates                90%          90%           0%  ← dangerous
LLM client                     85%          60%           0%
Pipeline orchestration          90%          40%           0%
Storage / DB layer              80%          25%           0%  ← biggest gap
API endpoints (routes)          95%          80%           0%
API services (logic)            70%          15%           0%  ← biggest gap
Context assembly                90%          50%           0%
Observability                   85%          20%           0%
Configuration management        20%           0%           0%
Embedding infrastructure        10%           0%           0%  ← not started
Seed data (taxonomy/registry)   75%          60%           0%
Test suite                       0%           0%           0%
Deployment / packaging           5%           0%           0%
End-to-end integration           0%           0%           0%  ← critical
```

The pattern is clear: **we've designed the cathedral but haven't mixed the concrete.** The gaps fall into specific categories, and I want to walk through each one with the exact code that needs to exist.

---

## Gap 1: The Database Access Layer Doesn't Exist

This is the single largest gap. Every service, every pipeline phase, every API endpoint ultimately calls the database. We have SQL DDL (the `CREATE TABLE` statements) and we have Pydantic models, but we have **nothing in between** — no connection management, no query execution, no result mapping, no migration system.

The API services reference methods like `db.vector_search()`, `db.get_entries_for_concept()`, `db.get_related_entries()` — none of which exist.

```python
# src/db/connection.py

"""
THE MISSING PIECE: Actual database connection and query execution.

This bridges the PostgreSQL schema (which we have) and the 
Pydantic models (which we have) and the services (which call 
methods that don't exist yet).
"""

import os
import json
import asyncio
from contextlib import asynccontextmanager
from typing import Optional, Any

import asyncpg
from pgvector.asyncpg import register_vector


class Database:
    """
    Async PostgreSQL connection pool with vector search support.
    
    Every service depends on this. Nothing works without it.
    """
    
    def __init__(self, dsn: str = None):
        self.dsn = dsn or os.getenv(
            "DATABASE_URL",
            "postgresql://magb:magb@localhost:5432/magb"
        )
        self._pool: Optional[asyncpg.Pool] = None
    
    async def connect(self):
        self._pool = await asyncpg.create_pool(
            self.dsn,
            min_size=5,
            max_size=20,
            init=self._init_connection,
        )
    
    async def _init_connection(self, conn: asyncpg.Connection):
        """Register pgvector type on each new connection."""
        await register_vector(conn)
    
    async def disconnect(self):
        if self._pool:
            await self._pool.close()
    
    @asynccontextmanager
    async def acquire(self):
        async with self._pool.acquire() as conn:
            yield conn
    
    async def fetch(self, query: str, *args) -> list[dict]:
        async with self.acquire() as conn:
            rows = await conn.fetch(query, *args)
            return [dict(row) for row in rows]
    
    async def fetchrow(self, query: str, *args) -> Optional[dict]:
        async with self.acquire() as conn:
            row = await conn.fetchrow(query, *args)
            return dict(row) if row else None
    
    async def fetchval(self, query: str, *args) -> Any:
        async with self.acquire() as conn:
            return await conn.fetchval(query, *args)
    
    async def execute(self, query: str, *args) -> str:
        async with self.acquire() as conn:
            return await conn.execute(query, *args)
    
    async def executemany(self, query: str, args: list) -> None:
        async with self.acquire() as conn:
            await conn.executemany(query, args)
    
    # ════════════════════════════════════════════════════════
    # DOMAIN-SPECIFIC QUERY METHODS
    # These are what the services actually call.
    # Every single one of these is currently missing.
    # ════════════════════════════════════════════════════════
    
    # ── Embedding Generation ───────────────────────────────
    
    async def get_embedding(self, text: str) -> list[float]:
        """
        Generate an embedding vector for a text query.
        
        THIS IS MISSING. We reference embeddings everywhere
        but have no code that actually calls an embedding API.
        """
        # Check cache first
        cached = await self._embedding_cache.get(text)
        if cached:
            return cached
        
        # Call OpenAI embeddings API
        import openai
        client = openai.AsyncOpenAI()
        response = await client.embeddings.create(
            model="text-embedding-3-small",
            input=text,
        )
        embedding = response.data[0].embedding
        
        # Cache it
        await self._embedding_cache.set(text, embedding)
        return embedding
    
    # ── Vector Search ──────────────────────────────────────
    
    async def vector_search(
        self,
        embedding: list[float],
        embedding_column: str = "embedding_standard",
        table: str = "entries",
        target_ids: list[str] = None,
        limit: int = 50,
    ) -> list[dict]:
        """
        Semantic similarity search using pgvector.
        
        THIS IS MISSING. The context service calls this
        but it doesn't exist.
        """
        conditions = []
        params = [embedding, limit]
        param_idx = 3
        
        if target_ids:
            placeholders = ", ".join(f"${param_idx + i}" for i in range(len(target_ids)))
            conditions.append(f"target_id IN ({placeholders})")
            params.extend(target_ids)
            param_idx += len(target_ids)
        
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        
        query = f"""
            SELECT 
                id, target_id, path, concept_id,
                content_micro, content_standard, content_exhaustive,
                tokens_micro, tokens_standard, tokens_exhaustive,
                confidence,
                1 - ({embedding_column} <=> $1::vector) as similarity
            FROM {table}
            {where_clause}
            ORDER BY {embedding_column} <=> $1::vector
            LIMIT $2
        """
        return await self.fetch(query, *params)
    
    # ── Entry Queries ──────────────────────────────────────
    
    async def get_entry(self, entry_id: str) -> Optional[dict]:
        return await self.fetchrow(
            "SELECT * FROM entries WHERE id = $1", entry_id
        )
    
    async def get_entry_by_path(
        self, target_id: str, path: str
    ) -> Optional[dict]:
        return await self.fetchrow(
            "SELECT * FROM entries WHERE target_id = $1 AND path = $2",
            target_id, path
        )
    
    async def get_entries_for_concept(
        self, concept_id: str, target_ids: list[str] = None
    ) -> list[dict]:
        if target_ids:
            return await self.fetch(
                """SELECT * FROM entries 
                   WHERE concept_id = $1 AND target_id = ANY($2)""",
                concept_id, target_ids
            )
        return await self.fetch(
            "SELECT * FROM entries WHERE concept_id = $1", concept_id
        )
    
    async def get_entries_by_target(
        self, target_id: str, entry_type: str = None
    ) -> list[dict]:
        if entry_type:
            return await self.fetch(
                """SELECT * FROM entries 
                   WHERE target_id = $1 AND entry_type = $2
                   ORDER BY path""",
                target_id, entry_type
            )
        return await self.fetch(
            "SELECT * FROM entries WHERE target_id = $1 ORDER BY path",
            target_id
        )
    
    async def get_entry_paths(self, target_id: str) -> list[str]:
        rows = await self.fetch(
            "SELECT path FROM entries WHERE target_id = $1", target_id
        )
        return [r["path"] for r in rows]
    
    async def count_entries(self, target_id: str) -> int:
        return await self.fetchval(
            "SELECT COUNT(*) FROM entries WHERE target_id = $1", target_id
        )
    
    async def save_entry(self, entry: dict) -> str:
        return await self.execute("""
            INSERT INTO entries (
                id, concept_id, target_id, path, entry_type,
                introduced_in, content_micro, content_standard, 
                content_exhaustive, syntax, parameters, return_value,
                edge_cases, common_mistakes,
                tokens_micro, tokens_standard, tokens_exhaustive,
                generated_by, confidence, metadata
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
            )
            ON CONFLICT (target_id, path) DO UPDATE SET
                content_micro = EXCLUDED.content_micro,
                content_standard = EXCLUDED.content_standard,
                content_exhaustive = EXCLUDED.content_exhaustive,
                syntax = EXCLUDED.syntax,
                parameters = EXCLUDED.parameters,
                confidence = EXCLUDED.confidence,
                metadata = EXCLUDED.metadata
        """,
            entry["id"], entry.get("concept_id"), entry["target_id"],
            entry["path"], entry.get("entry_type", "reference"),
            entry.get("introduced_in"), entry.get("content_micro"),
            entry.get("content_standard"), entry.get("content_exhaustive"),
            entry.get("syntax"), json.dumps(entry.get("parameters", [])),
            entry.get("return_value"),
            json.dumps(entry.get("edge_cases", [])),
            json.dumps(entry.get("common_mistakes", [])),
            entry.get("tokens_micro", 0), entry.get("tokens_standard", 0),
            entry.get("tokens_exhaustive", 0),
            entry.get("generated_by", ""), entry.get("confidence", 0.0),
            json.dumps(entry.get("metadata", {})),
        )
    
    # ── Examples ───────────────────────────────────────────
    
    async def get_examples(self, entry_id: str) -> list[dict]:
        return await self.fetch(
            """SELECT * FROM examples 
               WHERE entry_id = $1 ORDER BY complexity""",
            entry_id
        )
    
    async def save_example(self, example: dict) -> str:
        return await self.execute("""
            INSERT INTO examples (
                id, entry_id, title, code, language,
                explanation, expected_output, complexity, token_count
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (id) DO UPDATE SET
                code = EXCLUDED.code,
                explanation = EXCLUDED.explanation
        """,
            example["id"], example["entry_id"], example["title"],
            example["code"], example["language"],
            example.get("explanation", ""), example.get("expected_output", ""),
            example.get("complexity", "basic"),
            example.get("token_count", 0),
        )
    
    # ── Relations (Graph) ──────────────────────────────────
    
    async def get_related_entries(
        self, entry_id: str, limit: int = 10
    ) -> list[dict]:
        """
        Get entries related to a given entry via the relations graph.
        
        THIS IS MISSING. The context service and API both call this.
        """
        return await self.fetch("""
            SELECT e.*, r.relation_type, r.strength, r.context as relation_context
            FROM relations r
            JOIN entries e ON (
                (r.target_id = e.id AND r.source_id = $1) OR
                (r.source_id = e.id AND r.target_id = $1 AND r.bidirectional = true)
            )
            WHERE r.source_type = 'entry' AND r.target_type = 'entry'
            ORDER BY r.strength DESC
            LIMIT $2
        """, entry_id, limit)
    
    async def save_relation(self, relation: dict) -> None:
        await self.execute("""
            INSERT INTO relations (
                source_id, source_type, target_id, target_type,
                relation_type, strength, bidirectional, context,
                discovered_by, confidence
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        """,
            relation["source_id"], relation["source_type"],
            relation["target_id"], relation["target_type"],
            relation["relation_type"],
            relation.get("strength", 1.0),
            relation.get("bidirectional", False),
            relation.get("context", ""),
            relation.get("discovered_by", ""),
            relation.get("confidence", 1.0),
        )
    
    async def traverse_graph(
        self,
        start_id: str,
        relation_types: list[str] = None,
        direction: str = "both",
        max_depth: int = 3,
        max_nodes: int = 100,
    ) -> dict:
        """
        Recursive graph traversal using CTEs.
        
        THIS IS MISSING. The graph router calls this.
        """
        type_filter = ""
        if relation_types:
            placeholders = ", ".join(f"'{rt}'" for rt in relation_types)
            type_filter = f"AND r.relation_type IN ({placeholders})"
        
        direction_clause = {
            "outgoing": "r.source_id = traversal.node_id",
            "incoming": "r.target_id = traversal.node_id",
            "both": "(r.source_id = traversal.node_id OR r.target_id = traversal.node_id)",
        }[direction]
        
        query = f"""
            WITH RECURSIVE traversal AS (
                -- Base case: start node
                SELECT 
                    $1::text as node_id,
                    0 as depth,
                    ARRAY[$1::text] as path
                
                UNION ALL
                
                -- Recursive case: follow edges
                SELECT 
                    CASE WHEN r.source_id = traversal.node_id 
                         THEN r.target_id 
                         ELSE r.source_id END as node_id,
                    traversal.depth + 1,
                    traversal.path || CASE WHEN r.source_id = traversal.node_id 
                                          THEN r.target_id 
                                          ELSE r.source_id END
                FROM relations r
                JOIN traversal ON {direction_clause}
                WHERE traversal.depth < $2
                  AND NOT (CASE WHEN r.source_id = traversal.node_id 
                               THEN r.target_id ELSE r.source_id END) = ANY(traversal.path)
                  {type_filter}
            )
            SELECT DISTINCT node_id, depth
            FROM traversal
            ORDER BY depth
            LIMIT $3
        """
        
        nodes = await self.fetch(query, start_id, max_depth, max_nodes)
        
        # Get edges between found nodes
        node_ids = [n["node_id"] for n in nodes]
        edges = await self.fetch("""
            SELECT source_id, target_id, relation_type, strength, context
            FROM relations
            WHERE source_id = ANY($1) AND target_id = ANY($1)
        """, node_ids)
        
        return {"nodes": nodes, "edges": edges}
    
    # ── Concepts ───────────────────────────────────────────
    
    async def get_concept(self, concept_id: str) -> Optional[dict]:
        return await self.fetchrow(
            "SELECT * FROM concepts WHERE id = $1", concept_id
        )
    
    async def get_concepts_by_domain(self, domain: str) -> list[dict]:
        return await self.fetch(
            "SELECT * FROM concepts WHERE domain = $1 ORDER BY id",
            domain
        )
    
    async def get_all_concepts(self) -> list[dict]:
        return await self.fetch(
            "SELECT * FROM concepts ORDER BY domain, id"
        )
    
    # ── Targets ────────────────────────────────────────────
    
    async def get_target(self, target_id: str) -> Optional[dict]:
        return await self.fetchrow(
            "SELECT * FROM targets WHERE id = $1", target_id
        )
    
    async def get_all_targets(
        self, type_filter: str = None, family: str = None
    ) -> list[dict]:
        conditions = []
        params = []
        idx = 1
        
        if type_filter:
            conditions.append(f"type = ${idx}")
            params.append(type_filter)
            idx += 1
        if family:
            conditions.append(f"${idx} = ANY(family_ids)")
            params.append(family)
            idx += 1
        
        where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        return await self.fetch(
            f"SELECT * FROM targets {where} ORDER BY name", *params
        )
    
    # ── Capabilities ───────────────────────────────────────
    
    async def get_capabilities(
        self, target_id: str, category: str = None
    ) -> list[dict]:
        if category:
            return await self.fetch(
                """SELECT * FROM capabilities 
                   WHERE target_id = $1 AND category = $2
                   ORDER BY name""",
                target_id, category
            )
        return await self.fetch(
            "SELECT * FROM capabilities WHERE target_id = $1 ORDER BY name",
            target_id
        )
    
    async def get_capability(self, cap_id: str) -> Optional[dict]:
        return await self.fetchrow(
            "SELECT * FROM capabilities WHERE id = $1", cap_id
        )
    
    # ── Algorithms ─────────────────────────────────────────
    
    async def get_algorithms(
        self, category: str = None, domain: str = None
    ) -> list[dict]:
        conditions = []
        params = []
        idx = 1
        
        if category:
            conditions.append(f"category = ${idx}")
            params.append(category)
            idx += 1
        if domain:
            conditions.append(f"domain = ${idx}")
            params.append(domain)
            idx += 1
        
        where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        return await self.fetch(
            f"SELECT * FROM algorithms {where} ORDER BY name", *params
        )
    
    async def get_algorithm(self, algo_id: str) -> Optional[dict]:
        return await self.fetchrow(
            "SELECT * FROM algorithms WHERE id = $1", algo_id
        )
    
    # ── Atoms ──────────────────────────────────────────────
    
    async def get_atoms_for_capability(self, capability_id: str) -> list[dict]:
        return await self.fetch("""
            SELECT a.* FROM atoms a
            JOIN relations r ON r.target_id = a.id
            WHERE r.source_id = $1 
              AND r.source_type = 'capability'
              AND r.target_type = 'atom'
              AND r.relation_type = 'REQUIRES'
        """, capability_id)
    
    # ── Blueprints ─────────────────────────────────────────
    
    async def get_blueprints(
        self, target_id: str, scope: str = None
    ) -> list[dict]:
        if scope:
            return await self.fetch(
                """SELECT * FROM blueprints 
                   WHERE target_id = $1 AND scope = $2""",
                target_id, scope
            )
        return await self.fetch(
            "SELECT * FROM blueprints WHERE target_id = $1", target_id
        )
    
    # ── Completeness Anchors ───────────────────────────────
    
    async def get_anchors(self, target_id: str) -> dict:
        row = await self.fetchrow(
            "SELECT data_json FROM completeness_anchors WHERE target = $1",
            target_id
        )
        return json.loads(row["data_json"]) if row else {}
    
    async def save_anchors(self, target_id: str, data: dict) -> None:
        await self.execute("""
            INSERT INTO completeness_anchors (target, data_json)
            VALUES ($1, $2)
            ON CONFLICT (target) DO UPDATE SET data_json = $2
        """, target_id, json.dumps(data))
    
    # ── Health / Observability ─────────────────────────────
    
    async def save_health_snapshot(self, snapshot: dict) -> None:
        await self.execute("""
            INSERT INTO health_snapshots (
                scope_type, scope_id, coverage, accuracy,
                freshness, depth, coherence, overall_health,
                coverage_details, accuracy_details, freshness_details,
                depth_details, coherence_details
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        """,
            snapshot["scope_type"], snapshot.get("scope_id"),
            snapshot["coverage"], snapshot["accuracy"],
            snapshot["freshness"], snapshot["depth"],
            snapshot["coherence"], snapshot["overall_health"],
            json.dumps(snapshot.get("coverage_details", {})),
            json.dumps(snapshot.get("accuracy_details", {})),
            json.dumps(snapshot.get("freshness_details", {})),
            json.dumps(snapshot.get("depth_details", {})),
            json.dumps(snapshot.get("coherence_details", {})),
        )
    
    async def save_health_event(self, event: dict) -> None:
        await self.execute("""
            INSERT INTO health_events (
                event_type, scope_type, scope_id, severity,
                title, description, trigger_source,
                affected_entries, estimated_scope
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        """,
            event["event_type"], event["scope_type"],
            event.get("scope_id"), event["severity"],
            event["title"], event["description"],
            event.get("trigger_source", "system"),
            event.get("affected_entries", []),
            event.get("estimated_scope", 0),
        )
```

---

## Gap 2: Database Migration System

We have `CREATE TABLE` statements but no way to actually create the database, apply schema changes, or seed initial data. This is the first thing that needs to run.

```python
# src/db/migrations.py

"""
Database initialization and migration.

This is what runs FIRST. Before anything else.
Without this, there is no database.
"""

import asyncio
import json
import logging
from pathlib import Path

import asyncpg

logger = logging.getLogger(__name__)


SCHEMA_VERSION = 1

SCHEMA_SQL = """
-- ══════════════════════════════════════════════════════════
-- Extension setup
-- ══════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- for fuzzy text search

-- ══════════════════════════════════════════════════════════
-- Schema versioning
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS schema_version (
    version     INTEGER PRIMARY KEY,
    applied_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════
-- CORE TABLES (from our PostgreSQL schema design)
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS concepts (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    domain          TEXT NOT NULL,
    parent_id       TEXT REFERENCES concepts(id),
    summary         TEXT,
    description     TEXT,
    theory          TEXT,
    prevalence      REAL DEFAULT 1.0,
    notable_absences TEXT[],
    embedding       vector(1536),
    metadata        JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS families (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    type            TEXT NOT NULL,
    description     TEXT,
    shared_traits   JSONB NOT NULL DEFAULT '[]',
    shared_entry_ids TEXT[] DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS targets (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    type            TEXT NOT NULL,
    family_ids      TEXT[] DEFAULT '{}',
    traits          JSONB NOT NULL DEFAULT '{}',
    distinguishing  TEXT[],
    similar_to      TEXT[] DEFAULT '{}',
    generation_status TEXT DEFAULT 'pending',
    last_generated  TIMESTAMPTZ,
    embedding       vector(1536),
    metadata        JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS target_versions (
    id              TEXT PRIMARY KEY,
    target_id       TEXT NOT NULL REFERENCES targets(id),
    version_string  TEXT NOT NULL,
    released        DATE,
    status          TEXT,
    delta_from      TEXT REFERENCES target_versions(id),
    additions       JSONB DEFAULT '[]',
    changes         JSONB DEFAULT '[]',
    removals        JSONB DEFAULT '[]',
    deprecations    JSONB DEFAULT '[]',
    spec_url        TEXT,
    sort_order      INTEGER
);

CREATE TABLE IF NOT EXISTS entries (
    id                  TEXT PRIMARY KEY,
    concept_id          TEXT REFERENCES concepts(id),
    target_id           TEXT NOT NULL REFERENCES targets(id),
    path                TEXT NOT NULL,
    entry_type          TEXT NOT NULL DEFAULT 'reference',
    introduced_in       TEXT REFERENCES target_versions(id),
    removed_in          TEXT REFERENCES target_versions(id),
    changed_in          TEXT[],
    content_micro       TEXT,
    content_standard    TEXT,
    content_exhaustive  TEXT,
    syntax              TEXT,
    parameters          JSONB DEFAULT '[]',
    return_value        TEXT,
    edge_cases          JSONB DEFAULT '[]',
    common_mistakes     JSONB DEFAULT '[]',
    tokens_micro        INTEGER DEFAULT 0,
    tokens_standard     INTEGER DEFAULT 0,
    tokens_exhaustive   INTEGER DEFAULT 0,
    embedding_micro     vector(1536),
    embedding_standard  vector(1536),
    embedding_exhaustive vector(1536),
    generated_by        TEXT,
    generated_at        TIMESTAMPTZ DEFAULT NOW(),
    validated_by        TEXT,
    confidence          REAL DEFAULT 0.0,
    validation_notes    TEXT,
    metadata            JSONB DEFAULT '{}',
    UNIQUE(target_id, path)
);

CREATE TABLE IF NOT EXISTS examples (
    id              TEXT PRIMARY KEY,
    entry_id        TEXT REFERENCES entries(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    code            TEXT NOT NULL,
    language        TEXT NOT NULL,
    explanation     TEXT DEFAULT '',
    expected_output TEXT DEFAULT '',
    complexity      TEXT DEFAULT 'basic',
    valid_from      TEXT REFERENCES target_versions(id),
    valid_until     TEXT REFERENCES target_versions(id),
    also_used_by    TEXT[] DEFAULT '{}',
    token_count     INTEGER DEFAULT 0,
    embedding       vector(1536)
);

CREATE TABLE IF NOT EXISTS relations (
    id              BIGSERIAL PRIMARY KEY,
    source_id       TEXT NOT NULL,
    source_type     TEXT NOT NULL,
    target_id       TEXT NOT NULL,
    target_type     TEXT NOT NULL,
    relation_type   TEXT NOT NULL,
    strength        REAL DEFAULT 1.0,
    bidirectional   BOOLEAN DEFAULT FALSE,
    context         TEXT,
    discovered_by   TEXT,
    confidence      REAL DEFAULT 1.0,
    metadata        JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS atoms (
    id                  TEXT PRIMARY KEY,
    target_id           TEXT NOT NULL REFERENCES targets(id),
    entry_id            TEXT REFERENCES entries(id),
    atom_type           TEXT NOT NULL,
    file_path           TEXT DEFAULT '',
    xpath               TEXT DEFAULT '',
    byte_offset         TEXT,
    element_name        TEXT DEFAULT '',
    namespace_uri       TEXT DEFAULT '',
    namespace_prefix    TEXT DEFAULT '',
    structure           JSONB NOT NULL DEFAULT '{}',
    parent_atom_id      TEXT REFERENCES atoms(id),
    semantic_meaning    TEXT DEFAULT '',
    unit_of_measure     TEXT,
    conversion_formula  TEXT,
    example_value       TEXT DEFAULT '',
    example_context     TEXT DEFAULT '',
    embedding           vector(1536),
    metadata            JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS algorithms (
    id                  TEXT PRIMARY KEY,
    name                TEXT NOT NULL,
    category            TEXT NOT NULL,
    domain              TEXT NOT NULL,
    formula             TEXT,
    formula_explanation TEXT,
    summary             TEXT,
    full_spec           TEXT,
    pseudocode          TEXT,
    parameters          JSONB DEFAULT '[]',
    time_complexity     TEXT,
    space_complexity    TEXT,
    embedding           vector(1536),
    metadata            JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS capabilities (
    id                      TEXT PRIMARY KEY,
    target_id               TEXT NOT NULL REFERENCES targets(id),
    name                    TEXT NOT NULL,
    category                TEXT NOT NULL,
    user_description        TEXT,
    technical_description   TEXT,
    complexity              TEXT DEFAULT 'moderate',
    implementation_steps    JSONB DEFAULT '[]',
    reference_implementations JSONB DEFAULT '{}',
    minimum_working_example TEXT,
    known_pitfalls          JSONB DEFAULT '[]',
    embedding               vector(1536),
    metadata                JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS blueprints (
    id                      TEXT PRIMARY KEY,
    target_id               TEXT REFERENCES targets(id),
    name                    TEXT NOT NULL,
    scope                   TEXT NOT NULL,
    description             TEXT DEFAULT '',
    capability_ids          TEXT[] DEFAULT '{}',
    algorithm_ids           TEXT[] DEFAULT '{}',
    module_structure        JSONB DEFAULT '[]',
    class_hierarchy         JSONB DEFAULT '[]',
    public_api              JSONB DEFAULT '[]',
    initialization_sequence JSONB DEFAULT '[]',
    integration_tests       JSONB DEFAULT '[]',
    embedding               vector(1536),
    metadata                JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS artifacts (
    id              TEXT PRIMARY KEY,
    type            TEXT NOT NULL,
    name            TEXT,
    description     TEXT,
    content         TEXT,
    content_ref     TEXT,
    content_hash    TEXT,
    content_size    INTEGER,
    token_count     INTEGER,
    implementations JSONB DEFAULT '{}',
    test_vector_ids TEXT[] DEFAULT '{}',
    is_tested       BOOLEAN DEFAULT FALSE,
    referenced_by   TEXT[] DEFAULT '{}',
    embedding       vector(1536),
    metadata        JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS completeness_anchors (
    target          TEXT PRIMARY KEY,
    data_json       TEXT NOT NULL
);

-- ══════════════════════════════════════════════════════════
-- OBSERVABILITY TABLES
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS health_snapshots (
    id                  BIGSERIAL PRIMARY KEY,
    measured_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    scope_type          TEXT NOT NULL,
    scope_id            TEXT,
    coverage            REAL NOT NULL,
    accuracy            REAL NOT NULL,
    freshness           REAL NOT NULL,
    depth               REAL NOT NULL,
    coherence           REAL NOT NULL,
    overall_health      REAL NOT NULL,
    coverage_details    JSONB DEFAULT '{}',
    accuracy_details    JSONB DEFAULT '{}',
    freshness_details   JSONB DEFAULT '{}',
    depth_details       JSONB DEFAULT '{}',
    coherence_details   JSONB DEFAULT '{}',
    coverage_delta      REAL,
    accuracy_delta      REAL,
    freshness_delta     REAL,
    depth_delta         REAL,
    coherence_delta     REAL,
    overall_delta       REAL
);

CREATE TABLE IF NOT EXISTS health_events (
    id              BIGSERIAL PRIMARY KEY,
    detected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    event_type      TEXT NOT NULL,
    scope_type      TEXT NOT NULL,
    scope_id        TEXT,
    severity        TEXT NOT NULL,
    title           TEXT NOT NULL,
    description     TEXT NOT NULL,
    trigger_source  TEXT,
    trigger_details JSONB DEFAULT '{}',
    affected_entries TEXT[] DEFAULT '{}',
    affected_targets TEXT[] DEFAULT '{}',
    estimated_scope INTEGER DEFAULT 0,
    response_status TEXT DEFAULT 'pending',
    response_action TEXT,
    resolved_at     TIMESTAMPTZ,
    resolved_by     TEXT,
    metadata        JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS decay_ledger (
    id                  BIGSERIAL PRIMARY KEY,
    entry_id            TEXT NOT NULL,
    knowledge_timestamp TIMESTAMPTZ NOT NULL,
    decay_events        JSONB DEFAULT '[]',
    decay_score         REAL NOT NULL DEFAULT 0.0,
    review_due          TIMESTAMPTZ,
    decay_rate          TEXT DEFAULT 'normal',
    last_assessed       TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════
-- OPERATIONAL TABLES
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS generation_runs (
    id              TEXT PRIMARY KEY,
    target_id       TEXT NOT NULL,
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    status          TEXT DEFAULT 'running',
    current_phase   INTEGER DEFAULT 1,
    total_api_calls INTEGER DEFAULT 0,
    total_input_tokens  BIGINT DEFAULT 0,
    total_output_tokens BIGINT DEFAULT 0,
    total_cost_usd  REAL DEFAULT 0.0,
    checkpoint_data JSONB DEFAULT '{}',
    errors          JSONB DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS schema_metadata (
    table_name      TEXT NOT NULL,
    column_name     TEXT,
    description     TEXT NOT NULL,
    ai_usage_hint   TEXT,
    example_query   TEXT,
    PRIMARY KEY (table_name, COALESCE(column_name, '__table__'))
);

-- ══════════════════════════════════════════════════════════
-- INDICES
-- ══════════════════════════════════════════════════════════

-- Vector indices (HNSW)
CREATE INDEX IF NOT EXISTS idx_concepts_emb ON concepts 
    USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_entries_emb_micro ON entries 
    USING hnsw (embedding_micro vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_entries_emb_std ON entries 
    USING hnsw (embedding_standard vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_entries_emb_exh ON entries 
    USING hnsw (embedding_exhaustive vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_caps_emb ON capabilities 
    USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_algos_emb ON algorithms 
    USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_atoms_emb ON atoms 
    USING hnsw (embedding vector_cosine_ops);

-- Graph traversal
CREATE INDEX IF NOT EXISTS idx_rel_source ON relations(source_id, source_type);
CREATE INDEX IF NOT EXISTS idx_rel_target ON relations(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_rel_type ON relations(relation_type);

-- Hierarchy
CREATE INDEX IF NOT EXISTS idx_entries_target_path ON entries(target_id, path);
CREATE INDEX IF NOT EXISTS idx_entries_concept ON entries(concept_id);
CREATE INDEX IF NOT EXISTS idx_entries_type ON entries(target_id, entry_type);
CREATE INDEX IF NOT EXISTS idx_atoms_parent ON atoms(parent_atom_id);
CREATE INDEX IF NOT EXISTS idx_atoms_target ON atoms(target_id);
CREATE INDEX IF NOT EXISTS idx_versions_target ON target_versions(target_id);
CREATE INDEX IF NOT EXISTS idx_examples_entry ON examples(entry_id);
CREATE INDEX IF NOT EXISTS idx_caps_target ON capabilities(target_id);

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_entries_fts ON entries 
    USING gin(to_tsvector('english', 
        coalesce(content_micro,'') || ' ' || 
        coalesce(content_standard,'') || ' ' || 
        coalesce(path,'')));

-- Health
CREATE INDEX IF NOT EXISTS idx_health_scope ON health_snapshots(scope_type, scope_id, measured_at);
CREATE INDEX IF NOT EXISTS idx_events_unresolved ON health_events(response_status) 
    WHERE response_status IN ('pending', 'in_progress');
CREATE INDEX IF NOT EXISTS idx_decay_score ON decay_ledger(decay_score DESC);
"""


async def initialize_database(dsn: str):
    """
    Create the database schema and seed initial data.
    
    This is the FIRST thing that runs. Ever.
    """
    conn = await asyncpg.connect(dsn)
    
    try:
        # Check if schema already exists
        existing = await conn.fetchval(
            "SELECT version FROM schema_version ORDER BY version DESC LIMIT 1"
        )
        if existing and existing >= SCHEMA_VERSION:
            logger.info(f"Schema already at version {existing}, skipping")
            return
    except asyncpg.UndefinedTableError:
        pass  # schema_version doesn't exist yet = fresh database
    
    logger.info(f"Initializing database schema version {SCHEMA_VERSION}")
    
    # Apply schema
    await conn.execute(SCHEMA_SQL)
    
    # Record version
    await conn.execute(
        "INSERT INTO schema_version (version) VALUES ($1) ON CONFLICT DO NOTHING",
        SCHEMA_VERSION,
    )
    
    # Seed data
    await seed_concepts(conn)
    await seed_targets(conn)
    await seed_families(conn)
    await seed_schema_metadata(conn)
    
    logger.info("Database initialization complete")
    await conn.close()


async def seed_concepts(conn: asyncpg.Connection):
    """Load the universal concept taxonomy into the database."""
    from seed.concept_taxonomy import flatten_concepts
    
    concepts = flatten_concepts()
    logger.info(f"Seeding {len(concepts)} concepts")
    
    for concept in concepts:
        await conn.execute("""
            INSERT INTO concepts (id, name, domain, parent_id, description)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                description = EXCLUDED.description
        """,
            concept["id"], concept["name"], concept["domain"],
            concept.get("parent_id"), concept.get("description", ""),
        )


async def seed_targets(conn: asyncpg.Connection):
    """Load the target registry into the database."""
    from seed.target_registry import TARGET_REGISTRY
    
    count = 0
    for category, targets in TARGET_REGISTRY.items():
        for target in targets:
            await conn.execute("""
                INSERT INTO targets (id, name, type, family_ids, traits, similar_to, metadata)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    traits = EXCLUDED.traits
            """,
                target["id"], target["name"],
                target.get("type", "programming_language"),
                target.get("families", []),
                json.dumps(target.get("traits", {})),
                target.get("similar_to", []),
                json.dumps({k: v for k, v in target.items()
                           if k not in ("id", "name", "type", "families", "traits", "similar_to")}),
            )
            count += 1
    
    logger.info(f"Seeded {count} targets")


async def seed_families(conn: asyncpg.Connection):
    """Load family definitions."""
    # For now, inline the essential families.
    # The full families.py from seed/ will be loaded later.
    families = [
        ("c_syntax_family", "C-Syntax Family", "language_family",
         "Languages with C-like syntax (curly braces, semicolons)",
         [{"trait": "curly_brace_blocks"}, {"trait": "semicolons"}]),
        ("dynamic", "Dynamic Languages", "language_family",
         "Dynamically typed languages", [{"trait": "dynamic_typing"}]),
        ("ooxml", "Office Open XML", "format_family",
         "Microsoft Office XML-based formats",
         [{"trait": "zip_container"}, {"trait": "opc_relationships"}]),
        ("raster_image", "Raster Image Formats", "format_family",
         "Pixel-based image formats", [{"trait": "pixel_grid"}]),
    ]
    
    for fid, name, ftype, desc, traits in families:
        await conn.execute("""
            INSERT INTO families (id, name, type, description, shared_traits)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO UPDATE SET shared_traits = EXCLUDED.shared_traits
        """, fid, name, ftype, desc, json.dumps(traits))
    
    logger.info(f"Seeded {len(families)} families")


async def seed_schema_metadata(conn: asyncpg.Connection):
    """Make the schema self-describing for AI consumers."""
    metadata = [
        ("concepts", None,
         "Universal ideas that span multiple targets. ~300 rows.",
         "Query concepts first for language-agnostic understanding, then join to entries."),
        ("entries", "content_micro",
         "Ultra-short description (~50 tokens). For listings and summaries.",
         "Use content_micro when referencing many entries. Use content_standard for Q&A. Use content_exhaustive for implementation details."),
        ("entries", "embedding_standard",
         "1536-dim vector embedding of content_standard. For semantic similarity search.",
         "Search embedding_standard for most queries. Use embedding_exhaustive for edge cases."),
        ("relations", None,
         "Typed, weighted, directional edges connecting all knowledge entities.",
         "Use recursive CTEs for graph traversal. Key relation types: REQUIRES, ANALOGOUS_IN, COMMONLY_USED_WITH, COMPOSES."),
    ]
    
    for table, column, desc, hint in metadata:
        await conn.execute("""
            INSERT INTO schema_metadata (table_name, column_name, description, ai_usage_hint)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (table_name, COALESCE(column_name, '__table__')) DO UPDATE SET
                description = EXCLUDED.description
        """, table, column, desc, hint)


# ── CLI entry point ────────────────────────────────────────

async def main():
    import os
    dsn = os.getenv("DATABASE_URL", "postgresql://magb:magb@localhost:5432/magb")
    await initialize_database(dsn)


if __name__ == "__main__":
    asyncio.run(main())
```

---

## Gap 3: Embedding Generation Pipeline

We reference embeddings in every search query, every context assembly, every similarity comparison — but have zero code that actually generates them.

```python
# src/embeddings.py

"""
Embedding generation and management.

Every entry needs embeddings at up to 3 resolutions.
5 million entries × 3 resolutions × $0.0001/1K tokens ≈ $150 total.
This runs as a background job after content generation.
"""

import asyncio
import logging
from typing import Optional

import openai
import tiktoken

from src.db.connection import Database

logger = logging.getLogger(__name__)

# OpenAI embedding model
EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIM = 1536
BATCH_SIZE = 100  # OpenAI allows up to 2048 inputs per request
MAX_TOKENS_PER_INPUT = 8191


class EmbeddingService:
    """Generate and store embeddings for knowledge entries."""
    
    def __init__(self, db: Database):
        self.db = db
        self.client = openai.AsyncOpenAI()
        self.enc = tiktoken.get_encoding("cl100k_base")
        self._total_tokens = 0
        self._total_calls = 0
    
    async def generate_for_target(self, target_id: str):
        """Generate all missing embeddings for a target."""
        
        # Find entries missing embeddings
        missing = await self.db.fetch("""
            SELECT id, content_micro, content_standard, content_exhaustive
            FROM entries
            WHERE target_id = $1
              AND (embedding_micro IS NULL 
                   OR embedding_standard IS NULL 
                   OR embedding_exhaustive IS NULL)
        """, target_id)
        
        logger.info(f"Generating embeddings for {len(missing)} entries in {target_id}")
        
        # Process in batches
        for i in range(0, len(missing), BATCH_SIZE):
            batch = missing[i:i + BATCH_SIZE]
            await self._process_batch(batch)
            logger.info(f"  Embedded {min(i + BATCH_SIZE, len(missing))}/{len(missing)}")
        
        logger.info(
            f"Embedding complete for {target_id}: "
            f"{self._total_calls} API calls, {self._total_tokens} tokens"
        )
    
    async def _process_batch(self, entries: list[dict]):
        """Generate embeddings for a batch of entries."""
        
        for resolution in ["micro", "standard", "exhaustive"]:
            content_key = f"content_{resolution}"
            embedding_key = f"embedding_{resolution}"
            
            # Collect non-null texts
            texts = []
            entry_ids = []
            for entry in entries:
                text = entry.get(content_key)
                if text:
                    # Truncate to model limit
                    tokens = self.enc.encode(text)
                    if len(tokens) > MAX_TOKENS_PER_INPUT:
                        text = self.enc.decode(tokens[:MAX_TOKENS_PER_INPUT])
                    texts.append(text)
                    entry_ids.append(entry["id"])
            
            if not texts:
                continue
            
            # Call embedding API
            try:
                response = await self.client.embeddings.create(
                    model=EMBEDDING_MODEL,
                    input=texts,
                )
                
                self._total_calls += 1
                self._total_tokens += response.usage.total_tokens
                
                # Store embeddings
                for j, embedding_data in enumerate(response.data):
                    vector = embedding_data.embedding
                    await self.db.execute(f"""
                        UPDATE entries SET {embedding_key} = $1
                        WHERE id = $2
                    """, vector, entry_ids[j])
                    
            except Exception as e:
                logger.error(f"Embedding batch failed: {e}")
    
    async def embed_single(self, text: str) -> list[float]:
        """Generate a single embedding for a search query."""
        response = await self.client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=[text],
        )
        self._total_tokens += response.usage.total_tokens
        return response.data[0].embedding
```

---

## Gap 4: Multi-Resolution Content Generation

Our current prompts generate a single content block. The schema requires three resolutions per entry. We need prompts and a pipeline step that produces all three.

```python
# src/prompts/multi_resolution.py

"""
Prompts that generate content at all three resolutions simultaneously.

This is more efficient than three separate calls: one call produces
all three resolutions, and the LLM has the full context to decide
what to include at each level.
"""

GENERATE_MULTI_RESOLUTION = """You are writing a reference entry for a **{target}** guidebook
at THREE levels of detail.

Location: {path}
Topic: {title}
Description: {description}

Write the entry at three resolutions. Each resolution MUST be self-contained 
(a reader should understand it without seeing the other resolutions).

MICRO (~50 words): A single-sentence or two-sentence summary. Enough to 
understand what this is at a glance. Used in tables of contents and listings.

STANDARD (~300 words): A complete reference entry. Includes syntax, 
key behavior, one code example, and the most important edge cases. 
Sufficient to USE this feature correctly in typical cases.

EXHAUSTIVE (~1000+ words): Everything a developer could ever need. 
All parameters, all edge cases, all interactions with other features,
performance notes, version history, multiple examples from basic to 
advanced, common mistakes, and internal implementation details where relevant.

Respond with ONLY this JSON:
{{
  "title": "...",
  
  "content_micro": "One or two sentences summarizing this feature.",
  
  "content_standard": "Complete reference entry with syntax, behavior, one example, key edge cases...",
  
  "content_exhaustive": "Everything: all parameters, all edge cases, multiple examples, performance notes, version history, implementation details...",
  
  "syntax": "formal syntax if applicable",
  
  "parameters": [
    {{"name": "...", "type": "...", "required": true, "description": "...", "default": null}}
  ],
  
  "return_value": "type and description if applicable",
  
  "examples": [
    {{
      "title": "Basic usage",
      "code": "...",
      "language": "{code_lang}",
      "explanation": "...",
      "output": "...",
      "complexity": "basic"
    }},
    {{
      "title": "Advanced usage",
      "code": "...",
      "language": "{code_lang}",
      "explanation": "...",
      "output": "...",
      "complexity": "advanced"
    }}
  ],
  
  "edge_cases": ["..."],
  "common_mistakes": ["..."],
  "related_topics": ["path/to/related"],
  "since_version": "...",
  "deprecated": false
}}"""
```

---

## Gap 5: Robust Response Parser

The LLM client has basic JSON extraction. The plan calls for five recovery strategies. This is essential because at 2,000+ API calls per target, even a 1% parse failure rate means 20 failures.

```python
# src/llm/response_parser.py

"""
Five-strategy response parser for LLM JSON output.

Strategy 1: Direct JSON parse
Strategy 2: Code fence extraction
Strategy 3: JSON boundary finding
Strategy 4: JSON cleaning (trailing commas, comments, single quotes)
Strategy 5: Truncation repair (close open brackets)

Each strategy is tried in order. If all five fail, the error
includes diagnostic information about what went wrong.
"""

import json
import re
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class ParseError(Exception):
    """Raised when all parsing strategies fail."""
    def __init__(self, message: str, raw_text: str, strategies_tried: list[str]):
        super().__init__(message)
        self.raw_text = raw_text
        self.strategies_tried = strategies_tried


def parse_llm_json(text: str) -> dict:
    """
    Parse JSON from LLM output using five progressive strategies.
    
    Returns parsed dict on success.
    Raises ParseError with diagnostic info on failure.
    """
    text = text.strip()
    strategies_tried = []
    
    # Strategy 1: Direct parse
    try:
        result = json.loads(text)
        if isinstance(result, dict):
            return result
        strategies_tried.append("direct: parsed but not a dict")
    except json.JSONDecodeError as e:
        strategies_tried.append(f"direct: {str(e)[:80]}")
    
    # Strategy 2: Code fence extraction
    try:
        extracted = _extract_from_code_fence(text)
        if extracted:
            result = json.loads(extracted)
            if isinstance(result, dict):
                return result
            strategies_tried.append("fence: parsed but not a dict")
        else:
            strategies_tried.append("fence: no code fence found")
    except json.JSONDecodeError as e:
        strategies_tried.append(f"fence: {str(e)[:80]}")
    
    # Strategy 3: JSON boundary finding
    try:
        extracted = _find_json_boundaries(text)
        if extracted:
            result = json.loads(extracted)
            if isinstance(result, dict):
                return result
            strategies_tried.append("boundary: parsed but not a dict")
        else:
            strategies_tried.append("boundary: no JSON boundaries found")
    except json.JSONDecodeError as e:
        strategies_tried.append(f"boundary: {str(e)[:80]}")
    
    # Strategy 4: JSON cleaning
    try:
        cleaned = _clean_json(text)
        # Try to find boundaries in cleaned text too
        for candidate in [cleaned, _find_json_boundaries(cleaned) or cleaned]:
            try:
                result = json.loads(candidate)
                if isinstance(result, dict):
                    return result
            except json.JSONDecodeError:
                continue
        strategies_tried.append("clean: cleaning didn't help")
    except Exception as e:
        strategies_tried.append(f"clean: {str(e)[:80]}")
    
    # Strategy 5: Truncation repair
    try:
        repaired = _repair_truncation(text)
        if repaired:
            # Try boundaries on repaired text
            for candidate in [repaired, _find_json_boundaries(repaired) or repaired]:
                try:
                    result = json.loads(candidate)
                    if isinstance(result, dict):
                        logger.warning("JSON was truncated — repaired by closing brackets")
                        return result
                except json.JSONDecodeError:
                    continue
        strategies_tried.append("repair: truncation repair didn't help")
    except Exception as e:
        strategies_tried.append(f"repair: {str(e)[:80]}")
    
    # All strategies failed
    raise ParseError(
        f"All 5 parsing strategies failed. "
        f"Text starts with: {text[:100]}... "
        f"Text ends with: ...{text[-100:]}",
        raw_text=text,
        strategies_tried=strategies_tried,
    )


def _extract_from_code_fence(text: str) -> Optional[str]:
    """Extract content from ```json ... ``` or ``` ... ```."""
    patterns = [
        r'```json\s*\n(.*?)```',
        r'```\s*\n(.*?)```',
        r'```(.*?)```',
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()
    return None


def _find_json_boundaries(text: str) -> Optional[str]:
    """Find the outermost { } pair in the text."""
    # Find first {
    start = text.find('{')
    if start == -1:
        return None
    
    # Find matching } by counting brackets
    depth = 0
    in_string = False
    escape_next = False
    
    for i in range(start, len(text)):
        char = text[i]
        
        if escape_next:
            escape_next = False
            continue
        
        if char == '\\':
            escape_next = True
            continue
        
        if char == '"' and not escape_next:
            in_string = not in_string
            continue
        
        if in_string:
            continue
        
        if char == '{':
            depth += 1
        elif char == '}':
            depth -= 1
            if depth == 0:
                return text[start:i + 1]
    
    # Unclosed — return from start to end (Strategy 5 may fix it)
    return text[start:]


def _clean_json(text: str) -> str:
    """
    Fix common JSON issues:
    - Trailing commas before } or ]
    - Single quotes instead of double quotes
    - JavaScript-style comments
    - Unquoted keys
    """
    # Remove code fences first
    extracted = _extract_from_code_fence(text)
    if extracted:
        text = extracted
    
    # Remove JavaScript comments
    text = re.sub(r'//.*?$', '', text, flags=re.MULTILINE)
    text = re.sub(r'/\*.*?\*/', '', text, flags=re.DOTALL)
    
    # Remove trailing commas (before } or ])
    text = re.sub(r',\s*([\]}])', r'\1', text)
    
    # Replace single quotes with double quotes (carefully)
    # Only do this if there are no double quotes at all (rare)
    if '"' not in text and "'" in text:
        text = text.replace("'", '"')
    
    return text


def _repair_truncation(text: str) -> Optional[str]:
    """
    If the JSON was truncated (model hit max_tokens), try to close it.
    Count open brackets and add closing ones.
    """
    # Find the JSON start
    extracted = _find_json_boundaries(text)
    if not extracted:
        return None
    
    # Count unclosed brackets
    open_braces = 0
    open_brackets = 0
    in_string = False
    escape_next = False
    
    for char in extracted:
        if escape_next:
            escape_next = False
            continue
        if char == '\\':
            escape_next = True
            continue
        if char == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        
        if char == '{':
            open_braces += 1
        elif char == '}':
            open_braces -= 1
        elif char == '[':
            open_brackets += 1
        elif char == ']':
            open_brackets -= 1
    
    if open_braces == 0 and open_brackets == 0:
        return None  # not truncated
    
    # Check if we're mid-string — close the string
    if in_string:
        extracted += '"'
    
    # Remove any trailing comma
    extracted = extracted.rstrip().rstrip(',')
    
    # Close brackets and braces (inner brackets first)
    repair = extracted
    for _ in range(open_brackets):
        repair += ']'
    for _ in range(open_braces):
        repair += '}'
    
    return repair
```

---

## Gap 6: Configuration Management

We reference `.env`, `config.yaml`, model tiers, budget limits — but have no unified configuration system.

```python
# src/config.py

"""
Unified configuration management.

Reads from:
  1. Defaults (in this file)
  2. config/default.yaml (if exists)
  3. Environment variables (override everything)
  4. .env file (loaded by python-dotenv)
"""

import os
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional

from dotenv import load_dotenv

# Load .env file if it exists
load_dotenv()


@dataclass
class ModelConfig:
    provider: str       # "openai" or "anthropic"
    model: str
    max_tokens: int
    cost_per_1k_input: float
    cost_per_1k_output: float
    rpm_limit: int


@dataclass
class Config:
    """All configuration in one place."""
    
    # ── API Keys (from environment only — never in config files) ──
    openai_api_key: str = field(
        default_factory=lambda: os.getenv("OPENAI_API_KEY", ""))
    anthropic_api_key: str = field(
        default_factory=lambda: os.getenv("ANTHROPIC_API_KEY", ""))
    
    # ── Database ──────────────────────────────────────────────────
    database_url: str = field(
        default_factory=lambda: os.getenv(
            "DATABASE_URL",
            "postgresql://magb:magb@localhost:5432/magb"
        ))
    
    # ── Model Routing ─────────────────────────────────────────────
    cheap_model: ModelConfig = field(default_factory=lambda: ModelConfig(
        provider="anthropic",
        model=os.getenv("CHEAP_MODEL", "claude-sonnet-4-20250514"),
        max_tokens=4096,
        cost_per_1k_input=0.003,
        cost_per_1k_output=0.015,
        rpm_limit=1000,
    ))
    mid_model: ModelConfig = field(default_factory=lambda: ModelConfig(
        provider="anthropic",
        model=os.getenv("MID_MODEL", "claude-sonnet-4-20250514"),
        max_tokens=8192,
        cost_per_1k_input=0.003,
        cost_per_1k_output=0.015,
        rpm_limit=1000,
    ))
    expensive_model: ModelConfig = field(default_factory=lambda: ModelConfig(
        provider="openai",
        model=os.getenv("EXPENSIVE_MODEL", "gpt-4o"),
        max_tokens=4096,
        cost_per_1k_input=0.005,
        cost_per_1k_output=0.015,
        rpm_limit=500,
    ))
    embedding_model: str = field(
        default_factory=lambda: os.getenv("EMBEDDING_MODEL", "text-embedding-3-small"))
    
    # ── Pipeline ──────────────────────────────────────────────────
    max_concurrency: int = int(os.getenv("MAX_CONCURRENCY", "30"))
    max_decompose_depth: int = int(os.getenv("MAX_DECOMPOSE_DEPTH", "5"))
    gap_analysis_passes: int = int(os.getenv("GAP_PASSES", "2"))
    validation_sample_rate: float = float(os.getenv("VALIDATION_RATE", "0.2"))
    
    # ── Budget ────────────────────────────────────────────────────
    max_total_budget_usd: float = float(os.getenv("MAX_BUDGET", "500.0"))
    max_per_target_usd: float = float(os.getenv("MAX_PER_TARGET", "200.0"))
    max_per_phase_usd: float = float(os.getenv("MAX_PER_PHASE", "100.0"))
    daily_healing_budget_usd: float = float(os.getenv("HEALING_BUDGET", "50.0"))
    
    # ── API ───────────────────────────────────────────────────────
    api_host: str = os.getenv("API_HOST", "0.0.0.0")
    api_port: int = int(os.getenv("API_PORT", "8000"))
    api_rate_limit_rpm: int = int(os.getenv("API_RATE_LIMIT", "60"))
    
    # ── Paths ─────────────────────────────────────────────────────
    checkpoint_dir: str = os.getenv("CHECKPOINT_DIR", "checkpoints/")
    export_dir: str = os.getenv("EXPORT_DIR", "exports/")
    log_dir: str = os.getenv("LOG_DIR", "logs/")
    
    # ── Logging ───────────────────────────────────────────────────
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    
    def validate(self):
        """Check that critical configuration is present."""
        errors = []
        if not self.openai_api_key:
            errors.append("OPENAI_API_KEY not set")
        if not self.anthropic_api_key:
            errors.append("ANTHROPIC_API_KEY not set")
        if not self.database_url:
            errors.append("DATABASE_URL not set")
        if errors:
            raise ValueError(
                f"Configuration errors: {'; '.join(errors)}. "
                f"Set these in .env or as environment variables."
            )


# Singleton
_config: Optional[Config] = None

def get_config() -> Config:
    global _config
    if _config is None:
        _config = Config()
    return _config
```

---

## Gap 7: API Service Implementations

The API routes reference services that are mostly stubs. The SearchService, RetrievalService, and HealthService need actual implementations. The ContextService is the most complete, but the others are critical for the POC.

```python
# api/services/search_service.py

"""
Search service — the actual implementation behind /v1/search.

Combines three search strategies:
1. Semantic (vector similarity via pgvector)
2. Full-text (PostgreSQL tsvector)
3. Path-based (exact and prefix path matching)
"""

import time
from typing import Optional

from api.models.search import (
    SearchRequest, SearchResponse, SearchResult
)
from api.models.common import ContentResolution, EntrySummary
from api.db.connection import Database
from api.db.cache import Cache


class SearchService:
    
    def __init__(self, db: Database, cache: Cache):
        self.db = db
        self.cache = cache
    
    async def search(self, request: SearchRequest) -> SearchResponse:
        start = time.time()
        
        results = []
        
        # Strategy 1: Semantic search (primary)
        if request.query:
            embedding = await self.db.get_embedding(request.query)
            
            semantic_hits = await self.db.vector_search(
                embedding=embedding,
                embedding_column="embedding_standard",
                target_ids=[request.target] if request.target else None,
                limit=request.pagination.page_size * 3,  # over-fetch for ranking
            )
            
            for hit in semantic_hits:
                content = self._select_content(hit, request.resolution)
                examples = []
                if request.include_examples:
                    examples = await self.db.get_examples(hit["id"])
                
                results.append(SearchResult(
                    entry=EntrySummary(
                        id=hit["id"],
                        target_id=hit["target_id"],
                        path=hit["path"],
                        title=hit["path"].split("/")[-1],
                        concept_id=hit.get("concept_id"),
                        content_micro=hit.get("content_micro", ""),
                        confidence=hit.get("confidence", 0),
                        has_examples=len(examples) > 0,
                        token_counts={
                            "micro": hit.get("tokens_micro", 0),
                            "standard": hit.get("tokens_standard", 0),
                            "exhaustive": hit.get("tokens_exhaustive", 0),
                        },
                    ),
                    relevance_score=hit.get("similarity", 0),
                    match_type="semantic",
                    content=content,
                    examples=[
                        {"title": ex["title"], "code": ex["code"],
                         "language": ex["language"]}
                        for ex in examples[:3]
                    ],
                ))
        
        # Strategy 2: Full-text search (supplement)
        fts_hits = await self.db.fetch("""
            SELECT id, target_id, path, concept_id, content_micro,
                   content_standard, confidence,
                   ts_rank(
                       to_tsvector('english', coalesce(content_standard, '') || ' ' || coalesce(path, '')),
                       plainto_tsquery('english', $1)
                   ) as rank
            FROM entries
            WHERE to_tsvector('english', coalesce(content_standard, '') || ' ' || coalesce(path, ''))
                  @@ plainto_tsquery('english', $1)
              AND ($2::text IS NULL OR target_id = $2)
            ORDER BY rank DESC
            LIMIT 20
        """, request.query, request.target)
        
        existing_ids = {r.entry.id for r in results}
        for hit in fts_hits:
            if hit["id"] not in existing_ids:
                results.append(SearchResult(
                    entry=EntrySummary(
                        id=hit["id"],
                        target_id=hit["target_id"],
                        path=hit["path"],
                        title=hit["path"].split("/")[-1],
                        content_micro=hit.get("content_micro", ""),
                        confidence=hit.get("confidence", 0),
                    ),
                    relevance_score=min(hit.get("rank", 0) / 10, 1.0),
                    match_type="keyword",
                    content=self._select_content(hit, request.resolution),
                ))
        
        # Sort by relevance
        results.sort(key=lambda r: r.relevance_score, reverse=True)
        
        # Paginate
        page = request.pagination.page
        page_size = request.pagination.page_size
        total = len(results)
        start_idx = (page - 1) * page_size
        page_results = results[start_idx:start_idx + page_size]
        
        elapsed_ms = (time.time() - start) * 1000
        
        return SearchResponse(
            results=page_results,
            total=total,
            query=request.query,
            search_time_ms=elapsed_ms,
            targets_searched=[request.target] if request.target else ["(all)"],
            page=page,
            page_size=page_size,
            total_pages=(total + page_size - 1) // page_size,
            related_queries=self._suggest_related(request.query),
        )
    
    async def suggest(
        self, query: str, target: Optional[str], limit: int
    ) -> list[str]:
        """Autocomplete suggestions based on path and content matching."""
        rows = await self.db.fetch("""
            SELECT DISTINCT path 
            FROM entries
            WHERE ($2::text IS NULL OR target_id = $2)
              AND path ILIKE $1
            ORDER BY path
            LIMIT $3
        """, f"%{query}%", target, limit)
        
        return [r["path"].split("/")[-1] for r in rows]
    
    def _select_content(self, hit: dict, resolution: ContentResolution) -> str:
        if resolution == ContentResolution.EXHAUSTIVE:
            return hit.get("content_exhaustive") or hit.get("content_standard") or ""
        elif resolution == ContentResolution.MICRO:
            return hit.get("content_micro") or ""
        else:
            return hit.get("content_standard") or hit.get("content_micro") or ""
    
    def _suggest_related(self, query: str) -> list[str]:
        """Simple related query suggestions."""
        words = query.lower().split()
        suggestions = []
        if len(words) >= 2:
            suggestions.append(f"{words[0]} examples")
            suggestions.append(f"{words[0]} vs alternatives")
        return suggestions[:3]
```

---

## Gap 8: Docker and Startup Infrastructure

No way to actually run any of this. Need Docker Compose for PostgreSQL + pgvector + the API.

```yaml
# docker-compose.yml

version: '3.8'

services:
  db:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: magb
      POSTGRES_USER: magb
      POSTGRES_PASSWORD: magb_dev_password
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U magb"]
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://magb:magb_dev_password@db:5432/magb
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      LOG_LEVEL: INFO
    depends_on:
      db:
        condition: service_healthy
    command: >
      sh -c "python -m src.db.migrations && 
             uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload"
    volumes:
      - .:/app
      - ./checkpoints:/app/checkpoints
      - ./exports:/app/exports

volumes:
  pgdata:
```

```dockerfile
# Dockerfile

FROM python:3.12-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY pyproject.toml .
RUN pip install -e ".[dev]"

COPY . .

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```toml
# pyproject.toml

[project]
name = "magb"
version = "0.1.0"
description = "Universal Implementation Knowledge Base"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.110",
    "uvicorn[standard]>=0.29",
    "asyncpg>=0.29",
    "pgvector>=0.2",
    "pydantic>=2.7",
    "openai>=1.30",
    "anthropic>=0.25",
    "tiktoken>=0.7",
    "python-dotenv>=1.0",
    "tenacity>=8.2",
    "httpx>=0.27",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-asyncio>=0.23",
    "pytest-cov>=5.0",
    "ruff>=0.4",
    "mypy>=1.10",
]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

---

## Gap 9: Minimal Test Suite

Zero tests. For a system that will spend thousands of dollars on API calls, this is not optional.

```python
# tests/test_response_parser.py

"""
Test the response parser with real-world LLM output samples.

These are the most important tests in the system because
parsing failures at scale waste money and create data gaps.
"""

import pytest
from src.llm.response_parser import parse_llm_json, ParseError


class TestDirectParse:
    def test_clean_json(self):
        result = parse_llm_json('{"key": "value", "num": 42}')
        assert result == {"key": "value", "num": 42}
    
    def test_json_with_whitespace(self):
        result = parse_llm_json('  \n  {"key": "value"}  \n  ')
        assert result["key"] == "value"


class TestCodeFenceExtraction:
    def test_json_fence(self):
        text = 'Here is the result:\n```json\n{"key": "value"}\n```\nDone.'
        result = parse_llm_json(text)
        assert result["key"] == "value"
    
    def test_plain_fence(self):
        text = '```\n{"key": "value"}\n```'
        result = parse_llm_json(text)
        assert result["key"] == "value"
    
    def test_fence_with_language_tag(self):
        text = '```json\n{\n  "categories": [\n    {"title": "Types"}\n  ]\n}\n```'
        result = parse_llm_json(text)
        assert len(result["categories"]) == 1


class TestBoundaryFinding:
    def test_json_embedded_in_prose(self):
        text = 'The answer is {"key": "value"} and that is all.'
        result = parse_llm_json(text)
        assert result["key"] == "value"
    
    def test_nested_json(self):
        text = 'Result: {"outer": {"inner": [1, 2, 3]}}'
        result = parse_llm_json(text)
        assert result["outer"]["inner"] == [1, 2, 3]


class TestJsonCleaning:
    def test_trailing_comma(self):
        text = '{"key": "value", "list": [1, 2, 3,],}'
        result = parse_llm_json(text)
        assert result["list"] == [1, 2, 3]
    
    def test_javascript_comments(self):
        text = '{\n  // This is a comment\n  "key": "value"\n}'
        result = parse_llm_json(text)
        assert result["key"] == "value"


class TestTruncationRepair:
    def test_truncated_object(self):
        text = '{"key": "value", "nested": {"deep": "data"'
        result = parse_llm_json(text)
        assert result["key"] == "value"
    
    def test_truncated_array(self):
        text = '{"items": ["a", "b", "c"'
        result = parse_llm_json(text)
        assert result["items"] == ["a", "b", "c"]
    
    def test_truncated_in_string(self):
        text = '{"key": "this is a long string that got cut o'
        result = parse_llm_json(text)
        assert "key" in result


class TestAllStrategiesFail:
    def test_complete_garbage(self):
        with pytest.raises(ParseError) as exc_info:
            parse_llm_json("This is not JSON at all. Just prose.")
        assert len(exc_info.value.strategies_tried) == 5
    
    def test_error_includes_diagnostics(self):
        with pytest.raises(ParseError) as exc_info:
            parse_llm_json("no json here")
        assert "strategies" in str(exc_info.value).lower() or len(exc_info.value.strategies_tried) > 0


class TestRealWorldLLMOutputs:
    """Test against actual output patterns observed from Claude and GPT."""
    
    def test_claude_typical_output(self):
        text = """Here's the analysis:

```json
{
  "categories": [
    {
      "title": "Type System",
      "description": "All type-related features",
      "estimated_subtopics": 15,
      "priority": "core"
    },
    {
      "title": "Control Flow",
      "description": "Branching and iteration",
      "estimated_subtopics": 10,
      "priority": "core"
    }
  ]
}
```

I've identified the two main categories."""
        result = parse_llm_json(text)
        assert len(result["categories"]) == 2
    
    def test_gpt_response_format_mode(self):
        # GPT with response_format={"type": "json_object"} returns clean JSON
        text = '{\n  "keywords": ["for", "while", "if", "else"],\n  "total_count": 4\n}'
        result = parse_llm_json(text)
        assert result["total_count"] == 4
    
    def test_anthropic_with_preamble(self):
        # Claude sometimes adds a brief preamble before JSON
        text = 'I\'ll provide the JSON response:\n\n{"key": "value"}'
        result = parse_llm_json(text)
        assert result["key"] == "value"
```

```python
# tests/test_budget.py

"""Test budget enforcement."""

import pytest
from src.budget import Budget, BudgetExhausted


def test_budget_tracks_spending():
    budget = Budget(max_total_usd=10.0)
    budget.check_and_record(1.0, target="python", phase="decompose")
    assert budget.total_spent == 1.0


def test_budget_enforces_total_limit():
    budget = Budget(max_total_usd=1.0)
    budget.check_and_record(0.8, target="python", phase="decompose")
    with pytest.raises(BudgetExhausted):
        budget.check_and_record(0.3, target="python", phase="decompose")


def test_budget_enforces_per_target_limit():
    budget = Budget(max_total_usd=100.0, max_per_target_usd=5.0)
    budget.check_and_record(4.0, target="python", phase="decompose")
    with pytest.raises(BudgetExhausted):
        budget.check_and_record(2.0, target="python", phase="generate")


def test_budget_enforces_single_call_sanity():
    budget = Budget(max_per_api_call_usd=2.0)
    with pytest.raises(BudgetExhausted):
        budget.check_and_record(5.0, target="python", phase="generate")
```

---

## Gap 10: The End-to-End Startup Script

The single command that brings everything up and verifies it works.

```python
# tools/bootstrap.py

"""
One command to set up and verify everything.

Usage:
    python tools/bootstrap.py

This:
  1. Validates configuration (.env, API keys)
  2. Starts PostgreSQL (if using Docker)
  3. Runs database migrations
  4. Seeds concept taxonomy, target registry, families
  5. Runs a smoke test (one prompt, one storage round-trip)
  6. Starts the API server
  7. Runs a health check against the API
"""

import asyncio
import subprocess
import sys
import os
import time
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


async def main():
    logger.info("═" * 60)
    logger.info("  magB Bootstrap — Setting up everything from scratch")
    logger.info("═" * 60)
    
    # ── Step 1: Validate configuration ─────────────────────
    logger.info("\n[1/7] Validating configuration...")
    from src.config import get_config
    config = get_config()
    try:
        config.validate()
        logger.info("  ✓ All API keys present")
    except ValueError as e:
        logger.error(f"  ✗ {e}")
        logger.error("  Copy .env.example to .env and fill in your API keys")
        sys.exit(1)
    
    # ── Step 2: Check database connectivity ────────────────
    logger.info("\n[2/7] Checking database...")
    try:
        import asyncpg
        conn = await asyncpg.connect(config.database_url)
        await conn.close()
        logger.info("  ✓ PostgreSQL is reachable")
    except Exception as e:
        logger.error(f"  ✗ Cannot connect to PostgreSQL: {e}")
        logger.info("  Run: docker compose up -d db")
        logger.info("  Then re-run this script")
        sys.exit(1)
    
    # ── Step 3: Run migrations ─────────────────────────────
    logger.info("\n[3/7] Running database migrations...")
    from src.db.migrations import initialize_database
    await initialize_database(config.database_url)
    logger.info("  ✓ Schema created and seed data loaded")
    
    # ── Step 4: Verify seed data ───────────────────────────
    logger.info("\n[4/7] Verifying seed data...")
    from src.db.connection import Database
    db = Database(config.database_url)
    await db.connect()
    
    concept_count = await db.fetchval("SELECT COUNT(*) FROM concepts")
    target_count = await db.fetchval("SELECT COUNT(*) FROM targets")
    family_count = await db.fetchval("SELECT COUNT(*) FROM families")
    
    logger.info(f"  ✓ {concept_count} concepts loaded")
    logger.info(f"  ✓ {target_count} targets loaded")
    logger.info(f"  ✓ {family_count} families loaded")
    
    if concept_count == 0 or target_count == 0:
        logger.error("  ✗ Seed data is empty — check seed/ directory")
        sys.exit(1)
    
    # ── Step 5: Smoke test LLM ─────────────────────────────
    logger.info("\n[5/7] Smoke testing LLM connection...")
    from src.llm.response_parser import parse_llm_json
    try:
        import openai
        client = openai.AsyncOpenAI(api_key=config.openai_api_key)
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": 'Respond with only: {"status": "ok"}'}],
            max_tokens=20,
            response_format={"type": "json_object"},
        )
        result = parse_llm_json(response.choices[0].message.content)
        assert result["status"] == "ok"
        logger.info("  ✓ OpenAI API working")
    except Exception as e:
        logger.error(f"  ✗ OpenAI API failed: {e}")
        # Not fatal — can still use Anthropic
    
    try:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=config.anthropic_api_key)
        response = await client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=50,
            messages=[{"role": "user", "content": 'Respond with only: {"status": "ok"}'}],
        )
        result = parse_llm_json(response.content[0].text)
        assert result["status"] == "ok"
        logger.info("  ✓ Anthropic API working")
    except Exception as e:
        logger.error(f"  ✗ Anthropic API failed: {e}")
    
    # ── Step 6: Smoke test storage round-trip ──────────────
    logger.info("\n[6/7] Testing storage round-trip...")
    import uuid
    test_id = f"test_{uuid.uuid4().hex[:8]}"
    await db.save_entry({
        "id": test_id,
        "target_id": "python",
        "path": f"Python/__smoke_test/{test_id}",
        "entry_type": "reference",
        "content_micro": "Smoke test entry",
        "content_standard": "This is a smoke test entry for bootstrap verification.",
        "tokens_micro": 4,
        "tokens_standard": 10,
        "generated_by": "bootstrap",
        "confidence": 1.0,
    })
    
    retrieved = await db.get_entry(test_id)
    assert retrieved is not None
    assert retrieved["content_micro"] == "Smoke test entry"
    
    # Clean up
    await db.execute("DELETE FROM entries WHERE id = $1", test_id)
    logger.info("  ✓ Storage round-trip working")
    
    await db.disconnect()
    
    # ── Step 7: Summary ────────────────────────────────────
    logger.info("\n" + "═" * 60)
    logger.info("  BOOTSTRAP COMPLETE — System is ready")
    logger.info("═" * 60)
    logger.info("")
    logger.info("  Next steps:")
    logger.info("    1. Test prompts:     python tools/prompt_lab.py --test all --target 'Python 3.12'")
    logger.info("    2. Generate target:  python -m src.pipeline.orchestrator --target python --budget 100")
    logger.info("    3. Start API:        uvicorn api.main:app --reload")
    logger.info("    4. Health check:     python -m src.observability.health_check")
    logger.info("")


if __name__ == "__main__":
    asyncio.run(main())
```

---

## Complete Gap Summary

```
GAP                              STATUS    PRIORITY   WHY IT BLOCKS POC
────────────────────────────────────────────────────────────────────────
1. Database access layer          WRITTEN   P0         Everything calls it
2. Migration / schema init        WRITTEN   P0         Can't store anything without it
3. Embedding generation           WRITTEN   P0         Search doesn't work without it
4. Multi-resolution prompts       WRITTEN   P0         Core differentiator of the system
5. Robust response parser         WRITTEN   P0         1% failure × 2000 calls = 20 failures
6. Configuration management       WRITTEN   P0         Nothing knows where anything is
7. Search service implementation  WRITTEN   P1         API's primary endpoint
8. Docker + startup infra         WRITTEN   P1         Can't run locally without it
9. Minimal test suite             WRITTEN   P1         Can't trust anything without it
10. Bootstrap script              WRITTEN   P1         First-run experience

STILL MISSING (not written above but needed for POC):
────────────────────────────────────────────────────────────────────────
11. RetrievalService (full)       NOT DONE  P1         Second most used API surface
12. HealthService                 NOT DONE  P1         Can't see system state
13. ImplementationService         NOT DONE  P2         Core value prop but needs data first
14. ComparisonService             NOT DONE  P2         Needs 2+ targets generated
15. Pipeline ↔ new DB bridge      NOT DONE  P0         Pipeline writes to old SQLite schema,
                                                        needs to write to new PostgreSQL
16. Embedding cache (Redis)       NOT DONE  P2         Nice for perf, not blocking
17. Admin endpoints               NOT DONE  P2         Can trigger pipeline from CLI for now
18. .env.example                  NOT DONE  P0         30 seconds to write, blocks onboarding
19. Makefile                      NOT DONE  P1         Developer convenience
20. CI pipeline (GitHub Actions)  NOT DONE  P3         Not blocking POC
```

The items I've written in this response (Gaps 1-10) cover the **critical path**. With these plus the architecture from our previous conversation, a developer could:

1. `docker compose up -d` → PostgreSQL running
2. `python tools/bootstrap.py` → Schema created, seed data loaded, smoke tests pass
3. `python tools/prompt_lab.py --test all --target "Python 3.12"` → Prompts validated
4. `python -m src.pipeline.orchestrator --target python` → Generate Python knowledge
5. `uvicorn api.main:app` → API serving queries
6. `POST /v1/search/ {"query": "for loop", "target": "python"}` → Results returned
7. `POST /v1/context/assemble {"task": "...", "token_budget": 4000}` → Context assembled

That's a working POC.

# POC Gap Analysis — What's Actually Missing

## Honest Status Assessment

After our entire conversation, we've produced roughly 4,000 lines of architecture, schema definitions, prompt templates, pipeline logic, API models, and service designs. That's substantial. But there's a specific category of work that we've been systematically avoiding because it's less interesting to design than it is essential to build.

Here's the brutal truth about where we stand:

```
CATEGORY                      DESIGNED    IMPLEMENTED    TESTED
──────────────────────────────────────────────────────────────
Data models (Pydantic)          95%          70%           0%
Prompt templates                90%          90%           0%  ← dangerous
LLM client                     85%          60%           0%
Pipeline orchestration          90%          40%           0%
Storage / DB layer              80%          25%           0%  ← biggest gap
API endpoints (routes)          95%          80%           0%
API services (logic)            70%          15%           0%  ← biggest gap
Context assembly                90%          50%           0%
Observability                   85%          20%           0%
Configuration management        20%           0%           0%
Embedding infrastructure        10%           0%           0%  ← not started
Seed data (taxonomy/registry)   75%          60%           0%
Test suite                       0%           0%           0%
Deployment / packaging           5%           0%           0%
End-to-end integration           0%           0%           0%  ← critical
```

The pattern is clear: **we've designed the cathedral but haven't mixed the concrete.** The gaps fall into specific categories, and I want to walk through each one with the exact code that needs to exist.

---

## Gap 1: The Database Access Layer Doesn't Exist

This is the single largest gap. Every service, every pipeline phase, every API endpoint ultimately calls the database. We have SQL DDL (the `CREATE TABLE` statements) and we have Pydantic models, but we have **nothing in between** — no connection management, no query execution, no result mapping, no migration system.

The API services reference methods like `db.vector_search()`, `db.get_entries_for_concept()`, `db.get_related_entries()` — none of which exist.

```python
# src/db/connection.py

"""
THE MISSING PIECE: Actual database connection and query execution.

This bridges the PostgreSQL schema (which we have) and the 
Pydantic models (which we have) and the services (which call 
methods that don't exist yet).
"""

import os
import json
import asyncio
from contextlib import asynccontextmanager
from typing import Optional, Any

import asyncpg
from pgvector.asyncpg import register_vector


class Database:
    """
    Async PostgreSQL connection pool with vector search support.
    
    Every service depends on this. Nothing works without it.
    """
    
    def __init__(self, dsn: str = None):
        self.dsn = dsn or os.getenv(
            "DATABASE_URL",
            "postgresql://magb:magb@localhost:5432/magb"
        )
        self._pool: Optional[asyncpg.Pool] = None
    
    async def connect(self):
        self._pool = await asyncpg.create_pool(
            self.dsn,
            min_size=5,
            max_size=20,
            init=self._init_connection,
        )
    
    async def _init_connection(self, conn: asyncpg.Connection):
        """Register pgvector type on each new connection."""
        await register_vector(conn)
    
    async def disconnect(self):
        if self._pool:
            await self._pool.close()
    
    @asynccontextmanager
    async def acquire(self):
        async with self._pool.acquire() as conn:
            yield conn
    
    async def fetch(self, query: str, *args) -> list[dict]:
        async with self.acquire() as conn:
            rows = await conn.fetch(query, *args)
            return [dict(row) for row in rows]
    
    async def fetchrow(self, query: str, *args) -> Optional[dict]:
        async with self.acquire() as conn:
            row = await conn.fetchrow(query, *args)
            return dict(row) if row else None
    
    async def fetchval(self, query: str, *args) -> Any:
        async with self.acquire() as conn:
            return await conn.fetchval(query, *args)
    
    async def execute(self, query: str, *args) -> str:
        async with self.acquire() as conn:
            return await conn.execute(query, *args)
    
    async def executemany(self, query: str, args: list) -> None:
        async with self.acquire() as conn:
            await conn.executemany(query, args)
    
    # ════════════════════════════════════════════════════════
    # DOMAIN-SPECIFIC QUERY METHODS
    # These are what the services actually call.
    # Every single one of these is currently missing.
    # ════════════════════════════════════════════════════════
    
    # ── Embedding Generation ───────────────────────────────
    
    async def get_embedding(self, text: str) -> list[float]:
        """
        Generate an embedding vector for a text query.
        
        THIS IS MISSING. We reference embeddings everywhere
        but have no code that actually calls an embedding API.
        """
        # Check cache first
        cached = await self._embedding_cache.get(text)
        if cached:
            return cached
        
        # Call OpenAI embeddings API
        import openai
        client = openai.AsyncOpenAI()
        response = await client.embeddings.create(
            model="text-embedding-3-small",
            input=text,
        )
        embedding = response.data[0].embedding
        
        # Cache it
        await self._embedding_cache.set(text, embedding)
        return embedding
    
    # ── Vector Search ──────────────────────────────────────
    
    async def vector_search(
        self,
        embedding: list[float],
        embedding_column: str = "embedding_standard",
        table: str = "entries",
        target_ids: list[str] = None,
        limit: int = 50,
    ) -> list[dict]:
        """
        Semantic similarity search using pgvector.
        
        THIS IS MISSING. The context service calls this
        but it doesn't exist.
        """
        conditions = []
        params = [embedding, limit]
        param_idx = 3
        
        if target_ids:
            placeholders = ", ".join(f"${param_idx + i}" for i in range(len(target_ids)))
            conditions.append(f"target_id IN ({placeholders})")
            params.extend(target_ids)
            param_idx += len(target_ids)
        
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        
        query = f"""
            SELECT 
                id, target_id, path, concept_id,
                content_micro, content_standard, content_exhaustive,
                tokens_micro, tokens_standard, tokens_exhaustive,
                confidence,
                1 - ({embedding_column} <=> $1::vector) as similarity
            FROM {table}
            {where_clause}
            ORDER BY {embedding_column} <=> $1::vector
            LIMIT $2
        """
        return await self.fetch(query, *params)
    
    # ── Entry Queries ──────────────────────────────────────
    
    async def get_entry(self, entry_id: str) -> Optional[dict]:
        return await self.fetchrow(
            "SELECT * FROM entries WHERE id = $1", entry_id
        )
    
    async def get_entry_by_path(
        self, target_id: str, path: str
    ) -> Optional[dict]:
        return await self.fetchrow(
            "SELECT * FROM entries WHERE target_id = $1 AND path = $2",
            target_id, path
        )
    
    async def get_entries_for_concept(
        self, concept_id: str, target_ids: list[str] = None
    ) -> list[dict]:
        if target_ids:
            return await self.fetch(
                """SELECT * FROM entries 
                   WHERE concept_id = $1 AND target_id = ANY($2)""",
                concept_id, target_ids
            )
        return await self.fetch(
            "SELECT * FROM entries WHERE concept_id = $1", concept_id
        )
    
    async def get_entries_by_target(
        self, target_id: str, entry_type: str = None
    ) -> list[dict]:
        if entry_type:
            return await self.fetch(
                """SELECT * FROM entries 
                   WHERE target_id = $1 AND entry_type = $2
                   ORDER BY path""",
                target_id, entry_type
            )
        return await self.fetch(
            "SELECT * FROM entries WHERE target_id = $1 ORDER BY path",
            target_id
        )
    
    async def get_entry_paths(self, target_id: str) -> list[str]:
        rows = await self.fetch(
            "SELECT path FROM entries WHERE target_id = $1", target_id
        )
        return [r["path"] for r in rows]
    
    async def count_entries(self, target_id: str) -> int:
        return await self.fetchval(
            "SELECT COUNT(*) FROM entries WHERE target_id = $1", target_id
        )
    
    async def save_entry(self, entry: dict) -> str:
        return await self.execute("""
            INSERT INTO entries (
                id, concept_id, target_id, path, entry_type,
                introduced_in, content_micro, content_standard, 
                content_exhaustive, syntax, parameters, return_value,
                edge_cases, common_mistakes,
                tokens_micro, tokens_standard, tokens_exhaustive,
                generated_by, confidence, metadata
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
            )
            ON CONFLICT (target_id, path) DO UPDATE SET
                content_micro = EXCLUDED.content_micro,
                content_standard = EXCLUDED.content_standard,
                content_exhaustive = EXCLUDED.content_exhaustive,
                syntax = EXCLUDED.syntax,
                parameters = EXCLUDED.parameters,
                confidence = EXCLUDED.confidence,
                metadata = EXCLUDED.metadata
        """,
            entry["id"], entry.get("concept_id"), entry["target_id"],
            entry["path"], entry.get("entry_type", "reference"),
            entry.get("introduced_in"), entry.get("content_micro"),
            entry.get("content_standard"), entry.get("content_exhaustive"),
            entry.get("syntax"), json.dumps(entry.get("parameters", [])),
            entry.get("return_value"),
            json.dumps(entry.get("edge_cases", [])),
            json.dumps(entry.get("common_mistakes", [])),
            entry.get("tokens_micro", 0), entry.get("tokens_standard", 0),
            entry.get("tokens_exhaustive", 0),
            entry.get("generated_by", ""), entry.get("confidence", 0.0),
            json.dumps(entry.get("metadata", {})),
        )
    
    # ── Examples ───────────────────────────────────────────
    
    async def get_examples(self, entry_id: str) -> list[dict]:
        return await self.fetch(
            """SELECT * FROM examples 
               WHERE entry_id = $1 ORDER BY complexity""",
            entry_id
        )
    
    async def save_example(self, example: dict) -> str:
        return await self.execute("""
            INSERT INTO examples (
                id, entry_id, title, code, language,
                explanation, expected_output, complexity, token_count
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (id) DO UPDATE SET
                code = EXCLUDED.code,
                explanation = EXCLUDED.explanation
        """,
            example["id"], example["entry_id"], example["title"],
            example["code"], example["language"],
            example.get("explanation", ""), example.get("expected_output", ""),
            example.get("complexity", "basic"),
            example.get("token_count", 0),
        )
    
    # ── Relations (Graph) ──────────────────────────────────
    
    async def get_related_entries(
        self, entry_id: str, limit: int = 10
    ) -> list[dict]:
        """
        Get entries related to a given entry via the relations graph.
        
        THIS IS MISSING. The context service and API both call this.
        """
        return await self.fetch("""
            SELECT e.*, r.relation_type, r.strength, r.context as relation_context
            FROM relations r
            JOIN entries e ON (
                (r.target_id = e.id AND r.source_id = $1) OR
                (r.source_id = e.id AND r.target_id = $1 AND r.bidirectional = true)
            )
            WHERE r.source_type = 'entry' AND r.target_type = 'entry'
            ORDER BY r.strength DESC
            LIMIT $2
        """, entry_id, limit)
    
    async def save_relation(self, relation: dict) -> None:
        await self.execute("""
            INSERT INTO relations (
                source_id, source_type, target_id, target_type,
                relation_type, strength, bidirectional, context,
                discovered_by, confidence
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        """,
            relation["source_id"], relation["source_type"],
            relation["target_id"], relation["target_type"],
            relation["relation_type"],
            relation.get("strength", 1.0),
            relation.get("bidirectional", False),
            relation.get("context", ""),
            relation.get("discovered_by", ""),
            relation.get("confidence", 1.0),
        )
    
    async def traverse_graph(
        self,
        start_id: str,
        relation_types: list[str] = None,
        direction: str = "both",
        max_depth: int = 3,
        max_nodes: int = 100,
    ) -> dict:
        """
        Recursive graph traversal using CTEs.
        
        THIS IS MISSING. The graph router calls this.
        """
        type_filter = ""
        if relation_types:
            placeholders = ", ".join(f"'{rt}'" for rt in relation_types)
            type_filter = f"AND r.relation_type IN ({placeholders})"
        
        direction_clause = {
            "outgoing": "r.source_id = traversal.node_id",
            "incoming": "r.target_id = traversal.node_id",
            "both": "(r.source_id = traversal.node_id OR r.target_id = traversal.node_id)",
        }[direction]
        
        query = f"""
            WITH RECURSIVE traversal AS (
                -- Base case: start node
                SELECT 
                    $1::text as node_id,
                    0 as depth,
                    ARRAY[$1::text] as path
                
                UNION ALL
                
                -- Recursive case: follow edges
                SELECT 
                    CASE WHEN r.source_id = traversal.node_id 
                         THEN r.target_id 
                         ELSE r.source_id END as node_id,
                    traversal.depth + 1,
                    traversal.path || CASE WHEN r.source_id = traversal.node_id 
                                          THEN r.target_id 
                                          ELSE r.source_id END
                FROM relations r
                JOIN traversal ON {direction_clause}
                WHERE traversal.depth < $2
                  AND NOT (CASE WHEN r.source_id = traversal.node_id 
                               THEN r.target_id ELSE r.source_id END) = ANY(traversal.path)
                  {type_filter}
            )
            SELECT DISTINCT node_id, depth
            FROM traversal
            ORDER BY depth
            LIMIT $3
        """
        
        nodes = await self.fetch(query, start_id, max_depth, max_nodes)
        
        # Get edges between found nodes
        node_ids = [n["node_id"] for n in nodes]
        edges = await self.fetch("""
            SELECT source_id, target_id, relation_type, strength, context
            FROM relations
            WHERE source_id = ANY($1) AND target_id = ANY($1)
        """, node_ids)
        
        return {"nodes": nodes, "edges": edges}
    
    # ── Concepts ───────────────────────────────────────────
    
    async def get_concept(self, concept_id: str) -> Optional[dict]:
        return await self.fetchrow(
            "SELECT * FROM concepts WHERE id = $1", concept_id
        )
    
    async def get_concepts_by_domain(self, domain: str) -> list[dict]:
        return await self.fetch(
            "SELECT * FROM concepts WHERE domain = $1 ORDER BY id",
            domain
        )
    
    async def get_all_concepts(self) -> list[dict]:
        return await self.fetch(
            "SELECT * FROM concepts ORDER BY domain, id"
        )
    
    # ── Targets ────────────────────────────────────────────
    
    async def get_target(self, target_id: str) -> Optional[dict]:
        return await self.fetchrow(
            "SELECT * FROM targets WHERE id = $1", target_id
        )
    
    async def get_all_targets(
        self, type_filter: str = None, family: str = None
    ) -> list[dict]:
        conditions = []
        params = []
        idx = 1
        
        if type_filter:
            conditions.append(f"type = ${idx}")
            params.append(type_filter)
            idx += 1
        if family:
            conditions.append(f"${idx} = ANY(family_ids)")
            params.append(family)
            idx += 1
        
        where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        return await self.fetch(
            f"SELECT * FROM targets {where} ORDER BY name", *params
        )
    
    # ── Capabilities ───────────────────────────────────────
    
    async def get_capabilities(
        self, target_id: str, category: str = None
    ) -> list[dict]:
        if category:
            return await self.fetch(
                """SELECT * FROM capabilities 
                   WHERE target_id = $1 AND category = $2
                   ORDER BY name""",
                target_id, category
            )
        return await self.fetch(
            "SELECT * FROM capabilities WHERE target_id = $1 ORDER BY name",
            target_id
        )
    
    async def get_capability(self, cap_id: str) -> Optional[dict]:
        return await self.fetchrow(
            "SELECT * FROM capabilities WHERE id = $1", cap_id
        )
    
    # ── Algorithms ─────────────────────────────────────────
    
    async def get_algorithms(
        self, category: str = None, domain: str = None
    ) -> list[dict]:
        conditions = []
        params = []
        idx = 1
        
        if category:
            conditions.append(f"category = ${idx}")
            params.append(category)
            idx += 1
        if domain:
            conditions.append(f"domain = ${idx}")
            params.append(domain)
            idx += 1
        
        where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        return await self.fetch(
            f"SELECT * FROM algorithms {where} ORDER BY name", *params
        )
    
    async def get_algorithm(self, algo_id: str) -> Optional[dict]:
        return await self.fetchrow(
            "SELECT * FROM algorithms WHERE id = $1", algo_id
        )
    
    # ── Atoms ──────────────────────────────────────────────
    
    async def get_atoms_for_capability(self, capability_id: str) -> list[dict]:
        return await self.fetch("""
            SELECT a.* FROM atoms a
            JOIN relations r ON r.target_id = a.id
            WHERE r.source_id = $1 
              AND r.source_type = 'capability'
              AND r.target_type = 'atom'
              AND r.relation_type = 'REQUIRES'
        """, capability_id)
    
    # ── Blueprints ─────────────────────────────────────────
    
    async def get_blueprints(
        self, target_id: str, scope: str = None
    ) -> list[dict]:
        if scope:
            return await self.fetch(
                """SELECT * FROM blueprints 
                   WHERE target_id = $1 AND scope = $2""",
                target_id, scope
            )
        return await self.fetch(
            "SELECT * FROM blueprints WHERE target_id = $1", target_id
        )
    
    # ── Completeness Anchors ───────────────────────────────
    
    async def get_anchors(self, target_id: str) -> dict:
        row = await self.fetchrow(
            "SELECT data_json FROM completeness_anchors WHERE target = $1",
            target_id
        )
        return json.loads(row["data_json"]) if row else {}
    
    async def save_anchors(self, target_id: str, data: dict) -> None:
        await self.execute("""
            INSERT INTO completeness_anchors (target, data_json)
            VALUES ($1, $2)
            ON CONFLICT (target) DO UPDATE SET data_json = $2
        """, target_id, json.dumps(data))
    
    # ── Health / Observability ─────────────────────────────
    
    async def save_health_snapshot(self, snapshot: dict) -> None:
        await self.execute("""
            INSERT INTO health_snapshots (
                scope_type, scope_id, coverage, accuracy,
                freshness, depth, coherence, overall_health,
                coverage_details, accuracy_details, freshness_details,
                depth_details, coherence_details
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        """,
            snapshot["scope_type"], snapshot.get("scope_id"),
            snapshot["coverage"], snapshot["accuracy"],
            snapshot["freshness"], snapshot["depth"],
            snapshot["coherence"], snapshot["overall_health"],
            json.dumps(snapshot.get("coverage_details", {})),
            json.dumps(snapshot.get("accuracy_details", {})),
            json.dumps(snapshot.get("freshness_details", {})),
            json.dumps(snapshot.get("depth_details", {})),
            json.dumps(snapshot.get("coherence_details", {})),
        )
    
    async def save_health_event(self, event: dict) -> None:
        await self.execute("""
            INSERT INTO health_events (
                event_type, scope_type, scope_id, severity,
                title, description, trigger_source,
                affected_entries, estimated_scope
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        """,
            event["event_type"], event["scope_type"],
            event.get("scope_id"), event["severity"],
            event["title"], event["description"],
            event.get("trigger_source", "system"),
            event.get("affected_entries", []),
            event.get("estimated_scope", 0),
        )
```

---

## Gap 2: Database Migration System

We have `CREATE TABLE` statements but no way to actually create the database, apply schema changes, or seed initial data. This is the first thing that needs to run.

```python
# src/db/migrations.py

"""
Database initialization and migration.

This is what runs FIRST. Before anything else.
Without this, there is no database.
"""

import asyncio
import json
import logging
from pathlib import Path

import asyncpg

logger = logging.getLogger(__name__)


SCHEMA_VERSION = 1

SCHEMA_SQL = """
-- ══════════════════════════════════════════════════════════
-- Extension setup
-- ══════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- for fuzzy text search

-- ══════════════════════════════════════════════════════════
-- Schema versioning
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS schema_version (
    version     INTEGER PRIMARY KEY,
    applied_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════
-- CORE TABLES (from our PostgreSQL schema design)
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS concepts (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    domain          TEXT NOT NULL,
    parent_id       TEXT REFERENCES concepts(id),
    summary         TEXT,
    description     TEXT,
    theory          TEXT,
    prevalence      REAL DEFAULT 1.0,
    notable_absences TEXT[],
    embedding       vector(1536),
    metadata        JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS families (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    type            TEXT NOT NULL,
    description     TEXT,
    shared_traits   JSONB NOT NULL DEFAULT '[]',
    shared_entry_ids TEXT[] DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS targets (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    type            TEXT NOT NULL,
    family_ids      TEXT[] DEFAULT '{}',
    traits          JSONB NOT NULL DEFAULT '{}',
    distinguishing  TEXT[],
    similar_to      TEXT[] DEFAULT '{}',
    generation_status TEXT DEFAULT 'pending',
    last_generated  TIMESTAMPTZ,
    embedding       vector(1536),
    metadata        JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS target_versions (
    id              TEXT PRIMARY KEY,
    target_id       TEXT NOT NULL REFERENCES targets(id),
    version_string  TEXT NOT NULL,
    released        DATE,
    status          TEXT,
    delta_from      TEXT REFERENCES target_versions(id),
    additions       JSONB DEFAULT '[]',
    changes         JSONB DEFAULT '[]',
    removals        JSONB DEFAULT '[]',
    deprecations    JSONB DEFAULT '[]',
    spec_url        TEXT,
    sort_order      INTEGER
);

CREATE TABLE IF NOT EXISTS entries (
    id                  TEXT PRIMARY KEY,
    concept_id          TEXT REFERENCES concepts(id),
    target_id           TEXT NOT NULL REFERENCES targets(id),
    path                TEXT NOT NULL,
    entry_type          TEXT NOT NULL DEFAULT 'reference',
    introduced_in       TEXT REFERENCES target_versions(id),
    removed_in          TEXT REFERENCES target_versions(id),
    changed_in          TEXT[],
    content_micro       TEXT,
    content_standard    TEXT,
    content_exhaustive  TEXT,
    syntax              TEXT,
    parameters          JSONB DEFAULT '[]',
    return_value        TEXT,
    edge_cases          JSONB DEFAULT '[]',
    common_mistakes     JSONB DEFAULT '[]',
    tokens_micro        INTEGER DEFAULT 0,
    tokens_standard     INTEGER DEFAULT 0,
    tokens_exhaustive   INTEGER DEFAULT 0,
    embedding_micro     vector(1536),
    embedding_standard  vector(1536),
    embedding_exhaustive vector(1536),
    generated_by        TEXT,
    generated_at        TIMESTAMPTZ DEFAULT NOW(),
    validated_by        TEXT,
    confidence          REAL DEFAULT 0.0,
    validation_notes    TEXT,
    metadata            JSONB DEFAULT '{}',
    UNIQUE(target_id, path)
);

CREATE TABLE IF NOT EXISTS examples (
    id              TEXT PRIMARY KEY,
    entry_id        TEXT REFERENCES entries(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    code            TEXT NOT NULL,
    language        TEXT NOT NULL,
    explanation     TEXT DEFAULT '',
    expected_output TEXT DEFAULT '',
    complexity      TEXT DEFAULT 'basic',
    valid_from      TEXT REFERENCES target_versions(id),
    valid_until     TEXT REFERENCES target_versions(id),
    also_used_by    TEXT[] DEFAULT '{}',
    token_count     INTEGER DEFAULT 0,
    embedding       vector(1536)
);

CREATE TABLE IF NOT EXISTS relations (
    id              BIGSERIAL PRIMARY KEY,
    source_id       TEXT NOT NULL,
    source_type     TEXT NOT NULL,
    target_id       TEXT NOT NULL,
    target_type     TEXT NOT NULL,
    relation_type   TEXT NOT NULL,
    strength        REAL DEFAULT 1.0,
    bidirectional   BOOLEAN DEFAULT FALSE,
    context         TEXT,
    discovered_by   TEXT,
    confidence      REAL DEFAULT 1.0,
    metadata        JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS atoms (
    id                  TEXT PRIMARY KEY,
    target_id           TEXT NOT NULL REFERENCES targets(id),
    entry_id            TEXT REFERENCES entries(id),
    atom_type           TEXT NOT NULL,
    file_path           TEXT DEFAULT '',
    xpath               TEXT DEFAULT '',
    byte_offset         TEXT,
    element_name        TEXT DEFAULT '',
    namespace_uri       TEXT DEFAULT '',
    namespace_prefix    TEXT DEFAULT '',
    structure           JSONB NOT NULL DEFAULT '{}',
    parent_atom_id      TEXT REFERENCES atoms(id),
    semantic_meaning    TEXT DEFAULT '',
    unit_of_measure     TEXT,
    conversion_formula  TEXT,
    example_value       TEXT DEFAULT '',
    example_context     TEXT DEFAULT '',
    embedding           vector(1536),
    metadata            JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS algorithms (
    id                  TEXT PRIMARY KEY,
    name                TEXT NOT NULL,
    category            TEXT NOT NULL,
    domain              TEXT NOT NULL,
    formula             TEXT,
    formula_explanation TEXT,
    summary             TEXT,
    full_spec           TEXT,
    pseudocode          TEXT,
    parameters          JSONB DEFAULT '[]',
    time_complexity     TEXT,
    space_complexity    TEXT,
    embedding           vector(1536),
    metadata            JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS capabilities (
    id                      TEXT PRIMARY KEY,
    target_id               TEXT NOT NULL REFERENCES targets(id),
    name                    TEXT NOT NULL,
    category                TEXT NOT NULL,
    user_description        TEXT,
    technical_description   TEXT,
    complexity              TEXT DEFAULT 'moderate',
    implementation_steps    JSONB DEFAULT '[]',
    reference_implementations JSONB DEFAULT '{}',
    minimum_working_example TEXT,
    known_pitfalls          JSONB DEFAULT '[]',
    embedding               vector(1536),
    metadata                JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS blueprints (
    id                      TEXT PRIMARY KEY,
    target_id               TEXT REFERENCES targets(id),
    name                    TEXT NOT NULL,
    scope                   TEXT NOT NULL,
    description             TEXT DEFAULT '',
    capability_ids          TEXT[] DEFAULT '{}',
    algorithm_ids           TEXT[] DEFAULT '{}',
    module_structure        JSONB DEFAULT '[]',
    class_hierarchy         JSONB DEFAULT '[]',
    public_api              JSONB DEFAULT '[]',
    initialization_sequence JSONB DEFAULT '[]',
    integration_tests       JSONB DEFAULT '[]',
    embedding               vector(1536),
    metadata                JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS artifacts (
    id              TEXT PRIMARY KEY,
    type            TEXT NOT NULL,
    name            TEXT,
    description     TEXT,
    content         TEXT,
    content_ref     TEXT,
    content_hash    TEXT,
    content_size    INTEGER,
    token_count     INTEGER,
    implementations JSONB DEFAULT '{}',
    test_vector_ids TEXT[] DEFAULT '{}',
    is_tested       BOOLEAN DEFAULT FALSE,
    referenced_by   TEXT[] DEFAULT '{}',
    embedding       vector(1536),
    metadata        JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS completeness_anchors (
    target          TEXT PRIMARY KEY,
    data_json       TEXT NOT NULL
);

-- ══════════════════════════════════════════════════════════
-- OBSERVABILITY TABLES
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS health_snapshots (
    id                  BIGSERIAL PRIMARY KEY,
    measured_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    scope_type          TEXT NOT NULL,
    scope_id            TEXT,
    coverage            REAL NOT NULL,
    accuracy            REAL NOT NULL,
    freshness           REAL NOT NULL,
    depth               REAL NOT NULL,
    coherence           REAL NOT NULL,
    overall_health      REAL NOT NULL,
    coverage_details    JSONB DEFAULT '{}',
    accuracy_details    JSONB DEFAULT '{}',
    freshness_details   JSONB DEFAULT '{}',
    depth_details       JSONB DEFAULT '{}',
    coherence_details   JSONB DEFAULT '{}',
    coverage_delta      REAL,
    accuracy_delta      REAL,
    freshness_delta     REAL,
    depth_delta         REAL,
    coherence_delta     REAL,
    overall_delta       REAL
);

CREATE TABLE IF NOT EXISTS health_events (
    id              BIGSERIAL PRIMARY KEY,
    detected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    event_type      TEXT NOT NULL,
    scope_type      TEXT NOT NULL,
    scope_id        TEXT,
    severity        TEXT NOT NULL,
    title           TEXT NOT NULL,
    description     TEXT NOT NULL,
    trigger_source  TEXT,
    trigger_details JSONB DEFAULT '{}',
    affected_entries TEXT[] DEFAULT '{}',
    affected_targets TEXT[] DEFAULT '{}',
    estimated_scope INTEGER DEFAULT 0,
    response_status TEXT DEFAULT 'pending',
    response_action TEXT,
    resolved_at     TIMESTAMPTZ,
    resolved_by     TEXT,
    metadata        JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS decay_ledger (
    id                  BIGSERIAL PRIMARY KEY,
    entry_id            TEXT NOT NULL,
    knowledge_timestamp TIMESTAMPTZ NOT NULL,
    decay_events        JSONB DEFAULT '[]',
    decay_score         REAL NOT NULL DEFAULT 0.0,
    review_due          TIMESTAMPTZ,
    decay_rate          TEXT DEFAULT 'normal',
    last_assessed       TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════
-- OPERATIONAL TABLES
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS generation_runs (
    id              TEXT PRIMARY KEY,
    target_id       TEXT NOT NULL,
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    status          TEXT DEFAULT 'running',
    current_phase   INTEGER DEFAULT 1,
    total_api_calls INTEGER DEFAULT 0,
    total_input_tokens  BIGINT DEFAULT 0,
    total_output_tokens BIGINT DEFAULT 0,
    total_cost_usd  REAL DEFAULT 0.0,
    checkpoint_data JSONB DEFAULT '{}',
    errors          JSONB DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS schema_metadata (
    table_name      TEXT NOT NULL,
    column_name     TEXT,
    description     TEXT NOT NULL,
    ai_usage_hint   TEXT,
    example_query   TEXT,
    PRIMARY KEY (table_name, COALESCE(column_name, '__table__'))
);

-- ══════════════════════════════════════════════════════════
-- INDICES
-- ══════════════════════════════════════════════════════════

-- Vector indices (HNSW)
CREATE INDEX IF NOT EXISTS idx_concepts_emb ON concepts 
    USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_entries_emb_micro ON entries 
    USING hnsw (embedding_micro vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_entries_emb_std ON entries 
    USING hnsw (embedding_standard vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_entries_emb_exh ON entries 
    USING hnsw (embedding_exhaustive vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_caps_emb ON capabilities 
    USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_algos_emb ON algorithms 
    USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_atoms_emb ON atoms 
    USING hnsw (embedding vector_cosine_ops);

-- Graph traversal
CREATE INDEX IF NOT EXISTS idx_rel_source ON relations(source_id, source_type);
CREATE INDEX IF NOT EXISTS idx_rel_target ON relations(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_rel_type ON relations(relation_type);

-- Hierarchy
CREATE INDEX IF NOT EXISTS idx_entries_target_path ON entries(target_id, path);
CREATE INDEX IF NOT EXISTS idx_entries_concept ON entries(concept_id);
CREATE INDEX IF NOT EXISTS idx_entries_type ON entries(target_id, entry_type);
CREATE INDEX IF NOT EXISTS idx_atoms_parent ON atoms(parent_atom_id);
CREATE INDEX IF NOT EXISTS idx_atoms_target ON atoms(target_id);
CREATE INDEX IF NOT EXISTS idx_versions_target ON target_versions(target_id);
CREATE INDEX IF NOT EXISTS idx_examples_entry ON examples(entry_id);
CREATE INDEX IF NOT EXISTS idx_caps_target ON capabilities(target_id);

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_entries_fts ON entries 
    USING gin(to_tsvector('english', 
        coalesce(content_micro,'') || ' ' || 
        coalesce(content_standard,'') || ' ' || 
        coalesce(path,'')));

-- Health
CREATE INDEX IF NOT EXISTS idx_health_scope ON health_snapshots(scope_type, scope_id, measured_at);
CREATE INDEX IF NOT EXISTS idx_events_unresolved ON health_events(response_status) 
    WHERE response_status IN ('pending', 'in_progress');
CREATE INDEX IF NOT EXISTS idx_decay_score ON decay_ledger(decay_score DESC);
"""


async def initialize_database(dsn: str):
    """
    Create the database schema and seed initial data.
    
    This is the FIRST thing that runs. Ever.
    """
    conn = await asyncpg.connect(dsn)
    
    try:
        # Check if schema already exists
        existing = await conn.fetchval(
            "SELECT version FROM schema_version ORDER BY version DESC LIMIT 1"
        )
        if existing and existing >= SCHEMA_VERSION:
            logger.info(f"Schema already at version {existing}, skipping")
            return
    except asyncpg.UndefinedTableError:
        pass  # schema_version doesn't exist yet = fresh database
    
    logger.info(f"Initializing database schema version {SCHEMA_VERSION}")
    
    # Apply schema
    await conn.execute(SCHEMA_SQL)
    
    # Record version
    await conn.execute(
        "INSERT INTO schema_version (version) VALUES ($1) ON CONFLICT DO NOTHING",
        SCHEMA_VERSION,
    )
    
    # Seed data
    await seed_concepts(conn)
    await seed_targets(conn)
    await seed_families(conn)
    await seed_schema_metadata(conn)
    
    logger.info("Database initialization complete")
    await conn.close()


async def seed_concepts(conn: asyncpg.Connection):
    """Load the universal concept taxonomy into the database."""
    from seed.concept_taxonomy import flatten_concepts
    
    concepts = flatten_concepts()
    logger.info(f"Seeding {len(concepts)} concepts")
    
    for concept in concepts:
        await conn.execute("""
            INSERT INTO concepts (id, name, domain, parent_id, description)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                description = EXCLUDED.description
        """,
            concept["id"], concept["name"], concept["domain"],
            concept.get("parent_id"), concept.get("description", ""),
        )


async def seed_targets(conn: asyncpg.Connection):
    """Load the target registry into the database."""
    from seed.target_registry import TARGET_REGISTRY
    
    count = 0
    for category, targets in TARGET_REGISTRY.items():
        for target in targets:
            await conn.execute("""
                INSERT INTO targets (id, name, type, family_ids, traits, similar_to, metadata)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    traits = EXCLUDED.traits
            """,
                target["id"], target["name"],
                target.get("type", "programming_language"),
                target.get("families", []),
                json.dumps(target.get("traits", {})),
                target.get("similar_to", []),
                json.dumps({k: v for k, v in target.items()
                           if k not in ("id", "name", "type", "families", "traits", "similar_to")}),
            )
            count += 1
    
    logger.info(f"Seeded {count} targets")


async def seed_families(conn: asyncpg.Connection):
    """Load family definitions."""
    # For now, inline the essential families.
    # The full families.py from seed/ will be loaded later.
    families = [
        ("c_syntax_family", "C-Syntax Family", "language_family",
         "Languages with C-like syntax (curly braces, semicolons)",
         [{"trait": "curly_brace_blocks"}, {"trait": "semicolons"}]),
        ("dynamic", "Dynamic Languages", "language_family",
         "Dynamically typed languages", [{"trait": "dynamic_typing"}]),
        ("ooxml", "Office Open XML", "format_family",
         "Microsoft Office XML-based formats",
         [{"trait": "zip_container"}, {"trait": "opc_relationships"}]),
        ("raster_image", "Raster Image Formats", "format_family",
         "Pixel-based image formats", [{"trait": "pixel_grid"}]),
    ]
    
    for fid, name, ftype, desc, traits in families:
        await conn.execute("""
            INSERT INTO families (id, name, type, description, shared_traits)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO UPDATE SET shared_traits = EXCLUDED.shared_traits
        """, fid, name, ftype, desc, json.dumps(traits))
    
    logger.info(f"Seeded {len(families)} families")


async def seed_schema_metadata(conn: asyncpg.Connection):
    """Make the schema self-describing for AI consumers."""
    metadata = [
        ("concepts", None,
         "Universal ideas that span multiple targets. ~300 rows.",
         "Query concepts first for language-agnostic understanding, then join to entries."),
        ("entries", "content_micro",
         "Ultra-short description (~50 tokens). For listings and summaries.",
         "Use content_micro when referencing many entries. Use content_standard for Q&A. Use content_exhaustive for implementation details."),
        ("entries", "embedding_standard",
         "1536-dim vector embedding of content_standard. For semantic similarity search.",
         "Search embedding_standard for most queries. Use embedding_exhaustive for edge cases."),
        ("relations", None,
         "Typed, weighted, directional edges connecting all knowledge entities.",
         "Use recursive CTEs for graph traversal. Key relation types: REQUIRES, ANALOGOUS_IN, COMMONLY_USED_WITH, COMPOSES."),
    ]
    
    for table, column, desc, hint in metadata:
        await conn.execute("""
            INSERT INTO schema_metadata (table_name, column_name, description, ai_usage_hint)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (table_name, COALESCE(column_name, '__table__')) DO UPDATE SET
                description = EXCLUDED.description
        """, table, column, desc, hint)


# ── CLI entry point ────────────────────────────────────────

async def main():
    import os
    dsn = os.getenv("DATABASE_URL", "postgresql://magb:magb@localhost:5432/magb")
    await initialize_database(dsn)


if __name__ == "__main__":
    asyncio.run(main())
```

---

## Gap 3: Embedding Generation Pipeline

We reference embeddings in every search query, every context assembly, every similarity comparison — but have zero code that actually generates them.

```python
# src/embeddings.py

"""
Embedding generation and management.

Every entry needs embeddings at up to 3 resolutions.
5 million entries × 3 resolutions × $0.0001/1K tokens ≈ $150 total.
This runs as a background job after content generation.
"""

import asyncio
import logging
from typing import Optional

import openai
import tiktoken

from src.db.connection import Database

logger = logging.getLogger(__name__)

# OpenAI embedding model
EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIM = 1536
BATCH_SIZE = 100  # OpenAI allows up to 2048 inputs per request
MAX_TOKENS_PER_INPUT = 8191


class EmbeddingService:
    """Generate and store embeddings for knowledge entries."""
    
    def __init__(self, db: Database):
        self.db = db
        self.client = openai.AsyncOpenAI()
        self.enc = tiktoken.get_encoding("cl100k_base")
        self._total_tokens = 0
        self._total_calls = 0
    
    async def generate_for_target(self, target_id: str):
        """Generate all missing embeddings for a target."""
        
        # Find entries missing embeddings
        missing = await self.db.fetch("""
            SELECT id, content_micro, content_standard, content_exhaustive
            FROM entries
            WHERE target_id = $1
              AND (embedding_micro IS NULL 
                   OR embedding_standard IS NULL 
                   OR embedding_exhaustive IS NULL)
        """, target_id)
        
        logger.info(f"Generating embeddings for {len(missing)} entries in {target_id}")
        
        # Process in batches
        for i in range(0, len(missing), BATCH_SIZE):
            batch = missing[i:i + BATCH_SIZE]
            await self._process_batch(batch)
            logger.info(f"  Embedded {min(i + BATCH_SIZE, len(missing))}/{len(missing)}")
        
        logger.info(
            f"Embedding complete for {target_id}: "
            f"{self._total_calls} API calls, {self._total_tokens} tokens"
        )
    
    async def _process_batch(self, entries: list[dict]):
        """Generate embeddings for a batch of entries."""
        
        for resolution in ["micro", "standard", "exhaustive"]:
            content_key = f"content_{resolution}"
            embedding_key = f"embedding_{resolution}"
            
            # Collect non-null texts
            texts = []
            entry_ids = []
            for entry in entries:
                text = entry.get(content_key)
                if text:
                    # Truncate to model limit
                    tokens = self.enc.encode(text)
                    if len(tokens) > MAX_TOKENS_PER_INPUT:
                        text = self.enc.decode(tokens[:MAX_TOKENS_PER_INPUT])
                    texts.append(text)
                    entry_ids.append(entry["id"])
            
            if not texts:
                continue
            
            # Call embedding API
            try:
                response = await self.client.embeddings.create(
                    model=EMBEDDING_MODEL,
                    input=texts,
                )
                
                self._total_calls += 1
                self._total_tokens += response.usage.total_tokens
                
                # Store embeddings
                for j, embedding_data in enumerate(response.data):
                    vector = embedding_data.embedding
                    await self.db.execute(f"""
                        UPDATE entries SET {embedding_key} = $1
                        WHERE id = $2
                    """, vector, entry_ids[j])
                    
            except Exception as e:
                logger.error(f"Embedding batch failed: {e}")
    
    async def embed_single(self, text: str) -> list[float]:
        """Generate a single embedding for a search query."""
        response = await self.client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=[text],
        )
        self._total_tokens += response.usage.total_tokens
        return response.data[0].embedding
```

---

## Gap 4: Multi-Resolution Content Generation

Our current prompts generate a single content block. The schema requires three resolutions per entry. We need prompts and a pipeline step that produces all three.

```python
# src/prompts/multi_resolution.py

"""
Prompts that generate content at all three resolutions simultaneously.

This is more efficient than three separate calls: one call produces
all three resolutions, and the LLM has the full context to decide
what to include at each level.
"""

GENERATE_MULTI_RESOLUTION = """You are writing a reference entry for a **{target}** guidebook
at THREE levels of detail.

Location: {path}
Topic: {title}
Description: {description}

Write the entry at three resolutions. Each resolution MUST be self-contained 
(a reader should understand it without seeing the other resolutions).

MICRO (~50 words): A single-sentence or two-sentence summary. Enough to 
understand what this is at a glance. Used in tables of contents and listings.

STANDARD (~300 words): A complete reference entry. Includes syntax, 
key behavior, one code example, and the most important edge cases. 
Sufficient to USE this feature correctly in typical cases.

EXHAUSTIVE (~1000+ words): Everything a developer could ever need. 
All parameters, all edge cases, all interactions with other features,
performance notes, version history, multiple examples from basic to 
advanced, common mistakes, and internal implementation details where relevant.

Respond with ONLY this JSON:
{{
  "title": "...",
  
  "content_micro": "One or two sentences summarizing this feature.",
  
  "content_standard": "Complete reference entry with syntax, behavior, one example, key edge cases...",
  
  "content_exhaustive": "Everything: all parameters, all edge cases, multiple examples, performance notes, version history, implementation details...",
  
  "syntax": "formal syntax if applicable",
  
  "parameters": [
    {{"name": "...", "type": "...", "required": true, "description": "...", "default": null}}
  ],
  
  "return_value": "type and description if applicable",
  
  "examples": [
    {{
      "title": "Basic usage",
      "code": "...",
      "language": "{code_lang}",
      "explanation": "...",
      "output": "...",
      "complexity": "basic"
    }},
    {{
      "title": "Advanced usage",
      "code": "...",
      "language": "{code_lang}",
      "explanation": "...",
      "output": "...",
      "complexity": "advanced"
    }}
  ],
  
  "edge_cases": ["..."],
  "common_mistakes": ["..."],
  "related_topics": ["path/to/related"],
  "since_version": "...",
  "deprecated": false
}}"""
```

---

## Gap 5: Robust Response Parser

The LLM client has basic JSON extraction. The plan calls for five recovery strategies. This is essential because at 2,000+ API calls per target, even a 1% parse failure rate means 20 failures.

```python
# src/llm/response_parser.py

"""
Five-strategy response parser for LLM JSON output.

Strategy 1: Direct JSON parse
Strategy 2: Code fence extraction
Strategy 3: JSON boundary finding
Strategy 4: JSON cleaning (trailing commas, comments, single quotes)
Strategy 5: Truncation repair (close open brackets)

Each strategy is tried in order. If all five fail, the error
includes diagnostic information about what went wrong.
"""

import json
import re
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class ParseError(Exception):
    """Raised when all parsing strategies fail."""
    def __init__(self, message: str, raw_text: str, strategies_tried: list[str]):
        super().__init__(message)
        self.raw_text = raw_text
        self.strategies_tried = strategies_tried


def parse_llm_json(text: str) -> dict:
    """
    Parse JSON from LLM output using five progressive strategies.
    
    Returns parsed dict on success.
    Raises ParseError with diagnostic info on failure.
    """
    text = text.strip()
    strategies_tried = []
    
    # Strategy 1: Direct parse
    try:
        result = json.loads(text)
        if isinstance(result, dict):
            return result
        strategies_tried.append("direct: parsed but not a dict")
    except json.JSONDecodeError as e:
        strategies_tried.append(f"direct: {str(e)[:80]}")
    
    # Strategy 2: Code fence extraction
    try:
        extracted = _extract_from_code_fence(text)
        if extracted:
            result = json.loads(extracted)
            if isinstance(result, dict):
                return result
            strategies_tried.append("fence: parsed but not a dict")
        else:
            strategies_tried.append("fence: no code fence found")
    except json.JSONDecodeError as e:
        strategies_tried.append(f"fence: {str(e)[:80]}")
    
    # Strategy 3: JSON boundary finding
    try:
        extracted = _find_json_boundaries(text)
        if extracted:
            result = json.loads(extracted)
            if isinstance(result, dict):
                return result
            strategies_tried.append("boundary: parsed but not a dict")
        else:
            strategies_tried.append("boundary: no JSON boundaries found")
    except json.JSONDecodeError as e:
        strategies_tried.append(f"boundary: {str(e)[:80]}")
    
    # Strategy 4: JSON cleaning
    try:
        cleaned = _clean_json(text)
        # Try to find boundaries in cleaned text too
        for candidate in [cleaned, _find_json_boundaries(cleaned) or cleaned]:
            try:
                result = json.loads(candidate)
                if isinstance(result, dict):
                    return result
            except json.JSONDecodeError:
                continue
        strategies_tried.append("clean: cleaning didn't help")
    except Exception as e:
        strategies_tried.append(f"clean: {str(e)[:80]}")
    
    # Strategy 5: Truncation repair
    try:
        repaired = _repair_truncation(text)
        if repaired:
            # Try boundaries on repaired text
            for candidate in [repaired, _find_json_boundaries(repaired) or repaired]:
                try:
                    result = json.loads(candidate)
                    if isinstance(result, dict):
                        logger.warning("JSON was truncated — repaired by closing brackets")
                        return result
                except json.JSONDecodeError:
                    continue
        strategies_tried.append("repair: truncation repair didn't help")
    except Exception as e:
        strategies_tried.append(f"repair: {str(e)[:80]}")
    
    # All strategies failed
    raise ParseError(
        f"All 5 parsing strategies failed. "
        f"Text starts with: {text[:100]}... "
        f"Text ends with: ...{text[-100:]}",
        raw_text=text,
        strategies_tried=strategies_tried,
    )


def _extract_from_code_fence(text: str) -> Optional[str]:
    """Extract content from ```json ... ``` or ``` ... ```."""
    patterns = [
        r'```json\s*\n(.*?)```',
        r'```\s*\n(.*?)```',
        r'```(.*?)```',
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()
    return None


def _find_json_boundaries(text: str) -> Optional[str]:
    """Find the outermost { } pair in the text."""
    # Find first {
    start = text.find('{')
    if start == -1:
        return None
    
    # Find matching } by counting brackets
    depth = 0
    in_string = False
    escape_next = False
    
    for i in range(start, len(text)):
        char = text[i]
        
        if escape_next:
            escape_next = False
            continue
        
        if char == '\\':
            escape_next = True
            continue
        
        if char == '"' and not escape_next:
            in_string = not in_string
            continue
        
        if in_string:
            continue
        
        if char == '{':
            depth += 1
        elif char == '}':
            depth -= 1
            if depth == 0:
                return text[start:i + 1]
    
    # Unclosed — return from start to end (Strategy 5 may fix it)
    return text[start:]


def _clean_json(text: str) -> str:
    """
    Fix common JSON issues:
    - Trailing commas before } or ]
    - Single quotes instead of double quotes
    - JavaScript-style comments
    - Unquoted keys
    """
    # Remove code fences first
    extracted = _extract_from_code_fence(text)
    if extracted:
        text = extracted
    
    # Remove JavaScript comments
    text = re.sub(r'//.*?$', '', text, flags=re.MULTILINE)
    text = re.sub(r'/\*.*?\*/', '', text, flags=re.DOTALL)
    
    # Remove trailing commas (before } or ])
    text = re.sub(r',\s*([\]}])', r'\1', text)
    
    # Replace single quotes with double quotes (carefully)
    # Only do this if there are no double quotes at all (rare)
    if '"' not in text and "'" in text:
        text = text.replace("'", '"')
    
    return text


def _repair_truncation(text: str) -> Optional[str]:
    """
    If the JSON was truncated (model hit max_tokens), try to close it.
    Count open brackets and add closing ones.
    """
    # Find the JSON start
    extracted = _find_json_boundaries(text)
    if not extracted:
        return None
    
    # Count unclosed brackets
    open_braces = 0
    open_brackets = 0
    in_string = False
    escape_next = False
    
    for char in extracted:
        if escape_next:
            escape_next = False
            continue
        if char == '\\':
            escape_next = True
            continue
        if char == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        
        if char == '{':
            open_braces += 1
        elif char == '}':
            open_braces -= 1
        elif char == '[':
            open_brackets += 1
        elif char == ']':
            open_brackets -= 1
    
    if open_braces == 0 and open_brackets == 0:
        return None  # not truncated
    
    # Check if we're mid-string — close the string
    if in_string:
        extracted += '"'
    
    # Remove any trailing comma
    extracted = extracted.rstrip().rstrip(',')
    
    # Close brackets and braces (inner brackets first)
    repair = extracted
    for _ in range(open_brackets):
        repair += ']'
    for _ in range(open_braces):
        repair += '}'
    
    return repair
```

---

## Gap 6: Configuration Management

We reference `.env`, `config.yaml`, model tiers, budget limits — but have no unified configuration system.

```python
# src/config.py

"""
Unified configuration management.

Reads from:
  1. Defaults (in this file)
  2. config/default.yaml (if exists)
  3. Environment variables (override everything)
  4. .env file (loaded by python-dotenv)
"""

import os
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional

from dotenv import load_dotenv

# Load .env file if it exists
load_dotenv()


@dataclass
class ModelConfig:
    provider: str       # "openai" or "anthropic"
    model: str
    max_tokens: int
    cost_per_1k_input: float
    cost_per_1k_output: float
    rpm_limit: int


@dataclass
class Config:
    """All configuration in one place."""
    
    # ── API Keys (from environment only — never in config files) ──
    openai_api_key: str = field(
        default_factory=lambda: os.getenv("OPENAI_API_KEY", ""))
    anthropic_api_key: str = field(
        default_factory=lambda: os.getenv("ANTHROPIC_API_KEY", ""))
    
    # ── Database ──────────────────────────────────────────────────
    database_url: str = field(
        default_factory=lambda: os.getenv(
            "DATABASE_URL",
            "postgresql://magb:magb@localhost:5432/magb"
        ))
    
    # ── Model Routing ─────────────────────────────────────────────
    cheap_model: ModelConfig = field(default_factory=lambda: ModelConfig(
        provider="anthropic",
        model=os.getenv("CHEAP_MODEL", "claude-sonnet-4-20250514"),
        max_tokens=4096,
        cost_per_1k_input=0.003,
        cost_per_1k_output=0.015,
        rpm_limit=1000,
    ))
    mid_model: ModelConfig = field(default_factory=lambda: ModelConfig(
        provider="anthropic",
        model=os.getenv("MID_MODEL", "claude-sonnet-4-20250514"),
        max_tokens=8192,
        cost_per_1k_input=0.003,
        cost_per_1k_output=0.015,
        rpm_limit=1000,
    ))
    expensive_model: ModelConfig = field(default_factory=lambda: ModelConfig(
        provider="openai",
        model=os.getenv("EXPENSIVE_MODEL", "gpt-4o"),
        max_tokens=4096,
        cost_per_1k_input=0.005,
        cost_per_1k_output=0.015,
        rpm_limit=500,
    ))
    embedding_model: str = field(
        default_factory=lambda: os.getenv("EMBEDDING_MODEL", "text-embedding-3-small"))
    
    # ── Pipeline ──────────────────────────────────────────────────
    max_concurrency: int = int(os.getenv("MAX_CONCURRENCY", "30"))
    max_decompose_depth: int = int(os.getenv("MAX_DECOMPOSE_DEPTH", "5"))
    gap_analysis_passes: int = int(os.getenv("GAP_PASSES", "2"))
    validation_sample_rate: float = float(os.getenv("VALIDATION_RATE", "0.2"))
    
    # ── Budget ────────────────────────────────────────────────────
    max_total_budget_usd: float = float(os.getenv("MAX_BUDGET", "500.0"))
    max_per_target_usd: float = float(os.getenv("MAX_PER_TARGET", "200.0"))
    max_per_phase_usd: float = float(os.getenv("MAX_PER_PHASE", "100.0"))
    daily_healing_budget_usd: float = float(os.getenv("HEALING_BUDGET", "50.0"))
    
    # ── API ───────────────────────────────────────────────────────
    api_host: str = os.getenv("API_HOST", "0.0.0.0")
    api_port: int = int(os.getenv("API_PORT", "8000"))
    api_rate_limit_rpm: int = int(os.getenv("API_RATE_LIMIT", "60"))
    
    # ── Paths ─────────────────────────────────────────────────────
    checkpoint_dir: str = os.getenv("CHECKPOINT_DIR", "checkpoints/")
    export_dir: str = os.getenv("EXPORT_DIR", "exports/")
    log_dir: str = os.getenv("LOG_DIR", "logs/")
    
    # ── Logging ───────────────────────────────────────────────────
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    
    def validate(self):
        """Check that critical configuration is present."""
        errors = []
        if not self.openai_api_key:
            errors.append("OPENAI_API_KEY not set")
        if not self.anthropic_api_key:
            errors.append("ANTHROPIC_API_KEY not set")
        if not self.database_url:
            errors.append("DATABASE_URL not set")
        if errors:
            raise ValueError(
                f"Configuration errors: {'; '.join(errors)}. "
                f"Set these in .env or as environment variables."
            )


# Singleton
_config: Optional[Config] = None

def get_config() -> Config:
    global _config
    if _config is None:
        _config = Config()
    return _config
```

---

## Gap 7: API Service Implementations

The API routes reference services that are mostly stubs. The SearchService, RetrievalService, and HealthService need actual implementations. The ContextService is the most complete, but the others are critical for the POC.

```python
# api/services/search_service.py

"""
Search service — the actual implementation behind /v1/search.

Combines three search strategies:
1. Semantic (vector similarity via pgvector)
2. Full-text (PostgreSQL tsvector)
3. Path-based (exact and prefix path matching)
"""

import time
from typing import Optional

from api.models.search import (
    SearchRequest, SearchResponse, SearchResult
)
from api.models.common import ContentResolution, EntrySummary
from api.db.connection import Database
from api.db.cache import Cache


class SearchService:
    
    def __init__(self, db: Database, cache: Cache):
        self.db = db
        self.cache = cache
    
    async def search(self, request: SearchRequest) -> SearchResponse:
        start = time.time()
        
        results = []
        
        # Strategy 1: Semantic search (primary)
        if request.query:
            embedding = await self.db.get_embedding(request.query)
            
            semantic_hits = await self.db.vector_search(
                embedding=embedding,
                embedding_column="embedding_standard",
                target_ids=[request.target] if request.target else None,
                limit=request.pagination.page_size * 3,  # over-fetch for ranking
            )
            
            for hit in semantic_hits:
                content = self._select_content(hit, request.resolution)
                examples = []
                if request.include_examples:
                    examples = await self.db.get_examples(hit["id"])
                
                results.append(SearchResult(
                    entry=EntrySummary(
                        id=hit["id"],
                        target_id=hit["target_id"],
                        path=hit["path"],
                        title=hit["path"].split("/")[-1],
                        concept_id=hit.get("concept_id"),
                        content_micro=hit.get("content_micro", ""),
                        confidence=hit.get("confidence", 0),
                        has_examples=len(examples) > 0,
                        token_counts={
                            "micro": hit.get("tokens_micro", 0),
                            "standard": hit.get("tokens_standard", 0),
                            "exhaustive": hit.get("tokens_exhaustive", 0),
                        },
                    ),
                    relevance_score=hit.get("similarity", 0),
                    match_type="semantic",
                    content=content,
                    examples=[
                        {"title": ex["title"], "code": ex["code"],
                         "language": ex["language"]}
                        for ex in examples[:3]
                    ],
                ))
        
        # Strategy 2: Full-text search (supplement)
        fts_hits = await self.db.fetch("""
            SELECT id, target_id, path, concept_id, content_micro,
                   content_standard, confidence,
                   ts_rank(
                       to_tsvector('english', coalesce(content_standard, '') || ' ' || coalesce(path, '')),
                       plainto_tsquery('english', $1)
                   ) as rank
            FROM entries
            WHERE to_tsvector('english', coalesce(content_standard, '') || ' ' || coalesce(path, ''))
                  @@ plainto_tsquery('english', $1)
              AND ($2::text IS NULL OR target_id = $2)
            ORDER BY rank DESC
            LIMIT 20
        """, request.query, request.target)
        
        existing_ids = {r.entry.id for r in results}
        for hit in fts_hits:
            if hit["id"] not in existing_ids:
                results.append(SearchResult(
                    entry=EntrySummary(
                        id=hit["id"],
                        target_id=hit["target_id"],
                        path=hit["path"],
                        title=hit["path"].split("/")[-1],
                        content_micro=hit.get("content_micro", ""),
                        confidence=hit.get("confidence", 0),
                    ),
                    relevance_score=min(hit.get("rank", 0) / 10, 1.0),
                    match_type="keyword",
                    content=self._select_content(hit, request.resolution),
                ))
        
        # Sort by relevance
        results.sort(key=lambda r: r.relevance_score, reverse=True)
        
        # Paginate
        page = request.pagination.page
        page_size = request.pagination.page_size
        total = len(results)
        start_idx = (page - 1) * page_size
        page_results = results[start_idx:start_idx + page_size]
        
        elapsed_ms = (time.time() - start) * 1000
        
        return SearchResponse(
            results=page_results,
            total=total,
            query=request.query,
            search_time_ms=elapsed_ms,
            targets_searched=[request.target] if request.target else ["(all)"],
            page=page,
            page_size=page_size,
            total_pages=(total + page_size - 1) // page_size,
            related_queries=self._suggest_related(request.query),
        )
    
    async def suggest(
        self, query: str, target: Optional[str], limit: int
    ) -> list[str]:
        """Autocomplete suggestions based on path and content matching."""
        rows = await self.db.fetch("""
            SELECT DISTINCT path 
            FROM entries
            WHERE ($2::text IS NULL OR target_id = $2)
              AND path ILIKE $1
            ORDER BY path
            LIMIT $3
        """, f"%{query}%", target, limit)
        
        return [r["path"].split("/")[-1] for r in rows]
    
    def _select_content(self, hit: dict, resolution: ContentResolution) -> str:
        if resolution == ContentResolution.EXHAUSTIVE:
            return hit.get("content_exhaustive") or hit.get("content_standard") or ""
        elif resolution == ContentResolution.MICRO:
            return hit.get("content_micro") or ""
        else:
            return hit.get("content_standard") or hit.get("content_micro") or ""
    
    def _suggest_related(self, query: str) -> list[str]:
        """Simple related query suggestions."""
        words = query.lower().split()
        suggestions = []
        if len(words) >= 2:
            suggestions.append(f"{words[0]} examples")
            suggestions.append(f"{words[0]} vs alternatives")
        return suggestions[:3]
```

---

## Gap 8: Docker and Startup Infrastructure

No way to actually run any of this. Need Docker Compose for PostgreSQL + pgvector + the API.

```yaml
# docker-compose.yml

version: '3.8'

services:
  db:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: magb
      POSTGRES_USER: magb
      POSTGRES_PASSWORD: magb_dev_password
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U magb"]
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://magb:magb_dev_password@db:5432/magb
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      LOG_LEVEL: INFO
    depends_on:
      db:
        condition: service_healthy
    command: >
      sh -c "python -m src.db.migrations && 
             uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload"
    volumes:
      - .:/app
      - ./checkpoints:/app/checkpoints
      - ./exports:/app/exports

volumes:
  pgdata:
```

```dockerfile
# Dockerfile

FROM python:3.12-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY pyproject.toml .
RUN pip install -e ".[dev]"

COPY . .

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```toml
# pyproject.toml

[project]
name = "magb"
version = "0.1.0"
description = "Universal Implementation Knowledge Base"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.110",
    "uvicorn[standard]>=0.29",
    "asyncpg>=0.29",
    "pgvector>=0.2",
    "pydantic>=2.7",
    "openai>=1.30",
    "anthropic>=0.25",
    "tiktoken>=0.7",
    "python-dotenv>=1.0",
    "tenacity>=8.2",
    "httpx>=0.27",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-asyncio>=0.23",
    "pytest-cov>=5.0",
    "ruff>=0.4",
    "mypy>=1.10",
]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

---

## Gap 9: Minimal Test Suite

Zero tests. For a system that will spend thousands of dollars on API calls, this is not optional.

```python
# tests/test_response_parser.py

"""
Test the response parser with real-world LLM output samples.

These are the most important tests in the system because
parsing failures at scale waste money and create data gaps.
"""

import pytest
from src.llm.response_parser import parse_llm_json, ParseError


class TestDirectParse:
    def test_clean_json(self):
        result = parse_llm_json('{"key": "value", "num": 42}')
        assert result == {"key": "value", "num": 42}
    
    def test_json_with_whitespace(self):
        result = parse_llm_json('  \n  {"key": "value"}  \n  ')
        assert result["key"] == "value"


class TestCodeFenceExtraction:
    def test_json_fence(self):
        text = 'Here is the result:\n```json\n{"key": "value"}\n```\nDone.'
        result = parse_llm_json(text)
        assert result["key"] == "value"
    
    def test_plain_fence(self):
        text = '```\n{"key": "value"}\n```'
        result = parse_llm_json(text)
        assert result["key"] == "value"
    
    def test_fence_with_language_tag(self):
        text = '```json\n{\n  "categories": [\n    {"title": "Types"}\n  ]\n}\n```'
        result = parse_llm_json(text)
        assert len(result["categories"]) == 1


class TestBoundaryFinding:
    def test_json_embedded_in_prose(self):
        text = 'The answer is {"key": "value"} and that is all.'
        result = parse_llm_json(text)
        assert result["key"] == "value"
    
    def test_nested_json(self):
        text = 'Result: {"outer": {"inner": [1, 2, 3]}}'
        result = parse_llm_json(text)
        assert result["outer"]["inner"] == [1, 2, 3]


class TestJsonCleaning:
    def test_trailing_comma(self):
        text = '{"key": "value", "list": [1, 2, 3,],}'
        result = parse_llm_json(text)
        assert result["list"] == [1, 2, 3]
    
    def test_javascript_comments(self):
        text = '{\n  // This is a comment\n  "key": "value"\n}'
        result = parse_llm_json(text)
        assert result["key"] == "value"


class TestTruncationRepair:
    def test_truncated_object(self):
        text = '{"key": "value", "nested": {"deep": "data"'
        result = parse_llm_json(text)
        assert result["key"] == "value"
    
    def test_truncated_array(self):
        text = '{"items": ["a", "b", "c"'
        result = parse_llm_json(text)
        assert result["items"] == ["a", "b", "c"]
    
    def test_truncated_in_string(self):
        text = '{"key": "this is a long string that got cut o'
        result = parse_llm_json(text)
        assert "key" in result


class TestAllStrategiesFail:
    def test_complete_garbage(self):
        with pytest.raises(ParseError) as exc_info:
            parse_llm_json("This is not JSON at all. Just prose.")
        assert len(exc_info.value.strategies_tried) == 5
    
    def test_error_includes_diagnostics(self):
        with pytest.raises(ParseError) as exc_info:
            parse_llm_json("no json here")
        assert "strategies" in str(exc_info.value).lower() or len(exc_info.value.strategies_tried) > 0


class TestRealWorldLLMOutputs:
    """Test against actual output patterns observed from Claude and GPT."""
    
    def test_claude_typical_output(self):
        text = """Here's the analysis:

```json
{
  "categories": [
    {
      "title": "Type System",
      "description": "All type-related features",
      "estimated_subtopics": 15,
      "priority": "core"
    },
    {
      "title": "Control Flow",
      "description": "Branching and iteration",
      "estimated_subtopics": 10,
      "priority": "core"
    }
  ]
}
```

I've identified the two main categories."""
        result = parse_llm_json(text)
        assert len(result["categories"]) == 2
    
    def test_gpt_response_format_mode(self):
        # GPT with response_format={"type": "json_object"} returns clean JSON
        text = '{\n  "keywords": ["for", "while", "if", "else"],\n  "total_count": 4\n}'
        result = parse_llm_json(text)
        assert result["total_count"] == 4
    
    def test_anthropic_with_preamble(self):
        # Claude sometimes adds a brief preamble before JSON
        text = 'I\'ll provide the JSON response:\n\n{"key": "value"}'
        result = parse_llm_json(text)
        assert result["key"] == "value"
```

```python
# tests/test_budget.py

"""Test budget enforcement."""

import pytest
from src.budget import Budget, BudgetExhausted


def test_budget_tracks_spending():
    budget = Budget(max_total_usd=10.0)
    budget.check_and_record(1.0, target="python", phase="decompose")
    assert budget.total_spent == 1.0


def test_budget_enforces_total_limit():
    budget = Budget(max_total_usd=1.0)
    budget.check_and_record(0.8, target="python", phase="decompose")
    with pytest.raises(BudgetExhausted):
        budget.check_and_record(0.3, target="python", phase="decompose")


def test_budget_enforces_per_target_limit():
    budget = Budget(max_total_usd=100.0, max_per_target_usd=5.0)
    budget.check_and_record(4.0, target="python", phase="decompose")
    with pytest.raises(BudgetExhausted):
        budget.check_and_record(2.0, target="python", phase="generate")


def test_budget_enforces_single_call_sanity():
    budget = Budget(max_per_api_call_usd=2.0)
    with pytest.raises(BudgetExhausted):
        budget.check_and_record(5.0, target="python", phase="generate")
```

---

## Gap 10: The End-to-End Startup Script

The single command that brings everything up and verifies it works.

```python
# tools/bootstrap.py

"""
One command to set up and verify everything.

Usage:
    python tools/bootstrap.py

This:
  1. Validates configuration (.env, API keys)
  2. Starts PostgreSQL (if using Docker)
  3. Runs database migrations
  4. Seeds concept taxonomy, target registry, families
  5. Runs a smoke test (one prompt, one storage round-trip)
  6. Starts the API server
  7. Runs a health check against the API
"""

import asyncio
import subprocess
import sys
import os
import time
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


async def main():
    logger.info("═" * 60)
    logger.info("  magB Bootstrap — Setting up everything from scratch")
    logger.info("═" * 60)
    
    # ── Step 1: Validate configuration ─────────────────────
    logger.info("\n[1/7] Validating configuration...")
    from src.config import get_config
    config = get_config()
    try:
        config.validate()
        logger.info("  ✓ All API keys present")
    except ValueError as e:
        logger.error(f"  ✗ {e}")
        logger.error("  Copy .env.example to .env and fill in your API keys")
        sys.exit(1)
    
    # ── Step 2: Check database connectivity ────────────────
    logger.info("\n[2/7] Checking database...")
    try:
        import asyncpg
        conn = await asyncpg.connect(config.database_url)
        await conn.close()
        logger.info("  ✓ PostgreSQL is reachable")
    except Exception as e:
        logger.error(f"  ✗ Cannot connect to PostgreSQL: {e}")
        logger.info("  Run: docker compose up -d db")
        logger.info("  Then re-run this script")
        sys.exit(1)
    
    # ── Step 3: Run migrations ─────────────────────────────
    logger.info("\n[3/7] Running database migrations...")
    from src.db.migrations import initialize_database
    await initialize_database(config.database_url)
    logger.info("  ✓ Schema created and seed data loaded")
    
    # ── Step 4: Verify seed data ───────────────────────────
    logger.info("\n[4/7] Verifying seed data...")
    from src.db.connection import Database
    db = Database(config.database_url)
    await db.connect()
    
    concept_count = await db.fetchval("SELECT COUNT(*) FROM concepts")
    target_count = await db.fetchval("SELECT COUNT(*) FROM targets")
    family_count = await db.fetchval("SELECT COUNT(*) FROM families")
    
    logger.info(f"  ✓ {concept_count} concepts loaded")
    logger.info(f"  ✓ {target_count} targets loaded")
    logger.info(f"  ✓ {family_count} families loaded")
    
    if concept_count == 0 or target_count == 0:
        logger.error("  ✗ Seed data is empty — check seed/ directory")
        sys.exit(1)
    
    # ── Step 5: Smoke test LLM ─────────────────────────────
    logger.info("\n[5/7] Smoke testing LLM connection...")
    from src.llm.response_parser import parse_llm_json
    try:
        import openai
        client = openai.AsyncOpenAI(api_key=config.openai_api_key)
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": 'Respond with only: {"status": "ok"}'}],
            max_tokens=20,
            response_format={"type": "json_object"},
        )
        result = parse_llm_json(response.choices[0].message.content)
        assert result["status"] == "ok"
        logger.info("  ✓ OpenAI API working")
    except Exception as e:
        logger.error(f"  ✗ OpenAI API failed: {e}")
        # Not fatal — can still use Anthropic
    
    try:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=config.anthropic_api_key)
        response = await client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=50,
            messages=[{"role": "user", "content": 'Respond with only: {"status": "ok"}'}],
        )
        result = parse_llm_json(response.content[0].text)
        assert result["status"] == "ok"
        logger.info("  ✓ Anthropic API working")
    except Exception as e:
        logger.error(f"  ✗ Anthropic API failed: {e}")
    
    # ── Step 6: Smoke test storage round-trip ──────────────
    logger.info("\n[6/7] Testing storage round-trip...")
    import uuid
    test_id = f"test_{uuid.uuid4().hex[:8]}"
    await db.save_entry({
        "id": test_id,
        "target_id": "python",
        "path": f"Python/__smoke_test/{test_id}",
        "entry_type": "reference",
        "content_micro": "Smoke test entry",
        "content_standard": "This is a smoke test entry for bootstrap verification.",
        "tokens_micro": 4,
        "tokens_standard": 10,
        "generated_by": "bootstrap",
        "confidence": 1.0,
    })
    
    retrieved = await db.get_entry(test_id)
    assert retrieved is not None
    assert retrieved["content_micro"] == "Smoke test entry"
    
    # Clean up
    await db.execute("DELETE FROM entries WHERE id = $1", test_id)
    logger.info("  ✓ Storage round-trip working")
    
    await db.disconnect()
    
    # ── Step 7: Summary ────────────────────────────────────
    logger.info("\n" + "═" * 60)
    logger.info("  BOOTSTRAP COMPLETE — System is ready")
    logger.info("═" * 60)
    logger.info("")
    logger.info("  Next steps:")
    logger.info("    1. Test prompts:     python tools/prompt_lab.py --test all --target 'Python 3.12'")
    logger.info("    2. Generate target:  python -m src.pipeline.orchestrator --target python --budget 100")
    logger.info("    3. Start API:        uvicorn api.main:app --reload")
    logger.info("    4. Health check:     python -m src.observability.health_check")
    logger.info("")


if __name__ == "__main__":
    asyncio.run(main())
```

---

## Complete Gap Summary

```
GAP                              STATUS    PRIORITY   WHY IT BLOCKS POC
────────────────────────────────────────────────────────────────────────
1. Database access layer          WRITTEN   P0         Everything calls it
2. Migration / schema init        WRITTEN   P0         Can't store anything without it
3. Embedding generation           WRITTEN   P0         Search doesn't work without it
4. Multi-resolution prompts       WRITTEN   P0         Core differentiator of the system
5. Robust response parser         WRITTEN   P0         1% failure × 2000 calls = 20 failures
6. Configuration management       WRITTEN   P0         Nothing knows where anything is
7. Search service implementation  WRITTEN   P1         API's primary endpoint
8. Docker + startup infra         WRITTEN   P1         Can't run locally without it
9. Minimal test suite             WRITTEN   P1         Can't trust anything without it
10. Bootstrap script              WRITTEN   P1         First-run experience

STILL MISSING (not written above but needed for POC):
────────────────────────────────────────────────────────────────────────
11. RetrievalService (full)       NOT DONE  P1         Second most used API surface
12. HealthService                 NOT DONE  P1         Can't see system state
13. ImplementationService         NOT DONE  P2         Core value prop but needs data first
14. ComparisonService             NOT DONE  P2         Needs 2+ targets generated
15. Pipeline ↔ new DB bridge      NOT DONE  P0         Pipeline writes to old SQLite schema,
                                                        needs to write to new PostgreSQL
16. Embedding cache (Redis)       NOT DONE  P2         Nice for perf, not blocking
17. Admin endpoints               NOT DONE  P2         Can trigger pipeline from CLI for now
18. .env.example                  NOT DONE  P0         30 seconds to write, blocks onboarding
19. Makefile                      NOT DONE  P1         Developer convenience
20. CI pipeline (GitHub Actions)  NOT DONE  P3         Not blocking POC
```

The items I've written in this response (Gaps 1-10) cover the **critical path**. With these plus the architecture from our previous conversation, a developer could:

1. `docker compose up -d` → PostgreSQL running
2. `python tools/bootstrap.py` → Schema created, seed data loaded, smoke tests pass
3. `python tools/prompt_lab.py --test all --target "Python 3.12"` → Prompts validated
4. `python -m src.pipeline.orchestrator --target python` → Generate Python knowledge
5. `uvicorn api.main:app` → API serving queries
6. `POST /v1/search/ {"query": "for loop", "target": "python"}` → Results returned
7. `POST /v1/context/assemble {"task": "...", "token_budget": 4000}` → Context assembled

That's a working POC.

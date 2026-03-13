

# The Knowledge Base API — Complete Architecture

## Who Uses This API and How

Before writing a single endpoint, let's understand the actual usage patterns. There are three fundamentally different consumers, and they need fundamentally different things from the same data:

```
CONSUMER 1: A DEVELOPER
────────────────────────
"I need to generate PPTX files from my Python app.
 How do shapes work? Show me code."

They think in TASKS. They arrive with a goal, not a query.
They want answers, not data. They want code they can copy.
They browse, drill down, and cross-reference.
They need progressive disclosure — overview first, details on demand.


CONSUMER 2: AN AI AGENT (coding assistant, copilot)
────────────────────────────────────────────────────
"The user asked me to write a function that creates a
 PowerPoint slide with a chart. I need to assemble the right
 knowledge into my context window to generate correct code."

It thinks in CONTEXT WINDOWS. It has 128K tokens but needs to
spend them wisely. It needs to pull exactly the right knowledge
at exactly the right resolution — not too much, not too little.
It needs structured data it can reason over, not prose to read.
It makes multiple rapid queries as it works through a problem.


CONSUMER 3: THE SYSTEM ITSELF (immune system, sensors, pipeline)
────────────────────────────────────────────────────────────────
"I need to check which Python entries were affected by the 3.13
 release, find all entries with confidence below 0.7, and queue
 them for regeneration."

It thinks in BULK OPERATIONS. It needs administrative queries,
batch updates, and pipeline triggers. It doesn't need pretty
formatting — it needs raw data and write access.
```

The API must serve all three elegantly. Here's how:

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                          API GATEWAY                                 │
│                                                                      │
│   /v1/search/*        ─── Find knowledge                            │
│   /v1/retrieve/*      ─── Get specific entries                      │
│   /v1/explore/*       ─── Browse and navigate                       │
│   /v1/implement/*     ─── Get implementation plans + code           │
│   /v1/compare/*       ─── Cross-target analysis                     │
│   /v1/context/*       ─── AI-optimized context assembly             │
│   /v1/graph/*         ─── Relationship traversal                    │
│   /v1/health/*        ─── Observability + status                    │
│   /v1/admin/*         ─── Pipeline, regeneration, maintenance       │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Complete Project Structure

```
api/
├── main.py                    # FastAPI application factory
├── config.py                  # API configuration
├── dependencies.py            # Dependency injection
├── middleware.py              # Auth, rate limiting, logging
├── models/                    # Request/response models
│   ├── __init__.py
│   ├── common.py              # Shared models (pagination, errors)
│   ├── search.py              # Search request/response models
│   ├── retrieve.py            # Retrieval models
│   ├── explore.py             # Browse/navigate models
│   ├── implement.py           # Implementation plan models
│   ├── compare.py             # Comparison models
│   ├── context.py             # AI context assembly models
│   ├── graph.py               # Graph traversal models
│   └── health.py              # Health/observability models
├── routers/                   # Route handlers
│   ├── __init__.py
│   ├── search.py
│   ├── retrieve.py
│   ├── explore.py
│   ├── implement.py
│   ├── compare.py
│   ├── context.py
│   ├── graph.py
│   ├── health.py
│   └── admin.py
├── services/                  # Business logic
│   ├── __init__.py
│   ├── search_service.py
│   ├── retrieval_service.py
│   ├── implementation_service.py
│   ├── comparison_service.py
│   ├── context_service.py     # The most important service
│   ├── graph_service.py
│   └── health_service.py
├── db/                        # Database access
│   ├── __init__.py
│   ├── connection.py
│   ├── queries.py             # Raw SQL queries
│   └── cache.py               # Redis/in-memory cache
└── llm/                       # LLM integration for adaptive responses
    ├── __init__.py
    └── adaptive.py            # LLM calls for plan adaptation
```

---

## Models — The API's Data Contracts

```python
# api/models/common.py

"""
Shared models used across all endpoints.
These define the language of the API.
"""

from __future__ import annotations
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal, Any
from enum import Enum
from datetime import datetime


# ══════════════════════════════════════════════════════════════
# ENUMS
# ══════════════════════════════════════════════════════════════

class ContentResolution(str, Enum):
    """How much detail to return."""
    MICRO = "micro"           # ~50 tokens — titles and one-liners
    STANDARD = "standard"     # ~500 tokens — normal reference
    EXHAUSTIVE = "exhaustive" # ~2000 tokens — everything
    AUTO = "auto"             # let the API decide based on context


class TargetType(str, Enum):
    PROGRAMMING_LANGUAGE = "programming_language"
    MARKUP_LANGUAGE = "markup_language"
    QUERY_LANGUAGE = "query_language"
    FILE_FORMAT = "file_format"
    DATA_FORMAT = "data_format"
    CONFIG_FORMAT = "config_format"
    PROTOCOL = "protocol"
    TOOL = "tool"


class KnowledgeLayer(str, Enum):
    REFERENCE = "reference"             # Layer 1: what it does
    ATOMS = "atoms"                     # Layer 2: structural building blocks
    IMPLEMENTATION = "implementation"   # Layer 3: how to build with it
    ALL = "all"


class SortField(str, Enum):
    RELEVANCE = "relevance"
    PATH = "path"
    CONFIDENCE = "confidence"
    FRESHNESS = "freshness"
    DEPTH = "depth"
    NAME = "name"


class SortOrder(str, Enum):
    ASC = "asc"
    DESC = "desc"


# ══════════════════════════════════════════════════════════════
# PAGINATION
# ══════════════════════════════════════════════════════════════

class PaginationParams(BaseModel):
    """Standard pagination for list endpoints."""
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    sort_by: SortField = SortField.RELEVANCE
    sort_order: SortOrder = SortOrder.DESC


class PaginatedResponse(BaseModel):
    """Wrapper for paginated results."""
    items: list[Any]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_previous: bool


# ══════════════════════════════════════════════════════════════
# COMMON RESPONSE FRAGMENTS
# ══════════════════════════════════════════════════════════════

class TargetSummary(BaseModel):
    """Lightweight target reference used in many responses."""
    id: str
    name: str
    type: TargetType
    latest_version: Optional[str] = None
    family_ids: list[str] = []


class ConceptSummary(BaseModel):
    """Lightweight concept reference."""
    id: str
    name: str
    domain: str
    description: str = ""


class EntrySummary(BaseModel):
    """Lightweight entry reference for listings."""
    id: str
    target_id: str
    path: str
    title: str
    concept_id: Optional[str] = None
    content_micro: str = ""
    confidence: float = 0.0
    freshness: float = 0.0
    has_examples: bool = False
    has_atoms: bool = False
    has_implementation: bool = False
    token_counts: dict[str, int] = {}


class EntryFull(BaseModel):
    """Complete entry with all content."""
    id: str
    target_id: str
    path: str
    title: str
    concept_id: Optional[str] = None
    concept: Optional[ConceptSummary] = None

    # Multi-resolution content
    content_micro: Optional[str] = None
    content_standard: Optional[str] = None
    content_exhaustive: Optional[str] = None

    # Structured fields
    syntax: Optional[str] = None
    parameters: list[dict] = []
    return_value: Optional[str] = None
    edge_cases: list[str] = []
    common_mistakes: list[str] = []

    # Related
    examples: list[dict] = []
    related_entries: list[EntrySummary] = []

    # Versioning
    introduced_in: Optional[str] = None
    removed_in: Optional[str] = None
    deprecated: bool = False

    # Metadata
    confidence: float = 0.0
    freshness: float = 0.0
    generated_at: Optional[datetime] = None
    token_counts: dict[str, int] = {}


class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str
    code: str
    detail: Optional[str] = None
    suggestions: list[str] = []


class TokenBudgetInfo(BaseModel):
    """Reports how many tokens were used from the budget."""
    tokens_used: int
    tokens_budget: int
    tokens_remaining: int
    resolution_choices: dict[str, str] = {}  # entry_id → resolution used
```

```python
# api/models/search.py

"""
Search request and response models.
"""

from pydantic import BaseModel, Field
from typing import Optional
from .common import (
    ContentResolution, TargetType, KnowledgeLayer,
    PaginationParams, EntrySummary, ConceptSummary
)


class SearchRequest(BaseModel):
    """
    Universal search across the knowledge base.
    
    Examples:
      {"query": "how to iterate over a list", "target": "python"}
      {"query": "gaussian blur algorithm"}
      {"query": "XML namespaces in PPTX shapes", "layer": "atoms"}
    """
    query: str = Field(..., min_length=2, max_length=500,
                       description="Natural language search query")
    
    # Filters
    target: Optional[str] = Field(None,
        description="Restrict to one target (e.g., 'python', 'pptx')")
    target_type: Optional[TargetType] = Field(None,
        description="Restrict to target type (e.g., 'programming_language')")
    layer: KnowledgeLayer = Field(KnowledgeLayer.ALL,
        description="Which knowledge layer to search")
    concept_id: Optional[str] = Field(None,
        description="Restrict to entries under a specific concept")
    version: Optional[str] = Field(None,
        description="Restrict to a specific version (e.g., '3.12')")
    min_confidence: float = Field(0.0, ge=0.0, le=1.0,
        description="Minimum confidence score")
    
    # Response control
    resolution: ContentResolution = Field(ContentResolution.STANDARD,
        description="How much content to return per result")
    include_examples: bool = Field(True,
        description="Include code examples in results")
    include_related: bool = Field(False,
        description="Include related entries")
    
    # Pagination
    pagination: PaginationParams = Field(default_factory=PaginationParams)


class SearchResult(BaseModel):
    """One search result."""
    entry: EntrySummary
    relevance_score: float = Field(..., ge=0.0, le=1.0)
    match_type: str = ""    # "semantic", "keyword", "exact_path"
    highlights: list[str] = []  # text snippets with matches highlighted
    
    # Content at requested resolution
    content: Optional[str] = None
    examples: list[dict] = []


class SearchResponse(BaseModel):
    """Search results with metadata."""
    results: list[SearchResult]
    total: int
    query: str
    
    # Search metadata
    search_time_ms: float
    targets_searched: list[str]
    
    # Suggestions
    did_you_mean: Optional[str] = None
    related_queries: list[str] = []
    
    # If no results, suggest what to do
    no_results_suggestions: list[str] = []
    
    # Pagination
    page: int
    page_size: int
    total_pages: int
```

```python
# api/models/implement.py

"""
Implementation planning models.
The highest-value part of the API.
"""

from pydantic import BaseModel, Field
from typing import Optional
from .common import ContentResolution, TokenBudgetInfo


class ImplementRequest(BaseModel):
    """
    "How do I implement X?"
    
    The user describes what they want to build, and the API returns
    a complete implementation plan with code.
    
    Examples:
      {
        "goal": "Create a PPTX file with a blue rectangle at position (2,1) inches",
        "target": "pptx",
        "language": "python"
      }
      {
        "goal": "Implement Gaussian blur filter for images",
        "target": "image_editor",
        "language": "rust",
        "include_optimizations": true
      }
      {
        "goal": "Parse and validate a PDF file structure",
        "target": "pdf",
        "language": "python"
      }
    """
    goal: str = Field(..., min_length=10, max_length=2000,
        description="Natural language description of what to implement")
    target: str = Field(...,
        description="Target format or tool (e.g., 'pptx', 'pdf', 'image_editor')")
    language: str = Field("python",
        description="Programming language for generated code")
    
    # Detail control
    include_atoms: bool = Field(True,
        description="Include raw format atoms (XML elements, binary fields)")
    include_algorithms: bool = Field(True,
        description="Include algorithm specifications")
    include_code: bool = Field(True,
        description="Generate complete working code")
    include_optimizations: bool = Field(False,
        description="Include performance optimizations")
    include_tests: bool = Field(False,
        description="Include test code")
    include_alternatives: bool = Field(False,
        description="Include alternative approaches")
    
    # LLM adaptation
    adapt_to_goal: bool = Field(True,
        description="Use LLM to adapt generic specs to the specific goal")
    
    # Budget
    max_tokens: Optional[int] = Field(None,
        description="Maximum response size in tokens")


class ImplementationStep(BaseModel):
    """One step in the implementation plan."""
    order: int
    title: str
    description: str
    
    # What knowledge this step uses
    capability_id: Optional[str] = None
    capability_name: Optional[str] = None
    algorithm_id: Optional[str] = None
    algorithm_name: Optional[str] = None
    atom_ids: list[str] = []
    
    # The actual content for this step
    detailed_instructions: str = ""
    code: str = ""
    code_language: str = ""
    
    # For file formats: what files/XML to create
    file_path: Optional[str] = None
    file_content_template: Optional[str] = None
    
    # Validation
    validation: str = ""
    common_mistakes: list[str] = []


class AlgorithmSpec(BaseModel):
    """Algorithm specification included in implementation plan."""
    id: str
    name: str
    category: str
    
    mathematical_formula: str = ""
    explanation: str = ""
    pseudocode: str = ""
    
    parameters: list[dict] = []
    
    reference_implementation: str = ""  # in requested language
    
    optimizations: list[dict] = []
    test_vectors: list[dict] = []


class FormatAtomSpec(BaseModel):
    """Format atom details included in implementation plan."""
    element_name: str
    namespace: str = ""
    purpose: str
    attributes: list[dict] = []
    valid_values: list[dict] = []
    example: str = ""
    parent_element: str = ""


class ImplementResponse(BaseModel):
    """
    Complete implementation plan.
    
    This is the primary value delivery of the entire system.
    """
    # ── Plan Overview ──────────────────────────────────
    plan_title: str
    summary: str
    feasibility: str = "fully_possible"  # fully_possible|partially_possible|not_possible
    missing_capabilities: list[str] = []
    estimated_complexity: str = "moderate"
    estimated_lines_of_code: Optional[int] = None
    
    # ── Prerequisites ──────────────────────────────────
    prerequisites: list[str] = []
    
    # ── The Plan ───────────────────────────────────────
    steps: list[ImplementationStep]
    
    # ── Supporting Knowledge ───────────────────────────
    algorithms: list[AlgorithmSpec] = []
    format_atoms: list[FormatAtomSpec] = []
    coordinate_systems: list[dict] = []
    enum_definitions: list[dict] = []
    namespace_registry: list[dict] = []
    
    # ── Complete Code ──────────────────────────────────
    complete_code: dict[str, str] = {}
    # {"main.py": "full code...", "helpers.py": "full code..."}
    
    dependencies: list[str] = []
    run_command: str = ""
    expected_output: str = ""
    
    # ── Validation ─────────────────────────────────────
    validation_method: str = ""
    programmatic_tests: list[dict] = []
    
    # ── Alternatives ───────────────────────────────────
    alternative_approaches: list[dict] = []
    
    # ── Metadata ───────────────────────────────────────
    capabilities_used: list[str] = []   # capability IDs referenced
    algorithms_used: list[str] = []     # algorithm IDs referenced
    confidence: float = 0.0
    knowledge_freshness: float = 0.0    # how fresh is the underlying data
    token_budget: Optional[TokenBudgetInfo] = None
```

```python
# api/models/context.py

"""
AI-optimized context assembly models.

This is the most architecturally significant part of the API.
It's designed for AI agents that need to build optimal context
windows from the knowledge base.
"""

from pydantic import BaseModel, Field
from typing import Optional
from .common import ContentResolution


class ContextRequest(BaseModel):
    """
    Request an optimally-assembled context window from the knowledge base.
    
    The AI agent specifies:
      1. What it's trying to do (the task)
      2. How many tokens it can spend (the budget)
      3. What it already knows (to avoid redundancy)
    
    The API returns the best possible knowledge assembly
    within the token budget.
    
    Examples:
      {
        "task": "Write a Python function that reads a PPTX file and extracts all shapes with their positions",
        "token_budget": 4000,
        "targets": ["python", "pptx"],
        "already_know": ["python basics", "ZIP file handling"]
      }
      {
        "task": "Explain the difference between async/await in Python vs Rust",
        "token_budget": 3000,
        "targets": ["python", "rust"],
        "focus_concepts": ["concurrency.async"]
      }
    """
    task: str = Field(..., min_length=10, max_length=2000,
        description="What the AI is trying to accomplish")
    
    token_budget: int = Field(4000, ge=100, le=100000,
        description="Maximum tokens for the assembled context")
    
    # Scope
    targets: list[str] = Field(default_factory=list,
        description="Target languages/formats to pull knowledge from")
    focus_concepts: list[str] = Field(default_factory=list,
        description="Concept IDs to prioritize")
    layers: list[str] = Field(default_factory=lambda: ["reference", "implementation"],
        description="Knowledge layers to include")
    
    # Optimization hints
    already_know: list[str] = Field(default_factory=list,
        description="Topics the AI already has context for (will be deprioritized)")
    prefer_code: bool = Field(False,
        description="Bias toward code examples over prose")
    prefer_exhaustive: bool = Field(False,
        description="Prefer fewer entries at higher resolution")
    
    # Format
    format: str = Field("structured",
        description="'structured' (JSON) or 'prose' (readable text) or 'xml' (tagged sections)")
    include_metadata: bool = Field(True,
        description="Include confidence scores and freshness indicators")


class ContextEntry(BaseModel):
    """One knowledge entry as assembled into the context."""
    entry_id: str
    path: str
    target: str
    resolution: ContentResolution     # which resolution was selected
    relevance: float                  # how relevant to the task (0-1)
    tokens: int                       # tokens consumed
    
    # The actual content
    content: str
    
    # Optional additions
    code_examples: list[dict] = []
    
    # Metadata (if requested)
    confidence: Optional[float] = None
    freshness: Optional[float] = None
    concept: Optional[str] = None


class ContextResponse(BaseModel):
    """
    The assembled context window.
    
    Designed to be directly injected into an AI's prompt.
    """
    # ── The Assembled Context ──────────────────────────
    # This is the primary payload. It's a pre-formatted block of text
    # (or structured JSON) that the AI can directly use as context.
    assembled_context: str
    
    # ── Individual Entries (for inspection/debugging) ──
    entries: list[ContextEntry]
    
    # ── Budget Report ──────────────────────────────────
    tokens_used: int
    tokens_budget: int
    tokens_remaining: int
    entries_included: int
    entries_available: int           # how many could have been included
    entries_excluded_by_budget: int  # how many were cut for space
    
    # ── Resolution Decisions ───────────────────────────
    # Explains why each entry got the resolution it did
    resolution_strategy: str
    # e.g., "Included 3 entries at exhaustive, 8 at standard, 
    #         15 at micro to optimize within 4000-token budget"
    
    # ── Quality Indicators ─────────────────────────────
    avg_confidence: float
    avg_freshness: float
    coverage_assessment: str
    # e.g., "Good coverage of Python async. Missing: error handling 
    #         in async context. Consider adding to already_know or 
    #         increasing budget."
    
    # ── Suggestions ────────────────────────────────────
    suggested_followup_queries: list[str] = []
    # e.g., ["Get PPTX shape atom details", 
    #         "Get EMU coordinate conversion reference"]
    
    missing_knowledge: list[str] = []
    # e.g., ["No implementation atoms for chart creation in PPTX —
    #         this area has low depth score"]


class ContextBatchRequest(BaseModel):
    """
    Request multiple context assemblies at once.
    
    Useful for AI agents that are working through a multi-step problem
    and want to pre-fetch context for each step.
    """
    requests: list[ContextRequest] = Field(..., max_length=10)
    shared_budget: Optional[int] = Field(None,
        description="If set, total budget is shared across all requests")
    deduplicate: bool = Field(True,
        description="Avoid repeating the same entry across requests")
```

```python
# api/models/compare.py

"""
Cross-target comparison models.
"""

from pydantic import BaseModel, Field
from typing import Optional
from .common import ContentResolution


class CompareRequest(BaseModel):
    """
    Compare how different targets handle the same concept.
    
    Examples:
      {"concept": "error_handling", "targets": ["python", "rust", "go"]}
      {"concept": "iteration.for", "targets": ["python", "javascript"]}
      {"topic": "string formatting", "targets": ["python", "rust"]}
    """
    # Specify either concept_id or a natural language topic
    concept_id: Optional[str] = Field(None,
        description="Universal concept ID to compare")
    topic: Optional[str] = Field(None,
        description="Natural language topic to compare (if concept_id not known)")
    
    targets: list[str] = Field(..., min_length=2, max_length=10,
        description="Target IDs to compare")
    
    resolution: ContentResolution = Field(ContentResolution.STANDARD)
    include_code_examples: bool = True
    include_translation_hints: bool = Field(False,
        description="Include how to translate between targets")


class ComparisonEntry(BaseModel):
    """One target's implementation of the compared concept."""
    target_id: str
    target_name: str
    entry_id: Optional[str] = None
    path: str = ""
    
    # Content
    content: str = ""
    syntax: Optional[str] = None
    code_example: Optional[str] = None
    
    # How this target is distinctive
    distinctive_features: list[str] = []
    limitations: list[str] = []
    
    # Applicability
    has_this_concept: bool = True
    alternative_approach: Optional[str] = None  # if concept doesn't exist directly


class CompareResponse(BaseModel):
    """Side-by-side comparison of a concept across targets."""
    concept: str
    concept_description: str
    
    # The comparisons
    entries: list[ComparisonEntry]
    
    # Cross-cutting analysis
    commonalities: list[str] = []
    key_differences: list[str] = []
    
    # Translation hints
    translation_table: list[dict] = []
    # [{"python": "try/except", "rust": "Result<T,E> + ? operator", 
    #   "go": "if err != nil", "note": "fundamentally different approaches"}]
    
    # Recommendation
    recommendation: Optional[str] = None
    # e.g., "For error handling, Rust's approach is most explicit but 
    #         has the steepest learning curve"


class TranslateRequest(BaseModel):
    """
    Translate a concept or code pattern from one target to another.
    
    Examples:
      {"from_target": "python", "to_target": "rust", 
       "code": "for x in my_list:\\n    print(x)"}
      {"from_target": "python", "to_target": "go",
       "concept": "list comprehension"}
    """
    from_target: str
    to_target: str
    code: Optional[str] = Field(None, description="Code to translate")
    concept: Optional[str] = Field(None, description="Concept to translate")
    
    idiomatic: bool = Field(True,
        description="Produce idiomatic code in the target, not literal translation")


class TranslateResponse(BaseModel):
    translated_code: Optional[str] = None
    explanation: str = ""
    
    # What concepts were mapped
    concept_mappings: list[dict] = []
    # [{"source_concept": "list comprehension",
    #   "target_concept": "range + append",
    #   "note": "Go has no comprehension syntax"}]
    
    # Gotchas
    semantic_differences: list[str] = []
    # ["Python's for loop uses iterator protocol; Go's range creates a copy"]
    
    # Confidence
    confidence: float = 0.0
```

```python
# api/models/explore.py

"""
Browse and navigate the knowledge base.
"""

from pydantic import BaseModel, Field
from typing import Optional
from .common import (
    TargetSummary, ConceptSummary, EntrySummary,
    PaginationParams, ContentResolution
)


class TargetListResponse(BaseModel):
    """List of all available targets."""
    targets: list[TargetSummary]
    total: int
    
    # Grouped by type
    by_type: dict[str, list[TargetSummary]] = {}


class TargetDetailResponse(BaseModel):
    """Complete information about one target."""
    id: str
    name: str
    type: str
    latest_version: Optional[str] = None
    families: list[str] = []
    similar_to: list[TargetSummary] = []
    
    # Traits
    traits: dict = {}
    distinguishing_features: list[str] = []
    
    # Versions
    versions: list[dict] = []
    
    # Statistics
    stats: dict = {}
    # {"total_entries": 1500, "total_examples": 4200,
    #  "total_atoms": 800, "total_capabilities": 150,
    #  "total_algorithms": 45, "total_blueprints": 12}
    
    # Health
    health: dict = {}
    # {"coverage": 0.91, "accuracy": 0.95, "freshness": 0.78,
    #  "depth": 0.68, "coherence": 0.94, "overall": 0.85}
    
    # Top-level topic tree (first 2 levels)
    topic_tree: list[dict] = []


class TopicTreeResponse(BaseModel):
    """
    Hierarchical topic tree for a target.
    Like a table of contents.
    """
    target_id: str
    
    # Tree nodes
    nodes: list[dict] = []
    # [{"id": "...", "title": "Control Flow", "path": "Python/Control Flow",
    #   "depth": 1, "children_count": 8, "entry_count": 45,
    #   "children": [
    #     {"id": "...", "title": "For Loop", "path": "Python/Control Flow/For Loop",
    #      "depth": 2, "is_leaf": true, "has_content": true}
    #   ]}]
    
    # How deep to expand (controllable by caller)
    expanded_depth: int = 2
    total_nodes: int = 0
    total_leaves: int = 0


class ConceptTreeResponse(BaseModel):
    """
    Universal concept taxonomy.
    Shows all concepts organized by domain.
    """
    domains: list[dict] = []
    # [{"domain": "control_flow", "concepts": [
    #     {"id": "iteration.for", "name": "For Loop", 
    #      "target_count": 47, "children": [...]}
    # ]}]
    total_concepts: int = 0


class EntryNeighborsResponse(BaseModel):
    """
    Everything related to a specific entry.
    Used when the user is "drilling down" from a search result.
    """
    entry: dict                         # the full entry
    
    parent: Optional[EntrySummary] = None
    children: list[EntrySummary] = []
    siblings: list[EntrySummary] = []
    
    # Cross-references
    related_entries: list[dict] = []
    # [{"entry": EntrySummary, "relation": "COMMONLY_USED_WITH", 
    #   "context": "often used together for..."}]
    
    # Same concept in other targets
    same_concept_in: list[dict] = []
    # [{"target": "rust", "entry": EntrySummary, 
    #   "similarity_note": "Rust's for...in vs Python's for...in"}]
    
    # Implementation details (if Layer 2/3 exists)
    has_atoms: bool = False
    has_capabilities: bool = False
    has_algorithms: bool = False
    atom_count: int = 0
    capability_count: int = 0
```

```python
# api/models/graph.py

"""
Knowledge graph traversal models.
"""

from pydantic import BaseModel, Field
from typing import Optional


class GraphTraversalRequest(BaseModel):
    """
    Traverse the knowledge graph from a starting node.
    
    Examples:
      {"start_id": "cap_draw_rect", "relation_types": ["REQUIRES"],
       "direction": "outgoing", "max_depth": 3}
      {"start_id": "python_async_await", "relation_types": ["ANALOGOUS_IN"],
       "direction": "both"}
    """
    start_id: str = Field(..., description="Starting node ID")
    start_type: Optional[str] = Field(None,
        description="Node type if ambiguous (entry, capability, algorithm, atom)")
    
    relation_types: list[str] = Field(default_factory=list,
        description="Filter by relation types. Empty = all types.")
    direction: str = Field("both",
        description="'outgoing', 'incoming', or 'both'")
    max_depth: int = Field(3, ge=1, le=10,
        description="Maximum traversal depth")
    max_nodes: int = Field(100, ge=1, le=500,
        description="Maximum nodes to return")
    
    include_content: bool = Field(False,
        description="Include content_micro for each node")


class GraphNode(BaseModel):
    """A node in the knowledge graph."""
    id: str
    type: str            # entry, concept, capability, algorithm, atom, blueprint
    label: str           # human-readable name
    target_id: Optional[str] = None
    path: Optional[str] = None
    content_micro: Optional[str] = None
    depth: int = 0       # distance from start node


class GraphEdge(BaseModel):
    """An edge in the knowledge graph."""
    source_id: str
    target_id: str
    relation_type: str
    strength: float = 1.0
    context: Optional[str] = None
    bidirectional: bool = False


class GraphResponse(BaseModel):
    """
    Subgraph result from a traversal query.
    Can be directly rendered as a graph visualization.
    """
    start_node: GraphNode
    nodes: list[GraphNode]
    edges: list[GraphEdge]
    
    # Statistics
    total_nodes: int
    total_edges: int
    max_depth_reached: int
    truncated: bool = False  # true if max_nodes was hit


class DependencyChainRequest(BaseModel):
    """
    Get the complete dependency chain for implementing something.
    Returns everything needed, in topological order.
    """
    capability_id: str = Field(...,
        description="Capability to get dependencies for")
    include_content: bool = Field(True,
        description="Include full implementation details")


class DependencyChainResponse(BaseModel):
    """
    Everything needed to implement a capability, in order.
    """
    capability_name: str
    
    # Ordered list: implement these first → last
    implementation_order: list[dict] = []
    # [{"order": 1, "type": "capability", "id": "...", "name": "Create Container",
    #   "description": "...", "implementation": {...}},
    #  {"order": 2, "type": "algorithm", "id": "...", "name": "EMU Conversion",
    #   "formula": "...", "code": "..."}]
    
    # All atoms needed (flat list)
    required_atoms: list[dict] = []
    
    # All coordinate systems / conversions needed
    coordinate_systems: list[dict] = []
    
    # All enum definitions needed
    enum_definitions: list[dict] = []
    
    total_steps: int = 0
    estimated_complexity: str = ""
```

---

## Route Handlers

```python
# api/routers/search.py

"""
Search endpoints — the front door of the API.
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional

from api.models.search import SearchRequest, SearchResponse, SearchResult
from api.models.common import ContentResolution, KnowledgeLayer
from api.services.search_service import SearchService
from api.dependencies import get_search_service

router = APIRouter(prefix="/v1/search", tags=["Search"])


@router.post("/", response_model=SearchResponse)
async def search(
    request: SearchRequest,
    service: SearchService = Depends(get_search_service),
):
    """
    Search the knowledge base.
    
    Combines semantic search (vector similarity), keyword search (full-text),
    and structural search (path matching) for comprehensive results.
    """
    return await service.search(request)


@router.get("/quick", response_model=SearchResponse)
async def quick_search(
    q: str = Query(..., min_length=2, max_length=200,
                   description="Search query"),
    target: Optional[str] = Query(None, description="Target filter"),
    limit: int = Query(10, ge=1, le=50),
    service: SearchService = Depends(get_search_service),
):
    """
    Quick GET-based search for simple queries.
    
    GET /v1/search/quick?q=for+loop&target=python
    """
    request = SearchRequest(
        query=q,
        target=target,
        pagination={"page_size": limit},
    )
    return await service.search(request)


@router.get("/suggest", response_model=list[str])
async def search_suggestions(
    q: str = Query(..., min_length=1, max_length=100),
    target: Optional[str] = Query(None),
    limit: int = Query(5, ge=1, le=20),
    service: SearchService = Depends(get_search_service),
):
    """
    Autocomplete / typeahead suggestions.
    
    GET /v1/search/suggest?q=async&target=python
    → ["async/await", "asyncio module", "async generators", 
       "async context managers", "async iterators"]
    """
    return await service.suggest(q, target, limit)
```

```python
# api/routers/retrieve.py

"""
Direct retrieval endpoints — get specific knowledge by ID or path.
"""

from fastapi import APIRouter, Depends, Path, Query, HTTPException
from typing import Optional

from api.models.common import (
    ContentResolution, EntryFull, EntrySummary, KnowledgeLayer
)
from api.models.explore import EntryNeighborsResponse
from api.services.retrieval_service import RetrievalService
from api.dependencies import get_retrieval_service

router = APIRouter(prefix="/v1/retrieve", tags=["Retrieve"])


@router.get("/entry/{entry_id}", response_model=EntryFull)
async def get_entry(
    entry_id: str = Path(..., description="Entry ID"),
    resolution: ContentResolution = Query(ContentResolution.STANDARD),
    include_examples: bool = Query(True),
    include_related: bool = Query(True),
    service: RetrievalService = Depends(get_retrieval_service),
):
    """
    Get a single entry by ID with all its details.
    
    GET /v1/retrieve/entry/abc123?resolution=exhaustive
    """
    entry = await service.get_entry(entry_id, resolution, include_examples, include_related)
    if not entry:
        raise HTTPException(404, detail=f"Entry {entry_id} not found")
    return entry


@router.get("/path/{target_id}/{path:path}", response_model=EntryFull)
async def get_entry_by_path(
    target_id: str = Path(..., description="Target ID (e.g., 'python')"),
    path: str = Path(..., description="Entry path (e.g., 'Control Flow/For Loop')"),
    resolution: ContentResolution = Query(ContentResolution.STANDARD),
    service: RetrievalService = Depends(get_retrieval_service),
):
    """
    Get an entry by its hierarchical path.
    
    GET /v1/retrieve/path/python/Control Flow/Iteration/for loop
    """
    full_path = f"{target_id}/{path}"
    entry = await service.get_entry_by_path(target_id, full_path, resolution)
    if not entry:
        raise HTTPException(404, detail=f"No entry at path: {full_path}")
    return entry


@router.get("/entry/{entry_id}/neighbors", response_model=EntryNeighborsResponse)
async def get_entry_neighbors(
    entry_id: str = Path(...),
    service: RetrievalService = Depends(get_retrieval_service),
):
    """
    Get everything related to an entry: parent, children, siblings,
    cross-references, same concept in other targets.
    
    Used for "drill down" navigation.
    """
    return await service.get_neighbors(entry_id)


@router.get("/concept/{concept_id}/entries", response_model=list[EntrySummary])
async def get_entries_for_concept(
    concept_id: str = Path(..., description="Universal concept ID"),
    targets: Optional[str] = Query(None,
        description="Comma-separated target IDs to filter"),
    service: RetrievalService = Depends(get_retrieval_service),
):
    """
    Get all entries implementing a universal concept, optionally filtered by target.
    
    GET /v1/retrieve/concept/iteration.for/entries?targets=python,rust,go
    
    Returns the same concept as documented in each target — 
    perfect for comparison.
    """
    target_list = targets.split(",") if targets else None
    return await service.get_entries_for_concept(concept_id, target_list)


@router.post("/bulk", response_model=list[EntryFull])
async def bulk_retrieve(
    entry_ids: list[str],
    resolution: ContentResolution = Query(ContentResolution.STANDARD),
    service: RetrievalService = Depends(get_retrieval_service),
):
    """
    Retrieve multiple entries at once.
    Efficient for AI agents assembling context from known entry IDs.
    
    POST /v1/retrieve/bulk
    ["entry_001", "entry_002", "entry_003"]
    """
    return await service.bulk_retrieve(entry_ids, resolution)
```

```python
# api/routers/implement.py

"""
Implementation planning endpoints — the highest-value feature.
"""

from fastapi import APIRouter, Depends, Path, Query, HTTPException
from typing import Optional

from api.models.implement import (
    ImplementRequest, ImplementResponse,
    AlgorithmSpec
)
from api.models.graph import DependencyChainRequest, DependencyChainResponse
from api.services.implementation_service import ImplementationService
from api.dependencies import get_implementation_service

router = APIRouter(prefix="/v1/implement", tags=["Implement"])


@router.post("/plan", response_model=ImplementResponse)
async def get_implementation_plan(
    request: ImplementRequest,
    service: ImplementationService = Depends(get_implementation_service),
):
    """
    Generate a complete implementation plan for a goal.
    
    This is the primary value endpoint of the entire API.
    
    POST /v1/implement/plan
    {
        "goal": "Create a PPTX file with a blue rectangle at (2,1) inches, 3x2 inches",
        "target": "pptx",
        "language": "python"
    }
    
    Returns: complete step-by-step plan with atoms, algorithms,
    coordinate calculations, and working code.
    """
    return await service.create_plan(request)


@router.get("/capabilities/{target_id}", response_model=list[dict])
async def list_capabilities(
    target_id: str = Path(...),
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search within capabilities"),
    service: ImplementationService = Depends(get_implementation_service),
):
    """
    List all known capabilities for a target.
    
    GET /v1/implement/capabilities/pptx
    GET /v1/implement/capabilities/pptx?category=Shapes
    
    Returns: ["Draw Rectangle", "Draw Ellipse", "Add Text Box", ...]
    with complexity ratings and implementation status.
    """
    return await service.list_capabilities(target_id, category, search)


@router.get("/capability/{capability_id}", response_model=dict)
async def get_capability_detail(
    capability_id: str = Path(...),
    language: str = Query("python", description="Language for code examples"),
    service: ImplementationService = Depends(get_implementation_service),
):
    """
    Get complete details for one capability including implementation steps,
    required atoms, and reference code.
    """
    return await service.get_capability_detail(capability_id, language)


@router.get("/algorithms/{target_id}", response_model=list[dict])
async def list_algorithms(
    target_id: str = Path(...),
    category: Optional[str] = Query(None),
    service: ImplementationService = Depends(get_implementation_service),
):
    """
    List all algorithms documented for a target/domain.
    
    GET /v1/implement/algorithms/image_editor?category=image_filter
    """
    return await service.list_algorithms(target_id, category)


@router.get("/algorithm/{algorithm_id}", response_model=AlgorithmSpec)
async def get_algorithm(
    algorithm_id: str = Path(...),
    language: str = Query("python"),
    include_optimizations: bool = Query(True),
    service: ImplementationService = Depends(get_implementation_service),
):
    """
    Get complete algorithm specification with math, pseudocode,
    and reference implementation.
    """
    return await service.get_algorithm(algorithm_id, language, include_optimizations)


@router.post("/dependency-chain", response_model=DependencyChainResponse)
async def get_dependency_chain(
    request: DependencyChainRequest,
    service: ImplementationService = Depends(get_implementation_service),
):
    """
    Get the complete dependency chain for a capability.
    Returns everything needed to implement it, in topological order.
    """
    return await service.get_dependency_chain(request)


@router.get("/blueprints/{target_id}", response_model=list[dict])
async def list_blueprints(
    target_id: str = Path(...),
    service: ImplementationService = Depends(get_implementation_service),
):
    """
    List available blueprints (composable architecture plans).
    
    GET /v1/implement/blueprints/pptx
    → [{"id": "bp_001", "name": "Complete Shape Engine", 
         "scope": "feature_group", "capabilities": 47},
        {"id": "bp_002", "name": "Complete PPTX Generator",
         "scope": "full_application", "capabilities": 150}]
    """
    return await service.list_blueprints(target_id)


@router.post("/assemble/{blueprint_id}", response_model=dict)
async def assemble_project(
    blueprint_id: str = Path(...),
    language: str = Query("python"),
    service: ImplementationService = Depends(get_implementation_service),
):
    """
    Generate a complete source code project from a blueprint.
    
    Returns a dictionary of filename → file content.
    """
    return await service.assemble_project(blueprint_id, language)
```

```python
# api/routers/context.py

"""
AI-optimized context assembly endpoints.
Designed for AI agents building optimal context windows.
"""

from fastapi import APIRouter, Depends
from api.models.context import (
    ContextRequest, ContextResponse,
    ContextBatchRequest
)
from api.services.context_service import ContextService
from api.dependencies import get_context_service

router = APIRouter(prefix="/v1/context", tags=["Context Assembly"])


@router.post("/assemble", response_model=ContextResponse)
async def assemble_context(
    request: ContextRequest,
    service: ContextService = Depends(get_context_service),
):
    """
    Assemble an optimal context window for an AI agent.
    
    The service:
    1. Understands the task semantically
    2. Finds all relevant knowledge entries
    3. Selects the optimal resolution for each entry
    4. Packs entries into the token budget
    5. Formats everything for direct injection into a prompt
    
    POST /v1/context/assemble
    {
        "task": "Write a function that adds a chart to a PPTX slide",
        "token_budget": 4000,
        "targets": ["python", "pptx"],
        "prefer_code": true
    }
    """
    return await service.assemble(request)


@router.post("/batch", response_model=list[ContextResponse])
async def batch_assemble(
    request: ContextBatchRequest,
    service: ContextService = Depends(get_context_service),
):
    """
    Assemble multiple context windows at once.
    Useful for multi-step AI reasoning.
    
    If shared_budget is set, the total token budget is divided
    across all requests, with deduplication ensuring no entry
    appears in multiple responses.
    """
    return await service.batch_assemble(request)
```

```python
# api/routers/compare.py

"""
Cross-target comparison and translation endpoints.
"""

from fastapi import APIRouter, Depends, Query
from typing import Optional

from api.models.compare import (
    CompareRequest, CompareResponse,
    TranslateRequest, TranslateResponse
)
from api.services.comparison_service import ComparisonService
from api.dependencies import get_comparison_service

router = APIRouter(prefix="/v1/compare", tags=["Compare & Translate"])


@router.post("/", response_model=CompareResponse)
async def compare_targets(
    request: CompareRequest,
    service: ComparisonService = Depends(get_comparison_service),
):
    """
    Compare how different targets handle the same concept.
    
    POST /v1/compare
    {
        "concept_id": "control.iteration.for",
        "targets": ["python", "rust", "go", "javascript"]
    }
    
    Returns: side-by-side comparison with syntax, examples,
    key differences, and translation hints.
    """
    return await service.compare(request)


@router.post("/translate", response_model=TranslateResponse)
async def translate(
    request: TranslateRequest,
    service: ComparisonService = Depends(get_comparison_service),
):
    """
    Translate code or concepts from one target to another.
    
    POST /v1/compare/translate
    {
        "from_target": "python",
        "to_target": "rust",
        "code": "result = [x**2 for x in range(10) if x % 2 == 0]",
        "idiomatic": true
    }
    
    Returns: idiomatic Rust equivalent with explanation of
    semantic differences.
    """
    return await service.translate(request)


@router.get("/learning-path", response_model=dict)
async def get_learning_path(
    from_target: str = Query(..., description="Language you know"),
    to_target: str = Query(..., description="Language you want to learn"),
    service: ComparisonService = Depends(get_comparison_service),
):
    """
    Generate a learning path from one language to another.
    
    GET /v1/compare/learning-path?from_target=python&to_target=rust
    
    Returns: ordered list of concepts to learn, with mappings
    from what you already know.
    """
    return await service.learning_path(from_target, to_target)
```

```python
# api/routers/explore.py

"""
Browse and navigate endpoints.
"""

from fastapi import APIRouter, Depends, Path, Query
from typing import Optional

from api.models.explore import (
    TargetListResponse, TargetDetailResponse,
    TopicTreeResponse, ConceptTreeResponse
)
from api.models.common import TargetType
from api.services.retrieval_service import RetrievalService
from api.dependencies import get_retrieval_service

router = APIRouter(prefix="/v1/explore", tags=["Explore"])


@router.get("/targets", response_model=TargetListResponse)
async def list_targets(
    type: Optional[TargetType] = Query(None, description="Filter by type"),
    family: Optional[str] = Query(None, description="Filter by family"),
    tier: Optional[int] = Query(None, description="Filter by tier (1-4)"),
    search: Optional[str] = Query(None, description="Search target names"),
    service: RetrievalService = Depends(get_retrieval_service),
):
    """
    List all available targets in the knowledge base.
    
    GET /v1/explore/targets?type=programming_language
    GET /v1/explore/targets?family=c_family
    """
    return await service.list_targets(type, family, tier, search)


@router.get("/targets/{target_id}", response_model=TargetDetailResponse)
async def get_target(
    target_id: str = Path(...),
    service: RetrievalService = Depends(get_retrieval_service),
):
    """
    Get complete details about a target including stats, health, and topic tree.
    
    GET /v1/explore/targets/python
    """
    return await service.get_target_detail(target_id)


@router.get("/targets/{target_id}/tree", response_model=TopicTreeResponse)
async def get_topic_tree(
    target_id: str = Path(...),
    depth: int = Query(2, ge=1, le=6, description="How deep to expand"),
    path_prefix: Optional[str] = Query(None,
        description="Start from a specific path (e.g., 'Standard Library')"),
    service: RetrievalService = Depends(get_retrieval_service),
):
    """
    Get the hierarchical topic tree for a target.
    
    GET /v1/explore/targets/python/tree?depth=3
    GET /v1/explore/targets/python/tree?path_prefix=Standard Library&depth=2
    """
    return await service.get_topic_tree(target_id, depth, path_prefix)


@router.get("/concepts", response_model=ConceptTreeResponse)
async def get_concept_tree(
    domain: Optional[str] = Query(None, description="Filter by domain"),
    service: RetrievalService = Depends(get_retrieval_service),
):
    """
    Get the universal concept taxonomy.
    
    GET /v1/explore/concepts
    GET /v1/explore/concepts?domain=control_flow
    """
    return await service.get_concept_tree(domain)


@router.get("/concepts/{concept_id}", response_model=dict)
async def get_concept_detail(
    concept_id: str = Path(...),
    service: RetrievalService = Depends(get_retrieval_service),
):
    """
    Get a universal concept with all its cross-target implementations.
    
    GET /v1/explore/concepts/iteration.for
    
    Returns: the concept definition + which targets implement it + 
    links to each target's entry for this concept.
    """
    return await service.get_concept_detail(concept_id)


@router.get("/families", response_model=list[dict])
async def list_families(
    service: RetrievalService = Depends(get_retrieval_service),
):
    """
    List all language/format families with their shared traits and members.
    """
    return await service.list_families()
```

```python
# api/routers/health.py

"""
Observability and health endpoints.
"""

from fastapi import APIRouter, Depends, Path, Query
from typing import Optional

from api.services.health_service import HealthService
from api.dependencies import get_health_service

router = APIRouter(prefix="/v1/health", tags=["Health & Observability"])


@router.get("/", response_model=dict)
async def global_health(
    service: HealthService = Depends(get_health_service),
):
    """
    Global health dashboard data.
    
    Returns: all five vital signs at global level, plus
    per-target summaries and active alerts.
    """
    return await service.global_health()


@router.get("/targets/{target_id}", response_model=dict)
async def target_health(
    target_id: str = Path(...),
    service: HealthService = Depends(get_health_service),
):
    """
    Detailed health for one target.
    
    Returns: five vital signs with breakdowns, stale entries,
    coverage gaps, recent health events.
    """
    return await service.target_health(target_id)


@router.get("/events", response_model=list[dict])
async def health_events(
    severity: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    status: Optional[str] = Query("pending"),
    limit: int = Query(50, ge=1, le=200),
    service: HealthService = Depends(get_health_service),
):
    """
    List health events (alerts, issues, resolutions).
    """
    return await service.list_events(severity, event_type, status, limit)


@router.get("/stats", response_model=dict)
async def database_stats(
    service: HealthService = Depends(get_health_service),
):
    """
    Database-wide statistics.
    
    Returns: total entries, atoms, capabilities, algorithms,
    blueprints, relations, storage size, generation cost history.
    """
    return await service.database_stats()


@router.get("/freshness-map", response_model=dict)
async def freshness_map(
    service: HealthService = Depends(get_health_service),
):
    """
    Visual freshness decay map across all targets.
    Shows which areas of the knowledge base are getting stale.
    """
    return await service.freshness_map()
```

---

## The Context Assembly Service — The Core Intelligence

This is the most architecturally important service. It's where the multi-resolution content design, the embedding indices, and the token budgeting all come together.

```python
# api/services/context_service.py

"""
The Context Assembly Service.

This is the brain of the API. It takes a task description and a token budget,
then assembles the optimal set of knowledge entries at the optimal resolutions
to maximize the AI's ability to complete the task.

Think of it as a librarian who:
  1. Understands what you're trying to do
  2. Knows every book in the library and what's in each one
  3. Knows exactly how much you can carry (token budget)
  4. Selects the perfect combination of books, chapters, and summaries
     to give you maximum useful knowledge within your carrying capacity
"""

from __future__ import annotations
import json
import math
import time
from dataclasses import dataclass, field
from typing import Optional

from api.models.context import (
    ContextRequest, ContextResponse, ContextEntry,
    ContextBatchRequest
)
from api.models.common import ContentResolution
from api.db.connection import Database
from api.db.cache import Cache
from api.llm.adaptive import AdaptiveLLM


@dataclass
class ScoredCandidate:
    """An entry being considered for inclusion in the context."""
    entry_id: str
    path: str
    target: str
    concept_id: str
    
    # Relevance to the task (from vector search)
    semantic_relevance: float = 0.0
    
    # Quality signals
    confidence: float = 0.0
    freshness: float = 0.0
    
    # Token costs at each resolution
    tokens_micro: int = 0
    tokens_standard: int = 0
    tokens_exhaustive: int = 0
    
    # The actual content at each resolution
    content_micro: str = ""
    content_standard: str = ""
    content_exhaustive: str = ""
    
    # Examples (separate cost)
    examples: list[dict] = field(default_factory=list)
    tokens_examples: int = 0
    
    # Is this entry already known by the AI?
    already_known: bool = False
    
    # Computed composite score
    score: float = 0.0
    
    # Selected resolution and total tokens
    selected_resolution: ContentResolution = ContentResolution.MICRO
    selected_tokens: int = 0
    selected_content: str = ""


class ContextService:
    """Assembles optimal context windows from the knowledge base."""
    
    def __init__(self, db: Database, cache: Cache, llm: Optional[AdaptiveLLM] = None):
        self.db = db
        self.cache = cache
        self.llm = llm
    
    async def assemble(self, request: ContextRequest) -> ContextResponse:
        """
        Assemble an optimal context window.
        
        Algorithm:
        1. DISCOVER: Find all potentially relevant entries via semantic + structural search
        2. SCORE: Rank entries by relevance × quality × novelty
        3. SELECT: Choose entries using knapsack-style optimization on token budget
        4. RESOLVE: Pick the optimal resolution for each selected entry
        5. FORMAT: Assemble into the requested output format
        """
        start_time = time.time()
        
        # ── STEP 1: DISCOVER ────────────────────────────────
        candidates = await self._discover_candidates(request)
        
        # ── STEP 2: SCORE ───────────────────────────────────
        scored = self._score_candidates(candidates, request)
        
        # ── STEP 3+4: SELECT + RESOLVE ──────────────────────
        selected = self._optimize_selection(scored, request.token_budget, request)
        
        # ── STEP 5: FORMAT ──────────────────────────────────
        assembled = self._format_context(selected, request)
        
        # ── Build response ──────────────────────────────────
        entries = [
            ContextEntry(
                entry_id=c.entry_id,
                path=c.path,
                target=c.target,
                resolution=c.selected_resolution,
                relevance=c.score,
                tokens=c.selected_tokens,
                content=c.selected_content,
                code_examples=c.examples if request.prefer_code else [],
                confidence=c.confidence if request.include_metadata else None,
                freshness=c.freshness if request.include_metadata else None,
                concept=c.concept_id if request.include_metadata else None,
            )
            for c in selected
        ]
        
        tokens_used = sum(c.selected_tokens for c in selected)
        
        # ── Quality assessment ──────────────────────────────
        coverage_assessment = self._assess_coverage(
            request, candidates, selected
        )
        
        return ContextResponse(
            assembled_context=assembled,
            entries=entries,
            tokens_used=tokens_used,
            tokens_budget=request.token_budget,
            tokens_remaining=request.token_budget - tokens_used,
            entries_included=len(selected),
            entries_available=len(candidates),
            entries_excluded_by_budget=len(candidates) - len(selected),
            resolution_strategy=self._describe_resolution_strategy(selected),
            avg_confidence=self._avg([c.confidence for c in selected]),
            avg_freshness=self._avg([c.freshness for c in selected]),
            coverage_assessment=coverage_assessment,
            suggested_followup_queries=self._suggest_followups(
                request, candidates, selected
            ),
            missing_knowledge=self._identify_gaps(request, candidates),
        )
    
    # ════════════════════════════════════════════════════════════
    # STEP 1: DISCOVER — Find relevant entries
    # ════════════════════════════════════════════════════════════
    
    async def _discover_candidates(
        self, request: ContextRequest
    ) -> list[ScoredCandidate]:
        """
        Find all potentially relevant entries using multiple strategies:
        1. Semantic search (embedding similarity to task description)
        2. Concept-based lookup (if focus_concepts specified)
        3. Target-based structural retrieval
        4. Relation graph expansion (related entries to top hits)
        """
        candidates = {}
        
        # Strategy 1: Semantic search
        embedding = await self.db.get_embedding(request.task)
        
        # Search at standard resolution (best for task-matching)
        target_filter = request.targets if request.targets else None
        semantic_hits = await self.db.vector_search(
            embedding=embedding,
            embedding_column="embedding_standard",
            target_ids=target_filter,
            limit=200,  # get a large candidate pool
        )
        
        for hit in semantic_hits:
            candidates[hit["id"]] = ScoredCandidate(
                entry_id=hit["id"],
                path=hit["path"],
                target=hit["target_id"],
                concept_id=hit.get("concept_id", ""),
                semantic_relevance=hit["similarity"],
                confidence=hit.get("confidence", 0.5),
                freshness=hit.get("freshness", 0.5),
                tokens_micro=hit.get("tokens_micro", 50),
                tokens_standard=hit.get("tokens_standard", 500),
                tokens_exhaustive=hit.get("tokens_exhaustive", 2000),
                content_micro=hit.get("content_micro", ""),
                content_standard=hit.get("content_standard", ""),
                content_exhaustive=hit.get("content_exhaustive", ""),
            )
        
        # Strategy 2: Concept-based lookup
        for concept_id in request.focus_concepts:
            concept_entries = await self.db.get_entries_for_concept(
                concept_id, target_ids=target_filter
            )
            for entry in concept_entries:
                if entry["id"] not in candidates:
                    candidates[entry["id"]] = ScoredCandidate(
                        entry_id=entry["id"],
                        path=entry["path"],
                        target=entry["target_id"],
                        concept_id=concept_id,
                        semantic_relevance=0.7,  # concept match = high relevance
                        confidence=entry.get("confidence", 0.5),
                        freshness=entry.get("freshness", 0.5),
                        tokens_micro=entry.get("tokens_micro", 50),
                        tokens_standard=entry.get("tokens_standard", 500),
                        tokens_exhaustive=entry.get("tokens_exhaustive", 2000),
                        content_micro=entry.get("content_micro", ""),
                        content_standard=entry.get("content_standard", ""),
                        content_exhaustive=entry.get("content_exhaustive", ""),
                    )
        
        # Strategy 3: Implementation layer
        if "implementation" in request.layers:
            # Also search capabilities and algorithms
            cap_hits = await self.db.vector_search(
                embedding=embedding,
                table="capabilities",
                embedding_column="embedding",
                target_ids=target_filter,
                limit=50,
            )
            for hit in cap_hits:
                cap_id = f"cap_{hit['id']}"
                if cap_id not in candidates:
                    candidates[cap_id] = ScoredCandidate(
                        entry_id=hit["id"],
                        path=f"[capability] {hit['name']}",
                        target=hit["target_id"],
                        concept_id="",
                        semantic_relevance=hit["similarity"],
                        tokens_standard=hit.get("token_count", 500),
                        content_standard=self._format_capability_as_content(hit),
                    )
        
        # Strategy 4: Graph expansion — get neighbors of top candidates
        top_candidates = sorted(
            candidates.values(),
            key=lambda c: c.semantic_relevance,
            reverse=True
        )[:20]
        
        for candidate in top_candidates:
            neighbors = await self.db.get_related_entries(
                candidate.entry_id, limit=5
            )
            for neighbor in neighbors:
                if neighbor["id"] not in candidates:
                    candidates[neighbor["id"]] = ScoredCandidate(
                        entry_id=neighbor["id"],
                        path=neighbor["path"],
                        target=neighbor.get("target_id", ""),
                        concept_id=neighbor.get("concept_id", ""),
                        semantic_relevance=candidate.semantic_relevance * 0.5,
                        confidence=neighbor.get("confidence", 0.5),
                        freshness=neighbor.get("freshness", 0.5),
                        tokens_micro=neighbor.get("tokens_micro", 50),
                        tokens_standard=neighbor.get("tokens_standard", 500),
                        tokens_exhaustive=neighbor.get("tokens_exhaustive", 2000),
                        content_micro=neighbor.get("content_micro", ""),
                        content_standard=neighbor.get("content_standard", ""),
                        content_exhaustive=neighbor.get("content_exhaustive", ""),
                    )
        
        # Load examples for top candidates
        for cid, candidate in list(candidates.items())[:50]:
            examples = await self.db.get_examples(candidate.entry_id)
            candidate.examples = examples
            candidate.tokens_examples = sum(
                e.get("token_count", 100) for e in examples
            )
        
        # Mark already-known topics
        already_know_lower = [s.lower() for s in request.already_know]
        for candidate in candidates.values():
            if any(
                known in candidate.path.lower() or known in candidate.content_micro.lower()
                for known in already_know_lower
            ):
                candidate.already_known = True
        
        return list(candidates.values())
    
    # ════════════════════════════════════════════════════════════
    # STEP 2: SCORE — Rank by composite quality
    # ════════════════════════════════════════════════════════════
    
    def _score_candidates(
        self,
        candidates: list[ScoredCandidate],
        request: ContextRequest,
    ) -> list[ScoredCandidate]:
        """
        Compute composite score for each candidate.
        
        Score = semantic_relevance × quality_factors × novelty_factor
        """
        for candidate in candidates:
            # Relevance (primary signal)
            relevance = candidate.semantic_relevance
            
            # Quality multiplier
            quality = (
                0.6 * candidate.confidence +
                0.4 * candidate.freshness
            )
            
            # Novelty (penalize already-known topics)
            novelty = 0.2 if candidate.already_known else 1.0
            
            # Code bonus (if AI prefers code)
            code_bonus = 1.0
            if request.prefer_code and candidate.examples:
                code_bonus = 1.3
            
            candidate.score = relevance * quality * novelty * code_bonus
        
        # Sort by score descending
        candidates.sort(key=lambda c: c.score, reverse=True)
        return candidates
    
    # ════════════════════════════════════════════════════════════
    # STEP 3+4: SELECT + RESOLVE — Optimal knapsack packing
    # ════════════════════════════════════════════════════════════
    
    def _optimize_selection(
        self,
        candidates: list[ScoredCandidate],
        budget: int,
        request: ContextRequest,
    ) -> list[ScoredCandidate]:
        """
        Select entries and resolutions to maximize value within token budget.
        
        This is a variant of the 0-1 knapsack problem where each item
        has multiple "sizes" (resolutions) with different values.
        
        We use a greedy approach:
        1. Include top candidates at MICRO resolution first (cheap)
        2. Upgrade the most valuable ones to STANDARD
        3. Upgrade the single most relevant to EXHAUSTIVE
        4. Add code examples if budget allows
        """
        selected: list[ScoredCandidate] = []
        tokens_used = 0
        
        # ── Pass 1: Include top candidates at MICRO ─────────
        for candidate in candidates:
            cost = candidate.tokens_micro
            if cost == 0:
                cost = 50  # default estimate
            
            if tokens_used + cost <= budget:
                candidate.selected_resolution = ContentResolution.MICRO
                candidate.selected_tokens = cost
                candidate.selected_content = candidate.content_micro
                selected.append(candidate)
                tokens_used += cost
            
            # Don't include more than we could possibly upgrade
            if len(selected) >= budget // 30:
                break
        
        # ── Pass 2: Upgrade top entries to STANDARD ─────────
        # Sort selected by score to upgrade the best ones first
        selected.sort(key=lambda c: c.score, reverse=True)
        
        for candidate in selected:
            upgrade_cost = candidate.tokens_standard - candidate.selected_tokens
            if upgrade_cost <= 0:
                continue
            
            if tokens_used + upgrade_cost <= budget:
                candidate.selected_resolution = ContentResolution.STANDARD
                candidate.selected_tokens = candidate.tokens_standard
                candidate.selected_content = candidate.content_standard
                tokens_used += upgrade_cost
        
        # ── Pass 3: Upgrade the #1 entry to EXHAUSTIVE ──────
        if request.prefer_exhaustive and selected:
            top = selected[0]
            upgrade_cost = top.tokens_exhaustive - top.selected_tokens
            if upgrade_cost > 0 and tokens_used + upgrade_cost <= budget:
                top.selected_resolution = ContentResolution.EXHAUSTIVE
                top.selected_tokens = top.tokens_exhaustive
                top.selected_content = top.content_exhaustive
                tokens_used += upgrade_cost
        
        # ── Pass 4: Add code examples where budget allows ───
        if request.prefer_code:
            for candidate in selected:
                if candidate.examples and candidate.tokens_examples > 0:
                    if tokens_used + candidate.tokens_examples <= budget:
                        tokens_used += candidate.tokens_examples
                        # examples are already attached to the candidate
                    else:
                        # Add just the first example
                        if candidate.examples:
                            first_example_tokens = candidate.examples[0].get(
                                "token_count", 100
                            )
                            if tokens_used + first_example_tokens <= budget:
                                candidate.examples = [candidate.examples[0]]
                                tokens_used += first_example_tokens
                            else:
                                candidate.examples = []
        else:
            for candidate in selected:
                candidate.examples = []
        
        return selected
    
    # ════════════════════════════════════════════════════════════
    # STEP 5: FORMAT — Assemble into usable output
    # ════════════════════════════════════════════════════════════
    
    def _format_context(
        self,
        selected: list[ScoredCandidate],
        request: ContextRequest,
    ) -> str:
        """
        Format selected entries into a single context block.
        """
        if request.format == "structured":
            return self._format_structured(selected, request)
        elif request.format == "xml":
            return self._format_xml(selected, request)
        else:
            return self._format_prose(selected, request)
    
    def _format_structured(
        self, selected: list[ScoredCandidate], request: ContextRequest
    ) -> str:
        """JSON-structured context for AI consumption."""
        sections = []
        
        # Group by target
        by_target: dict[str, list[ScoredCandidate]] = {}
        for c in selected:
            by_target.setdefault(c.target, []).append(c)
        
        for target, entries in by_target.items():
            section = {
                "target": target,
                "entries": []
            }
            for entry in entries:
                entry_data = {
                    "path": entry.path,
                    "content": entry.selected_content,
                }
                if entry.examples:
                    entry_data["examples"] = [
                        {"code": ex.get("code", ""), "title": ex.get("title", "")}
                        for ex in entry.examples[:3]
                    ]
                if request.include_metadata:
                    entry_data["confidence"] = entry.confidence
                    entry_data["freshness"] = entry.freshness
                
                section["entries"].append(entry_data)
            
            sections.append(section)
        
        return json.dumps(sections, indent=2)
    
    def _format_xml(
        self, selected: list[ScoredCandidate], request: ContextRequest
    ) -> str:
        """XML-tagged context with clear section boundaries."""
        lines = ["<knowledge_context>"]
        
        current_target = None
        for entry in selected:
            if entry.target != current_target:
                if current_target:
                    lines.append(f"</target>")
                lines.append(f'<target id="{entry.target}">')
                current_target = entry.target
            
            lines.append(f'  <entry path="{entry.path}" '
                        f'resolution="{entry.selected_resolution.value}">')
            lines.append(f"    {entry.selected_content}")
            
            for ex in entry.examples[:2]:
                lines.append(f"    <example>")
                lines.append(f"      <code>{ex.get('code', '')}</code>")
                lines.append(f"    </example>")
            
            lines.append(f"  </entry>")
        
        if current_target:
            lines.append(f"</target>")
        lines.append("</knowledge_context>")
        
        return "\n".join(lines)
    
    def _format_prose(
        self, selected: list[ScoredCandidate], request: ContextRequest
    ) -> str:
        """Human-readable prose format."""
        lines = []
        
        for entry in selected:
            lines.append(f"## {entry.path}")
            lines.append(f"{entry.selected_content}")
            
            for ex in entry.examples[:2]:
                lines.append(f"\n```{ex.get('language', '')}")
                lines.append(ex.get("code", ""))
                lines.append("```\n")
            
            lines.append("")
        
        return "\n".join(lines)
    
    # ════════════════════════════════════════════════════════════
    # HELPERS
    # ════════════════════════════════════════════════════════════
    
    def _assess_coverage(
        self,
        request: ContextRequest,
        all_candidates: list[ScoredCandidate],
        selected: list[ScoredCandidate],
    ) -> str:
        """Assess how well the selected entries cover the task."""
        if not selected:
            return "No relevant entries found for this task."
        
        avg_relevance = self._avg([c.score for c in selected])
        excluded_relevant = [
            c for c in all_candidates
            if c not in selected and c.score > 0.5
        ]
        
        parts = []
        if avg_relevance > 0.7:
            parts.append("Good coverage of the requested topic.")
        elif avg_relevance > 0.4:
            parts.append("Moderate coverage. Some aspects may be missing.")
        else:
            parts.append("Limited coverage. Consider broadening the search.")
        
        if excluded_relevant:
            parts.append(
                f"{len(excluded_relevant)} relevant entries were excluded "
                f"due to token budget. Consider increasing budget to "
                f"{sum(c.tokens_standard for c in excluded_relevant) + sum(c.selected_tokens for c in selected)} tokens."
            )
        
        # Check for low-confidence or stale entries
        low_conf = [c for c in selected if c.confidence < 0.7]
        if low_conf:
            parts.append(
                f"⚠️ {len(low_conf)} entries have low confidence scores. "
                f"Verify critical details independently."
            )
        
        stale = [c for c in selected if c.freshness < 0.5]
        if stale:
            parts.append(
                f"⚠️ {len(stale)} entries may be outdated. "
                f"Check for recent version changes."
            )
        
        return " ".join(parts)
    
    def _describe_resolution_strategy(
        self, selected: list[ScoredCandidate]
    ) -> str:
        counts = {"micro": 0, "standard": 0, "exhaustive": 0}
        for c in selected:
            counts[c.selected_resolution.value] += 1
        
        parts = []
        for res, count in counts.items():
            if count > 0:
                parts.append(f"{count} at {res}")
        
        return f"Included {', '.join(parts)} to optimize within token budget."
    
    def _suggest_followups(
        self,
        request: ContextRequest,
        all_candidates: list[ScoredCandidate],
        selected: list[ScoredCandidate],
    ) -> list[str]:
        """Suggest queries the AI might want to make next."""
        suggestions = []
        
        # Suggest excluded high-relevance topics
        excluded = [
            c for c in all_candidates
            if c not in selected and c.score > 0.5
        ]
        if excluded:
            suggestions.append(
                f"Get more detail on: {excluded[0].path}"
            )
        
        # Suggest implementation layer if only reference was returned
        has_impl = any("capability" in c.path.lower() for c in selected)
        if not has_impl and request.task and any(
            kw in request.task.lower()
            for kw in ["implement", "build", "create", "generate", "write"]
        ):
            suggestions.append(
                "Use /v1/implement/plan for step-by-step implementation details"
            )
        
        return suggestions
    
    def _identify_gaps(
        self,
        request: ContextRequest,
        all_candidates: list[ScoredCandidate],
    ) -> list[str]:
        """Identify knowledge gaps relevant to the task."""
        gaps = []
        
        if not all_candidates:
            gaps.append(
                f"No knowledge found for targets: {request.targets}. "
                f"These targets may not be in the database yet."
            )
        
        # Check for low-depth areas
        shallow = [
            c for c in all_candidates
            if c.tokens_exhaustive == 0 or c.tokens_exhaustive <= c.tokens_standard
        ]
        if len(shallow) > len(all_candidates) * 0.5:
            gaps.append(
                "Many entries in this area lack exhaustive-depth content. "
                "Deep implementation details may be incomplete."
            )
        
        return gaps
    
    @staticmethod
    def _avg(values: list[float]) -> float:
        valid = [v for v in values if v is not None and v > 0]
        return sum(valid) / len(valid) if valid else 0.0
    
    def _format_capability_as_content(self, cap: dict) -> str:
        return (
            f"Capability: {cap.get('name', '')}\n"
            f"{cap.get('user_description', '')}\n"
            f"Complexity: {cap.get('complexity', 'unknown')}"
        )
    
    # ════════════════════════════════════════════════════════════
    # BATCH ASSEMBLY
    # ════════════════════════════════════════════════════════════
    
    async def batch_assemble(
        self, request: ContextBatchRequest
    ) -> list[ContextResponse]:
        """Assemble multiple context windows, with optional deduplication."""
        responses = []
        used_entry_ids = set()
        
        if request.shared_budget:
            per_request_budget = request.shared_budget // len(request.requests)
        
        for ctx_request in request.requests:
            if request.shared_budget:
                ctx_request.token_budget = per_request_budget
            
            # Add already-used entries to "already_know" for deduplication
            if request.deduplicate and used_entry_ids:
                ctx_request.already_know = list(
                    ctx_request.already_know
                ) + [f"__entry_id:{eid}" for eid in used_entry_ids]
            
            response = await self.assemble(ctx_request)
            responses.append(response)
            
            # Track used entries
            if request.deduplicate:
                for entry in response.entries:
                    used_entry_ids.add(entry.entry_id)
        
        return responses
```

---

## Application Factory and Middleware

```python
# api/main.py

"""
FastAPI application factory.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from api.routers import (
    search, retrieve, explore, implement,
    compare, context, graph, health, admin
)
from api.middleware import (
    RateLimitMiddleware, RequestLoggingMiddleware,
    APIKeyMiddleware, CostTrackingMiddleware
)
from api.db.connection import Database
from api.db.cache import Cache


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    app.state.db = Database()
    await app.state.db.connect()
    
    app.state.cache = Cache()
    await app.state.cache.connect()
    
    yield
    
    # Shutdown
    await app.state.db.disconnect()
    await app.state.cache.disconnect()


def create_app() -> FastAPI:
    app = FastAPI(
        title="Knowledge Base API",
        description=(
            "Universal implementation knowledge base for programming languages "
            "and file formats. Provides reference documentation, implementation "
            "specifications, algorithms, and AI-optimized context assembly."
        ),
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )
    
    # ── Middleware ──────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(RateLimitMiddleware, requests_per_minute=60)
    app.add_middleware(CostTrackingMiddleware)  # track LLM costs from adaptive endpoints
    
    # ── Routes ─────────────────────────────────────────────
    app.include_router(search.router)
    app.include_router(retrieve.router)
    app.include_router(explore.router)
    app.include_router(implement.router)
    app.include_router(compare.router)
    app.include_router(context.router)
    app.include_router(graph.router)
    app.include_router(health.router)
    app.include_router(admin.router)
    
    # ── Root ───────────────────────────────────────────────
    @app.get("/")
    async def root():
        return {
            "name": "Knowledge Base API",
            "version": "1.0.0",
            "docs": "/docs",
            "health": "/v1/health",
            "endpoints": {
                "search": "/v1/search/",
                "retrieve": "/v1/retrieve/",
                "explore": "/v1/explore/",
                "implement": "/v1/implement/",
                "compare": "/v1/compare/",
                "context": "/v1/context/",
                "graph": "/v1/graph/",
                "health": "/v1/health/",
            }
        }
    
    return app


app = create_app()
```

```python
# api/middleware.py

"""
Middleware stack for cross-cutting concerns.
"""

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import time
import logging
import asyncio
from collections import defaultdict

logger = logging.getLogger("api")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log every request with timing."""
    
    async def dispatch(self, request: Request, call_next):
        start = time.time()
        
        response = await call_next(request)
        
        duration_ms = (time.time() - start) * 1000
        
        logger.info(
            f"{request.method} {request.url.path} "
            f"→ {response.status_code} "
            f"({duration_ms:.0f}ms)"
        )
        
        # Add timing header
        response.headers["X-Response-Time-Ms"] = f"{duration_ms:.0f}"
        
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory rate limiting by API key or IP."""
    
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.rpm = requests_per_minute
        self.windows: dict[str, list[float]] = defaultdict(list)
    
    async def dispatch(self, request: Request, call_next):
        # Identify client
        api_key = request.headers.get("X-API-Key", "")
        client_id = api_key or request.client.host
        
        now = time.time()
        window_start = now - 60
        
        # Clean old entries
        self.windows[client_id] = [
            t for t in self.windows[client_id] if t > window_start
        ]
        
        if len(self.windows[client_id]) >= self.rpm:
            return Response(
                status_code=429,
                content='{"error": "Rate limit exceeded", "retry_after_seconds": 60}',
                media_type="application/json",
                headers={"Retry-After": "60"},
            )
        
        self.windows[client_id].append(now)
        
        response = await call_next(request)
        
        # Add rate limit headers
        remaining = self.rpm - len(self.windows[client_id])
        response.headers["X-RateLimit-Limit"] = str(self.rpm)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        
        return response


class CostTrackingMiddleware(BaseHTTPMiddleware):
    """Track LLM costs for endpoints that use adaptive AI."""
    
    async def dispatch(self, request: Request, call_next):
        # Store cost tracker in request state
        request.state.llm_cost = 0.0
        
        response = await call_next(request)
        
        # Report cost in header
        if hasattr(request.state, "llm_cost") and request.state.llm_cost > 0:
            response.headers["X-LLM-Cost-USD"] = f"{request.state.llm_cost:.4f}"
        
        return response


class APIKeyMiddleware(BaseHTTPMiddleware):
    """Optional API key authentication."""
    
    PUBLIC_PATHS = {"/", "/docs", "/redoc", "/openapi.json", "/v1/health"}
    
    async def dispatch(self, request: Request, call_next):
        # Skip auth for public paths
        if request.url.path in self.PUBLIC_PATHS:
            return await call_next(request)
        
        api_key = request.headers.get("X-API-Key")
        
        if not api_key:
            # Allow unauthenticated access with stricter rate limits
            request.state.auth_tier = "anonymous"
        else:
            # Validate key (simplified — real impl checks database)
            request.state.auth_tier = "authenticated"
            request.state.api_key = api_key
        
        return await call_next(request)
```

---

## Dependency Injection

```python
# api/dependencies.py

"""
FastAPI dependency injection.
Provides service instances to route handlers.
"""

from fastapi import Request, Depends
from functools import lru_cache

from api.services.search_service import SearchService
from api.services.retrieval_service import RetrievalService
from api.services.implementation_service import ImplementationService
from api.services.comparison_service import ComparisonService
from api.services.context_service import ContextService
from api.services.graph_service import GraphService
from api.services.health_service import HealthService
from api.db.connection import Database
from api.db.cache import Cache
from api.llm.adaptive import AdaptiveLLM


def get_db(request: Request) -> Database:
    return request.app.state.db


def get_cache(request: Request) -> Cache:
    return request.app.state.cache


def get_llm(request: Request) -> AdaptiveLLM:
    if not hasattr(request.app.state, "llm"):
        request.app.state.llm = AdaptiveLLM()
    return request.app.state.llm


def get_search_service(
    db: Database = Depends(get_db),
    cache: Cache = Depends(get_cache),
) -> SearchService:
    return SearchService(db, cache)


def get_retrieval_service(
    db: Database = Depends(get_db),
    cache: Cache = Depends(get_cache),
) -> RetrievalService:
    return RetrievalService(db, cache)


def get_implementation_service(
    db: Database = Depends(get_db),
    cache: Cache = Depends(get_cache),
    llm: AdaptiveLLM = Depends(get_llm),
) -> ImplementationService:
    return ImplementationService(db, cache, llm)


def get_comparison_service(
    db: Database = Depends(get_db),
    cache: Cache = Depends(get_cache),
    llm: AdaptiveLLM = Depends(get_llm),
) -> ComparisonService:
    return ComparisonService(db, cache, llm)


def get_context_service(
    db: Database = Depends(get_db),
    cache: Cache = Depends(get_cache),
) -> ContextService:
    return ContextService(db, cache)


def get_graph_service(
    db: Database = Depends(get_db),
) -> GraphService:
    return GraphService(db)


def get_health_service(
    db: Database = Depends(get_db),
) -> HealthService:
    return HealthService(db)
```

---

## What The API Looks Like In Practice

### Scenario 1: Developer wants to generate PPTX shapes

```
──────────────────────────────────────────────────────────────
REQUEST:
──────────────────────────────────────────────────────────────
POST /v1/implement/plan
{
    "goal": "Create a PPTX file with a blue rectangle at position 
             (2, 1) inches that is 3 inches wide and 2 inches tall,
             with white text saying 'Hello World' centered inside",
    "target": "pptx",
    "language": "python",
    "include_atoms": true,
    "include_code": true
}

──────────────────────────────────────────────────────────────
RESPONSE (abbreviated):
──────────────────────────────────────────────────────────────
{
    "plan_title": "PPTX Rectangle with Centered Text",
    "summary": "Creates a valid .pptx file containing one slide 
                with a blue rectangle at (2,1) inches, 3×2 inches, 
                with white centered text 'Hello World'.",
    "feasibility": "fully_possible",
    "estimated_complexity": "moderate",
    
    "steps": [
        {
            "order": 1,
            "title": "Create ZIP container",
            "description": "PPTX files are ZIP archives...",
            "code": "import zipfile\nfrom io import BytesIO\n..."
        },
        {
            "order": 2,
            "title": "Write [Content_Types].xml",
            "file_path": "[Content_Types].xml",
            "file_content_template": "<?xml version=\"1.0\"?>..."
        },
        {
            "order": 3,
            "title": "Write root relationships",
            "file_path": "_rels/.rels",
            "file_content_template": "..."
        },
        {
            "order": 4,
            "title": "Create shape XML with position and text",
            "description": "Convert inches to EMU: x=1828800, y=914400...",
            "code": "def inches_to_emu(inches): return int(inches * 914400)\n...",
            "file_content_template": "<p:sp>\n  <p:nvSpPr>..."
        }
    ],
    
    "coordinate_systems": [{
        "unit": "EMU",
        "conversions": {
            "1 inch": "914400 EMU",
            "1 cm": "360000 EMU"
        }
    }],
    
    "complete_code": {
        "create_pptx.py": "#!/usr/bin/env python3\n\"\"\"Creates a PPTX...\"\"\"\nimport zipfile\n..."
    },
    
    "run_command": "python create_pptx.py",
    "expected_output": "output.pptx — opens in PowerPoint showing blue rectangle with 'Hello World'",
    
    "confidence": 0.91,
    "knowledge_freshness": 0.88
}
```

### Scenario 2: AI agent assembling context

```
──────────────────────────────────────────────────────────────
REQUEST:
──────────────────────────────────────────────────────────────
POST /v1/context/assemble
{
    "task": "Help the user write an async Python web scraper 
             that respects rate limits and handles errors gracefully",
    "token_budget": 3000,
    "targets": ["python"],
    "already_know": ["basic Python syntax", "HTTP basics"],
    "prefer_code": true,
    "format": "xml"
}

──────────────────────────────────────────────────────────────
RESPONSE:
──────────────────────────────────────────────────────────────
{
    "assembled_context": "<knowledge_context>
        <target id=\"python\">
          <entry path=\"Python/Concurrency/Async/async-await\" resolution=\"exhaustive\">
            Python's async/await syntax enables cooperative multitasking...
            async def fetch(url): ...
            <example><code>
            async def fetch_with_semaphore(session, url, semaphore):
                async with semaphore:
                    async with session.get(url) as response:
                        return await response.text()
            </code></example>
          </entry>
          <entry path=\"Python/Concurrency/Async/asyncio\" resolution=\"standard\">
            The asyncio module provides the event loop...
          </entry>
          <entry path=\"Python/Error Handling/try-except\" resolution=\"standard\">
            Python's try/except handles exceptions...
          </entry>
          <entry path=\"Python/Concurrency/Async/aiohttp\" resolution=\"micro\">
            aiohttp: async HTTP client/server framework
          </entry>
          ...12 more entries at micro resolution...
        </target>
      </knowledge_context>",
    
    "tokens_used": 2847,
    "tokens_budget": 3000,
    "tokens_remaining": 153,
    "entries_included": 15,
    "entries_available": 67,
    "entries_excluded_by_budget": 52,
    
    "resolution_strategy": "Included 1 at exhaustive, 3 at standard, 
                            11 at micro to optimize within 3000-token budget.",
    
    "avg_confidence": 0.92,
    "avg_freshness": 0.85,
    
    "coverage_assessment": "Good coverage of async/await and error handling. 
                            Missing: rate limiting patterns (asyncio.Semaphore 
                            mentioned but not detailed). Consider querying for 
                            'asyncio.Semaphore rate limiting pattern'.",
    
    "suggested_followup_queries": [
        "Get exhaustive detail on asyncio.Semaphore",
        "Use /v1/implement/plan for complete web scraper architecture"
    ]
}
```

### Scenario 3: Comparing languages

```
──────────────────────────────────────────────────────────────
REQUEST:
──────────────────────────────────────────────────────────────
POST /v1/compare
{
    "concept_id": "errors.exceptions",
    "targets": ["python", "rust", "go"],
    "include_code_examples": true,
    "include_translation_hints": true
}

──────────────────────────────────────────────────────────────
RESPONSE:
──────────────────────────────────────────────────────────────
{
    "concept": "Error Handling",
    "concept_description": "How the language handles and propagates failures...",
    
    "entries": [
        {
            "target_id": "python",
            "target_name": "Python",
            "content": "Python uses try/except with exception objects...",
            "syntax": "try:\n    ...\nexcept SomeError as e:\n    ...",
            "code_example": "try:\n    result = int(user_input)\nexcept ValueError:\n    ...",
            "distinctive_features": [
                "Exception hierarchy rooted at BaseException",
                "else clause runs if no exception",
                "finally clause always runs",
                "Exception groups (3.11+)"
            ]
        },
        {
            "target_id": "rust",
            "target_name": "Rust",
            "content": "Rust uses Result<T, E> and Option<T> types...",
            "syntax": "fn parse(s: &str) -> Result<i32, ParseIntError>",
            "code_example": "let result = \"42\".parse::<i32>()?;",
            "distinctive_features": [
                "No exceptions — errors are values",
                "? operator for propagation",
                "Must handle errors explicitly",
                "panic! for unrecoverable errors"
            ]
        },
        {
            "target_id": "go",
            "target_name": "Go",
            "content": "Go uses multiple return values with explicit error checks...",
            "syntax": "func Parse(s string) (int, error)",
            "code_example": "val, err := strconv.Atoi(input)\nif err != nil {\n    ...\n}",
            "distinctive_features": [
                "Error is an interface, not a type hierarchy",
                "No exceptions (panic/recover for extreme cases)",
                "Errors are just values — explicit checking",
                "errors.Is/As for wrapping (1.13+)"
            ]
        }
    ],
    
    "commonalities": [
        "All three distinguish recoverable from unrecoverable errors",
        "All three support error wrapping/chaining for context"
    ],
    
    "key_differences": [
        "Python is implicit (any function can throw), Rust and Go are explicit",
        "Rust enforces error handling at compile time; Python and Go don't",
        "Go's approach is most verbose but simplest conceptually",
        "Python has the richest error type hierarchy"
    ],
    
    "translation_table": [
        {
            "python": "try/except ValueError",
            "rust": "match result { Ok(v) => ..., Err(e) => ... }",
            "go": "if err != nil { ... }",
            "note": "Structural difference: Python catches by type, Rust matches by variant, Go checks nil"
        },
        {
            "python": "raise ValueError('invalid')",
            "rust": "return Err(ParseError::Invalid)",
            "go": "return 0, fmt.Errorf(\"invalid\")",
            "note": "Python throws up the stack; Rust and Go return to caller"
        }
    ]
}
```

---

## Endpoint Summary

```
METHOD  PATH                                          PURPOSE                           CONSUMER
──────  ────────────────────────────────────────────  ──────────────────────────────    ─────────
POST    /v1/search/                                   Full search with filters          All
GET     /v1/search/quick?q=...                        Simple keyword search             Human
GET     /v1/search/suggest?q=...                      Autocomplete                      Human

GET     /v1/retrieve/entry/{id}                       Get one entry by ID               All
GET     /v1/retrieve/path/{target}/{path}             Get entry by path                 Human
GET     /v1/retrieve/entry/{id}/neighbors             Get related entries               Human
GET     /v1/retrieve/concept/{id}/entries             Entries for a concept             All
POST    /v1/retrieve/bulk                             Get many entries by ID            AI

GET     /v1/explore/targets                           List all targets                  Human
GET     /v1/explore/targets/{id}                      Target detail + stats             Human
GET     /v1/explore/targets/{id}/tree                 Topic tree (TOC)                  Human
GET     /v1/explore/concepts                          Universal concept tree            Human
GET     /v1/explore/concepts/{id}                     Concept detail                    Human
GET     /v1/explore/families                          Language/format families           Human

POST    /v1/implement/plan                            Full implementation plan          All     ★
GET     /v1/implement/capabilities/{target}           List capabilities                 All
GET     /v1/implement/capability/{id}                 Capability detail                 All
GET     /v1/implement/algorithms/{target}             List algorithms                   All
GET     /v1/implement/algorithm/{id}                  Algorithm detail                  All
POST    /v1/implement/dependency-chain                Get build order                   AI
GET     /v1/implement/blueprints/{target}             List blueprints                   All
POST    /v1/implement/assemble/{blueprint_id}         Generate full project             All     ★

POST    /v1/context/assemble                          AI context assembly               AI      ★
POST    /v1/context/batch                             Multi-step context                AI

POST    /v1/compare/                                  Compare across targets            All     ★
POST    /v1/compare/translate                         Translate code/concepts           All
GET     /v1/compare/learning-path                     Language learning path            Human

POST    /v1/graph/traverse                            Graph traversal                   All
POST    /v1/graph/shortest-path                       Path between nodes                AI

GET     /v1/health/                                   Global health                     System
GET     /v1/health/targets/{id}                       Target health                     System
GET     /v1/health/events                             Health events                     System
GET     /v1/health/stats                              Database statistics               All
GET     /v1/health/freshness-map                      Decay visualization               System

POST    /v1/admin/regenerate                          Trigger regeneration              System
POST    /v1/admin/validate                            Trigger validation                System
GET     /v1/admin/pipeline/status                     Pipeline status                   System
POST    /v1/admin/pipeline/run                        Start generation                  System

★ = highest-value endpoints
```



# The Knowledge Engine API: Complete Architecture

---

## What This API Actually Is

Before designing endpoints, let me think about what someone actually does when they sit down with this database. They don't want to browse a knowledge graph. They want to **get things done.**

A developer walks up with one of these situations:

```
"I need to generate a PPTX file with three slides,
 each containing positioned shapes and text."

"I'm building an image editor and need the algorithm
 for unsharp mask with the actual implementation."

"I want to create a valid PNG file from raw pixel 
 data. Show me everything I need."

"What formats support animation? Compare them."

"I need to convert a DOCX to PDF. What's involved?"

"Give me the complete blueprint for building a 
 presentation generator in Python."

"My code is generating corrupt XLSX files. What 
 validation rules am I probably violating?"
```

The API has to serve all of these use cases. But more importantly, it has to serve them in a way that's useful to both **humans reading documentation** and **AI agents generating code.**

That's the key insight for the API design: **every response should be simultaneously human-readable and machine-actionable.**

---

## The API Philosophy

```
THREE ACCESS MODES, ONE API:

┌──────────────────────────────────────────────────────┐
│                                                      │
│   EXPLORE                                            │
│   "What exists? What can this format do?             │
│    How do these relate?"                             │
│                                                      │
│   Browse targets, capabilities, concepts.            │
│   Navigate the graph. Discover what's possible.      │
│                                                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│   RETRIEVE                                           │
│   "Give me everything I need to implement            │
│    THIS SPECIFIC capability."                        │
│                                                      │
│   Get templates, algorithms, code, constraints.      │
│   Assemble knowledge bundles for specific tasks.     │
│                                                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│   SYNTHESIZE                                         │
│   "I want to BUILD something. Give me a plan,        │
│    all the pieces, and working starter code."        │
│                                                      │
│   Get blueprints, assembled contexts, generated      │
│   code, complete implementation guides.              │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Full API Specification

```python
# api/app.py
"""
The Universal Knowledge Engine API.

Framework: FastAPI (async-native, auto-docs, validation)
Auth: API key based
Rate limiting: Token bucket per key
Response format: JSON with optional markdown rendering
"""

import os
import time
import hashlib
import logging
from datetime import datetime
from typing import Optional, Annotated
from contextlib import asynccontextmanager
from enum import Enum

from fastapi import FastAPI, HTTPException, Depends, Query, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response
from pydantic import BaseModel, Field
import uvicorn

from uke.core.store import UniversalKnowledgeStore
from uke.core.schema import KnowledgeNode, KnowledgeEdge
from uke.query.ai_interface import KnowledgeQuery

logger = logging.getLogger(__name__)


# ════════════════════════════════════════════════════════════════
# APPLICATION LIFECYCLE
# ════════════════════════════════════════════════════════════════

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup shared resources."""
    # Startup
    app.state.store = UniversalKnowledgeStore(
        os.environ.get("UKE_DB_PATH", "knowledge_base")
    )
    app.state.query_engine = KnowledgeQuery(app.state.store)
    app.state.start_time = time.time()
    logger.info("Knowledge Engine API started")
    
    yield
    
    # Shutdown
    logger.info("Knowledge Engine API shutting down")


app = FastAPI(
    title="Universal Knowledge Engine",
    description=(
        "Complete, generative knowledge database for programming languages, "
        "file formats, and software tools. Every response contains enough "
        "information to build working implementations."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ════════════════════════════════════════════════════════════════
# AUTHENTICATION & RATE LIMITING
# ════════════════════════════════════════════════════════════════

class RateLimiter:
    """Token bucket rate limiter per API key."""
    
    def __init__(self):
        self.buckets: dict[str, dict] = {}
    
    def check(self, api_key: str, cost: int = 1) -> bool:
        now = time.time()
        
        if api_key not in self.buckets:
            self.buckets[api_key] = {
                "tokens": 100,
                "max_tokens": 100,
                "refill_rate": 10,  # tokens per second
                "last_refill": now
            }
        
        bucket = self.buckets[api_key]
        
        # Refill tokens
        elapsed = now - bucket["last_refill"]
        bucket["tokens"] = min(
            bucket["max_tokens"],
            bucket["tokens"] + elapsed * bucket["refill_rate"]
        )
        bucket["last_refill"] = now
        
        # Check
        if bucket["tokens"] >= cost:
            bucket["tokens"] -= cost
            return True
        return False


rate_limiter = RateLimiter()


async def verify_api_key(
    x_api_key: Annotated[Optional[str], Header()] = None,
    api_key: Annotated[Optional[str], Query()] = None,
) -> str:
    """
    Verify API key from header or query parameter.
    For MVP, accept any non-empty key. 
    Production would check against a user database.
    """
    key = x_api_key or api_key
    
    if not key:
        raise HTTPException(
            status_code=401,
            detail="API key required. Pass via X-API-Key header or ?api_key= parameter"
        )
    
    if not rate_limiter.check(key):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please slow down."
        )
    
    return key


def get_store(request: Request) -> UniversalKnowledgeStore:
    return request.app.state.store


def get_query(request: Request) -> KnowledgeQuery:
    return request.app.state.query_engine


# ════════════════════════════════════════════════════════════════
# REQUEST / RESPONSE MODELS
# ════════════════════════════════════════════════════════════════

class ResponseFormat(str, Enum):
    FULL = "full"             # Everything, deeply nested
    SUMMARY = "summary"       # Key fields only
    CODE_ONLY = "code_only"   # Just the implementations
    AI_CONTEXT = "ai_context" # Optimized for LLM consumption


class ImplementationLanguage(str, Enum):
    PYTHON = "python"
    JAVASCRIPT = "javascript"
    TYPESCRIPT = "typescript"
    RUST = "rust"
    GO = "go"
    C = "c"
    CPP = "cpp"
    JAVA = "java"
    CSHARP = "csharp"


# ── Base response envelope ──

class APIResponse(BaseModel):
    """Standard response wrapper for all endpoints."""
    success: bool = True
    data: dict | list | None = None
    meta: dict = Field(default_factory=dict)
    errors: list[dict] = Field(default_factory=list)

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "data": {"key": "value"},
                "meta": {
                    "request_id": "abc123",
                    "took_ms": 42,
                    "node_count": 5
                },
                "errors": []
            }
        }


# ── Explore models ──

class TargetSummary(BaseModel):
    canonical_id: str
    name: str
    kind: str
    version: Optional[str] = None
    capability_count: int = 0
    vitality_score: Optional[float] = None
    tags: list[str] = []


class CapabilityNode(BaseModel):
    id: str
    name: str
    description: str
    complexity: Optional[str] = None
    category: Optional[str] = None
    requires: list[str] = []
    sub_capabilities: list[dict] = []
    has_structural_template: bool = False
    has_algorithm: bool = False


class GraphNeighbor(BaseModel):
    node_id: str
    node_type: str
    name: str
    relationship: str
    direction: str  # outgoing | incoming
    weight: float = 1.0


# ── Retrieve models ──

class StructuralTemplate(BaseModel):
    template_id: str
    capability_id: str
    format_type: str  # xml | json | binary | text
    template: str
    variables: list[dict]
    placement: Optional[dict] = None
    assembly_code: Optional[dict] = None
    complete_example: Optional[str] = None
    minimal_example: Optional[str] = None


class Algorithm(BaseModel):
    algorithm_id: str
    name: str
    purpose: str
    domain: str
    formulas: list[dict] = []
    pseudocode: list[str] = []
    implementations: dict = {}  # language -> {code, usage, output}
    parameters: list[dict] = []
    complexity: Optional[dict] = None
    test_vectors: list[dict] = []
    edge_cases: list[dict] = []
    optimizations: list[dict] = []


class KnowledgeBundle(BaseModel):
    """Everything needed to implement a capability."""
    capability: dict
    structural_templates: list[dict] = []
    algorithms: list[dict] = []
    coordinate_system: Optional[dict] = None
    constraints: list[dict] = []
    composition_rules: list[dict] = []
    prerequisites: list[dict] = []
    related_capabilities: list[dict] = []
    working_example: Optional[dict] = None


# ── Synthesize models ──

class AssemblyRequest(BaseModel):
    """Request to assemble knowledge for a specific task."""
    target: str = Field(description="Target format/language (e.g., 'pptx', 'python')")
    task: str = Field(description="What you want to accomplish")
    implementation_language: ImplementationLanguage = ImplementationLanguage.PYTHON
    include_tests: bool = True
    include_edge_cases: bool = True
    max_context_tokens: int = Field(default=8000, le=32000)

    class Config:
        json_schema_extra = {
            "example": {
                "target": "pptx",
                "task": "Create a slide with a red rectangle at position (2in, 3in) with size (4in, 1in) containing centered white text",
                "implementation_language": "python",
                "include_tests": True,
                "max_context_tokens": 8000
            }
        }


class AssemblyResponse(BaseModel):
    """Complete assembled knowledge for a task."""
    task: str
    target: str
    
    # The answer
    implementation: dict  # {code, language, dependencies, usage_example}
    
    # Supporting knowledge
    structural_templates_used: list[dict]
    algorithms_used: list[dict]
    coordinate_system: Optional[dict]
    constraints_applied: list[dict]
    
    # Verification
    test_code: Optional[str]
    expected_output: Optional[str]
    validation_steps: list[str]
    
    # Context for understanding
    explanation: str
    related_capabilities: list[str]
    caveats: list[str]


class BlueprintRequest(BaseModel):
    """Request for an application architecture blueprint."""
    target: str
    application_description: str
    implementation_language: ImplementationLanguage = ImplementationLanguage.PYTHON
    capabilities_needed: list[str] = Field(
        default_factory=list,
        description="Specific capability IDs to include. Empty = auto-detect."
    )

    class Config:
        json_schema_extra = {
            "example": {
                "target": "png",
                "application_description": "A command-line image editor that supports layers, filters (blur, sharpen, edge detect), and color adjustments (brightness, contrast, hue/saturation)",
                "implementation_language": "python",
                "capabilities_needed": []
            }
        }


class ConversionRequest(BaseModel):
    """Request for format conversion knowledge."""
    source_format: str
    target_format: str
    implementation_language: ImplementationLanguage = ImplementationLanguage.PYTHON

    class Config:
        json_schema_extra = {
            "example": {
                "source_format": "svg",
                "target_format": "png",
                "implementation_language": "python"
            }
        }


class SearchRequest(BaseModel):
    """Semantic search across the knowledge base."""
    query: str
    node_types: list[str] = Field(
        default_factory=list,
        description="Filter by node type: target, concept, algorithm, structure, blueprint"
    )
    targets: list[str] = Field(
        default_factory=list,
        description="Filter to specific targets"
    )
    limit: int = Field(default=20, le=100)

    class Config:
        json_schema_extra = {
            "example": {
                "query": "alpha compositing with Porter-Duff operators",
                "node_types": ["algorithm"],
                "targets": [],
                "limit": 10
            }
        }


class DiagnosticRequest(BaseModel):
    """Request to diagnose issues with generated files."""
    target: str = Field(description="File format (e.g., 'pptx', 'png')")
    problem_description: str = Field(
        description="Describe what's going wrong"
    )
    code_snippet: Optional[str] = Field(
        default=None,
        description="Your current code that's producing the problem"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "target": "pptx",
                "problem_description": "Shapes are appearing at wrong positions. I set x=100, y=200 but the shape appears in the top-left corner.",
                "code_snippet": "slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 100, 200, 300, 100)"
            }
        }


# ════════════════════════════════════════════════════════════════
# MIDDLEWARE
# ════════════════════════════════════════════════════════════════

@app.middleware("http")
async def add_request_metadata(request: Request, call_next):
    """Add timing, request ID, and logging to every request."""
    import uuid
    
    request_id = str(uuid.uuid4())[:12]
    start_time = time.time()
    
    request.state.request_id = request_id
    
    response = await call_next(request)
    
    duration_ms = (time.time() - start_time) * 1000
    
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Response-Time-Ms"] = f"{duration_ms:.1f}"
    
    logger.info(
        f"{request.method} {request.url.path} "
        f"→ {response.status_code} ({duration_ms:.0f}ms) "
        f"[{request_id}]"
    )
    
    return response


# ════════════════════════════════════════════════════════════════
#  SECTION 1: EXPLORE — Browse and discover knowledge
# ════════════════════════════════════════════════════════════════

@app.get(
    "/v1/targets",
    tags=["Explore"],
    summary="List all documented targets",
    description="Returns all programming languages, file formats, and software tools in the knowledge base.",
)
async def list_targets(
    kind: Optional[str] = Query(
        None, 
        description="Filter by kind: programming_language, image_format, document_format, etc."
    ),
    search: Optional[str] = Query(None, description="Search by name"),
    sort_by: Optional[str] = Query(
        "name", 
        description="Sort by: name, vitality, capability_count"
    ),
    limit: int = Query(50, le=500),
    offset: int = Query(0),
    api_key: str = Depends(verify_api_key),
    store: UniversalKnowledgeStore = Depends(get_store),
):
    """
    List all targets in the knowledge base.
    
    A "target" is anything we've documented: a programming language,
    file format, or software tool.
    
    Use this to discover what's available before diving deeper.
    """
    query = "SELECT * FROM nodes WHERE node_type = 'target'"
    params = []
    
    if kind:
        query += " AND json_extract(content, '$.kind') = ?"
        params.append(kind)
    
    if search:
        query += " AND name LIKE ?"
        params.append(f"%{search}%")
    
    if sort_by == "vitality":
        query += """
            ORDER BY COALESCE(
                (SELECT vitality FROM node_vitality WHERE node_id = nodes.canonical_id), 
                0
            ) DESC
        """
    elif sort_by == "capability_count":
        query += """
            ORDER BY (
                SELECT COUNT(*) FROM edges 
                WHERE source_id = nodes.canonical_id AND relationship = 'contains'
            ) DESC
        """
    else:
        query += " ORDER BY name"
    
    query += " LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    
    rows = store.db.execute(query, params).fetchall()
    
    targets = []
    for row in rows:
        node = store._row_to_node_dict(row)
        content = node.get("content", {})
        
        cap_count = store.db.execute("""
            SELECT COUNT(*) FROM edges 
            WHERE source_id = ? AND relationship = 'contains'
        """, (node["canonical_id"],)).fetchone()[0]
        
        vitality = store.db.execute("""
            SELECT vitality FROM node_vitality WHERE node_id = ?
        """, (node["canonical_id"],)).fetchone()
        
        targets.append({
            "id": node["canonical_id"],
            "name": node["name"],
            "kind": content.get("kind", "unknown"),
            "version": content.get("version"),
            "capability_count": cap_count,
            "vitality_score": round(vitality[0], 3) if vitality else None,
            "tags": node.get("tags", []),
            "extensions": content.get("extensions", []),
            "media_types": content.get("media_types", []),
        })
    
    total_count = store.db.execute(
        "SELECT COUNT(*) FROM nodes WHERE node_type = 'target'"
    ).fetchone()[0]
    
    return APIResponse(
        data=targets,
        meta={
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "returned": len(targets)
        }
    )


@app.get(
    "/v1/targets/{target_id}",
    tags=["Explore"],
    summary="Get detailed information about a specific target",
)
async def get_target(
    target_id: str,
    include_capabilities: bool = Query(
        True, description="Include full capability tree"
    ),
    include_vitality: bool = Query(
        True, description="Include vitality/health info"
    ),
    api_key: str = Depends(verify_api_key),
    store: UniversalKnowledgeStore = Depends(get_store),
):
    """
    Get complete information about a target, including its 
    capability tree, coordinate system, and health metrics.
    """
    # Normalize target_id
    if not target_id.startswith("target:"):
        target_id = f"target:{target_id}"
    
    node = store.get_node(target_id)
    if not node:
        raise HTTPException(
            status_code=404,
            detail=f"Target '{target_id}' not found. Use GET /v1/targets to list available targets."
        )
    
    result = {
        "id": node["canonical_id"],
        "name": node["name"],
        "content": node["content"],
        "version": node.get("version"),
        "tags": node.get("tags", []),
        "confidence": node.get("confidence"),
    }
    
    if include_capabilities:
        caps = store.db.execute("""
            SELECT n.canonical_id, n.name, n.content
            FROM edges e
            JOIN nodes n ON e.target_id = n.canonical_id
            WHERE e.source_id = ? AND e.relationship = 'contains'
            ORDER BY n.name
        """, (target_id,)).fetchall()
        
        capability_tree = {}
        for cap_row in caps:
            cap = store._row_to_node_dict(cap_row)
            content = cap.get("content", {})
            category = content.get("_category", content.get("category", "general"))
            
            if category not in capability_tree:
                capability_tree[category] = []
            
            # Check if structural template and algorithm exist
            has_template = store.db.execute("""
                SELECT 1 FROM edges 
                WHERE target_id = ? AND relationship = 'template_for'
                LIMIT 1
            """, (cap["canonical_id"],)).fetchone() is not None
            
            has_algorithm = store.db.execute("""
                SELECT 1 FROM edges 
                WHERE source_id = ? AND relationship = 'uses_algorithm'
                LIMIT 1
            """, (cap["canonical_id"],)).fetchone() is not None
            
            capability_tree[category].append({
                "id": cap["canonical_id"],
                "name": cap["name"],
                "description": content.get("description", ""),
                "complexity": content.get("complexity"),
                "has_template": has_template,
                "has_algorithm": has_algorithm,
                "requires": content.get("requires", []),
            })
        
        result["capabilities"] = capability_tree
        result["capability_count"] = sum(len(v) for v in capability_tree.values())
    
    if include_vitality:
        vitality = store.db.execute("""
            SELECT freshness, correctness, completeness, vitality,
                   decay_model, last_validated, predicted_30d,
                   predicted_90d, predicted_180d
            FROM node_vitality WHERE node_id = ?
        """, (target_id,)).fetchone()
        
        if vitality:
            result["vitality"] = {
                "freshness": round(vitality[0], 4),
                "correctness": round(vitality[1], 4),
                "completeness": round(vitality[2], 4),
                "overall": round(vitality[3], 4),
                "decay_model": vitality[4],
                "last_validated": vitality[5],
                "forecast": {
                    "30_days": round(vitality[6], 4) if vitality[6] else None,
                    "90_days": round(vitality[7], 4) if vitality[7] else None,
                    "180_days": round(vitality[8], 4) if vitality[8] else None,
                }
            }
    
    return APIResponse(data=result)


@app.get(
    "/v1/targets/{target_id}/capabilities",
    tags=["Explore"],
    summary="List all capabilities of a target",
)
async def list_capabilities(
    target_id: str,
    category: Optional[str] = Query(None, description="Filter by category"),
    complexity: Optional[str] = Query(None, description="Filter by complexity: basic, intermediate, advanced, expert"),
    has_algorithm: Optional[bool] = Query(None, description="Filter to capabilities with algorithms"),
    search: Optional[str] = Query(None, description="Search capability names"),
    api_key: str = Depends(verify_api_key),
    store: UniversalKnowledgeStore = Depends(get_store),
):
    """
    List capabilities of a target with filtering options.
    
    Each capability represents something the format can do, 
    like "draw a rectangle" or "apply Gaussian blur."
    """
    if not target_id.startswith("target:"):
        target_id = f"target:{target_id}"
    
    caps = store.db.execute("""
        SELECT n.canonical_id, n.name, n.content
        FROM edges e
        JOIN nodes n ON e.target_id = n.canonical_id
        WHERE e.source_id = ? AND e.relationship = 'contains'
        ORDER BY n.name
    """, (target_id,)).fetchall()
    
    import json
    results = []
    for row in caps:
        node = store._row_to_node_dict(row)
        content = node.get("content", {})
        
        # Apply filters
        if category and content.get("_category", content.get("category")) != category:
            continue
        if complexity and content.get("complexity") != complexity:
            continue
        if search and search.lower() not in node["name"].lower():
            continue
        
        has_algo = store.db.execute("""
            SELECT 1 FROM edges 
            WHERE source_id = ? AND relationship = 'uses_algorithm'
            LIMIT 1
        """, (node["canonical_id"],)).fetchone() is not None
        
        if has_algorithm is not None and has_algo != has_algorithm:
            continue
        
        results.append({
            "id": node["canonical_id"],
            "name": node["name"],
            "description": content.get("description", ""),
            "category": content.get("_category", content.get("category")),
            "complexity": content.get("complexity"),
            "requires": content.get("requires", []),
            "has_algorithm": has_algo,
            "parameters": content.get("parameters", []),
        })
    
    return APIResponse(
        data=results,
        meta={"total": len(results), "target": target_id}
    )


@app.get(
    "/v1/graph/neighbors/{node_id:path}",
    tags=["Explore"],
    summary="Get connected nodes in the knowledge graph",
)
async def get_neighbors(
    node_id: str,
    relationship: Optional[str] = Query(
        None, 
        description="Filter by relationship type: implements, uses_algorithm, template_for, depends_on, etc."
    ),
    direction: str = Query(
        "both",
        description="Edge direction: outgoing, incoming, both"
    ),
    depth: int = Query(1, le=4, description="Traversal depth (1-4)"),
    api_key: str = Depends(verify_api_key),
    store: UniversalKnowledgeStore = Depends(get_store),
):
    """
    Navigate the knowledge graph from any node.
    
    Find what algorithms a capability uses, what targets implement 
    a concept, or what capabilities require each other.
    """
    node = store.get_node(node_id)
    if not node:
        raise HTTPException(status_code=404, detail=f"Node '{node_id}' not found")
    
    if depth == 1:
        neighbors = store.get_neighbors(
            node_id, 
            relationship=relationship, 
            direction=direction
        )
        
        results = []
        for n_row in (neighbors or []):
            n = store._row_to_node_dict(n_row) if not isinstance(n_row, dict) else n_row
            results.append({
                "node_id": n.get("canonical_id"),
                "node_type": n.get("node_type"),
                "name": n.get("name"),
                "relationship": n.get("relationship", "unknown"),
            })
        
        return APIResponse(
            data={"center": node_id, "neighbors": results},
            meta={"depth": 1, "count": len(results)}
        )
    else:
        rel_filter = [relationship] if relationship else None
        subgraph = store.get_subgraph(node_id, depth=depth, 
                                       relationship_filter=rel_filter)
        return APIResponse(
            data=subgraph,
            meta={"depth": depth, "node_count": len(subgraph["nodes"]),
                   "edge_count": len(subgraph["edges"])}
        )


@app.get(
    "/v1/concepts",
    tags=["Explore"],
    summary="List cross-cutting concepts",
    description="Concepts are ideas that span multiple targets: 'compression', 'color space', 'animation', etc.",
)
async def list_concepts(
    domain: Optional[str] = Query(
        None,
        description="Filter by domain: graphics_2d, compression, color_science, geometry, etc."
    ),
    search: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    api_key: str = Depends(verify_api_key),
    store: UniversalKnowledgeStore = Depends(get_store),
):
    query = "SELECT * FROM nodes WHERE node_type = 'concept'"
    params = []
    
    if domain:
        query += " AND json_extract(content, '$.domain') = ?"
        params.append(domain)
    
    if search:
        query += " AND (name LIKE ? OR json_extract(content, '$.description') LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%"])
    
    query += " ORDER BY name LIMIT ?"
    params.append(limit)
    
    rows = store.db.execute(query, params).fetchall()
    
    results = []
    for row in rows:
        node = store._row_to_node_dict(row)
        content = node.get("content", {})
        
        target_count = store.db.execute("""
            SELECT COUNT(*) FROM edges 
            WHERE target_id = ? AND relationship = 'implements'
        """, (node["canonical_id"],)).fetchone()[0]
        
        results.append({
            "id": node["canonical_id"],
            "name": node["name"],
            "domain": content.get("domain"),
            "description": content.get("description", ""),
            "implemented_by_targets": target_count,
        })
    
    return APIResponse(data=results, meta={"total": len(results)})


# ════════════════════════════════════════════════════════════════
#  SECTION 2: RETRIEVE — Get specific knowledge
# ════════════════════════════════════════════════════════════════

@app.get(
    "/v1/capabilities/{capability_id:path}/bundle",
    tags=["Retrieve"],
    summary="Get everything needed to implement a capability",
    description=(
        "Returns the complete knowledge bundle: structural templates, "
        "algorithms, coordinate system, constraints, and working code. "
        "This is the primary endpoint for developers implementing features."
    ),
)
async def get_capability_bundle(
    capability_id: str,
    implementation_language: ImplementationLanguage = Query(
        ImplementationLanguage.PYTHON
    ),
    include_prerequisites: bool = Query(True),
    include_edge_cases: bool = Query(True),
    response_format: ResponseFormat = Query(ResponseFormat.FULL),
    api_key: str = Depends(verify_api_key),
    store: UniversalKnowledgeStore = Depends(get_store),
    query_engine: KnowledgeQuery = Depends(get_query),
):
    """
    The most important endpoint in the API.
    
    Given a capability ID (like "pptx:draw_rectangle" or "png:alpha_compositing"),
    returns EVERYTHING a developer needs to implement it:
    
    - **Structural templates**: exact file structures with substitution variables
    - **Algorithms**: mathematical foundations and working code
    - **Coordinate system**: how positioning and units work
    - **Constraints**: valid ranges, rules, limits
    - **Composition rules**: how this interacts with other features  
    - **Working code**: complete, runnable implementation
    - **Test vectors**: input/output pairs to verify your implementation
    """
    node = store.get_node(capability_id)
    if not node:
        raise HTTPException(
            status_code=404,
            detail=f"Capability '{capability_id}' not found. "
                   f"Use GET /v1/targets/{{target}}/capabilities to list capabilities."
        )
    
    # Get structural templates
    template_edges = store.db.execute("""
        SELECT n.* FROM nodes n
        JOIN edges e ON n.canonical_id = e.source_id
        WHERE e.target_id = ? AND e.relationship = 'template_for'
    """, (capability_id,)).fetchall()
    
    templates = [store._row_to_node_dict(r) for r in template_edges]
    
    # Get algorithms
    algo_edges = store.db.execute("""
        SELECT n.* FROM nodes n
        JOIN edges e ON n.canonical_id = e.target_id
        WHERE e.source_id = ? AND e.relationship = 'uses_algorithm'
    """, (capability_id,)).fetchall()
    
    algorithms = [store._row_to_node_dict(r) for r in algo_edges]
    
    # Filter implementations to requested language
    lang = implementation_language.value
    for algo in algorithms:
        content = algo.get("content", {})
        impls = content.get("implementations", {})
        if lang in impls:
            algo["preferred_implementation"] = impls[lang]
        elif impls:
            first_lang = next(iter(impls))
            algo["preferred_implementation"] = impls[first_lang]
            algo["preferred_implementation"]["note"] = (
                f"No {lang} implementation available. Showing {first_lang}."
            )
    
    # Get coordinate system from parent target
    target_id = ":".join(capability_id.split(":")[:2])
    coord_node = store.get_node(f"{target_id}:coordinate_system")
    
    # Get composition rules
    composition_rows = store.db.execute("""
        SELECT n.content FROM nodes n
        JOIN edges e ON (n.canonical_id = e.source_id OR n.canonical_id = e.target_id)
        WHERE n.tags LIKE '%composition%'
          AND (e.source_id = ? OR e.target_id = ?)
    """, (capability_id, capability_id)).fetchall()
    
    import json
    composition_rules = []
    for row in composition_rows:
        try:
            composition_rules.append(json.loads(row[0]) if isinstance(row[0], str) else row[0])
        except json.JSONDecodeError:
            pass
    
    # Get prerequisites
    prerequisites = []
    if include_prerequisites:
        prereq_rows = store.db.execute("""
            SELECT n.canonical_id, n.name, n.content FROM nodes n
            JOIN edges e ON n.canonical_id = e.target_id
            WHERE e.source_id = ? AND e.relationship IN ('depends_on', 'prerequisite')
        """, (capability_id,)).fetchall()
        prerequisites = [store._row_to_node_dict(r) for r in prereq_rows]
    
    # Assemble bundle
    bundle = {
        "capability": {
            "id": node["canonical_id"],
            "name": node["name"],
            "content": node["content"],
        },
        "structural_templates": [
            {
                "id": t["canonical_id"],
                "name": t["name"],
                "content": t["content"],
            }
            for t in templates
        ],
        "algorithms": [
            {
                "id": a["canonical_id"],
                "name": a["name"],
                "content": a["content"],
                "preferred_implementation": a.get("preferred_implementation"),
            }
            for a in algorithms
        ],
        "coordinate_system": coord_node["content"] if coord_node else None,
        "composition_rules": composition_rules,
        "prerequisites": [
            {"id": p["canonical_id"], "name": p["name"]}
            for p in prerequisites
        ],
    }
    
    # Format based on requested response format
    if response_format == ResponseFormat.CODE_ONLY:
        bundle = _extract_code_only(bundle, lang)
    elif response_format == ResponseFormat.SUMMARY:
        bundle = _extract_summary(bundle)
    elif response_format == ResponseFormat.AI_CONTEXT:
        bundle = _format_for_ai_context(bundle)
    
    return APIResponse(
        data=bundle,
        meta={
            "capability_id": capability_id,
            "implementation_language": lang,
            "template_count": len(templates),
            "algorithm_count": len(algorithms),
        }
    )


@app.get(
    "/v1/algorithms/{algorithm_id:path}",
    tags=["Retrieve"],
    summary="Get a specific algorithm with full implementation",
)
async def get_algorithm(
    algorithm_id: str,
    implementation_language: ImplementationLanguage = Query(
        ImplementationLanguage.PYTHON
    ),
    include_optimizations: bool = Query(True),
    include_test_vectors: bool = Query(True),
    api_key: str = Depends(verify_api_key),
    store: UniversalKnowledgeStore = Depends(get_store),
):
    """
    Get a specific algorithm with:
    - Mathematical foundation (formulas, derivations)
    - Pseudocode
    - Working implementation in your preferred language
    - Performance optimizations
    - Test vectors for verification
    - Edge case handling
    """
    node = store.get_node(algorithm_id)
    if not node:
        raise HTTPException(status_code=404, detail=f"Algorithm '{algorithm_id}' not found")
    
    content = node.get("content", {})
    lang = implementation_language.value
    
    result = {
        "id": node["canonical_id"],
        "name": node["name"],
        "purpose": content.get("purpose"),
        "domain": content.get("domain"),
        "mathematical_foundation": content.get("mathematical_foundation"),
        "pseudocode": content.get("pseudocode"),
        "complexity": content.get("complexity"),
        "parameters": content.get("parameters"),
        "edge_cases": content.get("edge_cases") if include_optimizations else [],
        "numerical_stability": content.get("numerical_stability"),
    }
    
    # Get preferred implementation
    impls = content.get("implementations", {})
    if lang in impls:
        result["implementation"] = impls[lang]
        result["implementation"]["language"] = lang
    elif impls:
        first_lang = next(iter(impls))
        result["implementation"] = impls[first_lang]
        result["implementation"]["language"] = first_lang
        result["implementation"]["note"] = f"Showing {first_lang} (no {lang} available)"
    
    # All available languages
    result["available_languages"] = list(impls.keys())
    
    if include_optimizations:
        result["optimizations"] = content.get("optimizations", [])
    
    if include_test_vectors:
        result["test_vectors"] = content.get("test_vectors", [])
    
    # Which targets use this algorithm
    users = store.db.execute("""
        SELECT e.source_id, n.name FROM edges e
        JOIN nodes n ON e.source_id = n.canonical_id
        WHERE e.target_id = ? AND e.relationship = 'uses_algorithm'
    """, (algorithm_id,)).fetchall()
    
    result["used_by"] = [{"id": u[0], "name": u[1]} for u in users]
    
    return APIResponse(data=result)


@app.get(
    "/v1/structures/{structure_id:path}",
    tags=["Retrieve"],
    summary="Get a structural template",
)
async def get_structure(
    structure_id: str,
    filled_example: bool = Query(
        True, description="Include a filled-in example"
    ),
    api_key: str = Depends(verify_api_key),
    store: UniversalKnowledgeStore = Depends(get_store),
):
    """
    Get a structural template with all variables, constraints,
    placement rules, and assembly instructions.
    
    Structural templates are exact file structures (XML, JSON, binary layouts)
    with substitution points that you fill in with your values.
    """
    node = store.get_node(structure_id)
    if not node:
        raise HTTPException(status_code=404, detail=f"Structure '{structure_id}' not found")
    
    result = {
        "id": node["canonical_id"],
        "name": node["name"],
        "content": node["content"],
    }
    
    # Find which capabilities this template serves
    cap_edges = store.db.execute("""
        SELECT e.target_id, n.name FROM edges e
        JOIN nodes n ON e.target_id = n.canonical_id
        WHERE e.source_id = ? AND e.relationship = 'template_for'
    """, (structure_id,)).fetchall()
    
    result["serves_capabilities"] = [
        {"id": c[0], "name": c[1]} for c in cap_edges
    ]
    
    return APIResponse(data=result)


@app.get(
    "/v1/targets/{target_id}/coordinate-system",
    tags=["Retrieve"],
    summary="Get the coordinate and unit system for a target",
)
async def get_coordinate_system(
    target_id: str,
    api_key: str = Depends(verify_api_key),
    store: UniversalKnowledgeStore = Depends(get_store),
):
    """
    Get the complete coordinate system reference for a target.
    
    Includes:
    - Native units and conversion formulas
    - Origin point and axis directions
    - Default dimensions for standard presets
    - Transform system (rotate, scale, skew)
    - Color system
    - Helper functions for common conversions
    """
    if not target_id.startswith("target:"):
        target_id = f"target:{target_id}"
    
    coord_id = f"{target_id}:coordinate_system"
    node = store.get_node(coord_id)
    
    if not node:
        # Try finding it through the graph
        results = store.db.execute("""
            SELECT * FROM nodes 
            WHERE canonical_id LIKE ? AND tags LIKE '%coordinate%'
        """, (f"%{target_id.split(':')[-1]}%",)).fetchall()
        
        if results:
            node = store._row_to_node_dict(results[0])
    
    if not node:
        raise HTTPException(
            status_code=404,
            detail=f"Coordinate system not found for '{target_id}'"
        )
    
    return APIResponse(data=node["content"])


@app.get(
    "/v1/targets/{target_id}/minimal-file",
    tags=["Retrieve"],
    summary="Get the minimal valid file template and generation code",
)
async def get_minimal_file(
    target_id: str,
    implementation_language: ImplementationLanguage = Query(
        ImplementationLanguage.PYTHON
    ),
    api_key: str = Depends(verify_api_key),
    store: UniversalKnowledgeStore = Depends(get_store),
):
    """
    Get the smallest possible valid file for a format,
    with complete code to generate it.
    
    This is your starting point for any file generation project.
    The code produces a valid file that opens without errors
    in standard software.
    """
    if not target_id.startswith("target:"):
        target_id = f"target:{target_id}"
    
    target_key = target_id.split(":")[-1]
    
    node = store.db.execute("""
        SELECT * FROM nodes 
        WHERE canonical_id LIKE ? 
          AND (name LIKE '%minimal%' OR canonical_id LIKE '%minimal%')
        LIMIT 1
    """, (f"%{target_key}%minimal%",)).fetchall()
    
    if not node:
        raise HTTPException(
            status_code=404,
            detail=f"Minimal file template not found for '{target_id}'"
        )
    
    result = store._row_to_node_dict(node[0])
    return APIResponse(data=result["content"])


# ════════════════════════════════════════════════════════════════
#  SECTION 3: SYNTHESIZE — Build something from knowledge
# ════════════════════════════════════════════════════════════════

@app.post(
    "/v1/assemble",
    tags=["Synthesize"],
    summary="Assemble knowledge for a specific task",
    description=(
        "Describe what you want to do, and the API assembles all "
        "relevant knowledge: templates, algorithms, coordinate systems, "
        "constraints, and working code. Optimized for feeding to AI "
        "coding assistants or for direct developer use."
    ),
)
async def assemble_knowledge(
    request: AssemblyRequest,
    api_key: str = Depends(verify_api_key),
    store: UniversalKnowledgeStore = Depends(get_store),
    query_engine: KnowledgeQuery = Depends(get_query),
):
    """
    The smart assembly endpoint.
    
    Instead of manually navigating the graph, describe your task
    and the API finds all relevant knowledge pieces and assembles
    them into a coherent package.
    
    Example tasks:
    - "Create a PPTX slide with a red rectangle containing white text"
    - "Encode raw pixel data as a PNG with alpha transparency"
    - "Parse a PDF and extract all text content with positions"
    - "Apply Gaussian blur to an image with configurable radius"
    """
    target_id = request.target
    if not target_id.startswith("target:"):
        target_id = f"target:{target_id}"
    
    # Verify target exists
    target = store.get_node(target_id)
    if not target:
        raise HTTPException(
            status_code=404,
            detail=f"Target '{request.target}' not found"
        )
    
    # Assemble context using the query engine
    context = query_engine.assemble_context_for_task(
        task_description=request.task,
        target_id=target_id,
        max_tokens=request.max_context_tokens
    )
    
    # Also retrieve specific knowledge pieces
    relevant_nodes = store.search_text(request.task, limit=20)
    
    # Categorize by type
    templates = []
    algorithms = []
    constraints = []
    
    for node in relevant_nodes:
        if node["node_type"] == "structure":
            templates.append({
                "id": node["canonical_id"],
                "name": node["name"],
                "content": node["content"],
            })
        elif node["node_type"] == "algorithm":
            algo_content = node["content"]
            impls = algo_content.get("implementations", {})
            lang = request.implementation_language.value
            
            algorithms.append({
                "id": node["canonical_id"],
                "name": node["name"],
                "purpose": algo_content.get("purpose"),
                "implementation": impls.get(lang, impls.get(next(iter(impls), ""), {})),
                "parameters": algo_content.get("parameters", []),
                "test_vectors": algo_content.get("test_vectors", []) if request.include_tests else [],
            })
    
    # Get coordinate system
    coord_node = store.get_node(f"{target_id}:coordinate_system")
    
    response_data = {
        "task": request.task,
        "target": request.target,
        "implementation_language": request.implementation_language.value,
        
        "assembled_context": context,
        
        "structural_templates": templates,
        "algorithms": algorithms,
        
        "coordinate_system": coord_node["content"] if coord_node else None,
        
        "usage_guide": (
            f"To implement '{request.task}':\n"
            f"1. Use the structural templates to construct the file structure\n"
            f"2. Apply algorithms for any computational requirements\n"
            f"3. Use the coordinate system reference for positioning\n"
            f"4. Validate against the constraints listed below\n"
        ),
    }
    
    if request.include_tests:
        test_vectors = []
        for algo in algorithms:
            test_vectors.extend(algo.get("test_vectors", []))
        response_data["test_vectors"] = test_vectors
    
    return APIResponse(
        data=response_data,
        meta={
            "templates_found": len(templates),
            "algorithms_found": len(algorithms),
            "context_tokens_estimated": len(context.split()) if context else 0,
        }
    )


@app.post(
    "/v1/blueprint",
    tags=["Synthesize"],
    summary="Get a complete application architecture blueprint",
)
async def get_blueprint(
    request: BlueprintRequest,
    api_key: str = Depends(verify_api_key),
    store: UniversalKnowledgeStore = Depends(get_store),
    query_engine: KnowledgeQuery = Depends(get_query),
):
    """
    Get a complete software architecture blueprint for building
    an application that works with a specific format.
    
    Includes:
    - Component architecture with dependencies
    - Build sequence (what to implement first)
    - Code skeletons for each component
    - Which algorithms and templates each component needs
    - Minimal viable implementation (complete working code)
    """
    target_id = f"target:{request.target}" if not request.target.startswith("target:") else request.target
    
    target = store.get_node(target_id)
    if not target:
        raise HTTPException(status_code=404, detail=f"Target '{request.target}' not found")
    
    # Search for matching blueprints
    blueprints = store.db.execute("""
        SELECT * FROM nodes 
        WHERE node_type = 'blueprint'
          AND canonical_id LIKE ?
        ORDER BY name
    """, (f"%{request.target.lower()}%",)).fetchall()
    
    if not blueprints:
        # Try semantic search
        blueprints_search = store.search_text(
            f"{request.application_description} {request.target}",
            limit=5
        )
        blueprints = [b for b in blueprints_search if b["node_type"] == "blueprint"]
    else:
        blueprints = [store._row_to_node_dict(b) for b in blueprints]
    
    # Find best matching blueprint
    best_match = None
    best_score = 0
    
    desc_words = set(request.application_description.lower().split())
    for bp in blueprints:
        bp_words = set(bp["name"].lower().split())
        bp_words.update(str(bp.get("content", {}).get("application_type", "")).lower().split())
        overlap = len(desc_words & bp_words)
        if overlap > best_score:
            best_score = overlap
            best_match = bp
    
    if not best_match and blueprints:
        best_match = blueprints[0] if isinstance(blueprints[0], dict) else store._row_to_node_dict(blueprints[0])
    
    if not best_match:
        # No pre-built blueprint — assemble one from capabilities
        return APIResponse(
            data={
                "message": f"No pre-built blueprint found for '{request.application_description}'. "
                           f"Use POST /v1/assemble to gather specific capabilities.",
                "available_blueprints": [
                    {"id": b["canonical_id"], "name": b["name"]}
                    for b in (blueprints if blueprints else [])
                ]
            },
            meta={"match_found": False}
        )
    
    # Get all dependencies of the blueprint
    subgraph = store.get_subgraph(
        best_match["canonical_id"],
        depth=2,
        relationship_filter=["builds_with", "uses_algorithm", "template_for"]
    )
    
    return APIResponse(
        data={
            "blueprint": best_match,
            "required_algorithms": [
                n for n in subgraph["nodes"].values()
                if n["node_type"] == "algorithm"
            ],
            "required_structures": [
                n for n in subgraph["nodes"].values()
                if n["node_type"] == "structure"
            ],
            "total_dependencies": len(subgraph["nodes"]),
        },
        meta={
            "blueprint_id": best_match["canonical_id"],
            "match_score": best_score,
        }
    )


@app.post(
    "/v1/diagnose",
    tags=["Synthesize"],
    summary="Diagnose issues with file generation or parsing",
)
async def diagnose_issue(
    request: DiagnosticRequest,
    api_key: str = Depends(verify_api_key),
    store: UniversalKnowledgeStore = Depends(get_store),
    query_engine: KnowledgeQuery = Depends(get_query),
):
    """
    Describe a problem you're having with a file format, and the API
    will suggest likely causes based on the knowledge database.
    
    Common issues it can diagnose:
    - Wrong positioning (coordinate system misunderstanding)
    - Corrupt files (missing required structures)
    - Wrong colors (color space issues)
    - Missing content (relationship references not established)
    - Performance problems (inefficient algorithm choice)
    """
    target_id = f"target:{request.target}" if not request.target.startswith("target:") else request.target
    
    target = store.get_node(target_id)
    if not target:
        raise HTTPException(status_code=404, detail=f"Target '{request.target}' not found")
    
    # Search for relevant knowledge
    relevant = store.search_text(request.problem_description, limit=15)
    
    # Get coordinate system (many issues are coordinate-related)
    coord = store.get_node(f"{target_id}:coordinate_system")
    
    # Get constraints (many issues are constraint violations)
    constraints = store.db.execute("""
        SELECT n.name, n.content FROM nodes n
        WHERE n.canonical_id LIKE ?
          AND (n.tags LIKE '%constraint%' OR n.tags LIKE '%validation%')
    """, (f"%{request.target.lower()}%",)).fetchall()
    
    # Build diagnostic response
    possible_causes = []
    
    problem_lower = request.problem_description.lower()
    
    # Heuristic cause detection
    if any(word in problem_lower for word in ["position", "location", "offset", "wrong place", "top-left", "corner"]):
        possible_causes.append({
            "category": "Coordinate System",
            "likelihood": "high",
            "explanation": "Position values may be in wrong units. Most formats use their own unit system, not pixels or inches directly.",
            "relevant_knowledge": coord["content"] if coord else "Coordinate system data not available",
            "fix_suggestion": "Check the coordinate system reference below for unit conversion formulas."
        })
    
    if any(word in problem_lower for word in ["corrupt", "can't open", "invalid", "broken", "error opening"]):
        possible_causes.append({
            "category": "Structural Integrity",
            "likelihood": "high",
            "explanation": "The file structure may be missing required elements or relationships.",
            "fix_suggestion": "Compare your output against the minimal valid file template. Use GET /v1/targets/{target}/minimal-file to get the template."
        })
    
    if any(word in problem_lower for word in ["color", "wrong color", "transparent", "alpha", "opacity"]):
        possible_causes.append({
            "category": "Color System",
            "likelihood": "medium",
            "explanation": "Color values may be in wrong format, range, or color space.",
            "relevant_knowledge": coord["content"].get("color_system") if coord else None,
            "fix_suggestion": "Check the color system reference for value ranges and representations."
        })
    
    if any(word in problem_lower for word in ["missing", "not showing", "invisible", "blank"]):
        possible_causes.append({
            "category": "Relationship References",
            "likelihood": "medium",
            "explanation": "Elements in many formats require relationship entries linking them to parent structures. Missing relationships cause elements to be silently ignored.",
            "fix_suggestion": "Check the structural template for this capability — it lists all required relationships."
        })
    
    # Add relevant constraints
    import json
    constraint_violations = []
    for name, content_json in constraints:
        try:
            content = json.loads(content_json) if isinstance(content_json, str) else content_json
            constraint_violations.append({
                "constraint": name,
                "details": content
            })
        except (json.JSONDecodeError, TypeError):
            pass
    
    return APIResponse(
        data={
            "problem": request.problem_description,
            "target": request.target,
            "possible_causes": possible_causes,
            "relevant_constraints": constraint_violations[:10],
            "coordinate_system_reference": coord["content"] if coord else None,
            "related_knowledge": [
                {"id": n["canonical_id"], "name": n["name"], "type": n["node_type"]}
                for n in relevant[:10]
            ],
            "recommended_actions": [
                f"GET /v1/targets/{request.target}/minimal-file — Compare against valid file structure",
                f"GET /v1/targets/{request.target}/coordinate-system — Verify unit conversions",
                f"GET /v1/targets/{request.target}/capabilities — Find the capability you're implementing and get its bundle",
            ]
        }
    )


@app.post(
    "/v1/convert",
    tags=["Synthesize"],
    summary="Get conversion knowledge between two formats",
)
async def get_conversion_guide(
    request: ConversionRequest,
    api_key: str = Depends(verify_api_key),
    store: UniversalKnowledgeStore = Depends(get_store),
    query_engine: KnowledgeQuery = Depends(get_query),
):
    """
    Get everything needed to convert between two formats.
    
    Includes:
    - Conversion path through the knowledge graph
    - Shared concepts and algorithms
    - What's preserved and what's lost in conversion
    - Algorithm pipeline for the conversion
    - Working code example
    """
    source_id = f"target:{request.source_format}" if not request.source_format.startswith("target:") else request.source_format
    target_id = f"target:{request.target_format}" if not request.target_format.startswith("target:") else request.target_format
    
    source = store.get_node(source_id)
    target_node = store.get_node(target_id)
    
    if not source:
        raise HTTPException(status_code=404, detail=f"Source format '{request.source_format}' not found")
    if not target_node:
        raise HTTPException(status_code=404, detail=f"Target format '{request.target_format}' not found")
    
    # Compare the two formats
    comparison = query_engine.compare_targets(source_id, target_id)
    
    # Find conversion path
    paths = store.find_path(source_id, target_id, max_depth=4)
    
    return APIResponse(
        data={
            "source": {"id": source_id, "name": source["name"]},
            "target": {"id": target_id, "name": target_node["name"]},
            "shared_algorithms": comparison.get("shared_algorithms", []),
            "shared_concepts": comparison.get("shared_concepts", []),
            "unique_to_source": comparison.get("unique_to_a", []),
            "unique_to_target": comparison.get("unique_to_b", []),
            "conversion_paths": paths,
            "similarity_score": comparison.get("similarity_score", 0),
            "conversion_notes": {
                "preservable": "Features shared between both formats can be converted losslessly",
                "lossy": f"Features unique to {request.source_format} will be lost or approximated",
                "unavailable": f"Features unique to {request.target_format} cannot be populated from source"
            }
        },
        meta={
            "path_count": len(paths),
            "shared_algorithm_count": len(comparison.get("shared_algorithms", [])),
        }
    )


@app.post(
    "/v1/compare",
    tags=["Synthesize"],
    summary="Compare two or more targets",
)
async def compare_targets(
    targets: list[str] = Query(
        description="Two or more target IDs to compare",
        min_length=2
    ),
    api_key: str = Depends(verify_api_key),
    store: UniversalKnowledgeStore = Depends(get_store),
    query_engine: KnowledgeQuery = Depends(get_query),
):
    """
    Compare multiple targets to understand their similarities,
    differences, shared algorithms, and conversion possibilities.
    
    Useful for choosing between formats or understanding format families.
    """
    target_ids = [
        t if t.startswith("target:") else f"target:{t}" 
        for t in targets
    ]
    
    # Verify all targets exist
    target_nodes = {}
    for tid in target_ids:
        node = store.get_node(tid)
        if not node:
            raise HTTPException(status_code=404, detail=f"Target '{tid}' not found")
        target_nodes[tid] = node
    
    # Pairwise comparison
    comparisons = []
    for i in range(len(target_ids)):
        for j in range(i + 1, len(target_ids)):
            comp = query_engine.compare_targets(target_ids[i], target_ids[j])
            comparisons.append({
                "pair": [target_ids[i], target_ids[j]],
                "similarity": comp.get("similarity_score", 0),
                "shared_algorithm_count": len(comp.get("shared_algorithms", [])),
                "shared_concept_count": len(comp.get("shared_concepts", [])),
            })
    
    return APIResponse(
        data={
            "targets": {
                tid: {
                    "name": node["name"],
                    "kind": node.get("content", {}).get("kind"),
                }
                for tid, node in target_nodes.items()
            },
            "comparisons": comparisons,
        }
    )


# ════════════════════════════════════════════════════════════════
#  SECTION 4: SEARCH — Find knowledge across the entire graph
# ════════════════════════════════════════════════════════════════

@app.post(
    "/v1/search",
    tags=["Search"],
    summary="Search across the entire knowledge base",
)
async def search_knowledge(
    request: SearchRequest,
    api_key: str = Depends(verify_api_key),
    store: UniversalKnowledgeStore = Depends(get_store),
):
    """
    Full-text and semantic search across all knowledge nodes.
    
    Search algorithms by name, find concepts across formats,
    or locate specific structural patterns.
    """
    results = store.search_text(request.query, limit=request.limit)
    
    # Apply filters
    filtered = results
    if request.node_types:
        filtered = [r for r in filtered if r["node_type"] in request.node_types]
    if request.targets:
        filtered = [
            r for r in filtered
            if any(t in r["canonical_id"] for t in request.targets)
        ]
    
    return APIResponse(
        data=[
            {
                "id": r["canonical_id"],
                "type": r["node_type"],
                "name": r["name"],
                "confidence": r.get("confidence"),
                "snippet": _extract_snippet(r, request.query),
            }
            for r in filtered[:request.limit]
        ],
        meta={
            "query": request.query,
            "total_results": len(filtered),
            "returned": min(len(filtered), request.limit),
        }
    )


@app.get(
    "/v1/search/algorithms",
    tags=["Search"],
    summary="Search specifically for algorithms",
)
async def search_algorithms(
    query: str = Query(description="Search query"),
    domain: Optional[str] = Query(
        None,
        description="Algorithm domain: image_processing, compression, geometry, color_science, etc."
    ),
    has_implementation: Optional[str] = Query(
        None,
        description="Filter to algorithms with implementation in this language"
    ),
    limit: int = Query(20, le=100),
    api_key: str = Depends(verify_api_key),
    store: UniversalKnowledgeStore = Depends(get_store),
):
    """
    Specialized algorithm search with domain and implementation filtering.
    
    Find the exact algorithm you need with working code.
    """
    import json
    
    base_query = """
        SELECT * FROM nodes 
        WHERE node_type = 'algorithm' 
          AND (name LIKE ? OR json_extract(content, '$.purpose') LIKE ?)
    """
    params = [f"%{query}%", f"%{query}%"]
    
    if domain:
        base_query += " AND json_extract(content, '$.domain') = ?"
        params.append(domain)
    
    base_query += " ORDER BY name LIMIT ?"
    params.append(limit)
    
    rows = store.db.execute(base_query, params).fetchall()
    
    results = []
    for row in rows:
        node = store._row_to_node_dict(row)
        content = node.get("content", {})
        
        # Filter by implementation language
        impls = content.get("implementations", {})
        if has_implementation and has_implementation not in impls:
            continue
        
        results.append({
            "id": node["canonical_id"],
            "name": node["name"],
            "purpose": content.get("purpose"),
            "domain": content.get("domain"),
            "available_implementations": list(impls.keys()),
            "complexity": content.get("complexity"),
            "has_test_vectors": bool(content.get("test_vectors")),
            "has_optimizations": bool(content.get("optimizations")),
        })
    
    return APIResponse(
        data=results,
        meta={"query": query, "total": len(results)}
    )


# ════════════════════════════════════════════════════════════════
#  SECTION 5: AI CONTEXT — Endpoints optimized for LLM usage
# ════════════════════════════════════════════════════════════════

@app.post(
    "/v1/ai/context",
    tags=["AI Context"],
    summary="Assemble optimal context for an AI coding assistant",
    description=(
        "Given a task description and target format, assembles the "
        "most relevant knowledge into a single text block optimized "
        "for injection into an LLM's context window."
    ),
)
async def assemble_ai_context(
    request: AssemblyRequest,
    api_key: str = Depends(verify_api_key),
    store: UniversalKnowledgeStore = Depends(get_store),
    query_engine: KnowledgeQuery = Depends(get_query),
):
    """
    The AI-native endpoint.
    
    Returns a single text block containing all relevant knowledge,
    formatted for optimal LLM comprehension. Feed this directly
    into your AI coding assistant's system prompt or context.
    
    The response is plain text, not JSON — ready to paste into 
    an LLM context window.
    """
    target_id = request.target
    if not target_id.startswith("target:"):
        target_id = f"target:{target_id}"
    
    context = query_engine.assemble_context_for_task(
        task_description=request.task,
        target_id=target_id,
        max_tokens=request.max_context_tokens
    )
    
    # Wrap in a clear header
    formatted = f"""=== KNOWLEDGE CONTEXT FOR: {request.task} ===
Target format: {request.target}
Implementation language: {request.implementation_language.value}

Use the following reference knowledge to implement the task.
All templates and code examples are verified and working.

{context}

=== END KNOWLEDGE CONTEXT ==="""
    
    return Response(
        content=formatted,
        media_type="text/plain",
        headers={
            "X-Token-Estimate": str(len(formatted.split())),
            "X-Target": request.target,
        }
    )


@app.get(
    "/v1/ai/system-prompt/{target_id}",
    tags=["AI Context"],
    summary="Get a system prompt for an AI assistant specialized in a target",
)
async def get_ai_system_prompt(
    target_id: str,
    scope: str = Query(
        "general",
        description="Scope: general, generation, parsing, editing"
    ),
    api_key: str = Depends(verify_api_key),
    store: UniversalKnowledgeStore = Depends(get_store),
):
    """
    Get a pre-built system prompt that makes an AI assistant
    an expert in a specific format.
    
    Includes coordinate system reference, key structural patterns,
    common pitfalls, and the most-used templates — all formatted
    as an LLM system prompt.
    """
    if not target_id.startswith("target:"):
        target_id = f"target:{target_id}"
    
    target = store.get_node(target_id)
    if not target:
        raise HTTPException(status_code=404, detail=f"Target '{target_id}' not found")
    
    target_name = target["name"]
    content = target.get("content", {})
    
    # Get coordinate system
    coord = store.get_node(f"{target_id}:coordinate_system")
    coord_section = ""
    if coord:
        import json
        coord_section = f"""
## Coordinate System
{json.dumps(coord['content'], indent=2)}
"""
    
    # Get most important structural patterns
    key_structures = store.db.execute("""
        SELECT n.name, n.content FROM nodes n
        WHERE n.node_type = 'structure'
          AND n.canonical_id LIKE ?
        ORDER BY n.name
        LIMIT 10
    """, (f"%{target_id.split(':')[-1]}%",)).fetchall()
    
    struct_section = "## Key Structural Templates\n"
    for name, content_json in key_structures:
        struct_section += f"\n### {name}\n```json\n{content_json[:500]}\n```\n"
    
    system_prompt = f"""You are an expert in {target_name} file format/language.
You have complete knowledge of every capability, structural template,
algorithm, and constraint in {target_name}.

When generating code or answering questions about {target_name}:
1. ALWAYS use the correct coordinate system and units
2. ALWAYS include required relationship entries
3. ALWAYS validate against known constraints
4. Provide COMPLETE, RUNNABLE code examples
5. Handle edge cases explicitly

{coord_section}

{struct_section}

## Important Rules
- {target_name} uses {content.get('encoding', 'its native')} encoding
- Always generate valid output that opens without errors
- When uncertain, err on the side of minimal valid structures
"""
    
    return Response(
        content=system_prompt,
        media_type="text/plain",
        headers={"X-Target": target_id}
    )


# ════════════════════════════════════════════════════════════════
#  SECTION 6: HEALTH — Database vitality and status
# ════════════════════════════════════════════════════════════════

@app.get(
    "/v1/health",
    tags=["Health"],
    summary="API and database health check",
)
async def health_check(
    request: Request,
    store: UniversalKnowledgeStore = Depends(get_store),
):
    """Basic health check. No authentication required."""
    stats = store.get_statistics()
    uptime = time.time() - request.app.state.start_time
    
    return {
        "status": "healthy",
        "uptime_seconds": round(uptime, 1),
        "database": {
            "targets_documented": stats.get("targets_documented", 0),
            "total_nodes": sum(
                v.get("total", 0) for v in stats.values() 
                if isinstance(v, dict) and "total" in v
            ),
        }
    }


@app.get(
    "/v1/vitality",
    tags=["Health"],
    summary="Get the knowledge vitality dashboard",
)
async def get_vitality(
    target: Optional[str] = Query(None, description="Filter to specific target"),
    api_key: str = Depends(verify_api_key),
    store: UniversalKnowledgeStore = Depends(get_store),
):
    """
    Get the overall health and vitality of the knowledge base.
    
    Shows freshness, correctness, completeness scores,
    trend analysis, and priority work queue.
    """
    if target:
        target_id = f"target:{target}" if not target.startswith("target:") else target
        
        vitality_rows = store.db.execute("""
            SELECT v.node_id, v.freshness, v.correctness, v.completeness,
                   v.vitality, v.decay_model, n.node_type
            FROM node_vitality v
            JOIN nodes n ON v.node_id = n.canonical_id
            WHERE v.node_id LIKE ?
            ORDER BY v.vitality ASC
        """, (f"%{target_id.split(':')[-1]}%",)).fetchall()
        
        nodes = []
        for row in vitality_rows:
            nodes.append({
                "node_id": row[0],
                "freshness": round(row[1], 4),
                "correctness": round(row[2], 4),
                "completeness": round(row[3], 4),
                "vitality": round(row[4], 4),
                "decay_model": row[5],
                "node_type": row[6],
            })
        
        avg_vitality = sum(n["vitality"] for n in nodes) / max(len(nodes), 1)
        
        return APIResponse(
            data={
                "target": target,
                "average_vitality": round(avg_vitality, 4),
                "node_count": len(nodes),
                "critical": [n for n in nodes if n["vitality"] < 0.3],
                "warning": [n for n in nodes if 0.3 <= n["vitality"] < 0.6],
                "healthy": len([n for n in nodes if n["vitality"] >= 0.6]),
            }
        )
    
    # Global vitality
    stats = store.db.execute("""
        SELECT 
            AVG(vitality), AVG(freshness), AVG(correctness), 
            AVG(completeness), COUNT(*),
            SUM(CASE WHEN vitality < 0.3 THEN 1 ELSE 0 END),
            SUM(CASE WHEN vitality >= 0.6 THEN 1 ELSE 0 END)
        FROM node_vitality
    """).fetchone()
    
    return APIResponse(
        data={
            "overall_vitality": round(stats[0] or 0, 4),
            "freshness": round(stats[1] or 0, 4),
            "correctness": round(stats[2] or 0, 4),
            "completeness": round(stats[3] or 0, 4),
            "total_nodes": stats[4] or 0,
            "critical_nodes": stats[5] or 0,
            "healthy_nodes": stats[6] or 0,
        }
    )


@app.get(
    "/v1/vitality/drift-events",
    tags=["Health"],
    summary="Get unresolved knowledge drift events",
)
async def get_drift_events(
    severity: Optional[str] = Query(None, description="Filter by severity: critical, major, minor, info"),
    target: Optional[str] = Query(None, description="Filter by target"),
    limit: int = Query(50, le=200),
    api_key: str = Depends(verify_api_key),
    store: UniversalKnowledgeStore = Depends(get_store),
):
    """
    List detected drift events — places where external reality
    has diverged from our knowledge.
    """
    query = "SELECT * FROM drift_events WHERE resolved_at IS NULL"
    params = []
    
    if severity:
        query += " AND severity = ?"
        params.append(severity)
    if target:
        query += " AND target_id LIKE ?"
        params.append(f"%{target}%")
    
    query += " ORDER BY priority_score DESC LIMIT ?"
    params.append(limit)
    
    rows = store.db.execute(query, params).fetchall()
    
    import json
    events = []
    for row in rows:
        events.append({
            "event_id": row[0],
            "event_type": row[1],
            "severity": row[2],
            "target_id": row[3],
            "affected_node_count": len(json.loads(row[4] or "[]")),
            "description": row[5],
            "detected_at": row[7],
            "auto_fixable": bool(row[9]),
            "estimated_fix_cost": row[10],
            "priority_score": row[11],
        })
    
    return APIResponse(
        data=events,
        meta={"total_unresolved": len(events)}
    )


# ════════════════════════════════════════════════════════════════
#  SECTION 7: META — API documentation and discovery
# ════════════════════════════════════════════════════════════════

@app.get(
    "/v1/meta/node-types",
    tags=["Meta"],
    summary="List all node types and their counts",
)
async def list_node_types(
    store: UniversalKnowledgeStore = Depends(get_store),
):
    rows = store.db.execute("""
        SELECT node_type, COUNT(*) FROM nodes GROUP BY node_type ORDER BY COUNT(*) DESC
    """).fetchall()
    
    return APIResponse(
        data={row[0]: row[1] for row in rows}
    )


@app.get(
    "/v1/meta/relationship-types",
    tags=["Meta"],
    summary="List all relationship types used in the graph",
)
async def list_relationship_types(
    store: UniversalKnowledgeStore = Depends(get_store),
):
    rows = store.db.execute("""
        SELECT relationship, COUNT(*) FROM edges GROUP BY relationship ORDER BY COUNT(*) DESC
    """).fetchall()
    
    return APIResponse(
        data={row[0]: row[1] for row in rows}
    )


@app.get(
    "/v1/meta/statistics",
    tags=["Meta"],
    summary="Get comprehensive database statistics",
)
async def get_statistics(
    api_key: str = Depends(verify_api_key),
    store: UniversalKnowledgeStore = Depends(get_store),
):
    stats = store.get_statistics()
    return APIResponse(data=stats)


# ════════════════════════════════════════════════════════════════
#  HELPER FUNCTIONS
# ════════════════════════════════════════════════════════════════

def _extract_snippet(node: dict, query: str, max_length: int = 200) -> str:
    """Extract a relevant snippet from a node for search results."""
    import json
    
    content = node.get("content", {})
    text_sources = []
    
    if isinstance(content, dict):
        for key in ("description", "purpose", "explanation"):
            if key in content and isinstance(content[key], str):
                text_sources.append(content[key])
    
    if not text_sources:
        text_sources.append(json.dumps(content)[:max_length])
    
    for text in text_sources:
        query_lower = query.lower()
        text_lower = text.lower()
        idx = text_lower.find(query_lower)
        
        if idx >= 0:
            start = max(0, idx - 50)
            end = min(len(text), idx + len(query) + 150)
            snippet = text[start:end]
            if start > 0:
                snippet = "..." + snippet
            if end < len(text):
                snippet = snippet + "..."
            return snippet
    
    return text_sources[0][:max_length] if text_sources else ""


def _extract_code_only(bundle: dict, lang: str) -> dict:
    """Strip a knowledge bundle down to just code."""
    code_pieces = []
    
    for algo in bundle.get("algorithms", []):
        impl = algo.get("preferred_implementation")
        if impl and isinstance(impl, dict):
            code_pieces.append({
                "name": algo.get("name"),
                "code": impl.get("code", ""),
                "usage": impl.get("usage_example", ""),
            })
    
    for template in bundle.get("structural_templates", []):
        content = template.get("content", {})
        assembly = content.get("assembly_code", {})
        if assembly and isinstance(assembly, dict):
            code_pieces.append({
                "name": template.get("name"),
                "code": assembly.get("code", ""),
                "usage": assembly.get("usage", ""),
            })
    
    return {"code": code_pieces, "language": lang}


def _extract_summary(bundle: dict) -> dict:
    """Strip a knowledge bundle to summary information only."""
    return {
        "capability": bundle.get("capability", {}).get("name"),
        "template_count": len(bundle.get("structural_templates", [])),
        "algorithm_count": len(bundle.get("algorithms", [])),
        "has_coordinate_system": bundle.get("coordinate_system") is not None,
        "prerequisite_count": len(bundle.get("prerequisites", [])),
        "templates": [
            t.get("name") for t in bundle.get("structural_templates", [])
        ],
        "algorithms": [
            a.get("name") for a in bundle.get("algorithms", [])
        ],
    }


def _format_for_ai_context(bundle: dict) -> dict:
    """Format bundle specifically for LLM consumption."""
    import json
    
    sections = []
    
    cap = bundle.get("capability", {})
    sections.append(f"CAPABILITY: {cap.get('name', 'unknown')}")
    
    if bundle.get("coordinate_system"):
        sections.append(f"COORDINATE SYSTEM:\n{json.dumps(bundle['coordinate_system'], indent=2)}")
    
    for template in bundle.get("structural_templates", []):
        content = template.get("content", {})
        sections.append(f"STRUCTURAL TEMPLATE: {template.get('name')}\n{json.dumps(content, indent=2)}")
    
    for algo in bundle.get("algorithms", []):
        impl = algo.get("preferred_implementation", {})
        if impl:
            sections.append(
                f"ALGORITHM: {algo.get('name')}\n"
                f"```\n{impl.get('code', 'No code available')}\n```"
            )
    
    return {"ai_context": "\n\n---\n\n".join(sections)}


# ════════════════════════════════════════════════════════════════
#  SERVER ENTRY POINT
# ════════════════════════════════════════════════════════════════

def run_server(host: str = "0.0.0.0", port: int = 8000, reload: bool = False):
    uvicorn.run(
        "uke.api.app:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info",
    )


if __name__ == "__main__":
    run_server(reload=True)
```

---

## API Endpoint Map

```
THE UNIVERSAL KNOWLEDGE ENGINE API
═══════════════════════════════════

EXPLORE (Navigate and discover)
───────────────────────────────
GET  /v1/targets                          List all documented targets
GET  /v1/targets/{id}                     Get target details + capabilities
GET  /v1/targets/{id}/capabilities        List capabilities with filters
GET  /v1/graph/neighbors/{node_id}        Navigate the knowledge graph
GET  /v1/concepts                         Browse cross-cutting concepts

RETRIEVE (Get specific knowledge)
─────────────────────────────────
GET  /v1/capabilities/{id}/bundle         ⭐ Get EVERYTHING for a capability
GET  /v1/algorithms/{id}                  Get algorithm with implementations
GET  /v1/structures/{id}                  Get structural template
GET  /v1/targets/{id}/coordinate-system   Get coordinate/unit reference
GET  /v1/targets/{id}/minimal-file        Get minimal valid file + code

SYNTHESIZE (Build from knowledge)
─────────────────────────────────
POST /v1/assemble                         ⭐ Smart knowledge assembly for a task
POST /v1/blueprint                        Get application architecture blueprint
POST /v1/diagnose                         Diagnose file generation issues
POST /v1/convert                          Get format conversion guide
POST /v1/compare?targets=a&targets=b      Compare formats/languages

SEARCH (Find across everything)
───────────────────────────────
POST /v1/search                           Full-text search all knowledge
GET  /v1/search/algorithms                Specialized algorithm search

AI CONTEXT (Optimized for LLM usage)
────────────────────────────────────
POST /v1/ai/context                       ⭐ Assemble LLM context for a task
GET  /v1/ai/system-prompt/{target}        Get expert system prompt for a target

HEALTH (Database vitality)
──────────────────────────
GET  /v1/health                           Health check (no auth)
GET  /v1/vitality                         Knowledge vitality dashboard
GET  /v1/vitality/drift-events            Unresolved drift events

META (API self-documentation)
─────────────────────────────
GET  /v1/meta/node-types                  List node types and counts
GET  /v1/meta/relationship-types          List relationship types
GET  /v1/meta/statistics                  Database statistics
GET  /docs                                Interactive API documentation (auto)
```

---

## Usage Patterns

### Pattern 1: Developer Building a PPTX Generator

```bash
# 1. What can PPTX do?
GET /v1/targets/pptx

# 2. What capabilities involve shapes?
GET /v1/targets/pptx/capabilities?search=shape

# 3. Give me everything to draw a rectangle
GET /v1/capabilities/pptx:draw_rectangle/bundle?implementation_language=python

# 4. What about text inside the rectangle?
GET /v1/capabilities/pptx:insert_text/bundle

# 5. What's the coordinate system?
GET /v1/targets/pptx/coordinate-system

# 6. Get the minimal valid file to start from
GET /v1/targets/pptx/minimal-file
```

### Pattern 2: AI Agent Generating Code

```bash
# Single call to get optimal context
POST /v1/ai/context
{
    "target": "pptx",
    "task": "Create a presentation with a title slide, a chart showing quarterly revenue, and a summary slide with bullet points",
    "implementation_language": "python",
    "max_context_tokens": 12000
}

# Feed response directly into LLM system prompt
```

### Pattern 3: Diagnosing Issues

```bash
# Something's wrong with my PNG generation
POST /v1/diagnose
{
    "target": "png",
    "problem_description": "Generated PNG file shows all colors shifted to blue. Using RGB values but colors look wrong.",
    "code_snippet": "pixel = struct.pack('BBB', r, g, b)"
}
```

### Pattern 4: Exploring Algorithms

```bash
# Find all image processing algorithms
GET /v1/search/algorithms?query=blur&domain=image_processing&has_implementation=python

# Get the full Gaussian blur algorithm
GET /v1/algorithms/algorithm:image:gaussian_blur?implementation_language=python&include_optimizations=true
```

### Pattern 5: Building a Complete Application

```bash
# Get the full blueprint
POST /v1/blueprint
{
    "target": "png",
    "application_description": "Command-line image editor with layers, filters, and color adjustments",
    "implementation_language": "python"
}
```

---

## SDK Design (What Wraps the API)

```python
# Python SDK — what developers actually import

# pip install uke-client

from uke import KnowledgeEngine

engine = KnowledgeEngine(api_key="your-key")

# Explore
targets = engine.targets.list(kind="image_format")
pptx = engine.targets.get("pptx")
caps = engine.targets.capabilities("pptx", search="shape")

# Retrieve
bundle = engine.capabilities.bundle(
    "pptx:draw_rectangle", 
    language="python"
)
print(bundle.structural_templates[0].template)
print(bundle.algorithms[0].implementation.code)

algo = engine.algorithms.get(
    "algorithm:image:gaussian_blur",
    language="python"
)
print(algo.implementation.code)
print(algo.test_vectors)

coords = engine.targets.coordinate_system("pptx")
print(coords.conversions["inches_to_native"])

# Synthesize
context = engine.ai.context(
    target="pptx",
    task="Create a slide with a chart",
    max_tokens=8000
)
# Feed `context` to your LLM

blueprint = engine.blueprints.get(
    target="png",
    description="Image editor with layers and filters"
)
for component in blueprint.components:
    print(f"{component.name}: {component.responsibility}")

# Diagnose
diagnosis = engine.diagnose(
    target="pptx",
    problem="Shapes at wrong position"
)
for cause in diagnosis.possible_causes:
    print(f"{cause.category}: {cause.explanation}")

# Search
results = engine.search("alpha compositing", node_types=["algorithm"])
```

```javascript
// JavaScript SDK

import { KnowledgeEngine } from '@uke/client';

const engine = new KnowledgeEngine({ apiKey: 'your-key' });

// Get everything for a capability
const bundle = await engine.capabilities.bundle('png:alpha_compositing', {
  language: 'javascript'
});

console.log(bundle.algorithms[0].implementation.code);

// AI context assembly
const context = await engine.ai.context({
  target: 'svg',
  task: 'Create an animated SVG logo',
  maxTokens: 6000
});

// Feed to OpenAI
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: context },
    { role: 'user', content: 'Generate the SVG code for an animated logo' }
  ]
});
```

---

## Deployment Architecture

```
                        ┌─────────────────┐
                        │   LOAD BALANCER  │
                        │   (nginx/caddy)  │
                        └────────┬────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
              ┌─────▼─────┐┌────▼─────┐┌────▼─────┐
              │  API       ││  API     ││  API     │
              │  Instance  ││  Instance││  Instance│
              │  (uvicorn) ││  (uvicorn││  (uvicorn│
              │            ││         )||         )│
              └─────┬──────┘└────┬─────┘└────┬─────┘
                    │            │            │
                    └────────────┼────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   KNOWLEDGE BASE        │
                    │   (SQLite in            │
                    │    read-only mode)      │
                    │                         │
                    │   Replicated to each    │
                    │   instance as a file.   │
                    │   Updated periodically  │
                    │   from generation       │
                    │   pipeline.             │
                    └─────────────────────────┘

For MVP: Single instance, single SQLite file.
For production: Read replicas + optional PostgreSQL migration.

The database is READ-HEAVY, WRITE-RARE.
Writes only happen during generation/healing cycles.
This is ideal for SQLite read replicas.
```

---

## The API's Role in the Larger System

```
┌─────────────────────────────────────────────────────────────┐
│                    THE COMPLETE SYSTEM                       │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  GENERATION   │    │   KNOWLEDGE  │    │     API      │  │
│  │  PIPELINE     │───►│    STORE     │◄───│   (this)     │  │
│  │              │    │   (SQLite)   │    │              │  │
│  │ Creates and  │    │              │    │ Serves       │  │
│  │ updates      │    │ 715,000      │    │ knowledge    │  │
│  │ knowledge    │    │ nodes        │    │ to users     │  │
│  └──────────────┘    │ 3M+ edges   │    │ and AI       │  │
│         ▲            └──────┬───────┘    │ systems      │  │
│         │                   │            └──────┬───────┘  │
│         │                   ▼                   │          │
│  ┌──────┴───────┐    ┌──────────────┐          │          │
│  │ HEALING LOOP │    │ OBSERVABILITY│          │          │
│  │              │◄───│              │          │          │
│  │ Auto-repairs │    │ Decay,       │    ┌─────▼──────┐  │
│  │ stale        │    │ drift,       │    │  CLIENTS   │  │
│  │ knowledge    │    │ coverage     │    │            │  │
│  └──────────────┘    └──────────────┘    │ Developers │  │
│                                          │ AI agents  │  │
│                                          │ Code gens  │  │
│                                          │ SDKs       │  │
│                                          └────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

The API is the **face** of the system. Everything else — generation, storage, observability, healing — exists so that the API can serve accurate, complete, actionable knowledge to anyone who asks.

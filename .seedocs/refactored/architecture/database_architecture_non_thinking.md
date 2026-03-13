---
type: architecture
source_file: "magB_Database Architecture - Opus 4.6 non-Thinking .md"
description: "Original project documentation refactored with an intelligence layer for automated LLM accessibility."
llm_accessibility:
  - This document contains 100% of its original source material below the '--- ORIGINAL CONTENT ---' marker.
  - Recommended usage: Use this document to understand the architecture aspects of the magB/ACE/Universal Blueprint Machine system.
---

<llm_context>
# Document Intelligence Layer
**Context:** This document is part of the refactored `.seedocs` repository, detailing the architecture, concepts, and planning for the Universal Blueprint Machine (magB) and AI Contribution Engine (ACE).
**Category:** `architecture`
**Original File:** `magB_Database Architecture - Opus 4.6 non-Thinking .md`
**AI Assistant Directives:** 
1. When querying this document, treat the original content as the definitive ground truth.
2. Use the provided schemas, code blocks, and diagrams directly for implementation and analysis.
3. This intelligence layer ensures context window efficiency by explicitly stating the document's boundaries and purpose.
</llm_context>

--- ORIGINAL CONTENT ---



# The Universal Knowledge Graph: Architecting for 1,000 Formats and Beyond

---

## First, Let's Think About What We're Actually Building

Before touching schemas or databases, we need to understand the **nature** of the knowledge we're capturing. Because if we get the mental model wrong, we'll build something that works for 10 formats and collapses at 100.

### The Realization

When you deeply study file formats and programming languages, you discover something: **they are not as different as they appear.**

```
A .pptx file and a .docx file both use OOXML.
A .png and a .jpg both represent raster images.
Python and Ruby are both dynamically-typed interpreted languages.
C and Rust both compile to native code with manual-ish memory control.
SVG and Canvas both render 2D vector graphics.
PDF and PostScript both describe pages.
MIDI and MusicXML both represent music.
WASM and JVM bytecode both run on virtual machines.
```

These aren't isolated islands of knowledge. They're **nodes in a vast knowledge graph** where formats share algorithms, structures inherit from common ancestors, and concepts flow across boundaries.

A Gaussian blur algorithm documented for Photoshop is the **same algorithm** needed for GIMP, for CSS filters, for SVG filters, for WebGL shaders, and for any image format that supports filtering. If we store it once and link it everywhere, we eliminate massive redundancy. If we store it 12 times, we maintain 12 copies that drift out of sync.

**This changes everything about how we design the database.**

---

## The Mental Model: Knowledge as a Graph, Not a Filing Cabinet

Most databases are designed like filing cabinets:

```
FILING CABINET MODEL (fragile at scale):

📁 PPTX/
   📁 capabilities/
   📁 templates/
   📁 algorithms/
📁 PNG/
   📁 capabilities/
   📁 templates/
   📁 algorithms/        ← Same Gaussian blur stored again
📁 PDF/
   📁 capabilities/
   📁 templates/
   📁 algorithms/        ← And again
📁 Python/
   📁 syntax/
   📁 stdlib/
```

This works at 5 formats. At 1,000, you have:
- Thousands of duplicate algorithms
- No cross-format insights
- No way to ask "which formats support animation?"
- No way to transfer knowledge from one format to another
- No way to find that PPTX and DOCX share 60% of their structural patterns

**We need a graph:**

```
KNOWLEDGE GRAPH MODEL (scales infinitely):

                    ┌──────────────┐
                    │  GAUSSIAN    │
                    │  BLUR        │
                    │  (algorithm) │
                    └──┬───┬───┬──┘
                       │   │   │
            ┌──────────┘   │   └──────────┐
            ▼              ▼              ▼
      ┌──────────┐  ┌──────────┐   ┌──────────┐
      │   PNG    │  │   TIFF   │   │   PSD    │
      │ (format) │  │ (format) │   │ (format) │
      └────┬─────┘  └────┬─────┘   └────┬─────┘
           │              │              │
           └──────┬───────┘              │
                  ▼                      ▼
           ┌──────────┐          ┌──────────────┐
           │  RASTER  │          │  PHOTOSHOP   │
           │  IMAGE   │          │  (software)  │
           │ (concept)│          │              │
           └──────────┘          └──────────────┘
                  │
                  ▼
           ┌──────────────┐
           │ DEFLATE      │
           │ COMPRESSION  │
           │ (algorithm)  │
           └──┬───┬───┬───┘
              │   │   │
              ▼   ▼   ▼
            PNG  ZIP  HTTP/gzip
```

Every piece of knowledge exists **once** and is **linked** to every context where it applies.

---

## The Six Fundamental Entity Types

After analyzing what we'd capture across 1,000 formats and languages, every piece of knowledge falls into one of six types:

```
┌─────────────────────────────────────────────────────────────────┐
│                    THE SIX KNOWLEDGE ENTITIES                   │
│                                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                        │
│  │ TARGET  │  │ARTIFACT │  │CONCEPT  │                         │
│  │         │  │         │  │         │                         │
│  │A language│  │Something│  │Abstract │                         │
│  │or format │  │a target │  │idea that│                         │
│  │we are   │  │can      │  │spans    │                         │
│  │document-│  │produce  │  │multiple │                         │
│  │ing      │  │or       │  │targets  │                         │
│  │         │  │consume  │  │         │                         │
│  │pptx,    │  │a slide, │  │"color", │                         │
│  │python,  │  │a func-  │  │"loop",  │                         │
│  │png      │  │tion, an │  │"compre- │                         │
│  │         │  │image    │  │ssion"   │                         │
│  └─────────┘  └─────────┘  └─────────┘                         │
│                                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                        │
│  │ALGORITHM│  │STRUCTURE│  │BLUEPRINT│                         │
│  │         │  │         │  │         │                         │
│  │A proce- │  │An exact │  │A plan   │                         │
│  │dure that│  │data     │  │for      │                         │
│  │computes │  │layout   │  │building │                         │
│  │or trans-│  │or       │  │a        │                         │
│  │forms    │  │template │  │working  │                         │
│  │         │  │         │  │system   │                         │
│  │gaussian │  │PNG IHDR │  │"image   │                         │
│  │blur,    │  │chunk,   │  │editor", │                         │
│  │quicksort│  │PPTX     │  │"compiler│                         │
│  │CRC32    │  │slide XML│  │pipeline"│                         │
│  └─────────┘  └─────────┘  └─────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

The entire database is **relationships between these six entity types.**

---

## The Schema

```python
# schema.py
"""
The Universal Knowledge Graph Schema.

Design principles:
1. GRAPH-NATIVE    — Entities + relationships, not nested hierarchies
2. CONTENT-ADDRESSED — Every entity has a deterministic ID from its content
3. VERSIONABLE     — Every entity carries version metadata
4. COMPOSABLE      — Small entities compose into larger knowledge
5. AI-NATIVE       — Structured for LLM consumption and generation
6. POLYGLOT        — Same schema describes any language, format, or tool
"""

from __future__ import annotations
import hashlib
import json
from datetime import datetime
from enum import Enum
from typing import Optional, Any


# ════════════════════════════════════════════════════════════════
# ENUMERATIONS
# ════════════════════════════════════════════════════════════════

class TargetKind(str, Enum):
    """What kind of thing are we documenting?"""
    PROGRAMMING_LANGUAGE = "programming_language"
    MARKUP_LANGUAGE = "markup_language"
    QUERY_LANGUAGE = "query_language"
    STYLESHEET_LANGUAGE = "stylesheet_language"
    DATA_SERIALIZATION = "data_serialization"   # JSON, YAML, TOML, Protobuf
    DOCUMENT_FORMAT = "document_format"         # DOCX, PDF, ODT
    PRESENTATION_FORMAT = "presentation_format" # PPTX, KEY, ODP
    SPREADSHEET_FORMAT = "spreadsheet_format"   # XLSX, ODS, CSV
    IMAGE_FORMAT = "image_format"               # PNG, JPEG, TIFF, SVG, PSD
    AUDIO_FORMAT = "audio_format"               # MP3, WAV, FLAC, MIDI
    VIDEO_FORMAT = "video_format"               # MP4, WebM, MKV, AVI
    ARCHIVE_FORMAT = "archive_format"           # ZIP, TAR, 7Z, GZIP
    DATABASE_FORMAT = "database_format"         # SQLite, LevelDB
    EXECUTABLE_FORMAT = "executable_format"     # ELF, PE, Mach-O, WASM
    NETWORK_PROTOCOL = "network_protocol"       # HTTP, TCP, WebSocket
    FONT_FORMAT = "font_format"                 # TTF, OTF, WOFF
    THREE_D_FORMAT = "3d_format"                # OBJ, GLTF, FBX, STL
    CAD_FORMAT = "cad_format"                   # DXF, STEP, IGES
    SCIENTIFIC_FORMAT = "scientific_format"     # HDF5, NetCDF, FITS
    CONFIGURATION_FORMAT = "configuration_format" # INI, env, plist
    SOFTWARE_TOOL = "software_tool"             # Photoshop, Blender, FFmpeg


class ConceptDomain(str, Enum):
    """What domain does a concept belong to?"""
    COMPUTATION = "computation"           # loops, recursion, functions
    DATA = "data"                         # types, structures, encoding
    GRAPHICS_2D = "graphics_2d"           # drawing, compositing, color
    GRAPHICS_3D = "graphics_3d"           # meshes, shading, transforms
    TYPOGRAPHY = "typography"             # fonts, text layout, kerning
    LAYOUT = "layout"                     # positioning, flow, grids
    COLOR_SCIENCE = "color_science"       # color spaces, profiles, conversion
    SIGNAL_PROCESSING = "signal_processing"  # filtering, FFT, convolution
    COMPRESSION = "compression"           # lossless, lossy, entropy coding
    CRYPTOGRAPHY = "cryptography"         # hashing, encryption, signatures
    GEOMETRY = "geometry"                 # coordinates, transforms, curves
    ANIMATION = "animation"              # timing, interpolation, keyframes
    AUDIO = "audio"                       # synthesis, effects, codecs
    NETWORKING = "networking"             # protocols, serialization, streaming
    MEMORY = "memory"                     # allocation, GC, ownership
    CONCURRENCY = "concurrency"          # threads, async, synchronization
    IO = "io"                             # files, streams, buffers
    MATH = "math"                         # linear algebra, statistics, numerics


class RelationshipType(str, Enum):
    """How two entities relate to each other."""
    # Target relationships
    IMPLEMENTS = "implements"             # target implements a concept
    EXTENDS = "extends"                   # target extends another target
    CONTAINS = "contains"                 # target contains artifact/structure
    USES_ALGORITHM = "uses_algorithm"     # target uses an algorithm
    SUPERSET_OF = "superset_of"           # target is superset of another
    VARIANT_OF = "variant_of"             # target is variant of another
    CONVERTS_TO = "converts_to"          # target can be converted to another
    EMBEDS = "embeds"                     # target can embed another target
    
    # Algorithm relationships
    OPTIMIZES = "optimizes"              # algorithm is optimization of another
    DEPENDS_ON = "depends_on"            # requires another entity
    ALTERNATIVE_TO = "alternative_to"    # can be used instead of
    COMPOSED_OF = "composed_of"          # made up of sub-algorithms
    PREREQUISITE = "prerequisite"        # must understand X before Y
    
    # Structure relationships
    TEMPLATE_FOR = "template_for"        # structure is template for capability
    CHILD_OF = "child_of"               # structure is nested inside another
    REFERENCES = "references"            # structure references another
    
    # Concept relationships
    SPECIALIZES = "specializes"          # concept is specialization of another
    GENERALIZES = "generalizes"          # concept is generalization
    RELATED_TO = "related_to"           # loose conceptual relationship
    
    # Blueprint relationships
    BUILDS_WITH = "builds_with"          # blueprint uses these entities
    PRODUCES = "produces"                # blueprint produces target artifacts


class Complexity(str, Enum):
    TRIVIAL = "trivial"           # copy-paste, no logic
    BASIC = "basic"               # straightforward implementation
    INTERMEDIATE = "intermediate" # requires understanding domain
    ADVANCED = "advanced"         # significant engineering effort
    EXPERT = "expert"             # deep domain expertise required


class Confidence(str, Enum):
    """How confident we are in this knowledge."""
    VERIFIED = "verified"       # code-validated or spec-confirmed
    HIGH = "high"               # strong confidence from multiple sources
    MEDIUM = "medium"           # likely correct but not fully verified
    LOW = "low"                 # uncertain, may contain errors
    GENERATED = "generated"     # AI-generated, not yet validated


# ════════════════════════════════════════════════════════════════
# CORE ENTITY: THE KNOWLEDGE NODE
# ════════════════════════════════════════════════════════════════

class KnowledgeNode:
    """
    The fundamental unit of knowledge in the graph.
    
    Every entity (target, concept, algorithm, structure, blueprint)
    is a KnowledgeNode with a type discriminator and typed content.
    
    This single-table design enables:
    - Uniform graph traversal
    - Consistent versioning
    - Simple replication
    - AI-friendly serialization
    """
    
    def __init__(
        self,
        node_type: str,           # "target" | "concept" | "algorithm" | "structure" | "blueprint" | "artifact"
        canonical_id: str,        # deterministic, human-readable ID
        name: str,                # display name
        content: dict,            # typed content (schema varies by node_type)
        version: str = "1.0",
        tags: list[str] = None,
        confidence: Confidence = Confidence.GENERATED,
        source_generation_id: str = None,  # which generation run created this
    ):
        self.node_type = node_type
        self.canonical_id = canonical_id
        self.name = name
        self.content = content
        self.version = version
        self.tags = tags or []
        self.confidence = confidence
        self.source_generation_id = source_generation_id
        self.created_at = datetime.utcnow().isoformat()
        self.content_hash = self._compute_hash()
    
    def _compute_hash(self) -> str:
        """Content-addressable hash for deduplication and change detection."""
        hashable = json.dumps({
            "type": self.node_type,
            "id": self.canonical_id,
            "content": self.content,
            "version": self.version
        }, sort_keys=True)
        return hashlib.sha256(hashable.encode()).hexdigest()
    
    def to_dict(self) -> dict:
        return {
            "node_type": self.node_type,
            "canonical_id": self.canonical_id,
            "name": self.name,
            "content": self.content,
            "version": self.version,
            "tags": self.tags,
            "confidence": self.confidence.value,
            "content_hash": self.content_hash,
            "created_at": self.created_at,
            "source_generation_id": self.source_generation_id,
        }

    @staticmethod
    def generate_id(node_type: str, *components: str) -> str:
        """
        Generate a deterministic, human-readable canonical ID.
        
        Examples:
            target:pptx
            target:python:3.12
            concept:compression:deflate
            algorithm:image:gaussian_blur
            structure:pptx:slide_xml
            blueprint:image_editor:layer_compositor
        """
        parts = [node_type] + [c.lower().replace(" ", "_").replace("-", "_") 
                                for c in components]
        return ":".join(parts)


# ════════════════════════════════════════════════════════════════
# RELATIONSHIP: THE EDGE
# ════════════════════════════════════════════════════════════════

class KnowledgeEdge:
    """
    A typed, directional relationship between two knowledge nodes.
    
    Edges carry metadata about the nature and strength of the relationship,
    enabling rich graph queries.
    """
    
    def __init__(
        self,
        source_id: str,              # canonical_id of source node
        target_id: str,              # canonical_id of target node
        relationship: RelationshipType,
        metadata: dict = None,       # relationship-specific details
        weight: float = 1.0,         # relationship strength (0-1)
        bidirectional: bool = False,  # does this apply both ways?
        context: str = None,         # under what conditions this applies
    ):
        self.source_id = source_id
        self.target_id = target_id
        self.relationship = relationship
        self.metadata = metadata or {}
        self.weight = weight
        self.bidirectional = bidirectional
        self.context = context
        self.edge_id = self._compute_id()
    
    def _compute_id(self) -> str:
        raw = f"{self.source_id}|{self.relationship.value}|{self.target_id}"
        return hashlib.sha256(raw.encode()).hexdigest()[:16]
    
    def to_dict(self) -> dict:
        return {
            "edge_id": self.edge_id,
            "source_id": self.source_id,
            "target_id": self.target_id,
            "relationship": self.relationship.value,
            "metadata": self.metadata,
            "weight": self.weight,
            "bidirectional": self.bidirectional,
            "context": self.context,
        }


# ════════════════════════════════════════════════════════════════
# TYPED CONTENT SCHEMAS (what goes INSIDE each node type)
# ════════════════════════════════════════════════════════════════

TARGET_CONTENT_SCHEMA = {
    "kind": "TargetKind enum value",
    "version": "specific version documented",
    "versions_covered": ["list of all versions this applies to"],
    "paradigms": ["relevant paradigms"],
    "spec_url": "official specification URL",
    "binary_or_text": "binary | text | hybrid",
    "encoding": "default encoding if text",
    "media_types": ["MIME types"],
    "extensions": ["file extensions"],
    "parent_standard": "e.g., OOXML for pptx",
    "status": "active | deprecated | draft | historical",
    "first_released": "year",
    "governing_body": "who maintains the standard",
    
    "capability_summary": {
        "total_capabilities": "count",
        "categories": {
            "category_name": {
                "description": "what this category covers",
                "capability_count": "count",
                "complexity_distribution": {
                    "trivial": 0, "basic": 0, "intermediate": 0,
                    "advanced": 0, "expert": 0
                }
            }
        }
    },
    
    "coordinate_system": {
        "primary_unit": "EMU | pixel | point | ...",
        "origin": "top-left | bottom-left | center",
        "y_direction": "down | up",
        "conversions": {
            "unit_a_to_unit_b": "formula"
        }
    },
    
    "ecosystem": {
        "primary_libraries": [{"language": "python", "name": "lib", "url": "..."}],
        "build_tools": ["..."],
        "official_tools": ["..."]
    }
}


CONCEPT_CONTENT_SCHEMA = {
    "domain": "ConceptDomain enum value",
    "description": "clear explanation of the concept",
    "formal_definition": "precise technical definition",
    "prerequisites": ["concept IDs needed to understand this"],
    
    "manifestations": {
        "description": "how this concept appears across different targets",
        "examples": [
            {
                "target_id": "target:python",
                "how_it_manifests": "Python uses for/while loops with...",
                "syntax_example": "for x in range(10): ..."
            }
        ]
    },
    
    "taxonomy": {
        "parent_concept": "concept_id of more general concept",
        "child_concepts": ["concept_ids of more specific concepts"],
        "related_concepts": ["laterally related concept_ids"]
    },
    
    "learning_path": {
        "beginner_explanation": "explain like I'm new to programming",
        "intermediate_explanation": "assume familiarity with basics",
        "expert_nuances": "subtle points experts care about"
    }
}


ALGORITHM_CONTENT_SCHEMA = {
    "domain": "ConceptDomain enum value",
    "purpose": "what this algorithm computes/transforms",
    "category": "specific category within domain",
    
    "mathematical_foundation": {
        "formulas": [
            {
                "name": "formula name",
                "formula_text": "human-readable formula",
                "formula_latex": "LaTeX notation",
                "variables": {"var": "meaning and type"},
                "notes": "when to apply"
            }
        ]
    },
    
    "pseudocode": ["step-by-step pseudocode lines"],
    
    "implementations": {
        "language_name": {
            "code": "COMPLETE runnable implementation",
            "imports": ["required imports"],
            "dependencies": ["external packages if any"],
            "usage_example": "how to call it",
            "expected_output": "what the example produces"
        }
    },
    
    "parameters": [
        {
            "name": "param name",
            "type": "data type",
            "description": "what it controls",
            "range": {"min": None, "max": None, "valid_values": None},
            "default": "default value",
            "effect": "what changing this does",
            "performance_impact": "how it affects speed/memory"
        }
    ],
    
    "complexity": {
        "time": "Big-O",
        "space": "Big-O",
        "practical_notes": "real-world characteristics"
    },
    
    "optimizations": [
        {
            "name": "optimization name",
            "technique": "what technique is used",
            "speedup_factor": "typical improvement",
            "tradeoff": "what you sacrifice",
            "implementation": "code",
            "when_to_use": "conditions"
        }
    ],
    
    "edge_cases": [
        {
            "case": "description",
            "problem": "what goes wrong",
            "solution": "how to handle it",
            "code": "handling code"
        }
    ],
    
    "test_vectors": [
        {
            "description": "what this tests",
            "input": {},
            "expected_output": {},
            "tolerance": "acceptable error"
        }
    ],
    
    "numerical_stability": {
        "issues": ["precision problems"],
        "mitigations": ["solutions"],
        "recommended_precision": "float32 | float64 | ..."
    },
    
    "references": ["academic papers, spec sections"]
}


STRUCTURE_CONTENT_SCHEMA = {
    "format_type": "xml | json | binary | text | protobuf",
    "purpose": "what this structure represents",
    
    "template": {
        "raw": "the exact template with {{variable}} placeholders",
        "format_notes": "namespace declarations, encoding, etc."
    },
    
    "variables": [
        {
            "name": "variable_name",
            "type": "string | int | float | enum | color | coordinate | ...",
            "description": "what this controls",
            "constraints": {
                "min": None, "max": None,
                "valid_values": None, "regex": None,
                "unit": "native unit name"
            },
            "default": "default value",
            "required": True,
            "examples": ["example values"]
        }
    ],
    
    "placement": {
        "parent_structure_id": "structure_id of parent",
        "position_rule": "where within parent",
        "cardinality": "0..1 | 1 | 0..* | 1..*",
        "ordering_rule": "sibling ordering requirements"
    },
    
    "relationships_required": [
        {
            "type": "reference | containment | dependency",
            "target_structure_id": "what it relates to",
            "how_to_establish": "steps to create the relationship"
        }
    ],
    
    "assembly_code": {
        "language": "implementation language",
        "code": "complete code to assemble this structure",
        "usage": "how to call the assembly code"
    },
    
    "validation_rules": [
        {
            "rule": "description",
            "check_code": "code to validate"
        }
    ],
    
    "binary_layout": {
        "applicable": False,
        "fields": [
            {
                "name": "field name",
                "offset": "byte offset or 'after previous'",
                "size": "size in bytes or 'variable'",
                "type": "uint8 | uint16_be | uint32_le | ...",
                "description": "purpose"
            }
        ]
    },
    
    "complete_example": "fully filled-in example with real values",
    "minimal_example": "smallest valid usage"
}


BLUEPRINT_CONTENT_SCHEMA = {
    "application_type": "what kind of app this builds",
    "description": "what the finished application does",
    "target_ids": ["which targets this blueprint works with"],
    
    "architecture": {
        "pattern": "MVC | Pipeline | ECS | ...",
        "diagram": "ASCII architecture diagram",
        "rationale": "why this pattern"
    },
    
    "components": [
        {
            "name": "component name",
            "responsibility": "single-responsibility description",
            "public_api": [
                {
                    "signature": "method signature",
                    "description": "what it does",
                    "example": "usage example"
                }
            ],
            "depends_on": ["other component names"],
            "capability_ids": ["which capabilities it implements"],
            "algorithm_ids": ["which algorithms it uses"],
            "skeleton_code": "starter implementation"
        }
    ],
    
    "build_sequence": [
        {
            "phase": 1,
            "name": "phase name",
            "components": ["which components to build"],
            "milestone": "what works after this phase",
            "test_criteria": ["how to verify"],
            "estimated_effort_hours": 0
        }
    ],
    
    "minimal_implementation": {
        "code": "complete working minimal version",
        "capabilities_covered": ["which capabilities work"],
        "lines_of_code": 0
    },
    
    "extension_points": [
        {
            "name": "where to extend",
            "purpose": "why you'd extend here",
            "pattern": "how to extend"
        }
    ]
}


ARTIFACT_CONTENT_SCHEMA = {
    "description": "what this artifact is",
    "artifact_type": "file | stream | structure | object | ...",
    "produced_by": ["capability_ids that produce this"],
    "consumed_by": ["capability_ids that consume this"],
    
    "properties": [
        {
            "name": "property name",
            "type": "data type",
            "description": "what this property represents",
            "constraints": {},
            "modifiable": True,
            "affects": ["what changing this property impacts"]
        }
    ],
    
    "lifecycle": {
        "creation": "how it's created",
        "modification": "how it's modified",
        "destruction": "how it's destroyed/cleaned up",
        "serialization": "how it's saved",
        "deserialization": "how it's loaded"
    },
    
    "examples": [
        {
            "name": "example name",
            "description": "what this example shows",
            "code": "code to create this artifact",
            "result": "what the code produces"
        }
    ]
}
```

---

## Storage Architecture: The Hybrid Approach

At 1,000 targets, we're looking at roughly:

```
1,000 targets × ~150 capabilities each  = 150,000 capability nodes
150,000 capabilities × ~2 structures    = 300,000 structure nodes
~50,000 unique algorithms (deduplicated) = 50,000 algorithm nodes
~10,000 cross-cutting concepts          = 10,000 concept nodes
~5,000 blueprints                       = 5,000 blueprint nodes
~200,000 artifacts                      = 200,000 artifact nodes
                                          ─────────────────────
                                          ~715,000 total nodes
                                          ~3,000,000+ edges
```

No single storage technology optimally serves all access patterns. We need a hybrid:

```python
# storage.py
"""
Three-tier storage architecture:
                                                              
  ┌───────────────────────────────────────────────────────┐   
  │                     ACCESS LAYER                       │   
  │              (unified query interface)                 │   
  └────────┬──────────────┬───────────────┬───────────────┘   
           │              │               │                    
           ▼              ▼               ▼                    
  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐      
  │   GRAPH DB   │ │  DOCUMENT DB │ │  VECTOR STORE    │      
  │              │ │              │ │                   │      
  │  Nodes +     │ │  Full content│ │  Embeddings for  │      
  │  Edges +     │ │  of each     │ │  semantic search │      
  │  Traversal   │ │  knowledge   │ │  and AI-native   │      
  │              │ │  node        │ │  retrieval       │      
  │  "Find all   │ │              │ │                  │      
  │   algorithms │ │  "Get the    │ │  "Find knowledge │      
  │   used by    │ │   complete   │ │   similar to     │      
  │   formats    │ │   Gaussian   │ │   'how to blend  │      
  │   that       │ │   blur       │ │   two images     │      
  │   support    │ │   algorithm  │ │   with alpha'"   │      
  │   animation" │ │   with all   │ │                  │      
  │              │ │   code and   │ │                  │      
  │              │ │   formulas"  │ │                  │      
  │  SQLite +    │ │              │ │                  │      
  │  adjacency   │ │  SQLite JSON │ │  SQLite + numpy  │      
  │  tables      │ │  or flat     │ │  or ChromaDB     │      
  │              │ │  JSON files  │ │  or Qdrant       │      
  └──────────────┘ └──────────────┘ └──────────────────┘      
                                                               
       WHY            WHY               WHY                    
  Relationship     Content is        AI agents need            
  queries are      large (code,      semantic search,          
  the primary      formulas,         not just keyword          
  navigation       templates)        lookup                    
  pattern          and needs                                   
                   full-text                                   
                   retrieval                                   
"""

import sqlite3
import json
import numpy as np
from pathlib import Path
from typing import Optional, Generator


class UniversalKnowledgeStore:
    """
    The unified storage layer for the knowledge graph.
    
    Uses SQLite for both graph and document storage (portable, zero-config).
    Vector store can be SQLite-based for MVP, swappable to dedicated 
    vector DB for production.
    """
    
    def __init__(self, base_path: str = "knowledge_base"):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)
        
        self.db = sqlite3.connect(
            self.base_path / "graph.db",
            check_same_thread=False
        )
        self.db.execute("PRAGMA journal_mode=WAL")
        self.db.execute("PRAGMA foreign_keys=ON")
        self._init_schema()
    
    def _init_schema(self):
        self.db.executescript("""
            -- ═══════════════════════════════════════════════
            -- NODES: Every piece of knowledge
            -- ═══════════════════════════════════════════════
            CREATE TABLE IF NOT EXISTS nodes (
                canonical_id    TEXT PRIMARY KEY,
                node_type       TEXT NOT NULL,  -- target|concept|algorithm|structure|blueprint|artifact
                name            TEXT NOT NULL,
                content         JSON NOT NULL,   -- the full knowledge payload
                version         TEXT DEFAULT '1.0',
                tags            JSON DEFAULT '[]',
                confidence      TEXT DEFAULT 'generated',
                content_hash    TEXT NOT NULL,
                embedding       BLOB,            -- vector embedding for semantic search
                created_at      TEXT DEFAULT (datetime('now')),
                updated_at      TEXT DEFAULT (datetime('now')),
                generation_id   TEXT,            -- which generation run produced this
                token_cost      INTEGER DEFAULT 0 -- how many API tokens this cost
            );
            
            CREATE INDEX IF NOT EXISTS idx_nodes_type ON nodes(node_type);
            CREATE INDEX IF NOT EXISTS idx_nodes_tags ON nodes(tags);
            CREATE INDEX IF NOT EXISTS idx_nodes_hash ON nodes(content_hash);
            CREATE INDEX IF NOT EXISTS idx_nodes_confidence ON nodes(confidence);
            
            
            -- ═══════════════════════════════════════════════
            -- EDGES: Relationships between knowledge
            -- ═══════════════════════════════════════════════
            CREATE TABLE IF NOT EXISTS edges (
                edge_id         TEXT PRIMARY KEY,
                source_id       TEXT NOT NULL REFERENCES nodes(canonical_id),
                target_id       TEXT NOT NULL REFERENCES nodes(canonical_id),
                relationship    TEXT NOT NULL,
                metadata        JSON DEFAULT '{}',
                weight          REAL DEFAULT 1.0,
                bidirectional   INTEGER DEFAULT 0,
                context         TEXT,
                created_at      TEXT DEFAULT (datetime('now'))
            );
            
            CREATE INDEX IF NOT EXISTS idx_edges_source ON edges(source_id);
            CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(target_id);
            CREATE INDEX IF NOT EXISTS idx_edges_rel ON edges(relationship);
            -- Composite index for common traversal pattern
            CREATE INDEX IF NOT EXISTS idx_edges_source_rel 
                ON edges(source_id, relationship);
            CREATE INDEX IF NOT EXISTS idx_edges_target_rel 
                ON edges(target_id, relationship);
            
            
            -- ═══════════════════════════════════════════════
            -- GENERATION RUNS: Track what was generated when
            -- ═══════════════════════════════════════════════
            CREATE TABLE IF NOT EXISTS generation_runs (
                run_id          TEXT PRIMARY KEY,
                target_id       TEXT,
                started_at      TEXT DEFAULT (datetime('now')),
                completed_at    TEXT,
                status          TEXT DEFAULT 'running',
                config          JSON,
                total_api_calls INTEGER DEFAULT 0,
                total_tokens    INTEGER DEFAULT 0,
                total_cost_usd  REAL DEFAULT 0.0,
                nodes_created   INTEGER DEFAULT 0,
                edges_created   INTEGER DEFAULT 0,
                errors          JSON DEFAULT '[]',
                completeness    JSON DEFAULT '{}'
            );
            
            
            -- ═══════════════════════════════════════════════
            -- VALIDATION: Track verified vs unverified knowledge
            -- ═══════════════════════════════════════════════
            CREATE TABLE IF NOT EXISTS validations (
                validation_id   INTEGER PRIMARY KEY AUTOINCREMENT,
                node_id         TEXT REFERENCES nodes(canonical_id),
                validation_type TEXT,  -- code_execution|cross_reference|human_review|spec_check
                passed          INTEGER,
                details         JSON,
                validated_at    TEXT DEFAULT (datetime('now'))
            );
            
            CREATE INDEX IF NOT EXISTS idx_val_node ON validations(node_id);
            
            
            -- ═══════════════════════════════════════════════
            -- FULL-TEXT SEARCH
            -- ═══════════════════════════════════════════════
            CREATE VIRTUAL TABLE IF NOT EXISTS nodes_fts USING fts5(
                canonical_id,
                name,
                content,
                tags,
                content='nodes',
                content_rowid='rowid'
            );
        """)
        self.db.commit()
    
    # ─── Node Operations ────────────────────────────────────
    
    def upsert_node(self, node: KnowledgeNode) -> bool:
        """
        Insert or update a node. Returns True if content changed.
        Uses content-addressed hashing to detect changes.
        """
        existing = self.db.execute(
            "SELECT content_hash FROM nodes WHERE canonical_id = ?",
            (node.canonical_id,)
        ).fetchone()
        
        if existing and existing[0] == node.content_hash:
            return False  # No change
        
        self.db.execute("""
            INSERT INTO nodes 
                (canonical_id, node_type, name, content, version, tags,
                 confidence, content_hash, generation_id, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(canonical_id) DO UPDATE SET
                content = excluded.content,
                version = excluded.version,
                tags = excluded.tags,
                confidence = excluded.confidence,
                content_hash = excluded.content_hash,
                updated_at = datetime('now')
        """, (
            node.canonical_id, node.node_type, node.name,
            json.dumps(node.content), node.version,
            json.dumps(node.tags), node.confidence.value,
            node.content_hash, node.source_generation_id
        ))
        self.db.commit()
        return True
    
    def get_node(self, canonical_id: str) -> Optional[dict]:
        row = self.db.execute(
            "SELECT * FROM nodes WHERE canonical_id = ?",
            (canonical_id,)
        ).fetchone()
        if row:
            return self._row_to_node_dict(row)
        return None
    
    def get_nodes_by_type(self, node_type: str, 
                           limit: int = None) -> list[dict]:
        query = "SELECT * FROM nodes WHERE node_type = ?"
        params = [node_type]
        if limit:
            query += " LIMIT ?"
            params.append(limit)
        rows = self.db.execute(query, params).fetchall()
        return [self._row_to_node_dict(r) for r in rows]
    
    def get_nodes_by_tag(self, tag: str) -> list[dict]:
        rows = self.db.execute("""
            SELECT * FROM nodes 
            WHERE tags LIKE ?
        """, (f'%"{tag}"%',)).fetchall()
        return [self._row_to_node_dict(r) for r in rows]
    
    # ─── Edge Operations ────────────────────────────────────
    
    def add_edge(self, edge: KnowledgeEdge):
        self.db.execute("""
            INSERT OR REPLACE INTO edges
                (edge_id, source_id, target_id, relationship,
                 metadata, weight, bidirectional, context)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            edge.edge_id, edge.source_id, edge.target_id,
            edge.relationship.value, json.dumps(edge.metadata),
            edge.weight, int(edge.bidirectional), edge.context
        ))
        self.db.commit()
    
    # ─── Graph Traversal ────────────────────────────────────
    
    def get_neighbors(self, node_id: str, 
                       relationship: str = None,
                       direction: str = "outgoing"  # outgoing|incoming|both
                       ) -> list[dict]:
        """Get connected nodes with optional relationship filter."""
        results = []
        
        if direction in ("outgoing", "both"):
            query = """
                SELECT n.*, e.relationship, e.metadata as edge_metadata
                FROM edges e JOIN nodes n ON e.target_id = n.canonical_id
                WHERE e.source_id = ?
            """
            params = [node_id]
            if relationship:
                query += " AND e.relationship = ?"
                params.append(relationship)
            results.extend(self.db.execute(query, params).fetchall())
        
        if direction in ("incoming", "both"):
            query = """
                SELECT n.*, e.relationship, e.metadata as edge_metadata
                FROM edges e JOIN nodes n ON e.source_id = n.canonical_id
                WHERE e.target_id = ?
            """
            params = [node_id]
            if relationship:
                query += " AND e.relationship = ?"
                params.append(relationship)
            results.extend(self.db.execute(query, params).fetchall())
        
        return results  # Would be processed into proper dicts
    
    def find_path(self, from_id: str, to_id: str, 
                   max_depth: int = 5) -> list[list[str]]:
        """BFS to find paths between two nodes."""
        from collections import deque
        
        queue = deque([(from_id, [from_id])])
        visited = {from_id}
        paths = []
        
        while queue:
            current, path = queue.popleft()
            
            if len(path) > max_depth:
                continue
            
            if current == to_id:
                paths.append(path)
                continue
            
            neighbors = self.db.execute("""
                SELECT target_id FROM edges WHERE source_id = ?
                UNION
                SELECT source_id FROM edges WHERE target_id = ? AND bidirectional = 1
            """, (current, current)).fetchall()
            
            for (neighbor_id,) in neighbors:
                if neighbor_id not in visited:
                    visited.add(neighbor_id)
                    queue.append((neighbor_id, path + [neighbor_id]))
        
        return paths
    
    def get_subgraph(self, root_id: str, depth: int = 2,
                      relationship_filter: list[str] = None
                      ) -> dict:
        """
        Extract a subgraph rooted at a node.
        This is the primary method for AI context construction —
        grab a relevant neighborhood of knowledge.
        """
        nodes = {}
        edges = []
        
        def traverse(node_id: str, current_depth: int):
            if current_depth > depth or node_id in nodes:
                return
            
            node = self.get_node(node_id)
            if node:
                nodes[node_id] = node
            
            query = "SELECT * FROM edges WHERE source_id = ?"
            params = [node_id]
            if relationship_filter:
                placeholders = ",".join("?" * len(relationship_filter))
                query += f" AND relationship IN ({placeholders})"
                params.extend(relationship_filter)
            
            for row in self.db.execute(query, params).fetchall():
                edges.append(self._row_to_edge_dict(row))
                traverse(row[2], current_depth + 1)  # target_id
        
        traverse(root_id, 0)
        return {"nodes": nodes, "edges": edges}
    
    # ─── Semantic Search ────────────────────────────────────
    
    def search_text(self, query: str, limit: int = 20) -> list[dict]:
        """Full-text search across all knowledge nodes."""
        rows = self.db.execute("""
            SELECT n.* FROM nodes_fts fts
            JOIN nodes n ON fts.canonical_id = n.canonical_id
            WHERE nodes_fts MATCH ?
            ORDER BY rank
            LIMIT ?
        """, (query, limit)).fetchall()
        return [self._row_to_node_dict(r) for r in rows]
    
    def search_semantic(self, query_embedding: np.ndarray,
                         node_type: str = None,
                         limit: int = 10) -> list[dict]:
        """
        Vector similarity search.
        For MVP, we do brute-force in SQLite.
        For production, swap to dedicated vector DB.
        """
        query = "SELECT canonical_id, embedding FROM nodes WHERE embedding IS NOT NULL"
        params = []
        if node_type:
            query += " AND node_type = ?"
            params.append(node_type)
        
        rows = self.db.execute(query, params).fetchall()
        
        similarities = []
        for canonical_id, emb_blob in rows:
            if emb_blob:
                stored_emb = np.frombuffer(emb_blob, dtype=np.float32)
                similarity = np.dot(query_embedding, stored_emb) / (
                    np.linalg.norm(query_embedding) * np.linalg.norm(stored_emb)
                )
                similarities.append((canonical_id, float(similarity)))
        
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        results = []
        for canonical_id, score in similarities[:limit]:
            node = self.get_node(canonical_id)
            if node:
                node["similarity_score"] = score
                results.append(node)
        
        return results
    
    # ─── Cross-Target Queries (the power of the graph) ──────
    
    def find_shared_algorithms(self, target_a: str, 
                                target_b: str) -> list[dict]:
        """Find algorithms used by both targets."""
        rows = self.db.execute("""
            SELECT DISTINCT n.*
            FROM nodes n
            JOIN edges e1 ON n.canonical_id = e1.target_id
            JOIN edges e2 ON n.canonical_id = e2.target_id
            WHERE n.node_type = 'algorithm'
              AND e1.source_id = ? AND e1.relationship = 'uses_algorithm'
              AND e2.source_id = ? AND e2.relationship = 'uses_algorithm'
        """, (target_a, target_b)).fetchall()
        return [self._row_to_node_dict(r) for r in rows]
    
    def find_targets_with_capability(self, concept_id: str) -> list[dict]:
        """Find all targets that implement a given concept."""
        rows = self.db.execute("""
            SELECT n.* 
            FROM nodes n
            JOIN edges e ON n.canonical_id = e.source_id
            WHERE n.node_type = 'target'
              AND e.target_id = ?
              AND e.relationship = 'implements'
        """, (concept_id,)).fetchall()
        return [self._row_to_node_dict(r) for r in rows]
    
    def get_conversion_path(self, from_target: str, 
                             to_target: str) -> list[dict]:
        """Find how to convert between two formats."""
        paths = self.find_path(from_target, to_target, max_depth=4)
        
        detailed_paths = []
        for path in paths:
            detailed = []
            for i in range(len(path) - 1):
                edge = self.db.execute("""
                    SELECT * FROM edges 
                    WHERE source_id = ? AND target_id = ?
                """, (path[i], path[i+1])).fetchone()
                if edge:
                    detailed.append(self._row_to_edge_dict(edge))
            detailed_paths.append(detailed)
        
        return detailed_paths
    
    # ─── Statistics & Health ────────────────────────────────
    
    def get_statistics(self) -> dict:
        stats = {}
        
        # Node counts by type
        for row in self.db.execute("""
            SELECT node_type, COUNT(*), 
                   SUM(CASE WHEN confidence = 'verified' THEN 1 ELSE 0 END),
                   SUM(token_cost)
            FROM nodes GROUP BY node_type
        """).fetchall():
            stats[f"nodes_{row[0]}"] = {
                "total": row[1],
                "verified": row[2],
                "token_cost": row[3]
            }
        
        # Edge counts
        stats["total_edges"] = self.db.execute(
            "SELECT COUNT(*) FROM edges"
        ).fetchone()[0]
        
        # Targets coverage
        stats["targets_documented"] = self.db.execute(
            "SELECT COUNT(*) FROM nodes WHERE node_type = 'target'"
        ).fetchone()[0]
        
        # Total cost
        total = self.db.execute(
            "SELECT SUM(total_cost_usd) FROM generation_runs"
        ).fetchone()[0]
        stats["total_cost_usd"] = total or 0.0
        
        return stats
    
    # ─── Helpers ────────────────────────────────────────────
    
    def _row_to_node_dict(self, row) -> dict:
        columns = [
            "canonical_id", "node_type", "name", "content", "version",
            "tags", "confidence", "content_hash", "embedding",
            "created_at", "updated_at", "generation_id", "token_cost"
        ]
        d = dict(zip(columns, row))
        d["content"] = json.loads(d["content"]) if isinstance(d["content"], str) else d["content"]
        d["tags"] = json.loads(d["tags"]) if isinstance(d["tags"], str) else d["tags"]
        d.pop("embedding", None)  # Don't include binary blob in dict
        return d
    
    def _row_to_edge_dict(self, row) -> dict:
        columns = [
            "edge_id", "source_id", "target_id", "relationship",
            "metadata", "weight", "bidirectional", "context", "created_at"
        ]
        d = dict(zip(columns, row))
        d["metadata"] = json.loads(d["metadata"]) if isinstance(d["metadata"], str) else d["metadata"]
        return d
```

---

## The AI-Native Query Interface

This is what makes the database truly **AI-native** — a query layer designed for LLM consumption:

```python
# ai_interface.py
"""
The AI-native interface to the knowledge graph.

Designed for three use cases:
1. An AI agent building software (needs relevant knowledge in context)
2. A developer asking natural language questions
3. An automated code generator pulling templates and algorithms
"""

import json
from typing import Optional


class KnowledgeQuery:
    """
    Translates natural-language-like queries into graph traversals
    and returns AI-consumable knowledge bundles.
    """
    
    def __init__(self, store: UniversalKnowledgeStore):
        self.store = store
    
    def get_everything_for_capability(
        self, 
        target_id: str,
        capability_name: str
    ) -> dict:
        """
        "I want to draw a rectangle in a PPTX file. 
         Give me EVERYTHING I need."
        
        Returns a bundle containing:
        - The structural template
        - All required algorithms  
        - The coordinate system
        - Composition rules with other features
        - Working code examples
        """
        # Find the capability node
        # Search through target's capabilities
        capability_nodes = self.store.db.execute("""
            SELECT n.* FROM nodes n
            JOIN edges e ON n.canonical_id = e.target_id
            WHERE e.source_id = ?
              AND e.relationship = 'contains'
              AND n.name LIKE ?
        """, (target_id, f"%{capability_name}%")).fetchall()
        
        if not capability_nodes:
            return {"error": f"Capability '{capability_name}' not found for {target_id}"}
        
        cap_node = self.store._row_to_node_dict(capability_nodes[0])
        cap_id = cap_node["canonical_id"]
        
        # Get structural templates
        templates = self.store.get_neighbors(
            cap_id, relationship="template_for", direction="incoming"
        )
        
        # Get algorithms
        algorithms = self.store.get_neighbors(
            cap_id, relationship="uses_algorithm", direction="outgoing"
        )
        
        # Get coordinate system from the target
        coord_nodes = self.store.db.execute("""
            SELECT n.* FROM nodes n
            WHERE n.canonical_id LIKE ?
              AND n.tags LIKE '%coordinate%'
        """, (f"{target_id}%",)).fetchall()
        
        # Get composition rules involving this capability
        composition = self.store.db.execute("""
            SELECT n.content FROM nodes n
            JOIN edges e ON n.canonical_id = e.source_id OR n.canonical_id = e.target_id
            WHERE n.node_type = 'concept'
              AND n.tags LIKE '%composition%'
              AND (e.source_id = ? OR e.target_id = ?)
        """, (cap_id, cap_id)).fetchall()
        
        # Get prerequisites (recursive)
        prerequisites = self._get_prerequisites_recursive(cap_id, depth=3)
        
        # Assemble the knowledge bundle
        bundle = {
            "query": f"Everything needed for '{capability_name}' in {target_id}",
            "capability": cap_node,
            "structural_templates": [self.store._row_to_node_dict(t) for t in templates] if templates else [],
            "algorithms": [self.store._row_to_node_dict(a) for a in algorithms] if algorithms else [],
            "coordinate_system": [self.store._row_to_node_dict(c) for c in coord_nodes] if coord_nodes else [],
            "composition_rules": [json.loads(c[0]) for c in composition] if composition else [],
            "prerequisites": prerequisites,
            
            # AI-friendly summary
            "ai_summary": self._generate_ai_summary(
                cap_node, templates, algorithms
            )
        }
        
        return bundle
    
    def get_blueprint_with_dependencies(
        self,
        blueprint_id: str
    ) -> dict:
        """
        "I want to build an image editor. Give me the complete
         blueprint with all algorithms and templates I'll need."
        """
        blueprint = self.store.get_node(blueprint_id)
        if not blueprint:
            return {"error": f"Blueprint '{blueprint_id}' not found"}
        
        # Get all nodes the blueprint depends on
        subgraph = self.store.get_subgraph(
            blueprint_id, 
            depth=3,
            relationship_filter=[
                "builds_with", "uses_algorithm", 
                "depends_on", "template_for"
            ]
        )
        
        return {
            "blueprint": blueprint,
            "dependency_graph": subgraph,
            "total_algorithms": len([
                n for n in subgraph["nodes"].values() 
                if n["node_type"] == "algorithm"
            ]),
            "total_structures": len([
                n for n in subgraph["nodes"].values() 
                if n["node_type"] == "structure"
            ]),
        }
    
    def compare_targets(
        self,
        target_a: str,
        target_b: str
    ) -> dict:
        """
        "Compare PNG and JPEG — what do they share, 
         what's different, can I convert between them?"
        """
        node_a = self.store.get_node(target_a)
        node_b = self.store.get_node(target_b)
        
        shared_algorithms = self.store.find_shared_algorithms(target_a, target_b)
        conversion_path = self.store.get_conversion_path(target_a, target_b)
        
        # Find shared concepts
        concepts_a = set(
            r[0] for r in self.store.db.execute("""
                SELECT e.target_id FROM edges e
                WHERE e.source_id = ? AND e.relationship = 'implements'
            """, (target_a,)).fetchall()
        )
        
        concepts_b = set(
            r[0] for r in self.store.db.execute("""
                SELECT e.target_id FROM edges e
                WHERE e.source_id = ? AND e.relationship = 'implements'
            """, (target_b,)).fetchall()
        )
        
        shared_concepts = concepts_a & concepts_b
        unique_to_a = concepts_a - concepts_b
        unique_to_b = concepts_b - concepts_a
        
        return {
            "target_a": node_a,
            "target_b": node_b,
            "shared_algorithms": shared_algorithms,
            "shared_concepts": list(shared_concepts),
            "unique_to_a": list(unique_to_a),
            "unique_to_b": list(unique_to_b),
            "conversion_paths": conversion_path,
            "similarity_score": len(shared_concepts) / max(
                len(concepts_a | concepts_b), 1
            )
        }
    
    def find_implementation_for_concept(
        self,
        concept_id: str,
        preferred_target: str = None
    ) -> dict:
        """
        "Show me how 'alpha compositing' is implemented 
         across all formats that support it."
        """
        targets = self.store.find_targets_with_capability(concept_id)
        
        implementations = []
        for target_row in targets:
            target = self.store._row_to_node_dict(target_row)
            
            # Get the specific algorithm used by this target
            algos = self.store.db.execute("""
                SELECT n.* FROM nodes n
                JOIN edges e1 ON n.canonical_id = e1.target_id
                JOIN edges e2 ON e1.source_id = e2.source_id
                WHERE e1.relationship = 'uses_algorithm'
                  AND e2.target_id = ?
                  AND e2.relationship = 'implements'
                  AND e2.source_id = ?
            """, (concept_id, target["canonical_id"])).fetchall()
            
            implementations.append({
                "target": target,
                "algorithms": [self.store._row_to_node_dict(a) for a in algos]
            })
        
        return {
            "concept": self.store.get_node(concept_id),
            "implementations": implementations,
            "total_targets": len(implementations)
        }
    
    def assemble_context_for_task(
        self,
        task_description: str,
        target_id: str,
        max_tokens: int = 8000
    ) -> str:
        """
        Given a natural-language task description, assemble 
        the optimal knowledge context for an AI to complete it.
        
        This is the KEY method for AI-native usage:
        the database becomes a context-assembly engine.
        """
        # Step 1: Semantic search to find relevant nodes
        # (In production, embed the task description and do vector search)
        relevant_nodes = self.store.search_text(
            task_description, limit=30
        )
        
        # Step 2: Filter to target-relevant nodes
        target_subgraph = self.store.get_subgraph(target_id, depth=1)
        target_node_ids = set(target_subgraph["nodes"].keys())
        
        # Step 3: Score and rank by relevance
        scored_nodes = []
        for node in relevant_nodes:
            score = 0
            
            # Boost if directly connected to target
            if node["canonical_id"] in target_node_ids:
                score += 10
            
            # Boost algorithms and structures (most actionable)
            if node["node_type"] == "algorithm":
                score += 5
            elif node["node_type"] == "structure":
                score += 5
            
            # Boost verified content
            if node.get("confidence") == "verified":
                score += 3
            
            scored_nodes.append((score, node))
        
        scored_nodes.sort(key=lambda x: x[0], reverse=True)
        
        # Step 4: Assemble context within token budget
        context_parts = []
        estimated_tokens = 0
        
        # Always include coordinate system
        coord_node = self.store.get_node(f"{target_id}:coordinate_system")
        if coord_node:
            coord_text = json.dumps(coord_node["content"], indent=2)
            context_parts.append(f"COORDINATE SYSTEM:\n{coord_text}")
            estimated_tokens += len(coord_text.split()) * 1.3
        
        for score, node in scored_nodes:
            node_text = self._format_node_for_context(node)
            node_tokens = len(node_text.split()) * 1.3
            
            if estimated_tokens + node_tokens > max_tokens:
                break
            
            context_parts.append(node_text)
            estimated_tokens += node_tokens
        
        return "\n\n---\n\n".join(context_parts)
    
    def _format_node_for_context(self, node: dict) -> str:
        """Format a knowledge node for LLM context injection."""
        content = node.get("content", {})
        
        if node["node_type"] == "algorithm":
            # For algorithms, prioritize code and formulas
            parts = [f"ALGORITHM: {node['name']}"]
            if "purpose" in content:
                parts.append(f"Purpose: {content['purpose']}")
            if "implementations" in content:
                for lang, impl in content["implementations"].items():
                    if isinstance(impl, dict) and "code" in impl:
                        parts.append(f"Implementation ({lang}):\n```{lang}\n{impl['code']}\n```")
                        break  # Just include one implementation in context
            if "parameters" in content:
                parts.append(f"Parameters: {json.dumps(content['parameters'], indent=2)}")
            return "\n".join(parts)
        
        elif node["node_type"] == "structure":
            parts = [f"STRUCTURE TEMPLATE: {node['name']}"]
            if "template" in content:
                template = content["template"]
                if isinstance(template, dict):
                    parts.append(f"Template:\n{template.get('raw', json.dumps(template))}")
                else:
                    parts.append(f"Template:\n{template}")
            if "variables" in content:
                parts.append(f"Variables: {json.dumps(content['variables'], indent=2)}")
            if "assembly_code" in content:
                ac = content["assembly_code"]
                if isinstance(ac, dict):
                    parts.append(f"Assembly code:\n```{ac.get('language', '')}\n{ac.get('code', '')}\n```")
            return "\n".join(parts)
        
        else:
            return f"{node['node_type'].upper()}: {node['name']}\n{json.dumps(content, indent=2)}"
    
    def _get_prerequisites_recursive(self, node_id: str, 
                                       depth: int) -> list[dict]:
        """Get all prerequisites recursively."""
        if depth <= 0:
            return []
        
        prereqs = self.store.get_neighbors(
            node_id, relationship="prerequisite", direction="outgoing"
        )
        
        result = []
        for prereq_row in (prereqs or []):
            prereq = self.store._row_to_node_dict(prereq_row) if not isinstance(prereq_row, dict) else prereq_row
            prereq["_depth"] = depth
            result.append(prereq)
            # Recurse
            result.extend(
                self._get_prerequisites_recursive(
                    prereq.get("canonical_id", ""), depth - 1
                )
            )
        
        return result
    
    def _generate_ai_summary(self, capability, templates, algorithms) -> str:
        """Generate a concise summary optimized for AI consumption."""
        parts = [
            f"To implement '{capability.get('name', 'unknown')}':"
        ]
        
        if templates:
            parts.append(f"- {len(templates)} structural template(s) available")
        if algorithms:
            parts.append(f"- {len(algorithms)} algorithm(s) required")
        
        return "\n".join(parts)
```

---

## The Deduplication Engine: Why Graph Beats Filing Cabinet

This is where the 1,000-target scale becomes manageable instead of insane:

```python
# deduplication.py
"""
The Deduplication Engine.

When generating knowledge for target #500, most of the algorithms 
and concepts already exist from targets #1-499. The deduplication 
engine ensures we link to existing knowledge instead of regenerating it.

Example: We're generating the database for TIFF (target #47).
TIFF uses DEFLATE compression. We already documented DEFLATE 
when we did PNG (target #3). The deduplication engine:
1. Detects that the "DEFLATE compression" algorithm already exists
2. Creates an edge: target:tiff --uses_algorithm--> algorithm:compression:deflate
3. Does NOT regenerate the algorithm
4. DOES generate the TIFF-specific structural template for how TIFF wraps DEFLATE

This saves ~40-60% of generation costs at scale.
"""


class DeduplicationEngine:
    
    def __init__(self, store: UniversalKnowledgeStore, 
                 api: 'MultiProviderAPIEngine'):
        self.store = store
        self.api = api
    
    async def check_before_generating(
        self,
        proposed_node_type: str,
        proposed_name: str,
        proposed_content_summary: str,
        target_id: str
    ) -> dict:
        """
        Before generating a new node, check if equivalent 
        knowledge already exists.
        
        Returns:
        {
            "action": "skip" | "link" | "generate" | "specialize",
            "existing_node_id": "..." or None,
            "reasoning": "why this action"
        }
        """
        # Strategy 1: Exact ID match
        potential_id = KnowledgeNode.generate_id(
            proposed_node_type, proposed_name
        )
        existing = self.store.get_node(potential_id)
        if existing:
            return {
                "action": "link",
                "existing_node_id": potential_id,
                "reasoning": f"Exact match found: {potential_id}"
            }
        
        # Strategy 2: Fuzzy name search
        similar = self.store.search_text(proposed_name, limit=5)
        for node in similar:
            if (node["node_type"] == proposed_node_type and
                self._is_semantically_equivalent(
                    proposed_name, proposed_content_summary,
                    node["name"], json.dumps(node["content"])[:500]
                )):
                return {
                    "action": "link",
                    "existing_node_id": node["canonical_id"],
                    "reasoning": f"Semantic match: {node['canonical_id']}"
                }
        
        # Strategy 3: Check if this is a specialization of existing knowledge
        for node in similar:
            if (node["node_type"] == proposed_node_type and
                self._is_specialization(
                    proposed_content_summary,
                    json.dumps(node["content"])[:500]
                )):
                return {
                    "action": "specialize",
                    "existing_node_id": node["canonical_id"],
                    "reasoning": f"Specialization of: {node['canonical_id']}. "
                                f"Generate only the delta."
                }
        
        return {
            "action": "generate",
            "existing_node_id": None,
            "reasoning": "No existing equivalent found"
        }
    
    def _is_semantically_equivalent(self, name_a: str, summary_a: str,
                                     name_b: str, summary_b: str) -> bool:
        """
        Quick heuristic check for semantic equivalence.
        In production, use embedding similarity.
        """
        # Normalize
        norm_a = set(name_a.lower().replace("-", " ").replace("_", " ").split())
        norm_b = set(name_b.lower().replace("-", " ").replace("_", " ").split())
        
        # High word overlap suggests same concept
        if len(norm_a & norm_b) / max(len(norm_a | norm_b), 1) > 0.7:
            return True
        
        # Known equivalences
        equivalences = {
            frozenset({"gaussian", "blur"}): frozenset({"gaussian", "blur", "filter"}),
            frozenset({"deflate"}): frozenset({"deflate", "compression"}),
            frozenset({"crc32"}): frozenset({"crc", "32", "checksum"}),
            frozenset({"alpha", "compositing"}): frozenset({"alpha", "blend", "compositing"}),
        }
        
        for eq_set_a, eq_set_b in equivalences.items():
            if (norm_a & eq_set_a and norm_b & eq_set_b) or \
               (norm_b & eq_set_a and norm_a & eq_set_b):
                return True
        
        return False
    
    def _is_specialization(self, summary_a: str, summary_b: str) -> bool:
        """Check if A is a more specific version of B."""
        # Simplified heuristic
        return False  # In production, use LLM judgment
    
    def get_dedup_statistics(self) -> dict:
        """How much has deduplication saved?"""
        total_edges = self.store.db.execute(
            "SELECT COUNT(*) FROM edges WHERE relationship = 'uses_algorithm'"
        ).fetchone()[0]
        
        unique_algorithms = self.store.db.execute(
            "SELECT COUNT(*) FROM nodes WHERE node_type = 'algorithm'"
        ).fetchone()[0]
        
        total_targets = self.store.db.execute(
            "SELECT COUNT(*) FROM nodes WHERE node_type = 'target'"
        ).fetchone()[0]
        
        # Without dedup, each target would have its own copy
        naive_algorithm_count = total_edges  # one copy per usage
        
        savings_pct = ((naive_algorithm_count - unique_algorithms) / 
                       max(naive_algorithm_count, 1)) * 100
        
        return {
            "unique_algorithms": unique_algorithms,
            "algorithm_usages": total_edges,
            "duplication_avoided": naive_algorithm_count - unique_algorithms,
            "savings_pct": f"{savings_pct:.1f}%",
            "estimated_cost_saved": f"${(naive_algorithm_count - unique_algorithms) * 0.05:.2f}"
        }
```

---

## Visualizing the Full System at Scale

```
                    THE UNIVERSAL KNOWLEDGE GRAPH
                    ══════════════════════════════
                    
    1,000 Targets Documented
    715,000 Knowledge Nodes
    3,000,000+ Relationships
    
                         ┌─────────────┐
                         │  CONCEPTS   │
                         │   ~10,000   │
                         │             │
                         │ compression │
                         │ color_space │
                         │ animation   │
                         │ encryption  │
                         │ layout      │
                         │ ...         │
                         └──────┬──────┘
                                │
                    ┌───────────┼───────────┐
                    │           │           │
               ┌────▼────┐ ┌───▼────┐ ┌───▼─────┐
               │  ALGO-  │ │  ALGO- │ │  ALGO-  │
               │  RITHMS │ │  RITHMS│ │  RITHMS │
               │ ~50,000 │ │  ...   │ │  ...    │
               │ (unique)│ │        │ │         │
               └──┬──┬───┘ └───┬────┘ └────┬────┘
                  │  │         │            │
      ┌───────────┘  └────┐   │     ┌──────┘
      │                   │   │     │
   ┌──▼──┐  ┌──────┐  ┌──▼───▼─┐  ┌▼─────┐  ┌──────┐
   │ PNG │  │ JPEG │  │ TIFF  │  │ PSD  │  │ WebP │  ...
   │     │  │      │  │       │  │      │  │      │
   │  S  │  │  S   │  │  S    │  │  S   │  │  S   │
   │  T  │  │  T   │  │  T    │  │  T   │  │  T   │
   │  R  │  │  R   │  │  R    │  │  R   │  │  R   │
   │  U  │  │  U   │  │  U    │  │  U   │  │  U   │
   │  C  │  │  C   │  │  C    │  │  C   │  │  C   │
   │  T  │  │  T   │  │  T    │  │  T   │  │  T   │
   │  S  │  │  S   │  │  S    │  │  S   │  │  S   │
   └──┬──┘  └──┬───┘  └──┬────┘  └──┬──┘  └──┬───┘
      │        │         │          │         │
      └────────┴────┬────┴──────────┴─────────┘
                    │
               ┌────▼──────┐
               │BLUEPRINTS │
               │  ~5,000   │
               │           │
               │ "image    │
               │  editor"  │
               │ "encoder" │
               │ "viewer"  │
               └───────────┘
               
    KEY INSIGHT: Algorithms are SHARED across targets.
    DEFLATE appears once, linked to PNG, TIFF, ZIP, HTTP, PDF...
    Gaussian blur appears once, linked to PNG, PSD, SVG, CSS, WebGL...
    
    At 1,000 targets, ~60% of algorithmic knowledge is REUSED.
```

---

## The Generation Strategy at Scale

You don't generate 1,000 targets independently. You generate them in **families** that maximize knowledge reuse:

```
GENERATION ORDER (optimized for knowledge reuse):
═══════════════════════════════════════════════════

WAVE 1: Foundation Formats (establish core algorithms)
────────────────────────────────────────────────────
  PNG  → establishes: DEFLATE, CRC32, color types, 
         raster image concepts, chunk-based formats
  JSON → establishes: text serialization, parsing, 
         schema validation concepts
  Python → establishes: programming language concepts,
           type systems, control flow taxonomy

WAVE 2: Related Formats (high reuse from Wave 1)
────────────────────────────────────────────────────
  JPEG → reuses: raster image concepts, color types
         NEW: DCT algorithm, Huffman coding, lossy compression
  TIFF → reuses: DEFLATE, raster concepts, CRC  
         NEW: IFD structure, multi-image, metadata
  YAML → reuses: text serialization concepts
         NEW: indentation-based syntax, anchors
  JavaScript → reuses: ~70% of language concepts from Python
         NEW: prototype inheritance, event loop, DOM

WAVE 3: Complex Formats (heavy reuse)  
────────────────────────────────────────────────────
  PPTX → reuses: DEFLATE (from PNG), XML concepts
         NEW: OOXML structure, EMU coordinates, slide model
  DOCX → reuses: ~80% of PPTX knowledge (same OOXML base!)
         NEW: paragraph model, section breaks, page layout
  XLSX → reuses: ~70% of PPTX/DOCX (OOXML again)
         NEW: cell references, formula engine, chart model
  PDF  → reuses: DEFLATE, raster concepts, font concepts
         NEW: page description model, cross-reference table

WAVE 4: Software Tools (reuse algorithms heavily)
────────────────────────────────────────────────────
  Photoshop → reuses: ALL raster algorithms from PNG/JPEG/TIFF
              ALL compositing from PNG alpha
              ALL color science from various formats
              NEW: brush dynamics, history system, UI patterns
  
  FFmpeg → reuses: ALL codec algorithms from audio/video formats
           NEW: filter graph, transcoding pipeline, muxing

...and so on. Each wave reuses 40-70% of previous knowledge.
```

```
COST PROJECTION:
════════════════

Without reuse:  1,000 targets × $80 avg = $80,000
With reuse:     Wave 1: 10 targets × $80 = $800
                Wave 2: 40 targets × $50 = $2,000  (37% reuse)
                Wave 3: 100 targets × $35 = $3,500 (56% reuse)
                Wave 4: 150 targets × $25 = $3,750 (69% reuse)
                Wave 5+: 700 targets × $20 = $14,000 (75% reuse)
                ───────────────────────────────────
                Total: ~$24,050 (70% savings)
```

---

## What the Complete System Looks Like

```
┌─────────────────────────────────────────────────────────────────┐
│                    THE UNIVERSAL BLUEPRINT MACHINE               │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    GENERATION PIPELINE                     │  │
│  │                                                           │  │
│  │  Target ──► Discover ──► Extract ──► Validate ──► Store   │  │
│  │  Queue      Capabilities  Knowledge   Code        in      │  │
│  │             (Layer 1)     (Layer 2)   Runs!       Graph   │  │
│  │                           Integrate                       │  │
│  │             Dedup ◄──── (Layer 3) ────► Link              │  │
│  │             Engine                      Existing           │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  KNOWLEDGE GRAPH STORE                     │  │
│  │                                                           │  │
│  │     715,000 nodes    ·    3,000,000+ edges                │  │
│  │     6 entity types   ·    20+ relationship types          │  │
│  │     Content-addressed ·   Deduplicated ·  Versioned       │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    QUERY INTERFACES                        │  │
│  │                                                           │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐ │  │
│  │  │ AI Context  │  │  Developer   │  │  Code Generator │ │  │
│  │  │ Assembly    │  │  Search &    │  │  Template       │ │  │
│  │  │             │  │  Browse      │  │  Engine         │ │  │
│  │  │ "Give me    │  │              │  │                 │ │  │
│  │  │  everything │  │ "How does    │  │ "Generate a     │ │  │
│  │  │  an AI needs│  │  PPTX handle │  │  PPTX generator │ │  │
│  │  │  to write a │  │  animations?"│  │  project with   │ │  │
│  │  │  PNG encoder│  │              │  │  all boilerplate│ │  │
│  │  │  in Rust"   │  │              │  │  filled in"     │ │  │
│  │  └─────────────┘  └──────────────┘  └─────────────────┘ │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## The End State

When this system is complete, a developer — or an AI — can:

1. **Ask** "I want to build software that creates PowerPoint presentations with charts, animations, and custom shapes"

2. **Receive** the complete structural templates, all necessary algorithms with working code, the coordinate system reference, composition rules, and a step-by-step architecture blueprint

3. **Build** the software by assembling verified, tested components — without reading a single page of specification, without guessing at XML structures, without debugging corrupt files

4. **For any of 1,000 formats and languages**

The Universal Blueprint Machine transforms the entire world's technical knowledge about file formats and programming languages from scattered, incomplete, human-readable documentation into a **single, structured, verified, machine-readable, AI-queryable knowledge graph.**

It's not a library. It's not documentation. It's a **generative knowledge engine** — the complete set of blueprints for building anything digital.

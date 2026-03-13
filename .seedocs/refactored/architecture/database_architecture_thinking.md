---
type: architecture
source_file: "magB_Database Architecture - Opus 4.6 Thinking .md"
description: "Original project documentation refactored with an intelligence layer for automated LLM accessibility."
llm_accessibility:
  - This document contains 100% of its original source material below the '--- ORIGINAL CONTENT ---' marker.
  - Recommended usage: Use this document to understand the architecture aspects of the magB/ACE/Universal Blueprint Machine system.
---

<llm_context>
# Document Intelligence Layer
**Context:** This document is part of the refactored `.seedocs` repository, detailing the architecture, concepts, and planning for the Universal Blueprint Machine (magB) and AI Contribution Engine (ACE).
**Category:** `architecture`
**Original File:** `magB_Database Architecture - Opus 4.6 Thinking .md`
**AI Assistant Directives:** 
1. When querying this document, treat the original content as the definitive ground truth.
2. Use the provided schemas, code blocks, and diagrams directly for implementation and analysis.
3. This intelligence layer ensures context window efficiency by explicitly stating the document's boundaries and purpose.
</llm_context>

--- ORIGINAL CONTENT ---



# Designing the Knowledge Base for 1,000 Targets

## Starting From First Principles

Before touching any schema, let's think about what we're actually storing and how it will be consumed. This matters because the wrong data model means we're either duplicating knowledge a thousand times or losing the connections that make the knowledge useful.

### Observation 1: Most Knowledge Is Shared

Here's something that becomes obvious when you look at 1,000 languages side by side: they're not 1,000 independent bodies of knowledge. They're 1,000 variations on perhaps 200 underlying concepts.

```
"For Loop" exists in:

  Python:     for x in iterable:
  Rust:       for x in iterator { }
  Go:         for i := 0; i < n; i++ { }
  JavaScript: for (let i = 0; i < n; i++) { }
  C:          for (int i = 0; i < n; i++) { }
  Java:       for (int i = 0; i < n; i++) { }
  Ruby:       for x in collection do ... end
  Swift:      for x in sequence { }
  Kotlin:     for (x in collection) { }
  Haskell:    (doesn't have one — uses recursion/map)
  ...

Same concept. Different syntax. Different semantics. Different edge cases.
But the CONCEPT — "iterate over a sequence" — is universal.
```

If we store "for loop" independently for each of 1,000 languages, we're storing the same conceptual explanation 1,000 times, and worse — we can't answer questions like *"How does iteration work differently in Rust vs Go?"* without loading and comparing two independent documents.

The same applies to file formats. PPTX, DOCX, XLSX, and PPTM are all ZIP-based OPC (Open Packaging Convention) containers. They share `[Content_Types].xml`, `_rels/.rels`, the relationship system, and the packaging conventions. EPUB is also a ZIP container with similar structure. JAR, APK, and WAR are ZIP containers. PSD and PSB share 90% of their specification.

**First architectural principle: separate the universal from the specific.**

### Observation 2: Versions Are Deltas, Not Copies

Python 3.12 and Python 3.13 share roughly 98% of their content. If we store each version as a complete independent copy, we're wasting 98% of our storage and — more importantly — making it impossible to answer *"What changed between 3.12 and 3.13?"*

The same applies to file format versions. PDF 1.7 and PDF 2.0 share most of their specification. OOXML Strict and OOXML Transitional share most of theirs.

**Second architectural principle: store deltas, not copies. Version chains, not version silos.**

### Observation 3: The Primary Consumer Is an AI

This database will be queried by LLMs more often than by humans. This changes everything about how we structure data:

- **Chunk size matters.** An LLM has a context window. If a knowledge entry is 50 tokens, we're wasting context. If it's 50,000 tokens, it won't fit. Every entry needs to exist at multiple resolutions.

- **Semantic proximity matters.** When an AI retrieves knowledge, it needs related knowledge nearby. A vector embedding index is not optional — it's the primary access pattern.

- **Self-description matters.** An AI querying this database needs to understand what it's looking at without external documentation. Every table, every field, every relationship should be introspectable.

- **Compositional assembly matters.** An AI will need to assemble context from multiple entries. The data must be designed to be stitched together — with clear boundaries, no overlapping content, and explicit connection points.

**Third architectural principle: design for machine consumption first, human consumption second.**

---

## The Conceptual Architecture

Here's how I think about the entire knowledge space:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                        UNIVERSAL CONCEPT LAYER                          │
│                                                                         │
│   Concepts that exist across many languages/formats                     │
│   ─────────────────────────────────────────────────                     │
│                                                                         │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│   │Iteration │ │Condition-│ │ Function │ │  Type    │ │  Error   │    │
│   │          │ │   al     │ │          │ │  System  │ │ Handling │    │
│   └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│   │Concur-   │ │  Module  │ │  Memory  │ │  String  │ │   I/O    │    │
│   │  rency   │ │  System  │ │  Model   │ │Processing│ │          │    │
│   └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                 │
│   │  ZIP     │ │  XML     │ │ Color    │ │  Pixel   │  ~200 total     │
│   │Container │ │Structure │ │  Spaces  │ │  Formats │  concepts       │
│   └──────────┘ └──────────┘ └──────────┘ └──────────┘                 │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                          FAMILY LAYER                                   │
│                                                                         │
│   Shared traits within language/format families                         │
│   ─────────────────────────────────────────────                         │
│                                                                         │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │
│   │   C-Family      │  │  ML-Family      │  │  OPC Formats    │       │
│   │ (C,C++,C#,Java, │  │ (Haskell,OCaml, │  │ (PPTX,DOCX,    │       │
│   │  Go,Rust,Swift,  │  │  F#,Elm,        │  │  XLSX,PPTM,     │       │
│   │  Kotlin,Dart)    │  │  PureScript)    │  │  XLSM,DOTX)     │       │
│   │                 │  │                 │  │                 │       │
│   │ Shared:         │  │ Shared:         │  │ Shared:         │       │
│   │ • curly braces  │  │ • pattern match │  │ • ZIP container │       │
│   │ • semicolons    │  │ • type inference│  │ • _rels system  │       │
│   │ • C-style loops │  │ • immutability  │  │ • Content_Types │       │
│   │ • switch/match  │  │ • ADTs          │  │ • core.xml      │       │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘       │
│                                                                         │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │
│   │  Image Formats  │  │  Lisp-Family    │  │ Markup Languages│       │
│   │ (PSD,PNG,JPEG,  │  │ (CL,Scheme,    │  │ (HTML,XML,SGML, │       │
│   │  TIFF,BMP,GIF,  │  │  Clojure,Racket│  │  XAML,SVG,      │       │
│   │  WebP,AVIF)     │  │  Elisp,Hy)     │  │  MathML)        │       │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘       │
│                                                         ~50 families   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                          TARGET LAYER                                   │
│                                                                         │
│   Specific languages and formats with version chains                    │
│   ──────────────────────────────────────────────────                    │
│                                                                         │
│   Python ── 3.10 ── 3.11 ── 3.12 ── 3.13                              │
│   Rust   ── 1.75 ── 1.76 ── 1.77 ── 1.78                              │
│   PPTX   ── OOXML 1st ed ── 2nd ed ── ISO 29500:2016                  │
│   PDF    ── 1.4 ── 1.5 ── 1.6 ── 1.7 ── 2.0                          │
│                                                      ~1,000 targets    │
│                                                      ~3,000 versions   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                       IMPLEMENTATION LAYER                              │
│                                                                         │
│   Target-specific atoms, capabilities, algorithms, blueprints           │
│   ───────────────────────────────────────────────────────────           │
│                                                                         │
│                                                   ~5,000,000 entries    │
└─────────────────────────────────────────────────────────────────────────┘
```

The key insight: **knowledge flows downward through inheritance and gets more specific at each layer.** When a user queries about Python's `for` loop, the system returns:

1. The **universal concept** of iteration (what it means, why it exists, the theory)
2. The **family-level** traits (C-family iteration patterns Python partly shares)
3. The **target-specific** syntax, semantics, and edge cases for Python
4. The **version-specific** additions (like Python 3.10+ structural pattern matching that interacts with iteration)

No duplication. Complete knowledge. Fully composable.

---

## The Five Core Data Structures

After thinking about this for a while, I believe the entire knowledge base reduces to five fundamental structures. Everything else is a relationship between them.

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  1. CONCEPTS ─── Universal ideas that span targets               │
│       │                                                          │
│  2. TARGETS ──── Languages, formats, tools with version chains   │
│       │                                                          │
│  3. ENTRIES ──── Concrete knowledge at multiple resolutions      │
│       │                                                          │
│  4. RELATIONS ── How everything connects to everything else      │
│       │                                                          │
│  5. ARTIFACTS ── Code, algorithms, schemas, binary specs         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

Let me explain each one and why it exists.

### 1. Concepts — The Universal Skeleton

A **concept** is a language-agnostic or format-agnostic idea. It's the thing that would appear in a theoretical computer science textbook that doesn't mention any specific language.

```
concept:
  id:          "iteration"
  name:        "Iteration / Looping"
  domain:      "control_flow"
  
  # Multi-resolution description
  summary:     "Repeating a block of code for each element or until a condition."
  description: "Iteration is a control flow mechanism that executes a block 
                of code repeatedly. There are two fundamental forms: definite
                iteration (a known number of repetitions) and indefinite
                iteration (until a condition changes)..."
  theory:      "From a theoretical perspective, iteration is equivalent to
                tail recursion. Church's thesis shows that any iterative
                computation can be expressed recursively and vice versa..."
  
  # Taxonomy
  parent:      "control_flow"
  children:    ["definite_iteration", "indefinite_iteration", 
                "iterator_protocol", "generator_pattern",
                "comprehension_pattern", "parallel_iteration"]
  
  # Cross-cutting connections
  related:     ["recursion", "higher_order_functions", "lazy_evaluation"]
  
  # Which targets implement this concept (and how many don't)
  prevalence:  0.95  # 95% of languages have explicit iteration
  notable_absences: ["Haskell (no loop keyword — uses recursion/HOFs)"]
```

There are roughly **200-300 universal concepts** for programming languages and another **100-150** for file formats. This is the skeleton that the entire knowledge base hangs on.

Why does this matter? Because when an AI is asked to explain something about a language it hasn't seen before, it can start from the universal concept and work downward. And when a user asks *"How do all these languages handle concurrency differently?"* — the answer is already structured: one concept, many implementations.

### 2. Targets — The Things We Document

A **target** is a specific language, file format, protocol, or tool — with version awareness built in from the start.

```
target:
  id:          "python"
  name:        "Python"
  type:        "programming_language"
  
  # Family membership (inherits shared knowledge)
  families:    ["dynamic_languages", "interpreted_languages", 
                "c_family_syntax_partial", "duck_typed"]
  
  # Version chain
  versions:
    - id: "python_3.10"
      released: "2021-10-04"
      status: "end_of_life"
      
    - id: "python_3.11"  
      released: "2022-10-24"
      status: "security_fixes"
      delta_from: "python_3.10"       # ← this is key
      additions: ["exception_groups", "tomllib", "TaskGroup"]
      changes: ["faster_cpython_10_25_pct"]
      removals: []
      
    - id: "python_3.12"
      released: "2023-10-02"
      status: "active"
      delta_from: "python_3.11"
      additions: ["type_parameter_syntax", "f_string_improvements"]
      changes: ["immortal_objects", "per_interpreter_GIL"]
      removals: ["distutils"]
      
    - id: "python_3.13"
      released: "2024-10-07"
      status: "active"
      delta_from: "python_3.12"
      additions: ["free_threaded_mode", "jit_compiler"]
      
  # What makes this target distinctive
  distinguishing_features:
    - "Significant whitespace (indentation-based blocks)"
    - "Dynamic duck typing with optional type hints"
    - "GIL (Global Interpreter Lock) — changing in 3.13"
    - "Massive standard library ('batteries included')"
    - "Multiple paradigm: imperative, OOP, functional"
  
  # Classification (used to determine generation strategy)
  traits:
    typing: "dynamic"
    memory: "garbage_collected"
    paradigms: ["imperative", "object_oriented", "functional"]
    has_stdlib: true
    stdlib_size: "massive"      # determines Phase 2 effort
    compilation: "interpreted_bytecode"
    spec_formality: "reference_implementation"
```

The critical design decision here is the **delta chain**. Python 3.13's entry doesn't repeat everything from 3.12. It stores only what changed. When you need the full picture for 3.13, you walk the chain: 3.10 → apply 3.11 delta → apply 3.12 delta → apply 3.13 delta. This means:

- Adding a new version is cheap (generate only the diff)
- Storage is efficient (95% deduplication)
- *"What changed?"* queries are instant (the deltas ARE the answer)
- Full-version queries are a simple chain walk

### 3. Entries — Knowledge at Multiple Resolutions

An **entry** is one piece of knowledge. This is where the content lives. The key design feature is **multi-resolution storage** — the same knowledge exists at three levels of detail:

```
entry:
  id:          "python_for_loop"
  
  # ── Identity ──────────────────────────────────
  concept_id:  "iteration.definite"          # links to universal concept
  target_id:   "python"
  version_range: ["3.0", null]               # available since 3.0, still present
  path:        "Python/Control Flow/Iteration/for loop"
  
  # ── Multi-Resolution Content ──────────────────
  # 
  # WHY: An AI building a summary needs the micro version.
  #       An AI answering a question needs the standard version.
  #       An AI generating an implementation needs the exhaustive version.
  #       Having all three means the AI always pulls the right amount
  #       of context for its task — never too much, never too little.
  
  content:
    micro:      # ~50 tokens — for summaries and listings
      "Python's `for` loop iterates over any iterable object using 
       the iterator protocol (__iter__/__next__)."
    
    standard:   # ~500 tokens — for most queries
      "Python's `for` statement iterates over the items of any sequence
       (list, string, tuple) or any iterable object. Unlike C-family for
       loops, Python's for doesn't use an index counter — it calls
       __iter__() on the object to get an iterator, then calls __next__()
       repeatedly until StopIteration is raised.
       
       Syntax: for <target> in <iterable>:
                   <body>
               [else:
                   <else_body>]
       
       The else clause executes when the loop completes without break.
       The target can be a destructuring pattern: for x, y in pairs:
       ..."
    
    exhaustive:  # ~2000 tokens — for deep dives
      "... (everything in standard, plus)
       
       Iterator Protocol Details:
       1. for calls iter(obj), which calls obj.__iter__()
       2. On each iteration, calls next(iterator), which calls __next__()
       3. StopIteration exception terminates the loop
       4. If obj has __getitem__ but not __iter__, Python creates
          an iterator that calls __getitem__(0), __getitem__(1), etc.
       
       Edge Cases:
       - Modifying a list during iteration: undefined behavior, may skip
         elements or raise RuntimeError (dict does raise since 3.0)
       - Empty iterable: body never executes, else clause DOES execute
       - break: skips the else clause
       - continue: jumps to next iteration, doesn't affect else
       - Nested for: each has independent iterator state
       
       Performance Notes:
       - range() objects are lazy — for i in range(10**9) uses O(1) memory
       - enumerate() is preferred over manual counter
       - zip() iterates multiple iterables in parallel, stops at shortest
       ..."
  
  # ── Structured Data ───────────────────────────
  syntax:       "for <target_list> in <expression_list> : <suite>\n[else : <suite>]"
  parameters:   []
  return_value: null  # statements don't return values in Python
  
  # ── Examples (separate for composability) ─────
  example_ids:  ["ex_for_basic", "ex_for_destructure", "ex_for_else", 
                 "ex_for_enumerate", "ex_for_nested"]
  
  # ── Relationships ─────────────────────────────
  related_entry_ids: ["python_while_loop", "python_list_comprehension",
                      "python_iterator_protocol", "python_generators"]
  
  # ── AI Metadata ──────────────────────────────
  embedding_micro:     [0.023, -0.041, ...]   # 1536-dim vector
  embedding_standard:  [0.019, -0.038, ...]
  embedding_exhaustive:[0.021, -0.043, ...]
  
  token_counts:
    micro: 42
    standard: 487
    exhaustive: 2103
  
  # ── Provenance ────────────────────────────────
  generated_by:    "claude-sonnet-4-20250514"
  generated_at:    "2024-11-15T10:23:00Z"
  validated_by:    "gpt-4o"
  confidence:      0.94
  last_verified:   "2024-11-15T11:00:00Z"
  source_hints:    ["Python Language Reference §8.3", "PEP 3132"]
```

The **multi-resolution content** is the most important design decision in the entire schema. Here's why:

```
SCENARIO: AI is generating a summary of Python's control flow features

  Without multi-resolution:
    → Must load full entries for for/while/if/match/try/with
    → 6 entries × ~2000 tokens = 12,000 tokens of context consumed
    → Most of it wasted (didn't need edge cases for a summary)

  With multi-resolution:
    → Load MICRO entries for all 6
    → 6 entries × ~50 tokens = 300 tokens
    → Fast, cheap, and the AI has exactly what it needs

SCENARIO: AI is answering "What happens if I modify a dict during iteration?"

  Without multi-resolution:
    → Load the standard entry: doesn't mention this edge case
    → AI must guess or hallucinate

  With multi-resolution:
    → Semantic search finds the edge case in the EXHAUSTIVE entry
    → Load just the exhaustive version of the relevant entry
    → Precise, accurate answer
```

### 4. Relations — The Knowledge Graph

Knowledge isn't flat. It's a graph. Everything connects to everything else in multiple ways. The **relations** structure captures these connections explicitly:

```
relation_types:

  # ── Hierarchical ──────────────────────────────
  PARENT_OF          # "Control Flow" is parent of "For Loop"
  CHILD_OF           # inverse
  
  # ── Conceptual ────────────────────────────────
  IMPLEMENTS         # Python's for loop IMPLEMENTS the concept of iteration
  VARIANT_OF         # list comprehension is a VARIANT_OF iteration
  EQUIVALENT_TO      # Rust's `loop` is EQUIVALENT_TO C's `while(true)`
  OPPOSITE_OF        # `break` is OPPOSITE_OF `continue` (in purpose)
  SUPERSET_OF        # Python 3.12 is SUPERSET_OF Python 3.11 (mostly)
  
  # ── Practical ─────────────────────────────────
  REQUIRES           # async for REQUIRES understanding of async/await
  COMMONLY_USED_WITH # for loops COMMONLY_USED_WITH range()
  REPLACES           # f-strings REPLACE %-formatting (mostly)
  ALTERNATIVE_TO     # while loop is ALTERNATIVE_TO for loop
  ANTI_PATTERN_OF    # manual counter is ANTI_PATTERN_OF enumerate()
  
  # ── Implementation ───────────────────────────
  DEPENDS_ON         # "Draw Rectangle" DEPENDS_ON "Create Slide"
  COMPOSES_INTO      # Gaussian blur COMPOSES_INTO Unsharp Mask
  SHARES_ATOM_WITH   # "Add Table" SHARES_ATOM_WITH "Add Shape" (both use p:sp)
  
  # ── Cross-target ──────────────────────────────
  ANALOGOUS_IN       # Python's for...in is ANALOGOUS_IN JavaScript as for...of
  TRANSLATES_TO      # Python's list comprehension TRANSLATES_TO LINQ in C#
  INSPIRED_BY        # Rust's pattern matching INSPIRED_BY ML-family languages
  
  # ── Format-specific ──────────────────────────
  CONTAINED_IN       # slide1.xml is CONTAINED_IN the PPTX ZIP container
  REFERENCES         # slide1.xml REFERENCES chart1.xml via rId
  INHERITS_STYLE     # Slide INHERITS_STYLE from SlideLayout
```

These relations are stored as edges in a graph:

```
relation:
  id:           "rel_00001"
  source_id:    "python_for_loop"
  source_type:  "entry"
  target_id:    "python_list_comprehension"  
  target_type:  "entry"
  relation:     "COMMONLY_USED_WITH"
  strength:     0.85        # how strong is this connection
  bidirectional: true       # comprehensions also commonly used with loops
  context:      "Both iterate over sequences; comprehensions are preferred
                 for simple transformations, for loops for complex logic"
  
  # AI can discover new relations and add them
  discovered_by: "gap_analysis_phase"
  confidence:    0.91
```

The graph enables queries that flat databases can't handle:

- *"What's the fastest path from knowing Java to writing Kotlin?"* → Traverse `ANALOGOUS_IN` and `TRANSLATES_TO` edges.
- *"What do I need to implement before I can add charts to PPTX?"* → Traverse `DEPENDS_ON` edges backward.
- *"What concepts from Haskell influenced Rust?"* → Traverse `INSPIRED_BY` edges.

### 5. Artifacts — Executable Knowledge

An **artifact** is a concrete, often executable piece of knowledge: code, algorithms, file templates, binary specifications. Artifacts are separate from entries because they're large, they're reused across many entries, and they have their own versioning needs.

```
artifact_types:

  CODE_EXAMPLE       # A runnable code snippet
  ALGORITHM          # Complete algorithm with math + implementations  
  FILE_TEMPLATE      # A template for generating part of a file format
  BINARY_SPEC        # Binary layout specification
  SCHEMA             # XSD, JSON Schema, Protobuf definition
  TEST_VECTOR        # Known input→output pair for validation
  MIGRATION_GUIDE    # How to translate from one target to another
  
artifact:
  id:           "algo_gaussian_blur"
  type:         "ALGORITHM"
  
  # Which entries reference this artifact
  referenced_by: ["photoshop_gaussian_blur", "gimp_blur_filter",
                  "opencv_gaussian", "imagemagick_blur"]
  
  # Multi-target implementations
  implementations:
    python:     { code: "...", tested: true, test_vector_ids: ["tv_001"] }
    rust:       { code: "...", tested: true }
    c:          { code: "...", tested: true }
    javascript: { code: "...", tested: false }
  
  # The artifact itself can be large — stored in blob storage
  content_ref:  "s3://knowledge-base/artifacts/algo_gaussian_blur.json"
  content_hash: "sha256:a1b2c3..."
  
  # Size metadata (for context window planning)
  token_counts:
    python_impl:     340
    mathematical:    180
    full_artifact:   2800
```

---

## The Physical Schema

Now let's make this concrete. Here's how these five structures map to an actual database:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PHYSICAL ARCHITECTURE                            │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    PostgreSQL + pgvector                           │  │
│  │                                                                   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │  │
│  │  │  concepts   │  │  targets    │  │  entries    │              │  │
│  │  │  (300 rows) │  │(1000+ rows) │  │  (5M rows) │              │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘              │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │  │
│  │  │  relations  │  │  versions   │  │  artifacts  │              │  │
│  │  │  (20M rows) │  │(3000+ rows) │  │ (500K rows) │              │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘              │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │  │
│  │  │  families   │  │ embeddings  │  │  provenance │              │  │
│  │  │  (50 rows)  │  │(15M vectors)│  │ (5M rows)   │              │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘              │  │
│  │                                                                   │  │
│  │  Vector indices: HNSW on embeddings table                        │  │
│  │  Graph queries: Recursive CTEs on relations table                │  │
│  │  Full-text: tsvector indices on content fields                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    Object Storage (S3/MinIO)                      │  │
│  │                                                                   │  │
│  │  Large artifacts: algorithm implementations, binary specs,        │  │
│  │  file templates, complete blueprint code projects                 │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    Cache Layer (Redis / in-memory)                 │  │
│  │                                                                   │  │
│  │  Hot paths: common concept lookups, family trait sets,            │  │
│  │  pre-assembled context windows for frequent query patterns        │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

```sql
-- ══════════════════════════════════════════════════════════════
-- CORE TABLES
-- ══════════════════════════════════════════════════════════════

-- Universal concepts that span targets
CREATE TABLE concepts (
    id              TEXT PRIMARY KEY,           -- "iteration.definite"
    name            TEXT NOT NULL,              -- "Definite Iteration (For Loop)"
    domain          TEXT NOT NULL,              -- "control_flow"
    parent_id       TEXT REFERENCES concepts(id),
    
    -- Multi-resolution descriptions (concept-level, target-agnostic)
    summary         TEXT,                       -- ~50 tokens
    description     TEXT,                       -- ~300 tokens  
    theory          TEXT,                       -- ~1000 tokens (CS theory)
    
    prevalence      REAL DEFAULT 1.0,           -- what fraction of targets have this
    notable_absences TEXT[],                    -- targets that DON'T have this
    
    -- Embeddings for semantic search at concept level
    embedding       vector(1536),
    
    metadata        JSONB DEFAULT '{}'
);

-- Language families and format families
CREATE TABLE families (
    id              TEXT PRIMARY KEY,           -- "c_family"
    name            TEXT NOT NULL,              -- "C-Family Languages"  
    type            TEXT NOT NULL,              -- "language_family" | "format_family"
    description     TEXT,
    
    -- Shared traits that all members inherit
    shared_traits   JSONB NOT NULL DEFAULT '[]',
    -- e.g. [{"trait": "curly_brace_blocks", "description": "..."},
    --       {"trait": "semicolon_terminators", "description": "..."}]
    
    -- Shared knowledge entries (inherited by all members)
    shared_entry_ids TEXT[] DEFAULT '{}'
);

-- The actual targets we document
CREATE TABLE targets (
    id              TEXT PRIMARY KEY,           -- "python"
    name            TEXT NOT NULL,              -- "Python"
    type            TEXT NOT NULL,              -- see enum below
    -- types: programming_language, markup_language, query_language,
    --        file_format, data_format, config_format, protocol,
    --        shell, tool, vm_bytecode
    
    family_ids      TEXT[] DEFAULT '{}',        -- ["dynamic_languages", "interpreted"]
    
    -- Classification traits (drive generation strategy)
    traits          JSONB NOT NULL DEFAULT '{}',
    
    -- What makes this target unique vs its families
    distinguishing  TEXT[],
    
    -- Similar targets (for cross-reference and gap analysis)
    similar_to      TEXT[] DEFAULT '{}',
    
    -- Generation metadata
    generation_status TEXT DEFAULT 'pending',   -- pending|generating|complete|failed
    last_generated   TIMESTAMPTZ,
    
    embedding       vector(1536)
);

-- Version chains (delta-based)
CREATE TABLE target_versions (
    id              TEXT PRIMARY KEY,           -- "python_3.12"
    target_id       TEXT NOT NULL REFERENCES targets(id),
    version_string  TEXT NOT NULL,              -- "3.12"
    released        DATE,
    status          TEXT,                       -- active|maintenance|eol
    
    -- Delta chain
    delta_from      TEXT REFERENCES target_versions(id),
    additions       JSONB DEFAULT '[]',         -- new features
    changes         JSONB DEFAULT '[]',         -- modified features
    removals        JSONB DEFAULT '[]',         -- removed features
    deprecations    JSONB DEFAULT '[]',         -- newly deprecated
    
    -- Spec references
    spec_url        TEXT,
    changelog_url   TEXT,
    
    sort_order      INTEGER                     -- for ordering versions
);

-- ══════════════════════════════════════════════════════════════
-- KNOWLEDGE ENTRIES (the core content)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE entries (
    id              TEXT PRIMARY KEY,
    
    -- ── Identity ──────────────────────────────────
    concept_id      TEXT REFERENCES concepts(id),       -- universal concept link
    target_id       TEXT NOT NULL REFERENCES targets(id),
    path            TEXT NOT NULL,                       -- hierarchical path
    entry_type      TEXT NOT NULL,                       -- reference|atom|capability|algorithm
    
    -- ── Versioning ────────────────────────────────
    introduced_in   TEXT REFERENCES target_versions(id), -- when this appeared
    removed_in      TEXT REFERENCES target_versions(id), -- when this was removed (null = still present)
    changed_in      TEXT[],                              -- versions where this changed
    
    -- ── Multi-Resolution Content ──────────────────
    content_micro       TEXT,                   -- ~50 tokens: for listings
    content_standard    TEXT,                   -- ~500 tokens: for most queries
    content_exhaustive  TEXT,                   -- ~2000 tokens: for deep dives
    
    -- ── Structured Fields ─────────────────────────
    syntax              TEXT,
    parameters          JSONB DEFAULT '[]',
    return_value        TEXT,
    edge_cases          JSONB DEFAULT '[]',
    common_mistakes     JSONB DEFAULT '[]',
    
    -- ── Token Counts (pre-computed for context planning) ──
    tokens_micro        INTEGER,
    tokens_standard     INTEGER, 
    tokens_exhaustive   INTEGER,
    
    -- ── Embeddings (one per resolution) ───────────
    embedding_micro     vector(1536),
    embedding_standard  vector(1536),
    embedding_exhaustive vector(1536),
    
    -- ── Provenance ────────────────────────────────
    generated_by        TEXT,                   -- model name
    generated_at        TIMESTAMPTZ DEFAULT NOW(),
    validated_by        TEXT,
    confidence          REAL DEFAULT 0.0,       -- 0.0 to 1.0
    validation_notes    TEXT,
    
    -- ── Metadata ──────────────────────────────────
    metadata            JSONB DEFAULT '{}',
    
    UNIQUE(target_id, path)
);

-- Separate examples table (many-to-many with entries, reusable)
CREATE TABLE examples (
    id              TEXT PRIMARY KEY,
    entry_id        TEXT REFERENCES entries(id),
    
    title           TEXT NOT NULL,
    code            TEXT NOT NULL,
    language        TEXT NOT NULL,              -- syntax highlighting language
    explanation     TEXT,
    expected_output TEXT,
    
    -- Complexity classification
    complexity      TEXT DEFAULT 'basic',       -- basic|intermediate|advanced|edge_case
    
    -- Is this example valid for specific versions only?
    valid_from      TEXT REFERENCES target_versions(id),
    valid_until     TEXT REFERENCES target_versions(id),
    
    -- Reuse tracking
    also_used_by    TEXT[] DEFAULT '{}',        -- other entry IDs that reference this
    
    token_count     INTEGER,
    embedding       vector(1536)
);

-- ══════════════════════════════════════════════════════════════
-- IMPLEMENTATION LAYER
-- ══════════════════════════════════════════════════════════════

-- Format atoms: irreducible structural elements
CREATE TABLE atoms (
    id              TEXT PRIMARY KEY,
    target_id       TEXT NOT NULL REFERENCES targets(id),
    entry_id        TEXT REFERENCES entries(id),     -- links to Layer 1 entry
    
    atom_type       TEXT NOT NULL,              -- xml_element, binary_field, etc.
    
    -- Location
    file_path       TEXT,                       -- where in the format
    xpath           TEXT,                       -- for XML formats
    byte_offset     TEXT,                       -- for binary formats
    
    -- Identity
    element_name    TEXT,
    namespace_uri   TEXT,
    namespace_prefix TEXT,
    
    -- Structure (JSONB for flexibility across format types)
    structure       JSONB NOT NULL DEFAULT '{}',
    -- Contains: data_type, byte_size, endianness, encoding,
    --           attributes, valid_values, constraints
    
    -- Hierarchy
    parent_atom_id  TEXT REFERENCES atoms(id),
    
    -- Semantics
    semantic_meaning TEXT,
    unit_of_measure TEXT,
    conversion_formula TEXT,
    
    -- Example
    example_value   TEXT,
    example_context TEXT,                       -- in-situ example
    
    embedding       vector(1536),
    metadata        JSONB DEFAULT '{}'
);

-- Algorithms: complete computational procedures
CREATE TABLE algorithms (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    category        TEXT NOT NULL,              -- image_filter, compression, etc.
    domain          TEXT NOT NULL,
    
    -- Math
    formula         TEXT,                       -- LaTeX or plain
    formula_explanation TEXT,
    
    -- Multi-resolution (same pattern as entries)
    summary         TEXT,                       -- what it does in one sentence
    full_spec       TEXT,                       -- complete specification
    pseudocode      TEXT,
    
    -- Parameters
    parameters      JSONB DEFAULT '[]',
    
    -- Complexity
    time_complexity TEXT,
    space_complexity TEXT,
    
    -- Implementations stored in artifacts table
    -- (linked via relations)
    
    embedding       vector(1536),
    metadata        JSONB DEFAULT '{}'
);

-- Capabilities: user-facing features with implementation specs
CREATE TABLE capabilities (
    id              TEXT PRIMARY KEY,
    target_id       TEXT NOT NULL REFERENCES targets(id),
    name            TEXT NOT NULL,
    category        TEXT NOT NULL,
    
    user_description    TEXT,
    technical_description TEXT,
    complexity      TEXT DEFAULT 'moderate',
    
    -- Implementation (JSONB for flexibility)
    implementation_steps JSONB DEFAULT '[]',
    -- Each step: {order, description, atom_ids, algorithm_ids, 
    --             code_template, validation}
    
    -- Pre-computed complete implementations
    reference_implementations JSONB DEFAULT '{}',
    -- {python: "...", rust: "...", javascript: "..."}
    
    minimum_working_example TEXT,
    known_pitfalls  JSONB DEFAULT '[]',
    
    embedding       vector(1536),
    metadata        JSONB DEFAULT '{}'
);

-- Blueprints: composable architecture plans
CREATE TABLE blueprints (
    id              TEXT PRIMARY KEY,
    target_id       TEXT REFERENCES targets(id),
    name            TEXT NOT NULL,
    scope           TEXT NOT NULL,              -- single_feature|feature_group|full_module|full_application
    description     TEXT,
    
    -- Composition
    capability_ids  TEXT[] DEFAULT '{}',
    algorithm_ids   TEXT[] DEFAULT '{}',
    
    -- Architecture
    module_structure JSONB DEFAULT '[]',
    class_hierarchy JSONB DEFAULT '[]',
    public_api      JSONB DEFAULT '[]',
    initialization_sequence JSONB DEFAULT '[]',
    
    -- Testing
    integration_tests JSONB DEFAULT '[]',
    
    embedding       vector(1536),
    metadata        JSONB DEFAULT '{}'
);

-- ══════════════════════════════════════════════════════════════
-- RELATIONS (the knowledge graph)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE relations (
    id              BIGSERIAL PRIMARY KEY,
    
    source_id       TEXT NOT NULL,
    source_type     TEXT NOT NULL,             -- concept|entry|atom|capability|algorithm|blueprint|target
    
    target_id       TEXT NOT NULL,
    target_type     TEXT NOT NULL,
    
    relation_type   TEXT NOT NULL,             -- see relation_types enum above
    
    strength        REAL DEFAULT 1.0,          -- 0.0 to 1.0
    bidirectional   BOOLEAN DEFAULT FALSE,
    context         TEXT,                      -- why this relation exists
    
    -- Provenance
    discovered_by   TEXT,                      -- which phase/model found this
    confidence      REAL DEFAULT 1.0,
    
    metadata        JSONB DEFAULT '{}'
);

-- ══════════════════════════════════════════════════════════════
-- ARTIFACTS (large, reusable, executable knowledge)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE artifacts (
    id              TEXT PRIMARY KEY,
    type            TEXT NOT NULL,             -- code_example|algorithm_impl|file_template|
                                              --  binary_spec|schema|test_vector|migration_guide
    
    name            TEXT,
    description     TEXT,
    
    -- Content (inline for small artifacts, ref for large)
    content         TEXT,                      -- inline content if < 10KB
    content_ref     TEXT,                      -- S3/blob reference if large
    content_hash    TEXT,                      -- for integrity checking
    content_size    INTEGER,                   -- bytes
    token_count     INTEGER,
    
    -- Multi-language implementations (for code artifacts)
    implementations JSONB DEFAULT '{}',
    -- {"python": {"code": "...", "tested": true, "test_ids": [...]},
    --  "rust": {"code": "...", "tested": true}}
    
    -- Validation
    test_vector_ids TEXT[] DEFAULT '{}',
    is_tested       BOOLEAN DEFAULT FALSE,
    
    -- Linked entries (which entries reference this artifact)
    referenced_by   TEXT[] DEFAULT '{}',
    
    embedding       vector(1536),
    metadata        JSONB DEFAULT '{}'
);

-- ══════════════════════════════════════════════════════════════
-- SELF-DESCRIBING SCHEMA METADATA
-- ══════════════════════════════════════════════════════════════

-- The database describes itself — an AI querying it can understand
-- the schema without external documentation
CREATE TABLE schema_metadata (
    table_name      TEXT NOT NULL,
    column_name     TEXT,                      -- null = table-level description
    description     TEXT NOT NULL,             -- human AND AI readable
    ai_usage_hint   TEXT,                      -- how an AI should use this field
    example_query   TEXT,                      -- example SQL for common patterns
    
    PRIMARY KEY (table_name, column_name)
);

INSERT INTO schema_metadata VALUES
('concepts', NULL, 
 'Universal ideas that span multiple programming languages or file formats. ~300 rows. Use as the conceptual skeleton when explaining cross-language topics.',
 'Query concepts first to get language-agnostic understanding, then join to entries for target-specific details.',
 'SELECT c.name, c.description, e.content_standard FROM concepts c JOIN entries e ON e.concept_id = c.id WHERE c.id = ''iteration.definite'' AND e.target_id = ''python'''),
 
('entries', 'content_micro',
 'Ultra-short description (~50 tokens). Use when building summaries, tables of contents, or when listing many entries at once.',
 'Use content_micro when you need to reference many entries in a single context window. Use content_standard for answering specific questions. Use content_exhaustive only when the user asks about edge cases or needs implementation details.',
 NULL),

('entries', 'embedding_standard',
 '1536-dimensional vector embedding of content_standard. Use for semantic similarity search.',
 'For most queries, search against embedding_standard. Use embedding_exhaustive only when looking for specific edge cases or implementation details.',
 'SELECT id, path, content_standard FROM entries ORDER BY embedding_standard <=> $query_embedding LIMIT 10');

-- ══════════════════════════════════════════════════════════════
-- INDICES
-- ══════════════════════════════════════════════════════════════

-- Vector indices (HNSW for fast approximate nearest neighbor)
CREATE INDEX idx_concepts_embedding ON concepts 
    USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_entries_emb_micro ON entries 
    USING hnsw (embedding_micro vector_cosine_ops);
CREATE INDEX idx_entries_emb_standard ON entries 
    USING hnsw (embedding_standard vector_cosine_ops);
CREATE INDEX idx_entries_emb_exhaustive ON entries 
    USING hnsw (embedding_exhaustive vector_cosine_ops);
CREATE INDEX idx_atoms_embedding ON atoms 
    USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_capabilities_embedding ON capabilities 
    USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_algorithms_embedding ON algorithms 
    USING hnsw (embedding vector_cosine_ops);

-- Graph traversal indices
CREATE INDEX idx_relations_source ON relations(source_id, source_type);
CREATE INDEX idx_relations_target ON relations(target_id, target_type);
CREATE INDEX idx_relations_type ON relations(relation_type);
CREATE INDEX idx_relations_source_type ON relations(source_id, relation_type);

-- Hierarchy indices
CREATE INDEX idx_entries_target_path ON entries(target_id, path);
CREATE INDEX idx_entries_concept ON entries(concept_id);
CREATE INDEX idx_entries_target_type ON entries(target_id, entry_type);
CREATE INDEX idx_atoms_parent ON atoms(parent_atom_id);
CREATE INDEX idx_atoms_target ON atoms(target_id);
CREATE INDEX idx_versions_target ON target_versions(target_id);
CREATE INDEX idx_versions_delta ON target_versions(delta_from);

-- Full-text search
CREATE INDEX idx_entries_fts ON entries 
    USING gin(to_tsvector('english', 
        coalesce(content_micro,'') || ' ' || 
        coalesce(content_standard,'') || ' ' || 
        coalesce(path,'')));

-- JSONB indices for structured queries
CREATE INDEX idx_entries_metadata ON entries USING gin(metadata);
CREATE INDEX idx_targets_traits ON targets USING gin(traits);
```

---

## Volume Projections

```
┌──────────────────────────────────────────────────────────────────────┐
│                    DATA VOLUME AT 1,000 TARGETS                      │
├───────────────────┬──────────────┬──────────────┬────────────────────┤
│ Table             │ Row Count    │ Avg Row Size │ Total Size         │
├───────────────────┼──────────────┼──────────────┼────────────────────┤
│ concepts          │         300  │     2 KB     │          0.6 MB   │
│ families          │          50  │     1 KB     │          0.05 MB  │
│ targets           │       1,000  │     2 KB     │          2 MB     │
│ target_versions   │       3,000  │     1 KB     │          3 MB     │
│ entries           │   5,000,000  │     4 KB     │         20 GB     │
│ examples          │  10,000,000  │     1 KB     │         10 GB     │
│ atoms             │   2,000,000  │     2 KB     │          4 GB     │
│ capabilities      │     500,000  │     3 KB     │          1.5 GB   │
│ algorithms        │      50,000  │     5 KB     │          0.25 GB  │
│ blueprints        │      10,000  │    10 KB     │          0.1 GB   │
│ relations         │  20,000,000  │   0.2 KB     │          4 GB     │
│ artifacts         │     500,000  │     3 KB     │          1.5 GB   │
│ schema_metadata   │         200  │     1 KB     │          0.2 MB   │
├───────────────────┼──────────────┼──────────────┼────────────────────┤
│ SUBTOTAL (data)   │  38,000,000  │              │        ~41 GB     │
├───────────────────┼──────────────┼──────────────┼────────────────────┤
│ Embeddings        │  15,000,000  │   6 KB each  │        ~90 GB     │
│ HNSW indices      │              │              │        ~45 GB     │
│ B-tree indices    │              │              │        ~15 GB     │
│ FTS indices       │              │              │         ~8 GB     │
├───────────────────┼──────────────┼──────────────┼────────────────────┤
│ TOTAL (PostgreSQL)│              │              │       ~200 GB     │
├───────────────────┼──────────────┼──────────────┼────────────────────┤
│ Object storage    │     200,000  │   varies     │        ~50 GB     │
│ (large artifacts) │              │              │                   │
├───────────────────┼──────────────┼──────────────┼────────────────────┤
│ GRAND TOTAL       │              │              │       ~250 GB     │
└───────────────────┴──────────────┴──────────────┴────────────────────┘

Fits on a single PostgreSQL instance. 
Comfortably within a $100/month managed database.
```

---

## How the AI Queries This Database

This is where the architecture pays off. Here are the actual query patterns an AI system uses:

### Pattern 1: "Explain X in language Y"

```
STEP 1: Find the concept
─────────────────────────
SELECT id, summary, description 
FROM concepts 
WHERE embedding <=> embed('for loop iteration') < 0.3
LIMIT 1;
→ concept_id = "iteration.definite"

STEP 2: Get the target-specific entry at the right resolution
──────────────────────────────────────────────────────────────
SELECT content_standard, syntax, edge_cases
FROM entries
WHERE concept_id = 'iteration.definite' 
  AND target_id = 'python'
  AND (removed_in IS NULL);  -- still in current version
→ Complete Python for-loop documentation

STEP 3: Get examples
─────────────────────
SELECT title, code, explanation, expected_output
FROM examples
WHERE entry_id = 'python_for_loop'
ORDER BY complexity;
→ Basic → intermediate → advanced examples

TOTAL TOKENS CONSUMED: ~600 (concept summary + standard entry + 3 examples)
```

### Pattern 2: "How do I implement X in format Y?"

```
STEP 1: Semantic search for the capability
──────────────────────────────────────────
SELECT id, name, implementation_steps, reference_implementations
FROM capabilities
WHERE target_id = 'pptx'
ORDER BY embedding <=> embed('draw blue rectangle shape') 
LIMIT 3;
→ "Draw Rectangle Shape", "Apply Solid Fill", "Set Shape Position"

STEP 2: Get all dependencies (graph traversal)
──────────────────────────────────────────────
WITH RECURSIVE deps AS (
    SELECT target_id as dep_id, target_type 
    FROM relations 
    WHERE source_id IN ('cap_rect', 'cap_fill', 'cap_position')
      AND relation_type = 'REQUIRES'
    UNION ALL
    SELECT r.target_id, r.target_type
    FROM relations r
    JOIN deps d ON r.source_id = d.dep_id
    WHERE r.relation_type = 'REQUIRES'
)
SELECT * FROM deps;
→ Also need: "Create Slide", "Create Presentation Container"

STEP 3: Get the atoms for all involved capabilities
───────────────────────────────────────────────────
SELECT a.element_name, a.namespace_uri, a.structure, 
       a.semantic_meaning, a.example_context
FROM atoms a
JOIN relations r ON r.target_id = a.id
WHERE r.source_id IN (all_capability_ids)
  AND r.relation_type = 'REQUIRES';
→ All XML elements, namespaces, attribute values

STEP 4: Assemble and return
────────────────────────────
Return: ordered capabilities + atoms + coordinate formulas + code

TOTAL TOKENS: ~2000 (compact, complete, no waste)
```

### Pattern 3: "What's the difference between X and Y?"

```
-- Direct: find the same concept implemented in two targets
SELECT 
    e1.content_standard as python_version,
    e2.content_standard as rust_version
FROM entries e1
JOIN entries e2 ON e1.concept_id = e2.concept_id
WHERE e1.target_id = 'python' 
  AND e2.target_id = 'rust'
  AND e1.concept_id = 'error_handling';

-- Also get cross-target relations
SELECT context 
FROM relations 
WHERE source_id = 'python_try_except'
  AND target_id = 'rust_result_type'
  AND relation_type = 'ANALOGOUS_IN';
→ "Python uses try/except (exception-based), Rust uses Result<T,E> 
   (type-based). Both handle errors but with fundamentally different 
   approaches: Python's is implicit (any function can throw), 
   Rust's is explicit (error must be in return type)."
```

### Pattern 4: Context Window Budget Planning

```
-- AI needs to answer a complex question about Python async.
-- It has a 4096-token budget for context.

-- Step 1: Find all relevant entries
SELECT id, path, tokens_micro, tokens_standard, tokens_exhaustive
FROM entries
WHERE target_id = 'python'
  AND path LIKE 'Python/Concurrency/Async%'
ORDER BY embedding_standard <=> embed('async await event loop')
LIMIT 20;

-- Step 2: Greedily fit entries into budget
-- Start with micro for all, upgrade important ones to standard
-- 
-- 20 entries × 50 tokens (micro)   = 1,000 tokens  ← room for more
-- Upgrade top 5 to standard:
--   5 × 500 + 15 × 50              = 3,250 tokens  ← fits in budget
-- Upgrade the #1 hit to exhaustive:
--   1 × 2000 + 4 × 500 + 15 × 50  = 4,750 tokens  ← over budget
--   1 × 2000 + 3 × 500 + 16 × 50  = 4,300 tokens  ← still over
--   1 × 2000 + 2 × 500 + 17 × 50  = 3,850 tokens  ← fits!

-- The AI dynamically selects the right resolution per entry
-- to maximize information within its context window.
```

This is why multi-resolution content exists. The AI can **budget its context window** — filling it with the optimal mix of shallow and deep knowledge based on the specific question being asked.

---

## Key Design Decisions Summarized

```
┌─────┬──────────────────────────┬─────────────────────────────────────────┐
│  #  │ Decision                 │ Why                                     │
├─────┼──────────────────────────┼─────────────────────────────────────────┤
│  1  │ Universal concept layer  │ 1000 targets share ~200 concepts.       │
│     │                          │ Store the concept once, link everywhere.│
│     │                          │ Enables cross-target comparison.        │
├─────┼──────────────────────────┼─────────────────────────────────────────┤
│  2  │ Family inheritance       │ ZIP-based formats share 60% structure.  │
│     │                          │ C-family languages share syntax traits. │
│     │                          │ Generate shared knowledge once.         │
├─────┼──────────────────────────┼─────────────────────────────────────────┤
│  3  │ Delta version chains     │ Python 3.12→3.13 differs by ~2%.       │
│     │                          │ Storing full copies wastes 98%.         │
│     │                          │ Deltas make "what changed?" free.       │
├─────┼──────────────────────────┼─────────────────────────────────────────┤
│  4  │ Multi-resolution content │ AI context windows are finite.          │
│     │ (micro/standard/exhaust) │ 50 tokens for listings, 500 for Q&A,  │
│     │                          │ 2000 for deep implementation.           │
│     │                          │ AI can budget its context window.       │
├─────┼──────────────────────────┼─────────────────────────────────────────┤
│  5  │ Embeddings as first-class│ Primary access pattern is semantic      │
│     │ citizens (per resolution)│ search, not keyword lookup.             │
│     │                          │ Separate embeddings per resolution      │
│     │                          │ because micro and exhaustive have       │
│     │                          │ different semantic neighborhoods.       │
├─────┼──────────────────────────┼─────────────────────────────────────────┤
│  6  │ Relations as explicit    │ "Python's for is like Rust's for...in"  │
│     │ graph edges              │ can't be discovered from flat storage.  │
│     │                          │ Graph enables: dependency resolution,   │
│     │                          │ translation guides, learning paths.     │
├─────┼──────────────────────────┼─────────────────────────────────────────┤
│  7  │ Self-describing schema   │ An AI querying this DB should           │
│     │                          │ understand the schema without           │
│     │                          │ external documentation.                 │
│     │                          │ schema_metadata table explains every    │
│     │                          │ table and column in AI-readable form.   │
├─────┼──────────────────────────┼─────────────────────────────────────────┤
│  8  │ Pre-computed token counts│ AI must plan context window usage.      │
│     │                          │ Can't afford to count tokens at query   │
│     │                          │ time across 5M entries.                 │
├─────┼──────────────────────────┼─────────────────────────────────────────┤
│  9  │ PostgreSQL + pgvector    │ One database for structured data,       │
│     │ (not separate vector DB) │ vector search, graph queries, and       │
│     │                          │ full-text search. Transactional.        │
│     │                          │ No sync problems between systems.       │
│     │                          │ 250GB fits on a single instance.        │
├─────┼──────────────────────────┼─────────────────────────────────────────┤
│ 10  │ Provenance on everything │ Every entry knows which AI model        │
│     │                          │ generated it, when, and how confident   │
│     │                          │ the validator was. Enables targeted     │
│     │                          │ regeneration when better models arrive. │
└─────┴──────────────────────────┴─────────────────────────────────────────┘
```

---

## What This Architecture Makes Possible

Beyond the obvious query patterns, this architecture enables capabilities that a flat database never could:

**Learning path generation.** *"I know Python, teach me Rust."* The system traverses `ANALOGOUS_IN` relations between Python and Rust entries, orders them by concept complexity, and produces a personalized curriculum that maps every Python concept to its Rust equivalent.

**Universal translation.** *"Convert this Python code to Go."* The system doesn't just do syntax translation. It finds the *conceptual* operations in the Python code, looks up the Go implementations of those same concepts, and produces idiomatic Go — because the concept layer knows that Python's list comprehension maps to Go's range-based loop with append.

**Gap-aware generation.** When generating knowledge for target #847, the system already knows the universal concept tree, the family traits, and how similar targets implement the same concepts. Generation is faster (less decomposition needed) and more complete (the concept checklist already exists).

**Incremental updates.** When Python 3.14 is released, we don't regenerate the entire Python knowledge base. We generate only the delta — new features, changed behaviors — and append it to the version chain. The existing 98% of knowledge is untouched.

**Emergent cross-references.** The relation graph grows organically. Every time we generate knowledge for a new target, we discover new relations to existing targets. The graph gets richer over time, making every future query more valuable.

The database isn't just a store of facts. It's a **self-reinforcing knowledge structure** where each new target makes all existing targets more useful through the connections it reveals.

---
type: planning
source_file: "magB_MISSING ELEMENTS v0_- Opus 4.6 THINKING.md"
description: "Original project documentation refactored with an intelligence layer for automated LLM accessibility."
llm_accessibility:
  - This document contains 100% of its original source material below the '--- ORIGINAL CONTENT ---' marker.
  - Recommended usage: Use this document to understand the planning aspects of the magB/ACE/Universal Blueprint Machine system.
---

<llm_context>
# Document Intelligence Layer
**Context:** This document is part of the refactored `.seedocs` repository, detailing the architecture, concepts, and planning for the Universal Blueprint Machine (magB) and AI Contribution Engine (ACE).
**Category:** `planning`
**Original File:** `magB_MISSING ELEMENTS v0_- Opus 4.6 THINKING.md`
**AI Assistant Directives:** 
1. When querying this document, treat the original content as the definitive ground truth.
2. Use the provided schemas, code blocks, and diagrams directly for implementation and analysis.
3. This intelligence layer ensures context window efficiency by explicitly stating the document's boundaries and purpose.
</llm_context>

--- ORIGINAL CONTENT ---



# What We're Missing — Honest Assessment & Seed Plan

## Where We Actually Are

Let me be blunt about the gap between what we've designed and what we can run today:

```
WHAT WE HAVE                              WHAT WE NEED TO START
──────────────────────────────────────     ──────────────────────────────────
✅ Grand architecture vision               🔲 A single file you can run
✅ Pydantic models (V1)                    🔲 Reconciled unified schema
✅ Pydantic models (V2)                    🔲 Actual database migrations
✅ Prompt templates (V1)                   🔲 Tested, iterated prompts
✅ Prompt templates (V2)                   🔲 Prompt evaluation framework
✅ Pipeline phases described               🔲 Checkpointing and resume
✅ LLM client skeleton                     🔲 Actually tested LLM client
✅ SQLite storage (V1)                     🔲 Decision: SQLite vs Postgres for MVP
✅ PostgreSQL schema (V2)                  🔲 Embeddings infrastructure
✅ Observability concepts                  🔲 Any observability at all on day 1
✅ Cost projections                        🔲 Actual cost controls that stop spending
✅ "1000 targets" ambition                 🔲 The actual list of 1000 targets
✅ Universal concept layer idea            🔲 The seed concept taxonomy
✅ Multi-resolution content idea           🔲 Prompts that actually produce 3 resolutions
✅ Beautiful dashboard mockup              🔲 Logging that writes to a file
```

We have a cathedral blueprint. We need to pour the foundation.

---

## The Twelve Gaps

### Gap 1: No Target Registry

We say "1,000 targets" but have never defined what they are. This isn't a list you generate on the fly — it's a curated, prioritized registry that determines everything the system does.

```python
# seed/target_registry.py

"""
The canonical registry of all targets, prioritized into tiers.

Tier 1: Generate first. Highest value, most users, best for validating the system.
Tier 2: Generate after Tier 1 is validated.
Tier 3: Generate for completeness.
Tier 4: Long tail — generate on demand.

Each target includes metadata that drives the generation strategy.
"""

TARGET_REGISTRY = {

    # ══════════════════════════════════════════════════════════
    # PROGRAMMING LANGUAGES
    # ══════════════════════════════════════════════════════════

    "languages": [

        # ── TIER 1: The essential dozen ──────────────────────
        {
            "id": "python",
            "name": "Python",
            "tier": 1,
            "latest_version": "3.13",
            "version_history": ["2.7", "3.6", "3.7", "3.8", "3.9",
                                "3.10", "3.11", "3.12", "3.13"],
            "generate_versions": ["3.12", "3.13"],  # only current + latest
            "type": "programming_language",
            "families": ["dynamic", "interpreted", "gc", "multiparadigm"],
            "traits": {
                "typing": "dynamic_gradual",
                "memory": "gc",
                "stdlib_size": "massive",
                "paradigms": ["imperative", "oop", "functional"],
                "has_concurrency": True,
                "has_metaprogramming": True,
            },
            "similar_to": ["ruby", "javascript"],
            "spec_sources": [
                "https://docs.python.org/3/reference/",
                "https://docs.python.org/3/library/",
            ],
            "github_repo": "python/cpython",
            "release_feed": "https://www.python.org/downloads/",
            "estimated_entries": 1500,
            "estimated_cost_usd": 65,
        },
        {
            "id": "javascript",
            "name": "JavaScript",
            "tier": 1,
            "latest_version": "ES2024",
            "generate_versions": ["ES2024"],
            "type": "programming_language",
            "families": ["dynamic", "interpreted", "gc", "c_syntax_family"],
            "traits": {
                "typing": "dynamic",
                "memory": "gc",
                "stdlib_size": "small",  # language itself is small; ecosystem is huge
                "paradigms": ["imperative", "oop_prototypal", "functional"],
                "has_concurrency": True,  # async/await, but single-threaded
            },
            "similar_to": ["typescript", "python"],
            "spec_sources": ["https://tc39.es/ecma262/"],
            "github_repo": "nicklockwood/Expression",  # TC39 proposals
            "estimated_entries": 1200,
            "estimated_cost_usd": 55,
            "notes": "Cover language only, not DOM/Node APIs (those are separate targets)",
        },
        {
            "id": "typescript",
            "name": "TypeScript",
            "tier": 1,
            "latest_version": "5.5",
            "generate_versions": ["5.5"],
            "type": "programming_language",
            "families": ["static", "transpiled", "c_syntax_family"],
            "similar_to": ["javascript"],
            "delta_from": "javascript",  # generate as JS superset
            "estimated_entries": 800,  # delta from JS
            "estimated_cost_usd": 35,
        },
        {
            "id": "rust",
            "name": "Rust",
            "tier": 1,
            "latest_version": "1.79",
            "generate_versions": ["1.79"],
            "type": "programming_language",
            "families": ["static", "compiled", "ownership", "systems"],
            "traits": {
                "typing": "static_strong",
                "memory": "ownership",
                "stdlib_size": "medium",
                "paradigms": ["imperative", "functional", "concurrent"],
                "has_generics": True,
                "has_macros": True,
            },
            "estimated_entries": 1400,
            "estimated_cost_usd": 60,
        },
        {
            "id": "go",
            "name": "Go",
            "tier": 1,
            "latest_version": "1.22",
            "type": "programming_language",
            "families": ["static", "compiled", "gc", "c_syntax_family"],
            "estimated_entries": 1100,
            "estimated_cost_usd": 50,
        },
        {
            "id": "java",
            "name": "Java",
            "tier": 1,
            "latest_version": "21",
            "generate_versions": ["21"],
            "type": "programming_language",
            "families": ["static", "compiled_bytecode", "gc", "c_syntax_family", "oop"],
            "estimated_entries": 1800,  # massive stdlib
            "estimated_cost_usd": 80,
        },
        {
            "id": "csharp",
            "name": "C#",
            "tier": 1,
            "latest_version": "12",
            "type": "programming_language",
            "families": ["static", "compiled_bytecode", "gc", "c_syntax_family", "oop"],
            "similar_to": ["java", "typescript"],
            "estimated_entries": 1600,
            "estimated_cost_usd": 70,
        },
        {
            "id": "cpp",
            "name": "C++",
            "tier": 1,
            "latest_version": "C++23",
            "type": "programming_language",
            "families": ["static", "compiled", "manual_memory", "c_syntax_family"],
            "estimated_entries": 2000,  # huge language
            "estimated_cost_usd": 90,
        },
        {
            "id": "c",
            "name": "C",
            "tier": 1,
            "latest_version": "C23",
            "type": "programming_language",
            "families": ["static", "compiled", "manual_memory"],
            "estimated_entries": 800,
            "estimated_cost_usd": 35,
        },
        {
            "id": "swift",
            "name": "Swift",
            "tier": 1,
            "latest_version": "5.10",
            "type": "programming_language",
            "estimated_entries": 1300,
            "estimated_cost_usd": 58,
        },
        {
            "id": "kotlin",
            "name": "Kotlin",
            "tier": 1,
            "latest_version": "2.0",
            "type": "programming_language",
            "delta_from": "java",  # JVM language, share some content
            "estimated_entries": 1000,
            "estimated_cost_usd": 45,
        },
        {
            "id": "sql",
            "name": "SQL",
            "tier": 1,
            "latest_version": "SQL:2023",
            "type": "query_language",
            "estimated_entries": 600,
            "estimated_cost_usd": 28,
        },

        # ── TIER 2: Important languages (30+) ───────────────
        # Ruby, PHP, Scala, R, Dart, Elixir, Clojure, Haskell,
        # F#, Lua, Perl, Julia, Zig, Nim, OCaml, Erlang,
        # Objective-C, MATLAB, Fortran, COBOL, Ada, Pascal,
        # Shell/Bash, PowerShell, Groovy, V, Crystal, Gleam,
        # Roc, Odin, ...

        # ── TIER 3: Niche languages (50+) ───────────────────
        # Forth, Prolog, Scheme, Racket, Common Lisp, Smalltalk,
        # APL, J, K, D, Vala, Tcl, AWK, sed, ...

        # ── TIER 4: Domain-specific & historical (100+) ─────
        # VHDL, Verilog, SystemVerilog, GLSL, HLSL, WGSL,
        # Solidity, Move, Cairo, Mojo, ...
    ],

    # ══════════════════════════════════════════════════════════
    # FILE FORMATS
    # ══════════════════════════════════════════════════════════

    "file_formats": [

        # ── TIER 1: Essential formats ────────────────────────
        {
            "id": "json",
            "name": "JSON",
            "tier": 1,
            "type": "data_format",
            "families": ["text_data", "web"],
            "spec_source": "https://www.json.org/",
            "estimated_entries": 100,
            "estimated_cost_usd": 8,
        },
        {
            "id": "pptx",
            "name": "PPTX (Office Open XML Presentation)",
            "tier": 1,
            "type": "document_format",
            "families": ["ooxml", "zip_container", "xml_based"],
            "spec_source": "ISO/IEC 29500",
            "estimated_entries": 800,
            "estimated_cost_usd": 120,
            "notes": "High implementation-layer value — one of the primary use cases",
        },
        {
            "id": "docx",
            "name": "DOCX (Office Open XML Document)",
            "tier": 1,
            "type": "document_format",
            "families": ["ooxml", "zip_container", "xml_based"],
            "delta_from": "pptx",  # shares OPC layer
            "estimated_entries": 900,
            "estimated_cost_usd": 100,
        },
        {
            "id": "xlsx",
            "name": "XLSX (Office Open XML Spreadsheet)",
            "tier": 1,
            "type": "document_format",
            "families": ["ooxml", "zip_container", "xml_based"],
            "delta_from": "pptx",
            "estimated_entries": 700,
            "estimated_cost_usd": 90,
        },
        {
            "id": "pdf",
            "name": "PDF",
            "tier": 1,
            "type": "document_format",
            "families": ["binary_text_hybrid", "page_description"],
            "spec_source": "ISO 32000-2:2020",
            "estimated_entries": 1000,
            "estimated_cost_usd": 140,
        },
        {
            "id": "html",
            "name": "HTML",
            "tier": 1,
            "type": "markup_language",
            "latest_version": "Living Standard",
            "estimated_entries": 800,
            "estimated_cost_usd": 55,
        },
        {
            "id": "css",
            "name": "CSS",
            "tier": 1,
            "type": "stylesheet_language",
            "estimated_entries": 900,
            "estimated_cost_usd": 60,
        },
        {
            "id": "svg",
            "name": "SVG",
            "tier": 1,
            "type": "image_format",
            "families": ["xml_based", "vector_graphics"],
            "estimated_entries": 500,
            "estimated_cost_usd": 40,
        },
        {
            "id": "png",
            "name": "PNG",
            "tier": 1,
            "type": "image_format",
            "families": ["binary", "raster_image", "lossless"],
            "estimated_entries": 200,
            "estimated_cost_usd": 25,
        },
        {
            "id": "jpeg",
            "name": "JPEG/JFIF",
            "tier": 1,
            "type": "image_format",
            "families": ["binary", "raster_image", "lossy"],
            "estimated_entries": 250,
            "estimated_cost_usd": 30,
        },
        # yaml, toml, xml, csv, protobuf, sqlite_format,
        # zip, tar, gzip, mp4, mp3, wav, gif, webp, avif,
        # wasm, elf, pe_exe, macho, ...

        # ── TIER 2: Important formats (50+) ──────────────────
        # PSD, TIFF, BMP, WebP, AVIF, ICO, OpenEXR,
        # MP4, WebM, AVI, MKV, MOV,
        # MP3, AAC, FLAC, OGG, WAV,
        # EPUB, ODP, ODS, ODT, RTF,
        # WOFF, WOFF2, OTF, TTF,
        # GLTF, FBX, OBJ, STL, 3MF,
        # Parquet, Avro, Arrow, HDF5,
        # DICOM, FITS, NetCDF,
        # ...

        # ── TIER 3-4: Long tail ──────────────────────────────
    ],

    # ══════════════════════════════════════════════════════════
    # PROTOCOLS
    # ══════════════════════════════════════════════════════════

    "protocols": [
        {"id": "http", "name": "HTTP/1.1 + HTTP/2 + HTTP/3", "tier": 1},
        {"id": "websocket", "name": "WebSocket", "tier": 1},
        {"id": "grpc", "name": "gRPC", "tier": 2},
        {"id": "smtp", "name": "SMTP", "tier": 2},
        {"id": "dns", "name": "DNS", "tier": 2},
        {"id": "tls", "name": "TLS 1.3", "tier": 2},
        # tcp, udp, quic, mqtt, amqp, ...
    ],

    # ══════════════════════════════════════════════════════════
    # APPLICATION TOOL PROFILES (implementation-heavy targets)
    # ══════════════════════════════════════════════════════════

    "tool_profiles": [
        {
            "id": "image_editor",
            "name": "Photoshop-class Image Editor",
            "tier": 2,
            "type": "application_tool",
            "description": "Complete algorithm set for a professional image editor",
            "depends_on_formats": ["psd", "png", "jpeg", "tiff"],
            "estimated_algorithms": 120,
            "estimated_cost_usd": 200,
        },
        {
            "id": "video_editor",
            "name": "Video Editor",
            "tier": 3,
            "type": "application_tool",
            "depends_on_formats": ["mp4", "webm", "mov"],
            "estimated_algorithms": 80,
        },
        {
            "id": "3d_engine",
            "name": "3D Rendering Engine",
            "tier": 3,
            "type": "application_tool",
            "depends_on_formats": ["gltf", "obj", "fbx"],
            "estimated_algorithms": 150,
        },
    ],
}


def get_tier_1_targets() -> list[dict]:
    """Return all tier 1 targets across all categories."""
    tier_1 = []
    for category in TARGET_REGISTRY.values():
        for target in category:
            if target.get("tier") == 1:
                tier_1.append(target)
    return tier_1


def get_estimated_tier_1_cost() -> float:
    """Total estimated cost for all tier 1 targets."""
    return sum(
        t.get("estimated_cost_usd", 50)
        for t in get_tier_1_targets()
    )

# Tier 1: ~25 targets, ~$1,200 estimated cost, ~5 hours generation time
# This is our MVP scope.
```

---

### Gap 2: No Seed Concept Taxonomy

The universal concept layer can't be generated target-by-target — it needs to exist **before** we start generating any target. It's the skeleton that everything hangs on.

```python
# seed/concept_taxonomy.py

"""
The universal concept taxonomy.

This is hand-curated (not AI-generated) because it's the structural
foundation of the entire database. Getting this wrong means everything
built on top is poorly organized.

~300 concepts organized into domains.
Each concept has: id, name, domain, parent, description.
This will be seeded into the database before any generation begins.
"""

CONCEPT_TAXONOMY = {

    # ══════════════════════════════════════════════════════════
    # PROGRAMMING LANGUAGE CONCEPTS
    # ══════════════════════════════════════════════════════════

    "language": {

        "lexical": {
            "_description": "How source text is tokenized",
            "concepts": [
                ("lexical.keywords", "Keywords & Reserved Words",
                 "Words with special meaning that cannot be used as identifiers"),
                ("lexical.identifiers", "Identifiers & Naming",
                 "Rules for naming variables, functions, types, etc."),
                ("lexical.literals", "Literals",
                 "Constant values written directly in source code"),
                ("lexical.literals.numeric", "Numeric Literals",
                 "Integer, float, hex, octal, binary literal syntax"),
                ("lexical.literals.string", "String Literals",
                 "String, character, and text literal syntax"),
                ("lexical.literals.boolean", "Boolean Literals",
                 "True/false value literals"),
                ("lexical.literals.null", "Null/None/Nil Literals",
                 "Absence-of-value literals"),
                ("lexical.literals.collection", "Collection Literals",
                 "Array, list, map, set literal syntax"),
                ("lexical.comments", "Comments",
                 "Single-line, multi-line, and doc comment syntax"),
                ("lexical.operators", "Operators",
                 "Symbolic operators and their precedence"),
                ("lexical.separators", "Separators & Delimiters",
                 "Punctuation that structures code (braces, semicolons, etc.)"),
                ("lexical.whitespace", "Whitespace Significance",
                 "Whether/how whitespace affects program meaning"),
            ],
        },

        "type_system": {
            "_description": "How values are classified and constrained",
            "concepts": [
                ("types.primitive", "Primitive/Scalar Types",
                 "Built-in atomic types: integers, floats, booleans, characters"),
                ("types.primitive.integer", "Integer Types",
                 "Whole number types with various sizes and signedness"),
                ("types.primitive.float", "Floating Point Types",
                 "IEEE 754 and other decimal number representations"),
                ("types.primitive.boolean", "Boolean Type",
                 "True/false type and its operations"),
                ("types.primitive.character", "Character Type",
                 "Single character/Unicode code point type"),
                ("types.composite", "Composite/Compound Types",
                 "Types built from other types"),
                ("types.composite.array", "Arrays/Lists",
                 "Ordered, indexed collections"),
                ("types.composite.map", "Maps/Dictionaries/Hash Tables",
                 "Key-value associative collections"),
                ("types.composite.set", "Sets",
                 "Unordered collections of unique values"),
                ("types.composite.tuple", "Tuples",
                 "Fixed-size ordered heterogeneous collections"),
                ("types.composite.struct", "Structs/Records",
                 "Named field groupings"),
                ("types.composite.enum", "Enumerations",
                 "Types with a fixed set of named values"),
                ("types.composite.union", "Union/Sum Types",
                 "Types that can hold one of several alternatives"),
                ("types.string", "String Type",
                 "Text representation, encoding, operations"),
                ("types.function", "Function Types",
                 "Types that represent callable functions"),
                ("types.pointer", "Pointers/References",
                 "Types that refer to memory locations or other values"),
                ("types.generic", "Generics/Parametric Polymorphism",
                 "Types parameterized by other types"),
                ("types.algebraic", "Algebraic Data Types",
                 "Sum types + product types with pattern matching"),
                ("types.inference", "Type Inference",
                 "Automatic deduction of types by the compiler"),
                ("types.casting", "Type Conversion/Casting",
                 "Converting between types explicitly or implicitly"),
                ("types.nullable", "Nullable/Optional Types",
                 "Types that may or may not hold a value"),
                ("types.type_aliases", "Type Aliases",
                 "Creating new names for existing types"),
            ],
        },

        "control_flow": {
            "_description": "How execution order is determined",
            "concepts": [
                ("control.conditional", "Conditionals",
                 "If/else, ternary, and conditional expressions"),
                ("control.conditional.if", "If/Else Statements",
                 "Branch execution based on boolean condition"),
                ("control.conditional.switch", "Switch/Match Statements",
                 "Multi-way branching on value or pattern"),
                ("control.conditional.ternary", "Ternary/Conditional Expressions",
                 "Inline conditional value selection"),
                ("control.iteration", "Iteration/Looping",
                 "Repeating code execution"),
                ("control.iteration.for", "For Loops",
                 "Definite iteration over sequences or ranges"),
                ("control.iteration.while", "While Loops",
                 "Indefinite iteration based on condition"),
                ("control.iteration.do_while", "Do-While Loops",
                 "Body-first indefinite iteration"),
                ("control.iteration.iterator", "Iterator Protocol",
                 "The mechanism underlying for-each iteration"),
                ("control.iteration.comprehension", "Comprehensions",
                 "Declarative collection construction from iteration"),
                ("control.jump", "Jump Statements",
                 "break, continue, return, goto"),
                ("control.exceptions", "Exception Handling",
                 "try/catch/finally and throw/raise"),
                ("control.pattern_matching", "Pattern Matching",
                 "Destructuring values and branching on structure"),
            ],
        },

        "functions": {
            "_description": "Callable units of code",
            "concepts": [
                ("functions.definition", "Function Definition",
                 "Declaring and defining functions"),
                ("functions.parameters", "Parameters & Arguments",
                 "Positional, keyword, default, variadic, rest parameters"),
                ("functions.return", "Return Values",
                 "Single, multiple, and void returns"),
                ("functions.closures", "Closures/Lambdas",
                 "Anonymous functions that capture their environment"),
                ("functions.higher_order", "Higher-Order Functions",
                 "Functions that take or return functions"),
                ("functions.recursion", "Recursion",
                 "Functions that call themselves"),
                ("functions.overloading", "Function Overloading",
                 "Multiple definitions with different parameter types"),
                ("functions.generators", "Generators/Coroutines",
                 "Functions that yield values lazily"),
            ],
        },

        "oop": {
            "_description": "Object-oriented programming constructs",
            "concepts": [
                ("oop.classes", "Classes",
                 "Blueprint for creating objects"),
                ("oop.objects", "Object Instantiation",
                 "Creating instances from classes"),
                ("oop.inheritance", "Inheritance",
                 "Deriving new classes from existing ones"),
                ("oop.polymorphism", "Polymorphism",
                 "Same interface, different implementations"),
                ("oop.encapsulation", "Encapsulation/Access Control",
                 "public, private, protected visibility"),
                ("oop.interfaces", "Interfaces/Traits/Protocols",
                 "Abstract type contracts"),
                ("oop.abstract", "Abstract Classes",
                 "Partially implemented base classes"),
                ("oop.mixins", "Mixins/Multiple Inheritance",
                 "Composing behavior from multiple sources"),
                ("oop.properties", "Properties/Getters/Setters",
                 "Computed attributes with access control"),
                ("oop.operator_overloading", "Operator Overloading",
                 "Defining operator behavior for custom types"),
            ],
        },

        "memory": {
            "_description": "How memory is managed",
            "concepts": [
                ("memory.stack_heap", "Stack vs Heap Allocation", ""),
                ("memory.garbage_collection", "Garbage Collection", ""),
                ("memory.reference_counting", "Reference Counting", ""),
                ("memory.ownership", "Ownership & Borrowing", ""),
                ("memory.manual", "Manual Memory Management", ""),
                ("memory.smart_pointers", "Smart Pointers", ""),
                ("memory.lifetimes", "Lifetimes/Regions", ""),
            ],
        },

        "concurrency": {
            "_description": "Parallel and concurrent execution",
            "concepts": [
                ("concurrency.threads", "Threads", ""),
                ("concurrency.async", "Async/Await", ""),
                ("concurrency.channels", "Channels/Message Passing", ""),
                ("concurrency.mutex", "Mutexes/Locks", ""),
                ("concurrency.atomics", "Atomic Operations", ""),
                ("concurrency.actors", "Actor Model", ""),
                ("concurrency.futures", "Futures/Promises", ""),
                ("concurrency.parallel", "Parallel Iteration", ""),
            ],
        },

        "modules": {
            "_description": "Code organization and reuse",
            "concepts": [
                ("modules.import", "Import/Use/Include", ""),
                ("modules.namespaces", "Namespaces/Packages", ""),
                ("modules.visibility", "Module Visibility/Exports", ""),
                ("modules.dependency", "Dependency Management", ""),
            ],
        },

        "metaprogramming": {
            "_description": "Code that manipulates code",
            "concepts": [
                ("meta.reflection", "Reflection/Introspection", ""),
                ("meta.macros", "Macros", ""),
                ("meta.decorators", "Decorators/Attributes/Annotations", ""),
                ("meta.code_generation", "Code Generation", ""),
                ("meta.eval", "Dynamic Evaluation (eval)", ""),
            ],
        },

        "error_handling": {
            "_description": "Dealing with failures",
            "concepts": [
                ("errors.exceptions", "Exception Types & Hierarchy", ""),
                ("errors.result_types", "Result/Either Types", ""),
                ("errors.error_propagation", "Error Propagation (? operator, throws)", ""),
                ("errors.assertions", "Assertions & Debug Checks", ""),
                ("errors.panic", "Panic/Abort/Fatal Errors", ""),
            ],
        },

        "io": {
            "_description": "Input/output operations",
            "concepts": [
                ("io.file", "File I/O", ""),
                ("io.console", "Console/Terminal I/O", ""),
                ("io.network", "Network I/O", ""),
                ("io.streams", "Streams/Readers/Writers", ""),
                ("io.serialization", "Serialization/Deserialization", ""),
            ],
        },

        "stdlib": {
            "_description": "Standard library domains",
            "concepts": [
                ("stdlib.collections", "Collection Types & Algorithms", ""),
                ("stdlib.string_processing", "String Processing & Regex", ""),
                ("stdlib.math", "Math & Numeric Computing", ""),
                ("stdlib.datetime", "Date, Time & Duration", ""),
                ("stdlib.filesystem", "File System Operations", ""),
                ("stdlib.networking", "Networking", ""),
                ("stdlib.crypto", "Cryptography", ""),
                ("stdlib.testing", "Testing Framework", ""),
                ("stdlib.logging", "Logging", ""),
                ("stdlib.data_formats", "Data Format Parsing (JSON, XML, etc.)", ""),
            ],
        },

        "tooling": {
            "_description": "Development tools and ecosystem",
            "concepts": [
                ("tooling.compiler", "Compiler/Interpreter Usage", ""),
                ("tooling.package_manager", "Package Manager", ""),
                ("tooling.build_system", "Build System", ""),
                ("tooling.debugger", "Debugging", ""),
                ("tooling.linter", "Linting & Formatting", ""),
                ("tooling.repl", "REPL/Interactive Mode", ""),
            ],
        },
    },

    # ══════════════════════════════════════════════════════════
    # FILE FORMAT CONCEPTS
    # ══════════════════════════════════════════════════════════

    "format": {

        "structure": {
            "_description": "How formats are physically organized",
            "concepts": [
                ("format.container", "Container/Archive Structure", ""),
                ("format.header", "Headers & Magic Bytes", ""),
                ("format.metadata", "Metadata & Properties", ""),
                ("format.encoding", "Character/Data Encoding", ""),
                ("format.compression", "Compression", ""),
                ("format.checksums", "Checksums & Integrity", ""),
                ("format.versioning", "Format Versioning", ""),
                ("format.extensibility", "Extension Mechanisms", ""),
            ],
        },

        "document": {
            "_description": "Document format concepts",
            "concepts": [
                ("format.doc.pages", "Pages/Slides/Sheets", ""),
                ("format.doc.text", "Text Content & Formatting", ""),
                ("format.doc.styles", "Styles & Themes", ""),
                ("format.doc.images", "Embedded Images", ""),
                ("format.doc.tables", "Tables", ""),
                ("format.doc.charts", "Charts & Graphs", ""),
                ("format.doc.shapes", "Shapes & Drawing", ""),
                ("format.doc.links", "Hyperlinks & Cross-References", ""),
                ("format.doc.forms", "Form Fields", ""),
            ],
        },

        "image": {
            "_description": "Image format concepts",
            "concepts": [
                ("format.img.pixel", "Pixel Format & Color Depth", ""),
                ("format.img.color_space", "Color Spaces", ""),
                ("format.img.compression_lossy", "Lossy Compression", ""),
                ("format.img.compression_lossless", "Lossless Compression", ""),
                ("format.img.layers", "Layers & Compositing", ""),
                ("format.img.icc", "ICC Color Profiles", ""),
                ("format.img.exif", "EXIF/Metadata", ""),
                ("format.img.animation", "Animation/Multi-frame", ""),
                ("format.img.transparency", "Alpha/Transparency", ""),
            ],
        },
    },

    # ══════════════════════════════════════════════════════════
    # ALGORITHM CONCEPTS
    # ══════════════════════════════════════════════════════════

    "algorithms": {
        "image_processing": {
            "_description": "Image manipulation algorithms",
            "concepts": [
                ("algo.img.convolution", "Convolution/Kernel Filtering", ""),
                ("algo.img.blur", "Blur Algorithms", ""),
                ("algo.img.sharpen", "Sharpening Algorithms", ""),
                ("algo.img.edge_detection", "Edge Detection", ""),
                ("algo.img.morphology", "Morphological Operations", ""),
                ("algo.img.color_adjust", "Color Adjustment", ""),
                ("algo.img.histogram", "Histogram Operations", ""),
                ("algo.img.resize", "Resampling/Interpolation", ""),
                ("algo.img.transform", "Geometric Transforms", ""),
                ("algo.img.blend_modes", "Blend Modes/Compositing", ""),
                ("algo.img.selection", "Selection Algorithms", ""),
                ("algo.img.noise", "Noise Generation/Reduction", ""),
            ],
        },
        "compression": {
            "concepts": [
                ("algo.compress.deflate", "DEFLATE/zlib", ""),
                ("algo.compress.lzw", "LZW", ""),
                ("algo.compress.huffman", "Huffman Coding", ""),
                ("algo.compress.rle", "Run-Length Encoding", ""),
                ("algo.compress.dct", "Discrete Cosine Transform", ""),
            ],
        },
        "text": {
            "concepts": [
                ("algo.text.layout", "Text Layout/Shaping", ""),
                ("algo.text.unicode", "Unicode Processing", ""),
                ("algo.text.regex", "Regular Expression Engine", ""),
            ],
        },
    },
}


def flatten_concepts() -> list[dict]:
    """Flatten the taxonomy into a list of concept records for database seeding."""
    records = []

    def walk(node, domain="", parent_id=None):
        if isinstance(node, dict):
            for key, value in node.items():
                if key == "_description":
                    continue
                if key == "concepts":
                    for concept_id, name, description in value:
                        records.append({
                            "id": concept_id,
                            "name": name,
                            "domain": domain,
                            "parent_id": parent_id,
                            "description": description,
                        })
                else:
                    desc = value.get("_description", "") if isinstance(value, dict) else ""
                    # Create a domain node
                    domain_id = f"{domain}.{key}" if domain else key
                    records.append({
                        "id": domain_id,
                        "name": key.replace("_", " ").title(),
                        "domain": domain or key,
                        "parent_id": parent_id,
                        "description": desc,
                    })
                    walk(value, domain=domain or key, parent_id=domain_id)

    walk(CONCEPT_TAXONOMY)
    return records
```

---

### Gap 3: No MVP Decision — What Database to Start With

We designed a PostgreSQL+pgvector schema for scale. But for the seed project, we need to actually **start somewhere simple** and migrate up.

```python
# seed/decisions.md  (The architectural decisions we need to make NOW)
```

```markdown
# Seed Project — Key Decisions

## Decision 1: Database for MVP

**Decision: Start with SQLite + sqlite-vec, migrate to PostgreSQL when we hit limits.**

Why:
- Zero deployment friction (single file, no server)
- sqlite-vec provides vector search (not as good as pgvector, good enough)
- A developer can clone the repo and run immediately
- All our Pydantic models serialize to JSON, SQLite stores JSON natively
- We designed the schema to be table-per-concept, which maps cleanly to either

Migration trigger:
- When concurrent writes matter (multiple generation workers)
- When vector index performance degrades (>1M vectors)
- When we need graph query performance (recursive CTEs in SQLite are slow)

Estimated migration point: ~100 targets generated.

## Decision 2: Start With One Target, End-to-End

**Decision: Build and validate the complete pipeline on Python 3.12 first.**

Why:
- We all know Python — we can immediately tell if output is good or garbage
- Python has a massive stdlib — tests the "exhaustive enumeration" challenge
- Python has clear versioning — tests the delta chain
- If the pipeline works for Python (complex), it works for JSON (simple)

Success criteria before generating target #2:
- [ ] Complete topic tree with 1000+ leaf nodes
- [ ] All completeness anchors verified against docs.python.org
- [ ] 100 randomly sampled entries manually reviewed: >90% accuracy
- [ ] All three content resolutions present for every entry
- [ ] At least 50% of entries have concept links
- [ ] Gap analysis finds <5% missing coverage
- [ ] Export produces readable, useful Markdown
- [ ] Total cost under $100

## Decision 3: Prompt Iteration Before Pipeline

**Decision: Build a prompt testing harness BEFORE building the pipeline.**

Why:
- The prompts are the most important part of the system
- A bad prompt produces garbage at scale (expensive garbage)
- We need to test prompts on 20-30 examples before committing to 1500
- Prompt quality determines whether the whole project works or doesn't

## Decision 4: Embeddings Strategy

**Decision: Generate embeddings lazily, not during initial generation.**

Why:
- Embedding generation is a separate API call (OpenAI embeddings API)
- It's cheap ($0.0001 / 1K tokens) but adds complexity to the pipeline
- For MVP, we can do keyword search. Embeddings come in the enrichment phase.
- This keeps the critical path simpler

## Decision 5: Observability for MVP

**Decision: Start with structured logging + a single health check script.**

Why:
- The full observability system is beautiful but won't exist on day 1
- What we NEED on day 1: know what was generated, what failed, what it cost
- A single `health_check.py` that computes the five vital signs against the
  current database state is sufficient
- Dashboard comes after we have data to display
```

---

### Gap 4: No Prompt Testing Harness

The prompts are theoretical until we've tested them against real LLM output and iterated.

```python
# seed/prompt_lab.py

"""
Prompt testing harness.

Test each prompt template against real LLM calls with small examples,
evaluate output quality, iterate, and lock down prompts before
running the full pipeline.

Usage:
    python prompt_lab.py --test decompose_root --target "Python 3.12"
    python prompt_lab.py --test all --target "Python 3.12"
    python prompt_lab.py --compare-models --prompt decompose_root
    python prompt_lab.py --evaluate results/decompose_root_001.json
"""

import asyncio
import argparse
import json
import time
import os
from pathlib import Path
from dataclasses import dataclass, field

# Reuse our existing modules
from llm import LLMClient
from config import Config, ModelTier, LLMProvider
import prompts


@dataclass
class PromptTestResult:
    prompt_name: str
    prompt_text: str
    model: str
    target: str
    
    # Output
    raw_response: str = ""
    parsed_json: dict = field(default_factory=dict)
    parse_success: bool = False
    
    # Quality metrics
    response_time_seconds: float = 0.0
    input_tokens: int = 0
    output_tokens: int = 0
    cost_usd: float = 0.0
    
    # Evaluation (filled in manually or by evaluator)
    completeness_score: float = 0.0      # 0-1: did it list everything?
    accuracy_score: float = 0.0          # 0-1: is what it listed correct?
    structure_score: float = 0.0         # 0-1: is the JSON well-structured?
    specificity_score: float = 0.0       # 0-1: is it specific enough (not vague)?
    anti_omission_score: float = 0.0     # 0-1: no "etc." or "and more"
    
    notes: str = ""


class PromptLab:
    """Interactive prompt testing and iteration environment."""
    
    def __init__(self):
        self.llm = LLMClient(max_concurrency=5)
        self.cfg = Config()
        self.results_dir = Path("prompt_lab_results")
        self.results_dir.mkdir(exist_ok=True)
    
    # ── All testable prompts ────────────────────────────────
    
    PROMPT_TESTS = {
        "decompose_root": {
            "template": prompts.DECOMPOSE_ROOT,
            "vars": {
                "target": "{target}",
                "target_type": "programming language",
            },
            "model_tier": "decompose",
            "evaluator": "_evaluate_decompose_root",
            "description": "Generate top-level categories for a language",
        },
        "decompose_branch": {
            "template": prompts.DECOMPOSE_BRANCH,
            "vars": {
                "target": "{target}",
                "path": "{target}/Control Flow",
                "depth": 1,
                "parent_description": "All control flow constructs",
                "title": "Control Flow",
                "additional_context": "",
            },
            "model_tier": "decompose",
            "evaluator": "_evaluate_decompose_branch",
            "description": "Decompose a category into subtopics",
        },
        "enumerate_keywords": {
            "template": prompts.ENUMERATE_KEYWORDS,
            "vars": {"target": "{target}"},
            "model_tier": "decompose",
            "evaluator": "_evaluate_keywords",
            "description": "List all keywords",
            "ground_truth_checker": "_check_keywords_against_docs",
        },
        "enumerate_builtins": {
            "template": prompts.ENUMERATE_BUILTINS,
            "vars": {"target": "{target}"},
            "model_tier": "decompose",
            "evaluator": "_evaluate_builtins",
            "description": "List all builtins",
        },
        "enumerate_stdlib": {
            "template": prompts.ENUMERATE_STDLIB,
            "vars": {"target": "{target}"},
            "model_tier": "decompose",
            "evaluator": "_evaluate_stdlib",
            "description": "List all stdlib modules",
        },
        "generate_content": {
            "template": prompts.GENERATE_CONTENT,
            "vars": {
                "target": "{target}",
                "path": "{target}/Control Flow/Iteration/for loop",
                "title": "for loop",
                "description": "Definite iteration over sequences and iterables",
                "context": "Control Flow > Iteration",
                "code_lang": "python",
            },
            "model_tier": "generate",
            "evaluator": "_evaluate_content",
            "description": "Generate a full reference entry",
        },
    }
    
    async def test_prompt(
        self,
        prompt_name: str,
        target: str,
        model_override: str = None,
    ) -> PromptTestResult:
        """Test a single prompt and evaluate the result."""
        
        test_config = self.PROMPT_TESTS[prompt_name]
        
        # Build prompt
        template_vars = {
            k: v.replace("{target}", target) if isinstance(v, str) else v
            for k, v in test_config["vars"].items()
        }
        prompt_text = test_config["template"].format(**template_vars)
        
        # Select model
        tier_name = test_config["model_tier"]
        tier = getattr(self.cfg, f"{tier_name}_model")
        
        # Call LLM
        result = PromptTestResult(
            prompt_name=prompt_name,
            prompt_text=prompt_text,
            model=tier.model,
            target=target,
        )
        
        start = time.time()
        try:
            parsed = await self.llm.complete(
                prompt_text, tier, phase=f"lab_{prompt_name}"
            )
            result.parsed_json = parsed
            result.parse_success = True
        except Exception as e:
            result.notes = f"FAILED: {str(e)}"
            result.parse_success = False
        result.response_time_seconds = time.time() - start
        
        # Record token usage
        result.input_tokens = self.llm.stats.total_input_tokens
        result.output_tokens = self.llm.stats.total_output_tokens
        result.cost_usd = self.llm.stats.total_cost_usd
        
        # Auto-evaluate
        if result.parse_success:
            evaluator = getattr(self, test_config.get("evaluator", "_evaluate_generic"))
            evaluator(result, target)
        
        # Save result
        result_path = self.results_dir / f"{prompt_name}_{target.replace(' ', '_')}_{int(time.time())}.json"
        result_path.write_text(json.dumps({
            "prompt_name": result.prompt_name,
            "target": result.target,
            "model": result.model,
            "parse_success": result.parse_success,
            "response_time": result.response_time_seconds,
            "input_tokens": result.input_tokens,
            "output_tokens": result.output_tokens,
            "cost_usd": result.cost_usd,
            "completeness": result.completeness_score,
            "accuracy": result.accuracy_score,
            "structure": result.structure_score,
            "specificity": result.specificity_score,
            "anti_omission": result.anti_omission_score,
            "notes": result.notes,
            "output": result.parsed_json,
            "prompt": result.prompt_text,
        }, indent=2))
        
        return result
    
    # ── Evaluators ─────────────────────────────────────────
    
    def _evaluate_decompose_root(self, result: PromptTestResult, target: str):
        """Evaluate whether root decomposition is good."""
        data = result.parsed_json
        categories = data.get("categories", [])
        
        # Structure check
        result.structure_score = 1.0 if all(
            "title" in c and "description" in c and "estimated_subtopics" in c
            for c in categories
        ) else 0.5
        
        # Completeness: check for expected major categories
        expected = {
            "Python": ["syntax", "type", "control", "function", "class", "oop",
                       "module", "error", "exception", "concurrency", "async",
                       "standard library", "io", "iterator", "generator",
                       "decorator", "comprehension"],
        }
        target_base = target.split()[0]
        if target_base in expected:
            cat_text = " ".join(c["title"].lower() for c in categories)
            found = sum(1 for kw in expected[target_base] if kw in cat_text)
            result.completeness_score = found / len(expected[target_base])
        
        # Anti-omission check
        full_text = json.dumps(data).lower()
        omission_phrases = ["etc", "and more", "such as", "for example", "e.g."]
        omissions_found = sum(1 for phrase in omission_phrases if phrase in full_text)
        result.anti_omission_score = max(0, 1.0 - omissions_found * 0.2)
        
        # Specificity: categories should have descriptions, not just titles
        non_empty_descs = sum(1 for c in categories if len(c.get("description", "")) > 10)
        result.specificity_score = non_empty_descs / max(len(categories), 1)
        
        result.notes = (
            f"{len(categories)} categories. "
            f"Completeness: {result.completeness_score:.0%}. "
            f"Omission phrases found: {omissions_found}."
        )
    
    def _evaluate_keywords(self, result: PromptTestResult, target: str):
        """Evaluate keyword enumeration against known ground truth."""
        data = result.parsed_json
        keywords = data.get("keywords", []) + data.get("contextual_keywords", [])
        
        # Python ground truth
        PYTHON_KEYWORDS = {
            "False", "None", "True", "and", "as", "assert", "async", "await",
            "break", "class", "continue", "def", "del", "elif", "else",
            "except", "finally", "for", "from", "global", "if", "import",
            "in", "is", "lambda", "nonlocal", "not", "or", "pass", "raise",
            "return", "try", "while", "with", "yield",
        }
        
        if "python" in target.lower():
            found = set(keywords) & PYTHON_KEYWORDS
            missing = PYTHON_KEYWORDS - set(keywords)
            extra = set(keywords) - PYTHON_KEYWORDS
            
            result.completeness_score = len(found) / len(PYTHON_KEYWORDS)
            result.accuracy_score = len(found) / max(len(keywords), 1)
            result.notes = (
                f"Found {len(found)}/{len(PYTHON_KEYWORDS)} keywords. "
                f"Missing: {missing}. Extra: {extra}."
            )
    
    def _evaluate_content(self, result: PromptTestResult, target: str):
        """Evaluate a generated content entry."""
        data = result.parsed_json
        
        # Structure completeness
        required_fields = ["title", "summary", "detailed_description", "syntax", "examples"]
        present = sum(1 for f in required_fields if data.get(f))
        result.structure_score = present / len(required_fields)
        
        # Example quality
        examples = data.get("examples", [])
        result.specificity_score = min(len(examples) / 3, 1.0)  # want at least 3
        
        # Edge cases present?
        edge_cases = data.get("edge_cases", [])
        result.completeness_score = min(len(edge_cases) / 3, 1.0)
        
        result.notes = (
            f"Fields: {present}/{len(required_fields)}. "
            f"Examples: {len(examples)}. Edge cases: {len(edge_cases)}."
        )
    
    def _evaluate_generic(self, result: PromptTestResult, target: str):
        result.structure_score = 1.0 if result.parse_success else 0.0
    
    # ── Test runner ────────────────────────────────────────
    
    async def test_all(self, target: str):
        """Run all prompt tests for a target."""
        print(f"\n{'═' * 70}")
        print(f"  PROMPT LAB — Testing all prompts for: {target}")
        print(f"{'═' * 70}\n")
        
        for name, config in self.PROMPT_TESTS.items():
            print(f"  Testing: {name} — {config['description']}")
            result = await self.test_prompt(name, target)
            
            status = "✓" if result.parse_success else "✗"
            print(f"    {status} Parse: {'OK' if result.parse_success else 'FAILED'}")
            print(f"      Time: {result.response_time_seconds:.1f}s")
            print(f"      Completeness: {result.completeness_score:.0%}")
            print(f"      Structure:    {result.structure_score:.0%}")
            print(f"      Specificity:  {result.specificity_score:.0%}")
            print(f"      Anti-omission:{result.anti_omission_score:.0%}")
            print(f"      Notes: {result.notes}")
            print()
        
        print(f"Results saved to: {self.results_dir}/")


async def main():
    parser = argparse.ArgumentParser(description="Prompt Testing Lab")
    parser.add_argument("--test", type=str, default="all",
                        help="Prompt name to test, or 'all'")
    parser.add_argument("--target", type=str, default="Python 3.12",
                        help="Target to test against")
    args = parser.parse_args()
    
    lab = PromptLab()
    
    if args.test == "all":
        await lab.test_all(args.target)
    else:
        result = await lab.test_prompt(args.test, args.target)
        print(json.dumps(result.parsed_json, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
```

---

### Gap 5: No Checkpoint/Resume System

The pipeline will crash. API calls will fail. The system will be interrupted. Without checkpointing, a crash at entry 1,200 of 1,500 means starting over.

```python
# seed/checkpoint.py

"""
Checkpoint and resume system.

Every phase saves its state to the database. If the process is killed,
it can resume from the exact point of interruption.
"""

import json
import time
from dataclasses import dataclass, field
from pathlib import Path
from enum import Enum


class PhaseStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class PhaseCheckpoint:
    phase: int
    status: PhaseStatus = PhaseStatus.NOT_STARTED
    started_at: float = 0
    completed_at: float = 0
    
    # Progress tracking
    total_items: int = 0
    completed_items: int = 0
    failed_items: int = 0
    
    # For resume: which items have been processed
    processed_ids: set = field(default_factory=set)
    
    # Cost tracking for this phase
    api_calls: int = 0
    input_tokens: int = 0
    output_tokens: int = 0
    cost_usd: float = 0.0
    
    # Error log
    errors: list = field(default_factory=list)


@dataclass
class PipelineCheckpoint:
    """Complete pipeline state that can be saved and restored."""
    target: str
    run_id: str                    # unique ID for this generation run
    started_at: float = 0
    
    phases: dict[int, PhaseCheckpoint] = field(default_factory=dict)
    
    # Cross-phase data
    topic_tree_complete: bool = False
    anchors_complete: bool = False
    
    # Total aggregates
    total_api_calls: int = 0
    total_cost_usd: float = 0.0
    
    def current_phase(self) -> int:
        """Return the first incomplete phase."""
        for phase_num in sorted(self.phases.keys()):
            if self.phases[phase_num].status != PhaseStatus.COMPLETED:
                return phase_num
        return max(self.phases.keys()) + 1 if self.phases else 1
    
    def phase_items_remaining(self, phase: int) -> set:
        """Return IDs that haven't been processed in a phase."""
        if phase not in self.phases:
            return set()
        cp = self.phases[phase]
        # All items minus processed items
        # (total_items tracked separately; processed_ids is the set of done ones)
        return set()  # caller provides full set, subtracts processed_ids
    
    def save(self, path: str = None):
        """Persist checkpoint to disk."""
        if path is None:
            path = f"checkpoints/{self.target.replace(' ', '_')}_{self.run_id}.json"
        
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        
        # Convert sets to lists for JSON serialization
        data = {
            "target": self.target,
            "run_id": self.run_id,
            "started_at": self.started_at,
            "total_api_calls": self.total_api_calls,
            "total_cost_usd": self.total_cost_usd,
            "phases": {
                str(k): {
                    "phase": v.phase,
                    "status": v.status.value,
                    "started_at": v.started_at,
                    "completed_at": v.completed_at,
                    "total_items": v.total_items,
                    "completed_items": v.completed_items,
                    "failed_items": v.failed_items,
                    "processed_ids": list(v.processed_ids),
                    "api_calls": v.api_calls,
                    "cost_usd": v.cost_usd,
                    "errors": v.errors[-50],  # keep last 50 errors
                }
                for k, v in self.phases.items()
            },
        }
        
        Path(path).write_text(json.dumps(data, indent=2))
    
    @classmethod
    def load(cls, path: str) -> "PipelineCheckpoint":
        """Restore checkpoint from disk."""
        data = json.loads(Path(path).read_text())
        
        cp = cls(
            target=data["target"],
            run_id=data["run_id"],
            started_at=data["started_at"],
            total_api_calls=data.get("total_api_calls", 0),
            total_cost_usd=data.get("total_cost_usd", 0),
        )
        
        for k, v in data.get("phases", {}).items():
            phase_cp = PhaseCheckpoint(
                phase=v["phase"],
                status=PhaseStatus(v["status"]),
                started_at=v.get("started_at", 0),
                completed_at=v.get("completed_at", 0),
                total_items=v.get("total_items", 0),
                completed_items=v.get("completed_items", 0),
                failed_items=v.get("failed_items", 0),
                processed_ids=set(v.get("processed_ids", [])),
                api_calls=v.get("api_calls", 0),
                cost_usd=v.get("cost_usd", 0),
                errors=v.get("errors", []),
            )
            cp.phases[int(k)] = phase_cp
        
        return cp
    
    @classmethod
    def find_latest(cls, target: str) -> "PipelineCheckpoint | None":
        """Find the most recent checkpoint for a target."""
        checkpoint_dir = Path("checkpoints")
        if not checkpoint_dir.exists():
            return None
        
        prefix = target.replace(" ", "_")
        candidates = sorted(
            checkpoint_dir.glob(f"{prefix}_*.json"),
            key=lambda p: p.stat().st_mtime,
            reverse=True,
        )
        
        if candidates:
            return cls.load(str(candidates[0]))
        return None
```

---

### Gap 6: No Cost Controls

We project costs but have no mechanism to stop spending when something goes wrong.

```python
# seed/budget.py

"""
Budget enforcement.

Hard spending limits that cannot be overridden by the pipeline.
If the budget is exhausted, the pipeline saves its checkpoint and exits gracefully.
"""

from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class Budget:
    """Enforces spending limits at multiple levels."""
    
    # ── Hard limits (cannot be exceeded) ────────────────────
    max_total_usd: float = 500.0          # absolute maximum for entire run
    max_per_target_usd: float = 200.0     # maximum per target
    max_per_phase_usd: float = 100.0      # maximum per phase
    max_per_api_call_usd: float = 2.0     # single call sanity check
    
    # ── Warning thresholds ──────────────────────────────────
    warn_at_pct: float = 0.75             # warn at 75% of budget
    
    # ── Tracking ────────────────────────────────────────────
    total_spent: float = 0.0
    target_spent: dict[str, float] = None  # per-target spending
    phase_spent: dict[str, float] = None   # per-phase spending
    
    def __post_init__(self):
        if self.target_spent is None:
            self.target_spent = {}
        if self.phase_spent is None:
            self.phase_spent = {}
    
    def check_and_record(
        self,
        cost: float,
        target: str = "",
        phase: str = "",
    ) -> bool:
        """
        Check if a cost is within budget and record it.
        Returns True if OK, raises BudgetExhausted if not.
        """
        # Single call sanity check
        if cost > self.max_per_api_call_usd:
            raise BudgetExhausted(
                f"Single API call cost ${cost:.2f} exceeds "
                f"max ${self.max_per_api_call_usd:.2f}"
            )
        
        # Check total
        if self.total_spent + cost > self.max_total_usd:
            raise BudgetExhausted(
                f"Total budget exhausted: ${self.total_spent:.2f} + "
                f"${cost:.2f} > ${self.max_total_usd:.2f}"
            )
        
        # Check per-target
        target_total = self.target_spent.get(target, 0) + cost
        if target_total > self.max_per_target_usd:
            raise BudgetExhausted(
                f"Target '{target}' budget exhausted: ${target_total:.2f} > "
                f"${self.max_per_target_usd:.2f}"
            )
        
        # Check per-phase
        phase_key = f"{target}:{phase}"
        phase_total = self.phase_spent.get(phase_key, 0) + cost
        if phase_total > self.max_per_phase_usd:
            raise BudgetExhausted(
                f"Phase '{phase}' budget for '{target}' exhausted: "
                f"${phase_total:.2f} > ${self.max_per_phase_usd:.2f}"
            )
        
        # Record
        self.total_spent += cost
        self.target_spent[target] = target_total
        self.phase_spent[phase_key] = phase_total
        
        # Warnings
        total_pct = self.total_spent / self.max_total_usd
        if total_pct > self.warn_at_pct:
            logger.warning(
                f"⚠️  Budget warning: ${self.total_spent:.2f} / "
                f"${self.max_total_usd:.2f} ({total_pct:.0%} used)"
            )
        
        return True


class BudgetExhausted(Exception):
    """Raised when a spending limit is reached."""
    pass
```

---

### Gap 7: No Health Check Script

We need the simplest possible version of the observability system — a single script that can run against the database and tell us its health.

```python
# seed/health_check.py

"""
Minimal health check that computes the five vital signs
for the current database state.

Usage:
    python health_check.py                    # all targets
    python health_check.py --target python    # one target
"""

import asyncio
import argparse
import json
import sqlite3
from pathlib import Path


def health_check(db_path: str, target_id: str = None):
    """Compute health metrics for the database."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    
    targets = [target_id] if target_id else [
        row["target_id"] for row in
        conn.execute("SELECT DISTINCT target_id FROM entries").fetchall()
    ]
    
    results = {}
    for target in targets:
        results[target] = check_target(conn, target)
    
    # Global summary
    if results:
        global_health = {
            "targets_count": len(results),
            "avg_coverage": avg(r["coverage"] for r in results.values()),
            "avg_accuracy": avg(r["accuracy"] for r in results.values()),
            "avg_freshness": avg(r["freshness"] for r in results.values()),
            "avg_depth": avg(r["depth"] for r in results.values()),
            "avg_coherence": avg(r["coherence"] for r in results.values()),
        }
        global_health["overall"] = avg(global_health.values())
        results["__global__"] = global_health
    
    conn.close()
    return results


def check_target(conn, target_id: str) -> dict:
    """Check all five vital signs for one target."""
    
    # ── COVERAGE ────────────────────────────────────────
    # How many anchors are covered by entries?
    anchors_row = conn.execute(
        "SELECT data_json FROM completeness_anchors WHERE target = ?",
        (target_id,)
    ).fetchone()
    
    if anchors_row:
        anchors = json.loads(anchors_row["data_json"])
        all_anchor_items = (
            anchors.get("keywords", []) +
            anchors.get("builtin_functions", []) +
            anchors.get("stdlib_modules", [])
        )
        
        # Get all entry paths as text blob for matching
        entry_paths = " ".join(
            row["path"] for row in
            conn.execute("SELECT path FROM entries WHERE target_id = ?", (target_id,))
        ).lower()
        
        covered = sum(1 for item in all_anchor_items if item.lower() in entry_paths)
        coverage = covered / max(len(all_anchor_items), 1)
    else:
        coverage = 0.0  # no anchors = can't measure
    
    # ── ACCURACY ────────────────────────────────────────
    # Average confidence score of validated entries
    accuracy_row = conn.execute("""
        SELECT AVG(confidence_score), COUNT(*) 
        FROM entries 
        WHERE target_id = ? AND confidence_score > 0
    """, (target_id,)).fetchone()
    accuracy = accuracy_row[0] or 0.0
    validated_count = accuracy_row[1] or 0
    
    # ── FRESHNESS ───────────────────────────────────────
    # Based on generation time vs now
    import time
    now = time.time()
    age_rows = conn.execute("""
        SELECT generated_at FROM entries WHERE target_id = ?
    """, (target_id,)).fetchall()
    
    if age_rows:
        ages_days = [(now - row["generated_at"]) / 86400 for row in age_rows if row["generated_at"]]
        if ages_days:
            avg_age = sum(ages_days) / len(ages_days)
            # Freshness = 1.0 for just generated, decays with time
            # Half-life of ~180 days (6 months)
            import math
            freshness = math.exp(-0.693 * avg_age / 180)
        else:
            freshness = 0.0
    else:
        freshness = 0.0
    
    # ── DEPTH ───────────────────────────────────────────
    total_entries = conn.execute(
        "SELECT COUNT(*) FROM entries WHERE target_id = ?", (target_id,)
    ).fetchone()[0]
    
    # Check multi-resolution completeness
    full_resolution = conn.execute("""
        SELECT COUNT(*) FROM entries 
        WHERE target_id = ? 
          AND content_micro IS NOT NULL 
          AND content_standard IS NOT NULL 
          AND content_exhaustive IS NOT NULL
    """, (target_id,)).fetchone()[0]
    
    # Check example coverage
    with_examples = conn.execute("""
        SELECT COUNT(DISTINCT entry_id) FROM examples 
        WHERE entry_id IN (SELECT id FROM entries WHERE target_id = ?)
    """, (target_id,)).fetchone()[0]
    
    depth = (
        0.5 * (full_resolution / max(total_entries, 1)) +
        0.5 * (with_examples / max(total_entries, 1))
    )
    
    # ── COHERENCE ───────────────────────────────────────
    # Check for orphan entries (no relations)
    orphan_count = conn.execute("""
        SELECT COUNT(*) FROM entries e
        WHERE e.target_id = ?
          AND NOT EXISTS (
              SELECT 1 FROM relations r 
              WHERE r.source_id = e.id OR r.target_id = e.id
          )
    """, (target_id,)).fetchone()[0]
    
    # Check for concept links
    no_concept = conn.execute("""
        SELECT COUNT(*) FROM entries 
        WHERE target_id = ? AND concept_id IS NULL
    """, (target_id,)).fetchone()[0]
    
    coherence = 1.0 - (
        0.5 * (orphan_count / max(total_entries, 1)) +
        0.5 * (no_concept / max(total_entries, 1))
    )
    
    # ── COMPOSITE ───────────────────────────────────────
    overall = (
        0.25 * coverage +
        0.25 * accuracy +
        0.20 * freshness +
        0.15 * depth +
        0.15 * coherence
    )
    
    return {
        "coverage": round(coverage, 3),
        "accuracy": round(accuracy, 3),
        "freshness": round(freshness, 3),
        "depth": round(depth, 3),
        "coherence": round(coherence, 3),
        "overall": round(overall, 3),
        "total_entries": total_entries,
        "validated_entries": validated_count,
    }


def avg(values):
    vals = [v for v in values if isinstance(v, (int, float))]
    return round(sum(vals) / max(len(vals), 1), 3) if vals else 0.0


def print_report(results: dict):
    """Pretty-print the health report."""
    print(f"\n{'═' * 65}")
    print(f"  KNOWLEDGE BASE HEALTH CHECK")
    print(f"{'═' * 65}\n")
    
    for target, metrics in sorted(results.items()):
        if target == "__global__":
            continue
        
        def bar(val):
            filled = int(val * 20)
            return '█' * filled + '░' * (20 - filled)
        
        def indicator(val):
            if val >= 0.9: return '✓'
            if val >= 0.7: return '⚠'
            return '✗'
        
        print(f"  {target}")
        print(f"    Entries: {metrics['total_entries']}  "
              f"Validated: {metrics['validated_entries']}")
        print(f"    Coverage:   {bar(metrics['coverage'])}  "
              f"{metrics['coverage']:.0%} {indicator(metrics['coverage'])}")
        print(f"    Accuracy:   {bar(metrics['accuracy'])}  "
              f"{metrics['accuracy']:.0%} {indicator(metrics['accuracy'])}")
        print(f"    Freshness:  {bar(metrics['freshness'])}  "
              f"{metrics['freshness']:.0%} {indicator(metrics['freshness'])}")
        print(f"    Depth:      {bar(metrics['depth'])}  "
              f"{metrics['depth']:.0%} {indicator(metrics['depth'])}")
        print(f"    Coherence:  {bar(metrics['coherence'])}  "
              f"{metrics['coherence']:.0%} {indicator(metrics['coherence'])}")
        print(f"    ─────────")
        print(f"    Overall:    {bar(metrics['overall'])}  "
              f"{metrics['overall']:.0%} {indicator(metrics['overall'])}")
        print()
    
    if "__global__" in results:
        g = results["__global__"]
        print(f"{'─' * 65}")
        print(f"  GLOBAL: {g['targets_count']} targets, "
              f"overall health: {g['overall']:.0%}")
        print(f"{'═' * 65}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", default="guidebook.db")
    parser.add_argument("--target", default=None)
    args = parser.parse_args()
    
    results = health_check(args.db, args.target)
    print_report(results)
```

---

### Gap 8: No Development Roadmap

We need a concrete sequence of what to build and in what order:

```
SEED PROJECT DEVELOPMENT ROADMAP
══════════════════════════════════

PHASE α — FOUNDATION (Week 1-2)
─────────────────────────────────
Goal: Can run a single prompt, get valid output, store it, read it back.

  Day 1-2:  Project scaffold
            ├── pyproject.toml with all dependencies
            ├── .env.example for API keys
            ├── Makefile with common commands
            └── Basic logging setup

  Day 3-4:  LLM client (tested, working)
            ├── Actually call OpenAI and Anthropic APIs
            ├── JSON parsing with real error handling
            ├── Rate limiting that actually works
            ├── Cost tracking per call
            └── Write tests: test_llm_client.py

  Day 5-7:  Prompt lab (working, tested on 5+ prompts)
            ├── Test each V1 prompt against Python 3.12
            ├── Evaluate outputs using ground truth (keyword list, etc.)
            ├── Iterate on prompts until evaluation scores > 80%
            ├── Lock down prompt versions that work
            └── Document what model works best for each prompt

  Day 8-10: Storage layer (SQLite, working)
            ├── Unified schema (reconcile V1 + V2 into one)
            ├── CRUD operations for all entity types
            ├── JSON export
            ├── Markdown export
            └── Write tests: test_storage.py

  Day 11-14: Seed data
            ├── Load concept taxonomy into database
            ├── Load target registry into database
            ├── Verify data integrity
            └── Write health_check.py and run it (should show 0% everything)

  DELIVERABLE: Can manually run prompts, store results, export them.
  COST: ~$20 in API calls for prompt testing.


PHASE β — SINGLE TARGET (Week 3-4)
─────────────────────────────────────
Goal: Generate complete Python 3.12 reference (Layer 1) end-to-end.

  Day 15-17: Pipeline engine (phases 1-3)
            ├── Phase 1: Recursive decomposition → topic tree
            ├── Phase 2: Completeness anchors
            ├── Phase 3: Content generation for all leaves
            ├── Checkpoint/resume after each phase
            └── Budget enforcement

  Day 18-20: Pipeline engine (phases 4-6)
            ├── Phase 4: Gap analysis
            ├── Phase 5: Gap filling
            ├── Phase 6: Validation sampling
            └── All with checkpointing

  Day 21-23: Quality evaluation
            ├── Run full pipeline on Python 3.12
            ├── Manually review 100 random entries
            ├── Score: accuracy, completeness, usefulness
            ├── Compare keyword list against docs.python.org
            ├── Compare stdlib list against actual stdlib
            └── Identify systematic failures and fix prompts

  Day 24-28: Multi-resolution + concept linking
            ├── Generate micro/standard/exhaustive for all entries
            ├── Link entries to concept taxonomy
            ├── Generate cross-reference relations
            └── Run health_check.py → should show >80% on all metrics

  DELIVERABLE: Complete Python 3.12 reference. Exported as Markdown + JSON.
  SUCCESS METRIC: Manually reviewed and >90% accuracy.
  COST: ~$80 in API calls.


PHASE γ — SECOND TARGET + DELTAS (Week 5-6)
──────────────────────────────────────────────
Goal: Validate that the system works for a different type of target,
      and that cross-target knowledge sharing works.

  Day 29-32: Generate Rust 1.79 (different language paradigm)
            ├── Run full pipeline
            ├── Verify concept links work across languages
            ├── Compare: Rust iteration vs Python iteration entries
            └── Fix any Python-specific assumptions in the pipeline

  Day 33-35: Generate JSON format (simple file format)
            ├── Validates the format-specific pipeline path
            ├── Should be fast and cheap (~$8)
            ├── Test implementation layer (atoms for JSON are simple)
            └── This is our first Layer 2 test

  Day 36-38: Cross-target features
            ├── ANALOGOUS_IN relations between Python and Rust
            ├── Concept coverage comparison
            ├── Verify delta_from works (TypeScript from JavaScript)
            └── Health check across all three targets

  DELIVERABLE: 3 targets generated. Cross-references working.
  COST: ~$150 cumulative.


PHASE δ — IMPLEMENTATION LAYER (Week 7-8)
────────────────────────────────────────────
Goal: Generate Layer 2+3 for PPTX, validate against real file creation.

  Day 39-42: Phases 7-10 for PPTX
            ├── Capability enumeration
            ├── Atom extraction (XML elements, namespaces)
            ├── Implementation specs
            └── The real test: can generated code produce valid .pptx?

  Day 43-45: Validation by construction
            ├── Take 10 implementation specs
            ├── Actually run the generated code
            ├── Open resulting .pptx files in PowerPoint
            ├── Score: 0/10 → fundamental problem, 7+/10 → we're good
            └── Fix prompts and pipeline based on failures

  Day 46-49: Blueprint assembly
            ├── Phase 11: Create blueprints for PPTX
            ├── Use assembler to generate a complete project
            ├── Test the generated project
            └── Query engine: test "draw rectangle" queries

  DELIVERABLE: PPTX implementation layer that produces valid files.
  COST: ~$350 cumulative.


PHASE ε — SCALE TO TIER 1 (Week 9-12)
────────────────────────────────────────
Goal: Generate all ~25 Tier 1 targets.

  ├── Run pipeline on all Tier 1 languages (12)
  ├── Run pipeline on all Tier 1 file formats (12)
  ├── Run implementation layer on key formats (PPTX, DOCX, XLSX, PDF)
  ├── Set up external sensors (GitHub release monitor)
  ├── Set up immune system (basic auto-healing)
  ├── Build the health dashboard
  └── Migrate to PostgreSQL + pgvector (if needed)

  DELIVERABLE: Complete Tier 1 knowledge base.
  COST: ~$1,200 cumulative.


PHASE ζ — SCALE TO 1,000 (Month 4-6)
──────────────────────────────────────
Goal: Generate all targets. Make the system self-maintaining.

  ├── Batch-generate Tier 2 (50 targets)
  ├── Batch-generate Tier 3 (100 targets)
  ├── Set up continuous observability
  ├── Tune immune system for autonomous operation
  ├── Optimize costs (prompt caching, batching, cheap-model routing)
  └── API/service layer for external queries

  DELIVERABLE: Complete knowledge base. Self-maintaining.
  COST: ~$5,000-8,000 cumulative.
```

---

### Gaps 9-12: Summary of Remaining Items

```
GAP 9:  No unified schema
────────────────────────
We have V1 (SQLite/Pydantic) and V2 (PostgreSQL/SQL) schemas
that overlap and conflict. Need ONE set of Pydantic models
and ONE set of database tables that both pipelines use.

ACTION: Create schema_unified.py that merges schema.py + schema_v2.py,
        and db_unified.py that handles storage for all entity types.


GAP 10: No test suite
─────────────────────
Zero automated tests. For a system that generates 5 million entries
via API calls, this is dangerous.

ACTION: Create tests/ directory with:
  - test_llm_client.py     (mock API calls, test JSON parsing)
  - test_storage.py         (test CRUD for all entity types)
  - test_checkpoint.py      (test save/restore/resume)
  - test_budget.py          (test spending limits)
  - test_health_check.py    (test metric computation)
  - test_prompts.py         (test prompt template formatting)


GAP 11: No .env / configuration management
───────────────────────────────────────────
API keys, model selection, budget limits, and target selection
need proper configuration management.

ACTION: Create:
  - .env.example            (template for API keys)
  - config.yaml             (all non-secret configuration)
  - Config class that reads from both


GAP 12: No project packaging
─────────────────────────────
No pyproject.toml, no Makefile, no Docker, no README.

ACTION: Create:
  - pyproject.toml           (dependencies, entry points)
  - Makefile                 (common commands)
  - Dockerfile               (for CI/deployment)
  - README.md                (setup instructions)
  - ARCHITECTURE.md          (link to our design docs)
```

---

## The Actual Seed Repository Structure

Bringing it all together — this is what the repository should look like when we start coding:

```
guidebook-ai/
├── README.md
├── ARCHITECTURE.md           # High-level system design
├── LICENSE
├── pyproject.toml
├── Makefile
├── Dockerfile
├── .env.example
├── .gitignore
│
├── config/
│   ├── default.yaml          # All non-secret configuration
│   └── targets/              # Per-target overrides
│       ├── python.yaml
│       └── pptx.yaml
│
├── seed/                     # Bootstrap data (checked into git)
│   ├── concept_taxonomy.py   # Universal concepts (~300)
│   ├── target_registry.py    # All 1000 targets with metadata
│   ├── families.py           # Language/format family definitions
│   └── decisions.md          # Architectural decision records
│
├── src/
│   ├── __init__.py
│   ├── config.py             # Configuration loading
│   ├── schema.py             # ALL Pydantic models (unified)
│   ├── llm.py                # LLM client
│   ├── storage.py            # Database operations (unified)
│   ├── budget.py             # Cost controls
│   ├── checkpoint.py         # Save/resume
│   │
│   ├── prompts/              # All prompt templates
│   │   ├── __init__.py
│   │   ├── decompose.py
│   │   ├── enumerate.py
│   │   ├── generate.py
│   │   ├── validate.py
│   │   ├── implementation.py
│   │   └── README.md         # Prompt design principles
│   │
│   ├── pipeline/             # Generation pipeline
│   │   ├── __init__.py
│   │   ├── base.py           # Shared pipeline infrastructure
│   │   ├── reference.py      # Phases 1-6
│   │   ├── implementation.py # Phases 7-12
│   │   └── orchestrator.py   # Runs phases in order
│   │
│   ├── observability/        # Health monitoring
│   │   ├── __init__.py
│   │   ├── health_check.py   # Five vital signs
│   │   ├── sensors.py        # External event detection
│   │   └── immune.py         # Auto-healing
│   │
│   ├── query/                # User-facing query engine
│   │   ├── __init__.py
│   │   ├── engine.py
│   │   └── assembler.py
│   │
│   └── export/               # Output formatting
│       ├── __init__.py
│       ├── json_export.py
│       └── markdown_export.py
│
├── tools/                    # Developer utilities
│   ├── prompt_lab.py         # Prompt testing harness
│   ├── seed_db.py            # Initialize database with seed data
│   ├── cost_report.py        # Spending analysis
│   └── manual_review.py      # Helper for manual quality review
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py           # Shared fixtures
│   ├── test_llm_client.py
│   ├── test_storage.py
│   ├── test_checkpoint.py
│   ├── test_budget.py
│   ├── test_health_check.py
│   ├── test_prompts.py
│   └── test_pipeline_unit.py
│
├── checkpoints/              # Pipeline checkpoint files (gitignored)
├── exports/                  # Generated output (gitignored)
├── prompt_lab_results/       # Prompt test results (gitignored)
│
└── data/                     # Generated database (gitignored)
    └── guidebook.db
```

---

## First Command You Run

```bash
# Clone and setup
git clone https://github.com/you/guidebook-ai.git
cd guidebook-ai
pip install -e ".[dev]"

# Configure
cp .env.example .env
# Edit .env with your API keys

# Seed the database with concepts and target registry
python tools/seed_db.py

# Test that prompts work (costs ~$2)
python tools/prompt_lab.py --test all --target "Python 3.12"

# Review prompt test results
ls prompt_lab_results/

# If prompts look good, run the pipeline on one target
python -m src.pipeline.orchestrator --target python --budget 100

# Check health
python -m src.observability.health_check --target python

# Export
python -m src.export.markdown_export --target python --output exports/python.md
```

That's the path from design documents to running software.

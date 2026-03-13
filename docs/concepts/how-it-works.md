# ⚡ How magB Works

A guided walkthrough of how magB transforms a technology name into a complete knowledge base.

---

## The Big Picture

magB is a **knowledge refinery**. It takes unstructured knowledge (scattered across LLM training data) and transforms it into structured, verified, complete databases.

```
    "Python 3.12"               COMPLETE KNOWLEDGE BASE
         │                      ├── 1,500 reference entries
         │    ┌──────────┐      ├── 200 implementation specs
         └──▶ │  magB    │───▶  ├── 2,000+ atoms
              │ Pipeline │      ├── 50+ algorithms
              └──────────┘      ├── 10+ blueprints
                                └── 15,000+ relations
              ~8 minutes
              ~$50-80
              ~2,200 API calls
```

---

## The Four-Phase Pipeline

### Phase 1: DISCOVER
*"What can this technology do?"*

magB recursively decomposes the target into an exhaustive capability tree. Starting broad ("What are the major categories?") and drilling down until every leaf node is small enough to document completely.

```
Python 3.12
├── Type System
│   ├── Primitive Types
│   │   ├── int
│   │   ├── float
│   │   ├── complex
│   │   ├── bool
│   │   └── ...
│   ├── Collection Types
│   │   ├── list
│   │   ├── dict
│   │   ├── set
│   │   └── ...
│   └── ...
├── Control Flow
│   ├── Conditional Statements
│   │   ├── if / elif / else
│   │   ├── match / case (3.10+)
│   │   └── ...
│   └── ...
└── ... (~1,500 leaf nodes total)
```

**Key engineering decision:** The system insists on **exhaustive** enumeration at every level — never "etc." or "and more." This is what makes the output complete.

### Phase 2: EXTRACT
*"Document every single thing, completely."*

For each leaf node, magB generates a **complete reference entry** with:
- Summary (micro: ~50 tokens, standard: ~500, exhaustive: ~2000)
- Syntax and parameters
- 2-4 code examples (simple → complex)
- Edge cases and gotchas
- Common mistakes
- Cross-references to related topics

This phase runs **massively parallel** — hundreds of API calls simultaneously.

### Phase 3: VALIDATE
*"Did we miss anything? Is anything wrong?"*

This is what separates magB from naive AI generation. The system:

1. **Cross-references** the generated tree against independently-generated completeness anchors (exhaustive keyword lists, builtin lists, stdlib module lists)
2. **Identifies gaps** — topics that appear in the anchors but not in the tree
3. **Fills gaps** automatically by generating missing entries
4. **Validates accuracy** by having a *different* AI model review a sample of entries
5. **Runs generated code** to verify examples actually work

```
   TOPIC TREE                    COMPLETENESS ANCHORS
   (what we documented)          (what must exist)
   ───────────────────           ──────────────────────
   ✓ for                         ✓ for
   ✓ while                       ✓ while  
   ✓ if / elif / else            ✓ if / elif / else
   ✗ (missing!)                  • match / case     ← GAP DETECTED
   ✓ try / except                ✓ try / except
   ✗ (missing!)                  • nonlocal         ← GAP DETECTED
```

### Phase 4: INTEGRATE
*"How do these pieces combine into applications?"*

magB generates:
- **Composition rules** — what happens when features interact
- **Architecture blueprints** — complete application designs
- **Dependency graphs** — which features require which others
- **Build sequences** — ordered implementation plans with milestones

---

## Why It Works

### The knowledge already exists

LLMs have been trained on specifications, source code, tutorials, and implementations. The knowledge is there — just unstructured and scattered.

### Structured prompts force precision

Instead of asking "tell me about PNG," magB asks "list every chunk type in PNG with its exact 4-byte code, required/optional status, and field layout." Specificity forces precise output.

### Hierarchical decomposition prevents hallucination

Hundreds of small, focused questions instead of one giant question. Each answer is small enough to verify. Wrong answers are caught by cross-referencing.

### Code validation proves correctness

Generated code is actually **executed**. If it doesn't produce valid output, the system automatically asks the AI to fix it — a self-correcting loop.

### Different models for different jobs

- **Cheap, fast models** for decomposition (listing subtopics is pattern work)
- **Expensive, capable models** for content generation (requires deep knowledge)
- **A third model** for validation (different training data catches different errors)

This cuts costs by ~60% without sacrificing quality.

---

## Cost & Performance

| Target Type | Entries | API Calls | Cost | Time |
|---|---|---|---|---|
| Simple format (JSON, CSV) | ~50 | ~200 | ~$5 | ~2 min |
| Complex format (PPTX, PDF) | ~800 | ~2,800 | ~$85-165 | ~15 min |
| Programming language | ~1,500 | ~2,200 | ~$50-80 | ~8 min |
| Full portfolio (80 targets) | ~100,000 | ~200,000 | ~$4-8K | ~6 hrs |

These are **one-time generation costs**. The resulting knowledge base is permanent and free to query.

---

## Learn More

- **[The Three Layers of Knowledge](three-layers.md)** — What makes the output unique
- **[Architecture Overview](../architecture/overview.md)** — Technical system design
- **[Database Schema](../architecture/database-schema.md)** — How knowledge is stored

---

<p align="center"><em>AI already knows everything. magB helps it remember — structured, verified, and complete.</em></p>

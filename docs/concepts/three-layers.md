# 🧬 The Three Layers of Knowledge

This is the foundational concept behind everything magB does. Understanding these three layers helps you grasp why magB generates something fundamentally different from documentation.

---

## The Key Insight

Most references — even great ones — only give you **one kind** of knowledge. magB generates **three distinct layers**, each building on the previous one:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   LAYER 3: BLUEPRINTS                                       │
│   "How do I build complete systems with this?"              │
│                                                             │
│   Architecture plans, composition rules, runnable           │
│   starter implementations for real applications             │
│                                                             │
│   A developer at this layer thinks:                         │
│   "I have a roadmap. I know what to build and in what       │
│    order, and what it looks like when it's done."            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   LAYER 2: ATOMS & ALGORITHMS                               │
│   "What are the exact building blocks?"                     │
│                                                             │
│   Exact XML elements, binary fields, coordinate formulas,   │
│   complete algorithms with math and working code            │
│                                                             │
│   A developer at this layer thinks:                         │
│   "I can copy these templates, plug in values, and it       │
│    works. The code is right here."                           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   LAYER 1: CAPABILITIES                                     │
│   "What can this technology do?"                            │
│                                                             │
│   Complete feature inventory — not examples but EVERYTHING  │
│   Organized tree with dependencies mapped                   │
│                                                             │
│   A developer at this layer thinks:                         │
│   "Now I know the full scope of what I'm dealing with."     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Layer 1: Capability Knowledge

**The question it answers:** *"What is the complete list of everything this technology can do?"*

This is the **exhaustive feature inventory**. Not "here are some things you can do" but "here is **every single capability** this technology supports."

### Example: PPTX Format

Layer 1 would tell you that PPTX files support exactly 127 capabilities, organized like:

```
Shapes (23 capabilities)
├── Basic shapes (rectangle, ellipse, triangle, ...)
├── Custom geometry shapes
├── Connectors
├── Smart shapes
└── Shape operations (group, align, distribute, ...)

Text (18 capabilities)
├── Paragraphs and runs
├── Font formatting
├── Text effects
└── ...

Charts (15 capabilities)
├── Bar, line, pie, scatter, ...
└── ...

...and so on for all 127 capabilities
```

### Why This Matters

Without Layer 1, you don't know what you don't know. You might build a PowerPoint generator that handles 30% of what's possible, not realizing there's a whole world of capabilities you could support.

---

## Layer 2: Implementation Knowledge

**The question it answers:** *"For each capability, what exactly do I need to build it?"*

This is where magB becomes truly powerful. For **every** capability identified in Layer 1, Layer 2 provides:

### Structural Atoms
The exact building blocks — XML elements, binary fields, JSON keys — with every attribute, namespace, and valid value range.

```
To place a rectangle in PPTX:

Element:    <p:sp>
Contains:   <p:nvSpPr>, <p:spPr>, <p:txBody>
Position:   <a:off x="1828800" y="914400"/>  
            where x,y are in EMU (1 inch = 914400 EMU)
Geometry:   <a:prstGeom prst="rect"/>
Required:   Even empty shapes need <p:txBody> with empty <a:p>

Complete XML: [provided in full]
Working code: [provided in Python, JavaScript, Rust]
```

### Algorithms
The actual math and code — not descriptions of what an algorithm does, but the **formula, pseudocode, and working implementations.**

```
Gaussian Blur:
  Formula:    G(x,y) = (1/2πσ²) · e^(-(x²+y²)/2σ²)
  Parameters: σ (sigma): float, range 0.1–250.0
  Steps:      [1-5 detailed steps]
  Optimization: Separable filter — O(W·H·K²) → O(W·H·2K)
  Code:       [Complete Python, Rust, JavaScript implementations]
  Test Vectors: [Known input→output pairs for verification]
```

### Why This Matters

Layer 2 turns "I know what PPTX can do" into "I can build any of those capabilities right now, without reading any spec."

---

## Layer 3: Integration Knowledge

**The question it answers:** *"How do I assemble individual capabilities into working applications?"*

This is the architectural blueprint layer — the thing no documentation provides.

### Composition Rules
What happens when you combine features:

> *"If you apply a shadow AND a reflection to a shape, the shadow renders first. If you animate a grouped shape, the animation applies to the group transform, not individual shapes. Charts must appear after shapes in the spTree ordering, or PowerPoint won't render the chart overlay correctly."*

### Application Blueprints
Complete architectures for building real applications:

```
Blueprint: "Complete PPTX Shape Engine"

Composes:  47 capabilities from Layer 1
Uses:      12 algorithms from Layer 2
Structure: 5 modules, 12 classes
API:       slide.add_rectangle(x, y, w, h, fill="#0000FF")

Build Sequence:
  Phase 1: File container (valid empty .pptx)
  Phase 2: Slide creation
  Phase 3: Basic shapes (rect, ellipse)
  Phase 4: Shape styling (fills, outlines)
  Phase 5: Text engine
  Phase 6: Advanced shapes (custom geometry)
  Phase 7: Grouping and ordering
  
  Each phase produces a working demo.
```

### Why This Matters

Layer 3 is the difference between "I have all the LEGO pieces" and "I have the instruction manual for building specific things." Without it, you have knowledge but no direction.

---

## The Three Layers in Action

Here's what querying all three layers looks like in practice:

```
Query: "I want to draw shapes in a PPTX file"

LAYER 1 (Capabilities):
  "PPTX supports 23 shape capabilities:
   rectangles, ellipses, triangles, arrows, 
   custom geometry, connectors, ..."

LAYER 2 (Atoms + Algorithms):
  "To draw a rectangle:
   - Insert <p:sp> element [exact XML provided]
   - Use EMU coordinates: inches × 914400
   - Required relationships: [exact XML]
   - Working Python code: [complete function]"

LAYER 3 (Blueprints):
  "To build a complete shape engine:
   - Architecture: 5 modules, 12 classes
   - Build sequence: 7 phases, each with working demo
   - Composition rules: rendering order, grouping behavior
   - API design: slide.add_rectangle(x, y, w, h)"
```

**The developer never reads the spec. They assemble working code from verified templates, guided by proven architecture blueprints.**

---

## Multi-Resolution Content

Within each layer, magB stores knowledge at **three resolutions**, optimized for different use cases:

| Resolution | Token Count | Best For |
|---|---|---|
| **Micro** (~50 tokens) | Summaries, listings, search results |
| **Standard** (~500 tokens) | Most queries, Q&A, general reference |
| **Exhaustive** (~2000 tokens) | Deep dives, implementation work, edge cases |

This lets AI agents dynamically budget their context windows — loading micro summaries for breadth and exhaustive detail where it matters most.

---

## Learn More

- **[How the Pipeline Works](how-it-works.md)** — How magB generates all three layers
- **[Architecture Overview](../architecture/overview.md)** — The technical architecture
- **[Database Schema](../architecture/database-schema.md)** — How the layers are stored

---

<p align="center"><em>Knowledge exists in three dimensions. magB captures all of them.</em></p>

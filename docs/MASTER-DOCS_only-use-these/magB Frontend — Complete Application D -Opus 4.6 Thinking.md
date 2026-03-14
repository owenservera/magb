

# magB Frontend — Complete Application Design

## The Core Experience Philosophy

Before any wireframes or components, let's establish what this application *feels like* to use. The mental model matters more than the pixels.

Most knowledge platforms present information like a library: shelves of books, organized by category, that you pull off one at a time. That's the wrong model for us. Our data isn't a library — it's a *living organism* with layers, connections, health, and depth.

The right mental model is an **MRI machine for technology**. You pick a target (Python, PPTX, Rust), and you can see inside it at any depth — from the surface overview down through the reference layer, into the structural atoms, all the way to executable implementation blueprints. You can compare cross-sections of different targets side by side. You can see which areas are healthy and which are deteriorating.

Three principles guide every design decision:

```
PRINCIPLE 1: PROGRESSIVE DISCLOSURE
────────────────────────────────────
Never show everything at once. Start with the overview,
let the user drill deeper on demand. The multi-resolution
content model (micro → standard → exhaustive) maps directly
to the UI: summaries → details → deep dives.

PRINCIPLE 2: CONTEXT NEVER DISAPPEARS  
──────────────────────────────────────
When you're deep in a specific topic, you always know
WHERE you are (breadcrumb + tree position), what's NEARBY
(related entries, siblings), and how to get BACK (persistent
navigation). The knowledge graph is always visible as context.

PRINCIPLE 3: THE ANSWER IS THE INTERFACE
────────────────────────────────────────
Don't make users hunt through documentation. The primary
interaction is: ask what you want to do, get an actionable
answer. Search and implementation planning are first-class,
not afterthoughts.
```

---

## Information Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  magB PLATFORM — SITEMAP                                                │
│                                                                         │
│  ┌─────────────┐                                                        │
│  │   HOME      │ Search bar + featured targets + health pulse          │
│  └──────┬──────┘                                                        │
│         │                                                               │
│    ┌────┴────────────────┬───────────────────┬────────────────┐         │
│    │                     │                   │                │         │
│    ▼                     ▼                   ▼                ▼         │
│  ┌──────────┐    ┌──────────────┐    ┌────────────┐   ┌──────────┐    │
│  │ EXPLORE  │    │  IMPLEMENT   │    │  COMPARE   │   │  HEALTH  │    │
│  │          │    │              │    │            │   │          │    │
│  │ Targets  │    │ Plan Builder │    │ Side by    │   │ Vital    │    │
│  │ Concepts │    │ Capability   │   │ Side       │   │ Signs    │    │
│  │ Families │    │ Browser      │    │ Translate  │   │ Events   │    │
│  │ Graph    │    │ Algorithm    │    │ Learning   │   │ Decay    │    │
│  │          │    │ Library      │    │ Paths      │   │ Map      │    │
│  └────┬─────┘    │ Blueprint    │    │            │   │          │    │
│       │          │ Assembler    │    └────────────┘   └──────────┘    │
│       ▼          └──────────────┘                                      │
│  ┌──────────┐                                                          │
│  │  ENTRY   │  The deep-dive view for one piece of knowledge          │
│  │  VIEWER  │  Multi-resolution toggle                                │
│  │          │  Code examples with syntax highlighting                  │
│  │          │  Neighbor graph                                          │
│  │          │  Implementation atoms                                    │
│  │          │  Related entries                                         │
│  └──────────┘                                                          │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │  DEVELOPER PORTAL                                            │      │
│  │  API docs │ Playground │ Context Builder │ SDK guides         │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual Design System

```
TYPOGRAPHY
──────────
Primary:        Inter (UI, body text)
Monospace:      JetBrains Mono (code, paths, technical values)
Size scale:     12 / 14 / 16 / 20 / 24 / 32 / 48

COLOR SYSTEM
────────────
Background:     
  Primary:      #0a0a0b (near-black)
  Surface:      #141416 (cards, panels)
  Elevated:     #1c1c20 (modals, tooltips)
  Hover:        #242428

Text:           
  Primary:      #e4e4e7 (zinc-200)
  Secondary:    #a1a1aa (zinc-400)
  Muted:        #71717a (zinc-500)

Accent:
  Blue:         #3b82f6 (primary actions)
  Green:        #22c55e (healthy / success)
  Yellow:       #eab308 (warning / moderate)
  Orange:       #f97316 (degraded)
  Red:          #ef4444 (critical / error)
  Purple:       #a855f7 (implementation layer)
  Cyan:         #06b6d4 (algorithms)

Health colors (gradient):
  1.0:          #22c55e (green)
  0.8:          #84cc16 (lime)
  0.6:          #eab308 (yellow)
  0.4:          #f97316 (orange)
  0.2:          #ef4444 (red)

Language badge colors (consistent across the app):
  Python:       #3776AB
  Rust:         #CE422B
  JavaScript:   #F7DF1E (dark text)
  TypeScript:   #3178C6
  Go:           #00ADD8
  Java:         #ED8B00
  C#:           #68217A
  C++:          #00599C
  C:            #A8B9CC (dark text)
  Swift:        #FA7343
  Kotlin:       #7F52FF

SPACING
───────
Base unit: 4px
Scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96

BORDERS & RADIUS
────────────────
Border color:   #27272a (zinc-800)
Border radius:  6px (small) / 8px (medium) / 12px (large) / 16px (xl)

SHADOWS
───────
Subtle:         0 1px 2px rgba(0,0,0,0.3)
Medium:         0 4px 12px rgba(0,0,0,0.4)
Elevated:       0 8px 24px rgba(0,0,0,0.5)
```

---

## Application Shell

The persistent shell that wraps every page:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ┌─── TOP BAR ───────────────────────────────────────────────────────┐ │
│  │                                                                   │ │
│  │  ◆ magB    ┌────────────────────────────────────┐    [⚡ Pulse]   │ │
│  │            │  🔍 Search anything...              │    [📖 Docs]   │ │
│  │            └────────────────────────────────────┘    [⚙ Admin]   │ │
│  │                                                                   │ │
│  │  Explore    Implement    Compare    Health    API                  │ │
│  │  ────────                                                         │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌─── CONTENT AREA ─────────────────────────────────────────────────┐ │
│  │                                                                   │ │
│  │                                                                   │ │
│  │                    (page-specific content)                        │ │
│  │                                                                   │ │
│  │                                                                   │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌─── COMMAND PALETTE (⌘K) ─────────────────────────────────────────┐ │
│  │  (hidden until triggered — overlays everything)                   │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

The **command palette** (⌘K) is a power-user feature. It's the fastest way to navigate:

```
┌──────────────────────────────────────────────────┐
│  🔍  python for loop                              │
│──────────────────────────────────────────────────│
│                                                    │
│  ENTRIES                                           │
│  → Python / Control Flow / Iteration / for loop    │
│  → Python / Control Flow / Iteration / while loop  │
│  → Rust / Control Flow / Iteration / for loop      │
│                                                    │
│  CONCEPTS                                          │
│  → iteration.for — Definite Iteration              │
│                                                    │
│  ACTIONS                                           │
│  → Compare "for loop" across languages             │
│  → Implement "for loop" in Python                  │
│  → Show health for Python entries                  │
│                                                    │
│  TARGETS                                           │
│  → Python 3.13 — programming language              │
│                                                    │
└──────────────────────────────────────────────────┘
```

---

## Page Designs

### HOME PAGE

The home page serves two audiences: newcomers who need to understand what this is, and returning users who need fast access to search and their recent targets.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                                                                         │
│                         ◆ magB                                          │
│                                                                         │
│              The Universal Implementation                               │
│                   Knowledge Base                                        │
│                                                                         │
│         Every language. Every format. Every algorithm.                   │
│         From reference to working code.                                 │
│                                                                         │
│    ┌──────────────────────────────────────────────────────────┐         │
│    │  🔍  How do I add shapes to a PPTX file?                 │         │
│    │                                                          │         │
│    │  Try: "gaussian blur algorithm"  "rust error handling"   │         │
│    │       "compare async in Python vs Go"                    │         │
│    └──────────────────────────────────────────────────────────┘         │
│                                                                         │
│                                                                         │
│  ── EXPLORE TARGETS ──────────────────────────────────────────────────  │
│                                                                         │
│  Languages                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ 🐍       │ │  ⚙️      │ │  🦀      │ │  ☕      │ │  🔷      │    │
│  │ Python   │ │ JavaScript│ │  Rust    │ │  Java   │ │ TypeScript│    │
│  │ 1,487    │ │ 1,204    │ │ 1,398   │ │ 1,812   │ │  802     │    │
│  │ entries  │ │ entries  │ │ entries  │ │ entries  │ │ entries  │    │
│  │          │ │          │ │          │ │          │ │          │    │
│  │ ████████ │ │ ███████░ │ │ ████████ │ │ ███████░ │ │ ██████░░ │    │
│  │ 95% ✓    │ │ 88% ✓   │ │ 97% ✓   │ │ 91% ✓   │ │ 82% ⚠   │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│                                         [View all 200+ languages →]     │
│                                                                         │
│  File Formats                                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ 📊       │ │ 📄       │ │ 📋       │ │ 🖼️       │ │ 📐       │    │
│  │ PPTX     │ │ PDF      │ │ DOCX     │ │ PNG      │ │ SVG      │    │
│  │ 812      │ │ 1,003    │ │ 894     │ │ 203     │ │ 487      │    │
│  │ entries  │ │ entries  │ │ entries  │ │ entries  │ │ entries  │    │
│  │ impl ✓   │ │ impl ✓  │ │ impl ✓  │ │ impl ✓  │ │ impl ✓   │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│                                         [View all 300+ formats →]       │
│                                                                         │
│                                                                         │
│  ── KNOWLEDGE PULSE ──────────────────────────────────────────────────  │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                                                                │    │
│  │  5.2M entries    38M relations    250K capabilities            │    │
│  │  50K algorithms  10K blueprints   1,000 targets                │    │
│  │                                                                │    │
│  │  Overall Health: ████████████████████░░  91.2%                 │    │
│  │                                                                │    │
│  │  Recent events:                                                │    │
│  │  🟢 Rust 1.79 knowledge updated (2 hours ago)                 │    │
│  │  🟡 Python 3.13 — 12 entries regenerated (5 hours ago)        │    │
│  │  🟢 PPTX implementation layer validated (1 day ago)           │    │
│  │                                                                │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│                                                                         │
│  ── HOW IT WORKS ─────────────────────────────────────────────────────  │
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │
│  │                 │  │                 │  │                 │        │
│  │  📚 REFERENCE   │  │  🧱 ATOMS       │  │  🏗️ BLUEPRINTS  │        │
│  │                 │  │                 │  │                 │        │
│  │  What does it   │  │  Exact XML,     │  │  Complete       │        │
│  │  do? Syntax,    │  │  binary fields, │  │  architecture   │        │
│  │  semantics,     │  │  enum values,   │  │  plans with     │        │
│  │  examples.      │  │  namespaces.    │  │  working code.  │        │
│  │                 │  │                 │  │                 │        │
│  │  1,500 entries  │  │  2,000 atoms    │  │  12 blueprints  │        │
│  │  per language   │  │  per format     │  │  per target     │        │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### EXPLORE: Target Detail Page

When you click on a target (e.g., Python), you get its complete profile:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Explore  >  Languages  >  Python                                       │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                 │   │
│  │  🐍  Python 3.13                                                │   │
│  │                                                                 │   │
│  │  Dynamic, interpreted, multi-paradigm programming language.      │   │
│  │  "Batteries included" with massive standard library.            │   │
│  │                                                                 │   │
│  │  Families: dynamic  interpreted  gc  multiparadigm             │   │
│  │  Similar:  Ruby  JavaScript  Lua                                │   │
│  │                                                                 │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐      │   │
│  │  │  1,487    │ │  4,213    │ │  203      │ │  45       │      │   │
│  │  │  entries  │ │  examples │ │  caps     │ │  algos    │      │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘      │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─── HEALTH ────┐  ┌─── TABS ────────────────────────────────────┐   │
│  │               │  │                                             │   │
│  │  Coverage 95% │  │  [Topic Tree]  Concepts  Capabilities       │   │
│  │  ████████████ │  │   Algorithms   Blueprints  Versions         │   │
│  │               │  │                                             │   │
│  │  Accuracy 96% │  ├─────────────────────────────────────────────┤   │
│  │  ████████████ │  │                                             │   │
│  │               │  │  🔍 Filter topics...                        │   │
│  │  Fresh   62%  │  │                                             │   │
│  │  █████████░░░ │  │  ▼ Lexical Structure              35 entries│   │
│  │  ⚠️ 3.13      │  │    ├─ Keywords                     35 items │   │
│  │               │  │    ├─ Identifiers & Naming                  │   │
│  │  Depth   82%  │  │    ├─ Literals                              │   │
│  │  ███████████░ │  │    │  ├─ Numeric Literals                   │   │
│  │               │  │    │  ├─ String Literals                    │   │
│  │  Cohere  95%  │  │    │  ├─ F-Strings                 NEW 3.12│   │
│  │  ████████████ │  │    │  └─ Boolean & None                     │   │
│  │               │  │    ├─ Operators                    38 items │   │
│  │  ─────────    │  │    └─ Comments & Docstrings                 │   │
│  │  Overall 86%  │  │                                             │   │
│  │               │  │  ▼ Type System                     67 entries│   │
│  │  Last checked │  │    ├─ Primitive Types                        │   │
│  │  2 hours ago  │  │    │  ├─ int                                │   │
│  │               │  │    │  ├─ float                              │   │
│  └───────────────┘  │    │  ├─ bool                               │   │
│                      │    │  ├─ str                                │   │
│                      │    │  └─ bytes                              │   │
│                      │    ├─ Collection Types                      │   │
│                      │    │  ├─ list                               │   │
│                      │    │  ├─ dict                               │   │
│                      │    │  ├─ set                                │   │
│                      │    │  └─ tuple                              │   │
│                      │    ├─ Type Hints                            │   │
│                      │    │  ├─ Basic Annotations                  │   │
│                      │    │  ├─ Generic Types                      │   │
│                      │    │  ├─ Protocol                           │   │
│                      │    │  └─ TypeVar (3.12 syntax)     NEW     │   │
│                      │    └─ Type Conversion                       │   │
│                      │                                             │   │
│                      │  ▶ Control Flow                   45 entries│   │
│                      │  ▶ Functions & Closures            32 entries│   │
│                      │  ▶ Classes & OOP                  48 entries│   │
│                      │  ▶ Error Handling                 18 entries│   │
│                      │  ▶ Concurrency & Async            28 entries│   │
│                      │  ▶ Module System                  15 entries│   │
│                      │  ▶ Standard Library              218 modules│   │
│                      │  ▶ Metaprogramming                22 entries│   │
│                      │  ▶ I/O                            19 entries│   │
│                      │  ▶ Tooling                        12 entries│   │
│                      │                                             │   │
│                      └─────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### ENTRY VIEWER

The most important page. This is where users spend most of their time. It shows one knowledge entry with full depth controls.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Python  >  Control Flow  >  Iteration  >  for loop                     │
│                                                                         │
│  ┌─── MAIN CONTENT ─────────────────────────┐  ┌─── SIDEBAR ────────┐ │
│  │                                           │  │                    │ │
│  │  for loop                                 │  │  IN THIS ENTRY     │ │
│  │  ═══════                                  │  │  ──────────────    │ │
│  │                                           │  │  Overview          │ │
│  │  Resolution: [Micro] [Standard] [Exhaust] │  │  Syntax            │ │
│  │                          ▲ selected       │  │  Examples          │ │
│  │                                           │  │  Edge Cases        │ │
│  │  Universal concept: iteration.for         │  │  Common Mistakes   │ │
│  │  Confidence: 96%  Freshness: 91%          │  │                    │ │
│  │  Since: Python 1.0  Current: ✓            │  │  RELATED           │ │
│  │                                           │  │  ──────────────    │ │
│  │  ─────────────────────────────────────    │  │  → while loop      │ │
│  │                                           │  │  → list comprehens │ │
│  │  Python's `for` statement iterates over   │  │  → iterator protoc │ │
│  │  the items of any sequence (list, string, │  │  → generators      │ │
│  │  tuple) or any iterable object. Unlike    │  │  → enumerate()     │ │
│  │  C-family for loops, Python's for doesn't │  │  → zip()           │ │
│  │  use an index counter — it calls          │  │  → range()         │ │
│  │  `__iter__()` on the object to get an     │  │                    │ │
│  │  iterator, then calls `__next__()`        │  │  SAME IN OTHER     │ │
│  │  repeatedly until `StopIteration`.        │  │  LANGUAGES         │ │
│  │                                           │  │  ──────────────    │ │
│  │                                           │  │  Rust   for..in    │ │
│  │  Syntax                                   │  │  Go     for range  │ │
│  │  ──────                                   │  │  JS     for..of    │ │
│  │  ┌───────────────────────────────────┐    │  │  Java   for-each   │ │
│  │  │ for <target> in <iterable>:      │    │  │  Ruby   each       │ │
│  │  │     <body>                        │    │  │                    │ │
│  │  │ [else:                            │    │  │  DEPTH LAYERS      │ │
│  │  │     <else_body>]                  │    │  │  ──────────────    │ │
│  │  └───────────────────────────────────┘    │  │  📚 Reference  ✓  │ │
│  │                                           │  │  🧱 Atoms      –  │ │
│  │                                           │  │  🏗️ Implement  –  │ │
│  │  Examples                                 │  │                    │ │
│  │  ────────                                 │  │  HEALTH            │ │
│  │                                           │  │  ──────────────    │ │
│  │  ┌─ Basic Iteration ─────────────────┐    │  │  Coverage  ████ ✓ │ │
│  │  │                                   │    │  │  Accuracy  ████ ✓ │ │
│  │  │  fruits = ["apple", "banana",     │    │  │  Fresh     ███░ ⚠ │ │
│  │  │           "cherry"]               │    │  │  Depth     ██░░   │ │
│  │  │  for fruit in fruits:             │    │  │  Coherence ████ ✓ │ │
│  │  │      print(fruit)                 │    │  │                    │ │
│  │  │                                   │    │  │  Last validated    │ │
│  │  │  # Output:                        │    │  │  14 days ago      │ │
│  │  │  # apple                          │    │  │  by gpt-4o        │ │
│  │  │  # banana                         │    │  │                    │ │
│  │  │  # cherry                         │    │  └────────────────────┘ │
│  │  │                                   │    │                         │
│  │  └───────────────────────────────────┘    │                         │
│  │                                           │                         │
│  │  ┌─ Destructuring ──────────────────┐    │                         │
│  │  │                                   │    │                         │
│  │  │  pairs = [(1, "a"), (2, "b")]     │    │                         │
│  │  │  for num, letter in pairs:        │    │                         │
│  │  │      print(f"{num}: {letter}")    │    │                         │
│  │  │                                   │    │                         │
│  │  │  # Output:                        │    │                         │
│  │  │  # 1: a                           │    │                         │
│  │  │  # 2: b                           │    │                         │
│  │  │                                   │    │                         │
│  │  └───────────────────────────────────┘    │                         │
│  │                                           │                         │
│  │  ┌─ The else Clause ────────────────┐    │                         │
│  │  │                                   │    │                         │
│  │  │  for n in range(2, 10):           │    │                         │
│  │  │      for x in range(2, n):        │    │                         │
│  │  │          if n % x == 0:           │    │                         │
│  │  │              break                │    │                         │
│  │  │      else:                        │    │                         │
│  │  │          # Runs if loop completed │    │                         │
│  │  │          # without break          │    │                         │
│  │  │          print(f"{n} is prime")   │    │                         │
│  │  │                                   │    │                         │
│  │  └───────────────────────────────────┘    │                         │
│  │                                           │                         │
│  │                                           │                         │
│  │  Edge Cases                               │                         │
│  │  ──────────                               │                         │
│  │  ⚠️  Modifying a list during iteration:   │                         │
│  │     undefined behavior. May skip elements │                         │
│  │     or raise RuntimeError (dict does      │                         │
│  │     raise since Python 3.0).              │                         │
│  │                                           │                         │
│  │  ⚠️  Empty iterable: body never executes, │                         │
│  │     but else clause DOES execute.         │                         │
│  │                                           │                         │
│  │  ⚠️  break skips the else clause.         │                         │
│  │     continue does NOT skip else.          │                         │
│  │                                           │                         │
│  │                                           │                         │
│  │  Common Mistakes                          │                         │
│  │  ───────────────                          │                         │
│  │  ❌ Using range(len(list)) instead of      │                         │
│  │     iterating directly or using enumerate  │                         │
│  │                                           │                         │
│  │  ❌ Expecting else to run on break         │                         │
│  │     (it's the opposite — else runs when    │                         │
│  │     there is NO break)                     │                         │
│  │                                           │                         │
│  └───────────────────────────────────────────┘                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key interaction: Resolution Toggle**

The three resolution buttons at the top dynamically swap the content area:

```
[Micro] selected:
  "Python's for loop iterates over any iterable 
   using the iterator protocol (__iter__/__next__)."

[Standard] selected:
  (what's shown above — ~500 words with syntax, examples, edge cases)

[Exhaustive] selected:
  (everything above, PLUS iterator protocol internals, __getitem__ 
   fallback, performance notes for range() vs list, interaction with
   async for, walrus operator in for, starred assignment targets,
   bytecode details, comparison with C for loops, etc.)
```

---

### IMPLEMENT: Plan Builder

The highest-value interactive page. The user describes what they want to build, and gets a complete implementation plan.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Implement                                                               │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │  What do you want to build?                                      │   │
│  │                                                                  │   │
│  │  ┌──────────────────────────────────────────────────────────┐    │   │
│  │  │  Create a PPTX file with a blue rectangle at (2,1)      │    │   │
│  │  │  inches, 3x2 inches, with "Hello World" text centered   │    │   │
│  │  │  inside the shape                                        │    │   │
│  │  └──────────────────────────────────────────────────────────┘    │   │
│  │                                                                  │   │
│  │  Target: [PPTX        ▼]    Language: [Python     ▼]            │   │
│  │                                                                  │   │
│  │  ☑ Include format atoms    ☑ Include code    ☐ Include tests    │   │
│  │  ☐ Include optimizations   ☑ Include alternatives               │   │
│  │                                                                  │   │
│  │                           [🚀 Generate Plan]                     │   │
│  │                                                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│                                                                         │
│  ┌─── PLAN RESULT ──────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  📋 PPTX Rectangle with Centered Text                            │  │
│  │  ─────────────────────────────────────                            │  │
│  │  Feasibility: ✓ Fully Possible                                   │  │
│  │  Complexity: Moderate   Est. lines: ~120   Confidence: 91%       │  │
│  │                                                                   │  │
│  │  [Steps]  [Code]  [Atoms]  [Coordinate Math]                     │  │
│  │                                                                   │  │
│  │  IMPLEMENTATION STEPS                                             │  │
│  │  ════════════════════                                             │  │
│  │                                                                   │  │
│  │  Step 1 ─── Create ZIP Container                                 │  │
│  │  │                                                                │  │
│  │  │  PPTX files are ZIP archives. Create a new archive            │  │
│  │  │  and prepare to write required entries.                        │  │
│  │  │                                                                │  │
│  │  │  ┌──────────────────────────────────────────┐                 │  │
│  │  │  │ import zipfile                            │                 │  │
│  │  │  │ from io import BytesIO                    │                 │  │
│  │  │  │                                           │                 │  │
│  │  │  │ buffer = BytesIO()                        │                 │  │
│  │  │  │ zf = zipfile.ZipFile(buffer, 'w',         │                 │  │
│  │  │  │     zipfile.ZIP_DEFLATED)                  │                 │  │
│  │  │  └──────────────────────────────────────────┘                 │  │
│  │  │                                                                │  │
│  │  ▼                                                                │  │
│  │  Step 2 ─── Write [Content_Types].xml                            │  │
│  │  │                                                                │  │
│  │  │  Maps file extensions to MIME types.                           │  │
│  │  │                                                                │  │
│  │  │  📎 Required file: [Content_Types].xml                        │  │
│  │  │                                                                │  │
│  │  │  ┌──────────────────────────────────────────┐                 │  │
│  │  │  │ <?xml version="1.0" encoding="UTF-8"     │                 │  │
│  │  │  │  standalone="yes"?>                       │                 │  │
│  │  │  │ <Types xmlns="http://schemas.openxml...   │                 │  │
│  │  │  │   <Default Extension="rels"               │                 │  │
│  │  │  │     ContentType="application/vnd.open...  │                 │  │
│  │  │  │   <Default Extension="xml"                │                 │  │
│  │  │  │     ContentType="application/xml"/>       │                 │  │
│  │  │  │   <Override PartName="/ppt/presenta...    │                 │  │
│  │  │  │ </Types>                                  │                 │  │
│  │  │  └──────────────────────────────────────────┘                 │  │
│  │  │                                                                │  │
│  │  ▼                                                                │  │
│  │  Step 3 ─── Write Relationships                                  │  │
│  │  │   ...                                                          │  │
│  │  ▼                                                                │  │
│  │  Step 4 ─── Create Shape XML                                     │  │
│  │  │                                                                │  │
│  │  │  ┌─ Coordinate Conversion ───────────────────────────┐        │  │
│  │  │  │                                                    │        │  │
│  │  │  │  Position: (2, 1) inches                          │        │  │
│  │  │  │  → x = 2 × 914400 = 1,828,800 EMU                │        │  │
│  │  │  │  → y = 1 × 914400 = 914,400 EMU                  │        │  │
│  │  │  │                                                    │        │  │
│  │  │  │  Size: 3 × 2 inches                               │        │  │
│  │  │  │  → cx = 3 × 914400 = 2,743,200 EMU               │        │  │
│  │  │  │  → cy = 2 × 914400 = 1,828,800 EMU               │        │  │
│  │  │  │                                                    │        │  │
│  │  │  │  1 inch = 914,400 EMU                             │        │  │
│  │  │  │  1 cm = 360,000 EMU                               │        │  │
│  │  │  │  1 point = 12,700 EMU                              │        │  │
│  │  │  └────────────────────────────────────────────────────┘        │  │
│  │  │                                                                │  │
│  │  │  ┌─ Format Atoms Used ───────────────────────────────┐        │  │
│  │  │  │                                                    │        │  │
│  │  │  │  <p:sp>           Shape container                  │        │  │
│  │  │  │  ├─ <p:nvSpPr>    Non-visual properties           │        │  │
│  │  │  │  │  └─ <p:cNvPr>  id="2" name="Rectangle 1"      │        │  │
│  │  │  │  ├─ <p:spPr>      Shape properties                │        │  │
│  │  │  │  │  ├─ <a:xfrm>   Transform (position + size)    │        │  │
│  │  │  │  │  │  ├─ <a:off>  x="1828800" y="914400"        │        │  │
│  │  │  │  │  │  └─ <a:ext>  cx="2743200" cy="1828800"     │        │  │
│  │  │  │  │  ├─ <a:prstGeom prst="rect"/>  Rectangle      │        │  │
│  │  │  │  │  └─ <a:solidFill>                              │        │  │
│  │  │  │  │     └─ <a:srgbClr val="0000FF"/>  Blue        │        │  │
│  │  │  │  └─ <p:txBody>    Text body                       │        │  │
│  │  │  │     └─ <a:p>                                      │        │  │
│  │  │  │        └─ <a:r>                                   │        │  │
│  │  │  │           └─ <a:t>Hello World</a:t>               │        │  │
│  │  │  │                                                    │        │  │
│  │  │  │  Namespaces:                                       │        │  │
│  │  │  │  p: presentationml/2006/main                      │        │  │
│  │  │  │  a: drawingml/2006/main                           │        │  │
│  │  │  │  r: officeDocument/2006/relationships             │        │  │
│  │  │  └────────────────────────────────────────────────────┘        │  │
│  │  │                                                                │  │
│  │  ▼                                                                │  │
│  │  Step 5 ─── Save ZIP                                             │  │
│  │                                                                   │  │
│  │                                                                   │  │
│  │  ┌─ COMPLETE CODE ──────────────────────────────── [📋 Copy] ─┐  │  │
│  │  │                                                             │  │  │
│  │  │  #!/usr/bin/env python3                                     │  │  │
│  │  │  """Create a PPTX file with a blue rectangle."""            │  │  │
│  │  │                                                             │  │  │
│  │  │  import zipfile                                             │  │  │
│  │  │  from io import BytesIO                                     │  │  │
│  │  │                                                             │  │  │
│  │  │  def inches_to_emu(inches: float) -> int:                  │  │  │
│  │  │      return int(inches * 914400)                            │  │  │
│  │  │                                                             │  │  │
│  │  │  def create_pptx(                                           │  │  │
│  │  │      x_in: float, y_in: float,                             │  │  │
│  │  │      w_in: float, h_in: float,                             │  │  │
│  │  │      fill_hex: str = "0000FF",                             │  │  │
│  │  │      text: str = "Hello World",                            │  │  │
│  │  │  ) -> bytes:                                                │  │  │
│  │  │      ...                                                    │  │  │
│  │  │                                                             │  │  │
│  │  │  (120 lines of complete working code)                       │  │  │
│  │  │                                                             │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  │                                                                   │  │
│  │  ⚠️  Gotchas:                                                    │  │
│  │  • Shape IDs must be unique across the slide                     │  │
│  │  • Fill color is RGB hex WITHOUT the # prefix                    │  │
│  │  • <p:txBody> is required even if the shape has no text          │  │
│  │                                                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### COMPARE: Side-by-Side

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Compare                                                                 │
│                                                                         │
│  Concept: [Error Handling          ▼]                                   │
│  Targets: [Python ✓] [Rust ✓] [Go ✓] [+ Add target]                   │
│                                                                         │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐          │
│  │  🐍 PYTHON       │ │  🦀 RUST        │ │  🐹 GO          │          │
│  │                  │ │                  │ │                  │          │
│  │  try / except    │ │  Result<T, E>    │ │  if err != nil   │          │
│  │                  │ │                  │ │                  │          │
│  │  Exception-based │ │  Type-based      │ │  Value-based     │          │
│  │  Implicit: any   │ │  Explicit: must  │ │  Explicit: must  │          │
│  │  function can    │ │  be in return    │ │  check returned  │          │
│  │  throw           │ │  type            │ │  error            │          │
│  │                  │ │                  │ │                  │          │
│  │  SYNTAX          │ │  SYNTAX          │ │  SYNTAX          │          │
│  │  ┌────────────┐  │ │  ┌────────────┐  │ │  ┌────────────┐  │          │
│  │  │try:        │  │ │  │fn parse(s: │  │ │  │val, err := │  │          │
│  │  │  result =  │  │ │  │  &str      │  │ │  │  strconv.  │  │          │
│  │  │  int(s)    │  │ │  │) -> Result │  │ │  │  Atoi(s)   │  │          │
│  │  │except      │  │ │  │<i32,       │  │ │  │if err !=   │  │          │
│  │  │ValueError: │  │ │  │ ParseErr>  │  │ │  │  nil {     │  │          │
│  │  │  ...       │  │ │  │{           │  │ │  │  return    │  │          │
│  │  │            │  │ │  │  s.parse() │  │ │  │    0, err  │  │          │
│  │  │            │  │ │  │}           │  │ │  │}           │  │          │
│  │  └────────────┘  │ │  └────────────┘  │ │  └────────────┘  │          │
│  │                  │ │                  │ │                  │          │
│  │  DISTINCTIVE     │ │  DISTINCTIVE     │ │  DISTINCTIVE     │          │
│  │  • Exception     │ │  • ? operator    │ │  • Simplest      │          │
│  │    hierarchy     │ │    for propagation│ │    model         │          │
│  │  • else clause   │ │  • Compile-time  │ │  • errors.Is/As  │          │
│  │  • finally       │ │    enforcement   │ │  • No exception  │          │
│  │  • Exception     │ │  • Pattern match │ │    overhead      │          │
│  │    groups (3.11) │ │    on errors     │ │  • Verbose       │          │
│  │                  │ │  • No runtime    │ │                  │          │
│  │                  │ │    overhead      │ │                  │          │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘          │
│                                                                         │
│  ── TRANSLATION TABLE ────────────────────────────────────────────────  │
│  ┌──────────────────┬──────────────────┬──────────────────┐            │
│  │  Python           │  Rust             │  Go              │            │
│  ├──────────────────┼──────────────────┼──────────────────┤            │
│  │  try/except       │  match result {}  │  if err != nil   │            │
│  │  raise ValueError │  Err(ParseError)  │  fmt.Errorf(...) │            │
│  │  except as e      │  Err(e)           │  err (variable)  │            │
│  │  re-raise (raise) │  ? operator       │  return err      │            │
│  │  finally          │  Drop trait/defer │  defer func()    │            │
│  │  Exception chain  │  .context() anyhow│  fmt.Errorf: %w  │            │
│  └──────────────────┴──────────────────┴──────────────────┘            │
│                                                                         │
│  ── KEY DIFFERENCES ──────────────────────────────────────────────────  │
│                                                                         │
│  • Python's approach is most flexible but least safe — errors can       │
│    silently propagate through many stack frames                         │
│  • Rust's approach is safest — the compiler forces you to handle       │
│    every possible error — but has the steepest learning curve           │
│  • Go's approach is simplest to understand but most verbose to write   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### HEALTH: Vitality Dashboard

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Health  >  Global Dashboard                                            │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  KNOWLEDGE BASE PULSE                                last 24h   │   │
│  │                                                                  │   │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐   │   │
│  │  │        │  │        │  │        │  │        │  │        │   │   │
│  │  │  91.2% │  │  94.7% │  │  78.4% │  │  68.2% │  │  93.8% │   │   │
│  │  │        │  │        │  │        │  │        │  │        │   │   │
│  │  │COVERAGE│  │ACCURACY│  │FRESH   │  │ DEPTH  │  │COHERENT│   │   │
│  │  │  ↑0.3  │  │  →0.0  │  │  ↓2.1  │  │  ↑1.4  │  │  ↑0.2  │   │   │
│  │  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘   │   │
│  │                                                                  │   │
│  │  1,000 targets │ 5.2M entries │ 38M relations │ $412 this month │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─── ACTIVE ALERTS ────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  🔴 Python 3.13 released — 847 entries affected                  │  │
│  │     Immune system: ████████░░ 78% processed                      │  │
│  │     Est. completion: 2 hours          [View Details] [Pause]     │  │
│  │                                                                   │  │
│  │  🔴 12 contradictions in JavaScript async docs                   │  │
│  │     Auto-resolved: 8/12. Manual review needed: 4                 │  │
│  │                                                    [Review]      │  │
│  │                                                                   │  │
│  │  🟡 Rust 1.79 — 23 new features awaiting generation             │  │
│  │     Queued. Est. cost: $4.20          [Start Now] [Schedule]     │  │
│  │                                                                   │  │
│  │  🟡 PDF format: Layer 2 coverage at 34%                          │  │
│  │     Below 60% target                  [Generate Atoms]           │  │
│  │                                                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─── FRESHNESS DECAY MAP ──────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  Each block = 100 entries │ 🟢 >90% 🟡 70-90% 🟠 50-70% 🔴 <50%│  │
│  │                                                                   │  │
│  │  Python      🟢🟢🟢🟢🟡🟡🟡🟡🟠🟠🟠🟠🔴🔴🔴                   │  │
│  │  JavaScript  🟢🟢🟢🟢🟢🟡🟡🟡🟡🟡🟠🟠🟠🟠🔴🔴🔴🔴            │  │
│  │  Rust        🟢🟢🟢🟢🟢🟢🟢🟢🟡🟡🟡🟡🟡                       │  │
│  │  PPTX        🟢🟢🟢🟢🟢🟢🟢🟢                                   │  │
│  │  Go          🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟡🟡                         │  │
│  │  C11         🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢                     │  │
│  │  Java        🟢🟢🟢🟢🟢🟢🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡            │  │
│  │  PDF         🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢                               │  │
│  │                                                                   │  │
│  │  C11 is nearly immortal — the spec hasn't changed.               │  │
│  │  Python is decaying — 3.13 just released.                        │  │
│  │                                                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─── TARGET HEALTH TABLE ──────────────────────────────────────────┐  │
│  │                                                          sort: ▼ │  │
│  │  Target          Cover  Accur  Fresh  Depth  Coher  Overall  ▼   │  │
│  │  ───────────────────────────────────────────────────────────────  │  │
│  │  Python 3.12     ████░  █████  ███░░  ████░  █████   86%  ⚠    │  │
│  │  JavaScript      ████░  ████░  ███░░  ███░░  ████░   85%  ⚠    │  │
│  │  PPTX            ████░  ████░  ████░  ███░░  █████   87%  ✓    │  │
│  │  Rust 1.78       █████  █████  ████░  ███░░  █████   89%  ✓    │  │
│  │  Go 1.22         █████  █████  █████  ███░░  █████   90%  ✓    │  │
│  │  C11             █████  █████  █████  ████░  █████   97%  ✓✓   │  │
│  │  ...                                                             │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─── IMMUNE SYSTEM ────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  Today's budget: $50.00                                          │  │
│  │  Spent: $23.47 ████████████░░░░░░░░░░░░ 47%                     │  │
│  │                                                                   │  │
│  │  Actions today:     47 regenerated │ 123 annotated │ 8 gaps      │  │
│  │  Queue depth:       34 critical │ 156 warning │ 2,847 info       │  │
│  │  Est. clear time:   6 hours                                      │  │
│  │                                                                   │  │
│  │  30-day cost:       $412.38 │ Per-entry: $0.000079               │  │
│  │  Health maintained at 85%+ for $13.75/day                        │  │
│  │                                                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### DEVELOPER PORTAL: API Playground + Context Builder

```
┌─────────────────────────────────────────────────────────────────────────┐
│  API  >  Context Builder                                                │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Build an optimal AI context window from the knowledge base      │   │
│  │                                                                  │   │
│  │  Task:                                                           │   │
│  │  ┌──────────────────────────────────────────────────────────┐    │   │
│  │  │  Write a Python async web scraper that respects rate      │    │   │
│  │  │  limits and handles errors                                │    │   │
│  │  └──────────────────────────────────────────────────────────┘    │   │
│  │                                                                  │   │
│  │  Token budget:  [4000    ]  Targets: [Python ✓] [+ Add]         │   │
│  │  Already know:  [basic Python, HTTP basics         ]            │   │
│  │  Format:        (•) Structured  ( ) XML  ( ) Prose              │   │
│  │  ☑ Prefer code  ☐ Prefer exhaustive  ☑ Include metadata        │   │
│  │                                                                  │   │
│  │                                    [⚡ Assemble Context]         │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─── ASSEMBLED CONTEXT ────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  📊 Budget: 2,847 / 4,000 tokens used (153 remaining)            │  │
│  │  📈 15 entries included (52 excluded by budget)                   │  │
│  │  🎯 Strategy: 1 exhaustive, 3 standard, 11 micro                │  │
│  │  ✓ Confidence: 92%  Freshness: 85%                              │  │
│  │                                                                   │  │
│  │  ── Coverage Assessment ──                                       │  │
│  │  Good coverage of async/await and error handling.                │  │
│  │  ⚠ Missing: rate limiting patterns. Consider querying for       │  │
│  │    "asyncio.Semaphore rate limiting".                            │  │
│  │                                                                   │  │
│  │  ┌─ Entry Breakdown ────────────────────────────────────────┐    │  │
│  │  │                                                          │    │  │
│  │  │  Res  Tokens  Entry                              Conf    │    │  │
│  │  │  EXH   820   Python/Concurrency/Async/async-await 96%   │    │  │
│  │  │  STD   470   Python/Concurrency/Async/asyncio     94%   │    │  │
│  │  │  STD   380   Python/Error Handling/try-except     97%   │    │  │
│  │  │  STD   290   Python/Concurrency/Async/TaskGroup   89%   │    │  │
│  │  │  MIC    52   Python/Stdlib/aiohttp                91%   │    │  │
│  │  │  MIC    48   Python/Stdlib/asyncio.Semaphore      88%   │    │  │
│  │  │  MIC    45   Python/Error Handling/exception chain 93%  │    │  │
│  │  │  MIC    42   Python/Concurrency/Async/async for   90%   │    │  │
│  │  │  ...  (7 more at micro)                                  │    │  │
│  │  └──────────────────────────────────────────────────────────┘    │  │
│  │                                                                   │  │
│  │  ┌─ Raw Context ─────────────────────────────── [📋 Copy All] ─┐ │  │
│  │  │                                                              │ │  │
│  │  │  [                                                           │ │  │
│  │  │    {                                                         │ │  │
│  │  │      "target": "python",                                     │ │  │
│  │  │      "entries": [                                            │ │  │
│  │  │        {                                                     │ │  │
│  │  │          "path": "Python/Concurrency/Async/async-await",     │ │  │
│  │  │          "content": "Python's async/await syntax enables..." │ │  │
│  │  │          "examples": [                                       │ │  │
│  │  │            {"code": "async def fetch(...): ..."}             │ │  │
│  │  │          ]                                                   │ │  │
│  │  │        },                                                    │ │  │
│  │  │        ...                                                   │ │  │
│  │  │      ]                                                       │ │  │
│  │  │    }                                                         │ │  │
│  │  │  ]                                                           │ │  │
│  │  │                                                              │ │  │
│  │  └──────────────────────────────────────────────────────────────┘ │  │
│  │                                                                   │  │
│  │  ── Suggested Follow-up Queries ──                               │  │
│  │  → "Get exhaustive detail on asyncio.Semaphore"                 │  │
│  │  → "Use /v1/implement/plan for complete web scraper"            │  │
│  │                                                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### GRAPH EXPLORER

An interactive visual knowledge graph. This is the "wow factor" page.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Explore  >  Knowledge Graph                                            │
│                                                                         │
│  Start: [Python for loop          ]  Depth: [3 ▼]  Direction: [Both ▼] │
│  Relations: [☑ REQUIRES] [☑ COMMONLY_USED_WITH] [☑ ANALOGOUS_IN]      │
│             [☐ COMPOSES] [☑ ALTERNATIVE_TO]                             │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │                    ┌──────────┐                                   │   │
│  │                    │enumerate │                                   │   │
│  │                    │ (Python) │                                   │   │
│  │                    └────┬─────┘                                   │   │
│  │                         │ COMMONLY_USED_WITH                     │   │
│  │    ┌──────────┐    ┌────┴─────┐    ┌──────────┐                 │   │
│  │    │  while   │────│ FOR LOOP │────│   zip    │                 │   │
│  │    │  loop    │ ALT│ (Python) │COM │ (Python) │                 │   │
│  │    └──────────┘    └────┬─────┘    └──────────┘                 │   │
│  │                    ┌────┴───────┬────────────┐                   │   │
│  │                    │ REQUIRES   │ ANALOGOUS  │                   │   │
│  │               ┌────┴────┐  ┌───┴────┐  ┌────┴─────┐            │   │
│  │               │iterator │  │ list   │  │  for..in │            │   │
│  │               │protocol │  │ compre-│  │  (Rust)  │            │   │
│  │               │(Python) │  │ hension│  │          │            │   │
│  │               └─────────┘  │(Python)│  └────┬─────┘            │   │
│  │                            └────────┘       │                   │   │
│  │                                        ┌────┴─────┐            │   │
│  │                                        │ for..of  │            │   │
│  │                                        │  (JS)    │            │   │
│  │                                        └──────────┘            │   │
│  │                                                                  │   │
│  │  ● Python  ● Rust  ● JavaScript                                 │   │
│  │  ── REQUIRES  ── COMMONLY_USED_WITH  ── ANALOGOUS_IN            │   │
│  │                                                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Clicking any node opens its entry viewer. Dragging rearranges.        │
│  Hovering shows the relation context.                                   │
│                                                                         │
│  ┌─── SELECTED NODE INFO ───────────────────────────────────────────┐  │
│  │  Python / Control Flow / Iteration / for loop                    │  │
│  │                                                                   │  │
│  │  Python's for loop iterates over any iterable using the          │  │
│  │  iterator protocol (__iter__/__next__).                          │  │
│  │                                                                   │  │
│  │  Connections: 12 outgoing  │  8 incoming  │  20 total            │  │
│  │  Concept: iteration.for   │  Confidence: 96%                    │  │
│  │                                                                   │  │
│  │  [Open Entry]  [Center Graph]  [Expand]                          │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation

```
TECHNOLOGY STACK
────────────────
Framework:      Next.js 14 (App Router)
Language:       TypeScript
Styling:        Tailwind CSS + custom design tokens
Components:     Radix UI primitives + custom components
State:          Zustand (global) + React Query (server)
Code editor:    CodeMirror 6 (syntax highlighting)
Graph viz:      D3.js + custom force layout
Charts:         Recharts (health dashboards)
Search:         Instant search with debounce → API
Markdown:       react-markdown + rehype-highlight
API client:     Generated from OpenAPI spec via orval
```

```
src/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout with shell
│   ├── page.tsx                  # Home page
│   ├── explore/
│   │   ├── page.tsx              # Target listing
│   │   ├── [targetId]/
│   │   │   ├── page.tsx          # Target detail
│   │   │   ├── entry/
│   │   │   │   └── [...path]/
│   │   │   │       └── page.tsx  # Entry viewer
│   │   │   └── graph/
│   │   │       └── page.tsx      # Graph for this target
│   │   ├── concepts/
│   │   │   ├── page.tsx          # Concept tree
│   │   │   └── [conceptId]/
│   │   │       └── page.tsx      # Concept detail
│   │   └── families/
│   │       └── page.tsx
│   ├── implement/
│   │   ├── page.tsx              # Plan builder
│   │   ├── capabilities/
│   │   │   └── [targetId]/
│   │   │       └── page.tsx
│   │   ├── algorithms/
│   │   │   └── page.tsx
│   │   └── blueprints/
│   │       └── [targetId]/
│   │           └── page.tsx
│   ├── compare/
│   │   ├── page.tsx              # Comparison tool
│   │   ├── translate/
│   │   │   └── page.tsx
│   │   └── learning-path/
│   │       └── page.tsx
│   ├── health/
│   │   ├── page.tsx              # Global dashboard
│   │   └── [targetId]/
│   │       └── page.tsx          # Target health detail
│   └── api-docs/
│       ├── page.tsx              # API documentation
│       ├── playground/
│       │   └── page.tsx          # Interactive playground
│       └── context-builder/
│           └── page.tsx          # Context assembly tool
│
├── components/
│   ├── shell/                    # Application shell
│   │   ├── TopBar.tsx
│   │   ├── Navigation.tsx
│   │   ├── CommandPalette.tsx    # ⌘K command palette
│   │   └── SearchBar.tsx
│   │
│   ├── entries/                  # Entry display components
│   │   ├── EntryViewer.tsx       # Full entry with resolution toggle
│   │   ├── ResolutionToggle.tsx  # Micro / Standard / Exhaustive
│   │   ├── CodeBlock.tsx         # Syntax-highlighted code
│   │   ├── ParameterTable.tsx    # Function parameters
│   │   ├── EdgeCaseList.tsx
│   │   ├── ExampleCard.tsx
│   │   └── EntrySummaryCard.tsx  # Compact entry card for listings
│   │
│   ├── explore/                  # Explore page components
│   │   ├── TargetCard.tsx        # Target card with health indicator
│   │   ├── TargetGrid.tsx        # Grid of target cards
│   │   ├── TopicTree.tsx         # Collapsible topic tree
│   │   ├── TopicTreeNode.tsx     # Single tree node
│   │   ├── ConceptMap.tsx        # Universal concept visualization
│   │   └── FamilyBadge.tsx       # Language family badge
│   │
│   ├── implement/                # Implementation components
│   │   ├── PlanBuilder.tsx       # Goal input + options
│   │   ├── PlanResult.tsx        # Complete plan display
│   │   ├── ImplementationStep.tsx # One step in the plan
│   │   ├── AtomTree.tsx          # XML element hierarchy
│   │   ├── CoordinateCalc.tsx    # Unit conversion display
│   │   ├── AlgorithmCard.tsx     # Algorithm with formula
│   │   ├── BlueprintViewer.tsx   # Architecture diagram
│   │   └── CompleteCode.tsx      # Full code with copy button
│   │
│   ├── compare/                  # Comparison components
│   │   ├── ComparisonGrid.tsx    # Side-by-side columns
│   │   ├── TranslationTable.tsx  # Feature mapping table
│   │   ├── DiffHighlight.tsx     # Highlight differences
│   │   └── LearningPath.tsx      # Ordered learning steps
│   │
│   ├── health/                   # Health dashboard components
│   │   ├── VitalSignCard.tsx     # One vital sign with bar
│   │   ├── VitalSignsRow.tsx     # All five signs
│   │   ├── FreshnessMap.tsx      # Decay heat map
│   │   ├── HealthTable.tsx       # Target health matrix
│   │   ├── AlertCard.tsx         # Active alert
│   │   ├── ImmuneStatus.tsx      # Immune system status
│   │   ├── CostTracker.tsx       # Spending visualization
│   │   └── HealthChart.tsx       # Time-series health chart
│   │
│   ├── graph/                    # Graph visualization
│   │   ├── KnowledgeGraph.tsx    # D3-based graph component
│   │   ├── GraphControls.tsx     # Filters, depth, direction
│   │   ├── GraphNode.tsx         # Renderable node
│   │   └── GraphEdge.tsx         # Renderable edge
│   │
│   ├── context/                  # AI context builder
│   │   ├── ContextBuilder.tsx    # Input form
│   │   ├── ContextResult.tsx     # Assembled context display
│   │   ├── TokenBudgetBar.tsx    # Visual budget indicator
│   │   └── EntryBreakdown.tsx    # Which entries at which resolution
│   │
│   └── ui/                       # Primitive UI components
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Select.tsx
│       ├── Badge.tsx
│       ├── Card.tsx
│       ├── Tabs.tsx
│       ├── Tooltip.tsx
│       ├── Progress.tsx
│       ├── HealthBar.tsx         # Colored bar (green→red)
│       ├── Breadcrumb.tsx
│       ├── CopyButton.tsx
│       └── LoadingSkeleton.tsx
│
├── hooks/                        # Custom React hooks
│   ├── useSearch.ts              # Debounced search
│   ├── useEntry.ts               # Fetch entry by ID/path
│   ├── useTarget.ts              # Fetch target details
│   ├── useHealth.ts              # Fetch health data
│   ├── useImplementPlan.ts       # Generate implementation plan
│   ├── useCompare.ts             # Cross-target comparison
│   ├── useContextAssembly.ts     # AI context builder
│   ├── useGraph.ts               # Graph traversal
│   └── useCommandPalette.ts      # ⌘K state management
│
├── lib/                          # Utilities
│   ├── api-client.ts             # Generated from OpenAPI spec
│   ├── colors.ts                 # Language/health color maps
│   ├── tokens.ts                 # Token count formatting
│   └── paths.ts                  # URL construction helpers
│
├── stores/                       # Global state (Zustand)
│   ├── search-store.ts           # Search state
│   ├── preferences-store.ts      # User preferences (resolution, theme)
│   └── recent-store.ts           # Recently viewed entries/targets
│
└── styles/
    ├── globals.css               # Tailwind + custom properties
    └── code-theme.css            # CodeMirror theme
```

---

## Key Component Implementations

### Resolution Toggle — The Signature Interaction

```tsx
// components/entries/ResolutionToggle.tsx

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Resolution = 'micro' | 'standard' | 'exhaustive'

interface ResolutionToggleProps {
  content: {
    micro: string | null
    standard: string | null
    exhaustive: string | null
  }
  tokenCounts: {
    micro: number
    standard: number
    exhaustive: number
  }
  defaultResolution?: Resolution
  onResolutionChange?: (resolution: Resolution) => void
}

const RESOLUTION_META: Record<Resolution, {
  label: string
  shortLabel: string
  description: string
  icon: string
}> = {
  micro: {
    label: 'Micro',
    shortLabel: '~50 tokens',
    description: 'One-sentence summary',
    icon: '◦',
  },
  standard: {
    label: 'Standard',
    shortLabel: '~500 tokens',
    description: 'Complete reference with example',
    icon: '●',
  },
  exhaustive: {
    label: 'Exhaustive',
    shortLabel: '~2000 tokens',
    description: 'Everything: all edge cases, all examples',
    icon: '◉',
  },
}

export function ResolutionToggle({
  content,
  tokenCounts,
  defaultResolution = 'standard',
  onResolutionChange,
}: ResolutionToggleProps) {
  const [selected, setSelected] = useState<Resolution>(defaultResolution)

  const handleSelect = (resolution: Resolution) => {
    if (!content[resolution]) return // disabled if no content
    setSelected(resolution)
    onResolutionChange?.(resolution)
  }

  return (
    <div className="space-y-4">
      {/* Toggle buttons */}
      <div className="flex items-center gap-1 p-1 bg-zinc-900 rounded-lg w-fit">
        {(['micro', 'standard', 'exhaustive'] as Resolution[]).map((res) => {
          const meta = RESOLUTION_META[res]
          const isSelected = selected === res
          const isAvailable = !!content[res]

          return (
            <button
              key={res}
              onClick={() => handleSelect(res)}
              disabled={!isAvailable}
              className={`
                relative px-4 py-2 rounded-md text-sm font-medium
                transition-all duration-200
                ${isSelected
                  ? 'text-white'
                  : isAvailable
                    ? 'text-zinc-400 hover:text-zinc-200'
                    : 'text-zinc-600 cursor-not-allowed'
                }
              `}
            >
              {/* Animated background */}
              {isSelected && (
                <motion.div
                  layoutId="resolution-bg"
                  className="absolute inset-0 bg-zinc-700 rounded-md"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}

              <span className="relative flex items-center gap-2">
                <span className="text-xs">{meta.icon}</span>
                <span>{meta.label}</span>
                <span className="text-xs text-zinc-500">
                  {tokenCounts[res]
                    ? `${tokenCounts[res].toLocaleString()} tok`
                    : '—'}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {/* Content area with animated transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selected}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="prose prose-invert max-w-none"
        >
          {content[selected] ? (
            <RenderedContent content={content[selected]!} />
          ) : (
            <div className="text-zinc-500 italic p-4 border border-zinc-800 rounded-lg">
              {selected === 'exhaustive'
                ? 'Exhaustive content not yet generated for this entry. This area has low depth score.'
                : 'Content not available at this resolution.'}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
```

### Health Bar — The Vital Sign Indicator

```tsx
// components/ui/HealthBar.tsx

interface HealthBarProps {
  value: number        // 0.0 to 1.0
  label: string
  delta?: number       // change since last measurement
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

function healthColor(value: number): string {
  if (value >= 0.9) return '#22c55e'   // green
  if (value >= 0.8) return '#84cc16'   // lime
  if (value >= 0.7) return '#eab308'   // yellow
  if (value >= 0.5) return '#f97316'   // orange
  return '#ef4444'                      // red
}

function healthIcon(value: number): string {
  if (value >= 0.9) return '✓'
  if (value >= 0.7) return '⚠'
  return '✗'
}

function deltaArrow(delta: number | undefined): string {
  if (!delta || Math.abs(delta) < 0.001) return '→'
  return delta > 0 ? '↑' : '↓'
}

export function HealthBar({
  value,
  label,
  delta,
  showLabel = true,
  size = 'md',
}: HealthBarProps) {
  const color = healthColor(value)
  const barHeight = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' }[size]
  const textSize = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' }[size]

  return (
    <div className="space-y-1">
      {showLabel && (
        <div className={`flex justify-between items-center ${textSize}`}>
          <span className="text-zinc-400">{label}</span>
          <span className="flex items-center gap-1.5">
            <span className="text-zinc-200 font-mono">
              {Math.round(value * 100)}%
            </span>
            <span style={{ color }}>{healthIcon(value)}</span>
            {delta !== undefined && (
              <span className={`text-xs ${
                delta > 0 ? 'text-green-400' : delta < 0 ? 'text-red-400' : 'text-zinc-500'
              }`}>
                {deltaArrow(delta)}{Math.abs(delta * 100).toFixed(1)}
              </span>
            )}
          </span>
        </div>
      )}

      <div className={`w-full bg-zinc-800 rounded-full ${barHeight} overflow-hidden`}>
        <motion.div
          className={`${barHeight} rounded-full`}
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
```

### Command Palette

```tsx
// components/shell/CommandPalette.tsx

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { useSearch } from '@/hooks/useSearch'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Search results
  const { results, isLoading } = useSearch(query, { enabled: open && query.length > 1 })

  // Build action items
  const items = buildItems(query, results)

  const handleSelect = useCallback((item: PaletteItem) => {
    setOpen(false)
    setQuery('')
    if (item.action) {
      item.action()
    } else if (item.href) {
      router.push(item.href)
    }
  }, [router])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl p-0 bg-zinc-900 border border-zinc-700 shadow-2xl">
        {/* Search input */}
        <div className="flex items-center border-b border-zinc-800 px-4">
          <span className="text-zinc-500 mr-2">🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }}
            placeholder="Search entries, concepts, targets, or type a command..."
            className="w-full py-4 bg-transparent text-zinc-100 
                       placeholder:text-zinc-500 outline-none text-lg"
            autoFocus
          />
          <kbd className="text-xs text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto py-2">
          {items.map((section, si) => (
            <div key={section.title}>
              <div className="px-4 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                {section.title}
              </div>
              {section.items.map((item, ii) => {
                const flatIndex = items
                  .slice(0, si)
                  .reduce((sum, s) => sum + s.items.length, 0) + ii
                const isSelected = flatIndex === selectedIndex

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`
                      w-full px-4 py-2.5 flex items-center gap-3 text-left
                      transition-colors
                      ${isSelected
                        ? 'bg-zinc-800 text-zinc-100'
                        : 'text-zinc-400 hover:bg-zinc-800/50'
                      }
                    `}
                  >
                    <span className="text-lg w-6 text-center">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{item.label}</div>
                      {item.description && (
                        <div className="text-xs text-zinc-500 truncate">
                          {item.description}
                        </div>
                      )}
                    </div>
                    {item.badge && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        {item.badge}
                      </span>
                    )}
                    {isSelected && (
                      <span className="text-xs text-zinc-500">↵</span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}

          {query && items.every(s => s.items.length === 0) && (
            <div className="px-4 py-8 text-center text-zinc-500">
              No results for "{query}"
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface PaletteItem {
  id: string
  icon: string
  label: string
  description?: string
  badge?: string
  href?: string
  action?: () => void
}

interface PaletteSection {
  title: string
  items: PaletteItem[]
}

function buildItems(query: string, searchResults: any): PaletteSection[] {
  const sections: PaletteSection[] = []

  // Quick actions (always available)
  if (!query) {
    sections.push({
      title: 'Quick Actions',
      items: [
        { id: 'home', icon: '🏠', label: 'Go Home', href: '/' },
        { id: 'explore', icon: '🔍', label: 'Explore Targets', href: '/explore' },
        { id: 'implement', icon: '🏗️', label: 'Implementation Planner', href: '/implement' },
        { id: 'compare', icon: '⚖️', label: 'Compare Languages', href: '/compare' },
        { id: 'health', icon: '💊', label: 'Health Dashboard', href: '/health' },
        { id: 'api', icon: '📡', label: 'API Documentation', href: '/api-docs' },
      ],
    })
    return sections
  }

  // Search results
  if (searchResults?.results?.length > 0) {
    sections.push({
      title: 'Entries',
      items: searchResults.results.slice(0, 6).map((r: any) => ({
        id: r.entry.id,
        icon: '📄',
        label: r.entry.path.split('/').pop() || r.entry.path,
        description: r.entry.path,
        badge: r.entry.target_id,
        href: `/explore/${r.entry.target_id}/entry/${encodeURIComponent(r.entry.path)}`,
      })),
    })
  }

  // Context-aware actions
  const q = query.toLowerCase()
  const actionItems: PaletteItem[] = []

  if (q.includes('compare') || q.includes('vs') || q.includes('diff')) {
    actionItems.push({
      id: 'action-compare',
      icon: '⚖️',
      label: `Compare "${query}" across languages`,
      href: `/compare?topic=${encodeURIComponent(query)}`,
    })
  }

  if (q.includes('implement') || q.includes('build') || q.includes('create') || q.includes('how')) {
    actionItems.push({
      id: 'action-implement',
      icon: '🏗️',
      label: `Get implementation plan for "${query}"`,
      href: `/implement?goal=${encodeURIComponent(query)}`,
    })
  }

  if (q.includes('health') || q.includes('status')) {
    actionItems.push({
      id: 'action-health',
      icon: '💊',
      label: 'View system health',
      href: '/health',
    })
  }

  if (actionItems.length > 0) {
    sections.push({ title: 'Actions', items: actionItems })
  }

  return sections
}
```

---

## Responsive Design

```
BREAKPOINTS
───────────
sm:   640px    Mobile landscape
md:   768px    Tablet
lg:   1024px   Small desktop
xl:   1280px   Standard desktop
2xl:  1536px   Large screens

LAYOUT ADAPTATIONS
──────────────────

HOME PAGE:
  Desktop:  5-column target grid
  Tablet:   3-column target grid
  Mobile:   1-column target stack, search prominent

TARGET DETAIL:
  Desktop:  Health sidebar + topic tree
  Tablet:   Health row above + topic tree below
  Mobile:   Health accordion + topic tree

ENTRY VIEWER:
  Desktop:  Main content + sidebar
  Tablet:   Main content + collapsible sidebar
  Mobile:   Full-width content, sidebar becomes bottom sheet

IMPLEMENTATION PLAN:
  Desktop:  Steps with inline code + atoms sidebar
  Tablet:   Steps full-width, atoms in accordion
  Mobile:   Steps as cards, one at a time

COMPARISON:
  Desktop:  3-column side-by-side
  Tablet:   2-column with scroll
  Mobile:   Tabbed (one language at a time)

GRAPH:
  Desktop:  Full interactive graph
  Tablet:   Simplified graph
  Mobile:   List view of connections (no graph)

HEALTH DASHBOARD:
  Desktop:  All panels visible
  Tablet:   2-column grid
  Mobile:   Stacked cards
```

---

## URL Structure

Every page has a clean, shareable, bookmarkable URL:

```
/                                              Home
/explore                                       Target listing
/explore/python                                Python target detail
/explore/python/tree                           Python topic tree (full)
/explore/python/entry/Control+Flow/for+loop    Python for loop entry
/explore/python/capabilities                   Python capabilities
/explore/python/algorithms                     Python algorithms
/explore/concepts                              Universal concept tree
/explore/concepts/iteration.for                For loop concept (all langs)
/explore/families                              Family listing

/implement                                     Plan builder
/implement?goal=add+shapes+to+pptx&target=pptx Pre-filled plan
/implement/capabilities/pptx                   PPTX capabilities browser
/implement/algorithms/image_editor             Algorithm library
/implement/blueprints/pptx                     PPTX blueprints

/compare?concept=error_handling&targets=python,rust,go
/compare/translate?from=python&to=rust
/compare/learning-path?from=python&to=rust

/health                                        Global dashboard
/health/python                                 Python health detail
/health/events                                 Health event log

/api-docs                                      API documentation
/api-docs/playground                           Interactive API playground
/api-docs/context-builder                      Context assembly tool
/api-docs/sdks                                 SDK downloads
```

---

## Performance Strategy

```
CRITICAL PATH OPTIMIZATION
──────────────────────────

1. SEARCH LATENCY
   Goal: Results appear within 200ms of typing
   Strategy:
   • Debounce input by 150ms
   • Show cached results immediately, update when fresh data arrives
   • Prefetch popular searches (top 100 queries by frequency)
   • API returns results in <50ms (PostgreSQL vector search + FTS)

2. ENTRY LOADING
   Goal: Entry content visible within 100ms of click
   Strategy:
   • Prefetch entries on hover (200ms delay)
   • Cache all visited entries in React Query (5 min stale time)
   • Load micro resolution first, then upgrade to standard
   • Code syntax highlighting is lazy (highlight on viewport entry)

3. IMPLEMENTATION PLAN
   Goal: Plan appears within 3 seconds (LLM involved)
   Strategy:
   • Stream the response (show steps as they're generated)
   • Cache plans by goal+target hash (many users ask similar questions)
   • Show "building plan..." skeleton with progress stages

4. GRAPH RENDERING
   Goal: Smooth interaction with up to 200 nodes
   Strategy:
   • Canvas rendering (not SVG DOM) for large graphs
   • Level-of-detail: show labels only for nearby nodes
   • Virtualize: only render nodes in viewport
   • Web Worker for force layout computation

5. HEALTH DASHBOARD
   Goal: Dashboard loads in <500ms
   Strategy:
   • Server-side render the initial snapshot
   • WebSocket for real-time updates (optional)
   • Cache health data (1 minute stale time — changes slowly)

6. BUNDLE SIZE
   Goal: <200KB initial JS
   Strategy:
   • Route-based code splitting (Next.js default)
   • Lazy-load: CodeMirror, D3, Recharts
   • Tree-shake Radix UI (import individual components)
   • No heavy animation libraries (use CSS + Framer Motion core)
```

---

## State Management

```
ZUSTAND STORES (client-side global state)
─────────────────────────────────────────

PreferencesStore:
  • defaultResolution: 'micro' | 'standard' | 'exhaustive'
  • preferCode: boolean
  • theme: 'dark' (dark-only for V1)
  • codeFont: string
  • codeFontSize: number

RecentStore:
  • recentEntries: {id, path, target, timestamp}[]    (last 50)
  • recentTargets: string[]                            (last 10)
  • recentSearches: string[]                           (last 20)

SearchStore:
  • query: string
  • filters: {target, type, layer, minConfidence}
  • results: SearchResult[]
  • isLoading: boolean


REACT QUERY (server state — cached API responses)
──────────────────────────────────────────────────

Keys:
  ['targets']                         → all targets (10 min stale)
  ['target', targetId]                → one target detail (5 min)
  ['entry', entryId]                  → one entry (5 min)
  ['entry', targetId, path]           → entry by path (5 min)
  ['examples', entryId]               → examples for entry (5 min)
  ['search', query, filters]          → search results (1 min)
  ['tree', targetId, depth]           → topic tree (10 min)
  ['concepts']                        → concept tree (30 min)
  ['health']                          → global health (1 min)
  ['health', targetId]                → target health (1 min)
  ['capabilities', targetId]          → capabilities (5 min)
  ['graph', startId, params]          → graph traversal (5 min)
  ['plan', goalHash]                  → implementation plan (30 min)
  ['compare', concept, targets]       → comparison (10 min)
  ['context', taskHash]               → assembled context (no cache)
```

---

## Accessibility

```
KEYBOARD NAVIGATION
───────────────────
⌘K / Ctrl+K          Open command palette
Escape                Close any modal/palette
Tab                   Navigate between sections
↑ ↓                   Navigate within lists
Enter                 Select/activate
1 2 3                 Switch resolution (on entry page)
← →                   Navigate between comparison columns
/ (slash)             Focus search bar (when not in input)

SCREEN READER SUPPORT
─────────────────────
• All interactive elements have aria labels
• Resolution toggle uses role="radiogroup"
• Topic tree uses role="tree" + role="treeitem"
• Health bars have aria-valuenow, aria-valuemin, aria-valuemax
• Code blocks have aria-label="Code example: {title}"
• Graph has a text alternative (list of connections)

COLOR CONTRAST
──────────────
• All text meets WCAG AA contrast ratios on dark background
• Health colors are supplemented with icons (✓ ⚠ ✗)
  so color is not the sole indicator
• Focus rings are visible (2px blue outline)
```

---

## What Gets Built When

```
PHASE 1: CORE (Week 1-3)
─────────────────────────
Ship: Home, Search, Target listing, Entry viewer

• Application shell (TopBar, Navigation, layout)
• Home page with search and target grid
• Target detail page with topic tree
• Entry viewer with resolution toggle
• Search (debounced, API-connected)
• Command palette (⌘K)
• Basic responsive design

PHASE 2: DEPTH (Week 4-6)
─────────────────────────
Ship: Implementation planner, Capabilities browser

• Implementation plan builder
• Plan result display with steps, atoms, code
• Capability listing and detail pages
• Algorithm library
• Code syntax highlighting (CodeMirror)
• Copy button on all code blocks

PHASE 3: CONNECTIONS (Week 7-8)
───────────────────────────────
Ship: Comparison tool, Graph explorer, Concept browser

• Side-by-side comparison view
• Translation table
• Knowledge graph visualization (D3)
• Universal concept tree
• Same-concept-in-other-languages links

PHASE 4: OPERATIONS (Week 9-10)
───────────────────────────────
Ship: Health dashboard, Context builder, API docs

• Health dashboard with all five vital signs
• Freshness decay map
• Alert list with actions
• AI context builder tool
• API documentation (Swagger UI + custom)
• API playground

PHASE 5: POLISH (Week 11-12)
────────────────────────────
Ship: Mobile optimization, Performance, Accessibility

• Full responsive design pass
• Performance optimization (prefetching, caching)
• Accessibility audit and fixes
• Loading states and error boundaries
• Analytics and usage tracking
```
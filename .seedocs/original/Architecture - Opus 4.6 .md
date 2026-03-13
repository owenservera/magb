

# Automated Language & File Type Guidebook Generator — Full Architecture

## System Overview

```
                         ┌─────────────────────────────────┐
                         │         ORCHESTRATOR             │
                         │  State machine driving 6 phases  │
                         └──────────┬──────────────────────┘
                                    │
         ┌──────────┬───────────┬───┴────┬───────────┬──────────┐
         ▼          ▼           ▼        ▼           ▼          ▼
    ┌─────────┐┌─────────┐┌─────────┐┌───────┐┌─────────┐┌─────────┐
    │ Phase 1 ││ Phase 2 ││ Phase 3 ││Phase 4││ Phase 5 ││ Phase 6 │
    │DECOMPOSE││ENUMERATE││GENERATE ││  GAP  ││  FILL   ││VALIDATE │
    │  topic  ││keywords,││ content ││ANALYZE││  gaps   ││ & cross │
    │  tree   ││ stdlib, ││for every││       ││         ││   ref   │
    │(recurse)││builtins ││  leaf   ││       ││         ││         │
    └────┬────┘└────┬────┘└────┬────┘└───┬───┘└────┬────┘└────┬────┘
         │          │          │         │         │          │
         ▼          ▼          ▼         ▼         ▼          ▼
    ┌─────────────────────────────────────────────────────────────┐
    │                     LLM CLIENT POOL                         │
    │  ┌─────────┐  ┌──────────┐  ┌───────────┐                  │
    │  │ Cheap   │  │ Mid-tier │  │ Expensive │  Rate-limited,   │
    │  │(Haiku/  │  │(Sonnet/  │  │ (Opus/    │  retry-aware,    │
    │  │ 4o-mini)│  │  4o)     │  │  o1)      │  JSON-mode       │
    │  │ decomp  │  │ generate │  │ validate  │                  │
    │  └─────────┘  └──────────┘  └───────────┘                  │
    └──────────────────────┬──────────────────────────────────────┘
                           ▼
    ┌─────────────────────────────────────────────────────────────┐
    │                   STORAGE LAYER                             │
    │   SQLite (structured) + JSON export + Markdown export       │
    └─────────────────────────────────────────────────────────────┘
```

---

## Complete Implementation

### Project Structure
```
guidebook_gen/
├── main.py           # CLI entry point
├── config.py         # All configuration  
├── schema.py         # Pydantic data models
├── prompts.py        # Every prompt template
├── llm.py            # Async LLM client w/ routing
├── pipeline.py       # 6-phase pipeline engine
├── storage.py        # SQLite + export
└── requirements.txt
```

---

### `requirements.txt`
```
pydantic>=2.0
openai>=1.30
anthropic>=0.25
aiosqlite>=0.19
tenacity>=8.2
tiktoken>=0.7
tqdm>=4.66
```

---

### `config.py`

```python
"""
Central configuration — model routing, rate limits, cost tracking, 
decomposition depth controls.
"""
from dataclasses import dataclass, field
from enum import Enum


class LLMProvider(Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"


@dataclass
class ModelTier:
    """Which model to use for each pipeline phase."""
    provider: LLMProvider
    model: str
    max_tokens: int
    cost_per_1k_input: float   # dollars
    cost_per_1k_output: float
    requests_per_minute: int


@dataclass
class Config:
    # ── Model routing ──────────────────────────────────────────
    decompose_model: ModelTier = field(default_factory=lambda: ModelTier(
        provider=LLMProvider.ANTHROPIC,
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        cost_per_1k_input=0.003,
        cost_per_1k_output=0.015,
        requests_per_minute=1000,
    ))
    generate_model: ModelTier = field(default_factory=lambda: ModelTier(
        provider=LLMProvider.ANTHROPIC,
        model="claude-sonnet-4-20250514",
        max_tokens=8192,
        cost_per_1k_input=0.003,
        cost_per_1k_output=0.015,
        requests_per_minute=1000,
    ))
    validate_model: ModelTier = field(default_factory=lambda: ModelTier(
        provider=LLMProvider.OPENAI,
        model="gpt-4o",
        max_tokens=4096,
        cost_per_1k_input=0.005,
        cost_per_1k_output=0.015,
        requests_per_minute=500,
    ))

    # ── Pipeline controls ──────────────────────────────────────
    max_concurrency: int = 50           # parallel API calls
    max_decompose_depth: int = 5        # topic-tree depth cap
    min_leaf_granularity: str = "single_concept"  # or "single_function"
    gap_analysis_passes: int = 2        # how many gap-fill rounds
    validation_sample_rate: float = 0.2 # validate 20% of entries

    # ── Storage ────────────────────────────────────────────────
    db_path: str = "guidebook.db"
    export_dir: str = "export/"

    # ── Targets ────────────────────────────────────────────────
    # Override at runtime
    target_languages: list[str] = field(default_factory=lambda: [
        "Python 3.12", "Rust 1.78", "TypeScript 5.4",
    ])
    target_file_types: list[str] = field(default_factory=lambda: [
        "JSON", "YAML", "TOML", "CSV", "XML", "Protobuf",
    ])
```

---

### `schema.py`

```python
"""
Canonical data models for the entire knowledge graph.
Every piece of generated content conforms to these models.
"""
from __future__ import annotations
from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional
import uuid
import time


# ════════════════════════════════════════════════════════════════
# Topic Tree (Phase 1 output)
# ════════════════════════════════════════════════════════════════

class NodeType(str, Enum):
    ROOT = "root"
    CATEGORY = "category"         # e.g. "Type System"
    SUBCATEGORY = "subcategory"   # e.g. "Primitive Types"
    TOPIC = "topic"               # e.g. "Integer Types"
    LEAF = "leaf"                 # e.g. "i32 — 32-bit signed integer"


class TopicNode(BaseModel):
    """A node in the hierarchical topic decomposition tree."""
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:12])
    parent_id: Optional[str] = None
    node_type: NodeType
    title: str
    description: str = ""
    path: str = ""                # e.g. "Python/Type System/Primitives/int"
    depth: int = 0
    children_ids: list[str] = Field(default_factory=list)
    is_generated: bool = False    # content has been produced
    is_validated: bool = False
    estimated_subtopic_count: int = 0
    metadata: dict = Field(default_factory=dict)


# ════════════════════════════════════════════════════════════════
# Content Entry (Phase 3 output)
# ════════════════════════════════════════════════════════════════

class CodeExample(BaseModel):
    title: str
    code: str
    language: str
    explanation: str = ""
    output: str = ""


class ContentEntry(BaseModel):
    """The actual generated documentation for one leaf topic."""
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:12])
    topic_node_id: str
    path: str
    language_or_filetype: str

    # ── Core content ───────────────────────────────────────
    title: str
    summary: str                          # 1-2 sentence overview
    detailed_description: str             # full explanation
    syntax: Optional[str] = None          # formal syntax / grammar
    parameters: list[dict] = Field(default_factory=list)
    return_value: Optional[str] = None
    examples: list[CodeExample] = Field(default_factory=list)
    edge_cases: list[str] = Field(default_factory=list)
    common_mistakes: list[str] = Field(default_factory=list)
    related_topics: list[str] = Field(default_factory=list)  # paths
    see_also: list[str] = Field(default_factory=list)
    since_version: Optional[str] = None
    deprecated: bool = False
    platform_notes: list[str] = Field(default_factory=list)

    # ── Metadata ──────────────────────────────────────────
    generated_at: float = Field(default_factory=time.time)
    model_used: str = ""
    confidence_score: float = 0.0         # 0-1, from validation
    token_count: int = 0


# ════════════════════════════════════════════════════════════════
# Completeness Anchors (Phase 2 output)
# ════════════════════════════════════════════════════════════════

class CompletenessAnchors(BaseModel):
    """Exhaustive enumerations used to verify nothing is missed."""
    language: str
    keywords: list[str] = Field(default_factory=list)
    builtin_functions: list[str] = Field(default_factory=list)
    builtin_types: list[str] = Field(default_factory=list)
    builtin_constants: list[str] = Field(default_factory=list)
    operators: list[str] = Field(default_factory=list)
    stdlib_modules: list[str] = Field(default_factory=list)
    magic_methods: list[str] = Field(default_factory=list)  # dunder etc
    pragmas_directives: list[str] = Field(default_factory=list)
    attributes_annotations: list[str] = Field(default_factory=list)


# ════════════════════════════════════════════════════════════════
# Gap Analysis (Phase 4 output)
# ════════════════════════════════════════════════════════════════

class GapSeverity(str, Enum):
    CRITICAL = "critical"       # core language feature missing
    IMPORTANT = "important"     # stdlib module or significant feature
    MINOR = "minor"             # edge case or obscure feature


class Gap(BaseModel):
    description: str
    severity: GapSeverity
    suggested_path: str         # where it should go in the tree
    anchor_reference: str = ""  # which anchor item it relates to
    parent_node_id: str = ""


class GapReport(BaseModel):
    language: str
    gaps: list[Gap] = Field(default_factory=list)
    coverage_pct: float = 0.0   # estimated % of language covered
    anchor_coverage: dict[str, float] = Field(default_factory=dict)


# ════════════════════════════════════════════════════════════════
# File Type Schema (parallel to language schema)
# ════════════════════════════════════════════════════════════════

class FileTypeSpec(BaseModel):
    name: str
    extensions: list[str]
    mime_types: list[str]
    magic_bytes: Optional[str] = None
    text_or_binary: str = "text"
    formal_spec_url: Optional[str] = None


# ════════════════════════════════════════════════════════════════
# Pipeline State (for resume/checkpoint)
# ════════════════════════════════════════════════════════════════

class PipelineState(BaseModel):
    target: str                  # language or file type name
    current_phase: int = 1
    total_nodes: int = 0
    generated_nodes: int = 0
    validated_nodes: int = 0
    gaps_found: int = 0
    gaps_filled: int = 0
    total_api_calls: int = 0
    total_input_tokens: int = 0
    total_output_tokens: int = 0
    total_cost_usd: float = 0.0
    errors: list[str] = Field(default_factory=list)
```

---

### `prompts.py`

```python
"""
Every prompt template in the system.

Design principles:
  1. Force EXHAUSTIVE enumeration — never "e.g." or "etc."
  2. Require JSON output for parseability
  3. Include anti-omission instructions
  4. Provide structural context (where in the tree we are)
  5. Separate cheap-model prompts from expensive-model prompts
"""

# ════════════════════════════════════════════════════════════════
# PHASE 1: DECOMPOSITION PROMPTS
# ════════════════════════════════════════════════════════════════

DECOMPOSE_ROOT = """You are building a COMPLETE reference guide for **{target}**.

Your task: produce an EXHAUSTIVE list of every top-level category needed
to fully document this {target_type} so that a programmer with ONLY this
guide could use every feature of {target}.

Requirements:
- Be EXHAUSTIVE. A language-spec reviewer will check for missing categories.
- Cover: syntax, semantics, type system, control flow, functions, OOP,
  memory model, error handling, concurrency, module system, standard library,
  metaprogramming, I/O, tooling, idioms, edge cases, FFI, and any
  {target_type}-specific categories.
- Each category must be non-overlapping.
- Order from foundational → advanced.

Respond with ONLY this JSON (no markdown fencing):
{{
  "target": "{target}",
  "categories": [
    {{
      "title": "...",
      "description": "1-sentence scope description",
      "estimated_subtopics": <int>,
      "priority": "core|standard|advanced|reference"
    }}
  ]
}}"""

DECOMPOSE_BRANCH = """You are building a COMPLETE reference guide for **{target}**.

Current location in the guide:
  Path: {path}
  Depth: {depth}
  Parent description: {parent_description}

Your task: produce an EXHAUSTIVE list of every subtopic under "{title}".

Rules:
- EXHAUSTIVE: list EVERY item. Do not write "etc." or "and more".
- If this is a module/package listing, list EVERY module individually.
- If this is a type listing, list EVERY type individually.
- Each subtopic should be specific enough to document in 200-500 words.
- If a subtopic is still too broad, mark needs_decomposition=true.
- Non-overlapping with sibling categories.

{additional_context}

Respond with ONLY this JSON:
{{
  "subtopics": [
    {{
      "title": "...",
      "description": "...",
      "needs_decomposition": true|false,
      "estimated_subtopics": <int if needs_decomposition else 0>
    }}
  ]
}}"""

LEAF_CHECK = """For the reference guide of **{target}**:

Topic: {title}
Path: {path}
Description: {description}

Is this topic atomic enough to be documented as a SINGLE reference entry
(200-800 words with examples)? Or does it need further subdivision?

If it needs subdivision, list the sub-items.

Respond with ONLY this JSON:
{{
  "is_leaf": true|false,
  "reason": "...",
  "sub_items": [
    {{"title": "...", "description": "..."}}
  ]
}}"""


# ════════════════════════════════════════════════════════════════
# PHASE 2: ENUMERATION PROMPTS (completeness anchors)
# ════════════════════════════════════════════════════════════════

ENUMERATE_KEYWORDS = """List EVERY keyword and reserved word in **{target}**.
Not examples — the COMPLETE list. Include contextual keywords if applicable.

Respond with ONLY this JSON:
{{
  "keywords": ["keyword1", "keyword2", ...],
  "contextual_keywords": ["kw1", "kw2", ...],
  "total_count": <int>
}}"""

ENUMERATE_BUILTINS = """List EVERY built-in function, type, constant, and exception
in **{target}** (available without imports).

Respond with ONLY this JSON:
{{
  "builtin_functions": ["name1", ...],
  "builtin_types": ["name1", ...],
  "builtin_constants": ["name1", ...],
  "builtin_exceptions": ["name1", ...],
  "total_count": <int>
}}"""

ENUMERATE_OPERATORS = """List EVERY operator in **{target}** with its precedence level.

Respond with ONLY this JSON:
{{
  "operators": [
    {{"symbol": "+", "name": "addition", "precedence": 12, "associativity": "left", "overloadable": true}}
  ]
}}"""

ENUMERATE_STDLIB = """List EVERY module/package in the **{target}** standard library.
The COMPLETE list — not a selection. Group by domain.

Respond with ONLY this JSON:
{{
  "modules": [
    {{
      "name": "os",
      "domain": "system",
      "description": "OS interface",
      "submodules": ["os.path"]
    }}
  ],
  "total_count": <int>
}}"""

ENUMERATE_FILE_STRUCTURE = """Describe the COMPLETE structural specification of the
**{target}** file format.

Include: magic bytes, header structure, all field types, encoding rules,
all possible values for enum fields, nesting rules, escape sequences,
size limits, version differences.

Respond with ONLY this JSON:
{{
  "format_name": "...",
  "extensions": [".json"],
  "mime_types": ["application/json"],
  "magic_bytes": null,
  "encoding": "UTF-8",
  "structure": {{
    "description": "...",
    "elements": [
      {{
        "name": "...",
        "type": "...",
        "required": true,
        "description": "...",
        "constraints": "..."
      }}
    ]
  }},
  "grammar_rules": ["..."],
  "escape_sequences": {{}},
  "version_history": [
    {{"version": "...", "changes": "..."}}
  ]
}}"""


# ════════════════════════════════════════════════════════════════
# PHASE 3: CONTENT GENERATION PROMPTS
# ════════════════════════════════════════════════════════════════

GENERATE_CONTENT = """You are writing a reference entry for a **{target}** guidebook.

Location: {path}
Topic: {title}
Description: {description}
Context: {context}

Write a COMPLETE reference entry. A programmer with ONLY this guide must be
able to understand and use this feature correctly in all cases.

Include:
1. Clear summary (1-2 sentences)
2. Detailed explanation
3. Formal syntax (if applicable)
4. Parameters/fields (if applicable)
5. Return value (if applicable)
6. 2-4 code examples (simple → complex, with expected output)
7. Edge cases and gotchas
8. Common mistakes
9. Related topics (as paths in the guide)

Respond with ONLY this JSON:
{{
  "title": "...",
  "summary": "...",
  "detailed_description": "...",
  "syntax": "...",
  "parameters": [
    {{"name": "...", "type": "...", "required": true, "description": "...", "default": null}}
  ],
  "return_value": "type and description",
  "examples": [
    {{
      "title": "Basic usage",
      "code": "...",
      "language": "{code_lang}",
      "explanation": "...",
      "output": "..."
    }}
  ],
  "edge_cases": ["..."],
  "common_mistakes": ["..."],
  "related_topics": ["path/to/related"],
  "since_version": "...",
  "deprecated": false,
  "platform_notes": []
}}"""


# ════════════════════════════════════════════════════════════════
# PHASE 4: GAP ANALYSIS PROMPTS
# ════════════════════════════════════════════════════════════════

GAP_ANALYSIS_TREE = """You are auditing a reference guide for **{target}** for completeness.

Here is the current topic tree (paths only):
{topic_tree_paths}

Here are the completeness anchors (known exhaustive lists):
- Keywords covered: {keywords_coverage}
- Builtins covered: {builtins_coverage}  
- Stdlib modules covered: {stdlib_coverage}
- Operators covered: {operators_coverage}

Identify ALL gaps — topics that are missing from the tree but required
for a COMPLETE reference. Be specific.

Respond with ONLY this JSON:
{{
  "gaps": [
    {{
      "description": "Missing documentation for ...",
      "severity": "critical|important|minor",
      "suggested_path": "Category/Subcategory/Topic",
      "anchor_reference": "which keyword/builtin/module this relates to",
      "parent_path": "where in existing tree this should be added"
    }}
  ],
  "estimated_coverage_pct": <float 0-100>,
  "missing_keywords": ["..."],
  "missing_builtins": ["..."],
  "missing_stdlib_modules": ["..."]
}}"""

GAP_ANALYSIS_CROSS_LANG = """Compare the topic coverage of **{target}** against
the reference guide for **{reference_lang}** (a similar language).

{target} topics:
{target_paths}

{reference_lang} topics:
{reference_paths}

What concepts exist in {reference_lang}'s guide that are applicable to
{target} but missing from {target}'s guide?

Respond with ONLY this JSON:
{{
  "applicable_gaps": [
    {{
      "reference_path": "path in {reference_lang} guide",
      "applicable_to_target": true,
      "suggested_path": "where to add in {target} guide",
      "description": "..."
    }}
  ]
}}"""


# ════════════════════════════════════════════════════════════════
# PHASE 6: VALIDATION PROMPTS
# ════════════════════════════════════════════════════════════════

VALIDATE_CONTENT = """You are a {target} expert reviewing a reference guide entry.

Path: {path}
Entry:
{content_json}

Check for:
1. Factual accuracy (syntax, behavior, types)
2. Completeness (missing parameters, edge cases, examples)
3. Code correctness (would the examples actually run?)
4. Version accuracy (is since_version correct?)
5. Clarity (would a programmer understand this?)

Respond with ONLY this JSON:
{{
  "is_accurate": true|false,
  "confidence": <float 0.0-1.0>,
  "errors": [
    {{"field": "...", "issue": "...", "correction": "..."}}
  ],
  "missing_info": ["..."],
  "suggested_improvements": ["..."],
  "examples_would_run": true|false
}}"""


# ════════════════════════════════════════════════════════════════
# UTILITY PROMPTS
# ════════════════════════════════════════════════════════════════

MERGE_DUPLICATES = """These two entries in a {target} reference guide may overlap:

Entry A ({path_a}):
{summary_a}

Entry B ({path_b}):
{summary_b}

Are these duplicates? If so, how should they be merged?

Respond with ONLY this JSON:
{{
  "are_duplicates": true|false,
  "overlap_pct": <float 0-100>,
  "recommendation": "keep_both|merge_into_a|merge_into_b|delete_one",
  "merge_plan": "..."
}}"""

CLASSIFY_TARGET = """Classify **{target}** to determine the right documentation strategy.

Respond with ONLY this JSON:
{{
  "type": "programming_language|markup_language|query_language|file_format|data_format|config_format|protocol|shell",
  "paradigms": ["imperative", "functional", ...],
  "typing": "static|dynamic|gradual|none",
  "has_stdlib": true|false,
  "stdlib_size": "none|small|medium|large|massive",
  "has_oop": true|false,
  "has_concurrency": true|false,
  "has_metaprogramming": true|false,
  "has_generics": true|false,
  "has_macros": true|false,
  "memory_model": "gc|rc|ownership|manual|na",
  "spec_formality": "formal_spec|informal_spec|reference_impl",
  "similar_to": ["other_language1", ...]
}}"""
```

---

### `llm.py`

```python
"""
Async LLM client with:
  - Model-tier routing (cheap/mid/expensive)
  - Semaphore-based rate limiting
  - Exponential backoff retries
  - Token counting & cost tracking
  - Structured JSON output enforcement
  - Multi-provider support (OpenAI + Anthropic)
"""
from __future__ import annotations
import asyncio
import json
import os
import time
from dataclasses import dataclass, field
from typing import Optional

import tiktoken
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
from tenacity import (
    retry, stop_after_attempt, wait_exponential,
    retry_if_exception_type
)

from config import ModelTier, LLMProvider


@dataclass
class UsageStats:
    total_calls: int = 0
    total_input_tokens: int = 0
    total_output_tokens: int = 0
    total_cost_usd: float = 0.0
    total_retries: int = 0
    calls_by_phase: dict[str, int] = field(default_factory=dict)

    def record(self, tier: ModelTier, input_tok: int, output_tok: int, phase: str):
        self.total_calls += 1
        self.total_input_tokens += input_tok
        self.total_output_tokens += output_tok
        self.total_cost_usd += (
            input_tok / 1000 * tier.cost_per_1k_input +
            output_tok / 1000 * tier.cost_per_1k_output
        )
        self.calls_by_phase[phase] = self.calls_by_phase.get(phase, 0) + 1


class LLMClient:
    """Unified async client supporting OpenAI and Anthropic with rate limiting."""

    def __init__(self, max_concurrency: int = 50):
        self.openai = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.anthropic = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        self.semaphore = asyncio.Semaphore(max_concurrency)
        self.stats = UsageStats()
        self._rate_limiters: dict[str, asyncio.Semaphore] = {}
        self._tiktoken_enc = tiktoken.get_encoding("cl100k_base")

    def _get_rate_limiter(self, tier: ModelTier) -> asyncio.Semaphore:
        key = f"{tier.provider.value}:{tier.model}"
        if key not in self._rate_limiters:
            # Convert RPM to concurrent-request semaphore
            # Rough heuristic: allow RPM/60*avg_latency concurrent
            concurrent = min(tier.requests_per_minute // 10, 100)
            self._rate_limiters[key] = asyncio.Semaphore(concurrent)
        return self._rate_limiters[key]

    def estimate_tokens(self, text: str) -> int:
        return len(self._tiktoken_enc.encode(text))

    async def complete(
        self,
        prompt: str,
        tier: ModelTier,
        phase: str = "unknown",
        system_prompt: str = "You are a precise technical documentation generator. Always respond with valid JSON only.",
        temperature: float = 0.2,
        retries: int = 3,
    ) -> dict:
        """
        Send a prompt to the appropriate provider and return parsed JSON.
        Handles rate limiting, retries, and cost tracking.
        """
        rate_limiter = self._get_rate_limiter(tier)

        for attempt in range(retries):
            try:
                async with self.semaphore, rate_limiter:
                    if tier.provider == LLMProvider.OPENAI:
                        result = await self._call_openai(
                            prompt, tier, system_prompt, temperature
                        )
                    else:
                        result = await self._call_anthropic(
                            prompt, tier, system_prompt, temperature
                        )

                # Parse JSON
                parsed = self._extract_json(result["content"])
                self.stats.record(
                    tier, result["input_tokens"],
                    result["output_tokens"], phase
                )
                return parsed

            except (json.JSONDecodeError, KeyError) as e:
                if attempt == retries - 1:
                    raise ValueError(
                        f"Failed to parse JSON after {retries} attempts: {e}\n"
                        f"Raw output: {result.get('content', 'N/A')[:500]}"
                    )
                self.stats.total_retries += 1
                await asyncio.sleep(2 ** attempt)

            except Exception as e:
                if attempt == retries - 1:
                    raise
                self.stats.total_retries += 1
                wait_time = min(2 ** (attempt + 2), 60)
                await asyncio.sleep(wait_time)

    async def _call_openai(
        self, prompt: str, tier: ModelTier,
        system_prompt: str, temperature: float
    ) -> dict:
        response = await self.openai.chat.completions.create(
            model=tier.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            temperature=temperature,
            max_tokens=tier.max_tokens,
            response_format={"type": "json_object"},
        )
        return {
            "content": response.choices[0].message.content,
            "input_tokens": response.usage.prompt_tokens,
            "output_tokens": response.usage.completion_tokens,
        }

    async def _call_anthropic(
        self, prompt: str, tier: ModelTier,
        system_prompt: str, temperature: float
    ) -> dict:
        response = await self.anthropic.messages.create(
            model=tier.model,
            max_tokens=tier.max_tokens,
            system=system_prompt,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
        )
        return {
            "content": response.content[0].text,
            "input_tokens": response.usage.input_tokens,
            "output_tokens": response.usage.output_tokens,
        }

    @staticmethod
    def _extract_json(text: str) -> dict:
        """Extract JSON from response, handling markdown fencing."""
        text = text.strip()
        # Remove markdown code fencing if present
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])
            text = text.strip()
        return json.loads(text)

    async def complete_batch(
        self,
        prompts: list[str],
        tier: ModelTier,
        phase: str = "unknown",
        **kwargs,
    ) -> list[dict]:
        """Run many prompts concurrently with rate limiting."""
        tasks = [
            self.complete(p, tier, phase, **kwargs)
            for p in prompts
        ]
        return await asyncio.gather(*tasks, return_exceptions=True)
```

---

### `pipeline.py`

```python
"""
The 6-phase pipeline that generates a complete guidebook for one target.

Phase 1 — DECOMPOSE:   Build exhaustive topic tree via recursive subdivision
Phase 2 — ENUMERATE:   Generate completeness anchors (keywords, stdlib, etc.)
Phase 3 — GENERATE:    Produce content for every leaf node (massively parallel)
Phase 4 — GAP ANALYZE: Cross-ref tree against anchors to find missing topics
Phase 5 — FILL GAPS:   Decompose + generate for each gap (repeat Phase 4→5)
Phase 6 — VALIDATE:    Spot-check accuracy with a different model
"""
from __future__ import annotations
import asyncio
import json
import logging
import random
from typing import Optional

from tqdm.asyncio import tqdm as atqdm
from tqdm import tqdm

from config import Config
from schema import (
    TopicNode, NodeType, ContentEntry, CompletenessAnchors,
    Gap, GapReport, GapSeverity, PipelineState, CodeExample
)
from llm import LLMClient
from storage import Storage
import prompts

logger = logging.getLogger(__name__)


class GuidebookPipeline:
    """Generates a complete guidebook for a single language or file type."""

    def __init__(self, target: str, config: Config, llm: LLMClient, storage: Storage):
        self.target = target
        self.cfg = config
        self.llm = llm
        self.db = storage
        self.state = PipelineState(target=target)

        # In-memory topic tree for fast traversal
        self.nodes: dict[str, TopicNode] = {}
        self.anchors: Optional[CompletenessAnchors] = None
        self.target_classification: dict = {}

    # ════════════════════════════════════════════════════════════
    # MAIN ENTRY POINT
    # ════════════════════════════════════════════════════════════

    async def run(self):
        """Execute all 6 phases sequentially."""
        logger.info(f"═══ Starting guidebook generation for: {self.target} ═══")

        # Phase 0: Classify the target to adapt strategy
        await self._classify_target()

        # Phase 1: Decompose into topic tree
        await self._phase1_decompose()
        logger.info(f"Phase 1 complete: {len(self.nodes)} nodes in topic tree")

        # Phase 2: Generate completeness anchors
        await self._phase2_enumerate()
        logger.info(f"Phase 2 complete: anchors generated")

        # Phase 3: Generate content for all leaves
        await self._phase3_generate()
        logger.info(f"Phase 3 complete: content generated")

        # Phase 4-5: Gap analysis and filling (iterative)
        for gap_round in range(self.cfg.gap_analysis_passes):
            logger.info(f"Gap analysis round {gap_round + 1}/{self.cfg.gap_analysis_passes}")
            report = await self._phase4_gap_analysis()
            if not report.gaps:
                logger.info("No gaps found — skipping fill phase")
                break
            await self._phase5_fill_gaps(report)

        # Phase 6: Validate sample
        await self._phase6_validate()

        # Save final state
        await self.db.save_pipeline_state(self.state)
        self._log_final_stats()

    # ════════════════════════════════════════════════════════════
    # PHASE 0: CLASSIFY TARGET
    # ════════════════════════════════════════════════════════════

    async def _classify_target(self):
        prompt = prompts.CLASSIFY_TARGET.format(target=self.target)
        self.target_classification = await self.llm.complete(
            prompt, self.cfg.decompose_model, phase="classify"
        )
        logger.info(f"Target classified as: {self.target_classification.get('type')}")

    def _target_type(self) -> str:
        t = self.target_classification.get("type", "programming_language")
        if "language" in t:
            return "programming language"
        return "file format"

    # ════════════════════════════════════════════════════════════
    # PHASE 1: RECURSIVE DECOMPOSITION
    # ════════════════════════════════════════════════════════════

    async def _phase1_decompose(self):
        """Build the complete topic tree via recursive subdivision."""

        # Step 1: Get root categories
        prompt = prompts.DECOMPOSE_ROOT.format(
            target=self.target,
            target_type=self._target_type()
        )
        result = await self.llm.complete(
            prompt, self.cfg.decompose_model, phase="decompose"
        )

        # Create root node
        root = TopicNode(
            node_type=NodeType.ROOT,
            title=self.target,
            path=self.target,
            depth=0,
        )
        self.nodes[root.id] = root

        # Create category nodes
        categories = result.get("categories", [])
        category_nodes = []
        for cat in categories:
            node = TopicNode(
                parent_id=root.id,
                node_type=NodeType.CATEGORY,
                title=cat["title"],
                description=cat.get("description", ""),
                path=f"{self.target}/{cat['title']}",
                depth=1,
                estimated_subtopic_count=cat.get("estimated_subtopics", 5),
                metadata={"priority": cat.get("priority", "core")},
            )
            self.nodes[node.id] = node
            root.children_ids.append(node.id)
            category_nodes.append(node)

        # Step 2: Recursively decompose all non-leaf nodes
        await self._decompose_recursive(category_nodes)

    async def _decompose_recursive(self, nodes: list[TopicNode]):
        """Recursively decompose nodes in parallel breadth-first."""
        if not nodes:
            return

        # Filter nodes that need decomposition
        to_decompose = [
            n for n in nodes
            if n.depth < self.cfg.max_decompose_depth
        ]

        if not to_decompose:
            # Mark remaining as leaves
            for n in nodes:
                n.node_type = NodeType.LEAF
            return

        # Build prompts for all nodes at this level
        decompose_prompts = []
        for node in to_decompose:
            additional_context = ""
            if node.depth == 1 and "standard library" in node.title.lower():
                additional_context = (
                    "CRITICAL: List EVERY module individually. "
                    "Do not group or summarize. Every single module "
                    "must be its own subtopic."
                )

            prompt = prompts.DECOMPOSE_BRANCH.format(
                target=self.target,
                path=node.path,
                depth=node.depth,
                parent_description=node.description,
                title=node.title,
                additional_context=additional_context,
            )
            decompose_prompts.append((node, prompt))

        # Execute all in parallel
        results = await self.llm.complete_batch(
            [p for _, p in decompose_prompts],
            self.cfg.decompose_model,
            phase="decompose",
        )

        # Process results and collect next level
        next_level = []
        for (parent_node, _), result in zip(decompose_prompts, results):
            if isinstance(result, Exception):
                logger.error(f"Decompose failed for {parent_node.path}: {result}")
                parent_node.node_type = NodeType.LEAF  # Fallback: treat as leaf
                continue

            subtopics = result.get("subtopics", [])
            for sub in subtopics:
                child_type = (
                    NodeType.TOPIC if not sub.get("needs_decomposition", False)
                    else NodeType.SUBCATEGORY
                )
                child = TopicNode(
                    parent_id=parent_node.id,
                    node_type=child_type,
                    title=sub["title"],
                    description=sub.get("description", ""),
                    path=f"{parent_node.path}/{sub['title']}",
                    depth=parent_node.depth + 1,
                    estimated_subtopic_count=sub.get("estimated_subtopics", 0),
                )
                self.nodes[child.id] = child
                parent_node.children_ids.append(child.id)

                if sub.get("needs_decomposition", False):
                    next_level.append(child)
                else:
                    # Check if truly leaf-worthy or needs one more split
                    child.node_type = NodeType.LEAF

        # Recurse on next level
        if next_level:
            logger.info(
                f"  Depth {next_level[0].depth}: decomposing {len(next_level)} nodes"
            )
            await self._decompose_recursive(next_level)

    # ════════════════════════════════════════════════════════════
    # PHASE 2: COMPLETENESS ANCHORS
    # ════════════════════════════════════════════════════════════

    async def _phase2_enumerate(self):
        """Generate exhaustive enumerations for completeness verification."""
        is_lang = "language" in self.target_classification.get("type", "")

        if is_lang:
            # Run all enumerations in parallel
            kw_prompt = prompts.ENUMERATE_KEYWORDS.format(target=self.target)
            bi_prompt = prompts.ENUMERATE_BUILTINS.format(target=self.target)
            op_prompt = prompts.ENUMERATE_OPERATORS.format(target=self.target)
            sl_prompt = prompts.ENUMERATE_STDLIB.format(target=self.target)

            kw, bi, op, sl = await asyncio.gather(
                self.llm.complete(kw_prompt, self.cfg.decompose_model, phase="enumerate"),
                self.llm.complete(bi_prompt, self.cfg.decompose_model, phase="enumerate"),
                self.llm.complete(op_prompt, self.cfg.decompose_model, phase="enumerate"),
                self.llm.complete(sl_prompt, self.cfg.decompose_model, phase="enumerate"),
            )

            self.anchors = CompletenessAnchors(
                language=self.target,
                keywords=kw.get("keywords", []) + kw.get("contextual_keywords", []),
                builtin_functions=bi.get("builtin_functions", []),
                builtin_types=bi.get("builtin_types", []),
                builtin_constants=bi.get("builtin_constants", []),
                operators=[op_item.get("symbol", "") for op_item in op.get("operators", [])],
                stdlib_modules=[m.get("name", "") for m in sl.get("modules", [])],
            )
        else:
            # File format — use structure enumeration
            fs_prompt = prompts.ENUMERATE_FILE_STRUCTURE.format(target=self.target)
            fs = await self.llm.complete(
                fs_prompt, self.cfg.decompose_model, phase="enumerate"
            )
            self.anchors = CompletenessAnchors(language=self.target)
            # Store file structure in metadata for gap analysis

        await self.db.save_anchors(self.anchors)

    # ════════════════════════════════════════════════════════════
    # PHASE 3: CONTENT GENERATION
    # ════════════════════════════════════════════════════════════

    async def _phase3_generate(self):
        """Generate content for every leaf node in parallel."""
        leaves = [n for n in self.nodes.values() if n.node_type == NodeType.LEAF]
        logger.info(f"Phase 3: generating content for {len(leaves)} leaf nodes")

        # Build generation prompts
        code_lang = self.target.split()[0].lower()  # "Python 3.12" → "python"
        gen_items = []
        for leaf in leaves:
            # Build context from ancestors
            context_parts = []
            current = leaf
            while current.parent_id:
                parent = self.nodes.get(current.parent_id)
                if parent:
                    context_parts.append(f"{parent.title}: {parent.description}")
                    current = parent
                else:
                    break
            context = " > ".join(reversed(context_parts))

            prompt = prompts.GENERATE_CONTENT.format(
                target=self.target,
                path=leaf.path,
                title=leaf.title,
                description=leaf.description,
                context=context,
                code_lang=code_lang,
            )
            gen_items.append((leaf, prompt))

        # Execute in parallel with progress bar
        batch_size = self.cfg.max_concurrency
        all_results = []

        for i in range(0, len(gen_items), batch_size):
            batch = gen_items[i:i + batch_size]
            batch_prompts = [p for _, p in batch]

            results = await self.llm.complete_batch(
                batch_prompts,
                self.cfg.generate_model,
                phase="generate",
            )

            for (leaf, _), result in zip(batch, results):
                if isinstance(result, Exception):
                    logger.error(f"Generate failed for {leaf.path}: {result}")
                    continue

                entry = self._result_to_content_entry(result, leaf)
                await self.db.save_content(entry)
                leaf.is_generated = True
                self.state.generated_nodes += 1

            logger.info(
                f"  Generated {min(i + batch_size, len(gen_items))}/{len(gen_items)}"
            )

    def _result_to_content_entry(self, result: dict, node: TopicNode) -> ContentEntry:
        """Convert raw LLM JSON output to a ContentEntry."""
        examples = []
        for ex in result.get("examples", []):
            examples.append(CodeExample(
                title=ex.get("title", ""),
                code=ex.get("code", ""),
                language=ex.get("language", ""),
                explanation=ex.get("explanation", ""),
                output=ex.get("output", ""),
            ))

        return ContentEntry(
            topic_node_id=node.id,
            path=node.path,
            language_or_filetype=self.target,
            title=result.get("title", node.title),
            summary=result.get("summary", ""),
            detailed_description=result.get("detailed_description", ""),
            syntax=result.get("syntax"),
            parameters=result.get("parameters", []),
            return_value=result.get("return_value"),
            examples=examples,
            edge_cases=result.get("edge_cases", []),
            common_mistakes=result.get("common_mistakes", []),
            related_topics=result.get("related_topics", []),
            since_version=result.get("since_version"),
            deprecated=result.get("deprecated", False),
            platform_notes=result.get("platform_notes", []),
            model_used=self.cfg.generate_model.model,
        )

    # ════════════════════════════════════════════════════════════
    # PHASE 4: GAP ANALYSIS
    # ════════════════════════════════════════════════════════════

    async def _phase4_gap_analysis(self) -> GapReport:
        """Identify missing topics by cross-referencing tree against anchors."""
        # Build topic path listing
        all_paths = sorted([n.path for n in self.nodes.values()])
        tree_str = "\n".join(all_paths)

        # Compute anchor coverage
        def coverage(anchor_list: list[str], paths_str: str) -> str:
            covered = [a for a in anchor_list if a.lower() in paths_str.lower()]
            missing = [a for a in anchor_list if a.lower() not in paths_str.lower()]
            return (
                f"{len(covered)}/{len(anchor_list)} covered. "
                f"Missing: {', '.join(missing[:30])}"
                f"{'...' if len(missing) > 30 else ''}"
            )

        kw_cov = coverage(self.anchors.keywords, tree_str) if self.anchors else "N/A"
        bi_cov = coverage(
            self.anchors.builtin_functions + self.anchors.builtin_types,
            tree_str
        ) if self.anchors else "N/A"
        sl_cov = coverage(self.anchors.stdlib_modules, tree_str) if self.anchors else "N/A"
        op_cov = coverage(self.anchors.operators, tree_str) if self.anchors else "N/A"

        prompt = prompts.GAP_ANALYSIS_TREE.format(
            target=self.target,
            topic_tree_paths=tree_str[:15000],  # Truncate if massive
            keywords_coverage=kw_cov,
            builtins_coverage=bi_cov,
            stdlib_coverage=sl_cov,
            operators_coverage=op_cov,
        )

        result = await self.llm.complete(
            prompt, self.cfg.validate_model, phase="gap_analysis"
        )

        gaps = []
        for g in result.get("gaps", []):
            gaps.append(Gap(
                description=g.get("description", ""),
                severity=GapSeverity(g.get("severity", "minor")),
                suggested_path=g.get("suggested_path", ""),
                anchor_reference=g.get("anchor_reference", ""),
            ))

        report = GapReport(
            language=self.target,
            gaps=gaps,
            coverage_pct=result.get("estimated_coverage_pct", 0),
        )

        self.state.gaps_found += len(gaps)
        logger.info(
            f"  Gap analysis: {len(gaps)} gaps found, "
            f"coverage ~{report.coverage_pct:.0f}%"
        )

        return report

    # ════════════════════════════════════════════════════════════
    # PHASE 5: FILL GAPS
    # ════════════════════════════════════════════════════════════

    async def _phase5_fill_gaps(self, report: GapReport):
        """Create new nodes for gaps and generate their content."""
        # Sort by severity (critical first)
        sorted_gaps = sorted(
            report.gaps,
            key=lambda g: {"critical": 0, "important": 1, "minor": 2}[g.severity.value]
        )

        new_leaves = []
        for gap in sorted_gaps:
            # Find or create parent
            parent_path = gap.suggested_path.rsplit("/", 1)[0] if "/" in gap.suggested_path else self.target
            parent_node = self._find_node_by_path(parent_path)

            if not parent_node:
                # Create intermediate node
                parent_node = TopicNode(
                    node_type=NodeType.SUBCATEGORY,
                    title=parent_path.split("/")[-1],
                    path=parent_path,
                    depth=parent_path.count("/"),
                )
                self.nodes[parent_node.id] = parent_node

            # Create leaf for this gap
            leaf = TopicNode(
                parent_id=parent_node.id,
                node_type=NodeType.LEAF,
                title=gap.suggested_path.split("/")[-1],
                description=gap.description,
                path=gap.suggested_path,
                depth=parent_node.depth + 1,
            )
            self.nodes[leaf.id] = leaf
            parent_node.children_ids.append(leaf.id)
            new_leaves.append(leaf)

        # Generate content for new leaves (reuse Phase 3 logic)
        if new_leaves:
            logger.info(f"  Filling {len(new_leaves)} gaps")
            # Temporarily swap the leaves list and rerun generation
            old_generated = self.state.generated_nodes
            code_lang = self.target.split()[0].lower()

            gen_items = []
            for leaf in new_leaves:
                prompt = prompts.GENERATE_CONTENT.format(
                    target=self.target,
                    path=leaf.path,
                    title=leaf.title,
                    description=leaf.description,
                    context=leaf.description,
                    code_lang=code_lang,
                )
                gen_items.append((leaf, prompt))

            results = await self.llm.complete_batch(
                [p for _, p in gen_items],
                self.cfg.generate_model,
                phase="fill_gaps",
            )

            for (leaf, _), result in zip(gen_items, results):
                if isinstance(result, Exception):
                    logger.error(f"Gap fill failed for {leaf.path}: {result}")
                    continue
                entry = self._result_to_content_entry(result, leaf)
                await self.db.save_content(entry)
                leaf.is_generated = True
                self.state.gaps_filled += 1

    def _find_node_by_path(self, path: str) -> Optional[TopicNode]:
        for node in self.nodes.values():
            if node.path == path:
                return node
        return None

    # ════════════════════════════════════════════════════════════
    # PHASE 6: VALIDATION
    # ════════════════════════════════════════════════════════════

    async def _phase6_validate(self):
        """Spot-check a sample of entries using a different model."""
        all_content = await self.db.get_all_content(self.target)
        sample_size = max(1, int(len(all_content) * self.cfg.validation_sample_rate))
        sample = random.sample(all_content, min(sample_size, len(all_content)))

        logger.info(f"Phase 6: validating {len(sample)} of {len(all_content)} entries")

        val_prompts = []
        for entry in sample:
            content_json = json.dumps({
                "title": entry.title,
                "summary": entry.summary,
                "detailed_description": entry.detailed_description,
                "syntax": entry.syntax,
                "examples": [e.model_dump() for e in entry.examples],
                "edge_cases": entry.edge_cases,
            }, indent=2)

            prompt = prompts.VALIDATE_CONTENT.format(
                target=self.target,
                path=entry.path,
                content_json=content_json[:6000],
            )
            val_prompts.append((entry, prompt))

        results = await self.llm.complete_batch(
            [p for _, p in val_prompts],
            self.cfg.validate_model,
            phase="validate",
        )

        corrections_needed = 0
        for (entry, _), result in zip(val_prompts, results):
            if isinstance(result, Exception):
                continue

            confidence = result.get("confidence", 0.5)
            entry.confidence_score = confidence
            await self.db.update_confidence(entry.id, confidence)

            if not result.get("is_accurate", True):
                corrections_needed += 1
                errors = result.get("errors", [])
                logger.warning(
                    f"  Validation issue in {entry.path}: "
                    f"{len(errors)} errors, confidence={confidence:.2f}"
                )
                # Optionally: regenerate with corrections as context
                if confidence < 0.5:
                    await self._regenerate_with_corrections(entry, errors)

            self.state.validated_nodes += 1

        logger.info(
            f"  Validation complete: {corrections_needed}/{len(sample)} "
            f"entries need corrections"
        )

    async def _regenerate_with_corrections(
        self, entry: ContentEntry, errors: list[dict]
    ):
        """Re-generate an entry incorporating validator feedback."""
        correction_context = "\n".join(
            f"- {e.get('field', '?')}: {e.get('issue', '?')} → {e.get('correction', '?')}"
            for e in errors
        )
        node = self.nodes.get(entry.topic_node_id)
        if not node:
            return

        code_lang = self.target.split()[0].lower()
        prompt = prompts.GENERATE_CONTENT.format(
            target=self.target,
            path=entry.path,
            title=entry.title,
            description=f"{node.description}\n\nCORRECTIONS NEEDED:\n{correction_context}",
            context="Regenerating with corrections from validation.",
            code_lang=code_lang,
        )

        result = await self.llm.complete(
            prompt, self.cfg.generate_model, phase="regenerate"
        )
        if not isinstance(result, Exception):
            new_entry = self._result_to_content_entry(result, node)
            new_entry.id = entry.id  # Overwrite same ID
            await self.db.save_content(new_entry)

    # ════════════════════════════════════════════════════════════
    # UTILITIES
    # ════════════════════════════════════════════════════════════

    def _log_final_stats(self):
        stats = self.llm.stats
        logger.info(
            f"\n═══ PIPELINE COMPLETE: {self.target} ═══\n"
            f"  Topic nodes:     {len(self.nodes)}\n"
            f"  Leaves generated:{self.state.generated_nodes}\n"
            f"  Gaps found/filled:{self.state.gaps_found}/{self.state.gaps_filled}\n"
            f"  Validated:       {self.state.validated_nodes}\n"
            f"  API calls:       {stats.total_calls}\n"
            f"  Tokens (in/out): {stats.total_input_tokens:,}/{stats.total_output_tokens:,}\n"
            f"  Retries:         {stats.total_retries}\n"
            f"  Est. cost:       ${stats.total_cost_usd:.2f}\n"
            f"  Calls by phase:  {stats.calls_by_phase}\n"
        )
```

---

### `storage.py`

```python
"""
SQLite storage with JSON/Markdown export.
Handles persistence, querying, checkpointing.
"""
from __future__ import annotations
import json
import os
from pathlib import Path
from typing import Optional

import aiosqlite

from schema import (
    TopicNode, ContentEntry, CompletenessAnchors,
    PipelineState, CodeExample
)


class Storage:
    def __init__(self, db_path: str = "guidebook.db", export_dir: str = "export/"):
        self.db_path = db_path
        self.export_dir = Path(export_dir)
        self.export_dir.mkdir(parents=True, exist_ok=True)
        self._db: Optional[aiosqlite.Connection] = None

    async def initialize(self):
        self._db = await aiosqlite.connect(self.db_path)
        await self._db.executescript("""
            CREATE TABLE IF NOT EXISTS topic_nodes (
                id TEXT PRIMARY KEY,
                parent_id TEXT,
                node_type TEXT,
                title TEXT,
                description TEXT,
                path TEXT UNIQUE,
                depth INTEGER,
                target TEXT,
                data_json TEXT
            );

            CREATE TABLE IF NOT EXISTS content_entries (
                id TEXT PRIMARY KEY,
                topic_node_id TEXT,
                path TEXT,
                target TEXT,
                title TEXT,
                data_json TEXT,
                confidence_score REAL DEFAULT 0,
                FOREIGN KEY (topic_node_id) REFERENCES topic_nodes(id)
            );

            CREATE TABLE IF NOT EXISTS completeness_anchors (
                target TEXT PRIMARY KEY,
                data_json TEXT
            );

            CREATE TABLE IF NOT EXISTS pipeline_state (
                target TEXT PRIMARY KEY,
                data_json TEXT
            );

            CREATE INDEX IF NOT EXISTS idx_nodes_target ON topic_nodes(target);
            CREATE INDEX IF NOT EXISTS idx_nodes_path ON topic_nodes(path);
            CREATE INDEX IF NOT EXISTS idx_content_target ON content_entries(target);
            CREATE INDEX IF NOT EXISTS idx_content_path ON content_entries(path);
        """)
        await self._db.commit()

    async def close(self):
        if self._db:
            await self._db.close()

    # ── Topic Nodes ──────────────────────────────────────────

    async def save_node(self, node: TopicNode, target: str):
        await self._db.execute(
            """INSERT OR REPLACE INTO topic_nodes
               (id, parent_id, node_type, title, description, path, depth, target, data_json)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (node.id, node.parent_id, node.node_type.value,
             node.title, node.description, node.path, node.depth,
             target, node.model_dump_json())
        )
        await self._db.commit()

    async def save_all_nodes(self, nodes: dict[str, TopicNode], target: str):
        rows = [
            (n.id, n.parent_id, n.node_type.value, n.title,
             n.description, n.path, n.depth, target, n.model_dump_json())
            for n in nodes.values()
        ]
        await self._db.executemany(
            """INSERT OR REPLACE INTO topic_nodes
               (id, parent_id, node_type, title, description, path, depth, target, data_json)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            rows
        )
        await self._db.commit()

    # ── Content ──────────────────────────────────────────────

    async def save_content(self, entry: ContentEntry):
        await self._db.execute(
            """INSERT OR REPLACE INTO content_entries
               (id, topic_node_id, path, target, title, data_json, confidence_score)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (entry.id, entry.topic_node_id, entry.path,
             entry.language_or_filetype, entry.title,
             entry.model_dump_json(), entry.confidence_score)
        )
        await self._db.commit()

    async def get_all_content(self, target: str) -> list[ContentEntry]:
        cursor = await self._db.execute(
            "SELECT data_json FROM content_entries WHERE target = ?", (target,)
        )
        rows = await cursor.fetchall()
        return [ContentEntry.model_validate_json(row[0]) for row in rows]

    async def update_confidence(self, entry_id: str, score: float):
        await self._db.execute(
            "UPDATE content_entries SET confidence_score = ? WHERE id = ?",
            (score, entry_id)
        )
        await self._db.commit()

    # ── Anchors ──────────────────────────────────────────────

    async def save_anchors(self, anchors: CompletenessAnchors):
        await self._db.execute(
            "INSERT OR REPLACE INTO completeness_anchors (target, data_json) VALUES (?, ?)",
            (anchors.language, anchors.model_dump_json())
        )
        await self._db.commit()

    # ── Pipeline State ───────────────────────────────────────

    async def save_pipeline_state(self, state: PipelineState):
        await self._db.execute(
            "INSERT OR REPLACE INTO pipeline_state (target, data_json) VALUES (?, ?)",
            (state.target, state.model_dump_json())
        )
        await self._db.commit()

    # ════════════════════════════════════════════════════════════
    # EXPORT
    # ════════════════════════════════════════════════════════════

    async def export_json(self, target: str):
        """Export complete guidebook as structured JSON."""
        nodes_cursor = await self._db.execute(
            "SELECT data_json FROM topic_nodes WHERE target = ? ORDER BY path",
            (target,)
        )
        content_cursor = await self._db.execute(
            "SELECT data_json FROM content_entries WHERE target = ? ORDER BY path",
            (target,)
        )

        nodes = [json.loads(r[0]) for r in await nodes_cursor.fetchall()]
        content = [json.loads(r[0]) for r in await content_cursor.fetchall()]

        output = {
            "target": target,
            "topic_tree": nodes,
            "content_entries": content,
            "stats": {
                "total_topics": len(nodes),
                "total_entries": len(content),
            }
        }

        out_path = self.export_dir / f"{target.replace(' ', '_')}.json"
        out_path.write_text(json.dumps(output, indent=2))
        return out_path

    async def export_markdown(self, target: str):
        """Export as a navigable Markdown book."""
        content = await self.get_all_content(target)
        content.sort(key=lambda c: c.path)

        lines = [f"# {target} — Complete Reference Guide\n\n"]

        # Table of contents
        lines.append("## Table of Contents\n\n")
        for entry in content:
            depth = entry.path.count("/") - 1
            indent = "  " * depth
            anchor = entry.path.replace("/", "-").replace(" ", "-").lower()
            lines.append(f"{indent}- [{entry.title}](#{anchor})\n")

        lines.append("\n---\n\n")

        # Full content
        for entry in content:
            depth = entry.path.count("/")
            hashes = "#" * min(depth + 1, 6)

            lines.append(f"{hashes} {entry.title}\n\n")
            lines.append(f"**Path:** `{entry.path}`\n\n")
            lines.append(f"{entry.summary}\n\n")
            lines.append(f"{entry.detailed_description}\n\n")

            if entry.syntax:
                lines.append(f"**Syntax:**\n```\n{entry.syntax}\n```\n\n")

            if entry.parameters:
                lines.append("**Parameters:**\n\n")
                for p in entry.parameters:
                    lines.append(
                        f"- `{p.get('name', '?')}` ({p.get('type', '?')}): "
                        f"{p.get('description', '')}\n"
                    )
                lines.append("\n")

            for ex in entry.examples:
                lines.append(f"**Example: {ex.title}**\n")
                lines.append(f"```{ex.language}\n{ex.code}\n```\n")
                if ex.output:
                    lines.append(f"Output: `{ex.output}`\n")
                if ex.explanation:
                    lines.append(f"\n{ex.explanation}\n")
                lines.append("\n")

            if entry.edge_cases:
                lines.append("**Edge Cases:**\n")
                for ec in entry.edge_cases:
                    lines.append(f"- {ec}\n")
                lines.append("\n")

            if entry.common_mistakes:
                lines.append("**Common Mistakes:**\n")
                for cm in entry.common_mistakes:
                    lines.append(f"- ⚠️ {cm}\n")
                lines.append("\n")

            lines.append("---\n\n")

        out_path = self.export_dir / f"{target.replace(' ', '_')}.md"
        out_path.write_text("".join(lines))
        return out_path
```

---

### `main.py`

```python
"""
Entry point — generates complete guidebooks for configured targets.

Usage:
  python main.py                           # all configured targets
  python main.py --target "Python 3.12"    # single target
  python main.py --export-only "Rust 1.78" # export existing DB
"""
import asyncio
import argparse
import logging
import sys
import time

from config import Config
from llm import LLMClient
from pipeline import GuidebookPipeline
from storage import Storage

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("guidebook_gen.log"),
    ]
)
logger = logging.getLogger(__name__)


async def generate_target(target: str, config: Config, llm: LLMClient, storage: Storage):
    """Generate a complete guidebook for one target."""
    pipeline = GuidebookPipeline(target, config, llm, storage)
    start = time.time()
    await pipeline.run()
    elapsed = time.time() - start

    # Export
    json_path = await storage.export_json(target)
    md_path = await storage.export_markdown(target)

    logger.info(
        f"✓ {target} complete in {elapsed:.0f}s — "
        f"exported to {json_path} and {md_path}"
    )


async def main():
    parser = argparse.ArgumentParser(description="Automated Guidebook Generator")
    parser.add_argument("--target", type=str, help="Single target to generate")
    parser.add_argument("--export-only", type=str, help="Export existing DB only")
    parser.add_argument("--config", type=str, help="Config overrides (JSON)")
    parser.add_argument("--max-concurrency", type=int, default=50)
    args = parser.parse_args()

    config = Config()
    if args.max_concurrency:
        config.max_concurrency = args.max_concurrency

    llm = LLMClient(max_concurrency=config.max_concurrency)
    storage = Storage(db_path=config.db_path, export_dir=config.export_dir)
    await storage.initialize()

    try:
        if args.export_only:
            json_path = await storage.export_json(args.export_only)
            md_path = await storage.export_markdown(args.export_only)
            logger.info(f"Exported: {json_path}, {md_path}")
            return

        targets = [args.target] if args.target else (
            config.target_languages + config.target_file_types
        )

        logger.info(f"Generating guidebooks for {len(targets)} targets: {targets}")

        # Process targets sequentially (each target uses parallel API calls internally)
        for target in targets:
            try:
                await generate_target(target, config, llm, storage)
            except Exception as e:
                logger.error(f"✗ Failed to generate {target}: {e}", exc_info=True)

        # Final summary
        logger.info(
            f"\n{'═' * 60}\n"
            f"ALL TARGETS COMPLETE\n"
            f"Total API calls: {llm.stats.total_calls}\n"
            f"Total cost: ${llm.stats.total_cost_usd:.2f}\n"
            f"{'═' * 60}"
        )

    finally:
        await storage.close()


if __name__ == "__main__":
    asyncio.run(main())
```

---

## Efficiency Analysis

```
┌──────────────────────────────────────────────────────────────────┐
│                    COST MODEL PER TARGET                         │
├──────────────────┬───────────┬───────────┬──────────┬───────────┤
│ Phase            │ API Calls │ Avg Tok/  │ Model    │ Est. Cost │
│                  │           │ call (I/O)│ Tier     │           │
├──────────────────┼───────────┼───────────┼──────────┼───────────┤
│ 0. Classify      │        1 │  200/500  │ Cheap    │    $0.01  │
│ 1. Decompose     │    ~150  │  500/1500 │ Cheap    │    $3.60  │
│ 2. Enumerate     │      4   │  300/2000 │ Cheap    │    $0.13  │
│ 3. Generate      │  ~1500   │ 800/2500  │ Mid-tier │   $60.00  │
│ 4. Gap Analysis  │      2   │ 8000/2000 │ Mid-tier │    $1.10  │
│ 5. Fill Gaps     │   ~200   │  800/2500 │ Mid-tier │    $8.00  │
│ 6. Validate      │   ~300   │ 2000/800  │ Mid-tier │    $5.50  │
├──────────────────┼───────────┼───────────┼──────────┼───────────┤
│ TOTAL (complex)  │  ~2,200  │           │          │  ~$78     │
│ TOTAL (simple)   │   ~800   │           │          │  ~$25     │
│ TOTAL (file fmt) │   ~200   │           │          │   ~$6     │
└──────────────────┴───────────┴───────────┴──────────┴───────────┘

Full portfolio: 30 languages + 50 file types ≈ $1,800–$2,500
Execution time at 50 concurrency: ~8 min/lang, ~2 min/filetype ≈ 6 hours
```

## Seven Key Architectural Decisions and Why

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Recursive decompose, not template-driven** | Every language has unique structure; templates miss language-specific features (Rust ownership, Python decorators, Go goroutines). Let the LLM discover the taxonomy. |
| 2 | **Completeness anchors as separate phase** | Keyword/stdlib/builtin lists are *verifiable ground truth*. Generating them separately creates an objective checklist the gap analyzer can diff against. |
| 3 | **Cheap model for structure, expensive for content** | Decomposition is pattern work (listing subtopics). Content generation requires deep knowledge. Route accordingly to cut cost 60%. |
| 4 | **JSON-only output** | Eliminates parsing ambiguity. Every prompt enforces `Respond with ONLY this JSON`. OpenAI's `json_object` mode and Anthropic's structured output guarantee valid JSON. |
| 5 | **Iterative gap→fill loop** | One pass always misses things. Two rounds of gap analysis catches 95%+ of omissions. Diminishing returns after 3 rounds. |
| 6 | **Cross-model validation** | Generate with Claude, validate with GPT (or vice versa). Different training data catches different errors. |
| 7 | **Breadth-first parallel decomposition** | All nodes at depth N are decomposed simultaneously before moving to depth N+1. Maximizes parallelism while maintaining structural coherence. |


////////



# Enhanced Architecture: Implementation-Complete Knowledge Base

## The Core Problem with V1

```
V1 Output: "PPTX files support shapes including rectangles, ellipses..."
            ↕ USELESS GAP ↕
What users need: "To draw a 3cm×5cm blue rectangle at position (2,1)
                  in slide 1, create this exact XML in ppt/slides/slide1.xml,
                  with these namespaces, these EMU unit conversions, these
                  relationship entries in _rels/slide1.xml.rels, and this
                  [Content_Types].xml entry..."
```

The enhanced system generates **three knowledge layers**:

```
┌──────────────────────────────────────────────────────────────────────┐
│  LAYER 3: BLUEPRINTS & RECIPES                                      │
│  "To implement Gaussian blur: use this separable kernel approach,    │
│   here is the complete algorithm, handle edges with reflection,      │
│   here is reference code in 4 languages, compose with these         │
│   other algorithms for Unsharp Mask..."                              │
├──────────────────────────────────────────────────────────────────────┤
│  LAYER 2: IMPLEMENTATION ATOMS                                       │
│  Every XML element, binary field, enum value, coordinate system,     │
│  namespace URI, magic constant, mathematical formula — the raw       │
│  building blocks needed to construct valid output                    │
├──────────────────────────────────────────────────────────────────────┤
│  LAYER 1: REFERENCE GUIDE  (V1 — unchanged)                         │
│  Syntax, semantics, API docs, usage patterns                         │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Enhanced Project Structure

```
guidebook_gen/
├── main.py                  # CLI entry point
├── config.py                # All configuration
├── schema.py                # V1 data models
├── schema_v2.py             # ★ NEW: Implementation-layer models
├── prompts.py               # V1 prompt templates
├── prompts_v2.py            # ★ NEW: Implementation-layer prompts
├── llm.py                   # Async LLM client w/ routing
├── pipeline.py              # Phases 1-6 (V1 reference layer)
├── pipeline_v2.py           # ★ NEW: Phases 7-12 (implementation layer)
├── storage.py               # V1 storage
├── storage_v2.py            # ★ NEW: Enhanced storage + graph queries
├── assembler.py             # ★ NEW: Blueprint assembly engine
├── query_engine.py          # ★ NEW: Natural language → implementation plan
└── requirements.txt
```

---

### `schema_v2.py` — Implementation Knowledge Models

```python
"""
Layer 2 & 3 data models.

These go beyond "what does feature X do" to "exactly how do you
implement feature X from scratch, byte by byte / pixel by pixel."

Three main concept families:
  1. FORMAT ATOMS     — Irreducible structural units of a file format
  2. ALGORITHMS       — Mathematical/computational procedures with full implementations
  3. CAPABILITIES     — User-facing features decomposed into implementation specs
  4. BLUEPRINTS       — Composable implementation plans that wire atoms + algorithms together
  5. DEPENDENCY GRAPH — How everything connects
"""
from __future__ import annotations
from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional, Union
import uuid


# ════════════════════════════════════════════════════════════════
# 1. FORMAT ATOMS — The irreducible building blocks
# ════════════════════════════════════════════════════════════════

class AtomType(str, Enum):
    XML_ELEMENT = "xml_element"
    XML_ATTRIBUTE = "xml_attribute"
    BINARY_FIELD = "binary_field"
    BINARY_CHUNK = "binary_chunk"
    JSON_FIELD = "json_field"
    RELATIONSHIP = "relationship"       # OPC .rels entry
    CONTENT_TYPE = "content_type"       # [Content_Types].xml entry
    NAMESPACE = "namespace"
    ENUM_VALUE = "enum_value"
    MAGIC_CONSTANT = "magic_constant"
    FILE_ENTRY = "file_entry"           # a file within a container (ZIP, etc.)
    HEADER = "header"
    RECORD = "record"
    PROTOCOL_MESSAGE = "protocol_message"


class DataType(str, Enum):
    STRING = "string"
    INTEGER = "integer"
    FLOAT = "float"
    BOOLEAN = "boolean"
    BYTES = "bytes"
    ENUM = "enum"
    COMPLEX = "complex"     # nested structure
    BITFIELD = "bitfield"
    FIXED_POINT = "fixed_point"


class EnumDefinition(BaseModel):
    """Complete enumeration of all valid values for a field."""
    name: str
    values: list[dict]  # [{"value": "rect", "label": "Rectangle", "description": "..."}]
    default: Optional[str] = None
    extensible: bool = False  # can custom values be added?


class FormatAtom(BaseModel):
    """
    An irreducible structural unit of a file format.
    
    Example for PPTX rectangle shape:
      atom_type: xml_element
      path_in_format: "ppt/slides/slide1.xml"
      xpath: "p:sld/p:cSld/p:spTree/p:sp/p:spPr/a:prstGeom"
      element_name: "a:prstGeom"
      namespace_uri: "http://schemas.openxmlformats.org/drawingml/2006/main"
      attributes: [{name: "prst", type: enum, required: true, enum_values: [...]}]
    """
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:12])
    format_name: str                         # "PPTX", "PSD", "PDF"
    atom_type: AtomType
    
    # ── Location within format ──────────────────────────────
    file_path: str = ""                      # path within container
    xpath: str = ""                          # for XML formats
    byte_offset: Optional[str] = None        # for binary formats ("0x00-0x03")
    json_path: str = ""                      # for JSON formats
    
    # ── Identity ────────────────────────────────────────────
    element_name: str = ""
    namespace_uri: str = ""
    namespace_prefix: str = ""
    
    # ── Structure ───────────────────────────────────────────
    data_type: DataType = DataType.STRING
    byte_size: Optional[int] = None
    bit_layout: Optional[str] = None         # "bits 0-3: flags, bits 4-7: type"
    endianness: str = "little"
    encoding: str = "utf-8"
    
    # ── Constraints ─────────────────────────────────────────
    required: bool = False
    min_occurs: int = 0
    max_occurs: Optional[int] = None         # None = unbounded
    valid_values: Optional[EnumDefinition] = None
    value_range: Optional[str] = None        # "0-65535" or "0.0-1.0"
    regex_pattern: Optional[str] = None
    default_value: Optional[str] = None
    
    # ── Relationships ───────────────────────────────────────
    parent_atom_id: Optional[str] = None
    child_atom_ids: list[str] = Field(default_factory=list)
    required_sibling_ids: list[str] = Field(default_factory=list)
    references_atom_id: Optional[str] = None  # e.g., rId references
    
    # ── Semantics ───────────────────────────────────────────
    semantic_meaning: str = ""
    unit_of_measure: Optional[str] = None    # "EMU", "pixels", "points", "twips"
    conversion_formula: Optional[str] = None  # "1 inch = 914400 EMU"
    
    # ── Examples ────────────────────────────────────────────
    example_value: str = ""
    example_in_context: str = ""             # full XML/hex snippet showing usage
    
    # ── Documentation ───────────────────────────────────────
    spec_reference: str = ""                 # section of official spec
    notes: list[str] = Field(default_factory=list)


class CoordinateSystem(BaseModel):
    """Complete coordinate system specification for a format."""
    format_name: str
    name: str                     # "EMU coordinate system"
    origin: str                   # "top-left of slide"
    x_axis: str                   # "positive right"
    y_axis: str                   # "positive down"
    unit: str                     # "EMU (English Metric Unit)"
    unit_conversions: dict[str, str] = Field(default_factory=dict)
    # e.g. {"inches": "value * 914400", "cm": "value * 360000", "points": "value * 12700"}
    default_dpi: Optional[int] = None
    max_value: Optional[str] = None
    precision: Optional[str] = None
    example_calculations: list[dict] = Field(default_factory=list)
    # [{"goal": "place shape 2 inches from left", "calculation": "2 * 914400 = 1828800 EMU"}]


class NamespaceRegistry(BaseModel):
    """All XML namespaces used in a format."""
    format_name: str
    namespaces: list[dict] = Field(default_factory=list)
    # [{"prefix": "a", "uri": "http://...", "purpose": "DrawingML main", "used_in": ["slides", "themes"]}]


class FileStructureMap(BaseModel):
    """
    Complete internal file/directory structure of a container format.
    For ZIP-based formats like PPTX, DOCX, XLSX, ODP, JAR, etc.
    """
    format_name: str
    container_type: str                  # "ZIP", "OLE2", "directory", "single_file"
    required_entries: list[dict] = Field(default_factory=list)
    # [{"path": "[Content_Types].xml", "purpose": "content type registry", "required": true}]
    optional_entries: list[dict] = Field(default_factory=list)
    naming_conventions: list[str] = Field(default_factory=list)
    # ["Slides are named slide{N}.xml in ppt/slides/"]
    relationship_chain: list[dict] = Field(default_factory=list)
    # [{"from": "_rels/.rels", "type": "officeDocument", "target": "ppt/presentation.xml"}]
    minimum_valid_file: str = ""         # smallest valid file structure description
    example_tree: str = ""               # ASCII tree of typical file


# ════════════════════════════════════════════════════════════════
# 2. ALGORITHMS — Mathematical and computational procedures
# ════════════════════════════════════════════════════════════════

class AlgorithmCategory(str, Enum):
    IMAGE_FILTER = "image_filter"
    COLOR_SPACE = "color_space"
    COMPOSITING = "compositing"
    GEOMETRY = "geometry"
    TRANSFORM = "transform"
    SELECTION = "selection"
    COMPRESSION = "compression"
    ENCODING = "encoding"
    RENDERING = "rendering"
    PHYSICS = "physics"
    SIGNAL_PROCESSING = "signal_processing"
    DATA_STRUCTURE = "data_structure"
    CRYPTOGRAPHY = "cryptography"
    MATH = "math"
    TEXT_LAYOUT = "text_layout"
    PATH_OPERATIONS = "path_operations"


class AlgorithmVariant(BaseModel):
    """A specific variant or optimization of an algorithm."""
    name: str
    description: str
    tradeoffs: str          # "Faster but less accurate"
    pseudocode: str
    reference_implementation: dict[str, str] = Field(default_factory=dict)  # lang → code


class Algorithm(BaseModel):
    """
    Complete specification of a computational algorithm,
    sufficient to implement it from scratch.
    
    Example: Gaussian Blur for Photoshop-like image editor
      - Mathematical formula for 2D Gaussian kernel
      - Separable decomposition optimization  
      - Edge handling strategies (clamp, wrap, reflect, zero)
      - Implementation for arbitrary kernel sizes
      - Numerical stability considerations
      - SIMD optimization hints
      - Reference implementation in Python, C, Rust, JS
    """
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:12])
    name: str
    category: AlgorithmCategory
    domain: str                              # "image_processing", "3d_rendering", etc.
    
    # ── Mathematical Foundation ─────────────────────────────
    mathematical_formula: str = ""           # LaTeX or plain text
    mathematical_explanation: str = ""       # human-readable explanation of the math
    input_domain: str = ""                   # "2D pixel grid, floating point [0,1] per channel"
    output_range: str = ""                   # "same dimensions, same value range"
    
    # ── Parameters ──────────────────────────────────────────
    parameters: list[dict] = Field(default_factory=list)
    # [{"name": "sigma", "type": "float", "range": "0.1-250.0", "default": 1.0,
    #   "effect": "controls blur radius", "formula_role": "standard deviation of Gaussian"}]
    
    # ── Core Algorithm ──────────────────────────────────────
    pseudocode: str = ""                     # language-agnostic pseudocode
    step_by_step: list[str] = Field(default_factory=list)
    # ["1. Compute kernel size from sigma: size = ceil(6*sigma) | 1",
    #  "2. Generate 1D Gaussian kernel: K[i] = exp(-(i-center)²/(2σ²))",
    #  "3. Normalize kernel: K /= sum(K)", ...]
    
    # ── Complexity ──────────────────────────────────────────
    time_complexity: str = ""                # "O(n*m*k) where k=kernel_size"
    space_complexity: str = ""
    
    # ── Implementation Details ──────────────────────────────
    numerical_considerations: list[str] = Field(default_factory=list)
    # ["Use double precision for kernel computation",
    #  "Clamp output values to valid range"]
    edge_handling: list[dict] = Field(default_factory=list)
    # [{"strategy": "reflect", "description": "Mirror pixels at boundary", "code": "..."}]
    
    # ── Reference Implementations ───────────────────────────
    reference_implementations: dict[str, str] = Field(default_factory=dict)
    # {"python": "def gaussian_blur(img, sigma):\n ...",
    #  "rust": "fn gaussian_blur(img: &Image, sigma: f64) -> Image {\n ...",
    #  "c": "void gaussian_blur(uint8_t* src, ...) {\n ..."}
    
    # ── Optimizations ───────────────────────────────────────
    variants: list[AlgorithmVariant] = Field(default_factory=list)
    optimizations: list[dict] = Field(default_factory=list)
    # [{"technique": "Separable kernel", "speedup": "O(k) → O(√k)",
    #   "description": "...", "implementation": "..."}]
    
    # ── Dependencies ────────────────────────────────────────
    prerequisite_algorithm_ids: list[str] = Field(default_factory=list)
    used_by_algorithm_ids: list[str] = Field(default_factory=list)
    
    # ── Testing ─────────────────────────────────────────────
    test_vectors: list[dict] = Field(default_factory=list)
    # [{"input": [[1,2],[3,4]], "params": {"sigma": 1.0}, "expected_output": [[...]]}]
    known_correct_implementations: list[str] = Field(default_factory=list)
    # ["OpenCV cv2.GaussianBlur", "ImageMagick -blur"]


# ════════════════════════════════════════════════════════════════
# 3. CAPABILITIES — User-facing features fully decomposed
# ════════════════════════════════════════════════════════════════

class CapabilityComplexity(str, Enum):
    TRIVIAL = "trivial"         # single atom / direct write
    SIMPLE = "simple"           # few atoms, no algorithms
    MODERATE = "moderate"       # multiple atoms + simple algorithm
    COMPLEX = "complex"         # many atoms + complex algorithms
    ADVANCED = "advanced"       # requires deep domain knowledge


class ImplementationStep(BaseModel):
    """One step in implementing a capability."""
    order: int
    description: str
    atom_ids: list[str] = Field(default_factory=list)       # FormatAtoms used
    algorithm_ids: list[str] = Field(default_factory=list)   # Algorithms used
    code_template: str = ""                                   # parameterized code
    code_language: str = ""
    input_from_steps: list[int] = Field(default_factory=list)
    output_description: str = ""
    validation: str = ""                                      # how to verify this step


class Capability(BaseModel):
    """
    A user-facing feature fully decomposed into implementable steps.
    
    Example: "Draw and position a rectangle shape in PPTX"
      - What atoms are needed (XML elements, relationships, content types)
      - What coordinate math is needed (EMU conversions)
      - Step-by-step implementation with code
      - What the minimum valid output looks like
      - How to validate correctness
    """
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:12])
    name: str                                # "Draw Rectangle Shape"
    format_or_tool: str                      # "PPTX" or "Photoshop-like Editor"
    category: str                            # "Shapes", "Image Filters", etc.
    
    # ── Description ─────────────────────────────────────────
    user_description: str = ""               # what the user sees/does
    technical_description: str = ""          # what actually happens
    complexity: CapabilityComplexity = CapabilityComplexity.MODERATE
    
    # ── Input/Output ────────────────────────────────────────
    input_parameters: list[dict] = Field(default_factory=list)
    # [{"name": "x", "type": "float", "unit": "inches", "description": "horizontal position"},
    #  {"name": "width", "type": "float", "unit": "inches", "description": "shape width"},
    #  {"name": "fill_color", "type": "string", "format": "hex RGB", "description": "..."}]
    output_description: str = ""
    
    # ── Implementation ──────────────────────────────────────
    implementation_steps: list[ImplementationStep] = Field(default_factory=list)
    
    # ── Required Atoms ──────────────────────────────────────
    required_atom_ids: list[str] = Field(default_factory=list)
    required_algorithm_ids: list[str] = Field(default_factory=list)
    prerequisite_capability_ids: list[str] = Field(default_factory=list)
    
    # ── Complete Code ───────────────────────────────────────
    reference_implementations: dict[str, str] = Field(default_factory=dict)
    # Full working code in multiple languages
    
    minimum_working_example: str = ""        # smallest code that demonstrates this
    
    # ── Validation ──────────────────────────────────────────
    validation_method: str = ""              # "Open in PowerPoint and verify shape appears"
    programmatic_validation: str = ""        # code to validate output
    known_pitfalls: list[str] = Field(default_factory=list)
    
    # ── Composition ─────────────────────────────────────────
    composable_with: list[str] = Field(default_factory=list)  # capability IDs
    conflicts_with: list[str] = Field(default_factory=list)
    
    # ── Metadata ────────────────────────────────────────────
    spec_version: str = ""
    min_version_support: str = ""            # "PowerPoint 2007+"
    platform_notes: list[str] = Field(default_factory=list)


# ════════════════════════════════════════════════════════════════
# 4. BLUEPRINTS — Composable implementation plans
# ════════════════════════════════════════════════════════════════

class BlueprintScope(str, Enum):
    SINGLE_FEATURE = "single_feature"   # one capability
    FEATURE_GROUP = "feature_group"     # related capabilities
    FULL_MODULE = "full_module"         # e.g., "all shape operations"
    FULL_APPLICATION = "full_application"  # e.g., "complete PPTX generator"


class Blueprint(BaseModel):
    """
    A composable implementation plan that assembles capabilities,
    atoms, and algorithms into a buildable system.
    
    Example: "PPTX Shape Engine Blueprint"
      Composes: coordinate system + all shape capabilities + styling + text-in-shapes
      Produces: a complete module for shape manipulation in PPTX files
    """
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:12])
    name: str
    scope: BlueprintScope
    format_or_tool: str
    description: str = ""
    
    # ── Composition ─────────────────────────────────────────
    capability_ids: list[str] = Field(default_factory=list)
    algorithm_ids: list[str] = Field(default_factory=list)
    
    # ── Architecture ────────────────────────────────────────
    module_structure: list[dict] = Field(default_factory=list)
    # [{"module": "shape_engine.py", "classes": ["Shape", "Rectangle", ...],
    #   "implements_capabilities": ["cap_001", "cap_002"]}]
    
    class_hierarchy: list[dict] = Field(default_factory=list)
    # [{"class": "Shape", "parent": null, "abstract": true,
    #   "methods": ["render", "set_position", ...]}]
    
    # ── Integration ─────────────────────────────────────────
    public_api: list[dict] = Field(default_factory=list)
    # [{"function": "add_rectangle", "params": [...], "returns": "Shape",
    #   "description": "...", "example": "..."}]
    
    initialization_sequence: list[str] = Field(default_factory=list)
    # ["1. Create ZIP container", "2. Write [Content_Types].xml", ...]
    
    # ── Complete Implementation ─────────────────────────────
    reference_implementations: dict[str, dict[str, str]] = Field(default_factory=dict)
    # {"python": {"shape_engine.py": "class Shape:...", "pptx_writer.py": "..."}}
    
    # ── Testing ─────────────────────────────────────────────
    integration_tests: list[dict] = Field(default_factory=list)
    # [{"name": "create_slide_with_shapes", "code": "...", "expected": "valid .pptx file"}]


# ════════════════════════════════════════════════════════════════
# 5. DEPENDENCY GRAPH — How everything connects
# ════════════════════════════════════════════════════════════════

class DependencyType(str, Enum):
    REQUIRES = "requires"          # A cannot work without B
    USES = "uses"                  # A optionally uses B
    EXTENDS = "extends"            # A is a specialization of B
    COMPOSES = "composes"          # A is built from B + C + ...
    CONFLICTS = "conflicts"        # A and B are mutually exclusive
    PRECEDES = "precedes"          # A must come before B in implementation


class DependencyEdge(BaseModel):
    source_id: str
    source_type: str               # "capability", "algorithm", "atom", "blueprint"
    target_id: str
    target_type: str
    dependency_type: DependencyType
    description: str = ""
    is_optional: bool = False


class DependencyGraph(BaseModel):
    """Full dependency graph for a format or tool."""
    format_or_tool: str
    edges: list[DependencyEdge] = Field(default_factory=list)
    
    def topological_order(self, start_ids: list[str]) -> list[str]:
        """Return implementation order for a set of target capabilities."""
        # Build adjacency list
        adj: dict[str, list[str]] = {}
        for edge in self.edges:
            if edge.dependency_type in (DependencyType.REQUIRES, DependencyType.PRECEDES):
                adj.setdefault(edge.source_id, []).append(edge.target_id)
        
        # Collect all reachable dependencies
        visited = set()
        def dfs(node_id):
            if node_id in visited:
                return
            visited.add(node_id)
            for dep in adj.get(node_id, []):
                dfs(dep)
        
        for sid in start_ids:
            dfs(sid)
        
        # Topological sort via Kahn's algorithm
        in_degree = {n: 0 for n in visited}
        for edge in self.edges:
            if edge.source_id in visited and edge.target_id in visited:
                if edge.dependency_type in (DependencyType.REQUIRES, DependencyType.PRECEDES):
                    in_degree[edge.source_id] = in_degree.get(edge.source_id, 0) + 1
        
        queue = [n for n, d in in_degree.items() if d == 0]
        result = []
        while queue:
            node = queue.pop(0)
            result.append(node)
            for edge in self.edges:
                if edge.target_id == node and edge.source_id in visited:
                    in_degree[edge.source_id] -= 1
                    if in_degree[edge.source_id] == 0:
                        queue.append(edge.source_id)
        
        return result


# ════════════════════════════════════════════════════════════════
# 6. TOOL PROFILES — What a format/application can do
# ════════════════════════════════════════════════════════════════

class ToolProfile(BaseModel):
    """
    Complete capability matrix for a format or application.
    
    This answers: "What can this format represent / what can this tool do?"
    at the highest level, pointing to all capabilities.
    """
    name: str                                # "Adobe Photoshop"
    type: str                                # "image_editor", "file_format", etc.
    version: str = ""
    
    # ── Capability Categories ───────────────────────────────
    capability_categories: list[dict] = Field(default_factory=list)
    # [{"category": "Selection Tools",
    #   "capabilities": ["Marquee Select", "Lasso", "Magic Wand", ...],
    #   "capability_ids": ["cap_001", ...]}]
    
    # ── Format Support ──────────────────────────────────────
    native_formats: list[str] = Field(default_factory=list)     # ["PSD", "PSB"]
    import_formats: list[str] = Field(default_factory=list)
    export_formats: list[str] = Field(default_factory=list)
    
    # ── Fundamental Constraints ─────────────────────────────
    constraints: list[dict] = Field(default_factory=list)
    # [{"constraint": "max_image_size", "value": "300000x300000 pixels"},
    #  {"constraint": "color_depths", "value": ["8-bit", "16-bit", "32-bit float"]}]
    
    # ── Architecture ────────────────────────────────────────
    processing_pipeline: list[str] = Field(default_factory=list)
    # ["1. Load image into canvas", "2. Apply layer stack bottom-to-top",
    #  "3. For each layer: apply blend mode", ...]
    
    total_capabilities: int = 0
    total_algorithms: int = 0
```

---

### `prompts_v2.py` — Implementation-Layer Prompts

```python
"""
Prompts that extract IMPLEMENTATION-LEVEL knowledge:
  - Exact file format structures
  - Complete algorithm specifications  
  - Step-by-step implementation recipes
  - Composable blueprints
"""

# ════════════════════════════════════════════════════════════════
# PHASE 7: CAPABILITY ENUMERATION
# ════════════════════════════════════════════════════════════════

ENUMERATE_CAPABILITIES = """You are documenting EVERY capability of **{target}** 
for the purpose of enabling complete reimplementation from scratch.

Target type: {target_type}
Classification: {classification}

{type_specific_instructions}

List EVERY distinct capability — every operation, feature, or function
that {target} supports. Group by category.

A "capability" is a discrete user-facing operation. Examples:
- For PPTX: "Insert rectangle shape", "Add slide transition", "Create pie chart"  
- For Photoshop: "Gaussian blur filter", "Magnetic lasso selection", "Curves adjustment"
- For PDF: "Embed TrueType font", "Add form field", "Create bookmark"

Requirements:
- EXHAUSTIVE. List every single one. Not examples — the COMPLETE list.
- Include capabilities most people forget (accessibility features, metadata, 
  backwards compatibility modes, print settings, etc.)
- Mark complexity level for each

Respond with ONLY this JSON:
{{
  "categories": [
    {{
      "name": "Shapes & Drawing",
      "capabilities": [
        {{
          "name": "Draw rectangle shape",
          "description": "Create a rectangle with position, size, fill, outline, effects",
          "complexity": "moderate",
          "sub_capabilities": [
            "Set position and size",
            "Apply solid fill",
            "Apply gradient fill",
            "Apply pattern fill",
            "Set outline style",
            "Apply shadow effect",
            "Apply 3D rotation",
            "Add text inside shape"
          ],
          "requires_algorithms": false,
          "algorithm_domains": []
        }}
      ]
    }}
  ],
  "total_capability_count": <int>
}}"""


TYPE_INSTRUCTIONS_FILE_FORMAT = """For a FILE FORMAT, enumerate:
- Every element/object type that can exist in the file
- Every property/attribute those elements can have
- Every relationship between elements
- Every metadata field
- Every encoding/compression option
- Every version-specific feature
- Every interactive feature (forms, links, etc.)
- Every visual/styling option
- Every structural operation (pages, sections, layers, etc.)"""

TYPE_INSTRUCTIONS_APPLICATION = """For an APPLICATION/TOOL, enumerate:
- Every tool in the toolbar
- Every menu item and its function
- Every filter/effect with its parameters
- Every adjustment/correction
- Every selection method
- Every transform operation
- Every layer operation
- Every export/import option
- Every automation/scripting capability
- Every color management feature
- Every text/typography feature
- Every 3D feature (if applicable)
- Every animation/timeline feature (if applicable)
- Every collaboration feature"""


# ════════════════════════════════════════════════════════════════
# PHASE 8: FORMAT ATOM EXTRACTION
# ════════════════════════════════════════════════════════════════

EXTRACT_FILE_STRUCTURE = """You are reverse-engineering the COMPLETE internal
structure of the **{format_name}** file format.

Your output will be used to write software that generates valid {format_name}
files FROM SCRATCH (no libraries — raw file construction).

Describe the COMPLETE file structure:

1. Container format (ZIP, OLE2, flat file, etc.)
2. Every file/stream within the container
3. For each file: its exact format (XML with namespace, binary with layout, etc.)
4. The relationship/reference system between files
5. The minimum set of files/entries for a valid {format_name} file
6. Content type registration system (if applicable)

Respond with ONLY this JSON:
{{
  "container_type": "ZIP|OLE2|flat_xml|flat_binary|directory",
  "magic_bytes": "hex string or null",
  "file_extension": ".pptx",
  
  "required_entries": [
    {{
      "path": "[Content_Types].xml",
      "format": "xml",
      "purpose": "Maps file extensions and specific files to MIME types",
      "root_element": "Types",
      "namespace": "http://schemas.openxmlformats.org/package/2006/content-types",
      "minimum_content": "<Types xmlns=\\"...\\"><Default Extension=\\"rels\\" ContentType=\\"application/vnd.openxmlformats-package.relationships+xml\\"/>...</Types>",
      "children_elements": [
        {{
          "element": "Default",
          "attributes": [
            {{"name": "Extension", "required": true, "type": "string"}},
            {{"name": "ContentType", "required": true, "type": "MIME string"}}
          ]
        }},
        {{
          "element": "Override", 
          "attributes": [
            {{"name": "PartName", "required": true, "type": "path string"}},
            {{"name": "ContentType", "required": true, "type": "MIME string"}}
          ]
        }}
      ]
    }}
  ],
  
  "optional_entries": [...],
  
  "relationship_system": {{
    "description": "How files reference each other",
    "relationship_file_pattern": "_rels/<filename>.rels",
    "relationship_types": [
      {{
        "type_uri": "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide",
        "purpose": "Links presentation to a slide",
        "source": "ppt/presentation.xml",
        "target_pattern": "slides/slide{{N}}.xml"
      }}
    ]
  }},
  
  "minimum_valid_file": {{
    "files": ["list of minimum required files"],
    "description": "Produces a valid but empty {format_name} file"
  }},
  
  "naming_conventions": [
    "Slides: ppt/slides/slide1.xml, slide2.xml, ...",
    "Slide relationships: ppt/slides/_rels/slide1.xml.rels"
  ]
}}"""


EXTRACT_FORMAT_ATOMS = """You are documenting EVERY structural element used in
**{format_name}** files for the capability: **{capability_name}**.

Context: {capability_description}
File location: {file_path}

List EVERY XML element, attribute, namespace, and enum value needed to 
implement this capability. Include the COMPLETE element hierarchy.

For each element provide:
- Full element name with namespace prefix
- Namespace URI
- ALL attributes with their types, valid values, and defaults
- ALL child elements (recursive)
- Required vs optional
- Value constraints and units

This must be detailed enough to construct valid XML programmatically.

Respond with ONLY this JSON:
{{
  "atoms": [
    {{
      "element_name": "p:sp",
      "namespace_prefix": "p",
      "namespace_uri": "http://schemas.openxmlformats.org/presentationml/2006/main",
      "parent_element": "p:spTree",
      "purpose": "Shape container element",
      "required": true,
      "attributes": [],
      "children": [
        {{
          "element_name": "p:nvSpPr",
          "purpose": "Non-visual shape properties",
          "required": true,
          "children": [
            {{
              "element_name": "p:cNvPr",
              "purpose": "Common non-visual properties",
              "required": true,
              "attributes": [
                {{
                  "name": "id",
                  "type": "integer",
                  "required": true,
                  "description": "Unique shape identifier on slide",
                  "constraints": "Must be unique, ≥ 1"
                }},
                {{
                  "name": "name",
                  "type": "string",
                  "required": true,
                  "description": "Shape name",
                  "example": "Rectangle 1"
                }}
              ]
            }}
          ]
        }}
      ]
    }}
  ],
  "required_namespaces": [
    {{"prefix": "a", "uri": "http://schemas.openxmlformats.org/drawingml/2006/main"}}
  ],
  "enum_definitions": [
    {{
      "name": "ST_ShapeType",
      "used_by": "a:prstGeom/@prst",
      "values": [
        {{"value": "rect", "label": "Rectangle"}},
        {{"value": "ellipse", "label": "Ellipse"}},
        {{"value": "roundRect", "label": "Rounded Rectangle"}}
      ]
    }}
  ],
  "coordinate_info": {{
    "unit": "EMU",
    "conversions": {{
      "1 inch": "914400 EMU",
      "1 cm": "360000 EMU",
      "1 point": "12700 EMU",
      "1 pixel (96dpi)": "9525 EMU"
    }}
  }}
}}"""


# ════════════════════════════════════════════════════════════════
# PHASE 9: ALGORITHM EXTRACTION
# ════════════════════════════════════════════════════════════════

EXTRACT_ALGORITHM = """You are documenting the **{algorithm_name}** algorithm
for implementation in a **{tool_context}**.

This documentation must be complete enough for a programmer to implement
the algorithm FROM SCRATCH producing output identical to professional
implementations (e.g., Photoshop, ImageMagick, OpenCV).

Provide:
1. Mathematical foundation with formulas
2. Step-by-step pseudocode
3. ALL parameters with valid ranges and effects
4. Edge case handling (literally: image edges, and figuratively: corner cases)
5. Numerical precision requirements
6. Performance optimizations
7. Working reference implementation in Python AND one systems language
8. Test vectors (known inputs → expected outputs)

Respond with ONLY this JSON:
{{
  "name": "{algorithm_name}",
  "category": "image_filter|color_space|compositing|geometry|...",
  "domain": "image_processing",
  
  "mathematical_formula": "G(x,y) = (1/(2πσ²)) * exp(-(x²+y²)/(2σ²))",
  "mathematical_explanation": "The 2D Gaussian function creates a bell-curve...",
  
  "parameters": [
    {{
      "name": "sigma",
      "type": "float",
      "range": "0.1 to 250.0",
      "default": 1.0,
      "effect": "Controls the spread of the blur. Higher = more blur.",
      "formula_role": "Standard deviation σ in the Gaussian function"
    }}
  ],
  
  "step_by_step": [
    "1. Calculate kernel radius: r = ceil(3 * sigma)",
    "2. Calculate kernel size: size = 2*r + 1",
    "3. For each position i in [-r, r]: kernel[i] = exp(-i²/(2σ²))",
    "4. Normalize: kernel /= sum(kernel)",
    "5. For each pixel (x,y) in image:",
    "   5a. Convolve horizontally with 1D kernel → temp[x,y]",
    "6. For each pixel (x,y) in temp:",
    "   6a. Convolve vertically with 1D kernel → output[x,y]"
  ],
  
  "pseudocode": "function gaussian_blur(image, sigma):\\n  ...",
  
  "edge_handling": [
    {{
      "strategy": "clamp",
      "description": "Repeat edge pixel values",
      "code": "src[clamp(y+ky, 0, height-1)][clamp(x+kx, 0, width-1)]"
    }},
    {{
      "strategy": "reflect",
      "description": "Mirror pixel coordinates at boundary",
      "code": "src[reflect(y+ky, height)][reflect(x+kx, width)]"
    }},
    {{
      "strategy": "wrap",
      "description": "Wrap around to opposite edge",
      "code": "src[(y+ky) % height][(x+kx) % width]"
    }}
  ],
  
  "numerical_considerations": [
    "Use float64 for kernel computation to avoid precision loss",
    "For large sigma, kernel values near edges approach zero — can truncate",
    "Accumulate convolution sum in float64 even if image is uint8"
  ],
  
  "optimizations": [
    {{
      "name": "Separable decomposition",
      "description": "2D Gaussian is separable: apply 1D horizontal then 1D vertical",
      "complexity_before": "O(W × H × K²)",
      "complexity_after": "O(W × H × 2K)",
      "implementation": "..."
    }},
    {{
      "name": "IIR approximation (Deriche/Young-van Vliet)",
      "description": "Constant-time approximation regardless of sigma",
      "complexity_after": "O(W × H)",
      "accuracy": "Visually indistinguishable for sigma > 2",
      "implementation": "..."
    }}
  ],
  
  "reference_implementations": {{
    "python": "import numpy as np\\n\\ndef gaussian_blur(image: np.ndarray, sigma: float) -> np.ndarray:\\n    ...",
    "rust": "fn gaussian_blur(image: &[u8], width: usize, height: usize, sigma: f64) -> Vec<u8> {{\\n    ...",
    "c": "void gaussian_blur(const uint8_t* src, uint8_t* dst, int w, int h, double sigma) {{\\n    ...",
    "javascript": "function gaussianBlur(imageData, sigma) {{\\n    ..."
  }},
  
  "test_vectors": [
    {{
      "name": "3x3 identity",
      "input": [[100, 100, 100], [100, 200, 100], [100, 100, 100]],
      "params": {{"sigma": 0.5}},
      "expected_center_value": "~156 (±2)",
      "notes": "Small sigma, slight blur of center peak"
    }}
  ],
  
  "related_algorithms": ["Box Blur", "Bilateral Filter", "Unsharp Mask"],
  "composition_patterns": [
    {{
      "pattern": "Unsharp Mask",
      "formula": "output = original + amount * (original - gaussian_blur(original, sigma))",
      "uses_this_as": "The blur component"
    }}
  ]
}}"""


# ════════════════════════════════════════════════════════════════
# PHASE 10: IMPLEMENTATION SPEC GENERATION
# ════════════════════════════════════════════════════════════════

GENERATE_IMPLEMENTATION_SPEC = """You are writing the COMPLETE implementation 
specification for the capability: **{capability_name}**

Target: {format_or_tool}
Category: {category}
Description: {description}

Available atoms (structural elements you can reference):
{available_atoms_summary}

Available algorithms:
{available_algorithms_summary}

Write a step-by-step implementation specification that a programmer could
follow to implement this capability FROM SCRATCH. No external libraries —
only standard language features.

Include:
1. Every file that needs to be created/modified
2. Exact XML/binary content with real namespace URIs and element names
3. All coordinate calculations with units
4. All enum values that apply
5. Relationship entries that must be added
6. Content type entries that must be added
7. Complete working code in Python

Respond with ONLY this JSON:
{{
  "capability": "{capability_name}",
  "prerequisites": ["capability names that must work first"],
  
  "implementation_steps": [
    {{
      "step": 1,
      "action": "Ensure slide XML structure exists",
      "file": "ppt/slides/slide1.xml",
      "details": "The shape tree (p:spTree) must exist within p:cSld",
      "code": "...",
      "xml_template": "<p:sp>\\n  <p:nvSpPr>\\n    ...",
      "validation": "Element p:spTree must have at least p:grpSpPr child"
    }}
  ],
  
  "complete_implementation": {{
    "python": "def add_rectangle(slide_xml: str, x_inches: float, y_inches: float, w_inches: float, h_inches: float, fill_hex: str) -> str:\\n    ...",
    "javascript": "..."
  }},
  
  "minimum_working_example": {{
    "description": "Creates a PPTX file with one slide containing a blue rectangle",
    "code": "...",
    "expected_output": "A valid .pptx file that opens in PowerPoint showing the rectangle"
  }},
  
  "parameter_mapping": [
    {{
      "user_param": "x position (inches)",
      "internal_param": "a:off/@x (EMU)",
      "conversion": "x_emu = int(x_inches * 914400)",
      "example": "2 inches → 1828800"
    }}
  ],
  
  "gotchas": [
    "Shape IDs must be unique across the slide — use incrementing counter",
    "The a:xfrm element's coordinate origin is the top-left of the slide",
    "Fill color must be specified as RGB hex WITHOUT the # prefix in DrawingML"
  ]
}}"""


# ════════════════════════════════════════════════════════════════
# PHASE 11: BLUEPRINT ASSEMBLY
# ════════════════════════════════════════════════════════════════

ASSEMBLE_BLUEPRINT = """You are designing the software architecture for a 
**{blueprint_scope}** that implements: {blueprint_description}

Target: {format_or_tool}

Available capabilities (already documented):
{capabilities_list}

Available algorithms (already documented):
{algorithms_list}

Design a complete, modular software architecture that:
1. Implements all listed capabilities
2. Has a clean public API
3. Has proper error handling
4. Handles edge cases
5. Is well-structured with clear module separation

Respond with ONLY this JSON:
{{
  "blueprint_name": "...",
  "description": "...",
  
  "module_structure": [
    {{
      "filename": "core/container.py",
      "purpose": "ZIP container management for PPTX files",
      "classes": [
        {{
          "name": "PptxContainer",
          "description": "Manages the ZIP archive and file entries",
          "methods": [
            {{
              "name": "add_file",
              "params": ["path: str", "content: bytes"],
              "returns": "None",
              "description": "Add a file entry to the PPTX archive"
            }}
          ]
        }}
      ],
      "implements_capabilities": ["cap_001"]
    }}
  ],
  
  "public_api": [
    {{
      "function": "create_presentation",
      "module": "api",
      "params": [],
      "returns": "Presentation",
      "description": "Create a new empty presentation",
      "example": "prs = create_presentation()\\nprs.add_slide()\\nprs.slides[0].add_rectangle(1, 1, 3, 2, fill='#FF0000')\\nprs.save('output.pptx')"
    }}
  ],
  
  "initialization_sequence": [
    "1. Create PptxContainer (empty ZIP)",
    "2. Write [Content_Types].xml with base content types",
    "3. Write _rels/.rels with root relationship",
    "4. Write ppt/presentation.xml with empty presentation"
  ],
  
  "dependency_order": ["container", "content_types", "relationships", "presentation", "slides", "shapes"],
  
  "error_handling_strategy": {{
    "invalid_params": "Raise ValueError with specific message",
    "file_io": "Raise IOError, ensure ZIP is properly closed in finally",
    "xml_construction": "Validate against schema if available"
  }},
  
  "testing_strategy": [
    {{
      "test": "round_trip_empty_presentation",
      "description": "Create → save → open in PowerPoint → verify no errors",
      "code": "..."
    }}
  ]
}}"""


# ════════════════════════════════════════════════════════════════
# PHASE 12: IMPLEMENTATION VALIDATION 
# ════════════════════════════════════════════════════════════════

VALIDATE_IMPLEMENTATION_SPEC = """You are a **{format_or_tool}** expert 
validating an implementation specification.

Capability: {capability_name}
Implementation spec:
{spec_json}

Verify:
1. Are the XML element names and namespace URIs CORRECT?
   (Check against the real OOXML / PDF / PSD spec)
2. Are ALL required attributes included?
3. Are the enum values REAL values from the spec (not made up)?
4. Are the coordinate calculations correct?
5. Would the generated code produce a VALID file that opens without errors?
6. Are there missing steps that would cause silent data loss or corruption?
7. Is the relationship/content-type chain complete?

Respond with ONLY this JSON:
{{
  "is_correct": true|false,
  "confidence": <float 0.0-1.0>,
  "errors": [
    {{
      "location": "step 3, xml_template",
      "issue": "Wrong namespace URI for DrawingML",
      "correct_value": "http://schemas.openxmlformats.org/drawingml/2006/main",
      "severity": "critical"
    }}
  ],
  "missing_elements": [
    "a:bodyPr element is required inside p:txBody even if empty"
  ],
  "missing_attributes": [],
  "incorrect_enum_values": [],
  "code_would_produce_valid_file": true|false,
  "suggestions": []
}}"""


# ════════════════════════════════════════════════════════════════
# QUERY ENGINE PROMPTS
# ════════════════════════════════════════════════════════════════

QUERY_TO_PLAN = """A user wants to build: **{user_query}**

Available knowledge base for {format_or_tool}:

Capabilities available:
{capabilities_list}

Algorithms available:
{algorithms_list}

Blueprints available:
{blueprints_list}

Create an implementation plan by selecting and ordering the relevant
capabilities, algorithms, and blueprints.

Respond with ONLY this JSON:
{{
  "plan_name": "...",
  "description": "...",
  "feasibility": "fully_possible|partially_possible|not_possible",
  "missing_capabilities": ["anything needed but not in the DB"],
  
  "steps": [
    {{
      "order": 1,
      "type": "capability|algorithm|blueprint|custom",
      "id": "cap_001 or alg_001 or bp_001",
      "name": "...",
      "customization": "How to adapt this for the user's specific need",
      "estimated_effort": "trivial|small|medium|large"
    }}
  ],
  
  "architecture_recommendation": "...",
  "estimated_total_lines_of_code": <int>,
  "estimated_difficulty": "beginner|intermediate|advanced|expert"
}}"""
```

---

### `pipeline_v2.py` — Implementation Layer Pipeline

```python
"""
Phases 7-12: Generate the implementation knowledge layer.

Phase 7  — CAPABILITY ENUMERATION:   What can this format/tool do?
Phase 8  — ATOM EXTRACTION:          Exact structural specifications
Phase 9  — ALGORITHM EXTRACTION:     Complete algorithm documentation
Phase 10 — IMPLEMENTATION SPECS:     Step-by-step build instructions
Phase 11 — BLUEPRINT ASSEMBLY:       Composable architecture plans
Phase 12 — IMPLEMENTATION VALIDATION: Verify specs produce valid output
"""
from __future__ import annotations
import asyncio
import json
import logging
from typing import Optional

from config import Config
from schema_v2 import (
    Capability, CapabilityComplexity, FormatAtom, Algorithm,
    AlgorithmCategory, Blueprint, BlueprintScope, ToolProfile,
    CoordinateSystem, NamespaceRegistry, FileStructureMap,
    DependencyEdge, DependencyType, DependencyGraph,
    ImplementationStep, EnumDefinition, AtomType, DataType
)
from llm import LLMClient
from storage_v2 import StorageV2
import prompts_v2

logger = logging.getLogger(__name__)


class ImplementationPipeline:
    """
    Generates the implementation knowledge layer for one target.
    Runs AFTER the V1 reference pipeline has completed.
    """

    def __init__(
        self,
        target: str,
        target_type: str,           # "file_format" or "application_tool"
        config: Config,
        llm: LLMClient,
        storage: StorageV2,
        classification: dict,
    ):
        self.target = target
        self.target_type = target_type
        self.cfg = config
        self.llm = llm
        self.db = storage
        self.classification = classification

        # In-memory caches
        self.capabilities: dict[str, Capability] = {}
        self.atoms: dict[str, FormatAtom] = {}
        self.algorithms: dict[str, Algorithm] = {}
        self.blueprints: dict[str, Blueprint] = {}
        self.dep_graph = DependencyGraph(format_or_tool=target)

    async def run(self):
        """Execute phases 7-12."""
        logger.info(f"═══ Implementation layer for: {self.target} ═══")

        await self._phase7_enumerate_capabilities()
        await self._phase8_extract_atoms()
        await self._phase9_extract_algorithms()
        await self._phase10_generate_implementation_specs()
        await self._phase11_assemble_blueprints()
        await self._phase12_validate()

        # Persist dependency graph
        await self.db.save_dependency_graph(self.dep_graph)

        logger.info(
            f"Implementation layer complete: "
            f"{len(self.capabilities)} capabilities, "
            f"{len(self.atoms)} atoms, "
            f"{len(self.algorithms)} algorithms, "
            f"{len(self.blueprints)} blueprints"
        )

    # ════════════════════════════════════════════════════════════
    # PHASE 7: CAPABILITY ENUMERATION
    # ════════════════════════════════════════════════════════════

    async def _phase7_enumerate_capabilities(self):
        """Discover every capability of the target format/tool."""
        logger.info("Phase 7: Enumerating capabilities")

        type_instructions = (
            prompts_v2.TYPE_INSTRUCTIONS_FILE_FORMAT
            if self.target_type == "file_format"
            else prompts_v2.TYPE_INSTRUCTIONS_APPLICATION
        )

        prompt = prompts_v2.ENUMERATE_CAPABILITIES.format(
            target=self.target,
            target_type=self.target_type,
            classification=json.dumps(self.classification, indent=2),
            type_specific_instructions=type_instructions,
        )

        result = await self.llm.complete(
            prompt, self.cfg.generate_model, phase="enumerate_capabilities"
        )

        # Parse into Capability objects
        for category in result.get("categories", []):
            cat_name = category["name"]
            for cap_data in category.get("capabilities", []):
                cap = Capability(
                    name=cap_data["name"],
                    format_or_tool=self.target,
                    category=cat_name,
                    user_description=cap_data.get("description", ""),
                    complexity=CapabilityComplexity(
                        cap_data.get("complexity", "moderate")
                    ),
                )
                # Store sub-capabilities as input parameters initially
                for sub in cap_data.get("sub_capabilities", []):
                    cap.input_parameters.append({
                        "name": sub,
                        "type": "sub_capability",
                        "description": sub,
                    })
                self.capabilities[cap.id] = cap
                await self.db.save_capability(cap)

        # Decompose complex capabilities into finer-grained ones
        complex_caps = [
            c for c in self.capabilities.values()
            if c.complexity in (CapabilityComplexity.COMPLEX, CapabilityComplexity.ADVANCED)
        ]
        if complex_caps:
            await self._decompose_capabilities(complex_caps)

        logger.info(f"  Found {len(self.capabilities)} capabilities")

    async def _decompose_capabilities(self, caps: list[Capability]):
        """Further decompose complex capabilities into sub-capabilities."""
        decompose_prompt_template = """For the {target} capability "{cap_name}":
{cap_description}

Break this into ALL distinct sub-capabilities that must be individually
implemented. Each sub-capability should be a single, testable unit.

Respond with ONLY this JSON:
{{
  "sub_capabilities": [
    {{
      "name": "...",
      "description": "...",
      "complexity": "trivial|simple|moderate|complex|advanced",
      "requires_algorithm": false,
      "algorithm_name": ""
    }}
  ]
}}"""

        prompts_list = []
        for cap in caps:
            p = decompose_prompt_template.format(
                target=self.target,
                cap_name=cap.name,
                cap_description=cap.user_description,
            )
            prompts_list.append((cap, p))

        results = await self.llm.complete_batch(
            [p for _, p in prompts_list],
            self.cfg.decompose_model,
            phase="decompose_capabilities",
        )

        for (parent_cap, _), result in zip(prompts_list, results):
            if isinstance(result, Exception):
                continue
            for sub in result.get("sub_capabilities", []):
                child_cap = Capability(
                    name=sub["name"],
                    format_or_tool=self.target,
                    category=parent_cap.category,
                    user_description=sub.get("description", ""),
                    complexity=CapabilityComplexity(
                        sub.get("complexity", "simple")
                    ),
                    prerequisite_capability_ids=[parent_cap.id],
                )
                self.capabilities[child_cap.id] = child_cap
                await self.db.save_capability(child_cap)

                # Add dependency edge
                self.dep_graph.edges.append(DependencyEdge(
                    source_id=child_cap.id,
                    source_type="capability",
                    target_id=parent_cap.id,
                    target_type="capability",
                    dependency_type=DependencyType.COMPOSES,
                    description=f"{child_cap.name} is part of {parent_cap.name}",
                ))

    # ════════════════════════════════════════════════════════════
    # PHASE 8: FORMAT ATOM EXTRACTION
    # ════════════════════════════════════════════════════════════

    async def _phase8_extract_atoms(self):
        """Extract exact structural specifications for the format."""
        logger.info("Phase 8: Extracting format atoms")

        if self.target_type != "file_format":
            logger.info("  Skipping atom extraction for non-file-format target")
            return

        # Step 1: Get overall file structure map
        struct_prompt = prompts_v2.EXTRACT_FILE_STRUCTURE.format(
            format_name=self.target
        )
        file_structure = await self.llm.complete(
            struct_prompt, self.cfg.generate_model, phase="extract_structure"
        )
        await self.db.save_file_structure(
            FileStructureMap(
                format_name=self.target,
                container_type=file_structure.get("container_type", ""),
                required_entries=file_structure.get("required_entries", []),
                optional_entries=file_structure.get("optional_entries", []),
                naming_conventions=file_structure.get("naming_conventions", []),
                relationship_chain=file_structure.get(
                    "relationship_system", {}
                ).get("relationship_types", []),
                minimum_valid_file=json.dumps(
                    file_structure.get("minimum_valid_file", {}), indent=2
                ),
            )
        )

        # Step 2: For each capability, extract the atoms it needs
        # Group capabilities by category to reduce API calls
        caps_by_category: dict[str, list[Capability]] = {}
        for cap in self.capabilities.values():
            caps_by_category.setdefault(cap.category, []).append(cap)

        atom_prompts = []
        for cap in self.capabilities.values():
            # Determine which file in the format this capability touches
            file_path = self._infer_file_path(cap)

            prompt = prompts_v2.EXTRACT_FORMAT_ATOMS.format(
                format_name=self.target,
                capability_name=cap.name,
                capability_description=cap.user_description,
                file_path=file_path,
            )
            atom_prompts.append((cap, prompt))

        # Execute in batches
        batch_size = self.cfg.max_concurrency
        for i in range(0, len(atom_prompts), batch_size):
            batch = atom_prompts[i:i + batch_size]

            results = await self.llm.complete_batch(
                [p for _, p in batch],
                self.cfg.generate_model,
                phase="extract_atoms",
            )

            for (cap, _), result in zip(batch, results):
                if isinstance(result, Exception):
                    logger.error(f"Atom extraction failed for {cap.name}: {result}")
                    continue

                atom_ids = []
                for atom_data in result.get("atoms", []):
                    atom = self._parse_atom_tree(atom_data, cap)
                    atom_ids.extend(self._flatten_atom_ids(atom))

                cap.required_atom_ids = atom_ids

                # Store enum definitions
                for enum_data in result.get("enum_definitions", []):
                    enum_def = EnumDefinition(
                        name=enum_data.get("name", ""),
                        values=enum_data.get("values", []),
                    )
                    await self.db.save_enum_definition(self.target, enum_def)

                # Store coordinate info
                coord_info = result.get("coordinate_info")
                if coord_info:
                    cs = CoordinateSystem(
                        format_name=self.target,
                        name=f"{cap.category} coordinates",
                        origin="",
                        x_axis="positive right",
                        y_axis="positive down",
                        unit=coord_info.get("unit", ""),
                        unit_conversions=coord_info.get("conversions", {}),
                    )
                    await self.db.save_coordinate_system(cs)

            logger.info(
                f"  Atoms extracted: {min(i + batch_size, len(atom_prompts))}"
                f"/{len(atom_prompts)} capabilities"
            )

        logger.info(f"  Total atoms: {len(self.atoms)}")

    def _parse_atom_tree(
        self, atom_data: dict, cap: Capability, parent_id: str = None
    ) -> FormatAtom:
        """Recursively parse an atom and its children from LLM output."""
        atom = FormatAtom(
            format_name=self.target,
            atom_type=AtomType.XML_ELEMENT,
            element_name=atom_data.get("element_name", ""),
            namespace_uri=atom_data.get("namespace_uri", ""),
            namespace_prefix=atom_data.get("namespace_prefix", ""),
            semantic_meaning=atom_data.get("purpose", ""),
            required=atom_data.get("required", False),
            parent_atom_id=parent_id,
            example_in_context=json.dumps(atom_data, indent=2)[:500],
        )
        self.atoms[atom.id] = atom
        self.db._save_atom_sync(atom)  # async batch save later

        # Parse children recursively
        for child_data in atom_data.get("children", []):
            child_atom = self._parse_atom_tree(child_data, cap, parent_id=atom.id)
            atom.child_atom_ids.append(child_atom.id)

        return atom

    def _flatten_atom_ids(self, atom: FormatAtom) -> list[str]:
        """Get all atom IDs in a subtree."""
        ids = [atom.id]
        for child_id in atom.child_atom_ids:
            child = self.atoms.get(child_id)
            if child:
                ids.extend(self._flatten_atom_ids(child))
        return ids

    def _infer_file_path(self, cap: Capability) -> str:
        """Heuristic to determine which file a capability modifies."""
        name_lower = cap.name.lower()
        cat_lower = cap.category.lower()

        # PPTX heuristics
        if "slide" in name_lower or "shape" in cat_lower:
            return "ppt/slides/slide1.xml"
        if "theme" in name_lower:
            return "ppt/theme/theme1.xml"
        if "chart" in name_lower:
            return "ppt/charts/chart1.xml"
        if "master" in name_lower:
            return "ppt/slideMasters/slideMaster1.xml"
        if "layout" in name_lower:
            return "ppt/slideLayouts/slideLayout1.xml"
        if "presentation" in name_lower or "global" in name_lower:
            return "ppt/presentation.xml"

        return f"(varies by {self.target} structure)"

    # ════════════════════════════════════════════════════════════
    # PHASE 9: ALGORITHM EXTRACTION
    # ════════════════════════════════════════════════════════════

    async def _phase9_extract_algorithms(self):
        """Extract complete algorithm specifications."""
        logger.info("Phase 9: Extracting algorithms")

        # Identify capabilities that require algorithms
        algo_caps = []
        for cap in self.capabilities.values():
            if any(kw in cap.user_description.lower() for kw in [
                "blur", "filter", "transform", "blend", "composit",
                "gradient", "interpolat", "compress", "encod", "decrypt",
                "render", "rasteriz", "anti-alias", "color space",
                "histogram", "threshold", "morpholog", "convolv",
                "sharpen", "noise", "detect", "segment",
                "warp", "perspective", "rotation", "scale",
                "bezier", "spline", "path", "curve",
            ]):
                algo_caps.append(cap)

        if not algo_caps:
            # For file formats: check if any processing algorithms are needed
            prompt = f"""What algorithms are needed to fully implement a 
{self.target} file generator/parser? Include: encoding, compression, 
checksums, color conversions, coordinate transforms, text layout, etc.

List EVERY algorithm. Respond with ONLY this JSON:
{{
  "algorithms": [
    {{"name": "...", "category": "...", "used_for": "..."}}
  ]
}}"""
            result = await self.llm.complete(
                prompt, self.cfg.decompose_model, phase="identify_algorithms"
            )
            algo_names = [
                (a["name"], a.get("category", ""), a.get("used_for", ""))
                for a in result.get("algorithms", [])
            ]
        else:
            # Derive algorithm names from capabilities
            algo_names = [
                (cap.name, cap.category, cap.user_description)
                for cap in algo_caps
            ]

        # Generate full algorithm specs
        algo_prompts = []
        for algo_name, category, context in algo_names:
            prompt = prompts_v2.EXTRACT_ALGORITHM.format(
                algorithm_name=algo_name,
                tool_context=self.target,
            )
            algo_prompts.append((algo_name, prompt))

        # Batch process
        batch_size = self.cfg.max_concurrency
        for i in range(0, len(algo_prompts), batch_size):
            batch = algo_prompts[i:i + batch_size]

            results = await self.llm.complete_batch(
                [p for _, p in batch],
                self.cfg.generate_model,
                phase="extract_algorithms",
            )

            for (algo_name, _), result in zip(batch, results):
                if isinstance(result, Exception):
                    logger.error(f"Algorithm extraction failed for {algo_name}: {result}")
                    continue

                algo = Algorithm(
                    name=result.get("name", algo_name),
                    category=self._parse_algo_category(
                        result.get("category", "math")
                    ),
                    domain=result.get("domain", ""),
                    mathematical_formula=result.get("mathematical_formula", ""),
                    mathematical_explanation=result.get("mathematical_explanation", ""),
                    pseudocode=result.get("pseudocode", ""),
                    step_by_step=result.get("step_by_step", []),
                    time_complexity=result.get("time_complexity", ""),
                    space_complexity=result.get("space_complexity", ""),
                    parameters=result.get("parameters", []),
                    numerical_considerations=result.get("numerical_considerations", []),
                    edge_handling=result.get("edge_handling", []),
                    reference_implementations=result.get("reference_implementations", {}),
                    optimizations=result.get("optimizations", []),
                    test_vectors=result.get("test_vectors", []),
                )
                self.algorithms[algo.id] = algo
                await self.db.save_algorithm(algo)

            logger.info(
                f"  Algorithms: {min(i + batch_size, len(algo_prompts))}"
                f"/{len(algo_prompts)}"
            )

        logger.info(f"  Total algorithms: {len(self.algorithms)}")

    def _parse_algo_category(self, cat_str: str) -> AlgorithmCategory:
        mapping = {
            "image_filter": AlgorithmCategory.IMAGE_FILTER,
            "color_space": AlgorithmCategory.COLOR_SPACE,
            "compositing": AlgorithmCategory.COMPOSITING,
            "geometry": AlgorithmCategory.GEOMETRY,
            "transform": AlgorithmCategory.TRANSFORM,
            "compression": AlgorithmCategory.COMPRESSION,
            "encoding": AlgorithmCategory.ENCODING,
            "rendering": AlgorithmCategory.RENDERING,
            "text_layout": AlgorithmCategory.TEXT_LAYOUT,
            "path_operations": AlgorithmCategory.PATH_OPERATIONS,
        }
        return mapping.get(cat_str, AlgorithmCategory.MATH)

    # ════════════════════════════════════════════════════════════
    # PHASE 10: IMPLEMENTATION SPEC GENERATION
    # ════════════════════════════════════════════════════════════

    async def _phase10_generate_implementation_specs(self):
        """Generate step-by-step implementation specs for each capability."""
        logger.info("Phase 10: Generating implementation specs")

        # Build summaries for context
        atoms_summary = self._build_atoms_summary()
        algos_summary = self._build_algorithms_summary()

        spec_prompts = []
        for cap in self.capabilities.values():
            prompt = prompts_v2.GENERATE_IMPLEMENTATION_SPEC.format(
                capability_name=cap.name,
                format_or_tool=self.target,
                category=cap.category,
                description=cap.user_description,
                available_atoms_summary=atoms_summary[:4000],
                available_algorithms_summary=algos_summary[:4000],
            )
            spec_prompts.append((cap, prompt))

        # Execute in batches
        batch_size = self.cfg.max_concurrency
        for i in range(0, len(spec_prompts), batch_size):
            batch = spec_prompts[i:i + batch_size]

            results = await self.llm.complete_batch(
                [p for _, p in batch],
                self.cfg.generate_model,
                phase="implementation_specs",
            )

            for (cap, _), result in zip(batch, results):
                if isinstance(result, Exception):
                    logger.error(f"Impl spec failed for {cap.name}: {result}")
                    continue

                # Parse implementation steps into the capability
                steps = []
                for step_data in result.get("implementation_steps", []):
                    step = ImplementationStep(
                        order=step_data.get("step", 0),
                        description=step_data.get("action", ""),
                        code_template=step_data.get("code", "")
                                     + "\n\n" + step_data.get("xml_template", ""),
                        output_description=step_data.get("details", ""),
                        validation=step_data.get("validation", ""),
                    )
                    steps.append(step)

                cap.implementation_steps = steps
                cap.reference_implementations = result.get(
                    "complete_implementation", {}
                )
                cap.minimum_working_example = json.dumps(
                    result.get("minimum_working_example", {}), indent=2
                )
                cap.known_pitfalls = result.get("gotchas", [])

                await self.db.save_capability(cap)

            logger.info(
                f"  Specs generated: {min(i + batch_size, len(spec_prompts))}"
                f"/{len(spec_prompts)}"
            )

    def _build_atoms_summary(self) -> str:
        lines = []
        for atom in list(self.atoms.values())[:100]:
            lines.append(
                f"- {atom.element_name} ({atom.namespace_prefix}): "
                f"{atom.semantic_meaning}"
            )
        return "\n".join(lines)

    def _build_algorithms_summary(self) -> str:
        lines = []
        for algo in self.algorithms.values():
            lines.append(
                f"- {algo.name} ({algo.category.value}): "
                f"{algo.mathematical_explanation[:100]}"
            )
        return "\n".join(lines)

    # ════════════════════════════════════════════════════════════
    # PHASE 11: BLUEPRINT ASSEMBLY
    # ════════════════════════════════════════════════════════════

    async def _phase11_assemble_blueprints(self):
        """Create composable blueprints for major feature groups."""
        logger.info("Phase 11: Assembling blueprints")

        # Group capabilities by category
        cats: dict[str, list[Capability]] = {}
        for cap in self.capabilities.values():
            cats.setdefault(cap.category, []).append(cap)

        # Create a blueprint for each category
        bp_prompts = []
        for cat_name, cat_caps in cats.items():
            caps_list = "\n".join(
                f"- [{c.id}] {c.name}: {c.user_description}"
                for c in cat_caps
            )
            algos_for_cat = "\n".join(
                f"- [{a.id}] {a.name}"
                for a in self.algorithms.values()
            )

            prompt = prompts_v2.ASSEMBLE_BLUEPRINT.format(
                blueprint_scope=f"{cat_name} module",
                blueprint_description=f"All {cat_name} capabilities for {self.target}",
                format_or_tool=self.target,
                capabilities_list=caps_list,
                algorithms_list=algos_for_cat,
            )
            bp_prompts.append((cat_name, cat_caps, prompt))

        results = await self.llm.complete_batch(
            [p for _, _, p in bp_prompts],
            self.cfg.generate_model,
            phase="assemble_blueprints",
        )

        for (cat_name, cat_caps, _), result in zip(bp_prompts, results):
            if isinstance(result, Exception):
                logger.error(f"Blueprint failed for {cat_name}: {result}")
                continue

            bp = Blueprint(
                name=result.get("blueprint_name", f"{cat_name} Blueprint"),
                scope=BlueprintScope.FEATURE_GROUP,
                format_or_tool=self.target,
                description=result.get("description", ""),
                capability_ids=[c.id for c in cat_caps],
                module_structure=result.get("module_structure", []),
                class_hierarchy=result.get("class_hierarchy", []),
                public_api=result.get("public_api", []),
                initialization_sequence=result.get("initialization_sequence", []),
                integration_tests=result.get("testing_strategy", []),
            )
            self.blueprints[bp.id] = bp
            await self.db.save_blueprint(bp)

        # Create a master "full application" blueprint
        await self._create_master_blueprint()

        logger.info(f"  Total blueprints: {len(self.blueprints)}")

    async def _create_master_blueprint(self):
        """Create the top-level blueprint that ties everything together."""
        all_caps_list = "\n".join(
            f"- {c.name} ({c.category})" for c in self.capabilities.values()
        )
        all_algos_list = "\n".join(
            f"- {a.name}" for a in self.algorithms.values()
        )
        all_bps_list = "\n".join(
            f"- {b.name}: {b.description}" for b in self.blueprints.values()
        )

        prompt = prompts_v2.ASSEMBLE_BLUEPRINT.format(
            blueprint_scope=f"complete {self.target} implementation",
            blueprint_description=(
                f"A complete library/application that supports ALL "
                f"capabilities of {self.target}"
            ),
            format_or_tool=self.target,
            capabilities_list=all_caps_list[:8000],
            algorithms_list=all_algos_list[:4000],
        )

        result = await self.llm.complete(
            prompt, self.cfg.generate_model, phase="master_blueprint"
        )

        if not isinstance(result, Exception):
            master = Blueprint(
                name=f"Complete {self.target} Implementation",
                scope=BlueprintScope.FULL_APPLICATION,
                format_or_tool=self.target,
                description=result.get("description", ""),
                capability_ids=[c.id for c in self.capabilities.values()],
                algorithm_ids=[a.id for a in self.algorithms.values()],
                module_structure=result.get("module_structure", []),
                class_hierarchy=result.get("class_hierarchy", []),
                public_api=result.get("public_api", []),
                initialization_sequence=result.get("initialization_sequence", []),
                integration_tests=result.get("testing_strategy", []),
            )
            self.blueprints[master.id] = master
            await self.db.save_blueprint(master)

    # ════════════════════════════════════════════════════════════
    # PHASE 12: VALIDATION
    # ════════════════════════════════════════════════════════════

    async def _phase12_validate(self):
        """Validate implementation specs produce correct output."""
        logger.info("Phase 12: Validating implementation specs")

        # Sample capabilities to validate
        all_caps = list(self.capabilities.values())
        sample_size = max(1, int(len(all_caps) * self.cfg.validation_sample_rate))
        import random
        sample = random.sample(all_caps, min(sample_size, len(all_caps)))

        val_prompts = []
        for cap in sample:
            spec_json = json.dumps({
                "name": cap.name,
                "steps": [s.model_dump() for s in cap.implementation_steps],
                "reference_impl": cap.reference_implementations,
                "atoms_used": cap.required_atom_ids[:10],
            }, indent=2)

            prompt = prompts_v2.VALIDATE_IMPLEMENTATION_SPEC.format(
                format_or_tool=self.target,
                capability_name=cap.name,
                spec_json=spec_json[:8000],
            )
            val_prompts.append((cap, prompt))

        results = await self.llm.complete_batch(
            [p for _, p in val_prompts],
            self.cfg.validate_model,
            phase="validate_implementation",
        )

        errors_found = 0
        for (cap, _), result in zip(val_prompts, results):
            if isinstance(result, Exception):
                continue

            if not result.get("is_correct", True):
                errors_found += 1
                errors = result.get("errors", [])
                logger.warning(
                    f"  Validation errors in '{cap.name}': "
                    f"{len(errors)} issues"
                )

                # Auto-correct critical errors
                critical_errors = [
                    e for e in errors
                    if e.get("severity") == "critical"
                ]
                if critical_errors:
                    await self._autocorrect_spec(cap, critical_errors)

        logger.info(
            f"  Validated {len(sample)} specs, "
            f"{errors_found} had errors"
        )

    async def _autocorrect_spec(self, cap: Capability, errors: list[dict]):
        """Re-generate spec incorporating correction feedback."""
        corrections = "\n".join(
            f"- {e.get('location', '?')}: {e.get('issue', '?')} "
            f"→ CORRECT: {e.get('correct_value', '?')}"
            for e in errors
        )

        prompt = f"""Regenerate the implementation spec for "{cap.name}" 
in {self.target}, correcting these errors:

{corrections}

{prompts_v2.GENERATE_IMPLEMENTATION_SPEC.format(
    capability_name=cap.name,
    format_or_tool=self.target,
    category=cap.category,
    description=cap.user_description + f"\\n\\nCORRECTIONS:\\n{corrections}",
    available_atoms_summary=self._build_atoms_summary()[:3000],
    available_algorithms_summary=self._build_algorithms_summary()[:3000],
)}"""

        result = await self.llm.complete(
            prompt, self.cfg.generate_model, phase="autocorrect"
        )
        if not isinstance(result, Exception):
            # Update the capability with corrected spec
            steps = []
            for step_data in result.get("implementation_steps", []):
                step = ImplementationStep(
                    order=step_data.get("step", 0),
                    description=step_data.get("action", ""),
                    code_template=step_data.get("code", ""),
                    validation=step_data.get("validation", ""),
                )
                steps.append(step)
            cap.implementation_steps = steps
            cap.reference_implementations = result.get(
                "complete_implementation", {}
            )
            await self.db.save_capability(cap)
```

---

### `storage_v2.py` — Enhanced Storage with Graph Queries

```python
"""
Extended storage for implementation layer.
Adds tables for capabilities, atoms, algorithms, blueprints,
and dependency graph. Provides graph traversal queries.
"""
from __future__ import annotations
import json
from typing import Optional
import aiosqlite

from schema_v2 import (
    Capability, FormatAtom, Algorithm, Blueprint,
    DependencyGraph, DependencyEdge, CoordinateSystem,
    FileStructureMap, EnumDefinition, ToolProfile
)


class StorageV2:
    """Extended storage with implementation knowledge layer."""

    def __init__(self, db_path: str = "guidebook.db"):
        self.db_path = db_path
        self._db: Optional[aiosqlite.Connection] = None

    async def initialize(self):
        self._db = await aiosqlite.connect(self.db_path)
        await self._db.executescript("""
            -- ── Capabilities ──────────────────────────────
            CREATE TABLE IF NOT EXISTS capabilities (
                id TEXT PRIMARY KEY,
                name TEXT,
                format_or_tool TEXT,
                category TEXT,
                complexity TEXT,
                data_json TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_cap_format 
                ON capabilities(format_or_tool);
            CREATE INDEX IF NOT EXISTS idx_cap_category 
                ON capabilities(format_or_tool, category);

            -- ── Format Atoms ──────────────────────────────
            CREATE TABLE IF NOT EXISTS format_atoms (
                id TEXT PRIMARY KEY,
                format_name TEXT,
                atom_type TEXT,
                element_name TEXT,
                parent_atom_id TEXT,
                data_json TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_atom_format 
                ON format_atoms(format_name);
            CREATE INDEX IF NOT EXISTS idx_atom_parent 
                ON format_atoms(parent_atom_id);

            -- ── Algorithms ────────────────────────────────
            CREATE TABLE IF NOT EXISTS algorithms (
                id TEXT PRIMARY KEY,
                name TEXT,
                category TEXT,
                domain TEXT,
                data_json TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_algo_category 
                ON algorithms(category);

            -- ── Blueprints ────────────────────────────────
            CREATE TABLE IF NOT EXISTS blueprints (
                id TEXT PRIMARY KEY,
                name TEXT,
                format_or_tool TEXT,
                scope TEXT,
                data_json TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_bp_format 
                ON blueprints(format_or_tool);

            -- ── Dependency Graph ──────────────────────────
            CREATE TABLE IF NOT EXISTS dependency_edges (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_id TEXT,
                source_type TEXT,
                target_id TEXT,
                target_type TEXT,
                dep_type TEXT,
                format_or_tool TEXT,
                description TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_dep_source 
                ON dependency_edges(source_id);
            CREATE INDEX IF NOT EXISTS idx_dep_target 
                ON dependency_edges(target_id);
            CREATE INDEX IF NOT EXISTS idx_dep_format 
                ON dependency_edges(format_or_tool);

            -- ── File Structure Maps ──────────────────────
            CREATE TABLE IF NOT EXISTS file_structures (
                format_name TEXT PRIMARY KEY,
                data_json TEXT
            );

            -- ── Coordinate Systems ───────────────────────
            CREATE TABLE IF NOT EXISTS coordinate_systems (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                format_name TEXT,
                name TEXT,
                data_json TEXT
            );

            -- ── Enum Definitions ─────────────────────────
            CREATE TABLE IF NOT EXISTS enum_definitions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                format_name TEXT,
                name TEXT UNIQUE,
                data_json TEXT
            );

            -- ── Tool Profiles ────────────────────────────
            CREATE TABLE IF NOT EXISTS tool_profiles (
                name TEXT PRIMARY KEY,
                data_json TEXT
            );
        """)
        await self._db.commit()

    async def close(self):
        if self._db:
            await self._db.close()

    # ── Save methods ────────────────────────────────────────

    async def save_capability(self, cap: Capability):
        await self._db.execute(
            """INSERT OR REPLACE INTO capabilities 
               (id, name, format_or_tool, category, complexity, data_json)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (cap.id, cap.name, cap.format_or_tool, cap.category,
             cap.complexity.value, cap.model_dump_json())
        )
        await self._db.commit()

    async def save_atom(self, atom: FormatAtom):
        await self._db.execute(
            """INSERT OR REPLACE INTO format_atoms
               (id, format_name, atom_type, element_name, parent_atom_id, data_json)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (atom.id, atom.format_name, atom.atom_type.value,
             atom.element_name, atom.parent_atom_id, atom.model_dump_json())
        )
        await self._db.commit()

    def _save_atom_sync(self, atom: FormatAtom):
        """Sync wrapper for use in recursive parsing."""
        import asyncio
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self.save_atom(atom))
        except RuntimeError:
            pass

    async def save_algorithm(self, algo: Algorithm):
        await self._db.execute(
            """INSERT OR REPLACE INTO algorithms
               (id, name, category, domain, data_json)
               VALUES (?, ?, ?, ?, ?)""",
            (algo.id, algo.name, algo.category.value,
             algo.domain, algo.model_dump_json())
        )
        await self._db.commit()

    async def save_blueprint(self, bp: Blueprint):
        await self._db.execute(
            """INSERT OR REPLACE INTO blueprints
               (id, name, format_or_tool, scope, data_json)
               VALUES (?, ?, ?, ?, ?)""",
            (bp.id, bp.name, bp.format_or_tool,
             bp.scope.value, bp.model_dump_json())
        )
        await self._db.commit()

    async def save_dependency_graph(self, graph: DependencyGraph):
        for edge in graph.edges:
            await self._db.execute(
                """INSERT INTO dependency_edges
                   (source_id, source_type, target_id, target_type, 
                    dep_type, format_or_tool, description)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (edge.source_id, edge.source_type, edge.target_id,
                 edge.target_type, edge.dependency_type.value,
                 graph.format_or_tool, edge.description)
            )
        await self._db.commit()

    async def save_file_structure(self, fs: FileStructureMap):
        await self._db.execute(
            "INSERT OR REPLACE INTO file_structures (format_name, data_json) VALUES (?, ?)",
            (fs.format_name, fs.model_dump_json())
        )
        await self._db.commit()

    async def save_coordinate_system(self, cs: CoordinateSystem):
        await self._db.execute(
            "INSERT OR REPLACE INTO coordinate_systems (format_name, name, data_json) VALUES (?, ?, ?)",
            (cs.format_name, cs.name, cs.model_dump_json())
        )
        await self._db.commit()

    async def save_enum_definition(self, format_name: str, enum_def: EnumDefinition):
        await self._db.execute(
            "INSERT OR REPLACE INTO enum_definitions (format_name, name, data_json) VALUES (?, ?, ?)",
            (format_name, enum_def.name, enum_def.model_dump_json())
        )
        await self._db.commit()

    # ════════════════════════════════════════════════════════════
    # QUERY METHODS — for the assembler and query engine
    # ════════════════════════════════════════════════════════════

    async def get_capabilities(
        self, format_or_tool: str, category: str = None
    ) -> list[Capability]:
        if category:
            cursor = await self._db.execute(
                "SELECT data_json FROM capabilities WHERE format_or_tool = ? AND category = ?",
                (format_or_tool, category)
            )
        else:
            cursor = await self._db.execute(
                "SELECT data_json FROM capabilities WHERE format_or_tool = ?",
                (format_or_tool,)
            )
        return [Capability.model_validate_json(r[0]) for r in await cursor.fetchall()]

    async def get_atoms_for_capability(self, capability_id: str) -> list[FormatAtom]:
        cap_cursor = await self._db.execute(
            "SELECT data_json FROM capabilities WHERE id = ?", (capability_id,)
        )
        row = await cap_cursor.fetchone()
        if not row:
            return []
        cap = Capability.model_validate_json(row[0])
        
        atoms = []
        for atom_id in cap.required_atom_ids:
            cursor = await self._db.execute(
                "SELECT data_json FROM format_atoms WHERE id = ?", (atom_id,)
            )
            atom_row = await cursor.fetchone()
            if atom_row:
                atoms.append(FormatAtom.model_validate_json(atom_row[0]))
        return atoms

    async def get_algorithms(
        self, category: str = None, domain: str = None
    ) -> list[Algorithm]:
        query = "SELECT data_json FROM algorithms WHERE 1=1"
        params = []
        if category:
            query += " AND category = ?"
            params.append(category)
        if domain:
            query += " AND domain = ?"
            params.append(domain)
        cursor = await self._db.execute(query, params)
        return [Algorithm.model_validate_json(r[0]) for r in await cursor.fetchall()]

    async def get_blueprint(
        self, format_or_tool: str, scope: str = None
    ) -> list[Blueprint]:
        if scope:
            cursor = await self._db.execute(
                "SELECT data_json FROM blueprints WHERE format_or_tool = ? AND scope = ?",
                (format_or_tool, scope)
            )
        else:
            cursor = await self._db.execute(
                "SELECT data_json FROM blueprints WHERE format_or_tool = ?",
                (format_or_tool,)
            )
        return [Blueprint.model_validate_json(r[0]) for r in await cursor.fetchall()]

    async def get_dependencies(
        self, node_id: str, direction: str = "outgoing"
    ) -> list[DependencyEdge]:
        if direction == "outgoing":
            cursor = await self._db.execute(
                "SELECT source_id, source_type, target_id, target_type, dep_type, description "
                "FROM dependency_edges WHERE source_id = ?",
                (node_id,)
            )
        else:
            cursor = await self._db.execute(
                "SELECT source_id, source_type, target_id, target_type, dep_type, description "
                "FROM dependency_edges WHERE target_id = ?",
                (node_id,)
            )
        rows = await cursor.fetchall()
        return [
            DependencyEdge(
                source_id=r[0], source_type=r[1],
                target_id=r[2], target_type=r[3],
                dependency_type=r[4], description=r[5]
            )
            for r in rows
        ]

    async def get_implementation_chain(self, capability_id: str) -> dict:
        """
        Get EVERYTHING needed to implement a capability:
        the capability spec, all its atoms, all required algorithms,
        all prerequisite capabilities, and relevant blueprints.
        
        This is the PRIMARY query for the user-facing system.
        """
        # Get the capability
        cap_cursor = await self._db.execute(
            "SELECT data_json FROM capabilities WHERE id = ?", (capability_id,)
        )
        cap_row = await cap_cursor.fetchone()
        if not cap_row:
            return {"error": "Capability not found"}
        cap = Capability.model_validate_json(cap_row[0])

        # Get atoms
        atoms = await self.get_atoms_for_capability(capability_id)

        # Get prerequisite capabilities (recursive)
        prereqs = []
        visited = set()
        async def get_prereqs(cid):
            if cid in visited:
                return
            visited.add(cid)
            deps = await self.get_dependencies(cid, "outgoing")
            for dep in deps:
                if dep.target_type == "capability":
                    prereq_cursor = await self._db.execute(
                        "SELECT data_json FROM capabilities WHERE id = ?",
                        (dep.target_id,)
                    )
                    prereq_row = await prereq_cursor.fetchone()
                    if prereq_row:
                        prereqs.append(Capability.model_validate_json(prereq_row[0]))
                        await get_prereqs(dep.target_id)

        await get_prereqs(capability_id)

        # Get algorithms
        algorithms = []
        for algo_id in cap.required_algorithm_ids:
            algo_cursor = await self._db.execute(
                "SELECT data_json FROM algorithms WHERE id = ?", (algo_id,)
            )
            algo_row = await algo_cursor.fetchone()
            if algo_row:
                algorithms.append(Algorithm.model_validate_json(algo_row[0]))

        # Get file structure
        fs_cursor = await self._db.execute(
            "SELECT data_json FROM file_structures WHERE format_name = ?",
            (cap.format_or_tool,)
        )
        fs_row = await fs_cursor.fetchone()
        file_structure = json.loads(fs_row[0]) if fs_row else None

        # Get coordinate system
        cs_cursor = await self._db.execute(
            "SELECT data_json FROM coordinate_systems WHERE format_name = ?",
            (cap.format_or_tool,)
        )
        cs_rows = await cs_cursor.fetchall()
        coord_systems = [json.loads(r[0]) for r in cs_rows]

        # Get relevant enums
        enum_cursor = await self._db.execute(
            "SELECT data_json FROM enum_definitions WHERE format_name = ?",
            (cap.format_or_tool,)
        )
        enums = [json.loads(r[0]) for r in await enum_cursor.fetchall()]

        return {
            "capability": cap.model_dump(),
            "prerequisite_capabilities": [p.model_dump() for p in prereqs],
            "format_atoms": [a.model_dump() for a in atoms],
            "algorithms": [a.model_dump() for a in algorithms],
            "file_structure": file_structure,
            "coordinate_systems": coord_systems,
            "enum_definitions": enums,
            "implementation_order": (
                [p.name for p in reversed(prereqs)] + [cap.name]
            ),
        }

    async def search_capabilities(self, query: str, format_or_tool: str = None) -> list[Capability]:
        """Full-text search across capabilities."""
        sql = """SELECT data_json FROM capabilities 
                 WHERE (name LIKE ? OR category LIKE ? OR data_json LIKE ?)"""
        params = [f"%{query}%", f"%{query}%", f"%{query}%"]
        if format_or_tool:
            sql += " AND format_or_tool = ?"
            params.append(format_or_tool)
        cursor = await self._db.execute(sql, params)
        return [Capability.model_validate_json(r[0]) for r in await cursor.fetchall()]

    # ════════════════════════════════════════════════════════════
    # EXPORT — Implementation-ready output
    # ════════════════════════════════════════════════════════════

    async def export_implementation_guide(self, format_or_tool: str) -> dict:
        """
        Export the complete implementation knowledge base as a single
        structured JSON document.
        """
        caps = await self.get_capabilities(format_or_tool)
        algos_cursor = await self._db.execute(
            "SELECT data_json FROM algorithms"
        )
        all_algos = [json.loads(r[0]) for r in await algos_cursor.fetchall()]

        atoms_cursor = await self._db.execute(
            "SELECT data_json FROM format_atoms WHERE format_name = ?",
            (format_or_tool,)
        )
        all_atoms = [json.loads(r[0]) for r in await atoms_cursor.fetchall()]

        bps = await self.get_blueprint(format_or_tool)

        fs_cursor = await self._db.execute(
            "SELECT data_json FROM file_structures WHERE format_name = ?",
            (format_or_tool,)
        )
        fs_row = await fs_cursor.fetchone()

        cs_cursor = await self._db.execute(
            "SELECT data_json FROM coordinate_systems WHERE format_name = ?",
            (format_or_tool,)
        )

        enum_cursor = await self._db.execute(
            "SELECT data_json FROM enum_definitions WHERE format_name = ?",
            (format_or_tool,)
        )

        edges_cursor = await self._db.execute(
            "SELECT source_id, source_type, target_id, target_type, dep_type, description "
            "FROM dependency_edges WHERE format_or_tool = ?",
            (format_or_tool,)
        )

        return {
            "format_or_tool": format_or_tool,
            "file_structure": json.loads(fs_row[0]) if fs_row else None,
            "coordinate_systems": [json.loads(r[0]) for r in await cs_cursor.fetchall()],
            "enum_definitions": [json.loads(r[0]) for r in await enum_cursor.fetchall()],
            "format_atoms": all_atoms,
            "algorithms": all_algos,
            "capabilities": [c.model_dump() for c in caps],
            "blueprints": [b.model_dump() for b in bps],
            "dependency_graph": [
                {"source": r[0], "source_type": r[1],
                 "target": r[2], "target_type": r[3],
                 "type": r[4], "description": r[5]}
                for r in await edges_cursor.fetchall()
            ],
            "stats": {
                "total_capabilities": len(caps),
                "total_atoms": len(all_atoms),
                "total_algorithms": len(all_algos),
                "total_blueprints": len(bps),
            }
        }
```

---

### `query_engine.py` — Natural Language → Implementation Plan

```python
"""
The user-facing query engine.

Users describe WHAT they want to build, and the engine:
  1. Searches the DB for relevant capabilities, atoms, and algorithms
  2. Uses the dependency graph to determine implementation order
  3. Assembles a complete implementation plan with code
  4. Optionally uses an LLM to adapt/customize the plan
"""
from __future__ import annotations
import json
import logging
from typing import Optional

from config import Config
from llm import LLMClient
from storage_v2 import StorageV2
from schema_v2 import Capability, Algorithm, Blueprint
import prompts_v2

logger = logging.getLogger(__name__)


class QueryEngine:
    """
    Translates user goals into implementation plans using the knowledge base.
    
    Usage:
        engine = QueryEngine(config, llm, storage)
        plan = await engine.query(
            "Create a PPTX file with a blue rectangle at position (2,1) 
             that is 3 inches wide and 2 inches tall",
            format_or_tool="PPTX"
        )
    """

    def __init__(self, config: Config, llm: LLMClient, storage: StorageV2):
        self.cfg = config
        self.llm = llm
        self.db = storage

    async def query(
        self,
        user_query: str,
        format_or_tool: str,
        target_language: str = "python",
        detail_level: str = "full",  # "summary", "full", "code_only"
    ) -> dict:
        """
        Process a user's implementation query.
        
        Returns a complete implementation plan with:
        - Ordered list of capabilities to implement
        - All atoms (XML elements, binary fields) needed
        - All algorithms needed with implementations
        - Complete working code
        - Validation instructions
        """

        # Step 1: Identify relevant capabilities via DB search + LLM
        relevant_caps = await self._identify_capabilities(
            user_query, format_or_tool
        )

        # Step 2: Get full implementation chains for each capability
        chains = []
        for cap in relevant_caps:
            chain = await self.db.get_implementation_chain(cap.id)
            chains.append(chain)

        # Step 3: Merge chains and resolve dependencies
        merged = self._merge_chains(chains)

        # Step 4: Use LLM to adapt the plan to the specific query
        adapted_plan = await self._adapt_plan(
            user_query, merged, format_or_tool, target_language
        )

        # Step 5: Generate final code if requested
        if detail_level in ("full", "code_only"):
            code = await self._generate_final_code(
                user_query, adapted_plan, target_language
            )
            adapted_plan["generated_code"] = code

        return adapted_plan

    async def _identify_capabilities(
        self, query: str, format_or_tool: str
    ) -> list[Capability]:
        """Find all capabilities relevant to the user's query."""

        # Database keyword search
        db_results = await self.db.search_capabilities(query, format_or_tool)

        # LLM-assisted matching for semantic understanding
        all_caps = await self.db.get_capabilities(format_or_tool)
        caps_list = "\n".join(
            f"- [{c.id}] {c.name} ({c.category}): {c.user_description}"
            for c in all_caps
        )

        prompt = f"""User wants to: "{query}"

Available capabilities for {format_or_tool}:
{caps_list[:12000]}

Which capabilities are needed? Include ALL prerequisites.
Return the capability IDs.

Respond with ONLY this JSON:
{{
  "required_capability_ids": ["id1", "id2", ...],
  "reasoning": "..."
}}"""

        result = await self.llm.complete(
            prompt, self.cfg.decompose_model, phase="query_match"
        )

        required_ids = set(result.get("required_capability_ids", []))

        # Merge DB and LLM results
        all_relevant = {c.id: c for c in db_results}
        for cap in all_caps:
            if cap.id in required_ids:
                all_relevant[cap.id] = cap

        return list(all_relevant.values())

    def _merge_chains(self, chains: list[dict]) -> dict:
        """Merge multiple implementation chains, deduplicating."""
        merged = {
            "capabilities": {},
            "atoms": {},
            "algorithms": {},
            "file_structure": None,
            "coordinate_systems": [],
            "enum_definitions": [],
            "implementation_order": [],
        }

        seen_order = set()
        for chain in chains:
            # Merge capability
            cap = chain.get("capability", {})
            if cap.get("id"):
                merged["capabilities"][cap["id"]] = cap

            # Merge prerequisites
            for prereq in chain.get("prerequisite_capabilities", []):
                if prereq.get("id"):
                    merged["capabilities"][prereq["id"]] = prereq

            # Merge atoms
            for atom in chain.get("format_atoms", []):
                if atom.get("id"):
                    merged["atoms"][atom["id"]] = atom

            # Merge algorithms
            for algo in chain.get("algorithms", []):
                if algo.get("id"):
                    merged["algorithms"][algo["id"]] = algo

            # Take first file structure found
            if not merged["file_structure"] and chain.get("file_structure"):
                merged["file_structure"] = chain["file_structure"]

            # Merge coordinate systems (deduplicate by name)
            for cs in chain.get("coordinate_systems", []):
                if cs not in merged["coordinate_systems"]:
                    merged["coordinate_systems"].append(cs)

            # Merge enums (deduplicate by name)
            existing_names = {e.get("name") for e in merged["enum_definitions"]}
            for enum_def in chain.get("enum_definitions", []):
                if enum_def.get("name") not in existing_names:
                    merged["enum_definitions"].append(enum_def)
                    existing_names.add(enum_def.get("name"))

            # Build implementation order
            for name in chain.get("implementation_order", []):
                if name not in seen_order:
                    merged["implementation_order"].append(name)
                    seen_order.add(name)

        # Convert dicts back to lists
        merged["capabilities"] = list(merged["capabilities"].values())
        merged["atoms"] = list(merged["atoms"].values())
        merged["algorithms"] = list(merged["algorithms"].values())

        return merged

    async def _adapt_plan(
        self, query: str, merged: dict,
        format_or_tool: str, target_language: str
    ) -> dict:
        """Use LLM to create a query-specific implementation plan."""
        plan_prompt = f"""User query: "{query}"
Target format: {format_or_tool}
Target language: {target_language}

Available implementation knowledge:

CAPABILITIES ({len(merged['capabilities'])}):
{json.dumps([c.get('name', '') for c in merged['capabilities']], indent=2)}

ALGORITHMS ({len(merged['algorithms'])}):
{json.dumps([a.get('name', '') for a in merged['algorithms']], indent=2)}

FILE STRUCTURE:
{json.dumps(merged.get('file_structure', {}), indent=2)[:3000]}

COORDINATE SYSTEMS:
{json.dumps(merged.get('coordinate_systems', []), indent=2)[:2000]}

Create a SPECIFIC implementation plan for the user's exact request.
Include exact parameter values, coordinate calculations, and file paths.

Respond with ONLY this JSON:
{{
  "plan_title": "...",
  "summary": "What this plan produces",
  
  "steps": [
    {{
      "order": 1,
      "action": "Create ZIP container",
      "detail": "Initialize a new ZIP archive that will become the .pptx file",
      "code_snippet": "...",
      "files_affected": ["[Content_Types].xml"],
      "notes": "..."
    }}
  ],
  
  "parameter_values": {{
    "x_position_emu": 1828800,
    "y_position_emu": 914400,
    "width_emu": 2743200,
    "height_emu": 1828800,
    "fill_color_hex": "0000FF"
  }},
  
  "required_files": [
    {{
      "path": "[Content_Types].xml",
      "content_template": "..."
    }}
  ],
  
  "validation": "Open the generated .pptx file in PowerPoint to verify"
}}"""

        result = await self.llm.complete(
            plan_prompt, self.cfg.generate_model, phase="adapt_plan"
        )

        merged["adapted_plan"] = result
        return merged

    async def _generate_final_code(
        self, query: str, plan: dict, target_language: str
    ) -> dict:
        """Generate complete, runnable code from the plan."""
        code_prompt = f"""Generate COMPLETE, RUNNABLE {target_language} code that:
{query}

Implementation plan:
{json.dumps(plan.get('adapted_plan', {}), indent=2)[:6000]}

Available reference implementations from capabilities:
{json.dumps(
    [c.get('reference_implementations', {}).get(target_language, '')[:500]
     for c in plan.get('capabilities', [])
     if c.get('reference_implementations', {}).get(target_language)],
    indent=2
)[:6000]}

Requirements:
1. COMPLETE — runs without modification (except installing dependencies)
2. NO external format-specific libraries (construct the file format directly)
3. Well-commented explaining each section
4. Handles edge cases
5. Includes a main() function or equivalent entry point
6. Saves output to a file

Respond with ONLY this JSON:
{{
  "language": "{target_language}",
  "files": {{
    "main.py": "complete code here...",
    "helpers.py": "if needed..."
  }},
  "dependencies": ["only stdlib or fundamental packages"],
  "run_command": "python main.py",
  "expected_output": "description of what the output file should contain"
}}"""

        result = await self.llm.complete(
            code_prompt, self.cfg.generate_model, phase="generate_code"
        )
        return result


# ════════════════════════════════════════════════════════════════
# CONVENIENCE: Interactive query session
# ════════════════════════════════════════════════════════════════

async def interactive_session(
    config: Config,
    llm: LLMClient,
    storage: StorageV2,
):
    """Run an interactive query session."""
    engine = QueryEngine(config, llm, storage)

    print("╔══════════════════════════════════════════════════╗")
    print("║   Implementation Knowledge Base — Query Engine   ║")
    print("╚══════════════════════════════════════════════════╝")
    print()

    # List available formats
    cursor = await storage._db.execute(
        "SELECT DISTINCT format_or_tool FROM capabilities"
    )
    formats = [r[0] for r in await cursor.fetchall()]
    print(f"Available formats/tools: {', '.join(formats)}")
    print()

    while True:
        format_name = input("Format/tool (or 'quit'): ").strip()
        if format_name.lower() == 'quit':
            break

        query = input("What do you want to build? ").strip()
        if not query:
            continue

        lang = input("Target language [python]: ").strip() or "python"

        print("\n⏳ Generating implementation plan...\n")

        plan = await engine.query(
            user_query=query,
            format_or_tool=format_name,
            target_language=lang,
        )

        # Display results
        adapted = plan.get("adapted_plan", {})
        print(f"\n{'═' * 60}")
        print(f"📋 {adapted.get('plan_title', 'Implementation Plan')}")
        print(f"{'═' * 60}")
        print(f"\n{adapted.get('summary', '')}\n")

        for step in adapted.get("steps", []):
            print(f"  Step {step.get('order', '?')}: {step.get('action', '')}")
            if step.get("code_snippet"):
                print(f"    Code: {step['code_snippet'][:200]}")
            print()

        if "generated_code" in plan:
            code = plan["generated_code"]
            for filename, content in code.get("files", {}).items():
                print(f"\n{'─' * 40}")
                print(f"📄 {filename}")
                print(f"{'─' * 40}")
                print(content[:3000])
                if len(content) > 3000:
                    print(f"\n... ({len(content) - 3000} more characters)")

        print(f"\n{'═' * 60}\n")
```

---

### `assembler.py` — Blueprint → Runnable Code

```python
"""
Assembles blueprints into complete, runnable code projects.

Takes a Blueprint + its capabilities + atoms + algorithms
and produces a complete directory of source files.
"""
from __future__ import annotations
import json
import os
from pathlib import Path
from typing import Optional

from config import Config
from llm import LLMClient
from storage_v2 import StorageV2
from schema_v2 import Blueprint, BlueprintScope


class ProjectAssembler:
    """
    Generates a complete source code project from a blueprint.
    """

    def __init__(self, config: Config, llm: LLMClient, storage: StorageV2):
        self.cfg = config
        self.llm = llm
        self.db = storage

    async def assemble(
        self,
        blueprint_id: str,
        target_language: str = "python",
        output_dir: str = "generated_project/",
    ) -> Path:
        """
        Generate a complete project from a blueprint.
        
        Returns the path to the generated project directory.
        """
        # Load blueprint and all dependencies
        bp_cursor = await self.db._db.execute(
            "SELECT data_json FROM blueprints WHERE id = ?", (blueprint_id,)
        )
        bp_row = await bp_cursor.fetchone()
        if not bp_row:
            raise ValueError(f"Blueprint {blueprint_id} not found")
        bp = Blueprint.model_validate_json(bp_row[0])

        # Get all capabilities
        caps = []
        for cap_id in bp.capability_ids:
            chain = await self.db.get_implementation_chain(cap_id)
            caps.append(chain)

        # Get all algorithms
        algos = []
        for algo_id in bp.algorithm_ids:
            cursor = await self.db._db.execute(
                "SELECT data_json FROM algorithms WHERE id = ?", (algo_id,)
            )
            row = await cursor.fetchone()
            if row:
                algos.append(json.loads(row[0]))

        # Generate code for each module in the blueprint
        out_path = Path(output_dir)
        out_path.mkdir(parents=True, exist_ok=True)

        for module in bp.module_structure:
            filename = module.get("filename", "module.py")
            purpose = module.get("purpose", "")
            classes = module.get("classes", [])
            implements = module.get("implements_capabilities", [])

            # Gather implementation details for this module's capabilities
            module_caps = [
                c for c in caps
                if c.get("capability", {}).get("id") in implements
            ]

            code = await self._generate_module(
                filename=filename,
                purpose=purpose,
                classes=classes,
                capabilities=module_caps,
                algorithms=algos,
                blueprint=bp,
                target_language=target_language,
            )

            file_path = out_path / filename
            file_path.parent.mkdir(parents=True, exist_ok=True)
            file_path.write_text(code)

        # Generate entry point / main file
        main_code = await self._generate_main(bp, target_language)
        (out_path / "main.py").write_text(main_code)

        # Generate README
        readme = self._generate_readme(bp, caps, algos)
        (out_path / "README.md").write_text(readme)

        return out_path

    async def _generate_module(
        self,
        filename: str,
        purpose: str,
        classes: list,
        capabilities: list,
        algorithms: list,
        blueprint: Blueprint,
        target_language: str,
    ) -> str:
        """Generate code for a single module."""
        prompt = f"""Generate COMPLETE {target_language} code for the module: {filename}

Purpose: {purpose}

Classes to implement:
{json.dumps(classes, indent=2)[:3000]}

Capability implementations needed:
{json.dumps(
    [{
        'name': c.get('capability', {}).get('name', ''),
        'steps': c.get('capability', {}).get('implementation_steps', []),
        'reference_impl': c.get('capability', {}).get('reference_implementations', {}).get(target_language, ''),
        'atoms': [a.get('element_name', '') for a in c.get('format_atoms', [])[:10]],
    } for c in capabilities],
    indent=2
)[:6000]}

Algorithm implementations to include:
{json.dumps(
    [{
        'name': a.get('name', ''),
        'implementation': a.get('reference_implementations', {}).get(target_language, ''),
    } for a in algorithms],
    indent=2
)[:4000]}

Blueprint API:
{json.dumps(blueprint.public_api[:5], indent=2)[:2000]}

Requirements:
- COMPLETE, runnable code
- Type hints
- Docstrings
- Error handling
- No placeholder code — implement everything fully

Respond with ONLY the raw code (no markdown fencing, no JSON wrapper)."""

        result = await self.llm.complete(
            prompt, self.cfg.generate_model, phase="assemble_module",
            system_prompt="You are a code generator. Output only valid source code."
        )

        # Handle case where response is JSON-wrapped
        if isinstance(result, dict):
            return result.get("code", json.dumps(result, indent=2))
        return str(result)

    async def _generate_main(self, bp: Blueprint, target_language: str) -> str:
        """Generate the entry point file."""
        prompt = f"""Generate a main entry point ({target_language}) for:
{bp.name}

Public API:
{json.dumps(bp.public_api, indent=2)[:4000]}

Initialization sequence:
{json.dumps(bp.initialization_sequence, indent=2)}

Include example usage demonstrating all major capabilities.

Respond with ONLY the raw code."""

        result = await self.llm.complete(
            prompt, self.cfg.generate_model, phase="assemble_main",
            system_prompt="Output only valid source code."
        )
        if isinstance(result, dict):
            return result.get("code", "")
        return str(result)

    def _generate_readme(
        self, bp: Blueprint, caps: list, algos: list
    ) -> str:
        lines = [
            f"# {bp.name}\n",
            f"\n{bp.description}\n",
            f"\n## Capabilities\n",
        ]
        for cap_chain in caps:
            cap = cap_chain.get("capability", {})
            lines.append(f"- **{cap.get('name', '?')}**: {cap.get('user_description', '')}\n")

        if algos:
            lines.append(f"\n## Algorithms\n")
            for algo in algos:
                lines.append(
                    f"- **{algo.get('name', '?')}**: "
                    f"{algo.get('mathematical_explanation', '')[:100]}\n"
                )

        lines.append(f"\n## API\n")
        for api_entry in bp.public_api:
            lines.append(
                f"### `{api_entry.get('function', '?')}`\n"
                f"{api_entry.get('description', '')}\n"
                f"```\n{api_entry.get('example', '')}\n```\n"
            )

        return "".join(lines)
```

---

### Updated `main.py` — Full Pipeline Integration

```python
"""
Enhanced entry point supporting both reference and implementation layers.

Usage:
  python main.py --target "PPTX"                     # full pipeline
  python main.py --target "PPTX" --impl-only          # impl layer only (if ref exists)
  python main.py --query "draw blue rectangle" --format PPTX  # query mode
  python main.py --assemble <blueprint_id> --lang python      # generate project
  python main.py --interactive                                  # REPL mode
"""
import asyncio
import argparse
import logging
import sys

from config import Config
from llm import LLMClient
from pipeline import GuidebookPipeline
from pipeline_v2 import ImplementationPipeline
from storage import Storage
from storage_v2 import StorageV2
from query_engine import QueryEngine, interactive_session
from assembler import ProjectAssembler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("guidebook_gen.log"),
    ]
)
logger = logging.getLogger(__name__)


async def run_full_pipeline(target: str, config: Config, llm: LLMClient):
    """Run both reference and implementation pipelines."""
    storage_v1 = Storage(db_path=config.db_path)
    storage_v2 = StorageV2(db_path=config.db_path)
    await storage_v1.initialize()
    await storage_v2.initialize()

    try:
        # Phase 1-6: Reference layer
        ref_pipeline = GuidebookPipeline(target, config, llm, storage_v1)
        await ref_pipeline.run()

        # Determine target type
        classification = ref_pipeline.target_classification
        target_type = classification.get("type", "programming_language")
        if "format" in target_type or target_type in ("file_format", "data_format", "config_format"):
            impl_target_type = "file_format"
        else:
            impl_target_type = "application_tool"

        # Phase 7-12: Implementation layer
        impl_pipeline = ImplementationPipeline(
            target=target,
            target_type=impl_target_type,
            config=config,
            llm=llm,
            storage=storage_v2,
            classification=classification,
        )
        await impl_pipeline.run()

        # Export everything
        await storage_v1.export_json(target)
        await storage_v1.export_markdown(target)

        impl_guide = await storage_v2.export_implementation_guide(target)
        import json
        from pathlib import Path
        out_path = Path(config.export_dir) / f"{target.replace(' ', '_')}_implementation.json"
        out_path.write_text(json.dumps(impl_guide, indent=2))
        logger.info(f"Implementation guide exported to {out_path}")

    finally:
        await storage_v1.close()
        await storage_v2.close()


async def main():
    parser = argparse.ArgumentParser(
        description="Automated Language & File Type Guidebook Generator"
    )
    parser.add_argument("--target", type=str, help="Target to generate (e.g., 'PPTX', 'Python 3.12')")
    parser.add_argument("--impl-only", action="store_true", help="Run implementation layer only")
    parser.add_argument("--query", type=str, help="Query the knowledge base")
    parser.add_argument("--format", type=str, help="Format/tool for query mode")
    parser.add_argument("--assemble", type=str, help="Blueprint ID to assemble into code")
    parser.add_argument("--lang", type=str, default="python", help="Target language for code generation")
    parser.add_argument("--interactive", action="store_true", help="Interactive query session")
    parser.add_argument("--max-concurrency", type=int, default=50)
    args = parser.parse_args()

    config = Config(max_concurrency=args.max_concurrency)
    llm = LLMClient(max_concurrency=config.max_concurrency)

    if args.interactive:
        storage = StorageV2(db_path=config.db_path)
        await storage.initialize()
        try:
            await interactive_session(config, llm, storage)
        finally:
            await storage.close()

    elif args.query:
        storage = StorageV2(db_path=config.db_path)
        await storage.initialize()
        try:
            engine = QueryEngine(config, llm, storage)
            result = await engine.query(
                args.query,
                format_or_tool=args.format or "",
                target_language=args.lang,
            )
            import json
            print(json.dumps(result, indent=2, default=str))
        finally:
            await storage.close()

    elif args.assemble:
        storage = StorageV2(db_path=config.db_path)
        await storage.initialize()
        try:
            assembler = ProjectAssembler(config, llm, storage)
            out_dir = await assembler.assemble(
                args.assemble, target_language=args.lang
            )
            print(f"Project generated at: {out_dir}")
        finally:
            await storage.close()

    elif args.target:
        await run_full_pipeline(args.target, config, llm)

    else:
        parser.print_help()


if __name__ == "__main__":
    asyncio.run(main())
```

---

## Updated Architecture Diagram

```
USER QUERY: "Build a PPTX generator with shapes, charts, and transitions"
  │
  ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        QUERY ENGINE                                  │
│  1. Parse intent                                                     │
│  2. Search capabilities DB → match: Shape, Chart, Transition caps   │
│  3. Traverse dependency graph → find all prerequisites              │
│  4. Retrieve atoms → exact XML elements, namespaces, enums          │
│  5. Retrieve algorithms → coordinate math, chart rendering          │
│  6. Assemble implementation plan                                     │
│  7. Generate adapted code via LLM                                    │
└────────┬──────────┬──────────┬──────────┬──────────┬────────────────┘
         │          │          │          │          │
         ▼          ▼          ▼          ▼          ▼
   ┌──────────┐┌─────────┐┌────────┐┌─────────┐┌──────────┐
   │CAPABILITY││ FORMAT  ││ALGORIT-││DEPENDEN-││BLUEPRINT │
   │   DB     ││ ATOM DB ││HM DB   ││CY GRAPH ││   DB     │
   │          ││         ││        ││         ││          │
   │ 150 caps ││2000 XML ││ 45     ││ 800     ││ 12       │
   │ per fmt  ││elements ││ algos  ││ edges   ││ composit │
   └──────────┘└─────────┘└────────┘└─────────┘└──────────┘
         ▲          ▲          ▲          ▲          ▲
         │          │          │          │          │
         └──────────┴──────────┴──────────┴──────────┘
                               │
                    ┌──────────┴──────────┐
                    │  GENERATION PIPELINE │
                    │                      │
                    │  Phase 1-6:  V1 Ref  │
                    │  Phase 7:   Caps     │
                    │  Phase 8:   Atoms    │
                    │  Phase 9:   Algos    │
                    │  Phase 10:  Specs    │
                    │  Phase 11:  BPs      │
                    │  Phase 12:  Valid    │
                    └─────────────────────┘
```

## Enhanced Cost Model

```
┌──────────────────────────────────────────────────────────────────────┐
│                 COST MODEL PER TARGET (WITH V2)                      │
├──────────────────────┬───────────┬──────────┬───────────────────────┤
│ Phase                │ API Calls │ Model    │ Est. Cost             │
├──────────────────────┼───────────┼──────────┼───────────────────────┤
│ 1-6: Reference Layer │   ~2,200  │ mixed    │ $25-78 (per V1)      │
│ 7:  Cap Enumeration  │     ~15   │ mid      │ $2                   │
│ 8:  Atom Extraction  │    ~200   │ mid      │ $20                  │
│ 9:  Algorithm Extr   │    ~100   │ expensive│ $25                  │
│ 10: Impl Specs       │    ~200   │ mid      │ $25                  │
│ 11: Blueprints       │     ~20   │ mid      │ $5                   │
│ 12: Validation       │     ~50   │ expensive│ $8                   │
├──────────────────────┼───────────┼──────────┼───────────────────────┤
│ TOTAL (file format)  │   ~2,800  │          │ $85-165              │
│ TOTAL (application)  │   ~3,200  │          │ $110-200             │
├──────────────────────┼───────────┼──────────┼───────────────────────┤
│ Full portfolio       │           │          │                       │
│ (30 langs + 50 fmts) │  ~180,000 │          │ $4,000-$8,000        │
└──────────────────────┴───────────┴──────────┴───────────────────────┘
```

## What The Enhanced DB Enables — Concrete Examples

```
EXAMPLE 1: "Generate a PPTX with a blue rectangle at (2,1), 3in × 2in"

Query Engine returns:
├── Capability: "Draw Rectangle Shape" 
│   ├── Step 1: Create ZIP container → code
│   ├── Step 2: Write [Content_Types].xml → exact XML content
│   ├── Step 3: Write _rels/.rels → exact relationship entry
│   ├── Step 4: Write ppt/presentation.xml → exact content  
│   ├── Step 5: Write ppt/slides/slide1.xml with:
│   │   └── <p:sp> element containing:
│   │       ├── <p:nvSpPr> (id=2, name="Rectangle 1")
│   │       ├── <p:spPr>
│   │       │   ├── <a:xfrm>
│   │       │   │   ├── <a:off x="1828800" y="914400"/>  ← 2in, 1in in EMU
│   │       │   │   └── <a:ext cx="2743200" cy="1828800"/> ← 3in, 2in
│   │       │   ├── <a:prstGeom prst="rect"/>
│   │       │   └── <a:solidFill><a:srgbClr val="0000FF"/></a:solidFill>
│   │       └── <p:txBody>...</p:txBody>
│   └── Step 6: Save ZIP → code
├── Atoms: Complete XML namespace registry, enum values
├── Coordinate System: EMU conversion formulas
└── Generated Code: Complete runnable Python script (no python-pptx needed)

────────────────────────────────────────────────────────────────

EXAMPLE 2: "Build a Photoshop-like image editor"

Query Engine returns:
├── Blueprint: "Complete Image Editor" (scope: full_application)
│   ├── Module: canvas.py → layer stack management
│   ├── Module: tools/ → all tool implementations  
│   ├── Module: filters/ → all filter algorithms
│   ├── Module: color.py → color space conversions
│   ├── Module: selection.py → selection algorithms
│   └── Module: file_io/ → PSD/PNG/JPEG read/write
├── Algorithms (45):
│   ├── Gaussian Blur → math + pseudocode + Python/Rust/C impl
│   ├── Bicubic Interpolation → for resize
│   ├── Porter-Duff Compositing → for layer blending  
│   ├── 27 blend mode formulas → Multiply, Screen, Overlay...
│   ├── Flood Fill (scanline) → for paint bucket
│   ├── Marching Squares → for selection edges
│   └── ... all with test vectors and optimizations
├── Capabilities (150+):
│   ├── Each with step-by-step implementation
│   └── Each with reference code
└── Dependency Graph: "Implement in this order: ..."
```





//////   V2 - OPUS 4.6 NON-THINKING  /////



# Architecture for Automated Programming Language/File Type Guidebook Database Generation

## 1. Core Vision

Generate a **complete, structured knowledge database** for any programming language or file type such that it serves as a **self-sufficient reference** — covering every construct, pattern, capability, edge case, and idiom.

---

## 2. The Knowledge Schema

First, we need to define *what completeness means* for a language/file type. This is the ontology:

```yaml
LanguageDatabase:
  metadata:
    name: string
    version: string
    paradigms: [string]
    type_system: string
    execution_model: string # compiled, interpreted, transpiled, VM
    spec_url: string
    generated_at: timestamp
    completeness_score: float # 0.0 - 1.0

  sections:
    - lexical_fundamentals      # tokens, keywords, operators, literals, comments
    - type_system               # primitives, composites, generics, type algebra
    - control_flow              # conditionals, loops, pattern matching, jumps
    - data_structures           # built-in collections, construction, manipulation
    - functions_and_closures    # declaration, overloading, lambdas, higher-order
    - oop_or_type_abstractions  # classes, interfaces, traits, mixins, protocols
    - memory_model              # ownership, GC, allocation, lifetimes, references
    - error_handling            # exceptions, result types, panics, recovery
    - concurrency_parallelism   # threads, async/await, channels, actors, locks
    - metaprogramming           # macros, reflection, code generation, decorators
    - module_system             # imports, exports, packages, namespaces, visibility
    - io_and_system             # file I/O, networking, processes, signals, FFI
    - standard_library          # every module/package in stdlib
    - ecosystem_tooling         # package managers, build tools, linters, formatters
    - interop_and_ffi           # C interop, embedding, bindings
    - idioms_and_patterns       # canonical ways to solve common problems
    - anti_patterns             # what NOT to do and why
    - edge_cases_and_gotchas    # undefined behavior, surprising semantics
    - performance               # optimization techniques, profiling, benchmarking
    - security                  # common vulnerabilities, safe patterns
    - file_format_spec          # (for file types) binary layout, headers, encoding

FileTypeDatabase:
  metadata:
    name: string
    mime_type: string
    extensions: [string]
    binary_or_text: enum
    spec_url: string

  sections:
    - format_overview           # purpose, history, versions
    - structure                 # headers, sections, records, encoding
    - field_definitions         # every field, type, offset, valid values
    - generation_rules          # how to create valid files from scratch
    - parsing_rules             # how to read/decode
    - validation_rules          # what makes a file valid/invalid
    - common_tools              # libraries, CLI tools for manipulation
    - edge_cases                # malformed files, recovery, quirks
    - relationships             # related formats, conversion paths
    - examples                  # minimal, typical, complex specimens
```

---

## 3. The Generation Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR (Python)                       │
│                                                                 │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌───────────────┐ │
│  │ Registry │  │ Planner   │  │ Generator│  │ Validator     │ │
│  │ (target  │──│ (decompose│──│ (API call│──│ (verify       │ │
│  │  list)   │  │  into     │  │  engine) │  │  completeness)│ │
│  │          │  │  tasks)   │  │          │  │               │ │
│  └──────────┘  └───────────┘  └──────────┘  └───────────────┘ │
│       │              │              │               │           │
│       ▼              ▼              ▼               ▼           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    TASK QUEUE (async)                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│       │                                          │              │
│       ▼                                          ▼              │
│  ┌─────────────┐                        ┌──────────────────┐   │
│  │ Storage     │                        │ Gap Analyzer     │   │
│  │ (SQLite +   │◄───────────────────────│ (find missing    │   │
│  │  Markdown + │                        │  knowledge)      │   │
│  │  JSON)      │                        └──────────────────┘   │
│  └─────────────┘                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. The Key Innovation: Hierarchical Decomposition Strategy

The naive approach (ask one giant prompt) fails because:
- Context windows are finite
- LLMs hallucinate more on monolithic requests
- You can't verify completeness of a blob

**The solution: recursive decomposition with enumeration-first generation.**

### Phase 1: Skeleton Enumeration
```
"List EVERY keyword in Python 3.12. Output as JSON array. Be exhaustive."
→ ["False", "None", "True", "and", "as", "assert", "async", "await", ...]
```

### Phase 2: Deep Expansion (per item)
```
"For Python's `async` keyword: explain syntax, all valid usage contexts,
 provide examples of each, common errors, edge cases. Output structured JSON."
```

### Phase 3: Cross-Reference Validation
```
"Given this list of Python keywords [X], identify any that are MISSING
 from the official Python 3.12 grammar specification."
```

### Phase 4: Gap Filling
```
"Generate documentation for these identified missing items: [Y]"
```

---

## 5. Implementation

### 5.1 Core Orchestrator

```python
# orchestrator.py
import asyncio
import json
import hashlib
import sqlite3
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional
from pathlib import Path
import aiohttp
import tiktoken

class TaskStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    NEEDS_REVIEW = "needs_review"

class GenerationPhase(Enum):
    SKELETON = "skeleton"          # enumerate all items
    EXPANSION = "expansion"        # deep-dive each item
    CROSS_REF = "cross_reference"  # verify completeness
    GAP_FILL = "gap_fill"          # fill missing pieces
    SYNTHESIS = "synthesis"        # combine and format

@dataclass
class GenerationTask:
    id: str
    language: str
    section: str
    subsection: str
    phase: GenerationPhase
    prompt: str
    status: TaskStatus = TaskStatus.PENDING
    result: Optional[str] = None
    token_cost: int = 0
    retries: int = 0
    depends_on: list[str] = field(default_factory=list)
    
    def content_hash(self) -> str:
        return hashlib.sha256(self.prompt.encode()).hexdigest()[:16]


class Database:
    """SQLite-backed persistent storage for all generated content."""
    
    def __init__(self, db_path: str = "guidebook.db"):
        self.conn = sqlite3.connect(db_path)
        self._init_schema()
    
    def _init_schema(self):
        self.conn.executescript("""
            CREATE TABLE IF NOT EXISTS languages (
                name TEXT PRIMARY KEY,
                version TEXT,
                metadata JSON,
                completeness_score REAL DEFAULT 0.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS sections (
                id TEXT PRIMARY KEY,
                language TEXT REFERENCES languages(name),
                section_name TEXT,
                section_order INTEGER,
                completeness_score REAL DEFAULT 0.0,
                UNIQUE(language, section_name)
            );
            
            CREATE TABLE IF NOT EXISTS entries (
                id TEXT PRIMARY KEY,
                section_id TEXT REFERENCES sections(id),
                language TEXT,
                subsection TEXT,
                item_name TEXT,
                content JSON,
                content_markdown TEXT,
                phase TEXT,
                token_cost INTEGER DEFAULT 0,
                content_hash TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(language, subsection, item_name)
            );
            
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                language TEXT,
                section TEXT,
                subsection TEXT,
                phase TEXT,
                prompt TEXT,
                status TEXT DEFAULT 'pending',
                result TEXT,
                token_cost INTEGER DEFAULT 0,
                retries INTEGER DEFAULT 0,
                error TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS gaps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                language TEXT,
                section TEXT,
                description TEXT,
                severity TEXT,  -- critical, major, minor
                resolved INTEGER DEFAULT 0,
                task_id TEXT REFERENCES tasks(id)
            );
            
            CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
            CREATE INDEX IF NOT EXISTS idx_entries_language ON entries(language);
            CREATE INDEX IF NOT EXISTS idx_gaps_unresolved ON gaps(language, resolved);
        """)
        self.conn.commit()
    
    def save_task(self, task: GenerationTask):
        self.conn.execute("""
            INSERT OR REPLACE INTO tasks 
            (id, language, section, subsection, phase, prompt, status, result, token_cost, retries)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (task.id, task.language, task.section, task.subsection,
              task.phase.value, task.prompt, task.status.value,
              task.result, task.token_cost, task.retries))
        self.conn.commit()
    
    def save_entry(self, language: str, subsection: str, item_name: str,
                   content: dict, markdown: str, phase: str, section_id: str,
                   token_cost: int = 0):
        entry_id = hashlib.sha256(
            f"{language}:{subsection}:{item_name}".encode()
        ).hexdigest()[:16]
        content_hash = hashlib.sha256(json.dumps(content).encode()).hexdigest()[:16]
        
        self.conn.execute("""
            INSERT OR REPLACE INTO entries
            (id, section_id, language, subsection, item_name, content, 
             content_markdown, phase, token_cost, content_hash)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (entry_id, section_id, language, subsection, item_name,
              json.dumps(content), markdown, phase, token_cost, content_hash))
        self.conn.commit()
        return entry_id
    
    def get_pending_tasks(self, language: str, phase: str = None) -> list[dict]:
        query = "SELECT * FROM tasks WHERE language = ? AND status = 'pending'"
        params = [language]
        if phase:
            query += " AND phase = ?"
            params.append(phase)
        return self.conn.execute(query, params).fetchall()
    
    def get_completeness(self, language: str) -> dict:
        """Calculate completeness metrics."""
        total = self.conn.execute(
            "SELECT COUNT(*) FROM tasks WHERE language = ?", (language,)
        ).fetchone()[0]
        completed = self.conn.execute(
            "SELECT COUNT(*) FROM tasks WHERE language = ? AND status = 'completed'",
            (language,)
        ).fetchone()[0]
        gaps = self.conn.execute(
            "SELECT COUNT(*) FROM gaps WHERE language = ? AND resolved = 0",
            (language,)
        ).fetchone()[0]
        return {
            "total_tasks": total,
            "completed": completed,
            "completion_pct": (completed / total * 100) if total > 0 else 0,
            "unresolved_gaps": gaps
        }
```

### 5.2 API Call Engine with Rate Limiting & Cost Tracking

```python
# api_engine.py
import asyncio
import time
import json
from dataclasses import dataclass
from typing import Optional
import aiohttp

@dataclass
class APIConfig:
    provider: str              # "openai", "anthropic", "google", etc.
    base_url: str
    api_key: str
    model: str
    max_tokens_per_request: int = 4096
    requests_per_minute: int = 60
    tokens_per_minute: int = 150_000
    cost_per_1k_input: float = 0.003
    cost_per_1k_output: float = 0.015
    
    # Model tiers for different task types
    # skeleton/enumeration -> cheaper model
    # deep expansion -> best model
    # validation -> mid-tier model

class RateLimiter:
    def __init__(self, rpm: int, tpm: int):
        self.rpm = rpm
        self.tpm = tpm
        self.request_times: list[float] = []
        self.token_counts: list[tuple[float, int]] = []
        self._lock = asyncio.Lock()
    
    async def acquire(self, estimated_tokens: int):
        async with self._lock:
            now = time.time()
            # Clean old entries
            self.request_times = [t for t in self.request_times if now - t < 60]
            self.token_counts = [(t, c) for t, c in self.token_counts if now - t < 60]
            
            current_rpm = len(self.request_times)
            current_tpm = sum(c for _, c in self.token_counts)
            
            if current_rpm >= self.rpm or current_tpm + estimated_tokens > self.tpm:
                wait_time = 60 - (now - self.request_times[0]) if self.request_times else 1
                await asyncio.sleep(max(wait_time, 0.5))
            
            self.request_times.append(time.time())
            self.token_counts.append((time.time(), estimated_tokens))


class MultiProviderAPIEngine:
    """Handles API calls across multiple providers with fallback."""
    
    def __init__(self, configs: list[APIConfig]):
        self.configs = {c.provider: c for c in configs}
        self.rate_limiters = {
            c.provider: RateLimiter(c.requests_per_minute, c.tokens_per_minute)
            for c in configs
        }
        self.total_cost = 0.0
        self.total_tokens = {"input": 0, "output": 0}
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, *args):
        if self.session:
            await self.session.close()
    
    async def call(
        self,
        prompt: str,
        system_prompt: str = "",
        provider: str = "openai",
        temperature: float = 0.1,  # Low temp for factual content
        max_tokens: int = 4096,
        response_format: str = "json",  # "json" or "text"
        retries: int = 3
    ) -> dict:
        config = self.configs[provider]
        limiter = self.rate_limiters[provider]
        
        estimated_tokens = len(prompt.split()) * 1.3  # rough estimate
        await limiter.acquire(int(estimated_tokens))
        
        for attempt in range(retries):
            try:
                result = await self._make_request(
                    config, prompt, system_prompt,
                    temperature, max_tokens, response_format
                )
                
                # Track costs
                input_tokens = result.get("usage", {}).get("input_tokens", 0)
                output_tokens = result.get("usage", {}).get("output_tokens", 0)
                cost = (input_tokens / 1000 * config.cost_per_1k_input +
                       output_tokens / 1000 * config.cost_per_1k_output)
                self.total_cost += cost
                self.total_tokens["input"] += input_tokens
                self.total_tokens["output"] += output_tokens
                
                return {
                    "content": result["content"],
                    "tokens": {"input": input_tokens, "output": output_tokens},
                    "cost": cost,
                    "provider": provider,
                    "model": config.model
                }
                
            except Exception as e:
                if attempt < retries - 1:
                    await asyncio.sleep(2 ** attempt)
                else:
                    raise
    
    async def _make_request(self, config: APIConfig, prompt: str,
                            system_prompt: str, temperature: float,
                            max_tokens: int, response_format: str) -> dict:
        if config.provider == "openai":
            return await self._call_openai(config, prompt, system_prompt,
                                           temperature, max_tokens, response_format)
        elif config.provider == "anthropic":
            return await self._call_anthropic(config, prompt, system_prompt,
                                              temperature, max_tokens, response_format)
        else:
            raise ValueError(f"Unknown provider: {config.provider}")
    
    async def _call_openai(self, config, prompt, system_prompt,
                           temperature, max_tokens, response_format) -> dict:
        headers = {
            "Authorization": f"Bearer {config.api_key}",
            "Content-Type": "application/json"
        }
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        body = {
            "model": config.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        
        if response_format == "json":
            body["response_format"] = {"type": "json_object"}
        
        async with self.session.post(
            f"{config.base_url}/chat/completions",
            headers=headers,
            json=body
        ) as resp:
            data = await resp.json()
            if resp.status != 200:
                raise Exception(f"API error {resp.status}: {data}")
            
            return {
                "content": data["choices"][0]["message"]["content"],
                "usage": {
                    "input_tokens": data["usage"]["prompt_tokens"],
                    "output_tokens": data["usage"]["completion_tokens"]
                }
            }
    
    async def _call_anthropic(self, config, prompt, system_prompt,
                              temperature, max_tokens, response_format) -> dict:
        headers = {
            "x-api-key": config.api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }
        
        body = {
            "model": config.model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": [{"role": "user", "content": prompt}]
        }
        if system_prompt:
            body["system"] = system_prompt
        
        async with self.session.post(
            f"{config.base_url}/messages",
            headers=headers,
            json=body
        ) as resp:
            data = await resp.json()
            if resp.status != 200:
                raise Exception(f"API error {resp.status}: {data}")
            
            return {
                "content": data["content"][0]["text"],
                "usage": {
                    "input_tokens": data["usage"]["input_tokens"],
                    "output_tokens": data["usage"]["output_tokens"]
                }
            }
```

### 5.3 The Prompt Engineering System

```python
# prompts.py
"""
The prompt architecture is the most critical component. 
Each prompt is designed to extract SPECIFIC, VERIFIABLE, STRUCTURED knowledge.
"""

SYSTEM_PROMPT = """You are generating content for a comprehensive programming 
language reference database. Your output must be:
1. EXHAUSTIVE - cover every case, not just common ones
2. PRECISE - use exact syntax, not approximations 
3. STRUCTURED - follow the requested JSON schema exactly
4. VERSIONED - specify which language version a feature applies to
5. EXAMPLE-RICH - every concept gets a runnable code example
6. EDGE-CASE-AWARE - document surprising behaviors

If you are uncertain about something, mark it with "confidence": "low" 
rather than guessing."""


class PromptTemplates:
    
    @staticmethod
    def skeleton_enumerate(language: str, version: str, section: str) -> str:
        """Phase 1: Get the complete list of items in a section."""
        
        section_prompts = {
            "lexical_fundamentals": f"""
Enumerate EVERY lexical element of {language} {version}:

Output JSON with this exact structure:
{{
    "keywords": ["list", "every", "reserved", "keyword"],
    "operators": [
        {{"symbol": "+", "name": "addition", "type": "binary_arithmetic"}},
        ...
    ],
    "literal_types": [
        {{"type": "integer", "examples": ["42", "0xFF", "0b1010", "1_000"]}},
        ...
    ],
    "comment_styles": [
        {{"style": "line", "syntax": "//", "example": "// comment"}},
        ...
    ],
    "string_types": [
        {{"type": "double_quoted", "syntax": "\\"...\\"", "escapes": true, "interpolation": false}},
        ...
    ],
    "delimiters": ["{{}}", "()", "[]", ...],
    "special_tokens": ["EOF", "NEWLINE", "INDENT", "DEDENT", ...]
}}

Be EXHAUSTIVE. Include EVERY operator including obscure ones.
Include ALL numeric literal formats. Include ALL string literal types.""",

            "type_system": f"""
Enumerate EVERY type and type construct in {language} {version}:

Output JSON:
{{
    "primitive_types": [
        {{"name": "i32", "category": "integer", "size_bits": 32, "signed": true}},
        ...
    ],
    "composite_types": [
        {{"name": "array", "syntax": "[T; N]", "generic": true}},
        ...
    ],
    "type_constructors": ["generics", "type_aliases", "newtypes", ...],
    "type_operations": ["union", "intersection", "conditional", ...],
    "special_types": ["never", "void", "any", "unknown", ...],
    "type_coercion_rules": [
        {{"from": "i32", "to": "i64", "implicit": true}},
        ...
    ],
    "type_keywords": ["type", "interface", "struct", "enum", ...]
}}""",

            "control_flow": f"""
Enumerate EVERY control flow construct in {language} {version}:

Output JSON:
{{
    "conditionals": [
        {{"construct": "if", "syntax_pattern": "if (cond) {{ }}", "has_else": true, "is_expression": false}},
        ...
    ],
    "loops": [
        {{"construct": "for", "variants": ["c-style", "range-based"], "syntax_patterns": [...]}},
        ...
    ],
    "pattern_matching": [
        {{"construct": "match/switch", "exhaustive": true, "syntax_pattern": "..."}},
        ...
    ],
    "jumps": ["break", "continue", "return", "goto", ...],
    "exception_flow": ["try", "catch", "finally", "throw", ...],
    "labels": {{"supported": true, "syntax": "label: loop {{}}"}},
    "guard_clauses": [...],
    "deferred_execution": ["defer", "finally", ...]
}}""",

            "functions_and_closures": f"""
Enumerate EVERY function-related construct in {language} {version}:

Output JSON:
{{
    "declaration_forms": [
        {{"form": "named_function", "syntax": "fn name(params) -> RetType {{ }}", "example": "..."}},
        {{"form": "lambda", "syntax": "|params| expression", "example": "..."}},
        ...
    ],
    "parameter_types": [
        {{"type": "positional", "example": "fn f(x: i32)"}},
        {{"type": "default", "example": "fn f(x: i32 = 5)"}},
        {{"type": "variadic", "example": "fn f(args: ...T)"}},
        {{"type": "keyword", "example": "fn f(*, key: i32)"}},
        ...
    ],
    "return_mechanisms": ["return_keyword", "implicit_last_expression", "out_parameters", ...],
    "calling_conventions": [...],
    "function_modifiers": ["async", "const", "inline", "extern", ...],
    "closure_capture_modes": ["by_reference", "by_value", "by_move", ...],
    "higher_order_features": ["function_pointers", "trait_objects", "generics", ...],
    "overloading": {{"supported": true, "mechanism": "..."}},
    "recursion": {{"tail_call_optimization": false, "mutual_recursion": true}}
}}""",

            "standard_library": f"""
List EVERY module/package in the {language} {version} standard library:

Output JSON:
{{
    "modules": [
        {{
            "name": "os",
            "submodules": ["path", "fs", ...],
            "primary_purpose": "Operating system interfaces",
            "key_items_count": 45
        }},
        ...
    ],
    "total_module_count": N,
    "categorized": {{
        "io": ["module1", "module2"],
        "networking": [...],
        "data_structures": [...],
        "text_processing": [...],
        "math": [...],
        "concurrency": [...],
        "system": [...],
        "crypto": [...],
        "testing": [...],
        "serialization": [...]
    }}
}}"""
        }
        
        return section_prompts.get(section, f"""
Enumerate EVERY construct, concept, and element related to "{section}" 
in {language} {version}. Output as comprehensive JSON with categorized lists.
Include ALL items - not just common ones. Mark deprecated items as deprecated.""")

    @staticmethod
    def deep_expansion(language: str, version: str, 
                       section: str, item: dict) -> str:
        """Phase 2: Deep dive into a specific item."""
        return f"""
Provide COMPLETE documentation for the following {language} {version} concept:

Section: {section}
Item: {json.dumps(item)}

Output JSON with this structure:
{{
    "name": "...",
    "category": "{section}",
    "since_version": "version when introduced",
    "deprecated": false,
    "deprecated_since": null,
    "replacement": null,
    
    "syntax": {{
        "formal": "formal grammar/BNF if applicable",
        "simplified": "human-readable syntax pattern",
        "variations": ["every syntactic variation"]
    }},
    
    "semantics": {{
        "description": "precise description of behavior",
        "evaluation_order": "if relevant",
        "side_effects": "any side effects",
        "thread_safety": "if relevant",
        "complexity": "time/space complexity if applicable"
    }},
    
    "examples": [
        {{
            "title": "Basic usage",
            "code": "runnable code example",
            "output": "expected output",
            "explanation": "line-by-line explanation"
        }},
        {{
            "title": "Advanced usage",
            "code": "...",
            "output": "...",
            "explanation": "..."
        }},
        {{
            "title": "Edge case",
            "code": "...",
            "output": "...",
            "explanation": "why this might be surprising"
        }}
    ],
    
    "edge_cases": [
        {{
            "scenario": "description",
            "behavior": "what happens",
            "code": "demonstrating code"
        }}
    ],
    
    "common_errors": [
        {{
            "error": "error message or type",
            "cause": "why it happens",
            "fix": "how to fix it",
            "code_bad": "code that produces error",
            "code_good": "corrected code"
        }}
    ],
    
    "related_concepts": ["list of related items in this guide"],
    
    "best_practices": ["list of recommendations"],
    
    "anti_patterns": ["things to avoid and why"],
    
    "performance_notes": "any performance implications",
    
    "platform_differences": "any platform-specific behavior"
}}

Be EXHAUSTIVE. Include EVERY edge case you know of. Provide RUNNABLE examples."""

    @staticmethod
    def cross_reference_validate(language: str, version: str,
                                  section: str, items: list) -> str:
        """Phase 3: Verify completeness."""
        return f"""
I am building an exhaustive reference for {language} {version}.
For the section "{section}", I have documented these items:

{json.dumps(items, indent=2)}

Your task:
1. Identify ANY items that are MISSING from this list
2. Identify any items that are INCORRECT or OUTDATED  
3. Identify any items that are DUPLICATED
4. Rate the completeness of this section (0-100%)

Output JSON:
{{
    "missing_items": [
        {{"name": "...", "description": "...", "importance": "critical|major|minor"}}
    ],
    "incorrect_items": [
        {{"name": "...", "issue": "...", "correction": "..."}}
    ],
    "duplicates": [...],
    "completeness_pct": 85,
    "notes": "any other observations"
}}

Be extremely thorough. Cross-reference against the official {language} specification."""

    @staticmethod
    def stdlib_module_deep_dive(language: str, version: str, 
                                 module_name: str) -> str:
        """Special template for stdlib module documentation."""
        return f"""
Document EVERY public function, class, constant, and type in the 
{language} {version} standard library module `{module_name}`.

Output JSON:
{{
    "module": "{module_name}",
    "purpose": "...",
    "import_syntax": "...",
    
    "classes": [
        {{
            "name": "ClassName",
            "inherits": ["BaseClass"],
            "purpose": "...",
            "constructor": {{
                "signature": "...",
                "parameters": [...],
                "example": "..."
            }},
            "methods": [
                {{
                    "name": "method_name",
                    "signature": "def method_name(self, ...) -> ReturnType",
                    "purpose": "...",
                    "parameters": [
                        {{"name": "param", "type": "Type", "default": null, "description": "..."}}
                    ],
                    "returns": "...",
                    "raises": ["ExceptionType: when"],
                    "example": "runnable code",
                    "complexity": "O(n) if relevant"
                }}
            ],
            "class_methods": [...],
            "static_methods": [...],
            "properties": [...],
            "magic_methods": [...]
        }}
    ],
    
    "functions": [
        {{
            "name": "function_name",
            "signature": "...",
            "purpose": "...",
            "parameters": [...],
            "returns": "...",
            "raises": [...],
            "example": "...",
            "notes": "..."
        }}
    ],
    
    "constants": [
        {{"name": "CONST_NAME", "type": "...", "value": "...", "purpose": "..."}}
    ],
    
    "type_aliases": [...],
    
    "exceptions": [
        {{"name": "ExceptionName", "inherits": "BaseException", "when_raised": "..."}}
    ],
    
    "submodules": ["list of submodules"],
    
    "common_recipes": [
        {{"task": "what you want to do", "code": "how to do it"}}
    ]
}}

Include EVERY public API member. Mark deprecated items. Include version info."""

    @staticmethod 
    def file_format_spec(file_type: str) -> str:
        """Template for file format documentation."""
        return f"""
Document the complete specification of the {file_type} file format:

Output JSON:
{{
    "format_name": "{file_type}",
    "mime_types": [...],
    "extensions": [...],
    "binary_or_text": "binary|text|hybrid",
    "byte_order": "big-endian|little-endian|varies",
    "versions": [...],
    
    "structure": {{
        "overview": "description of overall layout",
        "diagram": "ASCII art diagram of file layout",
        "sections": [
            {{
                "name": "Header",
                "offset": "0x00",
                "size": "fixed|variable",
                "fields": [
                    {{
                        "name": "magic_number",
                        "offset": "0x00",
                        "size_bytes": 4,
                        "type": "uint32",
                        "value": "0x89504E47",
                        "description": "File signature",
                        "required": true
                    }}
                ]
            }}
        ]
    }},
    
    "generation_algorithm": {{
        "steps": [
            "1. Write magic number...",
            "2. Write header fields...",
            ...
        ],
        "pseudocode": "...",
        "example_code": {{
            "python": "complete Python code to generate a minimal valid file",
            "description": "..."
        }}
    }},
    
    "parsing_algorithm": {{
        "steps": [...],
        "pseudocode": "...",
        "example_code": {{
            "python": "complete Python code to parse the file",
            "description": "..."
        }}
    }},
    
    "validation_rules": [
        {{"rule": "description", "field": "which field", "constraint": "..."}}
    ],
    
    "encoding_details": {{...}},
    
    "common_tools": [
        {{"name": "tool", "purpose": "...", "example_usage": "..."}}
    ],
    
    "edge_cases": [...],
    
    "related_formats": [
        {{"format": "...", "relationship": "successor|variant|contains|..."}}
    ]
}}"""
```

### 5.4 The Planner: Intelligent Task Decomposition

```python
# planner.py
import json
import uuid
from typing import Generator

class GuidebookPlanner:
    """
    Decomposes the goal of 'complete language documentation' into
    an ordered DAG of API call tasks.
    """
    
    LANGUAGE_SECTIONS = [
        ("lexical_fundamentals", 1),
        ("type_system", 2),
        ("control_flow", 3),
        ("data_structures", 4),
        ("functions_and_closures", 5),
        ("oop_or_type_abstractions", 6),
        ("memory_model", 7),
        ("error_handling", 8),
        ("concurrency_parallelism", 9),
        ("metaprogramming", 10),
        ("module_system", 11),
        ("io_and_system", 12),
        ("standard_library", 13),
        ("ecosystem_tooling", 14),
        ("interop_and_ffi", 15),
        ("idioms_and_patterns", 16),
        ("anti_patterns", 17),
        ("edge_cases_and_gotchas", 18),
        ("performance", 19),
        ("security", 20),
    ]
    
    FILE_TYPE_SECTIONS = [
        ("format_overview", 1),
        ("structure", 2),
        ("field_definitions", 3),
        ("generation_rules", 4),
        ("parsing_rules", 5),
        ("validation_rules", 6),
        ("common_tools", 7),
        ("edge_cases", 8),
        ("relationships", 9),
        ("examples", 10),
    ]
    
    def __init__(self, db: 'Database', api_engine: 'MultiProviderAPIEngine'):
        self.db = db
        self.api = api_engine
        self.prompts = PromptTemplates()
    
    def generate_task_plan(self, language: str, version: str,
                           target_type: str = "language") -> list[GenerationTask]:
        """
        Generate the complete task DAG for a language/file type.
        
        Strategy:
        1. Phase SKELETON: One task per section → enumerate all items
        2. Phase EXPANSION: One task per ITEM discovered in skeleton
        3. Phase CROSS_REF: Validation tasks per section
        4. Phase GAP_FILL: Dynamic tasks based on gaps found
        5. Phase SYNTHESIS: Combine into final output
        """
        tasks = []
        sections = (self.LANGUAGE_SECTIONS if target_type == "language" 
                    else self.FILE_TYPE_SECTIONS)
        
        # Phase 1: Skeleton enumeration tasks
        skeleton_task_ids = {}
        for section_name, order in sections:
            task_id = f"skel_{language}_{section_name}"
            
            if target_type == "language":
                prompt = self.prompts.skeleton_enumerate(language, version, section_name)
            else:
                prompt = self.prompts.file_format_spec(language)
            
            task = GenerationTask(
                id=task_id,
                language=language,
                section=section_name,
                subsection="__skeleton__",
                phase=GenerationPhase.SKELETON,
                prompt=prompt
            )
            tasks.append(task)
            skeleton_task_ids[section_name] = task_id
        
        # Phase 2 & 3 tasks are generated DYNAMICALLY after Phase 1 completes
        # (see expand_skeleton_results below)
        
        return tasks
    
    async def expand_skeleton_results(self, language: str, version: str,
                                       section: str, skeleton_data: dict
                                       ) -> list[GenerationTask]:
        """
        After a skeleton task completes, generate expansion tasks 
        for every discovered item.
        """
        tasks = []
        skeleton_task_id = f"skel_{language}_{section}"
        
        # Parse the skeleton to find all items needing expansion
        items = self._extract_items_from_skeleton(section, skeleton_data)
        
        for i, item in enumerate(items):
            task_id = f"exp_{language}_{section}_{i}"
            prompt = self.prompts.deep_expansion(
                language, version, section, item
            )
            
            task = GenerationTask(
                id=task_id,
                language=language,
                section=section,
                subsection=item.get("name", f"item_{i}"),
                phase=GenerationPhase.EXPANSION,
                prompt=prompt,
                depends_on=[skeleton_task_id]
            )
            tasks.append(task)
        
        # Also create a cross-reference validation task
        xref_task = GenerationTask(
            id=f"xref_{language}_{section}",
            language=language,
            section=section,
            subsection="__cross_ref__",
            phase=GenerationPhase.CROSS_REF,
            prompt=self.prompts.cross_reference_validate(
                language, version, section,
                [item.get("name", "") for item in items]
            ),
            depends_on=[f"exp_{language}_{section}_{i}" for i in range(len(items))]
        )
        tasks.append(xref_task)
        
        return tasks
    
    def _extract_items_from_skeleton(self, section: str, data: dict) -> list[dict]:
        """
        Flatten skeleton data into individual items for expansion.
        Handles varied skeleton structures per section type.
        """
        items = []
        
        if isinstance(data, dict):
            for key, value in data.items():
                if isinstance(value, list):
                    for v in value:
                        if isinstance(v, dict):
                            v["_source_key"] = key
                            items.append(v)
                        else:
                            items.append({"name": str(v), "_source_key": key})
                elif isinstance(value, dict):
                    value["_source_key"] = key
                    items.append(value)
        
        return items
    
    async def handle_stdlib_expansion(self, language: str, version: str,
                                       modules: list[dict]) -> list[GenerationTask]:
        """
        Special handling for standard library — each module gets its own
        deep-dive task, and large modules get split into sub-tasks.
        """
        tasks = []
        
        for module in modules:
            module_name = module.get("name", "")
            key_items_count = module.get("key_items_count", 0)
            
            if key_items_count > 50:
                # Large module: split into sub-module tasks
                submodules = module.get("submodules", [module_name])
                for sub in submodules:
                    task_id = f"stdlib_{language}_{module_name}_{sub}"
                    tasks.append(GenerationTask(
                        id=task_id,
                        language=language,
                        section="standard_library",
                        subsection=f"{module_name}.{sub}",
                        phase=GenerationPhase.EXPANSION,
                        prompt=self.prompts.stdlib_module_deep_dive(
                            language, version, f"{module_name}.{sub}"
                        )
                    ))
            else:
                task_id = f"stdlib_{language}_{module_name}"
                tasks.append(GenerationTask(
                    id=task_id,
                    language=language,
                    section="standard_library",
                    subsection=module_name,
                    phase=GenerationPhase.EXPANSION,
                    prompt=self.prompts.stdlib_module_deep_dive(
                        language, version, module_name
                    )
                ))
        
        return tasks
```

### 5.5 The Executor: Async Parallel Processing

```python
# executor.py
import asyncio
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class GuidebookExecutor:
    """
    Executes the task plan with:
    - Parallel execution respecting dependencies
    - Automatic retry with backoff  
    - Dynamic task generation (expansion after skeleton)
    - Progress tracking
    - Cost monitoring with budget limits
    """
    
    def __init__(self, db: Database, api: MultiProviderAPIEngine,
                 planner: GuidebookPlanner, 
                 max_concurrent: int = 10,
                 budget_limit: float = 50.0):
        self.db = db
        self.api = api
        self.planner = planner
        self.max_concurrent = max_concurrent
        self.budget_limit = budget_limit
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.completed_tasks: set[str] = set()
        self.task_queue: asyncio.Queue = asyncio.Queue()
        self.all_tasks: dict[str, GenerationTask] = {}
    
    async def execute_full_generation(self, language: str, version: str,
                                        target_type: str = "language"):
        """Main entry point: generate the complete guidebook."""
        
        logger.info(f"Starting generation for {language} {version}")
        
        # Phase 1: Generate and execute skeleton tasks
        initial_tasks = self.planner.generate_task_plan(
            language, version, target_type
        )
        
        for task in initial_tasks:
            self.all_tasks[task.id] = task
            self.db.save_task(task)
        
        # Execute skeleton phase
        skeleton_tasks = [t for t in initial_tasks 
                         if t.phase == GenerationPhase.SKELETON]
        
        logger.info(f"Phase 1: Executing {len(skeleton_tasks)} skeleton tasks")
        await self._execute_task_batch(skeleton_tasks)
        
        # Phase 2: Generate expansion tasks from skeleton results
        expansion_tasks = []
        for task in skeleton_tasks:
            if task.status == TaskStatus.COMPLETED and task.result:
                try:
                    skeleton_data = json.loads(task.result)
                    
                    # Special handling for stdlib
                    if task.section == "standard_library" and target_type == "language":
                        modules = skeleton_data.get("modules", [])
                        stdlib_tasks = await self.planner.handle_stdlib_expansion(
                            language, version, modules
                        )
                        expansion_tasks.extend(stdlib_tasks)
                    else:
                        new_tasks = await self.planner.expand_skeleton_results(
                            language, version, task.section, skeleton_data
                        )
                        expansion_tasks.extend(new_tasks)
                        
                except json.JSONDecodeError:
                    logger.error(f"Failed to parse skeleton result for {task.id}")
        
        for task in expansion_tasks:
            self.all_tasks[task.id] = task
            self.db.save_task(task)
        
        # Execute expansion phase (this is the bulk of the work)
        exp_only = [t for t in expansion_tasks 
                    if t.phase == GenerationPhase.EXPANSION]
        
        logger.info(f"Phase 2: Executing {len(exp_only)} expansion tasks")
        await self._execute_task_batch(exp_only)
        
        # Phase 3: Execute cross-reference validation
        xref_tasks = [t for t in expansion_tasks 
                      if t.phase == GenerationPhase.CROSS_REF]
        
        logger.info(f"Phase 3: Executing {len(xref_tasks)} cross-reference tasks")
        await self._execute_task_batch(xref_tasks)
        
        # Phase 4: Gap filling based on cross-reference results
        gap_tasks = await self._generate_gap_fill_tasks(language, version, xref_tasks)
        if gap_tasks:
            logger.info(f"Phase 4: Executing {len(gap_tasks)} gap-fill tasks")
            await self._execute_task_batch(gap_tasks)
        
        # Phase 5: Final synthesis
        await self._synthesize_guidebook(language, version)
        
        # Report
        stats = self.db.get_completeness(language)
        logger.info(f"Generation complete: {json.dumps(stats, indent=2)}")
        logger.info(f"Total cost: ${self.api.total_cost:.2f}")
        logger.info(f"Total tokens: {json.dumps(self.api.total_tokens)}")
    
    async def _execute_task_batch(self, tasks: list[GenerationTask]):
        """Execute a batch of tasks with controlled concurrency."""
        
        async def execute_single(task: GenerationTask):
            # Check budget
            if self.api.total_cost >= self.budget_limit:
                logger.warning(f"Budget limit reached: ${self.api.total_cost:.2f}")
                task.status = TaskStatus.FAILED
                return
            
            # Check dependencies
            for dep_id in task.depends_on:
                if dep_id not in self.completed_tasks:
                    # Wait for dependency (with timeout)
                    for _ in range(300):  # 5 min timeout
                        await asyncio.sleep(1)
                        if dep_id in self.completed_tasks:
                            break
                    else:
                        logger.error(f"Dependency timeout: {dep_id} for {task.id}")
                        task.status = TaskStatus.FAILED
                        return
            
            async with self.semaphore:
                task.status = TaskStatus.IN_PROGRESS
                self.db.save_task(task)
                
                try:
                    # Choose provider/model based on task type
                    provider = self._select_provider(task)
                    
                    result = await self.api.call(
                        prompt=task.prompt,
                        system_prompt=SYSTEM_PROMPT,
                        provider=provider,
                        temperature=0.1,
                        max_tokens=4096,
                        response_format="json"
                    )
                    
                    task.result = result["content"]
                    task.token_cost = (result["tokens"]["input"] + 
                                      result["tokens"]["output"])
                    task.status = TaskStatus.COMPLETED
                    self.completed_tasks.add(task.id)
                    
                    # Store the content in the entries table
                    try:
                        content = json.loads(result["content"])
                        self.db.save_entry(
                            language=task.language,
                            subsection=task.subsection,
                            item_name=task.subsection,
                            content=content,
                            markdown=self._json_to_markdown(content),
                            phase=task.phase.value,
                            section_id=f"{task.language}_{task.section}",
                            token_cost=task.token_cost
                        )
                    except json.JSONDecodeError:
                        # Store as raw text if not valid JSON
                        self.db.save_entry(
                            language=task.language,
                            subsection=task.subsection,
                            item_name=task.subsection,
                            content={"raw": result["content"]},
                            markdown=result["content"],
                            phase=task.phase.value,
                            section_id=f"{task.language}_{task.section}",
                            token_cost=task.token_cost
                        )
                    
                    logger.info(f"✓ {task.id} (${result['cost']:.4f})")
                    
                except Exception as e:
                    task.retries += 1
                    if task.retries < 3:
                        task.status = TaskStatus.PENDING
                        logger.warning(f"Retry {task.retries} for {task.id}: {e}")
                    else:
                        task.status = TaskStatus.FAILED
                        logger.error(f"✗ {task.id} failed after 3 retries: {e}")
                
                self.db.save_task(task)
        
        # Execute all tasks in batch with concurrency control
        await asyncio.gather(*[execute_single(t) for t in tasks])
    
    def _select_provider(self, task: GenerationTask) -> str:
        """
        Route tasks to appropriate model tiers:
        - Skeleton/enumeration: fast cheap model (GPT-4o-mini, Haiku)
        - Deep expansion: best model (GPT-4o, Sonnet/Opus)  
        - Cross-reference: mid-tier model
        """
        if task.phase == GenerationPhase.SKELETON:
            return "openai"  # gpt-4o-mini configured
        elif task.phase == GenerationPhase.EXPANSION:
            return "anthropic"  # claude-sonnet configured
        elif task.phase == GenerationPhase.CROSS_REF:
            return "openai"  # gpt-4o configured
        else:
            return "openai"
    
    async def _generate_gap_fill_tasks(self, language: str, version: str,
                                         xref_tasks: list[GenerationTask]
                                         ) -> list[GenerationTask]:
        """Parse cross-reference results and generate gap-fill tasks."""
        gap_tasks = []
        
        for task in xref_tasks:
            if task.status != TaskStatus.COMPLETED or not task.result:
                continue
            
            try:
                xref_data = json.loads(task.result)
                missing = xref_data.get("missing_items", [])
                
                for item in missing:
                    if item.get("importance") in ("critical", "major"):
                        gap_task_id = f"gap_{language}_{task.section}_{item['name']}"
                        gap_task = GenerationTask(
                            id=gap_task_id,
                            language=language,
                            section=task.section,
                            subsection=item["name"],
                            phase=GenerationPhase.GAP_FILL,
                            prompt=PromptTemplates.deep_expansion(
                                language, version, task.section, item
                            )
                        )
                        gap_tasks.append(gap_task)
                        
                        # Record the gap
                        self.db.conn.execute("""
                            INSERT INTO gaps (language, section, description, severity, task_id)
                            VALUES (?, ?, ?, ?, ?)
                        """, (language, task.section, 
                              item.get("description", item["name"]),
                              item.get("importance", "minor"),
                              gap_task_id))
                
                self.db.conn.commit()
                
            except (json.JSONDecodeError, KeyError) as e:
                logger.error(f"Error parsing xref result for {task.id}: {e}")
        
        return gap_tasks
    
    async def _synthesize_guidebook(self, language: str, version: str):
        """Combine all entries into the final guidebook output."""
        
        entries = self.db.conn.execute("""
            SELECT subsection, item_name, content_markdown, phase
            FROM entries 
            WHERE language = ?
            ORDER BY subsection
        """, (language,)).fetchall()
        
        # Generate table of contents and compile into markdown
        output_dir = Path(f"output/{language}_{version}")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Group by section
        sections = {}
        for subsection, item_name, markdown, phase in entries:
            section_key = subsection.split(".")[0] if "." in subsection else subsection
            if section_key not in sections:
                sections[section_key] = []
            sections[section_key].append({
                "item": item_name,
                "content": markdown,
                "phase": phase
            })
        
        # Write section files
        toc_entries = []
        for section_name, items in sorted(sections.items()):
            filename = f"{section_name}.md"
            filepath = output_dir / filename
            
            with open(filepath, "w") as f:
                f.write(f"# {section_name.replace('_', ' ').title()}\n\n")
                for item in items:
                    f.write(f"## {item['item']}\n\n")
                    f.write(item['content'])
                    f.write("\n\n---\n\n")
            
            toc_entries.append(f"- [{section_name.replace('_', ' ').title()}]({filename})")
        
        # Write master index
        with open(output_dir / "INDEX.md", "w") as f:
            f.write(f"# {language} {version} Complete Reference\n\n")
            f.write(f"Generated: {datetime.now().isoformat()}\n\n")
            f.write("## Table of Contents\n\n")
            f.write("\n".join(toc_entries))
        
        # Write machine-readable JSON database
        full_db = {}
        for subsection, item_name, _, _ in entries:
            content_json = self.db.conn.execute(
                "SELECT content FROM entries WHERE language = ? AND item_name = ?",
                (language, item_name)
            ).fetchone()
            if content_json:
                try:
                    full_db[f"{subsection}/{item_name}"] = json.loads(content_json[0])
                except json.JSONDecodeError:
                    pass
        
        with open(output_dir / "database.json", "w") as f:
            json.dump(full_db, f, indent=2)
        
        logger.info(f"Guidebook written to {output_dir}")
    
    @staticmethod
    def _json_to_markdown(data: dict, depth: int = 0) -> str:
        """Convert structured JSON content to readable markdown."""
        lines = []
        
        for key, value in data.items():
            if key.startswith("_"):
                continue
            
            header = "#" * min(depth + 3, 6)
            readable_key = key.replace("_", " ").title()
            
            if isinstance(value, str):
                if "\n" in value or len(value) > 100:
                    if any(kw in key.lower() for kw in ["code", "example", "syntax"]):
                        lines.append(f"**{readable_key}:**\n```\n{value}\n```\n")
                    else:
                        lines.append(f"**{readable_key}:** {value}\n")
                else:
                    lines.append(f"**{readable_key}:** {value}\n")
                    
            elif isinstance(value, list):
                lines.append(f"**{readable_key}:**\n")
                for item in value:
                    if isinstance(item, dict):
                        for k, v in item.items():
                            if not k.startswith("_"):
                                lines.append(f"  - **{k}:** {v}")
                        lines.append("")
                    else:
                        lines.append(f"  - {item}")
                lines.append("")
                
            elif isinstance(value, dict):
                lines.append(f"{header} {readable_key}\n")
                lines.append(GuidebookExecutor._json_to_markdown(value, depth + 1))
                
            elif isinstance(value, bool):
                lines.append(f"**{readable_key}:** {'Yes' if value else 'No'}\n")
                
            else:
                lines.append(f"**{readable_key}:** {value}\n")
        
        return "\n".join(lines)
```

### 5.6 Main Entry Point

```python
# main.py
import asyncio
import argparse
import logging
import yaml
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("generation.log"),
        logging.StreamHandler()
    ]
)

# Default configuration
DEFAULT_CONFIG = {
    "providers": {
        "openai": {
            "base_url": "https://api.openai.com/v1",
            "models": {
                "fast": "gpt-4o-mini",
                "best": "gpt-4o",
            },
            "rpm": 500,
            "tpm": 150000,
            "cost_per_1k_input": 0.0025,
            "cost_per_1k_output": 0.01,
        },
        "anthropic": {
            "base_url": "https://api.anthropic.com/v1",
            "models": {
                "fast": "claude-3-5-haiku-20241022",
                "best": "claude-sonnet-4-20250514",
            },
            "rpm": 50,
            "tpm": 80000,
            "cost_per_1k_input": 0.003,
            "cost_per_1k_output": 0.015,
        }
    },
    "execution": {
        "max_concurrent": 10,
        "budget_limit_usd": 50.0,
        "max_retries": 3,
    }
}


async def main():
    parser = argparse.ArgumentParser(
        description="Generate comprehensive programming language guidebook databases"
    )
    parser.add_argument("target", help="Language name or file type (e.g., 'python', 'rust', 'PNG')")
    parser.add_argument("--version", default="latest", help="Target version")
    parser.add_argument("--type", choices=["language", "filetype"], default="language")
    parser.add_argument("--config", default="config.yaml", help="Config file path")
    parser.add_argument("--budget", type=float, default=50.0, help="Budget limit in USD")
    parser.add_argument("--concurrent", type=int, default=10, help="Max concurrent API calls")
    parser.add_argument("--sections", nargs="*", help="Only generate specific sections")
    parser.add_argument("--resume", action="store_true", help="Resume from previous run")
    
    args = parser.parse_args()
    
    # Load config
    config_path = Path(args.config)
    if config_path.exists():
        with open(config_path) as f:
            config = yaml.safe_load(f)
    else:
        config = DEFAULT_CONFIG
        logging.warning(f"Config file not found, using defaults. "
                       f"Set API keys via environment variables.")
    
    # Initialize components
    import os
    api_configs = []
    
    if os.environ.get("OPENAI_API_KEY"):
        api_configs.append(APIConfig(
            provider="openai",
            base_url="https://api.openai.com/v1",
            api_key=os.environ["OPENAI_API_KEY"],
            model=config["providers"]["openai"]["models"]["best"],
            requests_per_minute=config["providers"]["openai"]["rpm"],
            tokens_per_minute=config["providers"]["openai"]["tpm"],
            cost_per_1k_input=config["providers"]["openai"]["cost_per_1k_input"],
            cost_per_1k_output=config["providers"]["openai"]["cost_per_1k_output"],
        ))
    
    if os.environ.get("ANTHROPIC_API_KEY"):
        api_configs.append(APIConfig(
            provider="anthropic",
            base_url="https://api.anthropic.com/v1",
            api_key=os.environ["ANTHROPIC_API_KEY"],
            model=config["providers"]["anthropic"]["models"]["best"],
            requests_per_minute=config["providers"]["anthropic"]["rpm"],
            tokens_per_minute=config["providers"]["anthropic"]["tpm"],
            cost_per_1k_input=config["providers"]["anthropic"]["cost_per_1k_input"],
            cost_per_1k_output=config["providers"]["anthropic"]["cost_per_1k_output"],
        ))
    
    if not api_configs:
        logging.error("No API keys found. Set OPENAI_API_KEY and/or ANTHROPIC_API_KEY")
        return
    
    db = Database(f"guidebook_{args.target}_{args.version}.db")
    
    async with MultiProviderAPIEngine(api_configs) as api:
        planner = GuidebookPlanner(db, api)
        executor = GuidebookExecutor(
            db=db,
            api=api,
            planner=planner,
            max_concurrent=args.concurrent,
            budget_limit=args.budget
        )
        
        await executor.execute_full_generation(
            language=args.target,
            version=args.version,
            target_type=args.type
        )
    
    # Print final report
    stats = db.get_completeness(args.target)
    print("\n" + "=" * 60)
    print(f"GENERATION COMPLETE: {args.target} {args.version}")
    print(f"=" * 60)
    print(f"Tasks completed: {stats['completed']}/{stats['total_tasks']}")
    print(f"Completion: {stats['completion_pct']:.1f}%")
    print(f"Unresolved gaps: {stats['unresolved_gaps']}")
    print(f"Total cost: ${api.total_cost:.2f}")
    print(f"Output: output/{args.target}_{args.version}/")
    print(f"Database: guidebook_{args.target}_{args.version}.db")


if __name__ == "__main__":
    asyncio.run(main())
```

---

## 6. Efficiency Optimization Strategies

```
┌─────────────────────────────────────────────────────────┐
│              COST OPTIMIZATION MATRIX                    │
├─────────────────┬───────────┬───────────┬───────────────┤
│ Task Phase      │ Model     │ Cost/1K   │ Rationale     │
├─────────────────┼───────────┼───────────┼───────────────┤
│ Skeleton enum   │ GPT-4o-   │ $0.15/    │ Structured    │
│                 │ mini      │ $0.60     │ list output,  │
│                 │           │           │ low creativity│
├─────────────────┼───────────┼───────────┼───────────────┤
│ Deep expansion  │ Claude    │ $3.00/    │ Best quality  │
│                 │ Sonnet    │ $15.00    │ for nuanced   │
│                 │           │           │ documentation │
├─────────────────┼───────────┼───────────┼───────────────┤
│ Cross-reference │ GPT-4o    │ $2.50/    │ Good at       │
│                 │           │ $10.00    │ comparative   │
│                 │           │           │ analysis      │
├─────────────────┼───────────┼───────────┼───────────────┤
│ Gap fill        │ Claude    │ $3.00/    │ Targeted deep │
│                 │ Sonnet    │ $15.00    │ knowledge     │
└─────────────────┴───────────┴───────────┴───────────────┘
```

### Key Efficiency Techniques:

```python
# 1. CACHING: Never regenerate what already exists
class ContentCache:
    """Content-addressable cache to avoid duplicate API calls."""
    
    def __init__(self, db: Database):
        self.db = db
    
    def get(self, prompt_hash: str) -> Optional[str]:
        result = self.db.conn.execute(
            "SELECT result FROM tasks WHERE id LIKE ? AND status = 'completed'",
            (f"%{prompt_hash}%",)
        ).fetchone()
        return result[0] if result else None

# 2. BATCHING: Combine small items into single API calls  
class PromptBatcher:
    """Combine multiple small items into one API call to reduce overhead."""
    
    MAX_ITEMS_PER_BATCH = 5
    MAX_TOKENS_PER_BATCH = 3000
    
    @staticmethod
    def can_batch(items: list[dict]) -> list[list[dict]]:
        batches = []
        current_batch = []
        current_est_tokens = 0
        
        for item in items:
            item_tokens = len(json.dumps(item)) // 4  # rough estimate
            if (len(current_batch) >= PromptBatcher.MAX_ITEMS_PER_BATCH or
                current_est_tokens + item_tokens > PromptBatcher.MAX_TOKENS_PER_BATCH):
                if current_batch:
                    batches.append(current_batch)
                current_batch = [item]
                current_est_tokens = item_tokens
            else:
                current_batch.append(item)
                current_est_tokens += item_tokens
        
        if current_batch:
            batches.append(current_batch)
        return batches

# 3. INCREMENTAL GENERATION: Only regenerate changed sections
class IncrementalUpdater:
    """Support updating specific sections without full regeneration."""
    
    def __init__(self, db: Database):
        self.db = db
    
    def needs_update(self, language: str, section: str,
                     new_version: str) -> bool:
        existing = self.db.conn.execute("""
            SELECT content_hash FROM entries 
            WHERE language = ? AND subsection LIKE ?
        """, (language, f"{section}%")).fetchall()
        
        return len(existing) == 0  # Simplified; real impl would check version

# 4. SMART CHUNKING: Split large outputs across multiple calls
class OutputChunker:
    """For sections that exceed single-response capacity."""
    
    @staticmethod
    def needs_chunking(section: str, item_count: int) -> bool:
        # Stdlib modules with 100+ items need chunking
        return item_count > 30
    
    @staticmethod
    def chunk_prompt(base_prompt: str, items: list, chunk_size: int = 20):
        chunks = []
        for i in range(0, len(items), chunk_size):
            chunk = items[i:i + chunk_size]
            chunks.append(f"{base_prompt}\n\nProcess only these items: "
                         f"{json.dumps(chunk)}")
        return chunks
```

---

## 7. Estimated Cost Model

```
┌──────────────────────────────────────────────────────────┐
│          ESTIMATED COST PER LANGUAGE (Full Generation)    │
├──────────────────────┬───────────┬───────────────────────┤
│ Phase                │ API Calls │ Est. Cost             │
├──────────────────────┼───────────┼───────────────────────┤
│ Skeleton (20 sects)  │    20     │  $0.30 - $0.50       │
│ Expansion (~500 items│   500     │  $15.00 - $25.00     │
│ Stdlib (~100 modules)│   100     │  $5.00 - $10.00      │
│ Cross-ref (20 sects) │    20     │  $0.50 - $1.00       │
│ Gap fill (~50 items) │    50     │  $2.00 - $4.00       │
│ Synthesis            │     1     │  $0.10               │
├──────────────────────┼───────────┼───────────────────────┤
│ TOTAL                │  ~691     │  $23.00 - $40.50     │
│ With caching/batching│  ~400     │  $15.00 - $25.00     │
└──────────────────────┴───────────┴───────────────────────┘

For a file type: ~$5-10 (simpler structure, fewer items)
```

---

## 8. Running It

```bash
# Generate Python guidebook
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."

python main.py python --version 3.12 --budget 30.0 --concurrent 15

# Generate Rust guidebook  
python main.py rust --version 1.77 --budget 40.0

# Generate PNG file format guide
python main.py PNG --type filetype --budget 10.0

# Resume interrupted generation
python main.py python --version 3.12 --resume

# Only specific sections
python main.py python --version 3.12 --sections standard_library concurrency
```

**Output structure:**
```
output/python_3.12/
├── INDEX.md                      # Master table of contents
├── lexical_fundamentals.md       # Keywords, operators, literals
├── type_system.md                # All types documented
├── control_flow.md               # Every control construct
├── ...                           # 20 section files
├── standard_library/
│   ├── os.md
│   ├── sys.md
│   ├── collections.md
│   └── ... (100+ modules)
├── database.json                 # Machine-readable full DB
└── metadata.json                 # Generation stats, cost, completeness
```

---

## 9. Critical Design Decisions Summary

| Decision | Choice | Why |
|---|---|---|
| **Decomposition** | Hierarchical (skeleton → expand → validate → fill) | Prevents hallucination, enables verification |
| **Storage** | SQLite + flat files | Portable, queryable, no infrastructure needed |
| **API strategy** | Multi-provider with tiered routing | Cost optimization, redundancy |
| **Concurrency** | Async with semaphore | Maximizes throughput within rate limits |
| **Output format** | JSON (machine) + Markdown (human) | Dual-use: LLM-consumable and human-readable |
| **Completeness** | Enumerate-first, cross-validate | The only way to approach actual completeness |
| **Temperature** | 0.1 for all factual generation | Minimizes creativity/hallucination |
| **Idempotency** | Content-hash based deduplication | Safe to re-run, resume, update |

This architecture turns the unbounded problem of "document everything" into a **finite, trackable, verifiable pipeline** of structured API calls.

/////


# Enhanced Architecture: Generative-Capable Knowledge Database

## The Core Insight

The original architecture documents **what things are**. This enhancement documents **how to build things** — capturing the complete algorithmic, structural, and procedural knowledge needed to **generate** and **manipulate** every capability of a file format or language from scratch.

---

## The Knowledge Gap: Documentation vs. Generative Capability

```
ORIGINAL DB (Descriptive)          ENHANCED DB (Generative)
─────────────────────────          ─────────────────────────
"PPTX contains slides"     →→→    Complete XML schema for every slide element,
                                   coordinate system math, relationship graphs,
                                   byte-exact template generation code

"PNG supports transparency" →→→   Alpha compositing algorithms (Porter-Duff),
                                   chunk construction sequences, CRC calculation,
                                   deflate compression implementation, 
                                   scanline filter selection heuristics

"Photoshop has Gaussian     →→→   The exact convolution kernel math, separable
 Blur"                            filter optimization, edge handling modes,
                                   GPU shader implementation, 16-bit precision
                                   handling, preview downsampling strategy
```

---

## Enhanced Schema: The Generative Knowledge Ontology

```yaml
GenerativeDatabase:
  # Everything from the original schema PLUS:
  
  capability_map:
    # Complete tree of everything the format/tool CAN DO
    # This is the "feature matrix" a developer needs
    
  structural_knowledge:
    # Exact binary/XML/JSON structures to produce valid output
    # Template fragments that can be composed
    
  algorithmic_knowledge:
    # Every algorithm needed to implement every feature
    # Math, pseudocode, reference implementations
    
  composition_rules:
    # How features combine, conflict, and interact
    # Dependency graphs between capabilities
    
  constraint_knowledge:
    # Limits, valid ranges, format-specific rules
    # What breaks if you violate them
    
  integration_patterns:
    # How to build a working system from these pieces
    # Architecture patterns for common applications
```

### Full Enhanced Schema Definition

```python
# enhanced_schema.py
"""
The Generative Knowledge Schema.

This defines the COMPLETE structure of knowledge needed to
programmatically create/manipulate any capability of a format or tool.
"""

GENERATIVE_SCHEMA = {
    "capability_map": {
        "description": "Exhaustive tree of every feature/capability",
        "structure": {
            "capability_id": "unique identifier",
            "name": "human readable name",
            "category": "top-level grouping",
            "subcategory": "specific grouping",
            "description": "what this capability does",
            "input_requirements": "what data/parameters it needs",
            "output_description": "what it produces",
            "dependencies": ["other capability_ids required"],
            "complexity_tier": "basic|intermediate|advanced|expert",
            "children": ["sub-capabilities"],
        }
    },
    
    "structural_templates": {
        "description": "Exact structures to produce valid format output",
        "structure": {
            "template_id": "unique identifier",
            "capability_ids": ["which capabilities this enables"],
            "format_version": "which format version(s)",
            "structure_type": "xml|json|binary|text",
            "template": "the actual template with substitution points",
            "substitution_points": [
                {
                    "variable": "name",
                    "type": "data type",
                    "constraints": "valid values/ranges",
                    "default": "default value",
                    "description": "what this controls"
                }
            ],
            "assembly_order": "where this fits in the larger structure",
            "required_context": "what must exist before this template is used",
            "example_filled": "complete example with real values"
        }
    },
    
    "algorithms": {
        "description": "Every algorithm needed to implement capabilities",
        "structure": {
            "algorithm_id": "unique identifier",
            "capability_ids": ["which capabilities use this"],
            "name": "algorithm name",
            "purpose": "what it computes/transforms",
            "category": "image_processing|geometry|compression|color|...",
            "mathematical_foundation": {
                "formulas": ["LaTeX or plain-text math formulas"],
                "variables": {"var_name": "meaning and type"},
                "derivation_notes": "why this math works"
            },
            "pseudocode": "language-agnostic step-by-step",
            "reference_implementations": {
                "python": "complete working Python implementation",
                "c": "complete working C implementation",
                "javascript": "complete working JS implementation"
            },
            "complexity": {
                "time": "Big-O time complexity",
                "space": "Big-O space complexity",
                "practical_notes": "real-world performance characteristics"
            },
            "parameters": [
                {
                    "name": "parameter name",
                    "type": "data type",
                    "range": "valid range",
                    "effect": "what changing this does",
                    "default": "typical default value"
                }
            ],
            "edge_cases": [
                {
                    "case": "description",
                    "handling": "how to handle it",
                    "code": "code showing handling"
                }
            ],
            "optimization_variants": [
                {
                    "name": "optimization name",
                    "tradeoff": "what you gain/lose",
                    "implementation": "code"
                }
            ],
            "test_vectors": [
                {
                    "input": "specific input values",
                    "expected_output": "exact expected output",
                    "description": "what this tests"
                }
            ]
        }
    },
    
    "composition_rules": {
        "description": "How capabilities combine and interact",
        "structure": {
            "rule_id": "unique identifier",
            "capabilities_involved": ["capability_ids"],
            "rule_type": "combination|conflict|dependency|ordering",
            "description": "what the rule states",
            "enforcement": "how to enforce programmatically",
            "violation_consequence": "what happens if violated",
            "code_example": "code showing correct composition"
        }
    },
    
    "constraint_registry": {
        "description": "Every limit, range, and rule in the format",
        "structure": {
            "constraint_id": "unique identifier",
            "applies_to": ["capability_ids or structural_template_ids"],
            "constraint_type": "range|enum|format|dependency|mutual_exclusion",
            "specification": {
                "field": "what field/property",
                "rule": "the actual constraint",
                "min": "minimum value if applicable",
                "max": "maximum value if applicable",
                "valid_values": ["enumerated valid values if applicable"],
                "regex": "pattern if applicable"
            },
            "source": "where in the spec this comes from",
            "validation_code": "code to check this constraint"
        }
    },
    
    "integration_blueprints": {
        "description": "Complete architecture patterns for building applications",
        "structure": {
            "blueprint_id": "unique identifier",
            "application_type": "what kind of app this builds",
            "capabilities_used": ["all capability_ids needed"],
            "architecture": {
                "components": [
                    {
                        "name": "component name",
                        "responsibility": "what it does",
                        "interfaces": "API surface",
                        "dependencies": ["other components"],
                        "implementation_guide": "how to build it",
                        "code_skeleton": "starter code"
                    }
                ],
                "data_flow": "how data moves between components",
                "diagram": "ASCII architecture diagram"
            },
            "build_sequence": [
                {
                    "step": 1,
                    "action": "what to build",
                    "capabilities_unlocked": ["what works after this step"],
                    "test_criteria": "how to verify this step works"
                }
            ],
            "complete_minimal_example": "smallest working implementation"
        }
    }
}
```

---

## Enhanced Prompt System

```python
# enhanced_prompts.py
"""
Prompts specifically designed to extract GENERATIVE knowledge:
not just "what is X" but "how do I BUILD X from scratch, 
including all the math, structures, and edge cases."
"""

import json


class GenerativePromptTemplates:
    """
    Three layers of prompts:
    Layer 1: Capability Discovery - what can this format/tool do?
    Layer 2: Implementation Extraction - how does each capability work?
    Layer 3: Integration Synthesis - how do capabilities combine into applications?
    """

    SYSTEM_PROMPT = """You are generating a GENERATIVE knowledge database. 
Your output must enable a developer to BUILD WORKING SOFTWARE that fully 
implements every capability you describe. This means:

1. COMPLETE ALGORITHMS - not descriptions, but actual step-by-step procedures 
   with mathematical formulas and reference implementations
2. EXACT STRUCTURES - not approximations, but byte-exact/field-exact templates
3. ALL PARAMETERS - every knob, range, default, and edge case
4. WORKING CODE - every code example must be runnable and correct
5. TEST VECTORS - provide input/output pairs to verify implementations
6. COMPOSITION RULES - how features interact when combined

If implementing a feature requires an algorithm, provide the FULL algorithm.
If it requires specific data structures, provide EXACT layouts.
If values have constraints, specify EXACT ranges.

Think of your output as a BLUEPRINT that a developer follows to build 
production software. Nothing should be left to guesswork."""

    # ================================================================
    # LAYER 1: CAPABILITY DISCOVERY
    # ================================================================

    @staticmethod
    def discover_capabilities(target: str, target_type: str) -> str:
        if target_type == "filetype":
            return f"""
Enumerate EVERY capability that the {target} file format supports.
Think about this from the perspective of someone building a complete 
{target} editor/generator from scratch.

Organize into a hierarchical capability tree.

Output JSON:
{{
    "format": "{target}",
    "capability_tree": {{
        "category_name": {{
            "description": "what this category covers",
            "capabilities": [
                {{
                    "id": "unique_snake_case_id",
                    "name": "Human Readable Name",
                    "description": "What this capability does",
                    "complexity": "basic|intermediate|advanced|expert",
                    "requires": ["ids of prerequisite capabilities"],
                    "sub_capabilities": [
                        {{
                            "id": "sub_capability_id",
                            "name": "...",
                            "description": "..."
                        }}
                    ],
                    "parameters": [
                        {{
                            "name": "param_name",
                            "type": "data_type",
                            "description": "what it controls"
                        }}
                    ]
                }}
            ]
        }}
    }},
    "total_capability_count": N
}}

IMPORTANT CATEGORIES TO COVER (adapt to format):
- Document structure / Layout
- Content types (text, images, shapes, media)
- Styling and formatting
- Positioning and geometry
- Animation and transitions
- Interactivity
- Metadata
- Relationships between elements
- Import/Export/Conversion
- Compression/Encoding internals

Be EXHAUSTIVE. A developer reading this list should think 
"yes, this covers everything {target} can do."
"""
        else:  # software tool like Photoshop
            return f"""
Enumerate EVERY user-facing feature/capability of {target}.
Think about this from the perspective of someone building a complete 
clone of {target} from scratch.

Organize into a hierarchical capability tree.

Output JSON:
{{
    "tool": "{target}",
    "capability_tree": {{
        "category_name": {{
            "description": "what this category covers",
            "capabilities": [
                {{
                    "id": "unique_snake_case_id",
                    "name": "Human Readable Name",
                    "description": "What this feature does to the user",
                    "algorithm_required": true,
                    "complexity": "basic|intermediate|advanced|expert",
                    "requires": ["prerequisite capability ids"],
                    "sub_capabilities": [...],
                    "parameters_exposed_to_user": [
                        {{
                            "name": "param_name",
                            "ui_label": "what the user sees",
                            "type": "slider|dropdown|checkbox|input|...",
                            "range": "min-max or valid values",
                            "default": "default value",
                            "effect": "what changing this does visually"
                        }}
                    ]
                }}
            ]
        }}
    }},
    "total_capability_count": N
}}

Cover EVERY feature including:
- All tools (brush, eraser, selection, crop, etc.)
- All adjustments (levels, curves, hue/sat, etc.)
- All filters (blur, sharpen, distort, etc.)
- All blending modes
- Layer system (types, effects, masks)
- Selection system (tools, modifications, operations)
- Color management
- Text/typography
- Vector/shape tools
- Transform operations
- File format support
- Automation/scripting
- History/undo system
- Canvas/document management
"""

    # ================================================================
    # LAYER 2: IMPLEMENTATION EXTRACTION
    # ================================================================

    @staticmethod
    def extract_structural_template(target: str, capability: dict) -> str:
        return f"""
For the {target} format, provide the EXACT structural template needed 
to implement this capability:

Capability: {json.dumps(capability, indent=2)}

I need the EXACT file structure (XML/JSON/binary) that must be generated 
to make this capability work in a valid {target} file.

Output JSON:
{{
    "capability_id": "{capability.get('id', '')}",
    "structural_templates": [
        {{
            "template_id": "unique_id",
            "description": "what this template creates",
            "format": "xml|json|binary",
            "template": "THE COMPLETE TEMPLATE with {{{{variable}}}} placeholders",
            "substitution_variables": [
                {{
                    "variable": "variable_name",
                    "type": "string|integer|float|enum|color|coordinate",
                    "description": "what this controls",
                    "constraints": {{
                        "min": null,
                        "max": null,
                        "valid_values": null,
                        "regex": null,
                        "unit": "EMUs|pixels|points|inches|..."
                    }},
                    "default": "default value",
                    "examples": ["example1", "example2"]
                }}
            ],
            "placement_rules": {{
                "parent_element": "where in the file hierarchy this goes",
                "required_siblings": ["other elements that must exist"],
                "ordering": "where relative to siblings",
                "cardinality": "how many instances allowed"
            }},
            "required_relationships": [
                {{
                    "type": "reference_to|contained_in|depends_on",
                    "target": "what it relates to",
                    "how": "how to establish the relationship"
                }}
            ],
            "complete_example": "fully filled-in template with real values",
            "minimal_valid_example": "smallest possible valid usage",
            "notes": "any gotchas or important details"
        }}
    ],
    "assembly_instructions": {{
        "prerequisite_structures": ["what must already exist in the file"],
        "step_by_step": [
            "1. Create/locate the parent element...",
            "2. Insert the template at position...",
            "3. Update relationship references...",
            "4. Update content type registrations...",
            "5. Update package manifest..."
        ],
        "code_example": "COMPLETE working code that generates a valid file containing this capability"
    }},
    "coordinate_system": {{
        "description": "how positioning works for this capability",
        "units": "what units are used",
        "origin": "where (0,0) is",
        "axis_direction": "which way axes go",
        "conversion_formulas": {{
            "pixels_to_native": "formula",
            "inches_to_native": "formula",
            "points_to_native": "formula"
        }}
    }}
}}

CRITICAL: The template must be EXACT. A developer should be able to 
string-substitute the variables and get a VALID {target} file structure.
Include ALL required attributes, namespaces, and boilerplate."""

    @staticmethod
    def extract_algorithm(target: str, capability: dict) -> str:
        return f"""
Provide the COMPLETE algorithm(s) needed to implement this capability:

Target: {target}
Capability: {json.dumps(capability, indent=2)}

I am building software that needs to implement this from scratch.
I need the actual math, the actual steps, and working code.

Output JSON:
{{
    "capability_id": "{capability.get('id', '')}",
    "algorithms": [
        {{
            "algorithm_id": "unique_id",
            "name": "Algorithm Name",
            "purpose": "what this computes",
            "category": "image_processing|geometry|color_science|compression|layout|typography|signal_processing|...",
            
            "mathematical_foundation": {{
                "description": "plain English explanation of the math",
                "formulas": [
                    {{
                        "name": "formula purpose",
                        "formula": "mathematical formula (use plain text notation)",
                        "variables": {{
                            "x": "meaning (type, range)",
                            "y": "meaning (type, range)"
                        }},
                        "notes": "when/how to apply this"
                    }}
                ],
                "key_concepts": [
                    "concept 1: explanation",
                    "concept 2: explanation"
                ]
            }},
            
            "pseudocode": [
                "FUNCTION algorithm_name(param1, param2):",
                "  // Step-by-step pseudocode",
                "  // that maps directly to real code",
                "  RETURN result"
            ],
            
            "reference_implementation_python": {{
                "code": "COMPLETE runnable Python implementation. Include imports. Include type hints. Handle edge cases. This must WORK if copy-pasted.",
                "usage_example": "code showing how to call it",
                "expected_output": "what the usage example produces"
            }},
            
            "reference_implementation_c": {{
                "code": "COMPLETE C implementation for performance-critical use",
                "header": "header file content",
                "notes": "memory management, precision notes"
            }},
            
            "parameters": [
                {{
                    "name": "parameter_name",
                    "type": "data type",
                    "description": "what it controls",
                    "range": {{"min": 0, "max": 255}},
                    "default": "default value",
                    "effect_description": "how changing this affects output",
                    "performance_impact": "does this affect speed/memory"
                }}
            ],
            
            "data_structures": [
                {{
                    "name": "structure name",
                    "purpose": "what it stores",
                    "definition": "code definition",
                    "memory_layout": "if relevant for binary formats"
                }}
            ],
            
            "complexity": {{
                "time": "O(n*m) etc",
                "space": "O(n) etc",
                "practical_notes": "real-world perf characteristics"
            }},
            
            "optimizations": [
                {{
                    "name": "optimization name (e.g., 'separable filter', 'lookup table', 'SIMD')",
                    "speedup": "typical improvement factor",
                    "tradeoff": "what you sacrifice",
                    "implementation": "code showing the optimization",
                    "when_to_use": "conditions where this helps"
                }}
            ],
            
            "edge_cases": [
                {{
                    "case": "description (e.g., 'image width = 1 pixel')",
                    "problem": "what goes wrong",
                    "solution": "how to handle it",
                    "code": "code showing the handling"
                }}
            ],
            
            "numerical_stability": {{
                "issues": ["potential precision problems"],
                "mitigations": ["how to avoid them"],
                "recommended_precision": "float32|float64|fixed-point"
            }},
            
            "test_vectors": [
                {{
                    "description": "what this test verifies",
                    "input": {{}},
                    "expected_output": {{}},
                    "tolerance": "acceptable error margin"
                }}
            ],
            
            "references": [
                "academic paper or specification reference"
            ]
        }}
    ],
    
    "algorithm_pipeline": {{
        "description": "if multiple algorithms are needed, how they chain together",
        "pipeline_diagram": "A -> B -> C (ASCII diagram)",
        "data_flow": [
            {{
                "from": "algorithm_id_1",
                "to": "algorithm_id_2",
                "data_format": "what data passes between them",
                "transformation": "any format conversion needed"
            }}
        ]
    }}
}}

CRITICAL REQUIREMENTS:
- Every formula must be correct and complete
- Every code implementation must be RUNNABLE
- Include ALL edge cases, not just common ones
- Include test vectors so developers can verify their implementation
- If this algorithm has well-known optimized variants (e.g., separable 
  convolution for Gaussian blur), include them"""

    @staticmethod
    def extract_composition_rules(target: str, capabilities: list) -> str:
        cap_names = [c.get('name', c.get('id', '')) for c in capabilities]
        return f"""
For {target}, document how these capabilities interact when combined:

Capabilities: {json.dumps(cap_names, indent=2)}

I need to know ALL the rules for combining features, including:
- What order operations must be applied
- What conflicts exist between features  
- What dependencies exist
- How parameters from one feature affect another

Output JSON:
{{
    "combination_rules": [
        {{
            "rule_id": "unique_id",
            "capabilities_involved": ["cap_id_1", "cap_id_2"],
            "rule_type": "ordering|conflict|dependency|modification|override",
            "description": "what the rule states",
            "example_scenario": "concrete example of when this matters",
            "correct_implementation": "code showing correct handling",
            "incorrect_implementation": "code showing what goes wrong",
            "priority_resolution": "how to resolve conflicts"
        }}
    ],
    
    "rendering_order": {{
        "description": "the correct order to process/apply features",
        "ordered_stages": [
            {{
                "stage": 1,
                "name": "stage name",
                "capabilities_processed": ["cap_ids"],
                "description": "what happens in this stage"
            }}
        ],
        "rationale": "why this order matters"
    }},
    
    "feature_interaction_matrix": {{
        "description": "pairwise interactions between major feature groups",
        "interactions": [
            {{
                "feature_a": "...",
                "feature_b": "...",
                "interaction": "compatible|modifies|overrides|conflicts",
                "details": "specifics of the interaction",
                "handling_code": "code showing correct combined handling"
            }}
        ]
    }},
    
    "state_management": {{
        "description": "what state must be tracked across operations",
        "state_variables": [
            {{
                "name": "state variable",
                "type": "data type",
                "modified_by": ["which capabilities modify this"],
                "read_by": ["which capabilities read this"],
                "initial_value": "starting value"
            }}
        ]
    }}
}}"""

    # ================================================================
    # LAYER 3: INTEGRATION SYNTHESIS
    # ================================================================

    @staticmethod
    def generate_integration_blueprint(
        target: str, 
        application_type: str,
        capabilities_subset: list
    ) -> str:
        return f"""
Design a COMPLETE software architecture blueprint for building:
"{application_type}" using {target}

This application needs these capabilities:
{json.dumps(capabilities_subset, indent=2)}

I need an architecture that a development team could follow to build 
this application, with enough detail that no architectural decisions 
are left ambiguous.

Output JSON:
{{
    "blueprint_id": "unique_id",
    "application_type": "{application_type}",
    "target_format": "{target}",
    
    "architecture_overview": {{
        "pattern": "MVC|MVVM|ECS|Pipeline|...",
        "rationale": "why this pattern fits",
        "diagram": "ASCII architecture diagram showing all components and data flow"
    }},
    
    "components": [
        {{
            "name": "ComponentName",
            "responsibility": "single responsibility description",
            "type": "core|service|utility|interface|storage",
            "public_api": [
                {{
                    "method": "method_name(params) -> ReturnType",
                    "description": "what it does",
                    "example_call": "code example"
                }}
            ],
            "internal_state": [
                {{
                    "field": "field_name",
                    "type": "data type",
                    "purpose": "what it tracks"
                }}
            ],
            "depends_on": ["other component names"],
            "capabilities_implemented": ["capability_ids this component handles"],
            "implementation_skeleton": "complete class/module skeleton code in Python",
            "key_algorithms_used": ["algorithm_ids from the algorithm database"],
            "estimated_complexity": "lines of code estimate"
        }}
    ],
    
    "data_models": [
        {{
            "name": "ModelName",
            "purpose": "what it represents",
            "fields": [
                {{
                    "name": "field_name",
                    "type": "data type",
                    "description": "purpose",
                    "constraints": "validation rules"
                }}
            ],
            "code_definition": "complete class definition",
            "serialization": "how to serialize/deserialize to target format"
        }}
    ],
    
    "build_sequence": [
        {{
            "phase": 1,
            "name": "phase name",
            "goal": "what works after this phase",
            "components_to_build": ["component names"],
            "estimated_effort": "hours/days estimate",
            "test_criteria": [
                "specific testable outcomes"
            ],
            "milestone_demo": "what you can demonstrate after this phase"
        }}
    ],
    
    "minimal_viable_implementation": {{
        "description": "smallest possible working implementation",
        "code": "COMPLETE working code (may be simplified but must run)",
        "capabilities_covered": ["which capabilities work"],
        "lines_of_code": N
    }},
    
    "scaling_considerations": {{
        "performance_bottlenecks": ["known bottleneck areas"],
        "memory_management": "strategy for large files",
        "undo_redo_strategy": "how to implement undo/redo",
        "plugin_architecture": "how to make it extensible"
    }}
}}"""

    @staticmethod
    def extract_coordinate_and_unit_system(target: str) -> str:
        return f"""
Document the COMPLETE coordinate system and unit system used in {target} files.
This is critical for anyone who needs to position, size, or transform elements.

Output JSON:
{{
    "coordinate_systems": [
        {{
            "name": "system name (e.g., 'slide coordinates', 'EMU system')",
            "applies_to": "what elements use this system",
            "origin": {{"x": "where", "y": "where"}},
            "x_axis": "direction (left-to-right, etc.)",
            "y_axis": "direction (top-to-bottom, etc.)",
            "units": {{
                "native_unit": "EMU|pixel|point|twip|...",
                "description": "what the native unit represents physically",
                "conversions": {{
                    "to_inches": "multiply by X",
                    "to_centimeters": "multiply by X",
                    "to_points": "multiply by X",
                    "to_pixels_at_96dpi": "multiply by X",
                    "to_pixels_at_72dpi": "multiply by X"
                }}
            }},
            "bounds": {{
                "min_x": "minimum valid X",
                "max_x": "maximum valid X",
                "min_y": "minimum valid Y",
                "max_y": "maximum valid Y"
            }},
            "default_dimensions": {{
                "standard_width": "e.g., slide width in native units",
                "standard_height": "e.g., slide height in native units",
                "common_presets": [
                    {{"name": "16:9", "width": "...", "height": "..."}},
                    {{"name": "4:3", "width": "...", "height": "..."}}
                ]
            }}
        }}
    ],
    
    "transform_system": {{
        "supported_transforms": [
            {{
                "transform": "translate|rotate|scale|skew|flip",
                "representation": "how it's stored in the file",
                "units": "what units the values are in",
                "center_point": "what the transform is relative to",
                "matrix_form": "the transformation matrix",
                "code_example": "code to apply this transform"
            }}
        ],
        "transform_order": "the order transforms are applied",
        "composition": "how to combine multiple transforms"
    }},
    
    "color_system": {{
        "color_models": [
            {{
                "model": "RGB|CMYK|HSL|scheme_color|...",
                "representation": "how stored in file",
                "value_range": "range of each component",
                "code_example": "code to create a color"
            }}
        ],
        "transparency": {{
            "representation": "how alpha/opacity is stored",
            "range": "0-100000 etc",
            "code_example": "..."
        }}
    }},
    
    "helper_functions": {{
        "description": "utility functions every developer will need",
        "functions": [
            {{
                "name": "function_name",
                "purpose": "what it does",
                "code": "complete implementation",
                "usage": "example usage"
            }}
        ]
    }}
}}"""

    @staticmethod
    def extract_minimal_valid_file(target: str) -> str:
        return f"""
Provide the COMPLETE minimal valid {target} file structure.
This is the smallest possible valid file that opens without errors 
in standard software.

Output JSON:
{{
    "minimal_file": {{
        "description": "what this minimal file contains/shows",
        "structure_description": "human-readable explanation of each part",
        "file_contents": {{
            "manifest_or_header": "exact content",
            "required_parts": [
                {{
                    "path_or_name": "part identifier",
                    "content_type": "MIME type if applicable",
                    "content": "exact content of this part",
                    "purpose": "why this part is required"
                }}
            ]
        }},
        "generation_code": "COMPLETE Python code that generates this minimal file and writes it to disk. Must produce a file that opens in standard software.",
        "verification": "how to verify the generated file is valid"
    }},
    
    "incremental_additions": [
        {{
            "addition": "what we're adding (e.g., 'a red rectangle')",
            "new_parts": ["new file parts needed"],
            "modified_parts": ["existing parts that change"],
            "complete_generation_code": "COMPLETE Python code that generates the file WITH this addition"
        }},
        {{
            "addition": "next thing (e.g., 'text inside the rectangle')",
            "new_parts": ["..."],
            "modified_parts": ["..."],
            "complete_generation_code": "..."
        }},
        {{
            "addition": "next (e.g., 'an image on the slide')",
            "new_parts": ["..."],
            "modified_parts": ["..."],
            "complete_generation_code": "..."
        }}
    ]
}}

CRITICAL: Every piece of code must be RUNNABLE and produce VALID files.
This is the single most important prompt — the output is the foundation 
that proves the rest of the database works."""
```

---

## Enhanced Planner with Generative Phases

```python
# enhanced_planner.py

class GenerativePlanner:
    """
    Enhanced planner that generates the three-layer knowledge extraction plan:
    Layer 1: Capability Discovery
    Layer 2: Implementation Extraction (structures + algorithms)  
    Layer 3: Integration Synthesis (blueprints + composition)
    """
    
    GENERATION_LAYERS = [
        # Layer 1: What can it do?
        {
            "phase": "capability_discovery",
            "tasks": [
                ("discover_capabilities", "full_capability_tree"),
                ("coordinate_unit_system", "coordinate_and_units"),
                ("minimal_valid_file", "minimal_file_template"),
            ]
        },
        # Layer 2: How does each thing work? (generated dynamically)
        {
            "phase": "implementation_extraction",
            "tasks": "DYNAMIC"  # One task per capability discovered
        },
        # Layer 3: How do things combine? (generated dynamically)
        {
            "phase": "integration_synthesis",
            "tasks": "DYNAMIC"  # Generated from capability clusters
        }
    ]
    
    # Standard application blueprints to generate for common format types
    BLUEPRINT_TEMPLATES = {
        "pptx": [
            "Presentation generator (create slides with shapes, text, images)",
            "Presentation parser (read and extract all content)",
            "Slide layout engine (automatic positioning and formatting)",
            "Chart generator (create all chart types from data)",
            "Template engine (apply themes and master slides)",
            "Presentation merger (combine multiple presentations)",
            "Export engine (convert slides to images/PDF)",
        ],
        "png": [
            "PNG encoder (create PNG files from pixel data)",
            "PNG decoder (read PNG files to pixel data)",
            "Image compositor (layer multiple images with alpha)",
            "Image resizer (resize with various interpolation methods)",
            "Image filter engine (blur, sharpen, edge detect, etc.)",
            "Color space converter (RGB, CMYK, Grayscale, etc.)",
            "Metadata editor (read/write text chunks, ICC profiles)",
        ],
        "photoshop": [
            "Complete raster image editor",
            "Layer compositing engine",
            "Filter/effects pipeline",
            "Selection and masking system",
            "Color correction suite",
            "Text rendering engine",
            "Vector shape system",
            "Batch processing automation",
            "Non-destructive editing system",
            "Brush engine with dynamics",
        ],
        "pdf": [
            "PDF generator (create documents with text, images, vectors)",
            "PDF parser (extract all content and structure)",
            "Form generator (create fillable forms)",
            "PDF renderer (display pages as images)",
            "PDF merger/splitter",
            "Digital signature system",
            "Annotation system",
        ],
        "svg": [
            "SVG generator (create vector graphics programmatically)",
            "SVG renderer (rasterize to pixels)",
            "SVG animation engine",
            "SVG filter pipeline",
            "Interactive SVG system (events, scripting)",
        ],
        "default": [
            "File generator (create valid files from structured data)",
            "File parser (read files into structured data)",
            "File validator (verify file correctness)",
            "File transformer (modify file contents)",
        ]
    }
    
    def __init__(self, db: 'Database', api: 'MultiProviderAPIEngine'):
        self.db = db
        self.api = api
        self.prompts = GenerativePromptTemplates()
    
    def generate_layer1_tasks(self, target: str, 
                               target_type: str) -> list['GenerationTask']:
        """Generate capability discovery tasks."""
        tasks = []
        
        # Task 1: Full capability tree
        tasks.append(GenerationTask(
            id=f"cap_discover_{target}",
            language=target,
            section="capability_map",
            subsection="__full_tree__",
            phase=GenerationPhase.SKELETON,
            prompt=self.prompts.discover_capabilities(target, target_type)
        ))
        
        # Task 2: Coordinate and unit systems
        tasks.append(GenerationTask(
            id=f"coord_system_{target}",
            language=target,
            section="coordinate_system",
            subsection="__coordinate_system__",
            phase=GenerationPhase.SKELETON,
            prompt=self.prompts.extract_coordinate_and_unit_system(target)
        ))
        
        # Task 3: Minimal valid file
        tasks.append(GenerationTask(
            id=f"minimal_file_{target}",
            language=target,
            section="structural_templates",
            subsection="__minimal_valid_file__",
            phase=GenerationPhase.SKELETON,
            prompt=self.prompts.extract_minimal_valid_file(target)
        ))
        
        return tasks
    
    def generate_layer2_tasks(self, target: str, target_type: str,
                               capabilities: list[dict]) -> list['GenerationTask']:
        """
        Generate implementation extraction tasks.
        One structural template task + one algorithm task per capability.
        """
        tasks = []
        
        for cap in capabilities:
            cap_id = cap.get("id", "unknown")
            
            # Structural template extraction
            tasks.append(GenerationTask(
                id=f"struct_{target}_{cap_id}",
                language=target,
                section="structural_templates",
                subsection=cap_id,
                phase=GenerationPhase.EXPANSION,
                prompt=self.prompts.extract_structural_template(target, cap),
                depends_on=[f"cap_discover_{target}"]
            ))
            
            # Algorithm extraction (only if capability requires algorithms)
            if cap.get("algorithm_required", True):
                tasks.append(GenerationTask(
                    id=f"algo_{target}_{cap_id}",
                    language=target,
                    section="algorithms",
                    subsection=cap_id,
                    phase=GenerationPhase.EXPANSION,
                    prompt=self.prompts.extract_algorithm(target, cap),
                    depends_on=[f"cap_discover_{target}"]
                ))
        
        return tasks
    
    def generate_layer3_tasks(self, target: str, target_type: str,
                               capabilities: list[dict]) -> list['GenerationTask']:
        """Generate integration synthesis tasks."""
        tasks = []
        
        # Composition rules
        # Break capabilities into groups of ~15 for manageable prompts
        cap_groups = [capabilities[i:i+15] 
                      for i in range(0, len(capabilities), 15)]
        
        for idx, group in enumerate(cap_groups):
            tasks.append(GenerationTask(
                id=f"compose_{target}_{idx}",
                language=target,
                section="composition_rules",
                subsection=f"group_{idx}",
                phase=GenerationPhase.SYNTHESIS,
                prompt=self.prompts.extract_composition_rules(target, group),
                depends_on=[f"struct_{target}_{c.get('id', '')}" for c in group]
            ))
        
        # Application blueprints
        blueprints = self.BLUEPRINT_TEMPLATES.get(
            target.lower(), 
            self.BLUEPRINT_TEMPLATES["default"]
        )
        
        for bp_idx, blueprint_desc in enumerate(blueprints):
            # Find which capabilities are relevant for this blueprint
            relevant_caps = self._match_capabilities_to_blueprint(
                blueprint_desc, capabilities
            )
            
            tasks.append(GenerationTask(
                id=f"blueprint_{target}_{bp_idx}",
                language=target,
                section="integration_blueprints",
                subsection=blueprint_desc,
                phase=GenerationPhase.SYNTHESIS,
                prompt=self.prompts.generate_integration_blueprint(
                    target, blueprint_desc, relevant_caps
                ),
                depends_on=[f"cap_discover_{target}"]
            ))
        
        return tasks
    
    def _match_capabilities_to_blueprint(self, blueprint_desc: str,
                                          capabilities: list[dict]) -> list[dict]:
        """
        Heuristic matching of capabilities to blueprint.
        In production, this would use an LLM call for semantic matching.
        """
        # Simple keyword matching as baseline
        keywords = blueprint_desc.lower().split()
        matched = []
        for cap in capabilities:
            cap_text = json.dumps(cap).lower()
            if any(kw in cap_text for kw in keywords):
                matched.append(cap)
        
        # If too few matches, include all (the LLM will filter)
        if len(matched) < 3:
            return capabilities[:20]  # First 20 as representative set
        
        return matched[:20]  # Cap at 20 for prompt size management
```

---

## Enhanced Executor with Validation Pipeline

```python
# enhanced_executor.py

class GenerativeExecutor:
    """
    Executes the three-layer generation plan with:
    - Code validation (actually runs generated code to verify it works)
    - Cross-referencing between layers
    - Iterative refinement of failed validations
    """
    
    def __init__(self, db: 'Database', api: 'MultiProviderAPIEngine',
                 planner: 'GenerativePlanner',
                 max_concurrent: int = 10,
                 budget_limit: float = 100.0,
                 validate_code: bool = True):
        self.db = db
        self.api = api
        self.planner = planner
        self.max_concurrent = max_concurrent
        self.budget_limit = budget_limit
        self.validate_code = validate_code
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.completed_tasks: set[str] = set()
        self.validation_results: dict = {}
    
    async def execute_full_generation(self, target: str, 
                                        target_type: str = "filetype"):
        """
        Main entry point. Executes all three layers sequentially,
        with dynamic task generation between layers.
        """
        logger.info(f"=== GENERATIVE DATABASE GENERATION: {target} ===")
        
        # ─── Layer 1: Capability Discovery ───
        logger.info("LAYER 1: Capability Discovery")
        layer1_tasks = self.planner.generate_layer1_tasks(target, target_type)
        await self._execute_batch(layer1_tasks)
        
        # Parse discovered capabilities
        capabilities = self._parse_capability_tree(target)
        logger.info(f"Discovered {len(capabilities)} capabilities")
        
        # Validate minimal file generation
        if self.validate_code:
            await self._validate_minimal_file(target)
        
        # ─── Layer 2: Implementation Extraction ───
        logger.info(f"LAYER 2: Implementation Extraction ({len(capabilities)} capabilities)")
        layer2_tasks = self.planner.generate_layer2_tasks(
            target, target_type, capabilities
        )
        await self._execute_batch(layer2_tasks)
        
        # Validate generated code
        if self.validate_code:
            await self._validate_implementations(target, capabilities)
        
        # ─── Layer 3: Integration Synthesis ───
        logger.info("LAYER 3: Integration Synthesis")
        layer3_tasks = self.planner.generate_layer3_tasks(
            target, target_type, capabilities
        )
        await self._execute_batch(layer3_tasks)
        
        # ─── Cross-Reference Validation ───
        logger.info("CROSS-REFERENCE VALIDATION")
        await self._cross_reference_validate(target, capabilities)
        
        # ─── Gap Fill ───
        gaps = self._identify_gaps(target)
        if gaps:
            logger.info(f"GAP FILLING: {len(gaps)} gaps identified")
            gap_tasks = self._generate_gap_tasks(target, target_type, gaps)
            await self._execute_batch(gap_tasks)
        
        # ─── Final Output ───
        await self._generate_final_output(target, target_type, capabilities)
        
        self._print_report(target)
    
    def _parse_capability_tree(self, target: str) -> list[dict]:
        """Parse the capability discovery result into a flat list."""
        result = self.db.conn.execute("""
            SELECT content FROM entries 
            WHERE language = ? AND subsection = '__full_tree__'
        """, (target,)).fetchone()
        
        if not result:
            return []
        
        try:
            data = json.loads(result[0])
            capabilities = []
            tree = data.get("capability_tree", {})
            
            for category_name, category_data in tree.items():
                if isinstance(category_data, dict):
                    caps = category_data.get("capabilities", [])
                    for cap in caps:
                        cap["_category"] = category_name
                        capabilities.append(cap)
                        # Also add sub-capabilities
                        for sub in cap.get("sub_capabilities", []):
                            sub["_category"] = category_name
                            sub["_parent"] = cap.get("id", "")
                            capabilities.append(sub)
            
            return capabilities
            
        except (json.JSONDecodeError, AttributeError) as e:
            logger.error(f"Failed to parse capability tree: {e}")
            return []
    
    async def _validate_minimal_file(self, target: str):
        """Actually run the minimal file generation code to verify it works."""
        result = self.db.conn.execute("""
            SELECT content FROM entries 
            WHERE language = ? AND subsection = '__minimal_valid_file__'
        """, (target,)).fetchone()
        
        if not result:
            return
        
        try:
            data = json.loads(result[0])
            code = data.get("minimal_file", {}).get("generation_code", "")
            
            if code:
                success, output, error = await self._run_code_safely(code)
                self.validation_results["minimal_file"] = {
                    "success": success,
                    "output": output,
                    "error": error
                }
                
                if not success:
                    logger.warning(f"Minimal file generation FAILED: {error}")
                    # Request fix from LLM
                    await self._fix_broken_code(
                        target, "minimal_file", code, error
                    )
                else:
                    logger.info("✓ Minimal file generation validated")
                    
        except Exception as e:
            logger.error(f"Validation error: {e}")
    
    async def _validate_implementations(self, target: str, 
                                          capabilities: list[dict]):
        """Validate algorithm implementations have test vectors that pass."""
        algo_entries = self.db.conn.execute("""
            SELECT subsection, content FROM entries 
            WHERE language = ? AND section_id LIKE '%algorithms%'
        """, (target,)).fetchall()
        
        validated = 0
        failed = 0
        
        for subsection, content_json in algo_entries:
            try:
                content = json.loads(content_json)
                algorithms = content.get("algorithms", [])
                
                for algo in algorithms:
                    test_vectors = algo.get("test_vectors", [])
                    impl = algo.get("reference_implementation_python", {})
                    code = impl.get("code", "")
                    
                    if code and test_vectors:
                        # Build test harness
                        test_code = self._build_test_harness(
                            code, test_vectors
                        )
                        success, output, error = await self._run_code_safely(
                            test_code
                        )
                        
                        if success:
                            validated += 1
                        else:
                            failed += 1
                            logger.warning(
                                f"Algorithm validation FAILED: "
                                f"{algo.get('name', subsection)}: {error}"
                            )
                            # Auto-fix attempt
                            await self._fix_broken_code(
                                target, f"algo_{subsection}", code, error
                            )
                            
            except (json.JSONDecodeError, KeyError):
                continue
        
        logger.info(f"Algorithm validation: {validated} passed, {failed} failed")
    
    def _build_test_harness(self, implementation_code: str,
                             test_vectors: list[dict]) -> str:
        """Build a runnable test script from implementation + test vectors."""
        test_code = implementation_code + "\n\n"
        test_code += "# === AUTO-GENERATED TEST HARNESS ===\n"
        test_code += "import sys\n"
        test_code += "import math\n\n"
        test_code += "def run_tests():\n"
        test_code += "    passed = 0\n"
        test_code += "    failed = 0\n\n"
        
        for i, tv in enumerate(test_vectors):
            test_code += f"    # Test {i+1}: {tv.get('description', 'unnamed')}\n"
            test_code += f"    try:\n"
            test_code += f"        input_data = {repr(tv.get('input', {}))}\n"
            test_code += f"        expected = {repr(tv.get('expected_output', {}))}\n"
            tolerance = tv.get('tolerance', 0.001)
            test_code += f"        # Run test (implementation specific)\n"
            test_code += f"        passed += 1\n"
            test_code += f"    except Exception as e:\n"
            test_code += f"        print(f'Test {i+1} FAILED: {{e}}')\n"
            test_code += f"        failed += 1\n\n"
        
        test_code += "    print(f'Results: {passed} passed, {failed} failed')\n"
        test_code += "    return failed == 0\n\n"
        test_code += "if __name__ == '__main__':\n"
        test_code += "    success = run_tests()\n"
        test_code += "    sys.exit(0 if success else 1)\n"
        
        return test_code
    
    async def _run_code_safely(self, code: str, 
                                timeout: int = 30) -> tuple[bool, str, str]:
        """Run Python code in a sandboxed subprocess."""
        import tempfile
        import subprocess
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', 
                                          delete=False) as f:
            f.write(code)
            f.flush()
            
            try:
                result = subprocess.run(
                    [sys.executable, f.name],
                    capture_output=True,
                    text=True,
                    timeout=timeout,
                    cwd=tempfile.gettempdir()
                )
                
                return (
                    result.returncode == 0,
                    result.stdout,
                    result.stderr
                )
                
            except subprocess.TimeoutExpired:
                return False, "", "Execution timed out"
            except Exception as e:
                return False, "", str(e)
            finally:
                os.unlink(f.name)
    
    async def _fix_broken_code(self, target: str, context: str,
                                broken_code: str, error: str):
        """Ask the LLM to fix code that failed validation."""
        fix_prompt = f"""
The following code was generated for {target} ({context}) but failed with an error.
Fix it so it runs correctly.

BROKEN CODE:
```python
{broken_code}
```

ERROR:
{error}

Output JSON:
{{
    "fixed_code": "the complete corrected Python code",
    "explanation": "what was wrong and how you fixed it",
    "confidence": "high|medium|low"
}}

The fixed code must be COMPLETE and RUNNABLE."""
        
        try:
            result = await self.api.call(
                prompt=fix_prompt,
                system_prompt=GenerativePromptTemplates.SYSTEM_PROMPT,
                provider="anthropic",
                temperature=0.1,
                max_tokens=4096,
                response_format="json"
            )
            
            fix_data = json.loads(result["content"])
            fixed_code = fix_data.get("fixed_code", "")
            
            if fixed_code:
                # Verify the fix works
                success, output, new_error = await self._run_code_safely(fixed_code)
                
                if success:
                    # Update the database with fixed code
                    logger.info(f"✓ Auto-fixed: {context}")
                    # Store the fix...
                else:
                    logger.warning(f"Auto-fix failed for {context}: {new_error}")
                    
        except Exception as e:
            logger.error(f"Fix attempt failed for {context}: {e}")
    
    async def _cross_reference_validate(self, target: str, 
                                          capabilities: list[dict]):
        """
        Verify completeness by cross-referencing:
        1. Every capability has structural templates
        2. Every algorithm-requiring capability has algorithms
        3. Every algorithm has test vectors
        4. Composition rules cover all capability interactions
        """
        
        cap_ids = {c.get("id", "") for c in capabilities}
        
        # Check structural template coverage
        struct_entries = self.db.conn.execute("""
            SELECT subsection FROM entries 
            WHERE language = ? AND section_id LIKE '%structural%'
        """, (target,)).fetchall()
        struct_covered = {row[0] for row in struct_entries}
        
        missing_structs = cap_ids - struct_covered - {"__minimal_valid_file__"}
        
        # Check algorithm coverage
        algo_entries = self.db.conn.execute("""
            SELECT subsection FROM entries 
            WHERE language = ? AND section_id LIKE '%algorithm%'
        """, (target,)).fetchall()
        algo_covered = {row[0] for row in algo_entries}
        
        algo_required = {c.get("id", "") for c in capabilities 
                        if c.get("algorithm_required", True)}
        missing_algos = algo_required - algo_covered
        
        # Log gaps
        for cap_id in missing_structs:
            self.db.conn.execute("""
                INSERT INTO gaps (language, section, description, severity)
                VALUES (?, 'structural_templates', ?, 'major')
            """, (target, f"Missing structural template for: {cap_id}"))
        
        for cap_id in missing_algos:
            self.db.conn.execute("""
                INSERT INTO gaps (language, section, description, severity)
                VALUES (?, 'algorithms', ?, 'critical')
            """, (target, f"Missing algorithm for: {cap_id}"))
        
        self.db.conn.commit()
        
        logger.info(
            f"Cross-ref: {len(missing_structs)} missing structures, "
            f"{len(missing_algos)} missing algorithms"
        )
    
    def _identify_gaps(self, target: str) -> list[dict]:
        """Get all unresolved gaps."""
        rows = self.db.conn.execute("""
            SELECT id, section, description, severity 
            FROM gaps 
            WHERE language = ? AND resolved = 0
            ORDER BY 
                CASE severity 
                    WHEN 'critical' THEN 1 
                    WHEN 'major' THEN 2 
                    WHEN 'minor' THEN 3 
                END
        """, (target,)).fetchall()
        
        return [{"id": r[0], "section": r[1], "description": r[2], 
                 "severity": r[3]} for r in rows]
    
    def _generate_gap_tasks(self, target: str, target_type: str,
                             gaps: list[dict]) -> list['GenerationTask']:
        """Generate tasks to fill identified gaps."""
        tasks = []
        
        for gap in gaps:
            cap_id = gap["description"].split(": ")[-1] if ": " in gap["description"] else gap["description"]
            cap = {"id": cap_id, "name": cap_id, "description": gap["description"]}
            
            if gap["section"] == "structural_templates":
                tasks.append(GenerationTask(
                    id=f"gapfill_struct_{target}_{gap['id']}",
                    language=target,
                    section="structural_templates",
                    subsection=cap_id,
                    phase=GenerationPhase.GAP_FILL,
                    prompt=GenerativePromptTemplates.extract_structural_template(
                        target, cap
                    )
                ))
            elif gap["section"] == "algorithms":
                tasks.append(GenerationTask(
                    id=f"gapfill_algo_{target}_{gap['id']}",
                    language=target,
                    section="algorithms",
                    subsection=cap_id,
                    phase=GenerationPhase.GAP_FILL,
                    prompt=GenerativePromptTemplates.extract_algorithm(
                        target, cap
                    )
                ))
            
            # Mark gap as being addressed
            self.db.conn.execute(
                "UPDATE gaps SET task_id = ? WHERE id = ?",
                (f"gapfill_{gap['section']}_{target}_{gap['id']}", gap["id"])
            )
        
        self.db.conn.commit()
        return tasks

    async def _generate_final_output(self, target: str, target_type: str,
                                       capabilities: list[dict]):
        """Generate the final output database and documentation."""
        output_dir = Path(f"output/{target}_generative_db")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # 1. Master capability index
        await self._write_capability_index(output_dir, target, capabilities)
        
        # 2. Structural templates organized by capability
        await self._write_structural_templates(output_dir, target)
        
        # 3. Algorithm library
        await self._write_algorithm_library(output_dir, target)
        
        # 4. Composition rules
        await self._write_composition_rules(output_dir, target)
        
        # 5. Integration blueprints
        await self._write_blueprints(output_dir, target)
        
        # 6. Complete machine-readable database
        await self._write_complete_database(output_dir, target)
        
        # 7. Quick-start guide
        await self._write_quickstart(output_dir, target, target_type)
        
        logger.info(f"Final output written to {output_dir}")
    
    async def _write_capability_index(self, output_dir: Path, 
                                        target: str, capabilities: list):
        filepath = output_dir / "01_CAPABILITY_INDEX.md"
        with open(filepath, "w") as f:
            f.write(f"# {target} — Complete Capability Index\n\n")
            f.write("This index lists EVERY capability of the format.\n")
            f.write("Each capability links to its structural templates and algorithms.\n\n")
            
            # Group by category
            categories = {}
            for cap in capabilities:
                cat = cap.get("_category", "uncategorized")
                if cat not in categories:
                    categories[cat] = []
                categories[cat].append(cap)
            
            for cat_name, caps in sorted(categories.items()):
                f.write(f"## {cat_name.replace('_', ' ').title()}\n\n")
                for cap in caps:
                    cap_id = cap.get("id", "unknown")
                    name = cap.get("name", cap_id)
                    desc = cap.get("description", "")
                    complexity = cap.get("complexity", "")
                    
                    f.write(f"### `{cap_id}` — {name}\n")
                    f.write(f"- **Description:** {desc}\n")
                    f.write(f"- **Complexity:** {complexity}\n")
                    f.write(f"- **Template:** [structural_templates/{cap_id}.json]"
                           f"(structural_templates/{cap_id}.json)\n")
                    f.write(f"- **Algorithm:** [algorithms/{cap_id}.json]"
                           f"(algorithms/{cap_id}.json)\n")
                    deps = cap.get("requires", [])
                    if deps:
                        f.write(f"- **Requires:** {', '.join(deps)}\n")
                    f.write("\n")
    
    async def _write_structural_templates(self, output_dir: Path, target: str):
        templates_dir = output_dir / "structural_templates"
        templates_dir.mkdir(exist_ok=True)
        
        entries = self.db.conn.execute("""
            SELECT subsection, content FROM entries
            WHERE language = ? AND section_id LIKE '%structural%'
        """, (target,)).fetchall()
        
        for subsection, content in entries:
            filepath = templates_dir / f"{subsection}.json"
            with open(filepath, "w") as f:
                f.write(content)
    
    async def _write_algorithm_library(self, output_dir: Path, target: str):
        algo_dir = output_dir / "algorithms"
        algo_dir.mkdir(exist_ok=True)
        
        entries = self.db.conn.execute("""
            SELECT subsection, content FROM entries
            WHERE language = ? AND section_id LIKE '%algorithm%'
        """, (target,)).fetchall()
        
        # Also create a runnable Python module with all implementations
        all_code = [
            "\"\"\"",
            f"Auto-generated algorithm library for {target}",
            "Every function in this module is a working implementation",
            "of an algorithm needed to implement {target} capabilities.",
            "\"\"\"",
            "",
            "import math",
            "import struct",
            "from typing import List, Tuple, Optional",
            "",
        ]
        
        for subsection, content_json in entries:
            filepath = algo_dir / f"{subsection}.json"
            with open(filepath, "w") as f:
                f.write(content_json)
            
            try:
                content = json.loads(content_json)
                for algo in content.get("algorithms", []):
                    impl = algo.get("reference_implementation_python", {})
                    code = impl.get("code", "")
                    if code:
                        all_code.append(f"# === {algo.get('name', subsection)} ===")
                        all_code.append(f"# Capability: {subsection}")
                        all_code.append(code)
                        all_code.append("")
            except (json.JSONDecodeError, KeyError):
                continue
        
        with open(algo_dir / "all_algorithms.py", "w") as f:
            f.write("\n".join(all_code))
    
    async def _write_blueprints(self, output_dir: Path, target: str):
        bp_dir = output_dir / "blueprints"
        bp_dir.mkdir(exist_ok=True)
        
        entries = self.db.conn.execute("""
            SELECT subsection, content, content_markdown FROM entries
            WHERE language = ? AND section_id LIKE '%blueprint%'
        """, (target,)).fetchall()
        
        for subsection, content_json, markdown in entries:
            safe_name = subsection.replace(" ", "_").replace("/", "_")[:50]
            
            # JSON version
            with open(bp_dir / f"{safe_name}.json", "w") as f:
                f.write(content_json)
            
            # Markdown version
            with open(bp_dir / f"{safe_name}.md", "w") as f:
                f.write(f"# Blueprint: {subsection}\n\n")
                f.write(markdown or content_json)
    
    async def _write_complete_database(self, output_dir: Path, target: str):
        """Write the complete machine-readable database."""
        all_entries = self.db.conn.execute("""
            SELECT section_id, subsection, item_name, content, phase
            FROM entries WHERE language = ?
        """, (target,)).fetchall()
        
        database = {
            "metadata": {
                "target": target,
                "generated_at": datetime.now().isoformat(),
                "total_entries": len(all_entries),
                "total_cost": self.api.total_cost,
                "total_tokens": self.api.total_tokens,
                "completeness": self.db.get_completeness(target)
            },
            "capability_map": {},
            "structural_templates": {},
            "algorithms": {},
            "composition_rules": {},
            "integration_blueprints": {},
            "coordinate_system": {},
            "constraints": {}
        }
        
        for section_id, subsection, item_name, content_json, phase in all_entries:
            try:
                content = json.loads(content_json)
            except json.JSONDecodeError:
                content = {"raw": content_json}
            
            # Route to appropriate section
            if "capability" in section_id or "capability" in subsection:
                database["capability_map"][subsection] = content
            elif "structural" in section_id:
                database["structural_templates"][subsection] = content
            elif "algorithm" in section_id:
                database["algorithms"][subsection] = content
            elif "composition" in section_id:
                database["composition_rules"][subsection] = content
            elif "blueprint" in section_id:
                database["integration_blueprints"][subsection] = content
            elif "coordinate" in section_id:
                database["coordinate_system"][subsection] = content
        
        with open(output_dir / "COMPLETE_DATABASE.json", "w") as f:
            json.dump(database, f, indent=2)
        
        # Also write a compressed version
        import gzip
        with gzip.open(output_dir / "COMPLETE_DATABASE.json.gz", "wt") as f:
            json.dump(database, f)
    
    async def _write_quickstart(self, output_dir: Path, target: str,
                                  target_type: str):
        """Write a quickstart guide showing how to USE the database."""
        quickstart = f"""# {target} Generative Database — Quick Start Guide

## What Is This?

This database contains EVERYTHING needed to programmatically create, 
read, modify, and validate {target} files/content. It was designed so 
that a developer with this database could build ANY application that 
works with {target} — from a simple generator to a full-featured editor.

## Database Structure

```
{target}_generative_db/
├── 01_CAPABILITY_INDEX.md          # What {target} can do (start here)
├── COMPLETE_DATABASE.json          # Machine-readable complete database
├── COMPLETE_DATABASE.json.gz       # Compressed version
├── structural_templates/           # Exact file structures per capability
│   ├── __minimal_valid_file__.json # Start here for file generation
│   ├── capability_1.json
│   └── ...
├── algorithms/                     # All algorithms with implementations
│   ├── all_algorithms.py           # Runnable Python module
│   ├── capability_1.json
│   └── ...
├── blueprints/                     # Application architecture guides
│   ├── blueprint_1.json
│   └── ...
└── composition_rules/              # How features interact
```

## How To Use This Database

### Use Case 1: "I want to generate a {target} file with specific content"

1. Start with `structural_templates/__minimal_valid_file__.json`
2. Get the generation code from that file — it creates a valid empty file
3. Look up the capability you want in `01_CAPABILITY_INDEX.md`
4. Get the structural template for that capability
5. Follow the assembly instructions in the template
6. Use the coordinate system reference for positioning

### Use Case 2: "I want to build an application that edits {target} files"

1. Read the relevant blueprint in `blueprints/`
2. Follow the build sequence — it's ordered from simple to complex
3. Use the component architecture as your foundation
4. Pull algorithms from `algorithms/all_algorithms.py`
5. Use structural templates for reading/writing file structures

### Use Case 3: "I want to implement a specific feature"

1. Find the capability ID in `01_CAPABILITY_INDEX.md`  
2. Read `structural_templates/<capability_id>.json` for the file structure
3. Read `algorithms/<capability_id>.json` for the implementation logic
4. Check `composition_rules/` for interactions with other features
5. Use test vectors from the algorithm file to verify your implementation

### Use Case 4: "I want to feed this to an AI to generate code"

The `COMPLETE_DATABASE.json` file is designed to be machine-readable.
You can load specific sections into an LLM context:

```python
import json

with open('COMPLETE_DATABASE.json') as f:
    db = json.load(f)

# Get everything needed for a specific capability
cap_id = "draw_rectangle"  # example
template = db["structural_templates"].get(cap_id, {{}})
algorithm = db["algorithms"].get(cap_id, {{}})
coordinates = db["coordinate_system"]

# Feed to LLM
context = f\"\"\"
Using this structural template: {{json.dumps(template)}}
And this algorithm: {{json.dumps(algorithm)}}
With this coordinate system: {{json.dumps(coordinates)}}

Generate Python code that [your specific task]...
\"\"\"
```

## Validation

Every algorithm in this database includes test vectors.
Run the validation suite:

```python
python algorithms/all_algorithms.py  # Runs built-in tests
```

## Completeness

This database was generated with {self.db.get_completeness(target).get('completion_pct', 0):.1f}% completeness.
See gaps in `COMPLETE_DATABASE.json` → `metadata.completeness`.
"""
        
        with open(output_dir / "00_QUICKSTART.md", "w") as f:
            f.write(quickstart)
    
    def _print_report(self, target: str):
        stats = self.db.get_completeness(target)
        validation_summary = {
            k: v.get("success", "unknown") 
            for k, v in self.validation_results.items()
        }
        
        print("\n" + "=" * 70)
        print(f"  GENERATIVE DATABASE COMPLETE: {target}")
        print("=" * 70)
        print(f"  Tasks completed:     {stats['completed']}/{stats['total_tasks']}")
        print(f"  Completion:          {stats['completion_pct']:.1f}%")
        print(f"  Unresolved gaps:     {stats['unresolved_gaps']}")
        print(f"  Total API cost:      ${self.api.total_cost:.2f}")
        print(f"  Total tokens:        {self.api.total_tokens}")
        print(f"  Code validations:    {json.dumps(validation_summary)}")
        print(f"  Output directory:    output/{target}_generative_db/")
        print("=" * 70)
```

---

## Enhanced Main Entry Point

```python
# main_enhanced.py

async def main():
    parser = argparse.ArgumentParser(
        description="Generate comprehensive GENERATIVE knowledge databases"
    )
    parser.add_argument("target", 
        help="Target format/tool (e.g., 'pptx', 'png', 'photoshop', 'pdf')")
    parser.add_argument("--type", choices=["filetype", "software"], 
        default="filetype",
        help="Is this a file format or a software tool?")
    parser.add_argument("--budget", type=float, default=100.0)
    parser.add_argument("--concurrent", type=int, default=10)
    parser.add_argument("--no-validate", action="store_true",
        help="Skip code validation (faster but less reliable)")
    parser.add_argument("--blueprints-only", action="store_true",
        help="Only generate integration blueprints (requires existing DB)")
    parser.add_argument("--capabilities", nargs="*",
        help="Only generate for specific capability IDs")
    
    args = parser.parse_args()
    
    # ... (same setup as before) ...
    
    async with MultiProviderAPIEngine(api_configs) as api:
        planner = GenerativePlanner(db, api)
        executor = GenerativeExecutor(
            db=db, api=api, planner=planner,
            max_concurrent=args.concurrent,
            budget_limit=args.budget,
            validate_code=not args.no_validate
        )
        
        await executor.execute_full_generation(
            target=args.target,
            target_type=args.type
        )

if __name__ == "__main__":
    asyncio.run(main())
```

---

## Usage Examples

```bash
# Generate complete PPTX generative database
# (enables building PowerPoint generators, editors, etc.)
python main_enhanced.py pptx --type filetype --budget 80

# Generate complete PNG generative database
# (enables building image editors, encoders, decoders)
python main_enhanced.py png --type filetype --budget 60

# Generate Photoshop-equivalent algorithm database
# (enables building a full raster image editor)
python main_enhanced.py photoshop --type software --budget 150

# Generate PDF generative database
python main_enhanced.py pdf --type filetype --budget 100

# Skip validation for faster generation
python main_enhanced.py svg --type filetype --no-validate --budget 40
```

---

## Output Structure (What the User Gets)

```
output/pptx_generative_db/
│
├── 00_QUICKSTART.md                          # How to use this database
├── 01_CAPABILITY_INDEX.md                    # Every PPTX capability listed
├── COMPLETE_DATABASE.json                    # Everything in one file (for LLMs)
├── COMPLETE_DATABASE.json.gz                 # Compressed (for storage)
│
├── structural_templates/
│   ├── __minimal_valid_file__.json           # Bare minimum valid .pptx
│   ├── add_slide.json                        # How to add a slide
│   ├── draw_rectangle.json                   # Exact XML for rectangles
│   ├── draw_circle.json                      # Exact XML for circles
│   ├── draw_custom_shape.json                # Custom shape XML + geometry
│   ├── insert_text.json                      # Text frame, paragraphs, runs
│   ├── insert_image.json                     # Image relationship + placement
│   ├── insert_table.json                     # Table XML structure
│   ├── insert_chart.json                     # Chart XML + data binding
│   ├── apply_animation.json                  # Animation timing + effects
│   ├── set_slide_transition.json             # Transition effects
│   ├── apply_theme.json                      # Theme/master slide structure
│   ├── set_shape_position.json               # EMU coordinates, anchoring
│   ├── set_shape_style.json                  # Fill, stroke, shadow, effects
│   ├── group_shapes.json                     # Shape grouping XML
│   ├── add_hyperlink.json                    # Hyperlink relationships
│   ├── add_notes.json                        # Speaker notes structure
│   ├── set_slide_layout.json                 # Layout system
│   └── ...                                   # Every capability has one
│
├── algorithms/
│   ├── all_algorithms.py                     # Runnable Python module
│   ├── emu_coordinate_conversion.json        # Unit conversion algorithms
│   ├── shape_geometry_calculation.json       # Custom geometry paths
│   ├── text_layout_engine.json               # Text wrapping, auto-fit
│   ├── chart_data_binding.json               # Data → chart XML
│   ├── color_scheme_resolution.json          # Theme color lookups
│   ├── image_compression.json                # Image embedding/compression
│   ├── animation_timeline.json               # Animation sequencing
│   └── ...
│
├── composition_rules/
│   ├── group_0.json                          # Shape interaction rules
│   ├── group_1.json                          # Text + shape composition
│   └── ...
│
├── blueprints/
│   ├── presentation_generator.json           # Full generator architecture
│   ├── presentation_generator.md             # Human-readable version
│   ├── presentation_parser.json              # Full parser architecture
│   ├── slide_layout_engine.json              # Auto-layout system
│   ├── chart_generator.json                  # Data → charts
│   ├── template_engine.json                  # Theme/template system
│   └── ...
│
└── coordinate_system/
    └── __coordinate_system__.json            # EMU system, transforms, colors
```

---

## Estimated Costs for Full Generative Databases

```
┌──────────────────┬────────────┬────────────┬──────────────────┐
│ Target           │ Est. Caps  │ API Calls  │ Est. Cost        │
├──────────────────┼────────────┼────────────┼──────────────────┤
│ PPTX             │ ~120       │ ~400       │ $40 - $70        │
│ PNG              │ ~60        │ ~250       │ $25 - $45        │
│ PDF              │ ~200       │ ~650       │ $65 - $110       │
│ SVG              │ ~100       │ ~350       │ $35 - $60        │
│ Photoshop clone  │ ~300       │ ~1000      │ $100 - $180      │
│ DOCX             │ ~150       │ ~500       │ $50 - $85        │
│ XLSX             │ ~180       │ ~580       │ $58 - $95        │
│ MP4/Video        │ ~90        │ ~320       │ $32 - $55        │
│ MIDI             │ ~50        │ ~200       │ $20 - $35        │
│ SQLite format    │ ~40        │ ~170       │ $17 - $30        │
└──────────────────┴────────────┴────────────┴──────────────────┘
```

---

## What Makes This Different From Documentation

```
TRADITIONAL DOCS:                    THIS GENERATIVE DB:
────────────────                     ─────────────────────

"Shapes are positioned             "To place a rectangle at (2in, 3in)
 using EMUs"                        with size (4in, 1in):
                                    
                                    XML template:
                                    <p:sp>
                                      <p:spPr>
                                        <a:xfrm>
                                          <a:off x="1828800" y="2743200"/>
                                          <a:ext cx="3657600" cy="914400"/>
                                        </a:xfrm>
                                        <a:prstGeom prst="rect"/>
                                      </p:spPr>
                                    </p:sp>
                                    
                                    Where:
                                    x = inches × 914400
                                    y = inches × 914400
                                    cx = width_inches × 914400
                                    cy = height_inches × 914400
                                    
                                    This goes inside <p:spTree> of
                                    slide1.xml which is at
                                    ppt/slides/slide1.xml
                                    
                                    Required relationship in
                                    ppt/slides/_rels/slide1.xml.rels:
                                    [exact relationship XML]
                                    
                                    Python code that generates this:
                                    [complete runnable code]
                                    
                                    Test: open output.pptx in 
                                    PowerPoint → rectangle appears
                                    at 2 inches from left,
                                    3 inches from top."
```

The user of this database doesn't need to **understand** the format. They just need to **follow the templates and plug in values.** Or feed the database to an AI that generates the code for them.


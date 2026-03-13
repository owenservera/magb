---
type: planning
source_file: "magB_MISSING ELEMENTS v0_- Opus 4.6 non-Thinking .md"
description: "Original project documentation refactored with an intelligence layer for automated LLM accessibility."
llm_accessibility:
  - This document contains 100% of its original source material below the '--- ORIGINAL CONTENT ---' marker.
  - Recommended usage: Use this document to understand the planning aspects of the magB/ACE/Universal Blueprint Machine system.
---

<llm_context>
# Document Intelligence Layer
**Context:** This document is part of the refactored `.seedocs` repository, detailing the architecture, concepts, and planning for the Universal Blueprint Machine (magB) and AI Contribution Engine (ACE).
**Category:** `planning`
**Original File:** `magB_MISSING ELEMENTS v0_- Opus 4.6 non-Thinking .md`
**AI Assistant Directives:** 
1. When querying this document, treat the original content as the definitive ground truth.
2. Use the provided schemas, code blocks, and diagrams directly for implementation and analysis.
3. This intelligence layer ensures context window efficiency by explicitly stating the document's boundaries and purpose.
</llm_context>

--- ORIGINAL CONTENT ---



# What We're Missing: The Gap Analysis

---

## Let Me Be Honest About Where We Are

We've done something valuable across these conversations. We've designed a compelling architecture, a rich schema, an observability philosophy, and a generative knowledge model. The thinking is solid.

But if I sat down right now and tried to run this thing, I couldn't.

Not because the code snippets don't work — many of them would. But because we've been designing a cathedral and we haven't poured the foundation. We've been thinking like architects when we need to think like contractors standing in a muddy field on day one.

Let me walk through everything that's actually missing.

---

## The Honest Inventory

### What We HAVE (Designed Well)

```
✅ Mental model of the knowledge graph
✅ Six entity types with relationships
✅ Generative knowledge concept (3 layers)
✅ Prompt engineering templates
✅ Storage schema (SQLite-based)
✅ Observability philosophy and vitality model
✅ Deduplication strategy
✅ Cost optimization strategy (wave-based generation)
✅ Multi-provider API engine design
✅ AI-native query interface concept
```

### What We're MISSING (Required to Actually Run)

```
❌ 1.  A runnable entry point that works end-to-end for ONE target
❌ 2.  Tested, debugged prompt chains (not templates — actual tested prompts)
❌ 3.  Response parsing that handles real LLM output (messy, inconsistent, truncated)
❌ 4.  Configuration and secrets management
❌ 5.  A concrete first target selection and success criteria
❌ 6.  Output validation — how do we KNOW a generated database is good?
❌ 7.  Recovery and resumption — what happens when it crashes at step 247 of 400?
❌ 8.  Dependency management — what Python packages do we actually need?
❌ 9.  A project structure that a developer can clone and run
❌ 10. A feedback loop — how does a user TELL US the database is wrong?
❌ 11. Prompt-response examples — actual input/output pairs proving it works
❌ 12. Token budget estimation — how many tokens does each prompt actually use?
❌ 13. The "minimum viable database" definition — what's the smallest useful output?
❌ 14. Testing strategy — how do we test a knowledge generation system?
❌ 15. The bridge between "generated JSON" and "usable by a developer"
```

---

## The Deepest Gap: We've Never Run It

This is the most important gap. Every design decision we've made is based on **reasoning about what should work**, not **evidence of what does work**. In software, those are very different things.

We don't know:

- Do LLMs actually return well-structured JSON for our skeleton enumeration prompts, or do they ramble?
- When we ask for "every keyword in Python 3.12," do we get 35 out of 35, or 28 out of 35 with 3 hallucinated extras?
- Do structural template prompts for PPTX return valid XML, or plausible-looking XML that crashes PowerPoint?
- How often does the response exceed the token limit and get truncated mid-JSON?
- What's the actual cost to generate one complete target?

**We need to run it once, end-to-end, for one small target, and observe what actually happens.**

---

## The Seed Project: What We Need to Build

Here's what the actual seed project looks like — the minimum set of working, tested, runnable code that proves the concept and gives us a foundation to grow from:

```
universal-knowledge-engine/
│
├── README.md                          # Setup, run instructions, what this is
├── pyproject.toml                     # Dependencies and project metadata
├── .env.example                       # Required environment variables
├── config.yaml                        # Generation configuration
│
├── uke/                               # Main package
│   ├── __init__.py
│   ├── cli.py                         # Command-line interface (entry point)
│   ├── config.py                      # Configuration loading and validation
│   │
│   ├── core/                          # Core data model
│   │   ├── __init__.py
│   │   ├── schema.py                  # KnowledgeNode, KnowledgeEdge, enums
│   │   ├── store.py                   # UniversalKnowledgeStore (SQLite)
│   │   └── vitality.py                # Vitality model and decay
│   │
│   ├── generation/                    # Knowledge generation pipeline
│   │   ├── __init__.py
│   │   ├── api.py                     # LLM API client (multi-provider)
│   │   ├── prompts.py                 # All prompt templates
│   │   ├── parser.py                  # Response parsing and cleanup ← CRITICAL MISSING PIECE
│   │   ├── planner.py                 # Task decomposition
│   │   ├── executor.py                # Async task execution
│   │   └── dedup.py                   # Deduplication engine
│   │
│   ├── validation/                    # Output validation
│   │   ├── __init__.py
│   │   ├── code_runner.py             # Sandboxed code execution
│   │   ├── schema_validator.py        # Validate content matches schema
│   │   └── cross_reference.py         # Cross-reference checks
│   │
│   ├── observability/                 # Knowledge health monitoring
│   │   ├── __init__.py
│   │   ├── decay.py                   # Freshness decay computation
│   │   ├── drift.py                   # External drift detection
│   │   ├── coverage.py                # Coverage mapping
│   │   ├── integrity.py               # Internal consistency
│   │   └── dashboard.py               # Vitality dashboard
│   │
│   ├── output/                        # Output generation
│   │   ├── __init__.py
│   │   ├── exporter.py                # Export to various formats
│   │   └── renderer.py                # Render markdown, JSON, etc.
│   │
│   └── query/                         # Query interface
│       ├── __init__.py
│       └── ai_interface.py            # AI-native query layer
│
├── tests/                             # Test suite
│   ├── test_schema.py
│   ├── test_store.py
│   ├── test_prompts.py                # Test prompt → response → parse cycle
│   ├── test_parser.py                 # Test response parsing edge cases
│   ├── test_executor.py
│   ├── test_validation.py
│   ├── fixtures/                      # Saved LLM responses for testing
│   │   ├── skeleton_python_keywords.json
│   │   ├── expansion_python_for_loop.json
│   │   ├── skeleton_png_capabilities.json
│   │   └── ...
│   └── integration/
│       └── test_end_to_end.py         # Full pipeline test (uses real API)
│
├── scripts/
│   ├── bootstrap.py                   # First-run setup
│   ├── estimate_cost.py               # Estimate cost before running
│   └── export_database.py             # Export completed database
│
└── docs/
    ├── ARCHITECTURE.md                # System architecture overview
    ├── PROMPTS.md                     # Prompt design documentation
    ├── FIRST_RUN.md                   # Guide to running first generation
    └── CONTRIBUTING.md                # How to contribute
```

---

## The 14 Specific Missing Pieces, In Build Order

### 1. Project Bootstrap and Dependencies

```toml
# pyproject.toml
[project]
name = "universal-knowledge-engine"
version = "0.1.0"
description = "Automated generation of comprehensive programming language and file format knowledge databases"
requires-python = ">=3.11"
dependencies = [
    "aiohttp>=3.9",
    "click>=8.0",
    "pyyaml>=6.0",
    "rich>=13.0",           # For terminal UI and progress bars
    "tiktoken>=0.5",        # Token counting for OpenAI
    "tenacity>=8.0",        # Retry logic
    "pydantic>=2.0",        # Data validation for LLM responses
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0",
    "pytest-asyncio>=0.21",
    "pytest-cov",
    "ruff",                 # Linting
]
vectors = [
    "numpy>=1.24",
    "sentence-transformers>=2.0",  # For embedding generation
]

[project.scripts]
uke = "uke.cli:main"
```

```yaml
# config.yaml
# The actual configuration a user needs to fill in

generation:
  # Which model to use for each task type
  models:
    skeleton:
      provider: "openai"
      model: "gpt-4o-mini"
      max_tokens: 4096
      temperature: 0.1
    expansion:
      provider: "anthropic"
      model: "claude-sonnet-4-20250514"
      max_tokens: 8192
      temperature: 0.1
    validation:
      provider: "openai"
      model: "gpt-4o"
      max_tokens: 4096
      temperature: 0.0
  
  # Execution limits
  max_concurrent_requests: 10
  budget_limit_usd: 50.00
  max_retries: 3
  retry_backoff_base: 2.0
  
  # What to generate
  default_implementation_languages:
    - python
    - javascript

output:
  base_dir: "./output"
  formats:
    - json          # Machine-readable
    - markdown      # Human-readable

observability:
  healing_cycle_hours: 6
  daily_heal_budget_usd: 5.00
  snapshot_interval_hours: 1
  version_check_interval_days: 7
```

```bash
# .env.example
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Optional: for embedding-based semantic search
# SENTENCE_TRANSFORMER_MODEL=all-MiniLM-L6-v2
```

### 2. The Response Parser (Our Most Critical Missing Piece)

This is the piece we've completely ignored, and it's arguably the most important one. LLMs don't return clean JSON. They return JSON wrapped in markdown code fences, JSON with trailing commas, JSON with comments, truncated JSON, JSON mixed with explanatory text, or occasionally something that isn't JSON at all.

```python
# uke/generation/parser.py
"""
The Response Parser.

This is the unglamorous but absolutely critical component that 
takes raw LLM output and turns it into reliable structured data.

LLMs will return:
  - JSON wrapped in ```json ... ``` code fences
  - JSON with trailing commas
  - JSON with // comments
  - Truncated JSON (hit token limit mid-object)
  - Multiple JSON objects in one response
  - JSON mixed with natural language explanation
  - Valid JSON but wrong schema
  - Completely off-topic responses
  
The parser handles ALL of these gracefully.
"""

import json
import re
import logging
from typing import Any, Optional, TypeVar, Type
from pydantic import BaseModel, ValidationError

logger = logging.getLogger(__name__)

T = TypeVar('T', bound=BaseModel)


class ParseError(Exception):
    """Raised when response cannot be parsed after all recovery attempts."""
    def __init__(self, message: str, raw_response: str, partial_result: Any = None):
        super().__init__(message)
        self.raw_response = raw_response
        self.partial_result = partial_result


class ResponseParser:
    """
    Robust parser for LLM responses.
    
    Strategy: try multiple extraction methods in order of preference,
    falling back to progressively more aggressive recovery techniques.
    """
    
    @staticmethod
    def parse_json(raw: str, schema: Type[T] = None) -> dict | list:
        """
        Parse a JSON response from an LLM with extensive error recovery.
        
        Args:
            raw: The raw string response from the LLM
            schema: Optional Pydantic model to validate against
            
        Returns:
            Parsed JSON as dict or list
            
        Raises:
            ParseError: If all parsing strategies fail
        """
        if not raw or not raw.strip():
            raise ParseError("Empty response", raw)
        
        # Strategy 1: Direct JSON parse (best case)
        result = ResponseParser._try_direct_parse(raw)
        if result is not None:
            return ResponseParser._validate(result, schema, raw)
        
        # Strategy 2: Extract from markdown code fences
        result = ResponseParser._try_code_fence_extraction(raw)
        if result is not None:
            return ResponseParser._validate(result, schema, raw)
        
        # Strategy 3: Find JSON object/array boundaries
        result = ResponseParser._try_boundary_extraction(raw)
        if result is not None:
            return ResponseParser._validate(result, schema, raw)
        
        # Strategy 4: Clean common JSON errors and retry
        result = ResponseParser._try_cleaned_parse(raw)
        if result is not None:
            return ResponseParser._validate(result, schema, raw)
        
        # Strategy 5: Attempt to repair truncated JSON
        result = ResponseParser._try_truncation_repair(raw)
        if result is not None:
            logger.warning("Response was truncated — parsed partial result")
            return ResponseParser._validate(result, schema, raw)
        
        # All strategies failed
        raise ParseError(
            f"Could not parse JSON from response. "
            f"First 200 chars: {raw[:200]}",
            raw
        )
    
    @staticmethod
    def _try_direct_parse(raw: str) -> Optional[Any]:
        try:
            return json.loads(raw.strip())
        except json.JSONDecodeError:
            return None
    
    @staticmethod
    def _try_code_fence_extraction(raw: str) -> Optional[Any]:
        """Extract JSON from ```json ... ``` or ``` ... ``` blocks."""
        patterns = [
            r'```json\s*\n(.*?)\n\s*```',   # ```json ... ```
            r'```\s*\n(.*?)\n\s*```',         # ``` ... ```
            r'```json\s*(.*?)\s*```',          # Without newlines
            r'```(.*?)```',                     # Bare fences
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, raw, re.DOTALL)
            for match in matches:
                try:
                    return json.loads(match.strip())
                except json.JSONDecodeError:
                    continue
        
        return None
    
    @staticmethod
    def _try_boundary_extraction(raw: str) -> Optional[Any]:
        """Find the outermost { } or [ ] boundaries and parse."""
        # Find first { or [
        for i, char in enumerate(raw):
            if char == '{':
                # Find matching closing brace
                depth = 0
                in_string = False
                escape_next = False
                for j in range(i, len(raw)):
                    if escape_next:
                        escape_next = False
                        continue
                    c = raw[j]
                    if c == '\\' and in_string:
                        escape_next = True
                        continue
                    if c == '"' and not escape_next:
                        in_string = not in_string
                    if not in_string:
                        if c == '{':
                            depth += 1
                        elif c == '}':
                            depth -= 1
                            if depth == 0:
                                try:
                                    return json.loads(raw[i:j+1])
                                except json.JSONDecodeError:
                                    break
                break
            elif char == '[':
                # Same logic for arrays
                depth = 0
                in_string = False
                escape_next = False
                for j in range(i, len(raw)):
                    if escape_next:
                        escape_next = False
                        continue
                    c = raw[j]
                    if c == '\\' and in_string:
                        escape_next = True
                        continue
                    if c == '"' and not escape_next:
                        in_string = not in_string
                    if not in_string:
                        if c == '[':
                            depth += 1
                        elif c == ']':
                            depth -= 1
                            if depth == 0:
                                try:
                                    return json.loads(raw[i:j+1])
                                except json.JSONDecodeError:
                                    break
                break
        
        return None
    
    @staticmethod
    def _try_cleaned_parse(raw: str) -> Optional[Any]:
        """Fix common JSON formatting errors from LLMs."""
        cleaned = raw.strip()
        
        # Remove code fences if present
        cleaned = re.sub(r'^```(?:json)?\s*', '', cleaned)
        cleaned = re.sub(r'\s*```$', '', cleaned)
        
        # Remove trailing commas before } or ]
        cleaned = re.sub(r',\s*([}\]])', r'\1', cleaned)
        
        # Remove // comments
        cleaned = re.sub(r'//[^\n]*\n', '\n', cleaned)
        
        # Remove /* */ comments
        cleaned = re.sub(r'/\*.*?\*/', '', cleaned, flags=re.DOTALL)
        
        # Fix single quotes to double quotes (crude but works for simple cases)
        # Only do this if there are no double quotes (to avoid breaking strings)
        if '"' not in cleaned and "'" in cleaned:
            cleaned = cleaned.replace("'", '"')
        
        # Remove any leading/trailing text that isn't JSON
        match = re.search(r'[{\[]', cleaned)
        if match:
            cleaned = cleaned[match.start():]
            # Find last } or ]
            for i in range(len(cleaned) - 1, -1, -1):
                if cleaned[i] in '}]':
                    cleaned = cleaned[:i+1]
                    break
        
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            return None
    
    @staticmethod
    def _try_truncation_repair(raw: str) -> Optional[Any]:
        """
        If JSON was truncated mid-response, try to close all open brackets.
        This gives us PARTIAL data which is better than nothing.
        """
        cleaned = raw.strip()
        
        # Remove code fences
        cleaned = re.sub(r'^```(?:json)?\s*', '', cleaned)
        cleaned = re.sub(r',\s*$', '', cleaned)  # Remove trailing comma
        
        # Count open brackets
        open_braces = cleaned.count('{') - cleaned.count('}')
        open_brackets = cleaned.count('[') - cleaned.count(']')
        
        if open_braces <= 0 and open_brackets <= 0:
            return None  # Not a truncation issue
        
        # Check if we're inside a string (crude check)
        in_string = False
        for c in cleaned:
            if c == '"':
                in_string = not in_string
        
        # Close open string if needed
        if in_string:
            cleaned += '"'
        
        # Remove any trailing partial key-value pair
        # e.g., '..."key": ' or '..."key": "val'
        cleaned = re.sub(r',\s*"[^"]*":\s*$', '', cleaned)
        cleaned = re.sub(r',\s*"[^"]*":\s*"[^"]*$', '', cleaned)
        cleaned = re.sub(r',\s*$', '', cleaned)
        
        # Close brackets
        repaired = cleaned + (']' * open_brackets) + ('}' * open_braces)
        
        try:
            result = json.loads(repaired)
            return result
        except json.JSONDecodeError:
            # Try more aggressive repair: close at each level
            for attempt in range(min(open_braces + open_brackets, 10)):
                repaired = cleaned
                # Remove last incomplete element
                repaired = re.sub(r',?\s*"[^"]*"\s*:\s*\{[^}]*$', '', repaired)
                repaired = re.sub(r',?\s*"[^"]*"\s*:\s*\[[^\]]*$', '', repaired)
                repaired = re.sub(r',?\s*$', '', repaired)
                
                remaining_braces = repaired.count('{') - repaired.count('}')
                remaining_brackets = repaired.count('[') - repaired.count(']')
                
                repaired += (']' * max(remaining_brackets, 0))
                repaired += ('}' * max(remaining_braces, 0))
                
                try:
                    return json.loads(repaired)
                except json.JSONDecodeError:
                    # Remove more content and try again
                    last_comma = cleaned.rfind(',')
                    if last_comma > 0:
                        cleaned = cleaned[:last_comma]
                    else:
                        break
            
            return None
    
    @staticmethod
    def _validate(result: Any, schema: Type[T], raw: str) -> Any:
        """Validate parsed result against schema if provided."""
        if schema is None:
            return result
        
        try:
            validated = schema.model_validate(result)
            return validated.model_dump()
        except ValidationError as e:
            logger.warning(
                f"Schema validation failed: {e.error_count()} errors. "
                f"Returning unvalidated result."
            )
            # Return unvalidated rather than failing — partial data is valuable
            return result


class TokenEstimator:
    """
    Estimate token counts for prompts to manage budgets.
    Uses tiktoken for OpenAI models, rough heuristics for others.
    """
    
    def __init__(self):
        self._encoder = None
    
    def _get_encoder(self):
        if self._encoder is None:
            try:
                import tiktoken
                self._encoder = tiktoken.encoding_for_model("gpt-4o")
            except ImportError:
                self._encoder = "fallback"
        return self._encoder
    
    def estimate_tokens(self, text: str) -> int:
        encoder = self._get_encoder()
        if encoder == "fallback":
            # Rough heuristic: ~1.3 tokens per word for English
            return int(len(text.split()) * 1.3)
        return len(encoder.encode(text))
    
    def estimate_cost(self, input_text: str, estimated_output_tokens: int,
                      cost_per_1k_input: float, cost_per_1k_output: float) -> float:
        input_tokens = self.estimate_tokens(input_text)
        return (
            (input_tokens / 1000 * cost_per_1k_input) +
            (estimated_output_tokens / 1000 * cost_per_1k_output)
        )
```

### 3. The CLI Entry Point

```python
# uke/cli.py
"""
Command-line interface — the actual commands a user runs.

Usage:
    uke generate python --version 3.12
    uke generate png --type filetype
    uke status
    uke dashboard
    uke query python "how to implement async generators"
    uke validate python
    uke heal --budget 5.00
    uke export python --format markdown
    uke cost-estimate rust --version 1.78
"""

import asyncio
import os
import sys
import logging
from pathlib import Path

import click
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn
from rich.table import Table
from rich.panel import Panel

from uke.config import load_config, Config
from uke.core.store import UniversalKnowledgeStore
from uke.core.schema import KnowledgeNode

console = Console()


@click.group()
@click.option('--config', default='config.yaml', help='Config file path')
@click.option('--db', default=None, help='Database path (default: knowledge_base/)')
@click.option('--verbose', '-v', is_flag=True)
@click.pass_context
def cli(ctx, config, db, verbose):
    """Universal Knowledge Engine — Generate comprehensive knowledge databases."""
    logging.basicConfig(
        level=logging.DEBUG if verbose else logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[
            logging.FileHandler("uke.log"),
            logging.StreamHandler() if verbose else logging.NullHandler()
        ]
    )
    
    ctx.ensure_object(dict)
    ctx.obj['config'] = load_config(config)
    ctx.obj['db_path'] = db or 'knowledge_base'


@cli.command()
@click.argument('target')
@click.option('--version', default='latest', help='Target version')
@click.option('--type', 'target_type', 
              type=click.Choice(['language', 'filetype', 'software']),
              default='language')
@click.option('--budget', type=float, default=None, help='Budget limit in USD')
@click.option('--concurrent', type=int, default=None)
@click.option('--dry-run', is_flag=True, help='Plan tasks without executing')
@click.option('--resume', is_flag=True, help='Resume from previous run')
@click.option('--sections', multiple=True, help='Only generate specific sections')
@click.pass_context
def generate(ctx, target, version, target_type, budget, concurrent, 
             dry_run, resume, sections):
    """Generate a knowledge database for a target.
    
    Examples:
        uke generate python --version 3.12
        uke generate png --type filetype
        uke generate photoshop --type software --budget 100
    """
    config = ctx.obj['config']
    
    if budget:
        config.generation.budget_limit_usd = budget
    if concurrent:
        config.generation.max_concurrent_requests = concurrent
    
    # Validate API keys are present
    missing_keys = _check_api_keys(config)
    if missing_keys:
        console.print(f"[red]Missing API keys: {', '.join(missing_keys)}[/red]")
        console.print("Set them in your .env file or environment variables.")
        sys.exit(1)
    
    if dry_run:
        asyncio.run(_dry_run(config, ctx.obj['db_path'], 
                             target, version, target_type))
    else:
        asyncio.run(_run_generation(config, ctx.obj['db_path'],
                                     target, version, target_type, resume))


@cli.command()
@click.pass_context
def status(ctx):
    """Show current database status and statistics."""
    store = UniversalKnowledgeStore(ctx.obj['db_path'])
    stats = store.get_statistics()
    
    table = Table(title="Knowledge Base Status")
    table.add_column("Metric", style="cyan")
    table.add_column("Value", style="green")
    
    for key, value in stats.items():
        if isinstance(value, dict):
            table.add_row(key, json.dumps(value, indent=2))
        else:
            table.add_row(key, str(value))
    
    console.print(table)


@cli.command()
@click.pass_context
def dashboard(ctx):
    """Show the vitality dashboard."""
    store = UniversalKnowledgeStore(ctx.obj['db_path'])
    # Initialize observability components and render dashboard
    console.print("[yellow]Dashboard requires generated data. Run 'uke generate' first.[/yellow]")


@cli.command('cost-estimate')
@click.argument('target')
@click.option('--version', default='latest')
@click.option('--type', 'target_type',
              type=click.Choice(['language', 'filetype', 'software']),
              default='language')
@click.pass_context
def cost_estimate(ctx, target, version, target_type):
    """Estimate the cost of generating a target before running."""
    asyncio.run(_estimate_cost(ctx.obj['config'], target, version, target_type))


async def _dry_run(config, db_path, target, version, target_type):
    """Show what would be generated without making API calls."""
    console.print(Panel(
        f"[bold]Dry Run: {target} {version}[/bold]\n"
        f"Type: {target_type}\n"
        f"Budget: ${config.generation.budget_limit_usd:.2f}\n"
        f"Concurrent: {config.generation.max_concurrent_requests}",
        title="Generation Plan"
    ))
    
    # Show planned phases and estimated task counts
    from uke.generation.planner import GuidebookPlanner
    
    # Estimate tasks without executing
    estimates = {
        "Phase 1 — Skeleton Discovery": "~3-5 API calls",
        "Phase 2 — Deep Expansion": "~100-300 API calls (depends on capabilities found)",
        "Phase 3 — Cross-Reference Validation": "~10-20 API calls",
        "Phase 4 — Gap Filling": "~20-50 API calls (depends on gaps found)",
        "Phase 5 — Integration Blueprints": "~5-10 API calls",
    }
    
    table = Table(title="Estimated Execution Plan")
    table.add_column("Phase", style="cyan")
    table.add_column("Estimated API Calls", style="yellow")
    
    for phase, est in estimates.items():
        table.add_row(phase, est)
    
    console.print(table)
    
    console.print(f"\n[green]Estimated total cost: $15-40 (language) / $5-15 (filetype)[/green]")
    console.print("[dim]Run without --dry-run to execute[/dim]")


async def _run_generation(config, db_path, target, version, target_type, resume):
    """Actually run the generation pipeline."""
    store = UniversalKnowledgeStore(db_path)
    
    # Build API engine from config
    from uke.generation.api import MultiProviderAPIEngine, APIConfig
    
    api_configs = _build_api_configs(config)
    
    async with MultiProviderAPIEngine(api_configs) as api:
        from uke.generation.planner import GuidebookPlanner
        from uke.generation.executor import GuidebookExecutor
        
        planner = GuidebookPlanner(store, api)
        executor = GuidebookExecutor(
            db=store, api=api, planner=planner,
            max_concurrent=config.generation.max_concurrent_requests,
            budget_limit=config.generation.budget_limit_usd
        )
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
            console=console
        ) as progress:
            task = progress.add_task(
                f"Generating {target} {version}...", 
                total=100
            )
            
            await executor.execute_full_generation(
                language=target,
                version=version,
                target_type=target_type,
                progress_callback=lambda pct: progress.update(task, completed=pct)
            )
        
        # Print summary
        stats = store.get_statistics()
        console.print(Panel(
            f"[green bold]Generation Complete![/green bold]\n\n"
            f"Nodes created: {stats.get('total_nodes', 'N/A')}\n"
            f"Total cost: ${api.total_cost:.2f}\n"
            f"Output: {db_path}/",
            title="Results"
        ))


def _check_api_keys(config) -> list[str]:
    """Check that required API keys are present."""
    missing = []
    if not os.environ.get("OPENAI_API_KEY"):
        missing.append("OPENAI_API_KEY")
    if not os.environ.get("ANTHROPIC_API_KEY"):
        missing.append("ANTHROPIC_API_KEY")
    return missing


def _build_api_configs(config) -> list:
    """Build API configurations from config and environment."""
    from uke.generation.api import APIConfig
    
    configs = []
    
    openai_key = os.environ.get("OPENAI_API_KEY")
    if openai_key:
        configs.append(APIConfig(
            provider="openai",
            base_url="https://api.openai.com/v1",
            api_key=openai_key,
            model=config.generation.models.skeleton.model,
            requests_per_minute=500,
            tokens_per_minute=150000,
        ))
    
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
    if anthropic_key:
        configs.append(APIConfig(
            provider="anthropic",
            base_url="https://api.anthropic.com/v1",
            api_key=anthropic_key,
            model=config.generation.models.expansion.model,
            requests_per_minute=50,
            tokens_per_minute=80000,
        ))
    
    return configs


async def _estimate_cost(config, target, version, target_type):
    """Estimate generation cost without making API calls."""
    from uke.generation.parser import TokenEstimator
    from uke.generation.prompts import GenerativePromptTemplates
    
    estimator = TokenEstimator()
    prompts = GenerativePromptTemplates()
    
    # Estimate skeleton phase
    skeleton_prompt = prompts.discover_capabilities(target, target_type)
    skeleton_tokens = estimator.estimate_tokens(skeleton_prompt)
    
    estimates = {
        "language": {
            "skeleton_calls": 5,
            "avg_capabilities": 150,
            "expansion_calls_per_cap": 2,
            "validation_calls": 20,
            "gap_fill_pct": 0.15,
            "blueprint_calls": 7
        },
        "filetype": {
            "skeleton_calls": 3,
            "avg_capabilities": 80,
            "expansion_calls_per_cap": 2,
            "validation_calls": 10,
            "gap_fill_pct": 0.10,
            "blueprint_calls": 5
        },
        "software": {
            "skeleton_calls": 5,
            "avg_capabilities": 250,
            "expansion_calls_per_cap": 2,
            "validation_calls": 25,
            "gap_fill_pct": 0.20,
            "blueprint_calls": 10
        }
    }
    
    est = estimates.get(target_type, estimates["language"])
    
    total_calls = (
        est["skeleton_calls"] +
        est["avg_capabilities"] * est["expansion_calls_per_cap"] +
        est["validation_calls"] +
        int(est["avg_capabilities"] * est["gap_fill_pct"]) +
        est["blueprint_calls"]
    )
    
    # Rough cost: ~$0.05-0.15 per call average
    low_cost = total_calls * 0.05
    high_cost = total_calls * 0.15
    
    table = Table(title=f"Cost Estimate: {target} ({target_type})")
    table.add_column("Phase", style="cyan")
    table.add_column("Est. API Calls", style="yellow")
    table.add_column("Est. Cost", style="green")
    
    table.add_row("Skeleton Discovery", str(est["skeleton_calls"]), 
                   f"${est['skeleton_calls'] * 0.05:.2f}")
    
    exp_calls = est["avg_capabilities"] * est["expansion_calls_per_cap"]
    table.add_row("Deep Expansion", str(exp_calls),
                   f"${exp_calls * 0.10:.2f}")
    
    table.add_row("Validation", str(est["validation_calls"]),
                   f"${est['validation_calls'] * 0.08:.2f}")
    
    gap_calls = int(est["avg_capabilities"] * est["gap_fill_pct"])
    table.add_row("Gap Filling", str(gap_calls),
                   f"${gap_calls * 0.10:.2f}")
    
    table.add_row("Blueprints", str(est["blueprint_calls"]),
                   f"${est['blueprint_calls'] * 0.12:.2f}")
    
    table.add_row("", "", "")
    table.add_row("[bold]TOTAL[/bold]", f"[bold]{total_calls}[/bold]",
                   f"[bold]${low_cost:.2f} - ${high_cost:.2f}[/bold]")
    
    console.print(table)


def main():
    cli(obj={})


if __name__ == "__main__":
    main()
```

### 4. Configuration Management

```python
# uke/config.py
"""
Configuration loading and validation.
Separates secrets (env vars) from settings (config file).
"""

import os
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional
import yaml


@dataclass
class ModelConfig:
    provider: str = "openai"
    model: str = "gpt-4o-mini"
    max_tokens: int = 4096
    temperature: float = 0.1


@dataclass
class GenerationConfig:
    models: 'ModelsConfig' = None
    max_concurrent_requests: int = 10
    budget_limit_usd: float = 50.0
    max_retries: int = 3
    retry_backoff_base: float = 2.0
    default_implementation_languages: list[str] = field(
        default_factory=lambda: ["python"]
    )
    
    def __post_init__(self):
        if self.models is None:
            self.models = ModelsConfig()


@dataclass
class ModelsConfig:
    skeleton: ModelConfig = field(default_factory=lambda: ModelConfig(
        provider="openai", model="gpt-4o-mini", max_tokens=4096, temperature=0.1
    ))
    expansion: ModelConfig = field(default_factory=lambda: ModelConfig(
        provider="anthropic", model="claude-sonnet-4-20250514", max_tokens=8192, temperature=0.1
    ))
    validation: ModelConfig = field(default_factory=lambda: ModelConfig(
        provider="openai", model="gpt-4o", max_tokens=4096, temperature=0.0
    ))


@dataclass
class OutputConfig:
    base_dir: str = "./output"
    formats: list[str] = field(default_factory=lambda: ["json", "markdown"])


@dataclass
class ObservabilityConfig:
    healing_cycle_hours: int = 6
    daily_heal_budget_usd: float = 5.0
    snapshot_interval_hours: int = 1
    version_check_interval_days: int = 7


@dataclass
class Config:
    generation: GenerationConfig = field(default_factory=GenerationConfig)
    output: OutputConfig = field(default_factory=OutputConfig)
    observability: ObservabilityConfig = field(default_factory=ObservabilityConfig)


def load_config(path: str = "config.yaml") -> Config:
    """Load config from YAML file with defaults for missing values."""
    config = Config()
    
    config_path = Path(path)
    if config_path.exists():
        with open(config_path) as f:
            raw = yaml.safe_load(f) or {}
        
        # Apply overrides from file
        if "generation" in raw:
            gen = raw["generation"]
            if "budget_limit_usd" in gen:
                config.generation.budget_limit_usd = gen["budget_limit_usd"]
            if "max_concurrent_requests" in gen:
                config.generation.max_concurrent_requests = gen["max_concurrent_requests"]
            if "models" in gen:
                for role in ("skeleton", "expansion", "validation"):
                    if role in gen["models"]:
                        model_conf = ModelConfig(**gen["models"][role])
                        setattr(config.generation.models, role, model_conf)
        
        if "output" in raw:
            if "base_dir" in raw["output"]:
                config.output.base_dir = raw["output"]["base_dir"]
    
    return config
```

### 5. The First Target: Selection and Success Criteria

This is a decision we need to make, not code we need to write. But it's critical.

```markdown
# FIRST_RUN.md — The First Target Decision

## Candidate First Targets (ranked by suitability for MVP)

### Option A: JSON (Data Format) ← RECOMMENDED FIRST TARGET
Why:
- Simple enough to complete in <100 API calls
- Text-based, easy to validate
- Everyone knows it — easy to verify correctness
- Small capability surface (~40 capabilities)
- No binary encoding complexity
- Estimated cost: $5-10
- Can validate output by actually parsing JSON files

Success criteria:
- Generated database contains ALL JSON value types
- Structural templates can produce valid JSON for each type
- Parsing rules are correct and complete
- Edge cases documented (unicode, large numbers, nesting limits)
- Generated example code actually runs and produces valid JSON

### Option B: Markdown (Markup Language)
Why:
- Simple, well-known
- Text-based
- Multiple flavors (CommonMark, GFM) test versioning
- ~60 capabilities
- Estimated cost: $8-15

### Option C: CSV (Data Format)
Why:
- Extremely simple
- ~20 capabilities
- Cheapest to generate (~$3-5)
- But almost TOO simple — doesn't test the system well

### Option D: Python (Programming Language)
Why:
- Best test of the full language pipeline
- Well-known, easy to verify
- But LARGE — ~200+ capabilities, ~$40-80
- Save for second run after validating pipeline

## Recommendation: Start with JSON, then PNG, then Python

JSON proves the pipeline works.
PNG proves it handles binary formats and algorithms.
Python proves it handles programming languages at scale.
```

### 6. Success Validation Framework

```python
# uke/validation/schema_validator.py
"""
Validates that generated knowledge meets minimum quality standards.

This is how we KNOW the output is good enough to ship.
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class ValidationResult:
    passed: bool
    score: float  # 0.0 to 1.0
    checks: list[dict]  # individual check results
    summary: str


class KnowledgeValidator:
    """
    Validates a generated knowledge database against quality criteria.
    """
    
    def validate_target(self, store: 'UniversalKnowledgeStore', 
                         target_id: str) -> ValidationResult:
        """Run all validation checks for a target."""
        checks = []
        
        # Check 1: Does the target node exist?
        checks.append(self._check_target_exists(store, target_id))
        
        # Check 2: Are there capabilities?
        checks.append(self._check_has_capabilities(store, target_id))
        
        # Check 3: Do capabilities have structural templates?
        checks.append(self._check_structural_coverage(store, target_id))
        
        # Check 4: Do code examples parse/compile?
        checks.append(self._check_code_validity(store, target_id))
        
        # Check 5: Are there no empty content nodes?
        checks.append(self._check_no_empty_nodes(store, target_id))
        
        # Check 6: Is the graph connected?
        checks.append(self._check_graph_connectivity(store, target_id))
        
        # Check 7: Do structural templates have required fields?
        checks.append(self._check_template_completeness(store, target_id))
        
        # Compute overall
        passed_checks = sum(1 for c in checks if c["passed"])
        total_checks = len(checks)
        score = passed_checks / total_checks if total_checks > 0 else 0
        
        passed = score >= 0.7  # 70% of checks must pass
        
        summary_parts = []
        for c in checks:
            status = "✓" if c["passed"] else "✗"
            summary_parts.append(f"  {status} {c['name']}: {c['message']}")
        
        return ValidationResult(
            passed=passed,
            score=score,
            checks=checks,
            summary=f"Validation {'PASSED' if passed else 'FAILED'} "
                    f"({passed_checks}/{total_checks} checks)\n" + 
                    "\n".join(summary_parts)
        )
    
    def _check_target_exists(self, store, target_id) -> dict:
        node = store.get_node(target_id)
        return {
            "name": "Target node exists",
            "passed": node is not None,
            "message": "Found" if node else "Target node not found in database"
        }
    
    def _check_has_capabilities(self, store, target_id) -> dict:
        count = store.db.execute("""
            SELECT COUNT(*) FROM edges 
            WHERE source_id = ? AND relationship = 'contains'
        """, (target_id,)).fetchone()[0]
        
        return {
            "name": "Has capabilities",
            "passed": count >= 5,
            "message": f"{count} capabilities found (minimum: 5)"
        }
    
    def _check_structural_coverage(self, store, target_id) -> dict:
        target_key = target_id.split(":")[-1]
        structures = store.db.execute("""
            SELECT COUNT(*) FROM nodes 
            WHERE node_type = 'structure' 
              AND canonical_id LIKE ?
        """, (f"%{target_key}%",)).fetchone()[0]
        
        return {
            "name": "Structural templates exist",
            "passed": structures >= 3,
            "message": f"{structures} structural templates found"
        }
    
    def _check_code_validity(self, store, target_id) -> dict:
        # Check that code in implementations is at least syntactically valid
        target_key = target_id.split(":")[-1]
        nodes = store.db.execute("""
            SELECT canonical_id, content FROM nodes
            WHERE node_type = 'algorithm'
              AND canonical_id LIKE ?
        """, (f"%{target_key}%",)).fetchall()
        
        valid = 0
        invalid = 0
        
        for node_id, content_json in nodes:
            import json
            try:
                content = json.loads(content_json) if isinstance(content_json, str) else content_json
                implementations = content.get("implementations", {})
                
                for lang, impl in implementations.items():
                    code = impl.get("code", "") if isinstance(impl, dict) else ""
                    if code and lang == "python":
                        try:
                            compile(code, f"<{node_id}>", "exec")
                            valid += 1
                        except SyntaxError:
                            invalid += 1
            except (json.JSONDecodeError, AttributeError):
                continue
        
        total = valid + invalid
        return {
            "name": "Code examples are syntactically valid",
            "passed": invalid == 0 or (valid / max(total, 1) >= 0.8),
            "message": f"{valid}/{total} valid ({invalid} syntax errors)"
        }
    
    def _check_no_empty_nodes(self, store, target_id) -> dict:
        target_key = target_id.split(":")[-1]
        empty = store.db.execute("""
            SELECT COUNT(*) FROM nodes
            WHERE canonical_id LIKE ?
              AND (LENGTH(content) < 20 OR content = '{}')
        """, (f"%{target_key}%",)).fetchone()[0]
        
        total = store.db.execute("""
            SELECT COUNT(*) FROM nodes WHERE canonical_id LIKE ?
        """, (f"%{target_key}%",)).fetchone()[0]
        
        return {
            "name": "No empty content nodes",
            "passed": empty == 0,
            "message": f"{empty}/{total} nodes have empty content"
        }
    
    def _check_graph_connectivity(self, store, target_id) -> dict:
        target_key = target_id.split(":")[-1]
        
        total_nodes = store.db.execute("""
            SELECT COUNT(*) FROM nodes WHERE canonical_id LIKE ?
        """, (f"%{target_key}%",)).fetchone()[0]
        
        connected = store.db.execute("""
            SELECT COUNT(DISTINCT n.canonical_id) FROM nodes n
            WHERE n.canonical_id LIKE ?
              AND (
                  EXISTS (SELECT 1 FROM edges e WHERE e.source_id = n.canonical_id)
                  OR EXISTS (SELECT 1 FROM edges e WHERE e.target_id = n.canonical_id)
              )
        """, (f"%{target_key}%",)).fetchone()[0]
        
        orphan_pct = ((total_nodes - connected) / max(total_nodes, 1)) * 100
        
        return {
            "name": "Graph connectivity",
            "passed": orphan_pct < 10,
            "message": f"{connected}/{total_nodes} connected ({orphan_pct:.1f}% orphans)"
        }
    
    def _check_template_completeness(self, store, target_id) -> dict:
        target_key = target_id.split(":")[-1]
        
        import json
        
        structures = store.db.execute("""
            SELECT canonical_id, content FROM nodes
            WHERE node_type = 'structure' AND canonical_id LIKE ?
        """, (f"%{target_key}%",)).fetchall()
        
        complete = 0
        incomplete = 0
        
        required_fields = {"template", "variables"}
        
        for node_id, content_json in structures:
            try:
                content = json.loads(content_json) if isinstance(content_json, str) else content_json
                present = set(content.keys()) & required_fields
                if len(present) >= len(required_fields):
                    complete += 1
                else:
                    incomplete += 1
            except (json.JSONDecodeError, AttributeError):
                incomplete += 1
        
        total = complete + incomplete
        return {
            "name": "Structural template completeness",
            "passed": incomplete == 0 or (complete / max(total, 1) >= 0.8),
            "message": f"{complete}/{total} templates have required fields"
        }
```

### 7. The Recovery and Resumption System

```python
# Part of uke/generation/executor.py

class CheckpointManager:
    """
    Manages generation checkpoints so we can resume after crashes.
    
    Every completed task is persisted immediately.
    On resume, we skip already-completed tasks and pick up where we left off.
    """
    
    def __init__(self, store: 'UniversalKnowledgeStore'):
        self.store = store
        self._init_checkpoint_table()
    
    def _init_checkpoint_table(self):
        self.store.db.executescript("""
            CREATE TABLE IF NOT EXISTS generation_checkpoints (
                run_id          TEXT,
                target_id       TEXT,
                phase           TEXT,
                task_id         TEXT PRIMARY KEY,
                status          TEXT DEFAULT 'pending',
                result_node_id  TEXT,
                error           TEXT,
                started_at      TEXT,
                completed_at    TEXT,
                token_cost      INTEGER DEFAULT 0,
                api_cost_usd    REAL DEFAULT 0
            );
            
            CREATE INDEX IF NOT EXISTS idx_checkpoint_run 
                ON generation_checkpoints(run_id, status);
        """)
        self.store.db.commit()
    
    def get_completed_tasks(self, run_id: str) -> set[str]:
        """Get all task IDs that completed in a previous run."""
        rows = self.store.db.execute("""
            SELECT task_id FROM generation_checkpoints
            WHERE run_id = ? AND status = 'completed'
        """, (run_id,)).fetchall()
        return {r[0] for r in rows}
    
    def mark_started(self, run_id: str, task_id: str):
        self.store.db.execute("""
            INSERT OR REPLACE INTO generation_checkpoints
                (run_id, task_id, status, started_at)
            VALUES (?, ?, 'running', datetime('now'))
        """, (run_id, task_id))
        self.store.db.commit()
    
    def mark_completed(self, run_id: str, task_id: str, 
                        result_node_id: str, token_cost: int, 
                        api_cost: float):
        self.store.db.execute("""
            UPDATE generation_checkpoints
            SET status = 'completed', 
                result_node_id = ?,
                token_cost = ?,
                api_cost_usd = ?,
                completed_at = datetime('now')
            WHERE run_id = ? AND task_id = ?
        """, (result_node_id, token_cost, api_cost, run_id, task_id))
        self.store.db.commit()
    
    def mark_failed(self, run_id: str, task_id: str, error: str):
        self.store.db.execute("""
            UPDATE generation_checkpoints
            SET status = 'failed', error = ?, completed_at = datetime('now')
            WHERE run_id = ? AND task_id = ?
        """, (error, run_id, task_id))
        self.store.db.commit()
    
    def get_run_summary(self, run_id: str) -> dict:
        """Get summary of a generation run."""
        stats = self.store.db.execute("""
            SELECT 
                status, COUNT(*),
                SUM(token_cost), SUM(api_cost_usd)
            FROM generation_checkpoints
            WHERE run_id = ?
            GROUP BY status
        """, (run_id,)).fetchall()
        
        return {
            row[0]: {
                "count": row[1],
                "tokens": row[2] or 0,
                "cost": round(row[3] or 0, 4)
            }
            for row in stats
        }
```

---

## The Build Plan: What to Do in What Order

```
WEEK 1: Foundation (Get something running)
═══════════════════════════════════════════

Day 1-2: Project scaffolding
  □ Create project structure
  □ Set up pyproject.toml with dependencies
  □ Create config.yaml and .env.example
  □ Write Config dataclass and loader
  □ Write the CLI skeleton (click commands, no logic yet)
  □ Verify: `pip install -e .` works, `uke --help` shows commands

Day 3-4: Core storage and schema
  □ Implement KnowledgeNode and KnowledgeEdge
  □ Implement UniversalKnowledgeStore (SQLite)
  □ Write tests for CRUD operations
  □ Write tests for graph traversal (get_neighbors, get_subgraph)
  □ Verify: Can create, query, and traverse a small test graph

Day 5: API client
  □ Implement MultiProviderAPIEngine (start with OpenAI only)
  □ Implement rate limiter
  □ Implement cost tracker
  □ Test with one real API call
  □ Verify: Can make an API call and get structured response

Day 6-7: Response parser
  □ Implement ResponseParser with all recovery strategies
  □ Create test fixtures: save 20+ real LLM responses
  □ Write tests for each parsing strategy
  □ Test with truncated, malformed, code-fenced responses
  □ Verify: Parser handles every format LLMs actually produce


WEEK 2: First Generation (Prove the pipeline)
═══════════════════════════════════════════════

Day 8-9: Prompts and planning
  □ Write skeleton discovery prompt for JSON format
  □ Write expansion prompt for JSON capabilities
  □ Write cross-reference validation prompt
  □ Run each prompt MANUALLY (copy/paste to ChatGPT)
  □ Save actual responses as test fixtures
  □ Iterate on prompts until responses are consistently good
  □ Verify: Prompts produce well-structured, accurate responses

Day 10-11: Executor
  □ Implement CheckpointManager
  □ Implement task execution loop
  □ Wire up: prompt → API call → parse → store
  □ Handle errors, retries, budget limits
  □ Verify: Can execute 5 tasks in sequence and store results

Day 12-13: First complete generation
  □ Run full pipeline for JSON format
  □ Debug everything that breaks (there will be many things)
  □ Examine output quality
  □ Run validation checks
  □ Fix prompts based on actual output
  □ Re-run until output quality meets criteria
  □ Verify: Complete JSON knowledge database exists and passes validation

Day 14: Review and document
  □ Document what worked and what didn't
  □ Record actual costs
  □ Record actual token usage per prompt type
  □ Identify the top 5 issues to fix
  □ Write FIRST_RUN.md with real numbers
  □ Commit and tag v0.1.0


WEEK 3: Second Target and Refinement
═══════════════════════════════════════

Day 15-17: Generate PNG (first file format with algorithms)
  □ Adapt prompts for binary file format
  □ Add algorithm extraction prompts
  □ Run generation
  □ Validate generated code actually creates valid PNG files
  □ Debug and iterate

Day 18-19: Add Anthropic provider
  □ Implement Anthropic API client
  □ Test model routing (skeleton → cheap, expansion → strong)
  □ Compare output quality between providers
  □ Update cost estimates with real data

Day 20-21: Deduplication
  □ Implement basic dedup (exact match, then fuzzy)
  □ Test with overlapping concepts between JSON and PNG
  □ Verify shared algorithms are stored once, linked twice
```

---

## The Single Most Important Next Step

Everything above is the complete map. But if I had to pick the **one thing** to do first that would unlock everything else, it's this:

**Run one prompt manually. Right now.**

Take the `discover_capabilities` prompt template, fill it in for JSON, paste it into Claude or ChatGPT, and look at what comes back. Then take one capability from that response, fill in the `extract_structural_template` prompt, and run that. Then take one more capability and run `extract_algorithm`.

Three manual prompts. Twenty minutes. Zero code.

What you'll learn:

- Whether the prompts actually produce useful, structured output
- What the real response format looks like (so you can build the parser)
- What the real token count is (so you can estimate costs)
- Where the prompts need refinement (before building the pipeline around them)
- Whether the three-layer model (discover → extract → integrate) actually works

Every architecture decision we've made assumes the prompts work. **Validate that assumption before writing another line of infrastructure.**

That's what's missing. And that's where we start.

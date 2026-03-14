The original plan assumed a greenfield Python project. The reality:
- ✅ **Database schema is complete** — Full Prisma schema with 20+ tables in `prisma/schema.prisma`
- ✅ **PostgreSQL database is running** — Google Cloud SQL with pgvector extension enabled
- ✅ **Initial migration created** — `20260313025407_init` migration ready to apply
- ✅ **Cloud SQL Proxy configured** — Secure connection via proxy tool (port 5433)
- ✅ **Master documentation comprehensive** — ~14 files in `docs/MASTER-DOCS_only-use-these/`
- ✅ **Project structure exists** — TypeScript/Bun-based with Prisma client
- ✅ **Z.ai SDK setup documented** — API key configured in `zai-setup.md`

# magB POC Build Plan

## The Simplest True Statement About Where We Are

We have 274 atomic tasks across 8 workstreams. That is the map. But a map is not a route. A route requires decisions: what order, what parallelism, what can we cut if time runs short, what must we prove first before building more.

This build plan is the route.

---

## Governing Principles

```
1. PROVE THE UNKNOWN FIRST
   The riskiest thing is whether LLM prompts produce usable output.
   We hit a real API call by Day 5, not Day 25.

2. ALWAYS HAVE SOMETHING THAT RUNS
   Every week ends with a working thing, not a partially-built thing.
   Week 1: store works. Week 2: LLM calls work. Week 3: generation works.

3. VERTICAL SLICES OVER HORIZONTAL LAYERS
   Don't build all of the backend, then all of the frontend.
   Build one narrow path end-to-end, then widen.

4. THE DATABASE IS THE PRODUCT
   If the generated knowledge is wrong, nothing else matters.
   Quality of generation output > quantity of features.

5. CUT SCOPE, NOT CORNERS
   If behind schedule, drop PNG (second target), not testing.
   Drop the health dashboard, not the bundle endpoint.
```

---

## Phase Structure

```
PHASE 0: ZERO TO FIRST API CALL             Days 1-5     (1 week)
         "Can we talk to Zen AI and get structured JSON back?"

PHASE 1: ZERO TO FIRST GENERATED DATABASE   Days 6-16    (2 weeks)
         "Can we generate a complete knowledge base for JSON?"

PHASE 2: ZERO TO FIRST API RESPONSE         Days 17-23   (1 week)
         "Can we serve generated knowledge through an API?"

PHASE 3: ZERO TO FIRST USER EXPERIENCE      Days 24-33   (2 weeks)
         "Can a developer browse and use the knowledge?"

PHASE 4: PROOF OF LIFE                      Days 34-42   (2 weeks)
         "Does the generated code actually work?"
         Second target, validation, observability.

PHASE 5: SHIP IT                            Days 43-48   (1 week)
         Docker, documentation, demo.

                                             ───────────
                                             48 working days
                                             ~10 calendar weeks
```

---

## PHASE 0: ZERO TO FIRST API CALL
*Days 1-5 · End state: We can ask Zen AI a question and parse the answer*

This phase is about removing the single biggest risk immediately. Before we build any infrastructure, we need to know that our prompts work, our parser handles real output, and Zen AI's SDK integrates cleanly.

### Day 1: Project Skeleton

**Morning: Repository and structure**

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 1 | Create monorepo: `magb-poc/backend/`, `magb-poc/frontend/`, `magb-poc/docs/`, `magb-poc/scripts/` | 20m | — |
| 2 | Create `backend/pyproject.toml` with all dependencies (fastapi, uvicorn, pydantic, aiohttp, pyyaml, rich, tenacity, click) | 15m | 1 |
| 3 | Create backend Python package structure: `src/magb/` with all subpackages (`core/`, `generation/`, `validation/`, `observability/`, `api/`, `output/`) — all `__init__.py` files, empty modules | 30m | 2 |
| 4 | `pip install -e ".[dev]"` — verify import: `from magb.core.schema import *` | 10m | 3 |
| 5 | Create frontend with `pnpm create next-app` (App Router, TypeScript, Tailwind, src/) | 10m | 1 |
| 6 | Install frontend deps: `@tanstack/react-query`, `zustand`, `@radix-ui/react-tabs`, `@radix-ui/react-dialog`, `@radix-ui/react-tooltip` | 10m | 5 |
| 7 | Create frontend directory structure: `src/app/` routes, `src/components/`, `src/hooks/`, `src/lib/`, `src/stores/`, `src/types/` | 20m | 6 |
| 8 | Verify `pnpm dev` shows Next.js page | 5m | 7 |

**Afternoon: Configuration**

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 9 | Create `backend/config.yaml` with all POC settings (llm, generation, storage, api, observability sections) | 20m | 3 |
| 10 | Create `.env.example` with `ZEN_API_KEY=` | 5m | 1 |
| 11 | Implement `magb/config.py`: Pydantic dataclasses for LLMConfig, GenerationConfig, StorageConfig, APIConfig, ObservabilityConfig | 45m | 4 |
| 12 | Implement `load_config(path)` function with YAML loading and env var override | 30m | 11 |
| 13 | Write `test_config.py` — config loads, defaults apply, env vars override | 20m | 12 |
| 14 | Create `Makefile` with targets: install, dev-backend, dev-frontend, test, lint, generate | 20m | 4, 8 |

**Day 1 Exit Criteria:** Both projects install and run. Config loads. `make test` runs (1 test passes).

---

### Day 2: Core Schema + Store Foundation

**Morning: Knowledge entities**

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 15 | Implement all enums in `core/schema.py`: TargetKind (21 values), ConceptDomain (18), RelationshipType (18+), Complexity (5), Confidence (5), DecayModel (5 with HALF_LIFE_DAYS dict) | 60m | 4 |
| 16 | Implement `KnowledgeNode` class: constructor, `_compute_hash()` (SHA-256), `to_dict()`, `generate_id()` static method | 45m | 15 |
| 17 | Implement `KnowledgeEdge` class: constructor, `_compute_id()`, `to_dict()` | 20m | 15 |
| 18 | Write `test_schema.py`: ID generation determinism, hash change detection, hash stability, to_dict roundtrip, edge ID determinism | 30m | 16, 17 |

**Afternoon: SQLite store**

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 19 | Implement `UniversalKnowledgeStore.__init__()` and `_init_schema()`: all tables (nodes, edges, generation_runs, validations), all indices, WAL mode, foreign keys | 60m | 16, 17 |
| 20 | Implement `upsert_node()`: INSERT OR REPLACE, content_hash change detection, return bool | 30m | 19 |
| 21 | Implement `get_node()`, `get_nodes_by_type()`, `get_nodes_by_tag()` | 30m | 19 |
| 22 | Implement `add_edge()` | 15m | 19 |
| 23 | Implement `_row_to_node_dict()` helper | 15m | 19 |
| 24 | Write `conftest.py` fixtures: `tmp_db`, `store`, `sample_nodes`, `sample_edges` | 30m | 19 |
| 25 | Write `test_store.py` part 1: upsert creates, upsert detects no-change, upsert detects change, get_node found, get_node missing, get_nodes_by_type | 30m | 20-24 |

**Day 2 Exit Criteria:** Can create, store, and retrieve knowledge nodes. 10+ tests pass.

---

### Day 3: Store Graph Operations + First LLM Setup

**Morning: Graph traversal**

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 26 | Implement `get_neighbors(node_id, relationship, direction)` with outgoing/incoming/both support | 45m | 22 |
| 27 | Implement `get_subgraph(root_id, depth, relationship_filter)` — BFS traversal | 45m | 26 |
| 28 | Implement `find_path(from_id, to_id, max_depth)` — BFS pathfinding | 30m | 26 |
| 29 | Implement FTS5 full-text search: create virtual table in schema, implement `search_text(query, limit)` | 30m | 19 |
| 30 | Implement `get_statistics()` | 15m | 19 |
| 31 | Write `test_store.py` part 2: neighbors outgoing, neighbors incoming, neighbors filtered, subgraph depth 1/2, find_path direct/2-hop, search_text by name/content, statistics | 45m | 26-30 |

**Afternoon: Zen AI SDK integration**

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 32 | Research Zen AI SDK: exact import path, call pattern, response format, supported models, token counting, streaming support. Document findings in `docs/ZEN_AI_SDK.md` | 60m | 10 |
| 33 | Implement `ZenAIClient.__init__(config)`: initialize SDK with API key, set default model | 30m | 32, 12 |
| 34 | Implement `ZenAIClient.call(prompt, system_prompt, temperature, max_tokens, response_format)` — wrap SDK call in standard interface, return `{content, tokens, cost}` | 45m | 33 |
| 35 | **FIRST REAL API CALL:** Test with simple prompt: `"List the 5 primary data types in JSON. Respond as JSON: {types: [...]}"` — verify response, record token usage | 15m | 34 |

**Day 3 Exit Criteria:** Graph traversal works. Can make a real LLM API call and get JSON back. ~20 tests pass.

---

### Day 4: LLM Engine Complete

**Morning: Robustness**

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 36 | Implement rate limiter in ZenAIClient: token bucket, `async acquire(estimated_tokens)`, RPM + TPM tracking | 45m | 34 |
| 37 | Implement cost tracker: total input/output tokens, total USD, `budget_remaining()`, raise `BudgetExhausted` on limit | 30m | 34 |
| 38 | Implement retry logic with tenacity: exponential backoff (2s/4s/8s), max 3 retries, retry on 429/500/502/503, no retry on 401/400 | 30m | 34 |
| 39 | Implement `TokenEstimator`: `estimate_tokens(text)` (word count × 1.3), `estimate_cost(input, output, model)` | 20m | 4 |

**Afternoon: Response parser**

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 40 | Implement `ParseError` exception with raw_response and partial_result | 10m | 4 |
| 41 | Implement `ResponseParser.parse_json()` — main entry, tries 5 strategies | 15m | 40 |
| 42 | Implement Strategy 1: `_try_direct_parse()` | 5m | 41 |
| 43 | Implement Strategy 2: `_try_code_fence_extraction()` — regex for ```json ``` | 15m | 41 |
| 44 | Implement Strategy 3: `_try_boundary_extraction()` — find { } pairs with depth/string tracking | 30m | 41 |
| 45 | Implement Strategy 4: `_try_cleaned_parse()` — remove fences, trailing commas, comments, single quotes, prefix/suffix text | 30m | 41 |
| 46 | Implement Strategy 5: `_try_truncation_repair()` — count open brackets, close strings, remove partials, append closers, progressive retry | 45m | 41 |
| 47 | Implement `_validate()` — optional Pydantic schema validation, warn on fail but return data | 15m | 41 |

**Day 4 Exit Criteria:** LLM client has rate limiting, cost tracking, retries. Parser handles all 5 strategies.

---

### Day 5: Parser Tests + First Real Prompt Test

**Morning: Parser fixtures and tests**

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 48 | Create 10 test fixture files in `tests/fixtures/`: clean_json, code_fenced, trailing_comma, with_comments, truncated_simple, truncated_nested, mixed_text_json, single_quotes, empty_response, no_json | 30m | 41 |
| 49 | Write `test_parser.py`: one test per fixture, one per strategy, test ParseError on empty/no-json, test Pydantic validation pass/warn | 60m | 48, 42-47 |

**Afternoon: Real prompt testing — THE CRITICAL MOMENT**

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 50 | Implement `SYSTEM_PROMPT` constant in `prompts.py` | 10m | 4 |
| 51 | Implement `PromptTemplates.discover_capabilities(target, target_type)` for filetype | 30m | 50 |
| 52 | **CRITICAL TEST:** Send discover_capabilities("json", "filetype") through Zen AI. Save raw response as fixture. Parse it. Verify JSON capabilities found (objects, arrays, strings, numbers, booleans, null). Count total. Record tokens and cost | 30m | 51, 34, 41 |
| 53 | Implement `PromptTemplates.extract_structural_template(target, capability)` | 30m | 50 |
| 54 | **CRITICAL TEST:** Send extract_structural_template("json", {"id": "nested_object", "name": "Nested Object"}) through Zen AI. Save response. Verify template, variables, assembly code present | 30m | 53, 34 |
| 55 | Implement `PromptTemplates.extract_algorithm(target, capability)` | 30m | 50 |
| 56 | **CRITICAL TEST:** Send extract_algorithm prompt through Zen AI. Verify Python implementation is syntactically valid. Verify test vectors present | 30m | 55, 34 |
| 57 | Document actual token usage per prompt type. Update cost model. Verify budget is sufficient for full JSON generation | 15m | 52, 54, 56 |

**Day 5 Exit Criteria:**

```
✓ Three real LLM calls completed
✓ All three returned parseable, useful JSON
✓ Cost model validated with real numbers
✓ ~30 tests passing
✓ Parser handles actual Zen AI output format
✓ We KNOW the core concept works
```

**PHASE 0 GATE:** If prompts don't produce usable output, STOP. Iterate on prompts until they do. Don't build more infrastructure on a broken foundation.

---

## PHASE 1: ZERO TO FIRST GENERATED DATABASE
*Days 6-16 · End state: Complete JSON knowledge base in SQLite*

### Day 6: Remaining Prompts

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 58 | Implement `extract_coordinate_system(target)` prompt | 20m | 50 |
| 59 | Implement `extract_minimal_valid_file(target)` prompt | 20m | 50 |
| 60 | Implement `cross_reference_validate(target, section, items)` prompt | 20m | 50 |
| 61 | Implement `extract_composition_rules(target, capabilities)` prompt | 20m | 50 |
| 62 | Implement `generate_blueprint(target, app_type, capabilities)` prompt | 20m | 50 |
| 63 | Test each new prompt with a single real API call. Save responses as fixtures. Fix any that produce poor output | 90m | 58-62 |

### Day 7: Generation Planner

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 64 | Implement `GenerationTask` dataclass: id, target, section, subsection, phase (SKELETON/EXPANSION/CROSS_REF/GAP_FILL/SYNTHESIS), prompt, status (PENDING/IN_PROGRESS/COMPLETED/FAILED), result, token_cost, retries, depends_on | 30m | 4 |
| 65 | Implement `GenerationPlanner.generate_layer1_tasks(target, target_type)`: capability discovery + coordinate system + minimal file = 3 tasks | 30m | 64 |
| 66 | Implement `GenerationPlanner.generate_layer2_tasks(target, capabilities)`: one template + one algorithm per capability, plus cross-ref tasks | 45m | 64, 65 |
| 67 | Implement `GenerationPlanner.generate_layer3_tasks(target, capabilities)`: composition rules batches + blueprints | 30m | 64, 66 |
| 68 | Implement `_extract_capabilities_from_discovery(result)`: flatten hierarchy, preserve categories | 30m | 64 |
| 69 | Implement `BLUEPRINT_TEMPLATES` dict: default blueprint types per format kind | 15m | 67 |
| 70 | Write `test_planner.py`: layer 1 produces 3 tasks, layer 2 produces correct count, layer 3 produces composition + blueprint tasks, dependencies are correct | 30m | 65-68 |

### Day 8: Checkpoint Manager

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 71 | Add `generation_checkpoints` table to store schema | 15m | 19 |
| 72 | Implement `CheckpointManager`: `get_completed_tasks()`, `mark_started()`, `mark_completed()`, `mark_failed()`, `get_run_summary()` | 45m | 71 |
| 73 | Write `test_checkpoint.py`: start/complete flow, get_completed returns only completed, failed records error, summary aggregates | 30m | 72 |

### Days 9-10: Generation Executor Core

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 74 | Implement `GenerationExecutor.__init__(store, llm_client, planner, config)`: create semaphore, checkpoint manager | 20m | 72, 34, 65 |
| 75 | Implement `_execute_single_task(task)`: check budget, check deps, mark started, call LLM, parse response, store result, mark completed. On failure: retry or mark failed | 90m | 74 |
| 76 | Implement `_execute_batch(tasks)`: filter completed (from checkpoint), asyncio.gather with semaphore | 45m | 75 |
| 77 | Implement `_store_discovery_results(target, data)`: create target node, create capability nodes, create "contains" edges, return capability list | 60m | 76 |
| 78 | Implement `_store_template_result(target, cap_id, data)`: create structure node, create "template_for" edge | 30m | 77 |
| 79 | Implement `_store_algorithm_result(target, cap_id, data)`: create algorithm node, create "uses_algorithm" edge | 30m | 77 |
| 80 | Implement `_store_coordinate_system(target, data)`: create node with "coordinate" tag, edge from target | 20m | 77 |
| 81 | Implement `_store_minimal_file(target, data)`: create structure node with "minimal" tag | 20m | 77 |
| 82 | Implement `_store_blueprint(target, data)`: create blueprint node, "builds_with" edges | 20m | 77 |
| 83 | Implement `_store_composition_rules(target, data)`: create concept node with "composition" tag | 20m | 77 |

### Days 11-12: Executor Pipeline Orchestration

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 84 | Implement `execute_full_generation(target, version, target_type, resume, progress_callback)`: Layer 1 → parse caps → Layer 2 → Layer 3 → gap detection → gap fill → statistics | 120m | 76-83 |
| 85 | Implement `_run_gap_detection(target, capabilities)`: create cross-ref tasks, parse results, return gap-fill tasks | 45m | 84 |
| 86 | Implement progress callback: call with percentage at each phase transition | 15m | 84 |
| 87 | Write `test_executor.py` with mocked LLM client: full pipeline completes, resume skips completed, budget enforcement stops, retry logic, dependency ordering | 90m | 84 |

### Days 13-15: First JSON Generation

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 88 | Create `scripts/generate_target.py` CLI tool: accept target name, version, type. Progress bar with Rich. Cost display | 45m | 84 |
| 89 | **RUN GENERATION:** Execute full pipeline for JSON (RFC 8259, filetype). Monitor progress. Record all output | 120m | 88 |
| 90 | Review Layer 1 results: capabilities discovered (expect 30+), check for key features (objects, arrays, strings, numbers, booleans, null, nesting, escape sequences, unicode, encoding, whitespace, comments in JSON5, schema validation) | 30m | 89 |
| 91 | Review Layer 2 results: structural templates valid, algorithm implementations parse as Python, test vectors present | 45m | 89 |
| 92 | Review Layer 3 results: blueprints coherent, composition rules present | 30m | 89 |
| 93 | Fix prompt issues: iterate on any prompts that produced poor output, re-run failed tasks | 120m | 90-92 |
| 94 | Re-run with fixes if needed | 60m | 93 |

### Day 16: Post-Generation Verification

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 95 | Record final generation statistics: total nodes, edges, API calls, tokens, cost, wall-clock time, success rate | 30m | 94 |
| 96 | Query database: count nodes by type, count edges by relationship, verify no orphan nodes, verify no dangling edges | 30m | 94 |
| 97 | Extract 3 Python implementations from generated algorithms. Compile each (syntax check). Record results | 30m | 94 |
| 98 | Extract minimal file generation code. Run it. Verify output is valid JSON | 30m | 94 |

**PHASE 1 GATE:**

```
✓ SQLite database contains complete JSON knowledge
✓ 30+ capabilities documented
✓ Structural templates have valid content
✓ At least 80% of Python implementations compile
✓ Minimal file code produces valid JSON
✓ Total cost < $20
✓ ~50 tests passing
```

---

## PHASE 2: ZERO TO FIRST API RESPONSE
*Days 17-23 · End state: FastAPI serves knowledge from generated database*

### Day 17: API Foundation

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 99 | Implement `api/app.py`: FastAPI factory, lifespan (init store + query engine), CORS from config, include routes | 45m | 19, 12 |
| 100 | Implement `api/deps.py`: `get_store()`, `get_query_engine()`, `verify_api_key()` (accept any non-empty key) | 30m | 99 |
| 101 | Implement `api/middleware.py`: request timing, request ID, request logging | 30m | 99 |
| 102 | Implement `APIResponse` Pydantic model | 10m | 99 |
| 103 | Implement `GET /v1/health`: status, uptime, node counts. No auth required | 15m | 99 |
| 104 | Verify: `uvicorn magb.api.app:app --reload` starts, /docs loads, /v1/health returns 200 | 10m | 103 |

### Day 18: Explore Endpoints

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 105 | Implement `GET /v1/targets`: kind/search/sort_by/limit/offset params, capability counts, vitality scores | 60m | 104 |
| 106 | Implement `GET /v1/targets/{target_id}`: capability tree by category, has_template/has_algorithm per capability, vitality info, 404 with helpful message | 60m | 104 |
| 107 | Implement `GET /v1/targets/{target_id}/capabilities`: category/complexity/has_algorithm/search filters | 45m | 106 |
| 108 | Implement `GET /v1/graph/neighbors/{node_id}`: relationship/direction/depth params, subgraph at depth>1 | 45m | 104 |
| 109 | Implement `GET /v1/concepts`: domain/search/limit filters | 30m | 104 |

### Day 19: Retrieve Endpoints

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 110 | Implement `GET /v1/capabilities/{id}/bundle`: assemble capability + templates + algorithms + coordinates + composition + prerequisites. Language filter. response_format variants | 90m | 104 |
| 111 | Implement `_extract_code_only()`, `_extract_summary()`, `_format_for_ai_context()` helper functions | 30m | 110 |
| 112 | Implement `GET /v1/algorithms/{id}`: full algorithm with preferred implementation, used_by list | 45m | 104 |
| 113 | Implement `GET /v1/structures/{id}`: template with served capabilities | 30m | 104 |
| 114 | Implement `GET /v1/targets/{id}/coordinate-system` | 15m | 104 |
| 115 | Implement `GET /v1/targets/{id}/minimal-file` | 15m | 104 |

### Day 20: Synthesize Endpoints

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 116 | Implement `KnowledgeQuery` class: `assemble_context_for_task()` — search, score (target proximity + node type + confidence), include coordinates, assemble within token budget, format per type | 90m | 29 |
| 117 | Implement `KnowledgeQuery.compare_targets()` — shared algorithms, shared concepts, unique to each, similarity score | 30m | 116 |
| 118 | Implement `POST /v1/assemble`: accept target/task/language/tests/tokens, use KnowledgeQuery, categorize by type, return bundle | 45m | 116 |
| 119 | Implement `POST /v1/blueprint`: search for matching blueprints, fuzzy match on description, return with dependencies | 30m | 104 |
| 120 | Implement `POST /v1/diagnose`: heuristic cause detection (coordinate/structural/color/relationship keywords), return causes + constraints + coordinate system | 30m | 104 |
| 121 | Implement `POST /v1/convert` and `POST /v1/compare` | 30m | 117 |

### Day 21: Search + AI Context Endpoints

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 122 | Implement `POST /v1/search`: query/node_types/targets/limit, full-text search with filters, return with snippets | 30m | 29 |
| 123 | Implement `GET /v1/search/algorithms`: domain/has_implementation filters, return with availability info | 30m | 122 |
| 124 | Implement `POST /v1/ai/context`: return plain text (Content-Type: text/plain), wrap in knowledge header/footer | 30m | 116 |
| 125 | Implement `GET /v1/ai/system-prompt/{target_id}`: build system prompt from target knowledge, include coordinates + key templates | 30m | 104 |
| 126 | Implement meta endpoints: `GET /v1/meta/node-types`, `/relationship-types`, `/statistics` | 20m | 104 |

### Day 22-23: API Testing + Verification

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 127 | Write API test infrastructure: test client fixture using httpx.AsyncClient + TestClient, test database with sample data | 30m | 104 |
| 128 | Write explore endpoint tests: /targets lists, /targets/{id} returns tree, /targets/{id} 404, /capabilities with filter, /graph/neighbors | 60m | 127, 105-109 |
| 129 | Write retrieve endpoint tests: /capabilities/{id}/bundle returns all components, bundle with language filter, bundle code_only format, /algorithms/{id}, /coordinate-system, /minimal-file | 60m | 127, 110-115 |
| 130 | Write synthesize endpoint tests: /assemble returns relevant knowledge, /blueprint returns architecture, /diagnose identifies coordinate issues, /compare returns similarities | 45m | 127, 118-121 |
| 131 | Write search + AI endpoint tests: /search returns results, /search with filters, /ai/context returns text, /ai/system-prompt includes coordinates | 30m | 127, 122-125 |
| 132 | **INTEGRATION TEST:** Start API with real JSON database, manually test every endpoint through /docs | 60m | all API |
| 133 | Create `scripts/test_api.sh` — curl smoke test for every endpoint | 30m | 132 |
| 134 | Fix all issues found | 60m | 132 |

**PHASE 2 GATE:**

```
✓ API starts and serves generated JSON knowledge
✓ All explore endpoints return correct data
✓ Bundle endpoint returns templates + algorithms + code
✓ AI context endpoint returns formatted text
✓ Search finds by keyword
✓ All API tests pass
✓ ~80 tests passing
```

---

## PHASE 3: ZERO TO FIRST USER EXPERIENCE
*Days 24-33 · End state: Frontend works end-to-end*

### Day 24: Frontend Foundation

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 135 | Implement `src/lib/api-client.ts`: full TypeScript client with all endpoints, API key management (localStorage), error handling, text/JSON content type detection | 90m | all API |
| 136 | Implement `src/types/api.ts`: APIResponse<T>, TargetSummary, CapabilityNode, Algorithm, StructuralTemplate, VitalityScore, AssemblyRequest, SearchResult — all typed | 60m | 135 |
| 137 | Implement React Query provider in `src/app/layout.tsx`: QueryClientProvider, default staleTime 60s | 15m | 136 |
| 138 | Implement root layout: dark/light theme (system default), Inter font, global CSS | 20m | 137 |

### Day 25: Shell + Navigation + Common Components

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 139 | Implement `AppShell.tsx`: sidebar navigation (Explore: Targets/Concepts/Algorithms/Graph, Build: Assemble/Blueprints/Diagnose, Health: Dashboard/Drift), top bar with search, responsive collapse | 90m | 138 |
| 140 | Implement `CommandPalette.tsx`: ⌘K shortcut, debounced search, quick actions when empty, navigate on select, Escape to close, Radix Dialog | 60m | 135, 139 |
| 141 | Implement common components: Badge, Card, Skeleton, EmptyState, ErrorBoundary | 45m | 138 |
| 142 | Implement `CopyButton.tsx`: copy to clipboard, success feedback (checkmark for 2s) | 15m | 141 |
| 143 | Implement `CodeBlock.tsx`: syntax highlighting (use highlight.js), language prop, line numbers, copy button, max height with scroll, compact mode | 45m | 142 |
| 144 | Implement hooks: `useClipboard()`, `useDebounce()`, `useKeyboardShortcuts()` | 20m | 138 |

### Day 26: Dashboard + Target Browser

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 145 | Implement `VitalityBadge.tsx`: colored dot (green/yellow/orange/red), optional label with percentage, tooltip | 20m | 141 |
| 146 | Implement `src/app/page.tsx` — Dashboard: hero search, 3 quick action cards, stats bar (useQuery for /meta/statistics and /vitality), target grid | 60m | 140, 145 |
| 147 | Implement `src/app/explore/targets/page.tsx`: target card grid with kind filter dropdown + search input, each card shows icon/name/kind/capability_count/vitality, click navigates | 60m | 145, 135 |
| 148 | Implement `useSearch` hook: accepts query, debounces (200ms), calls POST /v1/search, returns {results, isSearching} | 20m | 135, 144 |
| 149 | Wire search into GlobalSearch component in TopBar and CommandPalette | 20m | 148, 140 |

### Days 27-28: Target Detail Page

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 150 | Implement `src/app/explore/targets/[targetId]/page.tsx`: header (icon, name, kind, version, vitality, extensions), action buttons ("Send to AI", "Build with"), Radix Tabs (Capabilities, Start Here, Coordinates, Graph, Health) | 60m | 145, 135 |
| 151 | Implement `CapabilityTree.tsx`: hierarchical by category, collapsible, search filter input, complexity filter buttons, has_template/has_algorithm indicators, click-to-select with highlight | 90m | 150 |
| 152 | Implement Capabilities tab: two-column layout (tree left sticky, detail right), dashed placeholder when none selected, load BundlePanel on select | 30m | 151 |
| 153 | Implement Start Here tab: MinimalFileView component (description, code block, copy button, instructions), "What to build next" suggestion cards | 45m | 143, 135 |
| 154 | Implement `CoordinateReference.tsx`: sections for coordinate systems, units/conversions (copyable formulas), transforms, colors. Compact mode prop | 45m | 143 |
| 155 | Implement Knowledge Graph tab: list view of connected nodes grouped by relationship type, click to navigate. Placeholder for future D3 visualization | 30m | 135 |
| 156 | Implement Health tab: vitality gauge for target, freshness/correctness/completeness breakdowns, list of lowest-vitality nodes | 30m | 145 |

### Days 29-30: Bundle Panel (The Most Important Component)

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 157 | Implement `BundlePanel.tsx` shell: header (name, description, complexity badge, prerequisites), language selector, SendToAI button, quick stats, Radix Tabs (Templates, Algorithms, Coordinates, Composition, All Code) | 60m | 150, 143 |
| 158 | Implement `StructureTemplate.tsx`: template display (syntax-highlighted by format_type), variables table (name/type/constraints/default/description), placement rules, assembly code (copyable), filled example (copyable) | 60m | 143 |
| 159 | Implement `AlgorithmView.tsx`: collapsible header (name, purpose, complexity), math foundation section (formulas with variables), implementation code with language tabs, parameters table, test vectors (input/output cards), edge cases (warning cards), optimizations (collapsible). All code blocks copyable | 120m | 143 |
| 160 | Implement "All Code" tab: concatenate all implementation code, single copyable block, language label | 20m | 143, 158, 159 |
| 161 | Implement composition rules cards: amber warning style, rule type, description, code if available | 15m | 143 |
| 162 | Implement `SendToAIButton.tsx`: calls /v1/ai/context or /v1/capabilities/{id}/bundle?response_format=ai_context, shows in Radix Dialog modal, token estimate, copy to clipboard, download as .txt | 45m | 135, 140 |

### Days 31-32: Build Mode

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 163 | Implement `src/app/build/assemble/page.tsx`: target input (datalist suggestions), language selector, output mode toggle (Bundle/AI Context), task textarea, token budget slider (AI Context mode), submit button with loading, example task cards | 60m | 135 |
| 164 | Implement bundle result display: usage guide card, templates, algorithms, coordinates, test vectors | 45m | 158, 159 |
| 165 | Implement AI context result display: token count, copy button (prominent purple), download button, full text in CodeBlock | 30m | 143 |
| 166 | Implement example queries component: 5 pre-built examples for JSON and PNG, click to populate form | 15m | 163 |
| 167 | Implement `src/app/settings/page.tsx`: API key input (masked), save to localStorage, connection test button (/v1/health), status indicator | 30m | 135 |

### Day 33: Frontend Integration Verification

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 168 | Start backend with JSON database, start frontend pointing to backend | 10m | all |
| 169 | Walk through Explorer journey: Landing → Search "json" → Target Detail → Capabilities → Click capability → See bundle → Copy code | 30m | 168 |
| 170 | Walk through Builder journey: Build → Assemble → Enter task "create a JSON file with nested objects" → Get bundle → Copy AI context | 30m | 168 |
| 171 | Walk through Search: ⌘K → type "array" → see results → click result → navigate | 15m | 168 |
| 172 | Fix all UI issues found | 90m | 169-171 |
| 173 | Screenshot key screens for documentation | 15m | 172 |

**PHASE 3 GATE:**

```
✓ Frontend loads, displays real generated knowledge
✓ Can browse targets and capabilities
✓ Bundle panel shows templates, algorithms, code
✓ Can copy code with one click
✓ AI context assembly works
✓ Search finds knowledge across the database
✓ ~90 tests passing
```

---

## PHASE 4: PROOF OF LIFE
*Days 34-42 · End state: Generated code works. Second target generated. Observability live.*

### Days 34-35: Observability (Vitality Scoring)

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 174 | Add vitality tables to store: `node_vitality`, `vitality_signals`, `vitality_snapshots` | 20m | 19 |
| 175 | Implement `classify_decay_model(node)`: algorithm-math→ETERNAL, concept→GEOLOGICAL, specific-version→GEOLOGICAL, latest→SEASONAL, protocol→VOLATILE | 30m | 15 |
| 176 | Implement `NodeVitality.compute_freshness_decay(now)`: `e^(-λt)`, λ = ln(2)/half_life | 20m | 175 |
| 177 | Implement `NodeVitality.compute_vitality()`: geometric mean of dimensions | 10m | 176 |
| 178 | Implement `NodeVitality.predict_future_vitality(now)`: 30/90/180 day predictions | 15m | 177 |
| 179 | Implement `DecayTracker.compute_all_decay()`: load all nodes, classify, compute, batch update | 45m | 174-178 |
| 180 | Implement `DecayTracker.take_snapshot()`: aggregate stats, group by type/target, insert snapshot | 30m | 179 |
| 181 | Initialize vitality on generation: after storing node, create vitality record (freshness=1.0, correctness=0.85 for generated) | 15m | 79, 174 |
| 182 | Wire into API startup: run compute_all_decay once on start | 10m | 179, 99 |
| 183 | Write vitality tests: freshness ~0.5 at half-life, eternal barely decays, ephemeral decays fast, vitality=0 if dimension=0, predictions lower than current | 30m | 176-178 |
| 184 | Verify vitality scores appear on frontend: VitalityBadge on target detail, Health dashboard gauges show real data | 20m | 182, 145, 156 |

### Day 36: Health Dashboard Completion

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 185 | Implement `src/app/health/page.tsx`: four VitalityGauge (overall/freshness/correctness/completeness), node distribution bars (healthy/warning/critical), auto-refresh 60s | 60m | 145, 135 |
| 186 | Implement `VitalityGauge.tsx`: large number display, color based on score, label and description, size variants (compact, large) | 30m | 145 |
| 187 | Verify GET /v1/vitality returns computed scores from real database | 15m | 182 |
| 188 | Verify GET /v1/vitality?target=json returns per-target breakdown | 15m | 182 |

### Days 37-38: Code Validation

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 189 | Implement `validation/code_runner.py`: `run_code_safely(code, timeout)` — write to tempfile, subprocess.run with timeout, capture stdout/stderr, cleanup | 45m | 4 |
| 190 | Extract minimal file code from JSON database. Run it. Verify produces valid JSON (json.loads succeeds) | 15m | 189, 94 |
| 191 | Extract 5 algorithm implementations from JSON database. Compile each (syntax check with `compile()`). Record pass/fail | 30m | 189, 94 |
| 192 | Extract any implementations with test vectors. Build test harness. Run tests. Record pass/fail | 45m | 189 |
| 193 | Document validation results: syntax valid %, test vectors pass %, overall "works" rate | 15m | 190-192 |

### Days 39-41: Second Target — PNG

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 194 | Run full generation pipeline for PNG (ISO/IEC 15948, filetype) | 120m | 84 |
| 195 | Review: verify capabilities include chunk structure, color types, filter types, DEFLATE, interlacing, CRC32 | 30m | 194 |
| 196 | Review: verify algorithms include CRC32, scanline filtering, filter selection heuristic | 30m | 194 |
| 197 | Review: verify structural templates include IHDR/IDAT/IEND chunks and full PNG assembly | 30m | 194 |
| 198 | Fix any prompt issues, re-run if needed | 60m | 195-197 |
| 199 | Extract PNG minimal file code. Run it. Verify produces file with PNG magic bytes (89 50 4E 47) | 30m | 189, 198 |
| 200 | Extract 3 PNG algorithm implementations. Compile. Run test vectors where available | 30m | 189, 198 |
| 201 | Verify frontend shows PNG alongside JSON: both targets in listing, PNG has capability tree, PNG bundles display correctly | 30m | 198, 168 |

### Day 42: Cross-Target Verification

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 202 | Query shared algorithms between JSON and PNG (expect: possibly compression concepts) | 15m | 198 |
| 203 | Check for duplicate content hashes across targets | 15m | 198 |
| 204 | Run integrity check: orphan nodes, dangling edges | 15m | 198 |
| 205 | Document two-target database statistics: total nodes, edges, cross-target connections | 15m | 202-204 |
| 206 | Run full end-to-end journeys: Explorer (browse PNG), Builder (assemble PNG task), AI Context (generate PNG context), Compare (JSON vs PNG) | 60m | 201 |
| 207 | Fix all issues found | 60m | 206 |

**PHASE 4 GATE:**

```
✓ Two targets fully generated (JSON + PNG)
✓ Generated code produces valid output files
✓ Vitality scores computed and displayed
✓ Health dashboard shows real data
✓ Cross-target queries work
✓ Total API spend recorded and within budget
✓ ~100 tests passing
```

---

## PHASE 5: SHIP IT
*Days 43-48 · End state: Docker runs, docs exist, demo works*

### Day 43: Docker

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 208 | Finalize `backend/Dockerfile`: multi-stage, install deps, copy src, health check, CMD uvicorn | 30m | all backend |
| 209 | Finalize `frontend/Dockerfile`: multi-stage (build + serve), env injection, standalone output | 30m | all frontend |
| 210 | Finalize `docker-compose.yml`: backend + frontend services, volume for db, env_file, ports, depends_on | 20m | 208, 209 |
| 211 | Test: `docker-compose up --build` starts everything from zero, frontend reaches backend, health endpoint responds | 30m | 210 |
| 212 | Test: pre-generate database, mount as volume, verify frontend shows data | 20m | 211 |

### Days 44-45: Documentation

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 213 | Write `README.md`: what is magB (1 paragraph), what the POC demonstrates, quick start (3 commands), architecture diagram (ASCII), API docs link, screenshots, configuration reference, cost info | 90m | all |
| 214 | Write `docs/ARCHITECTURE.md`: system overview diagram, 6 entity types, 3 knowledge layers, generation pipeline, observability model | 60m | all |
| 215 | Write `docs/FIRST_RUN.md`: prerequisites, step-by-step install, first generation, exploring results, common issues | 45m | all |
| 216 | Write `docs/API.md`: endpoint table, auth, example requests/responses for each endpoint, link to /docs | 45m | all API |
| 217 | Write `docs/PROMPTS.md`: design principles, template reference, iteration guide, real token usage data | 30m | 57, 95 |

### Day 46: Demo Script

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 218 | Create `scripts/demo.py`: generate if not exists, start API, run key API calls with Rich formatted output, extract and run code, print statistics | 60m | 88, all |
| 219 | Create `scripts/generate_target.py` (polish): progress bar, cost tracking, resume support, summary at end | 30m | 88 |
| 220 | Write demo walkthrough notes: step-by-step script, talking points, fallback screenshots | 30m | 218 |

### Days 47-48: Final Quality Pass

| # | Task | Est. | Depends On |
|---|------|------|------------|
| 221 | Run full test suite — all tests must pass | 30m | all |
| 222 | Run linter (ruff) — no errors | 15m | all |
| 223 | Fresh clone test: new directory, follow README exactly, everything works | 60m | 213 |
| 224 | Review all TODO/FIXME comments — resolve or document in known issues | 30m | all |
| 225 | Verify Docker setup on clean machine | 30m | 211 |
| 226 | Final cost accounting: total API spend during POC development | 15m | all |
| 227 | Create `CHANGELOG.md` with v0.1.0 entry | 15m | all |
| 228 | Tag `v0.1.0` | 5m | 227 |

**PHASE 5 GATE (POC COMPLETE):**

```
✓ Docker Compose starts entire system
✓ README enables someone else to run it
✓ Demo script showcases all capabilities
✓ All tests pass
✓ Code is linted
✓ Fresh clone works
✓ Total cost documented
✓ v0.1.0 tagged
```

---

## Complete Task Count by Phase

```
Phase 0: Zero to First API Call          57 tasks    Days 1-5
Phase 1: Zero to First Generated DB      41 tasks    Days 6-16
Phase 2: Zero to First API Response      36 tasks    Days 17-23
Phase 3: Zero to First User Experience   39 tasks    Days 24-33
Phase 4: Proof of Life                   34 tasks    Days 34-42
Phase 5: Ship It                         21 tasks    Days 43-48
─────────────────────────────────────    ────────    ─────────
TOTAL                                   228 tasks    48 days
```

---

## Risk-Adjusted Schedule

The ideal schedule assumes everything works the first time. It won't. Here's where buffer is allocated:

```
KNOWN RISK AREAS AND BUFFER:

Zen AI SDK integration (Day 3)
  Risk: SDK API differs from assumptions
  Buffer: 1 day (Day 5 has slack)
  Mitigation: Research SDK on Day 3 morning before coding

Prompt quality (Day 5)
  Risk: Prompts produce poor/unparseable output
  Buffer: 3 days (Days 13-15 have generation + iteration time)
  Mitigation: Test 3 prompts manually before building pipeline

JSON generation (Days 13-15)
  Risk: Pipeline crashes, produces low-quality output
  Buffer: Day 16 is verification/fix day
  Mitigation: Checkpoint/resume system handles crashes

Frontend complexity (Days 24-33)
  Risk: More UI polish needed than estimated
  Buffer: Phase 4 has 2 days of flex
  Mitigation: Cut graph visualization, simplify health dashboard

PNG generation (Days 39-41)
  Risk: Binary format prompts need different approach
  Buffer: Can drop PNG entirely — JSON alone proves the concept
  Mitigation: PNG is enhancement, not requirement

TOTAL BUFFER: ~5-7 days embedded in the schedule
WORST CASE: 55 working days (~11 calendar weeks)
```

---

## Cut List (If Behind Schedule)

In priority order — cut from the bottom first:

```
CUT LEVEL 1 (Save 3-5 days):
  - Drop PNG generation entirely (WS7 tasks 194-207)
  - Drop health dashboard frontend (tasks 185-188)
  - Drop POST /v1/diagnose and POST /v1/convert endpoints
  - POC proves concept with JSON only

CUT LEVEL 2 (Save 5-7 more days):
  - Drop Build/Assemble workspace (tasks 163-166)
  - Drop CommandPalette (task 140)
  - Drop Docker (tasks 208-212)
  - Frontend is explore-only
  - Run from terminal instead of Docker

CUT LEVEL 3 (Save 3-5 more days):
  - Drop all frontend
  - POC is API + CLI only
  - Demo via curl commands and scripts
  - Still proves the core concept

MINIMUM VIABLE POC (irreducible core):
  - LLM client + parser + prompts
  - Generation pipeline
  - SQLite store
  - JSON generation
  - API with bundle endpoint
  - One script that generates, serves, and demonstrates
  = ~25 days of work
```

---

## Weekly Checkpoints

```
END OF WEEK 1 (Day 5):
  "Can we get structured knowledge from Zen AI?"
  ✓ Store works
  ✓ LLM calls work
  ✓ Parser handles real output
  ✓ 3 prompts tested with real API
  ✓ Cost model validated

END OF WEEK 2 (Day 10):
  "Can we generate knowledge automatically?"
  ✓ All prompts implemented
  ✓ Planner creates task DAG
  ✓ Executor runs tasks with checkpointing

END OF WEEK 3 (Day 16):
  "Do we have a real knowledge base?"
  ✓ JSON fully generated
  ✓ 30+ capabilities documented
  ✓ Code compiles
  ✓ Minimal file works

END OF WEEK 4-5 (Day 23):
  "Can we serve knowledge via API?"
  ✓ All API endpoints working
  ✓ Bundle endpoint returns real knowledge
  ✓ Search works
  ✓ AI context works

END OF WEEK 6-7 (Day 33):
  "Can a developer use this?"
  ✓ Frontend browses targets and capabilities
  ✓ Bundle panel shows templates + code
  ✓ Copy-paste works
  ✓ AI context assembly works

END OF WEEK 8-9 (Day 42):
  "Does it actually work?"
  ✓ Generated code produces valid files
  ✓ Two targets generated
  ✓ Vitality scores displayed
  ✓ End-to-end journeys validated

END OF WEEK 10 (Day 48):
  "Can someone else use this?"
  ✓ Docker runs
  ✓ Docs exist
  ✓ Demo works
  ✓ v0.1.0 tagged
```

---

## Daily Standup Template

```
YESTERDAY:
  - Completed tasks: [T-X.Y.Z, ...]
  - Tests added: N
  - Tests passing: N/N

TODAY:
  - Working on: [T-X.Y.Z, ...]
  - Blocked by: [nothing | ...]
  - API calls made: N ($X.XX spent)

HEALTH:
  - Schedule: [on track | N days ahead | N days behind]
  - Budget: $X.XX of $90 spent
  - Risk: [none | description]
```

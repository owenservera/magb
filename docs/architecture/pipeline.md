# ⚙️ Generation Pipeline

For the complete, technical pipeline implementation, see:

📄 **[Design: Full Architecture](../../design/Architecture%20-%20Opus%204.6%20.md)**

This document contains the complete 6-phase (expandable to 12-phase) pipeline with:
- All prompt templates
- Async LLM client with multi-provider routing
- Rate-limited, retry-aware API calls
- JSON-mode output enforcement
- Full Pydantic data models
- SQLite storage with export pipeline

---

## Pipeline Phases

| Phase | Name | Purpose | Model Tier |
|---|---|---|---|
| 1 | **Decompose** | Build exhaustive topic tree | Cheap (fast pattern work) |
| 2 | **Enumerate** | Generate completeness anchors | Cheap |
| 3 | **Generate** | Produce content for every leaf | Mid-tier (deep knowledge) |
| 4 | **Gap Analysis** | Cross-reference tree vs. anchors | Mid-tier |
| 5 | **Fill Gaps** | Generate missing entries | Mid-tier |
| 6 | **Validate** | Cross-model accuracy checking | Premium (different model) |
| 7-12 | **Implementation** | Atoms, algorithms, capabilities, blueprints | Mid-tier to Premium |

### Cost Optimization

By routing different phases to different model tiers:
- Decomposition (listing subtopics) → cheap, fast models
- Content generation (deep knowledge) → capable mid-tier models  
- Validation (catching errors) → different provider for diversity

This cuts total cost by **~60%** without sacrificing quality.

---

## Related Documents

- **[Architecture Overview](overview.md)**
- **[How It Works (Concept)](../concepts/how-it-works.md)**
- **[Design: Concept (Thinking)](../../design/magB_Concept_Opus%204.6_Thinking.md)**
- **[Design: Concept (Non-Thinking)](../../design/magB_Concept_Opus%204.6.md)**

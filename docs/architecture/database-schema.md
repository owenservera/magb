# 🗄️ Database Schema

For the complete, production-ready database schema specification, see:

📄 **[Proposal: Future-Proof Schema Architecture](../../design/Proposal_without%20missing%20elements_schema_architecture_v0_.md)**

This document contains the synthesized schema from both Opus 4.6 architecture documents, including:

- 12+ table specifications with full column definitions
- Index strategy (HNSW vector, B-tree, GIN, FTS)
- Volume projections at 1,000 targets (~250GB total)
- Deduplication strategy (~70% cost savings)
- AI query patterns
- Phased implementation plan

---

## Quick Reference

### Tables at a Glance

| Layer | Table | Row Count (at scale) | Purpose |
|---|---|---|---|
| **Core** | `concepts` | ~300 | Universal ideas (iteration, compression, etc.) |
| | `families` | ~50 | Language/format families |
| | `targets` | ~1,000 | Specific languages, formats, tools |
| | `target_versions` | ~3,000 | Delta-chained version tracking |
| **Knowledge** | `entries` | ~5,000,000 | Multi-resolution content (micro/standard/exhaustive) |
| | `examples` | ~10,000,000 | Version-aware code examples |
| **Implementation** | `atoms` | ~2,000,000 | Structural elements (XML, binary, JSON) |
| | `algorithms` | ~50,000 | Computational procedures with code |
| | `capabilities` | ~500,000 | User-facing features with implementation specs |
| | `blueprints` | ~10,000 | Composable architecture plans |
| | `artifacts` | ~500,000 | Large, reusable code blobs |
| **Graph** | `relations` | ~20,000,000 | Typed, weighted knowledge graph edges |
| **Operations** | `generation_runs` | — | AI generation campaign tracking |
| | `validations` | — | Verification results |
| | `embeddings` | ~15,000,000 | Per-resolution vector embeddings |
| | `schema_metadata` | — | Self-describing schema for AI |

### Key Design Decisions

1. **Multi-resolution content** — Micro (~50 tokens), Standard (~500), Exhaustive (~2000)
2. **Delta version chains** — 98% storage deduplication between versions
3. **Separate embeddings table** — Clean backend swapping and model upgrades
4. **Polymorphic relations** — Any entity can relate to any other entity
5. **Self-describing schema** — AI can introspect the database without external docs

---

## Related Documents

- **[Architecture Overview](overview.md)**
- **[Design: Database Architecture (Thinking)](../../design/magB_Database%20Architecture%20-%20Opus%204.6%20Thinking%20.md)**
- **[Design: Database Architecture (Non-Thinking)](../../design/magB_Database%20Architecture%20-%20Opus%204.6%20non-Thinking%20.md)**

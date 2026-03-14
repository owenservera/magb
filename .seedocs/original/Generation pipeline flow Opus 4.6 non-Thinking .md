

# magB Intelligent Data Generation Pipeline

## The Core Problem

Your current design has the AI blindly generating data. What you need is an AI that **thinks before it acts** — understanding what it already knows, what it still needs, and the most efficient path to get there.

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    THE FUNDAMENTAL SHIFT                                 ║
║                                                                          ║
║  OLD: "Generate all Python entries" → 2,500 blind API calls              ║
║  NEW: "What do I know? What's missing? What's cheapest to get next?"     ║
║       → Discovery pass (3 calls) → Surgical generation (800 calls)       ║
║       → 68% fewer API calls, better coverage                            ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                    ┌──────────────────────┐                             │
│                    │   MASTER PLAN STORE   │                             │
│                    │  (per target plans)   │                             │
│                    └──────────┬───────────┘                             │
│                               │                                         │
│    ┌──────────┐    ┌──────────▼───────────┐    ┌──────────────────┐    │
│    │ COVERAGE │    │                       │    │                  │    │
│    │ ANALYZER │───▶│    PLANNING ENGINE    │───▶│  REQUEST ROUTER  │    │
│    │          │    │                       │    │                  │    │
│    └──────────┘    └───────────────────────┘    └────────┬─────────┘    │
│         ▲                                               │              │
│         │          ┌──────────────────────┐              │              │
│         │          │   RESPONSE PARSER    │              │              │
│         │          │   & COMMIT ENGINE    │◀─────────────┘              │
│         │          └──────────┬───────────┘                             │
│         │                     │                                         │
│         └─────────────────────┘  (loop: generate → commit → re-assess) │
│                                                                         │
│                    THE INTELLIGENT PIPELINE                              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Database Additions

```prisma
// ════════════════════════════════════════════════════════════════════════════════
// LAYER 8: INTELLIGENT PIPELINE — Plans, coverage tracking, request flow
//
// The "brain" of the generation system. Unlike the raw request queue from
// before, this layer THINKS before it generates. Every API call is justified
// by a coverage gap identified through structured analysis.
// ════════════════════════════════════════════════════════════════════════════════

// ─── Enums ───────────────────────────────────────────────────────────────────

/// The lifecycle of a generation plan for a specific target
enum PlanStatus {
  DRAFT              // Plan created but not yet analyzed for coverage
  ANALYZING          // Coverage analyzer is running
  READY              // Analysis complete, work items queued
  IN_PROGRESS        // Generation actively running
  PAUSED             // Manually paused or waiting on dependency
  COMPLETED          // All phases done, validation passed
  FAILED             // Unrecoverable failure
}

/// The 12 phases from the pipeline spec, plus meta-phases
enum PipelinePhase {
  // Meta-phases (the intelligent layer)
  COVERAGE_ANALYSIS       // Assess what we already have
  PLAN_GENERATION         // Build the master plan
  DEPENDENCY_RESOLUTION   // Identify cross-target reuse

  // Part A: Reference Layer
  DECOMPOSE_TOPIC_TREE    // Phase 1
  ENUMERATE_ANCHORS       // Phase 2
  GENERATE_REFERENCE      // Phase 3
  GAP_ANALYSIS            // Phase 4
  FILL_GAPS               // Phase 5
  VALIDATE_ACCURACY       // Phase 6

  // Part B: Implementation Layer
  ENUMERATE_CAPABILITIES  // Phase 7
  EXTRACT_ATOMS           // Phase 8
  EXTRACT_ALGORITHMS      // Phase 9
  GENERATE_IMPL_SPECS     // Phase 10
  ASSEMBLE_BLUEPRINTS     // Phase 11
  VALIDATE_IMPLEMENTATIONS // Phase 12
}

/// Status of individual work items within a phase
enum WorkItemStatus {
  NOT_STARTED
  BLOCKED              // Waiting on a dependency
  READY                // All deps met, queued for execution
  IN_PROGRESS          // API call in flight
  PARSE_FAILED         // Got response but couldn't parse
  RETRY_QUEUED         // Parse failed, queued for retry with different strategy
  GENERATED            // Parsed successfully, awaiting validation
  VALIDATED            // Passed validation, committed to DB
  FAILED               // Exhausted retries
  SKIPPED              // Deduplicated or deemed unnecessary
}

/// Which model tier to use for a work item
enum ModelTier {
  CHEAP       // gpt-4o-mini, claude-3-haiku — structural tasks
  MID         // claude-3.5-sonnet, gpt-4o — bulk content
  EXPENSIVE   // o1, claude-3-opus — validation, reasoning
}

/// Classification of why a work item exists
enum WorkItemReason {
  INITIAL_PLAN          // Part of the original plan
  GAP_DETECTED          // Coverage analysis found a gap
  ANCHOR_MISMATCH       // Completeness anchor revealed missing item
  CROSS_REFERENCE       // Discovered during relation building
  VALIDATION_FAILURE    // Previous attempt failed validation
  DECAY_REFRESH         // Content went stale
  DEPENDENCY_CASCADE    // Auto-created because something needs it
  MANUAL                // Human-initiated
}

/// What kind of deduplication was applied
enum DeduplicationAction {
  NONE                  // No duplicate found, generate fresh
  FULL_REUSE            // Exact match exists, just create graph edge
  PARTIAL_REUSE         // Similar content exists, generate delta only
  CROSS_TARGET_LINK     // Same concept in different target, link + diff
}

// ─── Master Plan ─────────────────────────────────────────────────────────────

/// MasterPlan — The intelligent generation plan for a single target.
///
/// Before ANY API call fires, the pipeline builds a MasterPlan that:
///   1. Inventories what already exists in the database for this target
///   2. Maps the full knowledge space that SHOULD exist
///   3. Computes the delta (what's missing)
///   4. Orders work items by dependency + cost efficiency
///   5. Identifies cross-target reuse opportunities
///
/// ~1,000 rows at scale (one per target).
model MasterPlan {
  id          String     @id @default(cuid())
  targetId    String     @unique @map("target_id")
  status      PlanStatus @default(DRAFT)

  /// ── Wave assignment ──
  /// Targets are generated in waves to maximize deduplication.
  /// Wave 1 seeds foundational knowledge; later waves reuse it.
  wave        Int        @default(99)  /// 1=foundation, 2=related, 3=complex, 4=tools
  waveOrder   Int        @default(0)   @map("wave_order") /// Order within wave

  /// ── Coverage snapshot (computed by CoverageAnalyzer) ──
  /// Taken BEFORE generation starts, and updated after each phase completes.
  coverageSnapshot Json  @default("{}") @map("coverage_snapshot")
  /// {
  ///   assessed_at: "2024-01-15T...",
  ///   existing_entries: 47,
  ///   existing_atoms: 0,
  ///   existing_capabilities: 0,
  ///   existing_blueprints: 0,
  ///   existing_algorithms_reusable: 12,
  ///   estimated_total_entries: 350,
  ///   estimated_total_atoms: 200,
  ///   coverage_percentage: 13.4,
  ///   gaps_by_category: { "control_flow": 0.8, "type_system": 0.0, ... }
  /// }

  /// ── Phase progress ──
  currentPhase    PipelinePhase?   @map("current_phase")
  phaseProgress   Json             @default("{}") @map("phase_progress")
  /// {
  ///   "DECOMPOSE_TOPIC_TREE": { status: "COMPLETED", items: 1, completed: 1 },
  ///   "ENUMERATE_ANCHORS": { status: "IN_PROGRESS", items: 5, completed: 3 },
  ///   "GENERATE_REFERENCE": { status: "NOT_STARTED", items: 0, completed: 0 },
  ///   ...
  /// }

  /// ── Cost tracking ──
  estimatedCostUsd  Float  @default(0.0) @map("estimated_cost_usd")
  actualCostUsd     Float  @default(0.0) @map("actual_cost_usd")
  totalApiCalls     Int    @default(0)   @map("total_api_calls")
  totalTokensUsed   Int    @default(0)   @map("total_tokens_used")
  savedByDedup      Float  @default(0.0) @map("saved_by_dedup") /// USD saved via reuse

  /// ── Budget controls ──
  maxBudgetUsd      Float  @default(10.0) @map("max_budget_usd")

  /// ── Cross-target reuse map ──
  /// Computed during DEPENDENCY_RESOLUTION phase.
  /// Lists algorithms, concepts, and atoms from OTHER targets that this
  /// target can reuse instead of regenerating.
  reuseMap          Json   @default("{}") @map("reuse_map")
  /// {
  ///   algorithms: [
  ///     { id: "algo.compress.deflate", source_target: "png", reuse_type: "FULL_REUSE" },
  ///     { id: "algo.img.blur.gaussian", source_target: "jpeg", reuse_type: "FULL_REUSE" }
  ///   ],
  ///   concepts: [
  ///     { id: "iteration.definite", entries_reusable: 0, needs_target_specific: true }
  ///   ],
  ///   atoms: [
  ///     { id: "atom.zip.local_file_header", source_target: "zip", reuse_type: "FULL_REUSE" }
  ///   ]
  /// }

  /// ── Scheduling ──
  startedAt     DateTime?  @map("started_at")
  completedAt   DateTime?  @map("completed_at")
  lastActivityAt DateTime? @map("last_activity_at")

  /// ── Link to generation run ──
  generationRunId String?  @map("generation_run_id")

  metadata  Json     @default("{}")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt     @map("updated_at")

  // ── Relations ──
  target    Target     @relation(fields: [targetId], references: [id])
  workItems WorkItem[]

  @@index([status])
  @@index([wave, waveOrder])
  @@map("master_plans")
}

// ─── Work Items ──────────────────────────────────────────────────────────────

/// WorkItem — A single unit of work in the generation pipeline.
///
/// Every API call is represented by exactly one WorkItem. This is the
/// atomic unit of the production line. Unlike the previous DataRequest
/// design which was a generic queue, WorkItems are:
///
///   1. Always part of a MasterPlan (no orphan requests)
///   2. Always assigned to a specific phase
///   3. Always have a model tier assignment
///   4. Always have deduplication checked BEFORE generation
///   5. Always carry their full prompt context (no re-discovery)
///
/// ~5,000,000 rows at scale.
model WorkItem {
  id            String         @id @default(cuid())
  planId        String         @map("plan_id")
  phase         PipelinePhase
  status        WorkItemStatus @default(NOT_STARTED)

  /// ── What is being generated? ──
  entityType    String         @map("entity_type") /// "entry"|"atom"|"algorithm"|...
  targetEntityId String?       @map("target_entity_id") /// Pre-computed ID for the result
  title         String         /// Human-readable: "Entry: Python/Control Flow/for"
  path          String?        /// Hierarchical path if applicable

  /// ── Why does this work item exist? ──
  reason        WorkItemReason @default(INITIAL_PLAN)

  /// ── Deduplication decision ──
  /// Computed BEFORE any API call. The pipeline checks the database
  /// and the reuse map to decide if this item needs generation at all.
  deduplicationAction DeduplicationAction @default(NONE) @map("dedup_action")
  deduplicationSource String?             @map("dedup_source") /// ID of reused entity
  deduplicationNotes  String?             @map("dedup_notes")

  /// ── Model routing ──
  modelTier     ModelTier      @default(MID) @map("model_tier")
  assignedModel String?        @map("assigned_model") /// Actual model used

  /// ── The prompt ──
  /// Complete, self-contained prompt context. Built by the PlanningEngine
  /// at plan creation time, NOT at execution time. This means:
  ///   • No database queries needed at generation time
  ///   • Prompts can be reviewed/audited before execution
  ///   • Failed items can be retried with the exact same context
  promptTemplate String?       @map("prompt_template") /// Template ID
  promptContext  Json           @default("{}") @map("prompt_context")
  /// {
  ///   target_info: { name: "Python", kind: "PROGRAMMING_LANGUAGE", version: "3.12" },
  ///   parent_context: "Python/Control Flow (category with 12 subtopics)",
  ///   sibling_entries: ["while loop", "if/elif/else", "match/case"],
  ///   concept_link: { id: "iteration.definite", summary: "..." },
  ///   existing_content: null,  // or the current content if refreshing
  ///   output_schema: { ... },  // JSON Schema the response must match
  ///   resolution: "standard",
  ///   max_tokens: 2000
  /// }

  /// ── Execution tracking ──
  attemptCount   Int       @default(0) @map("attempt_count")
  maxAttempts    Int       @default(3) @map("max_attempts")

  /// ── Response data ──
  rawResponse    String?   @map("raw_response")   /// Raw API response text
  parsedData     Json?     @map("parsed_data")     /// Successfully parsed JSON
  parseStrategy  String?   @map("parse_strategy")  /// Which parser strategy worked
  parseErrors    Json      @default("[]") @map("parse_errors") /// History of parse failures

  /// ── Validation ──
  validationResult String?  @map("validation_result") /// "PASSED"|"FAILED"|"NEEDS_REVIEW"
  validationNotes  String?  @map("validation_notes")
  validatorModel   String?  @map("validator_model")

  /// ── Cost ──
  inputTokens    Int?     @map("input_tokens")
  outputTokens   Int?     @map("output_tokens")
  costUsd        Float?   @map("cost_usd")

  /// ── Timing ──
  queuedAt       DateTime? @map("queued_at")
  startedAt      DateTime? @map("started_at")
  completedAt    DateTime? @map("completed_at")
  nextRetryAt    DateTime? @map("next_retry_at")
  lastError      String?   @map("last_error")

  /// ── Ordering ──
  /// Within a phase, items are processed in this order.
  /// Lower = processed first. Computed from dependency depth + priority.
  executionOrder Int       @default(0) @map("execution_order")

  /// ── Batch grouping ──
  /// Related items can be batched into a single API call.
  /// e.g., "Generate 5 sibling entries in one prompt"
  batchId        String?   @map("batch_id")
  batchIndex     Int?      @map("batch_index") /// Position within batch

  metadata  Json     @default("{}")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt     @map("updated_at")

  // ── Relations ──
  plan          MasterPlan         @relation(fields: [planId], references: [id])
  dependencies  WorkItemDependency[] @relation("ItemDependents")
  dependents    WorkItemDependency[] @relation("ItemDependencies")

  @@index([planId, phase, status])
  @@index([status, executionOrder])
  @@index([planId, status])
  @@index([batchId])
  @@index([phase, status, executionOrder])
  @@index([nextRetryAt])
  @@map("work_items")
}

/// WorkItemDependency — DAG edges between work items.
///
/// Unlike the generic RequestDependency, these are ALWAYS within the
/// context of a MasterPlan, making dependency resolution much faster.
model WorkItemDependency {
  id            BigInt   @id @default(autoincrement())
  dependentId   String   @map("dependent_id")   /// The item that is WAITING
  dependencyId  String   @map("dependency_id")  /// The item that must COMPLETE first
  isHard        Boolean  @default(true) @map("is_hard")
  reason        String?

  dependent     WorkItem @relation("ItemDependents", fields: [dependentId], references: [id])
  dependency    WorkItem @relation("ItemDependencies", fields: [dependencyId], references: [id])

  @@unique([dependentId, dependencyId])
  @@index([dependencyId])
  @@map("work_item_dependencies")
}

// ─── Checkpoint & Resume ─────────────────────────────────────────────────────

/// GenerationCheckpoint — Crash-safe progress tracking.
///
/// Every completed API call is checkpointed. If the process dies at
/// work item #1,842, restart picks up at #1,843.
///
/// This is separate from WorkItem status because checkpoints are
/// written SYNCHRONOUSLY before the transaction commits, while
/// WorkItem status updates happen in the normal async flow.
model GenerationCheckpoint {
  id            BigInt   @id @default(autoincrement())
  planId        String   @map("plan_id")
  workItemId    String   @map("work_item_id")
  phase         PipelinePhase
  completedAt   DateTime @default(now()) @map("completed_at")

  /// Snapshot of what was produced
  resultSummary String?  @map("result_summary") /// Brief: "Generated 3 entries, 2 examples"

  @@index([planId, phase])
  @@index([planId, completedAt])
  @@map("generation_checkpoints")
}

// ─── Wave Configuration ──────────────────────────────────────────────────────

/// WaveConfig — Defines the generation wave order and cross-target dependencies.
///
/// ~10 rows. Configured once, drives the entire rollout strategy.
model WaveConfig {
  wave          Int      @id /// 1, 2, 3, 4
  name          String   /// "Foundation", "Related Formats", "Complex Assemblies", "Tools"
  description   String?
  targetIds     String[] @map("target_ids") /// ["python", "json", "png"]

  /// Expected reuse from previous waves
  expectedReusePercent Float @default(0.0) @map("expected_reuse_percent")

  /// Prerequisites: which waves must complete first
  prerequisiteWaves Int[] @map("prerequisite_waves") /// [1] for wave 2, [1,2] for wave 3

  metadata  Json     @default("{}")
  createdAt DateTime @default(now()) @map("created_at")

  @@map("wave_configs")
}
```

Now add the `MasterPlan` relation to the existing `Target` model:

```prisma
// Add to existing Target model:
model Target {
  // ... all existing fields ...

  // Add this relation:
  masterPlan     MasterPlan?
}
```

---

## The Engine Implementation

### Part 1: The Coverage Analyzer

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// coverage-analyzer.ts
//
// The FIRST thing that runs before any generation. Builds a complete picture
// of what the database already knows about a target, what's missing, and
// what can be reused from other targets.
//
// This is the intelligence that prevents blind, wasteful generation.
// ═══════════════════════════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CoverageReport {
  targetId: string;
  assessedAt: Date;

  // What already exists
  existing: {
    entries: number;
    entriesByType: Record<string, number>;
    entriesByDepth: Record<number, number>;
    atoms: number;
    capabilities: number;
    blueprints: number;
    examples: number;
    relations: number;
    topicNodes: number;
    completenessAnchors: number;
  };

  // What should exist (estimated)
  estimated: {
    totalEntries: number;
    totalAtoms: number;
    totalCapabilities: number;
    totalBlueprints: number;
    totalExamples: number;
  };

  // Coverage percentages by category
  coverageByCategory: Record<string, {
    existing: number;
    estimated: number;
    percentage: number;
  }>;

  // Overall coverage
  overallCoverage: number;

  // What can be reused from other targets
  reusable: {
    algorithms: Array<{
      id: string;
      name: string;
      sourceTarget: string;
      reuseType: 'FULL_REUSE' | 'PARTIAL_REUSE';
    }>;
    concepts: Array<{
      id: string;
      name: string;
      hasEntries: boolean;
    }>;
    familySharedEntries: Array<{
      id: string;
      path: string;
      sourceTarget: string;
    }>;
  };

  // Quality assessment of existing content
  quality: {
    entriesWithAllResolutions: number;    // Have micro + standard + exhaustive
    entriesWithExamples: number;
    entriesWithEdgeCases: number;
    averageConfidence: number;
    staleEntries: number;                 // Confidence < 0.5 or old
  };

  // Gaps identified
  gaps: Array<{
    category: string;
    description: string;
    severity: 'critical' | 'moderate' | 'minor';
    estimatedWorkItems: number;
  }>;
}

/**
 * Analyze the current state of the database for a specific target.
 *
 * This is the most important function in the entire pipeline. It prevents
 * duplicate work and enables intelligent planning. Runs in ~2 seconds
 * even at scale because it uses aggregate queries, not row scans.
 */
async function analyzeCoverage(targetId: string): Promise<CoverageReport> {
  const target = await prisma.target.findUniqueOrThrow({
    where: { id: targetId },
    include: { family: true },
  });

  // ── 1. Count what exists ──────────────────────────────────────────────
  const [
    entryCount,
    entriesByType,
    atomCount,
    capabilityCount,
    blueprintCount,
    exampleCount,
    relationCount,
    topicNodeCount,
    anchorCount,
  ] = await Promise.all([
    prisma.entry.count({ where: { targetId } }),
    prisma.entry.groupBy({
      by: ['entryType'],
      where: { targetId },
      _count: true,
    }),
    prisma.atom.count({ where: { targetId } }),
    prisma.capability.count({ where: { targetId } }),
    prisma.blueprint.count({ where: { targetId } }),
    prisma.example.count({
      where: { entry: { targetId } },
    }),
    prisma.relation.count({
      where: {
        OR: [
          { sourceId: targetId, sourceType: 'target' },
          { relTargetId: targetId, relTargetType: 'target' },
        ],
      },
    }),
    prisma.topicNode.count({ where: { targetId } }),
    prisma.completenessAnchor.count({ where: { targetId } }),
  ]);

  // ── 2. Assess quality of existing entries ─────────────────────────────
  const qualityStats = await prisma.entry.aggregate({
    where: { targetId },
    _avg: { confidence: true },
    _count: true,
  });

  const entriesWithAllResolutions = await prisma.entry.count({
    where: {
      targetId,
      contentMicro: { not: null },
      contentStandard: { not: null },
      contentExhaustive: { not: null },
    },
  });

  const entriesWithExamples = await prisma.entry.count({
    where: {
      targetId,
      examples: { some: {} },
    },
  });

  const staleEntries = await prisma.entry.count({
    where: {
      targetId,
      OR: [
        { confidence: { lt: 0.5 } },
        { generatedAt: { lt: new Date(Date.now() - 180 * 86_400_000) } }, // > 6 months
      ],
    },
  });

  // ── 3. Check completeness anchors for gap analysis ────────────────────
  const anchors = await prisma.completenessAnchor.findMany({
    where: { targetId },
  });

  const gaps: CoverageReport['gaps'] = [];

  for (const anchor of anchors) {
    const items = anchor.items as string[];
    const missing = anchor.missingItems as string[];

    if (missing.length > 0) {
      gaps.push({
        category: anchor.anchorType,
        description: `${missing.length} of ${items.length} ${anchor.anchorType} not yet documented`,
        severity: missing.length > items.length * 0.5 ? 'critical' :
                  missing.length > items.length * 0.2 ? 'moderate' : 'minor',
        estimatedWorkItems: missing.length,
      });
    }
  }

  // ── 4. Find what's available from existing topic tree ─────────────────
  const topicDepthStats = await prisma.topicNode.groupBy({
    by: ['depth'],
    where: { targetId },
    _count: true,
  });

  const ungeneratedTopics = await prisma.topicNode.count({
    where: { targetId, isGenerated: false },
  });

  if (ungeneratedTopics > 0 && topicNodeCount > 0) {
    gaps.push({
      category: 'topic_tree',
      description: `${ungeneratedTopics} topic nodes have no generated entries`,
      severity: ungeneratedTopics > topicNodeCount * 0.5 ? 'critical' : 'moderate',
      estimatedWorkItems: ungeneratedTopics,
    });
  }

  // ── 5. Estimate what SHOULD exist ─────────────────────────────────────
  const estimated = estimateTargetSize(target.kind, target.traits as any);

  // ── 6. Find cross-target reuse opportunities ──────────────────────────
  const reusable = await findReusableContent(targetId, target.familyId, target.kind);

  // ── 7. Compute coverage by category ───────────────────────────────────
  const entryPaths = await prisma.entry.findMany({
    where: { targetId },
    select: { path: true },
  });

  const coverageByCategory = computeCategoryBreakdown(
    entryPaths.map(e => e.path),
    estimated.totalEntries,
  );

  // ── 8. Compile the report ─────────────────────────────────────────────
  const overallCoverage = entryCount > 0
    ? Math.min(entryCount / estimated.totalEntries, 1.0)
    : 0.0;

  return {
    targetId,
    assessedAt: new Date(),
    existing: {
      entries: entryCount,
      entriesByType: Object.fromEntries(
        entriesByType.map(g => [g.entryType, g._count]),
      ),
      entriesByDepth: Object.fromEntries(
        topicDepthStats.map(g => [g.depth, g._count]),
      ),
      atoms: atomCount,
      capabilities: capabilityCount,
      blueprints: blueprintCount,
      examples: exampleCount,
      relations: relationCount,
      topicNodes: topicNodeCount,
      completenessAnchors: anchorCount,
    },
    estimated,
    coverageByCategory,
    overallCoverage,
    reusable,
    quality: {
      entriesWithAllResolutions,
      entriesWithExamples,
      entriesWithEdgeCases: 0, // computed separately
      averageConfidence: qualityStats._avg.confidence ?? 0,
      staleEntries,
    },
    gaps,
  };
}

/**
 * Find content from other targets that this target can reuse.
 *
 * This is how the wave system pays off:
 *   - Python (Wave 1) generates "iteration" concept + entries
 *   - JavaScript (Wave 2) can reuse the concept, needs only JS-specific entries
 *   - PPTX (Wave 3) can reuse DEFLATE algorithm from PNG (Wave 1)
 */
async function findReusableContent(
  targetId: string,
  familyId: string | null,
  targetKind: string,
): Promise<CoverageReport['reusable']> {
  // 1. Algorithms are target-agnostic — find all that might be relevant
  const allAlgorithms = await prisma.algorithm.findMany({
    select: { id: true, name: true, category: true, domain: true },
  });

  // 2. If this target is in a family, find shared content from siblings
  let familySharedEntries: CoverageReport['reusable']['familySharedEntries'] = [];
  if (familyId) {
    const family = await prisma.family.findUnique({
      where: { id: familyId },
      select: { sharedEntryIds: true },
    });

    if (family?.sharedEntryIds.length) {
      const siblingTargets = await prisma.target.findMany({
        where: { familyId, id: { not: targetId } },
        select: { id: true },
      });

      // Find entries from siblings that map to shared concepts
      const siblingEntries = await prisma.entry.findMany({
        where: {
          targetId: { in: siblingTargets.map(t => t.id) },
          conceptId: { not: null },
        },
        select: { id: true, path: true, targetId: true, conceptId: true },
        take: 100, // Don't load everything
      });

      familySharedEntries = siblingEntries.map(e => ({
        id: e.id,
        path: e.path,
        sourceTarget: e.targetId,
      }));
    }
  }

  // 3. Find universal concepts that already have entries in other targets
  const concepts = await prisma.concept.findMany({
    include: {
      entries: {
        where: { targetId: { not: targetId } },
        select: { id: true },
        take: 1,
      },
    },
  });

  return {
    algorithms: allAlgorithms.map(a => ({
      id: a.id,
      name: a.name,
      sourceTarget: 'universal',
      reuseType: 'FULL_REUSE' as const,
    })),
    concepts: concepts.map(c => ({
      id: c.id,
      name: c.name,
      hasEntries: c.entries.length > 0,
    })),
    familySharedEntries,
  };
}

/**
 * Estimate how many entries/atoms/etc a target SHOULD have based on its type.
 *
 * These are rough heuristics refined over time. They give the coverage
 * analyzer a denominator for percentage calculations.
 */
function estimateTargetSize(kind: string, traits: Record<string, any>): {
  totalEntries: number;
  totalAtoms: number;
  totalCapabilities: number;
  totalBlueprints: number;
  totalExamples: number;
} {
  const estimates: Record<string, any> = {
    PROGRAMMING_LANGUAGE: {
      totalEntries: 500,
      totalAtoms: 50,
      totalCapabilities: 150,
      totalBlueprints: 20,
      totalExamples: 1500,
    },
    MARKUP_LANGUAGE: {
      totalEntries: 200,
      totalAtoms: 300,
      totalCapabilities: 80,
      totalBlueprints: 10,
      totalExamples: 600,
    },
    FILE_FORMAT: {
      totalEntries: 150,
      totalAtoms: 500,
      totalCapabilities: 100,
      totalBlueprints: 15,
      totalExamples: 400,
    },
    DATA_FORMAT: {
      totalEntries: 100,
      totalAtoms: 200,
      totalCapabilities: 50,
      totalBlueprints: 5,
      totalExamples: 300,
    },
  };

  return estimates[kind] ?? estimates.DATA_FORMAT;
}

function computeCategoryBreakdown(
  existingPaths: string[],
  totalEstimated: number,
): Record<string, { existing: number; estimated: number; percentage: number }> {
  // Group paths by their top-level category (second segment)
  const categories: Record<string, number> = {};

  for (const path of existingPaths) {
    const segments = path.split('/');
    const category = segments.length > 1 ? segments[1] : 'uncategorized';
    categories[category] = (categories[category] ?? 0) + 1;
  }

  // Distribute estimated total across known categories
  const categoryCount = Math.max(Object.keys(categories).length, 1);
  const estimatedPerCategory = Math.ceil(totalEstimated / categoryCount);

  const result: Record<string, { existing: number; estimated: number; percentage: number }> = {};

  for (const [cat, count] of Object.entries(categories)) {
    result[cat] = {
      existing: count,
      estimated: estimatedPerCategory,
      percentage: Math.min(count / estimatedPerCategory, 1.0),
    };
  }

  return result;
}
```

### Part 2: The Planning Engine

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// planning-engine.ts
//
// Takes the CoverageReport and builds a MasterPlan with all WorkItems.
// Every API call is planned BEFORE execution. This means:
//   - Total cost can be estimated upfront
//   - The plan can be reviewed before spending money
//   - Deduplication decisions are made at planning time, not runtime
//   - Dependencies are resolved once, not discovered dynamically
// ═══════════════════════════════════════════════════════════════════════════════

import { PrismaClient, PipelinePhase, ModelTier, WorkItemReason } from '@prisma/client';

const prisma = new PrismaClient();

interface PlanningResult {
  planId: string;
  totalWorkItems: number;
  estimatedApiCalls: number;  // After dedup: fewer than totalWorkItems
  estimatedCostUsd: number;
  skippedByDedup: number;
  workItemsByPhase: Record<string, number>;
}

/**
 * Build a complete generation plan for a target.
 *
 * This is the "think before you act" step. The plan includes:
 *   1. All work items needed, organized by phase
 *   2. Dependencies between work items
 *   3. Deduplication decisions (reuse vs generate)
 *   4. Model tier assignments (cheap vs mid vs expensive)
 *   5. Prompt contexts pre-built for every item
 *   6. Cost estimate
 *
 * The plan can be inspected, modified, and approved before execution.
 */
async function buildMasterPlan(
  targetId: string,
  coverage: CoverageReport,
): Promise<PlanningResult> {

  // Create the plan record
  const plan = await prisma.masterPlan.create({
    data: {
      targetId,
      status: 'ANALYZING',
      coverageSnapshot: coverage as any,
      wave: await determineWave(targetId),
      estimatedCostUsd: 0,
    },
  });

  const workItems: Array<{
    phase: PipelinePhase;
    entityType: string;
    title: string;
    path?: string;
    modelTier: ModelTier;
    reason: WorkItemReason;
    promptContext: Record<string, any>;
    dedup: { action: string; source?: string; notes?: string };
    executionOrder: number;
    dependsOn: string[];  // titles of other work items
  }> = [];

  let executionOrder = 0;

  // ── Phase 1: DECOMPOSE (only if no topic tree exists) ─────────────────

  if (coverage.existing.topicNodes === 0) {
    workItems.push({
      phase: 'DECOMPOSE_TOPIC_TREE',
      entityType: 'topic_node',
      title: `Decompose: ${targetId} root`,
      modelTier: 'CHEAP',
      reason: 'INITIAL_PLAN',
      promptContext: buildDecomposePrompt(targetId, coverage),
      dedup: { action: 'NONE' },
      executionOrder: executionOrder++,
      dependsOn: [],
    });
  } else if (coverage.gaps.some(g => g.category === 'topic_tree')) {
    // Topic tree exists but has gaps — only decompose missing branches
    const ungeneratedNodes = await prisma.topicNode.findMany({
      where: { targetId, isGenerated: false },
      select: { id: true, title: true, path: true },
    });

    // No need to re-decompose; we'll handle missing nodes in Phase 3
  }

  // ── Phase 2: ENUMERATE ANCHORS (only if none exist) ───────────────────

  const anchorTypes = getAnchorTypesForTarget(coverage);
  const existingAnchorTypes = await prisma.completenessAnchor.findMany({
    where: { targetId },
    select: { anchorType: true },
  });
  const existingAnchorSet = new Set(existingAnchorTypes.map(a => a.anchorType));

  for (const anchorType of anchorTypes) {
    if (existingAnchorSet.has(anchorType)) continue; // Already have this anchor

    workItems.push({
      phase: 'ENUMERATE_ANCHORS',
      entityType: 'completeness_anchor',
      title: `Anchor: ${targetId}/${anchorType}`,
      path: `${targetId}/${anchorType}`,
      modelTier: 'CHEAP',
      reason: 'INITIAL_PLAN',
      promptContext: buildAnchorPrompt(targetId, anchorType, coverage),
      dedup: { action: 'NONE' },
      executionOrder: executionOrder++,
      dependsOn: [],
    });
  }

  // ── Phase 3: GENERATE REFERENCE (the big one) ─────────────────────────

  // Get the topic tree (existing or will be created by Phase 1)
  const topicNodes = await prisma.topicNode.findMany({
    where: { targetId, isGenerated: false },
    orderBy: { depth: 'asc' },
  });

  // For each ungenerated topic, create a work item
  for (const node of topicNodes) {
    // Check deduplication: does this content already exist?
    const existingEntry = await prisma.entry.findFirst({
      where: { targetId, path: node.path },
    });

    if (existingEntry) {
      // Content exists — check if it needs refresh
      if (existingEntry.confidence >= 0.7 && !isStale(existingEntry)) {
        workItems.push({
          phase: 'GENERATE_REFERENCE',
          entityType: 'entry',
          title: `Entry: ${node.path}`,
          path: node.path,
          modelTier: 'MID',
          reason: 'INITIAL_PLAN',
          promptContext: {},
          dedup: {
            action: 'FULL_REUSE',
            source: existingEntry.id,
            notes: `Existing entry with confidence ${existingEntry.confidence}`,
          },
          executionOrder: executionOrder++,
          dependsOn: [],
        });
        continue;
      }
    }

    // Check cross-target reuse
    const crossTargetMatch = await findCrossTargetContent(node.path, targetId, coverage);

    workItems.push({
      phase: 'GENERATE_REFERENCE',
      entityType: 'entry',
      title: `Entry: ${node.path}`,
      path: node.path,
      modelTier: 'MID',
      reason: 'INITIAL_PLAN',
      promptContext: buildEntryPrompt(targetId, node, coverage, crossTargetMatch),
      dedup: crossTargetMatch
        ? {
            action: 'CROSS_TARGET_LINK',
            source: crossTargetMatch.entryId,
            notes: `Similar entry exists in ${crossTargetMatch.sourceTarget}`,
          }
        : { action: 'NONE' },
      executionOrder: executionOrder++,
      dependsOn: node.depth > 0
        ? [`Entry: ${node.path.split('/').slice(0, -1).join('/')}`]
        : [],
    });
  }

  // ── Phase 4 + 5: GAP ANALYSIS + FILL ─────────────────────────────────
  // These are created dynamically AFTER phases 1-3 complete.
  // We create placeholder work items to track the phase.

  workItems.push({
    phase: 'GAP_ANALYSIS',
    entityType: 'analysis',
    title: `Gap analysis: ${targetId}`,
    modelTier: 'CHEAP',
    reason: 'INITIAL_PLAN',
    promptContext: { targetId, description: 'Runs after Phase 3 completes' },
    dedup: { action: 'NONE' },
    executionOrder: executionOrder++,
    dependsOn: [],  // All Phase 3 items (resolved at execution time)
  });

  // ── Phase 6: VALIDATE ─────────────────────────────────────────────────

  workItems.push({
    phase: 'VALIDATE_ACCURACY',
    entityType: 'validation',
    title: `Validate: ${targetId} (statistical sample)`,
    modelTier: 'EXPENSIVE',
    reason: 'INITIAL_PLAN',
    promptContext: { targetId, sampleSize: 20, description: 'Cross-model validation' },
    dedup: { action: 'NONE' },
    executionOrder: executionOrder++,
    dependsOn: [`Gap analysis: ${targetId}`],
  });

  // ── Phases 7-12: IMPLEMENTATION LAYER ─────────────────────────────────
  // Only planned for file formats and complex targets, not simple data formats

  if (['FILE_FORMAT', 'PROGRAMMING_LANGUAGE'].includes(
    (await prisma.target.findUnique({ where: { id: targetId } }))?.kind ?? '',
  )) {
    // Phase 7: Enumerate capabilities
    workItems.push({
      phase: 'ENUMERATE_CAPABILITIES',
      entityType: 'capability',
      title: `Enumerate capabilities: ${targetId}`,
      modelTier: 'MID',
      reason: 'INITIAL_PLAN',
      promptContext: buildCapabilitiesPrompt(targetId, coverage),
      dedup: { action: 'NONE' },
      executionOrder: executionOrder++,
      dependsOn: [`Validate: ${targetId} (statistical sample)`],
    });

    // Phase 8: Extract atoms
    workItems.push({
      phase: 'EXTRACT_ATOMS',
      entityType: 'atom',
      title: `Extract atoms: ${targetId}`,
      modelTier: 'MID',
      reason: 'INITIAL_PLAN',
      promptContext: buildAtomsPrompt(targetId, coverage),
      dedup: { action: 'NONE' },
      executionOrder: executionOrder++,
      dependsOn: [`Enumerate capabilities: ${targetId}`],
    });

    // Phase 9: Extract algorithms (heavily deduplicated)
    const neededAlgorithms = await identifyNeededAlgorithms(targetId, coverage);

    for (const algo of neededAlgorithms) {
      const existingAlgo = await prisma.algorithm.findUnique({
        where: { id: algo.id },
      });

      workItems.push({
        phase: 'EXTRACT_ALGORITHMS',
        entityType: 'algorithm',
        title: `Algorithm: ${algo.name}`,
        modelTier: 'MID',
        reason: 'INITIAL_PLAN',
        promptContext: buildAlgorithmPrompt(algo, coverage),
        dedup: existingAlgo
          ? { action: 'FULL_REUSE', source: existingAlgo.id, notes: 'Algorithm already exists' }
          : { action: 'NONE' },
        executionOrder: executionOrder++,
        dependsOn: [`Extract atoms: ${targetId}`],
      });
    }

    // Phases 10-12 follow the same pattern...
    workItems.push({
      phase: 'GENERATE_IMPL_SPECS',
      entityType: 'capability',
      title: `Implementation specs: ${targetId}`,
      modelTier: 'MID',
      reason: 'INITIAL_PLAN',
      promptContext: {},
      dedup: { action: 'NONE' },
      executionOrder: executionOrder++,
      dependsOn: [`Algorithm: *`],  // All algorithm items
    });

    workItems.push({
      phase: 'ASSEMBLE_BLUEPRINTS',
      entityType: 'blueprint',
      title: `Blueprints: ${targetId}`,
      modelTier: 'MID',
      reason: 'INITIAL_PLAN',
      promptContext: {},
      dedup: { action: 'NONE' },
      executionOrder: executionOrder++,
      dependsOn: [`Implementation specs: ${targetId}`],
    });

    workItems.push({
      phase: 'VALIDATE_IMPLEMENTATIONS',
      entityType: 'validation',
      title: `Validate implementations: ${targetId}`,
      modelTier: 'EXPENSIVE',
      reason: 'INITIAL_PLAN',
      promptContext: { sandboxExecution: true },
      dedup: { action: 'NONE' },
      executionOrder: executionOrder++,
      dependsOn: [`Blueprints: ${targetId}`],
    });
  }

  // ── Persist all work items ────────────────────────────────────────────

  const createdItems = new Map<string, string>(); // title → id

  // Compute dedup savings
  const skippedByDedup = workItems.filter(
    w => w.dedup.action !== 'NONE',
  ).length;

  const estimatedApiCalls = workItems.length - skippedByDedup;
  const estimatedCost = estimateWorkItemsCost(workItems);

  // Create work items in batch
  for (const item of workItems) {
    const created = await prisma.workItem.create({
      data: {
        planId: plan.id,
        phase: item.phase,
        status: item.dedup.action === 'FULL_REUSE' ? 'SKIPPED' : 'NOT_STARTED',
        entityType: item.entityType,
        title: item.title,
        path: item.path,
        reason: item.reason,
        deduplicationAction: item.dedup.action as any,
        deduplicationSource: item.dedup.source,
        deduplicationNotes: item.dedup.notes,
        modelTier: item.modelTier,
        promptContext: item.promptContext,
        executionOrder: item.executionOrder,
      },
    });

    createdItems.set(item.title, created.id);
  }

  // Wire up dependencies
  for (const item of workItems) {
    if (item.dependsOn.length === 0) continue;

    const itemId = createdItems.get(item.title);
    if (!itemId) continue;

    for (const depTitle of item.dependsOn) {
      if (depTitle.includes('*')) {
        // Wildcard dependency: depends on all items matching pattern
        const prefix = depTitle.replace('*', '');
        for (const [title, id] of createdItems) {
          if (title.startsWith(prefix) && id !== itemId) {
            await prisma.workItemDependency.create({
              data: {
                dependentId: itemId,
                dependencyId: id,
                isHard: true,
                reason: `Wildcard: ${depTitle}`,
              },
            });
          }
        }
      } else {
        const depId = createdItems.get(depTitle);
        if (depId) {
          await prisma.workItemDependency.create({
            data: {
              dependentId: itemId,
              dependencyId: depId,
              isHard: true,
              reason: `Phase ordering`,
            },
          });
        }
      }
    }
  }

  // Mark blocked items
  const itemsWithDeps = await prisma.workItemDependency.findMany({
    select: { dependentId: true },
    distinct: ['dependentId'],
  });

  if (itemsWithDeps.length > 0) {
    await prisma.workItem.updateMany({
      where: {
        id: { in: itemsWithDeps.map(d => d.dependentId) },
        status: 'NOT_STARTED',
      },
      data: { status: 'BLOCKED' },
    });
  }

  // Mark items with no deps as READY
  const itemsWithoutDeps = workItems
    .filter(w => w.dependsOn.length === 0 && w.dedup.action !== 'FULL_REUSE')
    .map(w => createdItems.get(w.title))
    .filter(Boolean) as string[];

  if (itemsWithoutDeps.length > 0) {
    await prisma.workItem.updateMany({
      where: { id: { in: itemsWithoutDeps } },
      data: { status: 'READY' },
    });
  }

  // Update the plan
  const workItemsByPhase: Record<string, number> = {};
  for (const item of workItems) {
    workItemsByPhase[item.phase] = (workItemsByPhase[item.phase] ?? 0) + 1;
  }

  await prisma.masterPlan.update({
    where: { id: plan.id },
    data: {
      status: 'READY',
      estimatedCostUsd: estimatedCost,
      phaseProgress: Object.fromEntries(
        Object.entries(workItemsByPhase).map(([phase, count]) => [
          phase,
          {
            status: 'NOT_STARTED',
            items: count,
            completed: 0,
            skipped: workItems.filter(
              w => w.phase === phase && w.dedup.action !== 'NONE',
            ).length,
          },
        ]),
      ),
    },
  });

  return {
    planId: plan.id,
    totalWorkItems: workItems.length,
    estimatedApiCalls,
    estimatedCostUsd: estimatedCost,
    skippedByDedup,
    workItemsByPhase,
  };
}

// ─── Prompt builders ─────────────────────────────────────────────────────────

function buildDecomposePrompt(
  targetId: string,
  coverage: CoverageReport,
): Record<string, any> {
  return {
    system: `You are a technical taxonomy expert. Decompose the given target into a hierarchical topic tree. Return JSON.`,
    instruction: `Decompose "${targetId}" into a complete hierarchical topic tree.

Requirements:
- Root node is the target name
- 8-15 top-level categories
- Each category should have 3-20 subtopics
- Leaf nodes should be individual documentable concepts
- Include EVERY feature, not just common ones

Return as JSON: { nodes: [{ title, path, depth, children: [...] }] }`,
    existingCategories: Object.keys(coverage.coverageByCategory),
    targetKind: coverage.targetId,
  };
}

function buildAnchorPrompt(
  targetId: string,
  anchorType: string,
  coverage: CoverageReport,
): Record<string, any> {
  const anchorInstructions: Record<string, string> = {
    keywords: `List EVERY reserved keyword in ${targetId}. Include soft keywords. Be exhaustive.`,
    builtins: `List EVERY built-in function/type in ${targetId}. Include those rarely used.`,
    stdlib_modules: `List EVERY standard library module in ${targetId}. Include deprecated ones.`,
    operators: `List EVERY operator in ${targetId}. Include augmented assignment and special operators.`,
    types: `List EVERY built-in type in ${targetId}. Include abstract base classes.`,
    elements: `List EVERY XML element/tag in ${targetId}. Include namespace prefixes.`,
    binary_markers: `List EVERY binary marker/magic number in ${targetId}.`,
  };

  return {
    system: `You are a specification expert. Generate exhaustive, verifiable lists. Completeness is more important than explanations.`,
    instruction: anchorInstructions[anchorType] ?? `List every ${anchorType} in ${targetId}.`,
    format: `Return as JSON: { items: ["item1", "item2", ...], total_count: N, source: "spec version" }`,
  };
}

function buildEntryPrompt(
  targetId: string,
  node: { title: string; path: string; depth: number },
  coverage: CoverageReport,
  crossTargetMatch: { entryId: string; sourceTarget: string; content: string } | null,
): Record<string, any> {
  const context: Record<string, any> = {
    system: `You are a technical documentation expert generating structured knowledge entries.`,
    instruction: `Generate a complete knowledge entry for: "${node.path}"

Return JSON matching this schema:
{
  "content_micro": "~50 token summary",
  "content_standard": "~500 token explanation with syntax and usage",
  "content_exhaustive": "~2000 token deep dive with internals and edge cases",
  "syntax": "formal syntax if applicable",
  "parameters": [{ "name": "", "type": "", "required": true, "description": "", "default": null }],
  "return_value": "description if applicable",
  "edge_cases": ["case1", "case2"],
  "common_mistakes": ["mistake1", "mistake2"],
  "examples": [
    { "title": "", "code": "", "language": "${targetId}", "explanation": "", "expected_output": "", "complexity": "BASIC" }
  ]
}`,
    targetInfo: {
      id: targetId,
      path: node.path,
      depth: node.depth,
    },
  };

  // If we have a cross-target match, include it as reference
  if (crossTargetMatch) {
    context.crossReference = {
      sourceTarget: crossTargetMatch.sourceTarget,
      sourceContent: crossTargetMatch.content,
      instruction: `A similar concept exists in ${crossTargetMatch.sourceTarget}. 
Use it as reference but generate ${targetId}-specific content. 
Highlight differences.`,
    };
  }

  return context;
}

// ─── Cost estimation ─────────────────────────────────────────────────────────

function estimateWorkItemsCost(
  items: Array<{ modelTier: ModelTier; dedup: { action: string } }>,
): number {
  const costPerCall: Record<ModelTier, number> = {
    CHEAP: 0.003,     // ~1K input + 1K output at haiku/mini rates
    MID: 0.015,       // ~1K input + 2K output at sonnet rates
    EXPENSIVE: 0.06,  // ~2K input + 2K output at opus/o1 rates
  };

  return items.reduce((total, item) => {
    if (item.dedup.action === 'FULL_REUSE') return total;
    return total + (costPerCall[item.modelTier] ?? 0.015);
  }, 0);
}

// ─── Helper functions ────────────────────────────────────────────────────────

function getAnchorTypesForTarget(coverage: CoverageReport): string[] {
  // Different target kinds need different anchor types
  const base = ['keywords', 'types'];

  // Could use coverage.targetId to look up the kind, simplified here
  return [...base, 'builtins', 'operators', 'stdlib_modules'];
}

async function findCrossTargetContent(
  path: string,
  targetId: string,
  coverage: CoverageReport,
): Promise<{ entryId: string; sourceTarget: string; content: string } | null> {
  // Extract the concept-level path (remove target prefix)
  const segments = path.split('/');
  if (segments.length < 2) return null;

  const conceptPath = segments.slice(1).join('/');

  // Look for entries in other targets with similar paths
  const match = await prisma.entry.findFirst({
    where: {
      targetId: { not: targetId },
      path: { contains: conceptPath },
      confidence: { gte: 0.7 },
    },
    select: {
      id: true,
      targetId: true,
      contentStandard: true,
    },
  });

  if (!match) return null;

  return {
    entryId: match.id,
    sourceTarget: match.targetId,
    content: match.contentStandard ?? '',
  };
}

async function identifyNeededAlgorithms(
  targetId: string,
  coverage: CoverageReport,
): Promise<Array<{ id: string; name: string }>> {
  // This would be more sophisticated in production — analyzing
  // the target's capabilities to determine which algorithms are needed
  return [];
}

function isStale(entry: { generatedAt: Date | null; confidence: number }): boolean {
  if (!entry.generatedAt) return true;
  const ageMs = Date.now() - entry.generatedAt.getTime();
  const sixMonths = 180 * 86_400_000;
  return ageMs > sixMonths || entry.confidence < 0.5;
}

async function determineWave(targetId: string): Promise<number> {
  const waveConfig = await prisma.waveConfig.findFirst({
    where: { targetIds: { has: targetId } },
    select: { wave: true },
  });
  return waveConfig?.wave ?? 99;
}
```

### Part 3: The Execution Engine

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// execution-engine.ts
//
// Processes work items from a MasterPlan. Every API call goes through
// this single pipeline:
//
//   CLAIM → BUILD PROMPT → CALL API → PARSE → VALIDATE → COMMIT → PROPAGATE
//
// The engine is crash-safe: every step is checkpointed. If the process
// dies, restart picks up exactly where it left off.
// ═══════════════════════════════════════════════════════════════════════════════

import { PrismaClient, WorkItem, WorkItemStatus, MasterPlan } from '@prisma/client';

const prisma = new PrismaClient();

// ─── The Response Parser (5-strategy fallback) ──────────────────────────────

interface ParseResult {
  success: boolean;
  data: any;
  strategy: string;
  error?: string;
}

/**
 * The 5-strategy parser from the spec. LLMs frequently return broken JSON.
 * Each strategy is more aggressive than the last.
 */
function parseResponse(raw: string): ParseResult {
  // Strategy 1: Direct parse
  try {
    return { success: true, data: JSON.parse(raw), strategy: 'direct' };
  } catch {}

  // Strategy 2: Code fence extraction
  const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) {
    try {
      return { success: true, data: JSON.parse(fenceMatch[1]), strategy: 'fence' };
    } catch {}
  }

  // Strategy 3: Boundary extraction (find outermost {} or [])
  const firstBrace = raw.indexOf('{');
  const firstBracket = raw.indexOf('[');
  const start = firstBrace >= 0 && (firstBracket < 0 || firstBrace < firstBracket)
    ? firstBrace : firstBracket;

  if (start >= 0) {
    const opener = raw[start];
    const closer = opener === '{' ? '}' : ']';
    const lastClose = raw.lastIndexOf(closer);

    if (lastClose > start) {
      const extracted = raw.substring(start, lastClose + 1);
      try {
        return { success: true, data: JSON.parse(extracted), strategy: 'boundary' };
      } catch {}
    }
  }

  // Strategy 4: Cleaned parse (fix common LLM JSON errors)
  let cleaned = raw;
  // Remove trailing commas before } or ]
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
  // Remove // single-line comments
  cleaned = cleaned.replace(/\/\/[^\n]*/g, '');
  // Remove /* multi-line comments */
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
  // Fix single quotes to double quotes (careful with apostrophes)
  cleaned = cleaned.replace(/(?<=[{,[\s])'|'(?=[}\],:\s])/g, '"');

  // Re-extract boundaries from cleaned text
  const cleanStart = cleaned.indexOf('{') >= 0 ? cleaned.indexOf('{') : cleaned.indexOf('[');
  if (cleanStart >= 0) {
    const cleanOpener = cleaned[cleanStart];
    const cleanCloser = cleanOpener === '{' ? '}' : ']';
    const cleanEnd = cleaned.lastIndexOf(cleanCloser);

    if (cleanEnd > cleanStart) {
      try {
        return {
          success: true,
          data: JSON.parse(cleaned.substring(cleanStart, cleanEnd + 1)),
          strategy: 'cleaned',
        };
      } catch {}
    }
  }

  // Strategy 5: Truncation repair (LLM hit max tokens mid-JSON)
  try {
    const repaired = repairTruncatedJson(cleaned);
    if (repaired) {
      return { success: true, data: JSON.parse(repaired), strategy: 'truncation_repair' };
    }
  } catch {}

  return {
    success: false,
    data: null,
    strategy: 'all_failed',
    error: `All 5 parse strategies failed. Raw length: ${raw.length}`,
  };
}

/**
 * Attempt to repair JSON that was cut off mid-generation.
 * Counts unclosed brackets/braces and closes them.
 */
function repairTruncatedJson(text: string): string | null {
  const start = text.indexOf('{') >= 0 ? text.indexOf('{') : text.indexOf('[');
  if (start < 0) return null;

  let json = text.substring(start);

  // Remove any trailing partial string (cut off mid-value)
  // Find last complete key-value pair
  const lastCompleteComma = json.lastIndexOf(',');
  const lastCompleteColon = json.lastIndexOf(':');

  if (lastCompleteComma > lastCompleteColon) {
    // Might have a trailing partial value after the last comma
    const afterComma = json.substring(lastCompleteComma + 1).trim();
    if (afterComma && !afterComma.startsWith('"') && !afterComma.match(/^[\d\[{tfn]/)) {
      json = json.substring(0, lastCompleteComma);
    }
  }

  // Count unclosed brackets/braces
  let braces = 0;
  let brackets = 0;
  let inString = false;
  let escape = false;

  for (const char of json) {
    if (escape) { escape = false; continue; }
    if (char === '\\') { escape = true; continue; }
    if (char === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (char === '{') braces++;
    if (char === '}') braces--;
    if (char === '[') brackets++;
    if (char === ']') brackets--;
  }

  // Close unclosed strings
  if (inString) json += '"';

  // Close unclosed brackets and braces
  json += ']'.repeat(Math.max(brackets, 0));
  json += '}'.repeat(Math.max(braces, 0));

  return json;
}

// ─── Model Router ───────────────────────────────────────────────────────────

interface ApiCallResult {
  raw: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

/**
 * Route a work item to the appropriate model based on its tier.
 */
async function callModel(
  tier: string,
  prompt: Record<string, any>,
): Promise<ApiCallResult> {
  const modelMap: Record<string, { model: string; provider: string }> = {
    CHEAP: { model: 'claude-3-haiku-20240307', provider: 'anthropic' },
    MID: { model: 'claude-sonnet-4-20250514', provider: 'anthropic' },
    EXPENSIVE: { model: 'claude-3-opus-20240229', provider: 'anthropic' },
  };

  const config = modelMap[tier] ?? modelMap.MID;

  // Actual API call would go here
  // This is a placeholder showing the interface
  const response = await callLLMApi({
    model: config.model,
    provider: config.provider,
    system: prompt.system,
    messages: [{ role: 'user', content: prompt.instruction }],
    maxTokens: prompt.max_tokens ?? 4000,
    temperature: 0.3,
  });

  return {
    raw: response.content,
    model: config.model,
    inputTokens: response.usage.inputTokens,
    outputTokens: response.usage.outputTokens,
    costUsd: computeCost(config.model, response.usage),
  };
}

// ─── The Main Execution Loop ─────────────────────────────────────────────────

/**
 * Execute a MasterPlan phase by phase.
 *
 * This is the top-level orchestrator. It:
 *   1. Processes phases in order
 *   2. Within each phase, processes work items by executionOrder
 *   3. After each phase, runs dynamic work item creation (gap fill, etc.)
 *   4. Respects budget limits
 *   5. Checkpoints after every completed item
 */
async function executePlan(planId: string): Promise<void> {
  const plan = await prisma.masterPlan.findUniqueOrThrow({
    where: { id: planId },
  });

  // Check budget before starting
  if (plan.actualCostUsd >= plan.maxBudgetUsd) {
    throw new BudgetExhaustedError(plan.actualCostUsd, plan.maxBudgetUsd);
  }

  await prisma.masterPlan.update({
    where: { id: planId },
    data: { status: 'IN_PROGRESS', startedAt: new Date() },
  });

  // Process phases in pipeline order
  const phaseOrder: PipelinePhase[] = [
    'DECOMPOSE_TOPIC_TREE',
    'ENUMERATE_ANCHORS',
    'GENERATE_REFERENCE',
    'GAP_ANALYSIS',
    'FILL_GAPS',
    'VALIDATE_ACCURACY',
    'ENUMERATE_CAPABILITIES',
    'EXTRACT_ATOMS',
    'EXTRACT_ALGORITHMS',
    'GENERATE_IMPL_SPECS',
    'ASSEMBLE_BLUEPRINTS',
    'VALIDATE_IMPLEMENTATIONS',
  ];

  for (const phase of phaseOrder) {
    await executePhase(planId, phase);

    // After certain phases, run dynamic work item creation
    if (phase === 'DECOMPOSE_TOPIC_TREE') {
      await createPhase3WorkItemsFromTopicTree(planId);
    }
    if (phase === 'GENERATE_REFERENCE') {
      await runGapAnalysisAndCreateFillItems(planId);
    }
  }

  await prisma.masterPlan.update({
    where: { id: planId },
    data: { status: 'COMPLETED', completedAt: new Date() },
  });
}

/**
 * Execute all work items in a single phase.
 */
async function executePhase(planId: string, phase: PipelinePhase): Promise<void> {
  // Update plan progress
  await prisma.masterPlan.update({
    where: { id: planId },
    data: { currentPhase: phase },
  });

  // Process items in executionOrder
  while (true) {
    // Check budget
    const plan = await prisma.masterPlan.findUniqueOrThrow({
      where: { id: planId },
      select: { actualCostUsd: true, maxBudgetUsd: true },
    });

    if (plan.actualCostUsd >= plan.maxBudgetUsd) {
      throw new BudgetExhaustedError(plan.actualCostUsd, plan.maxBudgetUsd);
    }

    // Claim next ready item (atomic to prevent races)
    const item = await prisma.$transaction(async (tx) => {
      const candidate = await tx.workItem.findFirst({
        where: { planId, phase, status: 'READY' },
        orderBy: { executionOrder: 'asc' },
      });

      if (!candidate) return null;

      return tx.workItem.update({
        where: { id: candidate.id },
        data: { status: 'IN_PROGRESS', startedAt: new Date() },
      });
    });

    if (!item) break; // No more ready items in this phase

    await processWorkItem(item);
  }

  // Check if any items are stuck as BLOCKED (dependency not met)
  const blockedCount = await prisma.workItem.count({
    where: { planId, phase, status: 'BLOCKED' },
  });

  if (blockedCount > 0) {
    console.warn(`Phase ${phase}: ${blockedCount} items still BLOCKED`);
  }
}

/**
 * Process a single work item through the full pipeline:
 *   CALL API → PARSE → VALIDATE → COMMIT → CHECKPOINT → PROPAGATE
 */
async function processWorkItem(item: WorkItem): Promise<void> {
  const planId = item.planId;

  try {
    // Skip if deduplicated
    if (item.deduplicationAction === 'FULL_REUSE') {
      await prisma.workItem.update({
        where: { id: item.id },
        data: { status: 'SKIPPED', completedAt: new Date() },
      });
      await propagateWorkItemCompletion(item.id);
      return;
    }

    // ── CALL API ──
    const prompt = item.promptContext as Record<string, any>;
    const apiResult = await callModel(item.modelTier, prompt);

    // ── PARSE ──
    const parseResult = parseResponse(apiResult.raw);

    if (!parseResult.success) {
      // Record parse failure
      const parseErrors = [...(item.parseErrors as any[]), {
        attempt: item.attemptCount,
        strategy: parseResult.strategy,
        error: parseResult.error,
        timestamp: new Date().toISOString(),
      }];

      if (item.attemptCount >= item.maxAttempts) {
        await prisma.workItem.update({
          where: { id: item.id },
          data: {
            status: 'FAILED',
            rawResponse: apiResult.raw,
            parseErrors,
            lastError: parseResult.error,
            costUsd: apiResult.costUsd,
            inputTokens: apiResult.inputTokens,
            outputTokens: apiResult.outputTokens,
            completedAt: new Date(),
          },
        });
      } else {
        await prisma.workItem.update({
          where: { id: item.id },
          data: {
            status: 'RETRY_QUEUED',
            rawResponse: apiResult.raw,
            parseErrors,
            lastError: parseResult.error,
            costUsd: (item.costUsd ?? 0) + apiResult.costUsd,
            nextRetryAt: new Date(Date.now() + exponentialBackoff(item.attemptCount)),
          },
        });

        // Re-queue for retry
        setTimeout(async () => {
          await prisma.workItem.update({
            where: { id: item.id },
            data: { status: 'READY', attemptCount: { increment: 1 } },
          });
        }, exponentialBackoff(item.attemptCount));
      }

      // Update plan costs regardless
      await prisma.masterPlan.update({
        where: { id: planId },
        data: {
          actualCostUsd: { increment: apiResult.costUsd },
          totalApiCalls: { increment: 1 },
          totalTokensUsed: { increment: apiResult.inputTokens + apiResult.outputTokens },
        },
      });

      return;
    }

    // ── VALIDATE (lightweight: schema check, not cross-model) ──
    const validationResult = validateParsedData(item.entityType, parseResult.data);

    // ── COMMIT to target table ──
    if (validationResult.valid) {
      await commitWorkItemData(item, parseResult.data);
    }

    // ── Update work item ──
    await prisma.workItem.update({
      where: { id: item.id },
      data: {
        status: validationResult.valid ? 'VALIDATED' : 'GENERATED',
        rawResponse: apiResult.raw,
        parsedData: parseResult.data,
        parseStrategy: parseResult.strategy,
        assignedModel: apiResult.model,
        validationResult: validationResult.valid ? 'PASSED' : 'NEEDS_REVIEW',
        validationNotes: validationResult.notes,
        inputTokens: apiResult.inputTokens,
        outputTokens: apiResult.outputTokens,
        costUsd: (item.costUsd ?? 0) + apiResult.costUsd,
        completedAt: new Date(),
      },
    });

    // ── CHECKPOINT ──
    await prisma.generationCheckpoint.create({
      data: {
        planId,
        workItemId: item.id,
        phase: item.phase,
        resultSummary: `${item.entityType}: ${item.title} — ${parseResult.strategy}`,
      },
    });

    // ── Update plan costs ──
    await prisma.masterPlan.update({
      where: { id: planId },
      data: {
        actualCostUsd: { increment: apiResult.costUsd },
        totalApiCalls: { increment: 1 },
        totalTokensUsed: { increment: apiResult.inputTokens + apiResult.outputTokens },
        lastActivityAt: new Date(),
      },
    });

    // ── PROPAGATE ──
    if (validationResult.valid) {
      await propagateWorkItemCompletion(item.id);
    }

  } catch (error: any) {
    await prisma.workItem.update({
      where: { id: item.id },
      data: {
        status: item.attemptCount >= item.maxAttempts ? 'FAILED' : 'READY',
        lastError: error.message,
        nextRetryAt: new Date(Date.now() + exponentialBackoff(item.attemptCount)),
        attemptCount: { increment: 1 },
      },
    });
  }
}

/**
 * When a work item completes, unblock all items that depend on it.
 */
async function propagateWorkItemCompletion(completedItemId: string): Promise<void> {
  const dependentEdges = await prisma.workItemDependency.findMany({
    where: { dependencyId: completedItemId },
    select: { dependentId: true, isHard: true },
  });

  for (const edge of dependentEdges) {
    const unmetHardDeps = await prisma.workItemDependency.count({
      where: {
        dependentId: edge.dependentId,
        isHard: true,
        dependency: {
          status: { notIn: ['VALIDATED', 'SKIPPED'] },
        },
      },
    });

    if (unmetHardDeps === 0) {
      await prisma.workItem.update({
        where: { id: edge.dependentId, status: 'BLOCKED' },
        data: { status: 'READY' },
      });
    }
  }
}

/**
 * Write the parsed data to the actual content table.
 */
async function commitWorkItemData(
  item: WorkItem,
  data: Record<string, any>,
): Promise<void> {
  // Delegate to entity-specific commit logic
  switch (item.entityType) {
    case 'topic_node':
      await commitTopicNodes(item, data);
      break;
    case 'completeness_anchor':
      await commitCompletenessAnchor(item, data);
      break;
    case 'entry':
      await commitEntry(item, data);
      break;
    case 'atom':
      await commitAtom(item, data);
      break;
    case 'algorithm':
      await commitAlgorithm(item, data);
      break;
    case 'capability':
      await commitCapability(item, data);
      break;
    case 'blueprint':
      await commitBlueprint(item, data);
      break;
    default:
      console.warn(`No commit handler for entity type: ${item.entityType}`);
  }
}

async function commitEntry(item: WorkItem, data: Record<string, any>): Promise<void> {
  const plan = await prisma.masterPlan.findUniqueOrThrow({
    where: { id: item.planId },
    select: { targetId: true },
  });

  const entryId = computeEntryId(plan.targetId, item.path ?? '');

  await prisma.entry.upsert({
    where: { id: entryId },
    create: {
      id: entryId,
      targetId: plan.targetId,
      path: item.path ?? '',
      entryType: data.entry_type ?? 'TOPIC',
      contentMicro: data.content_micro,
      contentStandard: data.content_standard,
      contentExhaustive: data.content_exhaustive,
      syntax: data.syntax,
      parameters: data.parameters ?? [],
      returnValue: data.return_value,
      edgeCases: data.edge_cases ?? [],
      commonMistakes: data.common_mistakes ?? [],
      generatedBy: item.assignedModel,
      generatedAt: new Date(),
      confidence: 0.7, // Initial confidence, refined by validation
      contentHash: createHash('sha256').update(JSON.stringify(data)).digest('hex'),
    },
    update: {
      contentMicro: data.content_micro,
      contentStandard: data.content_standard,
      contentExhaustive: data.content_exhaustive,
      syntax: data.syntax,
      parameters: data.parameters ?? [],
      returnValue: data.return_value,
      edgeCases: data.edge_cases ?? [],
      commonMistakes: data.common_mistakes ?? [],
      generatedBy: item.assignedModel,
      generatedAt: new Date(),
      contentHash: createHash('sha256').update(JSON.stringify(data)).digest('hex'),
    },
  });

  // Create examples if included in the response
  if (data.examples && Array.isArray(data.examples)) {
    for (const example of data.examples) {
      await prisma.example.create({
        data: {
          entryId,
          title: example.title,
          code: example.code,
          language: example.language ?? plan.targetId,
          explanation: example.explanation,
          expectedOutput: example.expected_output,
          complexity: example.complexity ?? 'BASIC',
        },
      });
    }
  }

  // Mark the topic node as generated (if applicable)
  if (item.path) {
    await prisma.topicNode.updateMany({
      where: { targetId: plan.targetId, path: item.path },
      data: { isGenerated: true, entryId },
    });
  }
}

// ─── Dynamic work item creation (post-phase hooks) ──────────────────────────

/**
 * After Phase 1 (DECOMPOSE) completes, create Phase 3 work items
 * from the generated topic tree.
 */
async function createPhase3WorkItemsFromTopicTree(planId: string): Promise<void> {
  const plan = await prisma.masterPlan.findUniqueOrThrow({
    where: { id: planId },
    select: { id: true, targetId: true },
  });

  const topicNodes = await prisma.topicNode.findMany({
    where: { targetId: plan.targetId, isGenerated: false },
    orderBy: [{ depth: 'asc' }, { path: 'asc' }],
  });

  let order = 1000; // Start after Phase 1/2 items

  for (const node of topicNodes) {
    // Check if work item already exists (idempotent)
    const existing = await prisma.workItem.findFirst({
      where: { planId, phase: 'GENERATE_REFERENCE', path: node.path },
    });

    if (existing) continue;

    await prisma.workItem.create({
      data: {
        planId,
        phase: 'GENERATE_REFERENCE',
        status: 'READY',
        entityType: 'entry',
        title: `Entry: ${node.path}`,
        path: node.path,
        reason: 'INITIAL_PLAN',
        deduplicationAction: 'NONE',
        modelTier: 'MID',
        promptContext: buildEntryPrompt(plan.targetId, node, {} as any, null),
        executionOrder: order++,
      },
    });
  }
}

/**
 * After Phase 3 (GENERATE_REFERENCE) completes, run gap analysis
 * and create Phase 5 fill items.
 */
async function runGapAnalysisAndCreateFillItems(planId: string): Promise<void> {
  const plan = await prisma.masterPlan.findUniqueOrThrow({
    where: { id: planId },
    select: { id: true, targetId: true },
  });

  // Get completeness anchors
  const anchors = await prisma.completenessAnchor.findMany({
    where: { targetId: plan.targetId },
  });

  let order = 5000; // Start after Phase 3 items
  let gapCount = 0;

  for (const anchor of anchors) {
    const items = anchor.items as string[];

    for (const item of items) {
      // Check if we have an entry that covers this item
      const covered = await prisma.entry.findFirst({
        where: {
          targetId: plan.targetId,
          OR: [
            { path: { contains: item } },
            { contentStandard: { contains: item } },
          ],
        },
      });

      if (!covered) {
        gapCount++;
        const gapPath = `${plan.targetId}/${anchor.anchorType}/${item}`;

        // Check if work item already exists
        const existing = await prisma.workItem.findFirst({
          where: { planId, path: gapPath },
        });

        if (!existing) {
          await prisma.workItem.create({
            data: {
              planId,
              phase: 'FILL_GAPS',
              status: 'READY',
              entityType: 'entry',
              title: `Gap fill: ${gapPath}`,
              path: gapPath,
              reason: 'ANCHOR_MISMATCH',
              deduplicationAction: 'NONE',
              modelTier: 'MID',
              promptContext: {
                system: 'You are filling a documentation gap.',
                instruction: `Generate a complete knowledge entry for "${item}" in ${plan.targetId}.`,
                anchorType: anchor.anchorType,
                format: 'Same schema as Phase 3 entries.',
              },
              executionOrder: order++,
            },
          });
        }
      }
    }

    // Update anchor coverage counts
    await prisma.completenessAnchor.update({
      where: { id: anchor.id },
      data: {
        coveredCount: items.length - gapCount,
        missingItems: [], // Would be populated with actual missing items
      },
    });
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function computeEntryId(targetId: string, path: string): string {
  return createHash('sha256')
    .update(`${targetId}:${path}`)
    .digest('hex')
    .slice(0, 24);
}

function exponentialBackoff(attempt: number): number {
  return Math.min(1000 * Math.pow(2, attempt), 300_000);
}

function validateParsedData(
  entityType: string,
  data: Record<string, any>,
): { valid: boolean; notes: string } {
  // Basic structural validation
  switch (entityType) {
    case 'entry':
      if (!data.content_micro && !data.content_standard) {
        return { valid: false, notes: 'Entry missing both micro and standard content' };
      }
      return { valid: true, notes: 'Schema OK' };

    case 'topic_node':
      if (!data.nodes || !Array.isArray(data.nodes)) {
        return { valid: false, notes: 'Topic tree missing nodes array' };
      }
      return { valid: true, notes: `${data.nodes.length} nodes` };

    case 'completeness_anchor':
      if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        return { valid: false, notes: 'Anchor has no items' };
      }
      return { valid: true, notes: `${data.items.length} items` };

    default:
      return { valid: true, notes: 'No specific validation for this type' };
  }
}

// Placeholder types
class BudgetExhaustedError extends Error {
  constructor(actual: number, max: number) {
    super(`Budget exhausted: $${actual.toFixed(2)} / $${max.toFixed(2)}`);
  }
}

function createHash(algorithm: string) {
  const crypto = require('crypto');
  return crypto.createHash(algorithm);
}

async function callLLMApi(config: any): Promise<any> {
  throw new Error('Implement with your LLM provider SDK');
}

function computeCost(model: string, usage: any): number {
  // Simplified cost computation
  const rates: Record<string, { input: number; output: number }> = {
    'claude-3-haiku-20240307': { input: 0.25 / 1e6, output: 1.25 / 1e6 },
    'claude-sonnet-4-20250514': { input: 3 / 1e6, output: 15 / 1e6 },
    'claude-3-opus-20240229': { input: 15 / 1e6, output: 75 / 1e6 },
  };
  const rate = rates[model] ?? rates['claude-sonnet-4-20250514'];
  return usage.inputTokens * rate.input + usage.outputTokens * rate.output;
}

async function commitTopicNodes(item: WorkItem, data: any): Promise<void> { /* ... */ }
async function commitCompletenessAnchor(item: WorkItem, data: any): Promise<void> { /* ... */ }
async function commitAtom(item: WorkItem, data: any): Promise<void> { /* ... */ }
async function commitAlgorithm(item: WorkItem, data: any): Promise<void> { /* ... */ }
async function commitCapability(item: WorkItem, data: any): Promise<void> { /* ... */ }
async function commitBlueprint(item: WorkItem, data: any): Promise<void> { /* ... */ }

function buildCapabilitiesPrompt(targetId: string, coverage: any): any { return {}; }
function buildAtomsPrompt(targetId: string, coverage: any): any { return {}; }
function buildAlgorithmPrompt(algo: any, coverage: any): any { return {}; }
```

### Part 4: The CLI Entry Point

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// cli.ts — The command-line interface for the pipeline
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * The main entry point. Three commands:
 *
 *   magb plan python       — Analyze + build plan (no API calls)
 *   magb review python     — Show the plan and estimated cost
 *   magb execute python    — Run the plan
 *   magb status python     — Show progress
 *   magb wave 1            — Plan + execute all targets in wave 1
 */

async function main() {
  const [command, arg] = process.argv.slice(2);

  switch (command) {
    case 'plan': {
      const targetId = arg;
      console.log(`\n📊 Analyzing coverage for: ${targetId}`);

      const coverage = await analyzeCoverage(targetId);

      console.log(`\n  Existing entries: ${coverage.existing.entries}`);
      console.log(`  Estimated total: ${coverage.estimated.totalEntries}`);
      console.log(`  Coverage: ${(coverage.overallCoverage * 100).toFixed(1)}%`);
      console.log(`  Reusable algorithms: ${coverage.reusable.algorithms.length}`);
      console.log(`  Gaps found: ${coverage.gaps.length}`);

      console.log(`\n📝 Building master plan...`);
      const plan = await buildMasterPlan(targetId, coverage);

      console.log(`\n  Plan ID: ${plan.planId}`);
      console.log(`  Total work items: ${plan.totalWorkItems}`);
      console.log(`  Skipped by dedup: ${plan.skippedByDedup}`);
      console.log(`  API calls needed: ${plan.estimatedApiCalls}`);
      console.log(`  Estimated cost: $${plan.estimatedCostUsd.toFixed(2)}`);
      console.log(`\n  Work items by phase:`);

      for (const [phase, count] of Object.entries(plan.workItemsByPhase)) {
        console.log(`    ${phase}: ${count}`);
      }

      console.log(`\n✅ Plan ready. Run 'magb execute ${targetId}' to start.`);
      break;
    }

    case 'execute': {
      const targetId = arg;
      const plan = await prisma.masterPlan.findFirst({
        where: { targetId, status: 'READY' },
      });

      if (!plan) {
        console.log(`No ready plan for ${targetId}. Run 'magb plan ${targetId}' first.`);
        return;
      }

      console.log(`\n🚀 Executing plan ${plan.id} for ${targetId}`);
      console.log(`   Budget: $${plan.maxBudgetUsd.toFixed(2)}`);

      await executePlan(plan.id);

      console.log(`\n✅ Complete!`);
      break;
    }

    case 'status': {
      const targetId = arg;
      const plan = await prisma.masterPlan.findFirst({
        where: { targetId },
        orderBy: { createdAt: 'desc' },
      });

      if (!plan) {
        console.log(`No plan found for ${targetId}.`);
        return;
      }

      const counts = await prisma.workItem.groupBy({
        by: ['status'],
        where: { planId: plan.id },
        _count: true,
      });

      console.log(`\n📊 Plan status for ${targetId}:`);
      console.log(`   Status: ${plan.status}`);
      console.log(`   Current phase: ${plan.currentPhase ?? 'not started'}`);
      console.log(`   Cost: $${plan.actualCostUsd.toFixed(2)} / $${plan.maxBudgetUsd.toFixed(2)}`);
      console.log(`   API calls: ${plan.totalApiCalls}`);
      console.log(`\n   Work items:`);
      for (const c of counts) {
        console.log(`     ${c.status}: ${c._count}`);
      }
      break;
    }

    case 'wave': {
      const waveNum = parseInt(arg);
      const wave = await prisma.waveConfig.findUnique({ where: { wave: waveNum } });

      if (!wave) {
        console.log(`Wave ${waveNum} not configured.`);
        return;
      }

      console.log(`\n🌊 Wave ${waveNum}: ${wave.name}`);
      console.log(`   Targets: ${wave.targetIds.join(', ')}`);

      for (const targetId of wave.targetIds) {
        console.log(`\n── Planning: ${targetId} ──`);
        const coverage = await analyzeCoverage(targetId);
        await buildMasterPlan(targetId, coverage);
      }

      // Execute in order
      for (const targetId of wave.targetIds) {
        console.log(`\n── Executing: ${targetId} ──`);
        const plan = await prisma.masterPlan.findFirst({
          where: { targetId, status: 'READY' },
        });
        if (plan) await executePlan(plan.id);
      }

      break;
    }
  }
}
```

---

## How It All Fits Together

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    THE INTELLIGENT PIPELINE FLOW                            ║
║                                                                              ║
║  magb plan python                                                            ║
║    │                                                                         ║
║    ├─▶ CoverageAnalyzer.analyzeCoverage("python")                           ║
║    │     ├─ COUNT entries, atoms, capabilities, blueprints                   ║
║    │     ├─ CHECK completeness anchors for gaps                             ║
║    │     ├─ FIND reusable algorithms from other targets                     ║
║    │     ├─ ASSESS quality (confidence, staleness, completeness)            ║
║    │     └─ RETURN CoverageReport                                           ║
║    │                                                                         ║
║    └─▶ PlanningEngine.buildMasterPlan("python", coverageReport)             ║
║          ├─ SKIP Phase 1 if topic tree exists                               ║
║          ├─ SKIP anchors that already exist                                 ║
║          ├─ DEDUP entries against existing content                          ║
║          ├─ DEDUP algorithms against cross-target matches                   ║
║          ├─ BUILD prompts with full context at plan time                    ║
║          ├─ ASSIGN model tiers (cheap/mid/expensive)                        ║
║          ├─ WIRE dependencies between work items                            ║
║          ├─ ESTIMATE total cost                                             ║
║          └─ RETURN PlanningResult (reviewable before execution)             ║
║                                                                              ║
║  magb execute python                                                         ║
║    │                                                                         ║
║    └─▶ ExecutionEngine.executePlan(planId)                                   ║
║          ├─ FOR EACH phase in pipeline order:                               ║
║          │     ├─ CLAIM next READY work item (atomic)                       ║
║          │     ├─ ROUTE to model tier (cheap/mid/expensive)                 ║
║          │     ├─ CALL API                                                   ║
║          │     ├─ PARSE response (5-strategy fallback)                      ║
║          │     ├─ VALIDATE parsed data                                      ║
║          │     ├─ COMMIT to target table (Entry, Atom, etc.)                ║
║          │     ├─ CHECKPOINT (crash-safe)                                    ║
║          │     └─ PROPAGATE (unblock dependent items)                       ║
║          │                                                                   ║
║          ├─ AFTER Phase 1: create Phase 3 items from topic tree             ║
║          ├─ AFTER Phase 3: run gap analysis, create fill items              ║
║          └─ AFTER Phase 6: start implementation layer (Phases 7-12)         ║
║                                                                              ║
║  The key insight: by the time an API call fires, the pipeline ALREADY        ║
║  knows exactly what it needs, why it needs it, and that nobody else          ║
║  has asked for it. No wasted calls. No duplicate data. No blind search.      ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

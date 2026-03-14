

# User Petition System — Human-Driven Knowledge Requests

## The Problem You're Solving

A user sits down and says: *"I need the database to know how to replicate Photoshop's gradient tool."*

This single request touches **dozens** of entities across multiple layers:

```
"Replicate the gradient tool from Photoshop"
    │
    ├── What IS a gradient? (Concept)
    ├── What types exist? (Linear, Radial, Angular, Diamond, Reflected)
    ├── What's the math? (Color interpolation algorithms)
    ├── What color spaces matter? (sRGB, Linear RGB, Lab — different results)
    ├── What file formats can store gradients? (PSD, SVG, CSS, PNG output)
    ├── What are the atoms? (Gradient stops, opacity stops, midpoints)
    ├── What are Photoshop's specific behaviors? (Dithering, smoothness)
    ├── How do you BUILD this in code? (Capability → Blueprint)
    └── What output formats? (User might want PPTX, SVG, Canvas, etc.)
```

The user shouldn't need to know any of this. They describe what they want, and the system **decomposes, plans, and executes** — showing them exactly what's happening and what it'll cost.

---

## Schema Additions

```prisma
// ════════════════════════════════════════════════════════════════════════════════
// LAYER 9: PETITIONS — User-driven knowledge requests
//
// Humans interact with the pipeline through Petitions. A petition is a
// natural-language request that gets decomposed by the AI into concrete
// work items, reviewed by the user, and then executed through the standard
// pipeline.
//
// The petition system is the bridge between human intent and machine execution.
// ════════════════════════════════════════════════════════════════════════════════

/// Lifecycle of a user petition
enum PetitionStatus {
  SUBMITTED           // User submitted, awaiting AI decomposition
  ANALYZING           // AI is breaking down the request
  PROPOSAL_READY      // Decomposition complete, awaiting user review
  REVISION_REQUESTED  // User wants changes to the proposal
  APPROVED            // User approved, work items being created
  IN_PROGRESS         // Work items executing
  PARTIALLY_COMPLETE  // Some work done, waiting on dependencies/budget
  COMPLETED           // All work items validated and committed
  CANCELLED           // User cancelled
  FAILED              // Unrecoverable failure
}

/// How urgent is this petition
enum PetitionPriority {
  URGENT       // User is actively blocked
  HIGH         // Needed soon
  NORMAL       // Standard request
  EXPLORATORY  // Nice to have, explore when idle
}

/// What kind of knowledge is the user asking for
enum PetitionIntent {
  REPLICATE_FEATURE    // "How does Photoshop's gradient tool work?"
  LEARN_CONCEPT        // "Explain error handling across all languages"
  BUILD_CAPABILITY     // "I need to generate PPTX slides with charts"
  COMPARE_TARGETS      // "Compare Python vs Rust async models"
  FILL_GAP             // "The database is missing X"
  DEEP_DIVE            // "I need exhaustive detail on SVG filters"
  CROSS_REFERENCE      // "How do gradients work across SVG, CSS, Canvas?"
}

/// Status of individual requirements within a petition
enum RequirementStatus {
  PROPOSED             // AI suggested this requirement
  ACCEPTED             // User confirmed it's needed
  REJECTED             // User says not needed
  MODIFIED             // User changed the scope
  EXISTS               // Already in the database
  IN_PROGRESS          // Being generated
  COMPLETED            // Generated and validated
}

// ─────────────────────────────────────────────────────────────────────────────
// Petition — A user's natural-language request for knowledge
//
// The user describes what they want. The system figures out everything else.
// ─────────────────────────────────────────────────────────────────────────────

/// A user petition for knowledge generation.
///
/// Flow:
///   1. User submits petition in natural language
///   2. AI decomposes into structured requirements (PetitionRequirement)
///   3. System checks database for existing coverage (PetitionCoverageCheck)
///   4. AI builds a proposal showing: what exists, what's missing, estimated cost
///   5. User reviews, adjusts scope, approves
///   6. System creates WorkItems in the appropriate MasterPlan(s)
///   7. Standard pipeline executes
///   8. User gets notified when complete
///
/// ~100,000 rows at scale.
model Petition {
  id              String           @id @default(cuid())

  /// ── User input ──
  userId          String?          @map("user_id")        /// Who submitted this
  title           String                                   /// Short summary
  description     String                                   /// Full natural-language request
  intent          PetitionIntent?                          /// Classified by AI
  priority        PetitionPriority @default(NORMAL)

  /// ── Context hints (optional, user can provide) ──
  /// These help the AI decompose more accurately
  targetHints     String[]         @map("target_hints")    /// ["photoshop", "svg", "css"]
  outputFormats   String[]         @map("output_formats")  /// ["pptx", "svg", "html_canvas"]
  useCaseContext  String?          @map("use_case_context") /// "Building a design tool"
  complexityHint  String?          @map("complexity_hint")  /// "production_quality" | "proof_of_concept"

  /// ── AI decomposition result ──
  status              PetitionStatus @default(SUBMITTED)
  decompositionModel  String?        @map("decomposition_model")  /// Which model decomposed
  decompositionTokens Int?           @map("decomposition_tokens") /// Cost of decomposition
  decomposedAt        DateTime?      @map("decomposed_at")

  /// The AI's understanding of what the user wants, structured.
  /// This is shown back to the user for confirmation.
  aiUnderstanding     String?        @map("ai_understanding")
  /// "You want to understand how Photoshop's gradient tool works internally,
  ///  including the mathematical algorithms for color interpolation, the
  ///  specific UI behaviors (dithering, smoothness), and how to implement
  ///  equivalent functionality targeting SVG and HTML Canvas output."

  /// ── Proposal summary (shown to user before approval) ──
  proposalSummary     Json?          @map("proposal_summary")
  /// {
  ///   total_requirements: 23,
  ///   already_exists: 8,
  ///   needs_generation: 15,
  ///   estimated_api_calls: 42,
  ///   estimated_cost_usd: 0.63,
  ///   estimated_time_minutes: 4,
  ///   targets_involved: ["photoshop", "svg", "css", "html_canvas"],
  ///   new_concepts: ["gradient_interpolation", "color_stop", "dithering"],
  ///   new_algorithms: ["linear_gradient", "radial_gradient", "color_interpolation"],
  ///   reusable_from_existing: [
  ///     { id: "algo.color.interpolation.linear", reason: "Already generated for CSS" }
  ///   ]
  /// }

  /// ── User feedback on proposal ──
  userFeedback        String?        @map("user_feedback")  /// Free-text revision notes
  approvedAt          DateTime?      @map("approved_at")
  approvedScope       Json?          @map("approved_scope") /// Final scope after user edits
  /// { include: ["req_1", "req_3", "req_5"], exclude: ["req_2"], modified: { "req_4": "..." } }

  /// ── Execution tracking ──
  totalWorkItems      Int            @default(0) @map("total_work_items")
  completedWorkItems  Int            @default(0) @map("completed_work_items")
  failedWorkItems     Int            @default(0) @map("failed_work_items")
  actualCostUsd       Float          @default(0.0) @map("actual_cost_usd")

  /// ── Conversation thread ──
  /// The user can ask follow-up questions or request adjustments.
  /// Each message is stored as a conversation turn.
  conversationHistory Json           @default("[]") @map("conversation_history")
  /// [
  ///   { role: "user", content: "I want to replicate...", timestamp: "..." },
  ///   { role: "system", content: "I've analyzed your request...", timestamp: "..." },
  ///   { role: "user", content: "Also include diamond gradients", timestamp: "..." },
  ///   { role: "system", content: "Updated. 2 new requirements added.", timestamp: "..." }
  /// ]

  /// ── Completion ──
  completedAt     DateTime?     @map("completed_at")
  completionNote  String?       @map("completion_note") /// AI summary of what was generated

  /// ── Delivery ──
  /// Once complete, what can the user access?
  deliverables    Json          @default("{}") @map("deliverables")
  /// {
  ///   concepts: ["gradient_interpolation", ...],
  ///   entries: [{ id, path, target }],
  ///   algorithms: [{ id, name }],
  ///   capabilities: [{ id, name, target }],
  ///   blueprints: [{ id, name }],
  ///   total_knowledge_tokens: 45000
  /// }

  metadata    Json     @default("{}")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt     @map("updated_at")

  // ── Relations ──
  requirements    PetitionRequirement[]
  coverageChecks  PetitionCoverageCheck[]
  workItemLinks   PetitionWorkItemLink[]

  @@index([status])
  @@index([userId])
  @@index([priority, status])
  @@index([createdAt])
  @@map("petitions")
}

// ─────────────────────────────────────────────────────────────────────────────
// PetitionRequirement — Individual knowledge requirements decomposed from
// a petition. Each requirement maps to one or more work items.
// ─────────────────────────────────────────────────────────────────────────────

/// A single knowledge requirement extracted from a user petition.
///
/// The AI breaks "replicate Photoshop's gradient tool" into ~20 requirements:
///   • Concept: "Gradient Interpolation"
///   • Algorithm: "Linear Color Interpolation in sRGB"
///   • Algorithm: "Linear Color Interpolation in Lab"
///   • Atom: "SVG linearGradient element"
///   • Atom: "CSS linear-gradient() function"
///   • Capability: "Render linear gradient to bitmap"
///   • Entry: "Photoshop/Tools/Gradient/Overview"
///   • Entry: "Photoshop/Tools/Gradient/Dithering"
///   • ...
///
/// Each requirement gets a coverage check (exists? partial? missing?)
/// and the user can accept, reject, or modify each one.
model PetitionRequirement {
  id              String            @id @default(cuid())
  petitionId      String            @map("petition_id")
  orderIndex      Int               @default(0) @map("order_index")

  /// ── What is needed ──
  entityType      String            @map("entity_type")  /// "concept"|"entry"|"algorithm"|...
  targetId        String?           @map("target_id")    /// Which target (null = universal)
  path            String?                                 /// Hierarchical path
  title           String                                  /// Human-readable
  description     String                                  /// Why this is needed

  /// ── Categorization ──
  layer           String            @default("reference") /// "reference"|"implementation"|"blueprint"
  category        String?                                 /// "algorithm"|"atom"|"concept"|...
  isCore          Boolean           @default(false) @map("is_core") /// Essential vs nice-to-have

  /// ── Dependencies ──
  /// Which other requirements must be completed first
  dependsOnIds    String[]          @map("depends_on_ids") /// Other PetitionRequirement IDs

  /// ── Coverage status ──
  status          RequirementStatus @default(PROPOSED)
  coverageResult  Json?             @map("coverage_result")
  /// {
  ///   exists: false,
  ///   partial_match: { entry_id: "...", confidence: 0.4, missing: ["exhaustive content"] },
  ///   reusable_from: null,
  ///   estimated_cost: 0.015,
  ///   model_tier: "MID"
  /// }

  /// ── User modifications ──
  userNote        String?           @map("user_note") /// User's note on this requirement
  modifiedScope   String?           @map("modified_scope") /// User's modified description

  /// ── Execution link ──
  workItemId      String?           @map("work_item_id") /// Created WorkItem ID
  completedAt     DateTime?         @map("completed_at")

  metadata    Json     @default("{}")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt     @map("updated_at")

  // ── Relations ──
  petition    Petition @relation(fields: [petitionId], references: [id], onDelete: Cascade)

  @@index([petitionId])
  @@index([status])
  @@index([entityType])
  @@map("petition_requirements")
}

// ─────────────────────────────────────────────────────────────────────────────
// PetitionCoverageCheck — Records what the system already knows relevant
// to a petition. Computed during the ANALYZING phase.
// ─────────────────────────────────────────────────────────────────────────────

/// A record of existing database content relevant to a petition.
///
/// Before generating anything, the system searches for everything it
/// already knows about the petition's topic. This prevents regenerating
/// knowledge that already exists, and shows the user what foundation
/// they're building on.
model PetitionCoverageCheck {
  id              String   @id @default(cuid())
  petitionId      String   @map("petition_id")

  /// What was found
  entityType      String   @map("entity_type")  /// "entry"|"algorithm"|...
  entityId        String   @map("entity_id")     /// ID of existing entity
  entityTitle     String   @map("entity_title")  /// Human-readable
  entityPath      String?  @map("entity_path")   /// Path in the knowledge tree

  /// How relevant is this to the petition (0.0 to 1.0)
  relevance       Float    @default(0.0)

  /// Quality assessment
  currentConfidence Float  @default(0.0) @map("current_confidence")
  hasAllResolutions Boolean @default(false) @map("has_all_resolutions")
  isStale          Boolean @default(false) @map("is_stale")
  needsRefresh     Boolean @default(false) @map("needs_refresh")

  /// How this existing knowledge maps to requirements
  satisfiesRequirementIds String[] @map("satisfies_requirement_ids")

  checkedAt   DateTime @default(now()) @map("checked_at")

  // ── Relations ──
  petition    Petition @relation(fields: [petitionId], references: [id], onDelete: Cascade)

  @@index([petitionId])
  @@index([entityType, relevance(sort: Desc)])
  @@map("petition_coverage_checks")
}

// ─────────────────────────────────────────────────────────────────────────────
// PetitionWorkItemLink — Junction between petitions and work items
// ─────────────────────────────────────────────────────────────────────────────

/// Links a petition to the work items created to fulfill it.
///
/// Multiple petitions might share work items (if two users request
/// overlapping knowledge, the second petition gets linked to the
/// existing work items rather than creating duplicates).
model PetitionWorkItemLink {
  id              BigInt   @id @default(autoincrement())
  petitionId      String   @map("petition_id")
  workItemId      String   @map("work_item_id")
  requirementId   String?  @map("requirement_id") /// Which requirement this fulfills

  /// Was this work item created FOR this petition, or did it already exist?
  isNewlyCreated  Boolean  @default(true) @map("is_newly_created")

  petition        Petition @relation(fields: [petitionId], references: [id])

  @@unique([petitionId, workItemId])
  @@index([workItemId])
  @@map("petition_work_item_links")
}
```

---

## The Petition Engine

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// petition-engine.ts
//
// The user-facing interface to the intelligent pipeline. Handles:
//   1. Receiving natural-language requests
//   2. AI decomposition into structured requirements
//   3. Coverage checking against existing database
//   4. Proposal generation with cost estimates
//   5. User interaction (review, modify, approve)
//   6. Work item creation and execution tracking
//   7. Completion notification with deliverables
// ═══════════════════════════════════════════════════════════════════════════════

import { PrismaClient, PetitionStatus, PetitionIntent, RequirementStatus } from '@prisma/client';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: SUBMIT — User describes what they want
// ─────────────────────────────────────────────────────────────────────────────

interface PetitionInput {
  userId?: string;
  title: string;
  description: string;
  targetHints?: string[];
  outputFormats?: string[];
  useCaseContext?: string;
  complexityHint?: 'proof_of_concept' | 'production_quality' | 'exhaustive';
  priority?: 'URGENT' | 'HIGH' | 'NORMAL' | 'EXPLORATORY';
}

/**
 * Submit a new petition. This is the user's entry point.
 *
 * Example:
 *   submitPetition({
 *     title: "Replicate Photoshop's Gradient Tool",
 *     description: "I need the database to know everything about how Photoshop's
 *       gradient tool works — the different gradient types (linear, radial, angular,
 *       diamond, reflected), color interpolation math, dithering, smoothness settings,
 *       and how to implement equivalent functionality for SVG and HTML Canvas output.",
 *     targetHints: ["photoshop", "svg", "css", "html_canvas"],
 *     outputFormats: ["svg", "html_canvas", "png"],
 *     useCaseContext: "Building a browser-based design tool",
 *     complexityHint: "production_quality"
 *   })
 */
async function submitPetition(input: PetitionInput): Promise<{
  petitionId: string;
  status: string;
  message: string;
}> {
  const petition = await prisma.petition.create({
    data: {
      userId: input.userId,
      title: input.title,
      description: input.description,
      targetHints: input.targetHints ?? [],
      outputFormats: input.outputFormats ?? [],
      useCaseContext: input.useCaseContext,
      complexityHint: input.complexityHint,
      priority: input.priority ?? 'NORMAL',
      status: 'SUBMITTED',
      conversationHistory: [
        {
          role: 'user',
          content: input.description,
          timestamp: new Date().toISOString(),
        },
      ],
    },
  });

  // Kick off async decomposition
  // In production, this would go through a message queue
  decomposePetition(petition.id).catch(err => {
    console.error(`Decomposition failed for petition ${petition.id}:`, err);
  });

  return {
    petitionId: petition.id,
    status: 'SUBMITTED',
    message: 'Your petition has been submitted. The AI is analyzing your request. ' +
      'You will receive a proposal with cost estimates shortly.',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2: DECOMPOSE — AI breaks down the request
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Decompose a petition into structured requirements.
 *
 * This is where the AI demonstrates its understanding of the request
 * by breaking it into concrete, actionable knowledge requirements.
 *
 * The decomposition prompt is carefully designed to:
 *   1. Classify the intent
 *   2. Identify all relevant targets
 *   3. Break down into atomic requirements
 *   4. Identify dependencies between requirements
 *   5. Suggest the right entity type for each requirement
 *   6. Flag what might already exist
 */
async function decomposePetition(petitionId: string): Promise<void> {
  const petition = await prisma.petition.findUniqueOrThrow({
    where: { id: petitionId },
  });

  await prisma.petition.update({
    where: { id: petitionId },
    data: { status: 'ANALYZING' },
  });

  // ── Build the decomposition prompt ──
  const decompositionPrompt = {
    system: `You are a knowledge architecture expert for the magB Universal Blueprint Machine.

Your job is to take a user's natural-language request and decompose it into a structured set of knowledge requirements that the database needs to contain.

The database has these entity types:
- CONCEPT: Universal, target-agnostic ideas (e.g., "gradient interpolation")
- ENTRY: Target-specific knowledge (e.g., "Photoshop/Tools/Gradient/Linear")
- ALGORITHM: Mathematical procedures (e.g., "Linear Color Interpolation")
- ATOM: Structural building blocks (e.g., "SVG linearGradient element")
- CAPABILITY: User-facing features (e.g., "Render linear gradient")
- BLUEPRINT: Architecture plans combining capabilities

Each entry has three resolution levels:
- micro (~50 tokens): summary
- standard (~500 tokens): explanation with examples
- exhaustive (~2000 tokens): deep implementation details

Think carefully about:
1. What universal CONCEPTS underpin this request?
2. What target-specific ENTRIES document the features?
3. What ALGORITHMS provide the mathematical foundation?
4. What ATOMS (structural elements) are involved?
5. What CAPABILITIES does the user ultimately need?
6. What BLUEPRINT would tie it all together?
7. What are the DEPENDENCIES between these requirements?`,

    instruction: `Decompose this user request into structured knowledge requirements:

TITLE: ${petition.title}
DESCRIPTION: ${petition.description}
${petition.targetHints.length ? `TARGET HINTS: ${petition.targetHints.join(', ')}` : ''}
${petition.outputFormats.length ? `OUTPUT FORMATS: ${petition.outputFormats.join(', ')}` : ''}
${petition.useCaseContext ? `USE CASE: ${petition.useCaseContext}` : ''}
${petition.complexityHint ? `COMPLEXITY: ${petition.complexityHint}` : ''}

Return JSON:
{
  "intent": "REPLICATE_FEATURE|LEARN_CONCEPT|BUILD_CAPABILITY|COMPARE_TARGETS|FILL_GAP|DEEP_DIVE|CROSS_REFERENCE",
  "understanding": "A 2-3 sentence summary of what the user wants, phrased as confirmation.",
  "targets_involved": ["photoshop", "svg", "css"],
  "requirements": [
    {
      "order": 1,
      "entity_type": "concept|entry|algorithm|atom|capability|blueprint",
      "target_id": "photoshop" or null for universal,
      "path": "Photoshop/Tools/Gradient/Overview",
      "title": "Gradient Tool Overview",
      "description": "Comprehensive overview of Photoshop's gradient tool...",
      "layer": "reference|implementation|blueprint",
      "category": "tool|algorithm|structure|concept",
      "is_core": true,
      "depends_on": []  // order indices of prerequisites
    }
  ]
}

Be EXHAUSTIVE. Think about:
- Every gradient type (linear, radial, angular, diamond, reflected)
- The math (color interpolation in different color spaces)
- The atoms (gradient stops, opacity stops, color midpoints)
- Photoshop-specific behaviors (dithering, smoothness, noise)
- Output format specifics (SVG syntax, CSS syntax, Canvas API)
- Edge cases (transparency, color space conversion, banding artifacts)`,
  };

  // ── Call the AI ──
  const response = await callModel('MID', decompositionPrompt);
  const parsed = parseResponse(response.raw);

  if (!parsed.success) {
    await prisma.petition.update({
      where: { id: petitionId },
      data: {
        status: 'FAILED',
        conversationHistory: {
          push: {
            role: 'system',
            content: 'Failed to decompose your request. Please try rephrasing.',
            timestamp: new Date().toISOString(),
          },
        },
      },
    });
    return;
  }

  const decomposition = parsed.data;

  // ── Store the AI's understanding ──
  await prisma.petition.update({
    where: { id: petitionId },
    data: {
      intent: decomposition.intent as PetitionIntent,
      aiUnderstanding: decomposition.understanding,
      decompositionModel: response.model,
      decompositionTokens: response.inputTokens + response.outputTokens,
      decomposedAt: new Date(),
    },
  });

  // ── Create requirements ──
  const requirementIds: Record<number, string> = {};

  for (const req of decomposition.requirements) {
    const created = await prisma.petitionRequirement.create({
      data: {
        petitionId,
        orderIndex: req.order,
        entityType: req.entity_type,
        targetId: req.target_id,
        path: req.path,
        title: req.title,
        description: req.description,
        layer: req.layer ?? 'reference',
        category: req.category,
        isCore: req.is_core ?? false,
        dependsOnIds: [], // Will be resolved after all are created
        status: 'PROPOSED',
      },
    });

    requirementIds[req.order] = created.id;
  }

  // Resolve dependency references (order index → actual ID)
  for (const req of decomposition.requirements) {
    if (req.depends_on?.length > 0) {
      const depIds = req.depends_on
        .map((orderIdx: number) => requirementIds[orderIdx])
        .filter(Boolean);

      await prisma.petitionRequirement.update({
        where: { id: requirementIds[req.order] },
        data: { dependsOnIds: depIds },
      });
    }
  }

  // ── STEP 3: Run coverage check ──
  await checkPetitionCoverage(petitionId);
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3: COVERAGE CHECK — What do we already know?
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Search the database for existing content relevant to each requirement.
 *
 * This is the intelligence layer that prevents duplicate generation.
 * For each requirement, we search:
 *   1. Exact path matches
 *   2. Concept matches
 *   3. Algorithm matches
 *   4. Full-text search on content
 *   5. Embedding similarity (if embeddings exist)
 */
async function checkPetitionCoverage(petitionId: string): Promise<void> {
  const requirements = await prisma.petitionRequirement.findMany({
    where: { petitionId },
    orderBy: { orderIndex: 'asc' },
  });

  for (const req of requirements) {
    const coverageResult = await checkSingleRequirement(req);

    // Store the coverage check results
    if (coverageResult.existingEntities.length > 0) {
      for (const existing of coverageResult.existingEntities) {
        await prisma.petitionCoverageCheck.create({
          data: {
            petitionId,
            entityType: existing.entityType,
            entityId: existing.id,
            entityTitle: existing.title,
            entityPath: existing.path,
            relevance: existing.relevance,
            currentConfidence: existing.confidence,
            hasAllResolutions: existing.hasAllResolutions,
            isStale: existing.isStale,
            needsRefresh: existing.needsRefresh,
            satisfiesRequirementIds: [req.id],
          },
        });
      }
    }

    // Update requirement status based on coverage
    const bestMatch = coverageResult.existingEntities[0];

    if (bestMatch && bestMatch.relevance > 0.9 && !bestMatch.needsRefresh) {
      // Fully covered
      await prisma.petitionRequirement.update({
        where: { id: req.id },
        data: {
          status: 'EXISTS',
          coverageResult: {
            exists: true,
            entity_id: bestMatch.id,
            confidence: bestMatch.confidence,
            relevance: bestMatch.relevance,
          },
        },
      });
    } else if (bestMatch && bestMatch.relevance > 0.5) {
      // Partially covered
      await prisma.petitionRequirement.update({
        where: { id: req.id },
        data: {
          status: 'PROPOSED',
          coverageResult: {
            exists: false,
            partial_match: {
              entity_id: bestMatch.id,
              confidence: bestMatch.confidence,
              relevance: bestMatch.relevance,
              missing: bestMatch.needsRefresh ? ['content is stale'] :
                       !bestMatch.hasAllResolutions ? ['missing resolution levels'] : [],
            },
            estimated_cost: estimateRequirementCost(req.entityType),
            model_tier: getModelTierForEntityType(req.entityType),
          },
        },
      });
    } else {
      // Not covered at all
      await prisma.petitionRequirement.update({
        where: { id: req.id },
        data: {
          status: 'PROPOSED',
          coverageResult: {
            exists: false,
            partial_match: null,
            reusable_from: null,
            estimated_cost: estimateRequirementCost(req.entityType),
            model_tier: getModelTierForEntityType(req.entityType),
          },
        },
      });
    }
  }

  // ── Build and store the proposal summary ──
  await buildProposalSummary(petitionId);
}

interface ExistingEntityMatch {
  id: string;
  entityType: string;
  title: string;
  path?: string;
  relevance: number;
  confidence: number;
  hasAllResolutions: boolean;
  isStale: boolean;
  needsRefresh: boolean;
}

/**
 * Check a single requirement against the database.
 */
async function checkSingleRequirement(
  req: { entityType: string; targetId: string | null; path: string | null; title: string; description: string },
): Promise<{ existingEntities: ExistingEntityMatch[] }> {
  const matches: ExistingEntityMatch[] = [];

  switch (req.entityType) {
    case 'concept': {
      // Search concepts by name similarity
      const concepts = await prisma.concept.findMany({
        where: {
          OR: [
            { name: { contains: extractKeyTerms(req.title), mode: 'insensitive' } },
            { summary: { contains: extractKeyTerms(req.title), mode: 'insensitive' } },
          ],
        },
        take: 5,
      });

      for (const c of concepts) {
        matches.push({
          id: c.id,
          entityType: 'concept',
          title: c.name,
          path: c.id,
          relevance: computeTextRelevance(req.title, c.name),
          confidence: 1.0, // Concepts don't have confidence
          hasAllResolutions: !!(c.summary && c.description),
          isStale: false,
          needsRefresh: false,
        });
      }
      break;
    }

    case 'entry': {
      // Search entries by path and content
      const entries = await prisma.entry.findMany({
        where: {
          ...(req.targetId ? { targetId: req.targetId } : {}),
          OR: [
            { path: { contains: extractKeyTerms(req.title), mode: 'insensitive' } },
            { contentStandard: { contains: extractKeyTerms(req.title), mode: 'insensitive' } },
            { contentMicro: { contains: extractKeyTerms(req.title), mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          path: true,
          entryType: true,
          confidence: true,
          contentMicro: true,
          contentStandard: true,
          contentExhaustive: true,
          generatedAt: true,
        },
        take: 5,
      });

      for (const e of entries) {
        const isStale = !e.generatedAt ||
          (Date.now() - e.generatedAt.getTime()) > 180 * 86_400_000;

        matches.push({
          id: e.id,
          entityType: 'entry',
          title: e.path.split('/').pop() ?? e.path,
          path: e.path,
          relevance: computeTextRelevance(req.title, e.path),
          confidence: e.confidence,
          hasAllResolutions: !!(e.contentMicro && e.contentStandard && e.contentExhaustive),
          isStale,
          needsRefresh: isStale || e.confidence < 0.5,
        });
      }
      break;
    }

    case 'algorithm': {
      const algorithms = await prisma.algorithm.findMany({
        where: {
          OR: [
            { name: { contains: extractKeyTerms(req.title), mode: 'insensitive' } },
            { category: { contains: extractKeyTerms(req.title), mode: 'insensitive' } },
            { purpose: { contains: extractKeyTerms(req.title), mode: 'insensitive' } },
          ],
        },
        take: 5,
      });

      for (const a of algorithms) {
        matches.push({
          id: a.id,
          entityType: 'algorithm',
          title: a.name,
          relevance: computeTextRelevance(req.title, a.name),
          confidence: a.confidence,
          hasAllResolutions: !!(a.summary && a.fullSpec && a.pseudocode),
          isStale: false,
          needsRefresh: a.confidence < 0.5,
        });
      }
      break;
    }

    case 'atom': {
      const atoms = await prisma.atom.findMany({
        where: {
          ...(req.targetId ? { targetId: req.targetId } : {}),
          OR: [
            { elementName: { contains: extractKeyTerms(req.title), mode: 'insensitive' } },
            { semanticMeaning: { contains: extractKeyTerms(req.title), mode: 'insensitive' } },
          ],
        },
        take: 5,
      });

      for (const a of atoms) {
        matches.push({
          id: a.id,
          entityType: 'atom',
          title: a.elementName,
          path: a.xpath ?? a.elementName,
          relevance: computeTextRelevance(req.title, a.elementName),
          confidence: 1.0,
          hasAllResolutions: !!a.semanticMeaning,
          isStale: false,
          needsRefresh: false,
        });
      }
      break;
    }

    case 'capability': {
      const capabilities = await prisma.capability.findMany({
        where: {
          ...(req.targetId ? { targetId: req.targetId } : {}),
          OR: [
            { name: { contains: extractKeyTerms(req.title), mode: 'insensitive' } },
            { userDescription: { contains: extractKeyTerms(req.title), mode: 'insensitive' } },
          ],
        },
        take: 5,
      });

      for (const c of capabilities) {
        matches.push({
          id: c.id,
          entityType: 'capability',
          title: c.name,
          relevance: computeTextRelevance(req.title, c.name),
          confidence: 1.0,
          hasAllResolutions: !!(c.userDescription && c.technicalDescription),
          isStale: false,
          needsRefresh: false,
        });
      }
      break;
    }

    case 'blueprint': {
      const blueprints = await prisma.blueprint.findMany({
        where: {
          ...(req.targetId ? { targetId: req.targetId } : {}),
          OR: [
            { name: { contains: extractKeyTerms(req.title), mode: 'insensitive' } },
            { description: { contains: extractKeyTerms(req.title), mode: 'insensitive' } },
          ],
        },
        take: 3,
      });

      for (const b of blueprints) {
        matches.push({
          id: b.id,
          entityType: 'blueprint',
          title: b.name,
          relevance: computeTextRelevance(req.title, b.name),
          confidence: 1.0,
          hasAllResolutions: !!(b.description),
          isStale: false,
          needsRefresh: false,
        });
      }
      break;
    }
  }

  // Sort by relevance
  matches.sort((a, b) => b.relevance - a.relevance);

  return { existingEntities: matches };
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4: BUILD PROPOSAL — Show the user what we'll do
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the proposal summary that gets shown to the user for review.
 */
async function buildProposalSummary(petitionId: string): Promise<void> {
  const requirements = await prisma.petitionRequirement.findMany({
    where: { petitionId },
  });

  const coverageChecks = await prisma.petitionCoverageCheck.findMany({
    where: { petitionId },
  });

  const exists = requirements.filter(r => r.status === 'EXISTS');
  const needsGeneration = requirements.filter(r => r.status === 'PROPOSED');

  // Estimate costs
  let totalEstimatedCost = 0;
  let totalEstimatedCalls = 0;

  for (const req of needsGeneration) {
    const coverageResult = req.coverageResult as any;
    totalEstimatedCost += coverageResult?.estimated_cost ?? 0.015;
    totalEstimatedCalls += 1;
  }

  // Compute estimated time (roughly 2 seconds per API call)
  const estimatedTimeMinutes = Math.ceil(totalEstimatedCalls * 2 / 60);

  // Find unique targets
  const targetsInvolved = [...new Set(
    requirements.map(r => r.targetId).filter(Boolean) as string[],
  )];

  // Find new concepts, algorithms
  const newConcepts = needsGeneration
    .filter(r => r.entityType === 'concept')
    .map(r => r.title);

  const newAlgorithms = needsGeneration
    .filter(r => r.entityType === 'algorithm')
    .map(r => r.title);

  // Find reusable content
  const reusable = coverageChecks
    .filter(c => c.relevance > 0.7 && !c.needsRefresh)
    .map(c => ({
      id: c.entityId,
      title: c.entityTitle,
      reason: `Already exists with ${(c.currentConfidence * 100).toFixed(0)}% confidence`,
    }));

  const summary = {
    total_requirements: requirements.length,
    already_exists: exists.length,
    needs_generation: needsGeneration.length,
    estimated_api_calls: totalEstimatedCalls,
    estimated_cost_usd: Math.round(totalEstimatedCost * 100) / 100,
    estimated_time_minutes: estimatedTimeMinutes,
    targets_involved: targetsInvolved,
    new_concepts: newConcepts,
    new_algorithms: newAlgorithms,
    reusable_from_existing: reusable,
    requirements_by_layer: {
      reference: requirements.filter(r => r.layer === 'reference').length,
      implementation: requirements.filter(r => r.layer === 'implementation').length,
      blueprint: requirements.filter(r => r.layer === 'blueprint').length,
    },
    requirements_core_vs_optional: {
      core: requirements.filter(r => r.isCore).length,
      optional: requirements.filter(r => !r.isCore).length,
    },
  };

  await prisma.petition.update({
    where: { id: petitionId },
    data: {
      status: 'PROPOSAL_READY',
      proposalSummary: summary,
      conversationHistory: {
        push: {
          role: 'system',
          content: formatProposalMessage(summary, requirements),
          timestamp: new Date().toISOString(),
        },
      },
    },
  });
}

/**
 * Format the proposal as a human-readable message.
 */
function formatProposalMessage(
  summary: any,
  requirements: any[],
): string {
  let msg = `I've analyzed your request and prepared a generation proposal.\n\n`;

  msg += `**Summary:**\n`;
  msg += `- ${summary.total_requirements} knowledge requirements identified\n`;
  msg += `- ${summary.already_exists} already exist in the database ✅\n`;
  msg += `- ${summary.needs_generation} need to be generated\n`;
  msg += `- Estimated cost: $${summary.estimated_cost_usd}\n`;
  msg += `- Estimated time: ~${summary.estimated_time_minutes} minutes\n`;
  msg += `- Targets involved: ${summary.targets_involved.join(', ')}\n\n`;

  if (summary.reusable_from_existing.length > 0) {
    msg += `**Already in database (will be linked, not regenerated):**\n`;
    for (const r of summary.reusable_from_existing) {
      msg += `  ✅ ${r.title}\n`;
    }
    msg += `\n`;
  }

  if (summary.new_concepts.length > 0) {
    msg += `**New concepts to create:**\n`;
    for (const c of summary.new_concepts) {
      msg += `  🆕 ${c}\n`;
    }
    msg += `\n`;
  }

  if (summary.new_algorithms.length > 0) {
    msg += `**New algorithms to extract:**\n`;
    for (const a of summary.new_algorithms) {
      msg += `  🔬 ${a}\n`;
    }
    msg += `\n`;
  }

  msg += `**Requirements breakdown:**\n`;
  const coreReqs = requirements.filter((r: any) => r.isCore);
  const optionalReqs = requirements.filter((r: any) => !r.isCore);

  msg += `\n  Core (${coreReqs.length}):\n`;
  for (const r of coreReqs) {
    const status = r.status === 'EXISTS' ? '✅' : '📝';
    msg += `    ${status} ${r.title}\n`;
  }

  if (optionalReqs.length > 0) {
    msg += `\n  Optional (${optionalReqs.length}):\n`;
    for (const r of optionalReqs) {
      const status = r.status === 'EXISTS' ? '✅' : '📝';
      msg += `    ${status} ${r.title}\n`;
    }
  }

  msg += `\nYou can:\n`;
  msg += `  • Approve as-is: all ${summary.needs_generation} items will be generated\n`;
  msg += `  • Exclude specific requirements you don't need\n`;
  msg += `  • Add additional requirements I may have missed\n`;
  msg += `  • Modify the scope of any requirement\n`;

  return msg;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5: USER INTERACTION — Review, modify, approve
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the current proposal for user review.
 */
async function getProposal(petitionId: string): Promise<{
  petition: any;
  requirements: any[];
  coverageChecks: any[];
  conversationHistory: any[];
}> {
  const petition = await prisma.petition.findUniqueOrThrow({
    where: { id: petitionId },
  });

  const requirements = await prisma.petitionRequirement.findMany({
    where: { petitionId },
    orderBy: [{ isCore: 'desc' }, { orderIndex: 'asc' }],
  });

  const coverageChecks = await prisma.petitionCoverageCheck.findMany({
    where: { petitionId },
    orderBy: { relevance: 'desc' },
  });

  return {
    petition,
    requirements,
    coverageChecks,
    conversationHistory: petition.conversationHistory as any[],
  };
}

/**
 * User sends a message to modify the proposal.
 *
 * The AI interprets the message and adjusts requirements accordingly.
 */
async function sendMessage(
  petitionId: string,
  userMessage: string,
): Promise<{ response: string; requirementsChanged: number }> {
  const petition = await prisma.petition.findUniqueOrThrow({
    where: { id: petitionId },
  });

  const requirements = await prisma.petitionRequirement.findMany({
    where: { petitionId },
    orderBy: { orderIndex: 'asc' },
  });

  // Add user message to conversation
  const history = [...(petition.conversationHistory as any[]), {
    role: 'user',
    content: userMessage,
    timestamp: new Date().toISOString(),
  }];

  // Ask AI to interpret the modification
  const modPrompt = {
    system: `You are managing a knowledge generation proposal. The user is reviewing the proposal and requesting changes.

Current requirements:
${requirements.map((r, i) => `${i + 1}. [${r.status}] (${r.entityType}) ${r.title}: ${r.description}`).join('\n')}

Interpret the user's message and return JSON describing the changes:
{
  "response": "Human-friendly response to the user",
  "actions": [
    { "action": "add", "entity_type": "...", "target_id": "...", "title": "...", "description": "...", "is_core": true },
    { "action": "remove", "requirement_index": 5, "reason": "..." },
    { "action": "modify", "requirement_index": 3, "new_description": "...", "new_title": "..." },
    { "action": "accept", "requirement_index": 1 },
    { "action": "reject", "requirement_index": 7, "reason": "..." }
  ]
}`,

    instruction: userMessage,
  };

  const response = await callModel('CHEAP', modPrompt);
  const parsed = parseResponse(response.raw);

  if (!parsed.success) {
    const fallbackResponse = 'I had trouble understanding that. Could you be more specific about which requirements you want to change?';

    history.push({
      role: 'system',
      content: fallbackResponse,
      timestamp: new Date().toISOString(),
    });

    await prisma.petition.update({
      where: { id: petitionId },
      data: { conversationHistory: history },
    });

    return { response: fallbackResponse, requirementsChanged: 0 };
  }

  const modifications = parsed.data;
  let changedCount = 0;

  for (const action of modifications.actions ?? []) {
    switch (action.action) {
      case 'add': {
        await prisma.petitionRequirement.create({
          data: {
            petitionId,
            orderIndex: requirements.length + changedCount,
            entityType: action.entity_type,
            targetId: action.target_id,
            title: action.title,
            description: action.description,
            isCore: action.is_core ?? false,
            status: 'PROPOSED',
          },
        });
        changedCount++;
        break;
      }

      case 'remove':
      case 'reject': {
        const reqToRemove = requirements[action.requirement_index - 1];
        if (reqToRemove) {
          await prisma.petitionRequirement.update({
            where: { id: reqToRemove.id },
            data: {
              status: 'REJECTED',
              userNote: action.reason ?? userMessage,
            },
          });
          changedCount++;
        }
        break;
      }

      case 'modify': {
        const reqToModify = requirements[action.requirement_index - 1];
        if (reqToModify) {
          await prisma.petitionRequirement.update({
            where: { id: reqToModify.id },
            data: {
              status: 'MODIFIED',
              modifiedScope: action.new_description,
              title: action.new_title ?? reqToModify.title,
              userNote: userMessage,
            },
          });
          changedCount++;
        }
        break;
      }

      case 'accept': {
        const reqToAccept = requirements[action.requirement_index - 1];
        if (reqToAccept) {
          await prisma.petitionRequirement.update({
            where: { id: reqToAccept.id },
            data: { status: 'ACCEPTED' },
          });
          changedCount++;
        }
        break;
      }
    }
  }

  // Update conversation
  history.push({
    role: 'system',
    content: modifications.response,
    timestamp: new Date().toISOString(),
  });

  await prisma.petition.update({
    where: { id: petitionId },
    data: {
      status: 'PROPOSAL_READY',
      conversationHistory: history,
    },
  });

  // Rebuild proposal summary
  if (changedCount > 0) {
    await buildProposalSummary(petitionId);
  }

  return {
    response: modifications.response,
    requirementsChanged: changedCount,
  };
}

/**
 * User approves the proposal. Creates work items and starts execution.
 */
async function approvePetition(
  petitionId: string,
  options?: {
    excludeRequirementIds?: string[];
    maxBudgetUsd?: number;
  },
): Promise<{
  workItemsCreated: number;
  estimatedCost: number;
  message: string;
}> {
  const petition = await prisma.petition.findUniqueOrThrow({
    where: { id: petitionId },
  });

  if (petition.status !== 'PROPOSAL_READY') {
    throw new Error(`Petition ${petitionId} is not in PROPOSAL_READY state (current: ${petition.status})`);
  }

  // Get all accepted/proposed requirements (excluding rejected/existing ones)
  const requirements = await prisma.petitionRequirement.findMany({
    where: {
      petitionId,
      status: { in: ['PROPOSED', 'ACCEPTED', 'MODIFIED'] },
      ...(options?.excludeRequirementIds?.length
        ? { id: { notIn: options.excludeRequirementIds } }
        : {}),
    },
    orderBy: [{ isCore: 'desc' }, { orderIndex: 'asc' }],
  });

  await prisma.petition.update({
    where: { id: petitionId },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedScope: {
        included: requirements.map(r => r.id),
        excluded: options?.excludeRequirementIds ?? [],
        maxBudget: options?.maxBudgetUsd,
      },
    },
  });

  // ── Create work items ──
  // Group requirements by target to find/create MasterPlans
  const byTarget = new Map<string, typeof requirements>();

  for (const req of requirements) {
    const key = req.targetId ?? '__universal__';
    if (!byTarget.has(key)) byTarget.set(key, []);
    byTarget.get(key)!.push(req);
  }

  let totalWorkItemsCreated = 0;
  let totalEstimatedCost = 0;

  for (const [targetId, reqs] of byTarget) {
    const actualTargetId = targetId === '__universal__' ? null : targetId;

    // Find or create a MasterPlan for this target
    let plan: any = null;

    if (actualTargetId) {
      plan = await prisma.masterPlan.findFirst({
        where: {
          targetId: actualTargetId,
          status: { in: ['READY', 'IN_PROGRESS', 'PAUSED'] },
        },
      });

      if (!plan) {
        // Create a new plan for this target
        const coverage = await analyzeCoverage(actualTargetId);
        const planResult = await buildMasterPlan(actualTargetId, coverage);
        plan = await prisma.masterPlan.findUnique({ where: { id: planResult.planId } });
      }
    }

    // Create work items for each requirement
    for (const req of reqs) {
      // Determine the appropriate phase
      const phase = mapEntityTypeToPhase(req.entityType);
      const modelTier = getModelTierForEntityType(req.entityType);

      // Check if a matching work item already exists (dedup across petitions)
      const existingItem = plan ? await prisma.workItem.findFirst({
        where: {
          planId: plan.id,
          entityType: req.entityType,
          path: req.path,
          status: { notIn: ['FAILED', 'SKIPPED'] },
        },
      }) : null;

      let workItemId: string;

      if (existingItem) {
        // Link to existing work item (another petition or pipeline already created it)
        workItemId = existingItem.id;

        await prisma.petitionWorkItemLink.create({
          data: {
            petitionId,
            workItemId,
            requirementId: req.id,
            isNewlyCreated: false,
          },
        });
      } else {
        // Create new work item
        const promptContext = await buildPromptForRequirement(req, petition);

        const newItem = await prisma.workItem.create({
          data: {
            planId: plan?.id ?? 'petition_adhoc', // TODO: handle universal items
            phase,
            status: 'READY',
            entityType: req.entityType,
            title: req.title,
            path: req.path,
            reason: 'INITIAL_PLAN',
            modelTier,
            promptContext,
            executionOrder: req.orderIndex,
          },
        });

        workItemId = newItem.id;
        totalWorkItemsCreated++;

        const coverageResult = req.coverageResult as any;
        totalEstimatedCost += coverageResult?.estimated_cost ?? 0.015;

        await prisma.petitionWorkItemLink.create({
          data: {
            petitionId,
            workItemId: newItem.id,
            requirementId: req.id,
            isNewlyCreated: true,
          },
        });
      }

      // Update requirement with work item link
      await prisma.petitionRequirement.update({
        where: { id: req.id },
        data: {
          status: 'IN_PROGRESS',
          workItemId,
        },
      });
    }
  }

  // Update petition
  await prisma.petition.update({
    where: { id: petitionId },
    data: {
      status: 'IN_PROGRESS',
      totalWorkItems: totalWorkItemsCreated,
      conversationHistory: {
        push: {
          role: 'system',
          content: `Approved! Created ${totalWorkItemsCreated} work items. ` +
            `Estimated cost: $${totalEstimatedCost.toFixed(2)}. ` +
            `Generation is now in progress.`,
          timestamp: new Date().toISOString(),
        },
      },
    },
  });

  return {
    workItemsCreated: totalWorkItemsCreated,
    estimatedCost: totalEstimatedCost,
    message: `Created ${totalWorkItemsCreated} work items. Generation started.`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 6: MONITOR — Track progress and notify on completion
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get real-time status of a petition.
 */
async function getPetitionStatus(petitionId: string): Promise<{
  status: string;
  progress: {
    total: number;
    completed: number;
    inProgress: number;
    failed: number;
    percentage: number;
  };
  costSoFar: number;
  recentActivity: any[];
  deliverables: any;
}> {
  const petition = await prisma.petition.findUniqueOrThrow({
    where: { id: petitionId },
  });

  const links = await prisma.petitionWorkItemLink.findMany({
    where: { petitionId },
    select: { workItemId: true },
  });

  const workItemIds = links.map(l => l.workItemId);

  // Get status counts
  const statusCounts = await prisma.workItem.groupBy({
    by: ['status'],
    where: { id: { in: workItemIds } },
    _count: true,
  });

  const counts = Object.fromEntries(
    statusCounts.map(s => [s.status, s._count]),
  );

  const total = workItemIds.length;
  const completed = (counts.VALIDATED ?? 0) + (counts.SKIPPED ?? 0);
  const inProgress = counts.IN_PROGRESS ?? 0;
  const failed = counts.FAILED ?? 0;

  // Get cost so far
  const costAgg = await prisma.workItem.aggregate({
    where: { id: { in: workItemIds } },
    _sum: { costUsd: true },
  });

  // Get recent activity
  const recentItems = await prisma.workItem.findMany({
    where: {
      id: { in: workItemIds },
      completedAt: { not: null },
    },
    orderBy: { completedAt: 'desc' },
    take: 10,
    select: {
      title: true,
      status: true,
      completedAt: true,
      parseStrategy: true,
    },
  });

  // Check if all done
  if (completed + failed >= total && petition.status === 'IN_PROGRESS') {
    await completePetition(petitionId);
  }

  return {
    status: petition.status,
    progress: {
      total,
      completed,
      inProgress,
      failed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    },
    costSoFar: costAgg._sum.costUsd ?? 0,
    recentActivity: recentItems,
    deliverables: petition.deliverables,
  };
}

/**
 * Called when all work items for a petition are done.
 * Builds the deliverables summary.
 */
async function completePetition(petitionId: string): Promise<void> {
  const requirements = await prisma.petitionRequirement.findMany({
    where: {
      petitionId,
      status: { in: ['IN_PROGRESS', 'COMPLETED'] },
      workItemId: { not: null },
    },
  });

  // Gather all created entities
  const deliverables: Record<string, any[]> = {
    concepts: [],
    entries: [],
    algorithms: [],
    atoms: [],
    capabilities: [],
    blueprints: [],
  };

  let totalTokens = 0;

  for (const req of requirements) {
    if (!req.workItemId) continue;

    const workItem = await prisma.workItem.findUnique({
      where: { id: req.workItemId },
      select: { status: true, targetEntityId: true, parsedData: true },
    });

    if (workItem?.status === 'VALIDATED' && workItem.targetEntityId) {
      const key = `${req.entityType}s` as string;
      if (deliverables[key]) {
        deliverables[key].push({
          id: workItem.targetEntityId,
          title: req.title,
          target: req.targetId,
          path: req.path,
        });
      }

      await prisma.petitionRequirement.update({
        where: { id: req.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    }
  }

  // Count total tokens of generated content
  const entryIds = deliverables.entries.map((e: any) => e.id);
  if (entryIds.length > 0) {
    const tokenSum = await prisma.entry.aggregate({
      where: { id: { in: entryIds } },
      _sum: {
        tokensMicro: true,
        tokensStandard: true,
        tokensExhaustive: true,
      },
    });
    totalTokens =
      (tokenSum._sum.tokensMicro ?? 0) +
      (tokenSum._sum.tokensStandard ?? 0) +
      (tokenSum._sum.tokensExhaustive ?? 0);
  }

  const costAgg = await prisma.workItem.aggregate({
    where: { id: { in: requirements.map(r => r.workItemId).filter(Boolean) as string[] } },
    _sum: { costUsd: true },
  });

  const completionNote =
    `Generated ${deliverables.entries.length} entries, ` +
    `${deliverables.algorithms.length} algorithms, ` +
    `${deliverables.atoms.length} atoms, ` +
    `${deliverables.capabilities.length} capabilities, ` +
    `${deliverables.blueprints.length} blueprints. ` +
    `Total knowledge: ~${totalTokens} tokens. ` +
    `Cost: $${(costAgg._sum.costUsd ?? 0).toFixed(2)}.`;

  await prisma.petition.update({
    where: { id: petitionId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      completedWorkItems: deliverables.entries.length +
        deliverables.algorithms.length +
        deliverables.atoms.length +
        deliverables.capabilities.length +
        deliverables.blueprints.length,
      actualCostUsd: costAgg._sum.costUsd ?? 0,
      completionNote,
      deliverables: { ...deliverables, total_knowledge_tokens: totalTokens },
      conversationHistory: {
        push: {
          role: 'system',
          content: `✅ Your petition is complete!\n\n${completionNote}\n\nAll knowledge has been committed to the database and is available for queries.`,
          timestamp: new Date().toISOString(),
        },
      },
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function extractKeyTerms(text: string): string {
  // Simple keyword extraction — take the most significant words
  const stopWords = new Set([
    'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'and', 'or', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'how', 'what', 'which',
  ]);

  return text
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w))
    .slice(0, 3)
    .join(' ');
}

function computeTextRelevance(query: string, candidate: string): number {
  const queryTerms = query.toLowerCase().split(/\s+/);
  const candidateLower = candidate.toLowerCase();

  let matches = 0;
  for (const term of queryTerms) {
    if (candidateLower.includes(term)) matches++;
  }

  return queryTerms.length > 0 ? matches / queryTerms.length : 0;
}

function estimateRequirementCost(entityType: string): number {
  const costs: Record<string, number> = {
    concept: 0.005,
    entry: 0.015,
    algorithm: 0.025,
    atom: 0.010,
    capability: 0.020,
    blueprint: 0.030,
  };
  return costs[entityType] ?? 0.015;
}

function getModelTierForEntityType(entityType: string): 'CHEAP' | 'MID' | 'EXPENSIVE' {
  const tiers: Record<string, 'CHEAP' | 'MID' | 'EXPENSIVE'> = {
    concept: 'MID',
    entry: 'MID',
    algorithm: 'MID',
    atom: 'MID',
    capability: 'MID',
    blueprint: 'EXPENSIVE',
  };
  return tiers[entityType] ?? 'MID';
}

function mapEntityTypeToPhase(entityType: string): any {
  const phases: Record<string, string> = {
    concept: 'GENERATE_REFERENCE',
    entry: 'GENERATE_REFERENCE',
    algorithm: 'EXTRACT_ALGORITHMS',
    atom: 'EXTRACT_ATOMS',
    capability: 'ENUMERATE_CAPABILITIES',
    blueprint: 'ASSEMBLE_BLUEPRINTS',
  };
  return phases[entityType] ?? 'GENERATE_REFERENCE';
}

async function buildPromptForRequirement(
  req: any,
  petition: any,
): Promise<Record<string, any>> {
  return {
    system: `You are generating knowledge for the magB database. Context: This was requested as part of a user petition: "${petition.title}"`,
    instruction: req.modifiedScope ?? req.description,
    entityType: req.entityType,
    targetId: req.targetId,
    path: req.path,
    petition_context: petition.useCaseContext,
  };
}
```

---

## The Complete User Flow

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    PETITION FLOW: GRADIENT TOOL EXAMPLE                     ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  USER: "I need the database to know how to replicate the                    ║
║         gradient tool in Photoshop"                                          ║
║                                                                              ║
║  ┌─────────────────────────────────────────────────────────────────────┐    ║
║  │ STEP 1: SUBMIT                                                      │    ║
║  │   petition = submitPetition({                                       │    ║
║  │     title: "Replicate Photoshop's Gradient Tool",                   │    ║
║  │     description: "...",                                              │    ║
║  │     targetHints: ["photoshop", "svg", "css"],                       │    ║
║  │     outputFormats: ["svg", "html_canvas"],                          │    ║
║  │     useCaseContext: "Building a design tool"                        │    ║
║  │   })                                                                 │    ║
║  └────────────────────────────┬────────────────────────────────────────┘    ║
║                               ▼                                              ║
║  ┌─────────────────────────────────────────────────────────────────────┐    ║
║  │ STEP 2: AI DECOMPOSITION (1 API call, ~$0.02)                       │    ║
║  │                                                                      │    ║
║  │   AI identifies 23 requirements:                                    │    ║
║  │                                                                      │    ║
║  │   CONCEPTS (3):                                                      │    ║
║  │     1. Gradient Interpolation                                       │    ║
║  │     2. Color Stops & Midpoints                                      │    ║
║  │     3. Dithering                                                     │    ║
║  │                                                                      │    ║
║  │   ENTRIES (10):                                                      │    ║
║  │     4. Photoshop/Tools/Gradient/Overview                            │    ║
║  │     5. Photoshop/Tools/Gradient/Linear                              │    ║
║  │     6. Photoshop/Tools/Gradient/Radial                              │    ║
║  │     7. Photoshop/Tools/Gradient/Angular                             │    ║
║  │     8. Photoshop/Tools/Gradient/Diamond                             │    ║
║  │     9. Photoshop/Tools/Gradient/Reflected                           │    ║
║  │    10. Photoshop/Tools/Gradient/Dithering                           │    ║
║  │    11. SVG/Gradients/linearGradient                                 │    ║
║  │    12. SVG/Gradients/radialGradient                                 │    ║
║  │    13. CSS/Gradients/linear-gradient                                │    ║
║  │                                                                      │    ║
║  │   ALGORITHMS (4):                                                    │    ║
║  │    14. Linear Color Interpolation (sRGB)                            │    ║
║  │    15. Linear Color Interpolation (Lab)                             │    ║
║  │    16. Radial Gradient Rendering                                    │    ║
║  │    17. Ordered Dithering for Gradients                              │    ║
║  │                                                                      │    ║
║  │   ATOMS (3):                                                         │    ║
║  │    18. SVG <linearGradient> element                                 │    ║
║  │    19. SVG <radialGradient> element                                 │    ║
║  │    20. SVG <stop> element                                           │    ║
║  │                                                                      │    ║
║  │   CAPABILITIES (2):                                                  │    ║
║  │    21. Render Linear Gradient to Bitmap                             │    ║
║  │    22. Render Radial Gradient to Bitmap                             │    ║
║  │                                                                      │    ║
║  │   BLUEPRINTS (1):                                                    │    ║
║  │    23. Gradient Rendering Engine                                    │    ║
║  └────────────────────────────┬────────────────────────────────────────┘    ║
║                               ▼                                              ║
║  ┌─────────────────────────────────────────────────────────────────────┐    ║
║  │ STEP 3: COVERAGE CHECK (0 API calls, pure DB queries)               │    ║
║  │                                                                      │    ║
║  │   Found in database:                                                │    ║
║  │     ✅ #1 Gradient Interpolation (concept exists, 92% confidence)   │    ║
║  │     ✅ #11 SVG/linearGradient (entry exists, 87% confidence)        │    ║
║  │     ✅ #12 SVG/radialGradient (entry exists, 85% confidence)        │    ║
║  │     ✅ #14 Linear Color Interpolation sRGB (algorithm exists)       │    ║
║  │     ✅ #18 SVG <linearGradient> (atom exists)                       │    ║
║  │     ✅ #19 SVG <radialGradient> (atom exists)                       │    ║
║  │     ✅ #20 SVG <stop> (atom exists)                                 │    ║
║  │     🔶 #13 CSS/linear-gradient (partial, missing exhaustive)        │    ║
║  │                                                                      │    ║
║  │   NOT in database (needs generation):                               │    ║
║  │     📝 #2, #3, #4-10, #15-17, #21-23                               │    ║
║  │                                                                      │    ║
║  │   Result: 8 exist, 1 partial, 14 need generation                   │    ║
║  └────────────────────────────┬────────────────────────────────────────┘    ║
║                               ▼                                              ║
║  ┌─────────────────────────────────────────────────────────────────────┐    ║
║  │ STEP 4: PROPOSAL TO USER                                            │    ║
║  │                                                                      │    ║
║  │   "I've analyzed your request. Here's what I propose:               │    ║
║  │                                                                      │    ║
║  │    • 23 requirements identified                                     │    ║
║  │    • 8 already exist ✅ (will be linked, not regenerated)           │    ║
║  │    • 15 need generation                                              │    ║
║  │    • Estimated cost: $0.42                                          │    ║
║  │    • Estimated time: ~3 minutes                                     │    ║
║  │                                                                      │    ║
║  │    Approve? Modify? Add something I missed?"                        │    ║
║  └────────────────────────────┬────────────────────────────────────────┘    ║
║                               ▼                                              ║
║  USER: "Also include diamond gradients and the noise gradient option"       ║
║                               ▼                                              ║
║  ┌─────────────────────────────────────────────────────────────────────┐    ║
║  │ STEP 5: AI MODIFIES PROPOSAL (1 API call, ~$0.003)                  │    ║
║  │                                                                      │    ║
║  │   "Updated! Added 2 new requirements:                               │    ║
║  │    24. Algorithm: Diamond Gradient Rendering                        │    ║
║  │    25. Entry: Photoshop/Tools/Gradient/Noise                        │    ║
║  │                                                                      │    ║
║  │    New total: 17 items to generate, $0.47"                          │    ║
║  └────────────────────────────┬────────────────────────────────────────┘    ║
║                               ▼                                              ║
║  USER: "Looks good, approve it"                                             ║
║                               ▼                                              ║
║  ┌─────────────────────────────────────────────────────────────────────┐    ║
║  │ STEP 6: EXECUTION (17 API calls through standard pipeline)          │    ║
║  │                                                                      │    ║
║  │   Creates WorkItems in MasterPlan(s) for:                           │    ║
║  │     photoshop (10 items), svg (0 — reused), css (1 item),           │    ║
║  │     universal (6 algorithms/concepts)                               │    ║
║  │                                                                      │    ║
║  │   Processes through standard pipeline:                              │    ║
║  │     CLAIM → API → PARSE → VALIDATE → COMMIT → PROPAGATE            │    ║
║  │                                                                      │    ║
║  │   Progress updates:                                                  │    ║
║  │     [===========                    ] 35% (6/17) $0.14              │    ║
║  │     [========================       ] 76% (13/17) $0.33             │    ║
║  │     [==============================] 100% (17/17) $0.41            │    ║
║  └────────────────────────────┬────────────────────────────────────────┘    ║
║                               ▼                                              ║
║  ┌─────────────────────────────────────────────────────────────────────┐    ║
║  │ STEP 7: COMPLETION NOTIFICATION                                     │    ║
║  │                                                                      │    ║
║  │   "✅ Your petition is complete!                                    │    ║
║  │                                                                      │    ║
║  │    Generated:                                                        │    ║
║  │      2 concepts, 8 entries, 4 algorithms,                           │    ║
║  │      2 capabilities, 1 blueprint                                    │    ║
║  │                                                                      │    ║
║  │    Reused (already existed):                                        │    ║
║  │      1 concept, 3 entries, 1 algorithm, 3 atoms                    │    ║
║  │                                                                      │    ║
║  │    Total knowledge: ~32,000 tokens                                  │    ║
║  │    Cost: $0.41                                                       │    ║
║  │                                                                      │    ║
║  │    The database now contains everything needed to                   │    ║
║  │    replicate Photoshop's gradient tool, including:                  │    ║
║  │    • All 6 gradient types with rendering algorithms                 │    ║
║  │    • Color interpolation in sRGB and Lab color spaces               │    ║
║  │    • Dithering and noise gradient algorithms                        │    ║
║  │    • SVG and CSS output format atoms                                │    ║
║  │    • A complete 'Gradient Rendering Engine' blueprint"              │    ║
║  └─────────────────────────────────────────────────────────────────────┘    ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## API Surface

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// petition-api.ts — Clean API for frontend/CLI integration
// ═══════════════════════════════════════════════════════════════════════════════

export const PetitionAPI = {

  /** Submit a new petition */
  submit: submitPetition,
  // POST /api/petitions
  // Body: { title, description, targetHints?, outputFormats?, useCaseContext?, priority? }
  // Returns: { petitionId, status, message }

  /** Get proposal for review */
  getProposal: getProposal,
  // GET /api/petitions/:id/proposal
  // Returns: { petition, requirements, coverageChecks, conversationHistory }

  /** Send a message to modify the proposal */
  sendMessage: sendMessage,
  // POST /api/petitions/:id/messages
  // Body: { message: "Also include diamond gradients" }
  // Returns: { response, requirementsChanged }

  /** Approve the proposal and start execution */
  approve: approvePetition,
  // POST /api/petitions/:id/approve
  // Body: { excludeRequirementIds?, maxBudgetUsd? }
  // Returns: { workItemsCreated, estimatedCost, message }

  /** Get real-time status */
  getStatus: getPetitionStatus,
  // GET /api/petitions/:id/status
  // Returns: { status, progress, costSoFar, recentActivity, deliverables }

  /** Cancel a petition */
  cancel: async (petitionId: string) => {
    await prisma.petition.update({
      where: { id: petitionId },
      data: { status: 'CANCELLED' },
    });
    // Cancel all in-progress work items
    const links = await prisma.petitionWorkItemLink.findMany({
      where: { petitionId, isNewlyCreated: true },
    });
    await prisma.workItem.updateMany({
      where: {
        id: { in: links.map(l => l.workItemId) },
        status: { in: ['READY', 'BLOCKED', 'NOT_STARTED'] },
      },
      data: { status: 'SKIPPED' },
    });
  },
  // POST /api/petitions/:id/cancel

  /** List user's petitions */
  list: async (userId: string) => {
    return prisma.petition.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        completedWorkItems: true,
        totalWorkItems: true,
        actualCostUsd: true,
      },
    });
  },
  // GET /api/petitions?userId=xxx
};
```

---

## What Makes This Different

| Aspect | Without Petitions | With Petitions |
|--------|-------------------|----------------|
| **User input** | Must know entity types, paths, schemas | Natural language: "I want to replicate X" |
| **Discovery** | User searches DB manually | AI searches DB, reports what exists |
| **Scope** | User creates individual requests | AI decomposes into complete requirement set |
| **Dedup** | Might duplicate existing knowledge | Coverage check prevents all duplication |
| **Cost** | Unknown until execution | Estimated upfront, approved before spending |
| **Interaction** | Submit and wait | Conversational: review, modify, approve |
| **Completeness** | User might miss related requirements | AI identifies dependencies and related concepts |
| **Cross-target** | Must manually request for each target | AI identifies all relevant targets automatically |
| **Tracking** | Check individual work items | Single petition status with progress bar |
| **Delivery** | Find generated data manually | Structured deliverables with token counts |

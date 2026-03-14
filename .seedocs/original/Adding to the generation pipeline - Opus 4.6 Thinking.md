

# User Petitions & Interactive Knowledge Requests

## The Problem

The pipeline is designed for systematic, exhaustive generation — it crawls entire targets methodically. But users have specific, cross-cutting needs that don't fit neatly into "generate all of Python." A user asking "how do I replicate Photoshop's gradient tool" is asking for something that spans:

- **Algorithms**: Linear interpolation, color space conversion, dithering
- **File format atoms**: How gradients are stored in PSD, how they render in SVG/CSS/Canvas
- **Capabilities**: "Apply linear gradient", "Apply radial gradient", "Gradient with multiple stops"
- **Blueprints**: Full architecture for a gradient rendering engine
- **Cross-target knowledge**: How Photoshop does it vs how CSS does it vs how SVG does it

No single target's generation plan covers this. The user is asking for a **knowledge synthesis** that cuts across the entire graph.

## Design: The Petition System

A Petition is a user's declaration of intent: "I need the database to be able to answer questions about X." The system then figures out what knowledge is missing and creates a targeted generation plan to fill exactly those gaps.

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         PETITION LIFECYCLE                                  ║
║                                                                             ║
║   USER                                                                      ║
║    │                                                                        ║
║    │  "I want to replicate Photoshop's gradient tool"                       ║
║    │                                                                        ║
║    ▼                                                                        ║
║   ┌─────────────┐    ┌──────────────┐    ┌──────────────┐                   ║
║   │  PETITION   │───▶│  DECOMPOSER  │───▶│  CARTOGRAPH  │                   ║
║   │  INTAKE     │    │              │    │  (per topic) │                   ║
║   │             │    │ "What topics │    │              │                   ║
║   │ Parse user  │    │  does this   │    │ "What do we  │                   ║
║   │ intent into │    │  require?"   │    │  already     │                   ║
║   │ structured  │    │              │    │  know?"      │                   ║
║   │ petition    │    │ Returns:     │    │              │                   ║
║   └─────────────┘    │ KnowledgeReq │    │ Returns:     │                   ║
║                      └──────────────┘    │ GapReport    │                   ║
║                                          └──────┬───────┘                   ║
║                                                 │                           ║
║                                          ┌──────▼───────┐                   ║
║                                          │  STRATEGIST  │                   ║
║                                          │              │                   ║
║                                          │ Build a      │                   ║
║                                          │ targeted     │                   ║
║                                          │ plan for     │                   ║
║                                          │ ONLY the     │                   ║
║                                          │ gaps         │                   ║
║                                          └──────┬───────┘                   ║
║                                                 │                           ║
║                            ┌────────────────────┼────────────────┐          ║
║                            │                    │                │          ║
║                     ┌──────▼──────┐     ┌───────▼─────┐  ┌──────▼──────┐   ║
║                     │  EXECUTOR   │     │  EXECUTOR   │  │  EXECUTOR   │   ║
║                     │ (algorithms)│     │ (atoms)     │  │ (blueprint) │   ║
║                     └──────┬──────┘     └───────┬─────┘  └──────┬──────┘   ║
║                            │                    │                │          ║
║                            └────────────────────┼────────────────┘          ║
║                                                 │                           ║
║                                          ┌──────▼───────┐                   ║
║                                          │  SYNTHESIS   │                   ║
║                                          │              │                   ║
║                                          │ Connect all  │                   ║
║                                          │ generated    │                   ║
║                                          │ knowledge    │                   ║
║                                          │ via Relations│                   ║
║                                          └──────┬───────┘                   ║
║                                                 │                           ║
║                                          ┌──────▼───────┐                   ║
║                                          │  NOTIFY USER │                   ║
║                                          │              │                   ║
║                                          │ "Your        │                   ║
║                                          │  petition is │                   ║
║                                          │  fulfilled." │                   ║
║                                          └──────────────┘                   ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Schema: Petition Models

```prisma
// ════════════════════════════════════════════════════════════════════════════════
// LAYER 9: PETITIONS — User-driven knowledge requests
//
// Users declare what they need the database to know. The system decomposes
// the request, identifies gaps, and generates exactly the missing knowledge.
// ════════════════════════════════════════════════════════════════════════════════

/// Status of a user petition
enum PetitionStatus {
  SUBMITTED            // User submitted, awaiting decomposition
  DECOMPOSING          // AI is analyzing what knowledge is needed
  ASSESSING            // Cartographer is checking what already exists
  PLANNING             // Strategist is building the generation plan
  GENERATING           // Executor is filling gaps
  SYNTHESIZING         // Connecting generated knowledge via relations
  FULFILLED            // All required knowledge exists in the database
  PARTIALLY_FULFILLED  // Some knowledge generated, but gaps remain (budget/complexity)
  REJECTED             // Out of scope or not actionable
  CANCELLED            // User cancelled
}

/// How specific is the user's request?
enum PetitionScope {
  FEATURE_REPLICATION  // "Replicate Photoshop's gradient tool"
  HOW_TO               // "How do I create a bar chart in SVG?"
  CONCEPT_DEEP_DIVE    // "I need to understand DEFLATE compression fully"
  CROSS_TARGET_COMPARE // "Compare async patterns across Python, Rust, and Go"
  BUILD_GUIDE          // "Architecture for a PDF report generator"
  EXPLORATION          // "What can I do with WebGL shaders?"
}

/// Priority level for petition processing
enum PetitionPriority {
  CRITICAL    // Blocking user work, needs immediate attention
  HIGH        // Important, should be processed soon
  NORMAL      // Standard priority
  LOW         // Nice to have, process when idle
  BACKGROUND  // Fill during off-peak, no urgency
}

/// A user's request for the database to learn something specific.
///
/// This is NOT a question — it's a declaration of intent. The user is saying
/// "I need the database to contain knowledge about X so that future queries
/// about X can be answered from structured data."
model Petition {
  id              String          @id @default(cuid())
  
  /// ── User intent (the raw request) ──
  userQuery       String          @map("user_query")
  /// The user's natural language request, exactly as submitted.
  /// "I want to replicate the gradient tool from Photoshop"
  /// "How do I programmatically create a PowerPoint with charts?"
  /// "Teach the database everything about Rust's borrow checker"

  /// Structured version of user intent (filled by decomposer)
  title           String?         /// Short title: "Photoshop Gradient Tool Replication"
  scope           PetitionScope?  /// Classified scope
  description     String?         /// AI-expanded description of what's needed
  
  /// ── User metadata ──
  userId          String?         @map("user_id")         /// Who submitted this
  userContext      String?         @map("user_context")     /// Optional: what they're building
  targetOutputs   String[]        @map("target_outputs")   /// What they want to produce
  /// e.g., ["python_library", "svg_output", "canvas_rendering"]
  
  priority        PetitionPriority @default(NORMAL)
  
  /// ── Decomposition results (filled by the Decomposer) ──
  /// What topics/knowledge does this petition require?
  knowledgeRequirements Json      @default("[]") @map("knowledge_requirements")
  /// [{
  ///   id: "kr_001",
  ///   category: "algorithm",
  ///   topic: "Linear gradient interpolation in RGB/HSL color spaces",
  ///   targetId: null,                    // null = target-agnostic
  ///   entityType: "algorithm",
  ///   importance: "critical",            // critical | important | nice_to_have
  ///   searchTerms: ["gradient", "interpolation", "color space", "linear blend"],
  ///   relatedConceptIds: ["concept.color.interpolation", "concept.rendering.gradient"],
  /// }, {
  ///   id: "kr_002",  
  ///   category: "implementation",
  ///   topic: "PSD gradient overlay layer storage format",
  ///   targetId: "psd",
  ///   entityType: "atom",
  ///   importance: "important",
  ///   searchTerms: ["psd", "gradient", "layer", "overlay"],
  /// }, ...]

  /// ── Assessment results (filled by the Cartographer) ──
  gapAssessment   Json            @default("{}") @map("gap_assessment")
  /// {
  ///   totalRequirements: 14,
  ///   alreadyExists: 6,
  ///   partiallyExists: 3,
  ///   missing: 5,
  ///   existingEntityIds: ["algo.img.gradient.linear", "entry.css.gradient", ...],
  ///   gaps: [{
  ///     requirementId: "kr_003",
  ///     topic: "Radial gradient with focal point offset",
  ///     gapType: "missing",            // "missing" | "incomplete" | "stale"
  ///     estimatedEffort: { apiCalls: 3, tokens: 12000, costUsd: 0.08 }
  ///   }, ...]
  /// }
  
  /// ── Plan reference ──
  generationPlanId String?        @map("generation_plan_id")
  
  /// ── Lifecycle ──
  status          PetitionStatus  @default(SUBMITTED)
  statusMessage   String?         @map("status_message")   /// Human-readable status update
  progress        Float           @default(0) /// 0.0 to 1.0
  
  /// ── Results ──
  /// IDs of all entities that were generated or linked to fulfill this petition
  fulfilledByEntities String[]    @map("fulfilled_by_entities")
  /// The final synthesis: a summary of what the database now knows
  fulfillmentSummary  String?     @map("fulfillment_summary")
  
  /// ── Cost tracking ──
  estimatedCostUsd Float?         @map("estimated_cost_usd")
  actualCostUsd    Float          @default(0) @map("actual_cost_usd")
  totalTokens      Int            @default(0) @map("total_tokens")
  apiCalls         Int            @default(0) @map("api_calls")
  
  /// ── Budget limits (user can cap their petition) ──
  maxCostUsd       Float?         @map("max_cost_usd")     /// "Don't spend more than $5 on this"
  maxApiCalls      Int?           @map("max_api_calls")     /// "No more than 50 API calls"
  
  /// ── Timestamps ──
  submittedAt      DateTime       @default(now()) @map("submitted_at")
  decomposedAt     DateTime?      @map("decomposed_at")
  assessedAt       DateTime?      @map("assessed_at")
  planCreatedAt    DateTime?      @map("plan_created_at")
  generationStartedAt DateTime?   @map("generation_started_at")
  fulfilledAt      DateTime?      @map("fulfilled_at")
  
  /// ── User interaction ──
  userFeedback     Json           @default("[]") @map("user_feedback")
  /// [{timestamp, message, type: "clarification"|"approval"|"rejection"|"refinement"}]
  
  metadata         Json           @default("{}")
  
  // ── Relations ──
  generationPlan   GenerationPlan? @relation(fields: [generationPlanId], references: [id])
  threads          PetitionThread[]
  votes            PetitionVote[]
  
  @@index([status, priority])
  @@index([userId])
  @@index([status, submittedAt])
  @@map("petitions")
}

/// Conversation thread on a petition — user ↔ system dialogue.
/// 
/// The system may need to ask clarifying questions.
/// The user may want to refine or expand their request.
/// This creates a structured conversation that feeds back into the pipeline.
model PetitionThread {
  id          String   @id @default(cuid())
  petitionId  String   @map("petition_id")
  
  /// Who is speaking?
  role        String   /// "user" | "system" | "decomposer" | "strategist"
  
  /// What are they saying?
  messageType String   @map("message_type")
  /// "clarification_request"    — system needs more info
  /// "clarification_response"   — user provides more info  
  /// "scope_proposal"           — system proposes what it will generate
  /// "scope_approval"           — user approves the proposal
  /// "scope_refinement"         — user adjusts the proposal
  /// "progress_update"          — system reports progress
  /// "cost_warning"             — approaching budget limit
  /// "completion_report"        — system reports what was generated
  /// "feedback"                 — user rates the results
  
  content     String   /// The message content (markdown)
  
  /// Structured data attached to the message
  data        Json     @default("{}")
  /// For clarification_request: { questions: ["Which color spaces?", "Raster or vector?"] }
  /// For scope_proposal: { requirements: [...], estimatedCost: 2.40, estimatedTime: "8 min" }
  /// For progress_update: { step: 23, total: 47, currentPhase: "GENERATE" }
  /// For completion_report: { entitiesCreated: 12, entitiesLinked: 8, totalCost: 1.80 }
  
  createdAt   DateTime @default(now()) @map("created_at")
  
  // ── Relations ──
  petition    Petition @relation(fields: [petitionId], references: [id], onDelete: Cascade)
  
  @@index([petitionId, createdAt])
  @@map("petition_threads")
}

/// Votes on petitions — community prioritization.
/// When multiple users want the same knowledge, votes push it up the queue.
model PetitionVote {
  id         BigInt   @id @default(autoincrement())
  petitionId String   @map("petition_id")
  userId     String   @map("user_id")
  weight     Int      @default(1)    /// 1 = upvote, -1 = not useful
  
  createdAt  DateTime @default(now()) @map("created_at")
  
  // ── Relations ──
  petition   Petition @relation(fields: [petitionId], references: [id], onDelete: Cascade)
  
  @@unique([petitionId, userId])
  @@index([petitionId])
  @@map("petition_votes")
}

/// Template knowledge requirements for common petition types.
/// Pre-computed decompositions so the system doesn't need an LLM call
/// for well-known requests.
model PetitionTemplate {
  id              String   @id @default(cuid())
  
  /// Matching
  name            String   /// "Photoshop Tool Replication"
  matchPatterns   String[] @map("match_patterns")
  /// ["replicate * tool", "photoshop * tool", "implement * from photoshop"]
  /// Used for fuzzy matching against user queries
  
  scope           PetitionScope
  
  /// Pre-computed decomposition
  knowledgeRequirements Json @map("knowledge_requirements")
  /// Same structure as Petition.knowledgeRequirements
  
  /// Typical parameters
  estimatedCostUsd Float    @map("estimated_cost_usd")
  estimatedApiCalls Int     @map("estimated_api_calls")
  estimatedTimeMinutes Float @map("estimated_time_minutes")
  
  /// Quality
  usageCount       Int      @default(0) @map("usage_count")
  avgSatisfaction  Float?   @map("avg_satisfaction") /// 0-5 rating
  
  isActive         Boolean  @default(true) @map("is_active")
  
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")
  
  @@map("petition_templates")
}
```

Add relations to existing models:

```prisma
/// Add to GenerationPlan:
model GenerationPlan {
  // ... existing fields ...
  petitions    Petition[]
}
```

---

## The Petition Pipeline: Step by Step

### Step 1: Intake & Classification

When a user submits a petition, the system first tries to classify it without an LLM call:

```typescript
class PetitionIntake {
  
  async submit(userQuery: string, userId?: string, options?: PetitionOptions): Promise<Petition> {
    
    // ── Step 1a: Check for duplicate petitions ──
    const existing = await this.findSimilarPetition(userQuery);
    if (existing) {
      // Don't create a duplicate — add a vote instead
      await this.addVote(existing.id, userId);
      return existing;
    }
    
    // ── Step 1b: Check for template match ──
    const template = await this.matchTemplate(userQuery);
    
    // ── Step 1c: Create the petition ──
    const petition = await this.db.petitions.create({
      data: {
        userQuery,
        userId,
        priority: options?.priority ?? 'NORMAL',
        maxCostUsd: options?.maxCostUsd,
        maxApiCalls: options?.maxApiCalls,
        userContext: options?.context,
        targetOutputs: options?.targetOutputs ?? [],
        status: template ? 'ASSESSING' : 'SUBMITTED',  // Skip decomposition if template matches
        knowledgeRequirements: template?.knowledgeRequirements ?? [],
        decomposedAt: template ? new Date() : null,
      }
    });
    
    // ── Step 1d: Post initial thread message ──
    await this.db.petitionThreads.create({
      data: {
        petitionId: petition.id,
        role: 'system',
        messageType: 'progress_update',
        content: template 
          ? `Matched template "${template.name}". Assessing current knowledge coverage...`
          : `Analyzing your request to determine what knowledge is needed...`,
        data: { template: template?.id ?? null },
      }
    });
    
    // ── Step 1e: Queue for processing ──
    await this.queue.enqueue('process_petition', { petitionId: petition.id });
    
    return petition;
  }
  
  /**
   * Find similar existing petitions using text similarity.
   * Uses pg_trgm for fuzzy matching.
   */
  async findSimilarPetition(query: string): Promise<Petition | null> {
    const results = await this.db.$queryRaw`
      SELECT id, user_query, status, 
             similarity(user_query, ${query}) as sim
      FROM petitions
      WHERE status NOT IN ('REJECTED', 'CANCELLED')
        AND similarity(user_query, ${query}) > 0.4
      ORDER BY sim DESC
      LIMIT 1
    `;
    return results[0] ?? null;
  }
}
```

### Step 2: Decomposition (The AI Figures Out What's Needed)

This is the single most important LLM call in the petition pipeline. It translates the user's fuzzy intent into a structured list of knowledge requirements.

```typescript
class PetitionDecomposer {
  
  async decompose(petition: Petition): Promise<KnowledgeRequirement[]> {
    
    await this.updateStatus(petition.id, 'DECOMPOSING');
    
    // ── Build context for the decomposer ──
    // Tell the AI what kinds of knowledge the database stores
    const systemPrompt = `
You are a knowledge architect for a technical reference database.
The database stores structured knowledge about programming languages, 
file formats, algorithms, and implementation patterns.

Entity types in the database:
- CONCEPT: Universal ideas (e.g., "iteration", "color interpolation")
- ENTRY: Target-specific documentation (e.g., "Python/for loop", "CSS/linear-gradient")
- ALGORITHM: Mathematical/computational procedures (e.g., "Gaussian blur", "DEFLATE compression")
- ATOM: Structural building blocks of file formats (e.g., XML elements, binary fields)
- CAPABILITY: Actionable features (e.g., "Draw rectangle in SVG", "Apply gradient in CSS")
- BLUEPRINT: Complete architecture plans combining capabilities

Targets currently in the database (with coverage %):
${await this.getTargetSummary()}

Your task: Given the user's request, determine EXACTLY what knowledge 
the database needs to contain to fully answer their question.
Return a structured list of knowledge requirements.
    `;
    
    const userPrompt = `
User request: "${petition.userQuery}"
${petition.userContext ? `User context: ${petition.userContext}` : ''}
${petition.targetOutputs.length > 0 ? `Desired outputs: ${petition.targetOutputs.join(', ')}` : ''}

Decompose this into specific knowledge requirements. For each requirement:
1. What category of knowledge is it? (concept / algorithm / entry / atom / capability / blueprint)
2. What specific topic does it cover?
3. Which target (language/format) is it for? (null if target-agnostic)
4. How important is it? (critical / important / nice_to_have)
5. What search terms would find existing knowledge about this?
6. Does this require knowledge from multiple targets?

Return JSON array of requirements. Be thorough — missing a requirement 
means the user won't get a complete answer.
    `;
    
    const response = await this.llm.call(systemPrompt, userPrompt, {
      model: this.modelRouter.select('mid'),
      responseFormat: 'json',
      maxTokens: 4000,
    });
    
    const requirements = this.parseRequirements(response);
    
    // ── Validate and normalize ──
    const normalized = requirements.map((req, i) => ({
      id: `kr_${String(i + 1).padStart(3, '0')}`,
      category: this.normalizeCategory(req.category),
      topic: req.topic,
      targetId: this.resolveTargetId(req.target),
      entityType: this.categoryToEntityType(req.category),
      importance: req.importance ?? 'important',
      searchTerms: req.searchTerms ?? [],
      relatedConceptIds: [],  // Filled during assessment
      crossTarget: req.crossTarget ?? false,
      estimatedEffort: null,  // Filled during assessment
    }));
    
    // ── Update petition ──
    await this.db.petitions.update({
      where: { id: petition.id },
      data: {
        knowledgeRequirements: normalized,
        title: this.generateTitle(petition.userQuery, normalized),
        scope: this.classifyScope(normalized),
        description: this.generateDescription(petition.userQuery, normalized),
        decomposedAt: new Date(),
      }
    });
    
    // ── Post decomposition summary to thread ──
    await this.db.petitionThreads.create({
      data: {
        petitionId: petition.id,
        role: 'decomposer',
        messageType: 'scope_proposal',
        content: this.formatScopeProposal(normalized),
        data: { 
          requirementCount: normalized.length,
          byCategory: this.groupByCategory(normalized),
          targetsInvolved: [...new Set(normalized.map(r => r.targetId).filter(Boolean))],
        },
      }
    });
    
    // ── Check if clarification is needed ──
    if (this.needsClarification(normalized, petition)) {
      await this.requestClarification(petition, normalized);
      return normalized;  // Will resume after user responds
    }
    
    return normalized;
  }
  
  /**
   * Determine if the system needs to ask the user for more information.
   */
  needsClarification(requirements: KnowledgeRequirement[], petition: Petition): boolean {
    // Ambiguous scope — too many possible interpretations
    if (requirements.length > 30) return true;
    
    // No target specified for implementation-level requirements
    const implWithoutTarget = requirements.filter(
      r => ['atom', 'capability'].includes(r.category) && !r.targetId
    );
    if (implWithoutTarget.length > 0) return true;
    
    // Cross-target but no targets specified
    const crossTarget = requirements.filter(r => r.crossTarget);
    if (crossTarget.length > 0 && petition.targetOutputs.length === 0) return true;
    
    return false;
  }
  
  async requestClarification(petition: Petition, requirements: KnowledgeRequirement[]) {
    const questions: string[] = [];
    
    const implWithoutTarget = requirements.filter(
      r => ['atom', 'capability'].includes(r.category) && !r.targetId
    );
    if (implWithoutTarget.length > 0) {
      questions.push(
        `Which output format(s) are you targeting? ` +
        `The topics "${implWithoutTarget.map(r => r.topic).join('", "')}" ` +
        `need a specific format context (e.g., SVG, Canvas API, CSS, PSD).`
      );
    }
    
    if (requirements.length > 30) {
      questions.push(
        `Your request decomposed into ${requirements.length} knowledge topics. ` +
        `Could you narrow the scope? For example, are you interested in a specific ` +
        `aspect (e.g., just the rendering algorithm, or the full UI tool replication)?`
      );
    }
    
    await this.db.petitionThreads.create({
      data: {
        petitionId: petition.id,
        role: 'system',
        messageType: 'clarification_request',
        content: `I need some clarification to build the best knowledge plan:\n\n${questions.map((q, i) => `${i + 1}. ${q}`).join('\n\n')}`,
        data: { questions },
      }
    });
    
    await this.updateStatus(petition.id, 'SUBMITTED', 'Awaiting user clarification');
  }
}
```

### Step 3: Assessment (What Do We Already Know?)

This is pure Cartographer work — no LLM calls. For each knowledge requirement, search the existing database.

```typescript
class PetitionAssessor {
  
  async assess(petition: Petition): Promise<GapAssessment> {
    
    await this.updateStatus(petition.id, 'ASSESSING');
    const requirements = petition.knowledgeRequirements as KnowledgeRequirement[];
    
    const assessment: GapAssessment = {
      totalRequirements: requirements.length,
      alreadyExists: 0,
      partiallyExists: 0,
      missing: 0,
      existingEntityIds: [],
      gaps: [],
    };
    
    for (const req of requirements) {
      const result = await this.assessRequirement(req);
      
      switch (result.status) {
        case 'exists':
          assessment.alreadyExists++;
          assessment.existingEntityIds.push(...result.entityIds);
          break;
        case 'partial':
          assessment.partiallyExists++;
          assessment.existingEntityIds.push(...result.entityIds);
          assessment.gaps.push({
            requirementId: req.id,
            topic: req.topic,
            gapType: 'incomplete',
            existingEntityIds: result.entityIds,
            missingFields: result.missingFields,
            estimatedEffort: this.estimateEffort(req, result),
          });
          break;
        case 'missing':
          assessment.missing++;
          assessment.gaps.push({
            requirementId: req.id,
            topic: req.topic,
            gapType: 'missing',
            existingEntityIds: [],
            missingFields: [],
            estimatedEffort: this.estimateEffort(req, result),
          });
          break;
      }
    }
    
    // ── Estimate total cost ──
    const totalEstimate = assessment.gaps.reduce(
      (sum, gap) => ({
        apiCalls: sum.apiCalls + gap.estimatedEffort.apiCalls,
        tokens: sum.tokens + gap.estimatedEffort.tokens,
        costUsd: sum.costUsd + gap.estimatedEffort.costUsd,
      }),
      { apiCalls: 0, tokens: 0, costUsd: 0 }
    );
    
    // ── Update petition ──
    await this.db.petitions.update({
      where: { id: petition.id },
      data: {
        gapAssessment: assessment,
        estimatedCostUsd: totalEstimate.costUsd,
        assessedAt: new Date(),
      }
    });
    
    // ── Post assessment to thread ──
    await this.db.petitionThreads.create({
      data: {
        petitionId: petition.id,
        role: 'system',
        messageType: 'progress_update',
        content: this.formatAssessmentReport(assessment, totalEstimate),
        data: { assessment, totalEstimate },
      }
    });
    
    // ── Check budget ──
    if (petition.maxCostUsd && totalEstimate.costUsd > petition.maxCostUsd) {
      await this.db.petitionThreads.create({
        data: {
          petitionId: petition.id,
          role: 'system',
          messageType: 'cost_warning',
          content: `Estimated cost ($${totalEstimate.costUsd.toFixed(2)}) exceeds your budget ` +
            `($${petition.maxCostUsd.toFixed(2)}). I can prioritize the ${assessment.gaps.filter(g => g.estimatedEffort.costUsd > 0).length} most critical gaps, ` +
            `or you can increase the budget. What would you prefer?`,
          data: { estimatedCost: totalEstimate.costUsd, budget: petition.maxCostUsd },
        }
      });
      await this.updateStatus(petition.id, 'SUBMITTED', 'Awaiting budget decision');
      return assessment;
    }
    
    return assessment;
  }
  
  /**
   * Search the database for existing knowledge matching a requirement.
   * Uses multiple search strategies for high recall.
   */
  async assessRequirement(req: KnowledgeRequirement): Promise<RequirementAssessment> {
    
    const entityIds: string[] = [];
    const missingFields: string[] = [];
    
    // ── Strategy 1: Direct entity lookup by computed key ──
    if (req.targetId && req.entityType) {
      const directMatch = await this.findByEntityType(req);
      if (directMatch) {
        entityIds.push(directMatch.id);
        missingFields.push(...this.checkCompleteness(directMatch, req));
      }
    }
    
    // ── Strategy 2: Search by path pattern ──
    if (req.targetId) {
      const pathMatches = await this.db.entries.findMany({
        where: {
          targetId: req.targetId,
          path: { contains: req.topic.split(' ')[0], mode: 'insensitive' },
        },
        select: { id: true, path: true, confidence: true, contentStandard: true },
        take: 5,
      });
      for (const match of pathMatches) {
        if (!entityIds.includes(match.id)) entityIds.push(match.id);
      }
    }
    
    // ── Strategy 3: Full-text search across all targets ──
    const ftsResults = await this.db.$queryRaw`
      SELECT id, target_id, path, confidence,
             ts_rank(
               to_tsvector('english', COALESCE(content_standard, '') || ' ' || COALESCE(content_micro, '')),
               plainto_tsquery('english', ${req.searchTerms.join(' ')})
             ) as rank
      FROM entries
      WHERE to_tsvector('english', COALESCE(content_standard, '') || ' ' || COALESCE(content_micro, ''))
            @@ plainto_tsquery('english', ${req.searchTerms.join(' ')})
      ORDER BY rank DESC
      LIMIT 10
    `;
    for (const result of ftsResults as any[]) {
      if (!entityIds.includes(result.id) && result.rank > 0.1) {
        entityIds.push(result.id);
      }
    }
    
    // ── Strategy 4: Algorithm search (for algorithm requirements) ──
    if (req.category === 'algorithm') {
      const algoMatches = await this.db.algorithms.findMany({
        where: {
          OR: [
            { name: { contains: req.topic, mode: 'insensitive' } },
            { category: { in: req.searchTerms } },
          ]
        },
        select: { id: true, name: true, confidence: true, fullSpec: true },
      });
      for (const match of algoMatches) {
        entityIds.push(match.id);
        if (!match.fullSpec) missingFields.push('fullSpec');
      }
    }
    
    // ── Strategy 5: Concept search ──
    if (req.category === 'concept') {
      const conceptMatches = await this.db.concepts.findMany({
        where: {
          OR: [
            { name: { contains: req.topic, mode: 'insensitive' } },
            { domain: { in: req.searchTerms } },
          ]
        },
        select: { id: true, name: true, description: true },
      });
      for (const match of conceptMatches) {
        entityIds.push(match.id);
        if (!match.description) missingFields.push('description');
      }
    }
    
    // ── Determine overall status ──
    if (entityIds.length === 0) {
      return { status: 'missing', entityIds: [], missingFields: [] };
    }
    if (missingFields.length > 0 || entityIds.length < this.expectedEntityCount(req)) {
      return { status: 'partial', entityIds, missingFields };
    }
    return { status: 'exists', entityIds, missingFields: [] };
  }
}
```

### Step 4: Planning (Build the Targeted Generation Plan)

The Strategist builds a plan that generates ONLY the missing knowledge:

```typescript
class PetitionPlanner {
  
  async plan(petition: Petition): Promise<GenerationPlan> {
    
    await this.updateStatus(petition.id, 'PLANNING');
    const assessment = petition.gapAssessment as GapAssessment;
    const requirements = petition.knowledgeRequirements as KnowledgeRequirement[];
    
    // Only plan for gaps — not for stuff that already exists
    const gaps = assessment.gaps;
    
    if (gaps.length === 0) {
      // Everything already exists! Just link and synthesize.
      await this.updateStatus(petition.id, 'SYNTHESIZING');
      return null;
    }
    
    // ── Sort gaps by dependency order ──
    // Concepts before entries, algorithms before capabilities, etc.
    const orderedGaps = this.dependencySort(gaps, requirements);
    
    // ── Build steps ──
    const steps: GenerationStep[] = [];
    let stepNumber = 0;
    
    for (const gap of orderedGaps) {
      const req = requirements.find(r => r.id === gap.requirementId);
      
      switch (gap.gapType) {
        case 'missing':
          steps.push(...this.planNewEntity(++stepNumber, req, gap));
          break;
        case 'incomplete':
          steps.push(...this.planEnrichment(++stepNumber, req, gap));
          break;
        case 'stale':
          steps.push(...this.planRefresh(++stepNumber, req, gap));
          break;
      }
    }
    
    // ── Add synthesis step at the end ──
    // This creates Relations connecting all generated entities
    steps.push(this.createSynthesisStep(++stepNumber, petition, requirements, assessment));
    
    // ── Add fulfillment summary step ──
    // Generates a human-readable summary of what the database now knows
    steps.push(this.createSummaryStep(++stepNumber, petition));
    
    // ── Budget trimming ──
    // If petition has a budget, drop nice_to_have gaps first
    if (petition.maxCostUsd) {
      this.trimToBudget(steps, petition.maxCostUsd, requirements);
    }
    
    // ── Create the plan ──
    const plan = await this.strategist.createPlan(
      petition.id,        // Special: plan is tied to a petition, not a target
      steps,
      'petition'          // Source type
    );
    
    // ── Update petition ──
    await this.db.petitions.update({
      where: { id: petition.id },
      data: {
        generationPlanId: plan.id,
        planCreatedAt: new Date(),
        estimatedCostUsd: plan.totalEstimatedCostUsd,
      }
    });
    
    // ── Post plan summary to thread ──
    await this.db.petitionThreads.create({
      data: {
        petitionId: petition.id,
        role: 'strategist',
        messageType: 'scope_proposal',
        content: this.formatPlanSummary(plan, gaps, assessment),
        data: {
          planId: plan.id,
          totalSteps: plan.totalSteps,
          estimatedCost: plan.totalEstimatedCostUsd,
          estimatedTime: plan.estimatedTimeMinutes,
          breakdown: this.getPlanBreakdown(plan),
        },
      }
    });
    
    return plan;
  }
  
  /**
   * Sort gaps so dependencies come first.
   * concepts → algorithms → entries → atoms → capabilities → blueprints
   */
  dependencySort(gaps: Gap[], requirements: KnowledgeRequirement[]): Gap[] {
    const categoryOrder = {
      'concept': 0,
      'algorithm': 1,
      'entry': 2,
      'atom': 3,
      'capability': 4,
      'blueprint': 5,
    };
    
    const importanceOrder = { 'critical': 0, 'important': 1, 'nice_to_have': 2 };
    
    return [...gaps].sort((a, b) => {
      const reqA = requirements.find(r => r.id === a.requirementId)!;
      const reqB = requirements.find(r => r.id === b.requirementId)!;
      
      // Sort by category (dependency order) first
      const catDiff = (categoryOrder[reqA.category] ?? 99) - (categoryOrder[reqB.category] ?? 99);
      if (catDiff !== 0) return catDiff;
      
      // Then by importance
      return (importanceOrder[reqA.importance] ?? 99) - (importanceOrder[reqB.importance] ?? 99);
    });
  }
}
```

### Step 5: Execution & Progress Updates

The Executor runs the plan with real-time progress posted to the petition thread:

```typescript
class PetitionExecutor {
  
  async execute(petition: Petition, plan: GenerationPlan): Promise<void> {
    
    await this.updateStatus(petition.id, 'GENERATING');
    
    const executor = new Executor(this.db, this.llm, this.modelRouter);
    
    // ── Hook into executor's progress events ──
    executor.on('stepCompleted', async (step, entityId) => {
      // Update petition progress
      const progress = plan.stepsCompleted / plan.totalSteps;
      await this.db.petitions.update({
        where: { id: petition.id },
        data: {
          progress,
          actualCostUsd: { increment: step.actualCostUsd ?? 0 },
          totalTokens: { increment: (step.actualInputTokens ?? 0) + (step.actualOutputTokens ?? 0) },
          apiCalls: { increment: 1 },
          fulfilledByEntities: { push: entityId },
        }
      });
      
      // Post progress at every 25% milestone
      const milestones = [0.25, 0.5, 0.75, 1.0];
      const previousProgress = (plan.stepsCompleted - 1) / plan.totalSteps;
      for (const milestone of milestones) {
        if (previousProgress < milestone && progress >= milestone) {
          await this.db.petitionThreads.create({
            data: {
              petitionId: petition.id,
              role: 'system',
              messageType: 'progress_update',
              content: `${Math.round(milestone * 100)}% complete. ` +
                `Generated ${plan.stepsCompleted} of ${plan.totalSteps} knowledge items. ` +
                `Cost so far: $${petition.actualCostUsd.toFixed(2)}.`,
              data: {
                progress: milestone,
                stepsCompleted: plan.stepsCompleted,
                totalSteps: plan.totalSteps,
                costSoFar: petition.actualCostUsd,
              }
            }
          });
        }
      }
      
      // ── Budget check ──
      if (petition.maxCostUsd && petition.actualCostUsd >= petition.maxCostUsd * 0.9) {
        await this.db.petitionThreads.create({
          data: {
            petitionId: petition.id,
            role: 'system',
            messageType: 'cost_warning',
            content: `Approaching budget limit. $${petition.actualCostUsd.toFixed(2)} spent ` +
              `of $${petition.maxCostUsd.toFixed(2)} budget. ` +
              `${plan.totalSteps - plan.stepsCompleted} steps remaining.`,
            data: { costSoFar: petition.actualCostUsd, budget: petition.maxCostUsd },
          }
        });
      }
    });
    
    executor.on('stepFailed', async (step, error) => {
      // Log failures but don't stop — other steps may succeed
      console.warn(`Petition ${petition.id}: Step ${step.stepNumber} failed: ${error}`);
    });
    
    // ── Run the plan ──
    const report = await executor.executePlan(plan, {
      budgetLimits: {
        maxTotalUsd: petition.maxCostUsd ?? Infinity,
        maxPerCallUsd: 0.50,
      },
      modelConfig: this.modelConfig,
      maxContextTokens: 8000,
    });
    
    // ── Determine final status ──
    if (report.stepsFailed === 0) {
      await this.updateStatus(petition.id, 'SYNTHESIZING');
    } else if (report.stepsCompleted > 0) {
      await this.updateStatus(petition.id, 'SYNTHESIZING', 
        `${report.stepsFailed} steps failed, but ${report.stepsCompleted} succeeded`);
    } else {
      await this.updateStatus(petition.id, 'PARTIALLY_FULFILLED',
        `Generation failed. ${report.stepsFailed} steps failed.`);
    }
  }
}
```

### Step 6: Synthesis (Connect Everything)

After generation, create Relations connecting all the new and existing knowledge:

```typescript
class PetitionSynthesizer {
  
  async synthesize(petition: Petition): Promise<void> {
    
    const allEntityIds = petition.fulfilledByEntities;
    const existingIds = (petition.gapAssessment as GapAssessment).existingEntityIds;
    const allIds = [...new Set([...allEntityIds, ...existingIds])];
    
    if (allIds.length < 2) {
      await this.finalize(petition);
      return;
    }
    
    // ── Ask the AI to identify relationships between all entities ──
    // Load summaries of all entities
    const entitySummaries = await this.loadEntitySummaries(allIds);
    
    const response = await this.llm.call(
      `You are a knowledge graph architect. Given these entities that were generated 
       to answer the question "${petition.userQuery}", identify the relationships between them.
       
       Return a JSON array of relationships:
       [{sourceId, targetId, relationType, context}]
       
       Valid relation types: IMPLEMENTS, REQUIRES, ANALOGOUS_IN, COMPOSED_OF, 
       DEPENDS_ON, RELATED_TO, ALTERNATIVE_TO`,
      `Entities:\n${entitySummaries}`,
      { model: this.modelRouter.select('mid'), maxTokens: 2000 }
    );
    
    const relations = this.parseRelations(response);
    
    // ── Store relations ──
    for (const rel of relations) {
      await this.db.relations.create({
        data: {
          sourceId: rel.sourceId,
          sourceType: this.getEntityType(rel.sourceId),
          relTargetId: rel.targetId,
          relTargetType: this.getEntityType(rel.targetId),
          relationType: rel.relationType,
          context: rel.context,
          discoveredBy: 'petition_synthesizer',
          confidence: 0.85,
        }
      });
    }
    
    await this.finalize(petition);
  }
  
  async finalize(petition: Petition) {
    // ── Generate fulfillment summary ──
    const allEntityIds = [...new Set([
      ...petition.fulfilledByEntities,
      ...(petition.gapAssessment as GapAssessment).existingEntityIds,
    ])];
    
    const entitySummaries = await this.loadEntitySummaries(allEntityIds);
    
    const summary = await this.llm.call(
      `Summarize what the database now knows about the user's question.
       User asked: "${petition.userQuery}"
       
       Write a clear, structured summary (markdown) explaining:
       1. What knowledge is now available
       2. How the pieces connect
       3. What the user can now ask the database about this topic`,
      `Entities in the knowledge graph:\n${entitySummaries}`,
      { model: this.modelRouter.select('cheap'), maxTokens: 1000 }
    );
    
    // ── Determine final status ──
    const assessment = petition.gapAssessment as GapAssessment;
    const allGapsFilled = assessment.gaps.every(gap => {
      // Check if entities were created for this gap
      return petition.fulfilledByEntities.length > 0; // simplified check
    });
    
    const finalStatus = allGapsFilled ? 'FULFILLED' : 'PARTIALLY_FULFILLED';
    
    await this.db.petitions.update({
      where: { id: petition.id },
      data: {
        status: finalStatus,
        fulfillmentSummary: summary,
        fulfilledAt: new Date(),
        progress: 1.0,
      }
    });
    
    // ── Post completion report ──
    await this.db.petitionThreads.create({
      data: {
        petitionId: petition.id,
        role: 'system',
        messageType: 'completion_report',
        content: `## Petition ${finalStatus === 'FULFILLED' ? 'Fulfilled' : 'Partially Fulfilled'}\n\n${summary}`,
        data: {
          status: finalStatus,
          entitiesCreated: petition.fulfilledByEntities.length,
          entitiesLinked: (petition.gapAssessment as GapAssessment).existingEntityIds.length,
          totalCost: petition.actualCostUsd,
          totalApiCalls: petition.apiCalls,
        }
      }
    });
  }
}
```

---

## Example: "Replicate the Gradient Tool from Photoshop"

Here's the complete flow for this specific petition:

```
USER SUBMITS:
"I want to replicate the gradient tool from Photoshop"
context: "Building a web-based image editor"
targetOutputs: ["canvas_api", "svg"]

═══════════════════════════════════════════════════════════════

STEP 1: INTAKE
  No similar petitions found.
  No template match (first gradient request).
  Petition created: pet_abc123
  Status: SUBMITTED

═══════════════════════════════════════════════════════════════

STEP 2: DECOMPOSITION (1 API call, ~$0.02)
  
  The decomposer analyzes the request and returns:

  Knowledge Requirements:
  ┌──────┬────────────┬───────────────────────────────────────────────┬────────────┬───────────┐
  │ ID   │ Category   │ Topic                                         │ Target     │ Importance│
  ├──────┼────────────┼───────────────────────────────────────────────┼────────────┼───────────┤
  │kr_001│ concept    │ Color interpolation (RGB, HSL, LAB)           │ null       │ critical  │
  │kr_002│ concept    │ Gradient types (linear, radial, conic, diamond)│ null      │ critical  │
  │kr_003│ algorithm  │ Linear gradient interpolation                 │ null       │ critical  │
  │kr_004│ algorithm  │ Radial gradient with focal point              │ null       │ critical  │
  │kr_005│ algorithm  │ Color stop processing & distribution          │ null       │ critical  │
  │kr_006│ algorithm  │ Gradient dithering (banding prevention)       │ null       │ important │
  │kr_007│ algorithm  │ Gradient noise/jitter                         │ null       │ nice_have │
  │kr_008│ entry      │ CSS linear-gradient()                         │ css        │ important │
  │kr_009│ entry      │ CSS radial-gradient()                         │ css        │ important │
  │kr_010│ entry      │ CSS conic-gradient()                          │ css        │ important │
  │kr_011│ entry      │ SVG linearGradient element                    │ svg        │ important │
  │kr_012│ entry      │ SVG radialGradient element                    │ svg        │ important │
  │kr_013│ entry      │ Canvas API createLinearGradient()             │ javascript │ critical  │
  │kr_014│ entry      │ Canvas API createRadialGradient()             │ javascript │ critical  │
  │kr_015│ entry      │ Canvas API createConicGradient()              │ javascript │ critical  │
  │kr_016│ capability │ Render linear gradient on Canvas              │ javascript │ critical  │
  │kr_017│ capability │ Render radial gradient on Canvas              │ javascript │ critical  │
  │kr_018│ capability │ Multi-stop gradient with opacity              │ javascript │ important │
  │kr_019│ blueprint  │ Gradient tool engine (handle → preview → apply)│ javascript│ critical  │
  │kr_020│ entry      │ Color space conversion (sRGB ↔ linear RGB)    │ null       │ important │
  │kr_021│ entry      │ Photoshop gradient tool behavior reference    │ photoshop  │ important │
  └──────┴────────────┴───────────────────────────────────────────────┴────────────┴───────────┘

  Thread post (scope_proposal):
  "I've identified 21 knowledge topics needed to replicate Photoshop's gradient tool.
   This covers color theory (2 concepts), rendering algorithms (5), format-specific
   syntax (8 entries across CSS/SVG/Canvas), implementation capabilities (3), 
   and a full architecture blueprint.
   
   Targets involved: CSS, SVG, JavaScript (Canvas API), Photoshop (reference)
   
   Proceeding to assess what we already know..."

═══════════════════════════════════════════════════════════════

STEP 3: ASSESSMENT (0 API calls, pure DB queries)

  Results:
  ┌──────┬────────────────────────────────────────┬───────────────┐
  │ ID   │ Topic                                  │ Status        │
  ├──────┼────────────────────────────────────────┼───────────────┤
  │kr_001│ Color interpolation                    │ ✅ EXISTS     │ ← concept.color.interpolation
  │kr_002│ Gradient types                         │ ❌ MISSING    │
  │kr_003│ Linear gradient interpolation algo     │ ❌ MISSING    │
  │kr_004│ Radial gradient with focal point       │ ❌ MISSING    │
  │kr_005│ Color stop processing                  │ ❌ MISSING    │
  │kr_006│ Gradient dithering                     │ ❌ MISSING    │
  │kr_007│ Gradient noise/jitter                  │ ❌ MISSING    │
  │kr_008│ CSS linear-gradient()                  │ ⚠️ PARTIAL   │ ← has micro+standard, no exhaustive
  │kr_009│ CSS radial-gradient()                  │ ⚠️ PARTIAL   │ ← has micro only
  │kr_010│ CSS conic-gradient()                   │ ❌ MISSING    │
  │kr_011│ SVG linearGradient                     │ ✅ EXISTS     │
  │kr_012│ SVG radialGradient                     │ ✅ EXISTS     │
  │kr_013│ Canvas createLinearGradient()          │ ✅ EXISTS     │
  │kr_014│ Canvas createRadialGradient()          │ ✅ EXISTS     │
  │kr_015│ Canvas createConicGradient()           │ ❌ MISSING    │
  │kr_016│ Render linear gradient on Canvas       │ ❌ MISSING    │
  │kr_017│ Render radial gradient on Canvas       │ ❌ MISSING    │
  │kr_018│ Multi-stop gradient with opacity       │ ❌ MISSING    │
  │kr_019│ Gradient tool engine blueprint         │ ❌ MISSING    │
  │kr_020│ Color space conversion                 │ ✅ EXISTS     │
  │kr_021│ Photoshop gradient tool reference      │ ⚠️ PARTIAL   │ ← has micro, no standard/exhaustive
  └──────┴────────────────────────────────────────┴───────────────┘

  Summary: 5 exist, 3 partial, 13 missing
  Estimated cost: $2.40 (32 API calls, ~180,000 tokens)
  Estimated time: ~8 minutes

  Thread post (progress_update):
  "Assessment complete. The database already has 5 of the 21 required topics
   (color interpolation, SVG gradients, Canvas linear/radial gradients, and 
   color space conversion). 3 topics need enrichment (CSS gradients and 
   Photoshop reference). 13 topics need to be generated from scratch.
   
   Estimated cost: $2.40 | Estimated time: ~8 minutes
   
   Building generation plan..."

═══════════════════════════════════════════════════════════════

STEP 4: PLANNING (0 API calls)

  GenerationPlan with 32 steps:
  
  ┌──────┬────────────┬────────────────────────────────────────┬───────────┬──────────┐
  │ Step │ Phase      │ Entity                                 │ Reason    │ Batch    │
  ├──────┼────────────┼────────────────────────────────────────┼───────────┼──────────┤
  │  1   │ GENERATE   │ concept: gradient_types                │ new       │ A        │
  │  2   │ GENERATE   │ algo: gradient.linear_interpolation    │ new       │ B        │
  │  3   │ GENERATE   │ algo: gradient.radial_focal            │ new       │ B        │
  │  4   │ GENERATE   │ algo: gradient.color_stop_processing   │ new       │ B        │
  │  5   │ GENERATE   │ algo: gradient.dithering               │ new       │ B        │
  │  6   │ GENERATE   │ algo: gradient.noise_jitter            │ new       │ B        │
  │  7   │ GENERATE   │ entry: css/linear-gradient (exhaustive)│ enrich    │ C        │
  │  8   │ GENERATE   │ entry: css/radial-gradient (std+exh)   │ enrich    │ C        │
  │  9   │ GENERATE   │ entry: css/conic-gradient              │ new       │ C        │
  │ 10   │ GENERATE   │ entry: canvas/createConicGradient      │ new       │ D        │
  │ 11   │ GENERATE   │ entry: photoshop/gradient-tool (enrich)│ enrich    │ E        │
  │ 12-14│ GENERATE   │ 3× examples for new entries            │ examples  │ F        │
  │ 15-17│ GENERATE   │ capability: render linear/radial/multi │ new       │ G        │
  │ 18   │ GENERATE   │ blueprint: gradient_tool_engine        │ new       │ -        │
  │19-30 │ GENERATE   │ examples for capabilities + algorithms │ examples  │ H        │
  │ 31   │ VALIDATE   │ synthesis: create relations            │ relate    │ -        │
  │ 32   │ VALIDATE   │ fulfillment summary                    │ summarize │ -        │
  └──────┴────────────┴────────────────────────────────────────┴───────────┴──────────┘

  Batches: 8 groups → ~12 API calls (batching collapses 32 steps into 12 calls)
  
  Thread post (scope_proposal):
  "Generation plan ready.
   
   **What I'll generate:**
   - 1 new concept (gradient types)
   - 5 new algorithms (interpolation, radial focal, color stops, dithering, noise)
   - 3 new entries + enrich 3 existing entries
   - 3 capabilities (linear/radial/multi-stop rendering on Canvas)
   - 1 blueprint (complete gradient tool engine architecture)
   - 12 code examples
   
   **What I already have and will link:**
   - Color interpolation concept
   - SVG linearGradient and radialGradient elements
   - Canvas createLinearGradient() and createRadialGradient()
   - Color space conversion (sRGB ↔ linear RGB)
   
   **Cost estimate:** $2.40 | **Time:** ~8 minutes
   
   Generating now..."

═══════════════════════════════════════════════════════════════

STEP 5: EXECUTION (~12 API calls, ~$2.40)

  Thread posts at 25%, 50%, 75%, 100%:

  [25%] "25% complete. Generated concept and 5 algorithms. Cost: $0.45"
  [50%] "50% complete. Enriched CSS entries, generated Canvas entry. Cost: $1.10"
  [75%] "75% complete. Generated 3 capabilities and the blueprint. Cost: $1.85"
  [100%] "100% complete. Generated 12 examples. Cost: $2.30"

═══════════════════════════════════════════════════════════════

STEP 6: SYNTHESIS (1 API call, ~$0.10)

  Relations created:
  - concept:gradient_types --IMPLEMENTS--> algo:gradient.linear_interpolation
  - concept:gradient_types --IMPLEMENTS--> algo:gradient.radial_focal
  - algo:gradient.linear_interpolation --REQUIRES--> concept:color.interpolation
  - entry:css/linear-gradient --ANALOGOUS_IN--> entry:canvas/createLinearGradient
  - entry:css/radial-gradient --ANALOGOUS_IN--> entry:canvas/createRadialGradient
  - capability:render_linear_gradient --REQUIRES--> algo:gradient.linear_interpolation
  - capability:render_linear_gradient --REQUIRES--> entry:canvas/createLinearGradient
  - capability:render_radial_gradient --REQUIRES--> algo:gradient.radial_focal
  - blueprint:gradient_tool_engine --COMPOSED_OF--> capability:render_linear_gradient
  - blueprint:gradient_tool_engine --COMPOSED_OF--> capability:render_radial_gradient
  - blueprint:gradient_tool_engine --COMPOSED_OF--> capability:render_multistop_gradient
  - blueprint:gradient_tool_engine --DEPENDS_ON--> algo:gradient.color_stop_processing
  - blueprint:gradient_tool_engine --DEPENDS_ON--> algo:gradient.dithering
  - entry:photoshop/gradient-tool --RELATED_TO--> blueprint:gradient_tool_engine

  Thread post (completion_report):
  "## Petition Fulfilled ✅
  
   The database now contains comprehensive knowledge about replicating
   Photoshop's gradient tool. Here's what's available:
   
   ### Concepts
   - **Gradient Types**: Linear, radial, conic, and diamond gradients with 
     mathematical definitions and visual characteristics
   
   ### Algorithms (target-agnostic, reusable)
   - **Linear Gradient Interpolation**: Color blending along a line with 
     parametric t-value computation
   - **Radial Gradient with Focal Point**: Elliptical gradient with 
     configurable focal point offset (like Photoshop's)
   - **Color Stop Processing**: Distributing, sorting, and interpolating 
     between multiple color stops with opacity
   - **Gradient Dithering**: Banding prevention via ordered dithering 
     and noise injection
   - **Gradient Noise**: Photoshop-style noise addition for texture
   
   ### Implementation (Canvas API)
   - 3 capabilities with step-by-step implementation guides
   - Full architecture blueprint for a gradient tool engine
   - 12 working code examples
   
   ### Cross-references
   - CSS and SVG equivalents linked for comparison
   - Color space conversion linked for accurate color blending
   - Photoshop behavior reference for feature parity verification
   
   **Total cost: $2.40 | Entities created: 24 | Entities linked: 6 | Relations: 14**
   
   You can now query the database for any aspect of gradient rendering,
   from the mathematical algorithm to the Canvas API implementation."

═══════════════════════════════════════════════════════════════

FINAL STATE:
  Petition: FULFILLED
  Progress: 1.0
  Entities created: 24
  Entities linked: 6
  Relations created: 14
  Total cost: $2.40
  Total time: ~9 minutes
  API calls: 13
```

---

## User Interaction Endpoints

```typescript
class PetitionAPI {
  
  // ── Submit a new petition ──
  async submitPetition(params: {
    query: string;
    userId?: string;
    context?: string;
    targetOutputs?: string[];
    priority?: PetitionPriority;
    maxCostUsd?: number;
    autoApprove?: boolean;  // Skip scope approval, start immediately
  }): Promise<Petition> {
    const petition = await this.intake.submit(
      params.query,
      params.userId,
      params
    );
    
    if (params.autoApprove) {
      // Skip the approval step, run the full pipeline immediately
      await this.processPetition(petition.id);
    }
    
    return petition;
  }
  
  // ── Respond to a clarification request ──
  async respondToClarification(
    petitionId: string,
    userId: string,
    response: string
  ): Promise<void> {
    // Record the user's response
    await this.db.petitionThreads.create({
      data: {
        petitionId,
        role: 'user',
        messageType: 'clarification_response',
        content: response,
      }
    });
    
    // Re-run decomposition with the additional context
    const petition = await this.db.petitions.findUnique({ where: { id: petitionId } });
    
    // Append clarification to the user query context
    await this.db.petitions.update({
      where: { id: petitionId },
      data: {
        userContext: (petition.userContext ?? '') + '\n\nClarification: ' + response,
      }
    });
    
    // Resume pipeline
    await this.processPetition(petitionId);
  }
  
  // ── Approve a proposed scope ──
  async approveScope(petitionId: string, userId: string): Promise<void> {
    await this.db.petitionThreads.create({
      data: {
        petitionId,
        role: 'user',
        messageType: 'scope_approval',
        content: 'Approved. Proceed with generation.',
      }
    });
    
    await this.processPetition(petitionId);
  }
  
  // ── Refine a proposed scope ──
  async refineScope(
    petitionId: string,
    userId: string,
    refinement: string
  ): Promise<void> {
    await this.db.petitionThreads.create({
      data: {
        petitionId,
        role: 'user',
        messageType: 'scope_refinement',
        content: refinement,
      }
    });
    
    // Re-decompose with refinement
    const petition = await this.db.petitions.findUnique({ where: { id: petitionId } });
    await this.db.petitions.update({
      where: { id: petitionId },
      data: {
        userContext: (petition.userContext ?? '') + '\n\nRefinement: ' + refinement,
        status: 'SUBMITTED',  // Reset to re-decompose
        knowledgeRequirements: [],
        gapAssessment: {},
        generationPlanId: null,
      }
    });
    
    await this.processPetition(petitionId);
  }
  
  // ── Increase budget mid-generation ──
  async increaseBudget(
    petitionId: string,
    userId: string,
    newMaxCostUsd: number
  ): Promise<void> {
    await this.db.petitions.update({
      where: { id: petitionId },
      data: { maxCostUsd: newMaxCostUsd }
    });
    
    await this.db.petitionThreads.create({
      data: {
        petitionId,
        role: 'user',
        messageType: 'scope_approval',
        content: `Budget increased to $${newMaxCostUsd.toFixed(2)}. Continue generation.`,
      }
    });
    
    // If status was waiting on budget, resume
    const petition = await this.db.petitions.findUnique({ where: { id: petitionId } });
    if (petition.statusMessage?.includes('budget')) {
      await this.processPetition(petitionId);
    }
  }
  
  // ── Check petition status ──
  async getStatus(petitionId: string): Promise<PetitionStatus> {
    const petition = await this.db.petitions.findUnique({
      where: { id: petitionId },
      include: {
        threads: { orderBy: { createdAt: 'desc' }, take: 5 },
      }
    });
    
    return {
      id: petition.id,
      title: petition.title,
      status: petition.status,
      progress: petition.progress,
      estimatedCost: petition.estimatedCostUsd,
      actualCost: petition.actualCostUsd,
      recentMessages: petition.threads,
      // If there's a pending clarification, include it
      pendingAction: this.getPendingAction(petition),
    };
  }
  
  // ── Vote on a petition ──
  async vote(petitionId: string, userId: string, weight: 1 | -1 = 1): Promise<void> {
    await this.db.petitionVotes.upsert({
      where: { petitionId_userId: { petitionId, userId } },
      create: { petitionId, userId, weight },
      update: { weight },
    });
    
    // Recalculate priority based on votes
    const voteCount = await this.db.petitionVotes.aggregate({
      where: { petitionId },
      _sum: { weight: true },
    });
    
    if (voteCount._sum.weight >= 10) {
      await this.db.petitions.update({
        where: { id: petitionId },
        data: { priority: 'HIGH' },
      });
    }
    if (voteCount._sum.weight >= 25) {
      await this.db.petitions.update({
        where: { id: petitionId },
        data: { priority: 'CRITICAL' },
      });
    }
  }
  
  // ── Rate the results ──
  async rateFulfillment(
    petitionId: string,
    userId: string,
    rating: 1 | 2 | 3 | 4 | 5,
    feedback?: string
  ): Promise<void> {
    await this.db.petitionThreads.create({
      data: {
        petitionId,
        role: 'user',
        messageType: 'feedback',
        content: feedback ?? `Rating: ${rating}/5`,
        data: { rating, feedback },
      }
    });
    
    // Update petition template satisfaction if one was used
    // This improves future template matching
    await this.db.petitions.update({
      where: { id: petitionId },
      data: {
        userFeedback: {
          push: { timestamp: new Date(), rating, feedback, userId }
        }
      }
    });
  }
  
  /**
   * The main processing pipeline for a petition.
   * Runs through decompose → assess → plan → execute → synthesize.
   * Pauses at any point that needs user input.
   */
  private async processPetition(petitionId: string): Promise<void> {
    const petition = await this.db.petitions.findUnique({ where: { id: petitionId } });
    
    // Each step checks if it needs to pause for user input
    // If so, it returns early and this function will be called again
    // when the user responds.
    
    // ── Decompose (if not done) ──
    if (!petition.decomposedAt) {
      await this.decomposer.decompose(petition);
      const updated = await this.db.petitions.findUnique({ where: { id: petitionId } });
      if (updated.status === 'SUBMITTED') return; // Paused for clarification
    }
    
    // ── Assess (if not done) ──
    if (!petition.assessedAt) {
      await this.assessor.assess(petition);
      const updated = await this.db.petitions.findUnique({ where: { id: petitionId } });
      if (updated.status === 'SUBMITTED') return; // Paused for budget decision
    }
    
    // ── Plan (if not done) ──
    if (!petition.planCreatedAt) {
      const plan = await this.planner.plan(petition);
      if (!plan) {
        // No gaps — go straight to synthesis
        await this.synthesizer.synthesize(petition);
        return;
      }
    }
    
    // ── Execute ──
    const latestPetition = await this.db.petitions.findUnique({
      where: { id: petitionId },
      include: { generationPlan: true },
    });
    
    if (latestPetition.generationPlan && latestPetition.status !== 'FULFILLED') {
      await this.executor.execute(latestPetition, latestPetition.generationPlan);
    }
    
    // ── Synthesize ──
    if (latestPetition.status === 'SYNTHESIZING') {
      await this.synthesizer.synthesize(latestPetition);
    }
  }
}
```

---

## Petition-to-Pipeline Integration

Petitions and the systematic pipeline share the same Executor, the same database, and the same deduplication. When a petition generates an algorithm for "linear gradient interpolation," that algorithm is now available to all future targets. When the systematic pipeline later processes CSS, it finds the gradient entries already exist (thanks to the petition) and skips them.

```
                    ┌─────────────────────────────┐
                    │     SHARED KNOWLEDGE DB      │
                    │                              │
         ┌─────────┤  concepts, entries, algos,   ├─────────┐
         │         │  atoms, capabilities,         │         │
         │         │  blueprints, relations         │         │
         │         └───────────────────────────────┘         │
         │                       ▲                           │
         │                       │                           │
    ┌────▼────┐            ┌─────┴─────┐              ┌─────▼────┐
    │PETITION │            │   BOTH    │              │SYSTEMATIC│
    │PIPELINE │            │  WRITE &  │              │ PIPELINE │
    │         │            │  READ THE │              │          │
    │ User-   │            │  SAME DB  │              │ Target-  │
    │ driven  │            │           │              │ driven   │
    │         │            │Dedup works│              │          │
    │ Fills   │            │across both│              │ Fills    │
    │ specific│            │ pipelines │              │ entire   │
    │ gaps    │            │           │              │ targets  │
    └─────────┘            └───────────┘              └──────────┘
```

Key integration points:

1. **Petition generates algo** → Systematic pipeline's Cartographer sees it, skips regeneration
2. **Systematic pipeline generates CSS entries** → Future petition about CSS finds them, skips regeneration
3. **Both use the same GenerationStep model** → Unified monitoring dashboard
4. **Both respect the same budget controls** → No runaway spending from either source
5. **Petition votes influence systematic priority** → If 25 users want Photoshop tools, the systematic pipeline bumps `photoshop` target to tier 1

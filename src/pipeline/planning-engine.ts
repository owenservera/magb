import { PrismaClient, PipelinePhase, ModelTier, WorkItemReason } from '@prisma/client';
import { CoverageReport } from './coverage-analyzer';

const prisma = new PrismaClient();

export interface PlanningResult {
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
export async function buildMasterPlan(
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

function buildCapabilitiesPrompt(targetId: string, coverage: CoverageReport): Record<string, any> {
  return { instruction: `Enumerate capabilities for ${targetId}` };
}

function buildAtomsPrompt(targetId: string, coverage: CoverageReport): Record<string, any> {
  return { instruction: `Extract atoms for ${targetId}` };
}

function buildAlgorithmPrompt(algo: { id: string; name: string }, coverage: CoverageReport): Record<string, any> {
  return { instruction: `Extract algorithm ${algo.name}` };
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

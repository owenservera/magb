import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CoverageReport {
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
export async function analyzeCoverage(targetId: string): Promise<CoverageReport> {
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

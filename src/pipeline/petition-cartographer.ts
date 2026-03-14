// ═══════════════════════════════════════════════════════════════════════════════
// petition-cartographer.ts
//
// The "Cartographer" — maps what knowledge already exists in the database
// relevant to a petition's requirements.
//
// Before generating anything, the system searches for everything it
// already knows about the petition's topic. This prevents regenerating
// knowledge that already exists, and shows the user what foundation
// they're building on.
// ═══════════════════════════════════════════════════════════════════════════════

import { PrismaClient, Petition } from '@prisma/client';
import { KnowledgeRequirement } from './petition-engine';

const prisma = new PrismaClient();

interface CoverageAssessment {
  totalRequirements: number;
  alreadyExists: number;
  partiallyExists: number;
  missing: number;
  existingEntityIds: string[];
  gaps: GapReport[];
}

interface GapReport {
  requirementId: string;
  topic: string;
  gapType: 'missing' | 'incomplete' | 'stale';
  estimatedEffort: {
    apiCalls: number;
    tokens: number;
    costUsd: number;
  };
  existingEntityId?: string;
  confidence?: number;
}

interface ExistingKnowledge {
  entityType: string;
  entityId: string;
  entityTitle: string;
  entityPath?: string;
  relevance: number;
  currentConfidence: number;
  hasAllResolutions: boolean;
  isStale: boolean;
  needsRefresh: boolean;
}

export class PetitionCartographer {
  /**
   * Assess what knowledge already exists in the database.
   *
   * For each requirement from the decomposition, search for:
   * 1. Exact matches (same path/topic)
   * 2. Partial matches (similar concepts)
   * 3. Related knowledge (via relations)
   *
   * This creates a gap report showing what needs to be generated.
   */
  async assessCoverage(petition: Petition): Promise<void> {
    await this.updateStatus(petition.id, 'ASSESSING');

    const requirements = petition.knowledgeRequirements as KnowledgeRequirement[];

    // ── Search for existing knowledge ─────────────────────────────────────
    const assessments: ExistingKnowledge[] = [];
    const gaps: GapReport[] = [];

    for (const req of requirements) {
      const existing = await this.findExistingKnowledge(req);

      if (existing) {
        assessments.push(existing);

        // Check if existing knowledge is sufficient
        if (existing.isStale || existing.needsRefresh || existing.currentConfidence < 0.7) {
          gaps.push({
            requirementId: req.id,
            topic: req.topic,
            gapType: existing.isStale ? 'stale' : 'incomplete',
            estimatedEffort: this.estimateEffort(req, 'partial'),
            existingEntityId: existing.entityId,
            confidence: existing.currentConfidence,
          });
        }
      } else {
        // No existing knowledge found — full gap
        gaps.push({
          requirementId: req.id,
          topic: req.topic,
          gapType: 'missing',
          estimatedEffort: this.estimateEffort(req, 'full'),
        });
      }
    }

    // ── Build coverage summary ────────────────────────────────────────────
    const coverage: CoverageAssessment = {
      totalRequirements: requirements.length,
      alreadyExists: assessments.filter((a) => !a.needsRefresh && !a.isStale && a.currentConfidence >= 0.7).length,
      partiallyExists: assessments.filter((a) => a.needsRefresh || a.isStale || a.currentConfidence < 0.7).length,
      missing: gaps.filter((g) => g.gapType === 'missing').length,
      existingEntityIds: assessments.map((a) => a.entityId),
      gaps,
    };

    // ── Update petition ───────────────────────────────────────────────────
    await this.updatePetition(petition.id, {
      gapAssessment: coverage as any,
      assessedAt: new Date(),
      estimatedCostUsd: gaps.reduce((sum, gap) => sum + gap.estimatedEffort.costUsd, 0),
      totalTokens: gaps.reduce((sum, gap) => sum + gap.estimatedEffort.tokens, 0),
      apiCalls: gaps.reduce((sum, gap) => sum + gap.estimatedEffort.apiCalls, 0),
    });

    // ── Post assessment summary to thread ─────────────────────────────────
    await prisma.petitionThread.create({
      data: {
        petitionId: petition.id,
        role: 'system',
        messageType: 'progress_update',
        content: this.formatAssessmentSummary(coverage),
        data: {
          coverage,
        },
      },
    });
  }

  /**
   * Search for existing knowledge relevant to a requirement.
   */
  private async findExistingKnowledge(
    req: KnowledgeRequirement,
  ): Promise<ExistingKnowledge | null> {
    // ── Strategy 1: Exact path match for entries ─────────────────────────
    if (req.entityType === 'entry' && req.targetId) {
      const entry = await prisma.entry.findFirst({
        where: {
          targetId: req.targetId,
          path: { contains: req.topic },
        },
        select: {
          id: true,
          path: true,
          contentStandard: true,
          confidence: true,
          generatedAt: true,
          contentMicro: true,
          contentExhaustive: true,
        },
      });

      if (entry) {
        return {
          entityType: 'entry',
          entityId: entry.id,
          entityTitle: req.topic,
          entityPath: entry.path,
          relevance: 1.0,
          currentConfidence: entry.confidence,
          hasAllResolutions: !!(entry.contentMicro && entry.contentStandard && entry.contentExhaustive),
          isStale: this.isStale(entry.generatedAt),
          needsRefresh: entry.confidence < 0.7,
        };
      }
    }

    // ── Strategy 2: Search by concept ─────────────────────────────────────
    if (req.entityType === 'concept') {
      const concept = await prisma.concept.findFirst({
        where: {
          OR: [
            { name: { contains: req.topic, mode: 'insensitive' } },
            { description: { contains: req.topic, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          description: true,
        },
      });

      if (concept) {
        return {
          entityType: 'concept',
          entityId: concept.id,
          entityTitle: concept.name,
          relevance: 0.9,
          currentConfidence: 1.0, // Concepts don't have confidence
          hasAllResolutions: !!concept.description,
          isStale: false,
          needsRefresh: false,
        };
      }
    }

    // ── Strategy 3: Search algorithms ─────────────────────────────────────
    if (req.entityType === 'algorithm') {
      const algorithm = await prisma.algorithm.findFirst({
        where: {
          OR: [
            { name: { contains: req.topic, mode: 'insensitive' } },
            { summary: { contains: req.topic, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          summary: true,
          confidence: true,
        },
      });

      if (algorithm) {
        return {
          entityType: 'algorithm',
          entityId: algorithm.id,
          entityTitle: algorithm.name,
          relevance: 0.95,
          currentConfidence: algorithm.confidence ?? 0,
          hasAllResolutions: !!(algorithm.summary),
          isStale: false,
          needsRefresh: (algorithm.confidence ?? 0) < 0.7,
        };
      }
    }

    // ── Strategy 4: Fuzzy search using pg_trgm ───────────────────────────
    // This catches partial matches and related content
    const fuzzyResults = await this.fuzzySearch(req);
    if (fuzzyResults) {
      return fuzzyResults;
    }

    return null;
  }

  /**
   * Fuzzy search for related knowledge using PostgreSQL trigram similarity.
   */
  private async fuzzySearch(
    req: KnowledgeRequirement,
  ): Promise<ExistingKnowledge | null> {
    // Search entries with trigram similarity
    const results = await prisma.$queryRaw<
      Array<{
        id: string;
        path: string;
        similarity: number;
        confidence: number;
        generatedAt: Date;
        contentMicro: string | null;
        contentStandard: string | null;
        contentExhaustive: string | null;
      }>
    >`
      SELECT id, path, confidence, generatedAt, contentMicro, contentStandard, contentExhaustive,
             similarity(path, ${req.topic}) as sim
      FROM entries
      WHERE similarity(path, ${req.topic}) > 0.3
      ORDER BY sim DESC
      LIMIT 1
    `;

    if (results.length > 0) {
      const result = results[0];
      return {
        entityType: 'entry',
        entityId: result.id,
        entityTitle: req.topic,
        entityPath: result.path,
        relevance: result.similarity,
        currentConfidence: result.confidence,
        hasAllResolutions: !!(result.contentMicro && result.contentStandard && result.contentExhaustive),
        isStale: this.isStale(result.generatedAt),
        needsRefresh: result.confidence < 0.7,
      };
    }

    return null;
  }

  /**
   * Estimate effort required to fill a gap.
   */
  private estimateEffort(
    req: KnowledgeRequirement,
    gapType: 'full' | 'partial',
  ): { apiCalls: number; tokens: number; costUsd: number } {
    const baseTokens: Record<string, number> = {
      concept: 1500,
      entry: 3000,
      algorithm: 2500,
      atom: 1000,
      capability: 2000,
      blueprint: 5000,
    };

    const tokens = baseTokens[req.entityType] ?? 2000;
    const adjustedTokens = gapType === 'partial' ? Math.floor(tokens * 0.6) : tokens;
    const apiCalls = gapType === 'partial' ? 1 : Math.ceil(adjustedTokens / 2000);
    const costPerToken = 0.000015; // Approximate mid-tier model rate

    return {
      apiCalls,
      tokens: adjustedTokens,
      costUsd: adjustedTokens * costPerToken,
    };
  }

  /**
   * Check if content is stale (older than 6 months).
   */
  private isStale(generatedAt: Date | null): boolean {
    if (!generatedAt) return true;
    const ageMs = Date.now() - generatedAt.getTime();
    const sixMonths = 180 * 86_400_000;
    return ageMs > sixMonths;
  }

  /**
   * Format assessment summary for the user.
   */
  private formatAssessmentSummary(coverage: CoverageAssessment): string {
    let content = `## Knowledge Coverage Assessment\n\n`;
    content += `I've analyzed the database for existing knowledge relevant to your request:\n\n`;

    content += `| Metric | Count |\n`;
    content += `|--------|-------|\n`;
    content += `| Total Requirements | ${coverage.totalRequirements} |\n`;
    content += `| Already Exists | ${coverage.alreadyExists} |\n`;
    content += `| Partially Exists (needs refresh) | ${coverage.partiallyExists} |\n`;
    content += `| Missing | ${coverage.missing} |\n\n`;

    if (coverage.gaps.length > 0) {
      content += `### Gaps to Fill\n\n`;
      const missingGaps = coverage.gaps.filter((g) => g.gapType === 'missing');
      const partialGaps = coverage.gaps.filter((g) => g.gapType !== 'missing');

      if (missingGaps.length > 0) {
        content += `**Missing Knowledge** (${missingGaps.length}):\n`;
        for (const gap of missingGaps.slice(0, 5)) {
          content += `- ${gap.topic}\n`;
        }
        if (missingGaps.length > 5) {
          content += `- ... and ${missingGaps.length - 5} more\n`;
        }
        content += '\n';
      }

      if (partialGaps.length > 0) {
        content += `**Needs Refresh** (${partialGaps.length}):\n`;
        for (const gap of partialGaps.slice(0, 5)) {
          content += `- ${gap.topic} (confidence: ${(gap.confidence ?? 0).toFixed(2)})\n`;
        }
        content += '\n';
      }
    }

    const totalCost = coverage.gaps.reduce((sum, gap) => sum + gap.estimatedEffort.costUsd, 0);
    content += `**Estimated Cost**: $${totalCost.toFixed(2)}\n`;
    content += `**Estimated API Calls**: ${coverage.gaps.reduce((sum, gap) => sum + gap.estimatedEffort.apiCalls, 0)}\n`;

    return content;
  }

  /**
   * Update petition status.
   */
  private async updateStatus(
    petitionId: string,
    status: Petition['status'],
  ): Promise<void> {
    await prisma.petition.update({
      where: { id: petitionId },
      data: { status },
    });
  }

  /**
   * Update petition with assessment results.
   */
  private async updatePetition(
    petitionId: string,
    data: Partial<Petition>,
  ): Promise<void> {
    await prisma.petition.update({
      where: { id: petitionId },
      data,
    });
  }
}

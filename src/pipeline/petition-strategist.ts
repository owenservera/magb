// ═══════════════════════════════════════════════════════════════════════════════
// petition-strategist.ts
//
// The "Strategist" — builds a targeted generation plan to fill exactly the gaps
// identified by the Cartographer.
//
// Unlike the standard MasterPlan which generates entire targets systematically,
// the PetitionStrategist creates a focused plan that:
//   1. Only generates what's missing for this petition
//   2. Respects budget constraints
//   3. Prioritizes by importance (critical → important → nice_to_have)
//   4. Links back to the petition for tracking
// ═══════════════════════════════════════════════════════════════════════════════

import {
  PrismaClient,
  Petition,
  PetitionStatus,
  PipelinePhase,
  WorkItemReason,
  ModelTier,
} from '@prisma/client';
import { KnowledgeRequirement } from './petition-engine';
import { GapReport } from './petition-cartographer';

const prisma = new PrismaClient();

interface StrategicPlan {
  targetId: string;
  workItems: Array<{
    phase: PipelinePhase;
    entityType: string;
    title: string;
    path?: string;
    modelTier: ModelTier;
    reason: WorkItemReason;
    promptContext: Record<string, any>;
    requirementId: string;
    estimatedCost: number;
  }>;
  totalEstimatedCost: number;
  totalApiCalls: number;
}

export class PetitionStrategist {
  /**
   * Create a generation plan to fulfill the petition.
   *
   * This links the petition to a MasterPlan (or creates a new one)
   * and populates it with work items targeting the identified gaps.
   */
  async createPlan(petition: Petition): Promise<void> {
    await this.updateStatus(petition.id, 'PLANNING');

    const gaps = (petition.gapAssessment as any)?.gaps as GapReport[];

    if (!gaps || gaps.length === 0) {
      // All knowledge already exists!
      await this.markFulfilled(petition.id, 'All required knowledge already exists in the database.');
      return;
    }

    // ── Check budget constraints ──────────────────────────────────────────
    const totalCost = gaps.reduce((sum, gap) => sum + gap.estimatedEffort.costUsd, 0);
    const totalApiCalls = gaps.reduce((sum, gap) => sum + gap.estimatedEffort.apiCalls, 0);

    if (petition.maxCostUsd && totalCost > petition.maxCostUsd) {
      await this.notifyBudgetExceeded(petition.id, totalCost, petition.maxCostUsd);
      return;
    }

    if (petition.maxApiCalls && totalApiCalls > petition.maxApiCalls) {
      await this.notifyBudgetExceeded(petition.id, totalCost, petition.maxCostUsd ?? undefined, totalApiCalls, petition.maxApiCalls);
      return;
    }

    // ── Group gaps by target ─────────────────────────────────────────────
    const gapsByTarget = this.groupGapsByTarget(gaps);

    // ── Create or link to MasterPlan ─────────────────────────────────────
    // For petitions, we create a special "petition" plan that's not tied to a single target
    const plan = await this.createPetitionPlan(petition.id, gaps);

    // ── Create work items for each gap ───────────────────────────────────
    await this.createWorkItems(plan.id, gaps, petition);

    // ── Update petition ──────────────────────────────────────────────────
    await prisma.petition.update({
      where: { id: petition.id },
      data: {
        generationPlanId: plan.id,
        status: 'PLANNING',
        estimatedCostUsd: totalCost,
        totalTokens: gaps.reduce((sum, gap) => sum + gap.estimatedEffort.tokens, 0),
        apiCalls: totalApiCalls,
      },
    });
  }

  /**
   * Group gaps by their target ID.
   */
  private groupGapsByTarget(gaps: GapReport[]): Record<string, GapReport[]> {
    return gaps.reduce((acc, gap) => {
      // Extract target from requirement (this is simplified)
      const targetId = 'universal'; // In production, extract from requirement
      if (!acc[targetId]) {
        acc[targetId] = [];
      }
      acc[targetId].push(gap);
      return acc;
    }, {} as Record<string, GapReport[]>);
  }

  /**
   * Create a MasterPlan for the petition.
   */
  private async createPetitionPlan(
    petitionId: string,
    gaps: GapReport[],
  ): Promise<{ id: string }> {
    // Create a synthetic target for petition-based plans
    // In production, this might be a special "petition" target or
    // we might modify MasterPlan to support petition-native plans

    // For now, create a plan linked to a generic target
    // We'll use the first gap's target or create a virtual one
    const firstTargetId = gaps[0]?.existingEntityId ? 'petition' : 'petition';

    const plan = await prisma.masterPlan.create({
      data: {
        targetId: firstTargetId,
        status: 'READY',
        wave: 99, // Petition plans are outside normal waves
        estimatedCostUsd: gaps.reduce((sum, gap) => sum + gap.estimatedEffort.costUsd, 0),
        coverageSnapshot: {
          petitionId,
          gapsCount: gaps.length,
          type: 'petition',
        },
        phaseProgress: {
          GENERATE_REFERENCE: {
            status: 'READY',
            items: gaps.length,
            completed: 0,
            skipped: 0,
          },
        },
        metadata: {
          petitionId,
          isPetitionPlan: true,
        },
      },
    });

    return plan;
  }

  /**
   * Create work items for each gap.
   */
  private async createWorkItems(
    planId: string,
    gaps: GapReport[],
    petition: Petition,
  ): Promise<void> {
    const workItems = gaps.map((gap, index) => {
      const phase = this.determinePhase(gap);
      const modelTier = this.determineModelTier(gap);

      return {
        planId,
        phase,
        status: 'READY' as const,
        entityType: this.getEntityType(gap),
        title: gap.topic,
        path: gap.topic,
        reason: 'GAP_DETECTED' as WorkItemReason,
        modelTier,
        promptContext: this.buildPromptContext(gap, petition),
        executionOrder: index,
        metadata: {
          petitionId: petition.id,
          requirementId: gap.requirementId,
          gapType: gap.gapType,
        },
      };
    });

    // Create work items in batch
    for (const item of workItems) {
      await prisma.workItem.create({
        data: item as any,
      });
    }
  }

  /**
   * Determine the pipeline phase for a gap.
   */
  private determinePhase(gap: GapReport): PipelinePhase {
    // For petition-based generation, most gaps are filled in GENERATE_REFERENCE
    // In a more sophisticated system, we'd route based on entity type:
    // - algorithms → EXTRACT_ALGORITHMS
    // - capabilities → ENUMERATE_CAPABILITIES
    // - blueprints → ASSEMBLE_BLUEPRINTS

    return 'GENERATE_REFERENCE';
  }

  /**
   * Determine model tier based on gap complexity.
   */
  private determineModelTier(gap: GapReport): ModelTier {
    // Simple heuristic: use mid-tier for most content
    // Use expensive tier for complex topics or low-confidence refreshes

    if (gap.gapType === 'stale' && (gap.confidence ?? 1) < 0.5) {
      return 'EXPENSIVE'; // Needs careful re-validation
    }

    if (gap.topic.toLowerCase().includes('architecture') ||
        gap.topic.toLowerCase().includes('blueprint')) {
      return 'EXPENSIVE'; // Complex reasoning needed
    }

    return 'MID';
  }

  /**
   * Get entity type from gap.
   */
  private getEntityType(gap: GapReport): string {
    // In production, this comes from the requirement
    // For now, infer from topic keywords
    const lowerTopic = gap.topic.toLowerCase();

    if (lowerTopic.includes('algorithm') || lowerTopic.includes('interpolation')) {
      return 'algorithm';
    }
    if (lowerTopic.includes('capability') || lowerTopic.includes('feature')) {
      return 'capability';
    }
    if (lowerTopic.includes('atom') || lowerTopic.includes('element')) {
      return 'atom';
    }
    if (lowerTopic.includes('blueprint') || lowerTopic.includes('architecture')) {
      return 'blueprint';
    }

    return 'entry';
  }

  /**
   * Build prompt context for a work item.
   */
  private buildPromptContext(
    gap: GapReport,
    petition: Petition,
  ): Record<string, any> {
    return {
      petitionContext: {
        userQuery: petition.userQuery,
        userContext: petition.userContext,
        targetOutputs: petition.targetOutputs,
      },
      gapInfo: {
        topic: gap.topic,
        gapType: gap.gapType,
        existingEntityId: gap.existingEntityId,
      },
      instruction: this.buildInstruction(gap, petition),
    };
  }

  /**
   * Build generation instruction for the work item.
   */
  private buildInstruction(
    gap: GapReport,
    petition: Petition,
  ): string {
    const baseInstruction = `Generate knowledge for: "${gap.topic}"`;

    const context = petition.userContext
      ? ` This is for: ${petition.userContext}`
      : '';

    const outputs = petition.targetOutputs.length > 0
      ? ` Target outputs: ${petition.targetOutputs.join(', ')}`
      : '';

    const gapContext = gap.gapType === 'stale'
      ? ' Refresh and update this existing knowledge with current information.'
      : gap.gapType === 'incomplete'
      ? ' Expand this existing knowledge to be more comprehensive.'
      : ' Create comprehensive new knowledge from scratch.';

    return `${baseInstruction}.${context}${outputs}${gapContext}`;
  }

  /**
   * Mark petition as fulfilled (all knowledge exists).
   */
  private async markFulfilled(
    petitionId: string,
    summary: string,
  ): Promise<void> {
    await prisma.petition.update({
      where: { id: petitionId },
      data: {
        status: 'FULFILLED',
        fulfilledAt: new Date(),
        fulfillmentSummary: summary,
        progress: 1.0,
      },
    });

    await prisma.petitionThread.create({
      data: {
        petitionId,
        role: 'system',
        messageType: 'completion_report',
        content: `🎉 Your petition is already fulfilled!\n\n${summary}`,
        data: {
          alreadyFulfilled: true,
        },
      },
    });
  }

  /**
   * Notify user that budget is exceeded.
   */
  private async notifyBudgetExceeded(
    petitionId: string,
    estimatedCost: number,
    maxCost?: number,
    estimatedApiCalls?: number,
    maxApiCalls?: number,
  ): Promise<void> {
    let message = '⚠️ Budget Exceeded\n\n';

    if (maxCost && estimatedCost > maxCost) {
      message += `Estimated cost ($${estimatedCost.toFixed(2)}) exceeds your budget ($${maxCost.toFixed(2)}).\n`;
    }

    if (maxApiCalls && estimatedApiCalls && estimatedApiCalls > maxApiCalls) {
      message += `Estimated API calls (${estimatedApiCalls}) exceeds your limit (${maxApiCalls}).\n`;
    }

    message += '\nPlease adjust your budget or refine your petition scope.';

    await prisma.petition.update({
      where: { id: petitionId },
      data: {
        status: 'PLANNING',
        statusMessage: 'Budget exceeded - awaiting user adjustment',
      },
    });

    await prisma.petitionThread.create({
      data: {
        petitionId,
        role: 'system',
        messageType: 'cost_warning',
        content: message,
        data: {
          estimatedCost,
          maxCost,
          estimatedApiCalls,
          maxApiCalls,
        },
      },
    });
  }

  /**
   * Update petition status.
   */
  private async updateStatus(
    petitionId: string,
    status: PetitionStatus,
  ): Promise<void> {
    await prisma.petition.update({
      where: { id: petitionId },
      data: { status },
    });
  }
}

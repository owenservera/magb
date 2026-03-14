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

import { PrismaClient, PetitionStatus, PetitionScope, PetitionPriority } from '@prisma/client';
import { PetitionDecomposer } from './petition-decomposer';
import { PetitionCartographer } from './petition-cartographer';
import { PetitionStrategist } from './petition-strategist';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PetitionOptions {
  userId?: string;
  priority?: PetitionPriority;
  context?: string;
  targetOutputs?: string[];
  maxCostUsd?: number;
  maxApiCalls?: number;
}

export interface PetitionResult {
  petitionId: string;
  status: PetitionStatus;
  message: string;
  estimatedCostUsd?: number;
  estimatedTimeMinutes?: number;
}

export interface KnowledgeRequirement {
  id: string;
  category: string;
  topic: string;
  targetId: string | null;
  entityType: string;
  importance: 'critical' | 'important' | 'nice_to_have';
  searchTerms: string[];
  relatedConceptIds: string[];
  crossTarget: boolean;
  estimatedEffort: { apiCalls: number; tokens: number; costUsd: number } | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// PetitionEngine — Main entry point
// ─────────────────────────────────────────────────────────────────────────────

export class PetitionEngine {
  private decomposer: PetitionDecomposer;
  private cartographer: PetitionCartographer;
  private strategist: PetitionStrategist;

  constructor() {
    this.decomposer = new PetitionDecomposer();
    this.cartographer = new PetitionCartographer();
    this.strategist = new PetitionStrategist();
  }

  /**
   * Submit a new petition. This is the user's entry point.
   *
   * Example:
   *   submitPetition(
   *     "I want to replicate the gradient tool from Photoshop",
   *     {
   *       userId: "user_123",
   *       context: "Building a browser-based design tool",
   *       targetOutputs: ["svg", "html_canvas", "png"],
   *       maxCostUsd: 5.0
   *     }
   *   )
   */
  async submitPetition(
    userQuery: string,
    options?: PetitionOptions,
  ): Promise<PetitionResult> {
    // ── Step 1a: Check for duplicate petitions ─────────────────────────────
    const existing = await this.findSimilarPetition(userQuery);
    if (existing) {
      // Don't create a duplicate — add a vote instead
      await this.addVote(existing.id, options?.userId);
      return {
        petitionId: existing.id,
        status: existing.status as PetitionStatus,
        message:
          'A similar petition already exists. Your vote has been added to prioritize it.',
      };
    }

    // ── Step 1b: Check for template match ──────────────────────────────────
    const template = await this.matchTemplate(userQuery);

    // ── Step 1c: Create the petition ───────────────────────────────────────
    const petition = await prisma.petition.create({
      data: {
        userQuery,
        userId: options?.userId,
        priority: options?.priority ?? 'NORMAL',
        maxCostUsd: options?.maxCostUsd,
        maxApiCalls: options?.maxApiCalls,
        userContext: options?.context,
        targetOutputs: options?.targetOutputs ?? [],
        status: template ? 'ASSESSING' : 'SUBMITTED',
        knowledgeRequirements: template?.knowledgeRequirements ?? [],
        decomposedAt: template ? new Date() : null,
        metadata: {
          templateId: template?.id ?? null,
          submittedVia: 'api',
        },
      },
    });

    // ── Step 1d: Post initial thread message ───────────────────────────────
    await prisma.petitionThread.create({
      data: {
        petitionId: petition.id,
        role: 'system',
        messageType: 'progress_update',
        content: template
          ? `Matched template "${template.name}". Assessing current knowledge coverage...`
          : 'Analyzing your request to determine what knowledge is needed...',
        data: { template: template?.id ?? null },
      },
    });

    // ── Step 1e: Queue for processing ──────────────────────────────────────
    // In production, this would go through a message queue
    this.processPetition(petition.id).catch((err) => {
      console.error(`Petition processing failed for ${petition.id}:`, err);
    });

    return {
      petitionId: petition.id,
      status: petition.status as PetitionStatus,
      message: template
        ? 'Matched existing template. Your petition is being assessed.'
        : 'Your petition has been submitted. The AI is analyzing your request.',
      estimatedCostUsd: template?.estimatedCostUsd,
      estimatedTimeMinutes: template?.estimatedTimeMinutes,
    };
  }

  /**
   * Find similar existing petitions using text similarity.
   * Uses pg_trgm for fuzzy matching.
   */
  async findSimilarPetition(query: string): Promise<{
    id: string;
    userQuery: string;
    status: string;
  } | null> {
    const results = await prisma.$queryRaw<
      Array<{ id: string; user_query: string; status: string; sim: number }>
    >`
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

  /**
   * Match against known petition templates.
   */
  async matchTemplate(
    query: string,
  ): Promise<{
    id: string;
    name: string;
    knowledgeRequirements: any;
    estimatedCostUsd: number;
    estimatedApiCalls: number;
    estimatedTimeMinutes: number;
  } | null> {
    const templates = await prisma.petitionTemplate.findMany({
      where: { isActive: true },
    });

    // Simple pattern matching (in production, use embeddings)
    const lowerQuery = query.toLowerCase();
    for (const template of templates) {
      for (const pattern of template.matchPatterns) {
        const regex = new RegExp(
          pattern.replace(/\*/g, '.*').replace(/\?/g, '.'),
          'i',
        );
        if (regex.test(lowerQuery)) {
          return {
            id: template.id,
            name: template.name,
            knowledgeRequirements: template.knowledgeRequirements,
            estimatedCostUsd: template.estimatedCostUsd,
            estimatedApiCalls: template.estimatedApiCalls,
            estimatedTimeMinutes: template.estimatedTimeMinutes,
          };
        }
      }
    }

    return null;
  }

  /**
   * Add a vote to an existing petition.
   */
  async addVote(petitionId: string, userId?: string): Promise<void> {
    if (!userId) return;

    await prisma.petitionVote.upsert({
      where: {
        petitionId_userId: {
          petitionId,
          userId,
        },
      },
      update: {
        weight: 1,
      },
      create: {
        petitionId,
        userId,
        weight: 1,
      },
    });
  }

  /**
   * Process a petition through the full pipeline.
   */
  async processPetition(petitionId: string): Promise<void> {
    const petition = await prisma.petition.findUniqueOrThrow({
      where: { id: petitionId },
    });

    try {
      // ── Step 2: Decomposition (if not template-matched) ──────────────────
      if (petition.status === 'SUBMITTED') {
        await this.decomposer.decompose(petition);
      }

      // ── Step 3: Coverage Assessment ──────────────────────────────────────
      await this.cartographer.assessCoverage(petition);

      // ── Step 4: Strategy & Planning ──────────────────────────────────────
      await this.strategist.createPlan(petition);

      // ── Step 5: Update status to PLANNING ────────────────────────────────
      await prisma.petition.update({
        where: { id: petitionId },
        data: {
          status: 'PLANNING',
          planCreatedAt: new Date(),
        },
      });

      // ── Step 6: Post planning complete message ───────────────────────────
      await prisma.petitionThread.create({
        data: {
          petitionId,
          role: 'strategist',
          messageType: 'scope_proposal',
          content: `Generation plan created. Ready to execute.`,
          data: {
            planId: petition.generationPlanId,
          },
        },
      });
    } catch (error) {
      console.error(`Petition ${petitionId} processing failed:`, error);
      await prisma.petition.update({
        where: { id: petitionId },
        data: {
          status: 'REJECTED',
          statusMessage: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      });
    }
  }

  /**
   * Get petition status and progress.
   */
  async getPetitionStatus(petitionId: string): Promise<{
    petition: any;
    threads: any[];
    progress: number;
  }> {
    const petition = await prisma.petition.findUniqueOrThrow({
      where: { id: petitionId },
      include: {
        generationPlan: {
          include: {
            workItems: {
              select: {
                status: true,
                phase: true,
                title: true,
              },
            },
          },
        },
      },
    });

    const threads = await prisma.petitionThread.findMany({
      where: { petitionId },
      orderBy: { createdAt: 'asc' },
    });

    // Calculate progress
    const plan = petition.generationPlan;
    let progress = 0;

    if (petition.status === 'FULFILLED') {
      progress = 1;
    } else if (plan) {
      const totalItems = plan.workItems.length;
      const completedItems = plan.workItems.filter(
        (item) => item.status === 'VALIDATED' || item.status === 'COMPLETED',
      ).length;
      progress = totalItems > 0 ? completedItems / totalItems : 0;
    }

    return {
      petition,
      threads,
      progress,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience function for direct usage
// ─────────────────────────────────────────────────────────────────────────────

const engine = new PetitionEngine();

export async function submitPetition(
  userQuery: string,
  options?: PetitionOptions,
): Promise<PetitionResult> {
  return engine.submitPetition(userQuery, options);
}

export async function getPetitionStatus(
  petitionId: string,
): Promise<ReturnType<PetitionEngine['getPetitionStatus']>> {
  return engine.getPetitionStatus(petitionId);
}

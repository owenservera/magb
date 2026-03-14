// ═══════════════════════════════════════════════════════════════════════════════
// petition-decomposer.ts
//
// The AI that figures out what knowledge is needed to fulfill a petition.
// Takes a user's natural language request and decomposes it into structured
// knowledge requirements.
// ═══════════════════════════════════════════════════════════════════════════════

import { PrismaClient, Petition, PetitionScope } from '@prisma/client';
import { ZaiClient } from '../engine/llm/ZaiClient';
import { Config } from '../engine/config';
import { KnowledgeRequirement } from './petition-engine';

const prisma = new PrismaClient();
const config = new Config();
const zaiClient = new ZaiClient(config);

interface DecompositionResult {
  intent: string;
  understanding: string;
  scope: PetitionScope;
  targets_involved: string[];
  requirements: Array<{
    order: number;
    entity_type: string;
    target_id: string | null;
    path: string;
    title: string;
    description: string;
    layer: string;
    category: string;
    is_core: boolean;
    depends_on: number[];
  }>;
}

export class PetitionDecomposer {
  /**
   * Decompose a petition into structured requirements.
   *
   * This is the single most important LLM call in the petition pipeline.
   * It translates the user's fuzzy intent into a structured list of
   * knowledge requirements.
   */
  async decompose(petition: Petition): Promise<void> {
    await this.updateStatus(petition.id, 'DECOMPOSING');

    // ── Build context for the decomposer ───────────────────────────────────
    const systemPrompt = `
You are a knowledge architect for the magB Universal Blueprint Machine.
The database stores structured knowledge about programming languages,
file formats, algorithms, and implementation patterns.

Entity types in the database:
- CONCEPT: Universal ideas (e.g., "gradient interpolation", "error handling")
- ENTRY: Target-specific documentation (e.g., "Python/for loop", "CSS/linear-gradient")
- ALGORITHM: Mathematical/computational procedures (e.g., "Gaussian blur", "DEFLATE compression")
- ATOM: Structural building blocks of file formats (e.g., XML elements, binary fields)
- CAPABILITY: Actionable features (e.g., "Draw rectangle in SVG", "Apply gradient in CSS")
- BLUEPRINT: Complete architecture plans combining capabilities

Each entry has three resolution levels:
- micro (~50 tokens): summary
- standard (~500 tokens): explanation with examples
- exhaustive (~2000 tokens): deep implementation details

Your task: Given the user's request, determine EXACTLY what knowledge
the database needs to contain to fully answer their question.
Return a structured list of knowledge requirements.
    `.trim();

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

Return JSON:
{
  "intent": "FEATURE_REPLICATION|HOW_TO|CONCEPT_DEEP_DIVE|CROSS_TARGET_COMPARE|BUILD_GUIDE|EXPLORATION",
  "understanding": "A 2-3 sentence summary of what the user wants, phrased as confirmation.",
  "scope": "FEATURE_REPLICATION|HOW_TO|CONCEPT_DEEP_DIVE|CROSS_TARGET_COMPARE|BUILD_GUIDE|EXPLORATION",
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
- Edge cases (transparency, color space conversion, banding artifacts)
    `.trim();

    // ── Call the AI ────────────────────────────────────────────────────────
    const response = await zaiClient.generateJson<DecompositionResult>(
      userPrompt,
      systemPrompt,
      config.generation.models.expansion.model,
      0.1,
    );

    // ── Validate and normalize ─────────────────────────────────────────────
    const normalizedRequirements = this.normalizeRequirements(response.requirements);

    // ── Update petition ────────────────────────────────────────────────────
    await this.updatePetition(petition.id, {
      title: this.generateTitle(petition.userQuery, response),
      scope: response.scope as PetitionScope,
      description: response.understanding,
      knowledgeRequirements: normalizedRequirements,
      decomposedAt: new Date(),
      metadata: {
        decompositionModel: config.generation.models.expansion.model,
        targets_involved: response.targets_involved,
      },
    });

    // ── Post decomposition summary to thread ───────────────────────────────
    await prisma.petitionThread.create({
      data: {
        petitionId: petition.id,
        role: 'decomposer',
        messageType: 'scope_proposal',
        content: this.formatScopeProposal(normalizedRequirements),
        data: {
          requirementCount: normalizedRequirements.length,
          byCategory: this.groupByCategory(normalizedRequirements),
          targetsInvolved: response.targets_involved,
        },
      },
    });

    // ── Check if clarification is needed ───────────────────────────────────
    if (this.needsClarification(normalizedRequirements, petition)) {
      await this.requestClarification(petition, normalizedRequirements);
    }
  }

  /**
   * Normalize and validate requirements from the AI response.
   */
  private normalizeRequirements(
    requirements: DecompositionResult['requirements'],
  ): KnowledgeRequirement[] {
    return requirements.map((req, i) => ({
      id: `kr_${String(i + 1).padStart(3, '0')}`,
      category: this.normalizeCategory(req.category),
      topic: req.title,
      targetId: this.resolveTargetId(req.target_id),
      entityType: this.categoryToEntityType(req.category),
      importance: 'important',
      searchTerms: this.extractSearchTerms(req.title, req.description),
      relatedConceptIds: [],
      crossTarget: false,
      estimatedEffort: null,
    }));
  }

  /**
   * Normalize category to standard values.
   */
  private normalizeCategory(category: string): string {
    const mapping: Record<string, string> = {
      tool: 'entry',
      algorithm: 'algorithm',
      structure: 'atom',
      concept: 'concept',
      feature: 'capability',
      architecture: 'blueprint',
    };
    return mapping[category.toLowerCase()] ?? 'entry';
  }

  /**
   * Map category to entity type.
   */
  private categoryToEntityType(category: string): string {
    const mapping: Record<string, string> = {
      tool: 'entry',
      algorithm: 'algorithm',
      structure: 'atom',
      concept: 'concept',
      feature: 'capability',
      architecture: 'blueprint',
    };
    return mapping[category.toLowerCase()] ?? 'entry';
  }

  /**
   * Resolve target ID from string to database ID.
   */
  private resolveTargetId(targetId: string | null): string | null {
    if (!targetId) return null;
    // In production, this would look up the actual target ID
    // For now, we use the string directly (deterministic IDs)
    return targetId.toLowerCase();
  }

  /**
   * Extract search terms from title and description.
   */
  private extractSearchTerms(title: string, description: string): string[] {
    const text = `${title} ${description}`.toLowerCase();
    const words = text
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 10);
    return [...new Set(words)];
  }

  /**
   * Generate a short title for the petition.
   */
  private generateTitle(
    userQuery: string,
    response: DecompositionResult,
  ): string {
    // Use the first few words of the understanding
    const words = response.understanding.split(' ').slice(0, 8);
    return words.join(' ') + (words.length < response.understanding.split(' ').length ? '...' : '');
  }

  /**
   * Format the scope proposal for the user.
   */
  private formatScopeProposal(requirements: KnowledgeRequirement[]): string {
    const byCategory = this.groupByCategory(requirements);

    let content = `## Knowledge Requirements Analysis\n\n`;
    content += `I've decomposed your request into **${requirements.length} knowledge requirements**:\n\n`;

    for (const [category, items] of Object.entries(byCategory)) {
      content += `### ${category.charAt(0).toUpperCase() + category.slice(1)} (${items.length})\n`;
      for (const item of items.slice(0, 5)) {
        content += `- ${item.topic}\n`;
      }
      if (items.length > 5) {
        content += `- ... and ${items.length - 5} more\n`;
      }
      content += '\n';
    }

    return content;
  }

  /**
   * Group requirements by category.
   */
  private groupByCategory(
    requirements: KnowledgeRequirement[],
  ): Record<string, KnowledgeRequirement[]> {
    return requirements.reduce((acc, req) => {
      const category = req.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(req);
      return acc;
    }, {} as Record<string, KnowledgeRequirement[]>);
  }

  /**
   * Determine if the system needs to ask the user for more information.
   */
  private needsClarification(
    requirements: KnowledgeRequirement[],
    petition: Petition,
  ): boolean {
    // Ambiguous scope — too many possible interpretations
    if (requirements.length > 30) return true;

    // No target specified for implementation-level requirements
    const implWithoutTarget = requirements.filter(
      (r) => ['atom', 'capability'].includes(r.category) && !r.targetId,
    );
    if (implWithoutTarget.length > 0) return true;

    // Cross-target but no targets specified
    const crossTarget = requirements.filter((r) => r.crossTarget);
    if (crossTarget.length > 0 && petition.targetOutputs.length === 0)
      return true;

    return false;
  }

  /**
   * Request clarification from the user.
   */
  private async requestClarification(
    petition: Petition,
    requirements: KnowledgeRequirement[],
  ): Promise<void> {
    const questions: string[] = [];

    const implWithoutTarget = requirements.filter(
      (r) => ['atom', 'capability'].includes(r.category) && !r.targetId,
    );
    if (implWithoutTarget.length > 0) {
      questions.push(
        `Which output format(s) are you targeting? ` +
          `The topics "${implWithoutTarget
            .map((r) => r.topic)
            .join('", "')}" ` +
          `need a specific format context (e.g., SVG, Canvas API, CSS, PSD).`,
      );
    }

    if (requirements.length > 30) {
      questions.push(
        `Your request decomposed into ${requirements.length} knowledge topics. ` +
          `Could you narrow the scope? For example, are you interested in a specific ` +
          `aspect (e.g., just the rendering algorithm, or the full UI tool replication)?`,
      );
    }

    await prisma.petitionThread.create({
      data: {
        petitionId: petition.id,
        role: 'system',
        messageType: 'clarification_request',
        content: `I need some clarification to better understand your request:\n\n` +
          questions.map((q, i) => `${i + 1}. ${q}`).join('\n'),
        data: {
          questions,
          requirementCount: requirements.length,
        },
      },
    });
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
   * Update petition with decomposition results.
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

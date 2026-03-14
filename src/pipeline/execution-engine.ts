import { PrismaClient, WorkItem, WorkItemStatus, MasterPlan, PipelinePhase } from '@prisma/client';
import { loadConfig } from '../engine/config';
import { ZaiClient } from '../engine/llm/ZaiClient';

const prisma = new PrismaClient();
const config = loadConfig();
const zaiClient = new ZaiClient(config);

class BudgetExhaustedError extends Error {
  constructor(actual: number, limit: number) {
    super(`Budget exhausted: spent $${actual} of $${limit} limit.`);
    this.name = 'BudgetExhaustedError';
  }
}

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
export function parseResponse(raw: string): ParseResult {
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

async function callLLMApi(options: any): Promise<{ content: string; usage: { inputTokens: number; outputTokens: number } }> {
  // Use ZaiClient's internal makeRequest to capture usage
  const data = await (zaiClient as any).makeRequest('/chat/completions', {
    model: options.model,
    messages: options.messages,
    temperature: options.temperature,
    max_tokens: options.maxTokens,
    response_format: { type: "json_object" }
  });

  return {
    content: data.choices?.[0]?.message?.content || "{}",
    usage: { 
      inputTokens: data.usage?.prompt_tokens || 100, 
      outputTokens: data.usage?.completion_tokens || 100 
    }
  };
}

function computeCost(model: string, usage: { inputTokens: number; outputTokens: number }): number {
  // Simplified generic pricing
  return (usage.inputTokens * 0.000003) + (usage.outputTokens * 0.000015);
}

/**
 * Route a work item to the appropriate model based on its tier.
 */
async function callModel(
  tier: string,
  prompt: Record<string, any>,
): Promise<ApiCallResult> {
  const modelMap: Record<string, { model: string; provider: string }> = {
    CHEAP: { model: 'glm-4.7-flash', provider: 'zai' },
    MID: { model: 'glm-4.7-flash', provider: 'zai' },
    EXPENSIVE: { model: 'glm-4.7-flash', provider: 'zai' },
  };

  const config = modelMap[tier] ?? modelMap.MID;

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
 */
export async function executePlan(planId: string): Promise<void> {
  const plan = await prisma.masterPlan.findUniqueOrThrow({
    where: { id: planId },
  });

  if (plan.actualCostUsd >= plan.maxBudgetUsd) {
    throw new BudgetExhaustedError(plan.actualCostUsd, plan.maxBudgetUsd);
  }

  await prisma.masterPlan.update({
    where: { id: planId },
    data: { status: 'IN_PROGRESS', startedAt: new Date() },
  });

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
  await prisma.masterPlan.update({
    where: { id: planId },
    data: { currentPhase: phase },
  });

  while (true) {
    const plan = await prisma.masterPlan.findUniqueOrThrow({
      where: { id: planId },
      select: { actualCostUsd: true, maxBudgetUsd: true },
    });

    if (plan.actualCostUsd >= plan.maxBudgetUsd) {
      throw new BudgetExhaustedError(plan.actualCostUsd, plan.maxBudgetUsd);
    }

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

    if (!item) break; 

    await processWorkItem(item);
  }

  const blockedCount = await prisma.workItem.count({
    where: { planId, phase, status: 'BLOCKED' },
  });

  if (blockedCount > 0) {
    console.warn(`Phase ${phase}: ${blockedCount} items still BLOCKED`);
  }
}

function exponentialBackoff(attempt: number): number {
  return Math.pow(2, attempt) * 1000; 
}

function validateParsedData(entityType: string, data: any): { valid: boolean; notes?: string } {
  // Simple validation based on expected fields
  if (!data) return { valid: false, notes: 'Data is null' };
  
  if (entityType === 'topic_node' && !data.nodes) return { valid: false, notes: 'Missing nodes array' };
  if (entityType === 'completeness_anchor' && !data.items) return { valid: false, notes: 'Missing items array' };
  if (entityType === 'entry' && (!data.content_standard || !data.content_micro)) return { valid: false, notes: 'Missing content fields' };

  return { valid: true };
}

/**
 * Process a single work item through the full pipeline:
 *   CALL API → PARSE → VALIDATE → COMMIT → CHECKPOINT → PROPAGATE
 */
async function processWorkItem(item: WorkItem): Promise<void> {
  const planId = item.planId;

  try {
    if (item.deduplicationAction === 'FULL_REUSE') {
      await prisma.workItem.update({
        where: { id: item.id },
        data: { status: 'SKIPPED', completedAt: new Date() },
      });
      await propagateWorkItemCompletion(item.id);
      return;
    }

    const prompt = item.promptContext as Record<string, any>;
    const apiResult = await callModel(item.modelTier, prompt);
    const parseResult = parseResponse(apiResult.raw);

    if (!parseResult.success) {
      const parseErrors = [...((item.parseErrors as any[]) || []), {
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

        setTimeout(async () => {
          await prisma.workItem.update({
            where: { id: item.id },
            data: { status: 'READY', attemptCount: { increment: 1 } },
          });
        }, exponentialBackoff(item.attemptCount));
      }

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

    const validationResult = validateParsedData(item.entityType, parseResult.data);

    if (validationResult.valid) {
      await commitWorkItemData(item, parseResult.data);
    }

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

    await prisma.generationCheckpoint.create({
      data: {
        planId,
        workItemId: item.id,
        phase: item.phase,
        resultSummary: `${item.entityType}: ${item.title} — ${parseResult.strategy}`,
      },
    });

    await prisma.masterPlan.update({
      where: { id: planId },
      data: {
        actualCostUsd: { increment: apiResult.costUsd },
        totalApiCalls: { increment: 1 },
        totalTokensUsed: { increment: apiResult.inputTokens + apiResult.outputTokens },
        lastActivityAt: new Date(),
      },
    });

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

// ─── COMMIT HANDLERS ─────────────────────────────────────────────────────────

async function commitTopicNodes(item: WorkItem, data: any) {
  const plan = await prisma.masterPlan.findUniqueOrThrow({ where: { id: item.planId } });
  
  if (!data.nodes || !Array.isArray(data.nodes)) return;

  async function saveNode(node: any, parentId: string | null = null, depth = 0) {
    const created = await prisma.topicNode.create({
      data: {
        targetId: plan.targetId,
        parentId,
        nodeType: depth === 0 ? 'root' : (node.children?.length ? 'category' : 'leaf'),
        title: node.title,
        path: node.path || node.title,
        depth,
        isGenerated: false
      }
    });

    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        await saveNode(child, created.id, depth + 1);
      }
    }
  }

  for (const rootNode of data.nodes) {
    await saveNode(rootNode);
  }
}

async function commitCompletenessAnchor(item: WorkItem, data: any) {
  const plan = await prisma.masterPlan.findUniqueOrThrow({ where: { id: item.planId } });
  // The path typically stores something like "targetId/anchorType"
  const anchorType = item.path?.split('/')[1] || 'unknown';

  await prisma.completenessAnchor.create({
    data: {
      targetId: plan.targetId,
      anchorType,
      items: data.items || [],
      totalCount: data.total_count || data.items?.length || 0,
      missingItems: data.items || [], // Starts with all missing, gaps analysis fills this
      generatedBy: item.assignedModel,
    }
  });
}

async function commitEntry(item: WorkItem, data: any) {
  const plan = await prisma.masterPlan.findUniqueOrThrow({ where: { id: item.planId } });
  const entryId = `${plan.targetId}_${item.path?.replace(/\//g, '_')}`;

  const entry = await prisma.entry.upsert({
    where: {
      targetId_path: {
        targetId: plan.targetId,
        path: item.path || 'unknown'
      }
    },
    update: {
      contentMicro: data.content_micro,
      contentStandard: data.content_standard,
      contentExhaustive: data.content_exhaustive,
      syntax: data.syntax,
      parameters: data.parameters || [],
      returnValue: data.return_value,
      edgeCases: data.edge_cases || [],
      commonMistakes: data.common_mistakes || [],
      generatedBy: item.assignedModel,
      generatedAt: new Date(),
      confidence: 0.9,
    },
    create: {
      id: entryId,
      targetId: plan.targetId,
      path: item.path || 'unknown',
      entryType: 'TOPIC',
      contentMicro: data.content_micro,
      contentStandard: data.content_standard,
      contentExhaustive: data.content_exhaustive,
      syntax: data.syntax,
      parameters: data.parameters || [],
      returnValue: data.return_value,
      edgeCases: data.edge_cases || [],
      commonMistakes: data.common_mistakes || [],
      generatedBy: item.assignedModel,
      generatedAt: new Date(),
      confidence: 0.9,
    }
  });

  // Mark the corresponding TopicNode as generated
  await prisma.topicNode.updateMany({
    where: { targetId: plan.targetId, path: item.path },
    data: { isGenerated: true, entryId: entry.id }
  });

  if (data.examples && Array.isArray(data.examples)) {
    for (const ex of data.examples) {
      await prisma.example.create({
        data: {
          entryId: entry.id,
          title: ex.title || 'Example',
          code: ex.code || '',
          language: ex.language || plan.targetId,
          explanation: ex.explanation,
          expectedOutput: ex.expected_output,
          complexity: 'BASIC'
        }
      });
    }
  }
}

async function createPhase3WorkItemsFromTopicTree(planId: string) {
  const plan = await prisma.masterPlan.findUniqueOrThrow({ where: { id: planId } });
  const ungeneratedNodes = await prisma.topicNode.findMany({
    where: { targetId: plan.targetId, isGenerated: false },
    orderBy: { depth: 'asc' }
  });

  let executionOrder = 1000; // Start after Phase 1/2

  for (const node of ungeneratedNodes) {
    const existingWorkItem = await prisma.workItem.findFirst({
      where: { planId, phase: 'GENERATE_REFERENCE', path: node.path }
    });

    if (!existingWorkItem) {
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
          executionOrder: executionOrder++,
          promptContext: {
            system: `You are a technical documentation expert generating structured knowledge entries.`,
            instruction: `Generate a complete knowledge entry for: "${node.path}"\n\nReturn JSON matching this schema:\n{\n  "content_micro": "~50 token summary",\n  "content_standard": "~500 token explanation with syntax and usage",\n  "content_exhaustive": "~2000 token deep dive with internals and edge cases",\n  "syntax": "formal syntax if applicable",\n  "parameters": [{ "name": "", "type": "", "required": true, "description": "", "default": null }],\n  "return_value": "description if applicable",\n  "edge_cases": ["case1", "case2"],\n  "common_mistakes": ["mistake1", "mistake2"],\n  "examples": [\n    { "title": "", "code": "", "language": "${plan.targetId}", "explanation": "", "expected_output": "", "complexity": "BASIC" }\n  ]\n}`
          }
        }
      });
    }
  }
}

async function runGapAnalysisAndCreateFillItems(planId: string) {
  const plan = await prisma.masterPlan.findUniqueOrThrow({ where: { id: planId } });
  
  // Update phase to GAP_ANALYSIS
  await prisma.masterPlan.update({ where: { id: planId }, data: { currentPhase: 'GAP_ANALYSIS' } });
  
  // Fetch anchors and current entries
  const anchors = await prisma.completenessAnchor.findMany({ where: { targetId: plan.targetId } });
  const entries = await prisma.entry.findMany({ where: { targetId: plan.targetId }, select: { path: true } });
  const entryPaths = new Set(entries.map(e => e.path.toLowerCase()));

  let executionOrder = 2000;

  for (const anchor of anchors) {
    const items = anchor.items as string[];
    const missing: string[] = [];
    
    for (const item of items) {
      // Very basic gap check
      if (!Array.from(entryPaths).some(p => p.includes(item.toLowerCase()))) {
        missing.push(item);
      }
    }

    await prisma.completenessAnchor.update({
      where: { id: anchor.id },
      data: { missingItems: missing, coveredCount: items.length - missing.length }
    });

    if (missing.length > 0) {
      for (const missingItem of missing) {
        const path = `${anchor.anchorType}/${missingItem}`;
        await prisma.workItem.create({
          data: {
            planId,
            phase: 'FILL_GAPS',
            status: 'READY',
            entityType: 'entry',
            title: `Fill Gap: ${path}`,
            path,
            reason: 'GAP_DETECTED',
            deduplicationAction: 'NONE',
            modelTier: 'MID',
            executionOrder: executionOrder++,
            promptContext: {
              system: `You are a technical documentation expert.`,
              instruction: `Generate a complete knowledge entry for the missing ${anchor.anchorType}: "${missingItem}" in ${plan.targetId}. Return standard JSON schema.`
            }
          }
        });
      }
    }
  }
}

async function commitWorkItemData(
  item: WorkItem,
  data: Record<string, any>,
): Promise<void> {
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
    default:
      console.log(`No commit handler for entity type: ${item.entityType}`);
  }
}

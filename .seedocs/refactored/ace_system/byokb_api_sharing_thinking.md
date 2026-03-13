---
type: ace_system
source_file: "BYOkb Open Source API sharing system - Opus 4.6 Thinking.md"
description: "Original project documentation refactored with an intelligence layer for automated LLM accessibility."
llm_accessibility:
  - This document contains 100% of its original source material below the '--- ORIGINAL CONTENT ---' marker.
  - Recommended usage: Use this document to understand the ace_system aspects of the magB/ACE/Universal Blueprint Machine system.
---

<llm_context>
# Document Intelligence Layer
**Context:** This document is part of the refactored `.seedocs` repository, detailing the architecture, concepts, and planning for the Universal Blueprint Machine (magB) and AI Contribution Engine (ACE).
**Category:** `ace_system`
**Original File:** `BYOkb Open Source API sharing system - Opus 4.6 Thinking.md`
**AI Assistant Directives:** 
1. When querying this document, treat the original content as the definitive ground truth.
2. Use the provided schemas, code blocks, and diagrams directly for implementation and analysis.
3. This intelligence layer ensures context window efficiency by explicitly stating the document's boundaries and purpose.
</llm_context>

--- ORIGINAL CONTENT ---



# 🤖 AI Contribution Engine (ACE)

## A Future-Proof, Open-Source System for AI-Powered Collaborative Development

---

## Table of Contents

1. [Vision & Architecture Overview](#1-vision--architecture-overview)
2. [System Architecture](#2-system-architecture)
3. [Core Data Models](#3-core-data-models)
4. [Contribution Gateway](#4-contribution-gateway)
5. [AI Provider Abstraction Layer](#5-ai-provider-abstraction-layer)
6. [Task Orchestration Engine](#6-task-orchestration-engine)
7. [Token Budget Manager](#7-token-budget-manager)
8. [Work Distribution Pipeline](#8-work-distribution-pipeline)
9. [Security & Secrets Management](#9-security--secrets-management)
10. [SDK & Plugin System](#10-sdk--plugin-system)
11. [Dashboard & API](#11-dashboard--api)
12. [Deployment](#12-deployment)
13. [Future Roadmap](#13-future-roadmap)

---

## 1. Vision & Architecture Overview

### The Problem
Open-source projects need AI assistance (code generation, reviews, docs, testing), but AI API costs are centralized. Contributors want to donate *AI compute* — not just code or money.

### The Solution
**ACE** lets contributors plug in their AI API keys or accounts, set token/dollar budgets, and the system **automatically pools and allocates AI resources** to advance the project — code generation, PR reviews, documentation, test writing, bug triage, and more.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ACE - AI Contribution Engine                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Contributor A │  │ Contributor B │  │ Contributor C │   ...       │
│  │ OpenAI Key   │  │ Anthropic Key │  │ Local LLM    │              │
│  │ $50/month    │  │ $30/month     │  │ Unlimited     │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                  │                       │
│         ▼                 ▼                  ▼                       │
│  ┌─────────────────────────────────────────────────────┐            │
│  │          🔐 Secure Credential Vault                  │            │
│  │          (HashiCorp Vault / SOPS / Sealed Secrets)   │            │
│  └──────────────────────┬──────────────────────────────┘            │
│                         │                                            │
│  ┌──────────────────────▼──────────────────────────────┐            │
│  │          🔌 AI Provider Abstraction Layer            │            │
│  │   OpenAI │ Anthropic │ Google │ Mistral │ Ollama    │            │
│  │   Cohere │ HuggingFace │ AWS Bedrock │ Custom      │            │
│  └──────────────────────┬──────────────────────────────┘            │
│                         │                                            │
│  ┌──────────────────────▼──────────────────────────────┐            │
│  │          💰 Token Budget Manager                     │            │
│  │   Per-contributor limits │ Pool allocation │ Billing │            │
│  └──────────────────────┬──────────────────────────────┘            │
│                         │                                            │
│  ┌──────────────────────▼──────────────────────────────┐            │
│  │          🧠 Task Orchestration Engine                │            │
│  │   Priority Queue │ DAG Execution │ Retry Logic       │            │
│  └──────────────────────┬──────────────────────────────┘            │
│                         │                                            │
│  ┌──────────────────────▼──────────────────────────────┐            │
│  │          📋 Work Distribution Pipeline               │            │
│  │   Code Gen │ PR Review │ Docs │ Tests │ Bug Triage  │            │
│  └──────────────────────┬──────────────────────────────┘            │
│                         │                                            │
│  ┌──────────────────────▼──────────────────────────────┐            │
│  │          📊 Dashboard, API & GitHub Integration      │            │
│  └─────────────────────────────────────────────────────┘            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Design Principles

| Principle | Implementation |
|-----------|---------------|
| **Provider Agnostic** | Abstract interface; any LLM provider or local model |
| **Zero Trust Security** | Keys encrypted at rest, never logged, scoped access |
| **Fair Distribution** | Proportional allocation based on contribution budgets |
| **Auditability** | Every token spent is logged with task, result, contributor attribution |
| **Extensibility** | Plugin architecture for new providers, tasks, and integrations |
| **Resilience** | Circuit breakers, fallbacks, retry with exponential backoff |

---

## 2. System Architecture

```
ace/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── ace-worker.yml          # GitHub Actions as task runner
│       └── release.yml
├── packages/
│   ├── core/                       # Core orchestration engine
│   │   ├── src/
│   │   │   ├── engine/
│   │   │   │   ├── orchestrator.ts
│   │   │   │   ├── scheduler.ts
│   │   │   │   ├── task-graph.ts
│   │   │   │   └── executor.ts
│   │   │   ├── budget/
│   │   │   │   ├── manager.ts
│   │   │   │   ├── allocator.ts
│   │   │   │   ├── tracker.ts
│   │   │   │   └── policies.ts
│   │   │   ├── providers/
│   │   │   │   ├── base.ts
│   │   │   │   ├── registry.ts
│   │   │   │   ├── openai.ts
│   │   │   │   ├── anthropic.ts
│   │   │   │   ├── google.ts
│   │   │   │   ├── mistral.ts
│   │   │   │   ├── ollama.ts
│   │   │   │   ├── huggingface.ts
│   │   │   │   ├── bedrock.ts
│   │   │   │   └── custom.ts
│   │   │   ├── security/
│   │   │   │   ├── vault.ts
│   │   │   │   ├── encryption.ts
│   │   │   │   ├── audit.ts
│   │   │   │   └── rbac.ts
│   │   │   ├── tasks/
│   │   │   │   ├── base-task.ts
│   │   │   │   ├── code-generation.ts
│   │   │   │   ├── pr-review.ts
│   │   │   │   ├── documentation.ts
│   │   │   │   ├── test-generation.ts
│   │   │   │   ├── bug-triage.ts
│   │   │   │   ├── refactoring.ts
│   │   │   │   └── translation.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── api/                        # REST + GraphQL API
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── graphql/
│   │   │   ├── middleware/
│   │   │   └── server.ts
│   │   └── package.json
│   ├── dashboard/                  # Web dashboard (React/Next.js)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   └── package.json
│   ├── cli/                        # CLI tool
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   └── index.ts
│   │   └── package.json
│   ├── sdk/                        # SDK for plugin development
│   │   ├── src/
│   │   │   ├── plugin.ts
│   │   │   ├── provider.ts
│   │   │   └── task.ts
│   │   └── package.json
│   └── github-app/                 # GitHub App integration
│       ├── src/
│       │   ├── webhooks/
│       │   ├── commands/
│       │   └── app.ts
│       └── package.json
├── plugins/                        # Community plugins
│   ├── plugin-sentry/
│   ├── plugin-linear/
│   └── plugin-slack/
├── infra/
│   ├── docker/
│   │   ├── Dockerfile
│   │   └── docker-compose.yml
│   ├── k8s/
│   │   ├── helm/
│   │   └── manifests/
│   └── terraform/
├── docs/
├── examples/
├── turbo.json
├── package.json
└── LICENSE (Apache-2.0)
```

---

## 3. Core Data Models

```typescript
// packages/core/src/models/types.ts

// ─────────────────────────────────────────────────────
// Contributor & Credentials
// ─────────────────────────────────────────────────────

export interface Contributor {
  id: string;                          // UUID
  githubId?: string;
  email: string;
  displayName: string;
  
  // Contribution configuration
  contributions: AIContribution[];
  
  // Permissions
  role: 'owner' | 'maintainer' | 'contributor' | 'sponsor';
  
  // Stats
  totalTokensDonated: number;
  totalCostDonated: number;            // In USD
  tasksCompleted: number;
  
  joinedAt: Date;
  lastActiveAt: Date;
}

export interface AIContribution {
  id: string;
  contributorId: string;
  
  // Provider configuration
  provider: ProviderType;
  credentialRef: string;               // Reference to encrypted credential in vault
  
  // Budget controls
  budget: BudgetConfig;
  
  // Preferences
  preferences: ContributionPreferences;
  
  // Status
  status: 'active' | 'paused' | 'exhausted' | 'error';
  healthCheck: HealthStatus;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetConfig {
  // Spending limits
  maxMonthlySpendUSD: number;          // e.g., $50/month
  maxDailySpendUSD?: number;           // e.g., $5/day
  maxPerTaskSpendUSD?: number;         // e.g., $2/task
  
  // Token limits (alternative to USD)
  maxMonthlyTokens?: number;           // e.g., 1M tokens/month
  maxDailyTokens?: number;
  
  // Usage tracking
  currentMonthSpendUSD: number;
  currentMonthTokens: number;
  currentDaySpendUSD: number;
  currentDayTokens: number;
  
  // Reset schedule
  billingCycleStart: Date;
  
  // Alerts
  alertThresholds: number[];           // e.g., [0.5, 0.8, 0.95] = alert at 50%, 80%, 95%
}

export interface ContributionPreferences {
  // What tasks this contribution can be used for
  allowedTasks: TaskType[];            // e.g., ['code-generation', 'pr-review']
  
  // Model preferences
  preferredModels?: string[];          // e.g., ['gpt-4o', 'claude-3.5-sonnet']
  maxModelTier?: 'economy' | 'standard' | 'premium';  // Cost tier limit
  
  // Scheduling
  activeHours?: {                      // Only use during certain hours (cost optimization)
    timezone: string;
    windows: Array<{ start: string; end: string }>;
  };
  
  // Priority
  priorityMultiplier: number;          // 1.0 = normal, 2.0 = double priority weight
}

// ─────────────────────────────────────────────────────
// Providers
// ─────────────────────────────────────────────────────

export type ProviderType = 
  | 'openai' 
  | 'anthropic' 
  | 'google' 
  | 'mistral' 
  | 'cohere'
  | 'huggingface'
  | 'aws-bedrock'
  | 'azure-openai'
  | 'ollama'
  | 'openrouter'
  | 'together'
  | 'groq'
  | 'custom';

export interface ProviderCapability {
  provider: ProviderType;
  models: ModelInfo[];
  supportsStreaming: boolean;
  supportsFunctionCalling: boolean;
  supportsVision: boolean;
  supportsEmbeddings: boolean;
  maxContextWindow: number;
  rateLimits: RateLimitConfig;
}

export interface ModelInfo {
  id: string;                          // e.g., 'gpt-4o'
  name: string;                        // e.g., 'GPT-4o'
  tier: 'economy' | 'standard' | 'premium';
  costPer1kInputTokens: number;        // USD
  costPer1kOutputTokens: number;       // USD
  maxContextTokens: number;
  capabilities: string[];              // ['chat', 'code', 'vision', 'function-calling']
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  tokensPerMinute: number;
  requestsPerDay?: number;
  concurrentRequests: number;
}

// ─────────────────────────────────────────────────────
// Tasks
// ─────────────────────────────────────────────────────

export type TaskType = 
  | 'code-generation'
  | 'pr-review'
  | 'documentation'
  | 'test-generation'
  | 'bug-triage'
  | 'refactoring'
  | 'translation'
  | 'code-explanation'
  | 'security-audit'
  | 'dependency-update'
  | 'issue-analysis'
  | 'custom';

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low' | 'background';

export type TaskStatus = 
  | 'pending'
  | 'queued'
  | 'allocated'
  | 'running'
  | 'streaming'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'retrying';

export interface Task {
  id: string;
  projectId: string;
  
  // Task definition
  type: TaskType;
  title: string;
  description: string;
  priority: TaskPriority;
  
  // Context
  context: TaskContext;
  
  // Requirements
  requirements: TaskRequirements;
  
  // Execution
  status: TaskStatus;
  assignedContribution?: string;       // Which contribution is funding this
  assignedModel?: string;              // Which model is executing
  
  // Results
  result?: TaskResult;
  
  // Relationships
  parentTaskId?: string;               // For subtask decomposition
  childTaskIds: string[];
  dependsOn: string[];                 // Task IDs this depends on
  
  // Retry
  attemptCount: number;
  maxAttempts: number;
  lastError?: string;
  
  // Metadata
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedTokens: number;
  actualTokens?: number;
  estimatedCostUSD: number;
  actualCostUSD?: number;
  
  // Attribution
  requestedBy: string;                 // User or automation that created the task
  fundedBy?: string;                   // Contributor whose tokens were used
}

export interface TaskContext {
  // Repository context
  repository: {
    owner: string;
    name: string;
    defaultBranch: string;
    language: string;
    frameworks: string[];
  };
  
  // Relevant files
  files: Array<{
    path: string;
    content: string;
    language: string;
  }>;
  
  // Issue/PR context
  issue?: {
    number: number;
    title: string;
    body: string;
    labels: string[];
    comments: Array<{ author: string; body: string }>;
  };
  
  pullRequest?: {
    number: number;
    title: string;
    body: string;
    diff: string;
    changedFiles: string[];
  };
  
  // Project conventions
  conventions?: {
    codeStyle?: string;
    architecture?: string;
    testingStrategy?: string;
    commitMessageFormat?: string;
  };
  
  // Additional context from embeddings/RAG
  relevantDocs?: string[];
  similarIssues?: string[];
}

export interface TaskRequirements {
  // Model requirements
  minModelTier: 'economy' | 'standard' | 'premium';
  requiredCapabilities: string[];      // e.g., ['function-calling', 'code']
  minContextWindow?: number;
  
  // Execution requirements
  maxLatencyMs?: number;               // For time-sensitive tasks
  requiresStreaming?: boolean;
  
  // Quality requirements
  requiresHumanReview: boolean;
  autoMerge: boolean;                  // Can results be auto-applied?
  confidenceThreshold?: number;        // 0-1, minimum confidence to accept result
}

export interface TaskResult {
  success: boolean;
  
  // Output
  output: string;                      // Primary output (code, review, docs, etc.)
  structuredOutput?: Record<string, unknown>;
  
  // For code generation
  codeChanges?: Array<{
    filePath: string;
    operation: 'create' | 'modify' | 'delete';
    content: string;
    diff?: string;
  }>;
  
  // Metadata
  model: string;
  provider: ProviderType;
  tokensUsed: { input: number; output: number; total: number };
  costUSD: number;
  latencyMs: number;
  confidence: number;                  // 0-1
  
  // Quality
  qualityScore?: number;              // 0-1, from automated evaluation
  humanApproved?: boolean;
  
  // Reasoning trace (for debugging/transparency)
  reasoning?: string;
}

// ─────────────────────────────────────────────────────
// Audit & Telemetry
// ─────────────────────────────────────────────────────

export interface AuditEntry {
  id: string;
  timestamp: Date;
  
  // What happened
  action: string;                      // e.g., 'task.executed', 'budget.depleted'
  
  // Who
  contributorId?: string;
  taskId?: string;
  
  // Details
  provider: ProviderType;
  model: string;
  tokensUsed: number;
  costUSD: number;
  
  // Result
  success: boolean;
  error?: string;
  
  // Context
  metadata: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────
// Project Configuration
// ─────────────────────────────────────────────────────

export interface ProjectConfig {
  id: string;
  name: string;
  repository: string;                 // e.g., 'owner/repo'
  
  // Task policies
  taskPolicies: {
    defaultPriority: TaskPriority;
    maxConcurrentTasks: number;
    requireApprovalAboveUSD: number;   // Human approval for expensive tasks
    autoRetryOnFailure: boolean;
    maxRetries: number;
  };
  
  // Budget allocation strategy
  allocationStrategy: 'round-robin' | 'proportional' | 'priority-based' | 'cost-optimized';
  
  // Quality gates
  qualityGates: {
    minConfidence: number;
    requireReviewForCodeChanges: boolean;
    requireTestsForNewCode: boolean;
    maxFilesPerChange: number;
  };
  
  // Integrations
  integrations: {
    github: { appId: string; installationId: string };
    slack?: { webhookUrl: string; channel: string };
    discord?: { webhookUrl: string };
  };
  
  // Prompt templates (customizable per project)
  promptTemplates: Record<TaskType, string>;
}
```

---

## 4. Contribution Gateway

The entry point for contributors to register their AI resources.

```typescript
// packages/core/src/gateway/contribution-gateway.ts

import { EventEmitter } from 'events';
import { nanoid } from 'nanoid';
import {
  AIContribution,
  BudgetConfig,
  Contributor,
  ContributionPreferences,
  ProviderType,
  HealthStatus,
} from '../models/types';
import { SecureVault } from '../security/vault';
import { ProviderRegistry } from '../providers/registry';
import { BudgetManager } from '../budget/manager';
import { AuditLogger } from '../security/audit';

export interface RegisterContributionInput {
  contributorId: string;
  provider: ProviderType;
  
  // Credential — one of:
  credential: 
    | { type: 'api-key'; apiKey: string; organizationId?: string }
    | { type: 'oauth'; accessToken: string; refreshToken?: string }
    | { type: 'endpoint'; baseUrl: string; apiKey?: string; headers?: Record<string, string> };
  
  budget: Omit<BudgetConfig, 'currentMonthSpendUSD' | 'currentMonthTokens' | 'currentDaySpendUSD' | 'currentDayTokens' | 'billingCycleStart'>;
  preferences?: Partial<ContributionPreferences>;
}

export class ContributionGateway extends EventEmitter {
  constructor(
    private vault: SecureVault,
    private providerRegistry: ProviderRegistry,
    private budgetManager: BudgetManager,
    private auditLogger: AuditLogger,
    private contributionStore: ContributionStore,
  ) {
    super();
  }

  /**
   * Register a new AI contribution.
   * Validates the credential, stores it securely, and activates the contribution.
   */
  async registerContribution(input: RegisterContributionInput): Promise<AIContribution> {
    const contributionId = nanoid();
    
    // 1. Validate the credential works
    this.auditLogger.log({
      action: 'contribution.register.start',
      contributorId: input.contributorId,
      provider: input.provider,
    });

    const provider = this.providerRegistry.getProvider(input.provider);
    const validation = await provider.validateCredential(input.credential);
    
    if (!validation.valid) {
      this.auditLogger.log({
        action: 'contribution.register.failed',
        contributorId: input.contributorId,
        error: validation.error,
      });
      throw new ContributionError(
        `Credential validation failed: ${validation.error}`,
        'INVALID_CREDENTIAL'
      );
    }

    // 2. Store credential securely in vault
    const credentialRef = await this.vault.storeSecret(
      `contributions/${contributionId}/credential`,
      input.credential,
      {
        contributorId: input.contributorId,
        provider: input.provider,
        // Auto-rotate reminder
        rotateAfterDays: 90,
      }
    );

    // 3. Create the contribution record
    const contribution: AIContribution = {
      id: contributionId,
      contributorId: input.contributorId,
      provider: input.provider,
      credentialRef,
      budget: {
        ...input.budget,
        currentMonthSpendUSD: 0,
        currentMonthTokens: 0,
        currentDaySpendUSD: 0,
        currentDayTokens: 0,
        billingCycleStart: new Date(),
        alertThresholds: input.budget.alertThresholds ?? [0.5, 0.8, 0.95],
      },
      preferences: {
        allowedTasks: input.preferences?.allowedTasks ?? [
          'code-generation', 'pr-review', 'documentation', 
          'test-generation', 'bug-triage',
        ],
        maxModelTier: input.preferences?.maxModelTier ?? 'standard',
        priorityMultiplier: input.preferences?.priorityMultiplier ?? 1.0,
        ...input.preferences,
      },
      status: 'active',
      healthCheck: {
        lastCheck: new Date(),
        status: 'healthy',
        latencyMs: validation.latencyMs,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 4. Persist
    await this.contributionStore.save(contribution);
    
    // 5. Register with budget manager
    await this.budgetManager.registerBudget(contribution);

    // 6. Emit event
    this.emit('contribution:registered', contribution);
    
    this.auditLogger.log({
      action: 'contribution.register.success',
      contributorId: input.contributorId,
      contributionId,
      provider: input.provider,
      monthlyBudgetUSD: input.budget.maxMonthlySpendUSD,
    });

    return contribution;
  }

  /**
   * Update budget or preferences for an existing contribution.
   */
  async updateContribution(
    contributionId: string,
    updates: {
      budget?: Partial<BudgetConfig>;
      preferences?: Partial<ContributionPreferences>;
      status?: 'active' | 'paused';
    }
  ): Promise<AIContribution> {
    const contribution = await this.contributionStore.get(contributionId);
    if (!contribution) {
      throw new ContributionError('Contribution not found', 'NOT_FOUND');
    }

    if (updates.budget) {
      Object.assign(contribution.budget, updates.budget);
    }
    if (updates.preferences) {
      Object.assign(contribution.preferences, updates.preferences);
    }
    if (updates.status) {
      contribution.status = updates.status;
    }
    contribution.updatedAt = new Date();

    await this.contributionStore.save(contribution);
    await this.budgetManager.updateBudget(contribution);
    
    this.emit('contribution:updated', contribution);
    return contribution;
  }

  /**
   * Rotate credentials for a contribution.
   */
  async rotateCredential(
    contributionId: string,
    newCredential: RegisterContributionInput['credential']
  ): Promise<void> {
    const contribution = await this.contributionStore.get(contributionId);
    if (!contribution) {
      throw new ContributionError('Contribution not found', 'NOT_FOUND');
    }

    // Validate new credential
    const provider = this.providerRegistry.getProvider(contribution.provider);
    const validation = await provider.validateCredential(newCredential);
    if (!validation.valid) {
      throw new ContributionError(
        `New credential validation failed: ${validation.error}`,
        'INVALID_CREDENTIAL'
      );
    }

    // Revoke old, store new
    await this.vault.rotateSecret(contribution.credentialRef, newCredential);
    
    contribution.healthCheck = {
      lastCheck: new Date(),
      status: 'healthy',
      latencyMs: validation.latencyMs,
    };
    contribution.updatedAt = new Date();
    
    await this.contributionStore.save(contribution);
    
    this.auditLogger.log({
      action: 'contribution.credential.rotated',
      contributionId,
      contributorId: contribution.contributorId,
    });
  }

  /**
   * Health check all active contributions.
   */
  async healthCheckAll(): Promise<Map<string, HealthStatus>> {
    const contributions = await this.contributionStore.getActive();
    const results = new Map<string, HealthStatus>();

    await Promise.allSettled(
      contributions.map(async (contribution) => {
        try {
          const provider = this.providerRegistry.getProvider(contribution.provider);
          const credential = await this.vault.getSecret(contribution.credentialRef);
          const health = await provider.healthCheck(credential);
          
          contribution.healthCheck = {
            lastCheck: new Date(),
            status: health.ok ? 'healthy' : 'degraded',
            latencyMs: health.latencyMs,
            error: health.error,
          };

          if (!health.ok) {
            contribution.status = 'error';
            this.emit('contribution:unhealthy', contribution);
          }

          results.set(contribution.id, contribution.healthCheck);
          await this.contributionStore.save(contribution);
        } catch (error) {
          const healthStatus: HealthStatus = {
            lastCheck: new Date(),
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
          contribution.healthCheck = healthStatus;
          contribution.status = 'error';
          results.set(contribution.id, healthStatus);
          await this.contributionStore.save(contribution);
        }
      })
    );

    return results;
  }

  /**
   * Get all contributions available for a specific task type and model tier.
   */
  async getAvailableContributions(
    taskType: string,
    modelTier: 'economy' | 'standard' | 'premium',
    estimatedCostUSD: number
  ): Promise<AIContribution[]> {
    const active = await this.contributionStore.getActive();
    
    return active.filter(contribution => {
      // Check task type is allowed
      if (!contribution.preferences.allowedTasks.includes(taskType as any)) {
        return false;
      }
      
      // Check model tier is within budget
      const tierOrder = { economy: 1, standard: 2, premium: 3 };
      if (tierOrder[modelTier] > tierOrder[contribution.preferences.maxModelTier ?? 'standard']) {
        return false;
      }
      
      // Check budget has room
      if (!this.budgetManager.canAfford(contribution.id, estimatedCostUSD)) {
        return false;
      }
      
      // Check health
      if (contribution.healthCheck.status === 'unhealthy') {
        return false;
      }
      
      // Check active hours
      if (contribution.preferences.activeHours) {
        if (!this.isWithinActiveHours(contribution.preferences.activeHours)) {
          return false;
        }
      }
      
      return true;
    });
  }

  private isWithinActiveHours(config: ContributionPreferences['activeHours']): boolean {
    if (!config) return true;
    
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: config.timezone,
    });
    const currentTime = formatter.format(now);
    
    return config.windows.some(
      window => currentTime >= window.start && currentTime <= window.end
    );
  }
}

export class ContributionError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ContributionError';
  }
}

// Store interface (implement with your preferred DB)
export interface ContributionStore {
  save(contribution: AIContribution): Promise<void>;
  get(id: string): Promise<AIContribution | null>;
  getByContributor(contributorId: string): Promise<AIContribution[]>;
  getActive(): Promise<AIContribution[]>;
  delete(id: string): Promise<void>;
}
```

---

## 5. AI Provider Abstraction Layer

```typescript
// packages/core/src/providers/base.ts

export interface AIProviderConfig {
  credential: any;
  baseUrl?: string;
  timeout?: number;
  retryConfig?: {
    maxRetries: number;
    baseDelayMs: number;
    maxDelayMs: number;
  };
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
  functionCall?: {
    name: string;
    arguments: string;
  };
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stop?: string[];
  stream?: boolean;
  functions?: FunctionDefinition[];
  responseFormat?: { type: 'text' | 'json_object' };
}

export interface ChatCompletionResponse {
  id: string;
  content: string;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  finishReason: 'stop' | 'length' | 'function_call' | 'content_filter';
  functionCall?: {
    name: string;
    arguments: string;
  };
  latencyMs: number;
}

export interface StreamChunk {
  content: string;
  done: boolean;
  usage?: ChatCompletionResponse['usage'];
}

export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;  // JSON Schema
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  latencyMs: number;
  accountInfo?: {
    organization?: string;
    tier?: string;
    remainingCredits?: number;
  };
}

export interface HealthCheckResult {
  ok: boolean;
  latencyMs: number;
  error?: string;
}

/**
 * Abstract base class for all AI providers.
 * Implement this to add a new provider.
 */
export abstract class BaseAIProvider {
  abstract readonly providerType: ProviderType;
  abstract readonly displayName: string;

  protected config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  // ── Core Methods ─────────────────────────────────────
  
  abstract chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  
  abstract chatStream(
    request: ChatCompletionRequest
  ): AsyncIterable<StreamChunk>;

  abstract validateCredential(credential: any): Promise<ValidationResult>;
  
  abstract healthCheck(credential: any): Promise<HealthCheckResult>;
  
  // ── Model Information ────────────────────────────────
  
  abstract listModels(): Promise<ModelInfo[]>;
  
  abstract getModelInfo(modelId: string): Promise<ModelInfo | null>;
  
  // ── Token Estimation ─────────────────────────────────
  
  abstract estimateTokens(text: string, model: string): Promise<number>;
  
  abstract estimateCost(
    inputTokens: number,
    outputTokens: number,
    model: string
  ): number;

  // ── Utility ──────────────────────────────────────────
  
  /**
   * Retry with exponential backoff
   */
  protected async withRetry<T>(
    fn: () => Promise<T>,
    context: string
  ): Promise<T> {
    const { maxRetries = 3, baseDelayMs = 1000, maxDelayMs = 30000 } = 
      this.config.retryConfig ?? {};
    
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on authentication errors or invalid requests
        if (this.isNonRetryableError(error)) {
          throw error;
        }
        
        if (attempt < maxRetries) {
          const delay = Math.min(
            baseDelayMs * Math.pow(2, attempt) + Math.random() * 1000,
            maxDelayMs
          );
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError;
  }

  protected abstract isNonRetryableError(error: unknown): boolean;
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### OpenAI Provider Implementation

```typescript
// packages/core/src/providers/openai.ts

import OpenAI from 'openai';
import { BaseAIProvider, ChatCompletionRequest, ChatCompletionResponse, StreamChunk, ValidationResult } from './base';
import { encoding_for_model } from 'tiktoken';

export class OpenAIProvider extends BaseAIProvider {
  readonly providerType = 'openai' as const;
  readonly displayName = 'OpenAI';
  
  private client: OpenAI;

  private static PRICING: Record<string, { input: number; output: number }> = {
    'gpt-4o':           { input: 0.0025,  output: 0.01 },
    'gpt-4o-mini':      { input: 0.00015, output: 0.0006 },
    'gpt-4-turbo':      { input: 0.01,    output: 0.03 },
    'o1':               { input: 0.015,   output: 0.06 },
    'o1-mini':          { input: 0.003,   output: 0.012 },
    'o3-mini':          { input: 0.0011,  output: 0.0044 },
  };

  constructor(config: AIProviderConfig) {
    super(config);
    this.client = new OpenAI({
      apiKey: config.credential.apiKey,
      organization: config.credential.organizationId,
      timeout: config.timeout ?? 120_000,
      maxRetries: 0, // We handle retries ourselves
    });
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    return this.withRetry(async () => {
      const start = Date.now();
      
      const response = await this.client.chat.completions.create({
        model: request.model,
        messages: request.messages.map(m => ({
          role: m.role as any,
          content: m.content,
          name: m.name,
        })),
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        top_p: request.topP,
        stop: request.stop,
        response_format: request.responseFormat,
        tools: request.functions?.map(f => ({
          type: 'function' as const,
          function: {
            name: f.name,
            description: f.description,
            parameters: f.parameters,
          },
        })),
      });

      const latencyMs = Date.now() - start;
      const choice = response.choices[0];

      return {
        id: response.id,
        content: choice.message.content ?? '',
        model: response.model,
        usage: {
          inputTokens: response.usage?.prompt_tokens ?? 0,
          outputTokens: response.usage?.completion_tokens ?? 0,
          totalTokens: response.usage?.total_tokens ?? 0,
        },
        finishReason: this.mapFinishReason(choice.finish_reason),
        functionCall: choice.message.tool_calls?.[0]
          ? {
              name: choice.message.tool_calls[0].function.name,
              arguments: choice.message.tool_calls[0].function.arguments,
            }
          : undefined,
        latencyMs,
      };
    }, 'openai.chat');
  }

  async *chatStream(request: ChatCompletionRequest): AsyncIterable<StreamChunk> {
    const stream = await this.client.chat.completions.create({
      model: request.model,
      messages: request.messages.map(m => ({
        role: m.role as any,
        content: m.content,
      })),
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      stream: true,
      stream_options: { include_usage: true },
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content ?? '';
      const done = chunk.choices[0]?.finish_reason != null;
      
      yield {
        content,
        done,
        usage: chunk.usage ? {
          inputTokens: chunk.usage.prompt_tokens,
          outputTokens: chunk.usage.completion_tokens,
          totalTokens: chunk.usage.total_tokens,
        } : undefined,
      };
    }
  }

  async validateCredential(credential: any): Promise<ValidationResult> {
    try {
      const start = Date.now();
      const client = new OpenAI({ 
        apiKey: credential.apiKey,
        organization: credential.organizationId,
      });
      
      // Minimal API call to verify
      const models = await client.models.list();
      const latencyMs = Date.now() - start;
      
      return {
        valid: true,
        latencyMs,
        accountInfo: {
          organization: credential.organizationId,
        },
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message ?? 'Credential validation failed',
        latencyMs: 0,
      };
    }
  }

  async healthCheck(credential: any): Promise<HealthCheckResult> {
    const result = await this.validateCredential(credential);
    return {
      ok: result.valid,
      latencyMs: result.latencyMs,
      error: result.error,
    };
  }

  async listModels(): Promise<ModelInfo[]> {
    const models = await this.client.models.list();
    return models.data
      .filter(m => m.id.startsWith('gpt-') || m.id.startsWith('o1') || m.id.startsWith('o3'))
      .map(m => this.toModelInfo(m.id));
  }

  async getModelInfo(modelId: string): Promise<ModelInfo | null> {
    try {
      await this.client.models.retrieve(modelId);
      return this.toModelInfo(modelId);
    } catch {
      return null;
    }
  }

  async estimateTokens(text: string, model: string): Promise<number> {
    try {
      const enc = encoding_for_model(model as any);
      const tokens = enc.encode(text);
      enc.free();
      return tokens.length;
    } catch {
      // Fallback: rough estimation
      return Math.ceil(text.length / 4);
    }
  }

  estimateCost(inputTokens: number, outputTokens: number, model: string): number {
    const pricing = OpenAIProvider.PRICING[model] ?? OpenAIProvider.PRICING['gpt-4o-mini'];
    return (
      (inputTokens / 1000) * pricing.input +
      (outputTokens / 1000) * pricing.output
    );
  }

  protected isNonRetryableError(error: unknown): boolean {
    if (error instanceof OpenAI.AuthenticationError) return true;
    if (error instanceof OpenAI.BadRequestError) return true;
    if (error instanceof OpenAI.PermissionDeniedError) return true;
    return false;
  }

  private toModelInfo(modelId: string): ModelInfo {
    const pricing = OpenAIProvider.PRICING[modelId];
    const tier = modelId.includes('mini') ? 'economy' 
      : modelId.startsWith('o1') || modelId.startsWith('o3') ? 'premium'
      : 'standard';
    
    return {
      id: modelId,
      name: modelId.toUpperCase(),
      tier,
      costPer1kInputTokens: pricing?.input ?? 0.01,
      costPer1kOutputTokens: pricing?.output ?? 0.03,
      maxContextTokens: this.getContextWindow(modelId),
      capabilities: this.getCapabilities(modelId),
    };
  }

  private getContextWindow(model: string): number {
    if (model.includes('gpt-4o')) return 128000;
    if (model.includes('gpt-4-turbo')) return 128000;
    if (model.startsWith('o1') || model.startsWith('o3')) return 200000;
    return 128000;
  }

  private getCapabilities(model: string): string[] {
    const base = ['chat', 'code'];
    if (model.includes('gpt-4o') || model.includes('gpt-4-turbo')) {
      base.push('function-calling', 'json-mode');
    }
    if (model === 'gpt-4o') {
      base.push('vision');
    }
    return base;
  }

  private mapFinishReason(reason: string | null): ChatCompletionResponse['finishReason'] {
    switch (reason) {
      case 'stop': return 'stop';
      case 'length': return 'length';
      case 'tool_calls': return 'function_call';
      case 'content_filter': return 'content_filter';
      default: return 'stop';
    }
  }
}
```

### Anthropic Provider Implementation

```typescript
// packages/core/src/providers/anthropic.ts

import Anthropic from '@anthropic-ai/sdk';
import { BaseAIProvider, ChatCompletionRequest, ChatCompletionResponse, StreamChunk, ValidationResult } from './base';

export class AnthropicProvider extends BaseAIProvider {
  readonly providerType = 'anthropic' as const;
  readonly displayName = 'Anthropic';
  
  private client: Anthropic;

  private static PRICING: Record<string, { input: number; output: number }> = {
    'claude-sonnet-4-20250514':     { input: 0.003,  output: 0.015 },
    'claude-3-5-sonnet-20241022': { input: 0.003,  output: 0.015 },
    'claude-3-5-haiku-20241022':  { input: 0.0008, output: 0.004 },
    'claude-3-opus-20240229':     { input: 0.015,  output: 0.075 },
  };

  constructor(config: AIProviderConfig) {
    super(config);
    this.client = new Anthropic({
      apiKey: config.credential.apiKey,
      timeout: config.timeout ?? 120_000,
      maxRetries: 0,
    });
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    return this.withRetry(async () => {
      const start = Date.now();
      
      // Separate system message (Anthropic uses top-level system param)
      const systemMessage = request.messages.find(m => m.role === 'system')?.content;
      const messages = request.messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      const response = await this.client.messages.create({
        model: request.model,
        system: systemMessage,
        messages,
        max_tokens: request.maxTokens ?? 4096,
        temperature: request.temperature,
        top_p: request.topP,
        stop_sequences: request.stop,
        tools: request.functions?.map(f => ({
          name: f.name,
          description: f.description,
          input_schema: f.parameters as Anthropic.Tool.InputSchema,
        })),
      });

      const latencyMs = Date.now() - start;
      const textContent = response.content.find(c => c.type === 'text');
      const toolUse = response.content.find(c => c.type === 'tool_use');

      return {
        id: response.id,
        content: textContent?.text ?? '',
        model: response.model,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        finishReason: response.stop_reason === 'end_turn' ? 'stop' : 
                      response.stop_reason === 'max_tokens' ? 'length' :
                      response.stop_reason === 'tool_use' ? 'function_call' : 'stop',
        functionCall: toolUse && toolUse.type === 'tool_use' ? {
          name: toolUse.name,
          arguments: JSON.stringify(toolUse.input),
        } : undefined,
        latencyMs,
      };
    }, 'anthropic.chat');
  }

  async *chatStream(request: ChatCompletionRequest): AsyncIterable<StreamChunk> {
    const systemMessage = request.messages.find(m => m.role === 'system')?.content;
    const messages = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const stream = this.client.messages.stream({
      model: request.model,
      system: systemMessage,
      messages,
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield { content: event.delta.text, done: false };
      }
      if (event.type === 'message_stop') {
        const finalMessage = await stream.finalMessage();
        yield {
          content: '',
          done: true,
          usage: {
            inputTokens: finalMessage.usage.input_tokens,
            outputTokens: finalMessage.usage.output_tokens,
            totalTokens: finalMessage.usage.input_tokens + finalMessage.usage.output_tokens,
          },
        };
      }
    }
  }

  async validateCredential(credential: any): Promise<ValidationResult> {
    try {
      const start = Date.now();
      const client = new Anthropic({ apiKey: credential.apiKey });
      
      // Minimal API call
      await client.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'hi' }],
      });
      
      return { valid: true, latencyMs: Date.now() - start };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message,
        latencyMs: 0,
      };
    }
  }

  async healthCheck(credential: any): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const result = await this.validateCredential(credential);
    return { ok: result.valid, latencyMs: result.latencyMs, error: result.error };
  }

  async listModels(): Promise<ModelInfo[]> {
    return Object.entries(AnthropicProvider.PRICING).map(([id, pricing]) => ({
      id,
      name: id.replace(/-\d+$/, '').replace(/-/g, ' '),
      tier: id.includes('haiku') ? 'economy' as const : 
            id.includes('opus') ? 'premium' as const : 'standard' as const,
      costPer1kInputTokens: pricing.input,
      costPer1kOutputTokens: pricing.output,
      maxContextTokens: 200000,
      capabilities: ['chat', 'code', 'vision', 'function-calling'],
    }));
  }

  async getModelInfo(modelId: string): Promise<ModelInfo | null> {
    const models = await this.listModels();
    return models.find(m => m.id === modelId) ?? null;
  }

  async estimateTokens(text: string, _model: string): Promise<number> {
    // Anthropic's tokenizer is roughly similar to cl100k_base
    return Math.ceil(text.length / 4);
  }

  estimateCost(inputTokens: number, outputTokens: number, model: string): number {
    const pricing = AnthropicProvider.PRICING[model] ?? 
                    AnthropicProvider.PRICING['claude-3-5-sonnet-20241022'];
    return (
      (inputTokens / 1000) * pricing.input +
      (outputTokens / 1000) * pricing.output
    );
  }

  protected isNonRetryableError(error: unknown): boolean {
    if (error instanceof Anthropic.AuthenticationError) return true;
    if (error instanceof Anthropic.BadRequestError) return true;
    if (error instanceof Anthropic.PermissionDeniedError) return true;
    return false;
  }
}
```

### Provider Registry

```typescript
// packages/core/src/providers/registry.ts

import { BaseAIProvider, AIProviderConfig } from './base';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { ProviderType, ProviderCapability } from '../models/types';

type ProviderFactory = (config: AIProviderConfig) => BaseAIProvider;

/**
 * Registry for all available AI providers.
 * Supports dynamic registration for plugin-based providers.
 */
export class ProviderRegistry {
  private factories = new Map<ProviderType, ProviderFactory>();
  private instances = new Map<string, BaseAIProvider>(); // keyed by contributionId

  constructor() {
    // Register built-in providers
    this.registerFactory('openai', (cfg) => new OpenAIProvider(cfg));
    this.registerFactory('anthropic', (cfg) => new AnthropicProvider(cfg));
    // ... other built-in providers
  }

  /**
   * Register a new provider factory.
   * Used by plugins to add custom provider support.
   */
  registerFactory(type: ProviderType, factory: ProviderFactory): void {
    this.factories.set(type, factory);
  }

  /**
   * Get or create a provider instance for a specific contribution.
   */
  getOrCreateInstance(
    contributionId: string, 
    type: ProviderType, 
    config: AIProviderConfig
  ): BaseAIProvider {
    const key = `${contributionId}:${type}`;
    
    if (!this.instances.has(key)) {
      const factory = this.factories.get(type);
      if (!factory) {
        throw new Error(`No provider factory registered for type: ${type}`);
      }
      this.instances.set(key, factory(config));
    }
    
    return this.instances.get(key)!;
  }

  /**
   * Get a provider factory for credential validation (before instance creation).
   */
  getProvider(type: ProviderType): BaseAIProvider {
    const factory = this.factories.get(type);
    if (!factory) {
      throw new Error(`No provider factory registered for type: ${type}`);
    }
    // Create a temporary instance for validation
    return factory({ credential: {} });
  }

  /**
   * List all registered provider types.
   */
  getRegisteredTypes(): ProviderType[] {
    return Array.from(this.factories.keys());
  }

  /**
   * Remove cached instance (e.g., on credential rotation).
   */
  invalidateInstance(contributionId: string): void {
    for (const key of this.instances.keys()) {
      if (key.startsWith(`${contributionId}:`)) {
        this.instances.delete(key);
      }
    }
  }
}
```

---

## 6. Task Orchestration Engine

```typescript
// packages/core/src/engine/orchestrator.ts

import { EventEmitter } from 'events';
import { Task, TaskStatus, TaskType, TaskPriority, TaskResult, ProjectConfig } from '../models/types';
import { BudgetManager } from '../budget/manager';
import { ContributionGateway } from '../gateway/contribution-gateway';
import { ProviderRegistry } from '../providers/registry';
import { SecureVault } from '../security/vault';
import { TaskScheduler } from './scheduler';
import { TaskExecutor } from './executor';
import { TaskDecomposer } from './task-decomposer';
import { AuditLogger } from '../security/audit';

export class Orchestrator extends EventEmitter {
  private scheduler: TaskScheduler;
  private executor: TaskExecutor;
  private decomposer: TaskDecomposer;
  private running = false;
  private processingLoop: NodeJS.Timeout | null = null;

  constructor(
    private config: ProjectConfig,
    private contributionGateway: ContributionGateway,
    private budgetManager: BudgetManager,
    private providerRegistry: ProviderRegistry,
    private vault: SecureVault,
    private auditLogger: AuditLogger,
    private taskStore: TaskStore,
  ) {
    super();
    this.scheduler = new TaskScheduler(config.taskPolicies);
    this.executor = new TaskExecutor(providerRegistry, vault, auditLogger);
    this.decomposer = new TaskDecomposer();
  }

  /**
   * Submit a new task to the orchestration engine.
   */
  async submitTask(task: Omit<Task, 'id' | 'status' | 'attemptCount' | 'childTaskIds' | 'createdAt'>): Promise<Task> {
    const fullTask: Task = {
      ...task,
      id: nanoid(),
      status: 'pending',
      attemptCount: 0,
      childTaskIds: [],
      createdAt: new Date(),
      maxAttempts: task.maxAttempts ?? this.config.taskPolicies.maxRetries + 1,
    };

    // Estimate cost
    const estimation = await this.estimateTaskCost(fullTask);
    fullTask.estimatedTokens = estimation.tokens;
    fullTask.estimatedCostUSD = estimation.costUSD;

    // Check if task needs human approval (for expensive tasks)
    if (fullTask.estimatedCostUSD > this.config.taskPolicies.requireApprovalAboveUSD) {
      fullTask.status = 'pending';
      fullTask.requirements.requiresHumanReview = true;
      this.emit('task:approval-required', fullTask);
    } else {
      fullTask.status = 'queued';
    }

    // Decompose complex tasks into subtasks
    const subtasks = await this.decomposer.decompose(fullTask);
    if (subtasks.length > 1) {
      for (const subtask of subtasks) {
        subtask.parentTaskId = fullTask.id;
        await this.taskStore.save(subtask);
        fullTask.childTaskIds.push(subtask.id);
      }
    }

    await this.taskStore.save(fullTask);
    this.scheduler.enqueue(fullTask);

    this.emit('task:submitted', fullTask);
    this.auditLogger.log({
      action: 'task.submitted',
      taskId: fullTask.id,
      taskType: fullTask.type,
      estimatedCostUSD: fullTask.estimatedCostUSD,
    });

    return fullTask;
  }

  /**
   * Start the orchestration loop.
   */
  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    
    console.log('🚀 ACE Orchestrator started');
    this.emit('orchestrator:started');

    // Process loop
    this.processingLoop = setInterval(() => this.processNext(), 2000);
    
    // Health check loop
    setInterval(() => this.contributionGateway.healthCheckAll(), 5 * 60 * 1000);
    
    // Budget reset loop
    setInterval(() => this.budgetManager.resetDailyBudgets(), 60 * 1000);
  }

  /**
   * Process the next task in the queue.
   */
  private async processNext(): Promise<void> {
    if (!this.running) return;

    const concurrentTasks = await this.taskStore.countByStatus('running');
    if (concurrentTasks >= this.config.taskPolicies.maxConcurrentTasks) {
      return; // At capacity
    }

    const task = this.scheduler.dequeue();
    if (!task) return;

    try {
      // 1. Find the best contribution to fund this task
      const allocation = await this.allocateContribution(task);
      if (!allocation) {
        // No contributions available - requeue with delay
        this.scheduler.enqueue(task, { delayMs: 30000 });
        this.emit('task:no-budget', task);
        return;
      }

      // 2. Select the optimal model
      const model = await this.selectModel(task, allocation);

      // 3. Update task status
      task.status = 'running';
      task.assignedContribution = allocation.contribution.id;
      task.assignedModel = model.id;
      task.startedAt = new Date();
      task.attemptCount++;
      await this.taskStore.save(task);
      
      this.emit('task:started', task);

      // 4. Execute the task
      const result = await this.executor.execute(task, allocation, model);

      // 5. Record result and update budget
      task.result = result;
      task.status = result.success ? 'completed' : 'failed';
      task.completedAt = new Date();
      task.actualTokens = result.tokensUsed.total;
      task.actualCostUSD = result.costUSD;

      await this.budgetManager.recordSpend(
        allocation.contribution.id,
        result.costUSD,
        result.tokensUsed.total
      );
      
      await this.taskStore.save(task);

      this.auditLogger.log({
        action: 'task.completed',
        taskId: task.id,
        contributionId: allocation.contribution.id,
        contributorId: allocation.contribution.contributorId,
        provider: allocation.contribution.provider,
        model: model.id,
        tokensUsed: result.tokensUsed.total,
        costUSD: result.costUSD,
        success: result.success,
      });

      this.emit('task:completed', task);

      // 6. Handle quality gates
      if (result.success && this.config.qualityGates.requireReviewForCodeChanges && result.codeChanges?.length) {
        this.emit('task:review-required', task);
      }

    } catch (error) {
      task.status = 'failed';
      task.lastError = error instanceof Error ? error.message : 'Unknown error';
      
      if (task.attemptCount < task.maxAttempts && this.config.taskPolicies.autoRetryOnFailure) {
        task.status = 'retrying';
        this.scheduler.enqueue(task, { 
          delayMs: Math.pow(2, task.attemptCount) * 5000 
        });
      }
      
      await this.taskStore.save(task);
      this.emit('task:failed', task, error);
    }
  }

  /**
   * Allocate a contribution to fund a task based on the project's allocation strategy.
   */
  private async allocateContribution(task: Task): Promise<ContributionAllocation | null> {
    const available = await this.contributionGateway.getAvailableContributions(
      task.type,
      task.requirements.minModelTier,
      task.estimatedCostUSD
    );

    if (available.length === 0) return null;

    switch (this.config.allocationStrategy) {
      case 'round-robin':
        return this.roundRobinAllocation(available, task);
      
      case 'proportional':
        return this.proportionalAllocation(available, task);
      
      case 'cost-optimized':
        return this.costOptimizedAllocation(available, task);
      
      case 'priority-based':
        return this.priorityBasedAllocation(available, task);
      
      default:
        return { contribution: available[0] };
    }
  }

  /**
   * Round-robin: distribute tasks evenly across contributions.
   */
  private async roundRobinAllocation(
    available: AIContribution[], 
    _task: Task
  ): Promise<ContributionAllocation> {
    // Sort by least recently used
    const sorted = available.sort((a, b) => {
      const aLastUsed = this.lastUsedMap.get(a.id) ?? 0;
      const bLastUsed = this.lastUsedMap.get(b.id) ?? 0;
      return aLastUsed - bLastUsed;
    });
    
    const selected = sorted[0];
    this.lastUsedMap.set(selected.id, Date.now());
    return { contribution: selected };
  }
  private lastUsedMap = new Map<string, number>();

  /**
   * Proportional: allocate based on budget size (bigger budget = more tasks).
   */
  private async proportionalAllocation(
    available: AIContribution[],
    _task: Task
  ): Promise<ContributionAllocation> {
    const totalBudget = available.reduce(
      (sum, c) => sum + c.budget.maxMonthlySpendUSD, 0
    );
    
    // Weighted random selection
    const rand = Math.random() * totalBudget;
    let cumulative = 0;
    
    for (const contribution of available) {
      cumulative += contribution.budget.maxMonthlySpendUSD * 
        contribution.preferences.priorityMultiplier;
      if (rand <= cumulative) {
        return { contribution };
      }
    }
    
    return { contribution: available[available.length - 1] };
  }

  /**
   * Cost-optimized: use the cheapest provider that meets requirements.
   */
  private async costOptimizedAllocation(
    available: AIContribution[],
    task: Task
  ): Promise<ContributionAllocation> {
    // Sort by cost efficiency
    const withCosts = await Promise.all(
      available.map(async (contribution) => {
        const provider = this.providerRegistry.getProvider(contribution.provider);
        const models = await provider.listModels();
        const cheapestModel = models
          .filter(m => this.meetsRequirements(m, task.requirements))
          .sort((a, b) => a.costPer1kInputTokens - b.costPer1kInputTokens)[0];
        
        return { contribution, cheapestModel, cost: cheapestModel?.costPer1kInputTokens ?? Infinity };
      })
    );

    const best = withCosts.sort((a, b) => a.cost - b.cost)[0];
    return { 
      contribution: best.contribution,
      preferredModel: best.cheapestModel?.id,
    };
  }

  /**
   * Priority-based: use highest-priority contributions first.
   */
  private async priorityBasedAllocation(
    available: AIContribution[],
    _task: Task
  ): Promise<ContributionAllocation> {
    const sorted = available.sort(
      (a, b) => b.preferences.priorityMultiplier - a.preferences.priorityMultiplier
    );
    return { contribution: sorted[0] };
  }

  /**
   * Select the optimal model for a task.
   */
  private async selectModel(
    task: Task, 
    allocation: ContributionAllocation
  ): Promise<ModelInfo> {
    const provider = this.providerRegistry.getProvider(allocation.contribution.provider);
    const models = await provider.listModels();
    
    // Filter by requirements
    const eligible = models.filter(m => this.meetsRequirements(m, task.requirements));
    
    if (eligible.length === 0) {
      throw new Error(`No eligible models found for task ${task.id}`);
    }

    // Prefer contributor's preferred models
    const preferred = allocation.contribution.preferences.preferredModels;
    if (preferred?.length) {
      const preferredModel = eligible.find(m => preferred.includes(m.id));
      if (preferredModel) return preferredModel;
    }

    // Use allocation hint
    if (allocation.preferredModel) {
      const hinted = eligible.find(m => m.id === allocation.preferredModel);
      if (hinted) return hinted;
    }

    // Default: best cost/capability ratio for the task
    return this.rankModelsForTask(eligible, task)[0];
  }

  private meetsRequirements(model: ModelInfo, req: TaskRequirements): boolean {
    const tierOrder = { economy: 1, standard: 2, premium: 3 };
    if (tierOrder[model.tier] < tierOrder[req.minModelTier]) return false;
    
    for (const cap of req.requiredCapabilities) {
      if (!model.capabilities.includes(cap)) return false;
    }
    
    if (req.minContextWindow && model.maxContextTokens < req.minContextWindow) {
      return false;
    }
    
    return true;
  }

  private rankModelsForTask(models: ModelInfo[], task: Task): ModelInfo[] {
    // Scoring: balance cost vs capability
    return models.sort((a, b) => {
      // For complex tasks, prefer more capable models
      const complexityWeight = task.priority === 'critical' ? 0.3 : 0.7;
      
      const aCostScore = 1 / (a.costPer1kInputTokens + a.costPer1kOutputTokens);
      const bCostScore = 1 / (b.costPer1kInputTokens + b.costPer1kOutputTokens);
      
      const aCapScore = a.capabilities.length + (a.maxContextTokens / 100000);
      const bCapScore = b.capabilities.length + (b.maxContextTokens / 100000);
      
      const aScore = aCostScore * complexityWeight + aCapScore * (1 - complexityWeight);
      const bScore = bCostScore * complexityWeight + bCapScore * (1 - complexityWeight);
      
      return bScore - aScore;
    });
  }

  private async estimateTaskCost(task: Task): Promise<{ tokens: number; costUSD: number }> {
    // Rough estimation based on task type
    const tokenEstimates: Record<TaskType, { input: number; output: number }> = {
      'code-generation':   { input: 4000,  output: 2000 },
      'pr-review':         { input: 8000,  output: 1500 },
      'documentation':     { input: 3000,  output: 3000 },
      'test-generation':   { input: 5000,  output: 3000 },
      'bug-triage':        { input: 3000,  output: 1000 },
      'refactoring':       { input: 6000,  output: 4000 },
      'translation':       { input: 2000,  output: 2000 },
      'code-explanation':  { input: 3000,  output: 2000 },
      'security-audit':    { input: 8000,  output: 3000 },
      'dependency-update': { input: 2000,  output: 1000 },
      'issue-analysis':    { input: 3000,  output: 1500 },
      'custom':            { input: 4000,  output: 2000 },
    };

    const estimate = tokenEstimates[task.type] ?? tokenEstimates['custom'];
    
    // Adjust by context size
    const contextTokens = task.context.files.reduce(
      (sum, f) => sum + Math.ceil(f.content.length / 4), 0
    );
    
    const inputTokens = estimate.input + contextTokens;
    const outputTokens = estimate.output;
    
    // Use mid-tier pricing for estimation
    const costUSD = (inputTokens / 1000) * 0.003 + (outputTokens / 1000) * 0.015;

    return {
      tokens: inputTokens + outputTokens,
      costUSD,
    };
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.processingLoop) {
      clearInterval(this.processingLoop);
    }
    this.emit('orchestrator:stopped');
  }
}

interface ContributionAllocation {
  contribution: AIContribution;
  preferredModel?: string;
}

export interface TaskStore {
  save(task: Task): Promise<void>;
  get(id: string): Promise<Task | null>;
  getByStatus(status: TaskStatus): Promise<Task[]>;
  countByStatus(status: TaskStatus): Promise<number>;
  getByProject(projectId: string): Promise<Task[]>;
}
```

---

## 7. Token Budget Manager

```typescript
// packages/core/src/budget/manager.ts

import { EventEmitter } from 'events';
import { AIContribution, BudgetConfig } from '../models/types';
import { AuditLogger } from '../security/audit';

interface BudgetState {
  contributionId: string;
  config: BudgetConfig;
  
  // Tracked usage
  monthlySpendUSD: number;
  monthlyTokens: number;
  dailySpendUSD: number;
  dailyTokens: number;
  
  // Timestamps
  lastDailyReset: Date;
  lastMonthlyReset: Date;
}

export class BudgetManager extends EventEmitter {
  private budgets = new Map<string, BudgetState>();
  
  constructor(private auditLogger: AuditLogger) {
    super();
  }

  async registerBudget(contribution: AIContribution): Promise<void> {
    this.budgets.set(contribution.id, {
      contributionId: contribution.id,
      config: contribution.budget,
      monthlySpendUSD: contribution.budget.currentMonthSpendUSD,
      monthlyTokens: contribution.budget.currentMonthTokens,
      dailySpendUSD: contribution.budget.currentDaySpendUSD,
      dailyTokens: contribution.budget.currentDayTokens,
      lastDailyReset: new Date(),
      lastMonthlyReset: contribution.budget.billingCycleStart,
    });
  }

  async updateBudget(contribution: AIContribution): Promise<void> {
    const state = this.budgets.get(contribution.id);
    if (state) {
      state.config = contribution.budget;
    }
  }

  /**
   * Check if a contribution can afford a given cost.
   */
  canAfford(contributionId: string, costUSD: number): boolean {
    const state = this.budgets.get(contributionId);
    if (!state) return false;

    // Check daily limit
    if (state.config.maxDailySpendUSD !== undefined) {
      if (state.dailySpendUSD + costUSD > state.config.maxDailySpendUSD) {
        return false;
      }
    }

    // Check monthly limit
    if (state.monthlySpendUSD + costUSD > state.config.maxMonthlySpendUSD) {
      return false;
    }

    // Check per-task limit
    if (state.config.maxPerTaskSpendUSD !== undefined) {
      if (costUSD > state.config.maxPerTaskSpendUSD) {
        return false;
      }
    }

    return true;
  }

  /**
   * Pre-allocate budget for a task (optimistic locking).
   */
  async reserveBudget(
    contributionId: string, 
    estimatedCostUSD: number,
    estimatedTokens: number
  ): Promise<BudgetReservation | null> {
    const state = this.budgets.get(contributionId);
    if (!state || !this.canAfford(contributionId, estimatedCostUSD)) {
      return null;
    }

    // Optimistic reservation
    state.dailySpendUSD += estimatedCostUSD;
    state.monthlySpendUSD += estimatedCostUSD;
    state.dailyTokens += estimatedTokens;
    state.monthlyTokens += estimatedTokens;

    const reservation: BudgetReservation = {
      id: `res_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      contributionId,
      estimatedCostUSD,
      estimatedTokens,
      createdAt: new Date(),
    };

    return reservation;
  }

  /**
   * Finalize a reservation with actual spend.
   */
  async finalizeReservation(
    reservation: BudgetReservation,
    actualCostUSD: number,
    actualTokens: number
  ): Promise<void> {
    const state = this.budgets.get(reservation.contributionId);
    if (!state) return;

    // Adjust for difference between estimated and actual
    const costDiff = actualCostUSD - reservation.estimatedCostUSD;
    const tokenDiff = actualTokens - reservation.estimatedTokens;

    state.dailySpendUSD += costDiff;
    state.monthlySpendUSD += costDiff;
    state.dailyTokens += tokenDiff;
    state.monthlyTokens += tokenDiff;

    // Check alert thresholds
    this.checkAlertThresholds(state);
  }

  /**
   * Record actual spend (without prior reservation).
   */
  async recordSpend(
    contributionId: string,
    costUSD: number,
    tokens: number
  ): Promise<void> {
    const state = this.budgets.get(contributionId);
    if (!state) return;

    state.dailySpendUSD += costUSD;
    state.monthlySpendUSD += costUSD;
    state.dailyTokens += tokens;
    state.monthlyTokens += tokens;

    this.auditLogger.log({
      action: 'budget.spend',
      contributionId,
      costUSD,
      tokens,
      remainingMonthlyUSD: state.config.maxMonthlySpendUSD - state.monthlySpendUSD,
    });

    this.checkAlertThresholds(state);
  }

  /**
   * Reset daily budgets for all contributions.
   */
  async resetDailyBudgets(): Promise<void> {
    const now = new Date();
    
    for (const [id, state] of this.budgets) {
      // Check if daily reset is needed
      if (this.isDifferentDay(state.lastDailyReset, now)) {
        state.dailySpendUSD = 0;
        state.dailyTokens = 0;
        state.lastDailyReset = now;
      }

      // Check if monthly reset is needed
      if (this.isDifferentMonth(state.lastMonthlyReset, now)) {
        state.monthlySpendUSD = 0;
        state.monthlyTokens = 0;
        state.lastMonthlyReset = now;
        this.emit('budget:monthly-reset', id);
      }
    }
  }

  /**
   * Get budget summary for a contribution.
   */
  getBudgetSummary(contributionId: string): BudgetSummary | null {
    const state = this.budgets.get(contributionId);
    if (!state) return null;

    return {
      contributionId,
      monthly: {
        spent: state.monthlySpendUSD,
        limit: state.config.maxMonthlySpendUSD,
        remaining: state.config.maxMonthlySpendUSD - state.monthlySpendUSD,
        percentUsed: (state.monthlySpendUSD / state.config.maxMonthlySpendUSD) * 100,
      },
      daily: state.config.maxDailySpendUSD ? {
        spent: state.dailySpendUSD,
        limit: state.config.maxDailySpendUSD,
        remaining: state.config.maxDailySpendUSD - state.dailySpendUSD,
        percentUsed: (state.dailySpendUSD / state.config.maxDailySpendUSD) * 100,
      } : undefined,
      tokens: {
        monthlyUsed: state.monthlyTokens,
        monthlyLimit: state.config.maxMonthlyTokens,
        dailyUsed: state.dailyTokens,
        dailyLimit: state.config.maxDailyTokens,
      },
    };
  }

  /**
   * Get aggregate pool stats across all contributions.
   */
  getPoolStats(): PoolStats {
    let totalMonthlyBudget = 0;
    let totalMonthlySpent = 0;
    let activeContributions = 0;
    let totalDailyRemaining = 0;
    const providerBreakdown: Record<string, number> = {};

    for (const state of this.budgets.values()) {
      totalMonthlyBudget += state.config.maxMonthlySpendUSD;
      totalMonthlySpent += state.monthlySpendUSD;
      activeContributions++;
      totalDailyRemaining += (state.config.maxDailySpendUSD ?? state.config.maxMonthlySpendUSD / 30) - state.dailySpendUSD;
    }

    return {
      totalMonthlyBudget,
      totalMonthlySpent,
      totalMonthlyRemaining: totalMonthlyBudget - totalMonthlySpent,
      activeContributions,
      estimatedDailyCapacity: totalDailyRemaining,
      percentUsed: totalMonthlyBudget > 0 
        ? (totalMonthlySpent / totalMonthlyBudget) * 100 
        : 0,
    };
  }

  private checkAlertThresholds(state: BudgetState): void {
    const percentUsed = state.monthlySpendUSD / state.config.maxMonthlySpendUSD;
    
    for (const threshold of state.config.alertThresholds) {
      if (percentUsed >= threshold) {
        this.emit('budget:threshold-reached', {
          contributionId: state.contributionId,
          threshold,
          percentUsed: percentUsed * 100,
          spent: state.monthlySpendUSD,
          limit: state.config.maxMonthlySpendUSD,
        });
      }
    }

    // Auto-pause if exhausted
    if (percentUsed >= 1.0) {
      this.emit('budget:exhausted', state.contributionId);
    }
  }

  private isDifferentDay(a: Date, b: Date): boolean {
    return a.toDateString() !== b.toDateString();
  }

  private isDifferentMonth(a: Date, b: Date): boolean {
    return a.getMonth() !== b.getMonth() || a.getFullYear() !== b.getFullYear();
  }
}

export interface BudgetReservation {
  id: string;
  contributionId: string;
  estimatedCostUSD: number;
  estimatedTokens: number;
  createdAt: Date;
}

export interface BudgetSummary {
  contributionId: string;
  monthly: {
    spent: number;
    limit: number;
    remaining: number;
    percentUsed: number;
  };
  daily?: {
    spent: number;
    limit: number;
    remaining: number;
    percentUsed: number;
  };
  tokens: {
    monthlyUsed: number;
    monthlyLimit?: number;
    dailyUsed: number;
    dailyLimit?: number;
  };
}

export interface PoolStats {
  totalMonthlyBudget: number;
  totalMonthlySpent: number;
  totalMonthlyRemaining: number;
  activeContributions: number;
  estimatedDailyCapacity: number;
  percentUsed: number;
}
```

---

## 8. Work Distribution Pipeline

### Task Executor

```typescript
// packages/core/src/engine/executor.ts

import { Task, TaskResult, TaskType } from '../models/types';
import { BaseAIProvider, ChatMessage } from '../providers/base';
import { ProviderRegistry } from '../providers/registry';
import { SecureVault } from '../security/vault';
import { AuditLogger } from '../security/audit';
import { PromptBuilder } from './prompt-builder';

export class TaskExecutor {
  private promptBuilder: PromptBuilder;

  constructor(
    private providerRegistry: ProviderRegistry,
    private vault: SecureVault,
    private auditLogger: AuditLogger,
  ) {
    this.promptBuilder = new PromptBuilder();
  }

  async execute(
    task: Task,
    allocation: { contribution: AIContribution; preferredModel?: string },
    model: ModelInfo
  ): Promise<TaskResult> {
    // 1. Get provider instance
    const credential = await this.vault.getSecret(allocation.contribution.credentialRef);
    const provider = this.providerRegistry.getOrCreateInstance(
      allocation.contribution.id,
      allocation.contribution.provider,
      { credential }
    );

    // 2. Build prompt
    const messages = this.promptBuilder.build(task);

    // 3. Execute with the provider
    const start = Date.now();
    
    const response = await provider.chat({
      messages,
      model: model.id,
      temperature: this.getTemperature(task.type),
      maxTokens: this.getMaxTokens(task.type),
      responseFormat: task.type === 'bug-triage' ? { type: 'json_object' } : undefined,
    });

    const latencyMs = Date.now() - start;

    // 4. Parse and structure the result
    const result = this.parseResult(task, response);
    
    // 5. Calculate actual cost
    const costUSD = provider.estimateCost(
      response.usage.inputTokens,
      response.usage.outputTokens,
      model.id
    );

    return {
      ...result,
      model: model.id,
      provider: allocation.contribution.provider,
      tokensUsed: response.usage,
      costUSD,
      latencyMs,
    };
  }

  private parseResult(task: Task, response: ChatCompletionResponse): Partial<TaskResult> {
    const content = response.content;

    switch (task.type) {
      case 'code-generation':
      case 'refactoring':
        return this.parseCodeResult(content);
      
      case 'pr-review':
        return this.parsePRReviewResult(content);
      
      case 'test-generation':
        return this.parseTestResult(content);
      
      case 'bug-triage':
        return this.parseBugTriageResult(content);
      
      default:
        return {
          success: true,
          output: content,
          confidence: 0.7,
        };
    }
  }

  private parseCodeResult(content: string): Partial<TaskResult> {
    // Extract code blocks and file paths
    const codeBlockRegex = /```(?:(\w+)\n)?(?:\/\/\s*file:\s*(.+)\n)?([\s\S]*?)```/g;
    const codeChanges: TaskResult['codeChanges'] = [];
    
    let match;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const [, language, filePath, code] = match;
      if (filePath && code.trim()) {
        codeChanges.push({
          filePath: filePath.trim(),
          operation: 'modify',
          content: code.trim(),
        });
      }
    }

    return {
      success: true,
      output: content,
      codeChanges: codeChanges.length > 0 ? codeChanges : undefined,
      confidence: codeChanges.length > 0 ? 0.8 : 0.6,
    };
  }

  private parsePRReviewResult(content: string): Partial<TaskResult> {
    // Parse structured review output
    const hasApproval = /(?:LGTM|approve|looks good)/i.test(content);
    const hasIssues = /(?:issue|bug|problem|concern|suggestion)/i.test(content);
    
    return {
      success: true,
      output: content,
      structuredOutput: {
        approved: hasApproval && !hasIssues,
        hasIssues,
        reviewBody: content,
      },
      confidence: 0.75,
    };
  }

  private parseTestResult(content: string): Partial<TaskResult> {
    const codeBlockRegex = /```(?:\w+\n)?([\s\S]*?)```/g;
    const testCode: string[] = [];
    
    let match;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      testCode.push(match[1].trim());
    }

    return {
      success: testCode.length > 0,
      output: content,
      codeChanges: testCode.length > 0 ? [{
        filePath: 'tests/generated.test.ts',
        operation: 'create',
        content: testCode.join('\n\n'),
      }] : undefined,
      confidence: 0.7,
    };
  }

  private parseBugTriageResult(content: string): Partial<TaskResult> {
    try {
      const structured = JSON.parse(content);
      return {
        success: true,
        output: content,
        structuredOutput: structured,
        confidence: 0.8,
      };
    } catch {
      return {
        success: true,
        output: content,
        confidence: 0.6,
      };
    }
  }

  private getTemperature(taskType: TaskType): number {
    const temps: Record<TaskType, number> = {
      'code-generation': 0.3,
      'pr-review': 0.2,
      'documentation': 0.5,
      'test-generation': 0.3,
      'bug-triage': 0.1,
      'refactoring': 0.2,
      'translation': 0.3,
      'code-explanation': 0.5,
      'security-audit': 0.1,
      'dependency-update': 0.1,
      'issue-analysis': 0.3,
      'custom': 0.4,
    };
    return temps[taskType] ?? 0.3;
  }

  private getMaxTokens(taskType: TaskType): number {
    const maxTokens: Record<TaskType, number> = {
      'code-generation': 4096,
      'pr-review': 2048,
      'documentation': 4096,
      'test-generation': 4096,
      'bug-triage': 1024,
      'refactoring': 4096,
      'translation': 4096,
      'code-explanation': 2048,
      'security-audit': 4096,
      'dependency-update': 2048,
      'issue-analysis': 2048,
      'custom': 4096,
    };
    return maxTokens[taskType] ?? 4096;
  }
}
```

### Prompt Builder

```typescript
// packages/core/src/engine/prompt-builder.ts

import { Task, TaskType } from '../models/types';
import { ChatMessage } from '../providers/base';

export class PromptBuilder {
  private templates = new Map<TaskType, PromptTemplate>();

  constructor() {
    this.registerDefaultTemplates();
  }

  registerTemplate(taskType: TaskType, template: PromptTemplate): void {
    this.templates.set(taskType, template);
  }

  build(task: Task): ChatMessage[] {
    const template = this.templates.get(task.type);
    if (!template) {
      return this.buildGenericPrompt(task);
    }
    return template.build(task);
  }

  private registerDefaultTemplates(): void {
    this.templates.set('code-generation', {
      build: (task: Task) => [
        {
          role: 'system',
          content: `You are an expert software engineer contributing to an open-source project.
Repository: ${task.context.repository.owner}/${task.context.repository.name}
Primary Language: ${task.context.repository.language}
Frameworks: ${task.context.repository.frameworks.join(', ')}

${task.context.conventions?.codeStyle ? `Code Style: ${task.context.conventions.codeStyle}` : ''}
${task.context.conventions?.architecture ? `Architecture: ${task.context.conventions.architecture}` : ''}

Guidelines:
- Write clean, well-documented, production-ready code
- Follow the project's existing patterns and conventions
- Include inline comments for complex logic
- Mark each code block with the file path: \`// file: path/to/file.ext\`
- Consider edge cases and error handling`,
        },
        ...task.context.files.map(f => ({
          role: 'user' as const,
          content: `File: ${f.path}\n\`\`\`${f.language}\n${f.content}\n\`\`\``,
        })),
        {
          role: 'user',
          content: `Task: ${task.title}\n\n${task.description}`,
        },
      ],
    });

    this.templates.set('pr-review', {
      build: (task: Task) => [
        {
          role: 'system',
          content: `You are a thorough code reviewer for the ${task.context.repository.owner}/${task.context.repository.name} project.

Provide a detailed code review covering:
1. **Correctness**: Logic errors, edge cases, potential bugs
2. **Security**: Vulnerabilities, injection risks, authentication issues
3. **Performance**: Inefficiencies, N+1 queries, memory leaks
4. **Maintainability**: Code clarity, naming, SOLID principles
5. **Testing**: Missing test coverage, edge cases
6. **Style**: Consistency with project conventions

Format your review as:
- 🔴 Critical issues (must fix)
- 🟡 Suggestions (should consider)
- 🟢 Positive observations
- Overall verdict: APPROVE / REQUEST_CHANGES / COMMENT`,
        },
        {
          role: 'user',
          content: `PR #${task.context.pullRequest?.number}: ${task.context.pullRequest?.title}

Description: ${task.context.pullRequest?.body}

Diff:
\`\`\`diff
${task.context.pullRequest?.diff}
\`\`\``,
        },
      ],
    });

    this.templates.set('test-generation', {
      build: (task: Task) => [
        {
          role: 'system',
          content: `You are a test engineer for ${task.context.repository.owner}/${task.context.repository.name}.
${task.context.conventions?.testingStrategy ? `Testing Strategy: ${task.context.conventions.testingStrategy}` : ''}

Write comprehensive tests that cover:
- Happy path scenarios
- Edge cases and boundary conditions
- Error handling and failure modes
- Integration points (if applicable)

Use the project's existing test framework and patterns.
Each test should be independent and clearly named.`,
        },
        ...task.context.files.map(f => ({
          role: 'user' as const,
          content: `Source file to test: ${f.path}\n\`\`\`${f.language}\n${f.content}\n\`\`\``,
        })),
        {
          role: 'user',
          content: `Generate comprehensive tests for the above code.\n\n${task.description}`,
        },
      ],
    });

    this.templates.set('bug-triage', {
      build: (task: Task) => [
        {
          role: 'system',
          content: `You are a bug triage specialist for ${task.context.repository.owner}/${task.context.repository.name}.

Analyze the reported issue and provide a structured JSON response:
{
  "severity": "critical|high|medium|low",
  "category": "bug|feature|enhancement|question|documentation",
  "component": "string - affected component/module",
  "rootCause": "string - likely root cause analysis",
  "reproductionSteps": ["step1", "step2"],
  "suggestedFix": "string - high-level fix description",
  "relatedIssues": ["#123", "#456"],
  "estimatedEffort": "trivial|small|medium|large|xlarge",
  "labels": ["label1", "label2"],
  "assignmentSuggestion": "string - who should fix this"
}`,
        },
        {
          role: 'user',
          content: `Issue #${task.context.issue?.number}: ${task.context.issue?.title}

${task.context.issue?.body}

Labels: ${task.context.issue?.labels.join(', ')}

Comments:
${task.context.issue?.comments.map(c => `@${c.author}: ${c.body}`).join('\n\n')}`,
        },
      ],
    });

    this.templates.set('documentation', {
      build: (task: Task) => [
        {
          role: 'system',
          content: `You are a technical writer for ${task.context.repository.owner}/${task.context.repository.name}.

Write clear, comprehensive documentation that includes:
- Overview and purpose
- Installation/setup instructions (if applicable)
- API reference with examples
- Usage examples
- Common patterns and best practices
- Troubleshooting section

Use Markdown formatting. Be concise but thorough.`,
        },
        ...task.context.files.map(f => ({
          role: 'user' as const,
          content: `Source: ${f.path}\n\`\`\`${f.language}\n${f.content}\n\`\`\``,
        })),
        {
          role: 'user',
          content: task.description,
        },
      ],
    });

    this.templates.set('security-audit', {
      build: (task: Task) => [
        {
          role: 'system',
          content: `You are a security engineer auditing ${task.context.repository.owner}/${task.context.repository.name}.

Perform a thorough security review covering:
1. **Injection Attacks**: SQL injection, XSS, command injection, path traversal
2. **Authentication & Authorization**: Broken auth, privilege escalation, IDOR
3. **Data Exposure**: Sensitive data in logs, hardcoded secrets, PII leakage
4. **Cryptography**: Weak algorithms, improper key management
5. **Dependencies**: Known vulnerabilities in dependencies
6. **Configuration**: Insecure defaults, debug mode, CORS
7. **Input Validation**: Missing or insufficient validation
8. **Error Handling**: Information disclosure through errors

Rate each finding:
- 🔴 CRITICAL: Actively exploitable, immediate action needed
- 🟠 HIGH: Significant risk, fix soon
- 🟡 MEDIUM: Moderate risk, plan to fix
- 🔵 LOW: Minor risk, nice to fix
- ℹ️ INFO: Best practice suggestion`,
        },
        ...task.context.files.map(f => ({
          role: 'user' as const,
          content: `File: ${f.path}\n\`\`\`${f.language}\n${f.content}\n\`\`\``,
        })),
        {
          role: 'user',
          content: task.description || 'Perform a comprehensive security audit of the above code.',
        },
      ],
    });
  }

  private buildGenericPrompt(task: Task): ChatMessage[] {
    return [
      {
        role: 'system',
        content: `You are an AI assistant helping with the ${task.context.repository.owner}/${task.context.repository.name} open-source project.
Complete the following task professionally and thoroughly.`,
      },
      {
        role: 'user',
        content: `${task.title}\n\n${task.description}`,
      },
    ];
  }
}

interface PromptTemplate {
  build(task: Task): ChatMessage[];
}
```

---

## 9. Security & Secrets Management

```typescript
// packages/core/src/security/vault.ts

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

/**
 * Secure vault for storing contributor credentials.
 * 
 * In production, use HashiCorp Vault, AWS Secrets Manager, or similar.
 * This provides a reference implementation with AES-256-GCM encryption.
 */
export interface SecureVault {
  storeSecret(key: string, value: any, metadata?: Record<string, any>): Promise<string>;
  getSecret(ref: string): Promise<any>;
  rotateSecret(ref: string, newValue: any): Promise<void>;
  deleteSecret(ref: string): Promise<void>;
  listSecrets(prefix: string): Promise<string[]>;
}

export class EncryptedVault implements SecureVault {
  private secrets = new Map<string, EncryptedSecret>();
  private masterKey: Buffer;

  constructor(masterKeyHex: string) {
    // In production: derive from HSM, KMS, or environment-provided key
    this.masterKey = Buffer.from(masterKeyHex, 'hex');
    if (this.masterKey.length !== 32) {
      throw new Error('Master key must be 256 bits (32 bytes)');
    }
  }

  async storeSecret(key: string, value: any, metadata?: Record<string, any>): Promise<string> {
    const ref = `vault://${key}`;
    const plaintext = JSON.stringify(value);
    
    // Encrypt with AES-256-GCM
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', this.masterKey, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    this.secrets.set(ref, {
      iv: iv.toString('hex'),
      encrypted,
      authTag: authTag.toString('hex'),
      metadata: metadata ?? {},
      createdAt: new Date(),
      version: 1,
    });

    return ref;
  }

  async getSecret(ref: string): Promise<any> {
    const secret = this.secrets.get(ref);
    if (!secret) {
      throw new Error(`Secret not found: ${ref}`);
    }

    // Decrypt
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.masterKey,
      Buffer.from(secret.iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(secret.authTag, 'hex'));
    
    let decrypted = decipher.update(secret.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }

  async rotateSecret(ref: string, newValue: any): Promise<void> {
    const existing = this.secrets.get(ref);
    if (!existing) {
      throw new Error(`Secret not found: ${ref}`);
    }

    const plaintext = JSON.stringify(newValue);
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', this.masterKey, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    this.secrets.set(ref, {
      ...existing,
      iv: iv.toString('hex'),
      encrypted,
      authTag: authTag.toString('hex'),
      version: existing.version + 1,
    });
  }

  async deleteSecret(ref: string): Promise<void> {
    this.secrets.delete(ref);
  }

  async listSecrets(prefix: string): Promise<string[]> {
    return Array.from(this.secrets.keys()).filter(k => k.includes(prefix));
  }
}

interface EncryptedSecret {
  iv: string;
  encrypted: string;
  authTag: string;
  metadata: Record<string, any>;
  createdAt: Date;
  version: number;
}

// ── Audit Logger ──────────────────────────────────────

// packages/core/src/security/audit.ts

export interface AuditEntry {
  timestamp: Date;
  action: string;
  [key: string]: any;
}

export class AuditLogger {
  private entries: AuditEntry[] = [];
  private sinks: AuditSink[] = [];

  addSink(sink: AuditSink): void {
    this.sinks.push(sink);
  }

  log(entry: Omit<AuditEntry, 'timestamp'>): void {
    const fullEntry: AuditEntry = {
      ...entry,
      timestamp: new Date(),
    };

    this.entries.push(fullEntry);

    // Fan out to all sinks
    for (const sink of this.sinks) {
      sink.write(fullEntry).catch(err => {
        console.error(`Audit sink error: ${err.message}`);
      });
    }
  }

  async query(filter: {
    action?: string;
    contributorId?: string;
    taskId?: string;
    from?: Date;
    to?: Date;
    limit?: number;
  }): Promise<AuditEntry[]> {
    let results = this.entries;

    if (filter.action) {
      results = results.filter(e => e.action === filter.action);
    }
    if (filter.contributorId) {
      results = results.filter(e => e.contributorId === filter.contributorId);
    }
    if (filter.taskId) {
      results = results.filter(e => e.taskId === filter.taskId);
    }
    if (filter.from) {
      results = results.filter(e => e.timestamp >= filter.from!);
    }
    if (filter.to) {
      results = results.filter(e => e.timestamp <= filter.to!);
    }

    return results.slice(-(filter.limit ?? 100));
  }
}

export interface AuditSink {
  write(entry: AuditEntry): Promise<void>;
}

export class ConsoleAuditSink implements AuditSink {
  async write(entry: AuditEntry): Promise<void> {
    console.log(`[AUDIT] ${entry.timestamp.toISOString()} ${entry.action}`, 
      JSON.stringify(entry, null, 0));
  }
}

export class FileAuditSink implements AuditSink {
  constructor(private filePath: string) {}
  
  async write(entry: AuditEntry): Promise<void> {
    const { appendFile } = await import('fs/promises');
    await appendFile(this.filePath, JSON.stringify(entry) + '\n');
  }
}
```

### RBAC (Role-Based Access Control)

```typescript
// packages/core/src/security/rbac.ts

export type Role = 'owner' | 'maintainer' | 'contributor' | 'sponsor' | 'viewer';

export type Permission = 
  | 'project.manage'
  | 'contribution.register'
  | 'contribution.manage-own'
  | 'contribution.manage-all'
  | 'task.submit'
  | 'task.approve'
  | 'task.cancel'
  | 'task.view'
  | 'budget.view-own'
  | 'budget.view-all'
  | 'audit.view'
  | 'settings.manage';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: [
    'project.manage', 'contribution.register', 'contribution.manage-own',
    'contribution.manage-all', 'task.submit', 'task.approve', 'task.cancel',
    'task.view', 'budget.view-own', 'budget.view-all', 'audit.view', 'settings.manage',
  ],
  maintainer: [
    'contribution.register', 'contribution.manage-own', 'task.submit',
    'task.approve', 'task.cancel', 'task.view', 'budget.view-own',
    'budget.view-all', 'audit.view',
  ],
  contributor: [
    'contribution.register', 'contribution.manage-own', 'task.submit',
    'task.view', 'budget.view-own',
  ],
  sponsor: [
    'contribution.register', 'contribution.manage-own',
    'task.view', 'budget.view-own',
  ],
  viewer: [
    'task.view',
  ],
};

export class RBAC {
  hasPermission(role: Role, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
  }

  requirePermission(role: Role, permission: Permission): void {
    if (!this.hasPermission(role, permission)) {
      throw new Error(
        `Permission denied: role '${role}' does not have '${permission}'`
      );
    }
  }

  getPermissions(role: Role): Permission[] {
    return ROLE_PERMISSIONS[role] ?? [];
  }
}
```

---

## 10. SDK & Plugin System

```typescript
// packages/sdk/src/plugin.ts

import { Task, TaskResult, TaskType, ProviderType } from '@ace/core';

/**
 * Plugin interface for extending ACE.
 * 
 * Plugins can:
 * - Add new AI providers
 * - Add new task types
 * - Add integrations (Slack, Discord, Linear, etc.)
 * - Add custom prompt templates
 * - Add audit sinks
 * - Hook into lifecycle events
 */
export interface ACEPlugin {
  /** Unique plugin identifier */
  name: string;
  
  /** Semantic version */
  version: string;
  
  /** Plugin description */
  description?: string;
  
  /** Initialize the plugin with the ACE engine context */
  initialize(context: PluginContext): Promise<void>;
  
  /** Clean up resources */
  destroy?(): Promise<void>;
}

export interface PluginContext {
  // Registration
  registerProvider(type: ProviderType, factory: ProviderFactory): void;
  registerTaskType(type: string, handler: TaskHandler): void;
  registerPromptTemplate(taskType: TaskType, template: PromptTemplate): void;
  registerAuditSink(sink: AuditSink): void;
  
  // Event hooks
  on(event: string, handler: (...args: any[]) => void): void;
  
  // Configuration
  getConfig(): Record<string, any>;
  
  // Logging
  logger: PluginLogger;
}

export interface TaskHandler {
  /** Validate task input */
  validate?(task: Task): Promise<{ valid: boolean; errors?: string[] }>;
  
  /** Pre-process task before execution */
  preProcess?(task: Task): Promise<Task>;
  
  /** Post-process task result */
  postProcess?(task: Task, result: TaskResult): Promise<TaskResult>;
  
  /** Custom prompt building */
  buildPrompt?(task: Task): ChatMessage[];
}

export interface PluginLogger {
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
}

// ── Example Plugin: GitHub Integration ──────────────

// plugins/plugin-github/src/index.ts

export class GitHubPlugin implements ACEPlugin {
  name = '@ace/plugin-github';
  version = '1.0.0';
  description = 'GitHub integration for ACE - auto-creates PRs, reviews, and issue responses';

  private octokit: any;

  async initialize(context: PluginContext): Promise<void> {
    const config = context.getConfig();
    const { Octokit } = await import('@octokit/rest');
    
    this.octokit = new Octokit({ auth: config.githubToken });

    // Listen for completed tasks and take action
    context.on('task:completed', async (task: Task) => {
      if (task.result?.codeChanges?.length) {
        await this.createPullRequest(task);
      }
      if (task.type === 'pr-review' && task.result) {
        await this.submitReview(task);
      }
      if (task.type === 'bug-triage' && task.result?.structuredOutput) {
        await this.labelIssue(task);
      }
    });

    // Listen for new issues and auto-triage
    context.on('github:issue.opened', async (event: any) => {
      context.logger.info(`New issue #${event.issue.number}: ${event.issue.title}`);
      // Auto-submit a bug-triage task
    });

    context.logger.info('GitHub plugin initialized');
  }

  private async createPullRequest(task: Task): Promise<void> {
    const { repository } = task.context;
    const branch = `ace/task-${task.id}`;
    
    // Create branch, commit changes, open PR
    // (Implementation using octokit)
  }

  private async submitReview(task: Task): Promise<void> {
    const { pullRequest } = task.context;
    if (!pullRequest) return;
    
    const event = task.result?.structuredOutput?.approved 
      ? 'APPROVE' 
      : 'REQUEST_CHANGES';
    
    await this.octokit.pulls.createReview({
      owner: task.context.repository.owner,
      repo: task.context.repository.name,
      pull_number: pullRequest.number,
      body: task.result?.output,
      event,
    });
  }

  private async labelIssue(task: Task): Promise<void> {
    const { issue } = task.context;
    if (!issue) return;
    
    const triage = task.result?.structuredOutput;
    if (triage?.labels) {
      await this.octokit.issues.addLabels({
        owner: task.context.repository.owner,
        repo: task.context.repository.name,
        issue_number: issue.number,
        labels: triage.labels,
      });
    }
  }
}
```

### Plugin Loader

```typescript
// packages/core/src/plugins/loader.ts

import { ACEPlugin, PluginContext } from '@ace/sdk';

export class PluginLoader {
  private plugins = new Map<string, ACEPlugin>();

  constructor(private context: PluginContext) {}

  async loadPlugin(plugin: ACEPlugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin '${plugin.name}' is already loaded`);
    }

    console.log(`Loading plugin: ${plugin.name}@${plugin.version}`);
    
    await plugin.initialize(this.context);
    this.plugins.set(plugin.name, plugin);
    
    console.log(`Plugin loaded: ${plugin.name}`);
  }

  async loadFromNpm(packageName: string): Promise<void> {
    const module = await import(packageName);
    const PluginClass = module.default ?? module[Object.keys(module)[0]];
    const plugin = new PluginClass();
    await this.loadPlugin(plugin);
  }

  async unloadPlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (plugin?.destroy) {
      await plugin.destroy();
    }
    this.plugins.delete(name);
  }

  getPlugin(name: string): ACEPlugin | undefined {
    return this.plugins.get(name);
  }

  listPlugins(): Array<{ name: string; version: string }> {
    return Array.from(this.plugins.values()).map(p => ({
      name: p.name,
      version: p.version,
    }));
  }
}
```

---

## 11. Dashboard & API

### REST API

```typescript
// packages/api/src/routes/index.ts

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const app = new Hono();

app.use('/*', cors());
app.use('/api/*', jwt({ secret: process.env.JWT_SECRET! }));

// ── Contributions ──────────────────────────────────

app.post('/api/contributions', 
  zValidator('json', z.object({
    provider: z.enum(['openai', 'anthropic', 'google', 'mistral', 'ollama', 'custom']),
    credential: z.object({
      type: z.enum(['api-key', 'oauth', 'endpoint']),
      apiKey: z.string().optional(),
      accessToken: z.string().optional(),
      baseUrl: z.string().url().optional(),
    }),
    budget: z.object({
      maxMonthlySpendUSD: z.number().positive().max(10000),
      maxDailySpendUSD: z.number().positive().optional(),
      maxPerTaskSpendUSD: z.number().positive().optional(),
    }),
    preferences: z.object({
      allowedTasks: z.array(z.string()).optional(),
      maxModelTier: z.enum(['economy', 'standard', 'premium']).optional(),
      priorityMultiplier: z.number().min(0.1).max(10).optional(),
    }).optional(),
  })),
  async (c) => {
    const body = c.req.valid('json');
    const userId = c.get('jwtPayload').sub;
    
    const contribution = await gateway.registerContribution({
      contributorId: userId,
      ...body,
    });
    
    return c.json(contribution, 201);
  }
);

app.get('/api/contributions', async (c) => {
  const userId = c.get('jwtPayload').sub;
  const contributions = await contributionStore.getByContributor(userId);
  return c.json(contributions);
});

app.patch('/api/contributions/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const updated = await gateway.updateContribution(id, body);
  return c.json(updated);
});

app.delete('/api/contributions/:id', async (c) => {
  const id = c.req.param('id');
  await gateway.removeContribution(id);
  return c.json({ ok: true });
});

// ── Tasks ──────────────────────────────────────────

app.post('/api/tasks',
  zValidator('json', z.object({
    type: z.string(),
    title: z.string().min(1),
    description: z.string(),
    priority: z.enum(['critical', 'high', 'medium', 'low', 'background']).default('medium'),
    context: z.object({
      repository: z.object({
        owner: z.string(),
        name: z.string(),
        defaultBranch: z.string().default('main'),
        language: z.string(),
        frameworks: z.array(z.string()).default([]),
      }),
      files: z.array(z.object({
        path: z.string(),
        content: z.string(),
        language: z.string(),
      })).default([]),
    }),
  })),
  async (c) => {
    const body = c.req.valid('json');
    const userId = c.get('jwtPayload').sub;
    
    const task = await orchestrator.submitTask({
      ...body,
      projectId: body.context.repository.owner + '/' + body.context.repository.name,
      requestedBy: userId,
      dependsOn: [],
      requirements: {
        minModelTier: 'economy',
        requiredCapabilities: ['chat', 'code'],
        requiresHumanReview: false,
        autoMerge: false,
      },
    });
    
    return c.json(task, 201);
  }
);

app.get('/api/tasks', async (c) => {
  const status = c.req.query('status');
  const tasks = status 
    ? await taskStore.getByStatus(status) 
    : await taskStore.getAll();
  return c.json(tasks);
});

app.get('/api/tasks/:id', async (c) => {
  const task = await taskStore.get(c.req.param('id'));
  if (!task) return c.json({ error: 'Not found' }, 404);
  return c.json(task);
});

// ── Budget & Stats ─────────────────────────────────

app.get('/api/budget/pool', async (c) => {
  const stats = budgetManager.getPoolStats();
  return c.json(stats);
});

app.get('/api/budget/:contributionId', async (c) => {
  const summary = budgetManager.getBudgetSummary(c.req.param('contributionId'));
  if (!summary) return c.json({ error: 'Not found' }, 404);
  return c.json(summary);
});

// ── Audit ──────────────────────────────────────────

app.get('/api/audit', async (c) => {
  const entries = await auditLogger.query({
    from: c.req.query('from') ? new Date(c.req.query('from')!) : undefined,
    to: c.req.query('to') ? new Date(c.req.query('to')!) : undefined,
    action: c.req.query('action') ?? undefined,
    limit: parseInt(c.req.query('limit') ?? '100'),
  });
  return c.json(entries);
});

// ── Health ─────────────────────────────────────────

app.get('/api/health', async (c) => {
  const health = await gateway.healthCheckAll();
  return c.json({
    status: 'ok',
    contributions: Object.fromEntries(health),
    pool: budgetManager.getPoolStats(),
  });
});

export default app;
```

### Dashboard UI (React)

```tsx
// packages/dashboard/src/app/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { PoolStats, BudgetSummary, Task, AIContribution } from '@ace/core';

export default function Dashboard() {
  const [poolStats, setPoolStats] = useState<PoolStats | null>(null);
  const [contributions, setContributions] = useState<AIContribution[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'contributions' | 'tasks' | 'audit'>('overview');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    const [pool, contribs, taskList] = await Promise.all([
      fetch('/api/budget/pool').then(r => r.json()),
      fetch('/api/contributions').then(r => r.json()),
      fetch('/api/tasks?limit=50').then(r => r.json()),
    ]);
    setPoolStats(pool);
    setContributions(contribs);
    setTasks(taskList);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            <h1 className="text-xl font-bold">ACE Dashboard</h1>
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
              Active
            </span>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium">
            + Add Contribution
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Pool Stats Cards */}
        {poolStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Monthly Budget"
              value={`$${poolStats.totalMonthlyBudget.toFixed(2)}`}
              subtitle={`$${poolStats.totalMonthlyRemaining.toFixed(2)} remaining`}
              color="blue"
            />
            <StatCard
              title="Monthly Spent"
              value={`$${poolStats.totalMonthlySpent.toFixed(2)}`}
              subtitle={`${poolStats.percentUsed.toFixed(1)}% used`}
              color={poolStats.percentUsed > 80 ? 'red' : poolStats.percentUsed > 50 ? 'yellow' : 'green'}
            />
            <StatCard
              title="Active Contributors"
              value={poolStats.activeContributions.toString()}
              subtitle="AI API connections"
              color="purple"
            />
            <StatCard
              title="Daily Capacity"
              value={`$${poolStats.estimatedDailyCapacity.toFixed(2)}`}
              subtitle="remaining today"
              color="cyan"
            />
          </div>
        )}

        {/* Budget Usage Bar */}
        {poolStats && (
          <div className="mb-8 bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Monthly Pool Usage</h3>
            <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  poolStats.percentUsed > 80 ? 'bg-red-500' :
                  poolStats.percentUsed > 50 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(poolStats.percentUsed, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>$0</span>
              <span>${poolStats.totalMonthlyBudget.toFixed(0)}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-900 rounded-lg p-1 w-fit">
          {(['overview', 'contributions', 'tasks', 'audit'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'contributions' && (
          <ContributionsList contributions={contributions} />
        )}
        
        {activeTab === 'tasks' && (
          <TasksList tasks={tasks} />
        )}
        
        {activeTab === 'overview' && (
          <Overview contributions={contributions} tasks={tasks} poolStats={poolStats} />
        )}
      </main>
    </div>
  );
}

function StatCard({ title, value, subtitle, color }: { 
  title: string; value: string; subtitle: string; color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500/10 to-blue-600/5 border-blue-500/20',
    green: 'from-green-500/10 to-green-600/5 border-green-500/20',
    yellow: 'from-yellow-500/10 to-yellow-600/5 border-yellow-500/20',
    red: 'from-red-500/10 to-red-600/5 border-red-500/20',
    purple: 'from-purple-500/10 to-purple-600/5 border-purple-500/20',
    cyan: 'from-cyan-500/10 to-cyan-600/5 border-cyan-500/20',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-5`}>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}

function ContributionsList({ contributions }: { contributions: AIContribution[] }) {
  const statusColors: Record<string, string> = {
    active: 'bg-green-500',
    paused: 'bg-yellow-500',
    exhausted: 'bg-red-500',
    error: 'bg-red-600',
  };

  return (
    <div className="space-y-3">
      {contributions.map(c => (
        <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-2 h-2 rounded-full ${statusColors[c.status]}`} />
            <div>
              <p className="font-medium">{c.provider}</p>
              <p className="text-sm text-gray-400">
                ${c.budget.currentMonthSpendUSD.toFixed(2)} / ${c.budget.maxMonthlySpendUSD.toFixed(2)} this month
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">
              {c.preferences.allowedTasks.length} task types
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              c.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
            }`}>
              {c.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TasksList({ tasks }: { tasks: Task[] }) {
  const statusIcons: Record<string, string> = {
    completed: '✅',
    running: '⏳',
    queued: '📋',
    failed: '❌',
    pending: '🕐',
    retrying: '🔄',
  };

  return (
    <div className="space-y-2">
      {tasks.map(task => (
        <div key={task.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <span className="text-lg">{statusIcons[task.status] ?? '❓'}</span>
              <div>
                <p className="font-medium">{task.title}</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs bg-gray-800 px-2 py-0.5 rounded">{task.type}</span>
                  <span className="text-xs bg-gray-800 px-2 py-0.5 rounded">{task.priority}</span>
                  {task.actualCostUSD && (
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                      ${task.actualCostUSD.toFixed(4)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <span className="text-xs text-gray-500">
              {task.completedAt 
                ? `Completed ${new Date(task.completedAt).toLocaleString()}`
                : task.startedAt
                ? `Started ${new Date(task.startedAt).toLocaleString()}`
                : `Queued ${new Date(task.createdAt).toLocaleString()}`
              }
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 12. Deployment

### Docker Compose (Development)

```yaml
# infra/docker/docker-compose.yml

version: '3.9'

services:
  ace-api:
    build:
      context: ../..
      dockerfile: infra/docker/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://ace:ace@postgres:5432/ace
      - REDIS_URL=redis://redis:6379
      - VAULT_MASTER_KEY=${VAULT_MASTER_KEY}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis
    volumes:
      - audit-logs:/app/audit

  ace-worker:
    build:
      context: ../..
      dockerfile: infra/docker/Dockerfile
    command: node packages/core/dist/worker.js
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://ace:ace@postgres:5432/ace
      - REDIS_URL=redis://redis:6379
      - VAULT_MASTER_KEY=${VAULT_MASTER_KEY}
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 3

  ace-dashboard:
    build:
      context: ../..
      dockerfile: infra/docker/Dockerfile.dashboard
    ports:
      - "3001:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://ace-api:3000

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ace
      POSTGRES_USER: ace
      POSTGRES_PASSWORD: ace
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
  audit-logs:
```

### Dockerfile

```dockerfile
# infra/docker/Dockerfile

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/core/package.json packages/core/
COPY packages/api/package.json packages/api/
COPY packages/sdk/package.json packages/sdk/
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/core/node_modules ./packages/core/node_modules
COPY --from=deps /app/packages/api/node_modules ./packages/api/node_modules
COPY . .
RUN corepack enable pnpm && pnpm run build

# Production
FROM base AS runner
RUN addgroup --system --gid 1001 ace
RUN adduser --system --uid 1001 ace

COPY --from=builder /app/packages/api/dist ./packages/api/dist
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/node_modules ./node_modules

USER ace
EXPOSE 3000
CMD ["node", "packages/api/dist/server.js"]
```

### GitHub Actions CI/CD

```yaml
# .github/workflows/ci.yml

name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm run lint
      - run: pnpm run typecheck
      - run: pnpm run test
      - run: pnpm run build

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

### ACE Worker (GitHub Actions-based task runner)

```yaml
# .github/workflows/ace-worker.yml

name: ACE Task Worker

on:
  repository_dispatch:
    types: [ace-task]
  workflow_dispatch:
    inputs:
      task_id:
        description: 'Task ID to execute'
        required: true

jobs:
  execute-task:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with: { version: 9 }
      
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm run build --filter @ace/core
      
      - name: Execute ACE Task
        env:
          ACE_API_URL: ${{ secrets.ACE_API_URL }}
          ACE_API_TOKEN: ${{ secrets.ACE_API_TOKEN }}
          TASK_ID: ${{ github.event.inputs.task_id || github.event.client_payload.task_id }}
        run: |
          node packages/cli/dist/index.js execute-task --id $TASK_ID
      
      - name: Upload Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: task-result-${{ github.event.inputs.task_id }}
          path: .ace/results/
```

---

## 13. CLI

```typescript
// packages/cli/src/index.ts

import { Command } from 'commander';

const program = new Command();

program
  .name('ace')
  .description('AI Contribution Engine CLI')
  .version('1.0.0');

program
  .command('contribute')
  .description('Register an AI contribution')
  .requiredOption('-p, --provider <provider>', 'AI provider (openai, anthropic, google, etc.)')
  .requiredOption('-k, --api-key <key>', 'API key')
  .option('-b, --budget <amount>', 'Monthly budget in USD', '50')
  .option('-d, --daily-limit <amount>', 'Daily limit in USD')
  .option('-t, --tasks <tasks>', 'Allowed task types (comma-separated)')
  .option('--model-tier <tier>', 'Max model tier (economy, standard, premium)', 'standard')
  .action(async (options) => {
    console.log(`🤖 Registering ${options.provider} contribution...`);
    console.log(`   Budget: $${options.budget}/month`);
    
    const response = await fetch(`${getApiUrl()}/api/contributions`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        provider: options.provider,
        credential: { type: 'api-key', apiKey: options.apiKey },
        budget: {
          maxMonthlySpendUSD: parseFloat(options.budget),
          maxDailySpendUSD: options.dailyLimit ? parseFloat(options.dailyLimit) : undefined,
        },
        preferences: {
          allowedTasks: options.tasks?.split(','),
          maxModelTier: options.modelTier,
        },
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Contribution registered: ${data.id}`);
      console.log(`   Provider: ${data.provider}`);
      console.log(`   Status: ${data.status}`);
    } else {
      const error = await response.json();
      console.error(`❌ Failed: ${error.message || error.error}`);
    }
  });

program
  .command('status')
  .description('View pool status and budget summary')
  .action(async () => {
    const response = await fetch(`${getApiUrl()}/api/budget/pool`, {
      headers: { 'Authorization': `Bearer ${getToken()}` },
    });
    
    const stats = await response.json();
    
    console.log('\n🏊 AI Contribution Pool Status');
    console.log('─'.repeat(45));
    console.log(`  Active Contributors:  ${stats.activeContributions}`);
    console.log(`  Monthly Budget:       $${stats.totalMonthlyBudget.toFixed(2)}`);
    console.log(`  Monthly Spent:        $${stats.totalMonthlySpent.toFixed(2)}`);
    console.log(`  Monthly Remaining:    $${stats.totalMonthlyRemaining.toFixed(2)}`);
    console.log(`  Usage:                ${stats.percentUsed.toFixed(1)}%`);
    console.log(`  Daily Capacity:       $${stats.estimatedDailyCapacity.toFixed(2)}`);
    
    // Progress bar
    const barWidth = 30;
    const filled = Math.round((stats.percentUsed / 100) * barWidth);
    const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);
    console.log(`\n  [${bar}] ${stats.percentUsed.toFixed(1)}%\n`);
  });

program
  .command('submit')
  .description('Submit a task')
  .requiredOption('-t, --type <type>', 'Task type')
  .requiredOption('--title <title>', 'Task title')
  .option('-d, --description <desc>', 'Task description')
  .option('-p, --priority <priority>', 'Priority', 'medium')
  .option('-f, --files <files>', 'Files to include (comma-separated glob patterns)')
  .action(async (options) => {
    console.log(`📋 Submitting ${options.type} task: ${options.title}`);
    // Implementation...
  });

program
  .command('tasks')
  .description('List tasks')
  .option('-s, --status <status>', 'Filter by status')
  .option('-n, --limit <limit>', 'Max results', '20')
  .action(async (options) => {
    const params = new URLSearchParams();
    if (options.status) params.set('status', options.status);
    params.set('limit', options.limit);
    
    const response = await fetch(`${getApiUrl()}/api/tasks?${params}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` },
    });
    
    const tasks = await response.json();
    
    const statusEmoji: Record<string, string> = {
      completed: '✅', running: '⏳', queued: '📋',
      failed: '❌', pending: '🕐', retrying: '🔄',
    };
    
    console.log(`\n📋 Tasks (${tasks.length} results)`);
    console.log('─'.repeat(70));
    
    for (const task of tasks) {
      console.log(
        `  ${statusEmoji[task.status] ?? '❓'} [${task.type}] ${task.title}` +
        (task.actualCostUSD ? ` ($${task.actualCostUSD.toFixed(4)})` : '')
      );
    }
    console.log();
  });

function getApiUrl(): string {
  return process.env.ACE_API_URL ?? 'http://localhost:3000';
}

function getToken(): string {
  return process.env.ACE_API_TOKEN ?? '';
}

program.parse();
```

---

## 14. Configuration File (`.ace.yml`)

Projects include this file in their repository root:

```yaml
# .ace.yml - ACE Project Configuration

project:
  name: my-awesome-project
  repository: owner/repo

# Budget allocation strategy
allocation:
  strategy: proportional  # round-robin | proportional | cost-optimized | priority-based

# Task policies
tasks:
  maxConcurrent: 5
  defaultPriority: medium
  requireApprovalAboveUSD: 5.00
  autoRetry: true
  maxRetries: 3

# Quality gates
quality:
  minConfidence: 0.7
  requireReviewForCodeChanges: true
  requireTestsForNewCode: true
  maxFilesPerChange: 10

# Auto-trigger rules
triggers:
  - event: issue.opened
    labels: [bug]
    action: bug-triage
    
  - event: pull_request.opened
    action: pr-review
    
  - event: issue.labeled
    labels: [needs-docs]
    action: documentation
    
  - event: issue.labeled
    labels: [needs-tests]
    action: test-generation

# Custom prompt overrides
prompts:
  code-generation: |
    You are a contributor to {{ repository }}.
    Follow our coding standards at docs/CONTRIBUTING.md.
    {{ default_prompt }}

# Notifications
notifications:
  slack:
    webhook: ${SLACK_WEBHOOK_URL}
    events: [task.completed, budget.threshold-reached]
  
  discord:
    webhook: ${DISCORD_WEBHOOK_URL}
    events: [task.completed]
```

---

## 15. Future Roadmap

```
Phase 1 (MVP) ─────────────────────────────────────────
  ✅ Core orchestration engine
  ✅ OpenAI + Anthropic providers
  ✅ Budget management
  ✅ Basic task types (code-gen, PR review, docs, tests)
  ✅ CLI
  ✅ REST API
  ✅ Encrypted credential storage

Phase 2 (Growth) ──────────────────────────────────────
  🔲 GitHub App (auto PR review, issue triage)
  🔲 Dashboard UI
  🔲 More providers (Google, Mistral, Ollama, Groq)
  🔲 Plugin marketplace
  🔲 RAG integration (codebase embedding for context)
  🔲 Multi-step task decomposition with DAG execution
  🔲 WebSocket streaming for real-time task updates

Phase 3 (Scale) ───────────────────────────────────────
  🔲 Distributed worker pools
  🔲 Smart routing (route tasks to best provider/model)
  🔲 A/B testing different models for quality comparison
  🔲 Contributor reputation and trust scores
  🔲 Automated quality evaluation (LLM-as-judge)
  🔲 Cost prediction ML model
  🔲 GitLab, Bitbucket integrations

Phase 4 (Ecosystem) ───────────────────────────────────
  🔲 Federated ACE networks (cross-project contribution pools)
  🔲 Token marketplace (trade unused budget capacity)
  🔲 AI agent pipelines (multi-agent workflows)
  🔲 Self-improving: ACE uses itself to improve its own codebase
  🔲 Contribution NFTs / on-chain attribution
  🔲 IDE extensions (VS Code, JetBrains)
```

---

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/your-org/ace.git
cd ace
pnpm install
pnpm build

# 2. Start infrastructure
cp .env.example .env  # Configure your secrets
docker-compose up -d postgres redis

# 3. Start ACE
pnpm run dev

# 4. Register your first AI contribution
ace contribute \
  --provider openai \
  --api-key sk-your-key-here \
  --budget 50 \
  --daily-limit 5 \
  --model-tier standard

# 5. Submit a task
ace submit \
  --type code-generation \
  --title "Add input validation to user registration" \
  --description "Add Zod schema validation to the POST /api/users endpoint" \
  --priority high

# 6. Check status
ace status
ace tasks
```

---

This system creates a fundamentally new model for open-source contribution — **donating AI compute instead of (or alongside) code and money** — democratizing access to AI-powered development while keeping costs distributed, budgets controlled, credentials secure, and every token fully auditable.

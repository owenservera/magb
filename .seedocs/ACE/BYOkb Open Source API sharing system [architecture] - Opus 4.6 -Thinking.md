

# ACE: Practical Architecture for Decentralized AI-Powered Knowledge Generation

## The Real System — Not the Idealized One

---

## Part 0: Honest Assessment Before We Build

Before diving into architecture, let me address the hard truths that will determine whether this succeeds or fails:

```
THE CORE TENSIONS:
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  1. You're asking strangers to give you their API keys.             │
│     → This requires EXTRAORDINARY trust engineering.                │
│                                                                     │
│  2. You need AI output quality control at scale.                    │
│     → Bad generations waste donor money and kill trust.             │
│                                                                     │
│  3. The orchestrator sees plaintext keys at execution time.         │
│     → You can encrypt at rest, but must decrypt to call the API.   │
│     → This is an irreducible trust boundary.                        │
│                                                                     │
│  4. Donors need proof their money wasn't wasted.                    │
│     → Every cent must be auditable to the specific output it made. │
│                                                                     │
│  5. "Gamification" without real value = ghost town in 3 weeks.      │
│     → The OUTPUT must be genuinely useful or nobody comes back.     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

The design below addresses each of these head-on.

---

## Part 1: Trust Architecture — The Foundation

The #1 reason this project will live or die: **can donors trust you with their API keys?**

The answer must be: **they never fully have to.**

```
TRUST MODEL: THREE TIERS OF CONTRIBUTION
═════════════════════════════════════════

TIER 1: "PROXY MODE" (Zero Trust Required)
──────────────────────────────────────────
  Contributor runs a local worker process.
  Their key NEVER leaves their machine.
  ACE sends TASKS (prompts), not credentials.
  Worker calls the API locally and returns results.

  ┌──────────────────┐                    ┌──────────────────┐
  │   ACE Central     │ ── task payload ──▶│ Contributor's    │
  │   Orchestrator    │                    │ Local Worker     │
  │                   │◀── result ────────│ (has their key)  │
  └──────────────────┘                    └──────────────────┘
  
  Trust required: None. Key never transmitted.
  Verification: Result hash + timing attestation.
  Downside: Contributor must run a process.

TIER 2: "DELEGATED MODE" (Moderate Trust)
──────────────────────────────────────────
  Contributor creates a SCOPED, CAPPED API key
  specifically for ACE. OpenAI/Anthropic both support:
  - Project-scoped keys (limited to specific project)
  - Spend limits (hard cap at $5, $10, etc.)
  - Rate limits
  - Key revocation
  
  Even if compromised, damage is bounded to the cap.
  
  Trust required: Limited. Blast radius is $5-$10.
  Verification: Provider billing dashboard shows exact usage.

TIER 3: "HOSTED MODE" (Full Trust — for orgs/sponsors)
──────────────────────────────────────────
  Organization provides an API key to the hosted ACE
  instance, encrypted with their public key, stored in
  managed vault infrastructure.
  
  Trust required: High. For corporate sponsors, foundations.
  Verification: Full audit trail + SOC2-style controls.
```

### Practical Implementation: The Worker-First Architecture

```
THE KEY INSIGHT: ACE is NOT an API key aggregator.
ACE is a TASK BROKER. The actual API calls happen at the edges.

                         ┌─────────────────────┐
                         │   ACE Orchestrator   │
                         │                      │
                         │  • Task Queue        │
                         │  • Budget Ledger     │
                         │  • Quality Gate      │
                         │  • Result Store      │
                         └─────────┬───────────┘
                                   │
                    Task Distribution (WebSocket/SSE)
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                     │
    ┌─────────▼──────┐  ┌────────▼────────┐  ┌────────▼────────┐
    │  Worker Node A  │  │  Worker Node B   │  │  Worker Node C   │
    │  (Home PC)      │  │  (Cloud VM)      │  │  (Mac Studio)    │
    │                 │  │                  │  │                  │
    │  Ollama 70B     │  │  OpenAI GPT-4o   │  │  Anthropic       │
    │  FREE (local)   │  │  $10 cap key     │  │  Claude Sonnet   │
    │                 │  │                  │  │  $25 cap key     │
    │  Handles:       │  │  Handles:        │  │  Handles:        │
    │  • Skeleton     │  │  • Deep Gen      │  │  • Deep Gen      │
    │  • Validation   │  │  • Complex tasks │  │  • Validation    │
    │  • Simple gen   │  │                  │  │  • Review        │
    └────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## Part 2: The Actual System Architecture

```
open-blueprint/
├── apps/
│   ├── orchestrator/              # Central brain (Hono/Fastify on Fly.io)
│   │   ├── src/
│   │   │   ├── server.ts
│   │   │   ├── task-broker.ts     # Distributes tasks to workers
│   │   │   ├── budget-ledger.ts   # Tracks every cent
│   │   │   ├── quality-gate.ts    # Validates results before accepting
│   │   │   ├── target-registry.ts # What needs to be generated
│   │   │   └── ws-hub.ts          # WebSocket hub for worker connections
│   │   └── Dockerfile
│   │
│   ├── portal/                    # Next.js web app
│   │   ├── src/app/
│   │   │   ├── page.tsx           # Landing + live generation dashboard
│   │   │   ├── vote/              # Target voting
│   │   │   ├── validate/          # "Tinder for Code" swipe UI
│   │   │   ├── sponsor/           # "Adopt a Language" flow
│   │   │   ├── leaderboard/       # Top donors & validators
│   │   │   └── explore/           # Browse generated knowledge base
│   │   └── Dockerfile
│   │
│   └── prompt-lab/                # Prompt tuning web UI
│       └── src/
│
├── packages/
│   ├── worker/                    # The client workers run this
│   │   ├── src/
│   │   │   ├── index.ts           # Entry: `npx openblueprint-worker`
│   │   │   ├── runner.ts          # Executes tasks locally
│   │   │   ├── providers/         # OpenAI, Anthropic, Ollama, etc.
│   │   │   ├── attestation.ts     # Proves work was done honestly
│   │   │   └── config.ts          # Local config (which key, budget, etc.)
│   │   └── package.json
│   │
│   ├── protocol/                  # Shared types & protocol definitions
│   │   ├── src/
│   │   │   ├── task.ts            # Task payload schemas
│   │   │   ├── result.ts          # Result schemas
│   │   │   ├── messages.ts        # WebSocket message types
│   │   │   └── targets.ts         # Target/language definitions
│   │   └── package.json
│   │
│   ├── pipeline/                  # The 12-stage generation engine
│   │   ├── src/
│   │   │   ├── stages/
│   │   │   │   ├── 01-skeleton-discovery.ts
│   │   │   │   ├── 02-deep-generation.ts
│   │   │   │   ├── 03-validation.ts
│   │   │   │   ├── 04-gap-analysis.ts
│   │   │   │   └── ...
│   │   │   ├── prompts/           # Prompt templates per stage
│   │   │   └── decomposer.ts     # Breaks stages into distributable tasks
│   │   └── package.json
│   │
│   ├── quality/                   # Quality assessment engine
│   │   ├── src/
│   │   │   ├── auto-validator.ts  # Automated checks (syntax, compilation)
│   │   │   ├── cross-validator.ts # Send same task to 2 workers, compare
│   │   │   ├── human-queue.ts     # Queue for human validation
│   │   │   └── scoring.ts         # Confidence scoring
│   │   └── package.json
│   │
│   └── db/                        # Database layer
│       ├── src/
│       │   ├── schema.ts          # Drizzle ORM schema
│       │   ├── migrations/
│       │   └── queries.ts
│       └── package.json
│
├── data/
│   ├── taxonomy.json              # Master taxonomy of targets
│   ├── seed-targets/              # Pre-seeded target definitions
│   └── golden-sets/               # Human-verified reference outputs
│
├── docs/
│   ├── TRUST-MODEL.md             # "How we handle your API keys"
│   ├── CONTRIBUTING.md
│   ├── ARCHITECTURE.md
│   └── WORKER-SETUP.md            # "Start contributing in 60 seconds"
│
├── .devcontainer/                 # GitHub Codespaces config
├── turbo.json
├── docker-compose.yml
└── fly.toml                       # Deploy orchestrator to Fly.io
```

---

## Part 3: The Protocol — How Workers and Orchestrator Communicate

```typescript
// packages/protocol/src/messages.ts

// ═══════════════════════════════════════════════════════
// THE WIRE PROTOCOL
// All communication happens over WebSocket with JSON messages.
// Workers connect TO the orchestrator. Never the reverse.
// ═══════════════════════════════════════════════════════

// ── Worker → Orchestrator ──────────────────────────────

export interface WorkerHello {
  type: 'worker.hello';
  workerId: string;                    // Stable ID derived from machine fingerprint
  workerVersion: string;               // npm package version
  
  // What this worker can do
  capabilities: WorkerCapabilities;
  
  // Authentication
  auth: {
    githubToken: string;               // GitHub OAuth token (proves identity)
    // We NEVER send the API key here
  };
}

export interface WorkerCapabilities {
  // What AI providers are configured locally
  providers: Array<{
    type: 'openai' | 'anthropic' | 'google' | 'ollama' | 'vllm' | 'custom';
    models: string[];                  // e.g., ['gpt-4o-mini', 'gpt-4o']
    tier: 'local-free' | 'economy' | 'standard' | 'premium';
    
    // Budget the contributor has allocated to this project
    budgetCap: {
      totalUSD: number;               // Total they're willing to spend
      remainingUSD: number;           // What's left (self-reported, verified by results)
      maxPerTaskUSD: number;          // Max cost per individual task
    };
    
    // Rate limits (so orchestrator can schedule intelligently)
    rateLimit: {
      requestsPerMinute: number;
      tokensPerMinute: number;
    };
  }>;
  
  // What task types this worker accepts
  acceptedTaskTypes: TaskType[];
  
  // Hardware info (for local GPU workers)
  hardware?: {
    gpuModel?: string;                // e.g., "RTX 4090"
    vramGB?: number;
    cpuCores?: number;
    ramGB?: number;
  };
  
  // Scheduling preferences
  schedule?: {
    timezone: string;
    activeWindows: Array<{ start: string; end: string }>;
    maxConcurrentTasks: number;
  };
}

export interface TaskAccepted {
  type: 'task.accepted';
  taskId: string;
  estimatedDurationMs: number;
}

export interface TaskResult {
  type: 'task.result';
  taskId: string;
  
  result: {
    success: boolean;
    output: string;                    // The actual generated content
    structuredOutput?: any;            // Parsed/structured form
    
    // Proof of work
    attestation: WorkAttestation;
  };
  
  // Cost reporting (worker reports actual spend)
  cost: {
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCostUSD: number;          // Based on public pricing
    latencyMs: number;
  };
  
  // Worker's self-assessment
  confidence: number;                  // 0-1
}

export interface WorkAttestation {
  // Timestamp window
  startedAt: string;                   // ISO timestamp
  completedAt: string;
  
  // Content hashes (proves output wasn't tampered with)
  promptHash: string;                  // SHA-256 of the prompt sent to the model
  outputHash: string;                  // SHA-256 of raw model response
  
  // Provider receipt (if available)
  providerRequestId?: string;          // OpenAI returns request IDs
  
  // Worker signature
  signature: string;                   // HMAC-SHA256 signed with worker's registered secret
}

export interface TaskRejected {
  type: 'task.rejected';
  taskId: string;
  reason: 'budget_exhausted' | 'model_unavailable' | 'rate_limited' | 'task_too_expensive' | 'shutting_down';
}

export interface WorkerHeartbeat {
  type: 'worker.heartbeat';
  workerId: string;
  activeTasks: number;
  budgetRemaining: Record<string, number>;  // provider → remaining USD
  load: number;                        // 0-1 CPU/GPU utilization
}

// ── Orchestrator → Worker ──────────────────────────────

export interface TaskAssignment {
  type: 'task.assign';
  taskId: string;
  
  // The actual work to do (NO API keys — worker uses their own)
  task: {
    type: TaskType;
    stage: PipelineStage;
    target: TargetInfo;
    
    // The prompt to send to the AI
    prompt: {
      system: string;
      user: string;
      // Optional few-shot examples
      examples?: Array<{ input: string; output: string }>;
    };
    
    // Model requirements
    requirements: {
      minModelTier: 'local-free' | 'economy' | 'standard' | 'premium';
      preferredModels?: string[];
      maxTokens: number;
      temperature: number;
      responseFormat?: 'text' | 'json';
    };
    
    // Cost estimate so worker can decide
    estimatedCost: {
      estimatedInputTokens: number;
      estimatedOutputTokens: number;
      estimatedCostUSD: number;        // Worker can reject if too high
    };
    
    // Context (relevant existing knowledge)
    context?: {
      existingNodes?: any[];           // Already-generated sibling nodes
      parentNode?: any;                // Parent in the knowledge tree
      referenceOutput?: string;        // Golden example to emulate
    };
  };
  
  // Deadline
  deadline: string;                    // ISO timestamp — return result by this time or it's reassigned
}

export interface TaskCancelled {
  type: 'task.cancelled';
  taskId: string;
  reason: string;
}

export interface OrchestratorAck {
  type: 'orchestrator.ack';
  workerId: string;
  assignedQueue: string;               // Which priority queue this worker is in
  poolStats: {
    totalWorkers: number;
    totalBudgetUSD: number;
    activeGenerations: number;
    targetsCompleted: number;
    targetsRemaining: number;
  };
}

// ── Types ──────────────────────────────────────────────

export type TaskType = 
  | 'skeleton-discovery'       // Stage 1: Identify the concept tree
  | 'deep-generation'          // Stage 2: Generate detailed knowledge
  | 'code-example'             // Generate runnable code examples  
  | 'validation'               // Validate generated content
  | 'gap-analysis'             // Find missing concepts
  | 'gap-fill'                 // Fill identified gaps
  | 'cross-reference'          // Link related concepts
  | 'summary'                  // Generate summaries
  | 'metadata-enrichment'      // Add tags, difficulty, prerequisites
  | 'human-validation-prep';   // Prepare content for human review

export type PipelineStage = 
  | 'discovery' | 'generation' | 'validation' 
  | 'enrichment' | 'integration' | 'review';

export interface TargetInfo {
  id: string;                          // e.g., 'python-3.12'
  name: string;                        // e.g., 'Python 3.12'
  category: 'language' | 'format' | 'protocol' | 'framework' | 'standard';
  sponsoredBy?: string[];              // GitHub usernames of sponsors
}
```

---

## Part 4: The Worker — What Contributors Actually Run

```typescript
// packages/worker/src/index.ts

#!/usr/bin/env node

/**
 * OpenBlueprint Worker
 * 
 * Usage:
 *   npx openblueprint-worker                    # Interactive setup
 *   npx openblueprint-worker --provider openai   # Quick start with env vars
 *   npx openblueprint-worker --config ./my-config.yml
 * 
 * Your API keys NEVER leave your machine.
 * The orchestrator sends prompts, your machine calls the AI, you send back results.
 */

import { Command } from 'commander';
import { WorkerDaemon } from './daemon';
import { interactiveSetup } from './setup';
import { loadConfig, WorkerConfig } from './config';
import chalk from 'chalk';
import ora from 'ora';

const program = new Command();

program
  .name('openblueprint-worker')
  .description(
    '🤖 Contribute your AI API tokens to help build the universal knowledge base.\n' +
    '   Your API keys never leave your machine.'
  )
  .version('0.1.0');

program
  .command('start', { isDefault: true })
  .description('Start the worker and begin accepting tasks')
  .option('-p, --provider <provider>', 'AI provider (openai, anthropic, ollama)')
  .option('-k, --api-key <key>', 'API key (or set via OPENAI_API_KEY, ANTHROPIC_API_KEY)')
  .option('-b, --budget <usd>', 'Maximum USD to spend', '10')
  .option('-m, --models <models>', 'Comma-separated model list')
  .option('-c, --config <path>', 'Path to config file')
  .option('--max-concurrent <n>', 'Max concurrent tasks', '2')
  .option('--orchestrator <url>', 'Orchestrator URL', 'wss://ace.openblueprint.dev/ws')
  .action(async (options) => {
    console.log(chalk.bold('\n  🏗️  OpenBlueprint Worker\n'));
    console.log(chalk.dim('  "Your spare AI tokens, building humanity\'s knowledge base."\n'));

    let config: WorkerConfig;

    if (options.config) {
      config = await loadConfig(options.config);
    } else if (options.provider) {
      config = buildConfigFromFlags(options);
    } else {
      // Interactive setup
      config = await interactiveSetup();
    }

    // Validate the configuration
    const spinner = ora('Validating your AI provider connection...').start();
    
    try {
      await validateProviderConnection(config);
      spinner.succeed('Provider connection verified');
    } catch (error) {
      spinner.fail(`Provider connection failed: ${(error as Error).message}`);
      process.exit(1);
    }

    // Display summary
    console.log('\n' + chalk.bold('  Configuration:'));
    console.log(`  ${chalk.dim('Provider:')}     ${config.provider.type}`);
    console.log(`  ${chalk.dim('Models:')}       ${config.provider.models.join(', ')}`);
    console.log(`  ${chalk.dim('Budget Cap:')}   $${config.budget.totalUSD}`);
    console.log(`  ${chalk.dim('Per Task Max:')} $${config.budget.maxPerTaskUSD}`);
    console.log(`  ${chalk.dim('Concurrent:')}   ${config.maxConcurrentTasks}`);
    console.log(`  ${chalk.dim('Orchestrator:')} ${config.orchestratorUrl}\n`);
    
    console.log(chalk.green.bold('  ✓ Your API key stays on this machine. Always.\n'));

    // Start the daemon
    const daemon = new WorkerDaemon(config);
    
    // Graceful shutdown
    const shutdown = async () => {
      console.log(chalk.yellow('\n  Shutting down gracefully...'));
      await daemon.shutdown();
      const stats = daemon.getSessionStats();
      
      console.log('\n' + chalk.bold('  Session Summary:'));
      console.log(`  ${chalk.dim('Tasks completed:')}  ${stats.tasksCompleted}`);
      console.log(`  ${chalk.dim('Tokens used:')}      ${stats.totalTokens.toLocaleString()}`);
      console.log(`  ${chalk.dim('Estimated spend:')}  $${stats.estimatedSpendUSD.toFixed(4)}`);
      console.log(`  ${chalk.dim('Uptime:')}           ${formatDuration(stats.uptimeMs)}\n`);
      
      console.log(chalk.green('  Thank you for contributing! 💚\n'));
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    await daemon.start();
  });

program
  .command('setup')
  .description('Interactive setup wizard')
  .action(async () => {
    const config = await interactiveSetup();
    await saveConfig(config, '.openblueprint-worker.yml');
    console.log(chalk.green('\n  ✓ Configuration saved to .openblueprint-worker.yml'));
    console.log(chalk.dim('  Run `npx openblueprint-worker` to start.\n'));
  });

program
  .command('status')
  .description('Check connection to orchestrator')
  .action(async () => {
    // Check orchestrator health and display pool stats
  });

program.parse();


// ═══════════════════════════════════════════════════════
// THE WORKER DAEMON
// ═══════════════════════════════════════════════════════

// packages/worker/src/daemon.ts

import WebSocket from 'ws';
import { AIRunner } from './runner';
import { BudgetTracker } from './budget-tracker';
import type { 
  WorkerHello, 
  TaskAssignment, 
  TaskResult, 
  WorkerHeartbeat,
  TaskRejected 
} from '@openblueprint/protocol';

export class WorkerDaemon {
  private ws: WebSocket | null = null;
  private runner: AIRunner;
  private budget: BudgetTracker;
  private activeTasks = new Map<string, AbortController>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 50;
  private stats = {
    tasksCompleted: 0,
    tasksFailed: 0,
    totalTokens: 0,
    estimatedSpendUSD: 0,
    startedAt: Date.now(),
  };

  constructor(private config: WorkerConfig) {
    this.runner = new AIRunner(config.provider);
    this.budget = new BudgetTracker(config.budget);
  }

  async start(): Promise<void> {
    await this.connect();
  }

  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(chalk.dim(`  Connecting to ${this.config.orchestratorUrl}...`));
      
      this.ws = new WebSocket(this.config.orchestratorUrl, {
        headers: {
          'X-Worker-Version': '0.1.0',
        },
      });

      this.ws.on('open', () => {
        this.reconnectAttempts = 0;
        console.log(chalk.green('  ✓ Connected to orchestrator'));
        
        // Send hello with capabilities
        this.sendHello();
        
        // Start heartbeat
        this.startHeartbeat();
        
        resolve();
      });

      this.ws.on('message', (data) => {
        this.handleMessage(JSON.parse(data.toString()));
      });

      this.ws.on('close', (code) => {
        console.log(chalk.yellow(`  Connection closed (${code}). Reconnecting...`));
        this.scheduleReconnect();
      });

      this.ws.on('error', (error) => {
        console.error(chalk.red(`  WebSocket error: ${error.message}`));
      });
    });
  }

  private sendHello(): void {
    const hello: WorkerHello = {
      type: 'worker.hello',
      workerId: this.config.workerId,
      workerVersion: '0.1.0',
      capabilities: {
        providers: [{
          type: this.config.provider.type,
          models: this.config.provider.models,
          tier: this.config.provider.tier,
          budgetCap: {
            totalUSD: this.config.budget.totalUSD,
            remainingUSD: this.budget.remaining(),
            maxPerTaskUSD: this.config.budget.maxPerTaskUSD,
          },
          rateLimit: this.config.provider.rateLimit,
        }],
        acceptedTaskTypes: this.config.acceptedTaskTypes ?? [
          'skeleton-discovery', 'deep-generation', 'code-example',
          'validation', 'gap-analysis', 'gap-fill',
          'summary', 'metadata-enrichment',
        ],
        hardware: this.config.hardware,
        schedule: this.config.schedule,
      },
      auth: {
        githubToken: this.config.githubToken,
      },
    };

    this.send(hello);
  }

  private async handleMessage(msg: any): Promise<void> {
    switch (msg.type) {
      case 'orchestrator.ack':
        console.log(chalk.dim(
          `  Pool: ${msg.poolStats.totalWorkers} workers, ` +
          `$${msg.poolStats.totalBudgetUSD.toFixed(0)} budget, ` +
          `${msg.poolStats.targetsCompleted}/${msg.poolStats.targetsCompleted + msg.poolStats.targetsRemaining} targets done`
        ));
        break;

      case 'task.assign':
        await this.handleTaskAssignment(msg as TaskAssignment);
        break;

      case 'task.cancelled':
        this.handleTaskCancellation(msg.taskId);
        break;
        
      default:
        console.log(chalk.dim(`  Unknown message type: ${msg.type}`));
    }
  }

  private async handleTaskAssignment(assignment: TaskAssignment): Promise<void> {
    const { taskId, task } = assignment;
    
    // ── Budget Check ──────────────────────────────────
    // Worker INDEPENDENTLY verifies it can afford this task.
    // Never trust the orchestrator's estimate blindly.
    if (!this.budget.canAfford(task.estimatedCost.estimatedCostUSD)) {
      console.log(chalk.yellow(
        `  ⚠ Rejecting task ${taskId}: budget exhausted ` +
        `($${this.budget.remaining().toFixed(4)} remaining)`
      ));
      
      this.send({
        type: 'task.rejected',
        taskId,
        reason: 'budget_exhausted',
      } as TaskRejected);
      return;
    }

    // ── Per-task cost check ───────────────────────────
    if (task.estimatedCost.estimatedCostUSD > this.config.budget.maxPerTaskUSD) {
      this.send({
        type: 'task.rejected',
        taskId,
        reason: 'task_too_expensive',
      } as TaskRejected);
      return;
    }

    // ── Concurrency check ─────────────────────────────
    if (this.activeTasks.size >= this.config.maxConcurrentTasks) {
      this.send({
        type: 'task.rejected',
        taskId,
        reason: 'rate_limited',
      } as TaskRejected);
      return;
    }

    // ── Accept and execute ────────────────────────────
    const abortController = new AbortController();
    this.activeTasks.set(taskId, abortController);
    
    this.send({
      type: 'task.accepted',
      taskId,
      estimatedDurationMs: this.estimateDuration(task),
    });

    const taskLabel = `[${task.stage}/${task.type}] ${task.target.name}`;
    console.log(chalk.cyan(`  → Executing: ${taskLabel}`));

    try {
      // ── THE ACTUAL AI CALL HAPPENS HERE ────────────
      // On the contributor's machine, with their key.
      // The orchestrator never sees the key.
      const startedAt = new Date().toISOString();
      
      const aiResult = await this.runner.execute({
        prompt: task.prompt,
        requirements: task.requirements,
        context: task.context,
        signal: abortController.signal,
      });
      
      const completedAt = new Date().toISOString();

      // Record spend locally
      this.budget.recordSpend(aiResult.estimatedCostUSD);
      this.stats.tasksCompleted++;
      this.stats.totalTokens += aiResult.totalTokens;
      this.stats.estimatedSpendUSD += aiResult.estimatedCostUSD;

      // Build attestation
      const attestation = await this.buildAttestation(
        task.prompt, 
        aiResult.rawOutput,
        startedAt,
        completedAt,
        aiResult.providerRequestId
      );

      // Send result back
      const result: TaskResult = {
        type: 'task.result',
        taskId,
        result: {
          success: true,
          output: aiResult.rawOutput,
          structuredOutput: aiResult.structuredOutput,
          attestation,
        },
        cost: {
          provider: this.config.provider.type,
          model: aiResult.model,
          inputTokens: aiResult.inputTokens,
          outputTokens: aiResult.outputTokens,
          totalTokens: aiResult.totalTokens,
          estimatedCostUSD: aiResult.estimatedCostUSD,
          latencyMs: aiResult.latencyMs,
        },
        confidence: aiResult.confidence,
      };

      this.send(result);
      
      console.log(chalk.green(
        `  ✓ Completed: ${taskLabel} ` +
        `(${aiResult.totalTokens} tokens, $${aiResult.estimatedCostUSD.toFixed(4)}, ${aiResult.latencyMs}ms)`
      ));
      console.log(chalk.dim(
        `    Budget remaining: $${this.budget.remaining().toFixed(4)} / $${this.config.budget.totalUSD}`
      ));

    } catch (error) {
      this.stats.tasksFailed++;
      
      console.log(chalk.red(
        `  ✗ Failed: ${taskLabel} — ${(error as Error).message}`
      ));

      this.send({
        type: 'task.result',
        taskId,
        result: {
          success: false,
          output: '',
          attestation: {
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            promptHash: '',
            outputHash: '',
            signature: '',
          },
        },
        cost: {
          provider: this.config.provider.type,
          model: 'unknown',
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          estimatedCostUSD: 0,
          latencyMs: 0,
        },
        confidence: 0,
      } as TaskResult);
    } finally {
      this.activeTasks.delete(taskId);
    }
  }

  private async buildAttestation(
    prompt: any,
    output: string,
    startedAt: string,
    completedAt: string,
    providerRequestId?: string,
  ): Promise<WorkAttestation> {
    const crypto = await import('crypto');
    
    const promptStr = JSON.stringify(prompt);
    const promptHash = crypto.createHash('sha256').update(promptStr).digest('hex');
    const outputHash = crypto.createHash('sha256').update(output).digest('hex');
    
    // Sign with worker's secret (registered during setup)
    const signaturePayload = `${promptHash}:${outputHash}:${startedAt}:${completedAt}`;
    const signature = crypto
      .createHmac('sha256', this.config.workerSecret)
      .update(signaturePayload)
      .digest('hex');

    return {
      startedAt,
      completedAt,
      promptHash,
      outputHash,
      providerRequestId,
      signature,
    };
  }

  private startHeartbeat(): void {
    setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({
          type: 'worker.heartbeat',
          workerId: this.config.workerId,
          activeTasks: this.activeTasks.size,
          budgetRemaining: {
            [this.config.provider.type]: this.budget.remaining(),
          },
          load: this.activeTasks.size / this.config.maxConcurrentTasks,
        } as WorkerHeartbeat);
      }
    }, 15_000); // Every 15 seconds
  }

  private send(msg: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(chalk.red('  Max reconnection attempts reached. Exiting.'));
      process.exit(1);
    }
    
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 60000);
    this.reconnectAttempts++;
    
    setTimeout(() => this.connect(), delay);
  }

  private handleTaskCancellation(taskId: string): void {
    const controller = this.activeTasks.get(taskId);
    if (controller) {
      controller.abort();
      this.activeTasks.delete(taskId);
      console.log(chalk.yellow(`  ⚠ Task ${taskId} cancelled by orchestrator`));
    }
  }

  private estimateDuration(task: any): number {
    // Rough estimate based on task type
    const estimates: Record<string, number> = {
      'skeleton-discovery': 15000,
      'deep-generation': 30000,
      'code-example': 20000,
      'validation': 10000,
      'gap-analysis': 20000,
      'summary': 10000,
    };
    return estimates[task.type] ?? 20000;
  }

  async shutdown(): Promise<void> {
    // Cancel active tasks gracefully
    for (const [taskId, controller] of this.activeTasks) {
      controller.abort();
      this.send({
        type: 'task.rejected',
        taskId,
        reason: 'shutting_down',
      });
    }
    
    this.ws?.close(1000, 'Worker shutting down');
  }

  getSessionStats() {
    return {
      ...this.stats,
      uptimeMs: Date.now() - this.stats.startedAt,
    };
  }
}
```

### The AI Runner (Executes prompts locally)

```typescript
// packages/worker/src/runner.ts

import type { ChatCompletionRequest } from './providers/types';

export interface ExecutionResult {
  rawOutput: string;
  structuredOutput?: any;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUSD: number;
  latencyMs: number;
  providerRequestId?: string;
  confidence: number;
}

export class AIRunner {
  private provider: BaseProvider;

  constructor(private config: ProviderConfig) {
    this.provider = createProvider(config);
  }

  async execute(params: {
    prompt: { system: string; user: string; examples?: Array<{ input: string; output: string }> };
    requirements: { 
      minModelTier: string; 
      preferredModels?: string[];
      maxTokens: number; 
      temperature: number;
      responseFormat?: 'text' | 'json';
    };
    context?: any;
    signal?: AbortSignal;
  }): Promise<ExecutionResult> {
    
    // Select the best model available locally
    const model = this.selectModel(params.requirements);
    
    // Build messages
    const messages: ChatMessage[] = [];
    
    // System prompt
    messages.push({ role: 'system', content: params.prompt.system });
    
    // Few-shot examples
    if (params.prompt.examples?.length) {
      for (const example of params.prompt.examples) {
        messages.push({ role: 'user', content: example.input });
        messages.push({ role: 'assistant', content: example.output });
      }
    }
    
    // Context injection
    if (params.context?.existingNodes?.length) {
      const contextStr = params.context.existingNodes
        .map((n: any) => `[Existing: ${n.title}]\n${n.summary}`)
        .join('\n\n');
      messages.push({ 
        role: 'user', 
        content: `Here is relevant context from already-generated knowledge:\n\n${contextStr}` 
      });
    }
    
    // Main user prompt
    messages.push({ role: 'user', content: params.prompt.user });

    // Execute the AI call
    const start = Date.now();
    
    const response = await this.provider.chat({
      model,
      messages,
      temperature: params.requirements.temperature,
      maxTokens: params.requirements.maxTokens,
      responseFormat: params.requirements.responseFormat === 'json' 
        ? { type: 'json_object' } 
        : undefined,
      signal: params.signal,
    });

    const latencyMs = Date.now() - start;

    // Parse structured output if JSON was requested
    let structuredOutput: any;
    if (params.requirements.responseFormat === 'json') {
      try {
        structuredOutput = JSON.parse(response.content);
      } catch {
        // JSON parse failed — lower confidence
      }
    }

    // Estimate cost
    const costUSD = this.provider.estimateCost(
      response.usage.inputTokens,
      response.usage.outputTokens,
      model
    );

    // Self-assess confidence
    const confidence = this.assessConfidence(response, params.requirements);

    return {
      rawOutput: response.content,
      structuredOutput,
      model,
      inputTokens: response.usage.inputTokens,
      outputTokens: response.usage.outputTokens,
      totalTokens: response.usage.totalTokens,
      estimatedCostUSD: costUSD,
      latencyMs,
      providerRequestId: response.id,
      confidence,
    };
  }

  private selectModel(requirements: any): string {
    const available = this.config.models;
    
    // If orchestrator has preferred models, try those first
    if (requirements.preferredModels?.length) {
      const preferred = requirements.preferredModels.find(
        (m: string) => available.includes(m)
      );
      if (preferred) return preferred;
    }
    
    // Otherwise, use the best available model
    return available[0];
  }

  private assessConfidence(response: any, requirements: any): number {
    let confidence = 0.7; // Base confidence
    
    // Higher confidence if the response is well-formed
    if (requirements.responseFormat === 'json') {
      try {
        JSON.parse(response.content);
        confidence += 0.1;
      } catch {
        confidence -= 0.3;
      }
    }
    
    // If the response was truncated (hit max tokens), lower confidence
    if (response.finishReason === 'length') {
      confidence -= 0.2;
    }
    
    // If the response is very short for a generation task, suspicious
    if (response.content.length < 100) {
      confidence -= 0.2;
    }
    
    return Math.max(0, Math.min(1, confidence));
  }
}
```

### Interactive Setup Wizard

```typescript
// packages/worker/src/setup.ts

import inquirer from 'inquirer';
import chalk from 'chalk';
import { WorkerConfig } from './config';
import { machineId } from 'node-machine-id';
import crypto from 'crypto';

export async function interactiveSetup(): Promise<WorkerConfig> {
  console.log(chalk.bold('\n  🏗️  OpenBlueprint Worker Setup\n'));
  console.log(chalk.dim('  This wizard helps you configure your worker.'));
  console.log(chalk.dim('  Your API keys NEVER leave this machine.\n'));

  // Step 1: GitHub Auth
  console.log(chalk.bold('  Step 1: Identity'));
  const { authMethod } = await inquirer.prompt([{
    type: 'list',
    name: 'authMethod',
    message: 'How would you like to authenticate?',
    choices: [
      { name: 'GitHub (recommended — links to your profile)', value: 'github' },
      { name: 'Anonymous (no attribution)', value: 'anonymous' },
    ],
  }]);

  let githubToken = '';
  if (authMethod === 'github') {
    // Open browser for GitHub device flow OAuth
    githubToken = await githubDeviceAuth();
  }

  // Step 2: AI Provider
  console.log(chalk.bold('\n  Step 2: AI Provider'));
  const { provider } = await inquirer.prompt([{
    type: 'list',
    name: 'provider',
    message: 'Which AI provider do you want to contribute?',
    choices: [
      { name: '🟢 Ollama (FREE — runs on your GPU)', value: 'ollama' },
      { name: '💚 OpenAI (uses your API key)', value: 'openai' },
      { name: '💜 Anthropic (uses your API key)', value: 'anthropic' },
      { name: '🔵 Google Gemini (uses your API key)', value: 'google' },
      { name: '🟠 Groq (fast, free tier available)', value: 'groq' },
      { name: '⚡ Together AI', value: 'together' },
      { name: '🔧 Custom OpenAI-compatible endpoint', value: 'custom' },
    ],
  }]);

  let apiKey = '';
  let models: string[] = [];
  let tier: string = 'economy';

  if (provider === 'ollama') {
    // Check if Ollama is running
    console.log(chalk.dim('  Checking for local Ollama installation...'));
    const ollamaModels = await detectOllamaModels();
    
    if (ollamaModels.length === 0) {
      console.log(chalk.yellow('  Ollama not detected. Install from https://ollama.com'));
      console.log(chalk.dim('  Then run: ollama pull llama3.1:70b'));
      process.exit(1);
    }
    
    const { selectedModels } = await inquirer.prompt([{
      type: 'checkbox',
      name: 'selectedModels',
      message: 'Which Ollama models should the worker use?',
      choices: ollamaModels.map(m => ({ name: `${m.name} (${m.size})`, value: m.name })),
    }]);
    
    models = selectedModels;
    tier = 'local-free';
  } else {
    const keyEnvVar = {
      openai: 'OPENAI_API_KEY',
      anthropic: 'ANTHROPIC_API_KEY',
      google: 'GOOGLE_API_KEY',
      groq: 'GROQ_API_KEY',
      together: 'TOGETHER_API_KEY',
    }[provider] ?? '';

    const envKey = process.env[keyEnvVar];
    
    if (envKey) {
      const { useEnv } = await inquirer.prompt([{
        type: 'confirm',
        name: 'useEnv',
        message: `Found ${keyEnvVar} in environment. Use it?`,
        default: true,
      }]);
      if (useEnv) apiKey = envKey;
    }
    
    if (!apiKey) {
      const { inputKey } = await inquirer.prompt([{
        type: 'password',
        name: 'inputKey',
        message: `Enter your ${provider} API key:`,
        mask: '*',
      }]);
      apiKey = inputKey;
    }

    // Recommend specific models
    const modelChoices = getRecommendedModels(provider);
    const { selectedModels } = await inquirer.prompt([{
      type: 'checkbox',
      name: 'selectedModels',
      message: 'Which models can the worker use?',
      choices: modelChoices,
      validate: (ans: string[]) => ans.length > 0 || 'Select at least one model',
    }]);
    
    models = selectedModels;
    tier = modelChoices.find(m => selectedModels.includes(m.value))?.tier ?? 'economy';
  }

  // Step 3: Budget
  console.log(chalk.bold('\n  Step 3: Budget'));
  
  if (tier === 'local-free') {
    console.log(chalk.green('  You\'re using local models — no API cost! 🎉'));
  } else {
    console.log(chalk.dim('  Set a hard cap on how much the worker can spend.'));
    console.log(chalk.dim('  Pro tip: Create a project-specific API key with a spend limit too.\n'));
    
    const { totalBudget, perTaskBudget } = await inquirer.prompt([
      {
        type: 'list',
        name: 'totalBudget',
        message: 'Maximum total spend for this contribution:',
        choices: [
          { name: '$1 (just trying it out)', value: 1 },
          { name: '$5 (casual contributor)', value: 5 },
          { name: '$10 (regular contributor)', value: 10 },
          { name: '$25 (dedicated contributor)', value: 25 },
          { name: '$50 (power contributor)', value: 50 },
          { name: '$100 (sponsor tier)', value: 100 },
          { name: 'Custom amount', value: -1 },
        ],
      },
      {
        type: 'number',
        name: 'perTaskBudget',
        message: 'Maximum spend per individual task (USD):',
        default: 0.50,
      },
    ]);

    var budget = {
      totalUSD: totalBudget === -1 ? await promptCustomAmount() : totalBudget,
      maxPerTaskUSD: perTaskBudget,
    };
  }

  // Step 4: Task Preferences
  console.log(chalk.bold('\n  Step 4: What should your worker do?'));
  
  const { taskTypes } = await inquirer.prompt([{
    type: 'checkbox',
    name: 'taskTypes',
    message: 'Which types of tasks should your worker handle?',
    choices: [
      { name: '🗂️  Skeleton Discovery (discover concept trees — cheap)', value: 'skeleton-discovery', checked: true },
      { name: '📖  Deep Generation (generate detailed knowledge — moderate)', value: 'deep-generation', checked: true },
      { name: '💻  Code Examples (generate runnable examples — moderate)', value: 'code-example', checked: true },
      { name: '✅  Validation (verify generated content — cheap)', value: 'validation', checked: true },
      { name: '🔍  Gap Analysis (find missing concepts — moderate)', value: 'gap-analysis', checked: true },
      { name: '📝  Summaries (generate summaries — cheap)', value: 'summary', checked: true },
    ],
  }]);

  // Step 5: Generate worker identity
  const workerId = await generateWorkerId();
  const workerSecret = crypto.randomBytes(32).toString('hex');

  console.log(chalk.bold('\n  Step 5: Ready to go!'));
  console.log(chalk.dim(`  Worker ID: ${workerId.substring(0, 12)}...`));

  return {
    workerId,
    workerSecret,
    githubToken,
    orchestratorUrl: 'wss://ace.openblueprint.dev/ws',
    provider: {
      type: provider,
      apiKey,
      models,
      tier: tier as any,
      rateLimit: getDefaultRateLimit(provider),
    },
    budget: budget ?? { totalUSD: Infinity, maxPerTaskUSD: Infinity },
    acceptedTaskTypes: taskTypes,
    maxConcurrentTasks: tier === 'local-free' ? 1 : 2,
  };
}

function getRecommendedModels(provider: string) {
  const models: Record<string, Array<{ name: string; value: string; tier: string }>> = {
    openai: [
      { name: 'gpt-4o-mini (cheap, fast — recommended for most tasks)', value: 'gpt-4o-mini', tier: 'economy' },
      { name: 'gpt-4o (powerful — for complex generation)', value: 'gpt-4o', tier: 'standard' },
      { name: 'o3-mini (reasoning — for validation tasks)', value: 'o3-mini', tier: 'premium' },
    ],
    anthropic: [
      { name: 'claude-3-5-haiku (cheap, fast)', value: 'claude-3-5-haiku-20241022', tier: 'economy' },
      { name: 'claude-sonnet-4 (balanced — recommended)', value: 'claude-sonnet-4-20250514', tier: 'standard' },
      { name: 'claude-3-opus (most capable)', value: 'claude-3-opus-20240229', tier: 'premium' },
    ],
    google: [
      { name: 'gemini-2.0-flash (fast, cheap)', value: 'gemini-2.0-flash', tier: 'economy' },
      { name: 'gemini-2.5-pro (powerful)', value: 'gemini-2.5-pro', tier: 'standard' },
    ],
    groq: [
      { name: 'llama-3.3-70b (fast, free tier)', value: 'llama-3.3-70b-versatile', tier: 'economy' },
      { name: 'mixtral-8x7b', value: 'mixtral-8x7b-32768', tier: 'economy' },
    ],
  };
  return models[provider] ?? [];
}

async function generateWorkerId(): Promise<string> {
  const mid = await machineId();
  return crypto.createHash('sha256').update(`openblueprint:${mid}`).digest('hex');
}
```

---

## Part 5: The Orchestrator — Central Brain

```typescript
// apps/orchestrator/src/task-broker.ts

import { EventEmitter } from 'events';
import type {
  TaskAssignment,
  TaskResult,
  WorkerHello,
  WorkerHeartbeat,
  WorkerCapabilities,
  TaskType,
  PipelineStage,
} from '@openblueprint/protocol';

interface ConnectedWorker {
  id: string;
  ws: WebSocket;
  capabilities: WorkerCapabilities;
  githubUser?: string;
  
  // Live state
  activeTasks: Set<string>;
  lastHeartbeat: Date;
  load: number;                        // 0-1
  budgetRemaining: Record<string, number>;
  
  // Stats
  tasksCompleted: number;
  tasksFailed: number;
  totalTokensContributed: number;
  totalCostContributed: number;
  
  connectedAt: Date;
}

interface QueuedTask {
  id: string;
  assignment: TaskAssignment;
  priority: number;                    // Higher = more urgent
  enqueuedAt: Date;
  deadline: Date;
  attempts: number;
  maxAttempts: number;
  
  // Routing constraints
  requiredTier: string;
  estimatedCostUSD: number;
  
  // For cross-validation
  requiresCrossValidation: boolean;
  existingResults: TaskResult[];       // If we need N results to compare
}

export class TaskBroker extends EventEmitter {
  private workers = new Map<string, ConnectedWorker>();
  private taskQueue: QueuedTask[] = [];                    // Priority queue
  private activeTasks = new Map<string, QueuedTask>();     // taskId → task
  private results = new Map<string, TaskResult[]>();       // taskId → results
  
  // Processing loop
  private processInterval: NodeJS.Timeout | null = null;

  constructor(
    private budgetLedger: BudgetLedger,
    private qualityGate: QualityGate,
    private resultStore: ResultStore,
    private targetRegistry: TargetRegistry,
  ) {
    super();
  }

  start(): void {
    // Process queue every 500ms
    this.processInterval = setInterval(() => this.processQueue(), 500);
    
    // Stale worker cleanup every 60s
    setInterval(() => this.cleanupStaleWorkers(), 60_000);
    
    // Deadline enforcement every 10s
    setInterval(() => this.enforceDeadlines(), 10_000);
    
    console.log('TaskBroker started');
  }

  // ── Worker Lifecycle ─────────────────────────────────

  registerWorker(ws: WebSocket, hello: WorkerHello): void {
    // Verify GitHub identity
    // (In production: verify the GitHub token is valid)
    
    const worker: ConnectedWorker = {
      id: hello.workerId,
      ws,
      capabilities: hello.capabilities,
      githubUser: undefined, // Resolved from GitHub token
      activeTasks: new Set(),
      lastHeartbeat: new Date(),
      load: 0,
      budgetRemaining: {},
      tasksCompleted: 0,
      tasksFailed: 0,
      totalTokensContributed: 0,
      totalCostContributed: 0,
      connectedAt: new Date(),
    };

    // Populate budget from capabilities
    for (const provider of hello.capabilities.providers) {
      worker.budgetRemaining[provider.type] = provider.budgetCap.remainingUSD;
    }

    this.workers.set(hello.workerId, worker);
    
    // Update global pool budget
    this.budgetLedger.registerWorkerBudget(hello.workerId, hello.capabilities.providers);

    // Send acknowledgment with pool stats
    this.sendToWorker(worker, {
      type: 'orchestrator.ack',
      workerId: hello.workerId,
      assignedQueue: this.determineQueue(hello.capabilities),
      poolStats: this.getPoolStats(),
    });

    this.emit('worker:connected', worker);
    console.log(
      `Worker connected: ${hello.workerId.substring(0, 12)}... ` +
      `(${hello.capabilities.providers.map(p => p.type).join(', ')})`
    );
  }

  handleHeartbeat(heartbeat: WorkerHeartbeat): void {
    const worker = this.workers.get(heartbeat.workerId);
    if (!worker) return;
    
    worker.lastHeartbeat = new Date();
    worker.load = heartbeat.load;
    worker.budgetRemaining = heartbeat.budgetRemaining;
    
    // Update ledger with latest budget
    this.budgetLedger.updateWorkerBudget(heartbeat.workerId, heartbeat.budgetRemaining);
  }

  removeWorker(workerId: string): void {
    const worker = this.workers.get(workerId);
    if (!worker) return;
    
    // Re-queue any active tasks
    for (const taskId of worker.activeTasks) {
      const task = this.activeTasks.get(taskId);
      if (task) {
        task.attempts++;
        if (task.attempts < task.maxAttempts) {
          this.taskQueue.push(task);
          this.sortQueue();
        }
        this.activeTasks.delete(taskId);
      }
    }
    
    this.budgetLedger.removeWorkerBudget(workerId);
    this.workers.delete(workerId);
    
    this.emit('worker:disconnected', workerId);
    console.log(`Worker disconnected: ${workerId.substring(0, 12)}...`);
  }

  // ── Task Submission ──────────────────────────────────

  submitTask(task: QueuedTask): void {
    this.taskQueue.push(task);
    this.sortQueue();
    
    this.emit('task:queued', task);
  }

  /**
   * Submit a batch of tasks for a pipeline stage.
   * Used by the pipeline engine to decompose a generation target
   * into distributable work units.
   */
  submitBatch(tasks: QueuedTask[]): void {
    for (const task of tasks) {
      this.taskQueue.push(task);
    }
    this.sortQueue();
    
    this.emit('batch:queued', { count: tasks.length });
  }

  // ── Task Processing Loop ────────────────────────────

  private processQueue(): void {
    if (this.taskQueue.length === 0) return;

    // For each queued task, try to find a suitable worker
    const unassigned: QueuedTask[] = [];

    for (const task of this.taskQueue) {
      const worker = this.findBestWorker(task);
      
      if (worker) {
        this.assignTaskToWorker(task, worker);
      } else {
        unassigned.push(task);
      }
    }

    this.taskQueue = unassigned;
  }

  private findBestWorker(task: QueuedTask): ConnectedWorker | null {
    const candidates: Array<{ worker: ConnectedWorker; score: number }> = [];

    for (const worker of this.workers.values()) {
      // ── Eligibility Checks ──────────────────────────
      
      // Worker must accept this task type
      const taskType = task.assignment.task.type;
      if (!worker.capabilities.acceptedTaskTypes.includes(taskType)) {
        continue;
      }

      // Worker must have capacity
      const maxConcurrent = worker.capabilities.schedule?.maxConcurrentTasks ?? 2;
      if (worker.activeTasks.size >= maxConcurrent) {
        continue;
      }

      // Worker must have a provider that meets the tier requirement
      const suitableProvider = worker.capabilities.providers.find(p => {
        const tierOrder: Record<string, number> = { 'local-free': 0, economy: 1, standard: 2, premium: 3 };
        return tierOrder[p.tier] >= tierOrder[task.requiredTier];
      });
      
      if (!suitableProvider) {
        continue;
      }

      // Worker must have budget remaining
      const remaining = worker.budgetRemaining[suitableProvider.type] ?? 0;
      if (suitableProvider.tier !== 'local-free' && remaining < task.estimatedCostUSD) {
        continue;
      }

      // ── Scoring ─────────────────────────────────────
      
      let score = 0;
      
      // Prefer less loaded workers
      score += (1 - worker.load) * 30;
      
      // Prefer workers with more budget remaining (they can handle more tasks)
      score += Math.min(remaining / 10, 20);
      
      // Prefer workers that have completed more tasks successfully (reliability)
      const reliability = worker.tasksCompleted / Math.max(worker.tasksCompleted + worker.tasksFailed, 1);
      score += reliability * 25;
      
      // Prefer local/free workers for cheap tasks
      if (suitableProvider.tier === 'local-free' && task.requiredTier !== 'premium') {
        score += 40; // Strong preference for free compute
      }
      
      // Prefer workers with the preferred model available
      const preferred = task.assignment.task.requirements.preferredModels;
      if (preferred?.some(m => suitableProvider.models.includes(m))) {
        score += 15;
      }

      candidates.push({ worker, score });
    }

    if (candidates.length === 0) return null;

    // Sort by score descending, return best
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].worker;
  }

  private assignTaskToWorker(task: QueuedTask, worker: ConnectedWorker): void {
    worker.activeTasks.add(task.id);
    this.activeTasks.set(task.id, task);
    
    // Send the task assignment
    this.sendToWorker(worker, task.assignment);
    
    this.emit('task:assigned', { taskId: task.id, workerId: worker.id });
  }

  // ── Result Handling ──────────────────────────────────

  async handleResult(workerId: string, result: TaskResult): Promise<void> {
    const worker = this.workers.get(workerId);
    if (!worker) return;

    const taskId = result.taskId;
    const task = this.activeTasks.get(taskId);
    
    worker.activeTasks.delete(taskId);

    if (!task) {
      console.warn(`Received result for unknown task: ${taskId}`);
      return;
    }

    // Record the contribution
    if (result.result.success) {
      worker.tasksCompleted++;
      worker.totalTokensContributed += result.cost.totalTokens;
      worker.totalCostContributed += result.cost.estimatedCostUSD;
      
      // Update budget ledger
      await this.budgetLedger.recordSpend(
        workerId,
        result.cost.provider,
        result.cost.estimatedCostUSD,
        result.cost.totalTokens
      );
    } else {
      worker.tasksFailed++;
    }

    // ── Cross-Validation Logic ────────────────────────
    if (task.requiresCrossValidation) {
      // Store this result
      if (!this.results.has(taskId)) {
        this.results.set(taskId, []);
      }
      this.results.get(taskId)!.push(result);

      const results = this.results.get(taskId)!;
      
      // Need at least 2 results to cross-validate
      if (results.length < 2) {
        // Re-queue for another worker
        const requeued = { ...task, attempts: task.attempts + 1 };
        requeued.assignment.taskId = `${taskId}-xv${results.length}`;
        this.taskQueue.push(requeued);
        this.sortQueue();
        return;
      }

      // Cross-validate
      const validatedResult = await this.qualityGate.crossValidate(results);
      
      if (validatedResult.accepted) {
        await this.acceptResult(task, validatedResult.bestResult!);
      } else {
        // Both results disagree — send to human validation
        await this.queueForHumanReview(task, results);
      }
    } else {
      // ── Single-Result Validation ────────────────────
      const validation = await this.qualityGate.validate(result);
      
      if (validation.accepted) {
        await this.acceptResult(task, result);
      } else if (validation.needsHumanReview) {
        await this.queueForHumanReview(task, [result]);
      } else {
        // Auto-retry
        if (task.attempts < task.maxAttempts) {
          task.attempts++;
          this.taskQueue.push(task);
          this.sortQueue();
        } else {
          this.emit('task:failed', { taskId, reason: 'max_attempts_exceeded' });
        }
      }
    }

    this.activeTasks.delete(taskId);
  }

  private async acceptResult(task: QueuedTask, result: TaskResult): Promise<void> {
    // Store the accepted result
    await this.resultStore.save(task.id, result);
    
    // Update target progress
    await this.targetRegistry.recordProgress(
      task.assignment.task.target.id,
      task.assignment.task.stage,
      task.assignment.task.type
    );

    // Attribution: record who funded this
    await this.budgetLedger.recordAttribution(
      task.id,
      result.cost.provider,
      result.cost.estimatedCostUSD,
      result.cost.totalTokens
    );

    this.emit('task:completed', {
      taskId: task.id,
      targetId: task.assignment.task.target.id,
      stage: task.assignment.task.stage,
      cost: result.cost,
    });
  }

  private async queueForHumanReview(task: QueuedTask, results: TaskResult[]): Promise<void> {
    // Add to the human validation queue ("Tinder for Code")
    this.emit('task:needs-human-review', {
      taskId: task.id,
      target: task.assignment.task.target,
      type: task.assignment.task.type,
      results: results.map(r => ({
        output: r.result.output,
        confidence: r.confidence,
        model: r.cost.model,
      })),
    });
  }

  // ── Queue Management ─────────────────────────────────

  private sortQueue(): void {
    this.taskQueue.sort((a, b) => {
      // Higher priority first
      if (a.priority !== b.priority) return b.priority - a.priority;
      // Earlier deadline first
      return a.deadline.getTime() - b.deadline.getTime();
    });
  }

  private enforceDeadlines(): void {
    const now = Date.now();
    
    for (const [taskId, task] of this.activeTasks) {
      if (task.deadline.getTime() < now) {
        // Task has exceeded its deadline
        // Find which worker has it
        for (const worker of this.workers.values()) {
          if (worker.activeTasks.has(taskId)) {
            // Cancel it on the worker
            this.sendToWorker(worker, { type: 'task.cancelled', taskId, reason: 'deadline' });
            worker.activeTasks.delete(taskId);
            break;
          }
        }
        
        // Re-queue if attempts remain
        if (task.attempts < task.maxAttempts) {
          task.attempts++;
          task.deadline = new Date(Date.now() + 120_000); // New 2-minute deadline
          this.taskQueue.push(task);
          this.sortQueue();
        }
        
        this.activeTasks.delete(taskId);
      }
    }
  }

  private cleanupStaleWorkers(): void {
    const staleThreshold = 60_000; // 60 seconds without heartbeat
    const now = Date.now();
    
    for (const [workerId, worker] of this.workers) {
      if (now - worker.lastHeartbeat.getTime() > staleThreshold) {
        console.log(`Removing stale worker: ${workerId.substring(0, 12)}...`);
        this.removeWorker(workerId);
      }
    }
  }

  // ── Utilities ────────────────────────────────────────

  private sendToWorker(worker: ConnectedWorker, msg: any): void {
    if (worker.ws.readyState === 1 /* OPEN */) {
      worker.ws.send(JSON.stringify(msg));
    }
  }

  private determineQueue(capabilities: WorkerCapabilities): string {
    const hasLocal = capabilities.providers.some(p => p.tier === 'local-free');
    const hasPremium = capabilities.providers.some(p => p.tier === 'premium');
    
    if (hasLocal) return 'local-compute';
    if (hasPremium) return 'premium';
    return 'standard';
  }

  getPoolStats() {
    let totalBudget = 0;
    for (const worker of this.workers.values()) {
      for (const remaining of Object.values(worker.budgetRemaining)) {
        totalBudget += remaining;
      }
    }
    
    return {
      totalWorkers: this.workers.size,
      totalBudgetUSD: totalBudget,
      activeGenerations: this.activeTasks.size,
      queuedTasks: this.taskQueue.length,
      targetsCompleted: 0,   // from targetRegistry
      targetsRemaining: 0,   // from targetRegistry
    };
  }

  getLeaderboard(): Array<{
    workerId: string;
    githubUser?: string;
    tokensContributed: number;
    costContributed: number;
    tasksCompleted: number;
    reliability: number;
  }> {
    return Array.from(this.workers.values())
      .map(w => ({
        workerId: w.id,
        githubUser: w.githubUser,
        tokensContributed: w.totalTokensContributed,
        costContributed: w.totalCostContributed,
        tasksCompleted: w.tasksCompleted,
        reliability: w.tasksCompleted / Math.max(w.tasksCompleted + w.tasksFailed, 1),
      }))
      .sort((a, b) => b.tokensContributed - a.tokensContributed);
  }
}
```

---

## Part 6: Quality Gate — Preventing Garbage In/Garbage Out

This is the most critical component. If donors' money produces junk, the project dies.

```typescript
// packages/quality/src/quality-gate.ts

export interface ValidationResult {
  accepted: boolean;
  needsHumanReview: boolean;
  confidence: number;
  issues: string[];
  bestResult?: TaskResult;
}

export class QualityGate {
  
  /**
   * Validate a single result using automated checks.
   * NO AI calls here — we don't want to spend more donor money on validation.
   * Use deterministic, rule-based checks.
   */
  async validate(result: TaskResult): Promise<ValidationResult> {
    const issues: string[] = [];
    let confidence = result.confidence;

    // ── Check 1: Non-empty output ─────────────────────
    if (!result.result.output || result.result.output.trim().length < 50) {
      issues.push('Output is too short or empty');
      confidence -= 0.3;
    }

    // ── Check 2: Attestation integrity ────────────────
    if (!this.verifyAttestation(result.result.attestation)) {
      issues.push('Attestation signature invalid');
      confidence -= 0.5;
    }

    // ── Check 3: Timing sanity ────────────────────────
    const startTime = new Date(result.result.attestation.startedAt).getTime();
    const endTime = new Date(result.result.attestation.completedAt).getTime();
    const duration = endTime - startTime;
    
    if (duration < 500) {
      issues.push('Suspiciously fast response (< 500ms)');
      confidence -= 0.4;
    }
    if (duration > 300_000) {
      issues.push('Extremely slow response (> 5 minutes)');
      confidence -= 0.1;
    }

    // ── Check 4: Token count sanity ───────────────────
    if (result.cost.totalTokens < 10) {
      issues.push('Suspiciously low token count');
      confidence -= 0.3;
    }

    // ── Check 5: JSON validity (if JSON expected) ─────
    if (result.result.structuredOutput !== undefined) {
      try {
        if (typeof result.result.structuredOutput === 'string') {
          JSON.parse(result.result.structuredOutput);
        }
      } catch {
        issues.push('Expected JSON output but got invalid JSON');
        confidence -= 0.3;
      }
    }

    // ── Check 6: Code syntax validation ───────────────
    if (this.containsCode(result.result.output)) {
      const syntaxValid = await this.checkCodeSyntax(result.result.output);
      if (!syntaxValid) {
        issues.push('Code blocks contain syntax errors');
        confidence -= 0.2;
      }
    }

    // ── Check 7: Hallucination signals ────────────────
    const hallucination = this.detectHallucinationSignals(result.result.output);
    if (hallucination.detected) {
      issues.push(`Possible hallucination: ${hallucination.reason}`);
      confidence -= 0.3;
    }

    // ── Check 8: Repetition detection ─────────────────
    if (this.detectRepetition(result.result.output)) {
      issues.push('Output contains excessive repetition');
      confidence -= 0.2;
    }

    // ── Decision ──────────────────────────────────────
    confidence = Math.max(0, Math.min(1, confidence));

    if (confidence >= 0.6 && issues.length <= 1) {
      return { accepted: true, needsHumanReview: false, confidence, issues };
    }
    
    if (confidence >= 0.4) {
      return { accepted: false, needsHumanReview: true, confidence, issues };
    }
    
    return { accepted: false, needsHumanReview: false, confidence, issues };
  }

  /**
   * Cross-validate two results for the same task.
   * Compare outputs from different workers/models for consistency.
   */
  async crossValidate(results: TaskResult[]): Promise<ValidationResult> {
    if (results.length < 2) {
      return this.validate(results[0]);
    }

    // Compare structural similarity
    const similarity = this.computeSimilarity(
      results[0].result.output,
      results[1].result.output
    );

    // If both results agree substantially, accept the higher-confidence one
    if (similarity > 0.7) {
      const best = results.sort((a, b) => b.confidence - a.confidence)[0];
      return {
        accepted: true,
        needsHumanReview: false,
        confidence: Math.min(best.confidence + 0.1, 1.0), // Boost for agreement
        issues: [],
        bestResult: best,
      };
    }

    // If results significantly disagree, needs human review
    if (similarity < 0.3) {
      return {
        accepted: false,
        needsHumanReview: true,
        confidence: 0.3,
        issues: ['Cross-validation: significant disagreement between workers'],
      };
    }

    // Moderate agreement — accept with lower confidence
    const best = results.sort((a, b) => b.confidence - a.confidence)[0];
    return {
      accepted: true,
      needsHumanReview: false,
      confidence: best.confidence * 0.8, // Slight penalty for partial disagreement
      issues: ['Cross-validation: partial agreement'],
      bestResult: best,
    };
  }

  private verifyAttestation(attestation: WorkAttestation): boolean {
    // In production: verify HMAC signature against registered worker secret
    return !!(attestation.promptHash && attestation.outputHash && attestation.signature);
  }

  private containsCode(output: string): boolean {
    return /```[\w]*\n[\s\S]*?```/.test(output);
  }

  private async checkCodeSyntax(output: string): Promise<boolean> {
    // Extract code blocks and validate syntax
    const codeBlocks = output.match(/```(\w+)\n([\s\S]*?)```/g);
    if (!codeBlocks) return true;
    
    for (const block of codeBlocks) {
      const match = block.match(/```(\w+)\n([\s\S]*?)```/);
      if (!match) continue;
      
      const [, language, code] = match;
      
      // Basic syntax checks per language
      switch (language) {
        case 'json':
          try { JSON.parse(code); } catch { return false; }
          break;
        case 'python':
          // Check for obvious Python syntax errors
          if (this.hasUnmatchedBrackets(code)) return false;
          break;
        case 'javascript':
        case 'typescript':
          if (this.hasUnmatchedBrackets(code)) return false;
          break;
        case 'xml':
        case 'html':
          if (this.hasUnmatchedTags(code)) return false;
          break;
      }
    }
    
    return true;
  }

  private detectHallucinationSignals(output: string): { detected: boolean; reason?: string } {
    // Check for common hallucination patterns
    const signals = [
      { pattern: /as of my (?:last |knowledge )(?:cutoff|update)/i, reason: 'Model uncertainty disclaimer' },
      { pattern: /I (?:don't|cannot|can't) (?:access|browse|search)/i, reason: 'Model limitation admission' },
      { pattern: /(?:Note|Disclaimer|Warning):.*(?:actual|real|verify|check)/i, reason: 'Accuracy disclaimer' },
      { pattern: /(?:hypothetical|theoretical|pseudo)(?:code|example)/i, reason: 'Hypothetical marker' },
    ];

    for (const { pattern, reason } of signals) {
      if (pattern.test(output)) {
        return { detected: true, reason };
      }
    }

    return { detected: false };
  }

  private detectRepetition(output: string): boolean {
    // Check for repeating paragraphs
    const paragraphs = output.split('\n\n').filter(p => p.trim().length > 50);
    const seen = new Set<string>();
    
    for (const p of paragraphs) {
      const normalized = p.trim().toLowerCase().substring(0, 100);
      if (seen.has(normalized)) return true;
      seen.add(normalized);
    }
    
    return false;
  }

  private computeSimilarity(a: string, b: string): number {
    // Jaccard similarity on word-level trigrams
    const trigramsA = this.getWordTrigrams(a);
    const trigramsB = this.getWordTrigrams(b);
    
    const intersection = new Set([...trigramsA].filter(t => trigramsB.has(t)));
    const union = new Set([...trigramsA, ...trigramsB]);
    
    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  private getWordTrigrams(text: string): Set<string> {
    const words = text.toLowerCase().split(/\s+/);
    const trigrams = new Set<string>();
    
    for (let i = 0; i < words.length - 2; i++) {
      trigrams.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
    }
    
    return trigrams;
  }

  private hasUnmatchedBrackets(code: string): boolean {
    let round = 0, square = 0, curly = 0;
    const inString = false; // Simplified — production should track string context
    
    for (const char of code) {
      if (char === '(') round++;
      if (char === ')') round--;
      if (char === '[') square++;
      if (char === ']') square--;
      if (char === '{') curly++;
      if (char === '}') curly--;
      
      if (round < 0 || square < 0 || curly < 0) return true;
    }
    
    return round !== 0 || square !== 0 || curly !== 0;
  }

  private hasUnmatchedTags(code: string): boolean {
    const openTags = (code.match(/<[a-z][\w-]*/gi) ?? []).length;
    const closeTags = (code.match(/<\/[a-z][\w-]*/gi) ?? []).length;
    const selfClosing = (code.match(/\/>/g) ?? []).length;
    
    return Math.abs(openTags - closeTags - selfClosing) > 2; // Allow some tolerance
  }
}
```

---

## Part 7: The "Tinder for Code" Human Validation UI

```tsx
// apps/portal/src/app/validate/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';

interface ValidationItem {
  id: string;
  taskType: string;
  target: { name: string; category: string };
  output: string;                      // The AI-generated content
  codeBlocks: Array<{ language: string; code: string }>;
  confidence: number;
  model: string;
  generatedBy?: string;               // GitHub username of contributor
}

export default function ValidatePage() {
  const [items, setItems] = useState<ValidationItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState({ reviewed: 0, approved: 0, rejected: 0, streak: 0 });
  const [showResult, setShowResult] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    fetchValidationQueue();
  }, []);

  async function fetchValidationQueue() {
    const response = await fetch('/api/validation/queue?limit=20');
    const data = await response.json();
    setItems(data.items);
  }

  const current = items[currentIndex];

  const handleVote = useCallback(async (vote: 'approve' | 'reject' | 'skip' | 'flag') => {
    if (!current) return;

    setShowResult(vote === 'skip' || vote === 'flag' ? null : vote);
    
    setTimeout(async () => {
      // Submit vote
      await fetch('/api/validation/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: current.id,
          vote,
          reviewerNotes: vote === 'flag' ? 'Flagged for expert review' : undefined,
        }),
      });

      // Update local stats
      setStats(prev => ({
        reviewed: prev.reviewed + 1,
        approved: prev.approved + (vote === 'approve' ? 1 : 0),
        rejected: prev.rejected + (vote === 'reject' ? 1 : 0),
        streak: vote === 'approve' || vote === 'reject' ? prev.streak + 1 : 0,
      }));

      // Next item
      setCurrentIndex(prev => prev + 1);
      setShowResult(null);

      // Fetch more if running low
      if (currentIndex >= items.length - 5) {
        fetchValidationQueue();
      }
    }, 500);
  }, [current, currentIndex, items.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'a') handleVote('approve');
      if (e.key === 'ArrowLeft' || e.key === 'r') handleVote('reject');
      if (e.key === 'ArrowDown' || e.key === 's') handleVote('skip');
      if (e.key === 'f') handleVote('flag');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleVote]);

  if (!current) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">🎉</span>
          <h2 className="text-2xl font-bold mb-2">Queue is empty!</h2>
          <p className="text-gray-400">
            You've reviewed everything. Check back later for more.
          </p>
          <div className="mt-6 bg-gray-900 rounded-xl p-6 inline-block">
            <p className="text-sm text-gray-400">Your session</p>
            <p className="text-3xl font-bold">{stats.reviewed} reviewed</p>
            <p className="text-green-400">{stats.approved} approved</p>
            <p className="text-red-400">{stats.rejected} rejected</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔍</span>
            <h1 className="font-bold">Validate</h1>
            <span className="text-xs bg-gray-800 px-2 py-0.5 rounded-full">
              {items.length - currentIndex} remaining
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-400">
              {stats.reviewed} reviewed
            </span>
            {stats.streak >= 5 && (
              <span className="bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full text-xs">
                🔥 {stats.streak} streak!
              </span>
            )}
            <span className="text-green-400">{stats.approved} ✓</span>
            <span className="text-red-400">{stats.rejected} ✗</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Target Info */}
        <div className="mb-4 flex items-center gap-3">
          <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
            {current.target.name}
          </span>
          <span className="bg-gray-800 text-gray-400 px-3 py-1 rounded-full text-sm">
            {current.taskType.replace(/-/g, ' ')}
          </span>
          <span className="text-gray-600 text-sm">
            Confidence: {(current.confidence * 100).toFixed(0)}% | Model: {current.model}
          </span>
        </div>

        {/* The Content Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              borderColor: showResult === 'approve' ? '#22c55e' : 
                          showResult === 'reject' ? '#ef4444' : '#374151',
            }}
            exit={{ opacity: 0, x: showResult === 'approve' ? 200 : -200 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-900 border-2 border-gray-800 rounded-2xl overflow-hidden"
          >
            {/* Content */}
            <div className="max-h-[60vh] overflow-y-auto p-6">
              {current.codeBlocks.length > 0 ? (
                current.codeBlocks.map((block, i) => (
                  <div key={i} className="mb-4">
                    <div className="bg-gray-800 px-3 py-1 rounded-t-lg text-xs text-gray-400 font-mono">
                      {block.language}
                    </div>
                    <pre className="bg-gray-950 p-4 rounded-b-lg overflow-x-auto text-sm">
                      <code>{block.code}</code>
                    </pre>
                  </div>
                ))
              ) : (
                <div className="prose prose-invert max-w-none">
                  {current.output}
                </div>
              )}
            </div>

            {/* Quick question */}
            <div className="border-t border-gray-800 px-6 py-4 bg-gray-900/50">
              <p className="text-center text-gray-400 text-sm mb-1">
                Does this {current.taskType.replace(/-/g, ' ')} for{' '}
                <span className="text-white font-medium">{current.target.name}</span>{' '}
                look correct?
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => handleVote('reject')}
            className="group flex flex-col items-center gap-1"
          >
            <div className="w-16 h-16 bg-red-500/10 hover:bg-red-500/20 border-2 border-red-500/30 
                          hover:border-red-500 rounded-full flex items-center justify-center 
                          transition-all duration-200 group-hover:scale-110">
              <span className="text-2xl">👎</span>
            </div>
            <span className="text-xs text-gray-500">← or R</span>
          </button>

          <button
            onClick={() => handleVote('skip')}
            className="group flex flex-col items-center gap-1"
          >
            <div className="w-12 h-12 bg-gray-800 hover:bg-gray-700 rounded-full 
                          flex items-center justify-center transition-all duration-200">
              <span className="text-lg">⏭️</span>
            </div>
            <span className="text-xs text-gray-500">↓ or S</span>
          </button>

          <button
            onClick={() => handleVote('flag')}
            className="group flex flex-col items-center gap-1"
          >
            <div className="w-12 h-12 bg-yellow-500/10 hover:bg-yellow-500/20 rounded-full 
                          flex items-center justify-center transition-all duration-200">
              <span className="text-lg">🚩</span>
            </div>
            <span className="text-xs text-gray-500">F</span>
          </button>

          <button
            onClick={() => handleVote('approve')}
            className="group flex flex-col items-center gap-1"
          >
            <div className="w-16 h-16 bg-green-500/10 hover:bg-green-500/20 border-2 border-green-500/30 
                          hover:border-green-500 rounded-full flex items-center justify-center 
                          transition-all duration-200 group-hover:scale-110">
              <span className="text-2xl">👍</span>
            </div>
            <span className="text-xs text-gray-500">→ or A</span>
          </button>
        </div>

        {/* Keyboard hint */}
        <p className="text-center text-gray-600 text-xs mt-6">
          Use keyboard: ← reject · ↓ skip · → approve · F flag
        </p>
      </main>
    </div>
  );
}
```

---

## Part 8: The Pipeline Decomposer — Breaking Targets into Tasks

```typescript
// packages/pipeline/src/decomposer.ts

/**
 * Takes a target (e.g., "Python 3.12") and decomposes its generation
 * into hundreds of small, distributable tasks that workers can execute independently.
 */

import type { QueuedTask, TaskAssignment, TargetInfo, PipelineStage, TaskType } from '@openblueprint/protocol';
import { nanoid } from 'nanoid';
import { PROMPT_TEMPLATES } from './prompts';

export class PipelineDecomposer {

  /**
   * Generate all tasks needed to fully document a target.
   * Returns tasks in dependency order (stages are sequential, tasks within a stage are parallel).
   */
  async decomposeTarget(target: TargetInfo): Promise<StagePlan[]> {
    const stages: StagePlan[] = [];

    // ── Stage 1: Skeleton Discovery ───────────────────
    // One task: discover the complete concept tree.
    // Cheap (economy tier), fast, foundational.
    stages.push({
      stage: 'discovery',
      dependsOn: [],
      tasks: [{
        ...this.createTask(target, 'discovery', 'skeleton-discovery', {
          system: PROMPT_TEMPLATES.skeletonDiscovery.system(target),
          user: PROMPT_TEMPLATES.skeletonDiscovery.user(target),
        }, {
          minModelTier: 'economy',
          preferredModels: ['gpt-4o-mini', 'claude-3-5-haiku-20241022', 'gemini-2.0-flash'],
          maxTokens: 8192,
          temperature: 0.3,
          responseFormat: 'json',
        }),
        priority: 10,
        estimatedCostUSD: 0.005,
        requiresCrossValidation: false, // Single attempt is fine
      }],
    });

    // ── Stage 2: Deep Generation ──────────────────────
    // Many tasks: one per concept node discovered in Stage 1.
    // This is where the real work (and cost) happens.
    // Tasks are created dynamically after Stage 1 completes.
    stages.push({
      stage: 'generation',
      dependsOn: ['discovery'],
      tasks: [], // Populated dynamically
      dynamicExpansion: {
        expandFrom: 'discovery',
        taskFactory: (discoveryResult: any) => {
          const nodes = discoveryResult.structuredOutput?.nodes ?? [];
          return nodes.map((node: any) => ({
            ...this.createTask(target, 'generation', 'deep-generation', {
              system: PROMPT_TEMPLATES.deepGeneration.system(target, node),
              user: PROMPT_TEMPLATES.deepGeneration.user(target, node),
            }, {
              minModelTier: node.complexity === 'advanced' ? 'standard' : 'economy',
              maxTokens: 4096,
              temperature: 0.4,
              responseFormat: 'json',
            }),
            priority: node.importance === 'core' ? 8 : 5,
            estimatedCostUSD: node.complexity === 'advanced' ? 0.05 : 0.01,
            requiresCrossValidation: node.importance === 'core', // Cross-validate important nodes
          }));
        },
      },
    });

    // ── Stage 3: Code Examples ────────────────────────
    // One task per concept node that supports executable examples.
    stages.push({
      stage: 'generation',
      dependsOn: ['generation'],
      tasks: [],
      dynamicExpansion: {
        expandFrom: 'generation',
        taskFactory: (generationResults: any[]) => {
          return generationResults
            .filter((r: any) => r.structuredOutput?.supportsExamples)
            .map((r: any) => ({
              ...this.createTask(target, 'generation', 'code-example', {
                system: PROMPT_TEMPLATES.codeExample.system(target),
                user: PROMPT_TEMPLATES.codeExample.user(target, r.structuredOutput),
              }, {
                minModelTier: 'economy',
                maxTokens: 4096,
                temperature: 0.2,
              }),
              priority: 4,
              estimatedCostUSD: 0.01,
              requiresCrossValidation: false,
            }));
        },
      },
    });

    // ── Stage 4: Validation ───────────────────────────
    // Light-touch AI validation of generated content.
    // Routed to LOCAL/FREE models to save donor budget.
    stages.push({
      stage: 'validation',
      dependsOn: ['generation'],
      tasks: [],
      dynamicExpansion: {
        expandFrom: 'generation',
        taskFactory: (generationResults: any[]) => {
          return generationResults.map((r: any) => ({
            ...this.createTask(target, 'validation', 'validation', {
              system: PROMPT_TEMPLATES.validation.system(target),
              user: PROMPT_TEMPLATES.validation.user(r.structuredOutput),
            }, {
              minModelTier: 'local-free', // Prefer free local models
              preferredModels: ['llama3.1:70b', 'mistral:7b', 'gpt-4o-mini'],
              maxTokens: 2048,
              temperature: 0.1,
              responseFormat: 'json',
            }),
            priority: 3,
            estimatedCostUSD: 0.001, // Aimed at local/free models
            requiresCrossValidation: false,
          }));
        },
      },
    });

    // ── Stage 5: Gap Analysis ─────────────────────────
    stages.push({
      stage: 'enrichment',
      dependsOn: ['validation'],
      tasks: [{
        ...this.createTask(target, 'enrichment', 'gap-analysis', {
          system: PROMPT_TEMPLATES.gapAnalysis.system(target),
          user: PROMPT_TEMPLATES.gapAnalysis.user(target),
        }, {
          minModelTier: 'standard',
          maxTokens: 4096,
          temperature: 0.3,
          responseFormat: 'json',
        }),
        priority: 6,
        estimatedCostUSD: 0.03,
        requiresCrossValidation: true, // Important to get right
      }],
    });

    // ── Stage 6: Gap Fill ─────────────────────────────
    // Dynamic tasks based on gaps found
    stages.push({
      stage: 'enrichment',
      dependsOn: ['gap-analysis'],
      tasks: [],
      dynamicExpansion: {
        expandFrom: 'gap-analysis',
        taskFactory: (gapResult: any) => {
          const gaps = gapResult.structuredOutput?.gaps ?? [];
          return gaps.map((gap: any) => ({
            ...this.createTask(target, 'enrichment', 'gap-fill', {
              system: PROMPT_TEMPLATES.gapFill.system(target, gap),
              user: PROMPT_TEMPLATES.gapFill.user(target, gap),
            }, {
              minModelTier: gap.difficulty === 'hard' ? 'standard' : 'economy',
              maxTokens: 4096,
              temperature: 0.4,
              responseFormat: 'json',
            }),
            priority: 5,
            estimatedCostUSD: 0.02,
            requiresCrossValidation: false,
          }));
        },
      },
    });

    return stages;
  }

  /**
   * Estimate the total cost of generating a target.
   */
  async estimateCost(target: TargetInfo): Promise<CostEstimate> {
    // Based on historical data and target complexity
    const complexityMultiplier = this.getComplexityMultiplier(target);
    
    return {
      targetId: target.id,
      targetName: target.name,
      estimatedNodes: Math.round(150 * complexityMultiplier),
      estimatedTotalTokens: Math.round(2_000_000 * complexityMultiplier),
      estimatedCostUSD: Math.round(24 * complexityMultiplier * 100) / 100,
      
      breakdown: {
        discovery: 0.005 * complexityMultiplier,
        deepGeneration: 15 * complexityMultiplier,
        codeExamples: 5 * complexityMultiplier,
        validation: 1 * complexityMultiplier, // Free if using local models
        gapAnalysis: 0.5 * complexityMultiplier,
        gapFill: 2.5 * complexityMultiplier,
      },
      
      // How much can be done with free/local models
      localFreeEligiblePercent: 35, // ~35% of work can use local models
    };
  }

  private createTask(
    target: TargetInfo,
    stage: PipelineStage,
    type: TaskType,
    prompt: { system: string; user: string },
    requirements: any
  ): Omit<QueuedTask, 'priority' | 'estimatedCostUSD' | 'requiresCrossValidation'> {
    const taskId = nanoid();
    
    return {
      id: taskId,
      assignment: {
        type: 'task.assign',
        taskId,
        task: {
          type,
          stage,
          target,
          prompt,
          requirements,
          estimatedCost: {
            estimatedInputTokens: 0, // Calculated later
            estimatedOutputTokens: 0,
            estimatedCostUSD: 0,
          },
        },
        deadline: new Date(Date.now() + 5 * 60_000).toISOString(), // 5 min deadline
      },
      enqueuedAt: new Date(),
      deadline: new Date(Date.now() + 5 * 60_000),
      attempts: 0,
      maxAttempts: 3,
      requiredTier: requirements.minModelTier,
      existingResults: [],
    };
  }

  private getComplexityMultiplier(target: TargetInfo): number {
    const complexities: Record<string, number> = {
      'python-3.12': 2.0,    // Very complex language
      'json': 0.3,            // Simple format
      'pptx': 1.2,            // Complex format
      'png': 0.8,             // Moderate format
      'rust': 1.8,            // Complex language
      'lua': 0.7,             // Moderate language
      'midi': 0.5,            // Moderate format
    };
    return complexities[target.id] ?? 1.0;
  }
}

export interface StagePlan {
  stage: PipelineStage;
  dependsOn: string[];
  tasks: QueuedTask[];
  dynamicExpansion?: {
    expandFrom: string;
    taskFactory: (previousResult: any) => QueuedTask[];
  };
}

export interface CostEstimate {
  targetId: string;
  targetName: string;
  estimatedNodes: number;
  estimatedTotalTokens: number;
  estimatedCostUSD: number;
  breakdown: Record<string, number>;
  localFreeEligiblePercent: number;
}
```

---

## Part 9: The Budget Ledger — Transparent Attribution

```typescript
// apps/orchestrator/src/budget-ledger.ts

/**
 * The Budget Ledger is the SINGLE SOURCE OF TRUTH for all spending.
 * Every token spent is attributed to a specific:
 * - Contributor (who donated the compute)
 * - Target (which language/format was being generated)
 * - Task (which specific piece of knowledge was produced)
 * 
 * This data is PUBLIC. Donors can see exactly how their contribution was used.
 */

export class BudgetLedger {
  constructor(private db: Database) {}

  async recordSpend(
    workerId: string,
    provider: string,
    costUSD: number,
    tokens: number,
  ): Promise<void> {
    await this.db.execute(`
      INSERT INTO spend_log (worker_id, provider, cost_usd, tokens, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [workerId, provider, costUSD, tokens, new Date().toISOString()]);
  }

  async recordAttribution(
    taskId: string,
    provider: string,
    costUSD: number,
    tokens: number,
  ): Promise<void> {
    await this.db.execute(`
      INSERT INTO attributions (task_id, provider, cost_usd, tokens, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [taskId, provider, costUSD, tokens, new Date().toISOString()]);
  }

  /**
   * Get the "Generated By" attribution for a target.
   * This goes into the metadata of every generated node.
   */
  async getTargetAttribution(targetId: string): Promise<Attribution[]> {
    const rows = await this.db.query(`
      SELECT 
        w.github_user,
        w.worker_id,
        SUM(a.cost_usd) as total_cost,
        SUM(a.tokens) as total_tokens,
        COUNT(a.task_id) as tasks_completed
      FROM attributions a
      JOIN workers w ON a.worker_id = w.id
      JOIN tasks t ON a.task_id = t.id
      WHERE t.target_id = ?
      GROUP BY w.github_user, w.worker_id
      ORDER BY total_tokens DESC
    `, [targetId]);

    return rows.map((row: any) => ({
      githubUser: row.github_user,
      workerId: row.worker_id,
      totalCostUSD: row.total_cost,
      totalTokens: row.total_tokens,
      tasksCompleted: row.tasks_completed,
    }));
  }

  /**
   * Global leaderboard.
   */
  async getGlobalLeaderboard(limit = 100): Promise<LeaderboardEntry[]> {
    const rows = await this.db.query(`
      SELECT 
        w.github_user,
        SUM(s.cost_usd) as total_donated_usd,
        SUM(s.tokens) as total_tokens,
        COUNT(DISTINCT t.target_id) as targets_contributed_to,
        MIN(s.created_at) as first_contribution
      FROM spend_log s
      JOIN workers w ON s.worker_id = w.id
      LEFT JOIN tasks t ON s.task_id = t.id
      WHERE w.github_user IS NOT NULL
      GROUP BY w.github_user
      ORDER BY total_tokens DESC
      LIMIT ?
    `, [limit]);

    return rows.map((row: any, index: number) => ({
      rank: index + 1,
      githubUser: row.github_user,
      totalDonatedUSD: row.total_donated_usd,
      totalTokens: row.total_tokens,
      targetsContributedTo: row.targets_contributed_to,
      firstContribution: row.first_contribution,
      badge: this.calculateBadge(row.total_donated_usd),
    }));
  }

  private calculateBadge(totalUSD: number): string {
    if (totalUSD >= 100) return '🏆 Gold Contributor';
    if (totalUSD >= 25) return '🥈 Silver Contributor';
    if (totalUSD >= 5) return '🥉 Bronze Contributor';
    if (totalUSD >= 1) return '⭐ Contributor';
    return '🌱 Seedling';
  }
}

interface Attribution {
  githubUser?: string;
  workerId: string;
  totalCostUSD: number;
  totalTokens: number;
  tasksCompleted: number;
}

interface LeaderboardEntry {
  rank: number;
  githubUser: string;
  totalDonatedUSD: number;
  totalTokens: number;
  targetsContributedTo: number;
  firstContribution: string;
  badge: string;
}
```

---

## Part 10: Deployment & Infrastructure

```yaml
# docker-compose.yml — Local development

version: '3.9'

services:
  orchestrator:
    build: 
      context: .
      dockerfile: apps/orchestrator/Dockerfile
    ports:
      - "3000:3000"        # REST API
      - "3001:3001"        # WebSocket for workers
    environment:
      - DATABASE_URL=postgres://ace:ace@postgres:5432/openblueprint
      - REDIS_URL=redis://redis:6379
      - GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}
      - GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis

  portal:
    build:
      context: .
      dockerfile: apps/portal/Dockerfile
    ports:
      - "3002:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3000
      - NEXT_PUBLIC_WS_URL=ws://localhost:3001

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: openblueprint
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
  pgdata:
```

```toml
# fly.toml — Production deployment on Fly.io (free tier friendly)

app = "openblueprint-orchestrator"
primary_region = "iad"

[build]
  dockerfile = "apps/orchestrator/Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "3000"
  WS_PORT = "3001"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = false    # Workers need persistent connection
  auto_start_machines = true

[[services]]
  protocol = "tcp"
  internal_port = 3001
  
  [[services.ports]]
    port = 443
    handlers = ["tls"]

[mounts]
  source = "data"
  destination = "/data"
  initial_size = "1"
```

---

## Part 11: The 60-Second Contribution Flow

```
═══════════════════════════════════════════════════════════════
                THE 60-SECOND CONTRIBUTION FLOW
═══════════════════════════════════════════════════════════════

For Local GPU Users (FREE contribution):
────────────────────────────────────────
$ npm i -g openblueprint-worker        # 10 sec
$ ollama pull llama3.1:8b              # (if not already installed)
$ openblueprint-worker                 # Interactive setup, 30 sec
> ✓ Detected Ollama with llama3.1:8b
> ✓ Connected to pool (47 workers, 312 targets queued)
> → Executing: [discovery/skeleton] Lua
> ✓ Completed: Lua skeleton (0 tokens, $0.00, 4200ms)
> → Executing: [validation] Python/asyncio
> ✓ Completed: validation (0 tokens, $0.00, 3100ms)

For API Key Donors ($5 budget):
────────────────────────────────────────
$ npx openblueprint-worker             # Downloads and runs
> Which provider? OpenAI
> API key: sk-proj-****                # Scoped project key with $5 limit
> Budget cap: $5
> ✓ Connected! Your $5 joins a $847 pool funding 312 targets.
> → Executing: [generation/deep] Rust/ownership
> ✓ Completed: (1,247 tokens, $0.0019, 2100ms)

For Web Validators (NO setup):
────────────────────────────────────────
1. Visit openblueprint.dev/validate
2. Sign in with GitHub (one click)
3. Start swiping: 👍 correct, 👎 incorrect, 🚩 flag
4. Earn "Validator" badge on leaderboard

For Target Sponsors ($10+):
────────────────────────────────────────
1. Visit openblueprint.dev/sponsor
2. Sign in with GitHub
3. Choose a target: "MIDI File Format" or "Zig Language"
4. Enter OpenAI key with $10 cap
5. Your name is etched into every generated node's metadata
```

---

## Part 12: What Makes This Actually Work

```
THE NON-OBVIOUS DESIGN DECISIONS THAT MATTER:
═════════════════════════════════════════════════

1. WORKERS DO THE API CALLS, NOT THE SERVER
   → Eliminates the #1 trust concern
   → Scales horizontally with contributors
   → No single point of failure for API costs

2. LOCAL MODELS HANDLE THE BORING WORK (~35% of tasks)
   → Skeleton discovery, validation, and simple generation 
     can use Llama 3.1 8B running on someone's gaming PC
   → Saves expensive API calls for deep generation only
   → Contributors with GPUs donate FREE compute

3. CROSS-VALIDATION ON IMPORTANT NODES
   → Critical knowledge is generated TWICE by different workers
   → QualityGate compares outputs before accepting
   → If they disagree, humans review
   → Costs ~2x more for ~30% of nodes, but ensures accuracy

4. PROMPT TEMPLATES ARE VERSION-CONTROLLED
   → Community improves prompts via PRs
   → A/B tested: new template vs. old, compare quality scores
   → Bad prompts waste donor money → high motivation to optimize

5. BUDGET IS DONOR-ENFORCED, NOT JUST SERVER-ENFORCED
   → Workers independently track spending
   → Workers can reject tasks that are too expensive
   → Donors set project-scoped API keys with external hard caps
   → Even a compromised orchestrator can't overspend

6. GAMIFICATION IS TIED TO REAL VALUE
   → Leaderboard shows actual tokens donated, actual nodes verified
   → "Adopt a Language" gives permanent credit in the output data
   → Top validators get Discord roles and GitHub badge
   → But the OUTPUT is the real product — it must be genuinely useful

7. RESULTS ARE PUBLISHED AS OPEN DATA
   → Monthly SQLite/Parquet dumps on HuggingFace
   → REST API for AI agent context injection
   → VS Code extension for offline access
   → This is what makes people CARE enough to contribute
```

---

This architecture transforms ACE from a centralized API-key-aggregator (which nobody would trust) into a decentralized compute network (which people *will* join) by putting the key insight front and center: **the worker runs on the contributor's machine, calls the API with their key, and only sends results back.**

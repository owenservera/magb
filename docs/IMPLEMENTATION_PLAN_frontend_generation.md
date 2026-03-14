# magB Frontend-Integrated Database Generation Implementation Plan

## Executive Summary

This plan integrates the **database generation engine** directly into the magB frontend, enabling users to generate new knowledge base content through a web UI. The approach follows a **vertical slice** strategy: build one complete path from UI → API → Engine → Database, then expand.

**Timeline:** 6-8 weeks to MVP  
**Risk Level:** Medium (core engine exists, integration is the challenge)  
**Success Metric:** User can trigger JSON generation from frontend and watch progress in real-time

---

## Current State Assessment

### ✅ What Exists (Foundation)

| Component | Status | Location |
|-----------|--------|----------|
| **Database Schema** | ✅ Complete (1113 lines Prisma) | `/prisma/schema.prisma` |
| **PostgreSQL Database** | ✅ Running (Google Cloud SQL) | Port 5433 via proxy |
| **Z.ai Client** | ✅ Implemented | `/src/engine/llm/ZaiClient.ts` |
| **Response Parser** | ✅ 5-strategy JSON recovery | `/src/engine/llm/ResponseParser.ts` |
| **Generation Planner** | ✅ Layer 1 & 2 task generation | `/src/engine/generation/planner.ts` |
| **Generation Executor** | ⚠️ Partial (needs Layer 3) | `/src/engine/generation/executor.ts` |
| **Checkpoint Manager** | ✅ File-based persistence | `/src/engine/generation/CheckpointManager.ts` |
| **Prompts** | ✅ Templates defined | `/src/engine/generation/prompts.ts` |
| **Frontend Structure** | ✅ Next.js 14 App Router | `/src/app/` |
| **UI Components** | ✅ CapabilityTree, BundlePanel, etc. | `/src/components/` |

### ❌ Critical Gaps

| Gap | Impact | Priority |
|-----|--------|----------|
| **No API Backend** | Frontend has nothing to call | 🔴 Critical |
| **Incomplete Generation Pipeline** | Can't complete full generation | 🔴 Critical |
| **No Seed Data** | Nothing to display in UI | 🔴 Critical |
| **No Validation** | Can't verify generated content | 🟡 High |
| **No Progress Streaming** | Can't show live updates | 🟡 High |
| **No CLI** | Can't run generation from terminal | 🟢 Medium |
| **No Tests** | Can't verify correctness | 🟢 Medium |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Dashboard  │  │   Target    │  │   Generation UI         │  │
│  │  /          │  │   Detail    │  │   /generate             │  │
│  │  page.tsx   │  │   /[id]/    │  │   page.tsx              │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
│         │                │                      │                 │
│         └────────────────┼──────────────────────┘                 │
│                          │                                        │
│         ┌────────────────▼──────────────────────────┐            │
│         │     API Client (src/lib/api-client.ts)    │            │
│         └────────────────┬──────────────────────────┘            │
└──────────────────────────┼──────────────────────────────────────┘
                           │ HTTP / REST
┌──────────────────────────▼──────────────────────────────────────┐
│                      API LAYER (Next.js Routes)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  /v1/       │  │  /v1/       │  │  /v1/                   │  │
│  │  targets    │  │  generate   │  │  assemble               │  │
│  │  /route.ts  │  │  /route.ts  │  │  /route.ts              │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
│         │                │                      │                 │
│         └────────────────┼──────────────────────┘                 │
│                          │                                        │
│         ┌────────────────▼──────────────────────────┐            │
│         │     Engine Service Layer (new)            │            │
│         └────────────────┬──────────────────────────┘            │
└──────────────────────────┼──────────────────────────────────────┘
                           │ Function Calls
┌──────────────────────────▼──────────────────────────────────────┐
│                      GENERATION ENGINE                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Planner   │  │   Executor  │  │   Validation            │  │
│  │  planner.ts │  │  executor.ts│  │   (new)                 │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
│         │                │                      │                 │
│         └────────────────┼──────────────────────┘                 │
│                          │                                        │
│         ┌────────────────▼──────────────────────────┐            │
│         │     LLM Client + Response Parser          │            │
│         │     ZaiClient.ts + ResponseParser.ts      │            │
│         └────────────────┬──────────────────────────┘            │
└──────────────────────────┼──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                      DATABASE (PostgreSQL + Prisma)              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  20+ tables: targets, capabilities, algorithms, etc.    │    │
│  │  pgvector for embeddings                                │    │
│  │  generation_run, checkpoint tables for tracking         │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Minimum Viable Backend (Week 1-2)

**Goal:** Make the existing frontend functional with a working API backend.

### Week 1: API Foundation

#### Day 1-2: Health & Targets Endpoints

**Files to Create:**

```
src/app/api/v1/
├── health/
│   └── route.ts          # GET /v1/health
├── targets/
│   ├── route.ts          # GET /v1/targets
│   └── [id]/
│       └── route.ts      # GET /v1/targets/{id}
```

**Implementation Details:**

```typescript
// src/app/api/v1/health/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/app/api/v1/deps';

export async function GET(request: NextRequest) {
  try {
    const store = await getStore();
    const stats = await store.getStatistics();
    
    return NextResponse.json({
      success: true,
      data: {
        status: 'healthy',
        uptime: process.uptime(),
        ...stats,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Database connection failed' },
      { status: 500 }
    );
  }
}
```

```typescript
// src/app/api/v1/targets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/app/api/v1/deps';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const kind = searchParams.get('kind');
  const search = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  
  const store = await getStore();
  const targets = await store.getTargets({ kind, search, limit, offset });
  const total = await store.getTargetCount({ kind, search });
  
  return NextResponse.json({
    success: true,
    data: targets,
    meta: { total, limit, offset },
  });
}
```

**Store Extensions Needed:**

```typescript
// src/engine/store/index.ts - Add these methods
export class UniversalKnowledgeStore {
  // ... existing code ...
  
  async getStatistics(): Promise<{
    totalNodes: number;
    totalEdges: number;
    targetsCount: number;
    capabilitiesCount: number;
    algorithmsCount: number;
  }> {
    // Query Prisma for counts
  }
  
  async getTargets(filters: {
    kind?: string;
    search?: string;
    limit: number;
    offset: number;
  }): Promise<Target[]> {
    // Query targets with filters
  }
  
  async getTarget(id: string): Promise<Target | null> {
    // Get single target with capabilities
  }
  
  async getCapabilityBundle(capabilityId: string): Promise<CapabilityBundle> {
    // Assemble full bundle: capability + templates + algorithms + coordinates
  }
}
```

#### Day 3-4: Capabilities & Bundle Endpoints

**Files to Create:**

```
src/app/api/v1/
├── targets/[id]/
│   └── capabilities/
│       └── route.ts      # GET /v1/targets/{id}/capabilities
├── capabilities/
│   └── [id]/
│       └── bundle/
│           └── route.ts  # GET /v1/capabilities/{id}/bundle
└── deps.ts               # Dependency injection helpers
```

```typescript
// src/app/api/v1/deps.ts
import { UniversalKnowledgeStore } from '@/engine/store';

let storeInstance: UniversalKnowledgeStore | null = null;

export async function getStore(): Promise<UniversalKnowledgeStore> {
  if (!storeInstance) {
    storeInstance = new UniversalKnowledgeStore();
    await storeInstance.initialize();
  }
  return storeInstance;
}

export function verifyApiKey(request: NextRequest): boolean {
  // For MVP: accept any non-empty API key
  const apiKey = request.headers.get('X-API-Key') || 
                 request.nextUrl.searchParams.get('api_key');
  return !!apiKey;
}
```

#### Day 5: Testing & Verification

**Verification Checklist:**
- [ ] `curl http://localhost:3000/api/v1/health` returns 200
- [ ] Frontend dashboard loads without errors
- [ ] Target list page displays data (or empty state)
- [ ] API documentation accessible at `/api` (if using OpenAPI)

### Week 2: Data Seeding & Frontend Integration

#### Day 1-2: Seed Script

**File to Create:**

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed JSON target
  const jsonTarget = await prisma.target.upsert({
    where: { canonical_id: 'target:json' },
    update: {},
    create: {
      canonical_id: 'target:json',
      name: 'JSON',
      kind: 'file_format',
      version: 'RFC 8259',
      description: 'JavaScript Object Notation - lightweight data interchange format',
      extensions: ['.json'],
      media_types: ['application/json'],
      content: {
        kind: 'file_format',
        version: 'RFC 8259',
        description: 'JSON is a lightweight data-interchange format...',
      },
    },
  });

  // Seed sample capabilities
  const capabilities = [
    {
      name: 'Object Structure',
      description: 'Define nested object structures with key-value pairs',
      complexity: 'basic',
      category: 'data_structures',
    },
    {
      name: 'Array Structure',
      description: 'Define ordered lists of values',
      complexity: 'basic',
      category: 'data_structures',
    },
    {
      name: 'String Encoding',
      description: 'Unicode string representation with escape sequences',
      complexity: 'intermediate',
      category: 'encoding',
    },
    // Add 10-15 more capabilities
  ];

  for (const cap of capabilities) {
    await prisma.capability.create({
      data: {
        ...cap,
        target: { connect: { canonical_id: 'target:json' } },
      },
    });
  }

  console.log('Seed data created successfully');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Package.json Script:**
```json
{
  "scripts": {
    "db:seed": "bun run prisma/seed.ts"
  }
}
```

#### Day 3-4: Frontend Updates

**Update Existing Components:**

```typescript
// src/app/page.tsx - Update to use real API
'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['statistics'],
    queryFn: () => fetch('/api/v1/health').then(r => r.json()),
  });

  // ... rest of component
}
```

#### Day 5: Phase 1 Verification

**Exit Criteria:**
- [ ] Database has seed data (1 target, 10+ capabilities)
- [ ] All Explore endpoints return valid data
- [ ] Frontend displays real data
- [ ] ~10 API tests pass

---

## Phase 2: Generation Endpoint (Week 3-4)

**Goal:** Enable database generation from the frontend with live progress updates.

### Week 3: Generation API & Job Queue

#### Day 1-2: Generation Endpoint

**File to Create:**

```typescript
// src/app/api/v1/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/app/api/v1/deps';
import { GenerationExecutor } from '@/engine/generation/executor';
import { GenerationPlanner } from '@/engine/generation/planner';
import { CheckpointManager } from '@/engine/generation/CheckpointManager';
import { ZaiClient } from '@/engine/llm/ZaiClient';
import { loadConfig } from '@/engine/config';

// In-memory job tracking (use Redis/BullMQ in production)
const activeJobs = new Map<string, GenerationJob>();

interface GenerationJob {
  id: string;
  target: string;
  version: string;
  targetType: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { target, version, targetType } = body;

    // Validate input
    if (!target || !targetType) {
      return NextResponse.json(
        { error: 'Missing required fields: target, targetType' },
        { status: 400 }
      );
    }

    // Create job
    const jobId = `gen_${Date.now()}_${target}`;
    const job: GenerationJob = {
      id: jobId,
      target,
      version: version || 'latest',
      targetType,
      status: 'pending',
      progress: 0,
    };

    activeJobs.set(jobId, job);

    // Start generation in background
    runGeneration(jobId, job).catch(err => {
      job.status = 'failed';
      job.error = err.message;
      activeJobs.set(jobId, job);
    });

    return NextResponse.json({
      success: true,
      data: { job_id: jobId, status: 'pending' },
    });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: 'Failed to start generation' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const jobId = searchParams.get('job_id');

  if (!jobId) {
    return NextResponse.json(
      { error: 'Missing job_id parameter' },
      { status: 400 }
    );
  }

  const job = activeJobs.get(jobId);
  if (!job) {
    return NextResponse.json(
      { error: 'Job not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: job,
  });
}

async function runGeneration(jobId: string, job: GenerationJob) {
  job.status = 'running';
  job.startedAt = new Date();
  activeJobs.set(jobId, job);

  try {
    // Initialize components
    const config = await loadConfig();
    const store = await getStore();
    const llmClient = new ZaiClient(config.llm);
    const checkpointManager = new CheckpointManager(jobId);
    const planner = new GenerationPlanner(store, llmClient);
    const executor = new GenerationExecutor(store, llmClient, planner, checkpointManager);

    // Execute generation with progress callback
    await executor.executeFullGeneration(
      job.target,
      job.version,
      job.targetType,
      (progress) => {
        job.progress = progress;
        activeJobs.set(jobId, job);
      }
    );

    job.status = 'completed';
    job.completedAt = new Date();
    job.progress = 100;
  } catch (error) {
    job.error = error.message;
    throw error;
  } finally {
    activeJobs.set(jobId, job);
  }
}
```

#### Day 3-4: Progress Streaming (SSE)

**File to Create:**

```typescript
// src/app/api/v1/generate/stream/route.ts
import { NextRequest } from 'next/server';

const encoder = new TextEncoder();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const jobId = searchParams.get('job_id');

  if (!jobId) {
    return new Response('Missing job_id', { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      // Send initial connection event
      sendEvent({ type: 'connected', job_id: jobId });

      // Poll for updates
      const interval = setInterval(() => {
        const job = activeJobs.get(jobId);
        if (job) {
          sendEvent({
            type: 'progress',
            status: job.status,
            progress: job.progress,
            error: job.error,
          });

          if (job.status === 'completed' || job.status === 'failed') {
            sendEvent({ type: job.status });
            clearInterval(interval);
            controller.close();
          }
        }
      }, 1000);

      // Cleanup
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
```

#### Day 5: Frontend Generation UI

**File to Create:**

```typescript
// src/app/generate/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GeneratePage() {
  const router = useRouter();
  const [target, setTarget] = useState('');
  const [version, setVersion] = useState('');
  const [targetType, setTargetType] = useState('file_format');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'pending' | 'running' | 'completed' | 'failed'>('idle');
  const [error, setError] = useState('');

  const startGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setStatus('pending');
    setProgress(0);
    setError('');

    try {
      // Start generation
      const response = await fetch('/api/v1/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, version, targetType }),
      });

      const result = await response.json();
      const jobId = result.data.job_id;

      // Connect to SSE stream
      const eventSource = new EventSource(`/api/v1/generate/stream?job_id=${jobId}`);
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'progress') {
          setProgress(data.progress);
          setStatus(data.status);
        } else if (data.type === 'completed') {
          setStatus('completed');
          eventSource.close();
          setIsGenerating(false);
        } else if (data.type === 'failed') {
          setStatus('failed');
          setError(data.error);
          eventSource.close();
          setIsGenerating(false);
        }
      };
    } catch (err) {
      setError(err.message);
      setStatus('failed');
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Generate Knowledge Base</h1>

      <form onSubmit={startGeneration} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Target Name</label>
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="e.g., json, png, python"
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Version</label>
          <input
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="e.g., RFC 8259, 1.0, 3.12"
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Target Type</label>
          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="file_format">File Format</option>
            <option value="programming_language">Programming Language</option>
            <option value="protocol">Protocol</option>
            <option value="tool">Tool</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isGenerating || !target}
          className="w-full py-3 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : 'Start Generation'}
        </button>
      </form>

      {status !== 'idle' && (
        <div className="mt-8 p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Generation Progress</h3>
          <div className="w-full bg-muted rounded-full h-4 mb-2">
            <div
              className="bg-primary h-4 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Status: {status} ({progress}%)
          </p>
          {error && (
            <p className="text-sm text-red-500 mt-2">Error: {error}</p>
          )}
          {status === 'completed' && (
            <button
              onClick={() => router.push(`/explore/targets/${target}`)}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              View Generated Content
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

### Week 4: Complete Generation Pipeline

#### Day 1-3: Extend Executor for Layer 3

**Update `/src/engine/generation/executor.ts`:**

```typescript
// Add Layer 3 generation
async function executeLayer3(target: string, capabilities: Capability[]) {
  // Generate composition rules
  const compositionTasks = this.planner.generateCompositionTasks(target, capabilities);
  await this.executeBatch(compositionTasks);

  // Generate blueprints
  const blueprintTasks = this.planner.generateBlueprintTasks(target, capabilities);
  await this.executeBatch(blueprintTasks);
}

// Update main execution flow
async function executeFullGeneration(
  target: string,
  version: string,
  targetType: string,
  progressCallback?: (progress: number) => void
) {
  // Layer 1
  await this.executeLayer1(target, targetType);
  progressCallback?.(20);

  // Parse capabilities
  const capabilities = await this.parseCapabilities(target);
  progressCallback?.(30);

  // Layer 2
  await this.executeLayer2(target, capabilities);
  progressCallback?.(60);

  // Layer 3 (NEW)
  await this.executeLayer3(target, capabilities);
  progressCallback?.(80);

  // Gap analysis & fill
  await this.executeGapAnalysis(target, capabilities);
  progressCallback?.(90);

  // Validation
  await this.executeValidation(target);
  progressCallback?.(100);
}
```

#### Day 4-5: Testing & Verification

**Exit Criteria:**
- [ ] Generation endpoint accepts POST requests
- [ ] Progress updates stream to frontend
- [ ] Generation completes for JSON target
- [ ] Generated data appears in database

---

## Phase 3: Complete Pipeline (Week 5-6)

### Week 5: Validation & Gap Analysis

#### Day 1-3: Validation Engine

**Files to Create:**

```typescript
// src/engine/validation/schemaValidator.ts
import { z } from 'zod';

export class SchemaValidator {
  async validateCapability(data: unknown): Promise<ValidationResult> {
    const schema = z.object({
      name: z.string(),
      description: z.string(),
      complexity: z.enum(['basic', 'intermediate', 'advanced', 'expert']),
      // ... more fields
    });

    try {
      schema.parse(data);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      };
    }
  }
}
```

```typescript
// src/engine/validation/codeRunner.ts
import { spawn } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { writeFileSync, unlinkSync } from 'fs';

export class CodeRunner {
  async runPython(code: string, timeout = 5000): Promise<RunResult> {
    const tempFile = join(tmpdir(), `magb_test_${Date.now()}.py`);
    
    try {
      writeFileSync(tempFile, code);
      
      return new Promise((resolve) => {
        const proc = spawn('python3', [tempFile], {
          timeout,
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (data) => { stdout += data; });
        proc.stderr.on('data', (data) => { stderr += data; });

        proc.on('close', (code) => {
          unlinkSync(tempFile);
          resolve({
            success: code === 0,
            stdout,
            stderr,
            exitCode: code,
          });
        });

        proc.on('error', (err) => {
          unlinkSync(tempFile);
          resolve({
            success: false,
            error: err.message,
          });
        });
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { success: false, error: 'Python not found' };
      }
      throw error;
    }
  }
}
```

#### Day 4-5: Gap Analysis

**File to Create:**

```typescript
// src/engine/generation/gapAnalysis.ts
export class GapAnalyzer {
  async analyze(target: string, capabilities: Capability[]): Promise<Gap[]> {
    const gaps: Gap[] = [];

    // Check against anchors (keywords, builtins, stdlib modules)
    const anchors = await this.getAnchorsForTarget(target);
    
    for (const anchor of anchors) {
      const isCovered = capabilities.some(
        cap => cap.name.toLowerCase().includes(anchor.name.toLowerCase())
      );
      
      if (!isCovered) {
        gaps.push({
          type: 'missing_anchor',
          description: `Missing coverage for ${anchor.name}`,
          severity: 'important',
          suggestedPath: `${anchor.category}/${anchor.name}`,
        });
      }
    }

    return gaps;
  }
}
```

### Week 6: Observability & Health Dashboard

#### Day 1-3: Vitality Computation

**File to Create:**

```typescript
// src/engine/observability/vitality.ts
export class VitalityCalculator {
  async computeVitality(nodeId: string): Promise<VitalityScore> {
    const node = await this.store.getNode(nodeId);
    const now = Date.now();
    
    // Freshness: based on last_validated timestamp
    const freshness = this.calculateFreshness(node.lastValidated, now);
    
    // Correctness: based on validation results
    const correctness = await this.calculateCorrectness(nodeId);
    
    // Completeness: based on required fields
    const completeness = this.calculateCompleteness(node);
    
    // Overall: weighted average
    const overall = (freshness * 0.4) + (correctness * 0.4) + (completeness * 0.2);
    
    return {
      freshness,
      correctness,
      completeness,
      overall,
    };
  }
}
```

#### Day 4-5: Health Dashboard with Real Data

**Update `/src/app/health/page.tsx`:**

```typescript
// Connect to real API
const { data: vitality } = useQuery({
  queryKey: ['vitality'],
  queryFn: () => fetch('/api/v1/vitality').then(r => r.json()),
});
```

---

## Phase 4: Polish & Production (Week 7-8)

### Week 7: CLI Tool

**File to Create:**

```typescript
// src/cli.ts
#!/usr/bin/env bun

import { Command } from 'commander';
import { GenerationExecutor } from './engine/generation/executor';
import { loadConfig } from './engine/config';

const program = new Command();

program
  .name('magb')
  .description('magB Knowledge Base Generator')
  .version('0.1.0');

program
  .command('generate <target>')
  .description('Generate knowledge base for a target')
  .option('-v, --version <version>', 'Target version')
  .option('-t, --type <type>', 'Target type', 'file_format')
  .option('--dry-run', 'Show what would be generated')
  .option('--estimate-cost', 'Estimate token cost before generation')
  .action(async (target, options) => {
    if (options.estimateCost) {
      const estimate = await estimateGenerationCost(target, options.type);
      console.log(`Estimated cost: $${estimate.usd.toFixed(2)}`);
      console.log(`Estimated tokens: ${estimate.tokens.toLocaleString()}`);
      return;
    }

    if (options.dryRun) {
      console.log('Dry run mode - no generation will occur');
      // Show planned tasks
      return;
    }

    // Run full generation
    const config = await loadConfig();
    const executor = new GenerationExecutor(config);
    await executor.executeFullGeneration(target, options.version, options.type);
  });

program.parse();
```

### Week 8: Documentation & Testing

**Files to Create:**

- `docs/GETTING_STARTED.md` - Setup and first generation
- `docs/API.md` - API endpoint documentation
- `docs/GENERATION.md` - How generation works
- `tests/engine/*.test.ts` - Unit tests for engine
- `tests/e2e/*.test.ts` - Playwright E2E tests

---

## Success Criteria Summary

| Phase | Criteria | Timeline |
|-------|----------|----------|
| **Phase 1** | API backend functional, seed data loaded, frontend displays data | Week 1-2 |
| **Phase 2** | Generation endpoint works, progress streams to UI | Week 3-4 |
| **Phase 3** | Full 6-phase pipeline, validation passes, health dashboard works | Week 5-6 |
| **Phase 4** | CLI tool works, docs complete, tests pass | Week 7-8 |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| **LLM rate limits** | Implement request queuing, use multiple API keys |
| **Generation failures** | Checkpoint-based resumption, detailed error logging |
| **Poor quality output** | Validation phase, human review workflow |
| **Scope creep** | Stick to MVP features, defer nice-to-haves |
| **Database performance** | Index optimization, query caching |

---

## File Checklist

### Phase 1 Files (Create)
- [ ] `src/app/api/v1/health/route.ts`
- [ ] `src/app/api/v1/targets/route.ts`
- [ ] `src/app/api/v1/targets/[id]/route.ts`
- [ ] `src/app/api/v1/deps.ts`
- [ ] `prisma/seed.ts`
- [ ] Store methods in `src/engine/store/index.ts`

### Phase 2 Files (Create)
- [ ] `src/app/api/v1/generate/route.ts`
- [ ] `src/app/api/v1/generate/stream/route.ts`
- [ ] `src/app/generate/page.tsx`
- [ ] Extend `src/engine/generation/executor.ts`

### Phase 3 Files (Create)
- [ ] `src/engine/validation/schemaValidator.ts`
- [ ] `src/engine/validation/codeRunner.ts`
- [ ] `src/engine/generation/gapAnalysis.ts`
- [ ] `src/engine/observability/vitality.ts`

### Phase 4 Files (Create)
- [ ] `src/cli.ts`
- [ ] `docs/GETTING_STARTED.md`
- [ ] `docs/API.md`
- [ ] Test files

---

## Conclusion

This plan provides a **graceful, incremental path** to integrating database generation into the magB frontend. By following the vertical slice approach and completing one phase at a time, we minimize risk and ensure working software at each stage.

**Key Success Factors:**
1. Start with the API backend (Phase 1) - without this, nothing else works
2. Implement progress streaming early (Phase 2) - critical for UX
3. Don't skip validation (Phase 3) - quality matters more than quantity
4. Document as you go (Phase 4) - future maintainers will thank you

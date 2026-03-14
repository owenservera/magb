import * as fs from "fs";
import * as path from "path";

export enum TaskStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
}

export interface TaskCheckpoint {
  taskId: string;
  phase: string;
  status: TaskStatus;
  resultNodeId?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  tokenCost: number;
  apiCostUsd: number;
}

export interface RunSummary {
  statusCounts: Record<string, number>;
  totalTokens: number;
  totalCostUsd: number;
}

export class CheckpointManager {
  private baseDir: string;
  private memoryCache: Map<string, Record<string, TaskCheckpoint>> = new Map();

  constructor(baseDir: string = "checkpoints") {
    this.baseDir = path.resolve(process.cwd(), baseDir);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private getFilePath(runId: string): string {
    return path.join(this.baseDir, `${runId}.json`);
  }

  private loadRun(runId: string): Record<string, TaskCheckpoint> {
    if (this.memoryCache.has(runId)) {
      return this.memoryCache.get(runId)!;
    }

    const filePath = this.getFilePath(runId);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      this.memoryCache.set(runId, data);
      return data;
    }

    const initial = {};
    this.memoryCache.set(runId, initial);
    return initial;
  }

  private saveRun(runId: string) {
    const data = this.loadRun(runId);
    fs.writeFileSync(this.getFilePath(runId), JSON.stringify(data, null, 2), "utf-8");
  }

  getCompletedTasks(runId: string): Set<string> {
    const run = this.loadRun(runId);
    const completed = new Set<string>();
    for (const [taskId, cp] of Object.entries(run)) {
      if (cp.status === TaskStatus.COMPLETED) {
        completed.add(taskId);
      }
    }
    return completed;
  }

  markStarted(runId: string, taskId: string, phase: string) {
    const run = this.loadRun(runId);
    run[taskId] = {
      taskId,
      phase,
      status: TaskStatus.RUNNING,
      startedAt: new Date().toISOString(),
      tokenCost: 0,
      apiCostUsd: 0,
    };
    this.saveRun(runId);
  }

  markCompleted(runId: string, taskId: string, resultNodeId: string, tokenCost: number, apiCost: number) {
    const run = this.loadRun(runId);
    if (run[taskId]) {
      run[taskId].status = TaskStatus.COMPLETED;
      run[taskId].completedAt = new Date().toISOString();
      run[taskId].resultNodeId = resultNodeId;
      run[taskId].tokenCost = tokenCost;
      run[taskId].apiCostUsd = apiCost;
      this.saveRun(runId);
    }
  }

  markFailed(runId: string, taskId: string, error: string) {
    const run = this.loadRun(runId);
    if (run[taskId]) {
      run[taskId].status = TaskStatus.FAILED;
      run[taskId].completedAt = new Date().toISOString();
      run[taskId].error = error;
      this.saveRun(runId);
    }
  }

  getRunSummary(runId: string): RunSummary {
    const run = this.loadRun(runId);
    const summary: RunSummary = {
      statusCounts: {},
      totalTokens: 0,
      totalCostUsd: 0,
    };

    for (const cp of Object.values(run)) {
      summary.statusCounts[cp.status] = (summary.statusCounts[cp.status] || 0) + 1;
      summary.totalTokens += cp.tokenCost || 0;
      summary.totalCostUsd += cp.apiCostUsd || 0;
    }

    return summary;
  }
}

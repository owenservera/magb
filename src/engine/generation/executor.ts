import { ZaiClient } from "../llm/ZaiClient";
import { Config } from "../config";
import { UniversalKnowledgeStore } from "../store";
import { CheckpointManager, TaskStatus } from "./CheckpointManager";
import { GenerationPlanner, GenerationTask, GenerationPhase } from "./planner";
import { PromptTemplates } from "./prompts";
import { globalRateLimiter } from "../llm/RateLimiter";
import { v4 as uuidv4 } from "uuid";
import { logger } from "@/lib/logger";

export class GenerationExecutor {
  private db: UniversalKnowledgeStore;
  private llm: ZaiClient;
  private config: Config;
  private checkpointManager: CheckpointManager;

  constructor(
    db: UniversalKnowledgeStore,
    llm: ZaiClient,
    config: Config
  ) {
    this.db = db;
    this.llm = llm;
    this.config = config;
    this.checkpointManager = new CheckpointManager();
  }

  async executeFullGeneration(
    target: string,
    targetType: string,
    runId: string,
    resume: boolean = true
  ) {
    const log = logger;
    log.info('Starting generation', { runId, target, targetType, resume });

    let completedTasks = new Set<string>();
    if (resume) {
      completedTasks = this.checkpointManager.getCompletedTasks(runId);
      log.info(`Resuming with ${completedTasks.size} completed tasks`);
    }

    // LAYER 1 Tasks
    const layer1Tasks = GenerationPlanner.generateLayer1Tasks(target, targetType);
    let capabilities: any[] = [];
    let lastApiCallTime = Date.now();

    for (const task of layer1Tasks) {
      const taskStart = Date.now();
      const timeSinceLastCall = taskStart - lastApiCallTime;
      log.info(`Starting Layer 1 task: ${task.id}`, { timeSinceLastCall: `${timeSinceLastCall}ms` });
      
      if (completedTasks.has(task.id)) {
        log.info(`Skipping completed task: ${task.id}`);
        // If it's capability discovery, we still need to load capabilities to generate Layer 2 tasks
        if (task.section === "capabilities") {
            const capsResult = await this.db.db.capability.findMany({
                where: { targetId: target }
            });
            capabilities = capsResult.map(c => ({id: c.id.replace(`cap_${target}_`, ''), name: c.name}));
        }
        continue;
      }

      try {
        this.checkpointManager.markStarted(runId, task.id, task.phase);

        let prompt = "";
        let sysPrompt = "You are an expert systems architect.";

        if (task.section === "capabilities") {
            prompt = PromptTemplates.discoverCapabilities(target, targetType);
        } else if (task.section === "coordinate_system") {
            prompt = PromptTemplates.extractCoordinateSystem(target);
            sysPrompt = "You are a format expert.";
        } else if (task.section === "minimal_file") {
            prompt = PromptTemplates.extractMinimalValidFile(target);
            sysPrompt = "You are a format expert.";
        }

        const result = await this.llm.generateJson<any>(prompt, sysPrompt);

        // Store result
        const nodeId = await this.storeResult(target, task, result);
        const taskDuration = Date.now() - taskStart;
        this.checkpointManager.markCompleted(runId, task.id, nodeId, 1000, 0.05);

        log.info(`Layer 1 task completed: ${task.id}`, { duration: `${taskDuration}ms`, nodeId });

        // Add delay between API calls to ensure sequential execution
        await new Promise(r => setTimeout(r, 5000));

        lastApiCallTime = Date.now();

        if (task.section === "capabilities" && result.capabilities) {
            capabilities = result.capabilities;
        }
      } catch (err: any) {
        log.error(`Task ${task.id} failed:`, err.message);
        this.checkpointManager.markFailed(runId, task.id, err.message || "Unknown error");
      }
    }

    if (capabilities.length === 0) {
        log.error("No capabilities discovered, stopping execution.");
        return;
    }

    log.info(`Discovered ${capabilities.length} capabilities. Proceeding to Layer 2.`);

    // LAYER 2 Tasks
    const layer2Tasks = GenerationPlanner.generateLayer2Tasks(target, capabilities);

    // Process layer 2 sequentially to ensure all API calls are sequential
    for (const task of layer2Tasks) {
      const taskStart = Date.now();
      const timeSinceLastCall = taskStart - lastApiCallTime;
      log.info(`Starting Layer 2 task: ${task.id}`, { timeSinceLastCall: `${timeSinceLastCall}ms` });

      if (completedTasks.has(task.id)) {
        log.info(`Skipping completed task: ${task.id}`);
        continue;
      }

      try {
        this.checkpointManager.markStarted(runId, task.id, task.phase);

        let prompt = "";
        const capability = capabilities.find(c => c.id === task.subsection);
        if (!capability) continue;

        if (task.section === "template") {
            prompt = PromptTemplates.extractStructuralTemplate(target, capability);
        } else if (task.section === "algorithm") {
            prompt = PromptTemplates.extractAlgorithm(target, capability);
        }

        const result = await this.llm.generateJson<any>(prompt, "You are a format implementation expert.");

        const nodeId = await this.storeResult(target, task, result);
        const taskDuration = Date.now() - taskStart;
        this.checkpointManager.markCompleted(runId, task.id, nodeId, 2000, 0.1);

        log.info(`Layer 2 task completed: ${task.id}`, { duration: `${taskDuration}ms`, nodeId });

        // Add delay between API calls to ensure sequential execution
        await new Promise(r => setTimeout(r, 5000));

        lastApiCallTime = Date.now();

      } catch (err: any) {
        log.error(`Task ${task.id} failed:`, err.message);
        this.checkpointManager.markFailed(runId, task.id, err.message || "Unknown error");
      }
    }

    log.info("Generation complete!", globalRateLimiter.getStats());
  }

  private async storeResult(target: string, task: GenerationTask, data: any): Promise<string> {
    const log = logger;
    
    // Ensure target exists
    await this.db.db.target.upsert({
        where: { id: target },
        update: {},
        create: {
            id: target,
            name: target,
            kind: 'FILE_FORMAT', // default fallback
            generationStatus: 'IN_PROGRESS'
        }
    });

    if (task.section === "capabilities") {
        log.info(`Storing ${data.capabilities?.length || 0} capabilities for ${target}`);
        for (const cap of data.capabilities) {
            const capId = `cap_${target}_${cap.id}`;
            await this.db.db.capability.upsert({
                where: { id: capId },
                update: {
                    name: cap.name,
                    category: cap.category,
                    userDescription: cap.description,
                },
                create: {
                    id: capId,
                    targetId: target,
                    name: cap.name,
                    category: cap.category,
                    userDescription: cap.description,
                }
            });
        }
        return `target_${target}`;
    }

    if (task.section === "coordinate_system") {
        const atomId = `atom_${target}_coords`;
        log.info(`Storing coordinate system: ${atomId}`);
        await this.db.db.atom.upsert({
            where: { id: atomId },
            update: {
                structure: data.coordinate_system
            },
            create: {
                id: atomId,
                targetId: target,
                atomType: 'COORDINATE_SYSTEM',
                elementName: "Coordinate System",
                structure: data.coordinate_system
            }
        });
        return atomId;
    }

    if (task.section === "minimal_file") {
        const atomId = `atom_${target}_minimal`;
        log.info(`Storing minimal file: ${atomId}`);
        await this.db.db.atom.upsert({
            where: { id: atomId },
            update: {
                structure: data.minimal_file
            },
            create: {
                id: atomId,
                targetId: target,
                atomType: 'SYNTAX_RULE',
                elementName: "Minimal File",
                structure: data.minimal_file
            }
        });
        return atomId;
    }

    if (task.section === "template") {
        const atomId = `atom_${target}_${task.subsection}_template`;
        const capId = `cap_${target}_${task.subsection}`;
        log.info(`Storing template: ${atomId}`);
        
        await this.db.db.atom.upsert({
            where: { id: atomId },
            update: {
                structure: data
            },
            create: {
                id: atomId,
                targetId: target,
                atomType: 'XML_ELEMENT', // Defaulting for file format
                elementName: task.subsection!,
                structure: data
            }
        });

        // Link to capability
        await this.db.db.relation.create({
            data: {
                sourceId: capId,
                sourceType: 'capability',
                relTargetId: atomId,
                relTargetType: 'atom',
                relationType: 'REQUIRES'
            }
        });

        return atomId;
    }

    if (task.section === "algorithm") {
        if (!data.algorithms || data.algorithms.length === 0) {
            log.info(`No algorithm for ${task.subsection}`);
            return "no_algorithm";
        }

        const algo = data.algorithms[0];
        const algoId = `algo_${target}_${task.subsection}`;
        const capId = `cap_${target}_${task.subsection}`;
        log.info(`Storing algorithm: ${algoId}`);

        await this.db.db.algorithm.upsert({
            where: { id: algoId },
            update: {
                name: algo.name,
                purpose: algo.purpose,
                pseudocode: JSON.stringify(algo.pseudocode)
            },
            create: {
                id: algoId,
                name: algo.name,
                category: "General",
                domain: "General",
                purpose: algo.purpose,
                pseudocode: JSON.stringify(algo.pseudocode)
            }
        });

        // Link to capability
        await this.db.db.relation.create({
            data: {
                sourceId: capId,
                sourceType: 'capability',
                relTargetId: algoId,
                relTargetType: 'algorithm',
                relationType: 'REQUIRES'
            }
        });

        return algoId;
    }

    log.warn(`Unknown task section: ${task.section}`);
    return uuidv4();
  }
}

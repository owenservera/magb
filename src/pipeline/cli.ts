/**
 * Generation Pipeline CLI
 * 
 * Main entry point for running the knowledge generation pipeline.
 * Usage: bun run src/pipeline/cli.ts --target <target_id> --resume
 */

import { GenerationExecutor } from '@/engine/generation/executor';
import { UniversalKnowledgeStore } from '@/engine/store';
import { ZaiClient } from '@/engine/llm/ZaiClient';
import { loadConfig } from '@/engine/config';
import { logger, startTimer } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

interface CliArgs {
  target?: string;
  targetType?: string;
  resume?: boolean;
  runId?: string;
  help?: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const parsed: CliArgs = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--target' || arg === '-t') {
      parsed.target = args[++i];
    } else if (arg === '--target-type' || arg === '-tt') {
      parsed.targetType = args[++i];
    } else if (arg === '--resume' || arg === '-r') {
      parsed.resume = true;
    } else if (arg === '--run-id') {
      parsed.runId = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      parsed.help = true;
    }
  }
  
  return parsed;
}

function showHelp() {
  console.log(`
magB Generation Pipeline
========================

Usage: bun run src/pipeline/cli.ts [options]

Options:
  -t, --target <id>       Target ID to generate knowledge for (e.g., "json", "python")
  -tt, --target-type <type> Target type (e.g., "DATA_FORMAT", "PROGRAMMING_LANGUAGE")
  -r, --resume            Resume from last checkpoint if available
  --run-id <id>           Use specific run ID (default: auto-generated UUID)
  -h, --help              Show this help message

Examples:
  bun run src/pipeline/cli.ts --target json
  bun run src/pipeline/cli.ts -t python -tt PROGRAMMING_LANGUAGE -r
  bun run src/pipeline/cli.ts --target pptx --run-id my-run-123

Environment Variables:
  ZAI_API_KEY             Required: Z.AI API key for LLM access
  DATABASE_URL            Required: PostgreSQL connection string
  LOG_LEVEL               Optional: DEBUG, INFO, WARN, ERROR (default: INFO)
  LOG_FILE                Optional: Path to log file
`);
}

async function main() {
  const args = parseArgs();
  
  if (args.help) {
    showHelp();
    process.exit(0);
  }
  
  if (!args.target) {
    console.error('Error: --target is required');
    console.error('Use --help for usage information');
    process.exit(1);
  }
  
  const runId = args.runId || uuidv4();
  const targetType = args.targetType || 'DATA_FORMAT';
  
  logger.info('Starting magB Generation Pipeline', {
    runId,
    target: args.target,
    targetType,
    resume: args.resume,
  });
  
  const timer = startTimer('Full Generation Run');
  
  try {
    // Initialize components
    const config = loadConfig();
    const store = new UniversalKnowledgeStore();
    const llm = new ZaiClient(config);
    const executor = new GenerationExecutor(store, llm, config);
    
    // Run generation
    await executor.executeFullGeneration(
      args.target,
      targetType,
      runId,
      args.resume
    );
    
    const duration = timer.end();
    logger.info('Generation pipeline completed', {
      duration: `${duration}ms`,
      runId,
    });
    
    // Print summary
    const checkpointManager = (executor as any).checkpointManager;
    const summary = checkpointManager.getRunSummary(runId);
    
    console.log('\n📊 Run Summary:');
    console.log('───────────────');
    console.log(`Status: ${JSON.stringify(summary.statusCounts)}`);
    console.log(`Total Tokens: ${summary.totalTokens}`);
    console.log(`Total Cost: $${summary.totalCostUsd.toFixed(2)}`);
    console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);
    
  } catch (error) {
    logger.errorWithStack('Pipeline failed', error as Error);
    timer.end();
    process.exit(1);
  }
}

// Run the CLI
main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

import { ZaiClient } from "../engine/llm/ZaiClient";
import { loadConfig } from "../engine/config";
import { UniversalKnowledgeStore } from "../engine/store";
import { GenerationExecutor } from "../engine/generation/executor";
import { globalRateLimiter } from "../engine/llm/RateLimiter";

// Global API call tracking
const apiCallTracker = {
  calls: [] as Array<{timestamp: number, source: string, details: any}>,
  
  log(source: string, details: any = {}) {
    const entry = {
      timestamp: Date.now(),
      source,
      details
    };
    this.calls.push(entry);
    console.log(`🌐 [GLOBAL API TRACKER] ${source}:`, details);
  },
  
  printSummary() {
    console.log(`\n📊 GLOBAL API CALL SUMMARY:`);
    console.log(`Total API calls tracked: ${this.calls.length}`);
    this.calls.forEach((call, i) => {
      console.log(`  ${i+1}. [${new Date(call.timestamp).toISOString()}] ${call.source}`);
    });
  }
};

// Monkey-patch fetch globally to track ALL HTTP requests
const originalFetch = global.fetch;
global.fetch = async function(input: string | Request | URL, init?: RequestInit) {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const options = init || {};
  
  if (url.includes('api.z.ai') || url.includes('localhost')) {
    apiCallTracker.log('GLOBAL_FETCH', { url, method: options.method || 'GET' });
  }
  
  return originalFetch(input, init);
} as typeof fetch;

async function main() {
  const target = process.argv[2] || "json";
  const targetType = process.argv[3] || "data_format";
  const runId = `run_${target}_${Date.now()}`;

  console.log(`Starting generation for target: ${target} (${targetType})`);
  console.log(`Run ID: ${runId}`);

  // Initial delay to avoid rate limits from previous runs
  await new Promise(r => setTimeout(r, 2000));

  const config = loadConfig();
  const llm = new ZaiClient(config);
  const store = new UniversalKnowledgeStore();
  const executor = new GenerationExecutor(store, llm, config);

  // Monitor rate limiter stats periodically
  const statsInterval = setInterval(() => {
    const stats = globalRateLimiter.getStats();
    console.log(`[PROGRESS] Requests: ${stats.totalRequests}, Retries: ${stats.totalRetries}, Rate Limit Hits: ${stats.rateLimitHits}, Queue: ${stats.queueLength}`);
  }, 10000); // Every 10 seconds

  try {
    await executor.executeFullGeneration(target, targetType, runId, false);
    
    console.log("\n✅ Generation completed successfully.");
    const stats = await store.getStatistics();
    console.log("📊 Database Stats:", stats);
  } catch (err) {
    console.error("❌ Generation failed:", err);
    process.exit(1);
  } finally {
    clearInterval(statsInterval);
    await store.disconnect();
    apiCallTracker.printSummary();
  }
}

main().catch(console.error);

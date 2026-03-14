import { EventEmitter } from "events";

export interface RateLimiterConfig {
  requestsPerSecond: number;
  burstLimit: number;
  maxRetries: number;
  baseDelayMs: number;
}

interface QueueItem {
  resolve: () => void;
  reject: (error: Error) => void;
  priority: number;
  timestamp: number;
}

export class RateLimiter extends EventEmitter {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number;
  private lastRefill: number;
  private queue: QueueItem[] = [];
  private processing = false;
  private config: RateLimiterConfig;
  private totalRequests = 0;
  private totalRetries = 0;
  private rateLimitHits = 0;

  constructor(config: Partial<RateLimiterConfig> = {}) {
    super();
    this.config = {
      requestsPerSecond: config.requestsPerSecond ?? 2,
      burstLimit: config.burstLimit ?? 5,
      maxRetries: config.maxRetries ?? 10,
      baseDelayMs: config.baseDelayMs ?? 2000,
    };
    this.maxTokens = this.config.burstLimit;
    this.tokens = this.maxTokens;
    this.refillRate = this.config.requestsPerSecond;
    this.lastRefill = Date.now();
  }

  init(): void {
    this.processQueue();
  }

  private refillTokens(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.refillRate;
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  async acquire(priority = 0): Promise<void> {
    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject, priority, timestamp: Date.now() });
      this.processQueue();
    });
  }

  private processQueue(): void {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    const processNext = () => {
      if (this.queue.length === 0) {
        this.processing = false;
        return;
      }

      this.refillTokens();

      if (this.tokens >= 1) {
        this.queue.sort((a, b) => {
          if (a.priority !== b.priority) return b.priority - a.priority;
          return a.timestamp - b.timestamp;
        });

        const item = this.queue.shift()!;
        this.tokens -= 1;
        this.totalRequests++;
        this.emit("request", { remainingTokens: this.tokens });
        item.resolve();
        setTimeout(processNext, 50);
      } else {
        const waitTime = ((1 - this.tokens) / this.refillRate) * 1000;
        setTimeout(processNext, Math.min(waitTime, 500));
      }
    };

    processNext();
  }

  async waitForToken(): Promise<void> {
    this.refillTokens();
    console.log(`🔍 [${Date.now()}] Rate limiter state: tokens=${this.tokens.toFixed(2)}, maxTokens=${this.maxTokens}, refillRate=${this.refillRate}`);
    
    if (this.tokens >= 1) {
      this.tokens -= 1;
      this.totalRequests++;
      console.log(`✅ [${Date.now()}] Token acquired immediately. Remaining tokens: ${this.tokens.toFixed(2)}`);
      return;
    }

    const waitTime = ((1 - this.tokens) / this.refillRate) * 1000;
    console.log(`⏰ [${Date.now()}] Waiting ${waitTime.toFixed(0)}ms for token refill...`);
    await this.sleep(waitTime);
    this.tokens = 0;
    this.totalRequests++;
    console.log(`✅ [${Date.now()}] Token acquired after wait. Remaining tokens: ${this.tokens.toFixed(2)}`);
  }

  recordRateLimitHit(): void {
    this.rateLimitHits++;
    this.totalRetries++;
    this.emit("rateLimitHit", { hits: this.rateLimitHits });
  }

  recordRetry(): void {
    this.totalRetries++;
    this.emit("retry", { retries: this.totalRetries });
  }

  getStats() {
    return {
      totalRequests: this.totalRequests,
      totalRetries: this.totalRetries,
      rateLimitHits: this.rateLimitHits,
      queueLength: this.queue.length,
      currentTokens: Math.round(this.tokens * 100) / 100,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const globalRateLimiter = new RateLimiter({
  requestsPerSecond: 0.2, // 1 request every 5 seconds
  burstLimit: 1,
  baseDelayMs: 5000,
});

globalRateLimiter.init();

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RateLimiter } from '../llm/RateLimiter';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter({
      requestsPerSecond: 2,
      burstLimit: 5,
      maxRetries: 3,
      baseDelayMs: 1000,
    });
    rateLimiter.init();
  });

  it('should initialize with correct token count', () => {
    const stats = rateLimiter.getStats();
    expect(stats.currentTokens).toBeLessThanOrEqual(5);
  });

  it('should acquire tokens successfully', async () => {
    await expect(rateLimiter.waitForToken()).resolves.toBeUndefined();
  });

  it('should track request count', async () => {
    await rateLimiter.waitForToken();
    const stats = rateLimiter.getStats();
    expect(stats.totalRequests).toBeGreaterThan(0);
  });

  it('should handle rate limit hit recording', () => {
    rateLimiter.recordRateLimitHit();
    const stats = rateLimiter.getStats();
    expect(stats.rateLimitHits).toBe(1);
  });

  it('should handle retry recording', () => {
    rateLimiter.recordRetry();
    const stats = rateLimiter.getStats();
    expect(stats.totalRetries).toBe(1);
  });

  it('should emit events on rate limit hit', () => {
    const mockCallback = vi.fn();
    rateLimiter.on('rateLimitHit', mockCallback);
    rateLimiter.recordRateLimitHit();
    expect(mockCallback).toHaveBeenCalledWith({ hits: 1 });
  });

  it('should emit events on retry', () => {
    const mockCallback = vi.fn();
    rateLimiter.on('retry', mockCallback);
    rateLimiter.recordRetry();
    expect(mockCallback).toHaveBeenCalledWith({ retries: 1 });
  });
});

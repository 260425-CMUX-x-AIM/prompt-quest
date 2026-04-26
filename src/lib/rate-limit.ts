export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

interface RateLimitBucket {
  count: number;
  reset: number;
}

class MemoryRateLimiter {
  private readonly buckets = new Map<string, RateLimitBucket>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly prefix: string,
  ) {}

  async limitRequest(identifier: string): Promise<RateLimitResult> {
    const now = Date.now();
    const key = `${this.prefix}:${identifier}`;
    const existing = this.buckets.get(key);

    if (!existing || existing.reset <= now) {
      const reset = now + this.windowMs;
      this.buckets.set(key, { count: 1, reset });
      return {
        success: true,
        limit: this.limit,
        remaining: this.limit - 1,
        reset,
      };
    }

    existing.count += 1;
    const remaining = Math.max(0, this.limit - existing.count);

    return {
      success: existing.count <= this.limit,
      limit: this.limit,
      remaining,
      reset: existing.reset,
    };
  }
}

const messageLimiter = new MemoryRateLimiter(20, 60_000, 'rl:msg');
const sessionStartLimiter = new MemoryRateLimiter(10, 24 * 60 * 60 * 1000, 'rl:session-start');
const evaluationLimiter = new MemoryRateLimiter(8, 24 * 60 * 60 * 1000, 'rl:eval');

export const limits = {
  message: {
    limit: (identifier: string) => messageLimiter.limitRequest(identifier),
  },
  sessionStart: {
    limit: (identifier: string) => sessionStartLimiter.limitRequest(identifier),
  },
  evaluation: {
    limit: (identifier: string) => evaluationLimiter.limitRequest(identifier),
  },
};

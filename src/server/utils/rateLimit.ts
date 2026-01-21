/**
 * Simple in-memory rate limiter
 * For production, use Redis-based rate limiting (e.g., @upstash/ratelimit)
 */

type RateLimitConfig = {
  maxRequests: number;
  windowMs: number;
};

type RateLimitStore = {
  [key: string]: {
    count: number;
    resetAt: number;
  };
};

const store: RateLimitStore = {};

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetAt < now) {
      delete store[key];
    }
  }
}, 5 * 60 * 1000);

export function rateLimit(config: RateLimitConfig) {
  return (identifier: string): { allowed: boolean; remaining: number; resetAt: number } => {
    const now = Date.now();
    const key = identifier;
    const entry = store[key];

    if (!entry || entry.resetAt < now) {
      // Create new entry or reset expired entry
      store[key] = {
        count: 1,
        resetAt: now + config.windowMs
      };
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: now + config.windowMs
      };
    }

    if (entry.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt
      };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetAt: entry.resetAt
    };
  };
}

// Pre-configured rate limiters
export const loginRateLimit = rateLimit({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000 // 15 minutes
});

export const apiRateLimit = rateLimit({
  maxRequests: 100,
  windowMs: 60 * 1000 // 1 minute
});

export const uploadRateLimit = rateLimit({
  maxRequests: 10,
  windowMs: 60 * 1000 // 1 minute
});

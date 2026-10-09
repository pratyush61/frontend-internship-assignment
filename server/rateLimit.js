/**
 * Fixed-window, in-memory limiter. On serverless each warm instance keeps its
 * own counters, so this is best-effort abuse protection, not a hard quota.
 * Set a spend cap or alert on the API key for real protection.
 */
export function createRateLimiter({ limit = 10, windowMs = 60_000, now = Date.now } = {}) {
  const hits = new Map(); // key -> { count, resetAt }
  return function allow(key) {
    const t = now();
    for (const [k, v] of hits) if (v.resetAt <= t) hits.delete(k); // prune expired
    const entry = hits.get(key);
    if (!entry) {
      hits.set(key, { count: 1, resetAt: t + windowMs });
      return true;
    }
    if (entry.count >= limit) return false;
    entry.count += 1;
    return true;
  };
}

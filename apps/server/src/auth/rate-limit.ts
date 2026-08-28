export class FixedWindowRateLimiter {
  #entries = new Map<string, { windowStart: number; count: number }>();
  constructor(readonly limit: number, readonly windowMs: number, readonly now: () => number = Date.now) {}
  allow(key: string): boolean {
    const current = this.now();
    const entry = this.#entries.get(key);
    if (!entry || current - entry.windowStart >= this.windowMs) {
      this.#entries.set(key, { windowStart: current, count: 1 });
      return true;
    }
    if (entry.count >= this.limit) return false;
    entry.count += 1;
    return true;
  }
}

export class TokenBucket {
  #tokens: number;
  #updatedAt: number;
  constructor(readonly capacity: number, readonly refillPerSecond: number, readonly now: () => number = Date.now) {
    this.#tokens = capacity;
    this.#updatedAt = now();
  }
  take(count = 1): boolean {
    const current = this.now();
    this.#tokens = Math.min(this.capacity, this.#tokens + (current - this.#updatedAt) / 1000 * this.refillPerSecond);
    this.#updatedAt = current;
    if (this.#tokens < count) return false;
    this.#tokens -= count;
    return true;
  }
}

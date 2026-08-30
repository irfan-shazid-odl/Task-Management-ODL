// Simple in-memory cache with TTL.
//
// get() already evicts a key lazily once it's read past its expiry, but a key
// that's set and never read again — e.g. dashboard stats for one admin's
// custom date-range pick that they never revisit — previously sat in `store`
// forever. That key space is unbounded (memberId x arbitrary date range), so
// under sustained traffic from many concurrent users the map would grow for
// the life of the process. A periodic sweep now reclaims anything past its
// expiry regardless of whether it's ever read again; get()/set() semantics
// (same TTL, same values) are unchanged.

interface CacheEntry<T> {
  value: T;
  expiry: number;
}

// In-flight computations that haven't settled yet, used to single-flight
// expensive cache-miss work so N concurrent callers for the same key share one
// computation instead of all running it (cache stampede).
const inflight = new Map<string, Promise<unknown>>();

const SWEEP_INTERVAL_MS = 5 * 60_000;

class Cache {
  private store = new Map<string, CacheEntry<any>>();

  constructor() {
    const timer = setInterval(() => this.sweep(), SWEEP_INTERVAL_MS);
    // Don't hold the process open just for this timer (matters for tests/scripts).
    timer.unref?.();
  }

  // Set an item in the cache with a Time-To-Live in milliseconds
  set<T>(key: string, value: T, ttlMs: number): void {
    const expiry = Date.now() + ttlMs;
    this.store.set(key, { value, expiry });
  }

  // Get an item from the cache. Returns undefined if not found or expired.
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  // Get-or-compute with single-flight: if the key is already cached, return it;
  // otherwise run `compute()` once and share the in-flight promise with any
  // concurrent caller for the same key, then store the result for ttlMs. Same
  // values as a naive "check cache, else compute, else set" — the only change is
  // that N simultaneous misses for one key don't each re-run the computation.
  async getOrCompute<T>(key: string, ttlMs: number, compute: () => Promise<T>): Promise<T> {
    const existing = this.get<T>(key);
    if (existing) return existing;

    const pending = inflight.get(key) as Promise<T> | undefined;
    if (pending) return pending;

    const promise = compute()
      .then((value) => {
        this.set(key, value, ttlMs);
        return value;
      })
      .finally(() => {
        inflight.delete(key);
      });

    inflight.set(key, promise);
    return promise;
  }

  // Manually delete an item
  delete(key: string): void {
    this.store.delete(key);
  }

  // Clear the entire cache
  clear(): void {
    this.store.clear();
  }

  // Drop every entry past its expiry, read or not.
  private sweep(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiry) this.store.delete(key);
    }
  }
}

export const cache = new Cache();

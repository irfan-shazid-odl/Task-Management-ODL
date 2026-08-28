// Simple in-memory cache with TTL

interface CacheEntry<T> {
  value: T;
  expiry: number;
}

class Cache {
  private store = new Map<string, CacheEntry<any>>();

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

  // Manually delete an item
  delete(key: string): void {
    this.store.delete(key);
  }

  // Clear the entire cache
  clear(): void {
    this.store.clear();
  }
}

export const cache = new Cache();

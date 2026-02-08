const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Simple in-memory cache with a time-to-live (TTL) per entry.
 *
 * Used to avoid redundant API calls within the same browser session.
 * Each API service gets its own singleton instance (tmdbCache, omdbCache)
 * so cache keys don't collide and caches can be cleared independently.
 */
export class ApiCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private ttl: number;

  constructor(ttl = DEFAULT_TTL_MS) {
    this.ttl = ttl;
  }

  /** Return cached data if it exists and hasn't expired, otherwise null. */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.ttl) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    this.store.set(key, { data, timestamp: Date.now() });
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }

  /** Build a cache key like "tmdb:discover:1" from a prefix and variable parts. */
  static buildKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(":")}`;
  }
}

export const tmdbCache = new ApiCache();
export const omdbCache = new ApiCache();

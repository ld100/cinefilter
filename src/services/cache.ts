const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class ApiCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private ttl: number;

  constructor(ttl = DEFAULT_TTL_MS) {
    this.ttl = ttl;
  }

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

  static buildKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(":")}`;
  }
}

export const tmdbCache = new ApiCache();
export const omdbCache = new ApiCache();

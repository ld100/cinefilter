import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ApiCache } from "../cache";

describe("ApiCache", () => {
  let cache: ApiCache;

  beforeEach(() => {
    cache = new ApiCache(1000); // 1 second TTL for tests
  });

  it("returns null for missing keys", () => {
    expect(cache.get("missing")).toBeNull();
  });

  it("stores and retrieves values", () => {
    cache.set("key1", { data: "hello" });
    expect(cache.get("key1")).toEqual({ data: "hello" });
  });

  it("expires entries after TTL", () => {
    vi.useFakeTimers();
    cache.set("key1", "value");
    expect(cache.get("key1")).toBe("value");

    vi.advanceTimersByTime(1001);
    expect(cache.get("key1")).toBeNull();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("clears all entries", () => {
    cache.set("a", 1);
    cache.set("b", 2);
    expect(cache.size).toBe(2);
    cache.clear();
    expect(cache.size).toBe(0);
  });

  it("buildKey constructs correct key format", () => {
    expect(ApiCache.buildKey("tmdb", "discover", 1)).toBe("tmdb:discover:1");
    expect(ApiCache.buildKey("omdb", "tt1234567")).toBe("omdb:tt1234567");
  });
});

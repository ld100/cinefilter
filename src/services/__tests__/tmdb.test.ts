import { describe, it, expect, vi, beforeEach } from "vitest";
import { discoverMovies, getMovieDetails } from "../tmdb";
import { tmdbCache } from "../cache";
import { mockFilters } from "../../test/fixtures";

beforeEach(() => {
  tmdbCache.clear();
});

describe("discoverMovies", () => {
  it("constructs correct URL with filter params", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: [], total_pages: 0, total_results: 0 }),
    });

    await discoverMovies("testkey", mockFilters, 1, undefined, mockFetch);

    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.searchParams.get("api_key")).toBe("testkey");
    expect(url.searchParams.get("primary_release_date.gte")).toBe("2022-01-01");
    expect(url.searchParams.get("primary_release_date.lte")).toBe("2026-12-31");
    expect(url.searchParams.get("vote_average.gte")).toBe("7");
    expect(url.searchParams.get("vote_count.gte")).toBe("100");
    expect(url.searchParams.get("sort_by")).toBe("vote_average.desc");
  });

  it("includes excluded genres when present", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: [], total_pages: 0, total_results: 0 }),
    });

    const filters = { ...mockFilters, excludedGenres: [28, 35] };
    await discoverMovies("testkey", filters, 1, undefined, mockFetch);

    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.searchParams.get("without_genres")).toBe("28,35");
  });

  it("includes watch providers when present", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: [], total_pages: 0, total_results: 0 }),
    });

    const filters = { ...mockFilters, selectedProviders: [8, 337] };
    await discoverMovies("testkey", filters, 1, undefined, mockFetch);

    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.searchParams.get("with_watch_providers")).toBe("8|337");
    expect(url.searchParams.get("watch_region")).toBe("US");
  });

  it("includes excluded languages when present", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: [], total_pages: 0, total_results: 0 }),
    });

    const filters = { ...mockFilters, excludedLanguages: ["hi", "ta", "te"] };
    await discoverMovies("testkey", filters, 1, undefined, mockFetch);

    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.searchParams.get("without_original_language")).toBe("hi,ta,te");
  });

  it("includes excluded countries when present", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: [], total_pages: 0, total_results: 0 }),
    });

    const filters = { ...mockFilters, excludedCountries: ["IN", "KR"] };
    await discoverMovies("testkey", filters, 1, undefined, mockFetch);

    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.searchParams.get("without_origin_country")).toBe("IN,KR");
  });

  it("omits language/country params when arrays are empty", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: [], total_pages: 0, total_results: 0 }),
    });

    await discoverMovies("testkey", mockFilters, 1, undefined, mockFetch);

    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.searchParams.has("without_original_language")).toBe(false);
    expect(url.searchParams.has("without_origin_country")).toBe(false);
  });

  it("throws on HTTP error", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: () => Promise.resolve("error body"),
    });

    await expect(
      discoverMovies("testkey", mockFilters, 1, undefined, mockFetch),
    ).rejects.toThrow("TMDB 500");
  });
});

describe("getMovieDetails", () => {
  it("fetches details with correct endpoint", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 123,
          title: "Test",
          external_ids: { imdb_id: "tt123" },
        }),
    });

    const result = await getMovieDetails("testkey", 123, undefined, mockFetch);
    expect(result.id).toBe(123);

    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.pathname).toBe("/3/movie/123");
    expect(url.searchParams.get("append_to_response")).toBe(
      "external_ids,watch/providers",
    );
  });
});

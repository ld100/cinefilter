import { describe, it, expect, vi } from "vitest";
import { getByImdbId, parseOmdbResult } from "../omdb";
import { omdbCache } from "../cache";

describe("parseOmdbResult", () => {
  it("parses a normal movie response", () => {
    const result = parseOmdbResult({
      Response: "True",
      Year: "2024",
      imdbRating: "7.8",
      Director: "Christopher Nolan",
      Actors: "Leonardo DiCaprio, Tom Hardy",
    });
    expect(result).toEqual({
      year: 2024,
      rating: 7.8,
      ratingStr: "7.8",
      rawYear: "2024",
      director: "Christopher Nolan",
      actors: "Leonardo DiCaprio, Tom Hardy",
    });
  });

  it("handles series year range (splits on en-dash)", () => {
    const result = parseOmdbResult({
      Response: "True",
      Year: "2020\u20132023",
      imdbRating: "8.5",
    });
    expect(result.year).toBe(2020);
    expect(result.rawYear).toBe("2020");
  });

  it("handles missing year", () => {
    const result = parseOmdbResult({ Response: "True" });
    expect(result.year).toBeNull();
    expect(result.rawYear).toBeNull();
  });

  it("handles N/A rating", () => {
    const result = parseOmdbResult({
      Response: "True",
      Year: "2024",
      imdbRating: "N/A",
    });
    expect(result.rating).toBeNull();
    expect(result.ratingStr).toBe("N/A");
  });

  it("handles missing rating", () => {
    const result = parseOmdbResult({ Response: "True", Year: "2024" });
    expect(result.rating).toBeNull();
  });

  it("handles non-numeric year (NaN guard)", () => {
    const result = parseOmdbResult({ Response: "True", Year: "N/A" });
    expect(result.year).toBeNull();
    expect(result.rawYear).toBe("N/A");
  });
});

describe("getByImdbId", () => {
  beforeEach(() => {
    omdbCache.clear();
  });

  it("fetches and returns data on success", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          Response: "True",
          Title: "Test",
          Year: "2024",
          imdbRating: "7.0",
        }),
    });

    const data = await getByImdbId("testkey", "tt1234567", undefined, mockFetch);
    expect(data.Title).toBe("Test");
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it("throws on HTTP error", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    });

    await expect(
      getByImdbId("badkey", "tt1234567", undefined, mockFetch),
    ).rejects.toThrow("OMDb 401");
  });

  it("throws on OMDb API error response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ Response: "False", Error: "Movie not found!" }),
    });

    await expect(
      getByImdbId("testkey", "tt0000000", undefined, mockFetch),
    ).rejects.toThrow("Movie not found!");
  });

  it("caches successful responses", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ Response: "True", Title: "Cached", Year: "2024" }),
    });

    await getByImdbId("testkey", "tt1111111", undefined, mockFetch);
    await getByImdbId("testkey", "tt1111111", undefined, mockFetch);
    expect(mockFetch).toHaveBeenCalledOnce();
  });
});

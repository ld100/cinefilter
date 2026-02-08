import { describe, it, expect } from "vitest";
import {
  enrichWithGenreNames,
  isYearInRange,
  buildVerificationResult,
  categorizeMovies,
} from "../movieLogic";
import { mockTmdbMovie, mockEnrichedMovie, mockFilters } from "../../test/fixtures";
import type { ParsedOmdbResult, VerifyStatus } from "../../types";

describe("enrichWithGenreNames", () => {
  it("adds tmdbYear and genre names", () => {
    const result = enrichWithGenreNames(mockTmdbMovie);
    expect(result.tmdbYear).toBe("2024");
    expect(result.genreNames).toEqual(["Action", "Sci-Fi"]);
  });

  it("handles missing release_date", () => {
    const movie = { ...mockTmdbMovie, release_date: "" };
    const result = enrichWithGenreNames(movie);
    expect(result.tmdbYear).toBe("?");
  });

  it("filters out unknown genre ids", () => {
    const movie = { ...mockTmdbMovie, genre_ids: [28, 99999] };
    const result = enrichWithGenreNames(movie);
    expect(result.genreNames).toEqual(["Action"]);
  });
});

describe("isYearInRange", () => {
  it("returns true when year is within range", () => {
    expect(isYearInRange(2024, 2022, 2026)).toBe(true);
  });

  it("returns true for boundary years", () => {
    expect(isYearInRange(2022, 2022, 2026)).toBe(true);
    expect(isYearInRange(2026, 2022, 2026)).toBe(true);
  });

  it("returns false when year is outside range", () => {
    expect(isYearInRange(2021, 2022, 2026)).toBe(false);
    expect(isYearInRange(2027, 2022, 2026)).toBe(false);
  });

  it("returns false for null year", () => {
    expect(isYearInRange(null, 2022, 2026)).toBe(false);
  });
});

describe("buildVerificationResult", () => {
  it("marks as verified when no IMDB id", () => {
    const result = buildVerificationResult(
      mockEnrichedMovie,
      null,
      null,
      [],
      mockFilters,
    );
    expect(result._status).toBe("verified");
    expect(result.imdbId).toBeNull();
  });

  it("marks as verified when year is in range", () => {
    const omdb: ParsedOmdbResult = {
      year: 2024,
      rating: 7.8,
      ratingStr: "7.8",
      rawYear: "2024",
    };
    const result = buildVerificationResult(
      mockEnrichedMovie,
      omdb,
      "tt1234567",
      [],
      mockFilters,
    );
    expect(result._status).toBe("verified");
    expect(result.imdbRating).toBe(7.8);
  });

  it("marks as mismatch when year is out of range", () => {
    const omdb: ParsedOmdbResult = {
      year: 1995,
      rating: 8.0,
      ratingStr: "8.0",
      rawYear: "1995",
    };
    const result = buildVerificationResult(
      mockEnrichedMovie,
      omdb,
      "tt1234567",
      [],
      mockFilters,
    );
    expect(result._status).toBe("mismatch");
  });

  it("attaches streaming providers", () => {
    const providers = [
      { provider_id: 8, provider_name: "Netflix", logo_path: "/nf.jpg" },
    ];
    const result = buildVerificationResult(
      mockEnrichedMovie,
      null,
      null,
      providers,
      mockFilters,
    );
    expect(result.streamingProviders).toHaveLength(1);
    expect(result.streamingProviders![0].provider_name).toBe("Netflix");
  });
});

describe("categorizeMovies", () => {
  const movies = [
    { ...mockEnrichedMovie, id: 1, imdbRating: 8.0 },
    { ...mockEnrichedMovie, id: 2, imdbRating: 6.0 },
    { ...mockEnrichedMovie, id: 3, imdbRating: 9.0 },
  ];

  it("splits movies by verification status", () => {
    const verification: Record<number, VerifyStatus> = {
      1: "verified",
      2: "mismatch",
      3: "verified",
    };
    const result = categorizeMovies(movies, verification, null);
    expect(result.visible).toHaveLength(2);
    expect(result.hidden).toHaveLength(1);
    expect(result.belowCutoff).toHaveLength(0);
  });

  it("applies IMDB cutoff", () => {
    const verification: Record<number, VerifyStatus> = {
      1: "verified",
      2: "verified",
      3: "verified",
    };
    const result = categorizeMovies(movies, verification, 7.0);
    expect(result.visible).toHaveLength(2);
    expect(result.belowCutoff).toHaveLength(1);
    expect(result.belowCutoff[0].id).toBe(2);
  });

  it("returns all visible when no cutoff and all verified", () => {
    const verification: Record<number, VerifyStatus> = {
      1: "verified",
      2: "verified",
      3: "verified",
    };
    const result = categorizeMovies(movies, verification, null);
    expect(result.visible).toHaveLength(3);
    expect(result.hidden).toHaveLength(0);
    expect(result.belowCutoff).toHaveLength(0);
    expect(result.watched).toHaveLength(0);
  });

  it("moves watched movies to watched array", () => {
    const verification: Record<number, VerifyStatus> = {
      1: "verified",
      2: "verified",
      3: "verified",
    };
    const watchedIds = new Set([2]);
    const result = categorizeMovies(movies, verification, null, watchedIds);
    expect(result.visible).toHaveLength(2);
    expect(result.watched).toHaveLength(1);
    expect(result.watched[0].id).toBe(2);
  });

  it("watched takes priority over mismatch", () => {
    const verification: Record<number, VerifyStatus> = {
      1: "verified",
      2: "mismatch",
      3: "verified",
    };
    const watchedIds = new Set([2]);
    const result = categorizeMovies(movies, verification, null, watchedIds);
    expect(result.watched).toHaveLength(1);
    expect(result.watched[0].id).toBe(2);
    expect(result.hidden).toHaveLength(0);
  });

  it("returns empty watched when watchedIds is undefined", () => {
    const verification: Record<number, VerifyStatus> = {
      1: "verified",
      2: "verified",
      3: "verified",
    };
    const result = categorizeMovies(movies, verification, null, undefined);
    expect(result.watched).toHaveLength(0);
  });
});

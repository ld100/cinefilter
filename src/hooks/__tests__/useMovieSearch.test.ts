import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import useMovieSearch from "../useMovieSearch";
import { mockFilters } from "../../test/fixtures";

// Mock service modules so no real fetches occur
vi.mock("../../services/tmdb", () => ({
  discoverMovies: vi.fn(),
  getMovieDetails: vi.fn(),
  ApiCache: vi.fn(),
}));

vi.mock("../../services/omdb", () => ({
  getByImdbId: vi.fn(),
  parseOmdbResult: vi.fn(),
}));

import { discoverMovies, getMovieDetails } from "../../services/tmdb";
import { getByImdbId, parseOmdbResult } from "../../services/omdb";

const mockDiscover = vi.mocked(discoverMovies);
const mockGetDetails = vi.mocked(getMovieDetails);
const mockGetByImdbId = vi.mocked(getByImdbId);
const mockParseOmdb = vi.mocked(parseOmdbResult);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useMovieSearch", () => {
  it("returns initial state", () => {
    const { result } = renderHook(() =>
      useMovieSearch({ tmdbKey: "test", omdbKey: "test" }),
    );

    expect(result.current.movies).toEqual([]);
    expect(result.current.verification).toEqual({});
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.page).toBe(1);
    expect(result.current.totalPages).toBe(0);
    expect(result.current.totalResults).toBe(0);
    expect(result.current.stats).toEqual({
      verified: 0,
      mismatched: 0,
      pending: 0,
    });
    expect(typeof result.current.search).toBe("function");
    expect(typeof result.current.cancel).toBe("function");
  });

  it("search discovers movies and verifies them sequentially", async () => {
    mockDiscover.mockResolvedValue({
      page: 1,
      total_pages: 1,
      total_results: 1,
      results: [
        {
          id: 10,
          title: "Movie A",
          overview: "",
          poster_path: null,
          release_date: "2024-01-01",
          vote_average: 8,
          vote_count: 500,
          genre_ids: [28],
        },
      ],
    });

    mockGetDetails.mockResolvedValue({
      id: 10,
      title: "Movie A",
      external_ids: { imdb_id: "tt0000010" },
      "watch/providers": { results: {} },
    });

    mockGetByImdbId.mockResolvedValue({
      Response: "True",
      Title: "Movie A",
      Year: "2024",
      imdbRating: "8.0",
      imdbID: "tt0000010",
    });

    mockParseOmdb.mockReturnValue({
      year: 2024,
      rating: 8.0,
      ratingStr: "8.0",
      rawYear: "2024",
      director: null,
      actors: null,
    });

    const { result } = renderHook(() => useMovieSearch({ tmdbKey: "tk", omdbKey: "ok" }));

    await act(async () => {
      await result.current.search(mockFilters, 1);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.movies).toHaveLength(1);
    expect(result.current.movies[0].title).toBe("Movie A");
    expect(result.current.totalResults).toBe(1);
    expect(result.current.verification[10]).toBe("verified");
    expect(result.current.stats.verified).toBe(1);
    expect(result.current.stats.pending).toBe(0);
  });

  it("sets error on discover failure", async () => {
    mockDiscover.mockRejectedValue(new Error("TMDB 500: Internal Server Error"));

    const { result } = renderHook(() => useMovieSearch({ tmdbKey: "tk", omdbKey: "ok" }));

    await act(async () => {
      await result.current.search(mockFilters, 1);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("TMDB 500: Internal Server Error");
    expect(result.current.movies).toEqual([]);
  });

  it("marks movie as error when verification fails", async () => {
    mockDiscover.mockResolvedValue({
      page: 1,
      total_pages: 1,
      total_results: 1,
      results: [
        {
          id: 20,
          title: "Movie B",
          overview: "",
          poster_path: null,
          release_date: "2024-06-01",
          vote_average: 7,
          vote_count: 200,
          genre_ids: [],
        },
      ],
    });

    // getMovieDetails throws — simulates a network error during verification
    mockGetDetails.mockRejectedValue(new Error("timeout"));

    const { result } = renderHook(() => useMovieSearch({ tmdbKey: "tk", omdbKey: "ok" }));

    await act(async () => {
      await result.current.search(mockFilters, 1);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.movies).toHaveLength(1);
    // The movie should still be present but with error status and error message
    expect(result.current.verification[20]).toBe("error");
    expect(result.current.movies[0]._errorMessage).toBe("timeout");
  });

  it("cancel aborts an in-progress search", async () => {
    // Make discover hang forever
    mockDiscover.mockImplementation(
      () => new Promise(() => {}), // never resolves
    );

    const { result } = renderHook(() => useMovieSearch({ tmdbKey: "tk", omdbKey: "ok" }));

    // Start search (don't await — it will hang)
    act(() => {
      result.current.search(mockFilters, 1);
    });

    // Cancel immediately
    act(() => {
      result.current.cancel();
    });

    // Should not have set any results
    expect(result.current.movies).toEqual([]);
  });

  it("detects mismatch when IMDB year is out of range", async () => {
    mockDiscover.mockResolvedValue({
      page: 1,
      total_pages: 1,
      total_results: 1,
      results: [
        {
          id: 30,
          title: "Old Movie Re-release",
          overview: "",
          poster_path: null,
          release_date: "2024-03-01",
          vote_average: 8.5,
          vote_count: 1000,
          genre_ids: [],
        },
      ],
    });

    mockGetDetails.mockResolvedValue({
      id: 30,
      title: "Old Movie Re-release",
      external_ids: { imdb_id: "tt0000030" },
      "watch/providers": { results: {} },
    });

    mockGetByImdbId.mockResolvedValue({
      Response: "True",
      Year: "1994",
      imdbRating: "9.0",
      imdbID: "tt0000030",
    });

    mockParseOmdb.mockReturnValue({
      year: 1994,
      rating: 9.0,
      ratingStr: "9.0",
      rawYear: "1994",
      director: null,
      actors: null,
    });

    const { result } = renderHook(() => useMovieSearch({ tmdbKey: "tk", omdbKey: "ok" }));

    await act(async () => {
      await result.current.search(mockFilters, 1);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.verification[30]).toBe("mismatch");
    expect(result.current.stats.mismatched).toBe(1);
  });
});

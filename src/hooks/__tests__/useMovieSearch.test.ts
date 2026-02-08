import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import useMovieSearch from "../useMovieSearch";

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
});

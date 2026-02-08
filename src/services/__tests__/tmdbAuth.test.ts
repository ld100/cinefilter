import { describe, it, expect, vi } from "vitest";
import {
  createRequestToken,
  getApprovalUrl,
  createSession,
  getAccountDetails,
  fetchAllRatedMovieIds,
} from "../tmdbAuth";

function mockFetch(data: unknown, ok = true): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 401,
    statusText: ok ? "OK" : "Unauthorized",
    json: () => Promise.resolve(data),
  }) as unknown as typeof fetch;
}

describe("createRequestToken", () => {
  it("returns the request token on success", async () => {
    const fetchFn = mockFetch({
      success: true,
      request_token: "abc123",
      expires_at: "2026-01-01",
    });
    const token = await createRequestToken("key", fetchFn);
    expect(token).toBe("abc123");
    expect(fetchFn).toHaveBeenCalledWith(
      expect.stringContaining("/authentication/token/new?api_key=key"),
    );
  });

  it("throws on HTTP error", async () => {
    const fetchFn = mockFetch({}, false);
    await expect(createRequestToken("key", fetchFn)).rejects.toThrow("TMDB auth 401");
  });

  it("throws when success is false", async () => {
    const fetchFn = mockFetch({ success: false, request_token: "" });
    await expect(createRequestToken("key", fetchFn)).rejects.toThrow(
      "Failed to create request token",
    );
  });
});

describe("getApprovalUrl", () => {
  it("returns correct TMDB approval URL", () => {
    expect(getApprovalUrl("token123")).toBe(
      "https://www.themoviedb.org/authenticate/token123",
    );
  });
});

describe("createSession", () => {
  it("returns session ID on success", async () => {
    const fetchFn = mockFetch({ success: true, session_id: "sess456" });
    const sessionId = await createSession("key", "token", fetchFn);
    expect(sessionId).toBe("sess456");
    expect(fetchFn).toHaveBeenCalledWith(
      expect.stringContaining("/authentication/session/new?api_key=key"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ request_token: "token" }),
      }),
    );
  });

  it("throws on HTTP error", async () => {
    const fetchFn = mockFetch({}, false);
    await expect(createSession("key", "token", fetchFn)).rejects.toThrow(
      "TMDB session 401",
    );
  });

  it("throws when success is false", async () => {
    const fetchFn = mockFetch({ success: false, session_id: "" });
    await expect(createSession("key", "token", fetchFn)).rejects.toThrow(
      "Failed to create session",
    );
  });
});

describe("getAccountDetails", () => {
  it("returns account ID", async () => {
    const fetchFn = mockFetch({ id: 789, username: "testuser" });
    const id = await getAccountDetails("key", "sess", fetchFn);
    expect(id).toBe(789);
    expect(fetchFn).toHaveBeenCalledWith(
      expect.stringContaining("/account?api_key=key&session_id=sess"),
    );
  });

  it("throws on HTTP error", async () => {
    const fetchFn = mockFetch({}, false);
    await expect(getAccountDetails("key", "sess", fetchFn)).rejects.toThrow(
      "TMDB account 401",
    );
  });
});

describe("fetchAllRatedMovieIds", () => {
  it("returns all rated movie IDs from a single page", async () => {
    const fetchFn = mockFetch({
      page: 1,
      total_pages: 1,
      total_results: 2,
      results: [
        { id: 100, rating: 8 },
        { id: 200, rating: 7 },
      ],
    });
    const ids = await fetchAllRatedMovieIds("key", "sess", 1, fetchFn);
    expect(ids).toEqual(new Set([100, 200]));
  });

  it("paginates through multiple pages", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            page: 1,
            total_pages: 2,
            total_results: 3,
            results: [{ id: 1, rating: 8 }],
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            page: 2,
            total_pages: 2,
            total_results: 3,
            results: [
              { id: 2, rating: 7 },
              { id: 3, rating: 9 },
            ],
          }),
      }) as unknown as typeof fetch;

    const ids = await fetchAllRatedMovieIds("key", "sess", 1, fetchFn);
    expect(ids).toEqual(new Set([1, 2, 3]));
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("throws on HTTP error", async () => {
    const fetchFn = mockFetch({}, false);
    await expect(fetchAllRatedMovieIds("key", "sess", 1, fetchFn)).rejects.toThrow(
      "TMDB rated movies 401",
    );
  });
});

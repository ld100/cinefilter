import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useTmdbSession from "../useTmdbSession";

// Mock the tmdbAuth service so no real fetches occur
vi.mock("../../services/tmdbAuth", () => ({
  createRequestToken: vi.fn(),
  getApprovalUrl: vi.fn((token: string) => `https://tmdb.org/auth/${token}`),
  createSession: vi.fn(),
  getAccountDetails: vi.fn(),
  fetchAllRatedMovieIds: vi.fn(),
}));

// Import mocks after vi.mock
import {
  createRequestToken,
  createSession,
  getAccountDetails,
  fetchAllRatedMovieIds,
} from "../../services/tmdbAuth";

const mockCreateRequestToken = vi.mocked(createRequestToken);
const mockCreateSession = vi.mocked(createSession);
const mockGetAccountDetails = vi.mocked(getAccountDetails);
const mockFetchAllRatedMovieIds = vi.mocked(fetchAllRatedMovieIds);

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("useTmdbSession", () => {
  it("starts in idle state with no session", () => {
    const { result } = renderHook(() => useTmdbSession("key"));
    expect(result.current.authStep).toBe("idle");
    expect(result.current.session).toBeNull();
    expect(result.current.ratedMovieIds).toBeNull();
    expect(result.current.loadingRated).toBe(false);
    expect(result.current.authError).toBeNull();
  });

  it("restores session from localStorage on mount", () => {
    const session = { sessionId: "s1", accountId: 42 };
    localStorage.setItem("cinefilter_tmdb_session", JSON.stringify(session));

    const { result } = renderHook(() => useTmdbSession("key"));
    expect(result.current.authStep).toBe("connected");
    expect(result.current.session).toEqual(session);
  });

  it("startAuth transitions to awaiting_approval and opens window", async () => {
    mockCreateRequestToken.mockResolvedValue("token123");
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    const { result } = renderHook(() => useTmdbSession("key"));

    await act(async () => {
      await result.current.startAuth();
    });

    expect(result.current.authStep).toBe("awaiting_approval");
    expect(openSpy).toHaveBeenCalledWith("https://tmdb.org/auth/token123", "_blank");
    openSpy.mockRestore();
  });

  it("startAuth transitions to error on failure", async () => {
    mockCreateRequestToken.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useTmdbSession("key"));

    await act(async () => {
      await result.current.startAuth();
    });

    expect(result.current.authStep).toBe("error");
    expect(result.current.authError).toBe("Network error");
  });

  it("confirmApproval creates session and transitions to connected", async () => {
    mockCreateRequestToken.mockResolvedValue("token123");
    mockCreateSession.mockResolvedValue("sess456");
    mockGetAccountDetails.mockResolvedValue(99);
    vi.spyOn(window, "open").mockImplementation(() => null);

    const { result } = renderHook(() => useTmdbSession("key"));

    // First start auth to set pendingToken
    await act(async () => {
      await result.current.startAuth();
    });

    // Then confirm
    await act(async () => {
      await result.current.confirmApproval();
    });

    expect(result.current.authStep).toBe("connected");
    expect(result.current.session).toEqual({ sessionId: "sess456", accountId: 99 });

    // Verify persisted to localStorage
    const stored = JSON.parse(localStorage.getItem("cinefilter_tmdb_session")!);
    expect(stored.sessionId).toBe("sess456");

    vi.restoreAllMocks();
  });

  it("confirmApproval transitions to error on failure", async () => {
    mockCreateRequestToken.mockResolvedValue("token123");
    mockCreateSession.mockRejectedValue(new Error("Token expired"));
    vi.spyOn(window, "open").mockImplementation(() => null);

    const { result } = renderHook(() => useTmdbSession("key"));

    await act(async () => {
      await result.current.startAuth();
    });
    await act(async () => {
      await result.current.confirmApproval();
    });

    expect(result.current.authStep).toBe("error");
    expect(result.current.authError).toBe("Token expired");
    vi.restoreAllMocks();
  });

  it("refreshRatedMovies fetches and caches rated IDs", async () => {
    const session = { sessionId: "s1", accountId: 42 };
    localStorage.setItem("cinefilter_tmdb_session", JSON.stringify(session));
    mockFetchAllRatedMovieIds.mockResolvedValue(new Set([1, 2, 3]));

    const { result } = renderHook(() => useTmdbSession("key"));

    let ids: Set<number> = new Set();
    await act(async () => {
      ids = await result.current.refreshRatedMovies();
    });

    expect(ids).toEqual(new Set([1, 2, 3]));
    expect(result.current.ratedMovieIds).toEqual(new Set([1, 2, 3]));
    expect(result.current.loadingRated).toBe(false);

    // Verify cached in localStorage
    const cached = JSON.parse(localStorage.getItem("cinefilter_rated_ids")!);
    expect(cached.ids).toEqual([1, 2, 3]);
    expect(cached.timestamp).toBeGreaterThan(0);
  });

  it("refreshRatedMovies returns cached IDs when fresh", async () => {
    const session = { sessionId: "s1", accountId: 42 };
    localStorage.setItem("cinefilter_tmdb_session", JSON.stringify(session));
    localStorage.setItem(
      "cinefilter_rated_ids",
      JSON.stringify({ ids: [10, 20], timestamp: Date.now() }),
    );

    const { result } = renderHook(() => useTmdbSession("key"));

    let ids: Set<number> = new Set();
    await act(async () => {
      ids = await result.current.refreshRatedMovies();
    });

    expect(ids).toEqual(new Set([10, 20]));
    // Should NOT have called the API
    expect(mockFetchAllRatedMovieIds).not.toHaveBeenCalled();
  });

  it("refreshRatedMovies returns empty set when no session", async () => {
    const { result } = renderHook(() => useTmdbSession("key"));

    let ids: Set<number> = new Set();
    await act(async () => {
      ids = await result.current.refreshRatedMovies();
    });

    expect(ids).toEqual(new Set());
  });

  it("disconnect clears session and all state", async () => {
    const session = { sessionId: "s1", accountId: 42 };
    localStorage.setItem("cinefilter_tmdb_session", JSON.stringify(session));
    localStorage.setItem(
      "cinefilter_rated_ids",
      JSON.stringify({ ids: [1], timestamp: Date.now() }),
    );

    const { result } = renderHook(() => useTmdbSession("key"));
    expect(result.current.authStep).toBe("connected");

    act(() => {
      result.current.disconnect();
    });

    expect(result.current.authStep).toBe("idle");
    expect(result.current.session).toBeNull();
    expect(result.current.ratedMovieIds).toBeNull();
    expect(result.current.authError).toBeNull();
    expect(localStorage.getItem("cinefilter_tmdb_session")).toBeNull();
    expect(localStorage.getItem("cinefilter_rated_ids")).toBeNull();
  });
});

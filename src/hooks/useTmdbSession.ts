import { useState, useCallback, useEffect } from "react";
import type { AuthStep, TmdbSession } from "../types";
import {
  createRequestToken,
  getApprovalUrl,
  createSession,
  getAccountDetails,
  fetchAllRatedMovieIds,
} from "../services/tmdbAuth";

const SESSION_KEY = "cinefilter_tmdb_session";
const RATED_KEY = "cinefilter_rated_ids";
const RATED_CACHE_TTL = 60 * 60 * 1000; // 1 hour

interface RatedCache {
  ids: number[];
  timestamp: number;
}

function loadSession(): TmdbSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw) as TmdbSession;
  } catch {
    /* ignore */
  }
  return null;
}

function loadCachedRatedIds(): Set<number> | null {
  try {
    const raw = localStorage.getItem(RATED_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw) as RatedCache;
    if (Date.now() - cache.timestamp > RATED_CACHE_TTL) return null;
    return new Set(cache.ids);
  } catch {
    /* ignore */
  }
  return null;
}

export default function useTmdbSession(apiKey: string) {
  const [session, setSession] = useState<TmdbSession | null>(loadSession);
  const [authStep, setAuthStep] = useState<AuthStep>(session ? "connected" : "idle");
  const [authError, setAuthError] = useState<string | null>(null);
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [ratedMovieIds, setRatedMovieIds] = useState<Set<number> | null>(
    loadCachedRatedIds,
  );
  const [loadingRated, setLoadingRated] = useState(false);

  // Load cached rated IDs on mount if connected
  useEffect(() => {
    if (session && !ratedMovieIds) {
      const cached = loadCachedRatedIds();
      if (cached) setRatedMovieIds(cached);
    }
  }, [session, ratedMovieIds]);

  const startAuth = useCallback(async () => {
    try {
      setAuthError(null);
      setAuthStep("awaiting_approval");
      const token = await createRequestToken(apiKey);
      setPendingToken(token);
      window.open(getApprovalUrl(token), "_blank");
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Auth failed");
      setAuthStep("error");
    }
  }, [apiKey]);

  const confirmApproval = useCallback(async () => {
    if (!pendingToken) return;
    try {
      setAuthError(null);
      setAuthStep("connecting");
      const sessionId = await createSession(apiKey, pendingToken);
      const accountId = await getAccountDetails(apiKey, sessionId);
      const newSession: TmdbSession = { sessionId, accountId };
      localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
      setSession(newSession);
      setPendingToken(null);
      setAuthStep("connected");
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Connection failed");
      setAuthStep("error");
    }
  }, [apiKey, pendingToken]);

  const refreshRatedMovies = useCallback(async (): Promise<Set<number>> => {
    if (!session) return new Set();

    // Return cached if fresh
    const cached = loadCachedRatedIds();
    if (cached) {
      setRatedMovieIds(cached);
      return cached;
    }

    setLoadingRated(true);
    try {
      const ids = await fetchAllRatedMovieIds(
        apiKey,
        session.sessionId,
        session.accountId,
      );
      const cacheData: RatedCache = { ids: [...ids], timestamp: Date.now() };
      localStorage.setItem(RATED_KEY, JSON.stringify(cacheData));
      setRatedMovieIds(ids);
      return ids;
    } finally {
      setLoadingRated(false);
    }
  }, [apiKey, session]);

  const disconnect = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(RATED_KEY);
    setSession(null);
    setRatedMovieIds(null);
    setPendingToken(null);
    setAuthStep("idle");
    setAuthError(null);
  }, []);

  return {
    session,
    authStep,
    authError,
    ratedMovieIds,
    loadingRated,
    startAuth,
    confirmApproval,
    refreshRatedMovies,
    disconnect,
  };
}

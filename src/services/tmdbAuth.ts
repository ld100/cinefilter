/**
 * TMDB Authentication Service
 *
 * Implements the 3-step OAuth-like flow required by TMDB to access user-specific data:
 *   1. createRequestToken — obtain a temporary token from TMDB
 *   2. User approves the token at themoviedb.org/authenticate/{token} (browser redirect)
 *   3. createSession — exchange the approved token for a persistent session ID
 *
 * Once authenticated, getAccountDetails retrieves the user's account ID, and
 * fetchAllRatedMovieIds paginates through all movies the user has rated on TMDB.
 *
 * All functions accept an injectable `fetchFn` for testability (matching the
 * pattern used in tmdb.ts and omdb.ts).
 */
import type {
  TmdbRequestTokenResponse,
  TmdbSessionResponse,
  TmdbAccountResponse,
  TmdbRatedMoviesResponse,
} from "../types";

const BASE = "https://api.themoviedb.org/3";

/** Step 1: Request a temporary token that the user must approve in their browser. */
export async function createRequestToken(
  apiKey: string,
  fetchFn: typeof fetch = globalThis.fetch,
): Promise<string> {
  const res = await fetchFn(`${BASE}/authentication/token/new?api_key=${apiKey}`);
  if (!res.ok) throw new Error(`TMDB auth ${res.status}: ${res.statusText}`);
  const data = (await res.json()) as TmdbRequestTokenResponse;
  if (!data.success) throw new Error("Failed to create request token");
  return data.request_token;
}

/** Build the URL where the user approves the request token in their browser. */
export function getApprovalUrl(requestToken: string): string {
  return `https://www.themoviedb.org/authenticate/${requestToken}`;
}

/** Step 3: Exchange an approved request token for a persistent session ID. */
export async function createSession(
  apiKey: string,
  requestToken: string,
  fetchFn: typeof fetch = globalThis.fetch,
): Promise<string> {
  const res = await fetchFn(`${BASE}/authentication/session/new?api_key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ request_token: requestToken }),
  });
  if (!res.ok) throw new Error(`TMDB session ${res.status}: ${res.statusText}`);
  const data = (await res.json()) as TmdbSessionResponse;
  if (!data.success) throw new Error("Failed to create session");
  return data.session_id;
}

/** Retrieve the authenticated user's numeric account ID (needed for rated-movies endpoint). */
export async function getAccountDetails(
  apiKey: string,
  sessionId: string,
  fetchFn: typeof fetch = globalThis.fetch,
): Promise<number> {
  const res = await fetchFn(`${BASE}/account?api_key=${apiKey}&session_id=${sessionId}`);
  if (!res.ok) throw new Error(`TMDB account ${res.status}: ${res.statusText}`);
  const data = (await res.json()) as TmdbAccountResponse;
  return data.id;
}

/**
 * Fetch every movie the user has rated on TMDB, returning their IDs as a Set.
 * Paginates automatically — TMDB returns max 20 results per page.
 */
export async function fetchAllRatedMovieIds(
  apiKey: string,
  sessionId: string,
  accountId: number,
  fetchFn: typeof fetch = globalThis.fetch,
): Promise<Set<number>> {
  const ids = new Set<number>();
  let page = 1;
  let totalPages = 1;

  do {
    const url =
      `${BASE}/account/${accountId}/rated/movies` +
      `?api_key=${apiKey}&session_id=${sessionId}&page=${page}`;
    const res = await fetchFn(url);
    if (!res.ok) throw new Error(`TMDB rated movies ${res.status}: ${res.statusText}`);
    const data = (await res.json()) as TmdbRatedMoviesResponse;
    for (const movie of data.results) {
      ids.add(movie.id);
    }
    totalPages = data.total_pages;
    page++;
  } while (page <= Math.min(totalPages, 500));

  return ids;
}

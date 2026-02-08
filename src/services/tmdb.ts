import type { Filters, TmdbDiscoverResult, TmdbMovieDetails } from "../types";
import { ApiCache, tmdbCache } from "./cache";

const BASE = "https://api.themoviedb.org/3";

export async function tmdbGet<T>(
  apiKey: string,
  endpoint: string,
  params: Record<string, string | number> = {},
  signal?: AbortSignal,
  fetchFn: typeof fetch = globalThis.fetch,
): Promise<T> {
  const url = new URL(`${BASE}${endpoint}`);
  url.searchParams.set("api_key", apiKey);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      url.searchParams.set(k, String(v));
    }
  }

  const cacheKey = ApiCache.buildKey(
    "tmdb",
    endpoint,
    ...Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .flat(),
  );
  const cached = tmdbCache.get<T>(cacheKey);
  if (cached) return cached;

  const res = await fetchFn(url.toString(), { signal });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`TMDB ${res.status}: ${res.statusText} — ${body}`);
  }
  const data = (await res.json()) as T;
  tmdbCache.set(cacheKey, data);
  return data;
}

export async function discoverMovies(
  apiKey: string,
  filters: Filters,
  page = 1,
  signal?: AbortSignal,
  fetchFn: typeof fetch = globalThis.fetch,
): Promise<TmdbDiscoverResult> {
  const params: Record<string, string | number> = {
    "primary_release_date.gte": `${filters.yearFrom}-01-01`,
    "primary_release_date.lte": `${filters.yearTo}-12-31`,
    "vote_average.gte": filters.minRating,
    "vote_count.gte": filters.minVotes,
    sort_by: "vote_average.desc",
    page,
    language: "en-US",
  };

  if (filters.excludedGenres.length > 0) {
    params.without_genres = filters.excludedGenres.join(",");
  }
  if (filters.selectedProviders.length > 0) {
    params.with_watch_providers = filters.selectedProviders.join("|");
    params.watch_region = filters.watchRegion;
  }

  return tmdbGet<TmdbDiscoverResult>(apiKey, "/discover/movie", params, signal, fetchFn);
}

export async function getMovieDetails(
  apiKey: string,
  movieId: number,
  signal?: AbortSignal,
  fetchFn: typeof fetch = globalThis.fetch,
): Promise<TmdbMovieDetails> {
  return tmdbGet<TmdbMovieDetails>(
    apiKey,
    `/movie/${movieId}`,
    { append_to_response: "external_ids,watch/providers" },
    signal,
    fetchFn,
  );
}

// Re-export for convenience in tests
export { ApiCache };

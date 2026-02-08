import type { OmdbResponse, ParsedOmdbResult } from "../types";
import { ApiCache, omdbCache } from "./cache";

const BASE = "https://www.omdbapi.com";

export async function getByImdbId(
  apiKey: string,
  imdbId: string,
  signal?: AbortSignal,
  fetchFn: typeof fetch = globalThis.fetch,
): Promise<OmdbResponse> {
  const cacheKey = ApiCache.buildKey("omdb", imdbId);
  const cached = omdbCache.get<OmdbResponse>(cacheKey);
  if (cached) return cached;

  const url = `${BASE}?i=${encodeURIComponent(imdbId)}&apikey=${encodeURIComponent(apiKey)}`;
  const res = await fetchFn(url, { signal });
  if (!res.ok) {
    throw new Error(`OMDb ${res.status}: ${res.statusText}`);
  }
  const data: OmdbResponse = await res.json();
  if (data.Response === "False") {
    throw new Error(`OMDb: ${data.Error || "Unknown error"}`);
  }
  omdbCache.set(cacheKey, data);
  return data;
}

export function parseOmdbResult(omdb: OmdbResponse): ParsedOmdbResult {
  const rawYear = omdb.Year ? omdb.Year.split("\u2013")[0].trim() : null;
  const year = rawYear ? parseInt(rawYear, 10) : null;
  const rating =
    omdb.imdbRating && omdb.imdbRating !== "N/A" ? parseFloat(omdb.imdbRating) : null;
  return { year, rating, ratingStr: omdb.imdbRating, rawYear };
}

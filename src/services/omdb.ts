/** OMDb API client — verifies IMDB year and fetches real IMDB rating for a movie. */
import type { OmdbResponse, ParsedOmdbResult } from "../types";
import { ApiCache, omdbCache } from "./cache";

const BASE = "https://www.omdbapi.com";

/** Fetch a movie's details from OMDb by its IMDB ID. Results are cached in-memory. */
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

/**
 * Extract year and rating from an OMDb response.
 * OMDb returns Year as "2020–2023" for series (en-dash separated range),
 * so we split on the en-dash and take the first value for the start year.
 */
export function parseOmdbResult(omdb: OmdbResponse): ParsedOmdbResult {
  const rawYear = omdb.Year ? omdb.Year.split("\u2013")[0].trim() : null;
  const parsed = rawYear ? parseInt(rawYear, 10) : null;
  const year = parsed !== null && !isNaN(parsed) ? parsed : null;
  const rating =
    omdb.imdbRating && omdb.imdbRating !== "N/A" ? parseFloat(omdb.imdbRating) : null;
  return { year, rating, ratingStr: omdb.imdbRating, rawYear };
}

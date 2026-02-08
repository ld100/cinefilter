/**
 * Pure business logic for movie enrichment and categorization.
 *
 * Extracted from UI components for testability — every function here is
 * a pure transform with no side effects or API calls.
 */
import type {
  TmdbMovie,
  TmdbProvider,
  EnrichedMovie,
  ParsedOmdbResult,
  Filters,
  VerifyStatus,
} from "../types";
import { GENRES } from "../constants";

const genreMap: Record<number, string> = Object.fromEntries(
  GENRES.map((g) => [g.id, g.name]),
);

/** Add human-readable genre names and extract the year from the release date string. */
export function enrichWithGenreNames(movie: TmdbMovie): EnrichedMovie {
  return {
    ...movie,
    tmdbYear: movie.release_date ? movie.release_date.split("-")[0] : "?",
    genreNames: (movie.genre_ids || []).map((id) => genreMap[id]).filter(Boolean),
  };
}

/** Check if a year falls within the user's selected range (inclusive). */
export function isYearInRange(
  year: number | null,
  yearFrom: number,
  yearTo: number,
): boolean {
  return year !== null && year >= yearFrom && year <= yearTo;
}

/** Merge OMDb verification data into an enriched movie, marking it as "verified" or "mismatch". */
export function buildVerificationResult(
  movie: EnrichedMovie,
  omdbResult: ParsedOmdbResult | null,
  imdbId: string | null,
  providers: TmdbProvider[],
  filters: Filters,
): EnrichedMovie {
  if (!imdbId || !omdbResult) {
    return {
      ...movie,
      streamingProviders: providers,
      imdbId: imdbId ?? null,
      imdbYear: null,
      imdbRating: null,
      imdbRatingStr: null,
      _status: "verified",
    };
  }

  const inRange = isYearInRange(omdbResult.year, filters.yearFrom, filters.yearTo);

  return {
    ...movie,
    streamingProviders: providers,
    imdbId,
    imdbYear: omdbResult.year ? String(omdbResult.year) : null,
    imdbRating: omdbResult.rating,
    imdbRatingStr: omdbResult.ratingStr ?? null,
    _status: inRange ? "verified" : "mismatch",
  };
}

/**
 * Sort movies into display buckets based on their verification status.
 *
 * Priority order (first match wins):
 *   1. **watched** — user has rated this movie on TMDB (always filtered, regardless of status)
 *   2. **hidden** — IMDB year falls outside the selected range (mismatch = likely a re-release)
 *   3. **belowCutoff** — IMDB rating is below the user's minimum threshold
 *   4. **visible** — passes all checks, shown in main results
 */
export function categorizeMovies(
  movies: EnrichedMovie[],
  verification: Record<number, VerifyStatus>,
  imdbCutoff: number | null,
  watchedIds?: Set<number>,
): {
  visible: EnrichedMovie[];
  hidden: EnrichedMovie[];
  belowCutoff: EnrichedMovie[];
  watched: EnrichedMovie[];
} {
  const visible: EnrichedMovie[] = [];
  const hidden: EnrichedMovie[] = [];
  const belowCutoff: EnrichedMovie[] = [];
  const watched: EnrichedMovie[] = [];

  for (const m of movies) {
    if (watchedIds && watchedIds.has(m.id)) {
      watched.push(m);
      continue;
    }
    const status = verification[m.id];
    if (status === "mismatch") {
      hidden.push(m);
    } else if (
      imdbCutoff != null &&
      status === "verified" &&
      m.imdbRating != null &&
      m.imdbRating < imdbCutoff
    ) {
      belowCutoff.push(m);
    } else {
      visible.push(m);
    }
  }

  return { visible, hidden, belowCutoff, watched };
}

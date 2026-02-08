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

export function enrichWithGenreNames(movie: TmdbMovie): EnrichedMovie {
  return {
    ...movie,
    tmdbYear: movie.release_date ? movie.release_date.split("-")[0] : "?",
    genreNames: (movie.genre_ids || []).map((id) => genreMap[id]).filter(Boolean),
  };
}

export function isYearInRange(
  year: number | null,
  yearFrom: number,
  yearTo: number,
): boolean {
  return year !== null && year >= yearFrom && year <= yearTo;
}

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

export function categorizeMovies(
  movies: EnrichedMovie[],
  verification: Record<number, VerifyStatus>,
  imdbCutoff: number | null,
): {
  visible: EnrichedMovie[];
  hidden: EnrichedMovie[];
  belowCutoff: EnrichedMovie[];
} {
  const visible: EnrichedMovie[] = [];
  const hidden: EnrichedMovie[] = [];
  const belowCutoff: EnrichedMovie[] = [];

  for (const m of movies) {
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

  return { visible, hidden, belowCutoff };
}

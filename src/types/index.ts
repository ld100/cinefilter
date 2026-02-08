// --- TMDB types ---

export interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
}

export interface TmdbProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface TmdbMovieDetails {
  id: number;
  title: string;
  imdb_id?: string;
  external_ids?: { imdb_id?: string };
  "watch/providers"?: {
    results?: Record<string, { flatrate?: TmdbProvider[] }>;
  };
}

export interface TmdbDiscoverResult {
  page: number;
  total_pages: number;
  total_results: number;
  results: TmdbMovie[];
}

// --- OMDb types ---

export interface OmdbResponse {
  Response: string;
  Title?: string;
  Year?: string;
  imdbRating?: string;
  imdbID?: string;
  Error?: string;
}

export interface ParsedOmdbResult {
  year: number | null;
  rating: number | null;
  ratingStr: string | undefined;
  rawYear: string | null;
}

// --- Verification ---

export type VerifyStatus = "pending" | "checking" | "verified" | "mismatch" | "error";

export interface EnrichedMovie extends TmdbMovie {
  tmdbYear: string;
  genreNames: string[];
  streamingProviders?: TmdbProvider[];
  imdbId?: string | null;
  imdbYear?: string | null;
  imdbRating?: number | null;
  imdbRatingStr?: string | null;
  _status?: VerifyStatus;
}

// --- Filter / Config types ---

export interface Genre {
  id: number;
  name: string;
}

export interface Provider {
  id: number;
  name: string;
}

export interface WatchRegion {
  code: string;
  name: string;
}

export type PageSize = 10 | 20 | 50 | 100;

export interface Filters {
  yearFrom: number;
  yearTo: number;
  excludedGenres: number[];
  selectedProviders: number[];
  watchRegion: string;
  minRating: number;
  minVotes: number;
  imdbCutoff: number | null;
  pageSize: PageSize;
}

export interface ApiKeys {
  tmdbKey: string;
  omdbKey: string;
}

export interface SearchStats {
  verified: number;
  mismatched: number;
  pending: number;
}

// --- Toast ---

export type ToastType = "error" | "success" | "info";

export interface ToastMessage {
  id: number;
  text: string;
  type: ToastType;
}

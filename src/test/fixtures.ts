import type {
  TmdbMovie,
  TmdbMovieDetails,
  OmdbResponse,
  Filters,
  EnrichedMovie,
} from "../types";

export const mockTmdbMovie: TmdbMovie = {
  id: 123,
  title: "Test Movie",
  overview: "A test movie overview",
  poster_path: "/test.jpg",
  release_date: "2024-06-15",
  vote_average: 7.5,
  vote_count: 1500,
  genre_ids: [28, 878],
};

export const mockTmdbMovieDetails: TmdbMovieDetails = {
  id: 123,
  title: "Test Movie",
  imdb_id: "tt1234567",
  external_ids: { imdb_id: "tt1234567" },
  "watch/providers": {
    results: {
      US: {
        flatrate: [{ provider_id: 8, provider_name: "Netflix", logo_path: "/nf.jpg" }],
      },
    },
  },
};

export const mockOmdbResponse: OmdbResponse = {
  Response: "True",
  Title: "Test Movie",
  Year: "2024",
  imdbRating: "7.8",
  imdbID: "tt1234567",
};

export const mockFilters: Filters = {
  yearFrom: 2022,
  yearTo: 2026,
  excludedGenres: [],
  selectedProviders: [],
  watchRegion: "US",
  minRating: 7.0,
  minVotes: 100,
  imdbCutoff: null,
  pageSize: 20,
  hideWatched: false,
};

export const mockEnrichedMovie: EnrichedMovie = {
  ...mockTmdbMovie,
  tmdbYear: "2024",
  genreNames: ["Action", "Sci-Fi"],
};

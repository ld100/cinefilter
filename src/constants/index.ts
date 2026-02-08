import type { Genre, Provider, WatchRegion, Filters, PageSize } from "../types";

export const CURRENT_YEAR = new Date().getFullYear();

export const GENRES: Genre[] = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Sci-Fi" },
  { id: 10770, name: "TV Movie" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" },
];

export const PROVIDERS: Provider[] = [
  { id: 8, name: "Netflix" },
  { id: 9, name: "Amazon Prime" },
  { id: 337, name: "Disney+" },
  { id: 350, name: "Apple TV+" },
  { id: 1899, name: "Max" },
  { id: 15, name: "Hulu" },
  { id: 531, name: "Paramount+" },
  { id: 386, name: "Peacock" },
  { id: 283, name: "Crunchyroll" },
  { id: 387, name: "HBO Max" },
  { id: 2, name: "Apple iTunes" },
  { id: 3, name: "Google Play" },
  { id: 192, name: "YouTube" },
  { id: 11, name: "Mubi" },
  { id: 175, name: "Tubi" },
];

export const WATCH_REGIONS: WatchRegion[] = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "NL", name: "Netherlands" },
  { code: "SE", name: "Sweden" },
  { code: "BR", name: "Brazil" },
  { code: "IN", name: "India" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
];

export const PAGE_SIZES: PageSize[] = [10, 20, 50, 100];
export const DEFAULT_PAGE_SIZE: PageSize = 100;

export const DEFAULT_FILTERS: Filters = {
  yearFrom: CURRENT_YEAR - 3,
  yearTo: CURRENT_YEAR,
  excludedGenres: [10751],
  selectedProviders: [],
  watchRegion: "US",
  minRating: 7.0,
  minVotes: 100,
  imdbCutoff: null,
  pageSize: DEFAULT_PAGE_SIZE,
  hideWatched: false,
};

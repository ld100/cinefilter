import { useState, useEffect } from "react";
import ApiKeySetup from "./components/ApiKeySetup";
import FilterPanel from "./components/FilterPanel";
import MovieCard from "./components/MovieCard";
import MovieCardSkeleton from "./components/MovieCardSkeleton";
import Toast from "./components/Toast";
import useMovieSearch from "./hooks/useMovieSearch";
import useToast from "./hooks/useToast";
import { categorizeMovies } from "./services/movieLogic";
import { DEFAULT_FILTERS } from "./constants";
import type { ApiKeys, Filters, VerifyStatus } from "./types";
import styles from "./App.module.css";

const STORAGE_KEY = "cinefilter_keys";

function loadKeys(): ApiKeys | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ApiKeys;
  } catch {
    /* ignore */
  }
  return null;
}

function saveKeys(keys: ApiKeys): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch {
    /* ignore */
  }
}

export default function App() {
  const [keys, setKeys] = useState<ApiKeys | null>(loadKeys);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const { messages, addToast, dismissToast } = useToast();

  const {
    movies,
    verification,
    loading,
    error,
    page,
    totalPages,
    totalResults,
    stats,
    search,
    cancel,
  } = useMovieSearch(keys || { tmdbKey: "", omdbKey: "" });

  useEffect(() => cancel, [cancel]);

  useEffect(() => {
    if (error) addToast(error, "error");
  }, [error, addToast]);

  const handleKeysSubmit = (newKeys: ApiKeys) => {
    saveKeys(newKeys);
    setKeys(newKeys);
  };

  const handleSearch = (pageNum = 1) => {
    search(filters, pageNum);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setKeys(null);
    cancel();
  };

  if (!keys) {
    return <ApiKeySetup onSubmit={handleKeysSubmit} />;
  }

  const { visible, hidden, belowCutoff } = categorizeMovies(
    movies,
    verification,
    filters.imdbCutoff,
  );

  return (
    <div className={styles.root}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.logo}>CineFilter</h1>
        <div className={styles.headerRight}>
          <span className={styles.headerMeta}>TMDB + OMDb verification</span>
          <button
            type="button"
            className={styles.logoutBtn}
            onClick={handleLogout}
            title="Clear saved API keys"
          >
            ✕ keys
          </button>
        </div>
      </header>

      <div className={styles.layout}>
        {/* Sidebar */}
        <FilterPanel
          filters={filters}
          onChange={setFilters}
          onSearch={() => handleSearch(1)}
          loading={loading}
        />

        {/* Results */}
        <main className={styles.results}>
          {movies.length > 0 && (
            <div className={styles.toolbar}>
              <div className={styles.statsText} aria-live="polite">
                {totalResults} found · {stats.verified} verified · {stats.mismatched}{" "}
                re-releases filtered
                {belowCutoff.length > 0 && ` · ${belowCutoff.length} below IMDB cutoff`}
                {stats.pending > 0 && ` · ${stats.pending} checking`}
              </div>
              <Pagination page={page} totalPages={totalPages} onNavigate={handleSearch} />
            </div>
          )}

          {movies.length === 0 && !loading && !error && (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>◎</div>
              <p className={styles.emptyTitle}>Set your filters and search</p>
              <p className={styles.emptyHint}>
                Every result verified against IMDB original release year
              </p>
            </div>
          )}

          {/* Loading skeletons */}
          {loading && movies.length === 0 && (
            <div className={styles.movieList}>
              {Array.from({ length: 10 }, (_, i) => (
                <MovieCardSkeleton key={i} />
              ))}
            </div>
          )}

          <div className={styles.movieList}>
            {visible.map((m) => (
              <MovieCard
                key={m.id}
                movie={m}
                status={verification[m.id] || ("checking" as VerifyStatus)}
              />
            ))}
          </div>

          {/* Below IMDB cutoff section */}
          {belowCutoff.length > 0 && (
            <div className={styles.filteredSection}>
              <p className={styles.filteredLabel}>
                Below IMDB cutoff ({belowCutoff.length})
              </p>
              <div className={styles.movieList}>
                {belowCutoff.map((m) => (
                  <MovieCard key={m.id} movie={m} status="mismatch" />
                ))}
              </div>
            </div>
          )}

          {/* Re-releases section */}
          {hidden.length > 0 && (
            <div className={styles.filteredSection}>
              <p className={styles.filteredLabel}>
                Filtered out ({hidden.length} re-releases)
              </p>
              <div className={styles.movieList}>
                {hidden.map((m) => (
                  <MovieCard key={m.id} movie={m} status="mismatch" />
                ))}
              </div>
            </div>
          )}

          {/* Bottom pagination */}
          {movies.length > 0 && totalPages > 1 && (
            <div className={styles.bottomPagination}>
              <Pagination page={page} totalPages={totalPages} onNavigate={handleSearch} />
            </div>
          )}
        </main>
      </div>

      <Toast messages={messages} onDismiss={dismissToast} />
    </div>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  onNavigate: (page: number) => void;
}

function Pagination({ page, totalPages, onNavigate }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div className={styles.pagination} role="navigation" aria-label="Pagination">
      {page > 1 && (
        <button
          type="button"
          className={styles.pageBtn}
          onClick={() => onNavigate(page - 1)}
        >
          ← Prev
        </button>
      )}
      <span className={styles.pageInfo}>
        {page}/{totalPages}
      </span>
      {page < totalPages && (
        <button
          type="button"
          className={styles.pageBtn}
          onClick={() => onNavigate(page + 1)}
        >
          Next →
        </button>
      )}
    </div>
  );
}

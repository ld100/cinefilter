import {
  useState,
  useEffect,
  useCallback,
  type Dispatch,
  type SetStateAction,
} from "react";
import MultiSelect from "./MultiSelect";
import RatingSlider from "./RatingSlider";
import useDebounce from "../hooks/useDebounce";
import {
  GENRES,
  LANGUAGES,
  COUNTRIES,
  PROVIDERS,
  WATCH_REGIONS,
  CURRENT_YEAR,
  PAGE_SIZES,
} from "../constants";
import type { AuthStep, Filters, TmdbSession } from "../types";
import styles from "./FilterPanel.module.css";

interface FilterPanelProps {
  filters: Filters;
  onChange: Dispatch<SetStateAction<Filters>>;
  onSearch: () => void;
  loading: boolean;
  tmdbSession: TmdbSession | null;
  authStep: AuthStep;
  authError: string | null;
  loadingRated: boolean;
  onStartAuth: () => void;
  onConfirmApproval: () => void;
  onDisconnectTmdb: () => void;
}

export default function FilterPanel({
  filters,
  onChange,
  onSearch,
  loading,
  tmdbSession,
  authStep,
  authError,
  loadingRated,
  onStartAuth,
  onConfirmApproval,
  onDisconnectTmdb,
}: FilterPanelProps) {
  const set = useCallback(
    <K extends keyof Filters>(key: K) =>
      (val: Filters[K]) =>
        onChange((prev) => ({ ...prev, [key]: val })),
    [onChange],
  );

  const toggleIn = useCallback(
    (key: "excludedGenres" | "selectedProviders") => (id: number) =>
      onChange((prev) => ({
        ...prev,
        [key]: prev[key].includes(id)
          ? prev[key].filter((x) => x !== id)
          : [...prev[key], id],
      })),
    [onChange],
  );

  const toggleStr = useCallback(
    (key: "excludedLanguages" | "excludedCountries") => (id: string) =>
      onChange((prev) => ({
        ...prev,
        [key]: prev[key].includes(id)
          ? prev[key].filter((x) => x !== id)
          : [...prev[key], id],
      })),
    [onChange],
  );

  // Debounced year inputs
  const [localYearFrom, setLocalYearFrom] = useState(filters.yearFrom);
  const [localYearTo, setLocalYearTo] = useState(filters.yearTo);
  const [localMinVotes, setLocalMinVotes] = useState(filters.minVotes);

  const debouncedYearFrom = useDebounce(localYearFrom);
  const debouncedYearTo = useDebounce(localYearTo);
  const debouncedMinVotes = useDebounce(localMinVotes);

  useEffect(() => {
    set("yearFrom")(debouncedYearFrom);
  }, [debouncedYearFrom, set]);

  useEffect(() => {
    set("yearTo")(debouncedYearTo);
  }, [debouncedYearTo, set]);

  useEffect(() => {
    set("minVotes")(debouncedMinVotes);
  }, [debouncedMinVotes, set]);

  return (
    <aside className={styles.panel}>
      {/* Year range */}
      <section className={styles.section}>
        <label className={styles.label} id="year-range-label">
          Release Year Range
        </label>
        <div className={styles.yearRow} role="group" aria-labelledby="year-range-label">
          <input
            type="number"
            min="1900"
            max={CURRENT_YEAR}
            value={localYearFrom}
            onChange={(e) =>
              setLocalYearFrom(parseInt(e.target.value, 10) || CURRENT_YEAR - 3)
            }
            className={styles.yearInput}
            aria-label="Year from"
          />
          <span className={styles.dash}>&mdash;</span>
          <input
            type="number"
            min="1900"
            max={CURRENT_YEAR}
            value={localYearTo}
            onChange={(e) => setLocalYearTo(parseInt(e.target.value, 10) || CURRENT_YEAR)}
            className={styles.yearInput}
            aria-label="Year to"
          />
        </div>
        <p className={styles.hint}>Cross-checked against IMDB original year</p>
      </section>

      {/* Rating */}
      <section className={styles.section}>
        <label htmlFor="min-rating" className={styles.label}>
          Minimum Rating (TMDB pre-filter)
        </label>
        <RatingSlider
          id="min-rating"
          label="Minimum TMDB rating"
          value={filters.minRating}
          onChange={set("minRating")}
          step={0.1}
        />
        <div className={styles.votesRow}>
          <label className={styles.votesLabel}>
            Min votes:
            <input
              type="number"
              min="0"
              step="50"
              value={localMinVotes}
              onChange={(e) => setLocalMinVotes(parseInt(e.target.value, 10) || 0)}
              className={styles.votesInput}
            />
          </label>
        </div>
      </section>

      {/* IMDB cutoff (post-verification) */}
      <section className={styles.section}>
        <label htmlFor="imdb-cutoff" className={styles.label}>
          IMDB Cutoff <span className={styles.labelHint}>(post-verification)</span>
        </label>
        <div className={styles.imdbCutoffRow}>
          <RatingSlider
            id="imdb-cutoff"
            label="IMDB cutoff rating"
            value={filters.imdbCutoff ?? 5}
            onChange={(v) => set("imdbCutoff")(v)}
            min={1}
            max={10}
            step={0.1}
          />
          {filters.imdbCutoff !== null && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => set("imdbCutoff")(null)}
              aria-label="Clear IMDB cutoff"
            >
              ✕
            </button>
          )}
        </div>
        <p className={styles.hint}>
          {filters.imdbCutoff !== null
            ? `Hides verified movies below ${filters.imdbCutoff.toFixed(1)} IMDB`
            : "Drag slider to set a minimum IMDB score"}
        </p>
      </section>

      {/* Hide watched */}
      <section className={styles.section}>
        <span className={styles.label}>Hide Watched</span>
        {authStep === "idle" && (
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={filters.hideWatched}
              onChange={(e) => {
                const checked = e.target.checked;
                set("hideWatched")(checked);
                if (checked && !tmdbSession) onStartAuth();
              }}
            />
            Hide movies I've rated on TMDB
          </label>
        )}
        {authStep === "awaiting_approval" && (
          <div className={styles.authFlow}>
            <p className={styles.hint}>
              Approve CineFilter in the TMDB tab that opened, then click below.
            </p>
            <button type="button" className={styles.authBtn} onClick={onConfirmApproval}>
              I've approved it
            </button>
          </div>
        )}
        {authStep === "connecting" && (
          <div className={styles.spinnerRow}>
            <span className={styles.spinner} />
            <p className={styles.hint}>Connecting to TMDB account...</p>
          </div>
        )}
        {authStep === "connected" && (
          <div>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={filters.hideWatched}
                onChange={(e) => set("hideWatched")(e.target.checked)}
              />
              Hide movies I've rated on TMDB
            </label>
            {loadingRated && (
              <div className={styles.spinnerRow}>
                <span className={styles.spinner} />
                <p className={styles.hint}>Loading rated list...</p>
              </div>
            )}
            <button
              type="button"
              className={styles.disconnectBtn}
              onClick={onDisconnectTmdb}
            >
              Disconnect TMDB
            </button>
          </div>
        )}
        {authStep === "error" && (
          <div className={styles.authFlow}>
            <p className={styles.authError}>{authError}</p>
            <button type="button" className={styles.authBtn} onClick={onStartAuth}>
              Try again
            </button>
          </div>
        )}
      </section>

      {/* Exclude genres */}
      <section className={styles.section}>
        <label className={styles.label}>
          Exclude Genres <span className={styles.labelHint}>(click to toggle)</span>
        </label>
        <MultiSelect
          options={GENRES}
          selected={filters.excludedGenres}
          onToggle={toggleIn("excludedGenres")}
          compact
          label="Exclude genres"
        />
      </section>

      {/* Exclude languages */}
      <section className={styles.section}>
        <label className={styles.label}>
          Exclude Languages <span className={styles.labelHint}>(click to toggle)</span>
        </label>
        <MultiSelect
          options={LANGUAGES}
          selected={filters.excludedLanguages}
          onToggle={toggleStr("excludedLanguages")}
          compact
          label="Exclude languages"
        />
        <p className={styles.hint}>Exclude movies by original language</p>
      </section>

      {/* Exclude countries */}
      <section className={styles.section}>
        <label className={styles.label}>
          Exclude Countries <span className={styles.labelHint}>(click to toggle)</span>
        </label>
        <MultiSelect
          options={COUNTRIES}
          selected={filters.excludedCountries}
          onToggle={toggleStr("excludedCountries")}
          compact
          label="Exclude countries"
        />
        <p className={styles.hint}>Exclude movies by country of origin</p>
      </section>

      {/* Watch region */}
      <section className={styles.section}>
        <label htmlFor="watch-region" className={styles.label}>
          Watch Region
        </label>
        <select
          id="watch-region"
          value={filters.watchRegion}
          onChange={(e) => set("watchRegion")(e.target.value)}
          className={styles.select}
        >
          {WATCH_REGIONS.map((r) => (
            <option key={r.code} value={r.code}>
              {r.name}
            </option>
          ))}
        </select>
      </section>

      {/* Streaming */}
      <section className={styles.section}>
        <label className={styles.label}>
          Streaming Services <span className={styles.labelHint}>(empty = all)</span>
        </label>
        <MultiSelect
          options={PROVIDERS}
          selected={filters.selectedProviders}
          onToggle={toggleIn("selectedProviders")}
          compact
          label="Streaming services"
        />
      </section>

      {/* Page size */}
      <section className={styles.section}>
        <label htmlFor="page-size" className={styles.label}>
          Results Per Page
        </label>
        <select
          id="page-size"
          value={filters.pageSize}
          onChange={(e) =>
            set("pageSize")(parseInt(e.target.value, 10) as Filters["pageSize"])
          }
          className={styles.select}
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </section>

      <button
        type="button"
        className={styles.searchBtn}
        onClick={onSearch}
        disabled={loading || loadingRated}
      >
        {loadingRated
          ? "Fetching watch history…"
          : loading
            ? "Searching & Verifying…"
            : "Search"}
      </button>
    </aside>
  );
}

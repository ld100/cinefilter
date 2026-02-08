import { useState, useEffect, type Dispatch, type SetStateAction } from "react";
import MultiSelect from "./MultiSelect";
import RatingSlider from "./RatingSlider";
import useDebounce from "../hooks/useDebounce";
import { GENRES, PROVIDERS, WATCH_REGIONS, CURRENT_YEAR, PAGE_SIZES } from "../constants";
import type { Filters } from "../types";
import styles from "./FilterPanel.module.css";

interface FilterPanelProps {
  filters: Filters;
  onChange: Dispatch<SetStateAction<Filters>>;
  onSearch: () => void;
  loading: boolean;
}

export default function FilterPanel({
  filters,
  onChange,
  onSearch,
  loading,
}: FilterPanelProps) {
  const set =
    <K extends keyof Filters>(key: K) =>
    (val: Filters[K]) =>
      onChange((prev) => ({ ...prev, [key]: val }));

  const toggleIn = (key: "excludedGenres" | "selectedProviders") => (id: number) =>
    onChange((prev) => ({
      ...prev,
      [key]: prev[key].includes(id)
        ? prev[key].filter((x) => x !== id)
        : [...prev[key], id],
    }));

  // Debounced year inputs
  const [localYearFrom, setLocalYearFrom] = useState(filters.yearFrom);
  const [localYearTo, setLocalYearTo] = useState(filters.yearTo);
  const [localMinVotes, setLocalMinVotes] = useState(filters.minVotes);

  const debouncedYearFrom = useDebounce(localYearFrom);
  const debouncedYearTo = useDebounce(localYearTo);
  const debouncedMinVotes = useDebounce(localMinVotes);

  useEffect(() => {
    set("yearFrom")(debouncedYearFrom);
  }, [debouncedYearFrom]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    set("yearTo")(debouncedYearTo);
  }, [debouncedYearTo]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    set("minVotes")(debouncedMinVotes);
  }, [debouncedMinVotes]); // eslint-disable-line react-hooks/exhaustive-deps

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
        disabled={loading}
      >
        {loading ? "Searching & Verifying…" : "Search"}
      </button>
    </aside>
  );
}

import { useState, memo } from "react";
import type { EnrichedMovie, VerifyStatus } from "../types";
import styles from "./MovieCard.module.css";

const TMDB_IMG = "https://image.tmdb.org/t/p/w154";
const IMDB_URL = "https://www.imdb.com/title/";
const TMDB_MOVIE_URL = "https://www.themoviedb.org/movie/";

interface MovieCardProps {
  movie: EnrichedMovie;
  status: VerifyStatus;
}

function MovieCard({ movie, status }: MovieCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isMismatch = status === "mismatch";
  const isVerified = status === "verified";
  const isChecking = status === "checking";

  return (
    <article className={`${styles.card} ${isMismatch ? styles.mismatch : ""}`}>
      {movie.poster_path ? (
        <img
          src={`${TMDB_IMG}${movie.poster_path}`}
          alt={`${movie.title} poster`}
          className={styles.poster}
          loading="lazy"
        />
      ) : (
        <div className={styles.noPoster}>No poster</div>
      )}

      <div className={styles.body}>
        {/* Title row */}
        <div className={styles.titleRow}>
          <h3 className={styles.title}>
            {movie.imdbId ? (
              <a
                href={`${IMDB_URL}${movie.imdbId}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.titleLink}
              >
                {movie.title}
              </a>
            ) : (
              movie.title
            )}
          </h3>
          <div className={styles.statusBadge}>
            {isChecking && <span className={styles.checking}>verifying…</span>}
            {isVerified && <span className={styles.verified}>✓ verified</span>}
            {isMismatch && <span className={styles.rerelease}>✗ re-release</span>}
          </div>
        </div>

        {/* Meta row */}
        <div className={styles.meta}>
          <span className={styles.year}>
            {movie.tmdbYear}
            {movie.imdbYear && movie.imdbYear !== movie.tmdbYear && (
              <span className={styles.yearMismatch}> → IMDB: {movie.imdbYear}</span>
            )}
          </span>
          {movie.imdbRatingStr && (
            <span className={styles.rating}>★ {movie.imdbRatingStr}</span>
          )}
          {!movie.imdbRatingStr && movie.vote_average > 0 && (
            <span className={styles.tmdbRating}>
              TMDB {movie.vote_average.toFixed(1)}
            </span>
          )}
        </div>

        {/* Crew */}
        {(movie.director || movie.actors) && (
          <div className={styles.crew}>
            {movie.director && (
              <span className={styles.crewLine}>
                <span className={styles.crewLabel}>DIR</span> {movie.director}
              </span>
            )}
            {movie.actors && (
              <span className={styles.crewLine}>
                <span className={styles.crewLabel}>CAST</span> {movie.actors}
              </span>
            )}
          </div>
        )}

        {/* Genres */}
        <div className={styles.genres}>
          {(movie.genreNames || []).map((g) => (
            <span key={g} className={styles.genre}>
              {g}
            </span>
          ))}
        </div>

        {/* Overview */}
        {movie.overview && (
          <button
            type="button"
            className={`${styles.overview} ${expanded ? styles.expanded : ""}`}
            onClick={() => setExpanded((p) => !p)}
            aria-expanded={expanded}
          >
            {movie.overview}
          </button>
        )}

        {/* Streaming providers */}
        {movie.streamingProviders && movie.streamingProviders.length > 0 && (
          <div className={styles.providers}>
            <span className={styles.providerLabel}>STREAM:</span>
            {movie.streamingProviders.map((p) => (
              <span
                key={p.provider_id}
                className={styles.provider}
                title={p.provider_name}
              >
                {p.provider_name}
              </span>
            ))}
          </div>
        )}

        {/* External links */}
        <div className={styles.externalLinks}>
          {movie.imdbId && (
            <a
              href={`${IMDB_URL}${movie.imdbId}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.extLink}
            >
              IMDB
            </a>
          )}
          <a
            href={`${TMDB_MOVIE_URL}${movie.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.extLink}
          >
            TMDB
          </a>
        </div>
      </div>
    </article>
  );
}

export default memo(MovieCard);

import { useState } from "react";
import type { ApiKeys } from "../types";
import styles from "./ApiKeySetup.module.css";

interface ApiKeySetupProps {
  onSubmit: (keys: ApiKeys) => void;
}

export default function ApiKeySetup({ onSubmit }: ApiKeySetupProps) {
  const [tmdb, setTmdb] = useState("");
  const [omdb, setOmdb] = useState("");

  const ready = tmdb.trim().length > 0 && omdb.trim().length > 0;

  return (
    <div className={styles.backdrop}>
      <div className={styles.card}>
        <h1 className={styles.logo}>CineFilter</h1>
        <p className={styles.tagline}>
          TMDB for discovery. OMDb for year &amp; rating verification.
          <br />
          Re-releases get flagged and filtered automatically.
        </p>

        <label htmlFor="tmdb-key" className={styles.label}>
          TMDB API Key
        </label>
        <input
          id="tmdb-key"
          type="text"
          value={tmdb}
          onChange={(e) => setTmdb(e.target.value)}
          placeholder="Free at themoviedb.org/settings/api"
          className={styles.input}
          autoFocus
          aria-required="true"
        />

        <label htmlFor="omdb-key" className={styles.label}>
          OMDb API Key
        </label>
        <input
          id="omdb-key"
          type="text"
          value={omdb}
          onChange={(e) => setOmdb(e.target.value)}
          placeholder="Free at omdbapi.com/apikey.aspx"
          className={styles.input}
          aria-required="true"
        />

        <button
          type="button"
          className={styles.btn}
          disabled={!ready}
          onClick={() => onSubmit({ tmdbKey: tmdb.trim(), omdbKey: omdb.trim() })}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

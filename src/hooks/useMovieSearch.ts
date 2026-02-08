import { useState, useRef, useCallback } from "react";
import { discoverMovies, getMovieDetails } from "../services/tmdb";
import { getByImdbId, parseOmdbResult } from "../services/omdb";
import { enrichWithGenreNames, buildVerificationResult } from "../services/movieLogic";
import type {
  ApiKeys,
  EnrichedMovie,
  Filters,
  SearchStats,
  TmdbMovie,
  VerifyStatus,
} from "../types";

async function fetchMultiplePages(
  tmdbKey: string,
  filters: Filters,
  userPage: number,
  signal: AbortSignal,
): Promise<{
  results: TmdbMovie[];
  totalResults: number;
  totalPages: number;
}> {
  const pageSize = filters.pageSize;
  const tmdbPagesNeeded = Math.ceil(pageSize / 20);
  const tmdbStartPage = (userPage - 1) * tmdbPagesNeeded + 1;

  const allResults: TmdbMovie[] = [];
  let totalResults = 0;
  let tmdbTotalPages = 0;

  for (let i = 0; i < tmdbPagesNeeded; i++) {
    if (signal.aborted) break;
    const tmdbPage = tmdbStartPage + i;
    const data = await discoverMovies(tmdbKey, filters, tmdbPage, signal);
    totalResults = data.total_results || 0;
    tmdbTotalPages = Math.min(data.total_pages || 0, 500);
    allResults.push(...(data.results || []));

    if (tmdbPage >= tmdbTotalPages) break;
  }

  const userTotalPages = Math.ceil(
    Math.min(tmdbTotalPages * 20, totalResults) / pageSize,
  );

  return {
    results: allResults.slice(0, pageSize),
    totalResults,
    totalPages: userTotalPages,
  };
}

export default function useMovieSearch({ tmdbKey, omdbKey }: ApiKeys) {
  const [movies, setMovies] = useState<EnrichedMovie[]>([]);
  const [verification, setVerification] = useState<Record<number, VerifyStatus>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [stats, setStats] = useState<SearchStats>({
    verified: 0,
    mismatched: 0,
    pending: 0,
  });

  const abortRef = useRef<AbortController | null>(null);

  const verifyOne = useCallback(
    async (
      movie: EnrichedMovie,
      filters: Filters,
      signal: AbortSignal,
    ): Promise<EnrichedMovie> => {
      try {
        const details = await getMovieDetails(tmdbKey, movie.id, signal);
        const imdbId = details.external_ids?.imdb_id ?? null;
        const regionProviders =
          details["watch/providers"]?.results?.[filters.watchRegion];
        const providers = regionProviders?.flatrate || [];

        if (!imdbId) {
          return buildVerificationResult(movie, null, null, providers, filters);
        }

        const omdb = await getByImdbId(omdbKey, imdbId, signal);
        const parsed = parseOmdbResult(omdb);

        return buildVerificationResult(movie, parsed, imdbId, providers, filters);
      } catch {
        return { ...movie, streamingProviders: [], _status: "error" };
      }
    },
    [tmdbKey, omdbKey],
  );

  const search = useCallback(
    async (filters: Filters, pageNum = 1) => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const { signal } = controller;

      setLoading(true);
      setError(null);
      setMovies([]);
      setVerification({});
      setStats({ verified: 0, mismatched: 0, pending: 0 });

      try {
        const {
          results,
          totalResults: tr,
          totalPages: tp,
        } = await fetchMultiplePages(tmdbKey, filters, pageNum, signal);

        setTotalPages(tp);
        setTotalResults(tr);
        setPage(pageNum);

        const enriched = results.map(enrichWithGenreNames);
        setMovies(enriched);
        setStats({ verified: 0, mismatched: 0, pending: enriched.length });

        const initVerification: Record<number, VerifyStatus> = {};
        enriched.forEach((m) => {
          initVerification[m.id] = "checking";
        });
        setVerification(initVerification);

        let vCount = 0;
        let mCount = 0;

        for (const movie of enriched) {
          if (signal.aborted) return;

          const result = await verifyOne(movie, filters, signal);
          if (signal.aborted) return;

          const status = result._status!;
          if (status === "verified") vCount++;
          else if (status === "mismatch") mCount++;

          setMovies((prev) =>
            prev.map((m) => (m.id === movie.id ? { ...m, ...result } : m)),
          );
          setVerification((prev) => ({ ...prev, [movie.id]: status }));
          setStats({
            verified: vCount,
            mismatched: mCount,
            pending: enriched.length - vCount - mCount,
          });
        }
      } catch (e: unknown) {
        if (e instanceof Error && e.name !== "AbortError") {
          setError(e.message);
        }
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [tmdbKey, verifyOne],
  );

  const cancel = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
  }, []);

  return {
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
  };
}

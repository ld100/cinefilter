# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

CineFilter is a client-side React app for movie discovery. It queries TMDB's Discover API, then verifies each result's original release year and IMDB rating against OMDb to filter out re-releases.

Stack: React 18 + Vite 6 + TypeScript (strict mode). No server-side code. Deployed to GitHub Pages as static files.

## Commands

```bash
npm install          # install dependencies
npm run dev          # start dev server (localhost:5173/cinefilter/)
npm run build        # production build → dist/
npm run preview      # preview production build locally
npm run deploy       # push dist/ to gh-pages branch
npm run type-check   # TypeScript type checking (tsc --noEmit)
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run format       # Prettier format all files
npm run format:check # Prettier check (CI)
npm test             # run tests (Vitest)
npm run test:watch   # run tests in watch mode
npm run test:coverage # run tests with coverage report
```

## Architecture

- `src/types/index.ts` — Central type definitions: `TmdbMovie`, `EnrichedMovie`, `Filters`, `VerifyStatus`, `ApiKeys`, etc.
- `src/constants/index.ts` — Genre list, streaming provider IDs, watch regions, page sizes, default filter values.
- `src/services/tmdb.ts` — TMDB API client. Uses `primary_release_date` (not `release_date`) to avoid re-release date pollution. Injectable `fetchFn` for testability. Results cached via `tmdbCache`.
- `src/services/omdb.ts` — OMDb API client. Verifies IMDB year and fetches real IMDB rating. Injectable `fetchFn`. Results cached via `omdbCache`.
- `src/services/cache.ts` — In-memory API response cache with configurable TTL (default 15 min). Exports `tmdbCache` and `omdbCache` singletons.
- `src/services/movieLogic.ts` — Pure business logic extracted for testability: `enrichWithGenreNames`, `isYearInRange`, `buildVerificationResult`, `categorizeMovies`.
- `src/hooks/useMovieSearch.ts` — Core search logic. Runs TMDB discover (multi-page fetch for large page sizes), then sequentially verifies each result via OMDb.
- `src/hooks/useDebounce.ts` — Generic debounce hook (400ms default) used for filter inputs.
- `src/hooks/useToast.ts` — Toast notification state management.
- `src/components/` — UI layer. Each component has a co-located `.module.css` file.
  - `App.tsx` — Root component. Manages API keys (localStorage), filter state, pagination, and orchestration.
  - `FilterPanel.tsx` — Filter controls with debounced inputs for year range and vote count.
  - `MovieCard.tsx` — Individual movie display with verification status badge.
  - `MovieCardSkeleton.tsx` — Shimmer loading skeleton matching MovieCard layout.
  - `MultiSelect.tsx` — Toggle chip selector for genres and providers.
  - `RatingSlider.tsx` — Range slider for rating thresholds.
  - `ApiKeySetup.tsx` — Initial API key entry form.
  - `ErrorBoundary.tsx` — React error boundary (class component).
  - `Toast.tsx` — Fixed-position toast notification display.
- `src/main.tsx` — Entry point. Wraps App with ErrorBoundary.

**Data flow:** FilterPanel → useMovieSearch → TMDB discover (multi-page) → per-movie TMDB details (IMDB ID + streaming) → OMDb verification → MovieCard with status badge.

## Testing

Tests use Vitest + React Testing Library + jsdom. Test files are co-located with source:

- `src/services/__tests__/` — Unit tests for omdb, tmdb, movieLogic, cache
- `src/components/__tests__/` — Component tests for MovieCard, FilterPanel, MultiSelect, RatingSlider
- `src/hooks/__tests__/` — Hook tests for useMovieSearch
- `src/test/fixtures.ts` — Shared mock data
- `src/test/setup.ts` — Test setup (jest-dom matchers + global fetch guard that throws if any test makes a real HTTP call)

Coverage thresholds: 60% (branches, functions, lines, statements).

## Styling

CSS Modules with CSS custom properties defined in `src/index.css`. Dark theme. Fonts: Playfair Display (headings), DM Sans (body), DM Mono (data/mono). Loaded from Google Fonts in `index.html`. Minimum font size: 12px.

## Key design decisions

1. **`primary_release_date` over `release_date`**: TMDB's `release_date` filter matches against ALL release dates (theatrical, digital, physical, re-releases) in ALL countries. `primary_release_date` uses the single "world premiere" date. This avoids most re-release false positives but isn't perfect — hence the OMDb cross-check.

2. **Sequential OMDb verification**: OMDb free tier = 1,000 req/day. Parallel requests risk rate-limiting. Each movie needs 2 calls (TMDB details for IMDB ID + OMDb lookup), so 20 movies/page = 40 calls.

3. **Two-stage rating filter**: TMDB `vote_average.gte` pre-filters during discovery (using TMDB scores). The optional `imdbCutoff` field in filters applies post-verification using actual IMDB ratings from OMDb.

4. **API keys in localStorage**: No server = no env vars at runtime. Keys are entered once and persisted. A "✕ keys" button in the header clears them.

5. **Multi-page TMDB fetching**: TMDB returns max 20 results/page. For larger page sizes (50, 100), `fetchMultiplePages()` fetches the required number of TMDB pages sequentially and combines results.

6. **Injectable fetch for testing**: All service functions accept an optional `fetchFn` parameter, enabling tests to mock network calls without patching globals.

7. **In-memory API caching**: `ApiCache` class with 15-minute TTL avoids redundant API calls during the same session.

## Deployment

GitHub Actions workflow (`.github/workflows/deploy.yml`) runs type-check, lint, format check, and tests before building. Deploys to GitHub Pages on every push to `main`. The `base` in `vite.config.ts` must match the GitHub repo name (`/cinefilter/`).

## Tooling

- **ESLint**: v9 flat config (`eslint.config.js`) with typescript-eslint, react, react-hooks, react-refresh plugins.
- **Prettier**: Config in `.prettierrc`. Semi, double quotes, trailing commas, 90 char width.
- **Husky + lint-staged**: Pre-commit hook runs ESLint fix and Prettier on staged files.

## Adding streaming providers

Edit `PROVIDERS` array in `src/constants/index.ts`. TMDB provider IDs can be found at:

```
https://api.themoviedb.org/3/watch/providers/movie?api_key=YOUR_KEY&watch_region=US
```

## Common pitfalls

- Don't use `release_date.gte/lte` in TMDB discover — it matches re-releases. Always use `primary_release_date.gte/lte`.
- OMDb returns `Year: "2020–2023"` for series. The `parseOmdbResult` function splits on `–` and takes the first value.
- TMDB `with_watch_providers` uses pipe `|` for OR logic, comma `,` for AND. We use pipe (any of the selected providers).
- The `vite.config.ts` `base` must match the GitHub repo name for Pages deployment to work.
- Dev server runs at `localhost:5173/cinefilter/` (not just `/`) because of the `base` config.
- jsdom v24 is pinned due to ESM compatibility issues with Node 21. Don't upgrade without testing.

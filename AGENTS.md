# AGENTS.md

Instructions for AI coding agents working on this repository.

## Project

CineFilter — a client-side React app for movie discovery. Queries TMDB's Discover API, then cross-verifies each result's year and rating against OMDb to filter out re-releases. No backend. Deployed as static files to GitHub Pages.

Stack: React 18, Vite 6, TypeScript (strict mode), CSS Modules.

## Commands

```bash
npm install            # install dependencies
npm run dev            # dev server at localhost:5173/cinefilter/
npm run build          # production build -> dist/
npm run type-check     # tsc --noEmit
npm run lint           # ESLint check
npm run lint:fix       # ESLint auto-fix
npm run format         # Prettier format all files
npm run format:check   # Prettier check
npm test               # run tests (Vitest)
npm run test:watch     # tests in watch mode
npm run test:coverage  # tests with coverage report
```

Always run `npm run type-check`, `npm run lint`, and `npm test` before considering work complete.

## Testing

- Framework: Vitest + React Testing Library + jsdom
- Test location: co-located `__tests__/` directories next to source files
- Shared fixtures: `src/test/fixtures.ts`
- Coverage thresholds: 60% minimum (branches, functions, lines, statements)
- Global fetch is blocked in tests — any unmocked HTTP call throws immediately. Always pass a mock `fetchFn` to service functions.
- Service functions use injectable `fetchFn` parameters for testability. Never patch `globalThis.fetch` in tests; pass mocks explicitly.

## Project structure

```
src/
  types/index.ts          — Central type definitions
  constants/index.ts      — Genres, providers, regions, languages, countries, page sizes, defaults
  services/               — API clients and business logic
    tmdb.ts               — TMDB API client (uses primary_release_date, without_original_language, without_origin_country)
    omdb.ts               — OMDb API client
    tmdbAuth.ts           — TMDB authentication (3-step OAuth-like flow + rated movies)
    cache.ts              — In-memory cache with 15-min TTL
    movieLogic.ts         — Pure functions (enrichment, categorization)
  hooks/                  — React hooks
    useMovieSearch.ts     — TMDB search + OMDb verification orchestration
    useTmdbSession.ts     — TMDB auth lifecycle + rated movie ID management
    useDebounce.ts        — Generic debounce (400ms)
    useToast.ts           — Toast notification state
  components/             — UI (each with co-located .module.css)
  test/                   — Test setup and fixtures
```

## Code style

- TypeScript strict mode. No `any` unless unavoidable (add eslint-disable comment).
- ESLint v9 flat config + Prettier. Pre-commit hooks enforce formatting.
- Prettier: semicolons, double quotes, trailing commas, 90 char line width.
- CSS Modules for all component styles. CSS custom properties in `src/index.css`.
- Minimum font size: 12px.
- Dark theme only.

## Git workflow

- Main branch: `master` (CI also triggers on `main`). CI deploys to GitHub Pages on push.
- CI pipeline: type-check -> lint -> format check -> test (with coverage) -> build.
- Husky pre-commit hook runs ESLint fix + Prettier on staged files.
- Commit messages should be concise and describe the "why".

## Boundaries

### Always do

- Use `primary_release_date` (never `release_date`) in TMDB discover queries.
- Pass mock `fetchFn` in all service function tests.
- Keep the `base` in `vite.config.ts` matching the GitHub repo name (`/cinefilter/`).

### Never do

- Don't upgrade jsdom beyond v24 (ESM incompatibility with Node 21).
- Don't upgrade ESLint beyond v9 (plugin peer dependency constraints).
- Don't make real HTTP calls in tests — the global fetch guard will catch this.
- Don't store API keys anywhere except localStorage (no .env files at runtime).
- Don't use parallel OMDb requests — sequential only, to respect the 1,000 req/day free tier limit.

## Key design decisions

1. **Two-stage rating filter**: TMDB `vote_average.gte` pre-filters during discovery. The optional IMDB cutoff applies post-verification using real IMDB ratings.
2. **Multi-page TMDB fetching**: TMDB returns max 20 results/page. For page sizes of 50 or 100, multiple TMDB pages are fetched sequentially and combined.
3. **Injectable fetch**: All API service functions accept an optional `fetchFn` parameter defaulting to `globalThis.fetch`, enabling test mocks without patching globals.
4. **In-memory caching**: `ApiCache` class with 15-minute TTL avoids redundant API calls within a session.
5. **TMDB "Hide Watched"**: 3-step OAuth-like auth flow to access user's rated movies. Session stored in localStorage. Rated movie IDs cached in localStorage with 1-hour TTL. `categorizeMovies` priority: watched > mismatch > belowCutoff > visible.

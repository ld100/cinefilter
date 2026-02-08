import "@testing-library/jest-dom/vitest";

// Block real HTTP calls in tests. If any code path hits the real fetch
// (e.g. a service function called without a mock fetchFn), fail loudly.
const originalFetch = globalThis.fetch;
globalThis.fetch = ((...args: Parameters<typeof fetch>) => {
  const url = args[0] instanceof Request ? args[0].url : String(args[0]);
  throw new Error(
    `Real fetch called during tests (URL: ${url}). ` +
      `Pass a mock fetchFn to the service function instead.`,
  );
}) as typeof fetch;

afterAll(() => {
  globalThis.fetch = originalFetch;
});

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FilterPanel from "../FilterPanel";
import { mockFilters } from "../../test/fixtures";

describe("FilterPanel", () => {
  const defaultProps = {
    filters: mockFilters,
    onChange: vi.fn(),
    onSearch: vi.fn(),
    loading: false,
    tmdbSession: null,
    authStep: "idle" as const,
    authError: null,
    loadingRated: false,
    onStartAuth: vi.fn(),
    onConfirmApproval: vi.fn(),
    onDisconnectTmdb: vi.fn(),
  };

  it("renders all filter sections", () => {
    render(<FilterPanel {...defaultProps} />);
    expect(screen.getByText("Release Year Range")).toBeInTheDocument();
    expect(screen.getByText("Minimum Rating (TMDB pre-filter)")).toBeInTheDocument();
    expect(screen.getByText(/IMDB Cutoff/)).toBeInTheDocument();
    expect(screen.getByText(/Exclude Genres/)).toBeInTheDocument();
    expect(screen.getByText("Watch Region")).toBeInTheDocument();
    expect(screen.getByText(/Streaming Services/)).toBeInTheDocument();
    expect(screen.getByText("Results Per Page")).toBeInTheDocument();
  });

  it("renders search button", () => {
    render(<FilterPanel {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
  });

  it("shows loading text on search button", () => {
    render(<FilterPanel {...defaultProps} loading={true} />);
    expect(screen.getByRole("button", { name: /Searching/i })).toBeDisabled();
  });

  it("calls onSearch when search button clicked", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<FilterPanel {...defaultProps} onSearch={onSearch} />);
    await user.click(screen.getByRole("button", { name: "Search" }));
    expect(onSearch).toHaveBeenCalledOnce();
  });

  it("renders Hide Watched section", () => {
    render(<FilterPanel {...defaultProps} />);
    expect(screen.getByText("Hide Watched")).toBeInTheDocument();
    expect(screen.getByLabelText("Hide movies I've rated on TMDB")).toBeInTheDocument();
  });

  it("shows approval UI when awaiting approval", () => {
    render(<FilterPanel {...defaultProps} authStep="awaiting_approval" />);
    expect(screen.getByText("I've approved it")).toBeInTheDocument();
  });

  it("shows disconnect button when connected", () => {
    render(
      <FilterPanel
        {...defaultProps}
        authStep="connected"
        tmdbSession={{ sessionId: "s", accountId: 1 }}
      />,
    );
    expect(screen.getByText("Disconnect TMDB")).toBeInTheDocument();
  });

  it("shows spinner when connecting", () => {
    render(<FilterPanel {...defaultProps} authStep="connecting" />);
    expect(screen.getByText("Connecting to TMDB account...")).toBeInTheDocument();
  });

  it("shows error message and retry button on auth error", () => {
    render(<FilterPanel {...defaultProps} authStep="error" authError="Token expired" />);
    expect(screen.getByText("Token expired")).toBeInTheDocument();
    expect(screen.getByText("Try again")).toBeInTheDocument();
  });

  it("disables search button when loadingRated is true", () => {
    render(
      <FilterPanel
        {...defaultProps}
        authStep="connected"
        tmdbSession={{ sessionId: "s", accountId: 1 }}
        loadingRated={true}
      />,
    );
    const btn = screen.getByRole("button", { name: /Fetching watch history/i });
    expect(btn).toBeDisabled();
  });

  it("shows loading rated spinner when connected and loadingRated", () => {
    render(
      <FilterPanel
        {...defaultProps}
        authStep="connected"
        tmdbSession={{ sessionId: "s", accountId: 1 }}
        loadingRated={true}
      />,
    );
    expect(screen.getByText("Loading rated list...")).toBeInTheDocument();
  });

  it("calls onStartAuth when checking Hide Watched without session", async () => {
    const user = userEvent.setup();
    const onStartAuth = vi.fn();
    render(<FilterPanel {...defaultProps} onStartAuth={onStartAuth} />);
    await user.click(screen.getByLabelText("Hide movies I've rated on TMDB"));
    expect(onStartAuth).toHaveBeenCalledOnce();
  });

  it("calls onConfirmApproval when clicking 'I've approved it'", async () => {
    const user = userEvent.setup();
    const onConfirmApproval = vi.fn();
    render(
      <FilterPanel
        {...defaultProps}
        authStep="awaiting_approval"
        onConfirmApproval={onConfirmApproval}
      />,
    );
    await user.click(screen.getByText("I've approved it"));
    expect(onConfirmApproval).toHaveBeenCalledOnce();
  });

  it("calls onDisconnectTmdb when clicking 'Disconnect TMDB'", async () => {
    const user = userEvent.setup();
    const onDisconnectTmdb = vi.fn();
    render(
      <FilterPanel
        {...defaultProps}
        authStep="connected"
        tmdbSession={{ sessionId: "s", accountId: 1 }}
        onDisconnectTmdb={onDisconnectTmdb}
      />,
    );
    await user.click(screen.getByText("Disconnect TMDB"));
    expect(onDisconnectTmdb).toHaveBeenCalledOnce();
  });

  it("calls onStartAuth when clicking 'Try again' on error", async () => {
    const user = userEvent.setup();
    const onStartAuth = vi.fn();
    render(
      <FilterPanel
        {...defaultProps}
        authStep="error"
        authError="Token expired"
        onStartAuth={onStartAuth}
      />,
    );
    await user.click(screen.getByText("Try again"));
    expect(onStartAuth).toHaveBeenCalledOnce();
  });
});

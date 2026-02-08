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
});

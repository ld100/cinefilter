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
});

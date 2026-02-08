import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MovieCard from "../MovieCard";
import { mockEnrichedMovie } from "../../test/fixtures";

describe("MovieCard", () => {
  it('renders "verifying..." when checking', () => {
    render(<MovieCard movie={mockEnrichedMovie} status="checking" />);
    expect(screen.getByText("verifying…")).toBeInTheDocument();
  });

  it('renders "verified" badge when verified', () => {
    render(<MovieCard movie={mockEnrichedMovie} status="verified" />);
    expect(screen.getByText("✓ verified")).toBeInTheDocument();
  });

  it('renders "re-release" badge when mismatch', () => {
    render(<MovieCard movie={mockEnrichedMovie} status="mismatch" />);
    expect(screen.getByText("✗ re-release")).toBeInTheDocument();
  });

  it("renders movie title", () => {
    render(<MovieCard movie={mockEnrichedMovie} status="checking" />);
    expect(screen.getByText("Test Movie")).toBeInTheDocument();
  });

  it("renders IMDB link when imdbId is present", () => {
    const movie = { ...mockEnrichedMovie, imdbId: "tt1234567" };
    render(<MovieCard movie={movie} status="verified" />);
    const link = screen.getByRole("link", { name: "Test Movie" });
    expect(link).toHaveAttribute("href", "https://www.imdb.com/title/tt1234567");
  });

  it("renders genres", () => {
    render(<MovieCard movie={mockEnrichedMovie} status="checking" />);
    expect(screen.getByText("Action")).toBeInTheDocument();
    expect(screen.getByText("Sci-Fi")).toBeInTheDocument();
  });

  it("expands overview on click", async () => {
    const user = userEvent.setup();
    render(<MovieCard movie={mockEnrichedMovie} status="checking" />);
    const overview = screen.getByText("A test movie overview");
    await user.click(overview);
    expect(overview.className).toContain("expanded");
  });

  it("renders poster when poster_path exists", () => {
    render(<MovieCard movie={mockEnrichedMovie} status="checking" />);
    const img = screen.getByRole("img", { name: /poster/i });
    expect(img).toHaveAttribute("src", "https://image.tmdb.org/t/p/w154/test.jpg");
  });

  it("renders no poster placeholder when poster_path is null", () => {
    const movie = { ...mockEnrichedMovie, poster_path: null };
    render(<MovieCard movie={movie} status="checking" />);
    expect(screen.getByText("No poster")).toBeInTheDocument();
  });
});

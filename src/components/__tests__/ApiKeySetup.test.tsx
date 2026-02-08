import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ApiKeySetup from "../ApiKeySetup";

describe("ApiKeySetup", () => {
  it("renders both input fields and a disabled button", () => {
    render(<ApiKeySetup onSubmit={vi.fn()} />);
    expect(screen.getByLabelText("TMDB API Key")).toBeInTheDocument();
    expect(screen.getByLabelText("OMDb API Key")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("enables button when both keys are filled", async () => {
    const user = userEvent.setup();
    render(<ApiKeySetup onSubmit={vi.fn()} />);

    await user.type(screen.getByLabelText("TMDB API Key"), "tmdb123");
    await user.type(screen.getByLabelText("OMDb API Key"), "omdb456");

    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  it("calls onSubmit with trimmed keys", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ApiKeySetup onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("TMDB API Key"), "  tmdb123  ");
    await user.type(screen.getByLabelText("OMDb API Key"), "  omdb456  ");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(onSubmit).toHaveBeenCalledWith({
      tmdbKey: "tmdb123",
      omdbKey: "omdb456",
    });
  });
});

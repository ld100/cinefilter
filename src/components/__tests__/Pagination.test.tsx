import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Pagination from "../Pagination";

describe("Pagination", () => {
  it("renders nothing when totalPages <= 1", () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} onNavigate={vi.fn()} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders page info and navigation buttons", () => {
    render(<Pagination page={2} totalPages={5} onNavigate={vi.fn()} />);
    expect(screen.getByText("2/5")).toBeInTheDocument();
    expect(screen.getByText("← Prev")).toBeInTheDocument();
    expect(screen.getByText("Next →")).toBeInTheDocument();
  });

  it("hides Prev on first page", () => {
    render(<Pagination page={1} totalPages={5} onNavigate={vi.fn()} />);
    expect(screen.queryByText("← Prev")).not.toBeInTheDocument();
    expect(screen.getByText("Next →")).toBeInTheDocument();
  });

  it("hides Next on last page", () => {
    render(<Pagination page={5} totalPages={5} onNavigate={vi.fn()} />);
    expect(screen.getByText("← Prev")).toBeInTheDocument();
    expect(screen.queryByText("Next →")).not.toBeInTheDocument();
  });

  it("calls onNavigate with correct page numbers", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<Pagination page={3} totalPages={5} onNavigate={onNavigate} />);

    await user.click(screen.getByText("← Prev"));
    expect(onNavigate).toHaveBeenCalledWith(2);

    await user.click(screen.getByText("Next →"));
    expect(onNavigate).toHaveBeenCalledWith(4);
  });

  it("disables buttons when loading", () => {
    render(<Pagination page={3} totalPages={5} onNavigate={vi.fn()} loading={true} />);
    expect(screen.getByText("← Prev")).toBeDisabled();
    expect(screen.getByText("Next →")).toBeDisabled();
  });

  it("enables buttons when not loading", () => {
    render(<Pagination page={3} totalPages={5} onNavigate={vi.fn()} loading={false} />);
    expect(screen.getByText("← Prev")).not.toBeDisabled();
    expect(screen.getByText("Next →")).not.toBeDisabled();
  });
});

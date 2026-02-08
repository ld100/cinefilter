import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MultiSelect from "../MultiSelect";

const options = [
  { id: 1, name: "Option A" },
  { id: 2, name: "Option B" },
  { id: 3, name: "Option C" },
];

describe("MultiSelect", () => {
  it("renders all options", () => {
    render(<MultiSelect options={options} selected={[]} onToggle={vi.fn()} />);
    expect(screen.getByText("Option A")).toBeInTheDocument();
    expect(screen.getByText("Option B")).toBeInTheDocument();
    expect(screen.getByText("Option C")).toBeInTheDocument();
  });

  it("marks selected options with active class", () => {
    render(<MultiSelect options={options} selected={[2]} onToggle={vi.fn()} />);
    const btnB = screen.getByText("Option B");
    expect(btnB.className).toContain("active");
  });

  it("calls onToggle with correct id when clicked", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<MultiSelect options={options} selected={[]} onToggle={onToggle} />);
    await user.click(screen.getByText("Option A"));
    expect(onToggle).toHaveBeenCalledWith(1);
  });

  it("applies compact class when compact prop is true", () => {
    render(<MultiSelect options={options} selected={[]} onToggle={vi.fn()} compact />);
    const btn = screen.getByText("Option A");
    expect(btn.className).toContain("compact");
  });
});

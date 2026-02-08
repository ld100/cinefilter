import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import RatingSlider from "../RatingSlider";

describe("RatingSlider", () => {
  it("renders current value", () => {
    render(<RatingSlider value={7.5} onChange={vi.fn()} />);
    expect(screen.getByText("7.5")).toBeInTheDocument();
  });

  it("renders slider with correct attributes", () => {
    render(<RatingSlider value={7.0} onChange={vi.fn()} min={1} max={10} />);
    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("min", "1");
    expect(slider).toHaveAttribute("max", "10");
  });

  it("fires onChange with new value", () => {
    const onChange = vi.fn();
    render(<RatingSlider value={7.0} onChange={onChange} />);
    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "8.5" } });
    expect(onChange).toHaveBeenCalledWith(8.5);
  });
});

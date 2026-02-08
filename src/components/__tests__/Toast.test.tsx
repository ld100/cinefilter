import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Toast from "../Toast";
import type { ToastMessage } from "../../types";

describe("Toast", () => {
  const messages: ToastMessage[] = [
    { id: 1, text: "Error occurred", type: "error" },
    { id: 2, text: "Action succeeded", type: "success" },
  ];

  it("renders all messages with role=alert", () => {
    render(<Toast messages={messages} onDismiss={vi.fn()} />);
    const alerts = screen.getAllByRole("alert");
    expect(alerts).toHaveLength(2);
    expect(screen.getByText("Error occurred")).toBeInTheDocument();
    expect(screen.getByText("Action succeeded")).toBeInTheDocument();
  });

  it("calls onDismiss when dismiss button is clicked", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<Toast messages={[messages[0]]} onDismiss={onDismiss} />);

    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onDismiss).toHaveBeenCalledWith(1);
  });

  it("auto-dismisses after 5 seconds", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<Toast messages={[messages[0]]} onDismiss={onDismiss} />);

    expect(onDismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(5000);
    expect(onDismiss).toHaveBeenCalledWith(1);

    vi.useRealTimers();
  });

  it("renders nothing when messages is empty", () => {
    const { container } = render(<Toast messages={[]} onDismiss={vi.fn()} />);
    expect(container.querySelectorAll("[role='alert']")).toHaveLength(0);
  });
});

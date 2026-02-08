import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useToast from "../useToast";

describe("useToast", () => {
  it("starts with no messages", () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.messages).toEqual([]);
  });

  it("addToast appends a message with incrementing id", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.addToast("Something failed", "error");
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].text).toBe("Something failed");
    expect(result.current.messages[0].type).toBe("error");

    act(() => {
      result.current.addToast("All good", "success");
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1].type).toBe("success");
    // IDs should be different
    expect(result.current.messages[0].id).not.toBe(result.current.messages[1].id);
  });

  it("dismissToast removes a message by id", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.addToast("msg1", "error");
      result.current.addToast("msg2", "info");
    });

    const firstId = result.current.messages[0].id;

    act(() => {
      result.current.dismissToast(firstId);
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].text).toBe("msg2");
  });
});

import { useState, useCallback } from "react";
import type { ToastMessage, ToastType } from "../types";

let nextId = 1;

export default function useToast() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const addToast = useCallback((text: string, type: ToastType = "error") => {
    const id = nextId++;
    setMessages((prev) => [...prev, { id, text, type }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return { messages, addToast, dismissToast };
}

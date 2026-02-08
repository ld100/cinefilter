import { useEffect } from "react";
import type { ToastMessage } from "../types";
import styles from "./Toast.module.css";

interface ToastProps {
  messages: ToastMessage[];
  onDismiss: (id: number) => void;
}

export default function Toast({ messages, onDismiss }: ToastProps) {
  return (
    <div className={styles.container}>
      {messages.map((msg) => (
        <ToastItem key={msg.id} message={msg} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  message,
  onDismiss,
}: {
  message: ToastMessage;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(message.id), 5000);
    return () => clearTimeout(timer);
  }, [message.id, onDismiss]);

  return (
    <div className={`${styles.toast} ${styles[message.type]}`} role="alert">
      <span className={styles.text}>{message.text}</span>
      <button
        type="button"
        className={styles.close}
        onClick={() => onDismiss(message.id)}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

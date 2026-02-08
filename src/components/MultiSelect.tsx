import styles from "./MultiSelect.module.css";

interface MultiSelectProps<T extends string | number> {
  options: { id: T; name: string }[];
  selected: T[];
  onToggle: (value: T) => void;
  compact?: boolean;
  label?: string;
}

export default function MultiSelect<T extends string | number>({
  options,
  selected,
  onToggle,
  compact = false,
  label,
}: MultiSelectProps<T>) {
  return (
    <div className={styles.wrap} role="group" aria-label={label}>
      {options.map((opt) => {
        const isOn = selected.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            role="checkbox"
            aria-checked={isOn}
            className={`${styles.chip} ${isOn ? styles.active : ""} ${compact ? styles.compact : ""}`}
            onClick={() => onToggle(opt.id)}
          >
            {opt.name}
          </button>
        );
      })}
    </div>
  );
}

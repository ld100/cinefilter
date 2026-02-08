import styles from "./MultiSelect.module.css";

interface MultiSelectProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: { id: number; name: string; [key: string]: any }[];
  selected: number[];
  onToggle: (value: number) => void;
  labelKey?: string;
  valueKey?: string;
  compact?: boolean;
  label?: string;
}

export default function MultiSelect({
  options,
  selected,
  onToggle,
  labelKey = "name",
  valueKey = "id",
  compact = false,
  label,
}: MultiSelectProps) {
  return (
    <div className={styles.wrap} role="group" aria-label={label}>
      {options.map((opt) => {
        const val = opt[valueKey] as number;
        const isOn = selected.includes(val);
        return (
          <button
            key={val}
            type="button"
            role="checkbox"
            aria-checked={isOn}
            className={`${styles.chip} ${isOn ? styles.active : ""} ${compact ? styles.compact : ""}`}
            onClick={() => onToggle(val)}
          >
            {String(opt[labelKey])}
          </button>
        );
      })}
    </div>
  );
}

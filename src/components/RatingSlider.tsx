import styles from "./RatingSlider.module.css";

interface RatingSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  id?: string;
  label?: string;
}

export default function RatingSlider({
  value,
  onChange,
  min = 5,
  max = 9,
  step = 0.5,
  id,
  label,
}: RatingSliderProps) {
  return (
    <div className={styles.wrap}>
      <input
        type="range"
        id={id}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={styles.slider}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value.toFixed(1)} out of ${max}`}
      />
      <span className={styles.value}>{value.toFixed(1)}</span>
    </div>
  );
}

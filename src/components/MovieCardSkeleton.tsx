import styles from "./MovieCardSkeleton.module.css";

export default function MovieCardSkeleton() {
  return (
    <div className={styles.card} aria-hidden="true">
      <div className={styles.poster} />
      <div className={styles.body}>
        <div className={styles.titleLine} />
        <div className={styles.metaLine} />
        <div className={styles.genreLine}>
          <div className={styles.genreChip} />
          <div className={styles.genreChip} />
          <div className={styles.genreChip} />
        </div>
        <div className={styles.overviewLine} />
        <div className={styles.overviewLine2} />
      </div>
    </div>
  );
}

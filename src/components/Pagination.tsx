import styles from "./Pagination.module.css";

interface PaginationProps {
  page: number;
  totalPages: number;
  onNavigate: (page: number) => void;
  loading?: boolean;
}

export default function Pagination({
  page,
  totalPages,
  onNavigate,
  loading,
}: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div className={styles.pagination} role="navigation" aria-label="Pagination">
      {page > 1 && (
        <button
          type="button"
          className={styles.pageBtn}
          onClick={() => onNavigate(page - 1)}
          disabled={loading}
        >
          ← Prev
        </button>
      )}
      <span className={styles.pageInfo} aria-live="polite">
        {page}/{totalPages}
      </span>
      {page < totalPages && (
        <button
          type="button"
          className={styles.pageBtn}
          onClick={() => onNavigate(page + 1)}
          disabled={loading}
        >
          Next →
        </button>
      )}
    </div>
  );
}

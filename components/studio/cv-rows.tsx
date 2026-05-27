import styles from './cv-rows.module.css';

export interface CvRow {
  /** Year or year-range, rendered in the left column in mono. */
  year: string;
  /** Primary label (role / school / award title). */
  title: string;
  /** Secondary line beneath the title (note / programme / source). */
  sub?: string;
  /** Right-aligned mono tag (department / honour). Hidden on mobile. */
  tag?: string;
  /** When set, the title becomes an external link opening in a new tab. */
  href?: string;
}

interface CvRowsProps {
  rows: CvRow[];
  /** Optional placeholder shown when there are no rows. */
  empty?: string;
}

/* Generic CV row layout. Used by /studio for Experience, Education
 * and Awards & press so all three share the same visual rhythm. */
export function CvRows({ rows, empty }: CvRowsProps) {
  if (rows.length === 0) {
    return empty ? <p className={styles.empty}>{empty}</p> : null;
  }
  return (
    <div className={styles.list}>
      {rows.map((row, i) => {
        const titleNode = row.href ? (
          <a
            className={styles.link}
            href={row.href}
            target="_blank"
            rel="noreferrer"
          >
            {row.title}
          </a>
        ) : (
          row.title
        );
        return (
          <div key={`${row.year}-${i}`} className={styles.row}>
            <div className={styles.year}>{row.year}</div>
            <div className={styles.title}>{titleNode}</div>
            <div className={styles.sub}>{row.sub || ''}</div>
            <div className={styles.tag}>{row.tag || ''}</div>
          </div>
        );
      })}
    </div>
  );
}

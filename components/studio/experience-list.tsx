import { EXPERIENCE } from '@/content/experience';
import styles from './experience-list.module.css';

export function ExperienceList() {
  return (
    <div className={styles.list}>
      {EXPERIENCE.map((row, i) => (
        <div key={`${row.year}-${i}`} className={styles.row}>
          <div className={styles.year}>{row.year}</div>
          <div className={styles.role}>{row.role}</div>
          <div className={styles.note}>{row.note}</div>
          <div className={styles.tag}>{row.tag}</div>
        </div>
      ))}
    </div>
  );
}

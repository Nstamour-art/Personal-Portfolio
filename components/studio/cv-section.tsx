import type { ReactNode } from 'react';
import styles from './cv-section.module.css';

interface CvSectionProps {
  /** Small monospaced label, e.g. "Experience" or "Education". */
  eyebrow: string;
  /** Optional larger headline shown beneath the eyebrow. */
  headline?: string;
  children: ReactNode;
}

/* Lightweight wrapper used by the /studio CV for Summary, Experience,
 * Education, and Awards & press. Renders the eyebrow + optional
 * headline, then the children below. */
export function CvSection({ eyebrow, headline, children }: CvSectionProps) {
  return (
    <section className={styles.section}>
      <header className={styles.head}>
        <p className={`t-eyebrow ${styles.eyebrow}`}>{eyebrow}</p>
        {headline ? <p className={styles.headline}>{headline}</p> : null}
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  );
}

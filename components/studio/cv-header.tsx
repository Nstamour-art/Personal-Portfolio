import { SITE } from '@/content/site';
import { copy } from '@/lib/copy';
import styles from './cv-header.module.css';

/* Top of the /studio CV. Spans the full width above the two-column
 * body. Reads identity from data/site.json and the eyebrow/headline
 * from data/editorial.json so editors can tune phrasing per project. */
export function CvHeader() {
  return (
    <header className={styles.head}>
      <p className={`t-eyebrow ${styles.eyebrow}`}>
        {copy('about.eyebrow', 'Studio of one — Montréal · remote')}
      </p>
      <h1 className={styles.name}>{SITE.name}</h1>
      {SITE.role || SITE.location ? (
        <p className={styles.role}>
          {SITE.role}
          {SITE.role && SITE.location ? (
            <span className={styles.sep} aria-hidden="true">
              {' · '}
            </span>
          ) : null}
          {SITE.location}
        </p>
      ) : null}
      <p className={`t-h2 ${styles.headline}`}>
        {copy(
          'about.headline',
          'A motion artist who fell in love with systems.',
        )}
      </p>
    </header>
  );
}

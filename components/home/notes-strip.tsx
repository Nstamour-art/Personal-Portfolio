import Link from 'next/link';
import { ArrowButton } from '@/components/primitives/arrow-button';
import { getSortedNotes } from '@/lib/content';
import { copy } from '@/lib/copy';
import styles from './notes-strip.module.css';

/**
 * Notes strip on the home page — pinned-first, capped to 3.
 *
 * Returns `null` when there are no published notes, so the home page
 * doesn't render an empty "Notes & process" section with an
 * "All notes" CTA pointing at an empty index. Mirrors the rail/footer
 * Notes-tab auto-hide rule (see `getVisibleNav()` in lib/content.ts).
 */
export function NotesStrip() {
  const list = getSortedNotes().slice(0, 3);
  if (list.length === 0) return null;

  return (
    <section className={styles.strip}>
      <div className={styles.head}>
        <div>
          <p className={styles.secLabel}>
            {copy('home.notesEyebrow', 'Notes & process')}
          </p>
          <h2 className={`t-h2 ${styles.headTitle}`}>
            {copy('home.notesTitle', 'Short writing on tools, rigs and how things get made.')}
          </h2>
        </div>
        <ArrowButton href="/notes" variant="ghost" cursorLabel="Read">
          All notes
        </ArrowButton>
      </div>
      <div>
        {list.map((n) => (
          <Link
            key={n.id}
            href={`/notes/${n.id}`}
            className={styles.row}
            data-cursor="view"
            data-cursor-label="Read"
          >
            <div className={styles.date}>{n.date}</div>
            <div className={`${styles.title} note-title`}>{n.title}</div>
            <div className={styles.kind}>{n.kind}</div>
            <div className={styles.arrow} aria-hidden="true">↗</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

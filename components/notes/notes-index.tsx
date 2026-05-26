import Link from 'next/link';
import { getSortedNotes } from '@/lib/content';
import { copy } from '@/lib/copy';
import styles from './notes-index.module.css';

export function NotesIndex() {
  const notes = getSortedNotes();

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div>
          <p className="t-eyebrow" style={{ color: 'var(--muted)' }}>
            Notes & writing · {notes.length}
          </p>
          <h1 className="t-h1" style={{ marginTop: 12 }}>
            {copy(
              'home.notesTitle',
              'Short writing on tools, rigs and how things get made.',
            )}
          </h1>
        </div>
        <p className={`t-body ${styles.lede}`}>
          Process notes, essays, and tooling logs. Most started as private
          documentation that turned out to be worth sharing.
        </p>
      </header>

      <section className={styles.list}>
        {notes.map((n, i) => (
          <Link
            key={n.id}
            href={`/notes/${n.id}`}
            className={styles.row}
            data-cursor="view"
            data-cursor-label="Read"
          >
            <div className={styles.num}>/ {String(i + 1).padStart(2, '0')}</div>
            <div className={styles.meta}>
              <div className={styles.date}>{n.date}</div>
              {n.pinned ? <div className={styles.pin}>★ Pinned</div> : null}
            </div>
            <div className={styles.body}>
              <h3 className={`${styles.title} note-title`}>{n.title}</h3>
              <p className={styles.summary}>{n.summary}</p>
            </div>
            <div className={styles.kind}>{n.kind}</div>
            <div className={styles.arrow} aria-hidden="true">↗</div>
          </Link>
        ))}
      </section>
    </div>
  );
}

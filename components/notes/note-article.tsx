import Image from 'next/image';
import Link from 'next/link';
import { Markdown } from '@/components/primitives/markdown';
import type { Note } from '@/content/types';
import {
  getNextNote,
  getPrevNote,
  getReadingTime,
  getSortedNotes,
} from '@/lib/content';
import styles from './note-article.module.css';

interface NoteArticleProps {
  note: Note;
}

export function NoteArticle({ note }: NoteArticleProps) {
  const sorted = getSortedNotes();
  const idx = sorted.findIndex((n) => n.id === note.id);
  const next = getNextNote(note.id);
  const prev = getPrevNote(note.id);
  const readMin = getReadingTime(note.body);
  const total = sorted.length;

  const coverSrc = typeof note.cover?.src === 'string' ? note.cover.src.trim() : '';

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/notes" className={styles.back} data-cursor="link">
          <span aria-hidden="true">←</span> Notes index
        </Link>
        <div className={styles.counter}>
          {String(idx + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </div>
      </header>

      <article className={styles.article}>
        <div className={styles.metaRow}>
          <span>{note.date}</span>
          <span className={styles.kindPill}>{note.kind}</span>
          <span className={styles.reading}>{readMin} min read</span>
        </div>

        <h1 className={`${styles.h1} note-title`}>{note.title}</h1>

        {note.summary ? <p className={styles.deck}>{note.summary}</p> : null}

        <div className={styles.cover}>
          {coverSrc ? (
            <Image
              src={coverSrc}
              alt={note.cover?.alt ?? note.title}
              fill
              sizes="(max-width: 880px) 100vw, 760px"
              className={styles.coverImage}
              priority
            />
          ) : (
            <NoteProceduralCover alt={note.cover?.alt} />
          )}
        </div>

        <div className={styles.bodyWrap}>
          <Markdown text={note.body} />
        </div>
      </article>

      <section className={styles.next}>
        <Link
          href={`/notes/${prev.id}`}
          className={styles.panel}
          data-cursor="view"
          data-cursor-label="Previous"
        >
          <div className={styles.panelLabel}>← Previous note</div>
          <div>
            <div className={styles.panelTitle}>{prev.title}</div>
            <div className={styles.panelMeta}>
              {prev.kind} · {prev.date}
            </div>
          </div>
        </Link>
        <Link
          href={`/notes/${next.id}`}
          className={styles.panel}
          data-cursor="view"
          data-cursor-label="Next note"
        >
          <div className={`${styles.panelLabel} ${styles.right}`}>Next note →</div>
          <div className={styles.right}>
            <div className={styles.panelTitle}>{next.title}</div>
            <div className={styles.panelMeta}>
              {next.kind} · {next.date}
            </div>
          </div>
        </Link>
      </section>
    </div>
  );
}

/* Procedural cover fallback when no cover.src is provided. Uses the same
 * ph-ai treatment + grid layer from the primitives' placeholder styles
 * via the globally-scoped names, since the cover is article-level chrome
 * rather than a project visual. */
function NoteProceduralCover({ alt }: { alt?: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(135deg, #0e1117 0%, #14202a 60%, #1a2a3a 100%)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(237,229,216,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(237,229,216,0.06) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage:
            'radial-gradient(ellipse 80% 80% at 50% 50%, #000 30%, transparent 80%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 80% at 50% 50%, #000 30%, transparent 80%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: 'var(--mono)',
          fontSize: 10,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'rgba(237, 229, 216, 0.4)',
          background: 'rgba(14, 17, 23, 0.5)',
          padding: '4px 10px',
          border: '1px dashed rgba(237, 229, 216, 0.18)',
          borderRadius: 3,
        }}
      >
        {alt ?? 'Cover image — add via /keystatic'}
      </div>
    </div>
  );
}

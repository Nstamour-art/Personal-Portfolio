import notesData from '@/data/_generated/notes.json';
import type { Note } from './types';

interface NoteFront {
  order?: number;
  title: string;
  date: string;
  kind: string;
  summary: string;
  pinned?: boolean;
  draft?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  /* `coverSrc` is `null` when the Keystatic image field hasn't been
   * filled. The mapper coalesces it to '' so the cover renderer
   * falls back to the procedural placeholder. */
  coverSrc?: string | null;
  coverAlt?: string;
}

interface RawEntry {
  slug: string;
  frontmatter: NoteFront;
  body: string;
}

const entries = notesData as RawEntry[];

export const NOTES: Note[] = entries
  .slice()
  /* Drafts are excluded — see content/projects.ts for the rationale. */
  .filter((e) => e.frontmatter.draft !== true)
  .sort(
    (a, b) =>
      (a.frontmatter.order ?? 9999) - (b.frontmatter.order ?? 9999),
  )
  .map((e) => {
    const f = e.frontmatter;
    const note: Note = {
      id: e.slug,
      title: f.title,
      date: f.date,
      kind: f.kind,
      summary: f.summary,
      pinned: f.pinned ?? false,
      cover: {
        src: f.coverSrc ?? '',
        alt: f.coverAlt ?? '',
      },
      body: e.body,
    };
    if (f.seoTitle) note.seoTitle = f.seoTitle;
    if (f.seoDescription) note.seoDescription = f.seoDescription;
    return note;
  });

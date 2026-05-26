import notesData from '@/data/_generated/notes.json';
import type { Note } from './types';

interface NoteFront {
  order?: number;
  title: string;
  date: string;
  kind: string;
  summary: string;
  pinned?: boolean;
  coverSrc?: string;
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
  .sort(
    (a, b) =>
      (a.frontmatter.order ?? 9999) - (b.frontmatter.order ?? 9999),
  )
  .map((e) => ({
    id: e.slug,
    title: e.frontmatter.title,
    date: e.frontmatter.date,
    kind: e.frontmatter.kind,
    summary: e.frontmatter.summary,
    pinned: e.frontmatter.pinned ?? false,
    cover: {
      src: e.frontmatter.coverSrc ?? '',
      alt: e.frontmatter.coverAlt ?? '',
    },
    body: e.body,
  }));

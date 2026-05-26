import notesData from '@/data/_generated/notes.json';
import type { Note } from './types';

/* Grouped frontmatter shape — mirrors keystatic.config.ts after the
 * sectioned-schema migration. See scripts/migrate-content-shape.mjs. */

interface AboutFront {
  order: number;
  date: string;
  kind: string;
  summary: string;
}

interface VisibilityFront {
  pinned: boolean;
  draft: boolean;
}

interface CoverFront {
  /* `null` when the Keystatic image field hasn't been filled. The mapper
   * coalesces it to '' so the cover renderer falls back to the procedural
   * placeholder. */
  src?: string | null;
  alt?: string;
}

interface AdvancedFront {
  seoTitle?: string;
  seoDescription?: string;
}

interface NoteFront {
  title: string;
  about: AboutFront;
  visibility: VisibilityFront;
  cover: CoverFront;
  advanced: AdvancedFront;
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
  .filter((e) => e.frontmatter.visibility?.draft !== true)
  .sort(
    (a, b) =>
      (a.frontmatter.about?.order ?? 9999) -
      (b.frontmatter.about?.order ?? 9999),
  )
  .map((e) => {
    const f = e.frontmatter;
    const about = f.about;
    const visibility = f.visibility;
    const cover = f.cover;
    const advanced = f.advanced;

    const note: Note = {
      id: e.slug,
      title: f.title,
      date: about.date,
      kind: about.kind,
      summary: about.summary,
      pinned: visibility.pinned ?? false,
      cover: {
        src: cover.src ?? '',
        alt: cover.alt ?? '',
      },
      body: e.body,
    };
    if (advanced.seoTitle) note.seoTitle = advanced.seoTitle;
    if (advanced.seoDescription) note.seoDescription = advanced.seoDescription;
    return note;
  });

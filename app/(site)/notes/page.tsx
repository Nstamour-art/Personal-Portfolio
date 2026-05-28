import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NotesIndex } from '@/components/notes/notes-index';
import { NOTES } from '@/content/notes';
import { copy } from '@/lib/copy';

export const metadata: Metadata = {
  title: 'Notes',
  description: copy(
    'home.notesTitle',
    'Short writing on tools, rigs and how things get made.',
  ),
};

/* When the notes collection is empty (drafts excluded) the Notes tab
 * is hidden from the rail and footer, and the home-page strip
 * returns null — but a direct hit on `/notes` (bookmark, share link,
 * search engine cache) would still resolve to an empty index. Route
 * those visits to the global 404 (the lost-in-space minigame) so
 * we never serve an empty editorial page. The individual note pages
 * at `/notes/[slug]` already 404 on missing slugs via notFound(). */
export default function NotesIndexPage() {
  if (NOTES.length === 0) notFound();
  return <NotesIndex />;
}

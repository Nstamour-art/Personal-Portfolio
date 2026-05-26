import type { Metadata } from 'next';
import { NotesIndex } from '@/components/notes/notes-index';
import { copy } from '@/lib/copy';

export const metadata: Metadata = {
  title: 'Notes',
  description: copy(
    'home.notesTitle',
    'Short writing on tools, rigs and how things get made.',
  ),
};

export default function NotesIndexPage() {
  return <NotesIndex />;
}

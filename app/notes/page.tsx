import type { Metadata } from 'next';
import { copy } from '@/lib/copy';

export const metadata: Metadata = {
  title: 'Notes',
  description: copy('home.notesTitle', ''),
};

export default function NotesIndexPage() {
  return (
    <div className="container" style={{ paddingTop: 120, paddingBottom: 120 }}>
      <p className="t-eyebrow" style={{ color: 'var(--muted)' }}>
        {copy('home.notesEyebrow', 'Notes')}
      </p>
      <h1 className="t-h1" style={{ marginTop: 24 }}>
        Notes index — coming online in Phase 7
      </h1>
    </div>
  );
}

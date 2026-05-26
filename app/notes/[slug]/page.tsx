import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NOTES } from '@/content/notes';
import { getNote } from '@/lib/content';

export function generateStaticParams() {
  return NOTES.map((n) => ({ slug: n.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const note = getNote(slug);
  if (!note) return { title: 'Not found' };
  return {
    title: note.title,
    description: note.summary,
    openGraph: { title: note.title, description: note.summary },
  };
}

export default async function NotePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const note = getNote(slug);
  if (!note) notFound();
  return (
    <div className="container" style={{ paddingTop: 120, paddingBottom: 120 }}>
      <p className="t-eyebrow" style={{ color: 'var(--muted)' }}>
        {note.kind} · {note.date}
      </p>
      <h1 className="t-h1" style={{ marginTop: 24 }}>
        {note.title}
      </h1>
      <p className="t-body" style={{ marginTop: 16, color: 'var(--fg-2)' }}>
        {note.summary}
      </p>
    </div>
  );
}

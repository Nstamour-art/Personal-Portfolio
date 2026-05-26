import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NoteArticle } from '@/components/notes/note-article';
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
    openGraph: {
      title: note.title,
      description: note.summary,
      type: 'article',
      publishedTime: note.date,
    },
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
  return <NoteArticle note={note} />;
}

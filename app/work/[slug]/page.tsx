import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PROJECTS } from '@/content/projects';
import { getProject } from '@/lib/content';

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return { title: 'Not found' };
  return {
    title: project.title,
    description: project.brief,
    openGraph: { title: project.title, description: project.brief },
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  return (
    <div className="container" style={{ paddingTop: 120, paddingBottom: 120 }}>
      <p className="t-eyebrow" style={{ color: 'var(--muted)' }}>
        Case study
      </p>
      <h1 className="t-h1" style={{ marginTop: 24 }}>
        {project.title}
      </h1>
      <p className="t-body" style={{ marginTop: 16, color: 'var(--fg-2)' }}>
        {project.brief}
      </p>
    </div>
  );
}

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BriefBlock } from '@/components/case/brief-block';
import { CinematicHero } from '@/components/case/cinematic-hero';
import { NextPrev } from '@/components/case/next-prev';
import { ProcessGallery } from '@/components/case/process-gallery';
import { PROJECTS } from '@/content/projects';
import { getNextProject, getPrevProject, getProject, getProjectIndex } from '@/lib/content';

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
  const title = project.seoTitle?.trim() || project.title;
  const description = project.seoDescription?.trim() || project.brief;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
    },
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
  const idx = getProjectIndex(slug);
  const prev = getPrevProject(slug);
  const next = getNextProject(slug);
  return (
    <>
      <CinematicHero project={project} index={idx + 1} total={PROJECTS.length} />
      <BriefBlock project={project} />
      <ProcessGallery project={project} />
      <NextPrev prev={prev} next={next} />
    </>
  );
}

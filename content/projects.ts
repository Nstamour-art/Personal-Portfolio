import projectsData from '@/data/_generated/projects.json';
import type {
  DisciplineId,
  ProceduralKey,
  Project,
  SpanKey,
} from './types';

interface ProcessFront {
  label: string;
  note: string;
  mediaSrc?: string;
  mediaAlt?: string;
}

interface ProjectFront {
  order?: number;
  title: string;
  sub: string;
  year: string;
  client: string;
  role: string;
  disciplines: DisciplineId[];
  primary: DisciplineId;
  featured?: boolean;
  pitch?: string;
  brief: string;
  summary: string;
  heroSrc?: string;
  heroAlt?: string;
  heroVideo?: string;
  thumbSrc?: string;
  thumbAlt?: string;
  process: ProcessFront[];
  tools?: string;
  duration?: string;
  status?: string;
  output?: string;
  ph?: ProceduralKey;
  span?: SpanKey;
}

interface RawEntry {
  slug: string;
  frontmatter: ProjectFront;
  body: string;
}

const entries = projectsData as RawEntry[];

function bodyToWriteup(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export const PROJECTS: Project[] = entries
  .slice()
  .sort(
    (a, b) =>
      (a.frontmatter.order ?? 9999) - (b.frontmatter.order ?? 9999),
  )
  .map((e) => {
    const f = e.frontmatter;
    const hero =
      f.heroSrc || f.heroAlt
        ? { src: f.heroSrc ?? '', alt: f.heroAlt ?? '' }
        : undefined;
    const thumb =
      f.thumbSrc || f.thumbAlt
        ? { src: f.thumbSrc ?? '', alt: f.thumbAlt ?? '' }
        : undefined;
    const project: Project = {
      id: e.slug,
      title: f.title,
      sub: f.sub,
      year: f.year,
      client: f.client,
      role: f.role,
      disciplines: f.disciplines,
      primary: f.primary,
      brief: f.brief,
      summary: f.summary,
      writeup: bodyToWriteup(e.body),
      process: (f.process ?? []).map((p) => ({
        label: p.label,
        note: p.note,
        media: { src: p.mediaSrc ?? '', alt: p.mediaAlt ?? '' },
      })),
    };
    if (f.featured !== undefined) project.featured = f.featured;
    if (f.pitch !== undefined) project.pitch = f.pitch;
    if (hero) project.hero = hero;
    if (f.heroVideo !== undefined) project.heroVideo = f.heroVideo;
    if (thumb) project.thumb = thumb;
    if (f.tools !== undefined) project.tools = f.tools;
    if (f.duration !== undefined) project.duration = f.duration;
    if (f.status !== undefined) project.status = f.status;
    if (f.output !== undefined) project.output = f.output;
    if (f.ph !== undefined) project.ph = f.ph;
    if (f.span !== undefined) project.span = f.span;
    return project;
  });

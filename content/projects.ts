import projectsData from '@/data/_generated/projects.json';
import type {
  DisciplineId,
  ProceduralKey,
  Project,
  SpanKey,
} from './types';

/* ──────────────────────────────────────────────────────────────────────────
 * Frontmatter shape (post-grouping). Every section is its own nested
 * object so the Keystatic admin renders the form as labelled groups
 * instead of one long flat list. See scripts/migrate-content-shape.mjs
 * for the one-time flat → grouped migration.
 *
 * Image-typed fields are `string | null | undefined` because Keystatic's
 * fields.image stores `null` when the editor hasn't uploaded anything.
 * The mapper coalesces all three to `''`, which is the falsy value the
 * rendering primitives check to decide between a real image and a
 * procedural placeholder.
 * ──────────────────────────────────────────────────────────────────── */

interface ProcessFront {
  label: string;
  note: string;
  mediaSrc?: string | null;
  mediaAlt?: string;
}

interface AboutFront {
  order: number;
  sub: string;
  year: string;
  client: string;
  role: string;
  disciplines: DisciplineId[];
  primary: DisciplineId;
}

interface VisibilityFront {
  featured: boolean;
  draft: boolean;
}

interface StoryFront {
  pitch?: string;
  brief: string;
  summary: string;
}

interface VisualsFront {
  heroSrc?: string | null;
  heroAlt?: string;
  heroVideo?: string;
  thumbSrc?: string | null;
  thumbAlt?: string;
}

interface CaseStudyFront {
  process?: ProcessFront[];
  tools?: string;
  duration?: string;
  status?: string;
  output?: string;
}

interface AdvancedFront {
  ph?: ProceduralKey | '';
  span?: SpanKey | '';
  seoTitle?: string;
  seoDescription?: string;
}

interface ProjectFront {
  title: string;
  about: AboutFront;
  visibility: VisibilityFront;
  story: StoryFront;
  visuals: VisualsFront;
  caseStudy: CaseStudyFront;
  advanced: AdvancedFront;
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
  /* Drafts are excluded from the public-facing list. They still live in
   * data/projects/<slug>/ on disk and remain editable in Keystatic, but
   * /work, the home featured strip, prev/next navigation, and
   * generateStaticParams all derive from PROJECTS, so an unset `draft`
   * flag publishes everywhere automatically. */
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
    const story = f.story;
    const visuals = f.visuals;
    const caseStudy = f.caseStudy;
    const advanced = f.advanced;

    const hero =
      visuals.heroSrc || visuals.heroAlt
        ? { src: visuals.heroSrc ?? '', alt: visuals.heroAlt ?? '' }
        : undefined;
    const thumb =
      visuals.thumbSrc || visuals.thumbAlt
        ? { src: visuals.thumbSrc ?? '', alt: visuals.thumbAlt ?? '' }
        : undefined;

    const project: Project = {
      id: e.slug,
      title: f.title,
      sub: about.sub,
      year: about.year,
      client: about.client,
      role: about.role,
      disciplines: about.disciplines,
      primary: about.primary,
      brief: story.brief,
      summary: story.summary,
      writeup: bodyToWriteup(e.body),
      process: (caseStudy.process ?? []).map((p) => ({
        label: p.label,
        note: p.note,
        media: { src: p.mediaSrc ?? '', alt: p.mediaAlt ?? '' },
      })),
    };
    if (visibility.featured !== undefined) {
      project.featured = visibility.featured;
    }
    if (advanced.seoTitle) project.seoTitle = advanced.seoTitle;
    if (advanced.seoDescription) project.seoDescription = advanced.seoDescription;
    if (story.pitch) project.pitch = story.pitch;
    if (hero) project.hero = hero;
    if (visuals.heroVideo) project.heroVideo = visuals.heroVideo;
    if (thumb) project.thumb = thumb;
    if (caseStudy.tools) project.tools = caseStudy.tools;
    if (caseStudy.duration) project.duration = caseStudy.duration;
    if (caseStudy.status) project.status = caseStudy.status;
    if (caseStudy.output) project.output = caseStudy.output;
    if (advanced.ph) project.ph = advanced.ph as ProceduralKey;
    if (advanced.span) project.span = advanced.span as SpanKey;
    return project;
  });

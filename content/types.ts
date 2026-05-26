/* ──────────────────────────────────────────────────────────────────────────
 * Content types — SPEC §5.
 * The single source of truth for the shape of all editable content.
 * Keystatic schemas (see /keystatic.config.ts) mirror this 1:1.
 * ──────────────────────────────────────────────────────────────────────── */

import type { StaticImageData } from 'next/image';

export type DisciplineId = 'motion' | '3d' | 'illo' | 'video' | 'ai' | 'code';

export type ProceduralKey = 'ph-motion' | 'ph-3d' | 'ph-illo' | 'ph-video' | 'ph-ai' | 'ph-code';

export type SpanKey =
  | 's-1'
  | 's-2'
  | 's-3'
  | 's-4'
  | 's-5'
  | 's-6'
  | 's-7'
  | 's-8'
  | 's-fill';

export interface MediaSlot {
  /** Path relative to /public, e.g. "/assets/work/vubiquity/hero.jpg".
   *  May be StaticImageData (imported) for next/image. */
  src: string | StaticImageData | '';
  alt: string;
}

export interface ProcessStep {
  media?: MediaSlot;
  label: string;
  note: string;
}

export interface Project {
  id: string;
  title: string;
  sub: string;
  year: string;
  client: string;
  role: string;
  disciplines: DisciplineId[];
  primary: DisciplineId;

  brief: string;
  summary: string;
  writeup: string[];
  pitch?: string;

  hero?: MediaSlot;
  thumb?: MediaSlot;
  process: ProcessStep[];
  heroVideo?: string;

  tools?: string;
  duration?: string;
  status?: string;
  output?: string;

  featured?: boolean;

  ph?: ProceduralKey;
  span?: SpanKey;
}

export interface Note {
  id: string;
  date: string;
  title: string;
  kind: string;
  summary: string;
  body: string;
  cover?: MediaSlot;
  pinned?: boolean;
}

export interface Social {
  label: string;
  handle: string;
  href: string;
}

export interface SiteConfig {
  name: string;
  short: string;
  initials: string;
  /** Personal title shown under the name on the home hero. */
  role: string;
  tagline: string;
  manifesto: string;
  location: string;
  email: string;
  /** Round avatar shown on the home hero. Leave src empty to render
   *  the initial-letter fallback styled like the brand mark. */
  avatar: MediaSlot;
  socials: Social[];
  marquee: string[];
}

export interface Discipline {
  id: DisciplineId | 'all';
  label: string;
}

export interface EditorialCopy {
  home: {
    loopFeaturedEyebrow: string;
    featuredEyebrow: string;
    featuredTitle: string;
    featuredCtaAll: string;
    notesEyebrow: string;
    notesTitle: string;
    typeHeadline?: string;
    typeRoleStrip?: string[];
    typeMetaGrid?: { k: string; v: string }[];
    reelEyebrow?: string;
    reelMeta?: string;
    reelHeadline?: string;
    reelBlurb?: string;
    reelNowPlaying?: string;
  };
  work: {
    eyebrowPrefix: string;
    headlineTemplate: string;
    lede: string;
  };
  caseStudy: {
    briefLabel: string;
    snapshotLabel: string;
    processEyebrow: string;
    processHeadline: string;
    processBlurb: string;
    writeupLabel: string;
    backLink: string;
    prevLabel: string;
    nextLabel: string;
  };
  about: {
    eyebrow: string;
    headline: string;
    practiceLabel: string;
    practiceLines: string[];
    aboutLabel: string;
    aboutParagraphs: string[];
    experienceEyebrow: string;
    experienceHeadline: string;
  };
  contact: {
    eyebrow: string;
    headline: string;
    subtitle: string;
    workingWithLabel: string;
    workingWith: string[];
  };
  footer: {
    ctaHeadline: string;
    siteHead: string;
    elsewhereHead: string;
    colophonHead: string;
    colophon: string[];
    rightsTemplate: string;
  };
}

export interface ExperienceRow {
  year: string;
  role: string;
  note: string;
  tag: string;
}

export interface SkillGroup {
  h: string;
  items: string[];
}

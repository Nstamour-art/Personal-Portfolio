import { createElement } from 'react';
import { collection, config, fields, singleton } from '@keystatic/core';

/* ──────────────────────────────────────────────────────────────────────────
 * Keystatic schema — mirrors content/types.ts (SPEC §5).
 *
 * Storage strategy:
 *  - In dev (`pnpm dev`, NODE_ENV=development), storage is `local` —
 *    Keystatic writes directly to the working directory. Run
 *    `pnpm content` after an edit to refresh data/_generated/*.json,
 *    or restart `pnpm dev`.
 *  - In production builds (`pnpm build` and on Vercel,
 *    NODE_ENV=production), storage is `cloud` — auth and GitHub commits
 *    are handled by Keystatic Cloud (keystatic.cloud), which manages
 *    its own GitHub App against the connected repo. Zero env vars in
 *    the app itself; project identity lives in the `cloud.project`
 *    field below. Editor management (who can sign in) is done from the
 *    Keystatic Cloud dashboard.
 *
 *  WHY NODE_ENV AND NOT VERCEL: this config is imported in both the
 *  server-side API route handler (app/api/keystatic/[...params]/route.ts)
 *  AND the client-side admin UI (app/keystatic/[[...params]]/page.tsx,
 *  which is `'use client'`). Next.js inlines `process.env.NODE_ENV` into
 *  the client bundle, so both contexts agree on the storage mode. Other
 *  env vars (like `VERCEL`) are NOT exposed to client bundles unless
 *  prefixed with `NEXT_PUBLIC_`, which would create a split-brain config:
 *  the server in `cloud` mode while the client thinks it's `local`,
 *  causing the admin UI to call `/api/keystatic/tree` (a local/github
 *  path) which the cloud-mode server handler doesn't register → 404.
 *
 * Disciplines, procedural keys, and span keys are typed enums and live in
 * Keystatic as `select`/`multiselect` so the editor can't drift from the
 * source-of-truth in content/types.ts.
 * ──────────────────────────────────────────────────────────────────────── */

const DISCIPLINE_OPTIONS = [
  { label: 'Motion', value: 'motion' },
  { label: '3D / CG', value: '3d' },
  { label: 'Illustration', value: 'illo' },
  { label: 'Video', value: 'video' },
  { label: 'AI / Workflows', value: 'ai' },
  { label: 'Code', value: 'code' },
] as const;

const PROCEDURAL_OPTIONS = [
  { label: 'Motion', value: 'ph-motion' },
  { label: '3D', value: 'ph-3d' },
  { label: 'Illustration', value: 'ph-illo' },
  { label: 'Video', value: 'ph-video' },
  { label: 'AI', value: 'ph-ai' },
  { label: 'Code', value: 'ph-code' },
] as const;

const SPAN_OPTIONS = [
  { label: 'Auto', value: '' },
  { label: '1 — wide', value: 's-1' },
  { label: '2 — medium', value: 's-2' },
  { label: '3 — narrow tall', value: 's-3' },
  { label: '4 — short wide', value: 's-4' },
  { label: '5 — pair left', value: 's-5' },
  { label: '6 — pair right', value: 's-6' },
  { label: '7 — full row', value: 's-7' },
  { label: '8 — half', value: 's-8' },
  { label: 'Fill remaining', value: 's-fill' },
] as const;

const storage =
  process.env['NODE_ENV'] === 'production'
    ? ({ kind: 'cloud' } as const)
    : ({ kind: 'local' } as const);

export default config({
  storage,
  cloud: { project: 'nstamour-art/personal-portfolio' },
  ui: {
    brand: {
      /* Brand name shown beside the mark in the admin shell header. */
      name: 'N. St-Amour — Folio 26',
      /* Brand mark — a stylised "N" in IBM Plex Mono with the site accent.
       * The font is already loaded site-wide via @fontsource imports in
       * app/layout.tsx, so it's available inside the Keystatic shell. */
      mark: ({ colorScheme }) =>
        createElement(
          'span',
          {
            style: {
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              fontFamily:
                'var(--mono, "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace)',
              fontWeight: 600,
              fontSize: 16,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              color: colorScheme === 'dark' ? '#FF5B1F' : '#C53F0E',
              border: `1.5px solid ${
                colorScheme === 'dark' ? '#FF5B1F' : '#C53F0E'
              }`,
              borderRadius: 4,
              userSelect: 'none',
            },
            'aria-hidden': 'true',
          },
          'N',
        ),
    },
    navigation: {
      /* Group the schema by where the content actually surfaces on the
       * site, instead of the abstract collections/singletons split. */
      Pages: ['editorial', 'site'],
      Work: ['projects'],
      Notes: ['notes'],
      About: ['experience', 'skills'],
      Theme: ['theme'],
    },
  },

  collections: {
    projects: collection({
      label: 'Projects',
      slugField: 'title',
      path: 'data/projects/*/',
      format: { contentField: 'body' },
      entryLayout: 'content',
      columns: ['year', 'primary'],
      schema: {
        title: fields.slug({
          name: { label: 'Title' },
          slug: {
            label: 'URL slug',
            description: 'Used in /work/<slug>. Lowercase, no spaces.',
          },
        }),
        order: fields.number({
          label: 'Sort order',
          description: 'Lower numbers appear first in the work mosaic.',
          defaultValue: 100,
          validation: { isRequired: true },
        }),
        sub: fields.text({
          label: 'Subtitle',
          description: 'One discipline-style line under the title.',
          validation: { isRequired: true, length: { min: 1 } },
        }),
        year: fields.text({
          label: 'Year',
          description: 'e.g. "2024" or "2022—2023".',
          validation: { isRequired: true, length: { min: 1 } },
        }),
        client: fields.text({
          label: 'Client',
          validation: { isRequired: true, length: { min: 1 } },
        }),
        role: fields.text({
          label: 'Role',
          description: 'Comma-separated roles. Shown in case hero metadata.',
          validation: { isRequired: true, length: { min: 1 } },
        }),
        disciplines: fields.multiselect({
          label: 'Disciplines',
          options: [...DISCIPLINE_OPTIONS],
          defaultValue: ['motion'],
        }),
        primary: fields.select({
          label: 'Primary discipline',
          description: 'Drives the procedural-placeholder palette.',
          options: [...DISCIPLINE_OPTIONS],
          defaultValue: 'motion',
        }),
        featured: fields.checkbox({
          label: 'Featured',
          description: 'Shows as the home-page hero project.',
          defaultValue: false,
        }),
        pitch: fields.text({
          label: 'One-line pitch',
          description: 'Optional. Shown in featured strip.',
          multiline: true,
        }),
        brief: fields.text({
          label: 'Brief',
          description: '1–2 sentences. Sits beside the hero.',
          multiline: true,
          validation: { isRequired: true, length: { min: 1 } },
        }),
        summary: fields.text({
          label: 'Snapshot summary',
          description: 'One short paragraph for the case page.',
          multiline: true,
          validation: { isRequired: true, length: { min: 1 } },
        }),
        heroSrc: fields.image({
          label: 'Hero image',
          description:
            'Drag/drop or pick a file. Stored under /public/assets/projects/<slug>/ in the repo and committed via Keystatic Cloud. Leave empty to use the procedural placeholder.',
          directory: 'public/assets/projects',
          publicPath: '/assets/projects/',
        }),
        heroAlt: fields.text({
          label: 'Hero alt text',
        }),
        heroVideo: fields.url({
          label: 'Hero video URL',
          description:
            'YouTube or Vimeo URL. When set, the hero becomes click-to-play with the image above as the poster.',
        }),
        thumbSrc: fields.image({
          label: 'Thumb image',
          description:
            'Optional override; otherwise falls back to the hero image.',
          directory: 'public/assets/projects',
          publicPath: '/assets/projects/',
        }),
        thumbAlt: fields.text({ label: 'Thumb alt text' }),
        process: fields.array(
          fields.object({
            label: fields.text({
              label: 'Step label',
              validation: { isRequired: true, length: { min: 1 } },
            }),
            note: fields.text({
              label: 'Step note',
              validation: { isRequired: true, length: { min: 1 } },
            }),
            mediaSrc: fields.image({
              label: 'Step image',
              description: 'Optional.',
              directory: 'public/assets/projects',
              publicPath: '/assets/projects/',
            }),
            mediaAlt: fields.text({ label: 'Alt text' }),
          }),
          {
            label: 'Process steps',
            itemLabel: (props) => props.fields.label.value || 'Step',
          },
        ),
        tools: fields.text({ label: 'Tools' }),
        duration: fields.text({ label: 'Duration' }),
        status: fields.text({ label: 'Status' }),
        output: fields.text({ label: 'Output' }),
        ph: fields.select({
          label: 'Procedural placeholder override',
          options: [
            { label: 'Use primary discipline default', value: '' },
            ...PROCEDURAL_OPTIONS,
          ],
          defaultValue: '',
        }),
        span: fields.select({
          label: 'Mosaic span override',
          description: 'Leave on Auto to use the default cycling pattern.',
          options: [...SPAN_OPTIONS],
          defaultValue: '',
        }),
        body: fields.markdoc({
          label: 'Writeup',
          description:
            'Notes on the build — supports headings, lists, links, **bold**, *italic accent*, and inline code.',
        }),
      },
    }),

    notes: collection({
      label: 'Notes',
      slugField: 'title',
      path: 'data/notes/*/',
      format: { contentField: 'body' },
      entryLayout: 'content',
      columns: ['date', 'kind'],
      schema: {
        title: fields.slug({
          name: { label: 'Title' },
          slug: { label: 'URL slug' },
        }),
        order: fields.number({
          label: 'Sort order',
          description: 'Lower numbers sort first inside pinned/unpinned groups.',
          defaultValue: 100,
          validation: { isRequired: true },
        }),
        date: fields.text({
          label: 'Date',
          description: 'Display date, e.g. "May 2026".',
          validation: { isRequired: true, length: { min: 1 } },
        }),
        kind: fields.text({
          label: 'Kind',
          description: 'Essay, Process, Tools, etc.',
          validation: { isRequired: true, length: { min: 1 } },
        }),
        summary: fields.text({
          label: 'Summary',
          multiline: true,
          validation: { isRequired: true, length: { min: 1 } },
        }),
        pinned: fields.checkbox({
          label: 'Pinned',
          description: 'Surfaces in the home-page notes strip.',
          defaultValue: false,
        }),
        coverSrc: fields.image({
          label: 'Cover image',
          description:
            'Drag/drop or pick a file. Stored under /public/assets/notes/<slug>/ in the repo. Leave empty for the procedural cover.',
          directory: 'public/assets/notes',
          publicPath: '/assets/notes/',
        }),
        coverAlt: fields.text({ label: 'Cover alt text' }),
        body: fields.markdoc({
          label: 'Body',
        }),
      },
    }),
  },

  singletons: {
    site: singleton({
      label: 'Site config',
      path: 'data/site',
      format: 'json',
      schema: {
        name: fields.text({
          label: 'Display name',
          validation: { isRequired: true, length: { min: 1 } },
        }),
        short: fields.text({ label: 'Short label (NSA)' }),
        initials: fields.text({ label: 'Initial' }),
        role: fields.text({
          label: 'Personal title / role',
          description:
            'One-liner shown under the name on the home hero (e.g. "Creative Technologist").',
          validation: { isRequired: true, length: { min: 1 } },
        }),
        tagline: fields.text({ label: 'Tagline' }),
        manifesto: fields.text({ label: 'Manifesto', multiline: true }),
        location: fields.text({ label: 'Location' }),
        email: fields.text({
          label: 'Contact email',
          validation: { isRequired: true, length: { min: 1 } },
        }),
        avatar: fields.object(
          {
            src: fields.image({
              label: 'Avatar image',
              description:
                'Drag/drop or pick a file. Stored at /public/assets/site/. Leave empty to render the accent-coloured initial-letter fallback.',
              directory: 'public/assets/site',
              publicPath: '/assets/site/',
            }),
            alt: fields.text({ label: 'Avatar alt text' }),
          },
          { label: 'Avatar' },
        ),
        socials: fields.array(
          fields.object({
            label: fields.text({
              label: 'Platform label',
              validation: { isRequired: true, length: { min: 1 } },
            }),
            handle: fields.text({
              label: 'Handle',
              validation: { isRequired: true, length: { min: 1 } },
            }),
            href: fields.text({
              label: 'URL',
              description: 'Full URL. Use "#" as a placeholder while drafting.',
              validation: { isRequired: true, length: { min: 1 } },
            }),
          }),
          {
            label: 'Social links',
            itemLabel: (props) => props.fields.label.value || 'Social',
          },
        ),
        marquee: fields.array(fields.text({ label: 'Word' }), {
          label: 'Hero marquee strip',
        }),
      },
    }),

    editorial: singleton({
      label: 'Editorial copy',
      path: 'data/editorial',
      format: 'json',
      schema: {
        home: fields.object({
          loopFeaturedEyebrow: fields.text({ label: 'Featured eyebrow' }),
          featuredEyebrow: fields.text({ label: 'Strip eyebrow' }),
          featuredTitle: fields.text({ label: 'Strip title' }),
          featuredCtaAll: fields.text({ label: 'Strip CTA' }),
          notesEyebrow: fields.text({ label: 'Notes eyebrow' }),
          notesTitle: fields.text({ label: 'Notes title' }),
          typeHeadline: fields.text({ label: 'Type headline', multiline: true }),
          typeRoleStrip: fields.array(fields.text({ label: 'Role' }), {
            label: 'Type role strip',
          }),
          typeMetaGrid: fields.array(
            fields.object({
              k: fields.text({ label: 'Key' }),
              v: fields.text({ label: 'Value' }),
            }),
            {
              label: 'Type meta grid',
              itemLabel: (props) => props.fields.k.value || 'Row',
            },
          ),
          reelEyebrow: fields.text({ label: 'Reel eyebrow' }),
          reelMeta: fields.text({ label: 'Reel meta' }),
          reelHeadline: fields.text({ label: 'Reel headline' }),
          reelBlurb: fields.text({ label: 'Reel blurb', multiline: true }),
          reelNowPlaying: fields.text({ label: 'Reel now-playing label' }),
        }),
        work: fields.object({
          eyebrowPrefix: fields.text({ label: 'Eyebrow prefix' }),
          headlineTemplate: fields.text({
            label: 'Headline template',
            description:
              'Supports {projects} / {disciplines} placeholders and the {projectsS} / {disciplinesS} plural-helpers.',
            multiline: true,
          }),
          lede: fields.text({ label: 'Lede', multiline: true }),
        }),
        caseStudy: fields.object({
          briefLabel: fields.text({ label: 'Brief label' }),
          snapshotLabel: fields.text({ label: 'Snapshot label' }),
          processEyebrow: fields.text({ label: 'Process eyebrow' }),
          processHeadline: fields.text({ label: 'Process headline' }),
          processBlurb: fields.text({ label: 'Process blurb', multiline: true }),
          writeupLabel: fields.text({ label: 'Writeup label' }),
          backLink: fields.text({ label: 'Back link' }),
          prevLabel: fields.text({ label: 'Prev label' }),
          nextLabel: fields.text({ label: 'Next label' }),
        }),
        about: fields.object({
          eyebrow: fields.text({ label: 'Eyebrow' }),
          headline: fields.text({ label: 'Headline', multiline: true }),
          practiceLabel: fields.text({ label: 'Practice label' }),
          practiceLines: fields.array(fields.text({ label: 'Line' }), {
            label: 'Practice lines',
          }),
          aboutLabel: fields.text({ label: 'About label' }),
          aboutParagraphs: fields.array(
            fields.text({ label: 'Paragraph', multiline: true }),
            {
              label: 'About paragraphs',
              description: 'Supports **bold** and *italic accent* spans.',
            },
          ),
          experienceEyebrow: fields.text({ label: 'Experience eyebrow' }),
          experienceHeadline: fields.text({ label: 'Experience headline' }),
        }),
        contact: fields.object({
          eyebrow: fields.text({ label: 'Eyebrow' }),
          headline: fields.text({ label: 'Headline', multiline: true }),
          subtitle: fields.text({ label: 'Subtitle', multiline: true }),
          workingWithLabel: fields.text({ label: 'Working with label' }),
          workingWith: fields.array(fields.text({ label: 'Item' }), {
            label: 'Working with list',
          }),
        }),
        footer: fields.object({
          ctaHeadline: fields.text({ label: 'CTA headline' }),
          siteHead: fields.text({ label: 'Site column head' }),
          elsewhereHead: fields.text({ label: 'Elsewhere column head' }),
          colophonHead: fields.text({ label: 'Colophon column head' }),
          colophon: fields.array(fields.text({ label: 'Line' }), {
            label: 'Colophon lines',
          }),
          rightsTemplate: fields.text({
            label: 'Rights template',
            description: 'Supports {name} placeholder.',
          }),
        }),
      },
    }),

    experience: singleton({
      label: 'Experience',
      path: 'data/experience',
      format: 'json',
      schema: {
        rows: fields.array(
          fields.object({
            year: fields.text({
              label: 'Year',
              validation: { isRequired: true, length: { min: 1 } },
            }),
            role: fields.text({
              label: 'Role',
              validation: { isRequired: true, length: { min: 1 } },
            }),
            note: fields.text({
              label: 'Note',
              validation: { isRequired: true, length: { min: 1 } },
            }),
            tag: fields.text({
              label: 'Tag',
              validation: { isRequired: true, length: { min: 1 } },
            }),
          }),
          {
            label: 'Experience rows',
            itemLabel: (props) =>
              `${props.fields.year.value} — ${props.fields.role.value}`,
          },
        ),
      },
    }),

    skills: singleton({
      label: 'Skills',
      path: 'data/skills',
      format: 'json',
      schema: {
        groups: fields.array(
          fields.object({
            h: fields.text({
              label: 'Heading',
              validation: { isRequired: true, length: { min: 1 } },
            }),
            items: fields.array(
              fields.text({
                label: 'Item',
                validation: { isRequired: true, length: { min: 1 } },
              }),
              { label: 'Items' },
            ),
          }),
          {
            label: 'Skill groups',
            itemLabel: (props) => props.fields.h.value || 'Group',
          },
        ),
      },
    }),

    theme: singleton({
      label: 'Theme',
      path: 'data/theme',
      format: 'json',
      schema: {
        sansFamily: fields.text({
          label: 'Body & paragraph font',
          description:
            'Google Fonts family name (e.g. "Inter", "Manrope", "DM Sans"). Used for paragraphs, body copy, and anything not explicitly styled. Browse at https://fonts.google.com and copy the family name exactly. Leave blank to use the system sans stack (no webfont download).',
        }),
        displayFamily: fields.text({
          label: 'Display & headline font',
          description:
            'Google Fonts family name. Used for h1 / h2 / h3 page titles, project titles, case study headlines, and the home hero name. Leave blank to inherit the body font.',
        }),
        monoFamily: fields.text({
          label: 'Mono / label font',
          description:
            'Google Fonts family name (e.g. "IBM Plex Mono", "JetBrains Mono", "Geist Mono"). Used for small uppercase labels, eyebrows, captions, footer columns, and the nav rail. Leave blank for the system monospace stack.',
        }),
        marqueeFamily: fields.text({
          label: 'Marquee font (giant scrolling words on home)',
          description:
            'Google Fonts family name. Applies only to the giant scrolling word strip on the home hero — often benefits from a distinct display-grade font like "Fraunces", "Playfair Display", or "Anton". Leave blank to inherit the display font.',
        }),
        accentColor: fields.text({
          label: 'Accent colour (hex)',
          description:
            'Hex colour used for the brand mark, CTA arrows, focus rings, the marquee dot separator, and link hovers. Default: #FF5B1F. Aim for at least 4.5:1 contrast against the page background (#0E1117). Invalid values silently fall back to the default.',
          defaultValue: '#FF5B1F',
        }),
      },
    }),
  },
});

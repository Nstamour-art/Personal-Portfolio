import { createElement } from 'react';
import { collection, config, fields, singleton } from '@keystatic/core';

/* ──────────────────────────────────────────────────────────────────────────
 * Keystatic schema — mirrors content/types.ts (SPEC §5).
 *
 * IA / labelling philosophy: every label is written for someone who has
 * never seen the site code. Field IDs (the keys) stay machine-readable
 * (camelCase, stable); labels and descriptions explain what the field
 * *does on the rendered page* in plain English. Whenever a field's name
 * could be confusing (eyebrow, lede, mosaic span, procedural placeholder),
 * the description spells out where it surfaces and what happens if it's
 * blank.
 *
 * Project + note entries are grouped via `fields.object` into labelled
 * sections (About, Visibility, Story, Visuals, Case study, Advanced),
 * so the entry form reads as scannable groups instead of one long flat
 * list. The on-disk frontmatter mirrors this grouping — see
 * scripts/migrate-content-shape.mjs for the one-time flat → grouped
 * migration that reshaped existing .mdoc files.
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
 * ──────────────────────────────────────────────────────────────────── */

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
  { label: 'Auto (recommended)', value: '' },
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
      name: 'N. St-Amour — Folio 26',
      /* Brand mark — a stylised "N" in the site mono font with the
       * accent colour. */
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
    /* Sidebar grouping is ordered by frequency of edit:
     *  Write  → the things visitors actually read (Projects, Notes, copy)
     *  You    → identity & background
     *  Site   → site-wide configuration */
    navigation: {
      Write: ['projects', 'notes', 'editorial'],
      You: ['site', 'experience', 'education', 'awards', 'skills'],
      Site: ['announcement', 'theme'],
    },
  },

  collections: {
    projects: collection({
      label: 'Projects',
      slugField: 'title',
      path: 'data/projects/*/',
      format: { contentField: 'body' },
      entryLayout: 'content',
      schema: {
        title: fields.slug({
          name: {
            label: 'Title',
            description: 'Project name shown in the work grid and on the case page.',
          },
          slug: {
            label: 'URL slug',
            description: 'Used in /work/<slug>. Lowercase, no spaces.',
          },
        }),

        about: fields.object(
          {
            order: fields.number({
              label: 'Order in list',
              description: 'Lower numbers appear first in the work grid.',
              defaultValue: 100,
              validation: { isRequired: true },
            }),
            sub: fields.text({
              label: 'Discipline line',
              description:
                'One-line discipline summary shown under the title (e.g. "Logo treatment & animation").',
              validation: { isRequired: true, length: { min: 1 } },
            }),
            year: fields.text({
              label: 'Year',
              description: 'e.g. "2024" or "2022—2023". Free text.',
              validation: { isRequired: true, length: { min: 1 } },
            }),
            client: fields.text({
              label: 'Client / company',
              validation: { isRequired: true, length: { min: 1 } },
            }),
            role: fields.text({
              label: 'Role(s)',
              description: 'Comma-separated. Shown in the case-study hero metadata.',
              validation: { isRequired: true, length: { min: 1 } },
            }),
            disciplines: fields.multiselect({
              label: 'Disciplines',
              description:
                'One or more. Drives the discipline filter pills on the /work page.',
              options: [...DISCIPLINE_OPTIONS],
              defaultValue: ['motion'],
            }),
            primary: fields.select({
              label: 'Primary discipline',
              description:
                'Drives the procedural placeholder colours when no hero image is uploaded.',
              options: [...DISCIPLINE_OPTIONS],
              defaultValue: 'motion',
            }),
          },
          { label: 'About this project' },
        ),

        visibility: fields.object(
          {
            featured: fields.checkbox({
              label: 'Feature as the home-page hero project',
              description:
                'Only one project should be featured at a time; if multiple are flagged, the first one (by order) wins.',
              defaultValue: false,
            }),
            draft: fields.checkbox({
              label: 'Draft (hide from the public site)',
              description:
                'When checked, the project is hidden from /work, the home featured strip, and prev/next navigation. The case page returns 404 until unchecked. Use for in-progress entries you want to save without publishing.',
              defaultValue: false,
            }),
          },
          { label: 'Visibility' },
        ),

        story: fields.object(
          {
            pitch: fields.text({
              label: 'One-line pitch (optional)',
              description:
                'Used on the home-page featured strip and in OG / social-card previews.',
              multiline: true,
            }),
            brief: fields.text({
              label: 'Brief (1–2 sentences)',
              description: 'Sits beside the hero on the case page.',
              multiline: true,
              validation: { isRequired: true, length: { min: 1 } },
            }),
            summary: fields.text({
              label: 'Snapshot summary (1 short paragraph)',
              description: 'Appears at the top of the case page next to the brief.',
              multiline: true,
              validation: { isRequired: true, length: { min: 1 } },
            }),
          },
          { label: 'Story' },
        ),

        visuals: fields.object(
          {
            heroSrc: fields.image({
              label: 'Hero image',
              description:
                'Drag/drop or pick a file. Stored under /public/assets/projects/. Leave empty to use the procedural placeholder pattern.',
              directory: 'public/assets/projects',
              publicPath: '/assets/projects/',
            }),
            heroAlt: fields.text({
              label: 'Hero image alt text',
              description: 'Required for accessibility when an image is uploaded.',
            }),
            heroVideo: fields.url({
              label: 'Hero video URL (optional)',
              description:
                'YouTube or Vimeo URL. When set, the hero becomes click-to-play with the image above as the poster frame.',
            }),
            thumbSrc: fields.image({
              label: 'Thumb image (optional)',
              description:
                'Shown in the work grid tile. Falls back to the hero image if left empty.',
              directory: 'public/assets/projects',
              publicPath: '/assets/projects/',
            }),
            thumbAlt: fields.text({ label: 'Thumb alt text' }),
          },
          { label: 'Visuals' },
        ),

        caseStudy: fields.object(
          {
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
                  label: 'Step image (optional)',
                  directory: 'public/assets/projects',
                  publicPath: '/assets/projects/',
                }),
                mediaAlt: fields.text({ label: 'Step image alt text' }),
              }),
              {
                label: 'Process steps',
                description:
                  'Shown in the "Process" section of the case page. Each step gets its own labelled card.',
                itemLabel: (props) => props.fields.label.value || 'Step',
              },
            ),
            /* The four meta cells render in this order on the case page
             * (Snapshot column, under the summary paragraph):
             *   Output  ·  Tools  ·  Duration  ·  Status
             * Keystatic field order mirrors the page so editors can scan
             * top-to-bottom and match what they'll see live. Labels also
             * match the page's "k" header text exactly (Output, not
             * "Final deliverable(s)") to remove the naming mismatch that
             * made the field hard to find. */
            output: fields.text({
              label: 'Output',
              description:
                'Shown as the first cell in the Snapshot meta grid on the case page. Final deliverables, e.g. "Broadcast, social, product" or "Web app + design system".',
            }),
            tools: fields.text({
              label: 'Tools',
              description:
                'Second cell in the Snapshot meta grid. Free text, e.g. "AE · Lottie · Figma" or "Next.js · TS · Figma".',
            }),
            duration: fields.text({
              label: 'Duration',
              description:
                'Third cell in the Snapshot meta grid. e.g. "6 weeks active" or "3 sprints".',
            }),
            status: fields.text({
              label: 'Status',
              description:
                'Fourth cell in the Snapshot meta grid. e.g. "Shipped", "In production", "Concept".',
            }),
          },
          { label: 'Case study details' },
        ),

        advanced: fields.object(
          {
            ph: fields.select({
              label: 'Fallback pattern (when no image is uploaded)',
              description:
                'Override the procedural placeholder. Defaults to a pattern derived from the primary discipline.',
              options: [
                { label: 'Auto — use primary discipline', value: '' },
                ...PROCEDURAL_OPTIONS,
              ],
              defaultValue: '',
            }),
            span: fields.select({
              label: 'Tile size in the work grid',
              description:
                'Leave on Auto to use the default cycling layout. Override only when a specific project needs a custom tile size.',
              options: [...SPAN_OPTIONS],
              defaultValue: '',
            }),
            seoTitle: fields.text({
              label: 'SEO title override (optional)',
              description:
                'Replaces the default <title> on the case-study page. Leave blank to use the project title.',
            }),
            seoDescription: fields.text({
              label: 'SEO description override (optional)',
              description:
                'Replaces the default meta description and Open Graph description. Leave blank to use the project brief.',
              multiline: true,
            }),
          },
          { label: 'Advanced' },
        ),

        body: fields.markdoc({
          label: 'Long-form writeup',
          description:
            'Notes on the build. Supports headings, lists, links, **bold**, *italic accent*, and inline code.',
        }),
      },
    }),

    notes: collection({
      label: 'Notes',
      slugField: 'title',
      path: 'data/notes/*/',
      format: { contentField: 'body' },
      entryLayout: 'content',
      schema: {
        title: fields.slug({
          name: { label: 'Title' },
          slug: {
            label: 'URL slug',
            description: 'Used in /notes/<slug>. Lowercase, no spaces.',
          },
        }),

        about: fields.object(
          {
            order: fields.number({
              label: 'Order in list',
              description: 'Lower numbers sort first inside pinned/unpinned groups.',
              defaultValue: 100,
              validation: { isRequired: true },
            }),
            date: fields.text({
              label: 'Display date',
              description: 'Free text, e.g. "May 2026". Used for display only — not parsed.',
              validation: { isRequired: true, length: { min: 1 } },
            }),
            kind: fields.text({
              label: 'Kind / category',
              description:
                'Free text, e.g. "Essay", "Process", "Tools". Surfaces as a small label on the note card.',
              validation: { isRequired: true, length: { min: 1 } },
            }),
            summary: fields.text({
              label: 'Summary (1–2 sentences)',
              description: 'Shown in the /notes index and on the note card.',
              multiline: true,
              validation: { isRequired: true, length: { min: 1 } },
            }),
          },
          { label: 'About this note' },
        ),

        visibility: fields.object(
          {
            pinned: fields.checkbox({
              label: 'Pin to the home-page notes strip',
              description: 'Pinned notes also appear at the top of /notes.',
              defaultValue: false,
            }),
            draft: fields.checkbox({
              label: 'Draft (hide from the public site)',
              description:
                'When checked, the note is hidden from /notes and the home notes strip, and direct access returns 404 until unchecked.',
              defaultValue: false,
            }),
          },
          { label: 'Visibility' },
        ),

        cover: fields.object(
          {
            src: fields.image({
              label: 'Cover image',
              description:
                'Drag/drop or pick a file. Stored under /public/assets/notes/. Leave empty for the procedural cover.',
              directory: 'public/assets/notes',
              publicPath: '/assets/notes/',
            }),
            alt: fields.text({ label: 'Cover alt text' }),
          },
          { label: 'Cover' },
        ),

        advanced: fields.object(
          {
            seoTitle: fields.text({
              label: 'SEO title override (optional)',
              description:
                'Replaces the default <title> on the note page. Leave blank to use the note title.',
            }),
            seoDescription: fields.text({
              label: 'SEO description override (optional)',
              description:
                'Replaces the default meta description. Leave blank to use the note summary.',
              multiline: true,
            }),
          },
          { label: 'Advanced' },
        ),

        body: fields.markdoc({
          label: 'Note body',
          description:
            'Supports headings, lists, links, **bold**, *italic accent*, inline `code`, and code blocks.',
        }),
      },
    }),
  },

  singletons: {
    /* IDENTITY — name, role, contact, avatar, socials, marquee words */
    site: singleton({
      label: 'Identity',
      path: 'data/site',
      format: 'json',
      schema: {
        name: fields.text({
          label: 'Full name',
          description: 'Shown on the home hero and in browser tabs.',
          validation: { isRequired: true, length: { min: 1 } },
        }),
        short: fields.text({
          label: 'Three-letter monogram',
          description:
            'Used in compact spots like the work tile prefix and project labels (e.g. "NSA").',
        }),
        initials: fields.text({
          label: 'Single initial',
          description:
            'Letter shown in the nav-rail brand mark and the round avatar fallback when no avatar image is uploaded (e.g. "N").',
        }),
        role: fields.text({
          label: 'Personal title',
          description:
            'Shown under your name on the home hero (e.g. "Creative Technologist").',
          validation: { isRequired: true, length: { min: 1 } },
        }),
        tagline: fields.text({
          label: 'Tagline (one sentence)',
          description:
            'Used in browser tab titles alongside your name (e.g. "Folio — 2026").',
        }),
        manifesto: fields.text({
          label: 'Manifesto / bio',
          description:
            'Used in meta tags and social card previews. 1–2 sentences describing what you do.',
          multiline: true,
        }),
        location: fields.text({
          label: 'Location',
          description: 'e.g. "Montréal — remote". Shown in the home hero meta grid.',
        }),
        email: fields.text({
          label: 'Contact email',
          description:
            'Powers the mailto: link in the footer and on /contact.',
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
              label: 'Platform name',
              description: 'e.g. "Instagram", "Bluesky", "Are.na".',
              validation: { isRequired: true, length: { min: 1 } },
            }),
            handle: fields.text({
              label: 'Display handle',
              description: 'What\'s shown to visitors, e.g. "@nstamour".',
              validation: { isRequired: true, length: { min: 1 } },
            }),
            href: fields.text({
              label: 'Full URL',
              description: 'Where the link goes. Use "#" as a placeholder while drafting.',
              validation: { isRequired: true, length: { min: 1 } },
            }),
          }),
          {
            label: 'Social links',
            description: 'Shown in the footer and on /contact.',
            itemLabel: (props) => props.fields.label.value || 'Social',
          },
        ),
        marquee: fields.array(fields.text({ label: 'Word' }), {
          label: 'Hero marquee words',
          description:
            'Each word becomes one slot in the giant scrolling text on the home page. 4–6 words recommended; longer lists make the marquee feel cluttered.',
        }),
      },
    }),

    /* PAGE TEXT — every editable string on every page, grouped by page. */
    editorial: singleton({
      label: 'Page text',
      path: 'data/editorial',
      format: 'json',
      schema: {
        home: fields.object(
          {
            loopFeaturedEyebrow: fields.text({
              label: 'Tag above the featured project',
              description:
                'Small all-caps label above the featured project block on the home page (e.g. "Currently featured").',
            }),
            featuredEyebrow: fields.text({
              label: 'Tag above the recent-work row',
              description:
                'Small all-caps label above the horizontal strip of recent projects (e.g. "Selected work").',
            }),
            featuredTitle: fields.text({
              label: 'Recent-work row headline',
            }),
            featuredCtaAll: fields.text({
              label: '"See all work" link text',
              description: 'The link at the end of the recent-work strip.',
            }),
            notesEyebrow: fields.text({
              label: 'Tag above the home notes section',
            }),
            notesTitle: fields.text({
              label: 'Home notes section headline',
            }),
            typeHeadline: fields.text({
              label: 'Hero subtitle (under the giant scrolling text)',
              multiline: true,
            }),
            typeRoleStrip: fields.array(fields.text({ label: 'Discipline' }), {
              label: 'Discipline list under hero',
              description:
                'Comma-separated list of disciplines shown in the home hero meta strip. This is display text only — it does not need to match the discipline taxonomy used by projects.',
            }),
            typeMetaGrid: fields.array(
              fields.object({
                k: fields.text({ label: 'Label' }),
                v: fields.text({ label: 'Value' }),
              }),
              {
                label: 'Quick-facts grid',
                description:
                  'Small key/value grid in the home hero (e.g. "Currently → Booking Q3 2026").',
                itemLabel: (props) => props.fields.k.value || 'Row',
              },
            ),
          },
          { label: 'Home page' },
        ),

        notes: fields.object(
          {
            eyebrowPrefix: fields.text({
              label: 'Tag above the /notes page title',
              description:
                'The current count of notes is appended automatically, e.g. "Notes & writing · 3".',
            }),
            lede: fields.text({
              label: 'Lede paragraph beside the /notes title',
              multiline: true,
            }),
          },
          { label: 'Notes index page' },
        ),

        work: fields.object(
          {
            eyebrowPrefix: fields.text({
              label: 'Tag above the /work page title',
            }),
            headlineTemplate: fields.text({
              label: 'Page headline (template)',
              description:
                'Supports {projects} / {disciplines} placeholders and the {projectsS} / {disciplinesS} plural helpers (e.g. "{projects} project{projectsS}").',
              multiline: true,
            }),
            lede: fields.text({
              label: 'Lede paragraph beside the /work title',
              multiline: true,
            }),
          },
          { label: 'Work index page' },
        ),

        caseStudy: fields.object(
          {
            briefLabel: fields.text({ label: '"Brief" section heading' }),
            snapshotLabel: fields.text({ label: '"Snapshot" section heading' }),
            processEyebrow: fields.text({ label: '"Process" section tag' }),
            processHeadline: fields.text({ label: '"Process" section headline' }),
            processBlurb: fields.text({
              label: '"Process" section paragraph',
              multiline: true,
            }),
            writeupLabel: fields.text({ label: 'Long-form writeup heading' }),
            backLink: fields.text({ label: 'Back-to-work link text' }),
            prevLabel: fields.text({ label: '"Previous project" button text' }),
            nextLabel: fields.text({ label: '"Next project" button text' }),
          },
          { label: 'Project case study pages' },
        ),

        about: fields.object(
          {
            eyebrow: fields.text({
              label: 'Tag above the /studio page title',
            }),
            headline: fields.text({
              label: 'Page headline',
              multiline: true,
            }),
            summary: fields.text({
              label: 'Professional summary (2–3 sentences)',
              description:
                'Top-of-CV intro paragraph. Plain text — supports **bold** and *italic accent* for inline emphasis.',
              multiline: true,
            }),
            practiceLabel: fields.text({
              label: 'CV sidebar — "What I bring" heading',
              description:
                'Heading above the bring-block in the right sidebar. Defaults to "What I bring".',
            }),
            practiceLines: fields.array(fields.text({ label: 'Line' }), {
              label: 'CV sidebar — "What I bring" lines',
              description:
                'Each line becomes a bullet in the right sidebar. 3–6 lines reads cleanest.',
            }),
            experienceEyebrow: fields.text({
              label: '"Experience" section tag',
            }),
            experienceHeadline: fields.text({
              label: '"Experience" section headline',
            }),
            educationEyebrow: fields.text({
              label: '"Education" section tag',
              description: 'Defaults to "Education".',
            }),
            awardsEyebrow: fields.text({
              label: '"Awards & press" section tag',
              description: 'Defaults to "Awards & press".',
            }),
          },
          { label: 'Studio page (CV)' },
        ),

        contact: fields.object(
          {
            eyebrow: fields.text({ label: 'Tag above the /contact page title' }),
            headline: fields.text({ label: 'Page headline', multiline: true }),
            subtitle: fields.text({ label: 'Subtitle paragraph', multiline: true }),
            workingWithLabel: fields.text({
              label: '"Working with" column heading',
            }),
            workingWith: fields.array(fields.text({ label: 'Item' }), {
              label: '"Working with" list items',
            }),
          },
          { label: 'Contact page' },
        ),

        footer: fields.object(
          {
            ctaHeadline: fields.text({
              label: 'Footer CTA headline',
              description: 'Large headline that sits above the footer columns.',
            }),
            siteHead: fields.text({ label: '"Site" column heading' }),
            elsewhereHead: fields.text({ label: '"Elsewhere" column heading' }),
            colophonHead: fields.text({ label: '"Colophon" column heading' }),
            colophon: fields.array(fields.text({ label: 'Line' }), {
              label: '"Colophon" column lines',
            }),
            rightsTemplate: fields.text({
              label: 'Copyright line',
              description:
                'Supports the {name} placeholder, which inserts your full name from Identity.',
            }),
          },
          { label: 'Footer (all pages)' },
        ),
      },
    }),

    /* EXPERIENCE — chronological practice timeline shown on /studio. */
    experience: singleton({
      label: 'Experience',
      path: 'data/experience',
      format: 'json',
      schema: {
        rows: fields.array(
          fields.object({
            year: fields.text({
              label: 'Year (or range)',
              description: 'e.g. "2024" or "2022—2024".',
              validation: { isRequired: true, length: { min: 1 } },
            }),
            role: fields.text({
              label: 'Role / title',
              validation: { isRequired: true, length: { min: 1 } },
            }),
            note: fields.text({
              label: 'Description',
              description: 'One short line about the role or what you did.',
              validation: { isRequired: true, length: { min: 1 } },
            }),
            tag: fields.text({
              label: 'Discipline tag',
              description: 'Small label shown on the right of the row (e.g. "Motion", "AI").',
              validation: { isRequired: true, length: { min: 1 } },
            }),
          }),
          {
            label: 'Timeline rows',
            description:
              'Shown in the "Experience" section on /studio, in the order listed here.',
            itemLabel: (props) =>
              `${props.fields.year.value} — ${props.fields.role.value}`,
          },
        ),
      },
    }),

    /* SKILLS — capability groups shown on /studio. */
    skills: singleton({
      label: 'Skills',
      path: 'data/skills',
      format: 'json',
      schema: {
        groups: fields.array(
          fields.object({
            h: fields.text({
              label: 'Group heading',
              description: 'e.g. "Motion", "AI / Workflows", "Code".',
              validation: { isRequired: true, length: { min: 1 } },
            }),
            items: fields.array(
              fields.text({
                label: 'Skill',
                validation: { isRequired: true, length: { min: 1 } },
              }),
              {
                label: 'Skills in this group',
                description: 'One item per line. Order is preserved.',
              },
            ),
          }),
          {
            label: 'Skill groups',
            itemLabel: (props) => props.fields.h.value || 'Group',
          },
        ),
      },
    }),

    /* EDUCATION — appears in the /studio CV's main column. */
    education: singleton({
      label: 'Education',
      path: 'data/education',
      format: 'json',
      schema: {
        rows: fields.array(
          fields.object({
            year: fields.text({
              label: 'Year (or range)',
              description: 'e.g. "2018—2022" or "2020".',
              validation: { isRequired: true, length: { min: 1 } },
            }),
            school: fields.text({
              label: 'School / institution',
              validation: { isRequired: true, length: { min: 1 } },
            }),
            programme: fields.text({
              label: 'Programme / degree',
              description: 'e.g. "BFA, Graphic Design" or "Diploma, Animation".',
              validation: { isRequired: true, length: { min: 1 } },
            }),
            note: fields.text({
              label: 'Note (optional)',
              description: 'Short context line, e.g. "Honours · Dean\'s list".',
            }),
          }),
          {
            label: 'Education entries',
            itemLabel: (p) =>
              `${p.fields.year.value} — ${p.fields.school.value}` || 'Row',
          },
        ),
      },
    }),

    /* AWARDS & PRESS — appears in the /studio CV's main column. */
    awards: singleton({
      label: 'Awards & press',
      path: 'data/awards',
      format: 'json',
      schema: {
        rows: fields.array(
          fields.object({
            year: fields.text({
              label: 'Year',
              description: 'e.g. "2025".',
              validation: { isRequired: true, length: { min: 1 } },
            }),
            title: fields.text({
              label: 'Title',
              description:
                'Award name or article title (e.g. "Best in Motion 2024" or "Interview — It\'s Nice That").',
              validation: { isRequired: true, length: { min: 1 } },
            }),
            source: fields.text({
              label: 'Source / organisation',
              description: 'e.g. "AIGA", "The Webby Awards", "It\'s Nice That".',
              validation: { isRequired: true, length: { min: 1 } },
            }),
            href: fields.text({
              label: 'Link (optional)',
              description:
                'Full URL. When set, the entry becomes a link that opens in a new tab.',
            }),
          }),
          {
            label: 'Awards & press entries',
            itemLabel: (p) =>
              `${p.fields.year.value} — ${p.fields.title.value}` || 'Row',
          },
        ),
      },
    }),

    /* ANNOUNCEMENT — sitewide banner above public pages. */
    announcement: singleton({
      label: 'Announcement',
      path: 'data/announcement',
      format: 'json',
      schema: {
        enabled: fields.checkbox({
          label: 'Show the announcement bar',
          description:
            'When checked, a thin banner appears above every public page (home, work, notes, studio, contact). When unchecked, the banner renders nothing — zero DOM, zero layout shift. Use as a kill switch.',
          defaultValue: false,
        }),
        message: fields.text({
          label: 'Message',
          description:
            'e.g. "Booking Q3 2026 — limited spots." Keep it short; the banner is one line at desktop widths.',
        }),
        ctaLabel: fields.text({
          label: 'Button label (optional)',
          description: 'e.g. "Get in touch". Leave blank to hide the button.',
        }),
        ctaHref: fields.text({
          label: 'Button link (optional)',
          description:
            'Absolute URL (https://…) opens in a new tab. Relative paths (e.g. /contact) open in the same tab. Must be set together with the button label.',
        }),
      },
    }),

    /* APPEARANCE — fonts and accent colour for the whole site. */
    theme: singleton({
      label: 'Appearance',
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

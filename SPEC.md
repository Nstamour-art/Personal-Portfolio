# Implementation spec — N. St-Amour Folio '26

> Build target: production portfolio site, deployed on Vercel,
> content-driven, template-based.
>
> This document is the source of truth for the production build. Treat the
> HTML prototype in this repo as the visual/interaction reference — match
> it pixel-close.

---

## 1. Stack

| Layer        | Choice                                                              |
|--------------|---------------------------------------------------------------------|
| Framework    | **Next.js 15 App Router** (TypeScript, strict)                      |
| Styling      | **CSS Modules** + design tokens in `:root`                          |
| Animation    | **Framer Motion** for page transitions; native DOM/RAF for cursor + magnetic |
| Content      | TypeScript modules (`/content/*.ts`)                                |
| Images       | `next/image` with imported static sources                           |
| Video        | YouTube / Vimeo iframes with poster fallback (see §6.10)            |
| Markdown     | Hand-rolled renderer (~120 lines, no deps) — see §6.11              |
| Deploy       | Vercel — static-export safe                                         |
| Domain       | _confirm with artist_                                               |

**Why not MDX or a hosted CMS to start?** Content footprint is small (~10
projects, ~3–10 notes, slow churn). Typed TS modules give inline validation,
zero runtime overhead, and an edit experience that's a single file change.
A real CMS (Keystatic recommended — see §16) slots in later behind the same
selector functions without touching components.

**Why not Tailwind?** Design depends on a small named token system (accent,
line, fg-2, muted-2, bg). CSS Modules + `:root` vars keep the naming
explicit and survive theme swaps.

---

## 2. Visual direction (locked)

These are the **defaults**. The Tweaks panel in the prototype exists to
explore variants; production ships only one of each:

- **Hero**: `marquee` (Loop) — large scrolling type with a featured peek
- **Navigation**: `rail` — vertical left edge, 76px wide
- **Palette**: Orange accent on cool charcoal
- **Display type**: All-caps for display/headings; sentence-case for body prose
- **Cursor**: Custom blend-mode cursor (default ON; respect `prefers-reduced-motion` and `pointer: coarse`)

### Design tokens (CSS custom properties, in `app/globals.css`)

```css
:root {
  /* Background / surfaces */
  --bg:        #0E1117;   /* cool charcoal, slight blue */
  --bg-2:      #14171D;
  --surface:   #181C24;
  --line:      #1F242E;
  --line-2:    #2A303C;

  /* Foreground */
  --fg:        #EDE5D8;   /* warm bone */
  --fg-2:      #C9C5BC;
  --muted:     #7A7F8A;
  --muted-2:   #4F535E;

  /* Accent */
  --accent:    #FF5B1F;
  --accent-ink: #0E1117;   /* text on accent (computed for contrast) */

  /* Layout */
  --pad:  clamp(20px, 3.5vw, 56px);
  --maxw: 1640px;

  /* Motion */
  --t-fast: 220ms cubic-bezier(.22,.61,.36,1);
  --t-med:  420ms cubic-bezier(.22,.61,.36,1);
  --t-slow: 720ms cubic-bezier(.22,.61,.36,1);

  /* Type */
  --sans: "Helvetica Neue", "Helvetica", "Arial", system-ui, sans-serif;
  --mono: "IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace;
}
```

### Type scale

| Token        | Size                      | LH    | Tracking | Weight |
|--------------|---------------------------|-------|----------|--------|
| `.t-display` | clamp(56px, 11vw, 184px)  | 0.86  | -0.045em | 500    |
| `.t-h1`      | clamp(40px, 6.5vw, 96px)  | 0.92  | -0.035em | 500    |
| `.t-h2`      | clamp(28px, 3.4vw, 48px)  | 1.02  | -0.022em | 500    |
| `.t-h3`      | clamp(20px, 1.8vw, 26px)  | 1.15  | -0.012em | 500    |
| `.t-body`    | 17px                      | 1.55  | -0.005em | 400    |
| `.t-body-sm` | 14.5px                    | 1.55  |  0       | 400    |
| `.t-eyebrow` | 12px mono uppercase       | —     |  0.08em  | 400    |
| `.t-mono`    | 13px mono                 | —     |  0.02em  | 400    |
| `.t-mono-sm` | 11.5px mono uppercase     | —     |  0.04em  | 400    |

### All-caps mode

Toggled via `body.caps`. Applies `text-transform: uppercase` and tightened
tracking **only** to display/heading classes, tile titles, hero titles,
marquee, footer big text, exp rows, note titles. Body prose stays
sentence-case. Production ships with this **on** by default.

---

## 3. Information architecture

```
/                       Home — Loop hero + featured strip + notes strip
/work                   Work index — asymmetric mosaic + filters
/work/[slug]            Case study — cinematic + brief + process + writeup + prev/next
/notes                  Notes index — editorial list of articles
/notes/[slug]           Note article — full-width header + markdown body + prev/next
/studio                 Studio — bio + skills + experience
/contact                Contact — big email + socials + working-with list
```

URL slugs are `project.id` and `note.id` from the content layer.

### Routes & metadata

- `app/sitemap.ts` — generate from project + note lists + static routes
- `app/robots.ts` — allow all
- `app/work/[slug]/page.tsx` — `generateStaticParams` from `PROJECTS`
- `app/notes/[slug]/page.tsx` — `generateStaticParams` from `NOTES`
- Open Graph: per-project / per-note OG images via `next/og` from the hero
  / cover + title (fallback: branded text card)

---

## 4. File structure

```
.
├── app/
│   ├── layout.tsx              # root layout — fonts, cursor, nav, theme
│   ├── globals.css             # tokens + base + all-caps mode
│   ├── page.tsx                # /
│   ├── work/
│   │   ├── page.tsx            # /work
│   │   └── [slug]/page.tsx     # /work/[slug]
│   ├── notes/
│   │   ├── page.tsx            # /notes
│   │   └── [slug]/page.tsx     # /notes/[slug]
│   ├── studio/page.tsx
│   ├── contact/page.tsx
│   ├── sitemap.ts
│   ├── robots.ts
│   └── opengraph-image.tsx
│
├── components/
│   ├── chrome/
│   │   ├── nav-rail.tsx
│   │   ├── cursor.tsx
│   │   ├── magnetic.tsx
│   │   ├── footer.tsx
│   │   └── page-transition.tsx
│   │
│   ├── home/
│   │   ├── hero-marquee.tsx        # uses getFeatured() → project.pitch
│   │   ├── featured-strip.tsx      # featured + next 3 projects
│   │   └── notes-strip.tsx         # top 3 notes, pinned first
│   │
│   ├── work/
│   │   ├── mosaic.tsx              # 12-col grid, tessellating spans
│   │   ├── tile.tsx
│   │   ├── filter-chips.tsx
│   │   └── span-cycle.ts
│   │
│   ├── case/
│   │   ├── cinematic-hero.tsx      # uses <VideoHero> when heroVideo set
│   │   ├── brief-block.tsx
│   │   ├── process-gallery.tsx
│   │   ├── writeup.tsx
│   │   └── next-prev.tsx
│   │
│   ├── notes/
│   │   ├── notes-index.tsx         # editorial list with pinned-first sort
│   │   └── note-article.tsx        # H1 + meta row + cover + markdown body
│   │
│   ├── studio/
│   │   ├── bio.tsx                 # renders EDITORIAL.about.aboutParagraphs
│   │   ├── skills-grid.tsx
│   │   └── experience-list.tsx
│   │
│   ├── contact/
│   │   ├── big-email.tsx
│   │   ├── socials.tsx
│   │   └── working-with-list.tsx
│   │
│   └── primitives/
│       ├── placeholder.tsx         # image | procedural placeholder
│       ├── video-hero.tsx          # YT / Vimeo / file with poster + click-to-play
│       ├── markdown.tsx            # block + inline parser, ~120 lines
│       ├── procedural-bg.tsx
│       ├── eyebrow.tsx
│       └── arrow-button.tsx
│
├── content/
│   ├── site.ts                     # SiteConfig — brand, contact, socials, marquee
│   ├── projects.ts                 # Project[]
│   ├── notes.ts                    # Note[]
│   ├── editorial.ts                # EditorialCopy — all page-level strings
│   ├── experience.ts               # ExperienceRow[]
│   ├── skills.ts                   # SkillGroup[]
│   └── types.ts
│
├── lib/
│   ├── content.ts                  # getProject, getFeatured, getNote, getYearRange…
│   ├── copy.ts                     # path-based EDITORIAL lookup with fallback
│   ├── video.ts                    # parseVideoUrl(url) → { kind, id, embedUrl }
│   ├── contrast.ts                 # accent-ink contrast computation
│   └── hooks/
│       ├── useCursorState.ts
│       ├── useMagnetic.ts
│       └── useReducedMotion.ts
│
├── public/
│   ├── assets/work/<slug>/         # hero.jpg, thumb.jpg, process-NN.jpg
│   ├── assets/notes/<slug>/        # cover.jpg
│   ├── fonts/                      # IBM Plex Mono (self-hosted)
│   ├── favicon.ico
│   └── og-default.png
│
├── CONTENT.md                      # how to add a project / note
├── README.md
└── package.json
```

---

## 5. Content types (`content/types.ts`)

```ts
export type DisciplineId =
  | 'motion' | '3d' | 'illo' | 'video' | 'ai' | 'code';

export interface MediaSlot {
  /** Path relative to /public, e.g. "/assets/work/vubiquity/hero.jpg".
   *  May be StaticImageData (imported) for next/image. */
  src: string | import('next/image').StaticImageData | '';
  alt: string;
}

export interface ProcessStep {
  media?: MediaSlot;
  label: string;   // shown on the image AND in the caption
  note: string;    // small monoline beneath the label
}

export interface Project {
  /* identity */
  id: string;                   // URL slug
  title: string;
  sub: string;
  year: string;                 // "2024" or "2022—2023"
  client: string;
  role: string;
  disciplines: DisciplineId[];
  primary: DisciplineId;        // drives placeholder palette

  /* copy */
  brief: string;
  summary: string;
  writeup: string[];            // paragraphs
  /** Punchy one-liner used as the Loop hero H2 when this project is the
   *  active featured one. Falls back to `brief` when missing. */
  pitch?: string;

  /* media */
  hero?: MediaSlot;
  thumb?: MediaSlot;
  process: ProcessStep[];
  /** YouTube / Vimeo URL, or direct .mp4 / .webm / .mov.
   *  When set, the hero renders as <VideoHero> with the image as poster. */
  heroVideo?: string;

  /* metadata panel */
  tools?: string;
  duration?: string;
  status?: string;
  output?: string;

  /** Single-select: only one project should be featured at a time.
   *  Admin enforces this. If none is featured, the home page falls back
   *  to the first project in the array. */
  featured?: boolean;

  /* visual overrides */
  ph?: 'ph-motion' | 'ph-3d' | 'ph-illo' | 'ph-video' | 'ph-ai' | 'ph-code';
  span?: 's-1' | 's-2' | 's-3' | 's-4' | 's-5' | 's-6' | 's-7' | 's-8';
}

export interface Note {
  id: string;             // URL slug
  date: string;           // freeform string ("May 2026" or ISO)
  title: string;
  kind: string;           // "Essay" / "Process" / "Tools" / "Note"
  summary: string;        // 1-sentence preview for index + strip
  body: string;           // markdown — see §6.11
  cover?: MediaSlot;      // optional
  pinned?: boolean;       // pinned notes sort first
}

export interface SiteConfig {
  name: string;
  short: string;
  initials: string;
  tagline: string;
  manifesto: string;
  location: string;
  email: string;
  socials: { label: string; handle: string; href: string }[];
  /** Words that scroll across the home Loop hero. */
  marquee: string[];
}

export interface EditorialCopy {
  home: {
    loopFeaturedEyebrow: string;
    featuredEyebrow: string;
    featuredTitle: string;
    featuredCtaAll: string;
    notesEyebrow: string;
    notesTitle: string;
    /* type/reel variants kept for completeness but not shipped in default build */
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
    /** Template with {projects} {projectsS} {disciplines} {disciplinesS} placeholders. */
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
    /** Markdown — supports **bold** and *accent* inline emphasis. */
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
    /** {name} placeholder replaced with SiteConfig.name. */
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
```

**Migration**: the prototype's `data.js` maps 1:1 to these types. Copy the
arrays, change `window.X =` to `export const X: Type`.

---

## 6. Components — spec per piece

### 6.1 `<NavRail>` — locked variant

- 76px wide, fixed left, full height, `border-right: 1px solid var(--line)`
- Backdrop: `rgba(14, 17, 23, 0.6)` with `backdrop-filter: blur(12px)`
- Children:
  - Top: 26px accent-colored brand mark with `SiteConfig.initials`
  - Middle: vertical link stack, `writing-mode: vertical-rl; transform: rotate(180deg)`
  - Active link: 3px wide × 16px tall accent bar to the left of the label
  - Bottom: small meta text "NSA / FOLIO 26", vertical-rl
- Body needs `padding-left: 76px` when the rail is mounted — apply via
  `<body class="nav-rail-mode">` toggle in the root layout
- Nav entries: Index · Work · Notes · Studio · Contact

### 6.2 `<CustomCursor>`

- Two fixed-position divs at `z-index: 2147483647`, `pointer-events: none`,
  `mix-blend-mode: difference`
- Dot: 6px × 6px solid fg, follows pointer at `lerp 0.55`
- Ring: 36px × 36px 1px-border, follows at `lerp 0.18`
- On `mousemove` look up `closest('[data-cursor]')`; switch `data-state`:
  - `default` → 36px ring
  - `link` → 56px ring with subtle bg
  - `view` → 92px ring with **solid accent fill**, no blend-mode
- `data-cursor-label` attribute → renders an inline mono label centered on the ring
- Hide entirely on `pointer: coarse` and when `prefers-reduced-motion: reduce`
- Hide native cursor via `html, body, a, button, [role=button], .clickable { cursor: none }`. Form fields keep `cursor: text`.

### 6.3 `<Magnetic strength={0.35} radius={90}>`

- Wraps any element. On `mousemove` within wrapper bounds, computes pull
  vector `(dx, dy) * strength * falloff` where
  `falloff = max(0, 1 - dist / (radius * 2.4))`
- Inner span translates via RAF-driven lerp (`0.22`) — resets on `mouseleave`
- Apply to: nav links, filter chips, buttons, the big mailto, hero peek thumb

### 6.4 `<PageTransition>` — wipe

Used via Framer Motion `AnimatePresence` in `app/layout.tsx`:

- A fixed full-viewport `<div>` translates `Y: 100% → 0% → -100%` over 720ms with cubic-bezier `(.65,.05,.36,1)`
- A central 2% horizontal stripe in `--accent` rides along
- Page content fades + translates up `Y: 28px → 0` over 620ms on mount

### 6.5 `<HeroMarquee>` (Loop)

- Full-bleed marquee strip with `transform: translateX(0 → -50%)` over 38s linear
- Words: from `SiteConfig.marquee` (default 6 words), alternating with accent-coloured dot separators
- Every other word rendered as `color: transparent; -webkit-text-stroke: 4px var(--line-2)` for an outlined effect
- Below the strip: 60/40 split
  - **Left**: eyebrow `EditorialCopy.home.loopFeaturedEyebrow`, h2 = featured `project.pitch || project.brief`, brief paragraph, accent CTA button
  - **Right**: aspect-ratio 16/9 featured peek — uses `<VideoHero>` if `project.heroVideo` is set, otherwise `<Placeholder>`. Bottom-left tile-style caption with sub + title + year.

### 6.6 Work mosaic

- `display: grid; grid-template-columns: repeat(12, 1fr); grid-auto-rows: 90px; grid-auto-flow: dense; gap: 18px;`
- Span pattern cycles in **tessellating pairs** so each row closes flush:
  - pair 0: `s-1 (7×5) + s-2 (5×5)`
  - pair 1: `s-3 (4×4) + s-4 (8×4)`
  - pair 2: `s-5 (6×4) + s-6 (6×4)`
  - pair 3: `s-7 (4×4) + s-8 (8×4)`
- Odd final tile → assign `s-fill` (full width) so the bottom is flush
- Mobile (`max-width: 1080px`): collapse to 6-col grid with simplified spans
- Tile content: hero image OR procedural placeholder, top-left index, top-right discipline pills, bottom-left title + sub, bottom-right 36px circular arrow that fills accent on hover
- Filter chips above: count badge after each label, accent pill when selected, magnetic-wrapped

### 6.7 Case study layout (cinematic — locked)

Sections in order:

1. **`<CinematicHero>`** — 90vh full-bleed. Background = `<VideoHero project={p}>` when `p.heroVideo` set, else `<Placeholder>`. Top overlay: back link + index counter `04/08`. Bottom overlay: eyebrow, h1 title, 4-cell metadata grid (Client / Year / Role / Discipline).
2. **`<BriefBlock>`** — 60/40 split, divider lines top & bottom. Left: large 32px brief sentence with "The brief" eyebrow. Right: "Snapshot" eyebrow + body paragraph + 2×2 meta grid (Output / Tools / Duration / Status), all from project fields.
3. **`<ProcessGallery>`** — section with its own header. 3-column grid of 4:5 portrait tiles, each with bottom caption `fig. 01 — Label / Note`.
4. **`<Writeup>`** — **inside the same `<section>` as the gallery**, immediately below the 3-up. 1/3 left rail ("Notes on the build" eyebrow) + 2/3 prose column. Render with the `<Markdown>` component (paragraphs joined with `\n\n`).
5. **`<NextPrev>`** — two equal-width 16:9 panels showing prev/next project placeholders with overlays.

### 6.8 Notes index `/notes`

- Editorial list, not a grid. One row per note: 60px index / date+pin column / title+summary / kind pill / arrow.
- Sort order: pinned first, then `NOTES` array order. There is **no** auto-recency sort — the author controls order via the pin + array position. This gives full editorial control.
- Hover: row padding-left + soft accent-tinted gradient sweep, title turns accent.

### 6.9 Note article `/notes/[slug]`

- 760px content column, centered.
- Meta row: `date` · `kind` pill (accent-bordered) · auto reading time (`Math.max(1, words/200)`)
- H1 (`note-h1`) — bigger than `.t-h1` but balanced (`text-wrap: balance`)
- Deck paragraph from `note.summary`
- Cover image (16:9) or procedural placeholder
- Body: render `note.body` via `<Markdown>` (see §6.11)
- Prev/next strip at bottom, wraps around the list (pinned-first order)
- `generateStaticParams` from `NOTES`

### 6.10 `<VideoHero>` — YouTube / Vimeo / file embed

Drop-in replacement for `<Placeholder>` on hero surfaces.

```ts
type Props = {
  project: Project;
  showLabel?: boolean;
  labelText?: string;
  phOverride?: ProceduralKey;
};
```

Behaviour:

1. Parse `project.heroVideo` via `lib/video.ts`:
   - `youtube.com/watch?v=ID`, `youtu.be/ID`, `youtube.com/embed/ID`, `shorts/ID` → `https://www.youtube.com/embed/ID?autoplay=1&rel=0&modestbranding=1`
   - `vimeo.com/ID`, `player.vimeo.com/video/ID` → `https://player.vimeo.com/video/ID?autoplay=1&title=0&byline=0&portrait=0`
   - `*.mp4`, `*.webm`, `*.mov`, `*.ogv` → use HTML5 `<video>` directly
   - Anything else → component falls back to `<Placeholder>`, no play button
2. Three states:
   - **Poster** (default): renders `<Placeholder project={p}>` (hero image OR procedural), plus a centered 88px accent play button and a top-right platform badge (`YouTube` / `Vimeo`).
   - **Playing**: replaces the poster with an iframe (or `<video>`) sized to fill. Top-right ✕ button to dismiss.
   - **Failed**: if the iframe fires `onerror`, snap back to poster with a `⚠ Video unavailable` toast + a `Try again` button.
3. The iframe receives `allow="autoplay; fullscreen; picture-in-picture"; allowFullScreen; referrerPolicy="strict-origin-when-cross-origin"`.
4. Click on the poster anywhere → play. Click on play button → play.

Used at: case study `<CinematicHero>`, home `<HeroMarquee>` featured peek.

### 6.11 `<Markdown>` renderer

A small zero-dependency renderer. Supports the subset needed for notes,
project writeups, and bio paragraphs.

**Block-level:**
- `# / ## / ### / ####` — headings, four levels
- `- item` or `* item` — bullet list
- `1. item` — numbered list
- `> line` — blockquote (block-level, wraps consecutive `> ` lines)
- ` ``` ` fenced code blocks (optional language hint after the fence)
- `---`, `***`, `___` — horizontal rule
- Blank line = paragraph break

**Inline (parsed in this order):**
- `` `code` ``
- `**bold**`
- `*italic*` — rendered in accent colour (intentional — used for emphasis)
- `[text](url)` — internal `/...` paths route via the SPA's `go(url)`,
  external `https?:` opens in a new tab with `rel="noopener noreferrer"`

Implementation: ~120 lines, see prototype `markdown.jsx` for the full
parser. Port directly; no external library.

### 6.12 `<Placeholder>` primitive

```ts
type Props = {
  project: Project;
  media?: MediaSlot;      // defaults to project.hero
  showLabel?: boolean;    // dashed mono "what goes here" hint
  labelText?: string;
  phOverride?: ProceduralKey;
};
```

- If `media.src` is non-empty → `<Image>` from `next/image` with `fill`,
  `object-fit: cover`, `sizes` tuned per usage
- Else → div with `ph` + `ph-<discipline>` class, optional floating shape
  overlays, optional dashed label
- Procedural classes: see prototype `styles.css` — six gradient treatments,
  one per discipline (motion / 3d / illo / video / ai / code)

---

## 7. Animations (Framer Motion + RAF)

| Effect                    | Implementation                                    |
|---------------------------|---------------------------------------------------|
| Page transition wipe      | `<AnimatePresence>` in layout, transition variant |
| Page mount fade-up        | `motion.div initial={{opacity:0, y:28}}…`         |
| Cursor follow             | Pure RAF, no library                              |
| Magnetic                  | Pure RAF, no library                              |
| Marquee                   | CSS animation, paused via `animation-play-state`  |
| Tile arrow on hover       | CSS transition (transform, background)            |
| Tile image zoom on hover  | CSS transition on `.placeholder { transform }`    |
| Video poster → play       | React state, no animation; iframe loads natively  |

**Respect `prefers-reduced-motion: reduce`**: disable cursor follow, magnetic
displacement, page wipe (replace with cross-fade), marquee freeze, and the
hero image zoom transitions.

---

## 8. Image & video strategy

### Images

- Source images live in `public/assets/work/<slug>/` and `public/assets/notes/<slug>/`
- Use `next/image` everywhere — automatic AVIF/WebP, responsive `srcset`
- `sizes` per usage:
  - Hero (case study): `"100vw"`
  - Mosaic tile: `"(max-width: 1080px) 100vw, 50vw"`
  - Process gallery: `"(max-width: 880px) 100vw, 33vw"`
  - Note cover: `"(max-width: 880px) 100vw, 760px"`
- Provide a `LQIP` blur placeholder via `placeholder="blur"` on imported images
- Recommended source sizes:
  - Hero: 2400×1500 (16:10), JPG @ Q80 or WebP, ≤ 600 KB
  - Process: 1600×2000 (4:5), JPG @ Q80 or WebP, ≤ 400 KB
  - Note cover: 1600×900 (16:9), JPG @ Q75 or WebP, ≤ 400 KB
  - Thumb (optional): 1200×750, JPG @ Q75 or WebP, ≤ 200 KB

### Video

- `project.heroVideo` is a URL string. No file uploads — embed-only.
- Use the hero image as the poster (set both `hero.src` and `heroVideo`).
- Iframe-blocked or removed videos: `<VideoHero>` shows a toast + retry; the
  poster always remains the visible fallback.
- For YouTube, prefer unlisted videos with embedding allowed.
- For Vimeo, prefer Pro/Business accounts so domain-locked embeds work on
  the production domain (set Vimeo privacy → "Hide from Vimeo, only embeds").

---

## 9. Typography loading

- **Helvetica Neue / Helvetica / Arial** — system stack, no webfont required
- **IBM Plex Mono** — self-host weights 400 + 500 in `public/fonts/`, declare
  with `font-display: swap`. Use `next/font/local` if convenient.

---

## 10. Accessibility

- All interactive elements receive a visible focus ring (1px solid accent,
  2px offset). Hide on `:focus:not(:focus-visible)`.
- Keyboard: nav rail links, filter chips, tile cards, prev/next, video
  play/close buttons all reachable via `Tab`; pressing `Enter` activates.
- `aria-current="page"` on the active nav rail link.
- Alt text on every `<Image>` — read from `MediaSlot.alt`. Required field
  in the content type.
- `<VideoHero>` play button has `aria-label="Play video"`. The iframe has a
  meaningful `title` (project title).
- `prefers-reduced-motion`: see §7.
- Custom cursor hidden on touch + reduced-motion; native cursor restored.
- Color contrast: foreground `#EDE5D8` on `#0E1117` = 14.2:1 (AAA). Accent
  text on bg = 5.8:1 (AA). Body-2 on bg = 11.1:1 (AAA).

---

## 11. Performance budgets

- **LCP** ≤ 2.0s on a fast 4G connection (hero image / video poster is the LCP element)
- **CLS** ≤ 0.05 — reserve aspect-ratio boxes for every image and the video hero
- **JS** ≤ 90 KB gzipped on home (Next.js base + Framer Motion + app code)
- Marquee animates `transform` only — no layout thrash
- Cursor + magnetic use RAF + `will-change: transform`
- Don't preload the video iframe — only load on click. The poster image is
  the only network request on initial paint.

---

## 12. SEO

- Per-page `<title>` and `<meta description>` driven by content
- Open Graph: per-project / per-note images via `next/og`, sized 1200×630, dark theme
- `application/ld+json` for `Person` (about page) and `CreativeWork` (each project)
- `sitemap.xml` includes every project + note + static page

---

## 13. Build & deploy

```bash
pnpm install
pnpm dev
pnpm build          # static-export safe
pnpm lint
pnpm typecheck
```

### Vercel config

- No special config — Next.js auto-detected
- Set `redirects` from `/index` → `/` if needed
- Add Plausible/Fathom analytics (privacy-respecting; no GA)

---

## 14. Phasing (Claude Code task order)

Run in order. Each phase compiles and passes typecheck.

1. **Scaffold** — Next 15 + TS + ESLint + Prettier. Add globals.css with
   all tokens. Self-host IBM Plex Mono.
2. **Content layer** — port `data.js` arrays into `content/*.ts` with
   types from §5. Add `lib/content.ts` (`getProject`, `getNextProject`,
   `getFeatured`, `getNote`, `getSortedNotes`, `getYearRange`,
   `getDisciplineCount`) and `lib/copy.ts` (`copy(path, fallback)` with
   path-based EDITORIAL lookup).
3. **Chrome** — NavRail, root layout with `body.nav-rail-mode + body.caps`,
   footer, page transition shell.
4. **Cursor + Magnetic** — port from prototype `cursor.jsx` to typed
   hooks/components. Add reduced-motion guard.
5. **Primitives** — Placeholder, VideoHero, Markdown, ProceduralBg,
   Eyebrow, ArrowButton. Each gets a small Storybook-style demo page or
   visual regression test fixture.
6. **Home** — HeroMarquee, FeaturedStrip, NotesStrip. Wire featured project
   resolution + marquee word list.
7. **Work index** — Mosaic + Tile + FilterChips. Implement tessellating
   span cycling with `s-fill` for odd counts.
8. **Case study** — CinematicHero (with VideoHero), BriefBlock,
   ProcessGallery, Writeup (Markdown), NextPrev. Wire `generateStaticParams`.
9. **Notes** — NotesIndex (pinned-first sort), NoteArticle (Markdown body,
   reading-time calc, prev/next). Wire `generateStaticParams`.
10. **Studio + Contact** — Bio (Markdown paragraphs), SkillsGrid,
    ExperienceList, BigEmail, Socials, WorkingWithList.
11. **A11y + reduced-motion sweep** — keyboard focus, alt audit, motion
    guards, video controls.
12. **SEO + sitemap + OG images** — per-project / per-note metadata,
    generated OG images.
13. **Performance pass** — LCP audit, JS budget, image `sizes` audit.

---

## 15. Out of scope (parking lot)

- Light mode — explicitly not desired
- Tweaks panel — the prototype's runtime tweaks are not shipped; defaults
  from §2 are baked in
- Comments / reactions on notes
- Multi-language

---

## 16. Content editing in production (`/admin`)

The prototype ships a working **`/admin`** route that edits projects,
notes, and editorial copy in-browser via localStorage. **This is a
prototyping affordance, not a production CMS** — no auth, no multi-device
sync, ~5 MB localStorage cap (fine for copy + small thumbnails as data
URLs; not enough for a full image library).

For production, swap the localStorage layer for a real CMS. The content
shape stays identical, so admin edits exported as JSON or `data.js` import
cleanly. **Recommended options, in order of fit:**

### A. Keystatic (preferred for this project)

> https://keystatic.com

Git-based CMS for Next.js. Lives at `/keystatic` in the app, edits commit
to the repo as JSON/MDX, supports image uploads (committed to git or to a
storage adapter), renders inline previews.

```bash
pnpm add @keystatic/core @keystatic/next
```

Define the schema in `keystatic.config.ts` from the §5 types. Mount the
routes in `app/keystatic/[[...params]]/page.tsx` and
`app/api/keystatic/[...params]/route.ts`. **Estimated integration: 1 day.**
Auth via GitHub OAuth (Keystatic Cloud — free for personal use).

**Why preferred**: zero infra, content versioned in git alongside code,
admin UI is itself a Next.js route — no separate platform.

### B. Decap CMS (formerly Netlify CMS)

> https://decapcms.org

Also git-based, decoupled UI loaded from `/admin/index.html`. Lighter than
Keystatic but dated visual editor. Good if deploying to Netlify.

### C. Sanity

> https://www.sanity.io

Hosted, best schema editor, strong image pipeline, supports collaborative
editing. Use if you expect a writer or assistant later. Free tier covers
personal use.

### D. TinaCMS — visual editing on the live page

> https://tina.io

Inline-edit-on-page experience similar to the prototype's `/admin`, with
real auth and git commits. Higher integration cost than Keystatic but the
authoring UX is closest to the prototype.

### Migration path

1. Ship production with typed content modules (`content/*.ts`) — no CMS.
2. Once content is live and stable, layer in **Keystatic**. Schema maps
   1:1 onto the §5 types.
3. Markdown body for notes maps to Keystatic's `document` field. Project
   writeup paragraphs map to a `text` array.

**Do not ship the prototype's localStorage admin to production.** It's a
sketch — no auth, no persistence beyond a single browser, and data-URL
images inflate localStorage past the limit after ~3 hero uploads.

---

## 17. Open questions for the artist

- [ ] Confirm production domain
- [ ] Real social URLs to replace `#` placeholders (`SITE.socials`)
- [ ] Hero / process / cover images — delivery batch ready, or rolling?
- [ ] Vimeo account tier (matters for embed privacy / domain locking)
- [ ] Showreel master URL for the home Loop hero featured peek (if Vubiquity
      isn't the launch featured pick)
- [ ] Custom-domain email or keep `gmail.com` in public copy?
- [ ] Any client logos for a footer "trusted by" row?
- [ ] Notes — which existing essays / process notes are publish-ready vs.
      placeholders to remove before launch?

---

**End of spec.** Treat the HTML prototype's `index.html` (Loop / Rail /
Orange defaults, caps on, `/notes` route live) as the design-fidelity
target. Anything visual not specified here should match the prototype.

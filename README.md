# Portfolio '26 — N. St-Amour

A production portfolio site for a motion artist & AI workflow engineer.

- **Stack**: Next.js 15 (App Router) · TypeScript strict · CSS Modules · Framer Motion
- **CMS**: Keystatic with GitHub OAuth storage (edits become commits → auto-deploys)
- **Hosting**: Vercel (recommended)
- **Performance budget**: < 90 kB gzipped JS, LCP < 2.0s, CLS < 0.05

Live site: _set `NEXT_PUBLIC_SITE_URL` after deploy._

---

## Quick start

```bash
pnpm install
pnpm dev        # http://localhost:3000  (+ Keystatic admin at /keystatic)
```

`pnpm dev` runs Next.js side-by-side with a `chokidar` watcher that
regenerates the content bundles (`data/_generated/*.json`) whenever you
edit a `data/**/*.{json,mdoc}` file — directly or through the admin UI.

Common scripts:

| Command            | What it does                                                          |
| ------------------ | --------------------------------------------------------------------- |
| `pnpm dev`         | Watcher + dev server                                                  |
| `pnpm build`       | Codegen + production build                                            |
| `pnpm start`       | Serve the production build locally                                    |
| `pnpm content`     | Regenerate the content bundles once (after a manual edit, for ex.)    |
| `pnpm typecheck`   | `tsc --noEmit`                                                        |
| `pnpm lint`        | `next lint`                                                           |
| `pnpm format`      | Prettier write                                                        |

---

## Editing content

Two equivalent paths:

### 1. Through the admin UI (recommended)

Open `http://localhost:3000/keystatic` in dev, or
`https://your-domain.com/keystatic` in production.

The admin is organised as:

- **Content** — Projects, Notes (markdoc body + structured frontmatter)
- **Site copy** — Site config, Editorial copy, Experience, Skills

Save your changes; in dev they hit disk immediately, in production they
become commits on the live repo.

### 2. By hand

Each project is a folder under `data/projects/<slug>/`. Each note is a
folder under `data/notes/<slug>/`. The `index.mdoc` inside has YAML
frontmatter followed by a markdown body. Singletons (`site.json`,
`editorial.json`, etc.) sit directly under `data/`.

After a hand-edit, the dev watcher picks it up automatically. For
one-off rebuilds, run `pnpm content`.

---

## Hosting — why Vercel

This codebase is portable to any Node 20+ host, but Vercel is the path
of least resistance because:

- **Zero-config deploys** for Next.js App Router (middleware, route
  handlers, image optimisation, edge cache headers all work out of
  the box).
- **GitHub commit → deploy** dovetails with Keystatic's GitHub storage:
  an editor saves in `/keystatic`, the change lands as a commit, and
  the next deploy runs the `prebuild` codegen → new content live in
  ~60 seconds.
- **Per-environment env vars + preview URLs** make rotating the admin
  secrets safe (set them on Production, redeploy, then strip them off
  Preview).
- **Edge middleware** runs `middleware.ts` at every edge node so the
  admin gate's IP allowlist and rate limit don't add origin latency.

Alternatives that work but cost more setup:

- **Netlify** — needs a custom build command for the codegen and the
  middleware ships as an Edge Function. Works.
- **Cloudflare Pages + Functions** — supported via the
  `@cloudflare/next-on-pages` adapter; the `nodejs` runtime on the OG
  image routes needs reconfiguration.
- **Self-hosted Node** (Railway, Fly, your own VPS) — drop the
  `next start` process behind nginx and you're done; no Edge middleware
  speedup.

### Deploying to Vercel

1. Push the repo to GitHub (see below).
2. In Vercel, **New Project → Import from GitHub** and pick the repo.
3. Framework preset: Next.js. Build command: `pnpm build` (default).
4. Set the environment variables listed in [`.env.example`](./.env.example).
   At minimum:

   - `NEXT_PUBLIC_SITE_URL` — your production URL, no trailing slash.

5. For the admin, follow the [admin security playbook](./ADMIN_SECURITY.md).

---

## Admin security — short version

The admin is at `/keystatic` and is gated by three layers:

1. **GitHub OAuth** through Keystatic's GitHub-app integration. Only
   the GitHub users you authorise on the app can log in.
2. **Vercel Edge middleware** (`middleware.ts`) applies:
   - Hardened CSP, HSTS, X-Frame-Options, Referrer-Policy.
   - Per-IP rate limit on `/keystatic` and `/api/keystatic`.
   - Optional IP allowlist via `ADMIN_ALLOWED_IPS`.
   - Kill switch via `ADMIN_ENABLED=false` (404s without redeploying).
3. **No-cache headers** on every admin response so a stale auth cookie
   can't leak through a CDN.

The full playbook — including how to upgrade to a nonce-based CSP,
rotate credentials, and respond to suspected compromise — lives in
[`ADMIN_SECURITY.md`](./ADMIN_SECURITY.md).

---

## Project structure

```
app/                    # Next.js App Router pages + route handlers
  layout.tsx            # Root layout — fonts, cursor, nav, transitions
  page.tsx              # /
  work/                 # /work + /work/[slug]
  notes/                # /notes + /notes/[slug]
  studio/               # /studio
  contact/              # /contact
  keystatic/            # /keystatic admin UI mount
  api/keystatic/        # Keystatic API routes
  opengraph-image.tsx   # Branded OG card for /
  sitemap.ts            # /sitemap.xml
  robots.ts             # /robots.txt
components/
  chrome/               # NavRail, Footer, PageTransition, Cursor, Magnetic
  primitives/           # ArrowButton, Eyebrow, Placeholder, VideoHero, Markdown
  home/                 # HeroMarquee, FeaturedStrip, NotesStrip
  work/                 # FilterChips, Mosaic, Tile, span-cycle
  case/                 # CinematicHero, BriefBlock, ProcessGallery, Writeup, NextPrev
  notes/                # NotesIndex, NoteArticle
  studio/               # Bio, SkillsGrid, ExperienceList
  contact/              # BigEmail, ContactLinks, WorkingWithList
content/                # Typed accessors: SITE, EDITORIAL, PROJECTS, NOTES, …
lib/                    # content, copy, video, contrast, hooks
data/                   # Editable content (Keystatic source of truth)
  site.json
  editorial.json
  experience.json
  skills.json
  projects/<slug>/index.mdoc
  notes/<slug>/index.mdoc
  _generated/           # Codegen output — gitignored, regenerated on build
scripts/
  generate-content.mjs  # Reads /data, writes data/_generated/*.json
middleware.ts           # Security headers + admin gate
keystatic.config.ts     # CMS schema mirroring content/types.ts
public/                 # Static assets — fonts handled via @fontsource
prototype/              # Original prototype, kept as reference
```

---

## Adding new content

### A new project

1. In `/keystatic` → Content → Projects → **+ Add Project**.
2. Fill the fields (title, slug, year, client, role, disciplines,
   primary discipline, brief, summary, writeup, process steps, etc.).
3. Save. The mosaic at `/work` and the case study at `/work/<slug>`
   appear automatically.

By hand: create `data/projects/<slug>/index.mdoc` modelled on the
existing entries.

### A new note

1. `/keystatic` → Content → Notes → **+ Add Note**.
2. Title, slug, date, kind, summary, body. Flip "Pinned" if it should
   surface on the home page.
3. Save.

By hand: `data/notes/<slug>/index.mdoc`.

### Editorial copy / headlines / labels

`/keystatic` → Site copy → Editorial. Every label, eyebrow, headline,
template string, and footer line is editable here without a code
change. The schema groups them by route (`home`, `work`, `caseStudy`,
`about`, `contact`, `footer`).

---

## Performance + accessibility checklist

This codebase is built against SPEC §11 and §12. Before shipping a new
feature, verify:

- First-load JS for the affected route stays under ~120 kB (run
  `pnpm build` and read the route table).
- LCP element on every page is an image or styled text — never a font
  swap. IBM Plex Mono is self-hosted via `@fontsource`.
- All interactive elements have visible focus rings (3px solid
  `var(--accent)`).
- Animated effects (custom cursor, magnetic hover, page transition)
  all respect `prefers-reduced-motion: reduce`.
- Images use `next/image` with explicit `sizes` for any responsive
  surface.

---

## License

All rights reserved — © N. St-Amour. The code is published openly so
employers and collaborators can read it; please ask before reusing.

# Portfolio ’26 — N. St-Amour

**nstamour.xyz** — Motion artist & AI workflow engineer. Built in ~2 days.

-----

## Summary

I didn't spend weeks architecting this. I had a clear picture of what I wanted the
site to feel like, a tight deadline I set for myself, and access to Claude Design and
Claude Code. The result is a production-grade portfolio that I’m genuinely proud of,
shipped faster than any personal project I’ve built before.

The goal was never “what stack should I use.” It was: does this site feel like me?
Dark. Precise. Comfortable at the intersection of motion, code, and systems thinking.
Every decision either served that or got cut.

-----

## How it was built

I used **Claude Design** to work through the visual language: layout, motion behaviour,
typographic hierarchy, the overall feel of the thing. Having a fast feedback loop for
design decisions meant I could converge on the right aesthetic quickly instead of
second-guessing myself across too many iterations.

**Claude Code** handled the implementation side: scaffolding the Next.js 15 App Router
structure, wiring up the Keystatic CMS, the edge middleware, the content codegen pipeline,
and the performance-sensitive parts of the build. I stayed close to every decision, but
the velocity was genuinely different from building solo.

The two-day timeline was possible because I was not fighting the tools. I was directing them.

-----

## Stack

- **Next.js 15 (App Router)** + TypeScript strict
- **CSS Modules** — co-located, scoped, no purge complexity
- **Framer Motion** — used narrowly: transitions, cursor, magnetic hover
- **Keystatic** — CMS backed by Git. Edits become commits. No database.
- **Google Fonts** — flexibility over the marginal gain of self-hosting
- **Vercel** — zero-config deploys, edge middleware, commit-to-live in ~60 seconds

Performance budget: under 90 kB gzipped JS, LCP under 2.0s, CLS under 0.05.

-----

## On personality

The colophon reads “Hand-built, no CMS” for a reason. The site does not feel generated.
It feels considered. The disciplines listed in the marquee (Motion, 3D, Illustration,
AI Workflows, Code, Automation, Design, CGI, Game Development) are not a flex; they are
a genuine description of how I work. The site needed to hold all of that without feeling
scattered.

Dark background. IBM Plex Mono for code surfaces. Helvetica Neue for everything else.
A cursor that responds. Page transitions that do not overstay their welcome. The motion
is intentional, not decorative.

-----

## Content architecture

Content lives in `data/` as Markdown with YAML frontmatter (`.mdoc`) and JSON singletons.
A codegen script (`scripts/generate-content.mjs`) writes `data/_generated/*.json` at
build time. The app imports through typed accessors in `content/`, so content shape
changes are caught at compile time, not at runtime.

The CMS schema (`keystatic.config.ts`) and the TypeScript types (`content/types.ts`) are
the single contract between editing and rendering. Change a field in one and the compiler
tells you everywhere else that needs updating.

-----

## Security

The admin at `/keystatic` is behind GitHub OAuth, hardened edge middleware (CSP, HSTS,
per-IP rate limiting, optional IP allowlist), and no-cache headers on every admin
response. It is treated as a production internal tool, not a low-stakes personal page.

-----

## Structure

```
app/                    Next.js App Router (pages, route handlers, OG image, sitemap)
components/
  chrome/               NavRail, Footer, PageTransition, Cursor, Magnetic
  primitives/           ArrowButton, Eyebrow, VideoHero, Markdown
  home/                 HeroMarquee, FeaturedStrip, NotesStrip
  work/                 FilterChips, Mosaic, Tile
  case/                 CinematicHero, BriefBlock, ProcessGallery, Writeup, NextPrev
  notes/                NotesIndex, NoteArticle
  studio/               Bio, SkillsGrid, ExperienceList
  contact/              BigEmail, ContactLinks
content/                Typed accessors over generated JSON
lib/                    Utility modules: content, copy, video, contrast, hooks
data/                   Editable source: projects, notes, singletons, _generated/
scripts/                generate-content.mjs
middleware.ts           Security headers + admin gate
keystatic.config.ts     CMS schema
```

-----

## License

All rights reserved. The code is published openly so employers and collaborators can
read it. Please ask before reusing any part of it.
# Content guide — adding & updating work

This portfolio is **template-driven**: every project, note, social link, and
biography line lives in `data.js`. You never edit page components to add
work — you append to arrays, save, and the site re-renders.

You have two ways to edit:

1. **The in-browser admin** at `/admin` — recommended for everyday work.
2. **Editing `data.js` directly** — useful for bulk changes or when shipping
   to production. Both paths read and write the same data shape.

---

## The `/admin` panel

Open `#/admin` in the live site. Four tabs along the toolbar:

| Tab | What lives there |
|---|---|
| **Projects** | Add / remove / reorder projects, edit copy, drop in images and hero videos, toggle the ★ Featured project. |
| **Notes** | Add / remove / reorder articles. Full markdown body editor with toolbar + live preview. Pin notes to top of the index. |
| **Pages** | Headlines, eyebrows, lists, and structured content for every page (Home, Work, Case study, Studio, Contact, Footer). One section per page. |
| **Identity** | Brand: name, tagline, email, location, social links. Cross-cutting site fields. |

Toolbar actions:

- **Save & apply** — writes changes to your browser's localStorage so they
  persist across page reloads. The live site reflects them immediately.
- **Export JSON** — downloads a complete snapshot of all your content as
  `portfolio-content.json`. Use this as a backup or to move edits between
  browsers.
- **Export data.js** — downloads a ready-to-drop-in `data.js` file. Replace
  the file in the production repo and redeploy.
- **Import JSON** — load a previously-exported snapshot.
- **Reset** — restore the file defaults, discarding local edits.

---

## Adding a new project

### Via the admin (recommended)

1. `/admin` → **Projects** → **+ Add** in the sidebar.
2. The new project lands at the end of the list, selected and ready to edit.
3. Fill in the form. Drop images into the dropzones. Save.

### Via `data.js`

1. Open `data.js` and scroll to the `window.PROJECTS` array.
2. Copy the `PROJECT_TEMPLATE` block from the top of the file (commented out).
3. Paste into `PROJECTS` and fill in.

### Required fields

```js
id, title, sub, year, client, role,
disciplines, primary,
brief, summary, writeup,
process   // array — at least one { label, note }
```

### Optional fields

```js
hero            // { src, alt } — image
heroVideo       // YouTube / Vimeo / direct .mp4 URL string
thumb           // { src, alt } — index thumbnail; falls back to hero
pitch           // one-line headline for the home Loop hero when featured
tools, duration, status, output    // metadata panel
featured        // bool — single-select; toggling clears any other featured
ph, span        // visual overrides — see "Disciplines" / "Mosaic" below
```

---

## Hero videos (YouTube / Vimeo / direct file)

Drop a URL into the project's `heroVideo` field (or paste it in the admin's
Hero video input). The case study page and home Loop hero peek will show the
hero image as a poster with a big play button, and play the video inline on
click.

Recognised URL forms:

| Platform | Examples |
|---|---|
| YouTube | `youtube.com/watch?v=ID`, `youtu.be/ID`, `youtube.com/embed/ID`, `youtube.com/shorts/ID` |
| Vimeo   | `vimeo.com/ID`, `player.vimeo.com/video/ID` |
| File    | Any URL ending in `.mp4`, `.webm`, `.mov`, `.ogv` |

In the admin, the URL field shows a live status:
- **✓ Detected · VIMEO · id: 824804225** — embed will work
- **⚠ Unrecognised URL** — won't embed; check the format

If the iframe fails at runtime (private video, removed, CSP block) the hero
falls back to the poster image with a "⚠ Video unavailable" toast and a
"Try again" button.

The hero image still acts as the **poster** — it shows before play and as the
fallback. Set both for the best experience.

---

## Adding images

1. Drop image files into `assets/work/<project-id>/` (create the folder).
   Recommended sizes:
   - **hero**: 2400×1500px (16:10), JPG or WebP, ≤ 600 KB
   - **process**: 1600×2000px (4:5 portrait), JPG or WebP, ≤ 400 KB each
   - **note cover**: 1600×900px (16:9), JPG or WebP, ≤ 400 KB
2. Reference it in `data.js`:

```js
hero:  { src: "assets/work/my-project/hero.jpg",
         alt: "Final hero shot — caption for accessibility" },
process: [
  { src: "assets/work/my-project/process-01.jpg",
    label: "Block-out pass",
    note: "Greybox lighting test" },
],
```

Or in the admin, drop the image into the dropzone — it stores as a base64
data URL for prototyping. For production, switch to repo-relative paths and
re-export `data.js`.

If `src` is empty (`""`), a procedural placeholder shows in its place — so
you can wire up copy first and add images later without breaking the page.

---

## Adding a note / article

Notes (essays, process journals, tooling logs) are full articles with a
markdown body, slug-based URLs, and a `/notes` index.

### Via admin

1. `/admin` → **Notes** → **+ Add**.
2. Fill in title, slug (auto-generated from title), date, kind, summary, and
   cover image.
3. Write the body in the markdown editor. Use the toolbar or keyboard
   shortcuts (Cmd/Ctrl+B/I/K). Click **Preview** to see it rendered.
4. Toggle **★ Pin** to keep the note at the top of `/notes` and the homepage
   strip.

### Schema

```js
{
  id:       "calm-ai-interfaces",      // slug for /notes/<id>
  date:     "May 2026",                // freeform string
  title:    "Notes on calm AI interfaces",
  kind:     "Essay",                   // "Essay" / "Process" / "Tools" / "Note"
  summary:  "One-sentence preview.",
  cover:    { src: "...", alt: "..." },// optional
  pinned:   true,                      // optional — pins to top of index
  body:     `# Markdown content here`,
}
```

### Markdown supported

| Syntax | Renders as |
|---|---|
| `# ## ### ####` | Headings, four levels |
| `**bold**` | Bold (fg color) |
| `*italic*` | Italic (renders in accent color — used for emphasis) |
| `` `code` `` | Inline code pill |
| `[link text](url)` | Hyperlink. Internal `/work/...` paths route via SPA; external opens in new tab. |
| `- item` / `* item` | Bullet list |
| `1. item` | Numbered list |
| `> quote` | Blockquote |
| ` ```fence``` ` | Code block |
| `---` | Horizontal rule |

Paragraphs are separated by a blank line.

---

## Featuring a project on the home page

**Featured is single-select** — only one project can be ★ Featured at a
time. The home Loop hero pulls its title, image/video, and headline from
that project; the "Selected work" strip puts it first.

- **Headline**: comes from the project's `pitch` field (a punchy one-liner).
  Falls back to the project's `brief` if `pitch` is blank.
- **Image / video**: comes from the project's `hero` and `heroVideo`.
- **Toggle in admin**: the ★ Feature button next to the project title.
  Toggling on automatically clears the previous featured project.

If no project is marked featured, the site falls back to the first project
in the array, so the home page never empties.

---

## Reordering work

Reorder entries in `window.PROJECTS` — or use the ↑ / ↓ buttons in the
admin sidebar. The mosaic span pattern (`s-1` … `s-8`) cycles by position,
so a different order = a different layout.

To pin a specific span to a specific project (e.g. always render the showreel
as a big landscape tile), add `span: "s-1"` to that project.

---

## Counts & relationships update themselves

You never update a counter by hand. The site derives everything from data:

- Home Loop hero — featured project comes from `featured: true`
- Home Loop hero H2 — featured project's `pitch` (or `brief`)
- "Selected work · N" strip — projects after featured
- Home Notes strip — top 3 from `/notes`, pinned first
- Work page header — count and discipline count derived live
- Filter chip badges — counts per discipline derived live
- Case study `04 / 08` — current index of total
- Next/Previous case study — wraps around the whole array
- Year range on the work page eyebrow — derived from `year` fields
- Notes index "X / N" + prev/next — same pattern

---

## Disciplines & filters

Add a discipline to `window.DISCIPLINES` and tag projects with its `id`:

```js
window.DISCIPLINES = [
  { id: "all",            label: "Everything" },
  { id: "motion",         label: "Motion" },
  { id: "new-discipline", label: "New thing" },
];
```

Filter counts on the work page populate automatically. The first discipline
in a project's `disciplines` array (or its `primary` field) drives the
procedural placeholder colour treatment.

---

## Site-wide copy (name, tagline, email, socials)

All in `window.SITE` at the top of `data.js`, or `/admin` → **Identity**.

```js
window.SITE = {
  name:      "N. St-Amour",
  short:     "NSA",
  initials:  "N",
  tagline:   "Motion artist & AI workflow engineer",
  manifesto: "...",
  location:  "Montréal — remote",
  email:     "you@example.com",
  socials:   [{ label, handle, href }, ...],
  marquee:   ["Motion", "3D", "..."],
};
```

The `socials` array drives both the Contact page link list and the footer.
Set `href: "#"` to render as a non-linking placeholder.

The `marquee` array is the scrolling word strip across the top of the home
page. Every other word renders as a thick outline.

---

## Page-level editorial copy

All hardcoded strings that aren't tied to a specific project or note live in
`window.EDITORIAL`. The structure mirrors the site:

```js
window.EDITORIAL = {
  home:      { loopFeaturedEyebrow, featuredEyebrow, featuredTitle, ... },
  work:      { eyebrowPrefix, headlineTemplate, lede },
  caseStudy: { briefLabel, snapshotLabel, processEyebrow, ... },
  about:     { eyebrow, headline, aboutParagraphs, ... },
  contact:   { headline, subtitle, workingWith, ... },
  footer:    { ctaHeadline, colophon, rightsTemplate, ... },
};
```

Pages read these via `window.copy("path.to.field", "fallback")` — so if you
delete a field, the hardcoded fallback in the component shows instead. The
site never blanks.

Edit these in `/admin` → **Pages**, with a sub-nav across the top to jump
between pages.

---

## Skills & experience

Two small arrays at the bottom of `data.js` — `SKILLS` (Studio page grid)
and `EXPERIENCE` (Studio page timeline). Edit in `/admin` → **Pages** →
**Studio**.

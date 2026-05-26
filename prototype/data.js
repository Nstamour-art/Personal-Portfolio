// ────────────────────────────────────────────────────────────────────────────
// data.js — the single source of content for the portfolio
//
// To add a new project, copy a PROJECT_TEMPLATE block (see CONTENT.md) and
// drop it into the PROJECTS array. The site reads everything from here.
//
// Every project follows the same shape. Any field marked OPTIONAL can be
// omitted — the UI degrades gracefully (procedural placeholder, no caption,
// etc).  Field reference:
//
//   id              REQUIRED  URL slug. lowercase, no spaces. e.g. "vubiquity"
//   title           REQUIRED  Display title.
//   sub             REQUIRED  Discipline-style subtitle (1 line).
//   year            REQUIRED  String — "2023" or "2022—2023".
//   client          REQUIRED  Client / studio / "Self-initiated".
//   role            REQUIRED  Comma-separated roles. Shown in hero metadata.
//   disciplines     REQUIRED  Array of ids from DISCIPLINES below.
//   primary         REQUIRED  Single id from DISCIPLINES — drives placeholder palette.
//
//   brief           REQUIRED  1–2 sentences — sits beside the hero.
//   summary         REQUIRED  One short paragraph — "snapshot" on case page.
//   writeup         REQUIRED  Array of paragraph strings — beneath process gallery.
//
//   hero            OPTIONAL  { src, alt }  — main image / poster frame.
//   heroVideo       OPTIONAL  String — YouTube / Vimeo URL (or direct .mp4).
//                             When set, the case study hero + featured peek
//                             render a click-to-play video with the hero
//                             image as the poster. Supported URL forms:
//                               https://youtu.be/ID
//                               https://www.youtube.com/watch?v=ID
//                               https://vimeo.com/ID
//                               https://example.com/clip.mp4
//   thumb           OPTIONAL  { src, alt }  — index tile thumbnail (defaults to hero).
//   process         REQUIRED  Array of { src?, label, note } — gallery items.
//                             If src is omitted, a procedural placeholder is shown.
//
//   tools           OPTIONAL  Short string — "AE · C4D · Octane"
//   duration        OPTIONAL  Short string — "8 weeks active"
//   status          OPTIONAL  Short string — "Shipped" / "Ongoing"
//   output          OPTIONAL  Short string — "Broadcast, social, product"
//
//   featured        OPTIONAL  bool — surfaces on the home Loop hero and the
//                             featured strip. If no project is marked
//                             featured, the site falls back to the first
//                             few projects in array order.
//
//   pitch           OPTIONAL  Short marketing one-liner (8-14 words) used as
//                             the big H2 on the home Loop hero when this
//                             project is the active featured one. Falls back
//                             to the brief if not set.
//
//   ph              OPTIONAL  Override the procedural placeholder class.
//                             ph-motion | ph-3d | ph-illo | ph-video | ph-ai | ph-code
//   span            OPTIONAL  Override mosaic span. s-1 … s-8 (see styles.css).
// ────────────────────────────────────────────────────────────────────────────

window.SITE = {
  name: "N. St-Amour",
  short: "NSA",
  initials: "N",
  tagline: "Motion artist & AI workflow engineer",
  manifesto: "Designing in motion. Building with systems. Telling stories with frames, code, and process.",
  location: "Montréal — remote",
  email: "nstamour.work@gmail.com",

  // Social links — leave href empty ("#") to render as placeholder
  socials: [
    { label: "Instagram", handle: "@nstamour.work",       href: "#" },
    { label: "Vimeo",     handle: "vimeo.com/nstamour",   href: "#" },
    { label: "LinkedIn",  handle: "linkedin.com/in/nstamour", href: "#" },
    { label: "Read.cv",   handle: "read.cv/nstamour",     href: "#" },
  ],

  // Words that scroll across the home Loop hero. Alternates between filled
  // and outlined renderings — edit, reorder or add new ones in /admin.
  marquee: [
    "Motion",
    "3D",
    "Illustration",
    "AI Workflows",
    "Code",
    "Process",
  ],
};

// ── THEME — visual design tokens, editable in /admin → Theme ──────────────
// These mirror the CSS custom properties in styles.css. Changing them in the
// admin re-applies via the App's effect hook — same mechanism the Tweaks
// panel uses, but persisted as content. Removing this from the file would
// leave the static :root tokens in styles.css as the implicit defaults.
window.THEME = {
  // Accent — the one hot color used for state, hovers, headlines.
  accent: "#FF5B1F",

  // Surfaces (cool charcoal scale)
  bg:        "#0E1117",
  bg2:       "#14171D",
  surface:   "#181C24",
  line:      "#1F242E",
  line2:     "#2A303C",

  // Foreground (warm bone scale)
  fg:        "#EDE5D8",
  fg2:       "#C9C5BC",
  muted:     "#7A7F8A",
  muted2:    "#4F535E",

  // Type stack — sans for everything, mono for labels & numerics
  sans:      `"Helvetica Neue", "Helvetica", "Arial", system-ui, sans-serif`,
  mono:      `"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace`,

  // Display preferences
  capsHeadings: true,    // apply UPPERCASE to headlines via body.caps
  textureGrain: false,   // (reserved — adds subtle noise overlay if true)

  // Curated accent palettes for the picker
  accentPresets: [
    "#FF5B1F",  // hot orange (default)
    "#B388FF",  // lavender
    "#C8FF3F",  // acid green
    "#4F7CFF",  // electric blue
    "#F2F2F2",  // monochrome
    "#57E389",  // signal green
  ],

  // Curated font choices for the picker. Each = { label, sans, mono, googleImport }
  // googleImport is loaded into <head> when selected.
  fontPresets: [
    { label: "Swiss Modern (default)",
      sans: `"Helvetica Neue", "Helvetica", "Arial", system-ui, sans-serif`,
      mono: `"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace`,
      googleImport: "IBM+Plex+Mono:wght@400;500" },
    { label: "Sharp Grotesk",
      sans: `"Space Grotesk", "Helvetica Neue", system-ui, sans-serif`,
      mono: `"JetBrains Mono", ui-monospace, monospace`,
      googleImport: "Space+Grotesk:wght@400;500;600|JetBrains+Mono:wght@400;500" },
    { label: "Editorial Serif",
      sans: `"Spectral", Georgia, serif`,
      mono: `"IBM Plex Mono", ui-monospace, monospace`,
      googleImport: "Spectral:wght@400;500;600|IBM+Plex+Mono:wght@400;500" },
    { label: "System",
      sans: `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`,
      mono: `ui-monospace, "SF Mono", Menlo, monospace`,
      googleImport: "" },
  ],
};

window.NAV = [
  { id: "index",   label: "Index",   path: "/" },
  { id: "work",    label: "Work",    path: "/work" },
  { id: "notes",   label: "Notes",   path: "/notes" },
  { id: "about",   label: "Studio",  path: "/about" },
  { id: "contact", label: "Contact", path: "/contact" },
];

window.DISCIPLINES = [
  { id: "all",    label: "Everything" },
  { id: "motion", label: "Motion" },
  { id: "3d",     label: "3D / CG" },
  { id: "illo",   label: "Illustration" },
  { id: "video",  label: "Video" },
  { id: "ai",     label: "AI / Workflows" },
  { id: "code",   label: "Code" },
];

// ── PROJECT_TEMPLATE (copy this block, fill it in) ──────────────────────────
// {
//   id: "my-project-slug",
//   title: "My Project",
//   sub: "What kind of work this is",
//   year: "2026",
//   client: "Client name",
//   role: "Designer, animator, etc.",
//   disciplines: ["motion"],
//   primary: "motion",
//
//   brief: "One or two sentences placed next to the cinematic hero.",
//   summary: "A short snapshot paragraph that lives under the brief.",
//   writeup: [
//     "First paragraph of the long-form writeup.",
//     "Second paragraph — keep paragraphs human-scale, ~3–5 sentences each.",
//     "Third paragraph if needed.",
//   ],
//
//   hero:  { src: "assets/work/my-project/hero.jpg", alt: "Final hero render" },
//   thumb: { src: "assets/work/my-project/thumb.jpg", alt: "Index thumbnail" },
//
//   process: [
//     { src: "assets/work/my-project/process-01.jpg",
//       label: "Initial sketches", note: "Pencil + index cards" },
//     { src: "assets/work/my-project/process-02.jpg",
//       label: "Blocking pass",    note: "Greybox lighting test" },
//     { src: "assets/work/my-project/process-03.jpg",
//       label: "Final pass",       note: "Color + texture" },
//   ],
//
//   tools: "AE · C4D · Octane",
//   duration: "6 weeks active",
//   status: "Shipped",
// }
// ────────────────────────────────────────────────────────────────────────────

window.PROJECTS = [
  {
    id: "vubiquity",
    title: "Vubiquity",
    sub: "Logo treatment & animation",
    year: "2023",
    client: "Vubiquity",
    role: "Motion direction, 2D animation",
    disciplines: ["motion"],
    primary: "motion",
    featured: true,
    pitch: "A logo treatment built to survive every screen it lands on.",

    brief: "A logo treatment for a media distribution leader that resolves from broadcast static into a singular, confident mark.",
    summary: "Identity animation that lives across broadcast end-cards, social, and product surfaces — one motion vocabulary, ten formats.",
    writeup: [
      "Vubiquity needed a logo treatment that read instantly across broadcast, web and product. The constraint: it had to resolve under one second, work in monochrome, and survive both bright and dark surfaces.",
      "I built the animation around a single mechanic — a chromatic separation that resolves into the mark. The same expression rig drives the long-form opener and the social-format bug, so every variant is timing-locked to the same curves.",
      "The deliverable was a small system: a master After Effects project, six pre-rendered formats, and a Lottie export for product surfaces. The animation hooks the rig to a single duration parameter, so future variants stay on brand without re-keying.",
    ],

    hero:  { src: "", alt: "Vubiquity logo animation — final render" },
    heroVideo: "https://vimeo.com/824804225",  // demo Vimeo — replace with your real reel
    thumb: { src: "", alt: "Vubiquity logo animation thumbnail" },
    process: [
      { src: "", label: "Frame studies — 24 of 320", note: "Scribbles + storyboard" },
      { src: "", label: "Mark exploration",          note: "Static composition tests" },
      { src: "", label: "Timing pass",               note: "After Effects expressions" },
    ],

    tools: "AE · Lottie · Figma",
    duration: "6 weeks active",
    status: "Shipped",
    output: "Broadcast, social, product",
  },
  {
    id: "multiculturalism",
    title: "Box of Multiculturalism",
    sub: "3D animation",
    year: "2022",
    client: "Independent",
    role: "3D direction, animation, lighting",
    disciplines: ["3d", "motion"],
    primary: "3d",
    pitch: "One cardboard box. A dozen rituals. What does culture actually contain?",

    brief: "A short piece using one cardboard box and a dozen rituals to interrogate the metaphor of cultural containers.",
    summary: "A 90-second 3D piece exploring how cultures are packaged, traded and lost. One box. Many languages.",
    writeup: [
      "The brief was self-set: explore what happens when you treat \"culture\" as something you can put inside a cardboard box and ship somewhere else. The piece works through a single recurring shot — a box, mid-rotation — that opens into different interiors.",
      "I built the rig so the box geometry and camera move are locked, but every interior is a separate scene file. This let me iterate on each ritual independently while keeping the cuts on the same beats.",
      "Lighting was the hard part. Each interior had to read as 'somewhere specific' inside three frames, against a neutral exterior. I landed on a fixed three-point setup outside the box and let the interiors handle their own atmospheric haze.",
    ],

    hero:  { src: "", alt: "Box of Multiculturalism — final hero shot" },
    process: [
      { src: "", label: "Concept sketches",     note: "Pencil + index cards" },
      { src: "", label: "Cinema 4D blocking",   note: "Greybox lighting test" },
      { src: "", label: "Texture experiments",  note: "Octane + Substance" },
    ],

    tools: "C4D · Octane · Substance",
    duration: "8 weeks active",
    status: "Shipped",
  },
  {
    id: "xogot",
    title: "Xogot",
    sub: "Character & background — 2D game reimagining",
    year: "2024",
    client: "Xogot",
    role: "Character design, background art",
    disciplines: ["illo"],
    primary: "illo",

    brief: "A re-imagining of an existing 2D game's visual language — sharper silhouettes, deeper environments, same heart.",
    summary: "A visual rebuild of an existing 2D title. New silhouettes, new palette, same playable footprint.",
    writeup: [
      "Xogot wanted to lift the visual ceiling on an existing 2D game without changing the playable footprint. Every new asset had to drop into the same tile size and collision shape as the old one.",
      "I started by stripping the cast down to silhouettes — if a character didn't read from twenty feet away, it didn't move forward. The finalists each carried a single defining feature, which let the background art breathe.",
      "Backgrounds were built in stacks of three layers — foreground, mid, far — so the in-engine parallax does most of the storytelling. The illustration is, in a sense, an afterthought to a tight structural decision.",
    ],

    hero:  { src: "", alt: "Xogot hero character — final render" },
    process: [
      { src: "", label: "Silhouette pass",         note: "32 thumbnails, 6 finalists" },
      { src: "", label: "Environment thumbnails",  note: "Watercolor + digital" },
      { src: "", label: "Asset turnarounds",       note: "Game-ready sheets" },
    ],

    tools: "Procreate · Photoshop · Aseprite",
    duration: "10 weeks active",
    status: "Shipped",
  },
  {
    id: "weave",
    title: "Figma Weave",
    sub: "Character & world development",
    year: "2024",
    client: "Self-initiated",
    role: "Worldbuilding, illustration, motion tests",
    disciplines: ["illo", "3d"],
    primary: "illo",

    brief: "A long-form worldbuilding sandbox: characters, environments, and a small motion language for a fictional cooperative.",
    summary: "An ongoing worldbuilding project — characters, biomes, and a small motion vocabulary that ties them together.",
    writeup: [
      "Weave started as a way to test how much worldbuilding I could carry inside Figma alone. The constraint shaped everything — every character, biome and motion test lives in one file, on linked components, with a single design-token sheet.",
      "The interesting discovery was that the constraints of a design tool make for surprisingly rigorous worldbuilding. You can't fudge a culture if every prop is a published component. Every contradiction surfaces immediately.",
      "Motion tests are exported via the Figma → After Effects bridge and rendered into a small loop library. They're not the point of the project, but they make the static frames feel inhabited.",
    ],

    hero:  { src: "", alt: "Weave — world bible hero spread" },
    process: [
      { src: "", label: "World map iterations",    note: "Six rounds" },
      { src: "", label: "Character lineup",        note: "Cast of twelve" },
      { src: "", label: "Motion test reel",        note: "Loop studies" },
    ],

    tools: "Figma · After Effects · Notion",
    duration: "Ongoing",
    status: "Ongoing",
  },
  {
    id: "bigbake",
    title: "The Big Bake",
    sub: "Broadcast animation reel — S1 & S2",
    year: "2022—2023",
    client: "Food Network",
    role: "Lead motion designer",
    disciplines: ["motion", "video"],
    primary: "motion",
    pitch: "Two seasons of broadcast graphics, templated for sanity.",

    brief: "Two seasons of broadcast graphics, lower-thirds, transitions and end-cards for a competition baking show.",
    summary: "Two seasons of broadcast graphics — bumpers, lower-thirds, episode end-cards, scoreboards.",
    writeup: [
      "Broadcast work lives or dies by templating. Two seasons meant roughly 280 unique title cards, scoreboards and bumpers — none of which I'd hand-key without a rig.",
      "The pipeline ended up being four After Effects master comps, parameterised through an expression sheet. The producer fills in a CSV; the comp re-renders. We cut the per-card production time from forty minutes to about six.",
      "The visual language stayed warm and tactile — buttery yellows, soft chrome — to match the show's tone. Restraint was the design choice. The animation vocabulary is small on purpose, so the cast stays the loudest thing on screen.",
    ],

    hero:  { src: "", alt: "The Big Bake — broadcast bumper end frame" },
    process: [
      { src: "", label: "Style frames",         note: "Three directions" },
      { src: "", label: "Title sequence build", note: "C4D + AE comp" },
      { src: "", label: "Asset pipeline",       note: "Templated AE rigs" },
    ],

    tools: "After Effects · C4D · CSV pipeline",
    duration: "2 seasons",
    status: "Shipped",
  },
  {
    id: "underwriter",
    title: "Underwriter",
    sub: "Wealthsimple-styled prototype",
    year: "2025",
    client: "Independent",
    role: "Product design, prototype engineering, AI workflows",
    disciplines: ["ai", "code"],
    primary: "ai",
    pitch: "An AI underwriting prototype that surfaces the model instead of hiding it.",

    brief: "An AI-assisted underwriting prototype, styled in a fintech idiom — calm, dense, and explicit about confidence.",
    summary: "A working AI-underwriting prototype. Document ingestion, structured extraction, and a calm reviewer UI.",
    writeup: [
      "Most AI workflow UI hides the model. Underwriter does the opposite — it surfaces every extraction as a citation, every confidence score as a visible attribute, every model call as a step on the timeline.",
      "I styled the prototype in a fintech idiom because that audience is allergic to surprise. The visual restraint forces the AI behaviour to be the interesting thing, not the chrome.",
      "Under the hood it's a small Claude-driven pipeline with hand-tuned prompts, eval grids for each extraction type, and a deterministic post-processor. The reviewer sees a calm three-column layout. The pipeline behind it is paranoid.",
    ],

    hero:  { src: "", alt: "Underwriter — review screen final state" },
    process: [
      { src: "", label: "Information architecture", note: "Card-sort + flows" },
      { src: "", label: "Prompt workbench",         note: "Eval grid" },
      { src: "", label: "UI calibration",           note: "Confidence badging" },
    ],

    tools: "Next.js · Claude · TypeScript",
    duration: "5 weeks active",
    status: "Prototype",
  },
  {
    id: "reels",
    title: "Animation Reel",
    sub: "Nikki Ray & Architect Films",
    year: "2021—2024",
    client: "Various",
    role: "Motion design, broadcast graphics",
    disciplines: ["motion", "video"],
    primary: "video",

    brief: "Selected animation work across documentary, lifestyle and brand projects for two production houses.",
    summary: "Compilation reel — selected motion and titling for documentary, lifestyle and brand work.",
    writeup: [
      "Reels are an editing problem more than a motion problem. The temptation is to put your loudest frames first; the better move is to pace it like a piece of music.",
      "I cut to a single track and let the motion vocabulary cluster — broadcast intros up front, then documentary titles, then experimental loops. Each block has its own visual logic, but the cuts thread on rhythm.",
      "Color and sound got a final unifying pass. One LUT across everything, one stereo mix, one master at three deliverables. Simple discipline, but it's why the reel reads as a single voice.",
    ],

    hero:  { src: "", alt: "Animation Reel — title card" },
    process: [
      { src: "", label: "Reel cut breakdown", note: "120 → 90 seconds" },
      { src: "", label: "Color pass",         note: "DaVinci — single LUT" },
      { src: "", label: "Sound design",       note: "Two-track mix" },
    ],

    tools: "Premiere · DaVinci · After Effects",
    duration: "Rolling",
    status: "Updated quarterly",
  },
  {
    id: "modelling",
    title: "3D Modelling Showcase",
    sub: "Hard-surface & character",
    year: "2024—2025",
    client: "Self-initiated",
    role: "Modeller, texture, render",
    disciplines: ["3d"],
    primary: "3d",

    brief: "An evolving showcase of hard-surface and character modelling — production-ready topology, no shortcut sculpts.",
    summary: "An open showcase of hard-surface and character work — wires, turntables, breakdowns.",
    writeup: [
      "The work in here is deliberately unstyled — production-ready topology, clean UVs, baked textures. The point is to show I can hand a model off, not just light a beautiful turntable.",
      "Each asset includes wireframes, UV layouts, and a breakdown of decisions: where I sculpted vs. floated detail, where I baked vs. modelled, what the polycount budget was and why.",
      "It's an ongoing log. I add a new piece roughly every six weeks, with a short note about what I was trying to learn — generally a specific topology or shader trick rather than a finished hero shot.",
    ],

    hero:  { src: "", alt: "3D modelling — hard-surface turntable" },
    process: [
      { src: "", label: "Reference board",        note: "Per asset" },
      { src: "", label: "Block-out → high-poly",  note: "ZBrush + Blender" },
      { src: "", label: "Bake & shade",           note: "Substance + Octane" },
    ],

    tools: "Blender · ZBrush · Substance · Octane",
    duration: "Ongoing",
    status: "Ongoing",
  },
];

// Internal map — discipline id → CSS placeholder class. The procedural visual
// used when a project doesn't have a hero image yet.
window.PH_BY_DISCIPLINE = {
  motion: "ph-motion",
  "3d":   "ph-3d",
  illo:   "ph-illo",
  video:  "ph-video",
  ai:     "ph-ai",
  code:   "ph-code",
};

// Internal — floating shape descriptors layered onto procedural placeholders
// for additional visual variety. Indexed by project id. Pure CSS shapes —
// auto-removed once a project has a real hero image.
window.SHAPES = {
  vubiquity: [
    { type: "circle", w: 220, h: 220, x: "20%", y: "30%", bg: "var(--accent)", opacity: 0.5, blur: 40 },
    { type: "circle", w: 140, h: 140, x: "62%", y: "55%", bg: "#4f7cff", opacity: 0.3, blur: 60 },
  ],
  multiculturalism: [
    { type: "rect",   w: 180, h: 180, x: "30%", y: "30%", bg: "linear-gradient(135deg, var(--accent), #4f7cff)", opacity: 0.45, rotate: 12, blur: 14 },
    { type: "circle", w: 90,  h: 90,  x: "65%", y: "65%", bg: "var(--accent)", opacity: 0.55, blur: 12 },
  ],
  xogot: [
    { type: "rect",   w: 240, h: 36, x: "20%", y: "40%", bg: "var(--accent)", opacity: 0.6, rotate: -8, blur: 0 },
    { type: "rect",   w: 160, h: 24, x: "44%", y: "60%", bg: "#4f7cff", opacity: 0.4, rotate: -8, blur: 0 },
    { type: "circle", w: 50,  h: 50, x: "70%", y: "30%", bg: "var(--accent)", opacity: 0.5, blur: 8 },
  ],
  weave: [
    { type: "circle", w: 320, h: 320, x: "30%", y: "30%", bg: "radial-gradient(circle, var(--accent), transparent 70%)", opacity: 0.5, blur: 0 },
    { type: "circle", w: 120, h: 120, x: "60%", y: "60%", bg: "var(--accent)", opacity: 0.3, blur: 30 },
  ],
  bigbake: [
    { type: "circle", w: 280, h: 280, x: "60%", y: "40%", bg: "radial-gradient(circle, #ffb340, transparent 65%)", opacity: 0.4, blur: 0 },
    { type: "rect",   w: 90,  h: 90,  x: "20%", y: "55%", bg: "#ffb340", opacity: 0.45, rotate: 22, blur: 10 },
  ],
  underwriter: [
    { type: "rect", w: 220, h: 1, x: "50%", y: "30%", bg: "var(--accent)", opacity: 0.6, blur: 0 },
    { type: "rect", w: 220, h: 1, x: "50%", y: "50%", bg: "var(--accent)", opacity: 0.4, blur: 0 },
    { type: "rect", w: 220, h: 1, x: "50%", y: "70%", bg: "var(--accent)", opacity: 0.25, blur: 0 },
    { type: "circle", w: 12, h: 12, x: "50%", y: "30%", bg: "var(--accent)", opacity: 0.9, blur: 0 },
  ],
  reels: [
    { type: "rect", w: 160, h: 100, x: "32%", y: "40%", bg: "linear-gradient(135deg, var(--accent), transparent)", opacity: 0.6, blur: 0 },
    { type: "rect", w: 100, h: 60,  x: "60%", y: "55%", bg: "linear-gradient(135deg, #4f7cff, transparent)", opacity: 0.5, blur: 0 },
  ],
  modelling: [
    { type: "circle", w: 200, h: 200, x: "50%", y: "50%", bg: "conic-gradient(from 0deg, var(--accent), #4f7cff, var(--accent))", opacity: 0.5, blur: 30 },
  ],
};

window.EXPERIENCE = [
  { year: "2025",      role: "AI workflow & motion — independent",   note: "Tools, pipelines, prototypes",                     tag: "AI / Motion" },
  { year: "2024",      role: "Xogot — visual rebuild",                note: "Character & environment art direction",            tag: "Illustration" },
  { year: "2023",      role: "Vubiquity — identity in motion",        note: "Logo treatment, broadcast variants",               tag: "Motion" },
  { year: "2022—2023", role: "Food Network — The Big Bake S1 & S2",   note: "Lead motion designer, templated rigs",             tag: "Broadcast" },
  { year: "2021—2024", role: "Nikki Ray & Architect Films",           note: "Documentary titling and reel work",                tag: "Video" },
  { year: "Ongoing",   role: "Personal — Weave, 3D log, generative",  note: "Worldbuilding and tool studies",                   tag: "Studio" },
];

window.SKILLS = [
  { h: "Motion",       items: ["After Effects", "Cavalry", "Lottie pipelines", "Broadcast templating", "Title sequences"] },
  { h: "3D / CG",      items: ["Cinema 4D", "Blender", "Octane / Redshift", "Substance suite", "Hard-surface modelling"] },
  { h: "AI / Code",    items: ["Claude pipelines", "Prompt eval", "TypeScript prototypes", "Figma plugin work", "Generative tools"] },
  { h: "Illustration", items: ["Procreate", "Character design", "Environment art", "World bibles", "Editorial illos"] },
];

// Notes / Articles — the editorial side of the site. Each entry is a
// long-form post with markdown body, surfaced on the homepage strip,
// the /notes index, and at /notes/<id> as a full article.
//
//   id       slug for the URL (lowercase, no spaces)
//   date     freeform date string ("May 2026" or "2026-05-15")
//   title    article title
//   kind     short tag — Essay / Process / Tools / Note
//   summary  1-sentence preview for index + homepage strip
//   body     markdown text — # ## ### **bold** *italic* `code` [links]
//            - bullet lists, > blockquotes, ``` fenced code, --- hr
//   cover    optional { src, alt } — hero image at top of the article
//   pinned   optional bool — pinned notes show first on /notes
//
window.NOTES = [
  {
    id: "calm-ai-interfaces",
    date: "May 2026",
    title: "Notes on calm AI interfaces",
    kind: "Essay",
    summary: "On surfacing the model instead of hiding it — and why fintech idioms get it almost right.",
    cover: { src: "", alt: "Reviewer screen — citation overlay" },
    pinned: true,
    body: `Most AI workflow UI tries to hide the model. The output appears, polished and confident, and the user has to take it on faith. That works until it doesn't — and when it breaks, there's nowhere to go.

I think the better posture is *calm exposure*. Show every extraction. Show every confidence score. Show the model call as a step on a timeline. The user doesn't need to understand the internals; they just need to know that there *are* internals, and that they can dig.

## Three patterns I keep reaching for

**Citations everywhere.** Every claim the model makes should be attached to the source it came from — a span in the document, a row in the database, a tweet. The citation is a hyperlink to the evidence. This single move closes most of the trust gap.

**Confidence as a visible attribute.** Not a single global "confidence: 87%" number — that's noise. Instead, badge each extraction with its own score and let the reviewer set a threshold for what they want to manually check.

**Process steps as a timeline.** When the AI does a multi-step thing (read doc, extract entities, classify, summarise), show those steps. Each one is hover-able to reveal its inputs and outputs.

## The fintech idiom

I styled the [Underwriter prototype](/work/underwriter) in a fintech idiom on purpose. That audience is allergic to surprise. The visual restraint forces the AI behaviour to be the interesting thing, not the chrome.

There's a deeper reason: fintech UIs have spent decades earning trust by being explicit. *Pending. Cleared. Settled.* Every state has a name and a colour and a place in the timeline. Calm AI interfaces want to learn that vocabulary.

---

The rule I'm landing on: **never make the model speak in the first person.** Every "I" is a chance for the AI to overclaim. Better to caption: *Extraction · 94% · Source: pp. 12–14.* Same information, none of the personality.`,
  },
  {
    id: "templating-broadcast-for-sanity",
    date: "March 2026",
    title: "Templating broadcast for sanity",
    kind: "Process",
    summary: "How two seasons of 280 broadcast cards got cut from forty minutes to six.",
    cover: { src: "", alt: "After Effects expression sheet" },
    body: `Broadcast work lives or dies by templating. Two seasons of [The Big Bake](/work/bigbake) meant roughly 280 unique title cards, scoreboards and bumpers. None of those were hand-keyed. Anything you hand-key twice, you should template.

## The math

A hand-built title card took about 40 minutes — duplicate, retype, re-time, render. A templated one took 6.

\`\`\`
40 min × 280 cards = 187 hours
 6 min × 280 cards =  28 hours
                    ─────────
            saving = 159 hours
\`\`\`

That's a month of work, freed up to actually design.

## The pipeline

Four master comps in After Effects, parameterised through an expression sheet. The producer fills in a CSV with the per-episode data. The comp re-renders. A script kicks off Media Encoder in batch mode.

The expressions read from a JSON config baked into the project. The config lists every field — episode number, contestant names, scoreboard positions, lower-third copy — and the comp's text layers, position keys and visibility flags all hook in.

**Templating is not a creative shortcut.** The creative direction goes into the *rig*. Once the rig is good, you crank the handle. The work is in the rig.

## What I'd do differently

I'd build the CSV-to-render bridge as a real tool with a UI, not a chain of scripts. By season two it was robust but illegible to anyone but me. A small Electron app with three input fields and a render queue would have been a better long-term asset.`,
  },
  {
    id: "six-rigs-that-survived-2025",
    date: "January 2026",
    title: "Six rigs that survived 2025",
    kind: "Tools",
    summary: "Templating, eval grids, the after-effects sheet and three other tiny tools I still reach for.",
    cover: { src: "", alt: "Tools log — January 2026" },
    body: `Year-end ritual: which of the tools I built in 2025 do I still open in 2026? Six things, in order of how often I open them.

## 1. The eval grid

A spreadsheet template — one row per test case, one column per prompt variant, cells contain the model's output and a confidence score. Sort by disagreement to find your edge cases fast. Boring. Indispensable.

## 2. The After Effects expression sheet

JSON config baked into the AE project, expressions read from it. See [Templating broadcast for sanity](/notes/templating-broadcast-for-sanity) for the long version.

## 3. The Figma → After Effects bridge

A Figma plugin that exports nested frames as Lottie-shaped JSON, plus an AE script that imports it. The motion test reel for [Weave](/work/weave) lives entirely inside this pipeline.

## 4. The reference scraper

A tiny shell script that pulls Are.na blocks into a single PDF, dated and sorted. I keep one open per active project.

## 5. The colour-tag swatch

A two-page Figma file with my full palette as named styles, tagged by emotion. Browse by feeling, copy the hex. Way faster than my brain.

## 6. The retro doc

A Notion template. Three columns — *kept doing · stopped doing · started doing*. Fill it out the last Friday of each month. The forced-stop column has been the most useful.

---

Half of these are CSVs. None of them are AI. The one tool I built with Claude this year was a transcript-cleaner I no longer use, because the model got good enough to do it inline.`,
  },
];

// ── EDITORIAL — all editable site copy that isn't a project field ──────────
// Every hardcoded headline, subtitle, eyebrow and intro paragraph on the
// site lives here so the /admin Copy tab can rewrite them. Pages read these
// values via `window.copy(path, fallback)` (defined below) — the fallback
// kicks in if you delete a field, so nothing ever renders blank.

window.EDITORIAL = {
  home: {
    // Type hero (less-used variant — Tweaks → Hero → Type)
    typeHeadline: "Motion artist building AI workflows for the things that move.",
    typeRoleStrip: ["Motion", "3D / CG", "Illustration", "Video", "AI / Workflows", "Code"],
    typeMetaGrid: [
      { k: "Currently",         v: "Independent — building tools and reels." },
      { k: "Based",             v: "Montréal — remote" },
      { k: "Selected clients",  v: "Vubiquity, Food Network, Xogot, Architect Films." },
      { k: "Status",            v: "Currently in a full-time role." },
    ],

    // Loop hero (the default — featured project headline is pulled from
    // the project's `pitch` field, not from here)
    loopFeaturedEyebrow: "Featured project",

    // Reel hero (Tweaks → Hero → Reel)
    reelEyebrow:  "Showreel — 2026 selection",
    reelMeta:     "02:14 · 4K · 24fps",
    reelHeadline: "Frames, systems, shipped.",
    reelBlurb:    "A motion artist and AI workflow engineer. Selected work across broadcast, independent film and product. Currently building tools that help frames ship faster.",
    reelNowPlaying: "Now playing",

    // Featured strip
    featuredEyebrow: "Selected work",
    featuredTitle:   "Recent projects",
    featuredCtaAll:  "All work",

    // Notes strip
    notesEyebrow: "Notes & process",
    notesTitle:   "Short writing on tools, rigs and how things get made.",
  },

  work: {
    eyebrowPrefix: "Work",          // becomes "Work · 2021 — 2025"
    headlineTemplate: "A working catalog of {projects} project{projectsS} across {disciplines} discipline{disciplinesS}.",
    lede: "Each piece sits in its own case study with a brief, the final result, process gallery, and a written note on how it was made. Use the filters to narrow by discipline.",
  },

  caseStudy: {
    briefLabel:        "The brief",
    snapshotLabel:     "Snapshot",
    processEyebrow:    "Process",
    processHeadline:   "How it got made.",
    processBlurb:      "Selected stills from the working files — block-outs, style frames and tests that informed the final piece.",
    writeupLabel:      "Notes on the build",
    backLink:          "Back to index",
    prevLabel:         "← Previous case",
    nextLabel:         "Next case →",
  },

  about: {
    eyebrow: "Studio of one — Montréal · remote",
    headline: "A motion artist who fell in love with systems.",
    practiceLabel: "Practice",
    practiceLines: ["EST. 2021", "Independent practice", "Selective collaborations"],
    aboutLabel: "About",
    aboutParagraphs: [
      "I design in motion and build with systems. Most of the last five years have been spent on broadcast graphics, 3D animation and identity work — the kind of projects where the rig matters as much as the frame.",
      "In **2024** I started spending half my time on AI workflows. Same instinct, different surface: figure out what the system wants to do, build the rig that lets it do it, then make it *look* like it was always supposed to feel that way. The output is sometimes a render, sometimes a prompt graph, sometimes a small product.",
      "My favourite work sits at the join. A title sequence that's also a templated rig. A worldbuilding project that's also a design system. An underwriting prototype that's also a piece of motion. If you have a brief that lives in two disciplines, I'd like to read it.",
    ],
    experienceEyebrow: "Experience",
    experienceHeadline: "Selected projects, in order of recency.",
  },

  contact: {
    eyebrow:  "Get in touch — usually replies same week",
    headline: "New work, collaboration, or just to say hello.",
    subtitle: "For project enquiries, please include a one-paragraph brief, your rough timeline, and any reference material. I read everything — usually reply within five working days.",
    workingWithLabel: "Working with",
    workingWith: [
      "Brand identity teams",
      "Independent studios",
      "Broadcast networks",
      "Product teams adopting AI",
      "Director-led films",
    ],
  },

  footer: {
    ctaHeadline: "Have a brief that lives in two disciplines?",
    colophonHead: "Colophon",
    colophon: [
      "Helvetica Neue",
      "IBM Plex Mono",
      "Hand-built, no CMS",
      "v.26.05",
    ],
    siteHead: "Site",
    elsewhereHead: "Elsewhere",
    rightsTemplate: "© {name} — Folio '26",
  },
};

// Tiny helper for editorial lookup with fallback. Use it as
// `copy('home.featuredTitle', 'Recent projects')`. Walks the EDITORIAL
// tree by dotted path; returns the fallback for any missing leaf so the
// site never blanks if a field is deleted in /admin.
window.copy = function (path, fallback) {
  const parts = String(path).split(".");
  let cur = window.EDITORIAL;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return fallback;
    cur = cur[p];
  }
  return (cur == null || cur === "") ? fallback : cur;
};

// ── Template helpers — read these from the UI instead of hardcoding ─────────
window.getProject = function (id) {
  return window.PROJECTS.find((p) => p.id === id);
};
window.getNextProject = function (id) {
  const i = window.PROJECTS.findIndex((p) => p.id === id);
  return window.PROJECTS[(i + 1) % window.PROJECTS.length];
};
window.getPrevProject = function (id) {
  const i = window.PROJECTS.findIndex((p) => p.id === id);
  return window.PROJECTS[(i - 1 + window.PROJECTS.length) % window.PROJECTS.length];
};
window.getProjectsBy = function (disciplineId) {
  if (!disciplineId || disciplineId === "all") return window.PROJECTS;
  return window.PROJECTS.filter((p) => p.disciplines.includes(disciplineId));
};

// ── Notes helpers ──────────────────────────────────────────────────────────
window.getNote = function (id) {
  return window.NOTES.find((n) => n.id === id);
};
window.getSortedNotes = function () {
  // Pinned first, then array order. Pinning is the editorial control —
  // there's no automatic recency sort, so the author keeps full control.
  const pinned = window.NOTES.filter((n) => n.pinned);
  const rest   = window.NOTES.filter((n) => !n.pinned);
  return [...pinned, ...rest];
};
window.getNextNote = function (id) {
  const list = window.getSortedNotes();
  const i = list.findIndex((n) => n.id === id);
  return list[(i + 1) % list.length];
};
window.getPrevNote = function (id) {
  const list = window.getSortedNotes();
  const i = list.findIndex((n) => n.id === id);
  return list[(i - 1 + list.length) % list.length];
};

// Featured projects — surface on the home hero + featured strip.
// Featured is single-select: at most one project should have featured===true
// at any time (the admin enforces this). If none is marked, the site falls
// back to the first project in array order so the home page never empties.
window.getFeatured = function () {
  const marked = window.PROJECTS.find((p) => p.featured === true);
  return marked || window.PROJECTS[0];
};

// Derive the year range across all projects — handles "2023" and "2022—2023"
// forms. Returns { min, max } as numbers, or null if no parseable years.
window.getYearRange = function () {
  const years = [];
  window.PROJECTS.forEach((p) => {
    if (!p.year) return;
    // match every 4-digit run in the string
    const matches = String(p.year).match(/\d{4}/g);
    if (matches) matches.forEach((y) => years.push(parseInt(y, 10)));
  });
  if (!years.length) return null;
  return { min: Math.min(...years), max: Math.max(...years) };
};

// Count unique disciplines actually used across projects (excludes the "all" pseudo-id).
window.getDisciplineCount = function () {
  const used = new Set();
  window.PROJECTS.forEach((p) => p.disciplines.forEach((d) => used.add(d)));
  return used.size;
};

// ── Persistence — localStorage overlay on top of the file defaults ──────────
// The admin page mutates window.PROJECTS / window.SITE then calls
// `saveContent()` which writes to localStorage. On page load we restore from
// localStorage before the App mounts so the site renders the saved state.
//
// In production this layer is replaced by a real CMS (see SPEC.md §16).
// The shape of the persisted blob is the same as the file content, so
// content edited here exports cleanly into data.js for deploy.

const STORAGE_KEY = "__nsa_content_v1";

// Snapshot the defaults so a "reset" can restore them. JSON-clone to break
// references — mutating PROJECTS in admin won't poison the defaults.
window.__DEFAULTS = {
  projects:   JSON.parse(JSON.stringify(window.PROJECTS)),
  site:       JSON.parse(JSON.stringify(window.SITE)),
  editorial:  JSON.parse(JSON.stringify(window.EDITORIAL)),
  notes:      JSON.parse(JSON.stringify(window.NOTES)),
  skills:     JSON.parse(JSON.stringify(window.SKILLS)),
  experience: JSON.parse(JSON.stringify(window.EXPERIENCE)),
  theme:      JSON.parse(JSON.stringify(window.THEME)),
};

window.loadContent = function () {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (Array.isArray(data.projects))   window.PROJECTS = data.projects;
    if (Array.isArray(data.notes))      window.NOTES = data.notes;
    if (Array.isArray(data.skills))     window.SKILLS = data.skills;
    if (Array.isArray(data.experience)) window.EXPERIENCE = data.experience;
    if (data.site && typeof data.site === "object") {
      window.SITE = { ...window.SITE, ...data.site };
    }
    if (data.editorial && typeof data.editorial === "object") {
      window.EDITORIAL = { ...window.EDITORIAL, ...data.editorial };
    }
    if (data.theme && typeof data.theme === "object") {
      // Preserve presets from defaults (they shouldn't be user-mutable)
      window.THEME = { ...window.THEME, ...data.theme,
        accentPresets: window.THEME.accentPresets,
        fontPresets:   window.THEME.fontPresets };
    }
    return true;
  } catch (e) {
    console.warn("Failed to load saved content:", e);
    return false;
  }
};

window.saveContent = function () {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      projects:   window.PROJECTS,
      site:       window.SITE,
      editorial:  window.EDITORIAL,
      notes:      window.NOTES,
      skills:     window.SKILLS,
      experience: window.EXPERIENCE,
      theme:      window.THEME,
    }));
    window.dispatchEvent(new Event("contentchanged"));
    return true;
  } catch (e) {
    console.warn("Failed to save content:", e);
    return false;
  }
};

window.resetContent = function () {
  localStorage.removeItem(STORAGE_KEY);
  window.PROJECTS   = JSON.parse(JSON.stringify(window.__DEFAULTS.projects));
  window.SITE       = JSON.parse(JSON.stringify(window.__DEFAULTS.site));
  window.EDITORIAL  = JSON.parse(JSON.stringify(window.__DEFAULTS.editorial));
  window.NOTES      = JSON.parse(JSON.stringify(window.__DEFAULTS.notes));
  window.SKILLS     = JSON.parse(JSON.stringify(window.__DEFAULTS.skills));
  window.EXPERIENCE = JSON.parse(JSON.stringify(window.__DEFAULTS.experience));
  window.THEME      = JSON.parse(JSON.stringify(window.__DEFAULTS.theme));
  window.dispatchEvent(new Event("contentchanged"));
};

window.exportJSON = function () {
  return JSON.stringify({
    projects:   window.PROJECTS,
    site:       window.SITE,
    editorial:  window.EDITORIAL,
    notes:      window.NOTES,
    skills:     window.SKILLS,
    experience: window.EXPERIENCE,
    theme:      window.THEME,
    _exportedAt: new Date().toISOString(),
  }, null, 2);
};

window.importJSON = function (text) {
  const data = JSON.parse(text);
  if (Array.isArray(data.projects))   window.PROJECTS = data.projects;
  if (Array.isArray(data.notes))      window.NOTES = data.notes;
  if (Array.isArray(data.skills))     window.SKILLS = data.skills;
  if (Array.isArray(data.experience)) window.EXPERIENCE = data.experience;
  if (data.site && typeof data.site === "object") {
    window.SITE = { ...window.__DEFAULTS.site, ...data.site };
  }
  if (data.editorial && typeof data.editorial === "object") {
    window.EDITORIAL = { ...window.__DEFAULTS.editorial, ...data.editorial };
  }
  if (data.theme && typeof data.theme === "object") {
    window.THEME = { ...window.__DEFAULTS.theme, ...data.theme,
      accentPresets: window.__DEFAULTS.theme.accentPresets,
      fontPresets:   window.__DEFAULTS.theme.fontPresets };
  }
  window.saveContent();
};

// Build a data.js drop-in matching the file format. Production can replace
// the existing data.js with this output to ship admin edits.
window.exportDataJS = function () {
  const stringify = (obj, indent = 2) => JSON.stringify(obj, null, indent);
  return `// data.js — generated from /admin on ${new Date().toISOString()}
// Drop this into the project root, replacing the existing data.js.

window.SITE = ${stringify(window.SITE)};

window.NAV = ${stringify(window.NAV)};

window.DISCIPLINES = ${stringify(window.DISCIPLINES)};

window.PROJECTS = ${stringify(window.PROJECTS)};

window.PH_BY_DISCIPLINE = ${stringify(window.PH_BY_DISCIPLINE)};

window.SHAPES = ${stringify(window.SHAPES)};

window.EXPERIENCE = ${stringify(window.EXPERIENCE)};

window.SKILLS = ${stringify(window.SKILLS)};

window.NOTES = ${stringify(window.NOTES)};

window.EDITORIAL = ${stringify(window.EDITORIAL)};

window.THEME = ${stringify(window.THEME)};
`;
};

window.isContentDirty = function () {
  return !!localStorage.getItem(STORAGE_KEY);
};

// ── Theme applier — write all THEME tokens to CSS variables ─────────────
// Called whenever THEME changes (admin edit, content reset, page load).
// The Tweaks-panel palette can layer on top by setting --accent/--bg/--fg
// individually after this runs.
window.applyTheme = function () {
  const t = window.THEME;
  if (!t) return;
  const r = document.documentElement;

  // Surfaces
  r.style.setProperty("--bg",      t.bg);
  r.style.setProperty("--bg-2",    t.bg2);
  r.style.setProperty("--surface", t.surface);
  r.style.setProperty("--line",    t.line);
  r.style.setProperty("--line-2",  t.line2);

  // Foreground
  r.style.setProperty("--fg",      t.fg);
  r.style.setProperty("--fg-2",    t.fg2);
  r.style.setProperty("--muted",   t.muted);
  r.style.setProperty("--muted-2", t.muted2);

  // Accent + computed ink contrast (light accent → dark ink, else bg)
  r.style.setProperty("--accent", t.accent);
  const isLight = (() => {
    const h = String(t.accent).replace("#", "");
    const x = h.length === 3 ? h.replace(/./g, (c) => c + c) : h.padEnd(6, "0");
    const n = parseInt(x.slice(0, 6), 16);
    const r2 = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return r2 * 299 + g * 587 + b * 114 > 148000;
  })();
  r.style.setProperty("--accent-ink", isLight ? "#0E1117" : t.bg);

  // Type stacks
  r.style.setProperty("--sans", t.sans);
  r.style.setProperty("--mono", t.mono);

  // Caps mode
  document.body.classList.toggle("caps", !!t.capsHeadings);

  // Load Google Fonts import if the chosen preset has one.
  // We find the preset whose sans matches THEME.sans (by family name) and
  // append a single <link> tag for its import string. Idempotent — we
  // remove the previous tag first.
  const old = document.querySelector("link[data-theme-fonts]");
  if (old) old.remove();
  const preset = (t.fontPresets || []).find((p) => p.sans === t.sans);
  if (preset && preset.googleImport) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.dataset.themeFonts = "1";
    link.href = `https://fonts.googleapis.com/css2?family=${preset.googleImport}&display=swap`;
    document.head.appendChild(link);
  }
};

// Load saved content immediately on script load (before React mounts)
window.loadContent();

// Apply theme immediately so the first paint isn't a flash of defaults.
// Wrap in try in case THEME isn't defined yet (legacy localStorage payloads).
try { window.applyTheme(); } catch (e) { /* defaults from styles.css */ }

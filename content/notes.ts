import type { Note } from './types';

export const NOTES: Note[] = [
  {
    id: 'calm-ai-interfaces',
    date: 'May 2026',
    title: 'Notes on calm AI interfaces',
    kind: 'Essay',
    summary:
      'On surfacing the model instead of hiding it — and why fintech idioms get it almost right.',
    cover: { src: '', alt: 'Reviewer screen — citation overlay' },
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
    id: 'templating-broadcast-for-sanity',
    date: 'March 2026',
    title: 'Templating broadcast for sanity',
    kind: 'Process',
    summary: 'How two seasons of 280 broadcast cards got cut from forty minutes to six.',
    cover: { src: '', alt: 'After Effects expression sheet' },
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
    id: 'six-rigs-that-survived-2025',
    date: 'January 2026',
    title: 'Six rigs that survived 2025',
    kind: 'Tools',
    summary: 'Templating, eval grids, the after-effects sheet and three other tiny tools I still reach for.',
    cover: { src: '', alt: 'Tools log — January 2026' },
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

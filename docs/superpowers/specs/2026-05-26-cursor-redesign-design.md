# Cursor redesign — HUD chip

**Date:** 2026-05-26
**Status:** Design — ready for implementation plan
**Touches:** `components/chrome/cursor.tsx`, `components/chrome/cursor.module.css`, ~6 call sites with `data-cursor-label` updates

## Problem

The current custom cursor (`components/chrome/cursor.tsx`) is a 6px dot + 36px ring that uses `mix-blend-mode: difference` and renders a contextual label *inside* the ring. Two issues:

1. **Label legibility.** The label text is small (11px), dark (`var(--accent-ink)` = `#0e1117`), and sits on a translucent ring with `mix-blend-mode: difference`. Over media, photographs, and accent areas the label becomes hard or impossible to read.
2. **Personality.** The cursor is generic "Awwwards dot+ring." The portfolio's tone is motion-design / creative-technologist; the cursor should reflect that more.

## Goal

Replace the cursor with a frosted **HUD chip** that:

- Solves label legibility by giving the label its own opaque pill backing
- Adds personality through state-driven pip scaling and per-section glyph swaps
- Preserves the existing `data-cursor` / `data-cursor-label` call-site API so we don't have to touch most consumers
- Keeps every existing accessibility/perf affordance (reduced-motion, coarse-pointer)

## Non-goals

- No idle-whisper, click-burst, magnetic-snap, or reading-bracket features (considered, deferred).
- No changes to the touch / coarse-pointer path — the cursor remains unmounted there.
- No changes to which elements opt into the cursor states. The `data-cursor` API surface is stable.

## Architecture

Same single component (`CustomCursor`) mounted in `app/layout.tsx`. Same RAF lerp loop. Same `data-cursor` lookup via `closest()`. Three element refs in the DOM tree:

```
<div ref={chipRef} class={styles.chip} data-state="default">
  <span class={styles.pip} />            ← scales by state, may swap to glyph
  <span ref={labelRef} class={styles.label} />  ← text node
</div>
```

The old `ring` + `dot` + separate `label` triple is collapsed into one chip element with internal pip + label spans. Both children inherit chip transform, so we only translate one node per frame.

A small new piece: a `usePathname()` lookup inside `CustomCursor` to drive the per-section pip glyph (§5 below). The pathname is read on every render of the component; since the component remounts on route change via Next App Router behavior already in use, this is straightforward.

## Visual style — the frosted chip

| Property | Value | Notes |
|---|---|---|
| Background | `rgba(14, 17, 23, 0.7)` | Falls back to `rgba(14, 17, 23, 0.92)` via `@supports not (backdrop-filter: blur(1px))` |
| Backdrop filter | `blur(8px)` saturate(120%) | Vendor-prefixed for Safari |
| Border | `1px solid rgba(237, 229, 216, 0.15)` | Subtle edge so chip reads on any bg |
| Text color | `var(--fg)` (`#ede5d8`) | Always cream — no inversions |
| Font | `var(--mono)`, 10px, weight 600, uppercase | Letter-spacing `0.1em` |
| Padding | `5px 9px` | |
| Border-radius | `2px` | Sharp, matches site language |
| Pip color | `var(--accent)` (`#ff5b1f`) | |
| Gap pip↔label | `7px` | Via CSS gap |
| Blend mode | **none** | Chip stays opaque; label always readable |
| Z-index | `2147483647` | Preserved from current implementation |
| Pointer events | `none` | Preserved |

## State machine

Four states. `data-state` attribute on the chip element drives CSS.

| State | Trigger | Pip | Label | Chip body | Other |
|---|---|---|---|---|---|
| `default` | no `data-cursor` ancestor | **3px** solid | hidden (`opacity: 0`) | hidden (`opacity: 0`); chip collapses to just-pip via padding zero | Native cursor still visible on plain text |
| `link` | `data-cursor="link"` | **6px** solid | from `data-cursor-label`; fallback `→` | fades in over `var(--t-fast)` (~220ms) | |
| `view` | `data-cursor="view"` | **10px** solid | from `data-cursor-label`; fallback `View` | fades in; subtle glow `box-shadow: 0 6px 20px rgba(255,91,31,0.25)` | |
| `active` | mousedown while on `link`/`view` | inherits state pip + 3px outer ring (box-shadow) that pulses once | unchanged | `transform: scale(1.08)` for ~120ms then back | Triggered on `mousedown`, cleared on `mouseup` or `mouseleave` |

Transitions use `var(--t-fast)` (220ms cubic-bezier(0.22, 0.61, 0.36, 1)) for chip opacity/scale; pip size uses 180ms for a slightly snappier feel.

## Position behavior

Same RAF lerp as the current implementation: dot follows at lerp factor `0.55`, chip follows at `0.18` (the chip plays the role of the old ring — slightly trailing). On state change, chip auto-offsets `12px right + 14px down` from the actual pointer so the label never sits *on* the target. In `default` state offset goes to zero (just the pip at the pointer tip).

## Label vocabulary

Reuse existing `data-cursor-label` values from the codebase. No call-site changes required for the base set. Final mapping (post-this-PR):

| Call site | Current | Final |
|---|---|---|
| `components/work/tile.tsx` | `View` | `View case` |
| `components/notes/notes-index.tsx` | `Read` | `Read` (unchanged) |
| `components/case/next-prev.tsx` prev | `Previous` | `Previous` (unchanged) |
| `components/case/next-prev.tsx` next | `Next case` | `Next case` (unchanged) |
| `components/notes/note-article.tsx` prev | `Previous` | `Previous` (unchanged) |
| `components/notes/note-article.tsx` next | `Next note` | `Next note` (unchanged) |
| `components/home/hero-marquee.tsx` | `View` | `View` (unchanged) |
| `components/chrome/footer.tsx` email | `Write` | `Say hi` |
| `components/chrome/nav-rail.tsx` home | `Home` | `Take me home` |
| `components/contact/big-email.tsx` | `Write` | `Say hi` |
| `components/contact/contact-links.tsx` (each) | — | `@<handle>` (use the social handle) |
| `components/primitives/arrow-button.tsx` | dynamic via `cursorLabel` prop | unchanged |
| `components/work/filter-chips.tsx` | — | unchanged |

If `data-cursor-label` is empty/missing on a `link` element, the chip falls back to a single `→` glyph (not blank).

## Per-section pip glyph

Inside `CustomCursor`, read `usePathname()`. Map prefix → glyph:

| Pathname prefix | Glyph | Notes |
|---|---|---|
| `/work` | `◆` | filled diamond |
| `/notes` | `◇` | hollow diamond |
| `/contact` | `✉` | envelope |
| `/studio` | `●` | filled circle (slightly heavier than default pip) |
| `/keystatic` | — (cursor disabled, see §perf/a11y) | |
| anything else (incl. `/`) | default solid pip | no glyph swap |

Glyph renders **inside** the pip slot only when state is `link`, `view`, or `active`. In `default` state the pip remains a plain dot regardless of route — keeps idle motion quiet.

Implementation: a `<span class={styles.pip} data-glyph={glyph}>` element. CSS uses `data-glyph` to set the content via a pseudo-element (`.pip[data-glyph="◆"]::before { content: '◆'; }`) or, simpler, the React component renders the glyph as a text child of `.pip` when present. The latter is simpler and equally performant.

## Accessibility, reduced motion, perf

- `useReducedMotion()` returns true → `CustomCursor` returns `null` (existing behavior, kept).
- `useCoarsePointer()` returns true → same, returns `null` (existing behavior, kept).
- All chip DOM is `aria-hidden="true"` (existing, kept).
- Admin/Keystatic exclusion: add a `usePathname().startsWith('/keystatic')` check that also returns `null`. Combined with `body.cursor-on` being toggled off when the cursor isn't mounted, the admin keeps the native pointer.
- No new JS dependencies. `usePathname()` is already in use in the project.
- The chip is one DOM node per frame to translate (vs current two — dot + ring). Same `will-change: transform` hint.
- `backdrop-filter` is GPU-accelerated everywhere we ship. Fallback `@supports` rule covers Firefox-without-flag and older browsers with a near-opaque dark pill.

## Edge cases

- **Cursor hover starts during scroll** — no special handling; existing pointer events already drive `onMove`.
- **Window blur / re-focus** — chip remains where last drawn; `mouseleave` already hides it.
- **Rapid mousedown bursts** — `active` state is set on `mousedown` and cleared on `mouseup`. If both fire in the same frame the CSS transition starts and gets superseded; we accept that as designed (single subtle pulse per click).
- **State swap during animation** — chip transitions are property-based, so newer values just override. No special handling needed.
- **Empty `data-cursor-label`** on a `link` element → fallback glyph `→`. On `view` element → fallback word `View`. Defined in the component, not via CSS.

## Implementation outline (for the writing-plans pass)

1. Rewrite `components/chrome/cursor.module.css` — chip, pip, label classes + state-driven sizes.
2. Rewrite `components/chrome/cursor.tsx`:
   - Single `chipRef`. Internal `pipRef` and `labelRef` are still useful for direct mutation (label text, pip glyph swap).
   - `usePathname()` to pick the section glyph.
   - Return `null` when pathname starts with `/keystatic/`.
   - Add `mousedown`/`mouseup` listeners for `active` state.
3. Update 5–6 call sites with cheeky-label changes (see table in §Label vocabulary).
4. Add `@supports` fallback in CSS for backdrop-filter.
5. Manual QA pass:
   - All four states render correctly on `/`, `/work`, `/work/<slug>`, `/notes`, `/notes/<slug>`, `/studio`, `/contact`.
   - Per-section glyph swaps as expected.
   - Cursor disappears on `/keystatic/*`.
   - `prefers-reduced-motion: reduce` → cursor not mounted.
   - DevTools mobile emulation (coarse pointer) → cursor not mounted.

## Open questions

- None at design time. Implementation may surface small choices (exact ease for active pulse, fallback glyph for `view` with empty label) — those are spec'd above as defaults but flag any deviations during implementation.

## What this replaces / what stays

Stays:
- `data-cursor` attribute API across the codebase.
- `data-cursor-label` attribute API.
- `body.cursor-on` class behavior.
- `useReducedMotion` / `useCoarsePointer` gating.
- Mount point in `app/layout.tsx`.

Replaces:
- `cursor.module.css` (full rewrite — different structure).
- `cursor.tsx` element structure (chip+pip+label instead of dot+ring+label).
- A handful of `data-cursor-label` values at specific call sites (table above).

# Cursor HUD Chip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dot+ring+blend-difference cursor with a frosted HUD chip whose label is always legible and whose pip scales per state.

**Architecture:** Single client component (`CustomCursor`) that renders one chip element with two child spans (pip + label). A RAF lerp drives chip translation; CSS transitions drive size/opacity/scale changes. `usePathname()` selects a section glyph; cursor is unmounted under `/keystatic/*`. The existing `data-cursor` / `data-cursor-label` call-site API is preserved.

**Tech Stack:** Next.js 15 (App Router), React 19, CSS Modules, `next/navigation` (`usePathname`), CSS `backdrop-filter` with `@supports` fallback. No new dependencies. No test framework in this project — verification uses `pnpm typecheck`, `pnpm build`, and manual QA against the dev server.

**Spec reference:** [docs/superpowers/specs/2026-05-26-cursor-redesign-design.md](../specs/2026-05-26-cursor-redesign-design.md)

---

## File Structure

**Modified files (full rewrite):**
- `components/chrome/cursor.tsx` — new chip+pip+label structure, RAF lerp, state machine, pathname-driven glyph, `/keystatic` exclusion, active-state pulse
- `components/chrome/cursor.module.css` — new chip / pip / label classes, `data-state` selectors, `@supports` fallback for backdrop-filter

**Modified files (small edits — one to three lines each):**
- `components/work/tile.tsx` — `data-cursor-label="View"` → `"View case"`
- `components/chrome/footer.tsx` — `data-cursor-label="Write"` → `"Say hi"` (email link only; site nav links untouched)
- `components/chrome/nav-rail.tsx` — `data-cursor-label="Home"` → `"Take me home"`
- `components/contact/big-email.tsx` — `data-cursor-label="Write"` → `"Say hi"`
- `components/contact/contact-links.tsx` — add `data-cursor-label="@{s.handle}"` on social links and `data-cursor-label="Say hi"` on the email link (currently no labels)

**Untouched (verify by inspection only):**
- `app/layout.tsx` — `<CustomCursor />` mount stays where it is
- `app/globals.css` — `body.cursor-on` rules stay
- `lib/hooks/useReducedMotion.ts` — both hooks reused as-is

---

## Verification Commands

The plan uses these commands throughout. Run them from the project root.

| Command | Purpose |
|---|---|
| `pnpm typecheck` | TypeScript check (`tsc --noEmit`). Required after every Task. |
| `pnpm dev` | Dev server on http://localhost:3000. Used for manual QA. |
| `pnpm build` | Production build. Run once at end of plan to confirm no SSR/CSS regressions. |
| `git diff --stat` | Sanity-check scope of a commit before staging. |

If `pnpm` is not installed in your shell, use `npx pnpm <cmd>` or `corepack pnpm <cmd>`.

---

## Task 1: New `cursor.module.css`

**Files:**
- Modify: `components/chrome/cursor.module.css` (full rewrite)

Rewrites the stylesheet to introduce the frosted chip with state-driven sizes, pip glyph rendering, and a backdrop-filter fallback. The class names exposed to the component change: `dot` and `ring` are removed; `chip`, `pip`, and `label` are introduced.

- [ ] **Step 1: Replace the entire file with the new CSS**

Write `components/chrome/cursor.module.css`:

```css
/* Custom cursor — HUD chip. SPEC §6.2 + cursor redesign 2026-05-26. */

.chip {
  position: fixed;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 2147483647;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 9px;
  background: rgba(14, 17, 23, 0.7);
  backdrop-filter: blur(8px) saturate(120%);
  -webkit-backdrop-filter: blur(8px) saturate(120%);
  border: 1px solid rgba(237, 229, 216, 0.15);
  color: var(--fg);
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border-radius: 2px;
  white-space: nowrap;
  opacity: 0;
  transition:
    opacity var(--t-fast),
    transform 120ms cubic-bezier(0.22, 0.61, 0.36, 1),
    box-shadow 200ms,
    padding 180ms cubic-bezier(0.22, 0.61, 0.36, 1);
  will-change: transform, opacity;
}

/* Backdrop-filter fallback: near-opaque dark pill on browsers without
 * the filter (Firefox without flag, older browsers). */
@supports not (backdrop-filter: blur(1px)) {
  .chip {
    background: rgba(14, 17, 23, 0.92);
  }
}

.pip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3px;
  height: 3px;
  background: var(--accent);
  color: var(--accent);
  border-radius: 50%;
  flex-shrink: 0;
  font-size: 11px;
  line-height: 1;
  font-family: var(--mono);
  transition:
    width 180ms cubic-bezier(0.22, 0.61, 0.36, 1),
    height 180ms cubic-bezier(0.22, 0.61, 0.36, 1),
    background-color 180ms,
    box-shadow 200ms;
  will-change: width, height;
}

/* When a glyph is set, the pip becomes a glyph slot — slightly bigger so
 * the character isn't clipped, transparent background. */
.pip[data-glyph]:not([data-glyph='']) {
  background: transparent;
  border-radius: 0;
  width: 12px;
  height: 12px;
}

.label {
  display: inline-block;
  max-width: 0;
  overflow: hidden;
  opacity: 0;
  transition:
    max-width 220ms cubic-bezier(0.22, 0.61, 0.36, 1),
    opacity 180ms;
}

/* === STATES (driven by data-state on .chip) === */

/* default: chip body hidden; only the small pip is visible.
 * We achieve this by collapsing padding + hiding bg/border/label
 * so the pip floats alone at the pointer tip. */
.chip[data-state='default'] {
  padding: 0;
  background: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border-color: transparent;
  opacity: 1; /* keep wrapper visible so .pip shows; the chip "body" is invisible via the props above */
}

.chip[data-state='default'] .pip {
  width: 3px;
  height: 3px;
}

.chip[data-state='default'] .label {
  max-width: 0;
  opacity: 0;
}

/* link: chip body visible, pip 6px, label slides in */
.chip[data-state='link'] {
  opacity: 1;
}

.chip[data-state='link'] .pip {
  width: 6px;
  height: 6px;
}

.chip[data-state='link'] .label {
  max-width: 12ch;
  opacity: 1;
}

/* view: bigger pip, subtle accent glow, label visible */
.chip[data-state='view'] {
  opacity: 1;
  box-shadow: 0 6px 20px rgba(255, 91, 31, 0.25);
}

.chip[data-state='view'] .pip {
  width: 10px;
  height: 10px;
}

.chip[data-state='view'] .label {
  max-width: 14ch;
  opacity: 1;
}

/* active: triggered on mousedown over link/view. Subtle pulse. */
.chip[data-active='1'] {
  transform-origin: top left;
}

.chip[data-active='1'][data-state='link'],
.chip[data-active='1'][data-state='view'] {
  box-shadow: 0 6px 22px rgba(255, 91, 31, 0.35);
}

.chip[data-active='1'][data-state='link'] .pip,
.chip[data-active='1'][data-state='view'] .pip {
  box-shadow: 0 0 0 3px rgba(255, 91, 31, 0.3);
}
```

- [ ] **Step 2: Run typecheck (CSS won't break it, sanity check imports later)**

```bash
pnpm typecheck
```

Expected: Either passes, or fails only because `cursor.tsx` still imports the old `dot` / `ring` class names (those errors will go away in Task 2). Do not commit yet.

- [ ] **Step 3: Skip commit — leave staged for Task 2's commit**

CSS alone with a stale `cursor.tsx` is a broken intermediate state. Task 2 commits both files together.

---

## Task 2: Rewrite `cursor.tsx` — chip core

**Files:**
- Modify: `components/chrome/cursor.tsx` (full rewrite)

Replaces the dot+ring+separate-label structure with a single chip containing pip + label. RAF lerp still drives chip translation at the same factor as the old ring (0.18). The pip and label respond to `data-state` on the chip; no separate DOM nodes to translate per frame.

The pathname-driven glyph and active state are handled by separate code paths *inside this component* but are introduced incrementally — Task 2 includes the base structure and a placeholder for the glyph (`section glyph` = empty in Task 2; populated in Task 3).

- [ ] **Step 1: Replace the entire file**

Write `components/chrome/cursor.tsx`:

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useCoarsePointer, useReducedMotion } from '@/lib/hooks/useReducedMotion';
import styles from './cursor.module.css';

/**
 * Custom HUD-chip cursor — SPEC §6.2 + cursor redesign 2026-05-26.
 *
 * One fixed chip follows the pointer with a RAF lerp. Reads `data-cursor`
 * and `data-cursor-label` from the closest ancestor of the pointer target
 * to switch state. The leading pip scales by state; the label slides in
 * when there is something to interact with.
 *
 * Hidden entirely on coarse pointers, when prefers-reduced-motion: reduce,
 * and on the /keystatic admin shell (Task 3 wires that exclusion).
 */
export function CustomCursor() {
  const chipRef = useRef<HTMLDivElement | null>(null);
  const pipRef = useRef<HTMLSpanElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const stateRef = useRef<string>('default');

  const reduced = useReducedMotion();
  const coarse = useCoarsePointer();
  const pathname = usePathname();

  // Pathname-driven glyph is populated in Task 3. For now, empty string
  // means "no glyph", and the pip stays a plain dot.
  const sectionGlyph = '';
  void pathname; // silence unused-var until Task 3 wires it

  useEffect(() => {
    document.body.classList.add('cursor-on');
    return () => {
      document.body.classList.remove('cursor-on');
    };
  }, []);

  useEffect(() => {
    if (reduced || coarse) return;

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let cx = mx;
    let cy = my;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      const target = e.target as Element | null;
      const el = target?.closest?.('[data-cursor]') as HTMLElement | null;
      const next = el?.dataset['cursor'] ?? 'default';
      const label = el?.dataset['cursorLabel'] ?? '';
      if (stateRef.current !== next) {
        stateRef.current = next;
        if (chipRef.current) chipRef.current.dataset['state'] = next;
      }
      if (labelRef.current) {
        // Fallback labels: link → '→', view → 'View'. Otherwise use the
        // data attribute. Default state has no label regardless.
        const resolved =
          next === 'default'
            ? ''
            : label || (next === 'view' ? 'View' : '→');
        labelRef.current.textContent = resolved;
      }
    };

    const hide = () => {
      if (chipRef.current) chipRef.current.style.opacity = '0';
    };
    const show = () => {
      // Opacity is now controlled per-state in CSS — restore inline
      // opacity to empty so the CSS rule takes over.
      if (chipRef.current) chipRef.current.style.opacity = '';
    };

    const loop = () => {
      cx += (mx - cx) * 0.18;
      cy += (my - cy) * 0.18;
      if (chipRef.current) {
        // Offset the chip 12px right + 14px down of the actual pointer
        // so the label never sits on the target — except in default
        // state, where we keep the pip at the tip.
        const offsetX = stateRef.current === 'default' ? 0 : 12;
        const offsetY = stateRef.current === 'default' ? 0 : 14;
        chipRef.current.style.transform = `translate3d(${cx + offsetX}px, ${cy + offsetY}px, 0)`;
      }
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', hide);
    document.addEventListener('mouseenter', show);
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', hide);
      document.removeEventListener('mouseenter', show);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced, coarse]);

  if (reduced || coarse) return null;

  return (
    <div
      ref={chipRef}
      className={styles.chip}
      data-state="default"
      aria-hidden="true"
    >
      <span
        ref={pipRef}
        className={styles.pip}
        data-glyph={sectionGlyph}
      >
        {sectionGlyph}
      </span>
      <span ref={labelRef} className={styles.label} />
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm typecheck
```

Expected: passes cleanly. If any error references `styles.dot` or `styles.ring`, you missed something — re-open `cursor.tsx` and confirm only `styles.chip`, `styles.pip`, `styles.label` are referenced.

- [ ] **Step 3: Manual QA — base chip is alive**

```bash
pnpm dev
```

Open http://localhost:3000 and verify:
- A small 3px orange pip follows the pointer over plain text. No big ring, no blend-difference flicker.
- Hovering a link (e.g., nav rail item, footer email) shows the frosted chip with a label.
- Hovering a project tile or the home featured strip shows the chip with a bigger pip and the label "View".
- Hovering the same project tile then moving onto plain text: chip body fades out, pip shrinks back to 3px.
- No console errors.

If any of these fail, fix the component before committing. Common pitfalls:
- Forgetting `'use client'` directive (already in the file above, but verify).
- Class names mismatched between TSX and CSS module.
- Inline opacity from old code overriding the CSS — the `show()` handler resets it to empty string.

- [ ] **Step 4: Commit**

```bash
git add components/chrome/cursor.tsx components/chrome/cursor.module.css
git commit -m "$(cat <<'EOF'
feat(cursor): replace dot+ring with HUD chip (base states)

Rewrites the custom cursor as a single frosted chip containing a pip
and a label span. The chip is opaque (no mix-blend-mode), so the label
text is legible on every background. Pip scales 3px / 6px / 10px across
default / link / view states. Label slides in for link/view, hidden in
default.

Same RAF lerp follow as before (0.18 factor). Same data-cursor /
data-cursor-label call-site API — no consumer edits needed.

Section glyph and active-state pulse land in follow-up commits.
EOF
)"
```

---

## Task 3: Per-section pip glyph + `/keystatic` exclusion

**Files:**
- Modify: `components/chrome/cursor.tsx` (small change to wire `pathname` → `sectionGlyph`, add `/keystatic` early return)

- [ ] **Step 1: Replace the `sectionGlyph` placeholder block**

In `components/chrome/cursor.tsx`, find this block:

```tsx
  // Pathname-driven glyph is populated in Task 3. For now, empty string
  // means "no glyph", and the pip stays a plain dot.
  const sectionGlyph = '';
  void pathname; // silence unused-var until Task 3 wires it
```

Replace it with:

```tsx
  /* Pathname-driven section glyph for the pip. Empty string keeps the
   * pip as a plain dot. The glyph only renders when state is link/view/
   * active (handled by CSS — default state hides the chip body and the
   * pip falls back to a small solid dot via state-scoped sizing). */
  const sectionGlyph = glyphForPath(pathname);
```

- [ ] **Step 2: Add the helper function below the component**

At the very bottom of `components/chrome/cursor.tsx` (after the closing brace of `CustomCursor`), append:

```tsx
function glyphForPath(pathname: string | null): string {
  if (!pathname) return '';
  if (pathname.startsWith('/work')) return '◆';
  if (pathname.startsWith('/notes')) return '◇';
  if (pathname === '/contact' || pathname.startsWith('/contact/')) return '✉';
  if (pathname.startsWith('/studio')) return '●';
  return '';
}
```

- [ ] **Step 3: Add the `/keystatic` early return**

In `components/chrome/cursor.tsx`, find the existing guard:

```tsx
  if (reduced || coarse) return null;
```

Replace it with:

```tsx
  /* Admin shell keeps native pointer — no custom chip on /keystatic/*. */
  const onAdmin = pathname?.startsWith('/keystatic') ?? false;
  if (reduced || coarse || onAdmin) return null;
```

- [ ] **Step 4: Also gate the body class effect on `onAdmin`**

The component currently sets `body.cursor-on` in a `useEffect` that runs regardless of guards. We need to skip it on admin too so the native cursor isn't hidden by `globals.css` rules. Find:

```tsx
  useEffect(() => {
    document.body.classList.add('cursor-on');
    return () => {
      document.body.classList.remove('cursor-on');
    };
  }, []);
```

Replace with:

```tsx
  useEffect(() => {
    if (reduced || coarse || onAdmin) return;
    document.body.classList.add('cursor-on');
    return () => {
      document.body.classList.remove('cursor-on');
    };
  }, [reduced, coarse, onAdmin]);
```

- [ ] **Step 5: Run typecheck**

```bash
pnpm typecheck
```

Expected: passes.

- [ ] **Step 6: Manual QA**

```bash
pnpm dev
```

Verify:
- Visit `/work` — hovering plain text, the pip is a small filled diamond `◆`. (Note: in `default` state the pip is a 3px solid dot — the glyph only becomes visible in link/view states because the pip widens to 12px. That's intentional.)
- Visit `/work/<some-project>` — same `◆`.
- Visit `/notes` — pip glyph is `◇` on link/view.
- Visit `/contact` — pip glyph is `✉` on link/view.
- Visit `/studio` — pip glyph is `●`.
- Visit `/` — no glyph swap (plain dot).
- Visit `/keystatic/branch/main/singleton/site` (already deployed admin) — the custom cursor is NOT mounted; native browser cursor is visible and able to interact normally with Keystatic UI.

- [ ] **Step 7: Commit**

```bash
git add components/chrome/cursor.tsx
git commit -m "$(cat <<'EOF'
feat(cursor): per-section pip glyph + /keystatic exclusion

Drives the chip's leading pip with a usePathname()-based glyph map:
  /work  → ◆
  /notes → ◇
  /contact → ✉
  /studio → ●
Anything else keeps the plain dot.

Also early-returns null on /keystatic/* so the admin shell keeps the
native pointer (the custom cursor would obscure Keystatic's own UI).
EOF
)"
```

---

## Task 4: Active state on mousedown

**Files:**
- Modify: `components/chrome/cursor.tsx` (add mousedown/mouseup listeners)

The CSS already responds to `data-active="1"` on the chip. This task wires it.

- [ ] **Step 1: Add the listeners inside the main effect**

In `components/chrome/cursor.tsx`, find the `loop` function definition and the lines registering listeners:

```tsx
    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', hide);
    document.addEventListener('mouseenter', show);
    raf = requestAnimationFrame(loop);
```

Replace with:

```tsx
    const onDown = () => {
      if (stateRef.current === 'link' || stateRef.current === 'view') {
        if (chipRef.current) chipRef.current.dataset['active'] = '1';
      }
    };
    const onUp = () => {
      if (chipRef.current) chipRef.current.dataset['active'] = '0';
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    document.addEventListener('mouseleave', hide);
    document.addEventListener('mouseenter', show);
    raf = requestAnimationFrame(loop);
```

- [ ] **Step 2: Add the matching cleanup**

Find the cleanup block at the end of the effect:

```tsx
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', hide);
      document.removeEventListener('mouseenter', show);
      if (raf) cancelAnimationFrame(raf);
    };
```

Replace with:

```tsx
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.removeEventListener('mouseleave', hide);
      document.removeEventListener('mouseenter', show);
      if (raf) cancelAnimationFrame(raf);
    };
```

- [ ] **Step 3: Run typecheck**

```bash
pnpm typecheck
```

Expected: passes.

- [ ] **Step 4: Manual QA**

```bash
pnpm dev
```

Click and hold on:
- A nav link — the chip pip gets a 3px outer glow ring while mouse is down; clears on release.
- A project tile — same pulse, slightly stronger shadow.
- Plain text — no pulse (correct; we only pulse on link/view targets).

- [ ] **Step 5: Commit**

```bash
git add components/chrome/cursor.tsx
git commit -m "$(cat <<'EOF'
feat(cursor): active-state pulse on mousedown over link/view targets

Adds mousedown/mouseup listeners that flip data-active='1' on the chip
while the mouse is held over a link or view target. CSS already had the
rule — this wires it.

Plain-text clicks don't trigger the pulse (intentional — only meaningful
when there's actually something to click).
EOF
)"
```

---

## Task 5: Update cheeky-label call sites

**Files:**
- Modify: `components/work/tile.tsx` (line 67)
- Modify: `components/chrome/footer.tsx` (line 26)
- Modify: `components/chrome/nav-rail.tsx` (line 24)
- Modify: `components/contact/big-email.tsx` (line 16)
- Modify: `components/contact/contact-links.tsx` (lines 10 and 23)

Five files, six string changes. One commit.

- [ ] **Step 1: `components/work/tile.tsx`**

Find:
```tsx
      data-cursor="view"
      data-cursor-label="View"
```

Replace with:
```tsx
      data-cursor="view"
      data-cursor-label="View case"
```

- [ ] **Step 2: `components/chrome/footer.tsx`**

Find (around line 22–27, only the `mailto:` anchor):
```tsx
        <a
          href={`mailto:${SITE.email}`}
          className={styles.btn}
          data-cursor="link"
          data-cursor-label="Write"
        >
```

Replace with:
```tsx
        <a
          href={`mailto:${SITE.email}`}
          className={styles.btn}
          data-cursor="link"
          data-cursor-label="Say hi"
        >
```

Leave the site-nav `data-cursor="link"` anchors below it untouched (they have no label, and the spec doesn't change them).

- [ ] **Step 3: `components/chrome/nav-rail.tsx`**

Find:
```tsx
        data-cursor="link"
        data-cursor-label="Home"
```

Replace with:
```tsx
        data-cursor="link"
        data-cursor-label="Take me home"
```

- [ ] **Step 4: `components/contact/big-email.tsx`**

Find:
```tsx
          data-cursor="link"
          data-cursor-label="Write"
```

Replace with:
```tsx
          data-cursor="link"
          data-cursor-label="Say hi"
```

- [ ] **Step 5: `components/contact/contact-links.tsx` — email anchor**

Find:
```tsx
      <a
        href={`mailto:${SITE.email}`}
        className={styles.link}
        data-cursor="link"
      >
```

Replace with:
```tsx
      <a
        href={`mailto:${SITE.email}`}
        className={styles.link}
        data-cursor="link"
        data-cursor-label="Say hi"
      >
```

- [ ] **Step 6: `components/contact/contact-links.tsx` — social anchors**

Find:
```tsx
          <a
            key={s.label}
            href={s.href}
            className={styles.link}
            data-cursor="link"
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
          >
```

Replace with:
```tsx
          <a
            key={s.label}
            href={s.href}
            className={styles.link}
            data-cursor="link"
            data-cursor-label={s.handle}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
          >
```

(The spec says `@<handle>`, but the social `handle` values in `data/site.json` already include the `@` where applicable — e.g., `@nstamour.work` for Instagram. Other entries are bare domain handles like `vimeo.com/nstamour`. Using the handle as-is matches what's already in content; no special formatting needed.)

- [ ] **Step 7: Run typecheck**

```bash
pnpm typecheck
```

Expected: passes.

- [ ] **Step 8: Manual QA**

```bash
pnpm dev
```

Hover each updated target and confirm the chip label matches:
- `/work` mosaic tile → "VIEW CASE"
- `/` page footer email button → "SAY HI"
- Nav-rail logo (the `N` mark, top-left) → "TAKE ME HOME"
- `/contact` big email link → "SAY HI"
- `/contact` social rows → each shows its own handle (e.g., "@nstamour.work")
- `/contact` email row inside the contact links list → "SAY HI"

- [ ] **Step 9: Commit**

```bash
git add components/work/tile.tsx components/chrome/footer.tsx components/chrome/nav-rail.tsx components/contact/big-email.tsx components/contact/contact-links.tsx
git commit -m "$(cat <<'EOF'
feat(cursor): cheeky labels on high-traffic targets

- work/tile          View → View case
- footer email btn   Write → Say hi
- nav-rail home mark Home → Take me home
- big-email          Write → Say hi
- contact-links email (none) → Say hi
- contact-links social anchors (none) → handle (e.g., "@nstamour.work")

Same data-cursor-label mechanism, just personality-driven copy. The
chip's frosted backing keeps the longer labels fully legible everywhere.
EOF
)"
```

---

## Task 6: Final verification

**Files:** None modified — verification only.

- [ ] **Step 1: Run typecheck**

```bash
pnpm typecheck
```

Expected: passes with no warnings.

- [ ] **Step 2: Run production build**

```bash
pnpm build
```

Expected: build completes; no SSR errors, no CSS module resolution errors. If `useReducedMotion()` / `useCoarsePointer()` raise hydration warnings, that's a pre-existing condition (the hooks return `false` server-side); investigate only if the build fails.

- [ ] **Step 3: Reduced-motion check**

In a Chromium-based browser, open DevTools → ⋮ → More tools → Rendering → set "Emulate CSS media feature prefers-reduced-motion" to `reduce`. Reload `/`. The custom cursor should not be visible; native cursor only.

- [ ] **Step 4: Coarse-pointer (touch) check**

DevTools → toggle device toolbar (mobile emulation) → reload `/`. The custom cursor should not be visible; touch interactions should work normally with the system cursor.

- [ ] **Step 5: `/keystatic` check (against running dev server)**

Visit `http://localhost:3000/keystatic/`. The custom cursor should not appear (admin keeps native pointer). The Keystatic admin shell loads normally.

- [ ] **Step 6: Cross-route glyph spot-check**

Click through `/` → `/work` → `/work/<first-project>` → `/notes` → `/contact` → `/studio` → `/`. For each route, hover an interactive element and confirm the pip glyph matches the spec table.

- [ ] **Step 7: Clean working tree, ready for PR**

```bash
git status
git log --oneline main..HEAD
```

Expected: clean working tree. Five commits on branch `feat/cursor-hud-chip`:
1. `docs(cursor): add design spec for HUD chip redesign`
2. `feat(cursor): replace dot+ring with HUD chip (base states)`
3. `feat(cursor): per-section pip glyph + /keystatic exclusion`
4. `feat(cursor): active-state pulse on mousedown over link/view targets`
5. `feat(cursor): cheeky labels on high-traffic targets`

- [ ] **Step 8: Open PR**

```bash
git push -u origin feat/cursor-hud-chip
gh pr create --title "feat(cursor): HUD chip redesign" --body "$(cat <<'EOF'
## Summary

Replaces the dot+ring+blend-difference cursor with a frosted HUD chip.
Solves label legibility (no more dark text on translucent ring over busy
media) and adds personality without breaking the existing `data-cursor`
call-site API.

## What changed

- `components/chrome/cursor.tsx` / `cursor.module.css` — full rewrite
- 5 small call-site label edits (View → View case, Write → Say hi, etc.)
- New: per-section pip glyph driven by `usePathname()` (◆/◇/✉/●)
- New: active-state pulse on `mousedown` over link/view targets
- New: cursor unmounted on `/keystatic/*` so admin keeps native pointer

## Design spec

See [docs/superpowers/specs/2026-05-26-cursor-redesign-design.md](docs/superpowers/specs/2026-05-26-cursor-redesign-design.md).

## Test plan

- [ ] Visit `/`, `/work`, `/work/<slug>`, `/notes`, `/contact`, `/studio` — chip renders correctly per section
- [ ] Hover link/view targets — chip shows proper label, pip scales
- [ ] Mousedown on link/view — pulse fires; release clears it
- [ ] `prefers-reduced-motion: reduce` (DevTools) — cursor not mounted
- [ ] Mobile emulation (coarse pointer) — cursor not mounted
- [ ] `/keystatic/*` — native cursor; admin works normally
EOF
)"
```

---

## Self-review notes

Cross-checked against [the spec](../specs/2026-05-26-cursor-redesign-design.md):

- **§Visual style** → Task 1 CSS covers every property in the table including `@supports` fallback.
- **§State machine** → Task 1 defines state-scoped rules; Task 2 wires the state name onto the chip element; Task 4 wires the active flag.
- **§Position behavior** → Task 2 implements the `0.18` lerp and the `12px+14px` offset (zero in default state).
- **§Label vocabulary** → Task 2's `onMove` resolves the label including the `→` (link fallback) and `View` (view fallback) cases; Task 5 updates the five concrete cheeky-label call sites.
- **§Per-section pip glyph** → Task 3 introduces `glyphForPath` and wires it; CSS in Task 1 already styles `.pip[data-glyph]:not([data-glyph=''])` as a glyph slot.
- **§/keystatic exclusion** → Task 3 adds both the render guard and the body-class effect guard.
- **§Reduced-motion / coarse-pointer** → preserved from the old component verbatim in Task 2.
- **§Backdrop-filter fallback** → Task 1 `@supports not (backdrop-filter: blur(1px))` block.
- **§Edge cases** → all four addressed:
  - cursor hover during scroll → no special handling (same as before, mousemove drives onMove)
  - window blur/refocus → `mouseleave` hides; `mouseenter` restores (Task 2 `hide`/`show`)
  - rapid mousedown bursts → CSS transition overrides on re-entry; documented as accepted
  - state swap during animation → property-based transitions, naturally interruptible

Placeholder scan: no TBDs, no "implement later", no "similar to Task N". Every step has either explicit code or an explicit command with expected output.

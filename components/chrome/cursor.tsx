'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useCoarsePointer, useReducedMotion } from '@/lib/hooks/useReducedMotion';
import styles from './cursor.module.css';

/**
 * Custom cursor — pointer + leashed label.
 *
 * Three positional layers, all updated each animation frame:
 *
 *   1. `.cursor`  — the cursor itself (an SVG that morphs between a
 *                   macOS-style filled triangle and a thin I-beam).
 *                   Tracks the pointer at lerp 0.5 so the visible tip
 *                   never falls behind enough to feel broken.
 *
 *   2. `.label`   — a frosted-blur pill carrying the contextual label
 *                   from `data-cursor-label`. Sits below-right of the
 *                   cursor with springy physics: visible overshoot
 *                   when the cursor stops, calibrated tight enough
 *                   that fast drags don't strand it off-screen.
 *
 *   3. `.leashSvg`— a full-viewport <svg> with a single <line> from
 *                   the cursor's centre to the pill's top-left corner
 *                   (which stays sharp; the other three corners are
 *                   rounded). Redrawn every frame against both
 *                   endpoints. Fades in/out with the label.
 *
 * States, driven by `data-cursor` on the closest ancestor of the
 * pointer target plus native text-field detection:
 *
 *   - `default`            triangle, no label, no leash.
 *   - `link` | `view`      triangle scaled 1.5×, label fades in,
 *                          leash draws to the pill. `view` adds an
 *                          accent glow.
 *   - `text`               triangle morphs to an I-beam line, no
 *                          label, no leash. Forced whenever the
 *                          pointer is over an editable input, even
 *                          if the element has no `data-cursor`
 *                          attribute — future-ready for forms.
 *   - `active` (mousedown) accent-ring pulse around the cursor tip
 *                          while held.
 *
 * Hidden entirely on coarse pointers, when prefers-reduced-motion:
 * reduce, and on the /keystatic admin shell (native pointer is
 * what the CMS expects).
 */
export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLDivElement | null>(null);
  const labelTextRef = useRef<HTMLSpanElement | null>(null);
  const leashLineRef = useRef<SVGLineElement | null>(null);
  const stateRef = useRef<string>('default');

  const reduced = useReducedMotion();
  const coarse = useCoarsePointer();
  const pathname = usePathname();

  const onAdmin = pathname?.startsWith('/keystatic') ?? false;

  /* Hide the native cursor on interactive surfaces (handled by the
   * `body.cursor-on` rules in globals.css) and seed state attributes
   * so CSS selectors have something to match before the first
   * mousemove. Mounted once per eligibility flip. */
  useEffect(() => {
    if (reduced || coarse || onAdmin) return undefined;
    document.body.classList.add('cursor-on');
    document.body.dataset['cursorState'] = 'default';
    document.body.dataset['cursorActive'] = '0';
    return () => {
      document.body.classList.remove('cursor-on');
      delete document.body.dataset['cursorState'];
      delete document.body.dataset['cursorActive'];
    };
  }, [reduced, coarse, onAdmin]);

  /* RAF loop owns all positional state. Refs are written every
   * frame; React state would re-render 60×/sec, which is the kind of
   * thing that kills cursor budgets. */
  useEffect(() => {
    if (reduced || coarse || onAdmin) return undefined;

    /* mx/my  — the actual pointer (truth)
     * cx/cy  — cursor's smoothed position (lerp toward mx/my)
     * lx/ly  — label's spring-following position
     * lvx/lvy — label's velocity vector for the spring */
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let cx = mx;
    let cy = my;
    let lx = mx;
    let ly = my;
    let lvx = 0;
    let lvy = 0;
    let raf = 0;

    /* Label is offset down-right of the cursor; spring chases this
     * moving target. Rest-state offset = leash length at rest.
     * Doubled from the first pass so the cursor → label
     * relationship reads more dramatically. */
    const LABEL_DX = 36;
    const LABEL_DY = 44;

    /* Spring constants. Stiffness K = spring force per unit of
     * offset; damping D = velocity carryover per frame (closer to
     * 1 = less damping = more overshoot).
     *
     *  - K=0.09 (halved from 0.18) → label trails further during
     *    motion; visible whip on fast moves.
     *  - D=0.82 (lower than 0.78) → less velocity bleed, so the
     *    spring rings a bit more before settling.
     *
     * Net effect: physics feel roughly twice as pronounced. The
     * label sits further from the cursor and oscillates more
     * before snapping into place. */
    const K = 0.09;
    const D = 0.82;

    /* Pointer source of truth + state derivation. Text-field
     * detection runs regardless of data-cursor so inputs always
     * win, even on a wrapping link. */
    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;

      const target = e.target as Element | null;
      let next: string;
      let label = '';

      if (isEditable(target)) {
        next = 'text';
      } else {
        const el = target?.closest?.('[data-cursor]') as HTMLElement | null;
        next = el?.dataset['cursor'] ?? 'default';
        label = el?.dataset['cursorLabel'] ?? '';
        /* Universal fallbacks for labelled states with no explicit
         * `data-cursor-label`. We use full words rather than glyphs
         * so the pill reads as "do a thing" instead of decoration:
         *   link → "Proceed"  (clickthrough to another page/action)
         *   view → "View"     (look at content in place)
         * Main nav tabs supply their own personality labels via
         * NAV.cursorLabel in content/disciplines.ts; those win. */
        if (next !== 'default' && next !== 'text' && !label) {
          label = next === 'view' ? 'View' : 'Proceed';
        }
      }

      if (stateRef.current !== next) {
        stateRef.current = next;
        /* Single source of truth for state — all three rendered
         * elements (cursor / label / leash) read this via CSS
         * selectors on body[data-cursor-state]. Beats juggling
         * three refs in lock-step. */
        document.body.dataset['cursorState'] = next;
      }
      if (labelTextRef.current && labelTextRef.current.textContent !== label) {
        labelTextRef.current.textContent = label;
      }
    };

    const onDown = () => {
      const s = stateRef.current;
      if (s === 'link' || s === 'view') {
        document.body.dataset['cursorActive'] = '1';
      }
    };
    const onUp = () => {
      document.body.dataset['cursorActive'] = '0';
    };

    const hide = () => {
      cursorRef.current?.style.setProperty('opacity', '0');
      labelRef.current?.style.setProperty('opacity', '0');
    };
    const show = () => {
      cursorRef.current?.style.removeProperty('opacity');
      labelRef.current?.style.removeProperty('opacity');
    };

    const loop = () => {
      /* Cursor: simple lerp toward the pointer. 0.5 is tight enough
       * to feel immediate without the jitter of 1:1. */
      cx += (mx - cx) * 0.5;
      cy += (my - cy) * 0.5;

      /* Label target = cursor position offset down-right. */
      const targetX = cx + LABEL_DX;
      const targetY = cy + LABEL_DY;

      /* Spring step: F = -K * (lx - targetX), then velocity *= D. */
      lvx += (targetX - lx) * K;
      lvy += (targetY - ly) * K;
      lvx *= D;
      lvy *= D;
      lx += lvx;
      ly += lvy;

      const cursor = cursorRef.current;
      if (cursor) {
        cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      }
      const label = labelRef.current;
      if (label) {
        label.style.transform = `translate3d(${lx}px, ${ly}px, 0)`;
      }
      const leash = leashLineRef.current;
      if (leash) {
        /* Endpoints in viewport coords: line from cursor centre to
         * pill top-left (which is the label element's own origin). */
        leash.setAttribute('x1', String(cx));
        leash.setAttribute('y1', String(cy));
        leash.setAttribute('x2', String(lx));
        leash.setAttribute('y2', String(ly));
      }

      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    document.addEventListener('mouseleave', hide);
    document.addEventListener('mouseenter', show);
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.removeEventListener('mouseleave', hide);
      document.removeEventListener('mouseenter', show);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced, coarse, onAdmin]);

  if (reduced || coarse || onAdmin) return null;

  return (
    <>
      {/* Leash overlay — full-viewport SVG with a single line.
       *   pointer-events: none lets all events fall through.
       *   z-index just under .cursor / .label so it paints behind. */}
      <svg
        className={styles.leashSvg}
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <line
          ref={leashLineRef}
          className={styles.leashLine}
          x1="-100"
          y1="-100"
          x2="-100"
          y2="-100"
        />
      </svg>

      {/* Cursor — triangle (default/link/view/active) or I-beam (text). */}
      <div
        ref={cursorRef}
        className={styles.cursor}
        aria-hidden="true"
        style={{ transform: 'translate3d(-100px, -100px, 0)' }}
      >
        {/* Triangle: filled, hot tip at the actual pointer origin. */}
        <svg
          className={styles.triangle}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0 0 L13 9 L7 11 L4 17 Z" />
        </svg>
        {/* I-beam: thin vertical line + serifs, fades in over text inputs. */}
        <svg
          className={styles.ibeam}
          width="14"
          height="22"
          viewBox="0 0 14 22"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M7 2 V20 M3 2 H11 M3 20 H11" />
        </svg>
        {/* Active-state pulse ring. CSS handles the keyframe; this
         * element exists so the pulse can be its own paint. */}
        <span className={styles.pulse} aria-hidden="true" />
      </div>

      {/* Label pill — leashed to the cursor by the SVG line above. */}
      <div
        ref={labelRef}
        className={styles.label}
        aria-hidden="true"
        style={{ transform: 'translate3d(-100px, -100px, 0)' }}
      >
        <span ref={labelTextRef} className={styles.labelText} />
      </div>
    </>
  );
}

/* True when the pointer target is an editable surface — drives the
 * I-beam morph. Conservative: read-only inputs and inputs that
 * aren't text-y (range/checkbox/etc.) shouldn't trigger it. */
function isEditable(target: Element | null): boolean {
  if (!target) return false;
  if (target instanceof HTMLInputElement) {
    if (target.readOnly || target.disabled) return false;
    const t = (target.type || '').toLowerCase();
    return (
      t === '' ||
      t === 'text' ||
      t === 'search' ||
      t === 'email' ||
      t === 'url' ||
      t === 'tel' ||
      t === 'password' ||
      t === 'number'
    );
  }
  if (target instanceof HTMLTextAreaElement) {
    return !target.readOnly && !target.disabled;
  }
  if (target instanceof HTMLElement && target.isContentEditable) {
    return true;
  }
  return false;
}

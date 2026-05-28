'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useCoarsePointer, useReducedMotion } from '@/lib/hooks/useReducedMotion';
import styles from './cursor.module.css';

/**
 * Custom cursor — pointer + leashed label, one unified physics sim.
 *
 * Three positional layers, all updated each animation frame:
 *
 *   1. `.cursor`  — the cursor itself (an SVG that morphs between a
 *                   macOS-style filled triangle and a thin I-beam).
 *                   Tracks the pointer at lerp 0.5 so the visible tip
 *                   never falls behind enough to feel broken.
 *
 *   2. `.leashSvg`— a full-viewport <svg> with a single <path>. The
 *                   path is a Verlet rope of N nodes with viscous
 *                   friction — it behaves like a string floating in
 *                   a thick medium. Node 0 is pinned to the *back*
 *                   of the chevron (not the tip), so the rope emits
 *                   from the back of the pointer. The last node is
 *                   the label.
 *
 *   3. `.label`   — a frosted-blur pill rendered at whatever
 *                   position the last rope node ends up at. It has
 *                   a soft attractor pulling it toward (cursor +
 *                   LABEL_OFFSET), which is its rest position. The
 *                   viscous drag on the interior rope nodes is what
 *                   makes the pill lag behind the cursor during
 *                   motion and catch up when the cursor stops.
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
  const leashPathRef = useRef<SVGPathElement | null>(null);
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

    /* mx/my — the actual pointer (truth)
     * cx/cy — cursor's smoothed position (lerp toward mx/my) */
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let cx = mx;
    let cy = my;
    let raf = 0;

    /* Chevron back — the point on the cursor SVG where the leash
     * emits from. Coordinates are in the cursor element's local
     * space (origin = chevron tip / pointer hot spot, which is
     * (0,0)). The chevron path runs M0 0 L13 9 L7 11 L4 17 Z, so
     * (8, 13) sits roughly at the back of the chevron's tail —
     * opposite the pointer tip, which is where a leash would
     * naturally tie on. */
    const CHEVRON_BACK_X = 8;
    const CHEVRON_BACK_Y = 13;

    /* Label rest position relative to the cursor's hot tip — the
     * label's top-left corner sits here when everything has
     * settled. Pulled in slightly from the older 36×44 because
     * the unified sim doesn't need the visual gap that the
     * separate spring required for the rope to read. */
    const LABEL_DX = 32;
    const LABEL_DY = 34;
    /* Viewport edge buffer (px). The label flips to the opposite
     * side of the cursor when its rest box would otherwise clip
     * past this distance from the viewport edge. Keeping it at 8
     * gives the pill a tiny visible breathing strip from the
     * window frame on every side. */
    const EDGE_MARGIN = 8;
    /* Last-measured label box. Re-measured on text changes (rare
     * — only on hover transitions). Seeded with a sensible
     * fallback so the first frame before any text is set still
     * does sane edge math. */
    let labelW = 90;
    let labelH = 28;

    /* ─── UNIFIED ROPE + LABEL PHYSICS ─────────────────────────
     *
     * The label DIV is rendered at the position of the LAST rope
     * node. There is no separate label spring — the rope's chain
     * of nodes IS the label's tether, with its own viscous
     * friction acting as a thick medium that drags the label
     * around when the cursor moves.
     *
     *   ROPE_NODES     point count (14 = smooth curve).
     *   ROPE_GRAVITY   a small downward bias so the rope curves
     *                  organically instead of looking like a wire.
     *                  Kept tiny (0.04) so it doesn't read as
     *                  "hanging".
     *   ROPE_FRICTION  viscosity coefficient. 0.18 makes the
     *                  medium feel like honey — interior nodes
     *                  resist motion strongly, which is what
     *                  produces the dragged-through-liquid feel.
     *   ROPE_ITERS     constraint relaxation passes per frame.
     *   ROPE_SLACK     segment length × this vs the straight-line
     *                  rest distance. 1.06 = enough slack for the
     *                  rope to curve during drag, not so much that
     *                  it hangs visibly slack at rest.
     *   LAST_NODE_PULL strength of the soft attractor on the
     *                  label (= last node) toward its rest
     *                  position. Low = label lingers behind the
     *                  cursor longer before catching up; high =
     *                  snaps back fast. */
    const ROPE_NODES = 14;
    const ROPE_GRAVITY = 0.04;
    const ROPE_FRICTION = 0.18;
    const ROPE_ITERS = 6;
    const ROPE_SLACK = 1.06;
    const LAST_NODE_PULL = 0.1;

    interface RopeNode {
      x: number;
      y: number;
      px: number;
      py: number;
    }

    /* Seed nodes evenly along the chevron-back → label-rest
     * vector so the first frame is already in a sensible shape. */
    const rope: RopeNode[] = [];
    {
      const sx = mx + CHEVRON_BACK_X;
      const sy = my + CHEVRON_BACK_Y;
      const ex = mx + LABEL_DX;
      const ey = my + LABEL_DY;
      for (let i = 0; i < ROPE_NODES; i++) {
        const t = i / (ROPE_NODES - 1);
        const x = sx + t * (ex - sx);
        const y = sy + t * (ey - sy);
        rope.push({ x, y, px: x, py: y });
      }
    }

    /* Adaptive segment length — base case matches the straight-
     * line distance from chevron-back to default label rest (×
     * slack). When the label flips to a different quadrant
     * (right/bottom edges), the rest distance becomes much larger
     * because labelW/H now factor in, so we lerp SEG_LEN up to
     * support that distance and back down once the cursor moves
     * away from the edge. Lerping (rather than swapping
     * instantly) makes the rope visually extend / retract over a
     * handful of frames instead of popping. With a fixed SEG_LEN
     * the constraint chain physically prevents the label from
     * reaching a far rest target — that's what caused earlier
     * edge-flips to clip past the viewport: the label was
     * mathematically aimed at the flipped position but the rope
     * couldn't stretch enough to actually get it there. */
    const DEFAULT_REST_LEN = Math.sqrt(
      (LABEL_DX - CHEVRON_BACK_X) ** 2 + (LABEL_DY - CHEVRON_BACK_Y) ** 2,
    );
    const DEFAULT_SEG_LEN = (DEFAULT_REST_LEN * ROPE_SLACK) / (ROPE_NODES - 1);
    /** Smoothing rate for SEG_LEN convergence per frame. 0.18 ≈ a
     * few hundred ms to fully extend on a flip — fast enough not
     * to feel laggy, slow enough not to pop. */
    const SEG_LERP = 0.18;
    let SEG_LEN = DEFAULT_SEG_LEN;

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
        /* Re-measure the pill on every text change so the
         * edge-flip math uses the actual rendered width/height
         * for THIS label, not a stale value from the previous
         * one. getBoundingClientRect forces a layout flush but
         * we only fire this on hover transitions (a handful of
         * times per minute, tops), so the cost is negligible.
         * An empty label collapses the pill to ~0 — keep the
         * fallback when the text is empty so the math doesn't
         * regress when the cursor is in the default state. */
        if (labelRef.current && label) {
          const r = labelRef.current.getBoundingClientRect();
          if (r.width > 0) labelW = r.width;
          if (r.height > 0) labelH = r.height;
        }
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
      /* Cursor: simple lerp toward the pointer. 0.5 is tight
       * enough to feel immediate without the jitter of 1:1. */
      cx += (mx - cx) * 0.5;
      cy += (my - cy) * 0.5;

      /* ─── UNIFIED ROPE + LABEL STEP ──────────────────────────
       *
       * 1. Verlet on every movable node (1 … N-1, including the
       *    last node which is the label). Friction bleeds off
       *    most of the velocity each frame — that's the "viscous
       *    medium" feel. Tiny gravity keeps the chain from looking
       *    mechanical. */
      for (let i = 1; i < ROPE_NODES; i++) {
        const p = rope[i]!;
        const vx = (p.x - p.px) * (1 - ROPE_FRICTION);
        const vy = (p.y - p.py) * (1 - ROPE_FRICTION);
        p.px = p.x;
        p.py = p.y;
        p.x += vx;
        p.y += vy + ROPE_GRAVITY;
      }

      /* 2. Soft attractor on the last node toward its rest
       *    position relative to the cursor. This is the only
       *    thing telling the label where it "wants" to be —
       *    without it, the chain would just drift wherever the
       *    last constraint pass happened to put it.
       *
       *    Viewport-edge flip: by default the label sits at the
       *    lower-right (cursor + LABEL_DX/DY). When the cursor
       *    nears the right edge, that rest position would push
       *    the pill off-screen — so we mirror the X offset so
       *    the label appears to the LEFT of the cursor. Same
       *    story for the bottom edge with the Y axis. Because
       *    the verlet rope is the only thing moving the label
       *    and LAST_NODE_PULL is low (0.1), the transition is
       *    naturally smooth: the rest target jumps but the
       *    label physically swings around the cursor over
       *    several frames rather than teleporting. */
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let effDX = LABEL_DX;
      let effDY = LABEL_DY;
      if (cx + LABEL_DX + labelW + EDGE_MARGIN > vw) {
        // Right edge: flip horizontally so pill sits to the LEFT.
        effDX = -LABEL_DX - labelW;
      }
      if (cy + LABEL_DY + labelH + EDGE_MARGIN > vh) {
        // Bottom edge: flip vertically so pill sits ABOVE.
        effDY = -LABEL_DY - labelH;
      }
      // Guard against the (rare) opposite edges — if the flipped
      // position would itself clip the top/left, fall back to the
      // default. Realistic only in a viewport narrower or shorter
      // than the label itself; included so the math never goes
      // pathological on tiny windows.
      if (cx + effDX < EDGE_MARGIN) effDX = LABEL_DX;
      if (cy + effDY < EDGE_MARGIN) effDY = LABEL_DY;

      /* Resize the rope to fit the current effective offset. The
       * constraint chain enforces SEG_LEN each frame, so if SEG_LEN
       * is too short the label can't reach the flipped rest target.
       * Compute the desired SEG_LEN from the current
       * chevron-back-to-label-rest distance (×slack/segments) and
       * lerp toward it so the rope smoothly grows on flip and
       * shrinks back when the cursor returns to the interior. */
      const desiredRestLen = Math.sqrt(
        (effDX - CHEVRON_BACK_X) ** 2 + (effDY - CHEVRON_BACK_Y) ** 2,
      );
      const desiredSegLen =
        (Math.max(desiredRestLen, DEFAULT_REST_LEN) * ROPE_SLACK) /
        (ROPE_NODES - 1);
      SEG_LEN += (desiredSegLen - SEG_LEN) * SEG_LERP;

      const last = rope[ROPE_NODES - 1]!;
      const restX = cx + effDX;
      const restY = cy + effDY;
      last.x += (restX - last.x) * LAST_NODE_PULL;
      last.y += (restY - last.y) * LAST_NODE_PULL;

      /* Dynamic rope length. The default SEG_LEN sizes the rope for
       * the default lower-right rest position (~47 px from the pin).
       * When the label is flipped to the opposite quadrant the rest
       * target sits ~110 px from the pin and the default rope can't
       * physically reach — the constraint pass would clamp the label
       * back toward the cursor, leaving it half off-screen. Recompute
       * the per-segment length each frame so the rope stretches just
       * enough to deliver the label to its (in-bounds) rest position.
       * The Math.max with the default ensures the rope never gets
       * SHORTER than its design length, so the resting curve still
       * has the slack/friction it needs to feel hand-tied. */
      const pinX = rope[0]!.x;
      const pinY = rope[0]!.y;
      const restDist = Math.sqrt(
        (restX - pinX) ** 2 + (restY - pinY) ** 2,
      );
      const requiredSegLen = (restDist * ROPE_SLACK) / (ROPE_NODES - 1);
      const effSegLen = Math.max(SEG_LEN, requiredSegLen);

      /* 3. Pin node 0 to the back of the chevron — the rope
       *    visibly emits from there on the pointer. */
      rope[0]!.x = cx + CHEVRON_BACK_X;
      rope[0]!.y = cy + CHEVRON_BACK_Y;

      /* 4. Distance constraint relaxation (Jakobsen). Only node 0
       *    is fully fixed — every other node moves, including the
       *    last. When the cursor jumps, the constraint chain
       *    transports the displacement down the rope toward the
       *    label; combined with viscous friction this gives the
       *    "thick medium dragging the pill" feel. */
      for (let iter = 0; iter < ROPE_ITERS; iter++) {
        for (let i = 0; i < ROPE_NODES - 1; i++) {
          const a = rope[i]!;
          const b = rope[i + 1]!;
          const sdx = b.x - a.x;
          const sdy = b.y - a.y;
          const sd = Math.sqrt(sdx * sdx + sdy * sdy) || 1e-4;
          const diff = (sd - effSegLen) / sd;
          const ox = sdx * 0.5 * diff;
          const oy = sdy * 0.5 * diff;

          if (i === 0) {
            /* Node 0 is pinned; node 1 takes the full correction. */
            b.x -= ox * 2;
            b.y -= oy * 2;
          } else {
            a.x += ox;
            a.y += oy;
            b.x -= ox;
            b.y -= oy;
          }
        }
      }

      /* 5. Render — cursor at pointer, label at the last rope
       *    node (the label IS the end of the rope), rope as a
       *    polyline through every node. */
      const cursor = cursorRef.current;
      if (cursor) {
        cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      }
      const label = labelRef.current;
      if (label) {
        const lx = rope[ROPE_NODES - 1]!.x;
        const ly = rope[ROPE_NODES - 1]!.y;
        label.style.transform = `translate3d(${lx}px, ${ly}px, 0)`;
      }
      const leash = leashPathRef.current;
      if (leash) {
        let d = `M${rope[0]!.x.toFixed(1)} ${rope[0]!.y.toFixed(1)}`;
        for (let i = 1; i < ROPE_NODES; i++) {
          d += ` L${rope[i]!.x.toFixed(1)} ${rope[i]!.y.toFixed(1)}`;
        }
        leash.setAttribute('d', d);
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
      {/* Leash overlay — full-viewport SVG with a rope <path>.
       *   pointer-events: none lets all events fall through.
       *   z-index sits just under .cursor / .label so it paints
       *   behind both. The `d` attribute is rewritten every frame
       *   by the RAF loop with a polyline through the rope nodes. */}
      <svg
        className={styles.leashSvg}
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path ref={leashPathRef} className={styles.leashPath} d="" />
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

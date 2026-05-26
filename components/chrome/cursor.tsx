'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useCoarsePointer, useReducedMotion } from '@/lib/hooks/useReducedMotion';
import styles from './cursor.module.css';

/** Pixel offset from pointer to chip top-left in link/view/active states.
 *  Keeps the label off the target so it never sits on the text/element. */
const CHIP_OFFSET = { x: 12, y: 14 } as const;

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
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const stateRef = useRef<string>('default');

  const reduced = useReducedMotion();
  const coarse = useCoarsePointer();
  const pathname = usePathname();

  /* Pathname-driven section glyph for the pip. Empty string keeps the
   * pip as a plain dot. The glyph only renders when state is link/view/
   * active (handled by CSS — default state hides the chip body and the
   * pip falls back to a small solid dot via state-scoped sizing). */
  const sectionGlyph = glyphForPath(pathname);

  /* Admin shell keeps native pointer — no custom chip on /keystatic/*. */
  const onAdmin = pathname?.startsWith('/keystatic') ?? false;

  useEffect(() => {
    if (reduced || coarse || onAdmin) return;
    document.body.classList.add('cursor-on');
    return () => {
      document.body.classList.remove('cursor-on');
    };
  }, [reduced, coarse, onAdmin]);

  useEffect(() => {
    if (reduced || coarse || onAdmin) return;

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
        // Offset the chip right/down of the actual pointer so the label
        // never sits on the target — except in default state, where we
        // keep the pip at the tip.
        const offsetX = stateRef.current === 'default' ? 0 : CHIP_OFFSET.x;
        const offsetY = stateRef.current === 'default' ? 0 : CHIP_OFFSET.y;
        chipRef.current.style.transform = `translate3d(${cx + offsetX}px, ${cy + offsetY}px, 0)`;
      }
      raf = requestAnimationFrame(loop);
    };

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
    <div
      ref={chipRef}
      className={styles.chip}
      data-state="default"
      aria-hidden="true"
      style={{ transform: 'translate3d(-100px, -100px, 0)' }}
    >
      <span className={styles.pip} data-glyph={sectionGlyph}>
        {sectionGlyph}
      </span>
      <span ref={labelRef} className={styles.label} />
    </div>
  );
}

function glyphForPath(pathname: string | null): string {
  if (!pathname) return '';
  if (pathname.startsWith('/work')) return '◆';
  if (pathname.startsWith('/notes')) return '◇';
  if (pathname === '/contact' || pathname.startsWith('/contact/')) return '✉';
  if (pathname.startsWith('/studio')) return '●';
  return '';
}

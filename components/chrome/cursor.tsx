'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useCoarsePointer, useReducedMotion } from '@/lib/hooks/useReducedMotion';
import styles from './cursor.module.css';

/**
 * Custom HUD-chip cursor — SPEC §6.2 + cursor redesign 2026-05-26.
 *
 * Structure: a zero-size root follows the pointer via a RAF lerp. Two
 * absolutely-positioned children:
 *   - pip  → centered on the pointer; scales by state and may become
 *            a section glyph (◆/◇/✉/●) on hover.
 *   - pill → anchored 12px right of the pointer; fades in on hover
 *            with the contextual label.
 *
 * This means the pip IS the cursor tip (no offset) and the pill grows
 * out beside it — visible right where the user's eye is.
 *
 * Hidden entirely on coarse pointers, when prefers-reduced-motion: reduce,
 * and on the /keystatic admin shell.
 */
export function CustomCursor() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pipRef = useRef<HTMLSpanElement | null>(null);
  const pillRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const stateRef = useRef<string>('default');

  const reduced = useReducedMotion();
  const coarse = useCoarsePointer();
  const pathname = usePathname();

  /* Pathname-driven section glyph for the pip. Empty string keeps the
   * pip as a plain dot. The glyph only surfaces on link/view states
   * (handled by CSS — default state hides it via color: transparent). */
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
        if (rootRef.current) rootRef.current.dataset['state'] = next;
      }
      if (labelRef.current) {
        /* Fallback labels: link → "→", view → "View". Otherwise use the
         * data attribute. Default state has no label regardless. */
        const resolved =
          next === 'default'
            ? ''
            : label || (next === 'view' ? 'View' : '→');
        labelRef.current.textContent = resolved;
      }
    };

    const onDown = () => {
      if (stateRef.current === 'link' || stateRef.current === 'view') {
        if (rootRef.current) rootRef.current.dataset['active'] = '1';
      }
    };
    const onUp = () => {
      if (rootRef.current) rootRef.current.dataset['active'] = '0';
    };

    const hide = () => {
      if (rootRef.current) rootRef.current.style.opacity = '0';
    };
    const show = () => {
      /* Opacity is controlled in CSS for default; reset inline to ''
       * so the CSS rule takes over again. */
      if (rootRef.current) rootRef.current.style.opacity = '';
    };

    const loop = () => {
      cx += (mx - cx) * 0.18;
      cy += (my - cy) * 0.18;
      if (rootRef.current) {
        /* Root is a zero-size element. Translating it puts the pip's
         * center (translate(-50%, -50%)) exactly on the pointer, and
         * the pill's left edge 12px to the right (its own translate). */
        rootRef.current.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
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
    <div
      ref={rootRef}
      className={styles.root}
      data-state="default"
      aria-hidden="true"
      style={{ transform: 'translate3d(-100px, -100px, 0)' }}
    >
      <span ref={pipRef} className={styles.pip} data-glyph={sectionGlyph}>
        {sectionGlyph}
      </span>
      <div ref={pillRef} className={styles.pill}>
        <span ref={labelRef} className={styles.label} />
      </div>
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

'use client';

import { useEffect, useRef } from 'react';
import { useCoarsePointer, useReducedMotion } from '@/lib/hooks/useReducedMotion';
import styles from './cursor.module.css';

/**
 * Custom blend-mode cursor — SPEC §6.2.
 *
 * Two fixed elements that follow the pointer with RAF lerps. Reads
 * `data-cursor` and `data-cursor-label` from the closest ancestor of the
 * pointer target to switch state.
 *
 * Hidden entirely on coarse pointers and when prefers-reduced-motion: reduce.
 * Mounted high in layout.tsx, alongside `body.cursor-on` which hides the
 * native cursor on interactive surfaces.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<string>('default');

  const reduced = useReducedMotion();
  const coarse = useCoarsePointer();

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
    let rx = mx;
    let ry = my;
    let dx = mx;
    let dy = my;
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
        if (ringRef.current) ringRef.current.dataset['state'] = next;
      }
      if (labelRef.current) {
        labelRef.current.textContent = label;
        labelRef.current.dataset['show'] = label ? '1' : '0';
      }
    };

    const hide = () => {
      if (dotRef.current) dotRef.current.style.opacity = '0';
      if (ringRef.current) ringRef.current.style.opacity = '0';
    };
    const show = () => {
      if (dotRef.current) dotRef.current.style.opacity = '1';
      if (ringRef.current) ringRef.current.style.opacity = '1';
    };

    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      dx += (mx - dx) * 0.55;
      dy += (my - dy) * 0.55;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      }
      if (labelRef.current) {
        labelRef.current.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
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
    <>
      <div ref={ringRef} className={styles.ring} data-state="default" aria-hidden="true" />
      <div ref={dotRef} className={styles.dot} aria-hidden="true" />
      <div ref={labelRef} className={styles.label} data-show="0" aria-hidden="true" />
    </>
  );
}

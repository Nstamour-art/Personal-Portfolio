'use client';

import { useSyncExternalStore } from 'react';

/**
 * SSR-safe reduced-motion subscription. Returns false on the server, and
 * the current value of `(prefers-reduced-motion: reduce)` on the client.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Detect coarse pointers (touch). Used together with reduced-motion to
 * decide whether to mount the custom cursor.
 */
export function useCoarsePointer(): boolean {
  return useSyncExternalStore(subscribeCoarse, getCoarseSnapshot, getServerSnapshot);
}

function subscribeCoarse(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const mql = window.matchMedia('(pointer: coarse)');
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getCoarseSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: coarse)').matches;
}

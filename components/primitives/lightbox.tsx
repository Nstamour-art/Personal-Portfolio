'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import styles from './lightbox.module.css';

export interface LightboxItem {
  src: string;
  alt: string;
  caption?: { label: string; note?: string };
}

interface LightboxProps {
  items: LightboxItem[];
  initialIndex: number;
  onClose: () => void;
}

/**
 * Full-screen image viewer used by case-study galleries.
 *
 * - Mounts at document.body via a portal so it always paints above
 *   the site chrome (nav rail, footer, custom cursor).
 * - Esc closes; ←/→ cycle through `items` (wrapping at both ends);
 *   clicking the dimmed backdrop closes; clicking the image itself
 *   never closes so users can examine without accidental dismissal.
 * - Body scroll is locked while open; the previous overflow value is
 *   restored on unmount even if the close happened mid-transition.
 * - Initial focus lands on the close button so keyboard users can
 *   dismiss immediately without tabbing.
 */
export function Lightbox({ items, initialIndex, onClose }: LightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [index, setIndex] = useState(() => clamp(initialIndex, items.length));
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const hasMany = items.length > 1;

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % items.length);
  }, [items.length]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + items.length) % items.length);
  }, [items.length]);

  /* Portal target. We only render the overlay after mount so SSR + the
   * first client paint match (no portal target on the server). */
  useEffect(() => {
    setMounted(true);
  }, []);

  /* Body scroll lock + global keyboard handlers. */
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (!hasMany) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
    }
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, next, prev, hasMany]);

  if (!mounted) return null;
  const active = items[index];
  if (!active) return null;

  return createPortal(
    <div
      className={styles.root}
      role="dialog"
      aria-modal="true"
      aria-label={active.caption?.label || 'Image viewer'}
      onClick={onClose}
    >
      <button
        ref={closeRef}
        type="button"
        className={styles.close}
        onClick={onClose}
        aria-label="Close image viewer"
        data-cursor="link"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path
            d="M1 1L13 13M13 1L1 13"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {hasMany ? (
        <button
          type="button"
          className={`${styles.nav} ${styles.navPrev}`}
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          aria-label="Previous image"
          data-cursor="link"
        >
          <span aria-hidden="true">←</span>
        </button>
      ) : null}

      <div
        className={styles.stage}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.frame}>
          {/* `unoptimized` so the lightbox shows the original — full-bleed
            * means the auto-served size from next/image is often smaller
            * than what we'd want at native pixel density. */}
          <Image
            src={active.src}
            alt={active.alt}
            fill
            sizes="100vw"
            unoptimized
            className={styles.image}
            draggable={false}
            priority
          />
        </div>
        {active.caption ? (
          <div className={styles.caption}>
            <span className={styles.captionLabel}>{active.caption.label}</span>
            {active.caption.note ? (
              <span className={styles.captionNote}>{active.caption.note}</span>
            ) : null}
            {hasMany ? (
              <span className={styles.counter}>
                {pad(index + 1)} / {pad(items.length)}
              </span>
            ) : null}
          </div>
        ) : hasMany ? (
          <div className={styles.caption}>
            <span className={styles.counter}>
              {pad(index + 1)} / {pad(items.length)}
            </span>
          </div>
        ) : null}
      </div>

      {hasMany ? (
        <button
          type="button"
          className={`${styles.nav} ${styles.navNext}`}
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          aria-label="Next image"
          data-cursor="link"
        >
          <span aria-hidden="true">→</span>
        </button>
      ) : null}
    </div>,
    document.body,
  );
}

function clamp(i: number, len: number): number {
  if (len <= 0) return 0;
  if (i < 0) return 0;
  if (i >= len) return len - 1;
  return i;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

'use client';

import type { ReactNode } from 'react';
import styles from './expandable-media.module.css';

interface ExpandableMediaProps {
  children: ReactNode;
  /** Fires when the user clicks the image or the corner expand affordance. */
  onExpand: () => void;
  /** Accessible label, e.g. "Expand image — Frame studies". */
  label: string;
  /**
   * Where the click target lives.
   *
   *  `surface` — the entire media area is clickable, with a corner
   *    icon revealed on hover/focus. Best for thumbnail-style
   *    galleries where nothing else needs clicks on the same surface.
   *
   *  `icon` — only the small corner icon is clickable. Use when the
   *    media sits beneath another interactive layer (a hero overlay
   *    with a back link / title / meta grid) that needs to keep
   *    capturing clicks across the rest of the surface. The icon is
   *    always partially visible for discoverability and brightens on
   *    hover. Defaults to `surface`.
   */
  clickArea?: 'surface' | 'icon';
}

/**
 * Wrapper that lets any media child opt into a lightbox. The actual
 * lightbox lives in <Lightbox>; this component just renders the
 * affordance and triggers `onExpand`.
 */
export function ExpandableMedia({
  children,
  onExpand,
  label,
  clickArea = 'surface',
}: ExpandableMediaProps) {
  if (clickArea === 'icon') {
    return (
      <div className={styles.wrap}>
        {children}
        <button
          type="button"
          className={styles.iconButton}
          onClick={onExpand}
          aria-label={label}
          data-cursor="view"
          data-cursor-label="Expand"
        >
          <ExpandGlyph />
        </button>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      {children}
      <button
        type="button"
        className={styles.surfaceButton}
        onClick={onExpand}
        aria-label={label}
        data-cursor="view"
        data-cursor-label="Expand"
      >
        <span className={styles.iconChip} aria-hidden="true">
          <ExpandGlyph />
        </span>
      </button>
    </div>
  );
}

/* Four diagonal arrows pointing outward from centre — the universal
 * "expand to fit" affordance. */
function ExpandGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M5.5 5.5L1.5 1.5M1.5 1.5V4M1.5 1.5H4M8.5 5.5L12.5 1.5M12.5 1.5V4M12.5 1.5H10M5.5 8.5L1.5 12.5M1.5 12.5V10M1.5 12.5H4M8.5 8.5L12.5 12.5M12.5 12.5V10M12.5 12.5H10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

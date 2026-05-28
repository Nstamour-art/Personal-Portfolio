import Link from 'next/link';
import styles from './asteroid-easter-egg.module.css';

/* Floating discovery hook for the asteroid game living at /lost-in-
 * space (which is intentionally an unmatched route — the 404 page IS
 * the game). Sits in the bottom-right of the home page only, so it
 * functions as an entry-point teaser rather than a persistent UI
 * element across the rest of the site.
 *
 * The asteroid shape is an irregular 10-vertex polygon — matching the
 * stroke-only wireframe aesthetic of the in-game asteroids drawn in
 * asteroids-game.tsx. Vertices were derived by placing 10 points
 * around a circle at 36° intervals and perturbing each radius between
 * 22 and 30, so the silhouette reads as "asteroid" at a glance
 * without being a perfect circle. The viewBox is centered on (0,0)
 * for clean rotation about the geometric center.
 *
 * Accessibility:
 *   - The link's aria-label combines the visible hint and the action,
 *     so screen reader users hear a single intelligible sentence
 *     ("Lost in space? Find the hidden game") rather than the icon
 *     and hint being announced separately.
 *   - Visual children are aria-hidden because they're decorative
 *     duplicates of what the aria-label already communicates.
 *   - The link is keyboard-focusable; focus styles are handled in
 *     the CSS module (border tint + hint reveal mirror the hover
 *     state so the keyboard path matches the pointer path). */
export function AsteroidEasterEgg() {
  return (
    <Link
      href="/lost-in-space"
      className={styles.root}
      aria-label="Lost in space? Find the hidden game."
      data-cursor="link"
      data-cursor-label="Lost?"
    >
      <span className={styles.hint} aria-hidden="true">
        Lost in space?
      </span>
      <svg
        className={styles.asteroid}
        viewBox="-32 -32 64 64"
        aria-hidden="true"
        focusable="false"
      >
        <polygon
          points="28,0 19.4,14.1 9.3,28.5 -8,24.7 -22.7,16.5 -22,0 -21.8,-15.9 -9.3,-28.5 7.7,-23.8 22.7,-16.5"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}

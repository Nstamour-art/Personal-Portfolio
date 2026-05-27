import { ArrowButton } from '@/components/primitives/arrow-button';
import { AsteroidsGame } from '@/components/error/asteroids-game';
import styles from './lost-in-space.module.css';

/* Shared 404 page body.
 *
 * Two callers render this:
 *   • app/not-found.tsx — global fallback for any unmatched URL. That
 *     file wraps this in the site chrome (NavRail / Footer / etc.)
 *     manually because Next.js renders `app/not-found.tsx` under the
 *     ROOT layout, not under app/(site)/layout.tsx.
 *   • app/(site)/not-found.tsx — fires for notFound() calls inside the
 *     (site) segment (e.g. /work/[bad-slug]). The (site) layout already
 *     supplies the chrome, so that file just renders this component
 *     bare.
 *
 * The page intentionally leads with the game — the preamble copy lives
 * inside the game's idle overlay so users don't have to scroll past a
 * tall editorial header to find the playable bit. The recovery CTAs
 * sit *below* the game (and its controls strip) so a player who
 * doesn't feel like clearing the debris can still beam straight back
 * to a real page. */

export function LostInSpace() {
  return (
    <div className={styles.page}>
      <AsteroidsGame />
      <footer className={styles.recover}>
        <p className={styles.recoverNote}>
          Done drifting? Head back to charted territory.
        </p>
        <div className={styles.recoverCtas}>
          <ArrowButton href="/" cursorLabel="Home">
            Return to base
          </ArrowButton>
          <ArrowButton href="/work" variant="ghost" cursorLabel="Browse">
            Browse the work
          </ArrowButton>
        </div>
      </footer>
    </div>
  );
}

import { ArrowButton } from '@/components/primitives/arrow-button';
import { Tile } from '@/components/work/tile';
import { PROJECTS } from '@/content/projects';
import { getFeatured } from '@/lib/content';
import { copy } from '@/lib/copy';
import styles from './featured-strip.module.css';

/**
 * Selected work strip — SPEC §6.5 (FeaturedStrip).
 * Shows the featured project first, then the next 3 by array order.
 * Falls back to the first four if nothing's marked featured.
 */
export function FeaturedStrip() {
  const featured = getFeatured();
  const rest = PROJECTS.filter((p) => p.id !== featured.id);
  const list = [featured, ...rest].slice(0, 4);

  return (
    <section className={styles.strip}>
      <div className={styles.head}>
        <div>
          <p className={styles.secLabel}>
            {copy('home.featuredEyebrow', 'Selected work')} · {list.length}
          </p>
          <h2 className={`t-h2 ${styles.headTitle}`}>
            {copy('home.featuredTitle', 'Recent projects')}
          </h2>
        </div>
        <ArrowButton href="/work" variant="ghost" cursorLabel="Browse">
          {copy('home.featuredCtaAll', 'All work')}
        </ArrowButton>
      </div>
      <div className={styles.grid}>
        {list.map((p) => (
          <Tile
            key={p.id}
            project={p}
            index={PROJECTS.indexOf(p) + 1}
            aspectRatio="16/10"
            sizes="(max-width: 880px) 100vw, 50vw"
          />
        ))}
      </div>
    </section>
  );
}

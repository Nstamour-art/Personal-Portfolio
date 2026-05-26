import Link from 'next/link';
import { Fragment } from 'react';
import { ArrowButton } from '@/components/primitives/arrow-button';
import { VideoHero } from '@/components/primitives/video-hero';
import { SITE } from '@/content/site';
import { getFeatured } from '@/lib/content';
import { copy } from '@/lib/copy';
import styles from './hero-marquee.module.css';

/**
 * Loop hero — SPEC §6.5.
 * Full-bleed scrolling marquee strip (SITE.marquee) over a 60/40 split:
 * the featured project's pitch + a click-to-play peek tile on the right.
 *
 * Server component — the marquee animates via CSS, the inner VideoHero
 * is the only client island here.
 */
export function HeroMarquee() {
  const featured = getFeatured();
  const words = SITE.marquee.length > 0 ? SITE.marquee : ['Motion', '3D', 'Process'];
  const headline = featured.pitch ?? featured.brief;

  return (
    <section className={styles.hero}>
      <div className={styles.track} aria-hidden="true">
        <span className={styles.inner}>
          {/* Render the word list twice so the -50% translate is seamless. */}
          {[...words, ...words].map((w, i) => (
            <Fragment key={i}>
              <span className={`${styles.word} marquee-word ${i % 2 === 0 ? '' : styles.ghost}`}>
                {w}
              </span>
              <span className={styles.sep} />
            </Fragment>
          ))}
        </span>
      </div>

      <div className={styles.below}>
        <div>
          <p className={styles.secLabel}>
            {copy('home.loopFeaturedEyebrow', 'Featured project')}
          </p>
          <h2 className={`t-h2 ${styles.headline} hero-title`}>{headline}</h2>
          <p className={`t-body ${styles.brief}`}>{featured.brief}</p>
          <ArrowButton
            href={`/work/${featured.id}`}
            cursorLabel="Open case"
          >
            Open the case study
          </ArrowButton>
        </div>

        <Link
          href={`/work/${featured.id}`}
          className={styles.peek}
          data-cursor="view"
          data-cursor-label="View"
        >
          <VideoHero
            project={featured}
            sizes="(max-width: 880px) 100vw, 60vw"
            priority
          />
          <div className={styles.peekLabel}>
            <div>
              <div className={styles.peekSub}>{featured.sub}</div>
              <div className={`${styles.peekTitle} tile-title`}>{featured.title}</div>
            </div>
            <div className={styles.peekYear}>{featured.year}</div>
          </div>
        </Link>
      </div>
    </section>
  );
}

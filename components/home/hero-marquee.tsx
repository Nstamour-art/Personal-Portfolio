import Image from 'next/image';
import Link from 'next/link';
import { Fragment } from 'react';
import { ArrowButton } from '@/components/primitives/arrow-button';
import { VideoHero } from '@/components/primitives/video-hero';
import { SITE } from '@/content/site';
import { getFeatured } from '@/lib/content';
import { copy } from '@/lib/copy';

import styles from './hero-marquee.module.css';

/**
 * Home hero — identity + marquee + featured peek.
 *
 * The identity row uses ONE layered composition across all viewports
 * (mobile, tablet, desktop): name on the left, transparent portrait
 * filling the right, dithered orange bloom behind the figure, marquee
 * scrolling across the bottom of the row, and a hairline divider at
 * the row's bottom edge that aligns with the avatar's shoulder line
 * and closes off the bloom.
 *
 * Stacking, from back to front inside `.identityRow`:
 *   1. `.bloom`    — dot-dither halftone behind the figure (z:0)
 *   2. `.track`    — scrolling word strip, bleeds to the viewport
 *                    gutters, bottom-aligned to the divider (z:1)
 *   3. `.divider`  — 1px hairline at the row's bottom, sits above the
 *                    marquee so it cleanly cuts off the gradient (z:2)
 *   4. `.identity` — name + role, top-left, in normal flow (z:3)
 *   5. `.avatar`   — transparent portrait PNG, right-anchored, fills
 *                    the row height, overlaps the marquee with its
 *                    head + shoulders (z:4)
 *
 * Sizes scale fluidly via clamp() — the same composition gets smaller
 * on mobile, larger on ultrawide, without changing the layout.
 *
 * Server component — the marquee animates via CSS only.
 */
export function HeroMarquee() {
  const featured = getFeatured();
  const words = SITE.marquee.length > 0 ? SITE.marquee : ['Motion', '3D', 'Process'];
  const headline = featured.pitch ?? featured.brief;
  const avatarSrc = SITE.avatar?.src;
  // U+2011 NON-BREAKING HYPHEN — visually identical to "-" (U+002D) but
  // disallows line breaks. Ensures "Nicolas St-Amour" only ever wraps
  // at the space between "Nicolas" and "St-Amour", never inside the
  // surname. Other surfaces (page <title>, alt text, footer) keep the
  // ASCII hyphen so search and copy-paste continue to work normally.
  const displayName = SITE.name.replace(/-/g, '\u2011');
  // Role rendered as individual characters so flex space-between can
  // distribute them across the same width as the name above. See
  // `.identityRole` / `.roleChar` in hero-marquee.module.css and the
  // `aria-label` on the <p> so screen readers still hear "Creative
  // Technologist" as one phrase instead of letter-by-letter.
  const roleChars = Array.from(SITE.role);

  return (
    <section className={styles.hero} aria-labelledby="site-hero-name">
      <div className={styles.identityRow}>
        {/* Layer 1 — bloom (z:0). Large-dot halftone via radial-gradient
         * tiles, masked to a right-biased ellipse so the dots
         * concentrate behind the figure and dissolve toward the left
         * and the row's edges. `bottom: 0` aligns its lower edge with
         * the divider so the gradient terminates cleanly. */}
        <div className={styles.bloom} aria-hidden="true" />

        {/* Layer 2 — marquee track (z:1). Absolutely positioned along
         * the row's bottom, bleeds past the hero's gutters to the
         * viewport edges. Font scales with viewport so the cap-height
         * always reaches into the avatar's mid-ear range. */}
        <div className={styles.track} aria-hidden="true">
          <span className={styles.inner}>
            {/* Render twice so the -50% translate is seamless. */}
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

        {/* Layer 3 — divider (z:2). 1px hairline at the row's bottom
         * edge, bleeds to the viewport gutters. Sits above the marquee
         * so it visually cuts off both the bloom and the marquee text. */}
        <div className={styles.divider} aria-hidden="true" />

        {/* Layer 4 — identity (z:3). Name + role at the top-left of
         * the row, in normal flow. Width is constrained so it never
         * collides with the avatar slot on the right. */}
        <header className={styles.identity}>
          <h1 id="site-hero-name" className={styles.identityName}>
            {displayName}
          </h1>
          <p className={styles.identityRole} aria-label={SITE.role}>
            {roleChars.map((char, i) => (
              <span key={i} aria-hidden="true" className={styles.roleChar}>
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </p>
        </header>

        {/* Layer 5 — avatar (z:4). Anchored to the viewport's right
         * edge (escapes the hero's right gutter), fills the row's full
         * height, contains the transparent portrait. */}
        {typeof avatarSrc === 'string' && avatarSrc ? (
          <div className={styles.avatar}>
            <Image
              src={avatarSrc}
              alt={SITE.avatar.alt || SITE.name}
              fill
              sizes="(max-width: 480px) 70vw, (max-width: 1024px) 62vw, (max-width: 1640px) 60vw, 2000px"
              className={styles.avatarImg}
              priority
            />
          </div>
        ) : null}
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

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowButton } from '@/components/primitives/arrow-button';
import { Tile } from '@/components/work/tile';
import { PROJECTS } from '@/content/projects';
import { getFeatured } from '@/lib/content';
import { copy } from '@/lib/copy';
import styles from './featured-strip.module.css';

/**
 * Selected work carousel — SPEC §6.5 (FeaturedStrip).
 * Featured project first, then the next four by file order, capped at 5.
 * Falls back to the first five if nothing's marked featured.
 *
 * Layout: horizontal scroll-snap carousel with prev/next controls in the
 * head. Tiles use a portrait 4/5 aspect so each slide reads as a tall,
 * statement card rather than a small grid cell. Native scroll on touch,
 * keyboard-accessible buttons on desktop.
 */
export function FeaturedStrip() {
  const featured = getFeatured();
  const rest = PROJECTS.filter((p) => p.id !== featured.id);
  const list = [featured, ...rest].slice(0, 5);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  /* Track scroll position so prev/next can dim at the edges. The 2px
   * fudge handles sub-pixel rounding on hi-dpi displays. */
  const updateEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 2);
    setCanNext(el.scrollLeft < max - 2);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateEdges();
    el.addEventListener('scroll', updateEdges, { passive: true });
    window.addEventListener('resize', updateEdges);
    return () => {
      el.removeEventListener('scroll', updateEdges);
      window.removeEventListener('resize', updateEdges);
    };
  }, [updateEdges]);

  /* Step by exactly one slide so the snap point lines up with the next
   * tile's left edge regardless of the current peek width. */
  const scrollByOne = useCallback((dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const slide = el.querySelector<HTMLElement>(`.${styles.slide}`);
    const gap = parseFloat(getComputedStyle(el).columnGap || '0') || 0;
    const step = (slide?.offsetWidth ?? el.clientWidth * 0.7) + gap;
    el.scrollBy({ left: step * dir, behavior: 'smooth' });
  }, []);

  return (
    <section className={styles.strip}>
      <div className={styles.head}>
        <div className={styles.headLead}>
          <p className={styles.secLabel}>
            {copy('home.featuredEyebrow', 'Selected work')} · {list.length}
          </p>
          <h2 className={`t-h2 ${styles.headTitle}`}>
            {copy('home.featuredTitle', 'Recent projects')}
          </h2>
        </div>
        <div className={styles.controls}>
          <div className={styles.nav} aria-label="Carousel navigation">
            <button
              type="button"
              className={styles.navBtn}
              onClick={() => scrollByOne(-1)}
              disabled={!canPrev}
              aria-label="Previous project"
              data-cursor="link"
              data-cursor-label="Prev"
            >
              <span aria-hidden="true">←</span>
            </button>
            <button
              type="button"
              className={styles.navBtn}
              onClick={() => scrollByOne(1)}
              disabled={!canNext}
              aria-label="Next project"
              data-cursor="link"
              data-cursor-label="Next"
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>
          <ArrowButton href="/work" variant="ghost" cursorLabel="Browse">
            {copy('home.featuredCtaAll', 'All work')}
          </ArrowButton>
        </div>
      </div>
      <div
        ref={trackRef}
        className={styles.track}
        role="region"
        aria-roledescription="carousel"
        aria-label={copy('home.featuredTitle', 'Recent projects')}
      >
        {list.map((p) => (
          <Tile
            key={p.id}
            project={p}
            index={PROJECTS.indexOf(p) + 1}
            aspectRatio="4/5"
            sizes="(max-width: 880px) 78vw, (max-width: 1400px) 32vw, 440px"
            className={styles.slide}
          />
        ))}
      </div>
    </section>
  );
}

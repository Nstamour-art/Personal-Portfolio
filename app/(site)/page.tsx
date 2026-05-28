import { AsteroidEasterEgg } from '@/components/home/asteroid-easter-egg';
import { FeaturedStrip } from '@/components/home/featured-strip';
import { HeroMarquee } from '@/components/home/hero-marquee';
import { NotesStrip } from '@/components/home/notes-strip';

/* The home page hero (identity + marquee + featured peek) now lives
 * inside a single `HeroMarquee` section — the old `SiteHeader` block
 * has been absorbed so the avatar can layer over the marquee in one
 * stacking context. See components/home/hero-marquee.tsx for the
 * layered composition.
 *
 * AsteroidEasterEgg is a fixed-position floating link in the bottom-
 * right of the viewport. It only mounts on the home page so it reads
 * as an entry-point discovery hook rather than a persistent overlay
 * across the site. Clicking it routes to /lost-in-space — an
 * intentionally unmatched URL whose name matches the 404 page's
 * actual `metadata.title`, so the destination feels intentional and
 * the asteroid game becomes a planned easter egg rather than a
 * broken-link surprise. */
export default function HomePage() {
  return (
    <>
      <HeroMarquee />
      <FeaturedStrip />
      <NotesStrip />
      <AsteroidEasterEgg />
    </>
  );
}

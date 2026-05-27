import { FeaturedStrip } from '@/components/home/featured-strip';
import { HeroMarquee } from '@/components/home/hero-marquee';
import { NotesStrip } from '@/components/home/notes-strip';

/* The home page hero (identity + marquee + featured peek) now lives
 * inside a single `HeroMarquee` section — the old `SiteHeader` block
 * has been absorbed so the avatar can layer over the marquee in one
 * stacking context. See components/home/hero-marquee.tsx for the
 * layered composition. */
export default function HomePage() {
  return (
    <>
      <HeroMarquee />
      <FeaturedStrip />
      <NotesStrip />
    </>
  );
}

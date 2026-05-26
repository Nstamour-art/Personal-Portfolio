import { FeaturedStrip } from '@/components/home/featured-strip';
import { HeroMarquee } from '@/components/home/hero-marquee';
import { NotesStrip } from '@/components/home/notes-strip';
import { SiteHeader } from '@/components/home/site-header';

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <HeroMarquee />
      <FeaturedStrip />
      <NotesStrip />
    </>
  );
}

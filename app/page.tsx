import { FeaturedStrip } from '@/components/home/featured-strip';
import { HeroMarquee } from '@/components/home/hero-marquee';
import { NotesStrip } from '@/components/home/notes-strip';

export default function HomePage() {
  return (
    <>
      <HeroMarquee />
      <FeaturedStrip />
      <NotesStrip />
    </>
  );
}

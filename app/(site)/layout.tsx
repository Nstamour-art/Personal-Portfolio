import { Analytics } from '@vercel/analytics/next';
import { Announcement } from '@/components/chrome/announcement';
import { CustomCursor } from '@/components/chrome/cursor';
import { Footer } from '@/components/chrome/footer';
import { NavRail } from '@/components/chrome/nav-rail';
import { PageTransition } from '@/components/chrome/page-transition';

/* Site-scope layout. Everything that visually identifies the public
 * portfolio lives here — nav rail, page transitions, custom cursor,
 * footer, analytics. The /keystatic admin route is intentionally
 * outside this layout so it never inherits site chrome.
 *
 * `nav-rail-mode` reserves left padding for the fixed nav rail.
 * `caps` triggers the uppercase typography mode on display headings
 * and selected marker classes.
 */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="nav-rail-mode caps">
      <Announcement />
      <CustomCursor />
      <NavRail />
      <PageTransition>{children}</PageTransition>
      <Footer />
      <Analytics />
    </div>
  );
}

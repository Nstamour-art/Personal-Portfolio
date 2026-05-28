import { Analytics } from '@vercel/analytics/next';
import { Announcement } from '@/components/chrome/announcement';
import { CustomCursor } from '@/components/chrome/cursor';
import { Footer } from '@/components/chrome/footer';
import { NavRail } from '@/components/chrome/nav-rail';
import { PageTransition } from '@/components/chrome/page-transition';
import { getVisibleNav } from '@/lib/content';

/* Site-scope layout. Everything that visually identifies the public
 * portfolio lives here — nav rail, page transitions, custom cursor,
 * footer, analytics. The /keystatic admin route is intentionally
 * outside this layout so it never inherits site chrome.
 *
 * `nav-rail-mode` reserves left padding for the fixed nav rail.
 * `caps` triggers the uppercase typography mode on display headings
 * and selected marker classes.
 *
 * The visible navigation is computed once here (server-side) and
 * threaded into both the rail and the footer, so any content-driven
 * tab visibility — currently just the Notes auto-hide when the
 * notes collection is empty — stays in sync between the two surfaces.
 */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nav = getVisibleNav();
  return (
    <div className="nav-rail-mode caps">
      <Announcement />
      <CustomCursor />
      <NavRail nav={nav} />
      <PageTransition>{children}</PageTransition>
      <Footer nav={nav} />
      <Analytics />
    </div>
  );
}

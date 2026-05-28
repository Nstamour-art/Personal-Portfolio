import type { Metadata } from 'next';
import { Announcement } from '@/components/chrome/announcement';
import { CustomCursor } from '@/components/chrome/cursor';
import { Footer } from '@/components/chrome/footer';
import { NavRail } from '@/components/chrome/nav-rail';
import { PageTransition } from '@/components/chrome/page-transition';
import { LostInSpace } from '@/components/error/lost-in-space';
import { getVisibleNav } from '@/lib/content';

/* Global 404 — Next.js routes truly unmatched URLs to app/not-found.tsx
 * at the ROOT (it does not cascade into route groups for unmatched URLs;
 * only notFound() calls walk the segment tree). The root not-found
 * renders directly under app/layout.tsx, so we re-create the site
 * chrome inline here to match what (site)/layout.tsx provides.
 *
 * Without this, hitting `/anything-broken` would show Next's default
 * black-and-white "404: This page could not be found." instead of the
 * themed minigame. */

export const metadata: Metadata = {
  title: 'Lost in space — 404',
  description: 'The page drifted into the void. Clear the debris and head back to base.',
};

export default function GlobalNotFound() {
  const nav = getVisibleNav();
  return (
    <div className="nav-rail-mode caps">
      <Announcement />
      <CustomCursor />
      <NavRail nav={nav} />
      <PageTransition>
        <LostInSpace />
      </PageTransition>
      <Footer nav={nav} />
    </div>
  );
}

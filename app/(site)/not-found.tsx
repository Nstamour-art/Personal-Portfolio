import type { Metadata } from 'next';
import { LostInSpace } from '@/components/error/lost-in-space';

/* In-segment 404 — fires when a (site) page calls notFound() (e.g.
 * /work/[bad-slug], /notes/[bad-slug]). The (site) layout already
 * wraps this with the nav rail, footer, custom cursor, etc., so we
 * just render the shared body.
 *
 * The root app/not-found.tsx handles globally unmatched URLs and
 * applies the chrome manually since Next.js renders root not-found
 * outside the (site) layout. */

export const metadata: Metadata = {
  title: 'Lost in space — 404',
  description: 'The page drifted into the void. Clear the debris and head back to base.',
};

export default function NotFound() {
  return <LostInSpace />;
}

import type { Metadata } from 'next';

/* Server layout for the admin route — only purpose is to set page
 * metadata. The actual UI is rendered by `[[...params]]/page.tsx`,
 * which mounts Keystatic's <makePage> client component.
 *
 * `noindex, nofollow` is also set globally via middleware.ts on the
 * /keystatic and /api/keystatic prefixes, so this is defence-in-depth.
 */
export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

export default function KeystaticLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

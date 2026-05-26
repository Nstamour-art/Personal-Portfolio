'use client';

import Link from 'next/link';
import { makePage } from '@keystatic/next/ui/app';
import keystaticConfig from '@/keystatic.config';
import '../admin.css';

/* `force-dynamic` ensures the admin is never statically cached — every
 * request hits middleware.ts so the kill-switch, IP allowlist, and rate
 * limit all apply. */
export const dynamic = 'force-dynamic';

/* Keystatic's makePage returns a zero-prop client component. It reads
 * the current admin route from `next/navigation`'s `useParams` hook
 * internally, so we don't need to forward params. */
const KeystaticPage = makePage(keystaticConfig);

/* Wrap so we can layer a persistent "Back to site" escape hatch over
 * the Keystatic shell. Keystatic has no slot for site-level chrome,
 * so this lives as a fixed-position pill that's always visible. */
export default function AdminPage() {
  return (
    <>
      <Link
        href="/"
        className="adm-back"
        aria-label="Return to the public site"
      >
        <span className="adm-back-arrow" aria-hidden="true">
          ←
        </span>
        Back to site
      </Link>
      <KeystaticPage />
    </>
  );
}

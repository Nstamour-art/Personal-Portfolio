'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV } from '@/content/disciplines';
import { SITE } from '@/content/site';
import styles from './nav-rail.module.css';

/**
 * Vertical navigation rail — SPEC §6.1.
 * 76px wide, fixed left, glass blur backdrop. Body must have
 * `nav-rail-mode` class so page content clears the rail (set in layout.tsx).
 */
export function NavRail() {
  const pathname = usePathname();
  const activeId = navIdForPath(pathname);

  return (
    <nav className={styles.rail} aria-label="Primary">
      <Link
        href="/"
        className={styles.brandMark}
        data-cursor="link"
        data-cursor-label="Take me home"
        aria-label={`${SITE.name} — home`}
      >
        {SITE.initials}
      </Link>
      <div className={styles.links}>
        {NAV.map((n) => {
          const isActive = activeId === n.id;
          return (
            <Link
              key={n.id}
              className={styles.link}
              href={n.path}
              data-cursor="link"
              data-active={isActive ? 'true' : 'false'}
              aria-current={isActive ? 'page' : undefined}
            >
              {n.label}
            </Link>
          );
        })}
      </div>
      <div className={styles.meta} aria-hidden="true">
        {SITE.name}
      </div>
    </nav>
  );
}

function navIdForPath(pathname: string): string {
  if (pathname === '/' || pathname === '') return 'index';
  if (pathname.startsWith('/work')) return 'work';
  if (pathname.startsWith('/notes')) return 'notes';
  if (pathname.startsWith('/studio') || pathname.startsWith('/about')) return 'about';
  if (pathname.startsWith('/contact')) return 'contact';
  return '';
}

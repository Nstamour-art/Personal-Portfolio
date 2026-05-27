'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV } from '@/content/disciplines';
import { SITE } from '@/content/site';
import styles from './nav-rail.module.css';

/**
 * Vertical navigation rail — SPEC §6.1.
 *
 * Desktop (≥720px): 76px-wide fixed left rail with stacked vertical
 * link labels and a glass-blur backdrop. Body must have
 * `nav-rail-mode` class so page content clears the rail (set in
 * layout.tsx).
 *
 * Mobile (<720px): the rail collapses to a 56px top bar with the
 * brand mark on the left and a hamburger toggle on the right. The
 * toggle opens a full-screen overlay menu (disclosure pattern) with
 * large tap targets, an active-route indicator, and a "Say hi" email
 * link in the footer. The overlay closes on:
 *   - tap on a link (route change effect)
 *   - tap on the empty backdrop
 *   - Escape key
 *   - tap on the hamburger (now showing an X)
 * Body scroll is locked while the menu is open. The overlay uses
 * `inert` when closed so it's invisible to keyboard tab order, screen
 * readers, and pointer events without needing `display: none`
 * (which would block the open/close transition).
 */
export function NavRail() {
  const pathname = usePathname();
  const activeId = navIdForPath(pathname);

  const [open, setOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  /* Close the menu on every route change. `pathname` is stable per
   * route, so this effect runs exactly once when the user navigates. */
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  /* Escape closes the menu and returns focus to the toggle so
   * keyboard users land back where they were. */
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        hamburgerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  /* Body scroll lock — important on iOS where the overlay would
   * otherwise allow the page underneath to rubber-band scroll. */
  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  /* When the menu opens, move focus to the first link inside so
   * keyboard users don't have to tab past invisible content. The
   * toggle keeps focus when closing (it's the same element being
   * pressed), so no restore needed there. */
  useEffect(() => {
    if (!open) return;
    const first = overlayRef.current?.querySelector<HTMLAnchorElement>(
      'a[href]',
    );
    first?.focus();
  }, [open]);

  return (
    <>
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

        <button
          ref={hamburgerRef}
          type="button"
          className={styles.hamburger}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
          data-open={open ? 'true' : 'false'}
          data-cursor="link"
          data-cursor-label={open ? 'Close' : 'Menu'}
          onClick={() => setOpen((o) => !o)}
        >
          <span className={styles.bun} aria-hidden="true" />
          <span className={styles.bun} aria-hidden="true" />
          <span className={styles.bun} aria-hidden="true" />
        </button>
      </nav>

      <div
        ref={overlayRef}
        id="mobile-menu"
        className={styles.overlay}
        data-open={open ? 'true' : 'false'}
        aria-hidden={!open}
        inert={!open}
      >
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Close menu"
          tabIndex={-1}
          onClick={() => {
            setOpen(false);
            hamburgerRef.current?.focus();
          }}
        />

        <ul className={styles.overlayLinks}>
          {NAV.map((n) => {
            const isActive = activeId === n.id;
            return (
              <li key={n.id}>
                <Link
                  href={n.path}
                  className={styles.overlayLink}
                  data-active={isActive ? 'true' : 'false'}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {n.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {SITE.email ? (
          <a
            href={`mailto:${SITE.email}`}
            className={styles.overlayContact}
          >
            {SITE.email}
          </a>
        ) : null}
      </div>
    </>
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

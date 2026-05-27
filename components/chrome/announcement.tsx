import { ANNOUNCEMENT, shouldShowAnnouncement } from '@/content/announcement';
import styles from './announcement.module.css';

/**
 * Sitewide announcement banner.
 *
 * Renders only when the Keystatic "Announcement bar" singleton has
 * `enabled` checked AND a non-empty message. Returns `null` otherwise
 * so the banner contributes zero DOM and zero layout when off.
 *
 * Mounted from `app/(site)/layout.tsx` above the nav rail, so it
 * never appears on the /keystatic admin route.
 */
export function Announcement() {
  if (!shouldShowAnnouncement()) return null;

  const { message, ctaLabel, ctaHref } = ANNOUNCEMENT;
  const cta = ctaLabel.trim() && ctaHref.trim()
    ? { label: ctaLabel.trim(), href: ctaHref.trim() }
    : null;
  const isExternal = cta?.href.startsWith('http') ?? false;

  return (
    <aside className={styles.bar} role="region" aria-label="Site announcement">
      <p className={styles.message}>{message}</p>
      {cta ? (
        <a
          className={styles.cta}
          href={cta.href}
          data-cursor="link"
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
        >
          {cta.label}
          <span className={styles.arrow} aria-hidden="true">
            →
          </span>
        </a>
      ) : null}
    </aside>
  );
}

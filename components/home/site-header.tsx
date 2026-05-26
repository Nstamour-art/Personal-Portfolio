import Image from 'next/image';
import { SITE } from '@/content/site';
import styles from './site-header.module.css';

/**
 * Home hero identity header.
 *
 * Sits above the marquee on the index page and grounds the site in
 * the person behind it: full name + personal role on the left, round
 * avatar (or accent-coloured initial fallback) on the right.
 *
 * Server component — purely presentational.
 */
export function SiteHeader() {
  const avatarSrc = SITE.avatar?.src;

  return (
    <section className={styles.header} aria-labelledby="site-header-name">
      <div className={styles.text}>
        <h1 id="site-header-name" className={styles.name}>
          {SITE.name}
        </h1>
        <p className={styles.role}>{SITE.role}</p>
      </div>

      <div
        className={styles.avatar}
        aria-hidden={avatarSrc ? undefined : 'true'}
      >
        {typeof avatarSrc === 'string' && avatarSrc ? (
          <Image
            src={avatarSrc}
            alt={SITE.avatar.alt || SITE.name}
            fill
            sizes="(max-width: 720px) 80px, 128px"
            className={styles.avatarImg}
            priority
          />
        ) : (
          <span className={styles.avatarFallback}>{SITE.initials}</span>
        )}
      </div>
    </section>
  );
}

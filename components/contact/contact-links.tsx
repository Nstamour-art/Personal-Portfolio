import { SITE } from '@/content/site';
import styles from './contact-links.module.css';

export function ContactLinks() {
  return (
    <div className={styles.links}>
      <a
        href={`mailto:${SITE.email}`}
        className={styles.link}
        data-cursor="link"
        data-cursor-label="Say hi"
      >
        <div className={styles.k}>Email</div>
        <div className={styles.v}>{SITE.email}</div>
        <div className={styles.arr} aria-hidden="true">↗</div>
      </a>
      {SITE.socials.map((s) => {
        const isExternal = s.href !== '#';
        return (
          <a
            key={s.label}
            href={s.href}
            className={styles.link}
            data-cursor="link"
            data-cursor-label={s.handle}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
          >
            <div className={styles.k}>{s.label}</div>
            <div className={styles.v}>{s.handle}</div>
            <div className={styles.arr} aria-hidden="true">↗</div>
          </a>
        );
      })}
    </div>
  );
}

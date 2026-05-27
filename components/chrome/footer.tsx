import Link from 'next/link';
import { NAV } from '@/content/disciplines';
import { SITE } from '@/content/site';
import { copy, template } from '@/lib/copy';
import styles from './footer.module.css';

/**
 * Site footer — SPEC §6 (footer block) + EDITORIAL.footer.
 * Server component: no client interactivity needed beyond hover/transition CSS.
 */
export function Footer() {
  const rights = template(copy('footer.rightsTemplate', "© {name} — Folio '26"), {
    name: SITE.name,
  });

  return (
    <footer className={styles.foot}>
      <div className={styles.ctaCol}>
        <div className={`${styles.big} footer-big`}>
          {copy('footer.ctaHeadline', 'Have a brief that lives in two disciplines?')}
        </div>
        <a
          href={`mailto:${SITE.email}`}
          className={styles.btn}
          data-cursor="link"
          data-cursor-label="Say hi"
        >
          {SITE.email}
          <span className={styles.arr} aria-hidden="true">
            →
          </span>
        </a>
      </div>

      <div className={styles.col}>
        <h5>{copy('footer.siteHead', 'Site')}</h5>
        <ul>
          {NAV.map((n) => (
            <li key={n.id}>
              <Link href={n.path} data-cursor="link" data-cursor-label={n.cursorLabel}>
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.col}>
        <h5>{copy('footer.elsewhereHead', 'Elsewhere')}</h5>
        <ul>
          {SITE.socials.map((s) => (
            <li key={s.label}>
              {s.href === '#' ? (
                <span>{s.label}</span>
              ) : (
                <a
                  href={s.href}
                  data-cursor="link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {s.label}
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.col}>
        <h5>{copy('footer.colophonHead', 'Colophon')}</h5>
        <ul>
          {copy<string[]>('footer.colophon', []).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className={styles.bottom}>
        <div>{rights}</div>
        <div>{SITE.location}</div>
      </div>
    </footer>
  );
}

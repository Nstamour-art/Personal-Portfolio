import { SITE } from '@/content/site';
import { SKILLS } from '@/content/skills';
import { copy } from '@/lib/copy';
import styles from './cv-sidebar.module.css';

/* Right column of the /studio CV. Three optional blocks: Contact,
 * "What I bring" (from editorial.about.practiceLines), and Skills.
 * Each block hides itself if the underlying content is empty. */
export function CvSidebar() {
  const practiceLabel = copy('about.practiceLabel', 'What I bring');
  const practiceLines = copy<string[]>('about.practiceLines', []);

  return (
    <div className={styles.sidebar}>
      <section className={styles.block}>
        <p className={`t-eyebrow ${styles.head}`}>Contact</p>
        <ul className={styles.contact}>
          {SITE.email ? (
            <li>
              <span className={styles.k}>Email</span>
              <a
                href={`mailto:${SITE.email}`}
                className={styles.v}
                data-cursor="link"
              >
                {SITE.email}
              </a>
            </li>
          ) : null}
          {SITE.location ? (
            <li>
              <span className={styles.k}>Location</span>
              <span className={styles.v}>{SITE.location}</span>
            </li>
          ) : null}
          {SITE.socials.map((s) => (
            <li key={`${s.label}-${s.handle}`}>
              <span className={styles.k}>{s.label}</span>
              {s.href && s.href !== '#' ? (
                <a
                  href={s.href}
                  className={styles.v}
                  target="_blank"
                  rel="noreferrer"
                  data-cursor="link"
                >
                  {s.handle}
                </a>
              ) : (
                <span className={styles.v}>{s.handle}</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {practiceLines.length > 0 ? (
        <section className={styles.block}>
          <p className={`t-eyebrow ${styles.head}`}>{practiceLabel}</p>
          <ul className={styles.bring}>
            {practiceLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {SKILLS.length > 0 ? (
        <section className={styles.block}>
          <p className={`t-eyebrow ${styles.head}`}>Skills</p>
          {SKILLS.map((group) => (
            <div key={group.h} className={styles.skillGroup}>
              <h4 className={styles.skillH}>{group.h}</h4>
              <ul className={styles.skillList}>
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}

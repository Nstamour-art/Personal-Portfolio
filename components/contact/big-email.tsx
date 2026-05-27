'use client';

import { Magnetic } from '@/components/chrome/magnetic';
import { copy } from '@/lib/copy';
import { SITE } from '@/content/site';
import styles from './big-email.module.css';

export function BigEmail() {
  return (
    <div>
      <Magnetic strength={0.12} radius={300}>
        <a
          href={`mailto:${SITE.email}`}
          className={styles.link}
          data-cursor="link"
          data-cursor-label="Say hi"
        >
          {SITE.email}
        </a>
      </Magnetic>
      <p className={styles.sub}>
        {copy(
          'contact.subtitle',
          'For project enquiries, please include a one-paragraph brief, your rough timeline, and any reference material. I read everything — usually reply within five working days.',
        )}
      </p>
    </div>
  );
}

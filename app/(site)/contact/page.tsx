import type { Metadata } from 'next';
import { BigEmail } from '@/components/contact/big-email';
import { ContactLinks } from '@/components/contact/contact-links';
import { WorkingWithList } from '@/components/contact/working-with';
import { copy } from '@/lib/copy';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Contact',
  description: copy(
    'contact.subtitle',
    'New work, collaboration, or just to say hello.',
  ),
};

export default function ContactPage() {
  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <p className="t-eyebrow" style={{ color: 'var(--muted)' }}>
          {copy(
            'contact.eyebrow',
            'Get in touch — usually replies same week',
          )}
        </p>
        <h1 className={`t-h1 ${styles.headline}`}>
          {copy(
            'contact.headline',
            'New work, collaboration, or just to say hello.',
          )}
        </h1>
      </header>

      <div className={styles.grid}>
        <div>
          <BigEmail />
          <ContactLinks />
        </div>
        <WorkingWithList />
      </div>
    </div>
  );
}

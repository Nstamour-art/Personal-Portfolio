import type { Metadata } from 'next';
import { Bio } from '@/components/studio/bio';
import { ExperienceList } from '@/components/studio/experience-list';
import { SkillsGrid } from '@/components/studio/skills-grid';
import { copy } from '@/lib/copy';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Studio',
  description: copy(
    'about.headline',
    'A motion artist who fell in love with systems.',
  ),
};

export default function StudioPage() {
  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <p className="t-eyebrow" style={{ color: 'var(--muted)' }}>
          {copy('about.eyebrow', 'Studio of one — Montréal · remote')}
        </p>
        <h1 className={`t-h1 ${styles.headline}`}>
          {copy(
            'about.headline',
            'A motion artist who fell in love with systems.',
          )}
        </h1>
      </header>

      <Bio />
      <SkillsGrid />

      <div className={styles.expHead}>
        <p className="t-eyebrow" style={{ color: 'var(--muted)' }}>
          {copy('about.experienceEyebrow', 'Experience')}
        </p>
        <h2 className={`t-h2 ${styles.expHeadline}`}>
          {copy(
            'about.experienceHeadline',
            'Selected projects, in order of recency.',
          )}
        </h2>
      </div>

      <ExperienceList />
    </div>
  );
}

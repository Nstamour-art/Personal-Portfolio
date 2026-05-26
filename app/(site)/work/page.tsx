import type { Metadata } from 'next';
import { Mosaic } from '@/components/work/mosaic';
import { PROJECTS } from '@/content/projects';
import { getDisciplineCount, getYearRange } from '@/lib/content';
import { copy, template } from '@/lib/copy';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Work',
  description: copy('work.lede', ''),
};

export default function WorkIndexPage() {
  const range = getYearRange();
  const yearLabel = range ? (range.min === range.max ? `${range.min}` : `${range.min} — ${range.max}`) : '';
  const disciplineCount = getDisciplineCount();
  const headline = template(
    copy(
      'work.headlineTemplate',
      'A working catalog of {projects} project{projectsS} across {disciplines} discipline{disciplinesS}.',
    ),
    {
      projects: PROJECTS.length,
      projectsS: PROJECTS.length === 1 ? '' : 's',
      disciplines: disciplineCount,
      disciplinesS: disciplineCount === 1 ? '' : 's',
    },
  );

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div>
          <p className="t-eyebrow" style={{ color: 'var(--muted)' }}>
            {copy('work.eyebrowPrefix', 'Work')}
            {yearLabel ? ` · ${yearLabel}` : ''}
          </p>
          <h1 className="t-h1" style={{ marginTop: 12 }}>
            {headline}
          </h1>
        </div>
        <p className={`t-body ${styles.lede}`}>{copy('work.lede', '')}</p>
      </header>
      <Mosaic />
    </div>
  );
}

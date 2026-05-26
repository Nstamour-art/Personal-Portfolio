import Link from 'next/link';
import { Placeholder } from '@/components/primitives/placeholder';
import type { Project } from '@/content/types';
import { copy } from '@/lib/copy';
import styles from './next-prev.module.css';

interface NextPrevProps {
  prev: Project;
  next: Project;
}

export function NextPrev({ prev, next }: NextPrevProps) {
  return (
    <section className={styles.next}>
      <Link
        href={`/work/${prev.id}`}
        className={styles.panel}
        data-cursor="view"
        data-cursor-label="Previous"
      >
        <Placeholder project={prev} sizes="50vw" />
        <div className={styles.panelOverlay}>
          <div className={styles.label}>
            {copy('caseStudy.prevLabel', '← Previous case')}
          </div>
          <div className={styles.titleBlock}>
            <div className={`${styles.title} tile-title`}>{prev.title}</div>
            <div className={styles.sub}>{prev.sub}</div>
          </div>
        </div>
      </Link>
      <Link
        href={`/work/${next.id}`}
        className={styles.panel}
        data-cursor="view"
        data-cursor-label="Next case"
      >
        <Placeholder project={next} sizes="50vw" />
        <div className={styles.panelOverlay}>
          <div className={`${styles.label} ${styles.right}`}>
            {copy('caseStudy.nextLabel', 'Next case →')}
          </div>
          <div className={`${styles.titleBlock} ${styles.right}`}>
            <div className={`${styles.title} tile-title`}>{next.title}</div>
            <div className={styles.sub}>{next.sub}</div>
          </div>
        </div>
      </Link>
    </section>
  );
}

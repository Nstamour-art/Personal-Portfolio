import type { Project } from '@/content/types';
import { copy } from '@/lib/copy';
import styles from './brief-block.module.css';

export function BriefBlock({ project }: { project: Project }) {
  return (
    <section className={styles.brief}>
      <div>
        <div className={styles.label}>{copy('caseStudy.briefLabel', 'The brief')}</div>
        <p className={styles.briefText}>{project.brief}</p>
      </div>
      <div>
        <div className={styles.label}>{copy('caseStudy.snapshotLabel', 'Snapshot')}</div>
        <p className={`t-body ${styles.snapshot}`}>{project.summary}</p>
        <div className={styles.meta}>
          <div className={styles.cell}>
            <div className="k">Output</div>
            <div className="v">{project.output ?? 'Films, frames, broadcast variants'}</div>
          </div>
          <div className={styles.cell}>
            <div className="k">Tools</div>
            <div className="v">{project.tools ?? '—'}</div>
          </div>
          <div className={styles.cell}>
            <div className="k">Duration</div>
            <div className="v">{project.duration ?? '—'}</div>
          </div>
          <div className={styles.cell}>
            <div className="k">Status</div>
            <div className="v">{project.status ?? 'Shipped'}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

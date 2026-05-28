import type { Project } from '@/content/types';
import { copy } from '@/lib/copy';
import styles from './brief-block.module.css';

/* Treat both `undefined` and empty/whitespace-only strings as "no
 * content". Keystatic writes `output: ''` (not omits the key) when an
 * editor clears a text field, so `??` alone wouldn't be enough — `''`
 * is not nullish and would render an empty cell with a stranded
 * "OUTPUT" header above it. Trim before comparing so a value of " "
 * is also treated as empty. */
function hasContent(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function BriefBlock({ project }: { project: Project }) {
  /* Build the meta grid from only the cells that have a value. Empty
   * cells are dropped entirely — no header, no em-dash placeholder, no
   * "Shipped" hallucinated default — so an editor who clears the field
   * in Keystatic gets the rendered result they expect.
   *
   * Order is fixed (Output → Tools → Duration → Status) to mirror the
   * Keystatic schema in keystatic.config.ts and the user's mental model
   * of the snapshot meta grid. */
  const metaCells: Array<{ k: string; v: string }> = [];
  if (hasContent(project.output)) metaCells.push({ k: 'Output', v: project.output });
  if (hasContent(project.tools)) metaCells.push({ k: 'Tools', v: project.tools });
  if (hasContent(project.duration)) metaCells.push({ k: 'Duration', v: project.duration });
  if (hasContent(project.status)) metaCells.push({ k: 'Status', v: project.status });

  return (
    <section className={styles.brief}>
      <div>
        <div className={styles.label}>{copy('caseStudy.briefLabel', 'The brief')}</div>
        <p className={styles.briefText}>{project.brief}</p>
      </div>
      <div>
        <div className={styles.label}>{copy('caseStudy.snapshotLabel', 'Snapshot')}</div>
        <p className={`t-body ${styles.snapshot}`}>{project.summary}</p>
        {metaCells.length > 0 ? (
          <div className={styles.meta}>
            {metaCells.map((cell) => (
              <div key={cell.k} className={styles.cell}>
                <div className="k">{cell.k}</div>
                <div className="v">{cell.v}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

import { Markdown } from '@/components/primitives/markdown';
import { copy } from '@/lib/copy';
import styles from './writeup.module.css';

interface WriteupProps {
  paragraphs: string[];
}

/**
 * "Notes on the build" — 1/3 + 2/3 column inside the same <section> as
 * the process gallery (SPEC §6.7.4). Joins paragraphs with `\n\n` so the
 * Markdown renderer can pick up any inline emphasis editors add later.
 */
export function Writeup({ paragraphs }: WriteupProps) {
  const text = paragraphs.join('\n\n');
  return (
    <div className={styles.writeup}>
      <div className={styles.label}>{copy('caseStudy.writeupLabel', 'Notes on the build')}</div>
      <Markdown text={text} className={styles.prose} />
    </div>
  );
}

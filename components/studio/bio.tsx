import { Markdown } from '@/components/primitives/markdown';
import { copy } from '@/lib/copy';
import styles from './bio.module.css';

export function Bio() {
  const practiceLines = copy<string[]>('about.practiceLines', []);
  const paragraphs = copy<string[]>('about.aboutParagraphs', []);

  return (
    <div className={styles.grid}>
      <div>
        <p className={styles.colHead}>
          {copy('about.practiceLabel', 'Practice')}
        </p>
        <div className={styles.practice}>
          {practiceLines.map((line) => (
            <div key={line} className={styles.practiceLine}>
              {line}
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className={styles.colHead}>{copy('about.aboutLabel', 'About')}</p>
        <div className={styles.prose}>
          <Markdown text={paragraphs.join('\n\n')} />
        </div>
      </div>
    </div>
  );
}

import { copy } from '@/lib/copy';
import styles from './working-with.module.css';

export function WorkingWithList() {
  const items = copy<string[]>('contact.workingWith', []);
  return (
    <aside>
      <p className={styles.head}>
        {copy('contact.workingWithLabel', 'Working with')}
      </p>
      <ul className={styles.list}>
        {items.map((it) => (
          <li key={it} className={styles.item}>
            <span className={styles.plus} aria-hidden="true">+</span>
            {it}
          </li>
        ))}
      </ul>
    </aside>
  );
}

import { SKILLS } from '@/content/skills';
import styles from './skills-grid.module.css';

export function SkillsGrid() {
  return (
    <div className={styles.grid}>
      {SKILLS.map((group) => (
        <div key={group.h} className={styles.col}>
          <h4>{group.h}</h4>
          <ul>
            {group.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

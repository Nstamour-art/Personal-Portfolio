'use client';

import { DISCIPLINES } from '@/content/disciplines';
import type { DisciplineId } from '@/content/types';
import styles from './filter-chips.module.css';

interface FilterChipsProps {
  active: DisciplineId | 'all';
  counts: Record<string, number>;
  onSelect: (id: DisciplineId | 'all') => void;
}

export function FilterChips({ active, counts, onSelect }: FilterChipsProps) {
  return (
    <div className={styles.row} role="tablist" aria-label="Filter by discipline">
      {DISCIPLINES.map((d) => {
        const isOn = active === d.id;
        return (
          <button
            key={d.id}
            type="button"
            className={styles.chip}
            data-on={isOn ? 'true' : 'false'}
            data-cursor="link"
            onClick={() => onSelect(d.id)}
            aria-pressed={isOn}
          >
            {d.label}
            <span className={styles.count}>/ {counts[d.id] ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
}

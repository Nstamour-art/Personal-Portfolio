'use client';

import { useMemo, useState } from 'react';
import { PROJECTS } from '@/content/projects';
import type { DisciplineId } from '@/content/types';
import { FilterChips } from './filter-chips';
import { spanFor } from './span-cycle';
import { Tile } from './tile';
import styles from './mosaic.module.css';

/**
 * Work mosaic — SPEC §6.6.
 * Holds the active discipline filter, derives counts and the filtered
 * list, then renders tiles with tessellating spans cycled by position.
 */
export function Mosaic() {
  const [filter, setFilter] = useState<DisciplineId | 'all'>('all');

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: PROJECTS.length };
    for (const p of PROJECTS) {
      for (const d of p.disciplines) {
        c[d] = (c[d] ?? 0) + 1;
      }
    }
    return c;
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return PROJECTS;
    return PROJECTS.filter((p) => p.disciplines.includes(filter));
  }, [filter]);

  return (
    <>
      <FilterChips active={filter} counts={counts} onSelect={setFilter} />
      <div className={styles.mosaic}>
        {filtered.map((p, i) => (
          <Tile
            key={p.id}
            project={p}
            index={PROJECTS.indexOf(p) + 1}
            span={spanFor(i, filtered.length)}
            sizes="(max-width: 1080px) 50vw, 33vw"
          />
        ))}
      </div>
    </>
  );
}

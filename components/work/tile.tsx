import Link from 'next/link';
import { Placeholder } from '@/components/primitives/placeholder';
import type { Project, SpanKey } from '@/content/types';
import styles from './tile.module.css';

interface TileProps {
  project: Project;
  /** 1-based index for the corner badge. */
  index: number;
  /** Mosaic span class. Omit for fixed-aspect tiles (e.g. home strip). */
  span?: SpanKey;
  /** Forced aspect ratio (e.g. "16/10") for non-mosaic placements. */
  aspectRatio?: string;
  /** Per-tile `sizes` for next/image. */
  sizes?: string;
  className?: string;
}

const SPAN_CLASSES: Record<SpanKey, string | undefined> = {
  's-1': undefined,
  's-2': undefined,
  's-3': undefined,
  's-4': undefined,
  's-5': undefined,
  's-6': undefined,
  's-7': undefined,
  's-8': undefined,
  's-fill': undefined,
};

function spanClass(span: SpanKey, s: typeof styles): string | undefined {
  switch (span) {
    case 's-1':
      return s.s1;
    case 's-2':
      return s.s2;
    case 's-3':
      return s.s3;
    case 's-4':
      return s.s4;
    case 's-5':
      return s.s5;
    case 's-6':
      return s.s6;
    case 's-7':
      return s.s7;
    case 's-8':
      return s.s8;
    case 's-fill':
      return s.sfill;
  }
}

/* Suppress unused warning while keeping the SPAN_CLASSES export-shape stable. */
void SPAN_CLASSES;

export function Tile({ project, index, span, aspectRatio, sizes, className }: TileProps) {
  const cls = [styles.tile, span ? spanClass(span, styles) : null, className]
    .filter(Boolean)
    .join(' ');
  const padded = index.toString().padStart(2, '0');
  return (
    <Link
      href={`/work/${project.id}`}
      className={cls}
      data-cursor="view"
      data-cursor-label="View"
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      <div className={styles.media}>
        <Placeholder project={project} sizes={sizes ?? '50vw'} />
      </div>
      <div className={styles.top}>
        <div className={styles.index}>/ {padded}</div>
        <div className={`${styles.meta} caps-on`}>
          {project.disciplines.map((d) => d.toUpperCase()).join(' · ')}
        </div>
      </div>
      <div className={styles.foot}>
        <div>
          <div className={`${styles.title} tile-title`}>{project.title}</div>
          <div className={styles.sub}>{project.sub}</div>
        </div>
        <div className={styles.arrow} aria-hidden="true">
          →
        </div>
      </div>
    </Link>
  );
}

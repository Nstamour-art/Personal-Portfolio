import Image from 'next/image';
import { SHAPES, type ShapeDescriptor } from '@/content/shapes';
import type { DisciplineId, MediaSlot, ProceduralKey, Project } from '@/content/types';
import styles from './placeholder.module.css';

interface PlaceholderProps {
  project: Project;
  /** Defaults to `project.hero`. Pass an explicit MediaSlot to render a
   * different image, or `{ src: '' }` to force the procedural fallback. */
  media?: MediaSlot;
  showLabel?: boolean;
  labelText?: string;
  phOverride?: ProceduralKey;
  /** next/image sizes attribute — tune per usage. SPEC §8. */
  sizes?: string;
  /** Priority hint for above-the-fold heroes. */
  priority?: boolean;
}

/**
 * Project visual primitive — SPEC §6.12.
 * If `media.src` is non-empty, renders a next/image fill. Otherwise renders
 * a procedural placeholder keyed off the project's primary discipline.
 */
export function Placeholder({
  project,
  media,
  showLabel = false,
  labelText,
  phOverride,
  sizes = '100vw',
  priority = false,
}: PlaceholderProps) {
  const m = media ?? project.hero;
  const src = m?.src ?? '';
  const hasImage = typeof src === 'string' ? src.trim() !== '' : true;

  if (hasImage && m) {
    return (
      <div className={styles.root}>
        <Image
          src={m.src as string}
          alt={m.alt || project.title}
          fill
          sizes={sizes}
          priority={priority}
          className={styles.image}
          draggable={false}
        />
      </div>
    );
  }

  const procedural: ProceduralKey =
    phOverride ?? project.ph ?? proceduralForDiscipline(project.primary);
  const shapes = SHAPES[project.id] ?? [];
  const label =
    labelText ??
    m?.alt ??
    `${project.title} — drop hero image here`;

  return (
    <div className={`${styles.root} ${styles.ph} ${proceduralClassName(procedural, styles)}`}>
      <div className={styles.grid} />
      {shapes.map((s, i) => (
        <div key={i} className={styles.shape} style={shapeStyle(s)} />
      ))}
      {showLabel ? <div className={styles.label}>{label}</div> : null}
    </div>
  );
}

function proceduralForDiscipline(primary: DisciplineId): ProceduralKey {
  switch (primary) {
    case 'motion':
      return 'ph-motion';
    case '3d':
      return 'ph-3d';
    case 'illo':
      return 'ph-illo';
    case 'video':
      return 'ph-video';
    case 'ai':
      return 'ph-ai';
    case 'code':
      return 'ph-code';
  }
}

function proceduralClassName(key: ProceduralKey, s: typeof styles): string {
  switch (key) {
    case 'ph-motion':
      return s.motion ?? '';
    case 'ph-3d':
      return s.threeD ?? '';
    case 'ph-illo':
      return s.illo ?? '';
    case 'ph-video':
      return s.video ?? '';
    case 'ph-ai':
      return s.ai ?? '';
    case 'ph-code':
      return s.code ?? '';
  }
}

function shapeStyle(s: ShapeDescriptor): React.CSSProperties {
  return {
    width: s.w,
    height: s.h,
    left: s.x,
    top: s.y,
    background: s.bg,
    opacity: s.opacity,
    borderRadius: s.type === 'circle' ? '50%' : 0,
    transform: `translate(-50%, -50%) rotate(${s.rotate ?? 0}deg)`,
    filter: s.blur ? `blur(${s.blur}px)` : 'none',
  };
}

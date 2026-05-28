'use client';

import { useMemo, useState } from 'react';
import { ExpandableMedia } from '@/components/primitives/expandable-media';
import { Lightbox, type LightboxItem } from '@/components/primitives/lightbox';
import { Placeholder } from '@/components/primitives/placeholder';
import type { ProceduralKey, Project } from '@/content/types';
import { copy } from '@/lib/copy';
import { Writeup } from './writeup';
import styles from './process-gallery.module.css';

interface ProcessGalleryProps {
  project: Project;
}

/* The writeup lives inside the same <section> as the gallery — SPEC §6.7.4 */
export function ProcessGallery({ project }: ProcessGalleryProps) {
  /* Build the lightbox's working set once per project from the process
   * steps that actually have an uploaded image. Steps that fall back to
   * the procedural placeholder aren't lightbox-able — there's nothing
   * larger to show — so they render the plain Placeholder. Cycling
   * happens in array order, which mirrors the on-page reading order. */
  const lightboxItems = useMemo<LightboxItem[]>(() => {
    const items: LightboxItem[] = [];
    project.process.forEach((step) => {
      const src = step.media?.src;
      if (typeof src !== 'string' || src.trim() === '') return;
      items.push({
        src,
        alt: step.media?.alt || step.label,
        caption: { label: step.label, note: step.note },
      });
    });
    return items;
  }, [project]);

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <div>
          <p className={styles.secLabel}>
            {copy('caseStudy.processEyebrow', 'Process')}
          </p>
          <h2 className={`t-h2 ${styles.headTitle}`}>
            {copy('caseStudy.processHeadline', 'How it got made.')}
          </h2>
        </div>
        <p className={`t-body ${styles.headBlurb}`}>
          {copy(
            'caseStudy.processBlurb',
            'Selected stills from the working files — block-outs, style frames and tests that informed the final piece.',
          )}
        </p>
      </div>

      <div className={styles.gallery}>
        {project.process.map((step, i) => {
          const stepMedia = step.media ?? { src: '', alt: step.label };
          const procedural = procRotation(i);
          const fig = String(i + 1).padStart(2, '0');
          const hasImage =
            typeof stepMedia.src === 'string' && stepMedia.src.trim() !== '';
          const lightboxIdx = hasImage
            ? lightboxItems.findIndex((it) => it.src === stepMedia.src)
            : -1;
          return (
            <div key={i} className={styles.gimg}>
              {hasImage && lightboxIdx >= 0 ? (
                <ExpandableMedia
                  onExpand={() => setOpenIndex(lightboxIdx)}
                  label={`Expand image — ${step.label}`}
                >
                  <Placeholder
                    project={project}
                    media={stepMedia}
                    phOverride={procedural}
                    showLabel={false}
                    labelText={step.label}
                    sizes="(max-width: 880px) 100vw, 33vw"
                  />
                </ExpandableMedia>
              ) : (
                <Placeholder
                  project={project}
                  media={stepMedia}
                  phOverride={procedural}
                  showLabel
                  labelText={step.label}
                  sizes="(max-width: 880px) 100vw, 33vw"
                />
              )}
              <div className={styles.caption}>
                <span>
                  fig. {fig} — {step.label}
                </span>
                <span className={styles.note} title={step.note}>
                  {truncateForOverlay(step.note)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <Writeup paragraphs={project.writeup} />

      {openIndex !== null ? (
        <Lightbox
          items={lightboxItems}
          initialIndex={openIndex}
          onClose={() => setOpenIndex(null)}
        />
      ) : null}
    </section>
  );
}

/* Rotate procedural treatments across the three columns so the gallery
 * doesn't read as a single block when no images are loaded. */
function procRotation(i: number): ProceduralKey | undefined {
  if (i === 0) return undefined;
  if (i === 1) return 'ph-illo';
  return 'ph-code';
}

/* Truncate the gallery overlay's right-side note to keep captions
 * compact over the image — long descriptions become a 4+ line wall of
 * mono caps that dominates the tile and obscures the artwork. The
 * lightbox still receives the full untruncated text (built from
 * step.note above), so clicking through always reveals the complete
 * description.
 *
 * Threshold is ~100 characters because that's the point where the
 * description starts wrapping to a third line at the default tile
 * width. We try to break on the last word boundary within a reasonable
 * window (back up no more than ~15 chars) so we don't cut mid-word.
 * Trailing punctuation is stripped before appending the ellipsis so we
 * don't render awkward sequences like "model.…" or "model,…".
 *
 * A single Unicode ellipsis character (U+2026) is used rather than
 * three dots — typographically cleaner and unambiguous on copy. The
 * `title` attribute on the rendered span carries the full text so
 * users on pointing devices can hover to see the complete note. */
const OVERLAY_NOTE_MAX = 100;

function truncateForOverlay(text: string): string {
  if (text.length <= OVERLAY_NOTE_MAX) return text;
  const slice = text.slice(0, OVERLAY_NOTE_MAX);
  const lastSpace = slice.lastIndexOf(' ');
  /* If the last word is unusually long (no space found in the back ~15
   * chars of the window) fall back to a hard cut at the threshold so
   * we don't leave the ellipsis floating after a long URL or token. */
  const cut = lastSpace > OVERLAY_NOTE_MAX - 15 ? lastSpace : OVERLAY_NOTE_MAX;
  return text.slice(0, cut).replace(/[\s.,;:!?—-]+$/, '') + '…';
}

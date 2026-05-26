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
          return (
            <div key={i} className={styles.gimg}>
              <Placeholder
                project={project}
                media={stepMedia}
                phOverride={procedural}
                showLabel={!stepMedia.src}
                labelText={step.label}
                sizes="(max-width: 880px) 100vw, 33vw"
              />
              <div className={styles.caption}>
                <span>
                  fig. {fig} — {step.label}
                </span>
                <span className={styles.note}>{step.note}</span>
              </div>
            </div>
          );
        })}
      </div>

      <Writeup paragraphs={project.writeup} />
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

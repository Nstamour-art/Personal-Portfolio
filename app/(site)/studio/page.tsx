import type { Metadata } from 'next';
import { Markdown } from '@/components/primitives/markdown';
import { CvHeader } from '@/components/studio/cv-header';
import { CvRows, type CvRow } from '@/components/studio/cv-rows';
import { CvSection } from '@/components/studio/cv-section';
import { CvSidebar } from '@/components/studio/cv-sidebar';
import { AWARDS } from '@/content/awards';
import { EDUCATION } from '@/content/education';
import { EXPERIENCE } from '@/content/experience';
import { copy } from '@/lib/copy';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'CV',
  description: copy(
    'about.summary',
    copy('about.headline', 'A motion artist who fell in love with systems.'),
  ),
};

/* /studio is the long-form CV. Two-column layout (main on the left,
 * reference sidebar on the right) with a full-width identity header.
 * Each main-column section hides cleanly when the underlying content
 * is empty, so new editors can populate it incrementally via
 * Keystatic without leaving "Empty section" stubs behind. */
export default function StudioPage() {
  const summary = copy('about.summary', '');

  const experienceRows: CvRow[] = EXPERIENCE.map((e) => ({
    year: e.year,
    title: e.role,
    sub: e.note,
    tag: e.tag,
  }));

  const educationRows: CvRow[] = EDUCATION.map((e) => ({
    year: e.year,
    title: e.school,
    sub: e.programme,
    tag: e.note,
  }));

  const awardRows: CvRow[] = AWARDS.map((a) => ({
    year: a.year,
    title: a.title,
    sub: a.source,
    href: a.href,
  }));

  return (
    <div className={styles.page}>
      <CvHeader />

      <div className={styles.cv}>
        <main className={styles.main}>
          {summary ? (
            <CvSection eyebrow="Summary">
              <div className={styles.summary}>
                <Markdown text={summary} />
              </div>
            </CvSection>
          ) : null}

          <CvSection
            eyebrow={copy('about.experienceEyebrow', 'Experience')}
            headline={copy('about.experienceHeadline', '')}
          >
            <CvRows
              rows={experienceRows}
              empty="No experience entries yet — add some from Admin → You → Experience."
            />
          </CvSection>

          <CvSection eyebrow={copy('about.educationEyebrow', 'Education')}>
            <CvRows
              rows={educationRows}
              empty="No education entries yet — add some from Admin → You → Education."
            />
          </CvSection>

          <CvSection eyebrow={copy('about.awardsEyebrow', 'Awards & press')}>
            <CvRows
              rows={awardRows}
              empty="No awards or press yet — add some from Admin → You → Awards & press."
            />
          </CvSection>
        </main>

        <aside className={styles.aside}>
          <CvSidebar />
        </aside>
      </div>
    </div>
  );
}

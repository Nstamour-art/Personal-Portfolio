'use client';

import { useState } from 'react';
import Link from 'next/link';
import { VideoHero } from '@/components/primitives/video-hero';
import type { Project } from '@/content/types';
import { copy } from '@/lib/copy';
import styles from './cinematic-hero.module.css';

interface CinematicHeroProps {
  project: Project;
  index: number;
  total: number;
}

export function CinematicHero({ project, index, total }: CinematicHeroProps) {
  const padded = String(index).padStart(2, '0');
  const totalPadded = String(total).padStart(2, '0');
  const hasMedia = Boolean(project.heroVideo) || Boolean(project.hero?.src);

  /* When the embedded video is actively playing, fade out the entire
   * title/back/counter/meta overlay (and the gradient behind it) so
   * the playback surface is unobscured. VideoHero broadcasts the
   * state; for iframes it's coarse (play vs ✕ Stop), for HTML5
   * <video> it follows native play/pause/ended. */
  const [videoPlaying, setVideoPlaying] = useState(false);

  return (
    <section className={styles.hero}>
      <div className={styles.surface}>
        <VideoHero
          project={project}
          showLabel={!hasMedia}
          labelText={project.hero?.alt || `${project.title} — hero image`}
          sizes="100vw"
          priority
          onPlayingChange={setVideoPlaying}
        />
      </div>
      <div
        className={`${styles.overlay} ${videoPlaying ? styles.overlayHidden : ''}`}
        aria-hidden={videoPlaying || undefined}
      >
        <div className={styles.top}>
          <Link href="/work" className={styles.back} data-cursor="link">
            <span aria-hidden="true">←</span>
            {copy('caseStudy.backLink', 'Back to index')}
          </Link>
          <div className={styles.counter}>
            {padded} / {totalPadded}
          </div>
        </div>
        <div className={styles.bottom}>
          <div className={styles.disciplines}>
            {project.disciplines.map((d) => d.toUpperCase()).join(' · ')} · {project.year}
          </div>
          <h1 className={`${styles.title} hero-title`}>{project.title}</h1>
          <div className={styles.meta}>
            <div className={styles.cell}>
              <div className="k">Client</div>
              <div className="v">{project.client}</div>
            </div>
            <div className={styles.cell}>
              <div className="k">Year</div>
              <div className="v">{project.year}</div>
            </div>
            <div className={styles.cell}>
              <div className="k">Role</div>
              <div className="v">{project.role}</div>
            </div>
            <div className={styles.cell}>
              <div className="k">Discipline</div>
              <div className="v">{project.sub}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

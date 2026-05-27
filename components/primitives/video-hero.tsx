'use client';

import { useState } from 'react';
import { parseVideoUrl, platformLabel } from '@/lib/video';
import type { ProceduralKey, Project } from '@/content/types';
import { Placeholder } from './placeholder';
import styles from './video-hero.module.css';

interface VideoHeroProps {
  project: Project;
  showLabel?: boolean;
  labelText?: string;
  phOverride?: ProceduralKey;
  sizes?: string;
  priority?: boolean;
}

/**
 * Click-to-play hero embed — SPEC §6.10.
 *
 * Renders a Placeholder poster + play button. On click, swaps in an
 * iframe (YouTube / Vimeo) or HTML5 video (mp4/webm/mov). Iframe errors
 * snap back to the poster with a Try again toast.
 *
 * The iframe is never preloaded — only fetched on click — so the poster
 * image is the only network request on initial paint (SPEC §11).
 */
export function VideoHero({
  project,
  showLabel = false,
  labelText,
  phOverride,
  sizes,
  priority,
}: VideoHeroProps) {
  const video = parseVideoUrl(project.heroVideo);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  if (video.kind === 'none') {
    return (
      <Placeholder
        project={project}
        showLabel={showLabel}
        labelText={labelText}
        phOverride={phOverride}
        sizes={sizes}
        priority={priority}
      />
    );
  }

  if (failed) {
    return (
      <div className={styles.root}>
        <Placeholder
          project={project}
          phOverride={phOverride}
          sizes={sizes}
          priority={priority}
        />
        <div className={styles.error}>
          <div className="t-mono-sm" style={{ color: 'var(--fg)' }}>
            ⚠ Video unavailable — showing poster instead
          </div>
          <button
            type="button"
            className={styles.retry}
            onClick={(e) => {
              e.stopPropagation();
              setFailed(false);
              setPlaying(true);
            }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!playing) {
    return (
      <button
        type="button"
        className={`${styles.root} ${styles.poster}`}
        onClick={() => setPlaying(true)}
        aria-label={`Play video — ${project.title}`}
        data-cursor="view"
        data-cursor-label="Play"
        style={{ padding: 0 }}
      >
        <Placeholder
          project={project}
          showLabel={showLabel}
          labelText={labelText}
          phOverride={phOverride}
          sizes={sizes}
          priority={priority}
        />
        <span className={styles.play} aria-hidden="true">
          <svg width="22" height="24" viewBox="0 0 20 22" fill="none">
            <path d="M2 1.5L18 11L2 20.5V1.5Z" fill="currentColor" />
          </svg>
        </span>
        <span className={styles.badge}>{platformLabel(video)}</span>
      </button>
    );
  }

  return (
    <div className={styles.root}>
      {video.kind === 'file' ? (
        <video
          src={video.embedUrl}
          autoPlay
          controls
          playsInline
          onError={() => setFailed(true)}
        >
          Sorry, your browser does not support embedded video.
        </video>
      ) : (
        <iframe
          src={video.embedUrl}
          title={project.title || 'Video'}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          onError={() => setFailed(true)}
        />
      )}
      <button
        type="button"
        className={styles.close}
        onClick={() => setPlaying(false)}
        aria-label="Stop video"
        data-cursor="link"
        data-cursor-label="Close"
      >
        ✕
      </button>
    </div>
  );
}

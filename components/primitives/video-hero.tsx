'use client';

import { useEffect, useRef, useState } from 'react';
import { attachIframePlayerEvents } from '@/lib/iframe-player-events';
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
  /**
   * Fires when the player's active-playback state changes — used by
   * parents like <CinematicHero> to fade out their overlay while a
   * video is actively playing.
   *
   * For iframe embeds (YouTube/Vimeo) we can't observe pause inside
   * the iframe, so the signal is coarse-grained: `true` when the user
   * clicks Play and the iframe mounts, `false` when they click ✕ Stop.
   *
   * For HTML5 <video> embeds the signal is fine-grained and tracks
   * the native play/pause/ended events, so pausing via the controls
   * also reveals the overlay again.
   */
  onPlayingChange?: (playing: boolean) => void;
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
  onPlayingChange,
}: VideoHeroProps) {
  const video = parseVideoUrl(project.heroVideo);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  /**
   * Local helper that mirrors `setPlaying` but also broadcasts to the
   * parent overlay. Used by the poster Play button and the ✕ Stop
   * button. HTML5 video play/pause/ended and YouTube/Vimeo player
   * events call `onPlayingChange` directly (without touching the
   * mount state) so the iframe stays up while the overlay fades
   * in/out with the user's controls.
   */
  const setPlayingAndNotify = (next: boolean) => {
    setPlaying(next);
    onPlayingChange?.(next);
  };

  /**
   * When the iframe is mounted, subscribe to its postMessage stream
   * so YouTube/Vimeo pause/end events bubble up to the parent
   * overlay. Cleanup tears the message listener back down on unmount
   * or when the user clicks ✕ Stop.
   */
  useEffect(() => {
    if (!playing) return undefined;
    if (video.kind !== 'youtube' && video.kind !== 'vimeo') return undefined;
    if (!onPlayingChange) return undefined;
    const iframe = iframeRef.current;
    if (!iframe) return undefined;
    return attachIframePlayerEvents(iframe, video.kind, (ev) => {
      onPlayingChange(ev === 'play');
    });
  }, [playing, video.kind, onPlayingChange]);

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
              setPlayingAndNotify(true);
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
        onClick={() => setPlayingAndNotify(true)}
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
          onPlay={() => onPlayingChange?.(true)}
          onPause={() => onPlayingChange?.(false)}
          onEnded={() => onPlayingChange?.(false)}
          onError={() => setFailed(true)}
        >
          Sorry, your browser does not support embedded video.
        </video>
      ) : (
        <iframe
          ref={iframeRef}
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
        onClick={() => setPlayingAndNotify(false)}
        aria-label="Stop video"
        data-cursor="link"
      >
        ✕
      </button>
    </div>
  );
}

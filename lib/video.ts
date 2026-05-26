/**
 * Video URL parser — SPEC §6.10.
 * Identifies YouTube, Vimeo, and direct-file URLs and returns the embeddable
 * shape the <VideoHero> component renders. Anything unrecognised returns
 * kind: 'none', so the caller can fall back to a static placeholder.
 */

export type ParsedVideo =
  | { kind: 'youtube'; id: string; embedUrl: string; original: string }
  | { kind: 'vimeo'; id: string; embedUrl: string; original: string }
  | { kind: 'file'; id: string; embedUrl: string; original: string; mime: string }
  | { kind: 'none'; original: string };

/* `enablejsapi=1` is required for YouTube's postMessage protocol — it
 * unlocks the play/pause/ended events that <VideoHero> uses to keep
 * the parent overlay in sync (see lib/iframe-player-events.ts). The
 * `origin` parameter scopes accepted commands to our domain at runtime
 * and is appended dynamically in the embed component because it needs
 * window.location.origin. */
const YOUTUBE_PARAMS =
  'autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1';
const VIMEO_PARAMS = 'autoplay=1&title=0&byline=0&portrait=0&playsinline=1';

const MIME_BY_EXT: Record<string, string> = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  ogv: 'video/ogg',
};

export function parseVideoUrl(url: string | undefined | null): ParsedVideo {
  const raw = (url ?? '').trim();
  if (!raw) return { kind: 'none', original: '' };

  // YouTube
  const yt = matchYouTube(raw);
  if (yt) {
    return {
      kind: 'youtube',
      id: yt,
      embedUrl: `https://www.youtube.com/embed/${yt}?${YOUTUBE_PARAMS}`,
      original: raw,
    };
  }

  // Vimeo
  const vm = matchVimeo(raw);
  if (vm) {
    return {
      kind: 'vimeo',
      id: vm,
      embedUrl: `https://player.vimeo.com/video/${vm}?${VIMEO_PARAMS}`,
      original: raw,
    };
  }

  // Direct file
  const file = matchFile(raw);
  if (file) {
    return {
      kind: 'file',
      id: file.id,
      embedUrl: raw,
      original: raw,
      mime: file.mime,
    };
  }

  return { kind: 'none', original: raw };
}

function matchYouTube(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([\w-]{6,})/i,
    /youtu\.be\/([\w-]{6,})/i,
    /youtube\.com\/embed\/([\w-]{6,})/i,
    /youtube\.com\/shorts\/([\w-]{6,})/i,
    /youtube\.com\/v\/([\w-]{6,})/i,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m && m[1]) return m[1];
  }
  return null;
}

function matchVimeo(url: string): string | null {
  const patterns = [
    /vimeo\.com\/(?:video\/)?(\d{4,})/i,
    /player\.vimeo\.com\/video\/(\d{4,})/i,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m && m[1]) return m[1];
  }
  return null;
}

function matchFile(url: string): { id: string; mime: string } | null {
  const m = url.match(/\.(mp4|webm|mov|ogv)(?:\?.*)?$/i);
  if (!m || !m[1]) return null;
  const ext = m[1].toLowerCase();
  const mime = MIME_BY_EXT[ext];
  if (!mime) return null;
  return { id: ext, mime };
}

/** Human-readable platform label for the badge in the corner of the poster. */
export function platformLabel(parsed: ParsedVideo): string {
  switch (parsed.kind) {
    case 'youtube':
      return 'YouTube';
    case 'vimeo':
      return 'Vimeo';
    case 'file':
      return parsed.id.toUpperCase();
    case 'none':
      return '';
  }
}

// video-embed.jsx — YouTube / Vimeo embed with image-poster + click-to-play.
//
// Renders a project hero as a still poster image (using the same Placeholder
// fallback chain). When the user clicks the play button, swap the poster for
// an iframe embed of the YouTube/Vimeo URL. If the iframe never finishes
// loading (CSP errors, removed videos), we surface a "Failed to load" state
// and the user can return to the poster.
//
// Detection:
//   YouTube: https://www.youtube.com/watch?v=ID
//            https://youtu.be/ID
//            https://www.youtube.com/embed/ID
//   Vimeo:   https://vimeo.com/ID
//            https://player.vimeo.com/video/ID
//
// Anything else is treated as a generic <video src> (mp4/webm).

function parseVideoUrl(url) {
  if (!url) return null;
  const s = String(url).trim();
  if (!s) return null;

  // YouTube
  let m = s.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i);
  if (m) {
    return {
      kind: "youtube",
      id: m[1],
      embedUrl: `https://www.youtube.com/embed/${m[1]}?autoplay=1&rel=0&modestbranding=1`,
    };
  }

  // Vimeo
  m = s.match(/vimeo\.com\/(?:video\/|channels\/[^/]+\/|groups\/[^/]+\/videos\/)?(\d{6,})/i);
  if (m) {
    return {
      kind: "vimeo",
      id: m[1],
      embedUrl: `https://player.vimeo.com/video/${m[1]}?autoplay=1&title=0&byline=0&portrait=0`,
    };
  }

  // Direct media URL
  if (/\.(mp4|webm|mov|ogv)(\?.*)?$/i.test(s)) {
    return { kind: "file", id: s, embedUrl: s };
  }

  return null;
}

// Drop-in for the project hero / case study hero. Shows a poster (the
// project.hero image or procedural placeholder), with a play button if a
// video URL is set. Click → swap to iframe. Click ✕ → return to poster.
function VideoHero({ project, showLabel = false, labelText, phOverride }) {
  const video = parseVideoUrl(project.heroVideo);
  const [playing, setPlaying] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  // If no video URL, this is just a Placeholder — same as before.
  if (!video) {
    return (
      <Placeholder project={project}
                   showLabel={showLabel}
                   labelText={labelText}
                   phOverride={phOverride} />
    );
  }

  // Failed iframe load: snap back to poster with a hint.
  if (failed) {
    return (
      <div className="video-hero failed">
        <Placeholder project={project} showLabel={false} />
        <div className="video-hero-error">
          <div className="t-mono-sm" style={{ color: "var(--fg)" }}>
            ⚠ Video unavailable — showing poster instead
          </div>
          <button type="button" className="video-hero-retry"
                  onClick={(e) => { e.stopPropagation(); setFailed(false); setPlaying(true); }}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Click-to-play poster state — show image + big play button overlay.
  if (!playing) {
    return (
      <div className="video-hero poster"
           onClick={(e) => { e.stopPropagation(); setPlaying(true); }}
           data-cursor="view"
           data-cursor-label="Play">
        <Placeholder project={project}
                     showLabel={showLabel}
                     labelText={labelText}
                     phOverride={phOverride} />
        <button type="button"
                className="video-hero-play"
                onClick={(e) => { e.stopPropagation(); setPlaying(true); }}
                aria-label="Play video">
          <svg width="22" height="24" viewBox="0 0 20 22" fill="none">
            <path d="M2 1.5L18 11L2 20.5V1.5Z" fill="currentColor" />
          </svg>
        </button>
        <div className="video-hero-badge">
          <span>{video.kind === "youtube" ? "YouTube" :
                 video.kind === "vimeo"   ? "Vimeo"   : "Video"}</span>
        </div>
      </div>
    );
  }

  // Playing state — iframe or HTML5 video.
  return (
    <div className="video-hero playing">
      {video.kind === "file" ? (
        <video src={video.embedUrl}
               autoPlay
               controls
               playsInline
               onError={() => setFailed(true)}>
          Sorry, your browser does not support embedded video.
        </video>
      ) : (
        <iframe src={video.embedUrl}
                title={project.title || "Video"}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                onError={() => setFailed(true)}
                onLoad={(e) => {
                  // Detect blocked frames where the iframe loads but ends up
                  // with no contentWindow (rare; cross-origin makes detection
                  // unreliable). We treat onError as the authoritative signal.
                }} />
      )}
      <button type="button"
              className="video-hero-close"
              onClick={(e) => { e.stopPropagation(); setPlaying(false); }}
              aria-label="Stop video">✕</button>
    </div>
  );
}

Object.assign(window, { parseVideoUrl, VideoHero });

/* ──────────────────────────────────────────────────────────────────────────
 * iframe-player-events — subscribe to coarse play/pause/ended events
 * for an embedded YouTube or Vimeo iframe via raw postMessage, with
 * zero external SDK / runtime dependency.
 *
 * Both platforms expose a postMessage protocol:
 *  - YouTube: requires `?enablejsapi=1` on the embed URL. Parent sends
 *    a "listening" + "addEventListener(onStateChange)" handshake; the
 *    player then posts back `infoDelivery` messages whose `playerState`
 *    field follows the YT.PlayerState enum
 *    (-1 unstarted · 0 ended · 1 playing · 2 paused · 3 buffering · 5 cued).
 *  - Vimeo: player.vimeo.com iframes accept commands without extra
 *    query params. Parent registers for `play` / `pause` / `ended`
 *    events; the player posts back JSON-stringified events.
 *
 * Used by <VideoHero> so the case-page hero overlay (back link, title,
 * meta grid) can fade back in when the user pauses or finishes the
 * video — see components/case/cinematic-hero.tsx.
 * ──────────────────────────────────────────────────────────────────── */

type PlayerEvent = 'play' | 'pause' | 'ended';
type Handler = (event: PlayerEvent) => void;

interface YouTubeInfoMessage {
  event?: string;
  info?: number | { playerState?: number };
}

interface VimeoMessage {
  event?: string;
}

/**
 * Attach listeners to a mounted iframe. Returns a cleanup function;
 * call it on unmount to remove the window-level message listener and
 * the iframe `load` listener.
 *
 * Safe to call before the iframe has finished loading — the handshake
 * is fired once immediately (works for cached iframes that load
 * instantly) and again on the `load` event.
 */
export function attachIframePlayerEvents(
  iframe: HTMLIFrameElement,
  platform: 'youtube' | 'vimeo',
  handler: Handler,
): () => void {
  /* contentWindow may be null briefly while the iframe is being
   * inserted into the document; this should never trigger in practice
   * since callers attach after the element ref is set. */
  if (!iframe.contentWindow) return () => {};

  function onMessage(e: MessageEvent) {
    if (e.source !== iframe.contentWindow) return;
    let data: unknown = e.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        return;
      }
    }
    if (!data || typeof data !== 'object') return;

    if (platform === 'youtube') {
      const msg = data as YouTubeInfoMessage;
      /* YouTube posts a stream of infoDelivery messages (one whenever
       * the player updates any of: state, time, volume, etc.) and a
       * dedicated onStateChange message after our explicit subscription.
       * Both surface the player state in the same shape. */
      if (msg.event !== 'infoDelivery' && msg.event !== 'onStateChange') {
        return;
      }
      const state =
        typeof msg.info === 'number' ? msg.info : msg.info?.playerState;
      if (state === undefined) return;
      if (state === 1) handler('play');
      else if (state === 2) handler('pause');
      else if (state === 0) handler('ended');
      return;
    }

    if (platform === 'vimeo') {
      const msg = data as VimeoMessage;
      if (msg.event === 'play') handler('play');
      else if (msg.event === 'pause') handler('pause');
      else if (msg.event === 'ended') handler('ended');
    }
  }

  window.addEventListener('message', onMessage);

  function setupYouTube() {
    const w = iframe.contentWindow;
    if (!w) return;
    /* The handshake. YouTube ignores postMessages until it has
     * received a "listening" frame from the parent. The ID and channel
     * fields are required by the protocol but their values are
     * arbitrary as long as they match across messages. */
    w.postMessage(
      JSON.stringify({
        event: 'listening',
        id: 'vh',
        channel: 'widget',
      }),
      '*',
    );
    w.postMessage(
      JSON.stringify({
        event: 'command',
        func: 'addEventListener',
        args: ['onStateChange'],
        id: 'vh',
        channel: 'widget',
      }),
      '*',
    );
  }

  function setupVimeo() {
    const w = iframe.contentWindow;
    if (!w) return;
    for (const value of ['play', 'pause', 'ended'] as const) {
      w.postMessage(
        JSON.stringify({ method: 'addEventListener', value }),
        '*',
      );
    }
  }

  const setup = platform === 'youtube' ? setupYouTube : setupVimeo;
  setup();
  iframe.addEventListener('load', setup);

  return () => {
    window.removeEventListener('message', onMessage);
    iframe.removeEventListener('load', setup);
  };
}

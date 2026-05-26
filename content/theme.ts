import themeData from '@/data/theme.json';

/* ──────────────────────────────────────────────────────────────────────────
 * Theme — typography and accent. Designed so the site can swap any
 * Google Fonts family per type slot and the accent colour without a
 * code change, just by editing /keystatic and triggering a redeploy.
 *
 * Storage: data/theme.json, edited by the Keystatic Theme singleton.
 * Apply path: app/layout.tsx reads THEME, renders <link> tags for the
 * needed Google Fonts CSS, and sets all the relevant CSS variables
 * inline on <html> so every component's `var(--...)` reference
 * updates everywhere.
 *
 * Slot model:
 *  - sansFamily       → --sans         (body, paragraphs, defaults)
 *  - displayFamily    → --font-display (h1/h2/h3, hero names)
 *  - monoFamily       → --mono         (labels, eyebrows, captions)
 *  - marqueeFamily    → --font-marquee (giant scrolling home strip)
 *
 * Cascade: display falls back to sans, marquee falls back to display
 * which falls back to sans. So filling only `sansFamily` is enough to
 * theme the whole site if you want one font everywhere.
 * ──────────────────────────────────────────────────────────────────── */

export interface ThemeConfig {
  /** Google Fonts family for body / paragraph text. Empty = system sans. */
  sansFamily: string;
  /** Google Fonts family for display headlines. Empty = inherit sans. */
  displayFamily: string;
  /** Google Fonts family for mono labels. Empty = system mono. */
  monoFamily: string;
  /** Google Fonts family for the marquee strip. Empty = inherit display. */
  marqueeFamily: string;
  /** Hex colour used for the accent (brand mark, CTAs, focus rings,
   *  marquee dots). 4.5:1 contrast against #0E1117 recommended. */
  accentColor: string;
}

export const THEME: ThemeConfig = themeData as ThemeConfig;

const SYSTEM_SANS = `'Helvetica Neue', 'Helvetica', 'Arial', system-ui, sans-serif`;
const SYSTEM_MONO = `ui-monospace, 'SF Mono', Menlo, Consolas, monospace`;
const DEFAULT_ACCENT = '#FF5B1F';

function prepend(name: string | undefined, fallback: string): string {
  const trimmed = name?.trim();
  return trimmed ? `"${trimmed}", ${fallback}` : fallback;
}

/** Body / sans stack. Falls back to system sans. */
export function sansStack(theme: ThemeConfig = THEME): string {
  return prepend(theme.sansFamily, SYSTEM_SANS);
}

/** Display stack. Cascades to sans when displayFamily is unset. */
export function displayStack(theme: ThemeConfig = THEME): string {
  return prepend(theme.displayFamily, sansStack(theme));
}

/** Mono stack. Falls back to system monospace. */
export function monoStack(theme: ThemeConfig = THEME): string {
  return prepend(theme.monoFamily, SYSTEM_MONO);
}

/** Marquee stack. Cascades to display (and ultimately sans). */
export function marqueeStack(theme: ThemeConfig = THEME): string {
  return prepend(theme.marqueeFamily, displayStack(theme));
}

/** Validated accent hex. Falls back to the brand default if the user
 *  enters something that doesn't match #RGB / #RRGGBB. */
export function accentColor(theme: ThemeConfig = THEME): string {
  const raw = theme.accentColor?.trim();
  if (raw && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)) return raw;
  return DEFAULT_ACCENT;
}

/** Build a single fonts.googleapis.com/css2 URL covering every
 *  configured family, deduplicated. Weights 400+500 cover what the
 *  site uses; if a font doesn't ship 500 the API silently drops it. */
export function googleFontsHref(theme: ThemeConfig = THEME): string | null {
  const families: string[] = [];
  const seen = new Set<string>();
  const push = (name?: string) => {
    const trimmed = name?.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    const encoded = encodeURIComponent(trimmed).replace(/%20/g, '+');
    families.push(`family=${encoded}:wght@400;500`);
  };
  push(theme.sansFamily);
  push(theme.displayFamily);
  push(theme.monoFamily);
  push(theme.marqueeFamily);
  if (families.length === 0) return null;
  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`;
}

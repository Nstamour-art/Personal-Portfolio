import themeData from '@/data/theme.json';

/* ──────────────────────────────────────────────────────────────────────────
 * Theme — currently just typography. Designed so the site can swap any
 * Google Fonts family for sans (body / headlines) and mono (labels,
 * captions, marquee, code) without a code change, just by editing
 * /keystatic and triggering a redeploy.
 *
 * Storage: data/theme.json, edited by the Keystatic Theme singleton.
 * Apply path: app/layout.tsx reads THEME, renders <link> tags for the
 * needed Google Fonts CSS, and sets the --sans / --mono CSS variables
 * inline on <html> so the rest of the site's CSS (which references
 * var(--sans) / var(--mono)) updates everywhere.
 * ──────────────────────────────────────────────────────────────────── */

export interface ThemeConfig {
  /** Google Fonts family name (e.g. "Inter"). Empty = system sans. */
  sansFamily: string;
  /** Google Fonts family name (e.g. "IBM Plex Mono"). Empty = system mono. */
  monoFamily: string;
}

export const THEME: ThemeConfig = themeData as ThemeConfig;

const SYSTEM_SANS = `'Helvetica Neue', 'Helvetica', 'Arial', system-ui, sans-serif`;
const SYSTEM_MONO = `ui-monospace, 'SF Mono', Menlo, Consolas, monospace`;

/** Build the CSS font-family stack for `--sans`, putting the configured
 *  family first and the system stack as fallback. */
export function sansStack(theme: ThemeConfig = THEME): string {
  const family = theme.sansFamily?.trim();
  return family ? `"${family}", ${SYSTEM_SANS}` : SYSTEM_SANS;
}

/** Same for `--mono`. */
export function monoStack(theme: ThemeConfig = THEME): string {
  const family = theme.monoFamily?.trim();
  return family ? `"${family}", ${SYSTEM_MONO}` : SYSTEM_MONO;
}

/** Build the Google Fonts CSS2 URL that loads both families.
 *  Returns null when neither family is configured (no <link> needed).
 *
 *  Weights 400 + 500 cover everything the site uses; if a font doesn't
 *  ship a 500 weight, the CSS2 API silently drops it and the browser
 *  synthesizes the missing weight from 400. */
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
  push(theme.monoFamily);
  if (families.length === 0) return null;
  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`;
}

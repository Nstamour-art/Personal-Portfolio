/**
 * Accent-ink contrast — SPEC §2.
 * Given an accent hex, compute the "ink" colour that sits on top of it.
 * Mirrors the prototype's heuristic exactly: brighter accents get dark ink
 * (#0E1117), darker accents get the page bg.
 */

export function inkForAccent(accentHex: string, darkBg = '#0E1117'): string {
  const luminance = perceivedLuminance(accentHex);
  return luminance > 148000 ? '#0E1117' : darkBg;
}

/**
 * Returns the raw weighted luminance number used by the prototype's heuristic.
 * Compared against 148000 (matches `r*299 + g*587 + b*114 > 148000` in app.jsx).
 */
export function perceivedLuminance(hex: string): number {
  const h = hex.replace('#', '').trim();
  const x = h.length === 3 ? h.replace(/./g, (c) => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return r * 299 + g * 587 + b * 114;
}

import { EDITORIAL } from '@/content/editorial';
import type { EditorialCopy } from '@/content/types';

type Primitive = string | number | boolean | null | undefined;
type CopyValue = Primitive | Primitive[] | Record<string, unknown>;

/**
 * Look up an editorial copy field by dotted path, with a fallback.
 * Mirrors the prototype's `window.copy(path, fallback)` so admin edits and
 * future CMS payloads can substitute strings without touching components.
 *
 *   copy('home.featuredTitle', 'Recent projects')
 *   copy('about.aboutParagraphs', [])
 */
export function copy<T extends CopyValue>(path: string, fallback: T): T {
  const parts = String(path).split('.');
  let cur: unknown = EDITORIAL;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return fallback;
    cur = (cur as Record<string, unknown>)[p];
  }
  if (cur == null || cur === '') return fallback;
  return cur as T;
}

/** Type-safe direct access to the EDITORIAL tree for shape-stable reads. */
export function editorial(): EditorialCopy {
  return EDITORIAL;
}

/**
 * Render a tiny template string with `{key}` placeholders. Used for the
 * Work page headline ({projects} {projectsS} {disciplines} {disciplinesS})
 * and the Footer rights line ({name}). Missing keys leave the placeholder
 * in place so debugging stays loud.
 */
export function template(str: string, vars: Record<string, string | number>): string {
  return str.replace(/\{(\w+)\}/g, (_, k: string) => {
    if (k in vars) return String(vars[k]);
    return `{${k}}`;
  });
}

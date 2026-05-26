import siteData from '@/data/site.json';
import type { SiteConfig } from './types';

/* JSON imports are inlined by webpack at build time — no Node fs in
 * the client bundle. The data is shape-checked by Keystatic's
 * singleton schema in /keystatic.config.ts.
 *
 * The one normalization we do here: `fields.image()` in Keystatic
 * stores `null` (not `''`) when the editor hasn't uploaded an
 * avatar yet, but downstream consumers (SiteHeader, OG images)
 * expect `src: string`. Coalesce at the boundary so the rest of
 * the app never has to think about it. */
type RawSite = Omit<SiteConfig, 'avatar'> & {
  avatar?: { src?: string | null; alt?: string | null } | null;
};

const raw = siteData as RawSite;

export const SITE: SiteConfig = {
  ...raw,
  avatar: {
    src: raw.avatar?.src ?? '',
    alt: raw.avatar?.alt ?? raw.name,
  },
};

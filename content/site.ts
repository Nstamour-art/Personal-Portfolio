import siteData from '@/data/site.json';
import type { SiteConfig } from './types';

/* JSON imports are inlined by webpack at build time — no Node fs in the
 * client bundle. The cast is safe because data/site.json is shape-checked
 * by Keystatic's singleton schema in /keystatic.config.ts. */
export const SITE: SiteConfig = siteData as SiteConfig;

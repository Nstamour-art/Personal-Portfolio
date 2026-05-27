import type { MetadataRoute } from 'next';
import { SITE } from '@/content/site';

/* Web App Manifest emitted at /manifest.webmanifest. Referenced from
 * the root layout's metadata.manifest so the <link rel="manifest"> tag
 * lands in <head> alongside the favicons. Mirrors the file-route style
 * of app/robots.ts and app/sitemap.ts so the manifest is editable as
 * typed TypeScript rather than a hand-maintained JSON blob.
 *
 * The android-chrome PNGs are the realfavicongenerator output sitting
 * at /android-chrome-192x192.png and /android-chrome-512x512.png in
 * /public — what "Add to home screen" reads when installing the site
 * as a PWA on Android. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.short,
    description: SITE.manifesto,
    start_url: '/',
    display: 'standalone',
    background_color: '#0E1117',
    theme_color: '#0E1117',
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}

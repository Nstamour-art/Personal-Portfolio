import type { MetadataRoute } from 'next';

const BASE =
  process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://nstamour.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        /* The admin is GitHub-OAuth gated by Keystatic, but we still keep
         * /keystatic and its API routes out of every crawler — there is no
         * value in indexing the editor surface. */
        disallow: ['/keystatic', '/keystatic/', '/api/keystatic', '/api/keystatic/'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}

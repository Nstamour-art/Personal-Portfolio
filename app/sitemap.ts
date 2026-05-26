import type { MetadataRoute } from 'next';
import { NOTES } from '@/content/notes';
import { PROJECTS } from '@/content/projects';

const BASE =
  process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://nstamour.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, priority: 1.0, changeFrequency: 'weekly' },
    { url: `${BASE}/work`, lastModified: now, priority: 0.9, changeFrequency: 'weekly' },
    { url: `${BASE}/notes`, lastModified: now, priority: 0.7, changeFrequency: 'weekly' },
    { url: `${BASE}/studio`, lastModified: now, priority: 0.6, changeFrequency: 'monthly' },
    { url: `${BASE}/contact`, lastModified: now, priority: 0.6, changeFrequency: 'yearly' },
  ];

  const projectRoutes: MetadataRoute.Sitemap = PROJECTS.map((p) => {
    /* Years may be a range like '2024—2025' or '2022—2023' — use the
     * trailing 4-digit year so sitemap timestamps reflect when the
     * project finished rather than when it started. */
    const match = p.year.match(/(\d{4})(?!.*\d{4})/);
    const lastModified = match ? new Date(`${match[1]}-12-31`) : now;
    return {
      url: `${BASE}/work/${p.id}`,
      lastModified,
      priority: 0.8,
      changeFrequency: 'monthly' as const,
    };
  });

  const noteRoutes: MetadataRoute.Sitemap = NOTES.map((n) => {
    const parsed = Date.parse(n.date);
    return {
      url: `${BASE}/notes/${n.id}`,
      lastModified: Number.isNaN(parsed) ? now : new Date(parsed),
      priority: 0.6,
      changeFrequency: 'monthly',
    };
  });

  return [...staticRoutes, ...projectRoutes, ...noteRoutes];
}

import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono } from 'next/font/google';
import { SITE } from '@/content/site';
import './globals.css';

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://nstamour.vercel.app',
  ),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.manifesto,
  applicationName: SITE.name,
  authors: [{ name: SITE.name }],
  keywords: [
    'motion design',
    'AI workflows',
    '3D',
    'illustration',
    'portfolio',
    'Montréal',
  ],
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.manifesto,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.manifesto,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#0E1117',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={plexMono.variable}>
      <body className="nav-rail-mode caps cursor-on">{children}</body>
    </html>
  );
}

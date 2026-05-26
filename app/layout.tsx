import type { Metadata, Viewport } from 'next';
import { CustomCursor } from '@/components/chrome/cursor';
import { Footer } from '@/components/chrome/footer';
import { NavRail } from '@/components/chrome/nav-rail';
import { PageTransition } from '@/components/chrome/page-transition';
import { SITE } from '@/content/site';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './globals.css';

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
    <html lang="en">
      <body className="nav-rail-mode caps">
        <CustomCursor />
        <NavRail />
        <PageTransition>{children}</PageTransition>
        <Footer />
      </body>
    </html>
  );
}

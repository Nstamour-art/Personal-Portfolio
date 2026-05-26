import type { CSSProperties } from 'react';
import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { CustomCursor } from '@/components/chrome/cursor';
import { Footer } from '@/components/chrome/footer';
import { NavRail } from '@/components/chrome/nav-rail';
import { PageTransition } from '@/components/chrome/page-transition';
import { SITE } from '@/content/site';
import {
  THEME,
  googleFontsHref,
  monoStack,
  sansStack,
} from '@/content/theme';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://nstamour.xyz',
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
  /* Inline CSS custom properties on <html> drive every `var(--sans)` /
   * `var(--mono)` reference in globals.css and the CSS Modules. Setting
   * them here means a Keystatic theme edit flows through end-to-end
   * with just a redeploy. */
  const htmlStyle = {
    '--sans': sansStack(THEME),
    '--mono': monoStack(THEME),
  } as CSSProperties;

  /* When the user has chosen a Google Font, render a single <link> to
   * the CSS2 endpoint plus preconnects so the font shows up before
   * paint. React 19 / Next.js 15 hoists these into <head>. */
  const fontHref = googleFontsHref(THEME);

  return (
    <html lang="en" style={htmlStyle}>
      <body className="nav-rail-mode caps">
        {fontHref && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link
              rel="preconnect"
              href="https://fonts.gstatic.com"
              crossOrigin=""
            />
            <link rel="stylesheet" href={fontHref} />
          </>
        )}
        <CustomCursor />
        <NavRail />
        <PageTransition>{children}</PageTransition>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}

import type { CSSProperties } from 'react';
import type { Metadata, Viewport } from 'next';
import { SITE } from '@/content/site';
import {
  THEME,
  accentColor,
  displayStack,
  googleFontsHref,
  marqueeStack,
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
  /* Inline CSS custom properties on <html> drive every `var(--...)`
   * reference in globals.css and the CSS Modules. Setting them here
   * means a Keystatic theme edit flows end-to-end with just a redeploy:
   *   --sans         body / paragraph stack
   *   --font-display h1/h2/h3 + display headlines stack
   *   --mono         labels / captions / eyebrows stack
   *   --font-marquee giant scrolling home-hero strip stack
   *   --accent       hex accent used by brand mark / CTAs / focus
   */
  const htmlStyle = {
    '--sans': sansStack(THEME),
    '--font-display': displayStack(THEME),
    '--mono': monoStack(THEME),
    '--font-marquee': marqueeStack(THEME),
    '--accent': accentColor(THEME),
  } as CSSProperties;

  /* When the user has chosen a Google Font, render a single <link> to
   * the CSS2 endpoint plus preconnects so the font shows up before
   * paint. React 19 / Next.js 15 hoists these into <head>. */
  const fontHref = googleFontsHref(THEME);

  /* Root layout is intentionally chrome-free. The public site's nav
   * rail, page transitions, custom cursor, footer, and analytics
   * live in app/(site)/layout.tsx so they only mount under the
   * (site) route group. The /keystatic admin route renders directly
   * inside this root layout, owning the full viewport without any
   * site chrome contaminating its scroll container or typography. */
  return (
    <html lang="en" style={htmlStyle}>
      <body>
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
        {children}
      </body>
    </html>
  );
}

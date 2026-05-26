import { ImageResponse } from 'next/og';
import { SITE } from '@/content/site';

/* nodejs runtime: SITE is loaded from data/site.json via Node fs at module
 * scope, which the edge runtime can't do. The OG route still ships small
 * (no React tree to hydrate) and only renders on demand. */
export const runtime = 'nodejs';
export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0E1117',
          color: '#EDE5D8',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 80,
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 22,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#9CA0A6',
          }}
        >
          <span>{SITE.short}</span>
          <span>FOLIO &apos;26</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div
            style={{
              fontSize: 20,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: '#FF5B1F',
            }}
          >
            Motion · 3D · AI workflows
          </div>
          <div
            style={{
              fontSize: 84,
              lineHeight: 1.02,
              letterSpacing: '-0.03em',
              fontWeight: 500,
              maxWidth: 1040,
            }}
          >
            {SITE.tagline}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 22,
            letterSpacing: '0.04em',
            color: '#C8CCD3',
          }}
        >
          <span>{SITE.name}</span>
          <span>{SITE.location}</span>
        </div>
      </div>
    ),
    { ...size },
  );
}

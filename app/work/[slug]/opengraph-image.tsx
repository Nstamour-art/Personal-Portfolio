import { ImageResponse } from 'next/og';
import { getProject } from '@/lib/content';
import { SITE } from '@/content/site';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export const alt = 'Project case study';

export default async function Image({
  params,
}: {
  params: { slug: string };
}) {
  const project = getProject(params.slug);
  const title = project?.title ?? 'Case study';
  const year = project?.year ?? '';
  const disciplines = (project?.disciplines ?? []).join(' · ');
  /* Single brand accent across all OG cards keeps social previews
   * recognisable in feeds — per-discipline tints fragment the brand. */
  const accent = '#FF5B1F';

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
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(ellipse 90% 65% at 80% 100%, ${accent}33, transparent 60%)`,
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 22,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#9CA0A6',
            zIndex: 1,
          }}
        >
          <span>{SITE.short} · Work</span>
          <span>{year ? `Case · ${year}` : 'Case study'}</span>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            zIndex: 1,
          }}
        >
          {disciplines ? (
            <div
              style={{
                fontSize: 20,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: accent,
              }}
            >
              {disciplines}
            </div>
          ) : null}
          <div
            style={{
              fontSize: 96,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              fontWeight: 500,
              maxWidth: 1040,
              textWrap: 'balance',
            }}
          >
            {title}
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
            zIndex: 1,
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

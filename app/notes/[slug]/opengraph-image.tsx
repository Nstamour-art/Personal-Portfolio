import { ImageResponse } from 'next/og';
import { getNote, getReadingTime } from '@/lib/content';
import { SITE } from '@/content/site';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export const alt = 'Note';

export default async function Image({
  params,
}: {
  params: { slug: string };
}) {
  const note = getNote(params.slug);
  const title = note?.title ?? 'Note';
  const kind = note?.kind ?? '';
  const date = note?.date ?? '';
  const readMin = note ? getReadingTime(note.body) : 0;

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
          fontFamily: 'serif',
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
            fontFamily: 'sans-serif',
          }}
        >
          <span>{SITE.short} · Notes</span>
          <span>{date}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {kind ? (
            <div
              style={{
                fontSize: 20,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: '#FF5B1F',
                padding: '6px 16px',
                border: '1px solid #FF5B1F',
                borderRadius: 999,
                alignSelf: 'flex-start',
                fontFamily: 'sans-serif',
              }}
            >
              {kind}
            </div>
          ) : null}
          <div
            style={{
              fontSize: 80,
              lineHeight: 1.02,
              letterSpacing: '-0.025em',
              fontWeight: 500,
              maxWidth: 1040,
              fontFamily: 'sans-serif',
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
            fontFamily: 'sans-serif',
          }}
        >
          <span>{SITE.name}</span>
          <span>{readMin ? `${readMin} min read` : ''}</span>
        </div>
      </div>
    ),
    { ...size },
  );
}

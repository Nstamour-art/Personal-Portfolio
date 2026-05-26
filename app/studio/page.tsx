import type { Metadata } from 'next';
import { copy } from '@/lib/copy';

export const metadata: Metadata = {
  title: 'Studio',
  description: copy('about.headline', ''),
};

export default function StudioPage() {
  return (
    <div className="container" style={{ paddingTop: 120, paddingBottom: 120 }}>
      <p className="t-eyebrow" style={{ color: 'var(--muted)' }}>
        {copy('about.eyebrow', 'Studio')}
      </p>
      <h1 className="t-h1" style={{ marginTop: 24 }}>
        Studio page — coming online in Phase 8
      </h1>
    </div>
  );
}

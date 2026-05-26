import type { Metadata } from 'next';
import { copy } from '@/lib/copy';

export const metadata: Metadata = {
  title: 'Work',
  description: copy('work.lede', ''),
};

export default function WorkIndexPage() {
  return (
    <div className="container" style={{ paddingTop: 120, paddingBottom: 120 }}>
      <p className="t-eyebrow" style={{ color: 'var(--muted)' }}>
        {copy('work.eyebrowPrefix', 'Work')}
      </p>
      <h1 className="t-h1" style={{ marginTop: 24 }}>
        Work index — coming online in Phase 6
      </h1>
    </div>
  );
}

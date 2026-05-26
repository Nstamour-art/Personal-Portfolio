import type { Metadata } from 'next';
import { copy } from '@/lib/copy';
import { SITE } from '@/content/site';

export const metadata: Metadata = {
  title: 'Contact',
  description: copy('contact.headline', SITE.tagline),
};

export default function ContactPage() {
  return (
    <div className="container" style={{ paddingTop: 120, paddingBottom: 120 }}>
      <p className="t-eyebrow" style={{ color: 'var(--muted)' }}>
        {copy('contact.eyebrow', 'Contact')}
      </p>
      <h1 className="t-h1" style={{ marginTop: 24 }}>
        Contact page — coming online in Phase 8
      </h1>
    </div>
  );
}

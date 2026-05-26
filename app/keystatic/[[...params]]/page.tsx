'use client';

import { makePage } from '@keystatic/next/ui/app';
import keystaticConfig from '@/keystatic.config';

/* `force-dynamic` ensures the admin is never statically cached — every
 * request hits middleware.ts so the kill-switch, IP allowlist, and rate
 * limit all apply. */
export const dynamic = 'force-dynamic';

export default makePage(keystaticConfig);

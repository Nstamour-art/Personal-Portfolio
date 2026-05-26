import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/* ──────────────────────────────────────────────────────────────────────────
 * Security middleware — SPEC §16.
 *
 * Two jobs:
 *  1. Apply hardened security headers to every response.
 *  2. Gate the /keystatic admin surface with:
 *      - optional kill-switch (ADMIN_ENABLED=false → 404)
 *      - optional IP allowlist (ADMIN_ALLOWED_IPS=ip[,ip])
 *      - per-IP rate limit (token bucket in instance memory)
 *
 * The rate limit is intentionally simple — it lives in the runtime memory of
 * a single Edge instance and resets on cold start. That's enough to slow
 * down credential-stuffing bursts without standing up Redis. If you need a
 * real global limit, swap _take() with Upstash / Vercel KV.
 * ──────────────────────────────────────────────────────────────────────── */

export const config = {
  /* Skip Next internals + the static folder + the framework's _next chunks.
   * Match everything else so /api routes and image responses still get
   * security headers attached. */
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|woff|woff2|ttf|otf|mp4|webm|map)$).*)'],
};

const ADMIN_PREFIXES = ['/keystatic', '/api/keystatic'] as const;

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdmin = ADMIN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isAdmin) {
    const gate = guardAdmin(req);
    if (gate) return withSecurityHeaders(gate, { admin: true });
  }

  return withSecurityHeaders(NextResponse.next(), { admin: isAdmin });
}

/* ── Admin gate ─────────────────────────────────────────────────────────── */

function guardAdmin(req: NextRequest): NextResponse | null {
  /* Kill switch — flip ADMIN_ENABLED=false to disappear the admin without
   * redeploying the public site. Returns a generic 404 so probes don't
   * confirm the surface exists. */
  if (process.env['ADMIN_ENABLED'] === 'false') {
    return new NextResponse('Not found', { status: 404 });
  }

  /* IP allowlist — opt-in. Empty / unset env = no allowlist. */
  const allow = (process.env['ADMIN_ALLOWED_IPS'] ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (allow.length > 0) {
    const ip = getClientIp(req);
    if (!ip || !allow.includes(ip)) {
      return new NextResponse('Not found', { status: 404 });
    }
  }

  /* Per-IP rate limit — 30 requests / 60s window. Tune via env. */
  const ip = getClientIp(req) ?? 'unknown';
  const max = Number(process.env['ADMIN_RATELIMIT_MAX'] ?? 30);
  const windowMs = Number(process.env['ADMIN_RATELIMIT_WINDOW_MS'] ?? 60_000);
  if (!take(ip, max, windowMs)) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil(windowMs / 1000)) },
    });
  }

  return null;
}

/* ── Security headers ───────────────────────────────────────────────────── */

interface HeaderOpts {
  admin: boolean;
}

function withSecurityHeaders(res: NextResponse, opts: HeaderOpts) {
  /* Content Security Policy.
   *  - 'unsafe-inline' on script-src and style-src is needed by Next.js's
   *    runtime bootstrap and CSS Modules streaming. A nonce-based CSP is
   *    the next hardening step (see ADMIN_SECURITY.md).
   *  - frame-src allows the two embed providers we actually use. If you add
   *    Loom / Wistia / etc, extend this allowlist. */
  const csp = [
    `default-src 'self'`,
    `base-uri 'self'`,
    `object-src 'none'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `script-src 'self' 'unsafe-inline' 'unsafe-eval'`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https:`,
    `font-src 'self' data:`,
    `media-src 'self' blob: https://player.vimeo.com https://*.vimeocdn.com`,
    `frame-src 'self' https://player.vimeo.com https://www.youtube.com https://www.youtube-nocookie.com`,
    `connect-src 'self' https://vitals.vercel-insights.com https://*.vercel-insights.com`,
    `upgrade-insecure-requests`,
  ].join('; ');

  res.headers.set('Content-Security-Policy', csp);
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=()',
  );
  res.headers.set('X-DNS-Prefetch-Control', 'on');

  if (opts.admin) {
    /* Admin pages should never be cached by intermediaries or browsers — a
     * stale auth cookie or page leak would defeat the whole gate. */
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.headers.set('Pragma', 'no-cache');
    res.headers.set('Expires', '0');
  }

  return res;
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

function getClientIp(req: NextRequest): string | undefined {
  /* Vercel sets x-forwarded-for; first entry is the originating IP. */
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]?.trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return undefined;
}

interface Bucket {
  hits: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

function take(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { hits: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.hits >= max) return false;
  b.hits += 1;
  return true;
}

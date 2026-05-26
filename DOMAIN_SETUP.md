# Domain setup — nstamour.xyz + nstamour.art

Two domains, one canonical site:

- **`nstamour.xyz`** — primary. This is what the codebase, sitemap,
  Open Graph URLs, and search engines treat as the canonical hostname.
- **`nstamour.art`** — secondary. 308 Permanent Redirect →
  `https://nstamour.xyz` at the Vercel edge.

The Vercel project's `*.vercel.app` deploy URL stays reachable for
previews but is marked `X-Robots-Tag: noindex, nofollow` by
`middleware.ts` so it never competes with the real domain in search.

---

## 1. In Vercel (Project → Settings → Domains)

### Add the canonical domain

1. Click **Add Domain** → enter `nstamour.xyz` → continue.
2. Vercel asks "Redirect www to apex" (or vice versa). Pick **Apex as
   primary** (`nstamour.xyz`) and let it add `www.nstamour.xyz` as a
   308 redirect → apex. The apex is shorter, more memorable, and matches
   the brand.
3. Vercel issues a free Let's Encrypt cert automatically once DNS
   propagates. No action needed.

### Add the redirect domain

1. Click **Add Domain** → enter `nstamour.art` → continue.
2. When Vercel asks "Add as primary or redirect?" choose
   **Redirect to existing domain** → pick `nstamour.xyz` →
   **308 Permanent**.
3. Repeat for `www.nstamour.art` if you want every variant covered.

After this, every request to `nstamour.art`, `www.nstamour.art`, and
`www.nstamour.xyz` returns a `308` pointing at `https://nstamour.xyz`
before the request ever reaches Next.js. Edge-fast, no function
invocation.

---

## 2. DNS — point both domains at Vercel

You have two choices. Vercel nameservers is the simpler one if your
registrar supports it.

### Option A — Vercel nameservers (recommended)

Vercel manages all DNS records for the domain. Cert renewal, redirect
records, MX, everything stays in one place.

1. In Vercel → Project → Settings → Domains → your domain →
   **Nameservers**, copy the two `ns?.vercel-dns.com` entries.
2. In your registrar (Namecheap, Porkbun, Cloudflare Registrar,
   wherever you bought the domain), open the domain's nameserver
   settings and replace whatever is there with the Vercel pair.
3. Wait 1–24 hours for DNS to propagate. Vercel marks the domain
   **Valid Configuration** when it sees its own nameservers.

Repeat for both `nstamour.xyz` and `nstamour.art`.

### Option B — Keep your existing DNS provider

Add these records yourself in the provider's dashboard.

For **`nstamour.xyz`** (canonical):

| Type    | Name | Value                  | TTL  | Notes                          |
|---------|------|------------------------|------|--------------------------------|
| A       | `@`  | `76.76.21.21`          | Auto | Apex → Vercel Anycast IP       |
| CNAME   | `www`| `cname.vercel-dns.com` | Auto | `www.nstamour.xyz` → Vercel    |

For **`nstamour.art`** (redirect target):

| Type    | Name | Value                  | TTL  | Notes                          |
|---------|------|------------------------|------|--------------------------------|
| A       | `@`  | `76.76.21.21`          | Auto | Apex → Vercel Anycast IP       |
| CNAME   | `www`| `cname.vercel-dns.com` | Auto | `www.nstamour.art` → Vercel    |

Both apex domains use the same Vercel IP — that's expected. Vercel
routes them to the right project by `Host` header at the edge.

If your registrar supports `ALIAS` or `ANAME` records, prefer those
over `A` for the apex (they let DNS resolve dynamically as Vercel
adds nodes). Cloudflare, Hover, and Porkbun all support this; GoDaddy
generally doesn't.

### A note on Cloudflare

If you use Cloudflare DNS (not Vercel nameservers), set the proxy
status (the orange cloud) to **DNS Only** (grey cloud) for both
domains. Cloudflare's proxy and Vercel's edge fight over caching and
SSL termination — DNS-only mode avoids the conflict.

---

## 3. Environment variables on Vercel

Project → Settings → Environment Variables. All for the **Production**
environment unless noted.

| Key                  | Value                          | Notes                                  |
|----------------------|--------------------------------|----------------------------------------|
| `NEXT_PUBLIC_SITE_URL` | `https://nstamour.xyz`       | Canonical URL. No trailing slash.      |
| `ADMIN_ALLOWED_IPS`  | `your.home.ip,your.office.ip` | Optional. Comma-separated IPs.         |

That's it. The Keystatic admin authenticates through Keystatic Cloud
(<https://keystatic.cloud>), which manages its own GitHub App against
the connected repo — no admin env vars live in Vercel. Editor access
is controlled from the Keystatic Cloud project dashboard.

After saving, hit **Deployments → Redeploy** on the latest production
deploy so the new vars take effect.

---

## 4. Verifying it works

After DNS propagates (check with `dig nstamour.xyz A +short` — should
return `76.76.21.21` or similar):

```bash
# 1. Canonical loads
curl -I https://nstamour.xyz
# → HTTP/2 200, security headers present, no X-Robots-Tag

# 2. .art redirects to .xyz
curl -I https://nstamour.art
# → HTTP/2 308, location: https://nstamour.xyz/

# 3. www redirects to apex
curl -I https://www.nstamour.xyz
# → HTTP/2 308, location: https://nstamour.xyz/

# 4. Vercel deploy URL is noindex
curl -I https://your-deploy.vercel.app
# → HTTP/2 200, x-robots-tag: noindex, nofollow

# 5. Sitemap uses the canonical
curl https://nstamour.xyz/sitemap.xml | head -20
# → all <loc> entries start with https://nstamour.xyz/

# 6. Open Graph card resolves correctly
curl -s https://nstamour.xyz | grep "og:url\|og:image"
# → both point at nstamour.xyz
```

---

## 5. Contact email

The site's contact address is stored in `data/site.json` and exposed
through `/keystatic` → Site config → Contact email. It propagates
automatically to the contact page, footer, and Open Graph cards.
Current value: `hello@nstamour.xyz` (forwards to a personal inbox
via registrar-side forwarding).

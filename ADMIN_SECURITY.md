# Admin security playbook

The portfolio admin (`/keystatic`) edits production content. The
threat model assumes a determined attacker who has read the public
site, knows it's built on Keystatic, and is looking for the path of
least resistance into the editor or the GitHub repo behind it.

This document is the procedure for keeping that path closed.

---

## Defence layers

### 1. Keystatic Cloud authentication (the front door)

The admin's authentication is delegated to **Keystatic Cloud**
(<https://keystatic.cloud>), which handles GitHub OAuth on its side
and writes commits back to the connected repo via its own managed
GitHub App.

The portfolio's connection to it lives in `keystatic.config.ts`:

```ts
storage: { kind: 'cloud' },
cloud: { project: 'amberlogiccreative/personal-portfolio' },
```

That's the only place the admin identity is wired up — no env vars,
no client secrets in the Vercel project. Editor management (who can
sign in, who can edit) is done from the Keystatic Cloud dashboard.

**Hardening**:

- Manage the editor list at <https://keystatic.cloud> → your project
  → **Settings → Team members**. Remove anyone who no longer needs
  access. Audit this quarterly.
- Enable **2FA** on every GitHub account that's authorised to use the
  admin. Keystatic Cloud auths against GitHub, so the second factor
  on GitHub is the second factor on the admin.
- Use a dedicated GitHub account for admin work if multiple humans
  need access — easier to audit on both the GitHub side and the
  Keystatic Cloud side.

**Why Cloud over a self-hosted GitHub App**:

- Zero credentials in the app — nothing to leak from a compromised
  Vercel deploy, nothing to rotate quarterly.
- Editor onboarding is a UI invite, not an env var redeploy.
- The trade-off is trusting Keystatic Cloud (Thinkmill, the company
  behind Keystatic) with the GitHub App that has write access to
  this repo. Acceptable for a personal portfolio; revisit if the
  threat model changes.

### 2. Edge middleware (`middleware.ts`)

Runs on every request to `/keystatic/*` and `/api/keystatic/*` before
the route handler sees it.

**Always-on**:

- **Strict CSP** — see `middleware.ts` for the full policy. Frames
  blocked (`frame-ancestors 'none'`), forms scoped to self plus
  Keystatic Cloud (auth callback), `connect-src` allows
  `api.keystatic.cloud` for the admin UI's content API calls. The
  embed providers we use (Vimeo + YouTube) are the only entries in
  `frame-src` besides Keystatic Cloud's auth surface.
- **HSTS** with `max-age=63072000; includeSubDomains; preload`.
- **X-Frame-Options: DENY**, **X-Content-Type-Options: nosniff**,
  strict referrer policy, hardened Permissions-Policy (no camera,
  mic, geolocation, payment, USB, FLoC).
- **No-cache headers** on every admin response so a stale auth cookie
  can't leak through a CDN.
- **Per-IP rate limit**: 30 requests / 60s, in-memory token bucket
  per Edge instance. Tune via `ADMIN_RATELIMIT_MAX` and
  `ADMIN_RATELIMIT_WINDOW_MS`. This is best-effort (Edge memory
  resets on cold start); for hard limits, swap the bucket for Upstash
  or Vercel KV.

**Opt-in**:

- `ADMIN_ENABLED=false` — kill-switch. Returns 404 from every admin
  request without redeploying. Flip this if you suspect compromise,
  then investigate.
- `ADMIN_ALLOWED_IPS=ip[,ip,...]` — IP allowlist. Anyone whose
  `x-forwarded-for` doesn't match gets a 404. Useful when you know
  you only edit from one or two networks.

### 3. Storage (GitHub via Keystatic Cloud's App)

- Every admin edit becomes a commit on `main` of the connected
  GitHub repo, authored by the editor's GitHub identity.
  **Git history is your audit log** — `git log --pretty=fuller` on
  `main` tells you who changed what and when.
- The **Vercel runtime never holds write credentials.** The Keystatic
  admin UI runs in the editor's browser and pushes commits via
  Keystatic Cloud's App. A compromised Vercel function has no token
  to steal.
- Branch protection on `main` (GitHub → Settings → Branches) can
  require pull requests + review for admin edits. Slower edit loop;
  useful if multiple humans contribute.

---

## Day-to-day hygiene

Quarterly (set a calendar reminder, since there are no automated
secrets to rotate anymore):

- **Audit Keystatic Cloud team members** at
  <https://keystatic.cloud> → project → Settings → Team members.
  Remove anyone who shouldn't have admin access.
- **Skim recent commits on `main`**:
  `git log --since="3 months ago" --pretty=fuller`.
  Anything you didn't author is a signal to investigate.
- **Verify 2FA is still on** for every GitHub account with editor
  access (<https://github.com/settings/security>).

That's it. With Keystatic Cloud there are no client secrets,
session-signing keys, or GitHub App credentials to rotate on this
side — if Keystatic Cloud needs to rotate anything internally,
they handle it transparently.

---

## Incident response

If you suspect the admin has been compromised:

### Within 60 seconds

1. **Disable the admin**: set `ADMIN_ENABLED=false` on Vercel and
   trigger a redeploy. The admin returns 404 from every request until
   you flip it back.
2. **Revoke editor access** at <https://keystatic.cloud> → project
   → Settings → Team members → remove the suspected identity (or
   remove everyone and re-invite once it's safe).
3. If you suspect GitHub itself is compromised (not just the
   Keystatic Cloud session), also revoke the Keystatic Cloud App on
   GitHub: <https://github.com/settings/applications> →
   **Authorized OAuth Apps** → revoke Keystatic.

### Within an hour

4. **Audit recent commits** to `main`:
   `git log --since="24 hours ago" --pretty=fuller` shows author +
   timestamp on each. Revert anything suspicious with
   `git revert <sha>` and push.
5. **Reissue 2FA recovery codes** on every GitHub account that had
   admin access.

### Within a day

6. **Re-authorise Keystatic Cloud** on the affected GitHub
   account(s), invite the rightful editors back, and put the admin
   back on with `ADMIN_ENABLED=true`.
7. **Tighten the IP allowlist** (`ADMIN_ALLOWED_IPS`) to networks
   you're known to use, at least temporarily.
8. **Write down what happened** in a private incident log. Patterns
   repeat.

---

## Roadmap — known sharp edges

These don't ship in v1 but are the natural next hardening steps.

### Nonce-based CSP

The current CSP includes `'unsafe-inline'` and `'unsafe-eval'` on
`script-src` because Next.js's runtime bootstrap injects inline
scripts. The fix is to:

1. Generate a nonce in `middleware.ts` per-request.
2. Forward it to the framework via the `x-nonce` header.
3. Have every `<Script />` and inline script pick it up.
4. Drop `'unsafe-inline'` and `'unsafe-eval'` from the policy.

Worth doing once we ship analytics or any third-party script.

### Audit log surfaced in the admin

`/keystatic` currently shows whatever the user is editing but doesn't
display the commit history. A simple read-only "recent edits" panel
fed by the GitHub API would shorten incident response.

### Real distributed rate limit

The in-memory token bucket in `middleware.ts` resets on cold start and
is per-Edge-instance. For a hard limit, swap it for Upstash
(`@upstash/ratelimit`) or Vercel KV. Both have generous free tiers.

### CSP report-uri

Wire `report-uri` and `report-to` to a dedicated endpoint so violations
get logged. Cheap insurance against silent breakage when we tighten
the policy.

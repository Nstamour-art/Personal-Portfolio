# Admin security playbook

The portfolio admin (`/keystatic`) edits production content. The
threat model assumes a determined attacker who has read the public
site, knows it's built on Keystatic, and is looking for the path of
least resistance into the editor or the GitHub repo behind it.

This document is the procedure for keeping that path closed.

---

## Defence layers

### 1. GitHub OAuth (the front door)

The admin's authentication is delegated to a **Keystatic GitHub App**.
Only GitHub users you explicitly authorise on that app can log in and
write content.

**Setup**:

1. Visit <https://keystatic.com/docs/github-setup>.
2. Follow the wizard to create a GitHub App for this repository.
3. Copy the credentials it generates into your Vercel project's
   environment variables:

   - `KEYSTATIC_GITHUB_CLIENT_ID`
   - `KEYSTATIC_GITHUB_CLIENT_SECRET`
   - `KEYSTATIC_SECRET` (a 32+ char random string —
     `openssl rand -base64 32`)
   - `NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`
   - `KEYSTATIC_REPO` (e.g. `nstamour-art/portfolio-26`)

4. Install the app on the portfolio repo **only**. Do not give it
   access to your other repos.

**Hardening**:

- Restrict the app to the production branch (`main`) so admin edits
  can't push to other branches.
- Enable **2FA** on every GitHub account that's authorised to use the
  admin. No exceptions.
- Use a dedicated GitHub account for admin work if multiple humans
  need access — easier to audit than a shared account.

### 2. Edge middleware (`middleware.ts`)

Runs on every request to `/keystatic/*` and `/api/keystatic/*` before
the route handler sees it.

**Always-on**:

- **Strict CSP** — see `middleware.ts` for the full policy. Frames
  blocked (`frame-ancestors 'none'`), inline forms blocked except to
  the same origin, only Vimeo + YouTube allowed in `frame-src`.
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
  request without removing the route from the deploy. Flip this if
  you suspect compromise, then investigate.
- `ADMIN_ALLOWED_IPS=ip[,ip,...]` — IP allowlist. Anyone whose
  `x-forwarded-for` doesn't match gets a 404. Useful when you know
  you only edit from one or two networks.

### 3. Keystatic itself

- Storage is `local` in dev and `github` in production. The GitHub
  storage path means the **production runtime never holds write
  credentials in memory** — Keystatic's UI runs in the editor's
  browser and pushes commits via their own GitHub OAuth tokens.
- All edits become commits on `main`. **Git history is your audit
  log.** Every content change is signed-off by the GitHub identity
  that made it.
- Branch protection on `main` (GitHub → Settings → Branches) can
  require pull requests + review for admin edits. Trade-off: slower
  edit loop. Useful if the admin has multiple contributors.

---

## Day-to-day hygiene

- **`KEYSTATIC_SECRET` rotation is automated.** The
  `.github/workflows/rotate-keystatic-secret.yml` workflow runs on a
  quarterly cron (1st of Jan / Apr / Jul / Oct, 09:00 UTC), generates
  a new value, PATCHes it onto Vercel via the API, triggers a
  redeploy, and opens a GitHub issue with the residual manual tasks.
  Setup is in the next section.
- **Manual hygiene** (the bot opens an issue reminding you to do
  these — close it when done):
  - Rotate `KEYSTATIC_GITHUB_CLIENT_SECRET` on the Keystatic GitHub
    App and update Vercel. (GitHub doesn't let you regenerate via
    API, so this part stays manual.)
  - Audit the GitHub App's authorised users. Remove anyone who no
    longer needs access.
  - Skim recent commits on `main`. Every admin edit is a commit;
    anything you didn't make is a signal to investigate.

### Setting up the automated rotation

One-time setup, ~5 minutes.

**1. Create a Vercel API token.**
Vercel → Account Settings → **Tokens** → **Create Token**.
Name it "GitHub Actions — secret rotation". Scope it to the team
that owns the portfolio project if you have one (otherwise it's
account-wide; acceptable since it lives only in GitHub Secrets).
Copy the token — it shows once.

**2. Find your project ID and (if applicable) team ID.**
Vercel → Project → **Settings → General**. Project ID is at the
bottom. If the project is inside a Team, the team ID is in
Account Settings → General (or in the URL of the team dashboard
as `team_XXXX`).

**3. Create a deploy hook.**
Vercel → Project → **Settings → Git → Deploy Hooks** → **Create
Hook**. Name: "Rotate Keystatic Secret". Branch: `main`. Copy the
generated URL — it embeds its own secret, no auth header needed.

**4. Add four GitHub repository secrets.**
GitHub → repo → **Settings → Secrets and variables → Actions →
Secrets → New repository secret**:

| Name | Value |
|---|---|
| `VERCEL_TOKEN` | from step 1 |
| `VERCEL_PROJECT_ID` | from step 2 |
| `VERCEL_TEAM_ID` | from step 2, **only if applicable** (skip on personal accounts) |
| `VERCEL_DEPLOY_HOOK_URL` | from step 3 |

**5. Smoke-test it.**
GitHub → repo → **Actions** tab → **Rotate KEYSTATIC_SECRET** in
the left sidebar → **Run workflow** → **Run workflow** (green
button). Watch the run; it should finish in ~30 seconds. Then:

- Vercel → Project → Deployments → confirm a new production
  deployment was queued.
- After it finishes, open `/keystatic` — you'll need to sign in
  again with GitHub. That confirms the new secret invalidated the
  old session cookie.
- Repo → Issues → confirm a new "Admin hardening checklist" issue
  was opened with the manual follow-ups.

From here on, the cron handles it. Use the manual trigger in an
incident if you suspect leakage.

---

## Incident response

If you suspect the admin has been compromised:

### Within 60 seconds

1. **Disable the admin**: set `ADMIN_ENABLED=false` on Vercel and
   trigger a redeploy. The admin returns 404 from every request until
   you flip it back.
2. **Revoke the Keystatic GitHub App** on
   <https://github.com/settings/apps>. This kills every existing
   session, drops the OAuth tokens, and locks Keystatic out until you
   re-install.
3. **Rotate every admin env var** on Vercel:
   - `KEYSTATIC_SECRET`
   - `KEYSTATIC_GITHUB_CLIENT_SECRET`

### Within an hour

4. **Audit recent commits** to `main`. `git log --since="24 hours
   ago" --pretty=fuller` shows author + timestamp on each. Revert
   anything suspicious with `git revert <sha>` and push.
5. **Check the GitHub App's webhook deliveries** for unfamiliar
   activity.
6. **Reissue 2FA recovery codes** on every GitHub account that had
   admin access.

### Within a day

7. **Re-install the Keystatic GitHub App**, regenerate credentials,
   and put the admin back on with `ADMIN_ENABLED=true`.
8. **Tighten the IP allowlist** (`ADMIN_ALLOWED_IPS`) to networks
   you're known to use, at least temporarily.
9. **Write down what happened** in a private incident log. Patterns
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

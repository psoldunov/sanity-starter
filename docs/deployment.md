# Deployment

The starter targets Vercel and works anywhere that runs a Next.js 16 server.

## Vercel

### 1. Import the repository

Push your fork to GitHub/GitLab/Bitbucket and import it at
[vercel.com/new](https://vercel.com/new). Vercel detects Next.js; leave the
build settings alone. Set the install command to `bun install` if it is not
detected.

### 2. Environment variables

In Project → Settings → Environment Variables:

| Variable | Environments | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Production, Preview, Development | Required. |
| `NEXT_PUBLIC_SANITY_DATASET` | Production, Preview, Development | Required. |
| `NEXT_PUBLIC_SANITY_API_VERSION` | all | Optional; pin it once live. |
| `NEXT_PUBLIC_SITE_URL` | Production | Optional — set it if you serve from a custom domain you want canonicalised. |
| `SANITY_API_READ_TOKEN` | all | Viewer token. Needed for draft mode and live preview. |
| `SANITY_AUTH_TOKEN` | **Production only** | Deploy Studio token. Only used by the postinstall schema deploy. |

Full descriptions in [configuration](./configuration.md). Leave
`NEXT_PUBLIC_SITE_URL` unset on preview deployments so each preview
canonicalises to its own `VERCEL_URL`.

### 3. What postinstall does on Vercel

[`scripts/postinstall.sh`](../scripts/postinstall.sh) runs after every install:

- **When `VERCEL_ENV=production`**: `sanity schema deploy` followed by
  `sanity manifest extract --path public/admin/static`. This publishes the Studio
  schema so the Sanity Dashboard, Canvas and Agent Actions can discover it. It
  needs `SANITY_AUTH_TOKEN`; without it the step fails and, because the script
  runs under `set -e`, so does the install.
- **Always**: `bun run typegen`, regenerating `schema.json` and
  `src/sanity/types/sanity.types.ts`. Both are gitignored, so they are absent
  from a fresh checkout and every build has to produce them. This step is
  best-effort — if it fails, the script prints guidance and exits 0. `prebuild`
  runs typegen again anyway, and *that* failure is fatal, which is where a real
  configuration problem surfaces.

Set `SKIP_SANITY_TYPEGEN=1` to skip the typegen step in an install-only stage.

### 4. CORS

The Studio and the site both talk to the Content Lake from the browser. Add your
deployment origins at **sanity.io/manage → Project → API → CORS origins**:

- `https://your-domain.com` (with credentials)
- `http://localhost:3000` (with credentials) for local development
- your Vercel preview domain, if you preview from there

### 5. Presentation and draft mode

Presentation is configured in [`sanity.config.ts`](../sanity.config.ts) with
`previewUrl.previewMode.enable = '/api/draft-mode/enable'`. The route handler
lives at
[`src/app/api/draft-mode/enable/route.ts`](../src/app/api/draft-mode/enable/route.ts)
and needs `SANITY_API_READ_TOKEN` in whichever environment you preview from.

The security headers in [`next.config.ts`](../next.config.ts) set
`Content-Security-Policy: frame-ancestors 'self' https://*.sanity.studio` — the
embedded Studio has to frame itself and be framed by Presentation, so
`X-Frame-Options: DENY` is not an option. If you host the Studio somewhere else,
widen that policy to include its origin.

### 6. Custom domain

Add the domain in Vercel, then update:

- `NEXT_PUBLIC_SITE_URL` (if set)
- the CORS origins in sanity.io/manage

## Other platforms

Nothing here is Vercel-specific except the `VERCEL_*` fallbacks in
`getSiteUrl()`. Anywhere that runs a Node 22.12+ Next server works:

```bash
bun install     # runs typegen via postinstall
bun run build
bun start
```

Adjust for the platform:

- **Set `NEXT_PUBLIC_SITE_URL` explicitly.** The `VERCEL_*` fallbacks will not
  fire, so without it metadata and the sitemap fall back to
  `http://localhost:3000`.
- **The schema deploy will not run.** It is gated on `VERCEL_ENV=production`.
  Run `bunx sanity schema deploy` manually (or in your CI pipeline) when the
  schema changes, with `SANITY_AUTH_TOKEN` in the environment.
- **Docker**: install with `SKIP_SANITY_TYPEGEN=1` if credentials are not
  available at that layer, then run `bun run build` in a stage that has them —
  `prebuild` regenerates types there.
- **Static export is not possible.** Draft mode, the Live Content API and the
  embedded Studio all need a server.

The build also emits the Studio route, so `/admin` is served by the same
deployment. To host the Studio separately instead, deploy it with
`bunx sanity deploy` and delete the `(studio)` route group.

## Pre-deploy checklist

- [ ] `bun run check` passes (lint, typecheck, tests)
- [ ] `bun run build` succeeds locally
- [ ] Environment variables set for every environment that needs them
- [ ] `SANITY_API_READ_TOKEN` is a Viewer token, not an Editor token
- [ ] `SANITY_AUTH_TOKEN` set on production only, never in `.env.local`
- [ ] CORS origins added for every deployment domain
- [ ] A `settings` document exists and is published
- [ ] A page with route `/` exists and is published

Related: [configuration](./configuration.md) · [troubleshooting](./troubleshooting.md)

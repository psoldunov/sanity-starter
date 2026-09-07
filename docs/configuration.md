# Configuration

Every environment variable this starter reads, what it does, where to get it,
and whether it is a secret. The template is [`.env.example`](../.env.example);
copy it to `.env.local` for local development.

```bash
cp .env.example .env.local
```

## The `NEXT_PUBLIC_` rule

Next inlines any variable prefixed `NEXT_PUBLIC_` into the JavaScript bundle
every visitor downloads. That is correct for a project ID and a dataset name —
they are public identifiers. It is catastrophic for a token.

**Never give a token a `NEXT_PUBLIC_` prefix.** The two modules enforce the
split:

- [`src/sanity/env.ts`](../src/sanity/env.ts) — public values only. Validated at
  module load, so a missing project ID fails at build time with a readable
  message rather than at request time with an opaque client error.
- [`src/sanity/env.server.ts`](../src/sanity/env.server.ts) — secrets. It starts
  with `import 'server-only'`, which turns any accidental import from a Client
  Component into a build error instead of a leaked token.

> **Upgrading an existing deployment?** The read token used to be
> `NEXT_PUBLIC_SANITY_API_READ_TOKEN`. It is now `SANITY_API_READ_TOKEN`. You
> must rename the variable **and rotate the token** — see
> [upgrading](./upgrading.md#the-read-token-was-renamed-and-must-be-rotated).

## Public variables

These are inlined into the client bundle. All are safe to publish.

### `NEXT_PUBLIC_SANITY_PROJECT_ID`

**Required.** The Sanity project the site reads from.

Get it from [sanity.io/manage](https://www.sanity.io/manage) — it is on the
project page and in the URL. An eight-character string such as `a1b2c3d4`.

Missing it throws at module load:

```
Missing environment variable NEXT_PUBLIC_SANITY_PROJECT_ID. Copy .env.example to .env.local and fill it in — see docs/configuration.md.
```

### `NEXT_PUBLIC_SANITY_DATASET`

**Required.** The dataset within the project, typically `production`. Use a
separate dataset (`development`, `staging`) if you want editors working against
content the live site does not serve.

Datasets are listed under Project → Datasets in
[sanity.io/manage](https://www.sanity.io/manage).

### `NEXT_PUBLIC_SANITY_API_VERSION`

Optional. A date string (`YYYY-MM-DD`) pinning the Content Lake API version.
When unset, `DEFAULT_API_VERSION` in [`src/sanity/env.ts`](../src/sanity/env.ts)
is used — currently `2026-01-22`.

Pin your own once the site is live so a future API change cannot alter query
behaviour under you. See
[Sanity API versioning](https://www.sanity.io/docs/api-versioning).

### `NEXT_PUBLIC_SITE_URL`

Optional. The canonical origin, used for `metadataBase`, canonical URLs,
`sitemap.xml` and `robots.txt`. Write it without a trailing slash
(`https://example.com`); a trailing slash is stripped anyway.

Resolution order in [`src/lib/url.ts`](../src/lib/url.ts):

1. `NEXT_PUBLIC_SITE_URL` if set.
2. `https://$VERCEL_PROJECT_PRODUCTION_URL` when `VERCEL_ENV=production`.
3. `https://$VERCEL_URL` (preview deployments).
4. `http://localhost:$PORT` (default `3000`).

On Vercel you can leave it unset and let steps 2 and 3 supply it. Set it
explicitly if you serve the site from a custom domain you want canonicalised, or
if you deploy anywhere other than Vercel.

## Secrets

Server-side only. Set these in your hosting provider's environment settings, not
in a committed file. `.env*` is gitignored except `.env.example`.

### `SANITY_API_READ_TOKEN`

Required for **draft mode and live preview**; the published site renders without
it. Read by [`src/sanity/env.server.ts`](../src/sanity/env.server.ts) and passed
to `defineLive` in [`src/sanity/lib/live.ts`](../src/sanity/lib/live.ts) as both
`serverToken` and `browserToken`, and to the draft-mode route handler at
[`src/app/api/draft-mode/enable/route.ts`](../src/app/api/draft-mode/enable/route.ts).

Create it at **sanity.io/manage → Project → API → Tokens** with the **Viewer**
role. Give it nothing more — it only ever reads drafts.

Missing it throws:

```
Missing environment variable SANITY_API_READ_TOKEN. Draft mode and live content need a Viewer token — see docs/configuration.md.
```

A note on `browserToken`: `next-sanity` forwards this token to the browser
itself, over its own server-action plumbing, and only when a draft-capable live
connection is opened. That is a runtime transfer on the preview path — it is not
the same as inlining the value into every public bundle, which is what a
`NEXT_PUBLIC_` prefix would do. This is why the token must have Viewer rights
and nothing more.

### `SANITY_AUTH_TOKEN`

**Production and CI only.** Used by `sanity schema deploy` and
`sanity manifest extract` in [`scripts/postinstall.sh`](../scripts/postinstall.sh)
when `VERCEL_ENV=production`, so the Sanity Dashboard, Canvas and Agent Actions
can discover the deployed Studio schema.

Create it at **sanity.io/manage → Project → API → Tokens** with the **Deploy
Studio** role.

**Do not set this in `.env.local`.** It overrides your personal CLI session and
breaks `sanity` commands run from your machine. Set it only as a production
environment variable on your host.

## Build-time flags

### `SKIP_SANITY_TYPEGEN`

Set to `1` to make `postinstall` skip type generation entirely. Useful in a CI
image that installs dependencies before any Sanity credentials exist. Read only
by [`scripts/postinstall.sh`](../scripts/postinstall.sh).

## Supplied by Vercel

Read but never set by you. See [deployment](./deployment.md).

| Variable | Used for |
| --- | --- |
| `VERCEL_ENV` | Gates the production-only schema deploy in `postinstall`, and picks the production URL in `getSiteUrl()`. |
| `VERCEL_PROJECT_PRODUCTION_URL` | Site URL fallback on production deployments. |
| `VERCEL_URL` | Site URL fallback on preview deployments. |
| `PORT` | Local URL fallback only; defaults to `3000`. |

## Summary

| Variable | Required | Secret | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Yes | No | Sanity project |
| `NEXT_PUBLIC_SANITY_DATASET` | Yes | No | Sanity dataset |
| `NEXT_PUBLIC_SANITY_API_VERSION` | No | No | Pins the Content Lake API date |
| `NEXT_PUBLIC_SITE_URL` | No | No | Canonical origin for metadata/sitemap |
| `SANITY_API_READ_TOKEN` | For preview | **Yes** | Draft mode and live content (Viewer) |
| `SANITY_AUTH_TOKEN` | Production only | **Yes** | Schema deploy in postinstall (Deploy Studio) |
| `SKIP_SANITY_TYPEGEN` | No | No | Skip typegen during install |

## Non-environment configuration

Not everything configurable lives in the environment:

- [`src/config/index.ts`](../src/config/index.ts) — `PADDING_CONFIG` (the
  section padding scale and its Tailwind classes), `PROTECTED_ROUTE_PATTERNS`
  (paths a CMS page may not claim), `CRAWLER_DISALLOWED_PATHS`.
- [`src/config/linkables.ts`](../src/config/linkables.ts) —
  `LINKABLE_DOCUMENTS` and `STATIC_ROUTES`. See [links](./links.md).
- [`src/config/sections.ts`](../src/config/sections.ts) —
  `DYNAMIC_SECTION_TYPES`, the sections that read `searchParams`.
- [`src/styles/globals.css`](../src/styles/globals.css) — design tokens as CSS
  custom properties, exposed to Tailwind v4 through `@theme inline`. Rebranding
  is an edit to that one block.
- [`next.config.ts`](../next.config.ts) — `typedRoutes`, allowed image hosts and
  qualities, and the security headers (including the
  `frame-ancestors` policy the embedded Studio and Presentation need).

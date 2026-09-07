# Sanity Starter

A Next.js 16 + Sanity starter for content-driven marketing sites. Fork it,
point it at your Sanity project, and build.

It ships a section-based page builder, an embedded Sanity Studio at `/admin`, a
polymorphic link system that resolves documents and static routes alike, a
templated blog, and generated TypeScript types for every query.

## Features

- **Section-based page builder** — pages are an ordered array of section
  objects; a registry maps each `_type` to a React component.
- **Embedded Studio** at `/admin`, with Presentation, live preview and draft
  mode wired up.
- **Generated types** — Sanity TypeGen derives types from the schema and every
  `defineQuery()` call, so nothing is hand-maintained.
- **Smart links** — one editor field resolves to an internal document, a static
  Next route, an external URL or a file download, with open-redirect protection.
- **Templated blog** at `/posts`, GROQ-paged, as the worked example of a route
  that is not builder-driven.
- **SEO built in** — per-document metadata, canonical URLs, Open Graph images,
  `sitemap.xml`, `robots.txt`, and a `noIndex` flag that sets a real meta tag.
- **Editor-managed redirects**, validated against existing page routes.
- **Server Components by default** — the only client boundaries are the ones
  that need the browser.
- **Design tokens** in one CSS block, exposed to Tailwind v4 via `@theme inline`.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Sanity v6 ·
Tailwind CSS v4 · Biome · Bun

## Quick start

```bash
bun create psoldunov/sanity-starter my-site
cd my-site
cp .env.example .env.local     # add NEXT_PUBLIC_SANITY_PROJECT_ID + _DATASET
bun run typegen
bun dev
```

Site on <http://localhost:3000>, Studio on <http://localhost:3000/admin>. A new
dataset renders nothing until you publish a `settings` document and a page with
route `/`.

Prerequisites: Bun 1.4.2+, Node 22.12+, and a free
[Sanity](https://www.sanity.io/) project. Full walkthrough in
[docs/getting-started.md](./docs/getting-started.md).

## Documentation

| Page | What it covers |
| --- | --- |
| [Getting started](./docs/getting-started.md) | Prerequisites, Sanity project setup, first run, the Studio. |
| [Configuration](./docs/configuration.md) | Every environment variable — purpose, source, which are secret. |
| [Architecture](./docs/architecture.md) | Route groups, the section registry, schema → GROQ → TypeGen → component. |
| [Sections](./docs/sections.md) | Adding a page-builder section, with a full worked example. |
| [Content model](./docs/content-model.md) | `page`, `post`, `settings`, `redirect` — field by field. |
| [Links](./docs/links.md) | `internalDestination`, `LINKABLE_DOCUMENTS`, `STATIC_ROUTES`, `SmartLink`. |
| [Templated pages](./docs/templated-pages.md) | The blog routes, and how to add another non-builder route. |
| [Performance](./docs/performance.md) | Projected queries, cached fetchers, image hints, the `cacheComponents` decision. |
| [Deployment](./docs/deployment.md) | Vercel, production env vars, the postinstall schema deploy, other hosts. |
| [Upgrading](./docs/upgrading.md) | Safe upgrades, the breaking changes already hit, the deliberate version pins. |
| [Troubleshooting](./docs/troubleshooting.md) | Common failures and their fixes. |

Conventions for contributors and AI coding agents live in
[`AGENTS.md`](./AGENTS.md).

> **Upgrading an existing deployment?** The Sanity read token is now
> `SANITY_API_READ_TOKEN`, not `NEXT_PUBLIC_SANITY_API_READ_TOKEN`. Rename the
> variable **and rotate the token** — the old prefix published it in every
> client bundle. See
> [docs/upgrading.md](./docs/upgrading.md#the-read-token-was-renamed-and-must-be-rotated).

## Commands

| Command | What it does |
| --- | --- |
| `bun dev` | Dev server; runs typegen first. |
| `bun run build` | Production build; runs typegen first. |
| `bun start` | Serve the production build. |
| `bun run typegen` | Extract the schema and regenerate types. |
| `bun run lint` / `bun run lint:fix` | Biome check, optionally with fixes. |
| `bun run format` | Biome formatter. |
| `bun run typecheck` | `tsc --noEmit`. |
| `bun test` / `bun run test:coverage` | Unit tests, optionally with coverage. |
| `bun run check` | Lint + typecheck + test. Run before pushing. |

Bun only — do not introduce npm or yarn commands.

## Project layout

```
src/
├── app/
│   ├── (site)/          public site: catch-all page, blog, error/loading/404
│   ├── (studio)/        embedded Sanity Studio at /admin
│   ├── api/             draft-mode route handler
│   ├── robots.ts
│   └── sitemap.ts
├── components/          sections/ layout/ utility/ elements/ blog/
├── config/              padding, protected routes, linkables, dynamic sections
├── fonts/               Geist Sans + Mono
├── hooks/               client-side, SSR-safe
├── lib/                 slug, url, links, image, date, section registry
├── sanity/              schema, queries, fetchers, client, Studio inputs
├── styles/              design tokens + Tailwind entry
└── types/               shared types, incl. SectionProps<T>
```

`schema.json` and `src/sanity/types/sanity.types.ts` are generated and
gitignored. Never edit them by hand.

## Contributing

Contributing to the starter itself? Clone it rather than using `bun create`:
`git clone https://github.com/psoldunov/sanity-starter.git && bun install`.

1. Follow the conventions in [`AGENTS.md`](./AGENTS.md).
2. Add JSDoc to exported functions and hooks (no `@example` blocks).
3. Keep TypeScript strict — no `any` without a reason.
4. Keep schema, GROQ fragment and query in sync; regenerate with
   `bun run typegen`.
5. Run `bun run check` before pushing.
6. Update the relevant page under `docs/` in the same change.

## License

MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Support

- [Sanity documentation](https://www.sanity.io/docs)
- [Next.js documentation](https://nextjs.org/docs)
- Open an issue with the command you ran and the full error output.

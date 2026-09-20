# SSR and Performance Are Hard Requirements

**This starter builds SEO-critical content sites.** Every page must arrive as complete, crawlable
HTML from the server, and Core Web Vitals are a shipping gate — not a follow-up ticket. A pattern
that costs render-blocking JS, a layout shift, or content a crawler cannot see is a defect, even
when it looks fine in the browser.

When a choice trades developer convenience for first-paint HTML or LCP, first-paint HTML wins.

This file is the normative version: what you may and may not do. [`docs/performance.md`](../../docs/performance.md)
is the reasoning behind it — read that when you want to know *why*, or when you are changing the
data layer rather than a page.

## Non-Negotiables

1. **Server Components by default.** `'use client'` is opt-in, pushed to the smallest leaf that
   needs it, and never added to a root layout — a client boundary there drags the whole tree into
   the bundle. There is no `src/app/layout.tsx` in this repo: `(site)` and `(studio)` each carry
   their own root layout, and `src/app/(site)/layout.tsx` is the one that must stay a Server
   Component. Fetch on the server; pass data down as props.
2. **Indexable content ships in the HTML.** Never `useEffect` + `fetch` for text, headings, links
   or CMS data. If a crawler must see it, it renders on the server.
3. **Metadata on every route.** A static `metadata` export, or `generateMetadata` when it depends
   on params. `metadataBase` is set once, in `src/app/(site)/layout.tsx`; every page sets its own
   `alternates.canonical`. A page flagged `noIndex` in the Studio must also set
   `robots: { index: false, follow: false }` — `robots.txt` asks a crawler not to *fetch* a URL, it
   does not stop it indexing one it already knows about.
4. **Do not opt a route into dynamic rendering by accident.** Awaiting `searchParams`, or calling
   `cookies()` / `headers()`, renders the whole route on demand. Doing it in a root layout does it
   to the whole *app*.

   The catch-all page does not read `searchParams` unconditionally. It awaits them only when
   `hasDynamicParams(page)` says one of the page's sections needs them, which reads
   `DYNAMIC_SECTION_TYPES` from `src/config/sections.ts`. **A section that needs query params gets
   its `_type` registered there** — it does not reach for `searchParams` in the page. A page built
   from sections that do not need them stays prerendered.

   `draftMode()` is the exception that does *not* cost you the route: `src/app/(site)/layout.tsx`
   and `Section` — the wrapper every section renders through — both read it, and CMS pages still
   build as `●`. Verified against the route table on `next@16.3.4`; re-check it if that changes.
5. **`SmartImage` and `next/font` only.** No raw `<img>`, no bare `next/image` for a Sanity asset,
   no `<link>` to a font CDN — fonts are declared in `src/fonts/index.ts`. Set `width`/`height` (or
   `fill` plus a sized parent) so nothing shifts, and pass `sizes` on every image that is not
   trivially small.
6. **`preload` marks the LCP image — one per page.** `SmartImage` does not accept `priority`;
   Next 16 deprecates it in favour of `preload` (`node_modules/next/dist/shared/lib/get-img-props.d.ts`).
   Marking several images removes the prioritisation that made it worth marking one.

## Performance Practice

- **Fetch in parallel.** `Promise.all` for independent reads, never a sequential waterfall across
  awaits.
- **Read through `src/sanity/lib/fetchers.ts`.** Those helpers are `React.cache()`-wrapped, so the
  value `generateMetadata` and the component both need costs one round trip. Adding a document type
  means adding its fetchers there, not calling `sanityFetch` twice.
- **`stega: false` for anything feeding `<head>`** — metadata, `sitemap.ts`, `robots.ts`,
  `generateStaticParams`. Stega encodes invisible characters into strings; in a `<title>` or an
  `og:description` that corrupts search results.
- **Project every GROQ query.** An unprojected `*[_type == "page"]` hands a sitemap the entire
  section tree of every page.
- **Stream slow subtrees** with `loading.tsx` / `<Suspense>` rather than blocking the whole route.
- **Third-party scripts go through `next/script`** with a deliberate strategy. Each one is an INP
  risk.
- **Prefer zero client JS.** A component that only renders markup has no reason to be a Client
  Component.

## Verify Before Claiming Done

```bash
bun run lint       # biome check
bun run typecheck  # next typegen && tsc --noEmit
bun run build      # read the route table
```

`bun run check` runs lint + typecheck + test together. `typegen` and `typecheck` need only a
non-empty `NEXT_PUBLIC_SANITY_PROJECT_ID`; `build` needs a real project, because
`generateStaticParams` queries the dataset. See [`docs/configuration.md`](../../docs/configuration.md).

**A route silently flipping from prerendered to dynamic is the most common way this site loses its
performance floor.** Read the table on every build that touches rendering, and say in your summary
what it showed. Cache Components is off here, so the legend is three symbols, not four:

```
○  (Static)   prerendered as static content
●  (SSG)      prerendered as static HTML (uses generateStaticParams)
ƒ  (Dynamic)  server-rendered on demand
```

The baseline, on an unmodified checkout: CMS pages and posts are `●`, `robots.txt` / `sitemap.xml` /
`/_not-found` are `○`, and exactly three routes are legitimately `ƒ` — `/admin/[[...index]]`,
`/api/draft-mode/enable`, and `/posts`. The blog index is dynamic because it awaits `searchParams`
for its `?page=` pagination. Anything else arriving at `ƒ` is a regression until proven otherwise.

A route that reads a search param must **bound** what it accepts. `/posts` parses `?page=` with a
digits-only test and 404s anything else, because `Number.parseInt('1e10')` returns `1` and a lenient
parse would serve page-one content at an unbounded number of distinct URLs.

## Cache Components Is Off — Deliberately

`next.config.ts` does not set `cacheComponents: true`, and turning it on is not part of another
task. It is a structural change, not a flag flip: `draftMode()` is read in
`src/app/(site)/layout.tsx` and in `Section`, so every uncached dynamic access would need a
`<Suspense>` boundary or a `'use cache'` scope before the build passes.
[`docs/performance.md`](../../docs/performance.md) records the reasoning and the five steps adopting
it would take. Raise it as its own change.

## Read the Docs First

Rendering and caching changed shape in Next.js 16. Before writing, read the installed docs — see
[`.agents/rules/docs.md`](./docs.md):

- `node_modules/next/dist/docs/01-app/02-guides/rendering-philosophy.md`
- `node_modules/next/dist/docs/01-app/02-guides/production-checklist.md`
- `node_modules/next/dist/docs/01-app/02-guides/building.md` — the route table and its legend
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md`

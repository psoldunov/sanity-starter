# Performance

Rules this starter already follows, and expects you to keep following. None of
them are micro-optimisations; each removes a whole class of avoidable work.

## 1. Project every GROQ query

The single biggest lever. An unprojected `*[_type == "page"]` returns every field
of every page — the whole section tree, every image object — to a sitemap that
needs two strings.

```groq
/* No */
*[_type == "page" && defined(route.current)]

/* Yes */
*[_type == "page" && defined(route.current)]{ "route": route.current }
```

Every query in
[`src/sanity/lib/queries/index.ts`](../src/sanity/lib/queries/index.ts) is
projected down to what its call site reads. `PAGE_ROUTES_QUERY` returns one
field. `PAGES_SITEMAP_QUERY` returns two and filters `noIndex` in the query
rather than in the app.

Dereference deliberately, too. `asset->` on an image is what supplies blurhash
and dimensions to `SmartImage`, but only project it where the image is actually
rendered — not in a listing that shows a title.

## 2. Page in the query, not in the app

The blog index slices in GROQ:

```groq
*[_type == "post" && defined(slug.current)]
  | order(coalesce(publishedAt, _createdAt) desc)[$start...$end]
```

The Content Lake does the paging, so page 12 costs the same as page 1. Fetching
every post and calling `.slice()` grows linearly with the dataset and transfers
content nobody sees.

## 3. `React.cache()` for reads that happen twice

Nearly every read here happens twice per request: once in `generateMetadata`,
once in the component. `React.cache()` memoises for one render pass, so the
second read is free rather than a second round trip.

```ts
export const getPage = cache(async (slug: string) => {
	const { data } = await sanityFetch({ query: PAGE_QUERY, params: { slug } });
	return data;
});
```

All of these live in
[`src/sanity/lib/fetchers.ts`](../src/sanity/lib/fetchers.ts). When you add a
document type, add its fetchers there rather than calling `sanityFetch` twice.

Cache keys are the arguments, so a cached fetcher must take plain serialisable
arguments and must not close over request state.

## 4. `stega: false` for anything that is not display text

Stega encodes invisible click-to-edit characters into strings — it is what makes
Presentation work, and what corrupts a `<title>`, an `og:description` or a
sitemap URL if it reaches them.

Every fetcher has a metadata twin that passes `stega: false`:
`getSettingsForMetadata`, `getPageForMetadata`, `getPostForMetadata`. The same
applies to `robots.ts`, `sitemap.ts`, `generateStaticParams` and any count.

Stega is only ever active in draft mode anyway (`sanityFetch` decides), so
published traffic is unaffected — but the metadata path must be explicit,
because draft mode renders `<head>` too.

## 5. `Promise.all` for independent reads

Two awaits in sequence are two round trips one after the other. If neither read
depends on the other, issue them together.

```ts
const [page, settings] = await Promise.all([
	getPageForMetadata(currentPath),
	getSettingsForMetadata(),
]);
```

Used in the catch-all page's `generateMetadata`, the site layout (settings and
`draftMode()` together), the article page, the blog index, and `sitemap.ts`.

## 6. Images: `priority` and `sizes`

[`SmartImage`](../src/components/utility/SmartImage.tsx) wraps `next/image` and
adds blurhash placeholders from dereferenced assets.

- **`sizes` on every non-trivial image.** Without it a filled image makes the
  browser assume `100vw` and pick the widest candidate in the srcset at every
  viewport. `SmartImage` defaults `fill` images to `100vw`, which is correct only
  when the image really is full-bleed. Be explicit:
  `sizes='(min-width: 768px) 50vw, 100vw'`.
- **`priority` on the LCP image and nothing else.** The article cover image has
  it; the blog index gives it to the first three cards on page 1 only. Marking
  everything priority removes the prioritisation.
- **Alt text.** `SmartImage` resolves `alt` prop → media library `altText` →
  `image.caption`, and logs in development when all three are empty. Pass
  `decorative` for genuinely presentational images — that is the only case where
  an empty `alt` is right.
- **Formats and hosts** are configured in [`next.config.ts`](../next.config.ts):
  AVIF and WebP, `cdn.sanity.io` only, qualities restricted to 75/85/100.
- **OG images** go through `getCachedOGImageUrl()`, which builds a 1200×630 JPEG
  on the Sanity CDN and routes it through `/_next/image` so Next caches it.

## 7. Static generation where it is free

Both dynamic routes implement `generateStaticParams` with `dynamicParams = true`:
known routes are prerendered at build time, and anything published afterwards
still renders on first request instead of 404ing.

Those params queries pass `perspective: 'published'` and `stega: false` — a build
must never prerender draft content.

## 8. Keep client boundaries small

Server Components by default. The only `'use client'` files are the ones that
genuinely need the browser: the Studio page, the error boundary, the hooks
module, and the Studio input components. Everything else — including every
section component — renders on the server and ships no JavaScript.

When something does need the client, push the boundary as far down as possible.
A provider wrapped around `<html>` puts the entire tree in a client boundary.

Client hooks in [`src/hooks/index.ts`](../src/hooks/index.ts) follow the same
discipline: scroll listeners are passive and coalesced into an animation frame,
and every effect cleans up.

## 9. Keep the Studio out of the site's import graph

The heaviest thing in the repository is the `sanity` Studio runtime, and it must
never be reachable from a public route. Two modules exist purely to break that
edge:

- **[`src/sanity/lib/fragments.ts`](../src/sanity/lib/fragments.ts) imports
  nothing.** Section GROQ fragments used to live beside their schema
  definitions, so `src/sanity/lib/queries` — and through it `robots.ts`,
  `sitemap.ts` and every page — transitively imported `defineSection`, and
  through that the whole Studio. It bloated the public server and client bundles,
  and under Next 16's `react-server` condition it broke the production build
  outright: `sanity` reaches `swr`, which has no default export under that
  condition. Adding an import to that file re-creates the problem.
- **[`src/config/sections.ts`](../src/config/sections.ts) holds
  `DYNAMIC_SECTION_TYPES` so that [`src/lib/slug.ts`](../src/lib/slug.ts) can
  read it without importing [`src/lib/sections.ts`](../src/lib/sections.ts),
  which imports every section component.** Same principle one layer down: keep
  the component graph out of modules the server and the unit tests import.

When you add a module that both the Studio and the site touch, check what it
drags along before importing it from a route.

## `cacheComponents` is not enabled — deliberately

Next 16 ships Cache Components (the stable successor to
`experimental.dynamicIO`), enabled with `cacheComponents: true` in
`next.config.ts` and used through the `use cache` directive. This starter does
**not** enable it.

Why not:

- **It is opt-in and invasive.** Turning it on changes how every uncached
  dynamic access is treated. Every `await` of `params`, `searchParams`,
  `cookies()` or `draftMode()` has to sit inside a `<Suspense>` boundary or a
  cached function, or the build fails. This codebase reads `draftMode()` in the
  site layout and in `<Section>` — the wrapper *every* section renders through —
  so adopting it is a structural change, not a flag flip.
- **A starter should boot.** The failure mode of enabling it prematurely is a
  build error on a fork that has not opted in.

What adopting it would involve, when you want it:

1. Set `cacheComponents: true` in [`next.config.ts`](../next.config.ts).
2. Introduce a single shared `'use cache'` boundary around `sanityFetch` rather
   than sprinkling the directive at call sites. `next-sanity` calls
   `cacheTag`/`cacheLife` internally but does not create the boundary itself, so
   one wrapper module is the intended shape.
3. Split the draft path from the cached path. `draftMode()` and `cookies()` are
   dynamic; resolve the perspective in an uncached wrapper and pass the result
   into cached fetchers as an argument.
4. Wrap genuinely dynamic subtrees — anything reading `searchParams`, and the
   `<Section>` draft-mode check — in `<Suspense>` with real fallbacks.
5. Tag cached reads so webhook-driven revalidation can invalidate them
   precisely.

Until then the starter relies on prerendering plus the Live Content API, which
is simple, correct, and fast enough for the content volumes a starter sees.

## Verifying

```bash
bun run build     # prerendered vs dynamic per route, in the route table
bun run check     # lint + typecheck + test
```

Watch the build output's route table: routes you expect to be static should be
marked as such. A route that unexpectedly went dynamic usually means something
now reads `searchParams`, `cookies()` or `headers()` on a path that previously
did not — check `DYNAMIC_SECTION_TYPES` in
[`src/config/sections.ts`](../src/config/sections.ts) first.

Related: [architecture](./architecture.md) · [templated pages](./templated-pages.md)

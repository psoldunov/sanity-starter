# Troubleshooting

Symptom first, then cause and fix.

## Setup and types

### `Missing environment variable NEXT_PUBLIC_SANITY_PROJECT_ID`

The public env module validates at load, so this fires at build or dev start.

```bash
cp .env.example .env.local
# fill in NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET
```

Values come from [sanity.io/manage](https://www.sanity.io/manage). Restart the
dev server afterwards — Next reads `.env.local` at startup. See
[configuration](./configuration.md).

### `Missing environment variable SANITY_API_READ_TOKEN`

Draft mode or the live connection was initialised without a token. Create a
**Viewer** token at sanity.io/manage → Project → API → Tokens and set
`SANITY_API_READ_TOKEN`.

If you are upgrading and had `NEXT_PUBLIC_SANITY_API_READ_TOKEN`, rename it —
and rotate the token, because the old one shipped in every client bundle. See
[upgrading](./upgrading.md#the-read-token-was-renamed-and-must-be-rotated).

### `Cannot find module '@/sanity/types/sanity.types'`

The generated types have not been produced yet. They are gitignored, so a fresh
clone never has them.

```bash
bun run typegen
```

### `Error: Schema file already exists`

`sanity schema extract` refusing to overwrite `schema.json`. The `--force` flag
is in the `typegen:extract` script; if you edited that script, put it back. See
[upgrading](./upgrading.md#error-schema-file-already-exists).

### `Error: exports is not defined` running typegen

A CommonJS dependency being forced through the Sanity CLI's ESM transform. The
two known offenders are already listed on `ssr.external` in
[`sanity.cli.ts`](../sanity.cli.ts); add any new one to that array. Full
explanation in
[upgrading](./upgrading.md#error-exports-is-not-defined-during-schema-extraction).

### `bun install` printed "Sanity type generation did not complete"

Expected on a fresh clone with no `.env.local`. Dependencies installed fine.
Configure the environment, then `bun run typegen`. The postinstall script exits
0 on purpose here rather than failing the install.

### `Type 'StegaString<...>' is not assignable to '"..." | "..."'`

A literal-union string field compared against the branded type `sanityFetch`
returns. Derive the type through the `Fetched<T>` helper in
[`src/types/index.ts`](../src/types/index.ts), or `stegaClean()` the value before
comparing. See
[upgrading](./upgrading.md#stega-branded-types-from-sanityfetch).

## Studio

### `/admin` is blank or shows a CORS error

The Studio talks to the Content Lake from the browser. Add the origin at
**sanity.io/manage → Project → API → CORS origins**, with credentials allowed:

- `http://localhost:3000` for local development
- your production and preview domains

Then hard-reload. Check the browser console for the exact rejected origin.

### `/admin` fails to load after a schema edit

A schema module that throws takes the whole Studio down. Check the terminal and
the browser console. Common causes: a `_type` used in `sectionTypes` that no
longer exists, a circular import between a schema file and a Studio component,
or a typo in a `defineType` name.

```bash
bun run typegen   # surfaces schema errors outside the browser
```

### A new section does not appear in the Studio insert menu

It is not in `sectionTypes` in
[`src/sanity/schema/objects/sections/index.ts`](../src/sanity/schema/objects/sections/index.ts).
The `page` document builds its `sections` array from that list. See
[sections](./sections.md).

## Rendering

### A section saves in the Studio but renders nothing

Three candidate causes, in order of likelihood:

1. **Not registered as a component.** Add it to
   [`src/lib/sections.ts`](../src/lib/sections.ts) under its exact `_type`. In
   development `SectionRenderer` logs:
   `no component registered for section type "..."`.
2. **Fragment missing from `PAGE_QUERY`.** References and images come back
   unresolved without it. See [sections](./sections.md#4-add-the-fragment-to-page_query).
3. **The section is flagged `hidden`.** It renders dimmed in draft mode and not
   at all on the live site — by design.

### The homepage 404s

The catch-all route needs a published `page` document whose `route` is exactly
`/`, with at least one section. A page with an empty `sections` array is treated
as not found.

### Padding or the anchor `id` has no effect

The section component is not spreading its props into `<Section>`:

```tsx
<Section {...props}>   {/* correct */}
<Section>              {/* padding, id and hidden are all lost */}
```

### Images do not display

- **The query did not dereference the asset.** Add `asset->` inside the image
  projection in the fragment; without it there is no URL, no dimensions and no
  blurhash.
- **The host is not allowed.** `cdn.sanity.io` is configured in
  [`next.config.ts`](../next.config.ts). Another host needs its own
  `remotePatterns` entry.
- **The quality is not allowed.** `qualities` is restricted to 75, 85 and 100.
  Passing anything else to `SmartImage` fails Next's image optimiser.
- **The asset is missing.** `SmartImage` returns `null` rather than rendering a
  broken image.

### Console: `SmartImage: no alt text for ...`

Development-only. Set `altText` on the asset in the media library, pass an `alt`
prop, or pass `decorative` if the image is genuinely presentational.

### A link renders nothing

`SmartLink` returns `null` when it cannot resolve an href, or when there is no
label and no children — deliberately, rather than emitting a dead `href='#'`.
Check that the link has a destination, and that the query projected it with
`INTERNAL_DESTINATION_PROJECTION` rather than a bare `page->`. See
[links](./links.md).

### A link to a static route does nothing

`resolveDestinationUrl` rejects any `staticPath` that is not a same-origin
absolute path — `//evil.com` and `/\evil.com` are refused because browsers treat
them as another origin. Store the path as `/contact`.

## Draft mode and preview

### Draft mode does not activate

- `SANITY_API_READ_TOKEN` must be set in the environment you are previewing
  from, with the Viewer role.
- Presentation's preview URL must point at `/api/draft-mode/enable` — configured
  in [`sanity.config.ts`](../sanity.config.ts).
- Draft mode is a cookie; check it is not blocked, and clear it if a stale one is
  stuck.

### Presentation shows the site but click-to-edit does nothing

Stega encoding is what carries the source links, and it is only active in draft
mode. If a value was fetched with `stega: false` — everything the metadata
fetchers return — it will never be clickable, which is intended. If a rendered
body is not clickable, check whether the component is reading from a
`*ForMetadata` fetcher.

### Metadata contains strange invisible characters

A metadata read that did not pass `stega: false`. Use the metadata variants in
[`src/sanity/lib/fetchers.ts`](../src/sanity/lib/fetchers.ts), or pass the option
directly. See [performance](./performance.md).

### Editors see a "Disable draft mode" control on the live site

That is `DisableDraftMode`, rendered only when draft mode is enabled. It means
the browser holds a draft-mode cookie. Click it, or clear cookies for the
origin.

## Routing and content

### An editor cannot save a page route

`validatePageRoute` rejects routes that do not start with `/`, contain spaces,
tabs or uppercase letters, or begin with a protected prefix (`/api`, `/admin`,
`/posts`). The message names the clashing prefix. Protected prefixes come from
`PROTECTED_ROUTE_PATTERNS` in [`src/config/index.ts`](../src/config/index.ts),
which derives from `LINKABLE_DOCUMENTS`.

### A redirect never fires

- Redirects are checked **only when no page matches** the route. A page with the
  same route always wins; redirect validation rejects that case at save time.
- The destination must resolve. A reference to an unpublished document, or to a
  document with no slug, resolves to nothing and falls through to a 404.

### A newly published page 404s until redeploy

It should not: both dynamic routes set `dynamicParams = true`, so routes outside
`generateStaticParams` render on first request. If it persists, check that the
document is published rather than draft-only, and that the route matches
exactly, leading slash included.

## Build and CI

### `bun run build` fails on Vercel but works locally

- Environment variables missing for that Vercel environment — `prebuild` runs
  typegen, which needs the project ID and dataset.
- `SANITY_AUTH_TOKEN` missing on production, where postinstall runs
  `sanity schema deploy` under `set -e`.
- A generated artefact you have locally but CI does not: `schema.json` and
  `src/sanity/types/sanity.types.ts` are gitignored and must be produced by the
  build.

See [deployment](./deployment.md).

### Biome reports formatting failures on files you did not touch

This project formats with tabs and single quotes and pins Biome to an exact
version. A different Biome version reformats everything. Use the pinned one:
`bun run lint`, or `mise` to get the toolchain.

### `bun run check` fails but you only changed docs

`check` runs lint, typecheck and tests over the whole project. Run the parts
individually to find it: `bun run lint`, `bun run typecheck`, `bun test`.

## Still stuck

- [Sanity documentation](https://www.sanity.io/docs)
- [Next.js documentation](https://nextjs.org/docs)
- Open an issue on the repository with the command you ran and the full error.

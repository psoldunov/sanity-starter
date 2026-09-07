# Links

One editor-facing link field covers three mutually exclusive destinations, and
one component resolves all of them. This page explains the model, the registry
that drives it, and how to extend it.

## The three shapes

A `link` (or `linkWithLabel`) holds exactly one of:

| Shape | Field | Example |
| --- | --- | --- |
| Internal destination | `page` (an `internalDestination` object) | the About page, a post, `/posts` |
| External URL | `href` | `https://example.com`, `mailto:hi@example.com`, `tel:+1555` |
| File download | `file` | a PDF served from the Sanity CDN |

The Studio hides the other two as soon as one is set, so an editor cannot
produce an ambiguous link. Two extra fields:

- `sectionId` — an anchor appended to a **page** reference (`/about#pricing`).
  Hidden unless the destination is a document reference; the custom input hides
  itself entirely for non-page references such as posts.
- `rel` — `noopener` or `noopener noreferrer`, offered only for `http(s)` URLs.

Source: [`src/sanity/schema/objects/link.ts`](../src/sanity/schema/objects/link.ts).
The field is named `page` for content back-compatibility; it holds a full
`internalDestination`, not just a page.

## `internalDestination`

[`src/sanity/schema/objects/internalDestination.ts`](../src/sanity/schema/objects/internalDestination.ts)

A polymorphic object holding **either**:

- `reference` — a reference to a `page`, or to any document type registered in
  `LINKABLE_DOCUMENTS`; or
- `staticPath` — a path to a Next route that has no backing document.

Reference targets are computed from the registry, so registering a type makes it
selectable without touching this file. The Studio picker
([`DestinationReferenceInput`](../src/sanity/components/DestinationReferenceInput.tsx),
[`DestinationField`](../src/sanity/components/DestinationField.tsx)) writes one or
the other, never both.

The single source of truth for "this holds a destination" is `hasDestination()`
in [`src/lib/links.ts`](../src/lib/links.ts). Schema `hidden` predicates and
redirect validation both call it, so they cannot drift apart.

## The registry

[`src/config/linkables.ts`](../src/config/linkables.ts) is the one file to edit.

```ts
export const LINKABLE_DOCUMENTS: readonly LinkableDocument[] = [
	{
		type: 'post',
		label: 'Post',
		basePath: '/posts',
		titleField: 'title',
		slugField: 'slug.current',
	},
];

export const STATIC_ROUTES: readonly StaticRoute[] = [
	{ label: 'Blog', path: '/posts' },
];
```

`page` is always linkable and is not listed — its URL is its own `route` field
rather than a base path plus a slug.

Each `LINKABLE_DOCUMENTS` entry drives four things at once:

1. the reference targets of `internalDestination`
2. the options and labels in the Studio destination picker
3. URL resolution — the public URL is `basePath + '/' + slug`
4. `PROTECTED_ROUTE_PATTERNS` in
   [`src/config/index.ts`](../src/config/index.ts), which stops a CMS page
   claiming `/posts/*` and silently shadowing a real route

`STATIC_ROUTES` lists routes implemented under `src/app` with no document
behind them, so editors can pick them from the same control.

One limitation worth knowing: the picker loads matching documents and filters
client-side, capped by `MAX_DESTINATION_OPTIONS` in
`DestinationReferenceInput`. That is fine for the content volumes a starter
handles; revisit it if a linkable type grows very large.

## URL resolution

`resolveDestinationUrl(destination, sectionId?)` in
[`src/lib/links.ts`](../src/lib/links.ts):

| Destination | Resolves to |
| --- | --- |
| `staticPath` | the literal path, **only if same-origin** |
| `reference` to a `page` | `route.current`, plus `#sectionId` when present |
| `reference` to a linkable type | `basePath + '/' + slug` |
| anything unresolvable | `undefined` |

Static paths pass through `isSafeInternalPath()`, which rejects `//evil.com` and
`/\evil.com`. Both start with a slash and both are resolved by browsers as
protocol-relative URLs to another origin; since `resolveDestinationUrl` feeds
Next's `redirect()` for CMS-managed redirects, a bare `startsWith('/')` check
would turn an editable field into an open redirect.

## Querying links

Always project the destination with `INTERNAL_DESTINATION_PROJECTION` from
[`src/sanity/lib/fragments.ts`](../src/sanity/lib/fragments.ts) — a bare `page->`
returns a reference the resolver cannot use.

```ts
import { INTERNAL_DESTINATION_PROJECTION } from '@/sanity/lib/fragments';

export const SITE_SETTINGS_QUERY = defineQuery(`*[_type == "settings"][0]{
  headerMenu[] {
    ...,
    page ${INTERNAL_DESTINATION_PROJECTION}
  }
}`);
```

The projection dereferences the inner reference to just `_type`, the page
`route`, and the document `slug` — the three fields resolution needs, and
nothing else.

`ResolvedDestination` in [`src/types/index.ts`](../src/types/index.ts) is derived
from `REDIRECT_QUERY_RESULT`, so the type tracks the projection automatically
instead of being maintained by hand.

## `SmartLink`

[`src/components/utility/SmartLink.tsx`](../src/components/utility/SmartLink.tsx)

```tsx
<SmartLink link={link}>Read more</SmartLink>
<SmartLink link={link} />                        {/* uses link.label */}
<SmartLink link={{ href: '/' }}>Home</SmartLink> {/* hand-built link */}
```

Behaviour:

- **Resolution order**: file download → external `href` → internal destination.
- **No resolvable href, or no label?** Renders `null` rather than an `href='#'`
  that goes nowhere.
- **`disabled`** renders a `<span>`, not a link. An `<a>` with
  `pointer-events-none` still takes focus and still activates on Enter, which
  fails WCAG 2.1.1.
- **Target**: `getTarget()` ([`src/lib/url.ts`](../src/lib/url.ts)) returns
  `_blank` only for `http(s)` URLs to another origin. `mailto:` and `tel:` are
  handed to the OS and stay in place. When the target is `_blank`, `rel`
  defaults to `noopener noreferrer`.
- **External links render a plain `<a>`**; `next/link` prefetching and client
  navigation only apply to internal routes.
- File links get a `download` attribute.

Prefer `SmartLink` over a raw `<a>` for anything CMS-driven.

## Adding a linkable document type

Say you add an `event` type served at `/events/<slug>`:

1. Create the schema with a `slug` field and register it in
   [`src/sanity/schema/index.ts`](../src/sanity/schema/index.ts).
2. Add the entry:

   ```ts
   export const LINKABLE_DOCUMENTS: readonly LinkableDocument[] = [
   	{ type: 'post', label: 'Post', basePath: '/posts', titleField: 'title', slugField: 'slug.current' },
   	{ type: 'event', label: 'Event', basePath: '/events', titleField: 'name', slugField: 'slug.current' },
   ];
   ```

3. Build the route at `src/app/(site)/events/[slug]/page.tsx`.
4. `bun run typegen`.

The picker, the `internalDestination` reference targets, `resolveDestinationUrl`
and the `/events/*` route reservation all follow from step 2. Consider adding a
Presentation location in [`src/sanity/lib/resolve.ts`](../src/sanity/lib/resolve.ts)
too, so editors can jump from the document to the live page.

## Adding a static route

For a Next route with no document — say `src/app/(site)/contact/page.tsx`:

```ts
export const STATIC_ROUTES: readonly StaticRoute[] = [
	{ label: 'Blog', path: '/posts' },
	{ label: 'Contact', path: '/contact' },
];
```

Static routes are **not** added to `PROTECTED_ROUTE_PATTERNS`, so an editor can
still create a CMS page at `/contact`. The Next route wins at request time,
since the catch-all only matches what no concrete route claimed. If that
shadowing matters to you, add the path to `PROTECTED_ROUTE_PATTERNS` yourself.

## Adding a whole new link shape

Beyond destination, URL and file — say an anchor-only link, or a modal trigger:

1. Add the field to `sharedFields` in
   [`src/sanity/schema/objects/link.ts`](../src/sanity/schema/objects/link.ts),
   with `hidden` predicates keeping it exclusive with the others.
2. Extend `SmartLinkProps` in [`src/types/index.ts`](../src/types/index.ts).
3. Handle it in `SmartLink`'s resolution chain.
4. Update `sharedPreview.prepare` so the Studio preview shows it.
5. `bun run typegen`.

Related: [content model](./content-model.md) · [architecture](./architecture.md)

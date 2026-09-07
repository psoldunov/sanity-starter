# Architecture

Next.js 16 App Router in front of Sanity, with a section-based page builder and
an embedded Studio. Server Components by default; `'use client'` appears only
where the browser is genuinely needed.

## Route groups

`src/app` is split into two groups so the public site and the Studio get
separate root layouts:

```
src/app/
├── (site)/                      public site
│   ├── layout.tsx               html/body, header, footer, SanityLive, draft-mode chrome
│   ├── loading.tsx              route-level skeleton
│   ├── error.tsx                error boundary ('use client')
│   ├── not-found.tsx            404
│   ├── [[...slug]]/page.tsx     catch-all: every CMS page
│   └── posts/
│       ├── page.tsx             blog index
│       └── [slug]/page.tsx      article
├── (studio)/
│   ├── layout.tsx               minimal html/body + Sanity bridge script
│   └── admin/[[...index]]/page.tsx   embedded Studio ('use client')
├── api/draft-mode/enable/route.ts
├── robots.ts
└── sitemap.ts
```

The catch-all `[[...slug]]` owns everything the CMS drives, which is why real
Next routes have to be reserved against it —
`PROTECTED_ROUTE_PATTERNS` in [`src/config/index.ts`](../src/config/index.ts)
stops an editor claiming `/api/*`, `/admin/*` or any linkable document's base
path (`/posts/*`) as a page route. That list derives from `LINKABLE_DOCUMENTS`
rather than being maintained separately, so registering a new linkable type
reserves its prefix automatically.

The Studio group has its own `<html>` because the Studio is a full application
with its own shell — it must not inherit the site header, footer or fonts.

## Request flow for a CMS page

1. `/[[...slug]]` receives the segments and `normalizeSlug()`
   ([`src/lib/slug.ts`](../src/lib/slug.ts)) turns them into `/about`.
2. `getPage(slug)` ([`src/sanity/lib/fetchers.ts`](../src/sanity/lib/fetchers.ts))
   runs `PAGE_QUERY`.
3. No page? `REDIRECT_QUERY` is tried; a resolvable destination triggers
   `redirect()`, otherwise `notFound()`.
4. Each section is handed to `SectionRenderer`
   ([`src/components/utility/SectionRenderer.tsx`](../src/components/utility/SectionRenderer.tsx)),
   which looks the component up by `_type` in the registry.
5. Each section component wraps its output in `<Section>`
   ([`src/components/utility/Section.tsx`](../src/components/utility/Section.tsx)),
   which applies padding, sets the anchor `id`, and drops hidden sections
   outside draft mode.

`generateMetadata` runs the same reads through the metadata variants
(`getPageForMetadata`, `getSettingsForMetadata`), which pass `stega: false` — see
[performance](./performance.md).

## The section registry

Two registries have to agree, both keyed on the schema `_type`:

| Registry | File | Holds |
| --- | --- | --- |
| Schema | [`src/sanity/schema/objects/sections/index.ts`](../src/sanity/schema/objects/sections/index.ts) | the `sectionTypes` array |
| GROQ | [`src/sanity/lib/fragments.ts`](../src/sanity/lib/fragments.ts) | one fragment constant per section `_type` |
| Component | [`src/lib/sections.ts`](../src/lib/sections.ts) | `_type` → React component |

Fragments live apart from the schema deliberately. When they sat beside their
schema definitions, `src/sanity/lib/queries` — and through it `robots.ts`,
`sitemap.ts` and every page — transitively imported `defineSection` and the
whole `sanity` Studio runtime. That put the Studio in the public bundles, and
under Next 16's `react-server` condition it failed the build outright.
`src/sanity/lib/fragments.ts` therefore imports **nothing**, and must keep
importing nothing.

`SectionRenderer` skips an unknown `_type` rather than throwing — an editor can
save a section whose fragment has not reached `PAGE_QUERY` yet, and that should
not 500 the route. In development it logs what to register.

A fourth, optional registry: `DYNAMIC_SECTION_TYPES` in
[`src/config/sections.ts`](../src/config/sections.ts) lists sections that read
`searchParams`. It lives in `config/` rather than next to the component registry
on purpose — `src/lib/sections.ts` imports every section component, so reading
the list from there would drag React and the whole component graph into
`src/lib/slug.ts` and into anything that tests it.

Full walkthrough: [sections](./sections.md).

## Data flow: schema → GROQ → TypeGen → component

```
src/sanity/schema/**          hand-written schema (defineType/defineField)
        │  sanity schema extract --force
        ▼
schema.json                   generated, gitignored
        │  sanity typegen generate  (also reads every defineQuery() under src/)
        ▼
src/sanity/types/sanity.types.ts   generated, gitignored
        │  StegaBranded<T>  (src/types/index.ts)
        ▼
SectionProps<'heroSection'>, SiteSettings, PostListItem, …
        ▼
components
```

Three consequences worth internalising:

- **Types are derived, never hand-maintained.** Editing
  `src/sanity/types/sanity.types.ts` is pointless; it is regenerated on every
  `bun dev` and `bun run build`.
- **TypeGen resolves `${CONST}` interpolation only for plain string literal
  constants.** Every fragment in
  [`src/sanity/lib/fragments.ts`](../src/sanity/lib/fragments.ts) is a plain
  template literal — no function calls, no `.join()`.
- **Component props derive from the *branded* result.** `sanityFetch` returns
  types deep-branded as `StegaString`, because in draft mode strings may carry
  invisible click-to-edit characters. [`src/types/index.ts`](../src/types/index.ts)
  routes everything through a `Fetched<T>` helper so component props match what
  a component is actually handed. Details in
  [upgrading](./upgrading.md#stega-branded-types-from-sanityfetch).

## Sanity access layer

| Module | Role |
| --- | --- |
| [`src/sanity/lib/client.ts`](../src/sanity/lib/client.ts) | Shared read-only client. `useCdn: true`, `perspective: 'published'`, `stega.studioUrl` for click-to-edit. No token. |
| [`src/sanity/lib/live.ts`](../src/sanity/lib/live.ts) | `defineLive` → `sanityFetch` and `<SanityLive />`. Holds the read token. |
| [`src/sanity/lib/fetchers.ts`](../src/sanity/lib/fetchers.ts) | `React.cache()`-wrapped readers, each with a `stega: false` metadata variant. |
| [`src/sanity/lib/queries/index.ts`](../src/sanity/lib/queries/index.ts) | Every `defineQuery()`. Projected, never `*[...]` bare. |
| [`src/sanity/lib/fragments.ts`](../src/sanity/lib/fragments.ts) | Every shared GROQ projection: `INTERNAL_DESTINATION_PROJECTION` and one fragment per section. Imports nothing, by design. |
| [`src/sanity/lib/utils.ts`](../src/sanity/lib/utils.ts) | `urlFor`, `getSanityFileUrl`, `getCachedOGImageUrl`, protected-route helpers. |
| [`src/sanity/lib/validations.ts`](../src/sanity/lib/validations.ts) | Route validation shared by `page` and `redirect`. |
| [`src/sanity/lib/resolve.ts`](../src/sanity/lib/resolve.ts) | Presentation `locations` and `mainDocuments`. |

Read data with `sanityFetch` — directly for one-off reads, or through a cached
fetcher when the same read happens in both `generateMetadata` and the component.

## Draft mode and live preview

- `/api/draft-mode/enable` uses `defineEnableDraftMode` with a token-bearing
  client. Presentation points at it via `previewUrl.previewMode.enable` in
  [`sanity.config.ts`](../sanity.config.ts).
- `<SanityLive />` in the site layout keeps the page in sync with the Content
  Lake.
- When draft mode is on, the layout also renders `<VisualEditing />` and
  `DisableDraftMode`.
- `<Section>` renders hidden sections dimmed and outlined in draft mode instead
  of omitting them, so an editor can click a hidden block to unhide it.

## Studio configuration

[`sanity.config.ts`](../sanity.config.ts) at the repo root, mounted at
`/admin`:

- **Structure**: Settings (singleton) · Pages · Redirects · Posts, the last three
  as orderable lists from `@sanity/orderable-document-list`.
- **Singletons**: `settings` cannot be created, deleted or duplicated — only
  publish, discard and restore survive.
- **Read-only types**: add a `_type` to `readOnlyTypes` to strip delete,
  duplicate, publish, unpublish and restore from it.
- **Plugins**: `structureTool`, `sanity-plugin-media`, `presentationTool`.
- **Asset sources**: image and file pickers are filtered down to the media
  plugin, so every asset goes through the media library and gets its `altText`
  there.

[`sanity.cli.ts`](../sanity.cli.ts) configures typegen paths and carries a `vite`
hook that is load-bearing — see
[upgrading](./upgrading.md#error-exports-is-not-defined-during-schema-extraction).

## Where each concern lives

| Concern | Location |
| --- | --- |
| Section components | `src/components/sections/` |
| Layout components | `src/components/layout/` (`Header`, `Footer`, `Container`) |
| Shared utility components | `src/components/utility/` (`Section`, `SectionRenderer`, `SmartImage`, `SmartLink`, `Slot`, `DisableDraftMode`) |
| Blog components | `src/components/blog/` (`PostCard`, `PostBody`, `Pagination`) |
| Primitives | `src/components/elements/` (`Button`) |
| Pure utilities | `src/lib/` — `slug.ts`, `url.ts`, `links.ts`, `image.ts`, `date.ts`, `utils.ts`, `sections.ts`, `actions.ts` |
| Configuration | `src/config/` — `index.ts`, `linkables.ts`, `sections.ts` |
| Fonts | `src/fonts/index.ts` |
| Hooks | `src/hooks/index.ts` — all client-side, all SSR-safe |
| Shared types | `src/types/index.ts` |
| Studio inputs | `src/sanity/components/` |
| Styles and tokens | `src/styles/globals.css` |

Unit tests live in `tests/<concern>/`, grouped by what they cover rather than
beside the source, and run under
`bun test`.

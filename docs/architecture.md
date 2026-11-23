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
├── api/markdown/[...path]/route.ts   every page and post as markdown (docs/llm.md)
├── llms.txt/  llms-full.txt/  sitemap.md/  .well-known/api-catalog/
├── robots.ts                    robots.txt, with the Content-Signal line
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
3. No page? `REDIRECT_QUERY` is tried; `resolveRedirect()`
   ([`src/lib/redirects.ts`](../src/lib/redirects.ts)) picks the winning rule —
   exact route, else longest prefix — and a resolvable destination triggers
   `permanentRedirect()` (308) or `redirect()` (307), otherwise `notFound()`.
4. Each section is handed to `SectionRenderer`
   ([`src/components/utility/SectionRenderer.tsx`](../src/components/utility/SectionRenderer.tsx)),
   which looks the component up by `_type` in `SECTION_COMPONENTS`.
5. Each section component wraps its output in `<Section>`
   ([`src/components/utility/Section.tsx`](../src/components/utility/Section.tsx)),
   which applies padding, sets the anchor `id`, and drops hidden sections
   outside draft mode.

`generateMetadata` runs the same reads through the metadata variants
(`getPageForMetadata`, `getSettingsForMetadata`), which pass `stega: false` — see
[performance](./performance.md).

## The section registry

Every section lives in one folder, `src/sections/<name>/`, named after its
schema `_type`. The folder holds the schema, the GROQ fragment, the component, a
Markdown serializer and an optional config. `bun run sections:gen`
([`scripts/sections-gen.ts`](../scripts/sections-gen.ts)) scans the folders and
writes the registries below as gitignored `src/sections/*.generated.ts` files, so
the schema, the query and the component can't disagree about which sections
exist.

| Generated file | Exports | Consumer |
| --- | --- | --- |
| `schemas.generated.ts` | `sectionTypes` | [`src/sanity/schema/index.ts`](../src/sanity/schema/index.ts) and the `page` document's `sections` array |
| `fragments.generated.ts` | `SECTION_FRAGMENTS` | `${SECTION_FRAGMENTS}` in `PAGE_QUERY` |
| `components.generated.ts` | `SECTION_COMPONENTS` | `SectionRenderer`: `_type` → React component |
| `serializers.generated.ts` | `SECTION_SERIALIZERS` | `sectionToMarkdown` in [`src/lib/markdown/sections.ts`](../src/lib/markdown/sections.ts): the Markdown rendering of a page |
| `dynamic.generated.ts` | `DYNAMIC_SECTION_TYPES` | `hasDynamicParams` in [`src/lib/slug.ts`](../src/lib/slug.ts) |

Fragments stay apart from the schema deliberately. When they sat beside their
schema definitions, `src/sanity/lib/queries` (and through it `robots.ts`,
`sitemap.ts` and every page) transitively imported `defineSection` and the
whole `sanity` Studio runtime. That put the Studio in the public bundles, and
under Next 16's `react-server` condition it failed the build outright.
[`src/sanity/lib/fragments.ts`](../src/sanity/lib/fragments.ts) therefore imports
**nothing**, and a section's `fragment.ts` may import only from it.

`DYNAMIC_SECTION_TYPES` is a literal array that imports nothing. A section opts
in with `dynamic: true` in its `config.ts`, and the generator collects the flags.
`src/lib/slug.ts` can read the list without pulling React and the section
components into it, or into anything that tests it.

`SectionRenderer` skips an unknown `_type` rather than throwing, since an editor
can save a section the generator has not seen yet, and that should not 500 the
route. In development it logs what to do.

Full walkthrough: [sections](./sections.md).

## Data flow: schema → GROQ → TypeGen → component

```
src/sanity/schema/**          hand-written schema (defineType/defineField)
src/sections/*/               one folder per section; sections:gen → *.generated.ts
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
  `bun dev` and production build, after `sections:gen` has refreshed the section
  registries.
- **TypeGen resolves `${CONST}` interpolation only for plain string literal
  constants.** Every fragment, in
  [`src/sanity/lib/fragments.ts`](../src/sanity/lib/fragments.ts) and in each
  `src/sections/<name>/fragment.ts`, is a plain template literal: no function
  calls, no `.join()`. That is also why `fragments.generated.ts` imports each
  fragment through its own `<name>.fragment.generated.ts` file.
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
| [`src/sanity/lib/fragments.ts`](../src/sanity/lib/fragments.ts) | Shared GROQ projections such as `INTERNAL_DESTINATION_PROJECTION`. Section fragments live in their section folders. Imports nothing, by design. |
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

- **Structure**: Settings (singleton) · Pages · Redirects · Posts. Pages and
  Redirects are orderable lists from `@sanity/orderable-document-list`; Posts is
  a plain list sorted newest `publishedAt` first, the order the site uses.
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
| Sections | `src/sections/<name>/`: `schema.ts`, `fragment.ts`, component, `markdown.ts`, optional `config.ts` |
| Layout components | `src/components/layout/` (`Header`, `Footer`, `Container`) |
| Shared utility components | `src/components/utility/` (`Section`, `SectionRenderer`, `SmartImage`, `SmartLink`, `Slot`, `DisableDraftMode`) |
| Blog components | `src/components/blog/` (`PostCard`, `PostBody`, `Pagination`) |
| Primitives | `src/components/elements/` (`Button`) |
| Pure utilities | `src/lib/` — `slug.ts`, `url.ts`, `links.ts`, `image.ts`, `date.ts`, `utils.ts`, `actions.ts` |
| Configuration | `src/config/` — `index.ts`, `linkables.ts` |
| Fonts | `src/fonts/index.ts` |
| Hooks | `src/hooks/index.ts` — all client-side, all SSR-safe |
| Shared types | `src/types/index.ts` |
| Studio inputs | `src/sanity/components/` |
| Styles and tokens | `src/styles/globals.css` |

Unit tests live in `tests/<concern>/`, grouped by what they cover rather than
beside the source, and run under `bun test`. Playwright specs for complex
functionality live in `tests/e2e/` and run under `bun run test:e2e`; see
[getting started](./getting-started.md#testing).

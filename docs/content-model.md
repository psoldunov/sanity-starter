# Content model

Four document types: `settings`, `page`, `post` and `redirect`. Each section
below gives the editor's view first, then what the developer needs to know.

Schema source lives in `src/sanity/schema/documents/`. The Studio structure —
Settings, then Pages and Redirects, then Posts — is defined in
[`sanity.config.ts`](../sanity.config.ts).

## Settings (singleton)

[`src/sanity/schema/documents/base/settings.ts`](../src/sanity/schema/documents/base/settings.ts)

Site-wide configuration. Exactly one exists; it cannot be created, duplicated or
deleted, only edited and published.

| Field | Group | Type | Required | Purpose |
| --- | --- | --- | --- | --- |
| `siteName` | General | string | Yes | Used in `<title>` templates, the Open Graph site name, and as the header fallback when no logo is set. |
| `siteDescription` | General | text | Yes | Default meta description, inherited by any page that does not set its own. |
| `logo` | General | image | No | Shown in the header. Falls back to the site name. |
| `headerMenu` | Navigation | array of `linkWithLabel` | Yes | Main navigation. |
| `footerNav` | Navigation | array of columns | No | Each column has a `heading` and at least one `linkWithLabel`. |
| `siteOgImage` | SEO | image | Yes | Default social sharing image for every page and post that does not override it. |

**Developer notes.** Read through `getSettings()` /
`getSettingsForMetadata()` ([`src/sanity/lib/fetchers.ts`](../src/sanity/lib/fetchers.ts)),
both `React.cache()`-wrapped because the site layout and `generateMetadata` both
need them. `SITE_SETTINGS_QUERY` projects link destinations with
`INTERNAL_DESTINATION_PROJECTION`; the resulting types are exported as
`SiteSettings`, `NavLinkItem` and `FooterNavColumn` from
[`src/types/index.ts`](../src/types/index.ts).

Being a singleton is enforced in `sanity.config.ts`: `settings` is in
`singletonTypes`, its create template is filtered out, and only `publish`,
`discardChanges` and `restore` survive as document actions.

## Page

[`src/sanity/schema/documents/base/page.ts`](../src/sanity/schema/documents/base/page.ts)

A page-builder page. Everything the catch-all route `/[[...slug]]` serves is a
`page`.

| Field | Group | Type | Required | Purpose |
| --- | --- | --- | --- | --- |
| `title` | General | string | No | Internal label and metadata fallback. |
| `route` | General | slug | Validated | The URL, written with a leading slash: `/`, `/about`, `/about/team`. |
| `sections` | Content | array of section objects | Yes, min 1 | The page body. Every registered section type is offered here. |
| `metaTitle` | SEO | string | No | Overrides `title` in search results. |
| `metaDescription` | SEO | text | No | Overrides the site description. |
| `ogImage` | SEO | image | No | Overrides `settings.siteOgImage`. |
| `noIndex` | SEO | boolean | Yes | Keeps the page out of search indexes. Defaults to `false`. |
| `orderRank` | — | hidden | — | Drag-to-order position in the Studio list. |

**Route rules**, enforced by `validatePageRoute` in
[`src/sanity/lib/validations.ts`](../src/sanity/lib/validations.ts):

- must start with `/`
- no spaces or tabs
- no uppercase letters
- must not begin with a protected prefix — `/api`, `/admin`, or any linkable
  document base path such as `/posts`. The message names the prefix that
  clashed.

**`noIndex` does two things.** `robots.ts` adds the route to `Disallow`, and
`generateMetadata` emits `robots: { index: false, follow: false }`. The meta tag
is the one that actually keeps a page out of an index — a robots.txt `Disallow`
only asks crawlers not to fetch it. `noIndex` pages are also excluded from
`sitemap.xml`.

**Developer notes.** `PAGE_QUERY` fetches one page plus its section tree;
`PAGE_ROUTES_QUERY` feeds `generateStaticParams`; `PAGES_SITEMAP_QUERY` and
`PAGES_NOINDEX_QUERY` feed the sitemap and robots routes. Sections are rendered
by `SectionRenderer` — see [sections](./sections.md).

## Post

[`src/sanity/schema/documents/post.ts`](../src/sanity/schema/documents/post.ts)

A blog article, rendered by the templated `/posts` routes rather than by the page
builder — the deliberate counterpart to `page`. See
[templated pages](./templated-pages.md).

| Field | Group | Type | Required | Purpose |
| --- | --- | --- | --- | --- |
| `title` | General | string | Yes | Headline on the article and in listings. |
| `slug` | General | slug | Yes | URL segment under `/posts`, generated from the title, max 96 chars. |
| `publishedAt` | General | datetime | No | Orders the index and supplies the displayed date. Defaults to now. Falls back to `_createdAt` when unset. |
| `excerpt` | General | text (max 300) | No | Listing summary and meta-description fallback. |
| `coverImage` | General | image (hotspot) | No | Article header and listing card. |
| `content` | Content | Portable Text | Yes | The body. Accepts rich-text blocks and `contentImage` images. |
| `metaTitle` | SEO | string | No | Overrides `title` in search results. |
| `metaDescription` | SEO | text | No | Overrides `excerpt`. |
| `ogImage` | SEO | image | No | Overrides `coverImage` for social previews. |
| `noIndex` | SEO | boolean | No | Keeps the post out of search indexes. |
| `orderRank` | — | hidden | — | Drag-to-order position in the Studio list. |

Everything beyond title, slug and content is optional on purpose, so an existing
dataset keeps validating after an upgrade and the templates degrade gracefully.

**Developer notes.** Queries: `POSTS_PAGE_QUERY` (paged index, sliced in GROQ),
`POSTS_COUNT_QUERY`, `POST_QUERY` (single article with body), `POST_SLUGS_QUERY`
(`generateStaticParams`), `POSTS_SITEMAP_QUERY`, `RELATED_POSTS_QUERY`.
Ordering everywhere is `coalesce(publishedAt, _createdAt) desc`, so a post with
no date still lands sensibly. Body rendering happens in
[`src/components/blog/PostBody.tsx`](../src/components/blog/PostBody.tsx) via
`@portabletext/react`.

`post` is registered in
[`src/config/linkables.ts`](../src/config/linkables.ts), which is what makes
posts pickable as link destinations and reserves `/posts/*` against page routes.

## Redirect

[`src/sanity/schema/documents/base/redirect.ts`](../src/sanity/schema/documents/base/redirect.ts)

An editor-managed redirect, evaluated when no page owns a requested route.

| Field | Type | Required | Purpose |
| --- | --- | --- | --- |
| `route` | slug | Validated | The source path to redirect from. |
| `destination` | `internalDestination` | Yes | Where it goes: a page, a post, any linkable document, or a static Next route. |
| `orderRank` | hidden | — | Studio ordering. |

Validation (`validateRedirectRoute`) applies every page-route rule, then queries
the Content Lake to reject a route an existing page already owns — a redirect
that shadows a real page would never fire, since the page is matched first.

**Developer notes.** `REDIRECT_QUERY` runs in
`src/app/(site)/[[...slug]]/page.tsx`
only after `PAGE_QUERY` misses; a resolved destination becomes a Next
`redirect()`, otherwise `notFound()`. Resolution goes through
`resolveDestinationUrl`, which rejects protocol-relative paths such as
`//evil.com` — without that guard an editable CMS field would be an open
redirect. These are runtime redirects, not `next.config.ts` ones: they cost a
render pass but do not need a deploy.

## Shared objects

| Type | File | Purpose |
| --- | --- | --- |
| `link` | [`objects/link.ts`](../src/sanity/schema/objects/link.ts) | A link with no label. |
| `linkWithLabel` | same file | The same fields plus `label`. |
| `internalDestination` | [`objects/internalDestination.ts`](../src/sanity/schema/objects/internalDestination.ts) | Document reference **or** static path. |
| Section objects | [`objects/sections/`](../src/sanity/schema/objects/sections) | `heroSection`, `cardsSection`, `imageTextSection`. |

Links are covered in [links](./links.md).

## Constructors

Use these instead of hand-writing repeated field definitions
(`src/sanity/schema/constructors/`):

- **`defineSection({ name, title, icon, fields, preview, disablePadding })`** —
  every section. Adds the `padding`, `id` and `hidden` configuration fields and
  the shared preview component.
- **`defineLink({ withLabel })`** — returns `{ type: 'link' }` or
  `{ type: 'linkWithLabel' }`, a reference to the registered type rather than
  inline fields. Spread it to add `name`, `title` or `description`.
- **`defineImage({ name, title, group, description, validation, fields, hotspot })`** —
  an image field accepting WebP/PNG/JPEG/AVIF with blurhash metadata. Alt text
  comes from the media library's `altText` on the asset, not from a field here.

Option types live in
[`src/sanity/schema/constructors/types.ts`](../src/sanity/schema/constructors/types.ts).

## Adding a document type

1. Create the schema under `src/sanity/schema/documents/`.
2. Add it to `schemaTypes` in
   [`src/sanity/schema/index.ts`](../src/sanity/schema/index.ts).
3. Add a list item to the structure in [`sanity.config.ts`](../sanity.config.ts).
4. If it has a public URL, register it in `LINKABLE_DOCUMENTS`
   ([links](./links.md)) and add a Presentation location in
   [`src/sanity/lib/resolve.ts`](../src/sanity/lib/resolve.ts).
5. Add projected queries in `src/sanity/lib/queries/index.ts`, a route under
   `src/app/(site)/`, and sitemap entries.
6. `bun run typegen`.

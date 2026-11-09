# Templated pages

Not every route should be a page-builder page. A blog article has a fixed shape:
title, date, cover image, body, related posts. Handing that to an editor as a
stack of sections means every article can be assembled differently, and none of
them can be restyled at once.

The `/posts` routes are this starter's worked example of the alternative — a
**templated route**: the developer owns the layout, the editor owns the fields.

## When to use which

| | Page builder (`page`) | Templated route |
| --- | --- | --- |
| Layout owned by | editor | developer |
| Content type | marketing pages, landing pages | articles, products, events, team members |
| Route | `/[[...slug]]`, from `route.current` | its own directory under `src/app/(site)/` |
| Change the layout of all of them | edit each page | edit one component |
| Add a field | new section type | new schema field |

Rule of thumb: if every instance should look the same, template it.

## The two blog routes

```
src/app/(site)/posts/
├── page.tsx            index: paged listing
└── [slug]/page.tsx     article
```

### Index — `src/app/(site)/posts/page.tsx`

- `PAGE_SIZE = 9`, defined in the file.
- `parsePageParam()` turns `?page=` into a 1-based number, defaulting to 1 for
  anything malformed.
- Two reads issued together with `Promise.all`: `POSTS_PAGE_QUERY` (the slice)
  and `POSTS_COUNT_QUERY` (the total, `stega: false` — it is a number, not
  display text).
- **Paging happens in GROQ**, not in the app:

  ```groq
  *[_type == "post" && defined(slug.current)]
    | order(coalesce(publishedAt, _createdAt) desc)[$start...$end]
  ```

  Page 12 costs the same as page 1. Fetching every post and slicing in
  JavaScript is the mistake this avoids.
- The first card on page 1 gets `preload` — it is the likely LCP. Only one:
  Next documents `preload` as the wrong tool once several images are LCP
  candidates, because preloading all of them prioritises none.
- Empty state and pagination are explicit; `Pagination` renders real links so
  the pages are crawlable and work without JavaScript, and renders `null` when
  there is only one page.

### Article — `src/app/(site)/posts/[slug]/page.tsx`

- `generateStaticParams` from `POST_SLUGS_QUERY`, with `dynamicParams = true`
  so a post published after the build still renders on first request.
- `generateMetadata` reads `getPostForMetadata(slug)` and
  `getSettingsForMetadata()` together via `Promise.all`. Both are
  `React.cache()`-wrapped, so the article body's own `getPost(slug)` does not
  pay for a second round trip within the same render.
- Open Graph type is `article`, with `publishedTime`. The OG image falls back
  `post.ogImage → post.coverImage → settings.siteOgImage`.
- `alternates.types` points agents at the post's markdown, and `PostJsonLd`
  renders a `BlogPosting` with a breadcrumb through the blog index (see
  [the LLM layer](./llm.md)).
- The cover image is `preload` with an explicit `sizes`.
- Body rendering goes through
  [`PostBody`](../src/components/blog/PostBody.tsx), which maps Portable Text to
  elements — only images and links are overridden; block typography lives in the
  `.prose-content` class.
- `RELATED_POSTS_QUERY` pulls three siblings, excluding the current post.

Supporting components live in `src/components/blog/`: `PostCard`, `PostBody`,
`Pagination`.

## Reserving the route

The catch-all `/[[...slug]]` would otherwise let an editor create a page at
`/posts/hello` that shadows a real article. It cannot, because `post` is
registered in `LINKABLE_DOCUMENTS` and `PROTECTED_ROUTE_PATTERNS` derives
`/posts/*` from that registry. See [links](./links.md).

## Adding another templated route

Adding `/events`, backed by an `event` document:

1. **Schema** — `src/sanity/schema/documents/event.ts` with at minimum `title`,
   `slug`, and whatever the template renders. Register it in
   [`src/sanity/schema/index.ts`](../src/sanity/schema/index.ts) and add a list
   item to the structure in [`sanity.config.ts`](../sanity.config.ts).

2. **Registry** — add it to `LINKABLE_DOCUMENTS` in
   [`src/config/linkables.ts`](../src/config/linkables.ts) with
   `basePath: '/events'`. This makes events pickable as link destinations and
   reserves `/events/*` against CMS pages in one move.

3. **Queries** — projected, in `src/sanity/lib/queries/index.ts`:

   ```ts
   export const EVENT_SLUGS_QUERY = defineQuery(
   	`*[_type == "event" && defined(slug.current)]{ "slug": slug.current }`,
   );

   export const EVENT_QUERY =
   	defineQuery(`*[_type == "event" && slug.current == $slug][0]{
     _id,
     title,
     "slug": slug.current,
     startsAt,
     description
   }`);
   ```

4. **Cached fetchers** — in
   [`src/sanity/lib/fetchers.ts`](../src/sanity/lib/fetchers.ts), one for
   rendering and one for metadata:

   ```ts
   export const getEvent = cache(async (slug: string) => {
   	const { data } = await sanityFetch({ query: EVENT_QUERY, params: { slug } });
   	return data;
   });

   export const getEventForMetadata = cache(async (slug: string) => {
   	const { data } = await sanityFetch({
   		query: EVENT_QUERY,
   		params: { slug },
   		stega: false,
   	});
   	return data;
   });
   ```

5. **Routes** — `src/app/(site)/events/page.tsx` and
   `src/app/(site)/events/[slug]/page.tsx`, following the shapes above:
   `generateStaticParams`, `generateMetadata` with a canonical URL, and
   `notFound()` when the document is missing.

6. **Sitemap** — add an `EVENTS_SITEMAP_QUERY` and fold its entries into
   [`src/app/sitemap.ts`](../src/app/sitemap.ts), inside the existing
   `Promise.all`.

7. **Presentation** — add a location resolver in
   [`src/sanity/lib/resolve.ts`](../src/sanity/lib/resolve.ts) and, if the route
   should be openable directly in Presentation, a `mainDocuments` entry. Put it
   **before** the catch-all `{:slug(.*)}` entry, which matches everything.

8. **Static route** — optionally add `{ label: 'Events', path: '/events' }` to
   `STATIC_ROUTES` so editors can link to the index page.

9. **AI agents** — give each event the same treatment posts get, so agents can
   read it. The full checklist is in
   [the LLM spec](../.agents/rules/llm.md#adding-a-document-type-with-a-public-url);
   the parts specific to a templated route:

   - **Markdown.** Add an `eventToMarkdown` in `src/lib/markdown/document.ts`,
     dispatch `/events/` to it in
     [`src/app/api/markdown/[...path]/route.ts`](../src/app/api/markdown/[...path]/route.ts),
     and list every event in that file's `generateStaticParams`. The
     `alternates.types` link in the event's `generateMetadata` points agents at
     it.
   - **`llms.txt`.** Add an `Events` group to `indexGroups` in
     [`src/lib/markdown/indexFiles.ts`](../src/lib/markdown/indexFiles.ts), and
     the events' markdown to `/llms-full.txt`.
   - **Markdown requests for the index.** `PAGE_PATH` in
     [`next.config.ts`](../next.config.ts) redirects a page URL requested with
     `Accept: text/markdown` to its `.md` URL. The paginated `/events` index has
     no markdown, so add `(?!events$)` beside the `(?!posts$)` already there.
     Otherwise an agent asking for it is redirected to a 404.
   - **JSON-LD.** Add a builder like `buildPostJsonLd` (an `Event`, with a
     breadcrumb through `/events`) and render it with `<JsonLd>` on the route.

10. `bun run typegen`, then `bun run check`.

## Mixing the two

A templated route can still use the page builder underneath. Add a `sections`
array to the document schema, add its fragment to the document's query, and
render `SectionRenderer` in the template — the article page notes exactly this
as the escape hatch for adopters who want builder-driven posts. The reverse also
works: a `page` section can render a listing by querying inside the section
component.

Related: [sections](./sections.md) · [content model](./content-model.md) ·
[performance](./performance.md)

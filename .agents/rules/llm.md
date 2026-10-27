# The LLM Layer (GEO) — Spec

**This starter serves every indexable page and post to AI agents as clean markdown, lists them in
`/llms.txt`, and describes them in schema.org JSON-LD.** Treat that layer as part of the site, not a
plugin: a section, document type or route you add is not finished until agents can read it.

This file is the normative version: what you must and must not do. [`docs/llm.md`](../../docs/llm.md)
is the guide — how it works, how editors use it, and worked examples. Read it before your first
change here.

## What exists

| Surface | Source | Rendering |
| --- | --- | --- |
| `/<route>.md`, `/index.md`, `/posts/<slug>.md` | `src/app/api/markdown/[...path]/route.ts`, reached by an `afterFiles` rewrite | `●` |
| `Accept: text/markdown` on a page or post URL | `redirects()` in `next.config.ts` → 307 to its `.md` URL | — |
| `/llms.txt`, `/llms-full.txt`, `/sitemap.md` | `src/app/<file>/route.ts`, built by `src/lib/markdown/indexFiles.ts` | `○` |
| `/robots.txt` with `Content-Signal` | `src/app/robots.txt/route.ts`, values in `src/config/llm.ts` | `○` |
| `/.well-known/api-catalog` (RFC 9727) + `Link` header on every response | `src/app/.well-known/api-catalog/route.ts`, `headers()` in `next.config.ts` | `○` |
| `<link rel="alternate" type="text/markdown">` | `alternates.types` in both `generateMetadata`s | — |
| JSON-LD: Organization + WebSite (home), WebPage subtype (every page), BlogPosting (posts) | `src/lib/structuredData.ts`, rendered by `src/components/utility/JsonLd.tsx` | — |
| Per-document editor controls | `geo` object (`src/sanity/schema/objects/geo.ts`) on `page` and `post` | — |

## Non-negotiables

1. **Markdown is built from the data, never from rendered HTML.** Serializers read the query
   result. `src/lib/markdown/` must import no React, no component and no Sanity client — the same
   rule as `src/config/sections.ts` — so route handlers and tests can load it.
2. **Every section `_type` has a serializer** in `SECTION_SERIALIZERS`
   (`src/lib/markdown/sections.ts`). The map is a mapped type over the `PAGE_QUERY_RESULT` section
   union, so typecheck fails until it exists. Never silence that with a cast or a stub returning
   `''` for a section that shows text.
3. **Write what the page shows, in the order it shows it.** Headings follow the page outline, not
   the component's tag: a hero heading is `#`, other section headings `##`, items inside a section
   `###`. Drop what carries no meaning outside the page: decorative images (no alt text), button
   labels for in-page actions, layout-only copy. Make every link absolute.
4. **The LLM layer reads published, stega-free data only** — `getPublishedPage`,
   `getPublishedPost`, `getPublishedSettings`, `getIndexablePages`, `getIndexablePosts`,
   `getPublishedRedirects` in `src/sanity/lib/fetchers.ts`. Never `getPage` / `getPost` there:
   stega characters would reach the model, and reading draft mode makes the route dynamic.
5. **A page URL never answers with markdown.** Negotiation is a **307** to the `.md` URL. Do not
   turn it into an in-place rewrite, a 308, or a proxy, and do not add `Cache-Control` or `Vary`
   machinery to it. One body per URL is what keeps the layer safe behind a CDN that ignores `Vary`;
   a 307 without freshness headers is never stored by a shared cache (RFC 9111 §4.2.2).
6. **`noIndex` beats everything.** A `noIndex` page or post gets no markdown (404), no index entry,
   no `alternate` link. `geo.llmsListing` only decides *listing*: `unlisted` documents keep their
   markdown and their `alternate` link.
7. **Every new route stays static.** Route handlers export `dynamic = 'force-static'`; documents
   get `generateStaticParams`. A build that shows any LLM route as `ƒ` is a regression (see
   [`ssr.md`](./ssr.md)).
8. **JSON-LD goes through `JsonLd` and the builders in `src/lib/structuredData.ts`.** Never
   `JSON.stringify` into a `<script>` yourself: `serializeJsonLd` escapes `<`, and that escape is
   the only thing between CMS copy and the page's script context. JSON-LD reads the stega-free
   (`*ForMetadata`) copies of the data.
9. **`robots.txt` keeps one `User-agent: *` group.** A per-bot group (`User-agent: GPTBot`)
   replaces the `*` group for that bot and silently drops its `Disallow` lines. Content-signal
   values live in `CONTENT_SIGNALS` and are a client decision — change them only when told to.
10. **The markdown is `noindex`.** `llmResponse` sets `X-Robots-Tag: noindex` on every response it
    builds, and `next.config.ts` gives each `.md` URL a canonical `Link` to its HTML page. Do not
    add `.md` URLs to `sitemap.xml`.

## Checklists

### Adding a page-builder section

The steps in `AGENTS.md` (step 8 is the serializer), plus:

- [ ] A serializer in `SECTION_SERIALIZERS`, written to rule 3. Reuse the helpers in
      `src/lib/markdown/format.ts`; add one there only when a second serializer will need it
- [ ] Links resolved with `resolveLinkHref` (`src/lib/links.ts`) and made absolute with
      `absoluteUrl` (`src/lib/markdown/links.ts`); in-page actions dropped
- [ ] `/<route>.md` of a page using the section reads well (verification below)

### Adding a document type with a public URL

After the steps in `docs/content-model.md` → *Adding a document type*:

- [ ] Its full query projects `_updatedAt` and `geo`; an `LLM_<TYPE>S_QUERY` projects what an index
      entry reads, with the `noIndex != true` filter
- [ ] `getPublished<Type>` and `getIndexable<Type>s` in `src/sanity/lib/fetchers.ts`, both
      `stega: false, perspective: 'published'`
- [ ] A `<type>ToMarkdown` in `src/lib/markdown/document.ts`
- [ ] The markdown route dispatches its base path to it, and `generateStaticParams` lists it
- [ ] A group in `indexGroups` (`src/lib/markdown/indexFiles.ts`), and its documents in
      `/llms-full.txt`
- [ ] `alternates.types` in its `generateMetadata`, skipped when `noIndex`
- [ ] A JSON-LD node builder in `src/lib/structuredData.ts` and a `<JsonLd>` on its route
- [ ] `defineField({ name: 'geo', type: 'geo', group: 'geo', hidden: ({ document }) => Boolean(document?.noIndex) })`
      on the schema
- [ ] `PAGE_PATH` in `next.config.ts` still matches its URLs, and excludes its index route if that
      has no markdown

### Adding a block type to post content

- [ ] A renderer in `types` in `postBodyToMarkdown` (`src/lib/markdown/portableText.ts`). Unknown
      types are dropped silently, by design

### Adding a static route (`STATIC_ROUTES`)

- [ ] Either give it markdown, or exclude it from `PAGE_PATH` in `next.config.ts` — otherwise an
      agent asking for its markdown is redirected to a 404

### Adding a page JSON-LD type

- [ ] Add it to `PAGE_SCHEMA_TYPES` (`src/config/llm.ts`) only if it is a `WebPage` subtype that is
      valid without extra markup. `FAQPage` is not: it needs question-and-answer content

## Verification

`bun run check`, then `bun run build` and read the route table (rule 7). Then `bun run start` and:

```bash
B=http://localhost:3000
curl -sI -H 'Accept: text/markdown' $B/about          # 307, location: /about.md
curl -s  $B/about.md                                   # front matter, then the sections
curl -sI $B/about.md | grep -iE 'x-robots|link'        # noindex; canonical → /about
curl -s  $B/llms.txt                                   # Pages, Posts, Optional
curl -s  $B/ | grep -o '<script type="application/ld+json">[^<]*'
```

`tests/routing/markdown.test.ts` guards the path mapping and the listing groups;
`tests/seo/structuredData.test.ts` guards the JSON-LD escape. Do not add tests that assert on
serializer output copy — read the `.md` URL instead ([`testing.md`](./testing.md)).

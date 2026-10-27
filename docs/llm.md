# The LLM layer (GEO)

AI assistants and agents read websites to answer questions about them. This starter gives them a
version of the site they can read cheaply and cite accurately: every indexable page and post as
markdown, an index of those files in `/llms.txt`, and schema.org JSON-LD in every page's HTML.
Search engines keep reading the HTML, and nothing here changes what a browser gets.

The rules an agent or contributor must follow when changing any of this are in
[`.agents/rules/llm.md`](../.agents/rules/llm.md). This page explains how it works and how to
extend it.

## What agents get

| URL | What it is |
| --- | --- |
| `/index.md`, `/about.md`, `/posts/hello.md` | A page or post as markdown: YAML front matter (title, description, canonical URL, dates), then the content. |
| `/llms.txt` | The site name and description, then a linked list of every document with a one-line summary, following [llmstxt.org](https://llmstxt.org). |
| `/llms-full.txt` | Every listed document's markdown in one file, for an agent that wants the whole site in one request. |
| `/sitemap.md` | The `/llms.txt` list without the summaries. |
| `/robots.txt` | The usual rules plus a `Content-Signal` line saying what crawlers may do with the content. |
| `/.well-known/api-catalog` | An [RFC 9727](https://www.rfc-editor.org/rfc/rfc9727) linkset pointing at the files above. |

The markdown is built from the Sanity data, so it holds the copy and none of the markup. For
example, a hero section becomes a `#` heading, its paragraph and its image with alt text.

## How agents find it

An agent can arrive at the markdown in four ways:

- It requests a page URL with `Accept: text/markdown`. The site answers with a 307 redirect to the
  `.md` URL.
- It reads the `<link rel="alternate" type="text/markdown">` tag in a page's `<head>`.
- It fetches `/llms.txt`, which agents increasingly check first.
- It follows the `Link: </.well-known/api-catalog>; rel="api-catalog"` header that every response
  carries.

Each `.md` response is sent with `X-Robots-Tag: noindex` and a `Link` header naming the HTML page
as canonical, so search engines keep ranking the page and ignore the copy.

## Controls for editors

Pages and posts have an **AI & LLMs** tab in the Studio with three fields, stored in a `geo`
object.

| Field | What it does |
| --- | --- |
| Listing in llms.txt | `Listed` (the default) puts the document under `Pages` or `Posts`. `Optional` moves it under `## Optional`, which llmstxt.org defines as the part an agent may skip when it needs a shorter context. `Not listed` leaves it out of `/llms.txt`, `/llms-full.txt` and `/sitemap.md`. Its markdown is still served. |
| Summary for AI agents | One or two sentences on what the page answers. Used in `/llms.txt` and the markdown front matter instead of the meta description. A meta description is written to earn a click; this one only has to inform. |
| Page type | Pages only. The schema.org type the page's JSON-LD declares: `WebPage`, `AboutPage`, `ContactPage` or `CollectionPage`. Posts are always `BlogPosting`. |

"Hide from search engines" (`noIndex`) overrides all three. A hidden page or post gets no markdown,
no index entry and no alternate link, and the Studio hides the AI tab while it is on.

## How a document becomes markdown

```text
GET /about.md
  └─ afterFiles rewrite → /api/markdown/about.md            (force-static, prerendered)
       ├─ getPublishedPage('/about')                         stega off, published perspective
       └─ pageToMarkdown(page)                               src/lib/markdown/document.ts
            ├─ front matter: title, description, url, updated
            └─ sectionToMarkdown(section) for each visible section
                 └─ SECTION_SERIALIZERS[section._type]       src/lib/markdown/sections.ts

GET /about   Accept: text/markdown
  └─ 307 → /about.md                                         redirects() in next.config.ts
```

Posts take the same route: `/posts/<slug>.md` goes through `postToMarkdown`, which writes the
title, excerpt and cover image, then converts the body with `@portabletext/markdown`
(`src/lib/markdown/portableText.ts`).

Everything under `src/lib/markdown/` is plain functions with no React and no Sanity client. The
route handlers in `src/app/` fetch the data and pass it in.

## Extending it

### A new section

When you add a section with the steps in [sections](./sections.md), typecheck fails until the
section has a serializer. `SECTION_SERIALIZERS` is typed over every section in `PAGE_QUERY`, so
it cannot fall out of step.

For the CTA section that page builds (a heading, a paragraph and a link), the serializer looks
like this:

```ts
// src/lib/markdown/sections.ts
import { resolveLinkHref } from '@/lib/links';
import { absoluteUrl } from '@/lib/markdown/links';

ctaSection: (section, context) => {
	const href = section.link ? resolveLinkHref(section.link, undefined) : undefined;
	const url = href ? absoluteUrl(href, context.siteUrl) : undefined;

	return blocks(
		heading(2, section.heading),
		prose(section.paragraph),
		url ? linkTo(section.link?.label || url, url) : '',
	);
},
```

The second argument to `resolveLinkHref` is the URL of a file download. A section whose link can
point at a file needs it. Build it with `getFileAsset` from `@sanity/asset-utils`, because
`getSanityFileUrl` in `src/sanity/lib/utils.ts` imports the Sanity client, which
`src/lib/markdown/` must not.

A few habits keep the output useful to a model:

- Write what the page shows, in the order it shows it.
- Follow the page's outline for heading levels: the hero heading is `#`, other section headings
  are `##`, and items inside a section are `###`.
- Leave out anything that means nothing away from the page, such as a button that opens a modal
  or a decorative image. The `image` helper already skips an image without alt text.
- Make every link absolute, because the markdown is read away from the site.

The helpers in `src/lib/markdown/format.ts` cover headings, paragraphs, lists, links, images and
front matter. If a section needs a table or a code block, add a helper there. The project this
layer was ported from has both and can be copied.

### A new block type in post content

`postBodyToMarkdown` drops any Portable Text type it has no renderer for. When you add a block
type to the post body (a code block, a callout, an embed), add a renderer for it under `types` in
`src/lib/markdown/portableText.ts`, the same way `contentImage` is handled.

### A new document type

A document type with its own URL, such as case studies at `/work/<slug>`, needs its own copy of
what posts have. [The spec](../.agents/rules/llm.md#adding-a-document-type-with-a-public-url) has
the checklist. In short:

1. Project `_updatedAt` and `geo` in its full query, and add an `LLM_<TYPE>S_QUERY` with the
   `noIndex != true` filter.
2. Add `getPublished<Type>` and `getIndexable<Type>s` to `src/sanity/lib/fetchers.ts`.
3. Write `<type>ToMarkdown` in `src/lib/markdown/document.ts`.
4. Dispatch its base path in `src/app/api/markdown/[...path]/route.ts`, and list it in that
   file's `generateStaticParams`.
5. Give it a group in `indexGroups` and include it in `/llms-full.txt`.
6. Add the `alternates.types` link and a `<JsonLd>` to its route.
7. Add the `geo` field to its schema.

### Another group in llms.txt

`indexGroups` in `src/lib/markdown/indexFiles.ts` returns the groups every index file renders. To
point agents at something that lives elsewhere, such as API docs on a subdomain, add a group of
entries with absolute URLs. `/llms.txt` and `/sitemap.md` pick it up without further changes.

### Structured data

The JSON-LD builders are in `src/lib/structuredData.ts`, and `JsonLd` renders them. Every node
links to the site's `Organization` and `WebSite` by `@id`. To describe something new (a product,
an event, a person), add a builder that returns a node and render it with `<JsonLd nodes={...} />`
from the route. Always go through `serializeJsonLd`. It escapes `<`, so CMS copy cannot close the
`<script>` tag.

The organization's logo comes from the **Logo** field in Site Settings. Google asks for a raster
logo of at least 112 pixels, so use a PNG or JPEG there if search features matter to the client.

### Content signals

`CONTENT_SIGNALS` in `src/config/llm.ts` sets the `Content-Signal` line in `robots.txt`. The
starter opts in to all three signals (`search`, `ai-input`, `ai-train`), because a site built for
GEO wants to be read and cited. Whether a client's content may be used to train models is the
client's call, so confirm it at the start of each project.

Keep a single `User-agent: *` group in `robots.txt`. A group for one bot, such as
`User-agent: GPTBot`, replaces the `*` rules for that bot, so it would lose the `Disallow` lines.

## Caching and hosting

A page URL never returns markdown. It returns HTML, or a 307 redirect for clients that ask for
markdown, so each URL has exactly one body. Many CDNs ignore the `Vary` header, and if one URL
served both HTML and markdown, such a CDN could cache either body and serve it to everyone.

The redirect carries no caching headers, and RFC 9111 does not let a shared cache store a 307
without them, so browsers never receive it from a cache. The worst a misconfigured cache can do
is hand an agent the HTML page.

This works the same on Vercel and on a self-hosted `next start`. Do not change the redirect to a
308, which caches by default, and do not give it a `Cache-Control` header.

Every LLM route is static. In the build's route table the `.md` documents show as `●` and the index
files as `○`. A document published after the build gets its markdown on the first request, as its
page does, and the index files refresh when `sitemap.xml` does.

## Verifying a change

Run `bun run check` and `bun run build`, and read the route table. Then start the server with
`bun run start` and request the files:

```bash
B=http://localhost:3000
curl -sI -H 'Accept: text/markdown' $B/about     # 307, location: /about.md
curl -s  $B/about.md                              # front matter, then the sections
curl -s  $B/llms.txt
curl -s  $B/ | grep -o '<script type="application/ld+json">[^<]*'
```

Read the markdown the way a model would. If it would confuse someone who never saw the page,
change the serializer. Tests cover the URL mapping, the listing groups and the JSON-LD escaping;
the serializer output is checked by reading it.

## Known limits

- The `Accept` check reads the order of the media types and ignores q-values, so
  `text/markdown;q=0, text/html` still gets the redirect. Agents send `text/markdown` first, so
  this has not mattered. Parse the header in a proxy if it ever does.
- An agent that asks a `noIndex` page for markdown is redirected to a 404.
- The blog index at `/posts` has no markdown. It is paginated, and the `Posts` group in
  `/llms.txt` lists the same documents.
- The canonical URLs in the markdown come from `NEXT_PUBLIC_SITE_URL` (or Vercel's production
  URL). Without either, they point at `localhost`.

Related: [sections](./sections.md) · [content model](./content-model.md) ·
[performance](./performance.md)

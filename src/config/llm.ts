/**
 * Content Signals (contentsignals.org) for `robots.txt`: what a crawler may do
 * with what it fetches. A site-wide decision that belongs to the client, so
 * confirm it per project — the defaults opt in to all three because a site
 * built for GEO wants to be read, cited and remembered by AI systems:
 *
 * - `search` — build a search index and show links and snippets.
 * - `ai-input` — feed a page into an AI answer (RAG, grounding, agents).
 * - `ai-train` — train or fine-tune a model.
 *
 * Order is the order they are written in.
 */
export const CONTENT_SIGNALS = {
	search: 'yes',
	'ai-input': 'yes',
	'ai-train': 'yes',
} as const satisfies Record<string, 'yes' | 'no'>;

/**
 * The `Link` header value that points a response at the RFC 9727 API catalog
 * (`src/app/.well-known/api-catalog/route.ts`). `next.config.ts` sets it on
 * every response but a document's markdown, whose route handler sets it too.
 * This module imports nothing, so `next.config.ts` can import it.
 */
export const API_CATALOG_LINK = '</.well-known/api-catalog>; rel="api-catalog"';

/**
 * The schema.org page types an editor may pick for a page's JSON-LD
 * (`geo.schemaType`). Each is a `WebPage` subtype, so every value is valid
 * where `WebPage` is. `FAQPage` is left out on purpose: `buildPageJsonLd` adds
 * it by itself to any page with a visible FAQ section, which is the only case
 * where it is valid.
 */
export const PAGE_SCHEMA_TYPES = [
	'WebPage',
	'AboutPage',
	'ContactPage',
	'CollectionPage',
] as const;

/** A schema.org page type, as `geo.schemaType` stores it. */
export type PageSchemaType = (typeof PAGE_SCHEMA_TYPES)[number];

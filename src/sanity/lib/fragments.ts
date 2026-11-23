/**
 * Shared GROQ projections, composed into the queries in `./queries`.
 *
 * **This module must never import anything.** Section fragments used to live
 * beside their schema definitions, which meant `src/sanity/lib/queries` — and
 * so `robots.ts`, `sitemap.ts` and every page — transitively imported
 * `defineSection`, and through it the entire `sanity` Studio runtime. That
 * pulled the whole Studio into the public server and client bundles, and under
 * Next 16's `react-server` condition it failed the build outright (`sanity`
 * reaches `swr`, which has no default export there).
 *
 * Keeping projections here, as plain string-literal constants with no
 * imports, is what keeps the Studio out of the site. It is also what Sanity
 * TypeGen requires: it resolves `${...}` interpolation only when the referent
 * is a constant string, never a function call or runtime concatenation.
 *
 * Section fragments follow the same rule from their own folders: each
 * `src/sections/<name>/fragment.ts` may import from this module and nothing
 * else, and `bun run sections:gen` joins them into `SECTION_FRAGMENTS`.
 */

/**
 * Projects an `internalDestination` object, dereferencing its `reference` to the
 * minimal fields needed to resolve a URL (`_type`, page `route`, document
 * `slug`). Use in place of `page->` wherever a link's destination is queried,
 * e.g. `cta { ..., page ${INTERNAL_DESTINATION_PROJECTION} }`.
 */
export const INTERNAL_DESTINATION_PROJECTION = `{
	...,
	reference->{
		_type,
		"route": route.current,
		"slug": slug.current
	}
}`;

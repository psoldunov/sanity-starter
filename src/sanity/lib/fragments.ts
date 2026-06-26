/**
 * Shared GROQ projections reused across queries and section fragments.
 *
 * Kept as plain string-literal constants so Sanity TypeGen can statically
 * resolve `${...}` interpolation. Do not introduce function calls or runtime
 * concatenation here — TypeGen only follows constant references.
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

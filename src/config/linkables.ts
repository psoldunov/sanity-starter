import type { LinkableDocument, StaticRoute } from '@/types';

/**
 * Unified registry of internal link destinations used by the smart-link picker,
 * redirects and URL resolution.
 *
 * - `LINKABLE_DOCUMENTS`: Sanity document types (besides `page`, which is always
 *   linkable via its `route`) that can be picked as a destination. Each maps a
 *   document type to the URL prefix its slug lives under, plus the fields the
 *   Studio picker shows. Add an entry to make a new document type linkable.
 * - `STATIC_ROUTES`: routes implemented directly in Next (no backing Sanity
 *   document). Add the routes you create under `src/app` here so they show up in
 *   the picker.
 */

/**
 * Document types (besides `page`) that can be linked to. Each must expose a
 * slug resolvable via `slugField`; the public URL is `basePath + '/' + slug`.
 *
 * Note: the Studio destination picker loads matching documents and filters them
 * client-side (capped by `MAX_DESTINATION_OPTIONS` in `DestinationReferenceInput`),
 * rather than paginating server-side. Fine for the modest content sets a starter
 * handles; revisit if a linkable type grows very large.
 */
export const LINKABLE_DOCUMENTS: readonly LinkableDocument[] = [
	{
		type: 'post',
		label: 'Post',
		basePath: '/posts',
		titleField: 'title',
		slugField: 'slug.current',
	},
];

/**
 * Routes implemented in Next (under `src/app`) that have no Sanity document.
 * Add new static pages here so editors can pick them as link destinations.
 */
export const STATIC_ROUTES: readonly StaticRoute[] = [
	// Example:
	// { label: 'Contact', path: '/contact' },
];

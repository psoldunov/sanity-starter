import { LINKABLE_DOCUMENTS } from '@/config/linkables';
import type { InternalDestinationValue, ResolvedDestination } from '@/types';

/**
 * Lookup from a linkable document `_type` to its URL prefix, derived from
 * `LINKABLE_DOCUMENTS`.
 */
const LINKABLE_BASE_PATHS: Record<string, string> = Object.fromEntries(
	LINKABLE_DOCUMENTS.map((document) => [document.type, document.basePath]),
);

/**
 * Whether an `internalDestination` value holds a real destination — a document
 * reference or a static path. Single source of truth for "has a destination",
 * shared by schema `hidden` predicates and redirect validation so they cannot
 * drift apart.
 *
 * @param value - The stored `internalDestination` value, if any.
 * @returns `true` when a reference or static path is set.
 */
export function hasDestination(
	value: InternalDestinationValue | undefined,
): boolean {
	return Boolean(value?.reference?._ref || value?.staticPath);
}

/**
 * Whether a resolved destination is a safe same-origin app path.
 *
 * A bare `startsWith('/')` check is not enough: `//evil.com` and
 * `/\evil.com` both start with a slash and both are resolved by browsers as
 * protocol-relative URLs to another origin. Since `resolveDestinationUrl` feeds
 * Next's `redirect()`, letting either through turns an editable CMS field into
 * an open redirect.
 *
 * Every branch of `resolveDestinationUrl` passes through this — a static path,
 * a page route and a document `basePath + slug` alike. Studio validation is
 * advisory and is not enforced on API writes, so this is the check that holds.
 *
 * @param path - The candidate path from an `internalDestination`.
 * @returns `true` when the path is a same-origin absolute path.
 */
export function isSafeInternalPath(path: string): boolean {
	return (
		path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\')
	);
}

/**
 * Resolves an internal destination (a Sanity document reference or a static
 * Next route) to an absolute app path.
 *
 * - Static routes resolve to their literal `staticPath`.
 * - Page references resolve to `route.current`, with an optional section anchor.
 * - Other linkable document references resolve to `basePath + '/' + slug` using
 *   the prefix configured in `LINKABLE_BASE_PATHS`.
 *
 * Every branch is gated on `isSafeInternalPath`, so an unsafe stored value
 * resolves to `undefined` rather than to an off-origin URL.
 *
 * @param destination - The projected destination object, if any.
 * @param sectionId - Optional section anchor appended to page routes only.
 * @returns The resolved URL, or undefined when it cannot be resolved.
 */
export function resolveDestinationUrl(
	destination: ResolvedDestination | undefined,
	sectionId?: string | null,
): string | undefined {
	if (!destination) return undefined;

	if (destination.staticPath) {
		return isSafeInternalPath(destination.staticPath)
			? destination.staticPath
			: undefined;
	}

	const reference = destination.reference;
	if (!reference) return undefined;

	if (reference._type === 'page') {
		if (!reference.route || !isSafeInternalPath(reference.route)) {
			return undefined;
		}
		return `${reference.route}${sectionId ? `#${sectionId}` : ''}`;
	}

	const basePath = LINKABLE_BASE_PATHS[reference._type];

	// A Sanity slug is one path segment. This slash check is what stops
	// `basePath + slug` climbing out of its base path (`../../elsewhere`) or
	// reaching a second origin (`/evil.com` → `/posts//evil.com`); the
	// `isSafeInternalPath` call below cannot see either, since both still start
	// with the base path. It stays as a backstop against a malformed `basePath`
	// in `LINKABLE_DOCUMENTS`.
	if (!basePath || !reference.slug || reference.slug.includes('/')) {
		return undefined;
	}

	const url = `${basePath}/${reference.slug}`;
	return isSafeInternalPath(url) ? url : undefined;
}

/**
 * Resolves the URL a CMS link points at, in precedence order.
 *
 * A link is exactly one of three things and the Studio hides the other two once
 * one is set, so the order only matters for data written outside the Studio:
 * file download, then external URL, then internal destination.
 *
 * @param link - The queried link, with `page` dereferenced.
 * @param fileUrl - The resolved file asset URL, when the link carries a file.
 * @returns The URL to link to, or `undefined` when nothing resolves.
 */
export function resolveLinkHref(
	link: {
		href?: string | null;
		page?: ResolvedDestination | null;
		sectionId?: string | null;
	},
	fileUrl: string | undefined,
): string | undefined {
	return (
		fileUrl ?? link.href ?? resolveDestinationUrl(link.page, link.sectionId)
	);
}

/**
 * Resolves the `rel` attribute for a link.
 *
 * Covers both destinations `SmartLink` renders, because a helper named for the
 * whole concept that only handled the external half is how a guard gets closed
 * the wrong way by the next person to tidy the file:
 *
 * - A link opening in a new tab gets `noopener noreferrer` by default. Without
 *   it the opened page can reach back through `window.opener`.
 * - Any other link keeps whatever `rel` was set, and gets none if there was
 *   none. It must NOT be forced to `undefined` — an editor who set `nofollow`
 *   on a same-tab link meant it.
 *
 * @param options.target - The resolved `target` attribute.
 * @param options.rel - An explicit `rel` prop, which always wins.
 * @param options.linkRel - The `rel` stored on the CMS link.
 * @returns The `rel` value, or `undefined` when none applies.
 */
export function resolveLinkRel({
	target,
	rel,
	linkRel,
}: {
	target: string | undefined;
	rel: string | undefined;
	linkRel: string | null | undefined;
}): string | undefined {
	if (rel) return rel;
	if (target === '_blank') return linkRel ?? 'noopener noreferrer';
	return linkRel ?? undefined;
}

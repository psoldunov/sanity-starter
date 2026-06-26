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
 * Resolves an internal destination (a Sanity document reference or a static
 * Next route) to an absolute app path.
 *
 * - Static routes resolve to their literal `staticPath` (relative paths only,
 *   to avoid turning a redirect into an open redirect to an external origin).
 * - Page references resolve to `route.current`, with an optional section anchor.
 * - Other linkable document references resolve to `basePath + '/' + slug` using
 *   the prefix configured in `LINKABLE_BASE_PATHS`.
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
		return destination.staticPath.startsWith('/')
			? destination.staticPath
			: undefined;
	}

	const reference = destination.reference;
	if (!reference) return undefined;

	if (reference._type === 'page') {
		return reference.route
			? `${reference.route}${sectionId ? `#${sectionId}` : ''}`
			: undefined;
	}

	const basePath = LINKABLE_BASE_PATHS[reference._type];
	return basePath && reference.slug
		? `${basePath}/${reference.slug}`
		: undefined;
}

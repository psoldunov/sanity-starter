import { DYNAMIC_SECTION_TYPES } from '@/config/sections';

/**
 * Normalizes slug parameters from Next.js dynamic routes.
 *
 * @param slug - The slug parameter (undefined, string, or string array).
 * @returns Normalized slug path starting with '/'.
 */
export function normalizeSlug(slug?: string | string[]): string {
	if (!slug) {
		return '/';
	}

	if (typeof slug === 'string') {
		return slug.startsWith('/') ? slug : `/${slug}`;
	}

	if (slug.length === 0) {
		return '/';
	}

	return `/${slug.join('/')}`;
}

/**
 * Splits a slug string into an array of parts.
 *
 * @param slug - The slug string to split.
 * @returns Array of slug parts, excluding empty segments.
 */
export function splitSlug(slug: string): string[] {
	return slug.split('/').filter((part) => part !== '');
}

/**
 * Whether a page contains any section registered as needing `searchParams`.
 *
 * @param page - The page whose sections are inspected.
 * @returns `true` if any section's `_type` is in `DYNAMIC_SECTION_TYPES`.
 */
export function hasDynamicParams(page: {
	sections?: Array<{ _type: string }> | null;
}): boolean {
	if (!page.sections?.length || DYNAMIC_SECTION_TYPES.length === 0) {
		return false;
	}

	return page.sections.some((section) =>
		DYNAMIC_SECTION_TYPES.includes(section._type),
	);
}

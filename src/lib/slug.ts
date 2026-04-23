import { dynamicSections } from './sections';

/**
 * Normalizes slug parameters from Next.js dynamic routes
 * @param slug - The slug parameter (undefined, string, or string array)
 * @returns Normalized slug path starting with '/'
 */
export function normalizeSlug(slug?: string | string[]) {
	if (!slug) {
		return '/';
	}

	if (typeof slug === 'string') {
		return slug.startsWith('/') ? slug : `/${slug}`;
	}

	return `/${slug.join('/')}`;
}

/**
 * Splits a slug string into an array of parts
 * @param slug - The slug string to split
 * @returns Array of slug parts (excluding empty strings)
 */
export function splitSlug(slug: string): string[] {
	return slug.split('/').filter((part) => part !== '');
}

/**
 * Checks if a page has sections whose `_type` is registered as dynamic.
 *
 * @param page - The page whose sections are inspected
 * @returns `true` if any section's `_type` is in `dynamicSections`
 */
export function hasDynamicParams(page: {
	sections?: Array<{ _type: string }> | null;
}): boolean {
	if (!page.sections?.length) {
		return false;
	}

	return page.sections.some((section) =>
		(dynamicSections as string[]).includes(section._type),
	);
}

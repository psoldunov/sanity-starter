import type { Slug, ValidationContext } from 'sanity';
import { validateRouteString } from '@/lib/routes';
import { client } from '@/sanity/lib/client';

/**
 * Validates a page `route` slug.
 *
 * The rules themselves live in `src/lib/routes.ts` so they are unit-testable
 * without the Studio; this is the Sanity-shaped wrapper around them.
 *
 * @param value - The slug being validated.
 * @returns `true` when valid, otherwise the message to show the editor.
 */
export function validatePageRoute(value: Slug): string | true {
	return validateRouteString(value?.current);
}

/**
 * Validates a redirect `route` slug.
 *
 * Applies the page rules, then rejects a route an existing page already owns —
 * a redirect that shadows a real page would never fire, because the page is
 * matched first.
 *
 * @param value - The slug being validated.
 * @param context - Sanity validation context, used for the current document id.
 * @returns `true` when valid, otherwise the message to show the editor.
 */
export async function validateRedirectRoute(
	value: Slug,
	context: ValidationContext,
): Promise<string | true> {
	const routeValidation = validatePageRoute(value);
	if (routeValidation !== true) {
		return routeValidation;
	}

	if (!value?.current) {
		return true;
	}

	// Projected to `_id`: the previous version fetched the entire page document,
	// section tree included, to answer a yes/no question.
	const existingPageId = await client.fetch<string | null>(
		`*[_type == "page" && route.current == $slug && _id != $currentId][0]._id`,
		{
			slug: value.current,
			currentId: context.document?._id || '',
		},
	);

	if (existingPageId) {
		return 'A page with this route already exists. Redirects cannot use the same route as an existing page.';
	}

	return true;
}

import type { Slug, ValidationContext } from 'sanity';
import { normalizeMatchType } from '@/lib/redirects';
import { validateRouteString } from '@/lib/routes';
import { apiVersion } from '@/sanity/env';

/**
 * Validates a page `route` slug.
 *
 * The rules themselves live in `src/lib/routes.ts` so they are unit-testable
 * without the Studio; this is the Sanity-shaped wrapper around them.
 *
 * @param value - The slug being validated.
 * @returns `true` when valid, otherwise the message to show the editor.
 */
export function validatePageRoute(value: Slug | undefined): string | true {
	return validateRouteString(value?.current);
}

/**
 * Validates a redirect `route` slug.
 *
 * Applies the page rules, then rejects a route an existing page already owns —
 * an *exact* redirect that shadows a real page would never fire, because the
 * page is matched first — and finally rejects a second redirect of the same
 * `matchType` on the same route.
 *
 * The page check runs for an exact redirect only: a prefix covers what sits
 * beneath the route, so a surviving `/work` page and a `/work/*` rule for its
 * retired children are both reachable and both wanted.
 *
 * The duplicate rule replaces the `slug` type's built-in uniqueness check, which is
 * per-document-type and therefore too strict here: an `exact` `/work` and a
 * `prefix` `/work` are two different rules that deliberately share a route, one
 * for the legacy index and one for everything beneath it. The field disables
 * the built-in check with `isUnique` so this one is the only one that runs.
 *
 * Both reads go through the validation client — `context.getClient` with the
 * drafts perspective and no CDN — rather than the shared public client, which
 * serves published documents from cache and so would miss a draft redirect an
 * editor is about to publish, or answer from a stale edge copy.
 *
 * @param value - The slug being validated.
 * @param context - Sanity validation context, used for the current document.
 * @returns `true` when valid, otherwise the message to show the editor.
 */
export async function validateRedirectRoute(
	value: Slug | undefined,
	context: ValidationContext,
): Promise<string | true> {
	const routeValidation = validatePageRoute(value);
	if (routeValidation !== true) {
		return routeValidation;
	}

	if (!value?.current) {
		return true;
	}

	const documentId = context.document?._id || '';
	const publishedId = documentId.replace(/^drafts\./, '');
	const matchType = normalizeMatchType(
		(context.document as { matchType?: string } | undefined)?.matchType,
	);

	const client = context
		.getClient({ apiVersion })
		.withConfig({ perspective: 'drafts', useCdn: false });

	// Projected to `_id`: the previous version fetched the entire page document,
	// section tree included, to answer a yes/no question.
	const [existingPageId, duplicateRedirectId] = await Promise.all([
		matchType === 'exact'
			? client.fetch<string | null>(
					`*[_type == "page" && route.current == $slug && _id != $currentId][0]._id`,
					{ slug: value.current, currentId: documentId },
				)
			: null,
		// Both id forms are excluded: editing a draft must not collide with its
		// own published version. The `matchType` test is `normalizeMatchType`
		// spelled in GROQ, and the spelling matters: every value that is not the
		// literal `prefix` — missing, empty, or anything written straight to the
		// API — is an exact rule at request time, so it has to count as one here.
		// `matchType == "prefix"` evaluates to `false` rather than `null` for a
		// missing field, which is what makes the boolean comparison total; it is
		// also how `REDIRECT_QUERY` reads the field.
		client.fetch<string | null>(
			`*[_type == "redirect" && route.current == $slug && (matchType == "prefix") == $isPrefix && !(_id in $ownIds)][0]._id`,
			{
				slug: value.current,
				isPrefix: matchType === 'prefix',
				ownIds: [publishedId, `drafts.${publishedId}`],
			},
		),
	]);

	if (existingPageId) {
		return 'A page with this route already exists. Redirects cannot use the same route as an existing page.';
	}

	if (duplicateRedirectId) {
		return matchType === 'prefix'
			? 'Another prefix redirect already covers this route.'
			: 'Another exact redirect already uses this route.';
	}

	return true;
}

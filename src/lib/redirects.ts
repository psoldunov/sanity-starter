import { isSafeInternalPath, resolveDestinationUrl } from '@/lib/links';
import type {
	RedirectCandidate,
	RedirectStatusCode,
	ResolvedRedirect,
} from '@/types';

/** The `matchType` value that makes a redirect cover everything beneath it. */
const PREFIX_MATCH = 'prefix';

/** The `matchType` value that matches one route and nothing else. */
const EXACT_MATCH = 'exact';

/**
 * Reads a stored `matchType` as one of the two values the app acts on.
 *
 * `matchType` is required in the schema, but a document written before the
 * field existed — or written straight to the API — carries none or something
 * else entirely. Anything that is not the literal `prefix` is exact. This is
 * the one TypeScript spelling of that rule: `pickRedirect` and `resolveRedirect`
 * read a request through it, and `validateRedirectRoute`
 * (`src/sanity/lib/validations.ts`) reads the document being saved through it,
 * so the Studio and the request agree on what a rule means.
 *
 * @param matchType - The `matchType` stored on the redirect.
 * @returns `'prefix'` or `'exact'`.
 */
export function normalizeMatchType(
	matchType: string | null | undefined,
): typeof EXACT_MATCH | typeof PREFIX_MATCH {
	return matchType === PREFIX_MATCH ? PREFIX_MATCH : EXACT_MATCH;
}

/** Permanent: the destination inherits the old route's ranking. */
const PERMANENT = 308;

/** Temporary: search engines keep indexing the old route. */
const TEMPORARY = 307;

/**
 * Picks the redirect that should handle a path.
 *
 * An exact route always beats a prefix, and among prefixes the longest route
 * wins, so `/work/kast` under both a `/work` prefix and a `/work/kast` exact
 * rule resolves to the specific one. A prefix covers only what is *beneath* it:
 * `/work` never matches the bare `/work`, which takes its own redirect — the
 * legacy index and its children rarely move to the same place.
 *
 * @param candidates - The rules `REDIRECT_QUERY` returned for this path.
 * @param path - The normalized request path, e.g. `/work/kast`.
 * @returns The winning rule, or `undefined` when none applies.
 */
export function pickRedirect<
	T extends { route?: string | null; matchType?: string | null },
>(candidates: readonly T[], path: string): T | undefined {
	const exact = candidates.find(
		(candidate) =>
			normalizeMatchType(candidate.matchType) === EXACT_MATCH &&
			candidate.route === path,
	);

	if (exact) return exact;

	return candidates
		.filter(
			(candidate) =>
				normalizeMatchType(candidate.matchType) === PREFIX_MATCH &&
				candidate.route &&
				path.startsWith(`${candidate.route}/`),
		)
		.reduce<T | undefined>(
			(best, candidate) =>
				(candidate.route?.length ?? 0) > (best?.route?.length ?? 0)
					? candidate
					: best,
			undefined,
		);
}

/**
 * Appends the part of `path` that sits beneath `route` to a destination, so a
 * `/work` → `/projects` prefix rule sends `/work/kast` to `/projects/kast`.
 *
 * SECURITY: the result is re-checked with `isSafeInternalPath` because
 * concatenation can reintroduce a protocol-relative URL that neither input had
 * — a destination of `/` plus a remainder of `/evil.com` spells `//evil.com`,
 * which browsers resolve against another origin. The call site feeds this
 * straight to Next's `redirect()`, so a slip here is an open redirect.
 * Guarded by `tests/routing/redirects.test.ts`.
 *
 * @param destinationUrl - The resolved destination, e.g. `/projects`.
 * @param route - The prefix rule's own route, e.g. `/work`.
 * @param path - The normalized request path, e.g. `/work/kast`.
 * @returns The combined path, or `undefined` when it is not a safe app path.
 */
export function appendPreservedSlug(
	destinationUrl: string,
	route: string,
	path: string,
): string | undefined {
	const remainder = path.slice(route.length);

	if (!remainder.startsWith('/')) return undefined;

	const base = destinationUrl.endsWith('/')
		? destinationUrl.slice(0, -1)
		: destinationUrl;
	const url = `${base}${remainder}`;

	return isSafeInternalPath(url) ? url : undefined;
}

/**
 * Normalizes a redirect's stored status code to one the app can actually send.
 *
 * Only 307 and 308 are offered, because those are the two a Server Component
 * can emit: Next spells them `redirect()` and `permanentRedirect()`. Anything
 * else — an absent value on a document written before the field existed, or a
 * code written straight to the API — falls back to 308, since a migrated route
 * is permanent by default and a silent 307 would strand its ranking on the URL
 * that no longer exists.
 *
 * @param statusCode - The `statusCode` stored on the redirect.
 * @returns 307 or 308.
 */
export function redirectStatusCode(
	statusCode: number | null | undefined,
): RedirectStatusCode {
	return statusCode === TEMPORARY ? TEMPORARY : PERMANENT;
}

/**
 * Resolves the redirect for a path: picks the winning rule, turns its
 * destination into a URL and carries the part of the path the rule preserves.
 *
 * @param candidates - The rules `REDIRECT_QUERY` returned for this path.
 * @param path - The normalized request path, e.g. `/work/kast`.
 * @returns The target URL and the status code to answer with, or `undefined`.
 */
export function resolveRedirect(
	candidates: readonly RedirectCandidate[],
	path: string,
): ResolvedRedirect | undefined {
	const rule = pickRedirect(candidates, path);

	if (!rule) return undefined;

	const destinationUrl = resolveDestinationUrl(rule.destination);

	if (!destinationUrl) return undefined;

	const statusCode = redirectStatusCode(rule.statusCode);

	if (
		normalizeMatchType(rule.matchType) !== PREFIX_MATCH ||
		!rule.preserveSlug ||
		!rule.route
	) {
		return { url: destinationUrl, statusCode };
	}

	const url = appendPreservedSlug(destinationUrl, rule.route, path);

	return url ? { url, statusCode } : undefined;
}

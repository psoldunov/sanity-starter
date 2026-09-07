import { PROTECTED_ROUTE_PATTERNS } from '@/config';
import { isSafeInternalPath } from '@/lib/links';

/**
 * Matches a route against one protected pattern.
 *
 * Two pattern shapes, and the difference matters:
 *
 * - `/posts/*` — a prefix. Reserves `/posts` and everything beneath it.
 * - `/posts` — exact. Reserves that one route and nothing else.
 *
 * Treating both as a plain `startsWith` would let the exact form swallow
 * unrelated routes: `/posts` would block `/posts-about-us`, which is a
 * different page an editor is entitled to create.
 *
 * @param route - The candidate route, e.g. `/about`.
 * @param pattern - A protected pattern, with or without a trailing `/*`.
 * @returns `true` when the route falls under the pattern.
 */
export function matchesRoutePattern(route: string, pattern: string): boolean {
	if (!pattern.endsWith('/*')) {
		return route === pattern;
	}

	const prefix = pattern.slice(0, -2);
	return route === prefix || route.startsWith(`${prefix}/`);
}

/**
 * Whether a route is reserved by the application and unavailable to the CMS.
 *
 * @param route - The candidate route, e.g. `/about`.
 * @returns `true` when the route matches any protected pattern.
 */
export function isProtectedRoute(route: string | undefined): boolean {
	if (!route) return false;

	return PROTECTED_ROUTE_PATTERNS.some((pattern) =>
		matchesRoutePattern(route, pattern),
	);
}

/**
 * Builds the validation message for a route that collides with a reserved path.
 *
 * @param route - The offending route.
 * @returns A message naming the pattern it collides with.
 */
export function getProtectedRouteError(route: string | undefined): string {
	const conflict = PROTECTED_ROUTE_PATTERNS.find((pattern) =>
		matchesRoutePattern(route ?? '', pattern),
	);

	if (conflict) {
		return `Route "${route}" is reserved by the application (${conflict}). Choose a different route.`;
	}

	return 'This route conflicts with a protected path';
}

/**
 * Validates a CMS-authored route string.
 *
 * Pure and framework-free so it can be unit-tested; the Sanity validator in
 * `src/sanity/lib/validations.ts` delegates to it rather than reimplementing
 * the rules.
 *
 * @param route - The candidate route, e.g. `/about`.
 * @returns `true` when valid, otherwise the message to show the editor.
 */
export function validateRouteString(route: string | undefined): string | true {
	if (!route) return true;

	if (!route.startsWith('/')) {
		return 'Slug must start with a /';
	}

	// `//evil.com` and `/\evil.com` both start with a slash and are read by
	// browsers as protocol-relative URLs to another origin. A page route feeds
	// `redirect()`, so saving one of these is an open redirect.
	if (!isSafeInternalPath(route)) {
		return 'Slug cannot start with // or /\\ — that points at another site, not a page on this one';
	}

	if (/\s/.test(route)) {
		return 'Slug cannot contain spaces or tabs';
	}

	if (/[A-Z]/.test(route)) {
		return 'Slug cannot contain uppercase letters';
	}

	if (isProtectedRoute(route)) {
		return getProtectedRouteError(route);
	}

	return true;
}

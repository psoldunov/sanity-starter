import { describe, expect, test } from 'bun:test';
import {
	appendPreservedSlug,
	normalizeMatchType,
	pickRedirect,
	redirectStatusCode,
} from '@/lib/redirects';

const exact = (route: string) => ({ route, matchType: 'exact' });
const prefix = (route: string) => ({ route, matchType: 'prefix' });

describe('pickRedirect', () => {
	test('an exact route wins over every prefix above it', () => {
		const candidates = [prefix('/work'), exact('/work/kast')];

		expect(pickRedirect(candidates, '/work/kast')).toEqual(exact('/work/kast'));
	});

	test('the longest prefix wins when several apply', () => {
		const candidates = [prefix('/work'), prefix('/work/archive')];

		expect(pickRedirect(candidates, '/work/archive/kast')).toEqual(
			prefix('/work/archive'),
		);
	});

	test('a prefix covers what is beneath it but not the route itself', () => {
		// `/work` → `/clients` and `/work/*` → the case studies are different
		// moves, so the prefix must leave the bare route to its own redirect.
		const candidates = [prefix('/work')];

		expect(pickRedirect(candidates, '/work/kast')).toEqual(prefix('/work'));
		expect(pickRedirect(candidates, '/work')).toBeUndefined();
	});

	test('a prefix does not match a route that merely shares its spelling', () => {
		// Same trap `matchesRoutePattern` guards: without the trailing slash,
		// `/work` would swallow `/workshops`, an unrelated route.
		expect(pickRedirect([prefix('/work')], '/workshops')).toBeUndefined();
	});

	test('no candidates and no match both resolve to undefined', () => {
		expect(pickRedirect([], '/work/kast')).toBeUndefined();
		expect(pickRedirect([exact('/news')], '/work/kast')).toBeUndefined();
	});
});

describe('appendPreservedSlug', () => {
	test('carries the path beneath the prefix onto the destination', () => {
		expect(appendPreservedSlug('/projects', '/work', '/work/kast')).toBe(
			'/projects/kast',
		);
		expect(
			appendPreservedSlug('/services', '/service', '/service/branding'),
		).toBe('/services/branding');
	});

	test('a trailing slash on the destination does not double up', () => {
		expect(appendPreservedSlug('/projects/', '/work', '/work/kast')).toBe(
			'/projects/kast',
		);
	});

	test('a root destination keeps the result single-slashed', () => {
		// SECURITY: `/` + `/evil.com` spells `//evil.com`, which a browser reads as
		// a protocol-relative URL to another origin. The result feeds Next's
		// `redirect()` in `src/app/(site)/[[...slug]]/page.tsx`, so collapsing the
		// slash here is what stops an editor's root destination becoming an open
		// redirect. Do not "simplify" this to plain concatenation.
		expect(appendPreservedSlug('/', '/work', '/work/kast')).toBe('/kast');
		expect(appendPreservedSlug('/', '/work', '/work/evil.com')).toBe(
			'/evil.com',
		);
	});

	test('rejects a path that does not sit beneath the route', () => {
		expect(appendPreservedSlug('/projects', '/work', '/workshops')).toBe(
			undefined,
		);
		expect(appendPreservedSlug('/projects', '/work', '/work')).toBe(undefined);
	});
});

describe('redirectStatusCode', () => {
	test('anything that is not an explicit 307 is permanent', () => {
		// SEO: a legacy route answering 307 tells search engines to keep indexing
		// the URL that no longer exists, so its ranking never reaches the
		// destination. The failure is silent — the browser follows either code
		// identically — so the default has to be 308, including for a document
		// written before the field existed (`undefined`).
		expect(redirectStatusCode(undefined)).toBe(308);
		expect(redirectStatusCode(null)).toBe(308);
		expect(redirectStatusCode(308)).toBe(308);
		expect(redirectStatusCode(301)).toBe(308);
	});

	test('an explicit 307 is honoured', () => {
		expect(redirectStatusCode(307)).toBe(307);
	});
});

describe('normalizeMatchType', () => {
	test('an absent or unknown match type reads as exact', () => {
		// ROUTING: `matchType` is required in the schema but a document written
		// before the field existed — or straight to the API — has none, or has
		// something else. `REDIRECT_QUERY` reads anything that is not `prefix` as
		// exact, and `pickRedirect` and `validateRedirectRoute` both come through
		// here, so the Studio's duplicate check agrees with the request instead of
		// letting a second exact rule onto the same route.
		expect(normalizeMatchType(undefined)).toBe('exact');
		expect(normalizeMatchType(null)).toBe('exact');
		expect(normalizeMatchType('')).toBe('exact');
		expect(normalizeMatchType('nonsense')).toBe('exact');
		expect(normalizeMatchType('exact')).toBe('exact');
	});

	test('only the literal prefix value reads as prefix', () => {
		expect(normalizeMatchType('prefix')).toBe('prefix');
	});
});

import { describe, expect, test } from 'bun:test';
import {
	getProtectedRouteError,
	isProtectedRoute,
	matchesRoutePattern,
	validateRouteString,
} from '@/lib/routes';

describe('matchesRoutePattern', () => {
	test('a wildcard pattern matches the prefix itself and anything beneath it', () => {
		expect(matchesRoutePattern('/posts', '/posts/*')).toBe(true);
		expect(matchesRoutePattern('/posts/hello', '/posts/*')).toBe(true);
		expect(matchesRoutePattern('/posts/a/b', '/posts/*')).toBe(true);
	});

	test('a wildcard pattern does not match a route that merely shares a prefix', () => {
		// The bug this guards: a plain startsWith would reserve this too, and an
		// editor is entitled to publish it.
		expect(matchesRoutePattern('/posts-about-us', '/posts/*')).toBe(false);
	});

	test('an exact pattern matches only that route', () => {
		expect(matchesRoutePattern('/posts', '/posts')).toBe(true);
		expect(matchesRoutePattern('/posts/hello', '/posts')).toBe(false);
		expect(matchesRoutePattern('/posts-about-us', '/posts')).toBe(false);
	});
});

describe('isProtectedRoute', () => {
	test('reserves the application paths', () => {
		expect(isProtectedRoute('/api/webhook')).toBe(true);
		expect(isProtectedRoute('/admin')).toBe(true);
		expect(isProtectedRoute('/admin/desk')).toBe(true);
	});

	test('reserves linkable document base paths', () => {
		// Derived from LINKABLE_DOCUMENTS, so a page cannot shadow /posts/hello.
		expect(isProtectedRoute('/posts/hello')).toBe(true);
	});

	test('reserves static routes', () => {
		// Derived from STATIC_ROUTES, so a page cannot shadow the blog index.
		expect(isProtectedRoute('/posts')).toBe(true);
	});

	test('leaves ordinary routes alone', () => {
		expect(isProtectedRoute('/')).toBe(false);
		expect(isProtectedRoute('/about')).toBe(false);
		expect(isProtectedRoute('/posts-about-us')).toBe(false);
		expect(isProtectedRoute(undefined)).toBe(false);
	});
});

describe('getProtectedRouteError', () => {
	test('names the pattern the route collides with', () => {
		expect(getProtectedRouteError('/admin/desk')).toContain('/admin/*');
	});

	test('falls back to a generic message when nothing matches', () => {
		expect(getProtectedRouteError('/about')).toBe(
			'This route conflicts with a protected path',
		);
	});
});

describe('validateRouteString', () => {
	test('accepts an ordinary route', () => {
		expect(validateRouteString('/about')).toBe(true);
		expect(validateRouteString('/company/team')).toBe(true);
	});

	test('accepts an empty value — required-ness is a separate rule', () => {
		expect(validateRouteString(undefined)).toBe(true);
		expect(validateRouteString('')).toBe(true);
	});

	test('requires a leading slash', () => {
		expect(validateRouteString('about')).toContain('must start with a /');
	});

	test('rejects an off-origin route', () => {
		// Open-redirect guard at the point of authoring: a page route feeds
		// `redirect()`, so this must never reach the dataset.
		expect(validateRouteString('//evil.com')).toContain('another site');
		expect(validateRouteString('/\\evil.com')).toContain('another site');
	});

	test('rejects whitespace and uppercase', () => {
		expect(validateRouteString('/about us')).toContain('spaces');
		expect(validateRouteString('/About')).toContain('uppercase');
	});

	test('rejects a route reserved by the application', () => {
		expect(validateRouteString('/admin/desk')).toContain('reserved');
		expect(validateRouteString('/posts')).toContain('reserved');
	});
});
